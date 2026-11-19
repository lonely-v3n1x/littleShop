"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info, Lock } from "lucide-react";
import type { DataBundle } from "@/types";
import { formatGhs } from "@/lib/money";
import { normaliseGhanaPhone, networkHintForE164 } from "@/lib/phone";
import { expiryLabel, formatDataMb } from "@/lib/data-size";
import {
  DELIVERY_PROMISE,
  JEHUCAL_STORE_URL,
  RECIPIENT_EMAIL_STORAGE_KEY,
  RECIPIENT_STORAGE_KEY,
  SUPPORT_WHATSAPP_URL,
} from "@/lib/constants";
import { getNetworkById } from "@/features/data/networks";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NETWORK_LABEL: Record<string, string> = { mtn: "MTN", telecel: "Telecel", at: "AT" };

/**
 * littleShop's own checkout UI, but not littleShop's own payment integration.
 *
 * On submit we POST to our server route, which creates the order on the owner's
 * Jehucal storefront and returns the Paystack URL that the Jehucal storefront
 * itself would use. Money and delivery stay with Jehucal (so the store earns its
 * commission); littleShop never sees a card number or a MoMo PIN.
 *
 * One bundle per payment is a Jehucal API constraint: /storefront/checkout takes
 * a single agentPackageId. The cart can hold several, but checkout starts one.
 */
export function CheckoutForm({
  bundles,
  bundleId,
}: {
  bundles: DataBundle[];
  bundleId?: string;
}) {
  const { lines, hydrated } = useCart();
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    try {
      const savedPhone = window.localStorage.getItem(RECIPIENT_STORAGE_KEY);
      const savedEmail = window.localStorage.getItem(RECIPIENT_EMAIL_STORAGE_KEY);
      if (savedPhone) setPhone(savedPhone);
      if (savedEmail) setEmail(savedEmail);
      if (savedPhone || savedEmail) setRemember(true);
    } catch {
      // Private mode: just start with empty fields.
    }
  }, []);

  const selectedFromUrl = bundleId
    ? bundles.find((bundle) => bundle.id === bundleId)
    : undefined;
  const onlyCartLine = hydrated && lines.length === 1 ? lines[0] : undefined;
  const selected =
    selectedFromUrl ??
    (onlyCartLine ? bundles.find((bundle) => bundle.id === onlyCartLine.bundleId) : undefined);
  const network = selected ? getNetworkById(selected.networkId) : undefined;

  const parsed = normaliseGhanaPhone(phone);
  const phoneExact = parsed.ok;
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const phoneError = touched && !phoneExact ? parsed.error : "";
  const emailError = emailTouched && !emailValid ? "Enter the email that should receive the receipt." : "";
  const hint = parsed.ok ? networkHintForE164(parsed.e164) : "unknown";
  const mismatch =
    parsed.ok &&
    hint !== "unknown" &&
    !!selected &&
    hint !== selected.networkId;

  const requestedMissing = !!bundleId && !selectedFromUrl;
  const waitingForCart = !hydrated && !bundleId;
  const cartHasMany = hydrated && !bundleId && lines.length > 1;
  const nothingToBuy = hydrated && !bundleId && lines.length === 0;

  async function onContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setEmailTouched(true);
    setError("");

    if (!selected) {
      setError("Choose a bundle before continuing.");
      return;
    }
    if (!parsed.ok) return;
    if (!emailValid) return;

    // Jehucal expects exactly the 10 national digits (e.g. 0531810252).
    const national = `0${parsed.e164.replace(/\D/g, "").slice(-9)}`;

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: selected.id,
          phone: national,
          email: email.trim(),
        }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        typeof (payload as { authorizationUrl?: unknown }).authorizationUrl !== "string"
      ) {
        const message =
          payload &&
          typeof payload === "object" &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "The payment page could not be created. Try again.";
        setError(message);
        setSubmitting(false);
        return;
      }

      try {
        if (remember) {
          window.localStorage.setItem(RECIPIENT_STORAGE_KEY, phone.trim());
          window.localStorage.setItem(RECIPIENT_EMAIL_STORAGE_KEY, email.trim());
        } else {
          window.localStorage.removeItem(RECIPIENT_STORAGE_KEY);
          window.localStorage.removeItem(RECIPIENT_EMAIL_STORAGE_KEY);
        }
      } catch {
        // Private mode: the handoff still works, we just cannot remember the details.
      }

      window.location.assign((payload as { authorizationUrl: string }).authorizationUrl);
    } catch {
      setError("Could not reach the payment page. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (waitingForCart) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted" />
        <div className="h-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (requestedMissing) {
    return (
      <div className="mx-auto max-w-lg">
        <Alert variant="destructive">
          <AlertTitle>That bundle is not in the live store</AlertTitle>
          <AlertDescription>
            The price list comes straight from Jehucal, and this package is no longer available.
            <span className="mt-2 block">
              <Link href="/#bundles" className="font-medium underline underline-offset-4">
                Pick another bundle
              </Link>{" "}
              or{" "}
              <a
                href={JEHUCAL_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                open the storefront
              </a>
              .
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (nothingToBuy) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
        <p className="text-sm font-medium">Nothing to pay for yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a bundle and this page will carry it into checkout.
        </p>
        <Button asChild className="mt-4 h-11 rounded-full px-5">
          <Link href="/#bundles">Pick a bundle</Link>
        </Button>
      </div>
    );
  }

  if (cartHasMany) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Pick one bundle to pay for</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Jehucal checkout takes one bundle per payment. Start with one below; the rest stay in
            your cart.
          </p>
          <ul className="mt-4 divide-y divide-border">
            {lines.map((line) => (
              <li key={line.bundleId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{line.nameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatGhs(line.pricePesewasSnapshot)} each
                  </p>
                </div>
                <Link
                  href={`/checkout?bundle=${encodeURIComponent(line.bundleId)}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Buy this
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!selected) {
    // The cart is hydrated and has one line, but that package is no longer in
    // the live catalogue: say so instead of rendering an empty page.
    return (
      <div className="mx-auto max-w-lg">
        <Alert variant="destructive">
          <AlertTitle>That bundle is no longer in the live store</AlertTitle>
          <AlertDescription>
            The price list comes straight from Jehucal. Pick a bundle that is still listed.
            <span className="mt-2 block">
              <Link href="/#bundles" className="font-medium underline underline-offset-4">
                Back to the catalogue
              </Link>
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={onContinue} noValidate className="mx-auto max-w-lg space-y-4 pb-28 sm:space-y-5 sm:pb-0">
      <section aria-labelledby="order-title" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 id="order-title" className="text-base font-semibold">
          What you are buying
        </h2>

        <div className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{selected.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDataMb(selected.dataMb)}
              {selected.expiryType ? ` · ${expiryLabel(selected.expiryType)}` : ""} · 1 bundle
              {network ? ` · ${network.name}` : ""}
            </p>
          </div>
          <p className="shrink-0 text-xl font-bold tabular-nums">
            {formatGhs(selected.pricePesewas)}
          </p>
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm font-medium">Total</span>
          <span className="text-2xl font-bold tabular-nums">
            {formatGhs(selected.pricePesewas)}
          </span>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Prices are read live from the Jehucal store, in Ghana cedis. One bundle per payment.
        </p>
      </section>

      <section aria-labelledby="recipient-title" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 id="recipient-title" className="text-base font-semibold">
          Who gets the data
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The recipient does not have to be the number you pay with.
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-base sm:text-sm">
              Recipient phone number
            </Label>
            <Input
              id="recipient"
              name="recipient"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="054 123 4567"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-describedby="recipient-help"
              aria-invalid={phoneError ? true : undefined}
              className="h-12 rounded-xl px-4 text-base sm:text-sm"
            />
            <p id="recipient-help" className="text-xs text-muted-foreground">
              A Ghanaian number, with or without +233.
            </p>
            {phoneError ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {phoneError}
              </p>
            ) : null}
            {!phoneError && mismatch ? (
              <p className="text-xs text-muted-foreground">
                This looks like a {NETWORK_LABEL[hint]} prefix, and the bundle is{" "}
                {NETWORK_LABEL[selected.networkId]}. That usually works. Numbers can be ported, so
                continue if the owner says this is their line.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base sm:text-sm">
              Email for the receipt
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmailTouched(true)}
              aria-describedby="email-help"
              aria-invalid={emailError ? true : undefined}
              className="h-12 rounded-xl px-4 text-base sm:text-sm"
            />
            <p id="email-help" className="text-xs text-muted-foreground">
              Paystack sends the payment receipt here.
            </p>
            {emailError ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {emailError}
              </p>
            ) : null}
          </div>

          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={remember}
              aria-label="Remember these details on this phone"
              onChange={(event) => setRemember(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-input accent-primary"
            />
            <span>Remember these details on this phone.</span>
          </label>
        </div>
      </section>

      <section
        aria-labelledby="pay-title"
        className="rounded-2xl border border-secondary/60 bg-secondary/10 p-5"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-foreground">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="pay-title" className="text-base font-semibold">
              Pay on Paystack for Jehucal
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              littleShop places the order with Jehucal, our licensed data partner, and hands you to
              Paystack&rsquo;s secure page. littleShop never asks for your MoMo PIN or card details.
            </p>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Payment page did not open</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-4">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="h-12 w-full rounded-full text-base"
          >
            {submitting ? "Starting secure payment…" : "Continue to payment"}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            The order is placed in our Jehucal store, then Paystack handles payment.
          </p>
        </div>
      </section>

      <section aria-labelledby="assure-title" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 id="assure-title" className="text-base font-semibold">
          What to expect after you pay
        </h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Delivery</dt>
            <dd className="text-muted-foreground">
              Most orders land within minutes. Our promise is {DELIVERY_PROMISE}.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Wrong number</dt>
            <dd className="text-muted-foreground">
              No refunds for wrong numbers, so double-check the digits before you pay.
            </dd>
          </div>
          <div>
            <dt className="font-medium">No data after the promise?</dt>
            <dd className="text-muted-foreground">
              We follow up with Jehucal and make it right, including a refund where the order did
              not land.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Need a human?</dt>
            <dd className="text-muted-foreground">
              Message us on{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href={SUPPORT_WHATSAPP_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
              . Support is faster there than by email.
            </dd>
          </div>
        </dl>
      </section>
    </form>
  );
}
