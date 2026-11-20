"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { useToast } from "@/components/motion/toast";

/**
 * PWA plumbing (production only):
 *  - registers /sw.js (offline shell + immutable asset cache; checkout/API
 *    are never cached — see public/sw.js),
 *  - surfaces a toast when a new version is waiting,
 *  - offers a dismissible "Install blink" pill when the browser fires
 *    beforeinstallprompt (hidden once installed / in standalone mode).
 */

const INSTALL_DISMISS_KEY = "littleshop.install.dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function RegisterSW() {
  const { toast } = useToast();
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installVisible, setInstallVisible] = React.useState(false);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              toast("A new version of blink is ready — refresh when it suits you");
            }
          });
        });
      })
      .catch(() => {
        // SW registration can fail in private mode; the site still works.
      });
  }, [toast]);

  React.useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
    } catch {
      // ignore
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      if (dismissed) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
      setInstallVisible(true);
    };
    const onInstalled = () => {
      setInstallVisible(false);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstallVisible(false);
    }
    setInstallEvent(null);
  }

  function dismiss() {
    setInstallVisible(false);
    try {
      window.localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!installVisible) return null;
  return (
    <div className="fixed bottom-24 left-4 z-40 lg:bottom-5">
      <div className="flex items-center gap-2 rounded-full bg-ink py-2 pl-4 pr-2 text-white shadow-[0_15px_45px_rgba(0,0,0,0.3)] motion-safe:animate-toast-in">
        <button
          type="button"
          onClick={install}
          className="flex min-h-9 items-center gap-2 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
        >
          <Download className="h-4 w-4 text-volt" aria-hidden="true" />
          Install blink
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install suggestion"
          className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}