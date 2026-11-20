# blink — security posture & review

Last reviewed: 2026-11-20 (Phase 7 hardening pass). This file is the living
security record for future agents and the owner.

## Trust boundaries

- **blink** is a storefront UI + thin server layer. It never touches cards,
  MoMo PINs or payment credentials.
- **Jehucal** is the merchant of record: orders are created on the owner's
  store via the anonymous `POST /storefront/checkout`, and commission lands
  there. **Paystack** (Jehucal's gateway) takes the payment.
- **Cloudflare Workers** hosts the app (OpenNext). Bindings: rate limiting
  (live), D1 order log (config-ready), Cache API catalogue cache.
- The browser only ever talks to blink's own origin; the CORS-less Jehucal
  API is called server-side only.

## Controls in place

| Area | Control |
|---|---|
| Pricing authority | Prices/bundles come only from the live catalogue; checkout re-validates the package server-side before creating an order. Client prices are never trusted. |
| CSRF / cross-origin | `POST /api/checkout` compares `Origin` against the forwarded host/proto (loopback-aware for local dev). Browsers send Origin on cross-origin POSTs. |
| Rate limiting | Workers Rate Limiting bindings: per-IP flood guard (30/min, generous for carrier NAT) + per-recipient phone limit (6/min). Memory fallback off-Workers; fail-open on binding error so checkout survives. |
| Input validation | Phone `0[1-9]XXXXXXXX` (client + server), email pattern + length cap, bundle id length cap, JSON-object shape checks. |
| Body size | Streaming hard cap (4 KB checkout, 64 KB webhook) independent of the spoofable Content-Length header; oversized bodies are cancelled, never fully buffered. |
| Webhook | HMAC-SHA512 over the raw body, timing-safe compare, 503 until `PAYSTACK_WEBHOOK_SECRET` is set, idempotent status updates. |
| Order durability | Orders + Paystack references logged to D1 at creation (before redirect); reverify/webhook outcomes appended to `order_events`. Fail-soft: a D1 outage never costs a sale. |
| Headers | `nosniff`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`, HSTS (2y, includeSubDomains, preload), production CSP (`default-src 'self'`, no external scripts/fonts/images, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`). |
| Secrets | No keys in the repo or history (verified by grep + `git log -S`). `.gitignore` covers `.env*`, `.dev.vars*`, `secrets/`. Workers secrets via `wrangler secret put`. `NEXT_PUBLIC_*` never carries secrets. |
| Client storage | Cart + recent recipients are device-local localStorage only, never uploaded. No accounts, no tracking. |
| Dependencies | `npm audit` run each hardening pass; lockfile committed; CI runs lint/typecheck/tests on every push/PR. |
| XSS | React escaping everywhere; no `dangerouslySetInnerHTML`, no `eval`, no `Math.random` in customer-visible paths. |

## Dependency audit status (2026-11-20)

- **Fixed:** vitest 3 → 5 removed the two *critical* tinypool RCE-gadget
  advisories (dev-only, but fixed anyway). An npm `overrides` entry pins
  `postcss` to 8.5.33 everywhere, clearing the *high* postcss advisories
  inside Next without a breaking Next major.
- **Accepted (build-time only, no runtime exposure):** `glob` / `minimatch`
  moderates inside `@opennextjs/cloudflare` (DoS/path-traversal in glob
  handling). The only npm "fix" downgrades OpenNext to 0.3.0, which is
  unusable. These run at build time on trusted inputs. Re-check when
  OpenNext ships a patched release.
- **Follow-up:** Next 16 upgrade when the ecosystem settles (also clears the
  nested-postcss advisory at the source).

## Known limitations / owner actions

1. **CSP uses `'unsafe-inline'` for scripts/styles** — required by Next App
   Router hydration without a nonce pipeline. A nonce-based CSP (middleware
   + `x-nonce`) is the next hardening step.
2. **Paystack webhooks go to the merchant of record (Jehucal).** blink's
   verified endpoint stays disabled (503) until the owner obtains the
   webhook secret from the Paystack dashboard and sets
   `PAYSTACK_WEBHOOK_SECRET` (`wrangler secret put`). Until then, payment
   confirmation happens via reverify on the return page, which also writes
   to the D1 log.
3. **D1 order log is config-ready, not provisioned.** Run the three commands
   in `wrangler.toml` / README to enable it.
4. **HSTS preload** is asserted in the header; submit the domain at
   hstspreload.org once the production domain is final.
5. **No auth yet** (Auth0 removed, deferred). Purchases are anonymous by
   design; any future account feature must not gate buying data.
6. **Never call Jehucal `GET /storefront/orders/by-phone`** — unauthenticated
   cross-tenant leak (pricing-strategy.md §7.3). Reported to the owner; do
   not build on it.
7. Test checkouts create **real unpaid orders** on the Jehucal store. Clean
   them up in the dashboard before launch.

## Reporting a vulnerability

Open a private security advisory on the GitHub repo, or message the owner
via the store's WhatsApp support channel. Do not file public issues for
exploitable details.