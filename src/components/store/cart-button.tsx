import Link from "next/link";
import { ShoppingBag } from "lucide-react";

/**
 * Header entry point into the cart. Intentionally static (no client cart state):
 * the cart count lives in the sheet, which is client-only and hydrated there, so
 * this button never disagrees with server HTML on first paint.
 */
export function CartButton() {
  return (
    <Link
      href="/store"
      aria-label="Open cart"
      className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">Cart</span>
    </Link>
  );
}
