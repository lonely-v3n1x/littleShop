"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Apple-style scroll reveal: children rise and settle into place when they
 * enter the viewport. Progressive enhancement — content is fully visible in
 * SSR HTML and without JS; the hidden state is only applied after mount, and
 * `prefers-reduced-motion` skips it entirely (see globals.css).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms (e.g. 60 * index for card grids). */
  delay?: number;
  as?: "div" | "li" | "section" | "span";
}) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    node.classList.add("reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}