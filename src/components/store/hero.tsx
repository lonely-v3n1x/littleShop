"use client";

import { ArrowRight, Bolt, Globe, Shield, Sparkles, Wifi } from "lucide-react";
import type { DataBundle } from "@/types";
import { getNetworkById } from "@/features/data/networks";
import { expiryLabel, formatDataMb } from "@/lib/data-size";
import { DELIVERY_PROMISE } from "@/lib/constants";

/**
 * Figma-inspired hero: cream/lime/purple art card with the live headline bundle.
 * Keep it structural so future stylers can restyle it.
 */

export function Hero({ bundles }: { bundles: DataBundle[] }) {
  const hero = bundles[0];
  const network = hero ? getNetworkById(hero.networkId) : undefined;
  const validity = hero?.expiryType
    ? expiryLabel(hero.expiryType).toUpperCase()
    : "INSTANT";

  const trust = [
    { icon: Shield, text: "Secure checkout" },
    { icon: Bolt, text: "Instant delivery" },
    { icon: Globe, text: "30+ countries" },
  ];

  function scrollToShop() {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid min-h-[670px] max-w-[1440px] items-center gap-12 overflow-hidden px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:py-20">
        <div className="relative z-10 max-w-[680px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/60 px-3.5 py-2 text-xs font-bold uppercase tracking-[.14em]">
            <span className="h-2 w-2 rounded-full bg-[#7bbf24]" /> Delivered in seconds
          </div>
          <h1 className="text-[clamp(3.5rem,7vw,7rem)] font-extrabold leading-[.87] tracking-[-.065em]">
            Instant joy.
            <br />
            <span className="text-[#6d3bf5]">Zero waiting.</span>
          </h1>
          <p className="mt-8 max-w-[550px] text-lg leading-relaxed text-black/65 sm:text-xl">
            Top up your world with fast data bundles and digital gift cards, delivered straight
            to your phone.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={scrollToShop}
              className="flex h-14 items-center justify-center gap-3 rounded-full bg-[#181814] px-7 font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6d3bf5]"
            >
              Buy data <ArrowRight className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={scrollToShop}
              className="flex h-14 items-center justify-center rounded-full border border-black/20 px-7 font-extrabold transition-all hover:border-black hover:bg-white"
            >
              Shop gift cards
            </button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-black/60">
            {trust.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="h-[17px] w-[17px]" aria-hidden="true" /> {text}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-art relative mx-auto h-[470px] w-full max-w-[610px] sm:h-[560px]">
          <div className="absolute left-[6%] top-[15%] h-[72%] w-[75%] rotate-[-7deg] rounded-[42px] bg-[#d7ff46]" />
          <div className="gift-visual absolute left-[12%] top-[8%] h-[72%] w-[74%] rotate-[5deg] rounded-[38px] border border-white/20 bg-[#6d3bf5] p-7 text-white shadow-[0_35px_80px_rgba(42,22,98,.25)] sm:p-10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg font-extrabold">
                <Bolt className="h-5 w-5" aria-hidden="true" /> blink
              </span>
              <Wifi className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="mt-16 sm:mt-24">
              <p className="text-sm font-semibold uppercase tracking-[.18em] text-white/60">
                {network?.name ?? "Global"} data pass
              </p>
              <p className="mt-2 text-6xl font-extrabold tracking-[-.06em] sm:text-7xl">
                {hero ? formatDataMb(hero.dataMb) : "1 GB"}
              </p>
              <p className="mt-3 text-white/70">Stay connected. Wherever you go.</p>
            </div>
            <div className="absolute bottom-8 left-7 right-7 flex items-end justify-between sm:left-10 sm:right-10">
              <div>
                <p className="text-xs text-white/55">VALID FOR</p>
                <p className="mt-1 font-bold">{validity}</p>
              </div>
              <div className="relative grid h-14 w-14 place-items-center rounded-full bg-[#d7ff46] text-black">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#d7ff46] opacity-75 motion-safe:animate-ping" />
                <Globe className="relative h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="float-chip absolute bottom-[2%] right-[1%] rounded-2xl bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,.14)] sm:right-[3%]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d7ff46]">
                <Bolt className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-black/50">Delivery time</p>
                <p className="font-extrabold">{DELIVERY_PROMISE}</p>
              </div>
            </div>
          </div>
          <span className="absolute right-[2%] top-[8%] text-[#ff654b]">
            <Sparkles className="h-14 w-14" aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  );
}
