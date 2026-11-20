import type { Metadata } from "next";
import { Zap } from "lucide-react";
import { RetryButton } from "@/components/pwa/retry-button";

export const metadata: Metadata = {
  title: "Offline — blink",
  robots: { index: false },
};

/**
 * The offline shell served by the service worker when a navigation fails.
 * Deliberately static: no catalogue fetch, no prices, no checkout — just the
 * brand, a calm explanation and a retry. The cart survives offline because it
 * lives in localStorage.
 */
export default function OfflinePage() {
  return (
    <div className="container grid min-h-[70dvh] place-items-center py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-volt">
          <Zap className="h-7 w-7 text-ink" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
          You&apos;re offline
        </h1>
        <p className="mt-3 leading-relaxed text-ink/60">
          blink needs a connection to load live prices and take payments. Your cart
          is saved on this device, so nothing is lost — reconnect and pick up where
          you left off.
        </p>
        <RetryButton />
        <p className="mt-6 text-xs text-ink/40">
          Tip: install blink to your home screen for the full app feel.
        </p>
      </div>
    </div>
  );
}