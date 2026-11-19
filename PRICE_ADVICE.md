# Recommended price list (from `pricing-strategy.md` §3 rule + §4/§5 grids)

**Sources:** `pricing-strategy.md` (rule + recommended grid), live catalogue
(`GET https://backend.jehucale-business.com/storefront/public/littleFlower`, 2026-11-19).
Prices in GHS; grid to 0.50; agent costs in `pricing-strategy.md` §2.

**Current live MTN prices (all enabled today, 2026-11-19, after applying the recommended list):**
1GB 4.50, 2GB 9.00, 3GB 13.50, 4GB 18.00, 5GB 22.50, 6GB 27.00, 10GB 41.00.

## Tier 1 — enable first (doc-backed "hero offers", net ≈ 8.4–10.3%)

| SKU | List (GHS) | Net after 1.95% (GHS) | Net % |
|---|---|---|---|
| Telecel 5GB | 21.00 | 1.59 | 8.4% |
| AirtelTigo 1GB | 4.50 | 0.41 | 10.3% |
| Telecel 10GB | 41.00 | 3.20 | 8.7% |
| AirtelTigo 10GB | 42.00 | 3.18 | 8.4% |
| MTN 5GB | 22.50 | 1.66 | 8.1% |
| MTN 10GB | 41.00 | 0.20 | 0.5% (anchor) |
| Telecel 50GB | 189.00 | 10.31 | 5.9% |
| MTN 6GB | 27.00 | 2.27 | 9.4% |

## Tier 2 — fillers (margins 5–9%)

| SKU | List (GHS) |
|---|---|
| Telecel 15/20/25/30/35/40/45GB | 60.50/79/97.50/115.50/134/152/170.50 |
| MTN 8GB | 35.50 |
| MTN 15GB | 64.50 |
| AT 6/7/8/25GB | 26/30.50/34.50/104.00 |

## Tier 3 — do not list at Base tier (non-positive net / cost above street)

MTN 30/40/50GB, AT 20GB (cost 25% over street), AT 30/40/50GB, Telecel 100GB.

## Adjustments vs the live catalogue (set if you want lower margins to clear stock)

| SKU | Live | Recommended |
|---|---|---|
| MTN 1GB | 4.90 | 4.50 (floor; doc: THIN anchor) |
| MTN 2GB | 10.00 | 9.00 |
| MTN 3GB | 14.50 | 13.50 |
| MTN 4GB | 19.50 | 18.00 |
| MTN 5GB | 24.50 | 22.50 |
| MTN 6GB | 30.00 | 27.00 |
| MTN 10GB | 44.80 | 41.00 |

## Strategy notes (from the doc)

- MTN is for credibility + conversion, not profit — do not chase MTN at Base tier.
- Lead hero offers with **Telecel 5GB (21.00)** and **AT 1GB (4.50)**.
- Never list when net ≤ 0 after fees; keep price ≥ `cost + minAbs` (see §3 rule).
- Don't discount below the floor: note says 4.49 for MTN 1GB is "below cost before the fee" —
  floor is 4.35 + 0.15 = 4.50.

## How to apply (you or me)

Dashboard → Store → Packages: tick **Available** and set the **store price** for each SKU.
Live catalogue reflects changes within ~1 minute. The tables above are the reference list
to copy in; no credentials or authenticated session are needed in this repo.
