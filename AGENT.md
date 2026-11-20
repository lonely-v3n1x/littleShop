# AGENT.md — blink storefront: progress, architecture, and what to do next

blink is a mobile-first data-bundle shop for Ghana (MTN · Telecel · AT), built on
Next.js 15 App Router and deployed to Cloudflare Workers via OpenNext. Purchases
are checked out in blink's UI but sold through the owner's Jehucal storefront,
so Paystack takes the payment and the commission lands in the owner's Jehucal
account. blink never touches cards or MoMo PINs.

**Status (2026-11-20): modernization complete through Phase 7.** Everything below
was merged to `main` in focused PRs, each verified before merge. CI (lint +
typecheck + Vitest) runs on every push/PR.

---

## 1. Progress log — what has been done

| PR | Phase | What landed |
|---|---|---|
| #1 | Cleanup & hygiene | Auth0 uninstalled (deferred); personal details + Jehucal login flow scrubbed from docs; `pricePesewas` naming reconciled across plan.md/types; **fixed a broken build** (redesign had left Tailwind v4 syntax in a v3 project + lost design tokens + `Hero` onClick without `"use client"`); ESLint 9 flat config made `npm run lint` real; junk files removed |
| #2 | Cloudflare resilience | Workers **Rate Limiting bindings** (per-IP flood guard 30/min + per-recipient phone 6/min, memory fallback off-Workers); **Cache API stale-while-revalidate** catalogue cache (fresh 60 s, stale ≤ 1 h, background revalidate, stale-on-upstream-failure); **D1 migrations** `orders` + `order_events`; order + Paystack reference logged at checkout creation; return-page reverify mirrored to D1; **HMAC-SHA512 Paystack webhook** (503 until secret set). Verified on real Workers runtime (`wrangler dev` + local D1) |
| #3 | Figma UI redesign | Full design system (cream/ink/volt/grape/coral), DM Sans self-hosted via next/font, dark "Pick it. Pay. Done." shop band, services rail with future add-ons, gift-card teaser, Apple-style motion (Reveal scroll animations, hero drift/parallax, press feedback, toast pills — all `prefers-reduced-motion` gated). Screenshot-verified at 390px + 1440px; 4 visual bugs found & fixed |
| #4 | Cart & checkout UX | **One-bundle rule** in pure `lib/cart.ts` (auto-replace + toast messaging); live "MTN/Telecel/AT number detected" chip; **recent recipients** in localStorage (device-only, tap-to-fill, cap 5). Browser interaction-tested |
| #5 | PWA | Manifest (standalone, shortcuts), icon set incl. maskable + apple-touch, service worker with branded `/offline` shell, install pill, update toast. **Checkout/API responses are never cached**; offline navigations get the shell. Verified with CDP offline emulation + cache audit |
| #6 | Tests & CI | 32 Vitest tests (phone/money/cart/recipients); `.github/workflows/ci.yml` (npm ci → lint → tsc → test, Node 22). Tests caught & fixed a real validation bug (9-digit typos gaining a second leading zero) |
| #7 | Security hardening | Security headers + production CSP; streaming request-body caps (413 on chunked oversize); vitest 5 + postcss override cleared 2 critical + 1 high audit findings; **SECURITY.md** review. Headers/hydration/413 verified live |

## 2. Purchase flow (current architecture)

1. **Catalogue** — server-side only (CORS-less upstream):
   `GET {JEHUCAL_API_BASE}/storefront/public/littleFlower`, `price` in **pesewas**.
   `features/data/catalogue.ts` caches via Cache API SWR (envelope `{storedAt, catalogue}`).
2. **Checkout** — `POST /api/checkout`: same-origin check (loopback-aware),
   streaming 4 KB body cap, IP + phone rate limits, validation
   (phone `0[1-9]XXXXXXXX`, email, bundle id), re-fetch catalogue, reject
   removed packages (409), then `POST /storefront/checkout`
   `{storeUrl: "littleFlower", agentPackageId, email, phone, callbackUrl}`.
   **Order + reference logged to D1 before responding** (fail-soft no-op without
   the binding). Browser is sent to the returned Paystack `authorizationUrl`.
3. **Payment** — Paystack (Jehucal's gateway). blink never sees payment details.
4. **Return** — `/checkout/return?reference=…` reverifies server-side; shows
   confirmed only on `SUCCESS`; mirrors the verdict into D1.
5. **Webhook (optional)** — `POST /api/webhooks/paystack` verifies HMAC-SHA512,
   marks orders paid/failed idempotently. Disabled (503) until
   `PAYSTACK_WEBHOOK_SECRET` is set. Paystack delivers webhooks to the merchant
   of record (Jehucal), so this needs owner coordination.

**One bundle per payment** — the cart holds at most ONE line; adding a different
bundle auto-replaces it (announced via toast). Quantity is a planning number only.

## 3. Layout (`src/`)

```
app/
  page.tsx                  # Home: Hero, ServiceRail, Storefront (dark band), HowItWorks, GiftTeaser
  layout.tsx                # DM Sans (next/font), SEO + PWA metadata, CartProvider > ToastProvider, RegisterSW
  globals.css               # design tokens (cream/ink/volt/grape), motion utilities, reduced-motion
  manifest.ts               # /manifest.webmanifest (standalone, icons, shortcuts)
  offline/page.tsx          # branded offline shell (static, no catalogue fetch)
  icon.svg                  # volt bolt on ink
  store/page.tsx            # cart drawer entry (fallback only while closed + noscript)
  api/checkout/route.ts     # POST — validation, rate limits, Jehucal order, D1 log
  api/webhooks/paystack/    # POST — HMAC-verified Paystack events
  checkout/page.tsx, checkout/return/page.tsx
  robots.ts, sitemap.ts, not-found.tsx
components/
  layout/: header (cream blur, live cart badge), footer
  store/:  hero, service-rail, storefront, bundle-grid, bundle-card, network-selector,
           how-it-works, gift-teaser, empty-state, cart-button, cart-route-switch,
           cart-sheet, checkout-form (network chip + recent recipients)
  motion/: reveal.tsx (IntersectionObserver), toast.tsx (Figma pill, aria-live)
  pwa/:    register-sw.tsx (prod-only SW + install pill), retry-button.tsx
  ui/:     shadcn primitives (alert, badge, button, input, label, separator, sheet, tabs)
features/
  cloudflare/bindings.ts    # structural binding types + getCloudflareContext try/catch + waitUntil
  rate-limit/checkout.ts    # binding-first limiter, memory fallback
  orders/store.ts           # fail-soft D1 layer (recordOrderCreated/Event/Outcome)
  data/:   catalogue.ts (SWR cache + Jehucal client), networks.ts
lib/:      cart.ts (PURE one-bundle logic), recipients.ts (device-local),
           request-body.ts (streaming byte cap), phone.ts, money.ts (formatGhs —
           the ONLY place GH₵ appears), data-size.ts, constants.ts, services.ts
           (future-service registry), service-icon.tsx, utils.ts
providers/: cart-provider.tsx (delegates to lib/cart; effect-only storage)
types/:    index.ts (single source of truth; pricePesewas everywhere)
migrations/0001_orders.sql  # D1 orders + order_events
public/sw.js                # versioned caches; NEVER caches /api/* or /checkout*
public/icons/               # 192/512 any + maskable, apple-touch-icon
```

## 4. Design system & UX rules (the owner's bar)

- Palette: cream `#f6f4ef`, ink `#181814`, volt `#d7ff46`, grape `#6d3bf5`,
  coral `#ff654b` — mapped onto shadcn tokens (light + dark parity).
- DM Sans self-hosted (next/font); extrabold tight-tracked headlines; pill buttons.
- Motion: Apple-style spring easing `cubic-bezier(0.32,0.72,0,1)`; micro
  (press-scale, badge pop) and big (scroll reveals, hero drift/parallax) —
  **always** gated by `prefers-reduced-motion`. Reveal is progressive
  enhancement (content visible without JS).
- Mobile-first: ≥44px targets, 16px inputs (no iOS zoom), safe-area insets,
  thumb-zone sticky bars, tap-highlight off. Customers are on low-end Android /
  metered 3G — keep JS lean, no render-blocking external assets.
- PWA: installable; offline shell; **never cache checkout or API routes**.
- Future services stay visible as coming-soon cards via `lib/services.ts`.
- Verify UI claims with real screenshots at phone AND desktop widths before
  merging — "it builds" is not "it looks right".

## 5. Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint (flat config)
npx tsc --noEmit     # type check
npm run test         # Vitest (32 tests); npm run test:watch for watch mode
npm run cf:build     # OpenNext bundle (kill dev servers + rm -rf .next .open-next first)
npm run cf:dev       # wrangler dev — REAL Workers runtime, local D1/bindings, no account needed
npm run deploy       # cf:build + wrangler deploy (needs wrangler login)
```

## 6. Cloudflare bindings & owner provisioning

Live in `wrangler.toml`: `[[ratelimits]]` CHECKOUT_RATE_LIMITER (30/60s) +
CHECKOUT_PHONE_LIMITER (6/60s) — no provisioning needed.

**D1 order log — config-ready, enable with 3 commands:**
```bash
npx wrangler d1 create littleshop-db        # 1. create
# 2. paste the printed database_id into wrangler.toml, uncomment [[d1_databases]]
npx wrangler d1 migrations apply littleshop-db --remote   # 3. tables
npm run deploy
```
Until then the order log is a graceful no-op (checkout still works).

**Webhook secret (optional):** `npx wrangler secret put PAYSTACK_WEBHOOK_SECRET`
(from the Paystack dashboard of the merchant account — Jehucal's).

Local testing without an account: `wrangler dev` simulates D1 + rate limits;
`wrangler d1 execute littleshop-db --local --command "SELECT …"` inspects rows
(requires the d1 block present; placeholder UUID is fine locally). Secrets for
wrangler dev go in `.dev.vars` (dotenv, no shell expansion) — NOT the shell env.

## 7. Invariants — do not break

1. Money is integer **pesewas** end-to-end (`pricePesewas`, `pricePesewasSnapshot`);
   render only via `formatGhs`. Never cedis-as-float, never trust client prices.
2. Never invent SKUs/prices — the live catalogue is the only source; empty state
   when it has nothing.
3. One bundle per payment; cart logic lives in `lib/cart.ts` (pure, tested).
4. `Math.random` never in customer-visible paths.
5. Never call Jehucal `GET /storefront/orders/by-phone` (cross-tenant leak).
6. SW never caches `/api/*` or `/checkout*`; sensitive navigations use no-store.
7. No secrets in the repo; `.env*`/`.dev.vars*` gitignored; `NEXT_PUBLIC_*` is public.
8. No credentials/login flows in docs; personal contact details stay out of docs.
9. Binding access only via `features/cloudflare/bindings.ts` with graceful fallbacks.
10. Reduced-motion + mobile-first are non-negotiable (see §4).

## 8. Security

See **SECURITY.md** for the full review: trust boundaries, control matrix,
audit status (0 critical / 0 high; 3 build-time-only moderates accepted),
and owner actions. Key points: production CSP (nonce-based CSP is the next
step), streaming body caps, HMAC webhook, rate limits, HSTS.

## 9. What to do next

**Owner actions (blocking launch):**
1. **Stock the store** — as of 2026-11-20 the live catalogue returns ZERO
   packages, so the site shows its empty state. Enable packages + set prices in
   the Jehucal dashboard (Store → Packages). Recommended grids: PRICE_ADVICE.md
   / pricing-strategy.md. No credentials belong in this repo.
2. Provision D1 (§6) and deploy (`wrangler login` first — not authenticated on
   the dev machine).
3. Optional: webhook secret (§6); clean up old unpaid test orders in the
   dashboard; final domain + HSTS preload submission.

**Engineering follow-ups:**
- Nonce-based CSP (middleware + `x-nonce`) to drop `'unsafe-inline'`.
- Bump CI actions to `checkout@v5` / `setup-node@v5` (Node 20 deprecation warning).
- Next 16 upgrade when settled (clears nested-postcss advisory at the source);
  re-check OpenNext's glob/minimatch advisories on each release.
- Real paid end-to-end test once packages are live; verify commission attribution
  to `littleFlower` in the dashboard.
- Future services: implement under `features/<name>` + add to `lib/services.ts`;
  the rail/teaser already surface them. Gift cards is the owner's stated next want.
- Auth remains deferred (Auth0 removed); any future accounts must not gate buying.

**Verification workflow for any change:** lint → tsc → test → build → cf:build;
runtime smoke via `next start` (fallback paths) and `wrangler dev` (real bindings);
mock the Jehucal API for payment flows (anonymous upstream creates REAL orders —
never test against it casually); screenshot UI at 390px + 1440px.

## 10. Doc map

- `plan.md` — product plan & frozen core (types reconciled with code).
- `pricing-strategy.md` / `PRICE_ADVICE.md` — costs, pricing rule, recommended grids.
- `LESSONS_LEARNED.md` — bring-up mistakes & pitfalls.
- `SECURITY.md` — security posture & review.
- Figma design inspo: the owner's "Data Bundles and Gift Cards Shop" export
  (Vite + Tailwind v4 scaffold — port classes/keyframes, never copy its
  `@import "tailwindcss"` into this v3 project).