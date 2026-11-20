/* blink service worker — offline shell + immutable asset caching.
 *
 * Hard rules:
 *  - NEVER cache /api/* or /checkout* (prices, payments and order status must
 *    always come from the network; a stale checkout could charge the wrong
 *    amount or show a wrong payment state).
 *  - Navigations are network-first with an offline fallback; live pages are
 *    not stored, so prices are never served stale from the shell.
 *  - Only hashed, immutable assets (/_next/static/*) and icons are cached.
 */

const VERSION = "v3";
const SHELL_CACHE = `blink-shell-${VERSION}`;
const ASSET_CACHE = `blink-assets-${VERSION}`;

const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Paths that must never be cached or served from cache. */
function isSensitive(pathname) {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/checkout")
  );
}

function isImmutableAsset(pathname) {
  return pathname.startsWith("/_next/static/") || pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App navigations (INCLUDING /checkout): network first, branded offline
  // shell as the fallback. Responses are never stored by the SW. Sensitive
  // navigations also bypass the browser HTTP cache so a stale checkout page
  // is never shown offline.
  if (request.mode === "navigate") {
    const networkFetch = isSensitive(url.pathname)
      ? fetch(request, { cache: "no-store" })
      : fetch(request);
    event.respondWith(
      networkFetch.catch(() =>
        caches.match(OFFLINE_URL).then(
          (offline) =>
            offline ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            }),
        ),
      ),
    );
    return;
  }

  // API and checkout subresources: network only, never cached, no fallback
  // (callers handle their own errors).
  if (isSensitive(url.pathname)) return;

  // Hashed static assets + icons: cache first, fill on miss.
  if (isImmutableAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
  // Everything else: plain network.
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});