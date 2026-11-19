import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckoutForm } from "@/components/store/checkout-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { JEHUCAL_STORE_URL } from "@/lib/constants";
import { fetchCatalogue } from "@/features/data/catalogue";
import type { DataBundle } from "@/types";

export const metadata: Metadata = {
  title: "Buy data — littleShop",
  description: "Check your order. Payment is handled by Paystack for our Jehucal store.",
  robots: { index: false },
};

export const revalidate = 300;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ bundle?: string | string[] }>;
}) {
  const params = await searchParams;
  const bundleId = Array.isArray(params.bundle) ? params.bundle[0] : params.bundle;

  let bundles: DataBundle[] = [];
  let catalogueFailed = false;

  try {
    const catalogue = await fetchCatalogue();
    bundles = catalogue.bundles;
  } catch {
    catalogueFailed = true;
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to bundles
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Check your order</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          One quick look, then you&rsquo;ll pay on Paystack&rsquo;s secure page. The order itself is
          placed in our Jehucal store.
        </p>

        <div className="mt-6">
          {catalogueFailed ? (
            <Alert variant="destructive">
              <AlertTitle>The live catalogue is not answering</AlertTitle>
              <AlertDescription>
                We cannot confirm this bundle&rsquo;s price right now, so we will not start a
                payment. Refresh in a moment, or{" "}
                <a
                  href={JEHUCAL_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  open the storefront
                </a>
                .
              </AlertDescription>
            </Alert>
          ) : (
            <CheckoutForm bundles={bundles} bundleId={bundleId} />
          )}
        </div>
      </div>
    </div>
  );
}
