"use client";

import * as React from "react";
import type { CartLine, DataBundle } from "@/types";
import { CART_STORAGE_KEY } from "@/lib/constants";
import {
  addBundle,
  cartCount,
  cartSubtotal,
  parseStoredCart,
  removeLine,
  setQuantity,
} from "@/lib/cart";

/**
 * Frozen Core §0.7.4: never touch localStorage/window during render or module
 * scope. Storage helpers run only inside an effect or an event handler.
 *
 * The cart stores snapshots, not catalogue lookups: a price change on the
 * storefront mid-session cannot silently move a customer's total.
 *
 * ONE-BUNDLE RULE: Jehucal checkout takes a single agentPackageId per payment,
 * so the cart holds at most one line. All the rule's logic lives in lib/cart.ts
 * (pure, unit-tested); adding a different bundle auto-replaces the current one.
 * Quantity is a planning number only and never multiplies an order.
 */
function readFromStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return parseStoredCart(JSON.parse(raw));
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
    setLines((prev) => addBundle(prev, bundle).lines);
  }, []);

  const removeItem = React.useCallback((bundleId: string) => {
    setLines((prev) => removeLine(prev, bundleId));
  }, []);

  const updateQuantity = React.useCallback((bundleId: string, quantity: number) => {
    setLines((prev) => setQuantity(prev, bundleId, quantity));
  }, []);

  const clearCart = React.useCallback(() => setLines([]), []);

  // Money always comes from the snapshots taken at add-time (Frozen Core §0.2).
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);

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