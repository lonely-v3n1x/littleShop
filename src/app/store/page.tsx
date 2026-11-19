import type { Metadata } from "next";
import Link from "next/link";
import { CartRouteSwitch } from "@/components/store/cart-route-switch";

export const metadata: Metadata = {
  title: "Your cart — littleShop",
  robots: { index: false },
};

/**
 * /store is the cart's address: arriving here opens the drawer. The fallback
 * below is what a visitor (or a crawler) sees if the drawer cannot mount, so
 * the route is never a blank page. The drawer itself is portalled to <body>.
 */
export default function StorePage() {
  return (
    <>
      <CartRouteSwitch />
      <div className="container py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your cart opens in a drawer. If it did not open, your browser may have blocked the
          script that runs it. You can still pick a bundle and check out from its page.
        </p>
        <Link
          href="/#bundles"
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to the catalogue
        </Link>
      </div>
    </>
  );
}
