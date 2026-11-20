"use client";

import { RefreshCw } from "lucide-react";

/** Reloads the current page — the offline shell's way back online. */
export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="primary-button mx-auto mt-8"
    >
      <RefreshCw className="h-5 w-5" aria-hidden="true" />
      Try again
    </button>
  );
}