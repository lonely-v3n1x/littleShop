import { NextResponse } from "next/server";
import { CHECKOUT_RETURN_PATH } from "@/lib/constants";
import {
  createCheckoutSession,
  fetchCatalogue,
  findBundle,
  JehucalError,
} from "@/features/data/catalogue";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 4_096;

/**
 * The only server endpoint that talks to Jehucal's checkout API. Keeping it on
 * the server means:
 *  - the CORS-less storefront API is reachable at all;
 *  - the browser cannot choose an arbitrary callback URL or store slug;
 *  - the agent package id is re-checked against the live catalogue before an
 *    order is created, so a stale tab cannot buy a removed package.
 *
 * No API key exists to leak: Jehucal's public storefront checkout is anonymous
 * and attributes the sale by store URL + package id.
 */

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 6;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (rateBuckets.size > 500) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip") ??
    forwarded ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Behind Cloudflare/OpenNext the request URL Next sees can be an internal
 * origin, so compare against the host the browser actually addressed.
 */
function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");
  if (!host) return url.origin;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Send JSON." }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin checkout is not allowed." }, { status: 403 });
  }

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Send a JSON object." }, { status: 400 });
  }

  const bundleId = typeof body.bundleId === "string" ? body.bundleId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!bundleId || bundleId.length > 64) {
    return NextResponse.json({ error: "Choose a bundle first." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Enter a valid email address for the receipt." },
      { status: 400 },
    );
  }
  if (!/^0\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: "Enter a 10-digit Ghana number, e.g. 054 123 4567." },
      { status: 400 },
    );
  }

  try {
    const catalogue = await fetchCatalogue();
    const bundle = findBundle(catalogue, bundleId);

    if (!bundle) {
      return NextResponse.json(
        { error: "That bundle is no longer available in the store. Pick another one." },
        { status: 409 },
      );
    }

    const session = await createCheckoutSession({
      packageId: bundle.id,
      email,
      phone,
      callbackUrl: new URL(CHECKOUT_RETURN_PATH, requestOrigin(request)).toString(),
    });

    return NextResponse.json({
      authorizationUrl: session.authorizationUrl,
      reference: session.reference,
    });
  } catch (error) {
    if (error instanceof JehucalError) {
      const status = error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[checkout] unexpected error", error);
    return NextResponse.json(
      { error: "Could not start checkout. Try again in a moment." },
      { status: 500 },
    );
  }
}
