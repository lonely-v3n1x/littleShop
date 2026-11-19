import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_WHATSAPP_URL } from "@/lib/constants";

const TRUST = [
  {
    icon: Clock,
    title: "Fast delivery",
    body: "Most orders land within minutes.",
  },
  {
    icon: BadgeCheck,
    title: "Authorized reseller",
    body: "Delivered through Jehucal, our verified partner.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payment",
    body: "Pay on Paystack. We never see your MoMo PIN.",
  },
] as const;

/** A quiet, staggered entrance — reduced-motion users just see the settled layout. */
const enter = "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_75%_at_12%_-8%,hsl(var(--primary)/0.11),transparent_58%),radial-gradient(60%_50%_at_100%_115%,hsl(var(--secondary)/0.09),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
      />

      <div className="container relative py-14 sm:py-20">
        <div
          className={`inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card/70 px-3 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur ${enter}`}
          style={{ animationDelay: "40ms" }}
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Live prices <span className="text-border">·</span> MTN, Telecel &amp; AT
        </div>

        <h1
          id="hero-title"
          className={`mt-6 max-w-2xl text-balance text-[2.5rem] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl ${enter}`}
          style={{ animationDelay: "90ms" }}
        >
          Mobile data for Ghana, in under a minute.
        </h1>

        <p
          className={`mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg ${enter}`}
          style={{ animationDelay: "140ms" }}
        >
          Pick a bundle, enter the number, and pay on Paystack&rsquo;s secure page. The order is
          placed in our Jehucal store, and the data follows.
        </p>

        <div
          className={`mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 ${enter}`}
          style={{ animationDelay: "190ms" }}
        >
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-full px-6 text-base shadow-md shadow-primary/10 transition-transform motion-safe:hover:-translate-y-0.5 sm:w-auto"
          >
            <Link href="#bundles">
              Buy data now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Link
            href="#faq"
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            How it works
          </Link>
        </div>

        <ul
          aria-label="Why littleShop"
          className={`mt-10 divide-y divide-border rounded-2xl border border-border bg-card/80 p-1 shadow-sm backdrop-blur sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0 ${enter}`}
          style={{ animationDelay: "240ms" }}
        >
          {TRUST.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-center gap-3 px-3 py-3 sm:px-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs leading-snug text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <p
          className={`mt-5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground ${enter}`}
          style={{ animationDelay: "290ms" }}
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Buying for a group?{" "}
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Chat with us on WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}
