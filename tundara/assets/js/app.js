/* ==========================================================================
   Tundara — application core
   ========================================================================== */
(function () {
  "use strict";

  const CATALOG = window.TUNDARA || { products: [], categories: [], currencies: [], regions: [], coupons: [] };
  const PRODUCTS = CATALOG.products;
  const CATEGORIES = CATALOG.categories;
  const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

  /* ---------------------------------------------------------------- */
  /* Icons                                                            */
  /* ---------------------------------------------------------------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    "user-check": '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 12.5-4.3"/><path d="m16 18 2 2 4-4"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h2.2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H5"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-up": '<path d="m18 15-6-6-6 6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "arrow-left": '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>',
    "arrow-down": '<path d="M12 5v14M6 13l6 6 6-6"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="7" rx="1.6"/><rect x="17" y="14" width="4" height="7" rx="1.6"/>',
    armchair: '<path d="M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4"/><path d="M3 11a2 2 0 0 1 2 2v2h14v-2a2 2 0 0 1 4 0v5H3v-5a2 2 0 0 1 0-2Z"/><path d="M5 18v3M19 18v3"/>',
    shirt: '<path d="m9 3-6 3 2.5 5L8 10v10h8V10l2.5 1L21 6l-6-3a4 4 0 0 1-6 0Z"/>',
    sparkles: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z"/>',
    basket: '<path d="m5 10 2 10h10l2-10H5Z"/><path d="M8 10 11 3M16 10 13 3"/><path d="M9 14v3M15 14v3"/>',
    dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
    watch: '<circle cx="12" cy="12" r="6"/><path d="M12 9v3l2 2M9 2h6M9 22h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
    star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.4l6.1-.9L12 3Z"/>',
    truck: '<path d="M3 6h11v11H3zM14 10h4l3 3v4h-7"/><circle cx="7" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.5 3 7.5 7.5 9 4.5-1.5 7.5-4.5 7.5-9V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    returns: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    "credit-card": '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/>',
    "map-pin": '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m3 6 9 7 9-7"/>',
    "phone-call": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    sort: '<path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    package: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    tag: '<path d="M20 13 13 20l-9-9V3h8l8 8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.5 0-3-2-5.5-3.5-7.5C14 6 13 4 13 2c-3 2-4.5 5.5-4 8-1-.5-2-1.5-2.5-2.5C5 10 5 12 5 14.5 5 19 7.5 22 12 22Z"/>',
    zap: '<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8C10 8 7 7.2 7 5a2.5 2.5 0 0 1 5 0c0 1.5 0 3 0 3ZM12 8c2 0 5-.8 5-3a2.5 2.5 0 0 0-5 0"/>',
    wallet: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H19v16H5.5A2.5 2.5 0 0 1 3 17.5v-11Z"/><path d="M3 8h16M16 12h3v4h-3a2 2 0 0 1 0-4Z"/>',
    bank: '<path d="m3 9 9-6 9 6M4 9h16M6 9v9M10 9v9M14 9v9M18 9v9M3 21h18"/>',
    mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4.5a8.3 8.3 0 0 1-1-4A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>',
    facebook: '<path d="M15 3h-3a4 4 0 0 0-4 4v3H5v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2V3Z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    twitter: '<path d="M4 4l16 16M20 4 4 20"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    "apple": '<path d="M16 3c-1.5.2-3 1.3-3.8 2.5-.7 1-1.3 2.6-1.1 4 1.6.1 3.3-.9 4.1-2.2.8-1.2 1.3-2.8.8-4.3Z"/><path d="M19 17c-.5 1.2-.8 1.8-1.5 2.8-1 1.5-2.4 3.4-4.1 3.4-1.5 0-1.9-1-4-1s-2.6 1-4 1c-1.8 0-3.1-1.8-4.1-3.3C-.4 16.2-.7 10 1.9 7.2 3 5.9 4.6 5 6.2 5c1.7 0 2.8 1.1 4.2 1.1 1.4 0 2.2-1.1 4.2-1.1 1.5 0 3 .8 4.1 2.2-3.6 2-3 7.2.3 9.8Z"/>',
    "google-play": '<path d="m4 3 12 9-12 9V3Z"/><path d="m4 3 8.5 6.4M4 21l8.5-6.4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    "badge-check": '<path d="m12 2 2.4 2.3 3.3-.3.5 3.3L21 9.7l-1.4 3 1.4 3-2.8 2-.5 3.3-3.3-.3L12 22l-2.4-2.3-3.3.3-.5-3.3L3 14.7l1.4-3L3 8.7l2.8-2 .5-3.3 3.3.3L12 2Z"/><path d="m9 12 2 2 4-4"/>',
    store: '<path d="M4 9v11h16V9"/><path d="M2 9l2-6h16l2 6a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2Z"/><path d="M9 20v-6h6v6"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "alert-circle": '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 17h.01"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    "sliders": '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  };

  function icon(name, cls) {
    return `<svg class="icon ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  }

  /* ---------------------------------------------------------------- */
  /* Storage + state                                                  */
  /* ---------------------------------------------------------------- */
  const K = {
    cart: "td_cart_v1",
    wishlist: "td_wishlist_v1",
    recent: "td_recent_v1",
    theme: "td_theme_v1",
    currency: "td_currency_v1",
    region: "td_region_v1",
    user: "td_user_v1",
    orders: "td_orders_v1",
    addresses: "td_addresses_v1",
    reviews: "td_reviews_v1",
    coupon: "td_coupon_v1",
    saved: "td_saved_v1",
    searches: "td_searches_v1",
    seeded: "td_seeded_v1",
    subscribed: "td_subscribed_v1",
  };
  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  };

  const defaults = {
    theme: load(K.theme, "light"),
    currency: load(K.currency, CATALOG.meta?.defaultCurrency || "NGN"),
    region: load(K.region, { city: "Lagos", state: "Lagos", country: "Nigeria" }),
    cart: (load(K.cart, []) || []).filter((i) => BY_ID.has(i.id)),
    wishlist: (load(K.wishlist, []) || []).filter((id) => BY_ID.has(id)),
    recent: (load(K.recent, []) || []).filter((id) => BY_ID.has(id)),
    saved: (load(K.saved, []) || []).filter((id) => BY_ID.has(id)),
    user: load(K.user, null),
    orders: load(K.orders, []),
    addresses: load(K.addresses, []),
    reviews: load(K.reviews, {}),
    coupon: load(K.coupon, null),
    searches: load(K.searches, []),
  };

  const state = { ...defaults, quickQty: 1, quickProduct: null };

  const emits = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  /* ---------------------------------------------------------------- */
  /* Money                                                            */
  /* ---------------------------------------------------------------- */
  const currencyMeta = () => CATALOG.currencies.find((c) => c.code === state.currency) || CATALOG.currencies[1];
  function money(usd) {
    const c = currencyMeta();
    const value = Number(usd) * c.rate;
    try {
      return new Intl.NumberFormat(c.locale, {
        style: "currency",
        currency: c.code,
        minimumFractionDigits: c.decimals,
        maximumFractionDigits: c.decimals,
      }).format(value);
    } catch (e) {
      return c.symbol + Math.round(value).toLocaleString();
    }
  }
  function refreshMoney(root) {
    (root || document).querySelectorAll("[data-usd]").forEach((el) => {
      const value = Number(el.dataset.usd);
      if (!Number.isNaN(value)) el.textContent = money(value);
    });
  }
  const freeShippingUSD = Number(CATALOG.meta?.freeShippingThreshold || 35);

  /* ---------------------------------------------------------------- */
  /* Product helpers                                                  */
  /* ---------------------------------------------------------------- */
  const getProduct = (id) => BY_ID.get(Number(id));
  const productUrl = (p) => `product.html?id=${p.id}`;
  const stars = (rating) => `<span class="stars" style="--rating:${Number(rating) || 0}" aria-label="${rating} out of 5 stars">★★★★★</span>`;
  const categoryOf = (slug) => CATEGORIES.find((c) => c.slug === slug);
  const variantDelta = (product, label) => {
    if (!product || !product.variants) return 0;
    for (const group of product.variants) {
      const found = group.options.find((o) => o.label === label);
      if (found) return Number(found.delta) || 0;
    }
    return 0;
  };
  const itemPrice = (item) => {
    const p = getProduct(item.id);
    return p ? p.price + (Number(item.delta) || 0) : 0;
  };
  const itemLabel = (item) => item.variant || "";

  /* ---------------------------------------------------------------- */
  /* Cart                                                              */
  /* ---------------------------------------------------------------- */
  const cartCount = () => state.cart.reduce((sum, i) => sum + i.qty, 0);
  const cartSubtotal = () => state.cart.reduce((sum, i) => sum + itemPrice(i) * i.qty, 0);
  const wishCount = () => state.wishlist.length;

  function persistCart() {
    save(K.cart, state.cart);
    refreshHeader();
    renderCartDrawer();
    emits("zm:cart", { cart: state.cart, count: cartCount(), subtotal: cartSubtotal() });
  }

  function addToCart(id, qty = 1, variant = null, opts = {}) {
    const p = getProduct(id);
    if (!p) return false;
    const label = variant || (p.variants?.[0]?.options?.[0]?.label ?? "");
    const delta = variantDelta(p, label);
    const existing = state.cart.find((i) => i.id === p.id && (i.variant || "") === label);
    const available = Math.max(1, p.stock || 99);
    if (existing) {
      existing.qty = Math.min(available, existing.qty + Number(qty));
    } else {
      state.cart.push({ id: p.id, qty: Math.min(available, Number(qty) || 1), variant: label, delta });
    }
    persistCart();
    if (!opts.silent) {
      toast("Added to basket", `${escapeHTML(p.title)}${label ? " · " + escapeHTML(label) : ""}`, "success");
      openCartDrawer();
    }
    return true;
  }

  function updateCartQty(id, variant, nextQty) {
    const item = state.cart.find((i) => i.id === Number(id) && (i.variant || "") === (variant || ""));
    if (!item) return;
    const p = getProduct(item.id);
    item.qty = Math.max(1, Math.min(p?.stock || 99, Number(nextQty) || 1));
    persistCart();
  }

  function removeFromCart(id, variant) {
    state.cart = state.cart.filter((i) => !(i.id === Number(id) && (i.variant || "") === (variant || "")));
    persistCart();
    toast("Removed from basket", "The item was removed.", "info");
  }

  function saveForLater(id, variant) {
    const item = state.cart.find((i) => i.id === Number(id) && (i.variant || "") === (variant || ""));
    if (!item) return;
    state.cart = state.cart.filter((i) => i !== item);
    if (!state.saved.includes(item.id)) state.saved.push(item.id);
    save(K.saved, state.saved);
    persistCart();
    toast("Saved for later", "Find it in your basket anytime.", "success");
  }

  function moveToCart(id) {
    state.saved = state.saved.filter((x) => x !== Number(id));
    save(K.saved, state.saved);
    addToCart(id, 1);
  }

  function clearCart() {
    state.cart = [];
    state.coupon = null;
    save(K.coupon, null);
    persistCart();
  }

  /* ---------------------------------------------------------------- */
  /* Wishlist                                                          */
  /* ---------------------------------------------------------------- */
  function inWishlist(id) { return state.wishlist.includes(Number(id)); }
  function toggleWishlist(id) {
    const p = getProduct(id);
    if (!p) return;
    if (inWishlist(id)) {
      state.wishlist = state.wishlist.filter((x) => x !== p.id);
      toast("Removed from wishlist", escapeHTML(p.title), "info");
    } else {
      state.wishlist.unshift(p.id);
      toast("Saved to wishlist", escapeHTML(p.title), "success");
    }
    save(K.wishlist, state.wishlist);
    refreshHeader();
    syncWishButtons();
    emits("zm:wishlist", { wishlist: state.wishlist });
  }
  function syncWishButtons() {
    document.querySelectorAll("[data-wish]").forEach((btn) => {
      const active = inWishlist(btn.dataset.wish);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.setAttribute("aria-label", active ? "Remove from wishlist" : "Save to wishlist");
    });
  }
  function clearWishlist() {
    if (!state.wishlist.length) return;
    state.wishlist = [];
    save(K.wishlist, []);
    refreshHeader();
    syncWishButtons();
    emits("zm:wishlist", { wishlist: [] });
  }

  /* ---------------------------------------------------------------- */
  /* Recently viewed                                                   */
  /* ---------------------------------------------------------------- */
  function pushRecent(id) {
    state.recent = [Number(id), ...state.recent.filter((x) => x !== Number(id))].slice(0, 12);
    save(K.recent, state.recent);
  }

  /* ---------------------------------------------------------------- */
  /* Totals / orders                                                   */
  /* ---------------------------------------------------------------- */
  function computeTotals(cart, coupon, deliveryFee) {
    const subtotal = cart.reduce((sum, i) => sum + itemPrice(i) * i.qty, 0);
    let discount = 0;
    const c = coupon && CATALOG.coupons.find((x) => x.code === coupon);
    if (c && subtotal >= (c.minSpend || 0)) {
      if (c.type === "percent") discount = subtotal * (c.value / 100);
      if (c.type === "fixed") discount = Math.min(c.value, subtotal);
    }
    let shipping = subtotal >= freeShippingUSD || subtotal === 0 ? 0 : 3.99;
    if (deliveryFee !== undefined && deliveryFee !== null) shipping = Number(deliveryFee);
    if (c && c.type === "shipping") shipping = 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * 0.075 * 100) / 100;
    const total = Math.max(0, subtotal - discount + shipping + tax);
    return {
      subtotal: round2(subtotal),
      discount: round2(discount),
      shipping: round2(shipping),
      tax,
      total: round2(total),
      freeShipping: shipping === 0,
      itemCount: cart.reduce((s, i) => s + i.qty, 0),
    };
  }
  const round2 = (n) => Math.round(n * 100) / 100;

  function applyCoupon(code) {
    const normalized = String(code || "").trim().toUpperCase();
    const coupon = CATALOG.coupons.find((c) => c.code === normalized);
    if (!coupon) return { ok: false, message: "That code isn’t valid. Try TUN10." };
    if (cartSubtotal() < (coupon.minSpend || 0)) {
      return { ok: false, message: `Spend at least ${money(coupon.minSpend)} to use ${coupon.code}.` };
    }
    state.coupon = coupon.code;
    save(K.coupon, state.coupon);
    emits("zm:coupon", { coupon: coupon.code });
    return { ok: true, coupon };
  }
  function removeCoupon() {
    state.coupon = null;
    save(K.coupon, null);
    emits("zm:coupon", { coupon: null });
  }

  function getOrders() { return load(K.orders, []); }
  function saveOrders(orders) { state.orders = orders; save(K.orders, orders); }
  function createOrder(payload) {
    const orders = getOrders();
    const order = {
      id: payload.id || "TD-" + Date.now().toString(36).slice(-6).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString(),
      status: "Processing",
      items: payload.items,
      totals: payload.totals,
      customer: payload.customer,
      address: payload.address,
      delivery: payload.delivery,
      payment: payload.payment,
      coupon: payload.coupon || null,
      history: [{ status: "Processing", date: new Date().toISOString(), note: "Order confirmed and payment received." }],
    };
    orders.unshift(order);
    saveOrders(orders);
    return order;
  }
  function getOrder(id) {
    const needle = String(id || "").trim().toUpperCase();
    return getOrders().find((o) => o.id.toUpperCase() === needle || o.id.toUpperCase().endsWith(needle));
  }
  function seedDemoOrders() {
    if (load(K.seeded, false)) return;
    const demo = [
      {
        id: "TD-DEMO-4821", status: "Shipped", daysAgo: 3,
        items: [{ id: 101, qty: 1, variant: "Silver", delta: 0 }, { id: 100, qty: 1, variant: "White", delta: 0 }],
        customer: { name: "Demo Shopper", email: "demo@tundara.com", phone: "+234 801 234 5678" },
        address: { name: "Demo Shopper", line: "12 Admiralty Way", city: "Lagos", state: "Lagos", country: "Nigeria", phone: "+234 801 234 5678" },
        delivery: { method: "standard", label: "Standard delivery", fee: 0, eta: "2–4 business days" },
        payment: { method: "card", label: "Card ending 4242" },
      },
      {
        id: "TD-DEMO-1977", status: "Delivered", daysAgo: 26,
        items: [{ id: 88, qty: 1, variant: "42", delta: 0 }, { id: 34, qty: 2, variant: "", delta: 0 }],
        customer: { name: "Demo Shopper", email: "demo@tundara.com", phone: "+234 801 234 5678" },
        address: { name: "Demo Shopper", line: "12 Admiralty Way", city: "Lagos", state: "Lagos", country: "Nigeria", phone: "+234 801 234 5678" },
        delivery: { method: "express", label: "Express delivery", fee: 5.99, eta: "1–2 business days" },
        payment: { method: "transfer", label: "Bank transfer" },
      },
    ];
    const existing = getOrders();
    const known = new Set(existing.map((o) => o.id));
    const seeded = demo
      .filter((d) => !known.has(d.id))
      .map((d) => {
        const totals = computeTotals(d.items, null, d.delivery.fee);
        const date = new Date(Date.now() - d.daysAgo * 86400000).toISOString();
        const shippedDate = new Date(Date.now() - (d.daysAgo - 1) * 86400000).toISOString();
        const deliveredDate = new Date(Date.now() - (d.daysAgo - 2) * 86400000).toISOString();
        const history =
          d.status === "Delivered"
            ? [
                { status: "Processing", date, note: "Order confirmed." },
                { status: "Shipped", date: shippedDate, note: "Handed to courier." },
                { status: "Delivered", date: deliveredDate, note: "Delivered to your address." },
              ]
            : [
                { status: "Processing", date, note: "Order confirmed." },
                { status: "Shipped", date: shippedDate, note: "Package is on its way to you." },
              ];
        return { ...d, date, history, totals, coupon: null };
      });
    if (seeded.length) saveOrders([...existing, ...seeded]);
    save(K.seeded, true);
  }

  /* ---------------------------------------------------------------- */
  /* Reviews                                                           */
  /* ---------------------------------------------------------------- */
  const REVIEWERS = [
    "Amaka O.", "Kwame A.", "Fatima B.", "Chinedu E.", "Zanele M.", "Tunde A.",
    "Amina Y.", "Kofi M.", "Ngozi U.", "Sipho D.", "Yaw B.", "Halima S.", "Ifeoma C.", "Juma K.",
  ];
  const REVIEW_TITLES = ["Exactly as described", "Great value for money", "Fast delivery", "Would buy again", "Impressive quality", "Better than expected"];
  const REVIEW_BODIES = {
    electronics: [
      "The sound quality is crisp and the battery easily lasts a full day. Pairing took seconds and the build feels premium.",
      "Arrived well packaged and works perfectly. Noise isolation is better than I expected at this price.",
      "I've been using it daily for two weeks — no complaints. The finish is lovely and it charges quickly.",
    ],
    phones: [
      "The screen is bright and sharp, and the camera handles low light surprisingly well. Battery life is solid.",
      "Upgraded from an older model and the difference is night and day. Fast, smooth and the finish is beautiful.",
      "Delivery was quick and the phone was sealed. Performance is excellent for the price.",
    ],
    computers: [
      "Boots in seconds and handles my design work without breaking a sweat. The display is gorgeous.",
      "Light enough to carry all day and the keyboard is comfortable. Battery gets me through a workday.",
      "Excellent build quality. It runs cool and quiet even with several apps open.",
    ],
    home: [
      "Sturdy, well finished and exactly the size I needed. It looks far more expensive than it costs.",
      "Easy to set up and use every day. Cleaning is simple and it still looks brand new.",
      "Lovely addition to my kitchen. The quality is solid and delivery was careful.",
    ],
    furniture: [
      "Assembly took under an hour and the result is beautiful. The fabric feels durable and the frame is solid.",
      "It transformed my living room. Comfortable, well made and delivered on time.",
    ],
    fashion: [
      "Fits true to size and the material feels good quality. I've already ordered another colour.",
      "The colour is exactly like the photos and the stitching is neat. Very happy with this purchase.",
      "Comfortable from the first wear. Packaging was neat and delivery was faster than expected.",
    ],
    beauty: [
      "Long-lasting and gentle on my skin. The scent is subtle and lovely — I'll repurchase.",
      "Great pigment and easy to blend. It lasted through a full day without fading.",
      "Beautiful packaging and the product feels luxurious. Good value for the size.",
    ],
    groceries: [
      "Fresh, well packed and delivered on time. Exactly what I ordered.",
      "Great quality for the price. The pack was sealed and everything arrived in perfect condition.",
      "My weekly staple. Reliable quality and quick delivery.",
    ],
    sports: [
      "Solid build and good grip. Used it for a full match and it held up perfectly.",
      "Great quality gear at a fair price. Arrived inflated and ready to use.",
    ],
    watches: [
      "Looks stunning in person — the finish is flawless and it keeps perfect time. The box presentation is excellent.",
      "A beautiful everyday piece. The strap is comfortable and the dial catches the light nicely.",
    ],
  };
  function generateReviews(product) {
    const bodies = REVIEW_BODIES[product.category] || REVIEW_BODIES.home;
    const count = 4;
    const reviews = [];
    for (let i = 0; i < count; i++) {
      const seed = product.id * 31 + i * 17;
      const rating = i === 0 ? 5 : i === 1 ? 5 : i === 2 ? 4 : (product.rating > 4.5 ? 5 : 4);
      const days = 2 + ((seed * 7) % 90);
      reviews.push({
        name: REVIEWERS[(seed + i) % REVIEWERS.length],
        rating,
        title: REVIEW_TITLES[(seed + i * 2) % REVIEW_TITLES.length],
        body: bodies[(seed + i) % bodies.length],
        date: new Date(Date.now() - days * 86400000).toISOString(),
        verified: true,
        helpful: 3 + ((seed * 3) % 40),
      });
    }
    const user = state.reviews[product.id] || [];
    return [...user.map((r) => ({ ...r, verified: true, mine: true })), ...reviews];
  }
  function addReview(productId, review) {
    if (!state.reviews[productId]) state.reviews[productId] = [];
    state.reviews[productId].unshift({ ...review, date: new Date().toISOString() });
    save(K.reviews, state.reviews);
    emits("zm:reviews", { productId });
  }
  function removeReview(productId, index) {
    if (!state.reviews[productId]) return;
    state.reviews[productId].splice(index, 1);
    if (!state.reviews[productId].length) delete state.reviews[productId];
    save(K.reviews, state.reviews);
    emits("zm:reviews", { productId: Number(productId) });
  }
  function ratingDistribution(product) {
    const r = product.rating;
    const five = Math.round(42 + (r - 3.9) * 38);
    const four = Math.round(30 - (r - 3.9) * 10);
    const three = Math.max(3, 100 - five - four - 4);
    return [five, four, three, 2, 1].map((pct, i) => ({ star: 5 - i, pct: Math.max(1, pct) }));
  }

  /* ---------------------------------------------------------------- */
  /* Product card                                                      */
  /* ---------------------------------------------------------------- */
  function productCard(p, opts = {}) {
    const lowStock = p.stock <= 14;
    const badge = p.badge ? `<span class="badge ${p.badge === "Flash Sale" ? "badge-flash" : p.badge === "New Arrival" ? "badge-new" : "badge-best"}">${icon(p.badge === "Flash Sale" ? "zap" : "star")} ${p.badge}</span>` : "";
    const save = `<button class="wish-btn ${inWishlist(p.id) ? "is-active" : ""}" data-wish="${p.id}" aria-label="${inWishlist(p.id) ? "Remove from wishlist" : "Save to wishlist"}" aria-pressed="${inWishlist(p.id)}">${icon("heart")}</button>`;
    return `<article class="product-card ${opts.className || ""}" data-id="${p.id}">
      <div class="product-media">
        <a href="${productUrl(p)}" aria-label="${escapeHTML(p.title)}">
          <img src="${p.image}" alt="${escapeHTML(p.title)}" width="300" height="300" loading="lazy">
        </a>
        <div class="product-badges">
          <span class="badge badge-sale">-${p.discount}%</span>
          ${badge}
        </div>
        ${save}
        <div class="quick-actions">
          <button class="quick-btn" data-quick="${p.id}" aria-label="Quick view ${escapeHTML(p.title)}">${icon("eye")} Quick view</button>
          <button class="quick-btn" data-add="${p.id}" aria-label="Add ${escapeHTML(p.title)} to basket">${icon("plus")} Add</button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-brand">${escapeHTML(p.brand)}</span>
        <a class="product-title" href="${productUrl(p)}">${escapeHTML(p.title)}</a>
        <div class="product-rating">
          ${stars(p.rating)}
          <b>${p.rating.toFixed(1)}</b>
          <span class="rating-count">(${Number(p.reviewCount).toLocaleString()})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price" data-usd="${p.price}">${money(p.price)}</span>
          <span class="product-old" data-usd="${p.oldPrice}">${money(p.oldPrice)}</span>
          <span class="product-off">-${p.discount}%</span>
          <button class="product-add" data-add="${p.id}" aria-label="Add ${escapeHTML(p.title)} to basket">${icon("plus")}</button>
        </div>
        ${p.flash && lowStock ? `<div class="stock-bar"><span style="width:${Math.min(92, 100 - (p.stock / 20) * 100)}%"></span></div><span class="product-sold">Only ${p.stock} left · ${Number(p.sold).toLocaleString()} sold</span>` : `<div class="product-meta"><span class="product-sold">${Number(p.sold).toLocaleString()} sold</span>${p.freeShipping ? `<span class="product-ship">${icon("truck")} Free delivery</span>` : ""}</div>`}
      </div>
    </article>`;
  }

  function skeletonCards(n) {
    return Array.from({ length: n }, () => `<div class="skeleton skeleton-card"></div>`).join("");
  }

  /* ---------------------------------------------------------------- */
  /* Header / drawers / footer                                         */
  /* ---------------------------------------------------------------- */
  const currentPage = document.body?.dataset.page || "home";

  function regionLabel() {
    return `${state.region.city}, ${state.region.country}`;
  }

  function headerHTML() {
    const cats = CATEGORIES;
    const navLinks = cats.slice(0, 8).map((c) => `<a class="nav-link ${currentPage === "shop" && new URLSearchParams(location.search).get("category") === c.slug ? "is-active" : ""}" href="shop.html?category=${c.slug}">${escapeHTML(c.short)}</a>`).join("");
    return `
    <div class="topbar">
      <div class="container">
        <div class="topbar-left">
          <label class="currency-select region-picker" title="Choose your delivery location">
            ${icon("map-pin")}
            <select id="regionSelect" aria-label="Delivery location">
              ${CATALOG.regions.map((r) => `<option value="${r.city}|${r.state}|${r.country}" ${state.region.city === r.city ? "selected" : ""}>${r.city}, ${r.country}</option>`).join("")}
            </select>
          </label>
          <div class="topbar-promo">
            <span class="dot"></span>
            <div class="promo-track">
              <div class="promo-item">Free delivery on orders over <span data-usd="${freeShippingUSD}" style="display:inline;margin-left:3px">${money(freeShippingUSD)}</span></div>
              <div class="promo-item">Genuine products · 7-day easy returns</div>
              <div class="promo-item">Pay with card, transfer or on delivery</div>
            </div>
          </div>
        </div>
        <div class="topbar-right">
          <a href="track.html" class="topbar-link">${icon("package")} Track order</a>
          <a href="help.html" class="topbar-link">${icon("help")} Help</a>
          <label class="currency-select">
            ${icon("globe")}
            <select id="currencySelect" aria-label="Currency">
              ${CATALOG.currencies.map((c) => `<option value="${c.code}" ${state.currency === c.code ? "selected" : ""}>${c.code} ${c.symbol}</option>`).join("")}
            </select>
          </label>
          <button class="theme-toggle" data-theme-toggle aria-label="Switch to dark mode">${icon("moon", "icon-moon")}${icon("sun", "icon-sun")}</button>
        </div>
      </div>
    </div>
    <div class="header-main">
      <div class="container header-inner">
        <button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="mobileDrawer">${icon("menu")}</button>
        <a class="brand" href="index.html">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 8h14l-1.1 12H6.1L5 8Z" fill="rgba(255,255,255,.16)"/>
              <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
              <path d="M9.2 12.2h5.6M12 12.2v7.2" stroke-width="2"/>
            </svg>
          </span>
          <span><span class="brand-name">tun<em>dara</em></span><span class="brand-tag">Shop happy</span></span>
          <span class="sr-only">— home</span>
        </a>
        <div class="header-search">
          <form class="search-bar" id="searchForm" role="search" autocomplete="off">
            <select class="search-cat" id="searchCategory" aria-label="Search in category">
              <option value="">All categories</option>
              ${CATEGORIES.map((c) => `<option value="${c.slug}">${escapeHTML(c.short)}</option>`).join("")}
            </select>
            <input class="search-input" id="searchInput" name="q" placeholder="Search for products, brands and more…" aria-label="Search products" aria-controls="searchHint">
            <button type="button" class="search-clear" id="searchClear" aria-label="Clear search">${icon("x")}</button>
            <button type="submit" class="search-submit" aria-label="Search">${icon("search")}<span>Search</span></button>
          </form>
          <div class="search-hint" id="searchHint" role="group" aria-label="Search suggestions"></div>
        </div>
        <div class="header-actions">
          <a href="account.html" class="header-action header-action-account" aria-label="Your account">
            ${icon("user")}
            <span class="header-action-text" aria-hidden="true"><small id="headerGreeting">${state.user ? "Hi, " + escapeHTML(state.user.name.split(" ")[0]) : "Hello, sign in"}</small><strong>Account</strong></span>
          </a>
          <a href="wishlist.html" class="header-action" data-wish-open aria-label="Wishlist, ${wishCount()} ${wishCount() === 1 ? "item" : "items"}">
            ${icon("heart")}<span class="header-count" data-wish-count>${wishCount()}</span>
            <span class="header-action-text" aria-hidden="true"><small>Saved items</small><strong>Wishlist</strong></span>
          </a>
          <button class="header-action cart-action" data-cart-open aria-label="Open basket, ${cartCount()} ${cartCount() === 1 ? "item" : "items"}">
            ${icon("cart")}
            <span class="header-count" data-cart-count>${cartCount()}</span>
            <span class="header-action-text" aria-hidden="true"><small>My basket</small><strong class="cart-total" data-cart-total>${money(cartSubtotal())}</strong></span>
          </button>
        </div>
      </div>
    </div>
    <nav class="cat-nav" aria-label="Shop categories">
      <div class="container cat-nav-inner">
        <button class="all-cats-btn" id="allCatsBtn" aria-expanded="false" aria-controls="megaMenu">${icon("grid")} All categories ${icon("chevron-down")}</button>
        <div class="nav-links">
          <a class="nav-link" href="shop.html?deals=1"><span class="nav-flame">${icon("flame")}</span> Flash Deals</a>
          ${navLinks}
        </div>
        <div class="nav-right">
          <a class="nav-link" href="help.html#sell">${icon("store")} Sell on Tundara</a>
          <a class="nav-link" href="help.html">Help center</a>
        </div>
      </div>
      <div class="mega" id="megaMenu">
        <div class="container">
          <div class="mega-grid">
            <div class="mega-aside">
              <h4>Shop by department</h4>
              ${CATEGORIES.map((c) => `<button class="mega-cat" data-mega="${c.slug}">${icon(c.icon)} ${escapeHTML(c.name)}</button>`).join("")}
            </div>
            <div class="mega-panels">
              ${CATEGORIES.map((c, i) => `
                <div class="mega-panel ${i === 0 ? "is-active" : ""}" data-panel="${c.slug}">
                  <div class="mega-col">
                    <h5>${escapeHTML(c.name)}</h5>
                    ${c.subs.map((s) => `<a href="shop.html?category=${c.slug}&sub=${encodeURIComponent(s)}">${escapeHTML(s)}</a>`).join("")}
                    <a href="shop.html?category=${c.slug}" style="color:var(--brand);font-weight:700;margin-top:6px">View all ${c.count} items →</a>
                  </div>
                  <div class="mega-col">
                    <h5>Top brands</h5>
                    ${[...new Set(PRODUCTS.filter((p) => p.category === c.slug).map((p) => p.brand))].slice(0, 6).map((b) => `<a href="shop.html?category=${c.slug}&brand=${encodeURIComponent(b)}">${escapeHTML(b)}</a>`).join("")}
                  </div>
                  <div class="mega-col">
                    <h5>Popular right now</h5>
                    ${PRODUCTS.filter((p) => p.category === c.slug).sort((a, b) => b.sold - a.sold).slice(0, 4).map((p) => `<a href="${productUrl(p)}">${escapeHTML(p.title.length > 30 ? p.title.slice(0, 30) + "…" : p.title)}</a>`).join("")}
                  </div>
                  ${megaPromo(c)}
                </div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    </nav>`;
  }

  function megaPromo(c) {
    return `<a class="mega-promo" href="shop.html?deals=1">
      <img src="${c.image}" alt="">
      <small style="font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;opacity:.8">Up to 45% off</small>
      <strong>${escapeHTML(c.short)} deals</strong>
      <p>Limited-time offers across ${escapeHTML(c.name.toLowerCase())}.</p>
      <span class="btn btn-white btn-sm">Shop deals ${icon("arrow-right")}</span>
    </a>`;
  }

  function drawerHTML() {
    return `
    <div class="drawer-overlay" id="overlay"></div>
    <aside class="mobile-drawer" id="mobileDrawer" aria-label="Menu" aria-hidden="true" inert>
      <div class="drawer-head">
        <a class="brand" href="index.html"><span class="brand-mark">${icon("bag")}</span><span class="brand-name">tun<em>dara</em></span></a>
        <button class="modal-close" data-close-layers aria-label="Close menu">${icon("x")}</button>
      </div>
      <div class="drawer-body">
        <div class="drawer-account">
          <span class="avatar">${state.user ? escapeHTML(state.user.name.charAt(0).toUpperCase()) : "Z"}</span>
          <div><span style="font-size:.7rem;color:var(--muted)">${state.user ? "Welcome back" : "Welcome to Tundara"}</span><strong style="display:block;font-size:.85rem">${state.user ? escapeHTML(state.user.name) : "Sign in to your account"}</strong></div>
          <a class="btn btn-soft btn-sm" style="margin-left:auto" href="account.html">${state.user ? "Account" : "Sign in"}</a>
        </div>
        <div class="drawer-section">
          <h4>Shop by department</h4>
          ${CATEGORIES.map((c) => `<a class="drawer-link" href="shop.html?category=${c.slug}">${icon(c.icon)} ${escapeHTML(c.name)} <span class="arrow">${icon("chevron-right")}</span></a>`).join("")}
        </div>
        <div class="drawer-section">
          <h4>My Tundara</h4>
          <a class="drawer-link" href="account.html#orders">${icon("package")} My orders</a>
          <a class="drawer-link" href="wishlist.html">${icon("heart")} Wishlist</a>
          <a class="drawer-link" href="cart.html">${icon("cart")} Basket</a>
          <a class="drawer-link" href="track.html">${icon("truck")} Track an order</a>
        </div>
        <div class="drawer-section">
          <h4>Help & settings</h4>
          <a class="drawer-link" href="help.html">${icon("help")} Help center</a>
          <a class="drawer-link" href="help.html#contact">${icon("chat")} Contact us</a>
          <a class="drawer-link" href="help.html#sell">${icon("store")} Sell on Tundara</a>
          <button class="drawer-link" data-theme-toggle>${icon("moon")} Dark mode <span class="arrow" data-theme-text>${state.theme === "dark" ? "On" : "Off"}</span></button>
          <div class="drawer-link" style="font-weight:500">${icon("map-pin")} Delivering to <strong style="margin-left:auto">${escapeHTML(regionLabel())}</strong></div>
        </div>
      </div>
    </aside>
    <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping basket" aria-hidden="true" inert>
      <div class="cart-drawer-head">
        <h3>${icon("cart")} My basket <span class="badge badge-soft" data-cart-count>${cartCount()}</span></h3>
        <button class="modal-close" data-close-layers aria-label="Close basket">${icon("x")}</button>
      </div>
      <div class="cart-drawer-body" id="cartDrawerBody"></div>
      <div class="cart-drawer-foot" id="cartDrawerFoot"></div>
    </aside>`;
  }

  function footerHTML() {
    const cols = [
      { title: "Shop", links: [["All departments", "shop.html"], ["Flash deals", "shop.html?deals=1"], ["New arrivals", "shop.html?sort=newest"], ["Best sellers", "shop.html?sort=popular"], ["Wishlist", "wishlist.html"]] },
      { title: "Customer service", links: [["Help center", "help.html"], ["Track your order", "track.html"], ["Delivery & shipping", "help.html#delivery"], ["Returns & refunds", "help.html#returns"], ["Contact us", "help.html#contact"]] },
      { title: "About Tundara", links: [["Our story", "help.html#about"], ["Sell on Tundara", "help.html#sell"], ["Careers", "help.html#careers"], ["Press", "help.html#press"], ["Affiliate programme", "help.html#affiliates"]] },
      { title: "Legal", links: [["Terms of service", "help.html#terms"], ["Privacy policy", "help.html#privacy"], ["Cookie settings", "help.html#cookies"], ["Accessibility", "help.html#accessibility"], ["Report a product", "help.html#contact"]] },
    ];
    return `
    <section class="container" style="margin-top:38px">
      <div class="newsletter-band reveal">
        <div>
          <span class="eyebrow" style="color:#bfe9d9">${icon("gift")} Welcome offer</span>
          <h2>Get <span data-usd="5" style="display:inline">${money(5)}</span> off your first order</h2>
          <p>Join 1.2 million shoppers getting early access to flash sales, new arrivals and members-only deals. One email a week, no spam.</p>
        </div>
        <div>
          <form class="newsletter-form" data-newsletter>
            <input type="email" name="email" placeholder="Enter your email address" aria-label="Email address" required>
            <button class="btn btn-accent" type="submit">Get my offer ${icon("arrow-right")}</button>
          </form>
          <p class="newsletter-note">By subscribing you agree to our Terms & Privacy Policy.</p>
        </div>
      </div>
    </section>
    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <a class="brand" href="index.html"><span class="brand-mark">${icon("bag")}</span><span><span class="brand-name">tun<em>dara</em></span><span class="brand-tag">Shop happy</span></span></a>
            <p>Everything you love, delivered. A new kind of marketplace built for Africa — genuine products, honest prices and delivery you can count on.</p>
            <div class="footer-contact">
              <a href="tel:+2347009876278">${icon("phone-call")} +234 700 987 6278</a>
              <a href="mailto:support@tundara.com">${icon("mail")} support@tundara.com</a>
              <span>${icon("map-pin")} 12 Admiralty Way, Lekki, Lagos</span>
            </div>
            <div class="footer-social">
              <a class="social-btn" href="#" aria-label="Facebook">${icon("facebook")}</a>
              <a class="social-btn" href="#" aria-label="Instagram">${icon("instagram")}</a>
              <a class="social-btn" href="#" aria-label="X">${icon("twitter")}</a>
              <a class="social-btn" href="#" aria-label="YouTube">${icon("youtube")}</a>
            </div>
          </div>
          ${cols.map((col) => `<div class="footer-col"><h3>${col.title}</h3>${col.links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}</div>`).join("")}
        </div>
        <div class="footer-payments">
          <span>Secure payments powered by TundaraPay</span>
          <div class="pay-logos">
            <span class="pay-logo">VISA</span>
            <span class="pay-logo mastercard">Mastercard</span>
            <span class="pay-logo verve">Verve</span>
            <span class="pay-logo">PayPal</span>
            <span class="pay-logo momo">MTN MoMo</span>
            <span class="pay-logo momo" style="background:#e60000;color:#fff">Airtel Money</span>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Tundara Technologies Ltd. All rights reserved.</span>
          <div class="footer-bottom-links">
            <a href="help.html#terms">Terms</a>
            <a href="help.html#privacy">Privacy</a>
            <a href="help.html#cookies">Cookies</a>
            <a class="footer-country" href="help.html#about">${icon("globe")} Nigeria · English</a>
          </div>
        </div>
      </div>
    </footer>
    <nav class="bottom-nav" aria-label="Quick navigation">
      <div class="bottom-nav-inner">
        <a class="bottom-link ${currentPage === "home" ? "is-active" : ""}" href="index.html">${icon("home")} Home</a>
        <a class="bottom-link ${currentPage === "shop" ? "is-active" : ""}" href="shop.html">${icon("grid")} Categories</a>
        <a class="bottom-link" href="shop.html?focus=1">${icon("search")} Search</a>
        <a class="bottom-link ${currentPage === "wishlist" ? "is-active" : ""}" href="wishlist.html">${icon("heart")} Wishlist<span class="bottom-count" data-wish-count>${wishCount()}</span></a>
        <a class="bottom-link ${currentPage === "account" ? "is-active" : ""}" href="account.html">${icon("user")} Account</a>
      </div>
    </nav>
    <div class="toast-stack" id="toastStack" aria-live="polite" aria-atomic="false"></div>
    <div class="modal-overlay" id="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal" id="modalBox"></div>
    </div>
    <button class="chat-fab" id="chatFab" aria-label="Chat with Tundara support">${icon("chat")}<span class="chat-dot"></span></button>
    <div class="chat-panel" id="chatPanel" aria-label="Support chat">
      <div class="chat-head">
        <span class="avatar">T</span>
        <div><strong>Tundara Assistant</strong><span><span class="online"></span> Online · replies instantly</span></div>
        <button class="modal-close" id="chatClose" style="margin-left:auto;background:rgba(255,255,255,.12);color:#fff" aria-label="Close chat">${icon("x")}</button>
      </div>
      <div class="chat-body" id="chatBody">
        <div class="chat-msg bot">Hi there 👋 I’m Tara, your shopping assistant. How can I help you today?</div>
      </div>
      <div class="chat-quick">
        <button data-chat-quick="track">Track my order</button>
        <button data-chat-quick="delivery">Delivery options</button>
        <button data-chat-quick="returns">Returns</button>
        <button data-chat-quick="human">Talk to a human</button>
      </div>
      <form class="chat-form" id="chatForm">
        <input type="text" id="chatInput" placeholder="Type your message…" aria-label="Message">
        <button type="submit" aria-label="Send">${icon("send")}</button>
      </form>
    </div>
    <button class="to-top" id="toTop" aria-label="Back to top">${icon("arrow-up")}</button>`;
  }

  function refreshHeader() {
    document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cartCount()));
    document.querySelectorAll("[data-wish-count]").forEach((el) => (el.textContent = wishCount()));
    document.querySelectorAll("[data-cart-total]").forEach((el) => (el.textContent = money(cartSubtotal())));
    document.querySelectorAll("[data-wish-open]").forEach((el) => {
      el.setAttribute("aria-label", `Wishlist, ${wishCount()} ${wishCount() === 1 ? "item" : "items"}`);
    });
    document.querySelectorAll("[data-cart-open]").forEach((el) => {
      el.setAttribute("aria-label", `Open basket, ${cartCount()} ${cartCount() === 1 ? "item" : "items"}`);
    });
    const greeting = document.getElementById("headerGreeting");
    if (greeting) greeting.textContent = state.user ? "Hi, " + state.user.name.split(" ")[0] : "Hello, sign in";
    document.querySelectorAll(".header-count").forEach((el) => {
      if (el.dataset.cartCount !== undefined || el.closest("[data-cart-open]")) {
        el.classList.remove("count-pop");
        void el.offsetWidth;
        el.classList.add("count-pop");
      }
    });
  }

  function renderCartDrawer() {
    const body = document.getElementById("cartDrawerBody");
    const foot = document.getElementById("cartDrawerFoot");
    if (!body || !foot) return;
    if (!state.cart.length) {
      body.innerHTML = `<div class="empty-drawer">
        <div class="empty-icon">${icon("bag")}</div>
        <h3 style="font-size:1rem;margin-bottom:4px">Your basket is empty</h3>
        <p style="font-size:.8rem;color:var(--muted);margin-bottom:16px">Discover something you'll love.</p>
        <a class="btn btn-primary" href="shop.html">Start shopping ${icon("arrow-right")}</a>
      </div>`;
      foot.innerHTML = "";
      return;
    }
    const subtotal = cartSubtotal();
    const remaining = Math.max(0, freeShippingUSD - subtotal);
    const pct = Math.min(100, (subtotal / freeShippingUSD) * 100);
    body.innerHTML = `
      <div class="free-ship">
        <div class="free-ship-text"><span>${remaining > 0 ? `Add <span data-usd="${remaining}">${money(remaining)}</span> more for free delivery` : "You’ve unlocked free delivery 🎉"}</span><span>${Math.round(pct)}%</span></div>
        <div class="free-ship-bar"><span style="width:${pct}%"></span></div>
      </div>
      ${state.cart.map((item) => {
        const p = getProduct(item.id);
        if (!p) return "";
        return `<div class="cart-line">
          <a class="cart-line-img" href="${productUrl(p)}"><img src="${p.image}" alt="${escapeHTML(p.title)}"></a>
          <div>
            <a class="cart-line-title" href="${productUrl(p)}">${escapeHTML(p.title)}</a>
            <div class="cart-line-meta">${escapeHTML(p.brand)}${item.variant ? " · " + escapeHTML(item.variant) : ""}</div>
            <div class="qty"><button data-qty-minus="${p.id}" data-variant="${escapeHTML(item.variant || "")}" aria-label="Decrease quantity">${icon("minus")}</button><span>${item.qty}</span><button data-qty-plus="${p.id}" data-variant="${escapeHTML(item.variant || "")}" aria-label="Increase quantity">${icon("plus")}</button></div>
          </div>
          <div class="cart-line-price">
            <span data-usd="${itemPrice(item) * item.qty}">${money(itemPrice(item) * item.qty)}</span>
            <button class="cart-line-remove" data-remove="${p.id}" data-variant="${escapeHTML(item.variant || "")}">${icon("trash")} Remove</button>
          </div>
        </div>`;
      }).join("")}`;
    foot.innerHTML = `
      <div class="drawer-total"><span>Subtotal (${cartCount()} item${cartCount() === 1 ? "" : "s"})</span><strong data-usd="${subtotal}">${money(subtotal)}</strong></div>
      <div style="display:flex;gap:8px">
        <a class="btn btn-outline" href="cart.html" style="flex:1">View basket</a>
        <a class="btn btn-primary" href="checkout.html" style="flex:1">Checkout ${icon("arrow-right")}</a>
      </div>
      <div class="summary-note">${icon("lock")} Secure checkout · 7-day returns</div>`;
  }

  /* ---------------------------------------------------------------- */
  /* Layer helpers                                                     */
  /* ---------------------------------------------------------------- */
  const overlay = () => document.getElementById("overlay");
  let layerOpener = null;
  let modalOpener = null;
  function openLayer(el, opener) {
    if (!el) return;
    const ov = overlay();
    if (!document.querySelector(".mobile-drawer.is-open, .cart-drawer.is-open, .shop-sidebar.is-open")) {
      layerOpener = opener || document.activeElement;
    }
    document.querySelectorAll(".mobile-drawer, .cart-drawer").forEach((d) => {
      if (d === el) return;
      d.classList.remove("is-open");
      d.setAttribute("aria-hidden", "true");
      d.setAttribute("inert", "");
    });
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    el.removeAttribute("inert");
    ov?.classList.add("is-open");
    document.body.style.overflow = "hidden";
    const focusLayer = () => {
      const target = el.querySelector("[data-close-layers]") || el.querySelector("a[href], button:not([disabled]), input, select, textarea");
      target?.focus({ preventScroll: true });
    };
    focusLayer();
    requestAnimationFrame(focusLayer);
  }
  function closeMega() {
    document.getElementById("megaMenu")?.classList.remove("is-open");
    document.getElementById("allCatsBtn")?.setAttribute("aria-expanded", "false");
  }
  function syncSidebarA11y() {
    const narrow = window.matchMedia("(max-width: 980px)").matches;
    document.querySelectorAll(".shop-sidebar").forEach((d) => {
      const open = d.classList.contains("is-open");
      if (!narrow || open) {
        d.removeAttribute("inert");
        if (!narrow) d.removeAttribute("aria-hidden");
        else d.setAttribute("aria-hidden", "false");
      } else {
        d.setAttribute("inert", "");
        d.setAttribute("aria-hidden", "true");
      }
    });
  }
  function closeLayers() {
    const wasOpen = document.querySelector(".mobile-drawer.is-open, .cart-drawer.is-open, .shop-sidebar.is-open");
    document.querySelectorAll(".mobile-drawer, .cart-drawer").forEach((d) => {
      d.classList.remove("is-open");
      d.setAttribute("aria-hidden", "true");
      d.setAttribute("inert", "");
    });
    document.querySelectorAll(".shop-sidebar").forEach((d) => d.classList.remove("is-open"));
    syncSidebarA11y();
    const ov = overlay();
    if (ov) ov.classList.remove("is-open");
    document.body.style.overflow = "";
    closeModal();
    document.getElementById("menuBtn")?.setAttribute("aria-expanded", "false");
    closeMega();
    if (wasOpen && layerOpener && document.contains(layerOpener)) layerOpener.focus({ preventScroll: true });
    layerOpener = null;
  }
  function openCartDrawer(opener) {
    const el = document.getElementById("cartDrawer");
    if (el) openLayer(el, opener);
  }

  /* ---------------------------------------------------------------- */
  /* Toast                                                             */
  /* ---------------------------------------------------------------- */
  function toast(title, message, type) {
    const stack = document.getElementById("toastStack");
    if (!stack) return;
    const el = document.createElement("div");
    el.className = "toast " + (type || "success");
    el.innerHTML = `<span class="toast-icon">${icon(type === "error" ? "alert-circle" : type === "warn" ? "info" : type === "info" ? "info" : "check")}</span><div><strong>${title}</strong>${message ? `<p>${message}</p>` : ""}</div><button class="toast-close" aria-label="Dismiss">${icon("x")}</button>`;
    stack.appendChild(el);
    const close = () => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 260);
    };
    el.querySelector(".toast-close").addEventListener("click", close);
    setTimeout(close, 3800);
  }

  /* ---------------------------------------------------------------- */
  /* Search                                                            */
  /* ---------------------------------------------------------------- */
  let searchTimer = null;
  let searchActive = -1;
  let searchResults = [];

  function searchProducts(query, category) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    return PRODUCTS
      .filter((p) => (!category || p.category === category))
      .map((p) => {
        const hay = `${p.title} ${p.brand} ${p.category} ${p.subcategory} ${p.tags.join(" ")}`.toLowerCase();
        let score = 0;
        tokens.forEach((t) => {
          if (p.title.toLowerCase().startsWith(t)) score += 8;
          else if (p.title.toLowerCase().includes(t)) score += 5;
          if (p.brand.toLowerCase().includes(t)) score += 4;
          if (hay.includes(t)) score += 1;
        });
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.sold - a.p.sold)
      .map((x) => x.p);
  }

  function renderSearchHint() {
    const hint = document.getElementById("searchHint");
    const input = document.getElementById("searchInput");
    if (!hint || !input) return;
    const q = input.value.trim();
    const category = document.getElementById("searchCategory")?.value || "";
    if (!q) {
      const recent = state.searches.slice(0, 5);
      hint.innerHTML = `
        <div class="search-hint-head"><span>${recent.length ? "Recent searches" : "Trending searches"}</span>${recent.length ? `<button class="recent-clear" id="clearRecent">Clear</button>` : ""}</div>
        <div class="trending-searches">
          ${(recent.length ? recent : ["iPhone", "AirPods", "Sneakers", "Blender", "Perfume", "Groceries"]).map((term) => `<button class="pill" data-search-term="${escapeHTML(term)}">${icon("search")} ${escapeHTML(term)}</button>`).join("")}
        </div>`;
      hint.classList.add("is-open");
      hint.querySelectorAll("[data-search-term]").forEach((btn) => btn.addEventListener("click", () => {
        input.value = btn.dataset.searchTerm;
        renderSearchHint();
      }));
      hint.querySelector("#clearRecent")?.addEventListener("click", () => {
        state.searches = [];
        save(K.searches, []);
        renderSearchHint();
      });
      return;
    }
    searchResults = searchProducts(q, category);
    searchActive = -1;
    if (!searchResults.length) {
      hint.innerHTML = `<div class="search-empty">No matches for “${escapeHTML(q)}”.<br><span style="font-size:.75rem">Try a different keyword or browse all categories.</span></div>
        <a class="search-all" href="shop.html?q=${encodeURIComponent(q)}${category ? `&category=${category}` : ""}">Browse all products ${icon("arrow-right")}</a>`;
    } else {
      hint.innerHTML = `
        <div class="search-hint-head"><span>Products</span><span>${searchResults.length} match${searchResults.length === 1 ? "" : "es"}</span></div>
        <div class="search-hint-list">
          ${searchResults.slice(0, 6).map((p, i) => `<a class="search-suggestion" href="${productUrl(p)}" data-suggestion="${i}">
            <img src="${p.image}" alt="">
            <span style="min-width:0"><span class="ss-title">${escapeHTML(p.title)}</span><span class="ss-meta">${escapeHTML(p.brand)} · ${escapeHTML(p.subcategory)}</span></span>
            <span class="ss-price" data-usd="${p.price}">${money(p.price)}</span>
          </a>`).join("")}
        </div>
        <a class="search-all" href="shop.html?q=${encodeURIComponent(q)}${category ? `&category=${category}` : ""}">View all ${searchResults.length} results ${icon("arrow-right")}</a>`;
    }
    hint.classList.add("is-open");
  }

  function submitSearch(e) {
    if (e) e.preventDefault();
    const input = document.getElementById("searchInput");
    const q = (input?.value || "").trim();
    if (!q) { input?.focus(); return; }
    state.searches = [q, ...state.searches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 8);
    save(K.searches, state.searches);
    const category = document.getElementById("searchCategory")?.value || "";
    window.location.href = `shop.html?q=${encodeURIComponent(q)}${category ? `&category=${category}` : ""}`;
  }

  function bindSearch() {
    const form = document.getElementById("searchForm");
    const input = document.getElementById("searchInput");
    const hint = document.getElementById("searchHint");
    const clear = document.getElementById("searchClear");
    const cat = document.getElementById("searchCategory");
    if (!form || !input) return;
    form.addEventListener("submit", submitSearch);
    input.addEventListener("input", () => {
      clear?.classList.toggle("is-visible", input.value.length > 0);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderSearchHint, 120);
    });
    input.addEventListener("focus", renderSearchHint);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { hint.classList.remove("is-open"); input.blur(); return; }
      const items = [...(hint?.querySelectorAll(".search-suggestion") || [])];
      if (!hint?.classList.contains("is-open")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!items.length) return;
        e.preventDefault();
        searchActive = e.key === "ArrowDown" ? Math.min(items.length - 1, searchActive + 1) : Math.max(0, searchActive - 1);
        items.forEach((el, i) => el.classList.toggle("is-active", i === searchActive));
        items[searchActive]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && searchActive >= 0) {
        e.preventDefault();
        items[searchActive]?.click();
      }
    });
    cat?.addEventListener("change", () => { if (input.value.trim()) renderSearchHint(); });
    clear?.addEventListener("click", () => {
      input.value = "";
      clear.classList.remove("is-visible");
      input.focus();
      renderSearchHint();
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".header-search")) hint?.classList.remove("is-open");
    });
  }

  /* ---------------------------------------------------------------- */
  /* Theme / currency / region                                         */
  /* ---------------------------------------------------------------- */
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    save(K.theme, theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      const text = btn.querySelector("[data-theme-text]");
      if (text) text.textContent = theme === "dark" ? "On" : "Off";
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#08120e" : "#0b7a5a");
  }
  function toggleTheme() {
    applyTheme(state.theme === "dark" ? "light" : "dark");
    toast(state.theme === "dark" ? "Dark mode on" : "Light mode on", "Your preference has been saved.", "success");
  }
  function setCurrency(code) {
    if (!CATALOG.currencies.some((c) => c.code === code)) return;
    state.currency = code;
    save(K.currency, code);
    const select = document.getElementById("currencySelect");
    if (select) select.value = code;
    refreshMoney();
    renderCartDrawer();
    emits("zm:currency", { code });
    toast("Currency updated", "Prices now shown in " + code + ".", "success");
  }
  function setRegion(value) {
    const [city, regionState, country] = String(value).split("|");
    state.region = { city, state: regionState, country };
    save(K.region, state.region);
    emits("zm:region", state.region);
    toast("Delivery location updated", `Delivering to ${regionLabel()}.`, "success");
  }

  /* ---------------------------------------------------------------- */
  /* Modal / quick view                                                */
  /* ---------------------------------------------------------------- */
  function openModal(html, opts = {}) {
    const ov = document.getElementById("modalOverlay");
    const box = document.getElementById("modalBox");
    if (!ov || !box) return;
    if (!ov.classList.contains("is-open")) modalOpener = opts.opener || document.activeElement;
    box.className = "modal " + (opts.size === "sm" ? "modal-sm" : "");
    box.innerHTML = html;
    ov.classList.add("is-open");
    document.body.style.overflow = "hidden";
    box.querySelectorAll("[data-close-modal]").forEach((btn) => btn.addEventListener("click", closeModal));
    ov.onclick = (e) => { if (e.target === ov) closeModal(); };
    return box;
  }
  function closeModal() {
    const ov = document.getElementById("modalOverlay");
    const wasOpen = !!ov?.classList.contains("is-open");
    ov?.classList.remove("is-open");
    if (!document.querySelector(".cart-drawer.is-open, .mobile-drawer.is-open")) document.body.style.overflow = "";
    if (wasOpen && modalOpener && document.contains(modalOpener)) modalOpener.focus({ preventScroll: true });
    modalOpener = null;
  }

  function openQuickView(id) {
    const p = getProduct(id);
    if (!p) return;
    const quickOpener = document.activeElement;
    const defaultVariant = p.variants?.[0]?.options?.[0]?.label || "";
    const box = openModal(`
      <div class="modal-head"><h3 id="modalTitle">Product quick view</h3><button class="modal-close" data-close-modal aria-label="Close">${icon("x")}</button></div>
      <div class="modal-body">
        <div class="quick-grid">
          <div class="quick-media"><img src="${p.images[0]}" alt="${escapeHTML(p.title)}"></div>
          <div class="quick-info">
            <span class="product-brand">${escapeHTML(p.brand)}</span>
            <h3>${escapeHTML(p.title)}</h3>
            <div class="rating">${stars(p.rating)} <b>${p.rating.toFixed(1)}</b> <span class="rating-count">(${Number(p.reviewCount).toLocaleString()} reviews)</span></div>
            <div class="product-price-row" style="margin-top:10px">
              <span class="product-price" data-usd="${p.price}">${money(p.price)}</span>
              <span class="product-old" data-usd="${p.oldPrice}">${money(p.oldPrice)}</span>
              <span class="product-off">-${p.discount}%</span>
            </div>
            <p class="product-summary">${escapeHTML(p.description)}</p>
            ${p.variants?.length ? `<div class="variant-group"><div class="variant-label">${escapeHTML(p.variants[0].name)}</div><div class="variant-options">${p.variants[0].options.map((o, i) => `<button class="variant-btn ${i === 0 ? "is-active" : ""}" data-qv-variant="${escapeHTML(o.label)}" data-delta="${o.delta}">${escapeHTML(o.label)}</button>`).join("")}</div></div>` : ""}
            <div class="qty-row"><div class="qty qty-lg"><button id="qvMinus" aria-label="Decrease">${icon("minus")}</button><span id="qvQty">1</span><button id="qvPlus" aria-label="Increase">${icon("plus")}</button></div><span style="font-size:.72rem;color:var(--muted);align-self:center">${p.stock > 14 ? "In stock" : `Only ${p.stock} left`}</span></div>
            <div style="display:flex;gap:8px;margin-top:14px">
              <button class="btn btn-primary" style="flex:1" id="qvAdd">${icon("cart")} Add to basket</button>
              <button class="btn btn-outline btn-icon" id="qvWish" aria-label="Save to wishlist">${icon("heart")}</button>
            </div>
            <a class="btn btn-ghost btn-sm btn-block" style="margin-top:6px" href="${productUrl(p)}">View full details ${icon("arrow-right")}</a>
          </div>
        </div>
      </div>`, { size: "md" });
    let qty = 1;
    let variant = defaultVariant;
    let delta = 0;
    box.querySelectorAll("[data-qv-variant]").forEach((btn) => btn.addEventListener("click", () => {
      box.querySelectorAll("[data-qv-variant]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      variant = btn.dataset.qvVariant;
      delta = Number(btn.dataset.delta) || 0;
      const priceEl = box.querySelector(".product-price");
      priceEl.dataset.usd = p.price + delta;
      priceEl.textContent = money(p.price + delta);
    }));
    box.querySelector("#qvMinus")?.addEventListener("click", () => { qty = Math.max(1, qty - 1); box.querySelector("#qvQty").textContent = qty; });
    box.querySelector("#qvPlus")?.addEventListener("click", () => { qty = Math.min(p.stock || 99, qty + 1); box.querySelector("#qvQty").textContent = qty; });
    box.querySelector("#qvAdd")?.addEventListener("click", () => {
      addToCart(p.id, qty, variant, { silent: true });
      closeModal();
      toast("Added to basket", `${escapeHTML(p.title)}${variant ? " · " + escapeHTML(variant) : ""}`, "success");
      openCartDrawer(quickOpener);
    });
    box.querySelector("#qvWish")?.addEventListener("click", () => toggleWishlist(p.id));
  }

  function openRegionModal() {
    openModal(`
      <div class="modal-head"><h3 id="modalTitle">Choose your delivery location</h3><button class="modal-close" data-close-modal aria-label="Close">${icon("x")}</button></div>
      <div class="modal-body">
        <p style="font-size:.82rem;color:var(--muted);margin-bottom:14px">Delivery options and estimated arrival times are based on your location.</p>
        <div class="field"><label for="regionModalSelect">City</label>
          <select class="select" id="regionModalSelect">
            ${CATALOG.regions.map((r) => `<option value="${r.city}|${r.state}|${r.country}" ${state.region.city === r.city ? "selected" : ""}>${r.city}, ${r.state} — ${r.country}</option>`).join("")}
          </select>
        </div>
        <button class="btn btn-primary btn-block" id="saveRegion" style="margin-top:14px">Save location</button>
      </div>`, { size: "sm" });
    document.getElementById("saveRegion")?.addEventListener("click", () => {
      setRegion(document.getElementById("regionModalSelect").value);
      closeModal();
      const select = document.getElementById("regionSelect");
      if (select) select.value = `${state.region.city}|${state.region.state}|${state.region.country}`;
    });
  }

  /* ---------------------------------------------------------------- */
  /* Newsletter / chat / misc                                          */
  /* ---------------------------------------------------------------- */
  function bindNewsletter() {
    document.querySelectorAll("[data-newsletter]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const email = (input?.value || "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          toast("Check your email", "Please enter a valid email address.", "error");
          input?.focus();
          return;
        }
        save(K.subscribed, email);
        toast("You're in! 🎉", "Your welcome offer is on its way to " + escapeHTML(email) + ".", "success");
        form.reset();
      });
    });
  }

  function bindChat() {
    const fab = document.getElementById("chatFab");
    const panel = document.getElementById("chatPanel");
    const body = document.getElementById("chatBody");
    const form = document.getElementById("chatForm");
    if (!fab || !panel) return;
    const toggle = () => {
      panel.classList.toggle("is-open");
      if (panel.classList.contains("is-open")) document.getElementById("chatInput")?.focus();
    };
    fab.addEventListener("click", toggle);
    document.getElementById("chatClose")?.addEventListener("click", toggle);
    const replies = {
      track: "You can track any order in real time on the <a href='track.html' style='color:var(--brand);font-weight:700'>Track Order</a> page. Enter your TD order number and we'll show you exactly where it is.",
      delivery: "We deliver across Nigeria, Ghana, Kenya and South Africa. Standard delivery is 2–4 business days and is free on orders over " + money(freeShippingUSD) + ". Express delivery is available in major cities.",
      returns: "Changed your mind? You have 7 days to return eligible items in their original packaging. Start a return from <a href='help.html#returns' style='color:var(--brand);font-weight:700'>Help Center → Returns</a>.",
      human: "I'm connecting you to a human agent. Our team is online 24/7 — you can also call +234 700 987 6278 or email support@tundara.com.",
      order: "To check your order, head to <a href='account.html#orders' style='color:var(--brand);font-weight:700'>My Orders</a> or use the Track Order page with your order number.",
    };
    function addMsg(text, who) {
      const el = document.createElement("div");
      el.className = "chat-msg " + who;
      el.innerHTML = text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }
    function replyFor(text) {
      const t = text.toLowerCase();
      if (t.includes("track") || t.includes("order")) return replies.order;
      if (t.includes("deliver") || t.includes("ship") || t.includes("when")) return replies.delivery;
      if (t.includes("return") || t.includes("refund")) return replies.returns;
      if (t.includes("human") || t.includes("agent") || t.includes("call")) return replies.human;
      return "Thanks for reaching out! I can help with orders, delivery, returns and payments. For anything else, email <a href='mailto:support@tundara.com' style='color:var(--brand)'>support@tundara.com</a> and our team will reply within 2 hours.";
    }
    document.querySelectorAll("[data-chat-quick]").forEach((btn) => btn.addEventListener("click", () => {
      const key = btn.dataset.chatQuick;
      addMsg(btn.textContent, "user");
      setTimeout(() => addMsg(replies[key] || replyFor(btn.textContent), "bot"), 450);
    }));
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chatInput");
      const text = input.value.trim();
      if (!text) return;
      addMsg(escapeHTML(text), "user");
      input.value = "";
      setTimeout(() => addMsg(replyFor(text), "bot"), 650);
    });
  }

  function bindCommon() {
    document.addEventListener("click", (e) => {
      const themeBtn = e.target.closest("[data-theme-toggle]");
      if (themeBtn) { toggleTheme(); return; }
      const cartOpen = e.target.closest("[data-cart-open]");
      if (cartOpen) { e.preventDefault(); openCartDrawer(cartOpen); return; }
      const close = e.target.closest("[data-close-layers]");
      if (close) { closeLayers(); return; }
      const wish = e.target.closest("[data-wish]");
      if (wish) { e.preventDefault(); toggleWishlist(Number(wish.dataset.wish)); return; }
      const add = e.target.closest("[data-add]");
      if (add) { e.preventDefault(); addToCart(Number(add.dataset.add), 1); return; }
      const quick = e.target.closest("[data-quick]");
      if (quick) { e.preventDefault(); openQuickView(Number(quick.dataset.quick)); return; }
      const remove = e.target.closest("[data-remove]");
      if (remove) { removeFromCart(remove.dataset.remove, remove.dataset.variant); return; }
      const plus = e.target.closest("[data-qty-plus]");
      if (plus) {
        const item = state.cart.find((i) => i.id === Number(plus.dataset.qtyPlus) && (i.variant || "") === (plus.dataset.variant || ""));
        if (item) updateCartQty(item.id, item.variant, item.qty + 1);
        return;
      }
      const minus = e.target.closest("[data-qty-minus]");
      if (minus) {
        const item = state.cart.find((i) => i.id === Number(minus.dataset.qtyMinus) && (i.variant || "") === (minus.dataset.variant || ""));
        if (item) updateCartQty(item.id, item.variant, item.qty - 1);
        return;
      }
      if (e.target.closest("[data-search-term]")) return;
      if (!e.target.closest(".mega") && !e.target.closest("#allCatsBtn")) closeMega();
    });

    const menuBtn = document.getElementById("menuBtn");
    menuBtn?.addEventListener("click", () => {
      openLayer(document.getElementById("mobileDrawer"), menuBtn);
      menuBtn.setAttribute("aria-expanded", "true");
    });
    document.getElementById("overlay")?.addEventListener("click", closeLayers);
    document.querySelectorAll(".modal-overlay").forEach((ov) => ov.addEventListener("click", (e) => { if (e.target === ov) closeModal(); }));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeLayers(); closeModal(); document.getElementById("chatPanel")?.classList.remove("is-open"); }
    });

    const allBtn = document.getElementById("allCatsBtn");
    allBtn?.addEventListener("click", () => {
      const mega = document.getElementById("megaMenu");
      const isOpen = mega.classList.toggle("is-open");
      allBtn.setAttribute("aria-expanded", String(isOpen));
    });
    document.querySelectorAll("[data-mega]").forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        document.querySelectorAll("[data-mega]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        document.querySelectorAll("[data-panel]").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === btn.dataset.mega));
      });
      btn.addEventListener("click", () => {
        window.location.href = `shop.html?category=${btn.dataset.mega}`;
      });
    });

    const regionSelect = document.getElementById("regionSelect");
    regionSelect?.addEventListener("change", (e) => setRegion(e.target.value));
    document.querySelector("[data-region-open]")?.addEventListener("click", openRegionModal);

    document.getElementById("currencySelect")?.addEventListener("change", (e) => setCurrency(e.target.value));

    const searchInput = document.getElementById("searchInput");
    if (new URLSearchParams(location.search).get("focus") === "1" && searchInput) setTimeout(() => searchInput.focus(), 350);

    const toTop = document.getElementById("toTop");
    toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    const header = document.querySelector(".site-header");
    window.addEventListener("scroll", () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 12);
      toTop?.classList.toggle("is-visible", window.scrollY > 700);
    }, { passive: true });

    document.addEventListener("click", (e) => {
      const copy = e.target.closest("[data-copy]");
      if (copy) {
        navigator.clipboard?.writeText(copy.dataset.copy).then(() => toast("Copied", copy.dataset.copy, "success"));
      }
      const share = e.target.closest("[data-share]");
      if (share) {
        const url = share.dataset.share || location.href;
        if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
        else navigator.clipboard?.writeText(url).then(() => toast("Link copied", "Share it with a friend.", "success"));
      }
    });
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach((el) => {
      const name = el.dataset.icon;
      if (name) el.innerHTML = icon(name);
    });
  }

  function revealObserver(root) {
    const els = (root || document).querySelectorAll(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.06 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------- */
  /* Boot                                                              */
  /* ---------------------------------------------------------------- */
  function init() {
    applyTheme(state.theme);
    const headerEl = document.getElementById("site-header");
    if (headerEl) headerEl.innerHTML = headerHTML();
    const footerEl = document.getElementById("site-footer");
    if (footerEl) footerEl.innerHTML = footerHTML();
    document.body.insertAdjacentHTML("beforeend", drawerHTML());
    hydrateIcons();
    renderCartDrawer();
    syncSidebarA11y();
    window.addEventListener("resize", syncSidebarA11y, { passive: true });
    bindSearch();
    bindCommon();
    bindNewsletter();
    bindChat();
    syncWishButtons();
    refreshHeader();
    revealObserver();
    document.body.classList.add("is-ready");
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => { /* offline support unavailable */ });
      });
    }
    emits("zm:ready", { state, money, getProduct, productUrl, stars, icon, refreshMoney });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* Public API */
  window.TDApp = {
    state,
    catalog: CATALOG,
    products: PRODUCTS,
    categories: CATEGORIES,
    getProduct,
    productUrl,
    productCard,
    skeletonCards,
    stars,
    icon,
    money,
    refreshMoney,
    escapeHTML,
    toast,
    addToCart,
    updateCartQty,
    removeFromCart,
    saveForLater,
    moveToCart,
    clearCart,
    cartCount,
    cartSubtotal,
    itemPrice,
    itemLabel,
    variantDelta,
    computeTotals,
    applyCoupon,
    removeCoupon,
    getOrders,
    createOrder,
    getOrder,
    seedDemoOrders,
    generateReviews,
    addReview,
    removeReview,
    ratingDistribution,
    inWishlist,
    toggleWishlist,
    clearWishlist,
    pushRecent,
    freeShippingUSD,
    freeShipping: freeShippingUSD,
    openCartDrawer,
    openQuickView,
    openModal,
    closeModal,
    openRegionModal,
    closeLayers,
    refreshHeader,
    renderCartDrawer,
    regionLabel,
    setRegion,
    setCurrency,
    emit: emits,
    isUser: () => !!state.user,
    saveAuth(user) { state.user = user; save(K.user, user); refreshHeader(); },
    logout() { state.user = null; localStorage.removeItem(K.user); refreshHeader(); emits("zm:auth", { user: null }); },
    getAddresses: () => load(K.addresses, []),
    saveAddresses: (list) => { state.addresses = list; save(K.addresses, list); },
    getSaved: () => state.saved,
    removeSaved(id) { state.saved = state.saved.filter((x) => x !== Number(id)); save(K.saved, state.saved); },
    drawers: { open: openLayer, close: closeLayers },
  };
})();

