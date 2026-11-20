import { ArrowRight, Gift } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

/**
 * Figma's purple gift-card band, repurposed as an honest teaser: gift cards
 * are a planned service (lib/services.ts), not something to buy yet. Keeps
 * the future add-ons visible and the brand feeling like a platform.
 */
export function GiftTeaser() {
  return (
    <section aria-labelledby="gift-title" className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <Reveal>
        <div className="relative mx-auto max-w-[1344px] overflow-hidden rounded-[32px] bg-grape px-7 py-14 text-white sm:px-14 sm:py-16 lg:flex lg:items-center lg:justify-between">
          <div className="relative z-10">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.16em] text-volt">
              <Gift className="h-4 w-4" aria-hidden="true" /> Coming soon
            </p>
            <h2
              id="gift-title"
              className="mt-4 max-w-2xl text-4xl font-extrabold tracking-[-.05em] sm:text-6xl"
            >
              The perfect gift is only a tap away.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/70">
              Digital gift cards, airtime top-ups and bill payments are joining the shop.
              Same instant checkout, same place you buy your data.
            </p>
          </div>
          <a
            href="#services"
            className="press mt-8 inline-flex h-14 shrink-0 items-center gap-3 rounded-full bg-volt px-7 font-extrabold text-ink transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(215,255,70,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:mt-0"
          >
            See what&apos;s coming <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </a>
          <span className="absolute -bottom-24 left-[55%] h-64 w-64 rounded-full border-[42px] border-white/10" />
        </div>
      </Reveal>
    </section>
  );
}