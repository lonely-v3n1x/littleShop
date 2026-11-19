"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { DataBundle } from "@/types";
import { useCart } from "@/providers/cart-provider";
import { formatGhs } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { BundleGrid } from "@/components/store/bundle-grid";

/**
 * Owns the "added" affordance and the polite live region.
 * Adding does NOT force the cart sheet open: the primary path is Buy now,
 * and stealing focus after "add" is hostile on a 3G phone (plan section 1.4).
 *
 * On phones, a slim cart bar sits in the thumb zone once something is added,
 * so the shopper can reach checkout without scrolling back to the header.
 */
export function Storefront({ bundles }: { bundles: DataBundle[] }) {
  const { addItem, count, subtotal, hydrated } = useCart();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [announcement, setAnnouncement] = useState("");

  function handleAdd(bundle: DataBundle) {
    addItem(bundle);
    setAddedIds((prev) => ({ ...prev, [bundle.id]: true }));
    setAnnouncement(`${bundle.name} added to cart`);
  }

  const showCartBar = hydrated && count > 0;

  return (
    <>
      <BundleGrid bundles={bundles} onAdd={handleAdd} addedIds={addedIds} />

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {showCartBar ? <div aria-hidden="true" className="h-24 lg:hidden" /> : null}

      {showCartBar ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
          <div className="mx-auto max-w-xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-background/95 p-2 pl-4 shadow-xl shadow-foreground/10 backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tabular-nums">{formatGhs(subtotal)}</p>
                <p className="text-xs text-muted-foreground">
                  {count} bundle{count === 1 ? "" : "s"} in cart
                </p>
              </div>
              <Button asChild className="h-11 shrink-0 rounded-full px-5">
                <Link href="/store">
                  View cart
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
