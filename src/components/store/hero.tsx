"use client";

import * as React from "react";
import { ArrowRight, Zap, Shield, Signal, Sparkles, Wifi } from "lucide-react";
import type { DataBundle } from "@/types";
import { getNetworkById } from "@/features/data/networks";
import { expiryLabel, formatDataMb } from "@/lib/data-size";
import { DELIVERY_PROMISE } from "@/lib/constants";

/**
 * Figma hero: cream paper, volt lime slab, grape data-pass card with the live
 * headline bundle. Ambient drift/float/twinkle motion plus a gentle scroll
 * parallax on the art — all disabled under prefers-reduced-motion.
 */
export function Hero({ bundles }: { bundles: DataBundle[] }) {
  const hero = bundles[0];
  const network = hero ? getNetworkById(hero.networkId) : undefined;
  const artRef = React.useRef<HTMLDivElement>(null);

  // Subtle Apple-style depth: the art drifts a little slower than the page.
  React.useEffect(() => {
    const node = artRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const offset = Math.min(window.scrollY * 0.06, 64);
        node.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const trust = [
    { icon: Shield, text: "Secure checkout" },
    { icon: Zap, text: "Instant delivery" },
    { icon: Signal, text: "MTN · Telecel · AT" },
  ];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid min-h-[640px] max-w-[1440px] items-center gap-12 overflow-hidden px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:py-20">
        <div className="relative z-10 max-w-[680px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3.5 py-2 text-xs font-bold uppercase tracking-[.14em] motion-safe:animate-rise-in">
            <span className="h-2 w-2 rounded-full bg-[#7bbf24]" /> Delivered in seconds
          </div>
          <h1 className="text-[clamp(3.4rem,7vw,7rem)] font-extrabold leading-[.87] tracking-[-.065em]">
            <span className="block motion-safe:animate-rise-in" style={{ animationDelay: "80ms" }}>
              Instant joy.
            </span>
            <span
              className="block text-grape motion-safe:animate-rise-in"
              style={{ animationDelay: "180ms" }}
            >
              Zero waiting.
            </span>
          </h1>
          <p
            className="mt-8 max-w-[550px] text-lg leading-relaxed text-ink/65 sm:text-xl motion-safe:animate-rise-in"
            style={{ animationDelay: "280ms" }}
          >
            Fast MTN, Telecel and AT data bundles, delivered straight to any Ghanaian
            number. Gift cards and more are on the way.
          </p>
          <div
            className="mt-9 flex flex-col gap-3 sm:flex-row motion-safe:animate-rise-in"
            style={{ animationDelay: "380ms" }}
          >
            <button type="button" onClick={() => scrollTo("bundles")} className="primary-button">
              Buy data <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => scrollTo("services")} className="secondary-button">
              Gift cards — soon
            </button>
          </div>
          <div
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-ink/60 motion-safe:animate-rise-in"
            style={{ animationDelay: "480ms" }}
          >
            {trust.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="h-[17px] w-[17px]" aria-hidden="true" /> {text}
              </span>
            ))}
          </div>
        </div>

        <div
          ref={artRef}
          className="hero-art relative mx-auto h-[440px] w-full max-w-[610px] sm:h-[560px]"
        >
          <div className="absolute left-[6%] top-[15%] h-[72%] w-[75%] rotate-[-7deg] rounded-[42px] bg-volt" />
          <div className="gift-visual absolute left-[12%] top-[8%] flex h-[72%] w-[74%] rotate-[5deg] flex-col rounded-[38px] border border-white/20 bg-grape p-7 text-white shadow-[0_35px_80px_rgba(42,22,98,.25)] sm:p-10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg font-extrabold">
                <Zap className="h-5 w-5" aria-hidden="true" /> blink
              </span>
              <Wifi className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
              <p className="text-sm font-semibold uppercase tracking-[.18em] text-white/60">
                {network ? `${network.name} data pass` : "Ghana data pass"}
              </p>
              <p className="mt-2 text-5xl font-extrabold tracking-[-.06em] sm:text-7xl">
                {hero ? formatDataMb(hero.dataMb) : "Data"}
              </p>
              <p className="mt-3 text-sm text-white/70 sm:text-base">
                {hero ? "Stay connected. Wherever you go." : "Live prices land here the moment the store stocks them."}
              </p>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/55">
                  {hero?.expiryType ? "VALID FOR" : "DELIVERY"}
                </p>
                <p className="mt-1 font-bold">
                  {hero?.expiryType ? expiryLabel(hero.expiryType).toUpperCase() : DELIVERY_PROMISE.toUpperCase()}
                </p>
              </div>
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-volt text-ink sm:h-14 sm:w-14">
                <span className="absolute inline-flex h-full w-full rounded-full bg-volt opacity-75 motion-safe:animate-ping" />
                <Zap className="relative h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="float-chip absolute bottom-[2%] right-[1%] rounded-2xl bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,.14)] sm:right-[3%]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-volt">
                <Zap className="h-5 w-5 text-ink" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink/50">Delivery time</p>
                <p className="font-extrabold">{DELIVERY_PROMISE}</p>
              </div>
            </div>
          </div>
          <span className="absolute right-[2%] top-[8%] text-coral motion-safe:animate-twinkle">
            <Sparkles className="h-14 w-14" aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  );
}