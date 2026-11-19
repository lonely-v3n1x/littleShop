# blink — Plan & Execution Contract

> **Status:** v2 — multi-model reviewed and reconciled.
> **Review method (real, multi-model):** six lenses each run by a distinct AI model on actual
> subagent workers, each reading this repo (not from memory). Findings were reconciled; conflicts
> resolved per the decisions log (§2). Raw per-lens output is summarized in Appendix A.
>
> **Why this shape:** the owner will implement blink using a *variety* of AI coding models, some
> weak/low-performing. So this document is an **execution contract**, not a narrative. It splits into:
> a **Frozen Core** (§0) that never changes and is pinned as context for *every* implementation prompt,
> and **task cards** (§3) that are small, exact, and independently verifiable. Weak models get a small
> task + the core; they do not get the whole plan to "interpret."

## How to use this document (the "better way to dictate")

To build **one** phase, feed the model exactly three things and nothing more:
1. **The full §0 FROZEN CORE** — invariants it must not violate.
2. **The single task card** for that phase (§3.x).
3. **A model-tier assignment** per §5 (route weak models to small/mechanical cards only).

Rules for the operator:
- Never hand a weak model two phases at once. One card = one model = one green build.
- **Never let the model that wrote code verify it.** Use a different model (or you) to check the
  acceptance greps in the card before marking it done.
- If a model's work conflicts with §0, the conflict loses. Re-run the card, don't patch around it.
- Escalate (switch to a stronger model tier) the moment a card's acceptance greps fail twice.

---

# PART 0 — FROZEN CORE  ⛔ DO NOT CHANGE · escalate if a task conflicts

This block is the invariant contract. Pin it verbatim as the top of every implementation prompt.

## 0.1 Stack & versions (exact — do not "upgrade" or "modernize")
- Next.js **15** App Router, **TypeScript** (strict). Server Components by default; `"use client"`
  only on the components that need it (cart, tabs, sheet/dialog, forms).
- **shadcn/ui** (new-york, RSC, cssVariables) + **Tailwind v3** + Radix primitives.
- **Cloudflare Workers** via `@opennextjs/cloudflare` + **Wrangler**. `nodejs_compat` is on.
- **lucide-react** for icons (import *per icon*, e.g. `import { Wifi } from "lucide-react"` — never
  the default barrel, it leaks 700+ icons).
- **React Context** for cart. Do **not** add Zustand/Redux in v1.
- **No new dependencies** in v1. (See 0.7.)

## 0.2 Domain types (verbatim — the single source of truth lives in `src/types/index.ts`)
Reconciled with the code (2026-11-19): naming is standardised on `pricePesewas` /
`pricePesewasSnapshot` everywhere. The code is authoritative; if this block drifts again,
regenerate it from `src/types/index.ts`.

```ts
export type NetworkId = "mtn" | "telecel" | "at";
export type ExpiryType = "non-expiry" | "daily" | "weekly" | "monthly" | "night" | "60-day" | "90-day";

export interface Network {
  id: NetworkId;
  name: string;          // "MTN" | "Telecel" | "AT"
  brandColor: string;    // hex — used ONLY as a dot / 2px border chip, never as bg or text
  textOnColor: string;   // ink color on the brand strip behind the card's big number, or white
  logoText: string;      // text placeholder until logos exist
  active: boolean;
}

// Authoritative volume in MB. Display as GB when >= 1000.
// Money is INTEGER pesewas: 1000 === GH₵10.00. Never store cedis-as-float.
export interface DataBundle {
  id: string;            // the Jehucal agent-package UUID sent to POST /storefront/checkout
  networkId: NetworkId;
  name: string;
  dataMb: number;
  pricePesewas: number;  // integer pesewas, straight from the storefront; never a guess
  expiryType?: ExpiryType; // optional: only set when the source states it (the live API does not)
  packageType?: string;  // raw Jehucal package `type` (e.g. ISHARE) — support/debugging, not copy
  popular?: boolean;
  description?: string;
  checkedAt?: string;    // ISO date the tariff was last verified (data is indicative!)
}

// v1 line keeps bundleId (data service only) but SNAPSHOTS name+price at add-time so a tariff
// change mid-session can't silently change a customer's total.
export interface CartLine {
  bundleId: string;
  quantity: number;
  nameSnapshot: string;
  pricePesewasSnapshot: number;
  dataMbSnapshot: number;
}

export type ServiceStatus = "active" | "coming-soon" | "planned";
export interface Service {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  icon?: string;            // lucide icon NAME, resolved via lib/service-icon.tsx only
  href?: string;
}

// ---- v2 (NOT implemented in v1) — recorded here so the direction is explicit ----
// export type ServiceId = "data" | "airtime" | "bills" | "gift-cards" | "subscriptions";
// export interface ProductRef { serviceId: ServiceId; productId: string; }
// Full multi-service cart = a Phase in v2; v1 must not attempt it.
```

## 0.3 Frozen file map (the ONLY places new files go)
```
src/
├─ app/
│  ├─ layout.tsx            # wrap: <CartProvider> + <Header/> ... <Footer/>
│  ├─ page.tsx              # storefront (replace the stub)
│  └─ checkout/page.tsx     # in-store checkout, Jehucal order + Paystack (Phase D)
├─ components/
│  ├─ ui/                   # shadcn primitives ONLY (add via `npx shadcn add <name>`)
│  ├─ layout/               # header.tsx, footer.tsx
│  └─ store/                # hero, service-rail, network-selector, bundle-card, bundle-grid,
│                           #   cart-sheet, cart-button   (ALL storefront components live HERE)
├─ features/data/
│  ├─ networks.ts           # the three networks (static product decision)
│  └─ catalogue.ts          # live Jehucal catalogue + checkout + reverify (server-only)
├─ lib/
│  ├─ utils.ts              # cn()
│  ├─ money.ts              # formatGhs(pesewas)  — the ONLY money formatter
│  ├─ service-icon.tsx      # icon-name -> <Lucide/> map; registry: services.ts (Phase A)
│  └─ services.ts           # service registry (active: data; rest coming-soon)
├─ providers/
│  └─ cart-provider.tsx     # cart context (exists; edit in Phases C only)
└─ types/index.ts           # §0.2 verbatim
```
Rules:
- `features/<name>/components/` is **YAGNI until a 2nd service exists** — v1 storefront components live
  in `components/store/`. Do **not** create `features/data/components/`.
- Only create/modify files in the **current card's** allowed list (§3). Everything else is read-only.

## 0.4 Import conventions (hard)
- Domain types: import **only** from `@/types`. Never from `@/features/*` (that's re-export-only).
- Data: import bundles and networks from `features/data/networks.ts` and `features/data/catalogue.ts`
  (the catalogue is the live Jehucal store — `fetchCatalogue`). There is no local bundle table.
  Do **not** re-implement filtering in a component (use the `selected` filter pattern in `bundle-grid`).
- Tighten `getBundlesByNetwork(networkId: NetworkId)` — parameter type is the union, not `string`.
- Icons: `import { X } from "lucide-react"` per icon. Service icons resolve **only** through
  `lib/service-icon.tsx`.

## 0.5 Existing shadcn primitives (already vendored)
`button, card, badge, dialog, input, separator, tabs`. Needed for v1, add via `npx shadcn add`:
`sheet, label, select, skeleton, scroll-area, checkbox, alert`, and `sonner` (toast).

## 0.6 Money & constants (single source)
- `lib/money.ts`:
  ```ts
  export function formatGhs(pesewas: number): string {
    return `GH₵${(pesewas / 100).toFixed(2)}`;
  }
  ```
- `lib/constants.ts`: `export const MAX_QTY_PER_LINE = 10;`
- **All** money is pesewas (int) end-to-end; the **only** place the `GH₵` symbol appears is inside
  `formatGhs`. Acceptance: `grep -rn "GH₵" src --include=*.tsx | grep -v money.ts` returns nothing.

## 0.7 HARD RULES — the "never" list (a weak model failing any of these = re-run the card)
1. **Never** add, remove, or re-price a bundle in local code — packages and prices are set in the live
   Jehucal dashboard (Store → Packages). The code only renders what the storefront returns.
2. **Never** use `Math.random` (or any non-determinism) for checkout outcomes, timers, or coupons.
3. **Never** wire real auth: no `@auth0/*` imports anywhere; no `useAuth`/
   `useUser`/`getSession` in components. "Sign in" is a **static, non-functional** label in v1.
4. **Never** read `localStorage`/`window` in a `useState` initializer or module scope (SSR/hydration
   break). Use the exact Phase C recipe.
5. **Never** write Node-only APIs that don't run under Workers `nodejs_compat`: no `fs`, no native
   modules, no `process.env` in client code, no `export const runtime = "edge"`.
6. **Never** hardcode a secret. Any value that looks like a key (`sk-`, `tl-`, base64/hex ≥32 chars)
   is a secret → env var only. **`NEXT_PUBLIC_*` is public** — no secret ever uses that prefix.
7. **Never** create a second cart provider, rename `useCart`, or move money logic out of `money.ts`.
8. **Never** use a network `brandColor` as a background or text color (contrast + clash). Dot/border only.
9. **Never** hand-edit `open-next.config.ts` / `wrangler.toml` from a blog. They are correct as-is.
10. **Never** invent SKUs, prices, networks (no "Glo", no "Expresso"), bundles, or features not in a card.

## 0.8 Definition-of-done invariants (every phase, no exceptions)
- `npm run build` exits 0 (this is the gate — no red build passes).
- The card's specific acceptance greps pass.
- No new dependency added.
- The change touches only the card's allowed files.

---

# PART 1 — Product (stable context — change only via owner decision)

## 1.1 The idea, in the owner's words
- A **data reselling website for the Ghana market**. Name: **blink**.
- **For now:** mobile data reselling. **Later:** more services on the same platform — "space to add more."
- First deliverable: **frontend + mock data** (no real backend/payments).
- This `plan.md` is the source of truth for stated wants + roadmap.

## 1.2 Vision
blink is a **platform, not a one-off shop**. First service is mobile data; the architecture
(feature folders + `lib/services.ts` registry) must make airtime, bills, gift cards, subscriptions
trivial to add later without rewrites.

## 1.3 Market & personas
- **Primary:** Ghanaian consumers + small resellers (micro-"data dealers") buying data for self/customers.
- **Networks at launch:** MTN, Telecel, AT (AirtelTigo). **Currency:** GH₵. **Language:** English.
- **Connectivity reality:** mobile-first, low-end Android, variable 3G/4G, metered/intermittent — design
  for the worst connection as the norm.
- **Personas:** (1) self-serve consumer — wants a bundle in <60s, pays MoMo; (2) micro-reseller — the
  long-term revenue driver, cares about price/speed/repeat orders; (3) gifting buyer — buys for a number
  that isn't theirs.

## 1.4 Ghana domain facts (these correct the v1 draft — source: product lens, Appendix A)
- **MTN publishes no GB bundle list** — it's **amount-led** (effective MB per spend band). Telecel/AT
  publish **non-expiry** grids. So the catalogue is keyed by **price point**, and **`non-expiry` is the
  headline value prop** (a reseller beats the MNO menu on expiry, not just price).
- **MTN MoMo ≈ 73–90% of wallets** → default payment method; **Telecel Cash** mandatory (never say
  "Vodafone Cash"); **AT is merging into Telecel** (announced 2025) → soft-name "AT."
- **E-levy was repealed (April 2025)** → NO "e-levy" line item or copy. Gateway fees (≈1.95–2%
  Paystack/Flutterwave) are priced **into margin**, never added at checkout.
- **Payer wallet network ≠ bundle network.** Buyer can pay by one MoMo and receive data on another.
- **Number prefixes** pre-fill/warn (024/025/053/054/055/059 MTN, 020/050 Telecel, 023/026/027/056/057
  AT), but **number portability** exists → **warn, never hard-block.**
- **Night bundles convert best** (e.g. Telecel Night King GH₵3/10GB, MTN Midnight GH₵3/~8.7GB) — model them.
- **Cart is naive for one-shot buys.** Real path is number → bundle → MoMo prompt. Keep the cart for the
  dealer persona, but the primary CTA is **"Buy now"** (single-screen), cart secondary.
- **Trust signals** for intangible goods: delivery-time promise ("under 30 min"), authorized-reseller
  claim, failure/refund policy, WhatsApp as the real support channel (deep link, not a form).

## 1.5 Scope
**In (v1):** frontend + live Jehucal catalogue; browse → network → bundle → Buy now / cart → in-store
checkout that creates the Jehucal order and hands off to Paystack (§1.6); responsive polished UI;
auth deferred (no Auth0 dependency); Cloudflare (OpenNext) config; service registry with coming-soon slots; this plan.
**Out (v1):** own payment gateway, own backend/DB, telco API/data delivery, real auth tenant, admin
dashboard, multi-item checkout (Jehucal takes one package per payment).
**Explicit non-goals:** multi-currency, account-gated purchase, order-history persistence,
email/SMS receipts, promo engine. (Roadmap, not gaps.)

## 1.6 Fulfilment model — **checked out in blink, sold by Jehucal** (agreed 2026-11-18)
The owner has **no payment gateway** and will not collect money on blink. The v1 link-out (old
"Path B") is **superseded**: the customer now completes checkout in blink's own UI, while the
sale itself is still created on the owner's Jehucal storefront so the commission stays with the store.

**How the money path works**

1. blink renders the live Jehucal catalogue server-side (`GET /storefront/public/littleFlower`,
   CORS-less, 60 s cache). No build-time price snapshot, no mock catalogue.
2. On submit, blink's server route (`POST /api/checkout`) re-checks the package against the live
   catalogue, then calls the same anonymous endpoint the Jehucal storefront itself uses:
   `POST /storefront/checkout { storeUrl, agentPackageId, email, phone, callbackUrl }`.
3. Jehucal responds with `{ authorization_url, reference }`. The browser is sent to Paystack's hosted
   page — Jehucal's gateway, not blink's. blink never sees a card number, MoMo PIN or webhook.
4. Paystack returns the customer to `/checkout/return?reference=...`; that page calls
   `POST /storefront/orders/reverify` server-side and shows confirmed / not-confirmed.
5. Because `storeUrl` is `littleFlower`, the order is attributed to the owner's store and the spread is
   credited to the owner's Jehucal commission balance (`/store > Commission`).

**Constraints that come from the Jehucal API (do not design around them silently)**

- `/storefront/checkout` accepts **one `agentPackageId` per payment**. The cart is therefore a saved
  list; each line gets its own Buy action and one bundle is paid per checkout.
- Only `available: true` packages with an integer `price` in **pesewas** are renderable. If the
  catalogue has no usable package, blink shows an empty state and links to the storefront —
  it must **never invent a price or SKU**.
- `phone` is exactly the 10 national digits (e.g. `0541234567`). Email must be valid.
- `POST /storefront/orders/reverify` returns a `status` (`SUCCESS`, `FAILED`, …) plus a message; treat
  anything other than `SUCCESS` as "not confirmed yet", never as paid.
- **Never** use `GET /storefront/orders/by-phone` — cross-tenant leak (`pricing-strategy.md` §7.3).

**Verified live 2026-11-18**: checkout returned
`reference: store_1795012103199_ce66700b` → `https://checkout.paystack.com/b7l0ijdlsdxpqg6`
(unpaid test order left pending on the store). Reverify of that reference returned
`status: FAILED`, message `Payment did not succeed or is still pending`.

**Pricing authority:** the recommended grid lives in [`pricing-strategy.md`](./pricing-strategy.md).
blink must **never invent a price**: it reads the Jehucal catalogue, and if a price is missing it
shows "see store" rather than guessing. Prices are **pesewas integers** end-to-end (see §0.2).

---

# PART 2 — Decisions log

## 2.1 Closed (previously open)
| # | Question | Decision |
|---|---|---|
| 1 | OpenNext vs next-on-pages | **OpenNext + Wrangler** (already configured). Do not add next-on-pages. |
| 2 | Auth0 now or later | **Deferred** — `@auth0/nextjs-auth0` uninstalled (no code used it); no sign-in UI in v1; revisit when a tenant exists. |
| 3 | Brand | Green/gold Ghana palette already in `globals.css` (AA-passing). **[ASK OWNER]** final logo/type. |
| 4 | Full UI now or plan-first | Plan reviewed (this doc) → proceed with §3 build order. |
| 5 | Bundle model/prices | **Corrected** to amount-led/non-expiry, pesewas, `dataMb`, `checkedAt` (§3.1). All indicative — verify pre-launch. |
| 6 | Tailwind v3 vs v4 | **Stay on v3** for shadcn stability; revisit post-v1. |
| 7 | Coming-soon cards | Show as labeled, **non-clickable** "Coming soon" (desaturated). |

## 2.2 Owner inputs still needed (**[ASK OWNER]**)
- Final brand assets (logo, type) — text placeholders fine for v1.
- Whether v1 checkout includes the **gift/self** recipient distinction, or defers to v2.
- Launch domain (e.g. `littleshop.gh`) and who owns DNS/Cloudflare account.

---

# PART 3 — Phased task cards

> **As-built note (2026-11-18).** These cards are the build record, not current instructions where they
> conflict with §1.6. `mock-data.ts` has been **deleted**: the catalogue, prices and package ids come
> from the live Jehucal store (`features/data/catalogue.ts`). Where a card below says to edit
> `mock-data.ts`, add a bundle to it, or import `getBundlesByNetwork` from it, that step is obsolete —
> packages are enabled and priced in the Jehucal dashboard instead. Everything else (types, money,
> cart, UI rules, acceptance greps) still applies.

Each card: **GOAL · FILES (create/edit) · IMPORTS (verbatim where noted) · DO-NOT-TOUCH · ACCEPTANCE
(build + greps) · NON-GOALS.** One model per card. Stop at a green build.

## Phase A — Data model correction + foundations  →  *route: mid tier*
**Goal:** make the data model Ghana-correct and money-correct, and add the base helpers.
**Files:** edit `src/types/index.ts` (to §0.2); populate the live catalogue (`features/data/catalogue.ts`);
edit `src/features/data/types.ts` (deleted — see as-built note); **create** `src/lib/money.ts` (§0.6),
`src/lib/constants.ts`, `src/lib/service-icon.tsx`; **edit** `next.config.ts` (fix the wrong comment).
**Data — the exact catalogue (indicative; set `checkedAt` to today; VERIFY before launch):**
```ts
// MTN — amount-led, non-expiry (+ midnight)
{ id: "mtn-ghs1",   networkId: "mtn", name: "GH₵1 Data",   dataMb: 41,    pricePesewas: 100,  expiryType: "non-expiry" },
{ id: "mtn-ghs3",   networkId: "mtn", name: "GH₵3 Data",   dataMb: 407,   pricePesewas: 300,  expiryType: "non-expiry" },
{ id: "mtn-ghs10",  networkId: "mtn", name: "GH₵10 Data",  dataMb: 838,   pricePesewas: 1000, expiryType: "non-expiry", popular: true },
{ id: "mtn-ghs50",  networkId: "mtn", name: "GH₵50 Data",  dataMb: 3560,  pricePesewas: 5000, expiryType: "non-expiry" },
{ id: "mtn-ghs100", networkId: "mtn", name: "GH₵100 Data", dataMb: 8000,  pricePesewas: 10000, expiryType: "non-expiry" },
{ id: "mtn-midnight", networkId: "mtn", name: "Midnight (GH₵3)", dataMb: 8700, pricePesewas: 300, expiryType: "night", popular: true },
// Telecel — non-expiry grid (+ Night King)
{ id: "tel-ghs10",  networkId: "telecel", name: "GH₵10 Data",  dataMb: 891,   pricePesewas: 1000, expiryType: "non-expiry", popular: true },
{ id: "tel-ghs50",  networkId: "telecel", name: "GH₵50 Data",  dataMb: 4500,  pricePesewas: 5000, expiryType: "non-expiry" },
{ id: "tel-ghs100", networkId: "telecel", name: "GH₵100 Data", dataMb: 10000, pricePesewas: 10000, expiryType: "non-expiry" },
{ id: "tel-nightking", networkId: "telecel", name: "Night King (GH₵3)", dataMb: 10000, pricePesewas: 300, expiryType: "night", popular: true },
// AT — non-expiry
{ id: "at-ghs10",   networkId: "at", name: "GH₵10 Data",  dataMb: 891,   pricePesewas: 1000, expiryType: "non-expiry", popular: true },
{ id: "at-ghs50",   networkId: "at", name: "GH₵50 Data",  dataMb: 4500,  pricePesewas: 5000, expiryType: "non-expiry" },
{ id: "at-ghs100",  networkId: "at", name: "GH₵100 Data", dataMb: 10000, pricePesewas: 10000, expiryType: "non-expiry" },
```
- Update `getBundlesByNetwork`/`getBundleById`/`getNetworkById` signatures to `NetworkId`/`string`→typed.
- `service-icon.tsx`: exact map for the icons used in `lib/services.ts` (`Wifi, PhoneCall, ReceiptText,
  Gift, PlayCircle`) → components; throw a clear error on unknown name.
- `next.config.ts`: **delete** the incorrect comment ("do not support the Node.js runtime") — OpenNext
  runs Next's nodejs runtime on Workers via `nodejs_compat`.
**DO-NOT-TOUCH:** `cart-provider.tsx`, any `components/**`, `services.ts`, `auth.ts`, configs.
**ACCEPTANCE:** `npm run build` green; `grep -rn "priceGhs\|dataGb\|validityDays" src` returns 0;
`grep -rn "GH₵" src --include=*.tsx | grep -v money.ts` returns 0; `getBundlesByNetwork` param is `NetworkId`.
**NON-GOALS:** no UI, no checkout, no cart changes.

## Phase B — Storefront UI (header → hero → rail → networks → bundles)  →  *route: mid tier*
**Goal:** replace the `page.tsx` stub with the real storefront; add layout + store components.
**Files:** add shadcn `skeleton, badge` (already have card/button/tabs) via `npx shadcn add`;
**create** `components/layout/header.tsx`, `components/layout/footer.tsx`; **create**
`components/store/hero.tsx`, `service-rail.tsx`, `network-selector.tsx`, `bundle-card.tsx`,
`bundle-grid.tsx`; **edit** `app/layout.tsx` (wrap `<Header>`…`<Footer>` inside `<CartProvider>`),
**edit** `app/page.tsx` (compose the sections).
**Imports (verbatim):** money via `import { formatGhs } from "@/lib/money"`; data via
`import { networks, getBundlesByNetwork } from "@/features/data/mock-data"`; service list via
`import { services } from "@/lib/services"`; icons via `import { X } from "lucide-react"`;
service icons via `import { ServiceIcon } from "@/lib/service-icon"`.
**Rules:** bundle card hierarchy = **big `formatGhs` price (primary)**, large data-size, expiry as a
muted pill ("No expiry" / "Night" / "7 days"), popular badge top-left; **one** bold numeral per card.
Network selector = `tabs` with `aria-label`; brand color = dot/border only. Hero = value prop +
trust strip (delivery-time, authorized reseller, WhatsApp) + network chips. Coming-soon cards:
desaturated, non-interactive, "Coming soon" badge. `skeleton` while grid "loads" (static in v1, but
render the pattern). Mobile: ≥44px targets, full-width primary "Buy now."
**DO-NOT-TOUCH:** `types/**`, `mock-data.ts`, `cart-provider.tsx`, `lib/*`, configs.
**ACCEPTANCE:** `npm run build` green; at 360px no horizontal overflow (visual); every price renders
through `formatGhs` (grep); no `brandColor` used as bg/text (grep for `style=` with brandColor).
**NON-GOALS:** no cart, no checkout, no Buy-now handler yet (button present, no-op is OK).

## Phase C — Cart (sheet + persistence + qty cap)  →  *route: mid tier*
**Goal:** make cart work as a mobile **sheet**, persist it, cap quantity.
**Files:** add shadcn `sheet, label, scroll-area, checkbox, sonner` via `npx shadcn add`;
**create** `components/store/cart-sheet.tsx`, `components/store/cart-button.tsx`; **edit**
`providers/cart-provider.tsx` (snapshot on add + localStorage persistence + qty cap); **edit**
`app/layout.tsx` if a toast host (`<Toaster/>`) needs to be mounted.
**EXACT localStorage recipe (do not deviate — this is the #1 weak-model bug):**
```tsx
const [lines, setLines] = React.useState<CartLine[]>([]);        // init EMPTY
const [hydrated, setHydrated] = React.useState(false);
React.useEffect(() => { setLines(readFromStorage()); setHydrated(true); }, []);
React.useEffect(() => { if (hydrated) writeToStorage(lines); }, [lines, hydrated]);
```
- On `addItem(bundleId)`: look up the bundle once, store `nameSnapshot` + `pricePesewasSnapshot` on the
  new line. `subtotal` = sum of `pricePesewasSnapshot * quantity` (pesewas). `MAX_QTY_PER_LINE` from
  `lib/constants` enforced **only** in `updateQuantity`.
- `cart-button` (count badge) renders the count **only after `hydrated`** — never on first paint.
- `sonner` toast on add ("Added to cart").
**DO-NOT-TOUCH:** `mock-data.ts`, `types/**`, `components/store/bundle-*`, configs.
**ACCEPTANCE:** `npm run build` green; add→sheet→qty→subtotal correct (manual); refresh keeps cart;
`grep -n "localStorage" src/providers/cart-provider.tsx` shows it only inside `useEffect`; count badge
gated on `hydrated`.
**NON-GOALS:** no checkout; cart is secondary (primary purchase path is Buy now, Phase D).

## Phase D — In-store checkout, sale created on Jehucal  ->  *route: mid tier*
**Goal:** let the customer complete checkout inside blink's own UI, while the order is created on
the owner's Jehucal storefront so payment (Paystack) and commission stay with the store. See §1.6.
**Files:** `app/checkout/page.tsx`, `components/store/checkout-form.tsx`, `app/api/checkout/route.ts`,
`app/checkout/return/page.tsx`, `features/data/catalogue.ts`.
**Flow:**
1. Recipient phone field. Client-side validation only (UX, not security): accept `+233XXXXXXXXX` or
   `0XXXXXXXXX`; normalise to E.164 (`+233...`), then send the 10 national digits to Jehucal. Prefix hint
   (soft warn, never block) per §1.4. Email is required because Paystack sends the receipt there.
2. **"Continue to payment"** summarises the order (pesewas via `formatGhs`) and states plainly that
   blink places the order with Jehucal and Paystack takes the payment. It must not imply blink
   charges the card itself.
3. `POST /api/checkout` (server only): same-origin check, size/rate limit, phone/email validation,
   re-fetch catalogue and reject an unknown/removed package (409), then call
   `POST {JEHUCAL_API_BASE}/storefront/checkout` with `storeUrl: littleFlower`, the package id, email,
   phone and `callbackUrl` = `<origin>/checkout/return`. Return `{ authorizationUrl, reference }`;
   the browser assigns `authorizationUrl` (Paystack).
4. `/checkout/return` reads `reference`/`trxref`, calls `POST /storefront/orders/reverify` server-side
   and shows **Payment confirmed** only when `status === "SUCCESS"`; otherwise "not confirmed yet" with
   refresh + start-again actions. No order is stored locally and no outcome is simulated.
5. **Do not** call `/storefront/orders/by-phone` - it is a cross-tenant leak (`pricing-strategy.md` §7.3),
   and it is unauthenticated.
6. One bundle per payment: the Jehucal checkout endpoint takes a single `agentPackageId`. The cart saves
   several lines, but each line is bought separately.
**DO-NOT-TOUCH:** `lib/money.ts`, `pricing-strategy.md` numbers, cart internals beyond `addItem(bundle)`.
**ACCEPTANCE:** `npm run build` green; `grep -rn "Math.random" src` returns 0; the API route rejects
cross-origin, bad phone, bad email and unknown bundles without calling Jehucal; a valid submit returns a
Paystack URL and lands the browser on it; `/checkout/return` shows not-confirmed for an unpaid reference;
phone normaliser unit-tested for `0541234567` -> `+233****4567` and `+233****4567` unchanged.
**NON-GOALS:** no gateway account, no API key, no webhooks, no local order database, no multi-item payment.

## Phase E — Polish + deploy readiness  →  *route: any tier (mechanical) + you verify*
**Goal:** make it production-credible and deploy-ready (config, not deploy).
**Files:** `README.md` (update scripts/layout), `.gitignore` (add gaps per §4), copy pass.
**Tasks:** responsive pass (360/414/768) — no breakage at 360px, ≥44px touch targets, thumb-zone
sticky checkout bar on catalogue; empty/error/loading states on every async surface; accessibility —
dialog close ≥44px, `aria-label` on tabs, `sr-only` live region announcing "Added to cart",
focus-visible rings on colored bg; confirm `npm run build` and `npx @opennextjs/cloudflare build`
both succeed; confirm **no key-bearing file exists in the tree** (the old `API_PROVIDERS.md` is
deleted; `providers/apinex.json` holds only an env-var *name*, never a value — §4).
**ACCEPTANCE:** `npm run build` green; `npx @opennextjs/cloudflare build` green; 360px clean; no
secret-bearing file in the deploy output.
**NON-GOALS:** no real deploy (needs account), no real auth.

---

# PART 4 — Security & secrets  🔴 ACTION NOW (before `git init`)

Source: security lens (Appendix A). Findings were **verified**, not assumed.

1. **RESOLVED - `API_PROVIDERS.md` deleted on 17 Nov 2026.** It held two live keys in plaintext
   (TokenLab `tl-ebb...`, APInex `sk-apx...`), both confirmed working (HTTP 200). **Deletion is not
   rotation** - still rotate both, because the TokenLab value was also pasted into
   `~/.config/opencode/AGENTS.md` (outside this repo) and both sat readable on disk.
   Re-verify before any push: `git ls-files | grep -i api_providers` must be empty and
   `git log -S "tl-ebb"` must be empty. If either ever committed it, purge history - rotate regardless.
2. **No git repo yet** (`fatal: not a git repository`). Nothing is versioned or protected, and the first
   `git init && git add -A` sets the history. `API_PROVIDERS.md` is gone, so that specific landmine is
   cleared; still list files with `git status --porcelain` before the first commit.
   `providers/apinex.json` is safe: it uses `"apiKeyEnvVar": "APINEX_API_KEY"`, a *reference*, never a value.
3. **`.gitignore` OPEN GAP** - covers `.env`/`.env.local`, but misses `.env.*.local` and **`.dev.vars`**
   (the Cloudflare Workers local-secrets file that `wrangler dev` reads). Add `.dev.vars`, `.env.*.local`,
   `secrets/` before the first commit. Do this now, it is one line each.
4. **Client/server secret boundary** — no rule yet stops a weak model writing `NEXT_PUBLIC_APINEX_KEY`
   (baked into the public JS bundle). Rule (§0.7.6): `NEXT_PUBLIC_*` = public; secrets never use it.
5. **Deploy-output leak class (now handled by deletion, but the rule stands).** Anything in the repo is
   served publicly by the Workers `ASSETS` binding. `API_PROVIDERS.md` held live keys and is gone;
   never add a `.md`/`.json`/`.env` that carries a real key. `providers/apinex.json` is the correct
   pattern: it names `APINEX_API_KEY`, the value lives only in `.env.local` / `wrangler secret`.
6. **Injection surface (v1 is safe, future isn't)** — no `dangerouslySetInnerHTML`/`eval` today; React
   escaping covers v1. When real telco APIs arrive: normalize phone to E.164, strict regex
   `^\+233[0-9]{9}$|^0[0-9]{9}$`, never interpolate raw input into outbound URLs/bodies; verify webhook
   signatures + idempotency keys; **server-authoritative pricing** (never trust a client price).

**Guardrails for weak models (fold into §0.7):** never paste a real key in any tracked/doc file
(always `$ENV_VAR`); prefix test — `sk-`/`tl-`/hex≥32 ⇒ secret ⇒ env only; Workers secrets live in
`.dev.vars` (local) / `wrangler secret put` (CI), never `wrangler.toml`; add a pre-commit **gitleaks**
hook so a bad model literally can't commit a key; validation belongs server-side (client checks are UX only).

---

# PART 5 — Model routing guide (pick the model tier for each task)

Because the owner will mix **many** models, some weak, route by **task risk**, not by habit.
Tiers (use whatever is available — examples from the current pool; apinex daily limit is spent):

| Tier | Examples (current pool) | Use for |
|---|---|---|
| **Weak / cheap** | `freellmapi/auto`, tokenlab `MiniCPM-V-4.7-1B`, `MiniCPM5-2B`, zen `-free` flash models | Phase E mechanical bits (copy, rename, shadcn add). Read-only Q\&A. |
| **Mid** | tokenlab `Qwen3.8-27B`, `Gemma-4-31B-IT`, `DeepSeek-V4.1-Flash`; zen `longcat-2.5-free`, `minimax-m3.1-flash-free`, `glm-5.3-flash-free` | Phases A–C: one well-specified card each. |
| **Strong** | tokenlab `DeepSeek-V4.1-Flash` (max), your strongest paid model | Phase D (server checkout route + phone normalisation) and any card failed twice. |

Operating rules:
- **Write and verify with different models.** The model that implements a card never checks it.
- **One card = one model = one green build.** Never batch phases.
- **Escalate, don't patch:** a weak model failing a card's greps twice → re-run on a higher tier with
  the same card, not manual nudges.
- **Always pin §0** (Frozen Core) at the top of the prompt, plus the single card, plus the tier.
- A weak model may **read** anything but may only **write** the card's allowed files.

---

# Appendix A — Reviewer findings (real multi-model, summarized)

Six lenses, each a distinct model reading the repo. Summarized; conflicts resolved in §2.

**A1. Architecture & data model — apinex `free-gpt-6-luna`.**
Cart was bundle-only (`bundleId`+`getBundleById`) → not platform-extensible. Prices as cedis-float →
pesewas int. `getBundlesByNetwork(string)` should be `NetworkId`. Feature-module contract was
under-specified. §8 "no Node APIs" contradicted `nodejs_compat`. Stray `apktool_mcp_server_workspace/`
+ `.next/` confuse path-based agents. **Kept:** `ServiceStatus` registry, OpenNext+Tailwind v3; the
Auth0 placeholder decision is deferred (see §2.2, "Owner inputs still needed").

**A2. Product & Ghana GTM — apinex `free-gpt-6-luna`.**
The GB-tier catalogue was **wrong for Ghana** (amount-led MTN, non-expiry Telecel/AT; "5GB=GH₵50"
off-market). Missing: network-prefix warn (not block), payer≠recipient network, MoMo waiting/fallback
(`*170#`), night bundles, reseller wallet/role, gifting. e-levy repealed 2025; gateway fees into margin;
KYC wallet caps (GH₵3,000/day) break big orders; WhatsApp = real support. **Kept:** service registry,
coming-soon display, Pending/Failed/Retry requirement, E.164 normalization.

**A3. UX/UI — apinex `free-gemini-3.8-flash`.**
Brand colors clash/fail contrast (AT green ≈ primary; MTN gold-on-white 1.5:1) → dot/border only.
Touch targets <44px → enforce ≥44px + thumb-zone sticky bar. Price/size/validity not scannable →
one bold numeral, price primary. Coming-soon looked identical to active → desaturate + non-interactive.
Missing primitives: **sheet, label, select, skeleton, scroll-area, checkbox, alert, sonner**.
**Kept:** green/gold tokens (AA), Radix-backed components, `cn`+cva pattern, dark-mode parity.

**A4. Security — apinex `free-kimi-k3`.**
Two live keys were in `API_PROVIDERS.md` (confirmed 200; **file now deleted**); no git repo yet;
`.gitignore` still misses `.dev.vars`; `NEXT_PUBLIC_*` leak path; repo files are served publicly by
`ASSETS`; future SSRF/injection via raw
phone; payments phase needs webhook sigs + idempotency + server-authoritative pricing. **Kept:**
env-gated `.env.example`, `providers/apinex.json` env-var pattern, `.open-next/` is the only deploy
artifact.

**A5. Edge/Cloudflare & perf — tokenlab `DeepSeek-V4.1-Flash`.**
`next.config.ts` comment is **wrong** (OpenNext runs nodejs runtime on Workers; don't sprinkle
`runtime="edge"`). No `incrementalCache` in `open-next.config.ts` → any `revalidate`/ISR throws; add
R2-based cache before relying on it. Deploy artifact is `.open-next/worker.js` only. `@auth0/nextjs-auth0`
v4 only meets Workers via OpenNext+`nodejs_compat`; gate behind the Auth0 placeholder decision
(plan §2.2). Perf for 3G: per-icon lucide import (lucide barrel excluded), hero is CSS/text chips, no
images. **Kept:** OpenNext+`nodejs_compat`, `ASSETS` binding, server-components-by-default,
`reactStrictMode`.

**A6. Weak-model robustness — tokenlab `Qwen3.8-27B`.**
Phases were prose, not specs → per-phase cards (exact files/imports/exports + grep acceptance). Target
tree self-contradicted (bundle-card in two folders) → one home (`components/store/`), drop
`features/data/components` (YAGNI). No import-path rule → §0.4. Checkout unspecified → deterministic
(no `Math.random`). No anti-auth rule → §0.7.3. localStorage recipe unspecified → §3.3 exact pattern.
Service icon string with no map → `service-icon.tsx`. Only a global DoD → per-phase gate.
**Kept:** `CartLine` model, registry, OpenNext+Tailwind v3, 14→15-SKU mock set, §4 security callout.

---

## Reviewer transparency note
- 6 lenses, **5 distinct models** (apinex `free-gpt-6-luna` covered both architecture and product).
- Several apinex "free" models failed on provider-side gates (subscription-only, vision-disabled,
  daily-quota) — not config or prompt errors. Edge + robustness lenses completed on the tokenlab pool.
- Findings are claims from those models, reconciled by the operator against the actual repo before
  being written into this contract.
