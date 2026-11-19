import { MessageCircle } from "lucide-react";
import { SUPPORT_INTL, SUPPORT_WHATSAPP_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-base font-semibold tracking-tight">blink</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Mobile data for Ghana. MTN, Telecel and AT bundles, delivered fast.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="space-y-2 text-sm">
            <li>
              <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#bundles">
                Bundles
              </a>
            </li>
            <li>
              <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#faq">
                How it works
              </a>
            </li>
            <li>
              <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href={SUPPORT_WHATSAPP_URL} rel="noopener noreferrer" target="_blank">
                Support on WhatsApp
              </a>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-4 font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {"+233 " + SUPPORT_INTL.slice(3, 5) + " " + SUPPORT_INTL.slice(5, 8) + " " + SUPPORT_INTL.slice(8)}
          </a>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            blink is an authorized reseller. All purchases are completed and delivered
            through our partner store, Jehucal.
          </p>
          <p>Prices in Ghana cedis. Pay by MoMo or card.</p>
        </div>
      </div>
    </footer>
  );
}
