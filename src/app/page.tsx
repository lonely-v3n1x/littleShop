import { Hero } from "@/components/store/hero";
import { ServiceRail } from "@/components/store/service-rail";
import { Storefront } from "@/components/store/storefront";
import { HowItWorks } from "@/components/store/how-it-works";
import { GiftTeaser } from "@/components/store/gift-teaser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { JEHUCAL_STORE_URL } from "@/lib/constants";
import { fetchCatalogue } from "@/features/data/catalogue";
import type { DataBundle } from "@/types";

// The catalogue is read live from the owner's Jehucal storefront on each
// revalidation. Revalidate quickly and let the catalogue module cache act as
// the freshness check, so the price list stays current while pages are served
// from cache (better for SEO than force-dynamic).
export const revalidate = 300;

export default async function Home() {
  let bundles: DataBundle[] = [];
  let catalogueFailed = false;

  try {
    const catalogue = await fetchCatalogue();
    bundles = catalogue.bundles;
  } catch {
    catalogueFailed = true;
  }

  return (
    <>
      <Hero bundles={bundles} />
      <ServiceRail />
      {catalogueFailed ? (
        <section className="container py-10">
          <Alert variant="destructive">
            <AlertTitle>The live catalogue is not answering</AlertTitle>
            <AlertDescription>
              We could not read the price list from our Jehucal store just now. You can still{" "}
              <a
                href={JEHUCAL_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                open the storefront
              </a>{" "}
              or refresh this page in a moment.
            </AlertDescription>
          </Alert>
        </section>
      ) : (
        <Storefront bundles={bundles} />
      )}
      <HowItWorks />
      <GiftTeaser />
    </>
  );
}