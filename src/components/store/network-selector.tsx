"use client";

import type { Network, NetworkId } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Figma tab pills on the dark shop band: white/10 rail, volt active pill. */
export function NetworkSelector({
  networks,
  selected,
  onSelect,
}: {
  networks: Network[];
  selected: NetworkId;
  onSelect: (id: NetworkId) => void;
}) {
  return (
    <Tabs value={selected} onValueChange={(v) => onSelect(v as NetworkId)}>
      <TabsList
        aria-label="Choose the network your data bundle is for"
        className="grid h-12 w-full grid-cols-3 gap-1 rounded-full bg-white/10 p-1 sm:w-auto sm:min-w-max"
      >
        {networks.map((n) => (
          <TabsTrigger
            key={n.id}
            value={n.id}
            className="group h-10 gap-2 rounded-full px-4 text-sm font-bold text-white/55 transition-all duration-300 ease-spring data-[state=active]:bg-volt data-[state=active]:text-ink data-[state=active]:shadow-[0_6px_18px_rgba(215,255,70,0.25)]"
          >
            <span aria-hidden="true" className="relative grid h-2 w-2 place-items-center">
              <span
                className="absolute h-3.5 w-3.5 rounded-full opacity-0 motion-safe:animate-ping group-data-[state=active]:opacity-25"
                style={{ backgroundColor: n.brandColor }}
              />
              <span
                className="relative h-2 w-2 rounded-full ring-2 ring-white/25"
                style={{ backgroundColor: n.brandColor }}
              />
            </span>
            {n.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}