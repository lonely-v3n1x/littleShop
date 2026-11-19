/**
 * blink — domain types (single source of truth).
 * Everything imports from `@/types`, never from `@/features/*`.
 *
 * Money is ALWAYS integer pesewas end-to-end: 1000 === GH₵10.00.
 * Never store cedis-as-float. Render only through `formatGhs` (lib/money.ts).
 *
 * Catalogue source of truth is the live Jehucal storefront
 * (`GET /storefront/public/littleFlower`), mapped in `features/data/catalogue.ts`.
 * We never invent a bundle id, size, network or price.
 */

export type NetworkId = "mtn" | "telecel" | "at";

export type ExpiryType = "non-expiry" | "daily" | "weekly" | "monthly" | "night" | "60-day" | "90-day";

export interface Network {
  id: NetworkId;
  name: string;
  /** hex — used ONLY as a dot / 2px border chip, never as a bg or text */
  brandColor: string;
  /** ink color on the brand strip behind the card's big number, or white */
  textOnColor: string;
  /** text placeholder until logos exist */
  logoText: string;
  active: boolean;
}

// Authoritative volume in MB. Display as GB when >= 1000.
export interface DataBundle {
  /**
   * The Jehucal agent-package UUID. It is the id we send to
   * `POST /storefront/checkout`, so using it here removes any guessing.
   */
  id: string;
  networkId: NetworkId;
  name: string;
  dataMb: number;
  /** Integer pesewas, straight from the storefront. Never a guess. */
  pricePesewas: number;
  /** Only set when the source actually states it; the live API does not, so it is optional. */
  expiryType?: ExpiryType;
  /** Raw Jehucal package `type` (e.g. ISHARE) for support/debugging, not customer copy. */
  packageType?: string;
  popular?: boolean;
  description?: string;
  /** ISO date the tariff was last verified (data is indicative!) */
  checkedAt?: string;
}

// The cart keeps one line per Jehucal package. Checkout is one package per
// payment (the storefront API takes a single agentPackageId), so quantity is a
// planning number only and never multiplies a Jehucal order.
export interface CartLine {
  bundleId: string;
  quantity: number;
  nameSnapshot: string;
  pricePesewasSnapshot: number;
  dataMbSnapshot: number;
}

export type ServiceStatus = "active" | "coming-soon" | "planned";
export interface Service {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  /** lucide icon NAME, resolved via lib/service-icon.tsx only */
  icon?: string;
  href?: string;
}

// ---- v2 (NOT implemented in v1) — recorded here so the direction is explicit ----
// export type ServiceId = "data" | "airtime" | "bills" | "gift-cards" | "subscriptions";
// export interface ProductRef { serviceId: ServiceId; productId: string; }
// Full multi-service cart = a Phase in v2; v1 must not attempt it.
