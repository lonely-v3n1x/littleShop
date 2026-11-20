"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { DataBundle } from "@/types";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/components/motion/toast";
import { formatGhs } from "@/lib/money";
import { BundleGrid } from "@/components/store/bundle-grid";

/**
 * The shop band (Figma's dark "Pick it. Pay. Done." section). Owns the add
 * affordance: a toast pill + polite live region, never a forced sheet open —
 * stealing focus after "add" is hostile on a 3G phone.
 *
 * On phones, a slim cart bar sits in the thumb zone once something is added,
 * so the shopper can reach checkout without scrolling back to the header.
 */
export function Storefront({ bundles }: { bundles: DataBundle[] }) {
  const { addItem, lines, count, subtotal, hydrated } = useCart();
  const { toast } = useToast();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [announcement, setAnnouncement] = useState("");

  function handleAdd(bundle: DataBundle) {
    // One-bundle rule: a different bundle auto-replaces the current line.
    const prior = lines[0];
    const replaces = !!prior && prior.bundleId !== bundle.id;
    addItem(bundle);
    setAddedIds({ [bundle.id]: true });
    const message = replaces
      ? `${bundle.name} replaced ${prior.nameSnapshot} — one bundle per payment`
      : `${bundle.name} added to your bag`;
    setAnnouncement(message);
    toast(message);
  }

  const showCartBar = hydrated && count > 0;

  return (
    <section className="bg-ink text-white">
      <BundleGrid bundles={bundles} onAdd={handleAdd} addedIds={addedIds} />

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {showCartBar ? <div aria-hidden="true" className="h-24 lg:hidden" /> : null}

      {showCartBar ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
          <div className="mx-auto max-w-xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto flex items-center gap-3 rounded-3xl border border-white/10 bg-ink/95 p-2 pl-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-volt text-ink">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold tabular-nums">{formatGhs(subtotal)}</p>
                <p className="text-xs text-white/55">
                  {count} bundle{count === 1 ? "" : "s"} in cart
                </p>
              </div>
              <Link
                href="/store"
                className="press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-sm font-extrabold text-ink transition-colors hover:bg-volt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
              >
                View cart
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}