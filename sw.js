/* =========================================================
   Morrow — offline service worker
   Precaches the app shell; keeps navigation and assets fresh
   without ever trapping the user on a stale build.
   ========================================================= */

const CACHE_VERSION = "morrow-v10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-maskable.svg",
  "./styles.css",
  "./dashboard.css",
  "./focus-planner.css",
  "./insights-settings.css",
  "./onboarding.css",
  "./responsive.css",
  "./core.js",
  "./views.js",
  "./app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.all(
          APP_SHELL.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => null)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navigations: network first so a fresh deploy shows up, cache as fallback.
  // Never cache an error response; a 502 from a proxy or a dead local server
  // must fall back to the last good shell instead of overwriting it.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          }
          if (response && response.status >= 500) {
            return caches
              .match(request)
              .then((cached) => (cached && cached.ok ? cached : caches.match("./index.html")))
              .then((shell) => (shell && shell.ok ? shell : response));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => (cached && cached.ok ? cached : caches.match("./index.html")))
            .then((shell) => shell || Response.error())
        )
    );
    return;
  }

  // Same-origin assets: cache first, then refresh quietly in the background.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Cross-origin (fonts): network first, cache fallback for offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
