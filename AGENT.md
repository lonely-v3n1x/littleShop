# AGENT.md — littleShop storefront, project state for future agents

The littleShop storefront: MTN/Telecel/AT data-bundle shop. Live, verified.

## Purchase flow (current architecture — "checked out in littleShop, sold by Jehucal")

1. **Catalogue** — server-side, live, no build-time snapshot:
   `GET https://backend.jehucale-business.com/storefront/public/littleFlower`
   (CORS-less; `features/data/catalogue.ts`, 60 s TTL, `price` in **pesewas**).
2. **Checkout** — `POST /api/checkout` (server route, `src/app/api/checkout/route.ts`):
   validates (same-origin, JSON body, phone must be 10 national digits `0XXXXXXXXX`,
   email), re-fetches the live catalogue, rejects removed/unavailable packages,
   then calls `POST {JEHUCAL_API_BASE}/storefront/checkout` with
   `{storeUrl: "littleFlower", agentPackageId, email, phone, callbackUrl}`.
   Jehucal returns `{authorizationUrl, reference}`; browser is sent to it (Paystack).
3. **Payment** — Paystack is Jehucal's gateway; littleShop never collects money or
   sees a card. After paying, customer returns to `/checkout/return?reference=...`.
4. **Status** — `/checkout/return` calls `POST /storefront/orders/reverify`
   (`{reference}`) server-side; shows "Payment confirmed" only when
   `status === "SUCCESS"`, otherwise "Payment not confirmed yet" with retry.
   Commission accrues to the owner's store (`storeUrl: littleFlower`).

**One bundle per payment** — the Jehucal checkout API accepts a single
`agentPackageId`; the cart holds a saved list, each line gets its own Buy action,
and checkout starts one bundle.

## Layout (`src/`)

```
app/
  page.tsx                 # Home (dynamic, live catalogue) — Hero, ServiceRail, Storefront, HowItWorks
  layout.tsx               # SEO metadata (canonical, OG, Twitter), CartProvider + Header + Footer
  globals.css              # design tokens (green/amber/teal), dark parity
  icon.svg, not-found.tsx
  store/page.tsx           # cart drawer entry (CartRouteSwitch + fallback)
  api/checkout/route.ts    # POST — creates the Jehucal order, returns the Paystack URL
  checkout/page.tsx        # Checkout form (phone + email, redirects to Paystack)
  checkout/return/page.tsx # Paystack return + reverify status page
  robots.ts, sitemap.ts    # /robots.txt, /sitemap.xml
components/
  layout/: header.tsx, footer.tsx
  store/:  hero, bundle-card, bundle-grid, network-selector, empty-state, service-rail,
           storefront, how-it-works, cart-button, cart-route-switch, cart-sheet,
           checkout-form (the "Payment" section on top, sticky pay bars)
  ui/:     alert, badge, button, input, label, separator, sheet, tabs (shadcn primitives)
features/
  data/:   catalogue.ts (live Jehucal integration: fetchCatalogue, createCheckoutSession,
           reverifyOrder, findBundle), networks.ts (static network set)
lib/:      constants.ts (JEHUCAL_STORE_SLUG="littleFlower", RECIPIENT_*, DELIVERY_PROMISE,
           SUPPORT_WHATSAPP_URL), data-size.ts (formatDataMb, expiryLabel), money.ts
           (formatGhs — the ONLY place `GH₵` appears), phone.ts (Ghana normaliser),
           services.ts (registry), service-icon.tsx, utils.ts (cn)
providers/: cart-provider.tsx (client cart, price snapshots in `CartLine`)
types/:    index.ts (Network, DataBundle, CartLine, Service…)
```

## Commands

```bash
npm run dev          # dev server
npm run build        # production build (tsc + build)
npx tsc --noEmit     # type check
npm run test         # phone normaliser unit tests (scripts/test-phone.mjs)
npx @opennextjs/cloudflare build   # Cloudflare/OpenNext bundle for wrangler deploy
npm run deploy       # cf:build + wrangler deploy
```

## Current state (2026-11-19)

- Live MTN prices (set via the Jehucal dashboard API, §PRICE_ADVICE):
  1GB GH₵4.50, 2GB GH₵9.00, 3GB GH₵13.50, 4GB GH₵18.00, 5GB GH₵22.50,
  6GB GH₵27.00, 10GB GH₵41.00. Only MTN is enabled today.
- `PRICE_ADVICE.md` — tier-1 hero offers (Telecel 5GB GH₵21.00, AT 1GB GH₵4.50, …),
  tier-2 fillers, tier-3 skip-list; computed against agent costs + street lows
  (`pricing-strategy.md` §2–§5).
- `pricing-strategy.md` — cost tables (§2), pricing rule + invariants (§3),
  recommended grids (§4), strategy (§6), technical findings (§7).
- `LESSONS_LEARNED.md` — mistakes during bring-up, what was deleted as useless,
  open items (enable AT/Telecel SKUs, live-e2e test, Auth0), commands reference.
- `plan.md` — product plan; §1.6 documents the current checkout architecture.
- Builds green: `npm run build`, `next start` (3215 era), `npx @opennextjs/cloudflare build`.

## Updating prices (how to do it yourself or a future agent)

1. Login: `POST https://backend.jehucale-business.com/auth/login`
   `{phoneNumber: "0531810252", password: <dashboard password>}` → `jehucal.sid` cookie
   (curl: `curl -c jar -X POST …`; the storefront's own login accepts 10-digit
   national format, e.g. `0531810252`).
2. `GET https://backend.jehucale-business.com/storefront/my-packages` → packages with
   `id, size, network, type, price (pesewas), agentPrice, available`.
3. `PUT https://backend.jehucale-business.com/storefront/prices` with
   `{size, network, type, price (new pesewas), available}` —
   the JSDoc on the form: price must be ≥ `cost + minAbs` (e.g. MTN 1GB floor 4.50).
   Live changes are visible in `/storefront/public/littleFlower` within ~a minute.

## Notes

- `providers/apinex.json` (the secret-safe provider config referenced by `plan.md`)
  is currently **absent** — no code imports it, so nothing breaks.
- Phone sent to Jehucal is the 10-digit national format (`053…`).
- Cart snapshots money at add-time (`pricePesewasSnapshot`); never trust live prices in the cart.
- `Math.random` must not be used for anything customer-visible (rejected by greps).
- Avoid running a dev server while building (see LESSONS_LEARNED #1).
