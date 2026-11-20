import { PackageOpen } from "lucide-react";
import { JEHUCAL_STORE_URL, SUPPORT_WHATSAPP_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** A calm, intentional pause — not an error state. `tone="dark"` for the shop band. */
export function NoBundlesYet({
  title = "Nothing listed for this network yet.",
  body = "Pick another network, or message us on WhatsApp and we will tell you when this one is back.",
  tone = "light",
}: {
  title?: string;
  body?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="mt-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
      <div
        className={cn(
          "flex flex-col items-center rounded-3xl border border-dashed px-6 py-14 text-center",
          dark ? "border-white/20 bg-white/[.04]" : "border-border bg-muted/30",
        )}
      >
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full",
            dark ? "bg-white/10 text-white/70" : "bg-background text-muted-foreground shadow-sm",
          )}
        >
          <PackageOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className={cn("mt-4 text-base font-extrabold", dark ? "text-white" : "text-foreground")}>
          {title}
        </p>
        <p
          className={cn(
            "mt-1.5 max-w-sm text-sm leading-relaxed",
            dark ? "text-white/55" : "text-muted-foreground",
          )}
        >
          {body}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={JEHUCAL_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "press inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dark
                ? "bg-volt text-ink hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(215,255,70,0.3)]"
                : "bg-primary text-primary-foreground hover:-translate-y-0.5",
            )}
          >
            Open the Jehucal store
          </a>
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "press inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dark
                ? "border-white/25 text-white hover:bg-white/10"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-white/[.06]" />
      ))}
    </ul>
  );
}