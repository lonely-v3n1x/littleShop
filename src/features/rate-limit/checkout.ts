import { getCloudflareBindings } from "@/features/cloudflare/bindings";

/**
 * Checkout rate limiting that persists across Worker isolates.
 *
 * On Cloudflare the `CHECKOUT_RATE_LIMITER` binding (Workers Rate Limiting
 * API, `[[ratelimits]]` in wrangler.toml) keeps counts per Cloudflare
 * location, so a burst spread across isolates still hits one limit. Outside
 * Workers (local dev, tests) an in-memory bucket map approximates the same
 * behaviour for a single process.
 *
 * Two keys share the binding:
 *  - `ip:<addr>`    — coarse flood guard. Kept generous because Ghanaian
 *    mobile users often share carrier NAT addresses.
 *  - `phone:<num>`  — the real per-recipient checkout limit.
 */

export const RATE_WINDOW_MS = 60_000;
export const IP_RATE_MAX = 30;
export const PHONE_RATE_MAX = 6;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimited(key: string, max: number): boolean {
  const now = Date.now();
  if (memoryBuckets.size > 1_000) {
    for (const [bucketKey, bucket] of memoryBuckets) {
      if (bucket.resetAt <= now) memoryBuckets.delete(bucketKey);
    }
  }
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

async function limited(
  bindingName: "CHECKOUT_RATE_LIMITER" | "CHECKOUT_PHONE_LIMITER",
  key: string,
  max: number,
): Promise<boolean> {
  const limiter = getCloudflareBindings()?.[bindingName];
  if (limiter) {
    try {
      const { success } = await limiter.limit({ key });
      return !success;
    } catch (error) {
      // A broken binding must not take checkout down; fall back to memory.
      console.error("[rate-limit] binding failed, using memory fallback", error);
    }
  }
  return memoryLimited(key, max);
}

/** Coarse per-IP flood guard, checked before the body is parsed. */
export function isIpRateLimited(ip: string): Promise<boolean> {
  return limited("CHECKOUT_RATE_LIMITER", `ip:${ip}`, IP_RATE_MAX);
}

/** Per-recipient checkout limit, checked once the phone number is validated. */
export function isPhoneRateLimited(phone: string): Promise<boolean> {
  return limited("CHECKOUT_PHONE_LIMITER", `phone:${phone}`, PHONE_RATE_MAX);
}