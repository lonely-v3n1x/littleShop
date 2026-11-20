"use client";

import { Check, ShoppingBag } from "lucide-react";
import type { DataBundle, Network } from "@/types";
import { formatDataMb, expiryLabel } from "@/lib/data-size";
import { formatGhs } from "@/lib/money";
import { Reveal } from "@/components/motion/reveal";

/**
 * Figma product card: network-coloured art slab with one bold numeral, price
 * below, white Add pill that flips to volt. onAdd fires our add-to-cart; the
 * real money path stays with /checkout (Jehucal).
 */
export function BundleCard({
  bundle,
  network,
  onAdd,
  added = false,
  delay = 0,
}: {
  bundle: DataBundle;
  network?: Network;
  onAdd: (bundle: DataBundle) => void;
  added?: boolean;
  delay?: number;
}) {
  const size = formatDataMb(bundle.dataMb);
  return (
    <Reveal as="li" delay={delay} className="product-card group">
      <div
        className="relative h-48 overflow-hidden rounded-[20px] p-6 transition-transform duration-300 ease-spring group-hover:scale-[1.015]"
        style={{ backgroundColor: network?.brandColor, color: network?.textOnColor }}
      >
        {bundle.popular ? (
          <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-black">
            Most popular
          </span>
        ) : null}
        <p className="text-xl font-extrabold">{network?.name ?? "Network"}</p>
        <div className="absolute bottom-5 left-6">
          <p className="text-5xl font-extrabold tracking-[-.06em]">{size}</p>
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
          <p className="mt-1 text-xl font-extrabold text-white">{formatGhs(bundle.pricePesewas)}</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(bundle)}
          aria-label={added ? `Add another ${size} bundle to cart` : `Add ${size} bundle to cart`}
          aria-pressed={added}
          className="add-button"
        >
          {added ? (
            <Check className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          )}
          <span>{added ? "Added" : "Add"}</span>
        </button>
      </div>
    </Reveal>
  );
}