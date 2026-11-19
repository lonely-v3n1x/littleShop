"use client";

import { ShoppingBag } from "lucide-react";
import type { DataBundle, Network } from "@/types";
import { formatDataMb, expiryLabel } from "@/lib/data-size";
import { formatGhs } from "@/lib/money";

/** FigFeva-inspired data card. onAdd fires our add-to-cart; the real money
 * path stays with /checkout (Jehucal). */
export function BundleCard({
  bundle,
  network,
  onAdd,
  added = false,
}: {
  bundle: DataBundle;
  network?: Network;
  onAdd: (bundle: DataBundle) => void;
  added?: boolean;
}) {
  const size = formatDataMb(bundle.dataMb);

  return (
    <li className="product-card group">
      <div
        className="relative h-48 overflow-hidden rounded-[20px] p-6"
        style={{ backgroundColor: network?.brandColor, color: network?.textOnColor }}
      >
        {bundle.popular ? (
          <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-black">
            Most popular
          </span>
        ) : null}
        <p className="text-xl font-extrabold">{network?.name ?? "Network"}</p>
        <div className="absolute bottom-5 left-6">
          <p className="text-5xl font-extrabold tracking-[-.06em]">{formatDataMb(bundle.dataMb)}</p>
          {bundle.expiryType ? (
            <p className="mt-1 text-sm font-semibold opacity-70">
              {expiryLabel(bundle.expiryType)} validity
            </p>
          ) : null}
        </div>
        <span className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full border-[22px] border-white/20" />
      </div>
      <div className="flex items-center justify-between px-1 pb-1 pt-5">
        <div>
          <p className="text-sm text-white/45">Starting at</p>
          <p className="mt-1 text-xl font-extrabold">{formatGhs(bundle.pricePesewas)}</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(bundle)}
          aria-label={added ? `Add another ${size} bundle to cart` : `Add ${size} bundle to cart`}
          aria-pressed={added}
          className="add-button"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          <span>Add</span>
        </button>
      </div>
    </li>
  );
}
