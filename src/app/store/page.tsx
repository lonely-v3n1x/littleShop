import type { Metadata } from "next";
import { CartRouteSwitch } from "@/components/store/cart-route-switch";

export const metadata: Metadata = {
  title: "Your cart — blink",
  robots: { index: false },
};

/**
 * /store is the cart's address: arriving here opens the drawer (portalled to
 * <body>). The heading keeps the route meaningful for crawlers; the noscript
 * block covers visitors without JavaScript.
 */
export default function StorePage() {
  return (
    <>
      <CartRouteSwitch />
      <div className="container py-10">
        <h1 className="text-2xl font-extrabold tracking-tight">Your cart</h1>
        <noscript>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your cart opens in a drawer, which needs JavaScript. You can still pick a
            bundle and check out from its page.
          </p>
        </noscript>
      </div>
    </>
  );
}