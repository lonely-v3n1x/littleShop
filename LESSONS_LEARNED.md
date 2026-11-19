# Mistakes and lessons (littleShop, 19 Nov 2026)

Repo-root doc produced by the review pass ("delete the useless stuff and put the mistakes
and what to fix in a .md"). Dates: system date is 2026-11-19.

## Deleted as useless (verified unused before deleting)

| Path | Why unused |
|---|---|
| `src/lib/auth.ts` | `authEnabled` export — no importers. Auth0 placeholder; the decision lives in the plan. |
| `src/features/data/types.ts` | Re-export shim `export type { ... } from "@/types"` — nothing imports it. |
| `src/components/ui/card.tsx` | Nothing renders `<Card>`; page cards are hand-built divs. |
| `src/components/ui/skeleton.tsx` | No importer. |
| `src/components/ui/checkbox.tsx` | No importer (checkout-form uses a native `<input type=checkbox>`). |
| `src/components/ui/dialog.tsx` | No importer (sheets are used instead). |
| `tsconfig.tsbuildinfo` | Stale build artifact at repo root. |
| `.playwright-mcp/` | Local Playwright session logs/screenshots (console logs, snapshots, PNGs). |

`plan.md` tree and `lib/auth.ts` references updated to match.

---

## Mistakes

### 1. `npm run cf:build` fails while `next dev` is running

**Error trail:** OpenNext bundling `handler.mjs` dies with dozens of

```
✘ [ERROR] No loader is configured for ".map" files:
    node_modules/next/dist/compiled/next-server/*.runtime.dev.js.map
```

at the `require("./" + __webpack_require__.u(chunkId))` site inside
`node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js` (lines ~23).

**Root cause (not an OpenNext bug):** Next 15.5.29 ships `.map` files next to every compiled
`next-server/*.runtime.dev.js`. While a dev server is up, it keeps writing dev artifacts into `.next`
and Next traces them as part of the build output; OpenNext's bundler then enumerates the compiled
runtime directory and tries to `require()` the sibling `.map` files — esbuild has no loader for `.map`
and fails.

**Fix / lesson:**
- `kill` the dev server first, then `rm -rf .next .open-next`, then `npm run cf:build`.
- Don't run `npm run build`/`next build` while a dev server is live on the same checkout; `next start`
  and `next dev` share `.next`.
- Always confirm the *production* build is green (`npm run build` and `npx @opennextjs/cloudflare build`)
  before trusting a deploy; I only saw OpenNext green after a clean tree.

### 2. The old dsh reports of "/store never renders, cart can never open" were stale

At the point of takeover the live store page returned 200 with the rendered bundle grid and the cart
sheet opened. No product bug — just reports written before the harness died.

**Lesson:** verify the top-level claims of a dead session before re-fitting architecture to them.

### 3. Code generation for the React `@` alias and money flows kept moving — keep a written snapshot

The money rules (integer `pricePesewas` end-to-end, `formatGhs` only from `lib/money.ts`, `dataMb`
rendering, snapshots in the cart) were re-implemented 3 times during the dsh run
(`DataBundle.pricePesewas` at the start, `pricePesewasSnapshot` in cart lines, etc.). The final shape
is the authoritative one; if the plan and the code drift again, regenerate the plan from the code.

### 4. Behind Cloudflare, `request.url` is not necessarily the browser origin

My first version of `POST /api/checkout` compared `Origin` against `new URL(request.url).origin`;
the dev test on `127.0.0.1` mismatched `localhost` (403 for valid calls) — correct, but it taught
nothing about production. The real issue is that in Workers the URL can be an internal one
(`https://littleshop.workers.dev` style), so the same-origin check must compare against
`x-forwarded-host` (+ `x-forwarded-proto`). Fixed in `src/app/api/checkout/route.ts`.

**Lesson:** when an API contract depends on the URL, check it against what the proxied browser
actually sends (`Origin`, `Host`, `X-Forwarded-*`), not what `request.url` says.

### 5. Test orders created by verification are real

Jehucal's `/storefront/checkout` is anonymous and creates real unpaid orders on your store:

- `store_1795011725640_709e009e` (first direct curl)
- `store_1795012103199_ce66700b` (through `/api/checkout` on the prod build)
- one from the browser flow test (the Paystack URL is logged; the order reference is in the stub test)

They were never paid. Delete them (or ignore them) before a launch.

### 6. Known limits of the new architecture

- **One bundle per payment** (Jehucal API constraint). The cart keeps several lines; each line gets a
  Buy action, and the footer only offers "continue" when exactly one line is selected.
- Only `available: true`, integer-priced Jehucal packages show up. If the owner wants a fractional
  size (e.g. 500 MB, `size: 0.5`), that is supported now via `dataMb = Math.round(size * 1024)`.
- Paystack is a third party the owner already uses for storefront; if they want littleShop to be
  self-contained later, that is a new design (separate route + status polling).

---

## Remaining open items (fix or confirm)

1. **Enable more packages** in the Jehucal dashboard (Store → Packages): set store prices and
   availability. Only `MTN 1GB` is live today, so the site shows one buyable bundle.
2. **Confirm the WhatsApp number** (`233531810252`) — it is copied from the Jehucal catalogue; the
   [OPEN] marker in `lib/constants.ts` and `pricing-strategy.md` still says the owner should confirm it
   is the right number for customers.
3. **Test a real (paid) end-to-end** once one more package is live: fill checkout → Paystack → return
   page; then verify on the Jehucal dashboard that the sale is attributed to `littleFlower`.
4. **Wire Auth0** when credentials/tenant exist: `@auth0/nextjs-auth0` is a dependency; the plan
   reserves `lib/auth.ts`'s `authEnabled` decision for then.
5. Unit tests for the phone normalizer were never added — the plan has phone cases in Phase D
   acceptance. Add a small `__tests__` dir if the team wants anything more than "it passed in the
   browser".
6. **Live-upstream flakes to watch for:** if Jehucal's API or the catalogue ever flakes, the home page
   renders an "The live catalogue is not answering" alert with a link to the storefront (verified
   behavior); `/checkout` refuses to start payment when the catalogue can't be read.

## Commands reference (verified working on 19 Nov 2026)

```bash
npx tsc --noEmit              # clean
npm run build                 # green
npx @opennextjs/cloudflare build   # green (after `rm -rf .next .open-next` and no dev server)
npm run dev                   # port 3211 (original), next start on 3210/3213/3212 historically
```

Live behaviour spot-checks that passed:
- Home renders the live card `MTN 1GB Data` at `GH₵4.90` (price from `GET
  https://backend.jehucale-business.com/storefront/public/littleFlower`).
- `POST /api/checkout` → 200 `{ authorizationUrl: "https://checkout.paystack.com/..." }`; the browser
  is sent to the real Paystack page.
- Validation: bad phone → 400, cross-origin → 403, stale bundle → 409.
- `GET /checkout/return?reference=<unpaid>` → "Payment not confirmed yet" with retry actions; an unpaid
  Jehucal reference re-verifies as `status: FAILED, message: Payment did not succeed or is still pending`.
