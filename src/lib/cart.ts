import type { CartLine, DataBundle } from "@/types";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

/**
 * Pure cart logic — the single place the one-bundle rule lives.
 *
 * Jehucal checkout takes ONE agentPackageId per payment, so the cart holds at
 * most one line. Adding a different bundle REPLACES the current one (the UI
 * announces the replacement); adding the same bundle increments its planning
 * quantity, capped at MAX_QTY_PER_LINE. Quantity never multiplies an order.
 *
 * Everything here is side-effect-free so it can be unit-tested directly.
 */

export interface AddResult {
  lines: CartLine[];
  /** The line that was replaced, when a different bundle was added. */
  replaced: CartLine | null;
}

function lineFromBundle(bundle: DataBundle): CartLine {
  return {
    bundleId: bundle.id,
    quantity: 1,
    nameSnapshot: bundle.name,
    pricePesewasSnapshot: bundle.pricePesewas,
    dataMbSnapshot: bundle.dataMb,
  };
}

/** Add a bundle under the one-bundle rule (auto-replace a different bundle). */
export function addBundle(lines: CartLine[], bundle: DataBundle): AddResult {
  if (!Number.isInteger(bundle.pricePesewas) || bundle.pricePesewas <= 0) {
    return { lines, replaced: null };
  }
  const existing = lines.find((line) => line.bundleId === bundle.id);
  if (existing) {
    return {
      lines: lines.map((line) =>
        line.bundleId === bundle.id
          ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QTY_PER_LINE) }
          : line,
      ),
      replaced: null,
    };
  }
  const replaced = lines.length > 0 ? lines[0] : null;
  return { lines: [lineFromBundle(bundle)], replaced };
}

export function removeLine(lines: CartLine[], bundleId: string): CartLine[] {
  return lines.filter((line) => line.bundleId !== bundleId);
}

/** Set a planning quantity; <= 0 removes the line. */
export function setQuantity(lines: CartLine[], bundleId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return removeLine(lines, bundleId);
  return lines.map((line) =>
    line.bundleId === bundleId
      ? { ...line, quantity: Math.min(Math.floor(quantity), MAX_QTY_PER_LINE) }
      : line,
  );
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Subtotal in pesewas, from add-time snapshots only. */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.pricePesewasSnapshot * line.quantity, 0);
}

/**
 * Sanitise persisted cart JSON. Drops malformed entries and enforces the
 * one-bundle rule on read, so a legacy multi-line cart collapses to its first
 * valid line instead of breaking checkout.
 */
export function parseStoredCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: CartLine[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const line = entry as Partial<CartLine>;
    if (
      typeof line.bundleId !== "string" ||
      typeof line.quantity !== "number" ||
      typeof line.nameSnapshot !== "string" ||
      typeof line.pricePesewasSnapshot !== "number"
    ) {
      continue;
    }
    lines.push({
      bundleId: line.bundleId,
      quantity: Math.max(1, Math.min(Math.floor(line.quantity), MAX_QTY_PER_LINE)),
      nameSnapshot: line.nameSnapshot,
      pricePesewasSnapshot: line.pricePesewasSnapshot,
      dataMbSnapshot:
        typeof line.dataMbSnapshot === "number" && Number.isFinite(line.dataMbSnapshot)
          ? line.dataMbSnapshot
          : 0,
    });
    if (lines.length === 1) break; // one bundle per payment
  }
  return lines;
}