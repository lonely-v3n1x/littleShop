import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Typed access to the Cloudflare bindings blink uses, with a graceful null
 * when running outside Workers (plain `next dev`, `next start`, unit tests).
 *
 * The interfaces below are deliberately structural (minimal shapes of the
 * real bindings) so the app type-checks against the DOM/Node libs without
 * pulling the full Workers global types into the program. The real bindings
 * satisfy these shapes at runtime.
 */

/** Workers Rate Limiting binding (`[[ratelimits]]` in wrangler.toml). */
export interface RateLimitBinding {
  limit(options: { key: string; delta?: number }): Promise<{ success: boolean }>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

/** Cloudflare D1 binding (`[[d1_databases]]` in wrangler.toml). */
export interface D1Binding {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface BlinkBindings {
  CHECKOUT_RATE_LIMITER?: RateLimitBinding;
  CHECKOUT_PHONE_LIMITER?: RateLimitBinding;
  DB?: D1Binding;
  PAYSTACK_WEBHOOK_SECRET?: string;
}

/** Returns the Worker bindings, or null outside a Cloudflare request context. */
export function getCloudflareBindings(): BlinkBindings | null {
  try {
    const { env } = getCloudflareContext();
    return env as unknown as BlinkBindings;
  } catch {
    return null;
  }
}

/**
 * Extend the request lifetime for background work (stale-while-revalidate
 * refreshes). Outside Workers the promise is simply left running; callers
 * must pass a promise that never rejects unhandled.
 */
export function waitUntil(promise: Promise<unknown>): void {
  try {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(promise);
  } catch {
    void promise;
  }
}