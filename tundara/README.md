# Tundara

**Everything you love. Delivered.**

Tundara is a complete, responsive marketplace storefront modelled on the best of modern African e-commerce. It is a hand-built, multi-page front-end with a zero-dependency Node server, 179 real products across 9 departments, a full cart and checkout flow, order tracking, accounts, a wishlist and an installable PWA experience.

> **Demo project.** Payments, accounts, reviews and orders are simulated in the browser. No real money moves, no server database is used, and no personal data leaves the device.

---

## Quick start

```bash
cd tundara
npm start
```

Open **http://localhost:4173**.

Any static file server works too, but `server.js` adds pretty URLs (`/shop`), a branded 404 fallback and correct MIME types.

```bash
# Optional: use a different port
PORT=4174 npm start
```

Requires Node.js 18 or newer. There are no npm dependencies to install.

---

## What's inside

### Storefront

- Editorial homepage with hero carousel, category rail, flash deals, trending products, curated collections, brand strip, testimonials and newsletter signup.
- Mega menu with departments, subcategories and featured picks.
- Predictive search with product thumbnails, categories, recent searches and popular queries.
- 7-currency switcher (NGN, USD, GHS, KES, ZAR, GBP, EUR) with live price conversion.
- Multi-region delivery selector for Nigeria, Ghana, Kenya and South Africa.
- Light and dark themes that persist between visits.
- Responsive layout with a mobile bottom navigation bar and off-canvas filters.

### Shopping

- 179 products across **Phones & Tablets, Computers & Laptops, Electronics & Audio, Home & Kitchen, Fashion, Beauty & Fragrance, Groceries, Sports & Outdoors, Watches & Jewellery**.
- Fast filtering by department, subcategory, brand, price, rating, free delivery and sale status.
- Six sort orders, adjustable page size, grid/list view and URL-synced state.
- Product pages with image gallery and zoom, variants (colour, size, storage, volume), stock, seller details, delivery estimates, specifications and reviews.
- Quick view, wishlist toggles, product comparison-friendly cards and a slide-out cart drawer.
- Star ratings, verified-buyer reviews and a "write a review" flow for signed-in shoppers.
- Recently viewed products and "you might also love" recommendations.

### Cart, checkout and orders

- Persistent cart with quantity controls, variant-level line items, stock limits and coupon validation.
- Three-step checkout: delivery → payment → review.
- Standard, express and click-and-collect delivery; card, bank transfer, mobile money and pay-on-delivery options.
- 7.5% VAT, delivery fees, free-shipping threshold and discount handling.
- Animated order confirmation with receipt, delivery estimate and tracking entry point.
- Order tracking with four-stage timelines, courier context and demo orders.
- Order history, re-order, printable receipts and status filters.

### Account

- Sign in / register flow with inline validation and social sign-in shortcuts (demo).
- Dashboard overview with spend, saved items and recent orders.
- Order history, saved addresses, wishlist, review management and account settings.
- Profile editing, password update, notification preferences and one-click sign-out.

### Platform polish

- Installable PWA with manifest, app shortcuts, shell caching, stale-while-revalidate assets, cache-first images and a branded offline page.
- Accessible focus states, skip link, ARIA labels, keyboard-operable menus, reduced-motion support and semantic landmarks.
- Toast notifications, skeleton loading states, empty states and friendly error handling.
- Live support chat widget with quick replies and a newsletter form.
- Fully responsive from 320px phones through to wide desktop displays.
- Print styles for receipts and order details.

---

## Demo guide

### Coupons

| Code | Offer | Minimum spend |
| --- | --- | --- |
| `TUN10` | 10% off your order | — |
| `WELCOME15` | 15% off | $20 |
| `FREESHIP` | Free delivery | $15 |
| `FLASH5` | $5 off | $10 |

Coupons are entered in the cart. Amounts are stored in USD and converted for display.

### Demo orders

Two demo orders are seeded on first visit and can be tracked without signing in:

| Order | Status |
| --- | --- |
| `TD-DEMO-4821` | Shipped |
| `TD-DEMO-1977` | Delivered |

Open **Track order** and enter either reference, or click the demo chips on the page.

### Accounts

The sign-in form is intentionally permissive in demo mode — use any valid email and a password of six or more characters. A pre-filled demo account is suggested on the form: **demo@tundara.com** / **demo1234**.

All state is saved in `localStorage`. To return to a clean first-run experience, clear site data for `localhost:4173` (or run `localStorage.clear()` in the console and reload).

---

## Project structure

```text
tundara/
├── index.html               Homepage
├── shop.html                Search and category listing
├── product.html             Product detail
├── cart.html                Basket and coupons
├── checkout.html            Three-step checkout
├── order-success.html       Confirmation and receipt
├── account.html             Auth, dashboard and settings
├── wishlist.html            Saved products
├── track.html               Order tracking
├── help.html                Help centre and FAQs
├── 404.html                 Branded not-found page
├── offline.html             PWA offline fallback
├── manifest.webmanifest     PWA manifest and shortcuts
├── sw.js                    Service worker and cache strategy
├── server.js                Zero-dependency static server
├── assets/
│   ├── css/                 Global and page styles
│   ├── js/
│   │   ├── catalog.js       Generated product, coupon and region data
│   │   ├── app.js           Shared shell, state, cart, search, modals, chat
│   │   ├── home.js          Homepage interactions
│   │   ├── shop.js          Filters, sorting and pagination
│   │   ├── product.js       Gallery, variants and reviews
│   │   ├── cart.js          Basket and coupon UI
│   │   ├── checkout.js      Checkout flow and order creation
│   │   ├── order-success.js Confirmation page
│   │   ├── account.js       Auth and account dashboard
│   │   ├── wishlist.js      Wishlist page
│   │   ├── track.js         Order tracking
│   │   ├── help.js          FAQ search
│   │   └── 404.js           Not-found helpers
│   └── img/
│       ├── products/        Locally hosted product imagery
│       ├── lifestyle/       Editorial imagery
│       ├── favicon.svg
│       └── icon-192.svg
└── tools/
    ├── build-catalog.mjs    Rebuilds catalog.js from source product data
    └── fetch-assets.mjs     Downloads product and lifestyle imagery
```

The page scripts share a single `window.TDApp` API from `app.js`: currency formatting, cart and wishlist state, auth, orders, toasts, modals, icons and layout injection. Header and footer markup live in one place, so every page stays in sync.

---

## Data and assets

- Product data is adapted from the public DummyJSON catalog and enriched with generated variants, specifications, sellers, delivery information and reviews.
- 940 product and lifestyle images are downloaded into `assets/img/` so the storefront stays fast and works without third-party image hosts.
- Prices are stored in USD and converted at display time. The free-shipping threshold is **$35** (converted for display).
- `tools/build-catalog.mjs` regenerates `assets/js/catalog.js`; `tools/fetch-assets.mjs` refreshes the local imagery.
- Fonts are loaded from Google Fonts. If the network is unavailable, the system font stack is used.

---

## PWA and offline mode

The service worker is registered automatically on every page.

- **Navigation:** network-first, falling back to the cached shell, then `offline.html`.
- **Assets:** stale-while-revalidate, so updates arrive on the next visit.
- **Images:** cache-first for instant repeat views.
- **Install:** use the browser's install prompt or the application menu.

After changing CSS, JavaScript or page markup, bump `VERSION` in `sw.js` (for example `td-v2.0.1`). Old shell, runtime and image caches are removed automatically on activation.

To test offline mode: load the site once, open DevTools → Application → Service Workers, enable **Offline**, then navigate to any cached page. The branded offline screen appears for uncached pages.

---

## Accessibility and performance notes

- Keyboard focus is visible throughout; menus, drawers and modals manage focus and close with `Escape`.
- Content is semantic and labelled, with a skip link and live regions for cart/search feedback.
- Motion respects `prefers-reduced-motion`.
- Images are lazy-loaded, responsive and served in WebP/JPEG where available.
- `prefers-color-scheme` sets the initial theme; a manual choice overrides it.

---

## Limitations

This is a front-end demonstration. There is no payment gateway, authentication server, inventory service or order database. Accounts and orders are device-local, email and chat responses are simulated, and product availability is illustrative. The included Node server is for local preview, not production hosting.
