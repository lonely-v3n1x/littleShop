"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CartSheet } from "@/components/store/cart-sheet";

/**
 * /store is the cart route: arriving there opens the sheet. Closing it means the
 * customer is done with the cart, so we go back to the shop instead of leaving a
 * blank page behind. The sheet is only mounted on this route.
 */
export function CartRouteSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(true);

  if (pathname !== "/store") return null;
  return (
    <CartSheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) router.push("/");
      }}
    />
  );
}
