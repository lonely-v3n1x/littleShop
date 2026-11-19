# Ghana data-bundle pricing research - blink

**Date:** 16-17 Nov 2026
**Account:** Jehucal agent `AGT800`, store slug `littleFlower`, tier **BASE**
**Currency:** GHS (the store UI shows the cedi symbol; written "GHS" here so the file stays ASCII-clean)

> Read the confidence column. Only rows marked **HIGH** should drive prices without a re-check.
> Street prices move with weekly promos and several comparison sites are auto-generated and unreliable.

---

## 1. The four findings that change the plan

1. **Only ONE SKU is live on your storefront.** The public catalogue returns exactly one package:
   MTN 1GB at `price: 490` (GHS 4.90), `available: true`. The storefront lists **only** packages you tick
   **Available** on the dashboard. So the job is *enabling SKUs*, not tuning a formula.
2. **At BASE tier you cannot win small MTN bundles on price.** Your MTN 1GB cost is **GHS 4.35**; at least
   one competitor sells it at **GHS 4.10**. Any price you set is beaten, and matching it loses money.
   That is a **tier** problem, not a pricing problem (see section 6).
3. **Your profit engine is Telecel, not MTN.** Your Telecel cost sits far below street at every size
   (5GB: cost 19.00 vs street ~24.50). That is where a small shop actually earns.
4. **A "10% margin" is not 10%.** Paystack takes about **1.95% of the ticket**. Thin bundles go negative
   after fees, so the fee must be modelled in the price, not hoped for (see section 3).

---

## 2. Your wholesale cost (what you pay)

Source: agent dashboard **Data Topup** (debits your wallet) with the **Base** tier selector, cross-checked
against **Store > Packages** ("Agent price"). Confidence **HIGH**.

### MTN
| GB | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12 | 15 | 20 | 25 | 30 | 40 | 50 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cost | 4.35 | 8.40 | 12.50 | 16.50 | 20.40 | 24.20 | 28.10 | 32.20 | 40.00 | 48.30 | 59.90 | 79.50 | 98.50 | 118.30 | 156.80 | 195.00 |

### AT (AirtelTigo "BigTime", no expiry)
| GB | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 15 | 20 | 25 | 30 | 40 | 50 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cost | 4.00 | 8.00 | 12.00 | 15.50 | 19.50 | 23.50 | 27.50 | 31.00 | 38.00 | 57.00 | 75.00 | 95.00 | 113.00 | 149.00 | 185.00 |

### Telecel ("2Moorch", no expiry)
| GB | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cost | 19.00 | 37.00 | 55.00 | 73.00 | 90.00 | 107.00 | 125.00 | 142.00 | 160.00 | 175.00 | 360.00 |

Three facts from the cost sheet:

- MTN cost per GB is almost flat (~4.0-4.4) from 1GB to 50GB. **Bigger MTN bundles save the customer almost
  nothing**, so on MTN you compete on availability and convenience, not price.
- AT is the cheapest small-bundle cost in the market (4.00/GB at 1GB).
- Telecel 5GB is **3.80/GB**, the lowest cost per GB on your sheet, while street sells it at 24.50.

---

## 3. The pricing rule (reproducible, auditable)

All prices in GHS, quoted on a **0.50 grid** (customers read "4.50", not "4.4999").

```
band(gb)   = gb<=2 : 6%   | gb<=5 : 9%   | gb<=10 : 10% | gb<=30 : 9.5% | else 8.5%
minAbs(gb) = gb<=2 : 0.15 | gb<=5 : 0.45 | gb<=10 : 0.80 | gb<=30 : 1.50 | else 2.50
floor      = cost + minAbs(gb)
target     = cost * (1 + band(gb))
cap        = streetLow - 0.05          (only when a credible competitor price exists)
price      = roundDownTo0.50( min(max(floor, target), cap) )
net        = (price - cost) - price * 0.0195
```

The rule has four invariants, in priority order:

1. **Never sell below `cost + minAbs`.** A cheap-looking loss is a loss, and minAbs is the smallest
   profit worth the support cost of a human asking "where is my data?".
2. **Never price above a credible street low.** The customer is one WhatsApp message from the other shop.
3. **`net` must be positive after the 1.95% gateway fee**, or the SKU is not listed. This is what catches
   the "we made 3% margin" SKUs that are actually losses.
4. **Price per GB must not rise with bundle size.** If 10GB costs more per GB than 5GB, the ladder looks
   rigged and customers buy down.

Verdicts: `HERO` (at/below street low with healthy net), `OK` (below street with net >= 2% of cost),
`THIN` (positive but < 2%, listing optional), `LOSS` (negative net, do not list), `ABOVE-MKT` (no credible
comparison, price is margin-derived), `NO-MATCH` (cost itself exceeds street, cannot compete).

---

## 4. Recommended grid

`streetLow` is the cheapest credible competitor price I observed for that size on 16-17 Nov 2026.
`0` means no credible comparison existed, so the price is derived from the target band.

### MTN
| GB | Cost | Street low | List | Commission | Net after 1.95% | Net % | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | 4.35 | 4.10 | 4.50 | 0.15 | 0.06 | 1.4% | THIN (anchor) |
| 2 | 8.40 | 8.50 | 9.00 | 0.60 | 0.42 | 5.1% | OK |
| 3 | 12.50 | 12.50 | 13.50 | 1.00 | 0.74 | 5.9% | OK |
| 4 | 16.50 | 16.80 | 18.00 | 1.50 | 1.15 | 7.0% | OK |
| 5 | 20.40 | 20.50 | 22.50 | 2.10 | 1.66 | 8.1% | **HERO-ish** |
| 6 | 24.20 | 24.00 | 27.00 | 2.80 | 2.27 | 9.4% | **HERO-ish** |
| 7 | 28.10 | (none) | 30.50 | 2.40 | 1.81 | 6.4% | ABOVE-MKT |
| 8 | 32.20 | 32.00 | 35.50 | 3.30 | 2.61 | 8.1% | OK |
| 10 | 40.00 | 40.50 | 41.00 | 1.00 | 0.20 | 0.5% | THIN |
| 12 | 48.30 | (none) | 52.50 | 4.20 | 3.18 | 6.6% | ABOVE-MKT |
| 15 | 59.90 | 59.50 | 64.50 | 4.60 | 3.34 | 5.6% | OK |
| 20 | 79.50 | 79.50 | 85.00 | 5.50 | 3.84 | 4.8% | OK |
| 25 | 98.50 | 96.00 | 104.00 | 5.50 | 3.47 | 3.5% | OK |
| 30 | 118.30 | 118.00 | - | - | - | - | **NO-MATCH** |
| 40 | 156.80 | 158.00 | - | - | - | - | **NO-MATCH** |
| 50 | 195.00 | 195.00 | - | - | - | - | **NO-MATCH** |

### AT (AirtelTigo BigTime, no expiry)
| GB | Cost | Street low | List | Commission | Net after 1.95% | Net % | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | 4.00 | 4.20 | 4.50 | 0.50 | 0.41 | 10.3% | **HERO** |
| 2 | 8.00 | 8.40 | 8.50 | 0.50 | 0.33 | 4.2% | OK |
| 3 | 12.00 | 12.60 | 13.00 | 1.00 | 0.75 | 6.2% | OK |
| 4 | 15.50 | 16.20 | 17.00 | 1.50 | 1.17 | 7.5% | OK |
| 5 | 19.50 | 21.00 | 21.50 | 2.00 | 1.58 | 8.1% | **HERO-ish** |
| 6 | 23.50 | 24.00 | 26.00 | 2.50 | 1.99 | 8.5% | **HERO-ish** |
| 7 | 27.50 | 28.00 | 30.50 | 3.00 | 2.41 | 8.7% | **HERO-ish** |
| 8 | 31.00 | 31.50 | 34.50 | 3.50 | 2.83 | 9.1% | **HERO-ish** |
| 10 | 38.00 | 43.70 | 42.00 | 4.00 | 3.18 | 8.4% | **HERO** (undercuts official) |
| 15 | 57.00 | 55.20 | 58.50 | 1.50 | 0.36 | 0.6% | THIN -> skip |
| 20 | 75.00 | 59.80 | - | - | -16.37 | -21.8% | **NO-MATCH** (cost 25% over street) |
| 25 | 95.00 | (none) | 104.00 | 9.00 | 6.97 | 7.3% | ABOVE-MKT |
| 30 | 113.00 | 85.00 | - | - | -29.66 | -26.2% | **DO NOT LIST** (loss at street) |
| 40 | 149.00 | 100.00 | - | - | -50.95 | -34.2% | **DO NOT LIST** (loss at street) |
| 50 | 185.00 | 125.00 | - | - | -62.44 | -33.8% | **DO NOT LIST** (loss at street) |

### Telecel (2Moorch, no expiry) - your profit engine
| GB | Cost | Street low | List | Commission | Net after 1.95% | Net % | Verdict |
|---|---|---|---|---|---|---|---|
| 5 | 19.00 | 24.50 | 21.00 | 2.00 | 1.59 | 8.4% | **HERO - headline deal** |
| 10 | 37.00 | 38.50 | 41.00 | 4.00 | 3.20 | 8.7% | **HERO** |
| 15 | 55.00 | 57.75 | 60.50 | 5.50 | 4.32 | 7.9% | OK |
| 20 | 73.00 | 77.00 | 79.00 | 6.00 | 4.46 | 6.1% | OK |
| 25 | 90.00 | 96.25 | 97.50 | 7.50 | 5.60 | 6.2% | OK |
| 30 | 107.00 | 115.00 | 115.50 | 8.50 | 6.25 | 5.8% | OK |
| 35 | 125.00 | 133.00 | 134.00 | 9.00 | 6.39 | 5.1% | OK |
| 40 | 142.00 | 150.00 | 152.00 | 10.00 | 7.04 | 5.0% | OK |
| 45 | 160.00 | 167.00 | 170.50 | 10.50 | 7.18 | 4.5% | OK |
| 50 | 175.00 | 185.00 | 189.00 | 14.00 | 10.31 | 5.9% | **OK - highest cash/sale** |
| 100 | 360.00 | 355.00 | 370.00 | 10.00 | 2.79 | 0.8% | THIN -> skip |

**Read this table, not the MTN one.** Telecel is the only network where you hold a real cost
advantage at every size. 5GB at 21.00 is 14% below the cheapest competitor and still nets 8.4%.
That is the deal worth leading the homepage with. MTN's job is *credibility*, not profit.

---

## 5. Switch this on, leave that off

**Tier 1 - list now** (best net, and defensible against the street):

| SKU | List | Net | Why |
|---|---|---|---|
| Telecel 5GB | 21.00 | 1.59 (8.4%) | 14% under street; the headline "deal" |
| AirtelTigo 1GB | 4.50 | 0.41 (10.3%) | cheapest entry price in Ghana |
| Telecel 10GB | 41.00 | 3.20 (8.7%) | at street low, biggest % at scale |
| AirtelTigo 10GB | 42.00 | 3.18 (8.4%) | undercuts AT's own 43.70 |
| MTN 5GB | 22.50 | 1.66 (8.1%) | the one MTN size that still pays |
| MTN 10GB | 41.00 | 0.20 (0.5%) | volume anchor; market yourself on it, not margin |
| Telecel 50GB | 189.00 | 10.31 (5.9%) | highest cash per sale; dealer magnet |
| MTN 6GB | 27.00 | 2.27 (9.4%) | best MTN margin, low visibility |

**Tier 2 - fill in once Tier 1 sells** (margin fillers, 5-9% net):
MTN 4/8/15GB, AT 6/7/8/25GB, Telecel 15/20/25/30/35/40/45GB.

**Tier 3 - do not list at Base tier** (cost at or above street, or net < 1%):

- MTN 30/40/50GB, MTN 1GB (1.4%), MTN 10GB at 42.50 (0.5%)
- AT 20GB (cost 75.00 vs street 59.80 - 25% over), AT 30/40/50GB (negative net)
- Telecel 100GB (0.8% net)

> Note on MTN 1GB: it is the number everyone searches, so a **4.50** loss-leader is defensible for
> discovery. But it must be *stated as a loss leader* in the plan, not priced as if it is profit.
> Never discount it to 4.49 "to win": that is below cost before the fee.

---

## 6. The real problem is tier, not price

The agent tier ladder (from the dashboard's public announcement):

| Tier | Total sales | Agent pricing |
|---|---|---|
| 1 Base | GHS 0 - 14,999 | standard (you are here) |
| 2 Bronze | GHS 15,000 - 49,999 | lower |
| 3 Silver | GHS 50,000 - 99,999 | lower again |
| 4 Gold Elite | GHS 100,000+ | lowest |

Every cedi of MTN margin you are missing at Base is a tier discount a Bronze agent already has.
So the strategic move is **not** to discount into the MTN floor (impossible), it is to **push volume
through the network where you already hold an edge - Telecel and AT small bundles - and climb**.

Two consequences for the plan:
- Price MTN *competitively but not suicidally*: it is there to make the shop look legitimate, and to
  convert searches. Do not chase MTN at Base tier.
- Make Telecel 5GB and AT 1GB the hero offers everywhere: homepage, WhatsApp status, share link.

---

## 7. Technical findings (both block the build)

### 7.1 The documented API host is broken - MEDIUM confidence, verify with owner

The API docs show base URL `https://jehucalapi.duckdns.org` (rendered, buggily, as `https://https://...`).
That host's TLS certificate is issued for **`oyeh.duckdns.org`** (subject CN, SAN list), so strict HTTPS
clients reject it with `ERR_TLS_CERT_ALTNAME_INVALID` - `curl`, Node `fetch`, and browsers will all refuse.

The host that actually works, and the one the storefront itself calls, is:

```
https://backend.jehucale-business.com
```

**Ask the owner which is canonical before you integrate.** Server-to-server calls (Node `fetch`) are
stricter than browsers here, so a "works in Chrome" answer is not sufficient evidence.

### 7.2 The public storefront catalogue is anonymous but CORS-less

This endpoint answers with **no API key**:

```
GET https://backend.jehucale-business.com/storefront/public/littleFlower
```

It returns the store's public catalogue - `storeUrl`, `storeWhatsappNumber`, `fullName`, `agentCode`,
`packages[]` - with `price` in **pesewas** (490 = GHS 4.90), plus `available` and `checkoutEnabled`.
A real response from your store:

```json
{"status":true,"statusCode":200,"message":"Store packages fetched successfully",
 "payload":{"store":{"storeUrl":"littleFlower","storeWhatsappNumber":"233531810252",
 "fullName":"Yussif Sare","agentCode":"AGT800"},
 "packages":[{"id":"b3254946-2084-4c4b-a092-19fe9bf43b6c","size":1,"network":"MTN",
 "type":"ISHARE","price":490,"available":true}],
 "afaProducts":[],"checkoutEnabled":true}}
```

But it sends **no `Access-Control-Allow-Origin` header**. That means:

- a **browser** on `littleshop` cannot `fetch()` it - the request is blocked by CORS;
- a **server** (a Next route handler on Workers, or a build step) **can** fetch it fine.

So blink must **proxy** the catalogue server-side (or simply link out to the storefront).
**Amended 2026-11-18:** the proxy was chosen and extended into the checkout path. blink fetches the
catalogue server-side (60 s cache) and its own server route calls Jehucal's anonymous
`POST /storefront/checkout` with `storeUrl: littleFlower`, so the order (and commission) stays on the
owner's store while the customer checks out in blink's UI and pays on the Paystack page Jehucal
returns. See `plan.md` §1.6. The CORS finding is unchanged and is *why* checkout must run server-side.

### 7.3 A cross-tenant data leak (report it; do not build on it)

```
GET https://backend.jehucale-business.com/storefront/orders/by-phone?phone=<ANY_PHONE>
```

is **unauthenticated and not scoped to the store in the URL**. Querying `littleFlower`'s own order page
with a phone number returned an order belonging to a *different* store (`Decenctsolutionsdatahub`),
including the customer's email address, that other store's WhatsApp number, and the amounts paid
and charged.

This is a tenant data leak. Do not build a "your orders" or phone lookup feature on it. Tell the Jehucal
owner. It is also a reason not to send customer phone numbers to that endpoint from blink at all.

### 7.4 The storefront checkout is anonymous too (verified 2026-11-18)

The same public surface that powers the Jehucal storefront includes:

```
POST https://backend.jehucale-business.com/storefront/checkout
{ "storeUrl": "littleFlower", "agentPackageId": "<package uuid>",
  "email": "you@example.com", "phone": "0531810252",
  "callbackUrl": "https://<shop>/checkout/return" }

201 { "status": true, "payload": { "authorization_url": "https://checkout.paystack.com/...",
                                   "reference": "store_<ts>_<hex>" } }

POST https://backend.jehucale-business.com/storefront/orders/reverify
{ "reference": "store_<ts>_<hex>" }
200 { "status": true, "payload": { "status": "FAILED", "message": "Payment did not succeed or is still pending" } }
```

- `phone` must be exactly the 10 national digits; a bad email returns `400 email must be an email`;
  a package that does not belong to the store returns `404`.
- `callbackUrl` is optional and is where Paystack returns the customer.
- Only **one `agentPackageId` per payment** — there is no multi-item checkout.
- Because the sale is attributed by `storeUrl`, the order and commission land on the owner's store even
  though the UI is blink's. blink's server route (`src/app/api/checkout/route.ts`) is the only
  caller; the API is CORS-less, so it must stay server-side.

---

## 8. Where the numbers came from, and what is still open

| Input | Source | Confidence |
|---|---|---|
| Your agent cost per SKU | Dashboard **Data Topup** (Base tier) + **Store > Packages** "Agent price" | **HIGH** |
| Your store price per SKU | **Store > Packages** "Store price" | **HIGH** |
| Live catalogue + pesewas format | `GET /storefront/public/littleFlower` | **HIGH** |
| AT BigTime official grid | `at.com.gh/bigtime-data`, press check 11 Nov 2026 | **HIGH** |
| Telecel 2Moorch official grid | Telecel bundle page + press check 11 Nov 2026 | **MEDIUM** |
| Competitor street prices | 6 reseller sites, 16-17 Nov 2026 (varies by promo/day) | **MEDIUM** |
| Paystack fee 1.95% | Public rate card; confirm on your plan | **MEDIUM** |

**Open questions for the owner:**
1. Is `backend.jehucale-business.com` the canonical API host, or is the `duckdns` one still used anywhere?
2. Does the **commission** path (storefront sale) or the **wallet** path (agent order) settle better for
   you, given tier thresholds? Worth a per-network calculation once you have a month of data.
3. Can a storefront toggle **partial availability** (some SKUs hidden, some shown) per network? The current
   payload suggests yes (`available` is per package).
4. Is there an agreed **minimum delivery SLA** (the store claims "under 30 min") that blink can state
   publicly, or does that depend on the aggregator?

## 9. Next action

The engineering path described here is now implemented: blink reads the live catalogue server-side
and runs its own checkout UI while the order is created on `littleFlower` through Jehucal's public
`/storefront/checkout` (plan §1.6, findings §7.4). The remaining blocker is stock, not code — only one
package is currently `available: true`, so enable more packages and set their store prices in the
Jehucal dashboard (Store > Packages) and they will appear on the site within a minute.
