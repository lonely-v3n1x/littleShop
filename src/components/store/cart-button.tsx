"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/cart-provider";

/**
 * Header cart pill (Figma style): ink pill with a volt count badge. The badge
 * only renders after the stored cart has hydrated, so server HTML and first
 * client paint never disagree. The badge pops when the count changes.
 */
export function CartButton() {
  const { count, hydrated } = useCart();
  return (
    <Link
      href="/store"
      aria-label={
        hydrated && count > 0
          ? `Open cart, ${count} item${count === 1 ? "" : "s"}`
          : "Open cart"
      }
      className="press relative grid h-11 min-w-11 place-items-center rounded-full bg-ink px-3.5 text-white transition-colors duration-200 hover:bg-grape focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
    >
      <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
      {hydrated && count > 0 ? (
        <span
          key={count}
          className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-volt px-1 text-[10px] font-extrabold text-ink motion-safe:animate-pop-in"
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}