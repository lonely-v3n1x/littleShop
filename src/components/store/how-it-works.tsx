import { Clock, MessageCircle, ShieldCheck, User } from "lucide-react";
import { DELIVERY_PROMISE } from "@/lib/constants";

const STEPS = [
  {
    icon: MessageCircle,
    title: "Pick a bundle",
    body: "Choose your network and the size you need. You see the full order before you pay.",
  },
  {
    icon: User,
    title: "Enter the number",
    body: "It can be yours or a friend's. Add the email for your receipt, then check the order.",
  },
  {
    icon: ShieldCheck,
    title: "Pay on Paystack",
    body: "We place the order in our Jehucal store and Paystack takes the payment. blink never sees your MoMo PIN or card.",
  },
  {
    icon: Clock,
    title: "Data arrives",
    body: `Most orders land within minutes, and our promise is ${DELIVERY_PROMISE}.`,
  },
] as const;

export function HowItWorks() {
  return (
    <section id="faq" aria-labelledby="how-title" className="container scroll-mt-20 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h2 id="how-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Four steps, no account needed. If anything goes wrong, message us on WhatsApp and we will
          sort it out.
        </p>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 sm:p-5"
            >
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
