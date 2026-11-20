"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartSheet } from "@/components/store/cart-sheet";

/**
 * /store is the cart route: arriving there opens the sheet. Closing it means the
 * customer is done with the cart, so we go back to the shop instead of leaving a
 * blank page behind. The sheet is only mounted on this route.
 *
 * The fallback below only renders while the sheet is closed (briefly, before
 * the redirect home) — never behind the open drawer. A <noscript> fallback on
 * the page itself covers script-less visitors.
 */
export function CartRouteSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(true);

  if (pathname !== "/store") return null;
  return (
    <>
      <CartSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) router.push("/");
        }}
      />
      {!open ? (
        <div className="container py-6">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Your cart lives in the drawer. Pick a bundle and check out from its page.
          </p>
          <Link
            href="/#bundles"
            className="mt-4 inline-flex min-h-11 items-center rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to the catalogue
          </Link>
        </div>
      ) : null}
    </>
  );
}