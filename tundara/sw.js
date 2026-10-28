/* ==========================================================================
   Tundara — service worker
   Strategy:
   · Precache the app shell + offline page on install
   · Navigations: network-first, fall back to cached page then offline.html
   · Static assets: stale-while-revalidate
   · Product imagery: cache-first (it never changes)
   ========================================================================== */
"use strict";

const VERSION = "td-v2.0.0";
const SHELL = VERSION + "-shell";
const RUNTIME = VERSION + "-runtime";
const IMAGES = VERSION + "-images";
const OFFLINE = "./offline.html";

const PRECACHE = [
  "./",
  "./index.html",
  "./shop.html",
  "./product.html",
  "./cart.html",
  "./checkout.html",
  "./order-success.html",
  "./account.html",
  "./wishlist.html",
  "./track.html",
  "./help.html",
  "./404.html",
  OFFLINE,
  "./manifest.webmanifest",
  "./assets/css/styles.css",
  "./assets/css/pages.css",
  "./assets/js/catalog.js",
  "./assets/js/app.js",
  "./assets/js/home.js",
  "./assets/js/shop.js",
  "./assets/js/product.js",
  "./assets/js/cart.js",
  "./assets/js/checkout.js",
  "./assets/js/order-success.js",
  "./assets/js/account.js",
  "./assets/js/wishlist.js",
  "./assets/js/track.js",
  "./assets/js/help.js",
  "./assets/js/404.js",
  "./assets/img/favicon.svg",
  "./assets/img/icon-192.svg",
  "./assets/img/lifestyle/delivery.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        // addAll fails the whole install if one entry 404s — add individually instead.
        Promise.all(
          PRECACHE.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => {})
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL, RUNTIME, IMAGES]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isImage(url) {
  return /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(url.pathname);
}

function isAsset(request, url) {
  return url.origin === self.location.origin && /\.(css|js|woff2?|ttf|otf|webmanifest)$/i.test(url.pathname);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  // Precached shell assets win so every release runs a matched set of code.
  const shell = await caches.open(SHELL);
  const precached = await shell.match(request);
  if (precached) return precached;
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return hit || (await network) || Response.error();
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const hit = (await cache.match(request)) || (await caches.match(request));
    if (hit) return hit;
    const offline = await caches.match(OFFLINE);
    return offline || new Response("You're offline.", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (fonts) hit the network

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isImage(url)) {
    event.respondWith(cacheFirst(request, IMAGES));
    return;
  }

  if (isAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
