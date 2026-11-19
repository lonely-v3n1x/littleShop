"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import type { DataBundle } from "@/types";
import { formatGhs } from "@/lib/money";
import { expiryLabel, formatDataMb, isNightBundle } from "@/lib/data-size";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Hierarchy is deliberate: the price is the only bold numeral, the size is large
 * but lighter, expiry is a muted pill only when the source states one. Frozen
 * Core section 0.7.8: the brand color is a dot only, never a background/text.
 *
 * Two-column on phones (compact, stacked), one relaxed row at lg where the grid
 * narrows to a single reading column. The plus is the thumb-friendly primary
 * affordance; "Buy now" stays as a quieter route straight to checkout.
 */
export function BundleCard({
  bundle,
  networkName,
  brandColor,
  onAdd,
  added,
  index = 0,
}: {
  bundle: DataBundle;
  networkName: string;
  brandColor: string;
  onAdd: (bundle: DataBundle) => void;
  added: boolean;
  /** Optional, deterministic stagger offset for the entrance animation. */
  index?: number;
}) {
  const size = formatDataMb(bundle.dataMb);

  return (
    <li
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-[border-color,box-shadow,transform] hover:border-primary/30 hover:shadow-md focus-within:border-primary/50 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:hover:-translate-y-0.5 lg:flex-row lg:items-center lg:gap-6"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-center justify-between gap-2 lg:w-24 lg:shrink-0 lg:flex-col lg:items-start lg:gap-2">
        <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full ring-2 ring-border"
            style={{ backgroundColor: brandColor }}
          />
          {networkName}
        </span>
        {bundle.popular ? (
          <Badge
            variant="secondary"
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          >
            Popular
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 lg:mt-0 lg:flex lg:min-w-0 lg:flex-1 lg:items-baseline lg:gap-6">
        <p className="text-2xl font-semibold tracking-tight" title={size}>
          {size}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight lg:mt-0">
          {formatGhs(bundle.pricePesewas)}
        </p>

        {bundle.expiryType ? (
          <span className="mt-2 w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground lg:mt-0">
            {expiryLabel(bundle.expiryType)}
          </span>
        ) : null}

        {isNightBundle(bundle) ? (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground lg:max-w-48 lg:mt-0">
            Night data works 10pm&ndash;6am only. Please don&rsquo;t buy it for your main number.
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4 lg:mt-0 lg:shrink-0 lg:gap-3 lg:pt-0">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-11 -ml-2 gap-1 rounded-full px-2 text-sm font-medium text-muted-foreground hover:text-foreground lg:-ml-3"
        >
          <Link href={`/checkout?bundle=${encodeURIComponent(bundle.id)}`}>
            Buy now
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          type="button"
          onClick={() => onAdd(bundle)}
          aria-label={
            added
              ? `Add another ${size} bundle to cart`
              : `Add ${size} bundle to cart`
          }
          aria-pressed={added}
          className="h-11 w-11 shrink-0 rounded-full p-0 shadow-sm shadow-primary/20"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
