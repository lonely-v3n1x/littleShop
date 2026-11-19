# blink

A mobile data reselling storefront for the Ghana market — first service in a platform designed to
grow into a full digital-services shop.

> See [`plan.md`](./plan.md) for the full product plan, roadmap, and open questions.
> See [`pricing-strategy.md`](./pricing-strategy.md) for the pricing findings and the Jehucal API notes.

## How a purchase works

blink does not own a payment gateway. It also doesn't send customers away to another site:
checkout happens in blink's own UI, while the sale is created on the owner's Jehucal storefront.

1. **Catalogue** — the home page reads the live Jehucal catalogue server-side
   (`GET /storefront/public/littleFlower`, 60 s cache). Bundle ids, sizes and prices come from Jehucal;
   nothing is invented. Prices are integer **pesewas** end-to-end and rendered only through
   `src/lib/money.ts`.
2. **Checkout** — the customer enters the recipient number and an email, then `POST /api/checkout`
   re-checks the package against the live catalogue and calls Jehucal's anonymous
   `POST /storefront/checkout` with `storeUrl: littleFlower`, the package id, email, phone and a return
   URL. Jehucal creates the order **under the owner's store**, so the commission stays there, and
   returns a Paystack `authorization_url`.
3. **Payment** — the browser is sent to Paystack's hosted page (Jehucal's gateway). blink never
   sees a card number, a MoMo PIN or a webhook.
4. **Return** — Paystack returns the customer to `/checkout/return?reference=…`; that page asks Jehucal
   to `POST /storefront/orders/reverify` and shows **Payment confirmed** only when the status is
   `SUCCESS`.

**Known constraint:** Jehucal's checkout accepts one `agentPackageId` per payment, so the cart is a
saved list and each bundle is paid for separately. Only `available: true` packages are listed; if the
store has no priced packages the site shows an empty state and links to the storefront.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Cloudflare Workers via OpenNext + Wrangler

## Getting started

```bash
npm install
cp .env.example .env.local   # optional overrides; no keys are needed for v1
npm run dev
```

Open http://localhost:3000. The catalogue requires outbound HTTPS to
`https://backend.jehucale-business.com`; no API key or account is needed for the public storefront
catalogue or checkout.

### Environment

| Variable | Required | Purpose |
|---|---|---|
| `JEHUCAL_API_BASE` | no | Override the Jehucal API base (default `https://backend.jehucale-business.com`). |

There is **no payment secret** to configure: Jehucal's public storefront checkout is anonymous and
attributes the sale by store URL + package id.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build (must pass before deploy)
- `npm run cf:build` — build the Cloudflare/OpenNext bundle
- `npm run deploy` — build for Cloudflare and deploy with Wrangler (requires a Cloudflare account)

## Project layout

- `src/app` — routes, the checkout API route, and global styles
- `src/app/api/checkout/route.ts` — the only endpoint that talks to Jehucal checkout
- `src/app/checkout/return/page.tsx` — Paystack return + `reverify` status
- `src/components/ui` — shadcn/ui primitives
- `src/components/store` — storefront UI pieces
- `src/features/data` — catalogue integration (`catalogue.ts`), networks, re-exported types
- `src/types` — domain types (single source of truth)
- `src/providers` — client-side state (cart with price snapshots at add-time)

## Notes

- The cart is session-only (`localStorage`, read in an effect). No customer data is persisted by
  blink; the order lives in Jehucal.
- Do **not** call Jehucal's `GET /storefront/orders/by-phone`: it is unauthenticated and leaks orders
  across stores (`pricing-strategy.md` §7.3).
- `npm run build` and `npx @opennextjs/cloudflare build` are the gate before deploying.
