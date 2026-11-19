import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getCloudflareBindings } from "@/features/cloudflare/bindings";
import { recordOrderEvent, recordOrderOutcome } from "@/features/orders/store";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 65_536;

/**
 * Paystack webhook receiver.
 *
 * Paystack signs every webhook with HMAC-SHA512 of the raw body using the
 * account's webhook secret; we verify that signature before touching the
 * order log, so a forged "charge.success" can never mark an order paid.
 *
 * NOTE: Paystack delivers webhooks to the merchant of record — Jehucal's
 * account, not blink. This endpoint is ready for the day the owner points a
 * Paystack webhook at `<origin>/api/webhooks/paystack` and sets
 * PAYSTACK_WEBHOOK_SECRET (wrangler secret put). Until then it answers 503,
 * and payment confirmation still happens via reverify on the return page
 * (which also writes to the same D1 order log).
 */
export async function POST(request: Request) {
  const secret =
    getCloudflareBindings()?.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secret).update(raw, "utf8").digest("hex");
  const provided = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (provided.length !== computed.length || !timingSafeEqual(provided, computed)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const event = (body as { event?: unknown }).event;
  const data = (body as { data?: unknown }).data;
  const eventName = typeof event === "string" ? event : "";
  const reference =
    typeof data === "object" && data !== null && typeof (data as { reference?: unknown }).reference === "string"
      ? (data as { reference: string }).reference.trim()
      : "";

  if (!eventName || !reference || reference.length > 200) {
    return NextResponse.json({ error: "Missing event or reference." }, { status: 400 });
  }

  const detail: Record<string, unknown> = {};
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    for (const field of ["status", "amount", "currency", "gateway_response", "paid_at"] as const) {
      if (field in record) detail[field] = record[field];
    }
  }

  if (eventName === "charge.success") {
    await recordOrderOutcome(reference, "paid", "webhook.charge.success", detail);
  } else if (eventName === "charge.failed") {
    await recordOrderOutcome(reference, "failed", "webhook.charge.failed", detail);
  } else {
    await recordOrderEvent(reference, `webhook.${eventName}`, detail);
  }

  return NextResponse.json({ received: true });
}