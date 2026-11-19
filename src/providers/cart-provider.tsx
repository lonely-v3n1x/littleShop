"use client";

import * as React from "react";
import type { CartLine, DataBundle } from "@/types";
import { CART_STORAGE_KEY, MAX_QTY_PER_LINE } from "@/lib/constants";

/**
 * Frozen Core §0.7.4: never touch localStorage/window during render or module scope.
 * These two helpers are only ever called from inside an effect or an event handler.
 *
 * The cart stores snapshots, not catalogue lookups: a price change on the
 * storefront mid-session cannot silently move a customer's total. Checkout is
 * one Jehucal package per payment, so quantity is a planning number only.
 */
function readFromStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): CartLine[] => {
      if (!entry || typeof entry !== "object") return [];
      const line = entry as Partial<CartLine>;
      if (
        typeof line.bundleId !== "string" ||
        typeof line.quantity !== "number" ||
        typeof line.nameSnapshot !== "string" ||
        typeof line.pricePesewasSnapshot !== "number"
      ) {
        return [];
      }
      return [
        {
          bundleId: line.bundleId,
          quantity: Math.max(1, Math.min(Math.floor(line.quantity), MAX_QTY_PER_LINE)),
          nameSnapshot: line.nameSnapshot,
          pricePesewasSnapshot: line.pricePesewasSnapshot,
          dataMbSnapshot:
            typeof line.dataMbSnapshot === "number" && Number.isFinite(line.dataMbSnapshot)
              ? line.dataMbSnapshot
              : 0,
        },
      ];
    });
  } catch {
    return [];
  }
}

function writeToStorage(lines: CartLine[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage full/blocked: the in-memory cart still works for this session.
  }
}

interface CartContextValue {
  /** False until the stored cart has been read on the client; gate the badge on this. */
  hydrated: boolean;
  lines: CartLine[];
  count: number;
  /** Sum of line snapshots, in pesewas. */
  subtotal: number;
  addItem: (bundle: DataBundle) => void;
  removeItem: (bundleId: string) => void;
  updateQuantity: (bundleId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setLines(readFromStorage());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) writeToStorage(lines);
  }, [lines, hydrated]);

  const addItem = React.useCallback((bundle: DataBundle) => {
    if (!Number.isInteger(bundle.pricePesewas) || bundle.pricePesewas <= 0) return;
    setLines((prev) => {
      const existing = prev.find((line) => line.bundleId === bundle.id);
      if (!existing) {
        return [
          ...prev,
          {
            bundleId: bundle.id,
            quantity: 1,
            nameSnapshot: bundle.name,
            pricePesewasSnapshot: bundle.pricePesewas,
            dataMbSnapshot: bundle.dataMb,
          },
        ];
      }
      return prev.map((line) =>
        line.bundleId === bundle.id
          ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QTY_PER_LINE) }
          : line,
      );
    });
  }, []);

  const removeItem = React.useCallback((bundleId: string) => {
    setLines((prev) => prev.filter((line) => line.bundleId !== bundleId));
  }, []);

  const updateQuantity = React.useCallback((bundleId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.bundleId !== bundleId)
        : prev.map((line) =>
            line.bundleId === bundleId
              ? { ...line, quantity: Math.min(Math.floor(quantity), MAX_QTY_PER_LINE) }
              : line,
          ),
    );
  }, []);

  const clearCart = React.useCallback(() => setLines([]), []);

  // Money always comes from the snapshots taken at add-time (Frozen Core section 0.2).
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.pricePesewasSnapshot * line.quantity,
    0,
  );

  const value = React.useMemo<CartContextValue>(
    () => ({
      hydrated,
      lines,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [hydrated, lines, count, subtotal, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
