"use client";

import * as React from "react";
import type { DataBundle, NetworkId } from "@/types";
import { networks, getNetworkById } from "@/features/data/networks";
import { NetworkSelector } from "@/components/store/network-selector";
import { BundleCard } from "@/components/store/bundle-card";
import { NoBundlesYet } from "@/components/store/empty-state";

export function BundleGrid({
  bundles,
  onAdd,
  addedIds,
}: {
  bundles: DataBundle[];
  onAdd: (bundle: DataBundle) => void;
  addedIds: Record<string, boolean>;
}) {
  const [selected, setSelected] = React.useState<NetworkId>(
    () => bundles[0]?.networkId ?? "mtn",
  );

  const network = getNetworkById(selected);
  const networkBundles = bundles.filter((bundle) => bundle.networkId === selected);

  return (
    <section id="bundles" aria-labelledby="bundles-title" className="container scroll-mt-20 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Live catalogue
        </div>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="bundles-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose your network
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              Live prices from our Jehucal store. Every bundle reaches the number you enter.
            </p>
          </div>
          {bundles.length > 0 ? (
            <NetworkSelector networks={networks} selected={selected} onSelect={setSelected} />
          ) : null}
        </div>

        {bundles.length === 0 ? (
          <NoBundlesYet
            title="No bundles are live yet"
            body="Our storefront is being stocked. Check the Jehucal store for what is available now, or message us on WhatsApp."
          />
        ) : (
          <>
            <div className="mt-8 flex items-baseline justify-between gap-3 border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-medium">
                {network ? (
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full ring-2 ring-border"
                    style={{ backgroundColor: network.brandColor }}
                  />
                ) : null}
                {network?.name ?? "Network"} bundles
              </h3>
              <p className="text-xs tabular-nums text-muted-foreground">
                {networkBundles.length} available
              </p>
            </div>

            {networkBundles.length === 0 ? (
              <NoBundlesYet />
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
                {networkBundles.map((bundle, i) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    network={network}
                    onAdd={onAdd}
                    added={!!addedIds[bundle.id]}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
