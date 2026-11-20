import { NextResponse } from "next/server";
import { CHECKOUT_RETURN_PATH } from "@/lib/constants";
import {
  createCheckoutSession,
  fetchCatalogue,
  findBundle,
  JehucalError,
} from "@/features/data/catalogue";
import { isIpRateLimited, isPhoneRateLimited } from "@/features/rate-limit/checkout";
import { recordOrderCreated } from "@/features/orders/store";

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
 *
 * Rate limiting lives in features/rate-limit/checkout.ts (Workers Rate
 * Limiting binding, memory fallback off-Workers). Every created order is
 * logged to D1 with its Paystack reference before the browser redirects, so
 * a drop before the return page still leaves a record.
 */

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
 * Exception: local dev (`wrangler dev`, `next dev`) — wrangler sets
 * x-forwarded-proto=https even for plain-HTTP loopback requests, so for
 * loopback hosts trust the request URL's own protocol instead.
 */
function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");
  if (!host) return url.origin;
  const isLoopback = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto = isLoopback
    ? url.protocol.replace(":", "")
    : request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
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

  if (await isIpRateLimited(clientKey(request))) {
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
  if (!/^0[1-9]\d{8}$/.test(phone)) {
    return NextResponse.json(
      { error: "Enter a 10-digit Ghana number, e.g. 054 123 4567." },
      { status: 400 },
    );
  }

  if (await isPhoneRateLimited(phone)) {
    return NextResponse.json(
      { error: "Too many checkouts for this number. Wait a minute and try again." },
      { status: 429 },
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

    // Log the order + Paystack reference before the browser leaves, so a
    // customer who drops before the return page is still recorded. Fail-soft:
    // a D1 problem must never cost a sale.
    await recordOrderCreated({
      reference: session.reference,
      bundle,
      phone,
      email,
      authorizationUrl: session.authorizationUrl,
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
