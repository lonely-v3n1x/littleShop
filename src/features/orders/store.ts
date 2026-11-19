import { getCloudflareBindings, type D1Binding } from "@/features/cloudflare/bindings";
import type { DataBundle } from "@/types";

/**
 * D1-backed order log. Every function is fail-soft: when the DB binding is
 * absent (local dev, or before `wrangler d1 create` has been run) the calls
 * are no-ops, and a D1 outage must never break checkout or the return page.
 * The Jehucal storefront remains the source of truth for payment; this log
 * exists so drops before the return page are still recorded.
 */

export type OrderStatus = "pending" | "paid" | "failed";

export interface NewOrder {
  reference: string;
  bundle: DataBundle;
  phone: string;
  email: string;
  authorizationUrl: string;
}

function db(): D1Binding | null {
  return getCloudflareBindings()?.DB ?? null;
}

const NOW_SQL = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

/** Record the order + Paystack reference the moment checkout is created. */
export async function recordOrderCreated(order: NewOrder): Promise<void> {
  const database = db();
  if (!database || !order.reference) return;
  try {
    await database.batch([
      database
        .prepare(
          `INSERT INTO orders
             (reference, bundle_id, bundle_name, network_id, price_pesewas,
              phone, email, status, paystack_authorization_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
           ON CONFLICT(reference) DO UPDATE SET updated_at = ${NOW_SQL}`,
        )
        .bind(
          order.reference,
          order.bundle.id,
          order.bundle.name,
          order.bundle.networkId,
          order.bundle.pricePesewas,
          order.phone,
          order.email,
          order.authorizationUrl,
        ),
      database
        .prepare("INSERT INTO order_events (reference, event, detail) VALUES (?, ?, ?)")
        .bind(
          order.reference,
          "checkout.created",
          JSON.stringify({
            bundleId: order.bundle.id,
            pricePesewas: order.bundle.pricePesewas,
          }),
        ),
    ]);
  } catch (error) {
    console.error("[orders] failed to record checkout creation", error);
  }
}

/** Append an event without touching order status (e.g. reverify attempts). */
export async function recordOrderEvent(
  reference: string,
  event: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const database = db();
  if (!database || !reference) return;
  try {
    await database
      .prepare("INSERT INTO order_events (reference, event, detail) VALUES (?, ?, ?)")
      .bind(reference, event, detail ? JSON.stringify(detail) : null)
      .run();
  } catch (error) {
    console.error("[orders] failed to record event", error);
  }
}

/**
 * Set the order status and append the event that justified it. Idempotent:
 * webhook replays and repeated reverifies converge on the same row.
 */
export async function recordOrderOutcome(
  reference: string,
  status: OrderStatus,
  event: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const database = db();
  if (!database || !reference) return;
  try {
    await database.batch([
      database
        .prepare(`UPDATE orders SET status = ?, updated_at = ${NOW_SQL} WHERE reference = ?`)
        .bind(status, reference),
      database
        .prepare("INSERT INTO order_events (reference, event, detail) VALUES (?, ?, ?)")
        .bind(reference, event, detail ? JSON.stringify(detail) : null),
    ]);
  } catch (error) {
    console.error("[orders] failed to record outcome", error);
  }
}