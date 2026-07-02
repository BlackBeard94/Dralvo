// Minimal service worker — exists mainly to satisfy PWA installability
// (Chrome/Android requires an active SW with a fetch handler before it will
// fire `beforeinstallprompt`). Deliberately does NOT cache HTML, API
// responses, or JS/CSS bundles: this is a live trading/licensing product, so
// stale cached dashboard/pricing/license data would be actively wrong, and
// stale cached bundles would strand users on an old deploy. Only long-lived
// static brand icons are cached, so branding still shows instantly offline.
const CACHE_NAME = "dralvo-static-v1";
const STATIC_ASSETS = [
  "/brand/dralvo-icon-192.png",
  "/brand/dralvo-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
  // Everything else (pages, API calls, JS/CSS) passes straight through to the
  // network — no caching, so it can never go stale.
});
