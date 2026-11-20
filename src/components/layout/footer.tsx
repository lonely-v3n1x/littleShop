import Link from "next/link";
import { Zap, MessageCircle } from "lucide-react";
import { SUPPORT_INTL, SUPPORT_WHATSAPP_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-cream">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-12">
        <div>
          <p className="flex items-center gap-2 text-ink">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-volt">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-[-0.04em]">blink</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/55">
            Mobile data for Ghana. MTN, Telecel and AT bundles, delivered fast.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2.5 text-sm font-semibold">
            <li>
              <Link className="text-ink/55 transition-colors hover:text-ink" href="/#bundles">
                Bundles
              </Link>
            </li>
            <li>
              <Link className="text-ink/55 transition-colors hover:text-ink" href="/#services">
                Services
              </Link>
            </li>
            <li>
              <Link className="text-ink/55 transition-colors hover:text-ink" href="/#faq">
                How it works
              </Link>
            </li>
            <li>
              <a
                className="text-ink/55 transition-colors hover:text-ink"
                href={SUPPORT_WHATSAPP_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
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
            className="press inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/15 bg-white px-5 font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-[0_10px_25px_rgba(24,24,20,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {"+233 " + SUPPORT_INTL.slice(3, 5) + " " + SUPPORT_INTL.slice(5, 8) + " " + SUPPORT_INTL.slice(8)}
          </a>
          <p className="mt-3 text-xs leading-relaxed text-ink/45">
            Real people, fast answers. WhatsApp is the quickest way to reach us.
          </p>
        </div>
      </div>
      <div className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-5 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
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