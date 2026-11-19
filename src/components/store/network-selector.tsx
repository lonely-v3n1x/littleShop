"use client";

import type { Network, NetworkId } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        className="grid h-12 w-full grid-cols-3 gap-1 rounded-full bg-muted p-1 sm:w-auto sm:min-w-max"
      >
        {networks.map((n) => (
          <TabsTrigger
            key={n.id}
            value={n.id}
            className="group h-11 gap-2 rounded-full px-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <span aria-hidden="true" className="relative grid h-2 w-2 place-items-center">
              <span
                className="absolute h-3.5 w-3.5 rounded-full opacity-0 motion-safe:animate-ping group-data-[state=active]:opacity-25"
                style={{ backgroundColor: n.brandColor }}
              />
              <span
                className="relative h-2 w-2 rounded-full ring-2 ring-border"
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
