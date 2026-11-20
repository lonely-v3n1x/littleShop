"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Menu, MessageCircle } from "lucide-react";
import { CartButton } from "@/components/store/cart-button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SUPPORT_WHATSAPP_URL } from "@/lib/constants";

const NAV = [
  { href: "/#bundles", label: "Bundles" },
  { href: "/#services", label: "Services" },
  { href: "/#faq", label: "How it works" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-1.5">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger aria-label="Open menu" className="icon-button press md:hidden">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 gap-0 border-ink/10 bg-cream p-0">
              <SheetHeader className="border-b border-ink/10 px-6 py-5">
                <SheetTitle className="flex items-center gap-2.5 text-left">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-volt">
                    <Zap className="h-[18px] w-[18px] text-ink" aria-hidden="true" />
                  </span>
                  <span className="text-[22px] font-extrabold tracking-[-0.04em]">blink</span>
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="px-4 py-4">
                <ul className="space-y-1">
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          className="press flex min-h-12 items-center rounded-2xl px-4 text-lg font-bold text-ink transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                  <li>
                    <SheetClose asChild>
                      <a
                        href={SUPPORT_WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="press flex min-h-12 items-center gap-2 rounded-2xl px-4 text-lg font-bold text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MessageCircle className="h-5 w-5" aria-hidden="true" />
                        Support on WhatsApp
                      </a>
                    </SheetClose>
                  </li>
                </ul>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            aria-label="blink home"
            className="press flex items-center gap-2.5 rounded-full pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-volt">
              <Zap className="h-[18px] w-[18px] text-ink" aria-hidden="true" />
            </span>
            <span className="text-[22px] font-extrabold tracking-[-0.04em]">blink</span>
          </Link>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Support on WhatsApp"
            className="icon-button press hidden sm:grid"
          >
            <MessageCircle className="h-[19px] w-[19px]" aria-hidden="true" />
          </a>
          <CartButton />
        </div>
      </div>
    </header>
  );
}