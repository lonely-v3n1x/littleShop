import { PackageOpen } from "lucide-react";
import { JEHUCAL_STORE_URL, SUPPORT_WHATSAPP_URL } from "@/lib/constants";

/** A calm, intentional pause — not an error state. */
export function NoBundlesYet({
  title = "Nothing listed for this network yet.",
  body = "Pick another network, or message us on WhatsApp and we will tell you when this one is back.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="mt-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-background text-muted-foreground shadow-sm">
          <PackageOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-medium">{title}</p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <a
            href={JEHUCAL_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full px-2 text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open the Jehucal store
          </a>
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full px-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-1" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-muted" />
      ))}
    </ul>
  );
}
