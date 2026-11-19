import type { Network, NetworkId } from "@/types";

/**
 * The three Ghanaian networks blink sells. Static because the network set
 * is a product decision, not a storefront value; brandColor is only ever a dot
 * or a 2px chip (never a background or text color).
 */
export const networks: Network[] = [
  { id: "mtn", name: "MTN", brandColor: "#FFCC00", textOnColor: "#1c1b18", logoText: "MTN", active: true },
  { id: "telecel", name: "Telecel", brandColor: "#E30613", textOnColor: "#ffffff", logoText: "Telecel", active: true },
  { id: "at", name: "AT", brandColor: "#00A651", textOnColor: "#ffffff", logoText: "AT", active: true },
];

export function getNetworkById(id: NetworkId): Network | undefined {
  return networks.find((n) => n.id === id);
}

export function getActiveNetworks(): Network[] {
  return networks.filter((n) => n.active);
}
