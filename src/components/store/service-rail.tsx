import { services } from "@/lib/services";
import { ServiceIcon } from "@/lib/service-icon";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

const STATUS_LABEL = { "coming-soon": "Coming soon", planned: "Planned" } as const;

/**
 * The platform rail: what blink sells today and what is coming next. Adding a
 * service to lib/services.ts automatically surfaces it here — the future
 * add-ons (airtime, bills, gift cards, subscriptions) are first-class citizens.
 */
export function ServiceRail() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-24">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-grape">The platform</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="services-title"
              className="text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl"
            >
              One shop. More coming.
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-ink/55">
              Data today; airtime, bills, gift cards and subscriptions next. Same fast
              checkout, same place.
            </p>
          </div>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {services.map((s, i) => {
            const active = s.status === "active";
            const giftish = s.id === "gift-cards";
            return (
              <Reveal as="li" key={s.id} delay={i * 70} className="h-full">
                {active ? (
                  <a
                    href={s.href ?? "/#bundles"}
                    aria-current="page"
                    className="press flex h-full min-h-36 flex-col rounded-3xl bg-ink p-5 text-white transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(24,24,20,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-volt text-ink">
                      <ServiceIcon name={s.icon ?? ""} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="mt-4 block text-base font-extrabold">{s.name}</span>
                    <span className="mt-1 block text-xs leading-snug text-white/60">
                      {s.description}
                    </span>
                    <span className="mt-auto pt-3 text-[10px] font-bold uppercase tracking-[.14em] text-volt">
                      Live now
                    </span>
                  </a>
                ) : (
                  <div
                    className={cn(
                      "flex h-full min-h-36 flex-col rounded-3xl border border-dashed border-ink/20 bg-white/60 p-5",
                      "transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-ink/35 hover:bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-full",
                        giftish ? "bg-grape/10 text-grape" : "bg-ink/5 text-ink/50",
                      )}
                    >
                      <ServiceIcon name={s.icon ?? ""} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="mt-4 block text-base font-extrabold text-ink/80">{s.name}</span>
                    <span className="mt-1 block text-xs leading-snug text-ink/50">{s.description}</span>
                    <span
                      className={cn(
                        "mt-auto w-fit pt-3 text-[10px] font-bold uppercase tracking-[.14em]",
                        s.status === "coming-soon" ? "text-grape" : "text-ink/40",
                      )}
                    >
                      {STATUS_LABEL[s.status as "coming-soon" | "planned"]}
                    </span>
                  </div>
                )}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}