"use client";

import * as React from "react";
import type { DataBundle, NetworkId } from "@/types";
import { networks, getNetworkById } from "@/features/data/networks";
import { NetworkSelector } from "@/components/store/network-selector";
import { BundleCard } from "@/components/store/bundle-card";
import { NoBundlesYet } from "@/components/store/empty-state";
import { Reveal } from "@/components/motion/reveal";

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
    <div id="bundles" aria-labelledby="bundles-title" className="scroll-mt-20">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <Reveal>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-volt">
                <span className="h-1.5 w-1.5 rounded-full bg-volt" aria-hidden="true" />
                Live catalogue
              </p>
              <h2
                id="bundles-title"
                className="text-4xl font-extrabold tracking-[-0.045em] sm:text-6xl"
              >
                Pick it. Pay. Done.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                Live prices from our Jehucal store. Every bundle reaches the number you
                enter — yours or a friend&apos;s.
              </p>
            </div>
            {bundles.length > 0 ? (
              <NetworkSelector networks={networks} selected={selected} onSelect={setSelected} />
            ) : null}
          </div>
        </Reveal>

        {bundles.length === 0 ? (
          <NoBundlesYet
            tone="dark"
            title="No bundles are live yet"
            body="Our storefront is being stocked. Check the Jehucal store for what is available now, or message us on WhatsApp."
          />
        ) : (
          <>
            <div className="mt-10 flex items-baseline justify-between gap-3 border-b border-white/10 pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold">
                {network ? (
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: network.brandColor }}
                  />
                ) : null}
                {network?.name ?? "Network"} bundles
              </h3>
              <p className="text-xs tabular-nums text-white/50">
                {networkBundles.length} available
              </p>
            </div>

            {networkBundles.length === 0 ? (
              <NoBundlesYet tone="dark" />
            ) : (
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {networkBundles.map((bundle, i) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    network={network}
                    onAdd={onAdd}
                    added={!!addedIds[bundle.id]}
                    delay={Math.min(i, 5) * 70}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}