import type { DataBundle, ExpiryType } from "@/types";

/** Authoritative MB -> display string. 1000 MB and up reads as GB ("1.5 GB"). */
export function formatDataMb(dataMb: number): string {
  if (dataMb >= 1000) {
    // Catalogue volumes are stored as whole GB (1 GB === 1024 MB), so divide by
    // 1024: 3072 MB must read "3 GB", never "3.1 GB".
    const gb = dataMb / 1024;
    return `${Number.isInteger(gb) ? gb : Number(gb.toFixed(1))} GB`;
  }
  if (Number.isInteger(dataMb)) return `${dataMb} MB`;
  return `${Number(dataMb.toFixed(1))} MB`;
}

const EXPIRY_LABELS: Record<ExpiryType, string> = {
  "non-expiry": "No expiry",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  night: "Night",
  "60-day": "60 days",
  "90-day": "90 days",
};

export function expiryLabel(expiryType: ExpiryType): string {
  return EXPIRY_LABELS[expiryType];
}

/** Night bundles are time-boxed off-peak offers and must never be summed with daytime MB. */
export function isNightBundle(b: DataBundle): boolean {
  return b.expiryType === "night";
}
