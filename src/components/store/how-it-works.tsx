import { Bolt, Clock, ShieldCheck, User } from "lucide-react";
import { DELIVERY_PROMISE } from "@/lib/constants";
import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  {
    icon: Bolt,
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

/** Figma "Why blink" layout: big statement left, feature tiles right. */
export function HowItWorks() {
  return (
    <section id="faq" aria-labelledby="how-title" className="scroll-mt-24">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-grape">
              How it works
            </p>
            <h2
              id="how-title"
              className="max-w-md text-4xl font-extrabold leading-[.98] tracking-[-.05em] sm:text-6xl"
            >
              No queues.
              <br />
              No scratch cards.
              <br />
              No drama.
            </h2>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-ink/55">
              Four steps, no account needed. If anything goes wrong, message us on
              WhatsApp and we will sort it out.
            </p>
          </Reveal>

          <ol className="grid gap-px overflow-hidden rounded-[30px] border border-ink/10 bg-ink/10 sm:grid-cols-2">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col bg-cream p-8 transition-colors duration-300 hover:bg-white sm:p-10">
                  <span className="relative grid h-12 w-12 place-items-center rounded-full bg-volt text-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-extrabold text-white ring-2 ring-cream">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-8 text-xl font-extrabold">{title}</h3>
                  <p className="mt-3 leading-relaxed text-ink/55">{body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}