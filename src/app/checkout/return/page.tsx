import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SUPPORT_WHATSAPP_URL, DELIVERY_PROMISE, JEHUCAL_STORE_URL } from "@/lib/constants";
import {
  reverifyOrder,
  type ReverifyResult,
} from "@/features/data/catalogue";

export const metadata: Metadata = {
  title: "Payment status — littleShop",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * Paystack sends the customer back here with ?reference=... (and ?trxref=...).
 * We ask Jehucal to re-check that reference server-side. No phone lookup and no
 * local order store are involved; the storefront remains the source of truth.
 */
export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string | string[]; trxref?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.reference ?? params.trxref;
  const reference = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  let result: ReverifyResult | null = null;
  let error = "";

  if (!reference) {
    error = "Paystack did not return a payment reference to this page.";
  } else if (reference.length > 200) {
    error = "That payment reference does not look right.";
  } else {
    try {
      result = await reverifyOrder(reference);
    } catch (caught) {
      error =
        caught instanceof Error
          ? caught.message
          : "The store could not confirm the payment yet.";
    }
  }

  return (
    <div className="container py-10 sm:py-14">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to littleShop
        </Link>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Payment status</h1>

        {result ? (
          result.status === "SUCCESS" ? (
            <div className="mt-8 rounded-2xl border border-primary/30 bg-accent/60 p-6 shadow-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-background text-primary shadow-sm">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-lg font-semibold">Payment confirmed</h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">{result.message}</p>
              {result.orderId ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Order reference:{" "}
                  <span className="font-mono font-medium text-foreground">{result.orderId}</span>
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Data usually lands within minutes, and our promise is {DELIVERY_PROMISE}. If it has
                not arrived, message us with the reference above.
              </p>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Message support on WhatsApp
              </a>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-secondary/70 bg-secondary/10 p-6 shadow-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-background text-foreground shadow-sm">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-lg font-semibold">Payment not confirmed yet</h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">{result.message}</p>
              {result.orderId ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Order reference:{" "}
                  <span className="font-mono font-medium text-foreground">{result.orderId}</span>
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                If you just paid, give it a minute and refresh this page. If you closed the
                Paystack page without paying, nothing was charged and you can start again.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/#bundles"
                  className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Start again
                </Link>
                <a
                  href={SUPPORT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Ask us to check
                </a>
              </div>
            </div>
          )
        ) : (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>We could not confirm the payment yet</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              {reference ? (
                <p className="mt-2 text-xs">
                  Reference: <span className="font-mono">{reference}</span>
                </p>
              ) : null}
              <p className="mt-2">
                This can take a minute while the payment settles. Refresh this page, or message us
                and we will check it with Jehucal.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {reference ? (
            <a
              href={`/checkout/return?reference=${encodeURIComponent(reference)}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Refresh status
            </a>
          ) : null}
          <a
            href={JEHUCAL_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open the Jehucal storefront
          </a>
        </div>
      </div>
    </div>
  );
}
