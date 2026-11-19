import { services } from "@/lib/services";
import { ServiceIcon } from "@/lib/service-icon";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL = { "coming-soon": "Coming soon", planned: "Planned" } as const;

export function ServiceRail() {
  return (
    <section aria-labelledby="services-title" className="container py-8 sm:py-10">
      <div className="flex items-end justify-between gap-4">
        <h2 id="services-title" className="text-xl font-semibold tracking-tight">
          What you can get here
        </h2>
        <p className="hidden text-sm text-muted-foreground sm:block">
          More services soon. One account, one shop.
        </p>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {services.map((s) => {
          const active = s.status === "active";
          return (
            <li key={s.id}>
              {active ? (
                <a
                  href={s.href ?? "/"}
                  aria-current="page"
                  className="flex h-full min-h-28 flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
                    <ServiceIcon name={s.icon ?? ""} className="h-4 w-4" />
                  </span>
                  <span className="mt-3 block text-sm font-medium">{s.name}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {s.description}
                  </span>
                </a>
              ) : (
                <div
                  className={cn(
                    "flex h-full min-h-28 flex-col rounded-2xl border border-dashed border-border bg-muted/20 p-4",
                    "text-muted-foreground",
                  )}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-muted">
                    <ServiceIcon name={s.icon ?? ""} className="h-4 w-4" />
                  </span>
                  <span className="mt-3 block text-sm font-medium text-foreground/80">{s.name}</span>
                  <span className="mt-0.5 block text-xs leading-snug">{s.description}</span>
                  <Badge
                    variant="outline"
                    className="mt-3 w-fit rounded-full text-[10px] font-medium text-muted-foreground"
                  >
                    {STATUS_LABEL[s.status as "coming-soon" | "planned"]}
                  </Badge>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
