"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { formatGhs } from "@/lib/money";
import { formatDataMb } from "@/lib/data-size";
import { MAX_QTY_PER_LINE } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * Mobile-first: opens from the bottom, the list scrolls inside the sheet and the
 * total + CTA sit in a footer that stays in the thumb zone.
 * Amounts come from the row snapshots taken at add-time, so a tariff change
 * mid-session cannot silently move the customer's total.
 *
 * Jehucal's checkout API takes ONE agentPackageId per payment, so the cart is a
 * saved list: each row gets a Buy link and the footer CTA only appears when
 * there is exactly one row to pay for.
 */

function QtyButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lines, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const onlyLine = lines.length === 1 ? lines[0] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto w-full max-w-xl gap-0 rounded-t-3xl p-0 sm:rounded-3xl">
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden"
        />
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-lg">Your cart</SheetTitle>
          <SheetDescription>
            {lines.length === 0
              ? "Your cart is empty."
              : "Saved here while you shop. Payment is handled by Paystack for Jehucal."}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="grid place-items-center gap-3 px-5 py-14 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Add a bundle from the catalogue and it will wait here.
            </p>
            <Button type="button" onClick={() => onOpenChange(false)} className="h-11 rounded-full px-5">
              Browse bundles
            </Button>
          </div>
        ) : (
          <>
            <ul className="max-h-[55dvh] min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 py-3">
              {lines.map((line) => (
                <li key={line.bundleId} className="flex items-start gap-2 rounded-xl px-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{line.nameSnapshot}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatGhs(line.pricePesewasSnapshot)} each
                      {line.dataMbSnapshot > 0 ? ` · ${formatDataMb(line.dataMbSnapshot)}` : ""}
                    </p>
                    <Link
                      href={`/checkout?bundle=${encodeURIComponent(line.bundleId)}`}
                      className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Buy this bundle
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <QtyButton
                      label={`Decrease ${line.nameSnapshot}`}
                      onClick={() => updateQuantity(line.bundleId, line.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </QtyButton>
                    <span className="w-7 text-center text-sm font-medium tabular-nums">
                      {line.quantity}
                    </span>
                    <QtyButton
                      label={`Increase ${line.nameSnapshot}`}
                      onClick={() => updateQuantity(line.bundleId, line.quantity + 1)}
                      disabled={line.quantity >= MAX_QTY_PER_LINE}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </QtyButton>
                  </div>

                  <QtyButton
                    label={`Remove ${line.nameSnapshot}`}
                    onClick={() => removeItem(line.bundleId)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </QtyButton>
                </li>
              ))}
            </ul>

            <SheetFooter className="mt-0 flex flex-col gap-3 border-t border-border bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-extrabold tabular-nums">{formatGhs(subtotal)}</span>
              </div>
              <Separator />

              {onlyLine ? (
                <Button asChild className="h-12 w-full rounded-full text-base">
                  <Link href={`/checkout?bundle=${encodeURIComponent(onlyLine.bundleId)}`}>
                    Continue to checkout
                  </Link>
                </Button>
              ) : (
                <Button type="button" disabled className="h-12 w-full rounded-full text-base">
                  Choose one bundle above to pay
                </Button>
              )}

              <p className="text-center text-[11px] leading-snug text-muted-foreground">
                Jehucal checkout takes one bundle per payment. Paystack handles the payment;
                blink never sees your MoMo PIN.
              </p>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Empty cart
                </button>
                <p className="text-right text-[11px] text-muted-foreground">
                  Quantity is a plan, not a multi-item order.
                </p>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
