import type { DataBundle, NetworkId } from "@/types";
import { JEHUCAL_STORE_SLUG } from "@/lib/constants";
import { getNetworkById } from "./networks";

/**
 * Server-only Jehucal integration. The public catalogue and the checkout
 * endpoint are CORS-less, so they must be called from the server (Next route
 * handlers / server components), never from a browser component.
 *
 * The catalogue is the ONLY source of bundle ids, sizes and prices. If the
 * storefront does not return it, littleShop shows an empty state instead of
 * inventing a SKU.
 */

const API_BASE =
  process.env.JEHUCAL_API_BASE?.replace(/\/+$/, "") ??
  "https://backend.jehucale-business.com";

const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 12_000;

const NETWORK_MAP: Record<string, NetworkId> = {
  MTN: "mtn",
  TELECEL: "telecel",
  AIRTELTIGO: "at",
  AT: "at",
};

const NETWORK_ORDER: Record<NetworkId, number> = { mtn: 0, telecel: 1, at: 2 };

export interface StoreInfo {
  storeUrl: string;
  whatsapp: string | null;
  fullName: string | null;
  agentCode: string | null;
}

export interface Catalogue {
  store: StoreInfo;
  bundles: DataBundle[];
  fetchedAt: string;
}

export class JehucalError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "JehucalError";
    this.statusCode = statusCode;
  }
}

interface RawPackage {
  id?: unknown;
  size?: unknown;
  network?: unknown;
  type?: unknown;
  price?: unknown;
  available?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function dataSizeLabel(sizeGb: number): string {
  return `${Number.isInteger(sizeGb) ? sizeGb : Number(sizeGb.toFixed(2))}GB`;
}

function mapPackage(raw: RawPackage, checkedAt: string): DataBundle | null {
  if (raw.available !== true) return null;

  const id = asString(raw.id);
  const networkId = typeof raw.network === "string" ? NETWORK_MAP[raw.network] : undefined;
  const size = asFiniteNumber(raw.size);
  const price = asFiniteNumber(raw.price);

  // Only usable data packages on the three networks littleShop sells. Mashup /
  // minutes-based products (MTN_AFA_MASHUP, SPECIAL_MASHUP) are skipped until
  // the UI has a concept for them. `size` is GB and may be fractional (0.5 = 500 MB).
  if (!id || !networkId) return null;
  if (size === null || size <= 0 || size > 1024) return null;
  if (price === null || !Number.isInteger(price) || price <= 0) return null;

  const network = getNetworkById(networkId);
  return {
    id,
    networkId,
    name: `${network?.name ?? networkId} ${dataSizeLabel(size)} Data`,
    dataMb: Math.round(size * 1024),
    pricePesewas: price,
    packageType: asString(raw.type) ?? undefined,
    checkedAt,
  };
}

function parseCatalogueEnvelope(json: unknown): Record<string, unknown> {
  if (!isRecord(json) || json.status !== true || !isRecord(json.payload)) {
    const message =
      isRecord(json) && typeof json.message === "string"
        ? json.message
        : "The storefront catalogue did not return a usable response.";
    throw new JehucalError(message);
  }
  return json.payload;
}

let catalogueCache: { at: number; value: Catalogue } | null = null;

/** Fetch (and briefly memoise) the live storefront catalogue. */
export async function fetchCatalogue(options?: { fresh?: boolean }): Promise<Catalogue> {
  const now = Date.now();
  if (!options?.fresh && catalogueCache && now - catalogueCache.at < CACHE_TTL_MS) {
    return catalogueCache.value;
  }

  const url = `${API_BASE}/storefront/public/${encodeURIComponent(JEHUCAL_STORE_SLUG)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new JehucalError("Could not reach the storefront catalogue. Check the connection and try again.");
  }

  if (!response.ok) {
    throw new JehucalError(`The storefront catalogue returned HTTP ${response.status}.`);
  }

  const json: unknown = await response.json().catch(() => null);
  const payload = parseCatalogueEnvelope(json);

  const storeRaw = isRecord(payload.store) ? payload.store : {};
  const packages: unknown[] = Array.isArray(payload.packages) ? payload.packages : [];
  const checkedAt = new Date().toISOString();

  const seen = new Set<string>();
  const bundles = packages
    .map((entry) => (isRecord(entry) ? mapPackage(entry as RawPackage, checkedAt) : null))
    .filter((bundle): bundle is DataBundle => {
      if (!bundle) return false;
      if (seen.has(bundle.id)) return false;
      seen.add(bundle.id);
      return true;
    })
    .sort(
      (a, b) =>
        NETWORK_ORDER[a.networkId] - NETWORK_ORDER[b.networkId] || a.dataMb - b.dataMb,
    );

  const value: Catalogue = {
    store: {
      storeUrl: asString(storeRaw.storeUrl) ?? JEHUCAL_STORE_SLUG,
      whatsapp: asString(storeRaw.storeWhatsappNumber),
      fullName: asString(storeRaw.fullName),
      agentCode: asString(storeRaw.agentCode),
    },
    bundles,
    fetchedAt: checkedAt,
  };

  catalogueCache = { at: now, value };
  return value;
}

export function findBundle(catalogue: Catalogue, bundleId: string): DataBundle | undefined {
  return catalogue.bundles.find((bundle) => bundle.id === bundleId);
}

export interface CheckoutSession {
  authorizationUrl: string;
  reference: string;
}

/**
 * Create the order on the owner's Jehucal storefront and return the Paystack
 * URL its own checkout uses. The storeUrl + agentPackageId pair is what makes
 * the sale belong to `littleFlower`, so the commission lands on the owner's
 * balance exactly as if the customer had used the storefront directly.
 *
 * littleShop never sees a card number, a MoMo PIN or a payment webhook.
 */
export async function createCheckoutSession(input: {
  packageId: string;
  email: string;
  phone: string;
  callbackUrl: string;
}): Promise<CheckoutSession> {
  const url = `${API_BASE}/storefront/checkout`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        storeUrl: JEHUCAL_STORE_SLUG,
        agentPackageId: input.packageId,
        email: input.email,
        // The storefront API expects exactly the 10 national digits.
        phone: input.phone,
        callbackUrl: input.callbackUrl,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new JehucalError("Could not reach the payment provider. Try again in a moment.");
  }

  const json: unknown = await response.json().catch(() => null);

  if (!isRecord(json) || json.status !== true || !isRecord(json.payload)) {
    const message =
      isRecord(json) && typeof json.message === "string"
        ? json.message
        : "The payment page could not be created.";
    throw new JehucalError(message, response.status >= 400 ? response.status : 502);
  }

  const authorizationUrl = asString(json.payload.authorization_url);
  const reference = asString(json.payload.reference) ?? "";

  if (!authorizationUrl || !/^https:\/\//i.test(authorizationUrl)) {
    throw new JehucalError("The payment page did not return a usable link.");
  }

  return { authorizationUrl, reference };
}

export interface ReverifyResult {
  /** Jehucal's verdict: e.g. "SUCCESS", "FAILED", "PENDING". */
  status: string;
  message: string;
  orderId?: string;
  afaId?: string;
}

/** Ask Jehucal to re-check the Paystack reference after the customer returns. */
export async function reverifyOrder(reference: string): Promise<ReverifyResult> {
  const url = `${API_BASE}/storefront/orders/reverify`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ reference }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new JehucalError("Could not reach the storefront to confirm the payment.");
  }

  const json: unknown = await response.json().catch(() => null);

  if (!isRecord(json) || json.status !== true) {
    const message =
      isRecord(json) && typeof json.message === "string"
        ? json.message
        : "The payment could not be confirmed yet.";
    throw new JehucalError(message, response.status >= 400 ? response.status : 502);
  }

  const payload = isRecord(json.payload) ? json.payload : {};
  return {
    status: asString(payload.status)?.toUpperCase() ?? "UNKNOWN",
    message:
      typeof payload.message === "string"
        ? payload.message
        : "Payment checked with the storefront.",
    orderId: asString(payload.orderId) ?? undefined,
    afaId: asString(payload.afaId) ?? undefined,
  };
}
