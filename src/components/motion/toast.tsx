"use client";

import * as React from "react";
import { Check } from "lucide-react";

/**
 * Figma-style toast: a floating pill at the bottom centre with a volt icon
 * chip. One toast at a time, auto-dismisses, announced politely to screen
 * readers. Used for cart feedback ("Added to your bag", replacement notices).
 */

interface ToastContextValue {
  toast: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 2_400;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = React.useCallback((next: string) => {
    setMessage(next);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), TOAST_DURATION_MS);
  }, []);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] lg:bottom-5">
        {visible ? (
          <div
            key={message}
            className="pointer-events-auto absolute bottom-0 left-1/2 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink shadow-[0_15px_50px_rgba(0,0,0,0.2)] motion-safe:animate-toast-in"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-volt">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="truncate">{message}</span>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}