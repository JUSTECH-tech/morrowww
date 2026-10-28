/* ==========================================================================
   Tundara — home page
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

  function onReady(fn) {
    if (document.body.classList.contains("is-ready")) fn();
    else document.addEventListener("zm:ready", fn, { once: true });
  }

  /* ------------------------------------------------------------------ */
  /* Curated home collections                                            */
  /* ------------------------------------------------------------------ */
  const HERO_SLIDES = [
    {
      theme: "tech",
      eyebrow: "New season tech",
      title: 'Upgrade your everyday, <em>beautifully.</em>',
      copy: "Flagship laptops, immersive audio and smart everyday essentials — genuine products at prices that make sense.",
      cta: "Shop tech deals",
      href: "shop.html?category=computers",
      secondary: "Explore electronics",
      secondaryHref: "shop.html?category=electronics",
      products: [78, 101, 93],
      chip: ["Free 2-day delivery", "On orders over $35"],
      metrics: [["179+", "curated products"], ["4.8★", "average rating"], ["9", "departments"]],
    },
    {
      theme: "home",
      eyebrow: "Home refresh",
      title: 'Make home your <em>happy place.</em>',
      copy: "Statement furniture, clever kitchen kit and little touches that turn a house into somewhere you love to be.",
      cta: "Shop home & kitchen",
      href: "shop.html?category=home",
      secondary: "See flash deals",
      secondaryHref: "shop.html?deals=1",
      products: [12, 51, 66],
      chip: ["Up to 40% off", "Home event"],
      metrics: [["2,500+", "home picks"], ["7-day", "easy returns"], ["100%", "genuine"]],
    },
    {
      theme: "fashion",
      eyebrow: "The style edit",
      title: 'Style that turns <em>heads.</em>',
      copy: "Fresh sneakers, statement sunglasses and fragrances worth remembering. Find your next signature look.",
      cta: "Shop fashion",
      href: "shop.html?category=fashion",
      secondary: "Beauty & fragrance",
      secondaryHref: "shop.html?category=beauty",
      products: [91, 154, 8],
      chip: ["New arrivals weekly", "Trending now"],
      metrics: [["35+", "fashion finds"], ["13", "beauty icons"], ["4.9★", "top-rated"]],
    },
  ];

  function heroSlideHTML(slide, index) {
    const products = slide.products.map((id, i) => A.getProduct(id)).filter(Boolean);
    const main = products[0];
    return `<article class="hero-slide ${index === 0 ? "is-active" : ""}" data-theme="${slide.theme}" data-slide="${index}" ${index === 0 ? "" : 'aria-hidden="true" inert'}>
      <div class="hero-copy">
        <span class="hero-eyebrow">${A.icon("sparkles", "spark")} ${slide.eyebrow}</span>
        <h1>${slide.title}</h1>
        <p>${slide.copy}</p>
        <div class="hero-cta">
          <a class="btn btn-white btn-lg" href="${slide.href}">${slide.cta} ${A.icon("arrow-right")}</a>
          <a class="btn btn-outline" href="${slide.secondaryHref}">${slide.secondary}</a>
        </div>
        <div class="hero-metrics">
          ${slide.metrics.map(([value, label]) => `<div class="hero-metric"><strong>${value}</strong><span>${label}</span></div>`).join("")}
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-disc"></div>
        ${products[1] ? `<a class="hero-prod hp-a" href="${A.productUrl(products[1])}" tabindex="-1"><img src="${products[1].images[0]}" alt=""><span class="hp-price"><strong>${A.money(products[1].price)}</strong></span></a>` : ""}
        ${main ? `<a class="hero-prod hp-main" href="${A.productUrl(main)}" tabindex="-1"><img src="${main.images[0]}" alt=""><span class="hp-price"><strong>${A.money(main.price)}</strong><span>-${main.discount}%</span></span></a>` : ""}
        ${products[2] ? `<a class="hero-prod hp-b" href="${A.productUrl(products[2])}" tabindex="-1"><img src="${products[2].images[0]}" alt=""><span class="hp-price"><strong>${A.money(products[2].price)}</strong></span></a>` : ""}
        ${slide.chip ? `<div class="hero-chip-float">${A.icon("truck")}<span>${slide.chip[0]}<small>${slide.chip[1]}</small></span></div>` : ""}
      </div>
    </article>`;
  }

  function renderHero() {
    const grid = $("#heroGrid");
    if (!grid) return;
    const sidePromos = [
      { img: "assets/img/lifestyle/phone.jpg", small: "Smart living", title: "Top phones,<br>unbeatable value", href: "shop.html?category=phones", cta: "Shop phones" },
      { img: "assets/img/lifestyle/beauty.jpg", small: "Glow season", title: "Beauty icons,<br>up to 35% off", href: "shop.html?category=beauty", cta: "Shop beauty" },
    ];
    grid.innerHTML = `
      <div class="hero-slider" id="heroSlider">
        ${HERO_SLIDES.map(heroSlideHTML).join("")}
        <div class="hero-controls">
          <div class="hero-dots" role="group" aria-label="Featured collections">
            ${HERO_SLIDES.map((s, i) => `<button class="hero-dot ${i === 0 ? "is-active" : ""}" data-hero-dot="${i}" aria-label="Show ${A.escapeHTML(s.eyebrow)}" aria-pressed="${i === 0}"></button>`).join("")}
          </div>
        </div>
        <div class="hero-arrows">
          <button class="hero-arrow" data-hero-prev aria-label="Previous slide">${A.icon("chevron-left")}</button>
          <button class="hero-arrow" data-hero-next aria-label="Next slide">${A.icon("chevron-right")}</button>
        </div>
      </div>
      <div class="hero-side">
        ${sidePromos.map((p) => `<a class="hero-promo" href="${p.href}">
          <img src="${p.img}" alt="" loading="lazy">
          <small>${p.small}</small>
          <h2>${p.title}</h2>
          <span class="btn btn-white">${p.cta} ${A.icon("arrow-right")}</span>
          <span class="icon-arrow">${A.icon("arrow-up-right")}</span>
        </a>`).join("")}
      </div>`;

    let current = 0;
    let timer = null;
    const slides = $$(".hero-slide", grid);
    const dots = $$("[data-hero-dot]", grid);

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((s, i) => {
        const active = i === current;
        s.classList.toggle("is-active", active);
        if (active) s.removeAttribute("aria-hidden");
        else s.setAttribute("aria-hidden", "true");
        s.toggleAttribute("inert", !active);
      });
      dots.forEach((d, i) => {
        d.classList.toggle("is-active", i === current);
        d.setAttribute("aria-pressed", String(i === current));
      });
    }
    function auto() {
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), 6500);
    }
    $$("[data-hero-dot]", grid).forEach((dot) => dot.addEventListener("click", () => { show(Number(dot.dataset.heroDot)); auto(); }));
    $("[data-hero-prev]", grid)?.addEventListener("click", () => { show(current - 1); auto(); });
    $("[data-hero-next]", grid)?.addEventListener("click", () => { show(current + 1); auto(); });
    const slider = $("#heroSlider");
    slider?.addEventListener("mouseenter", () => clearInterval(timer));
    slider?.addEventListener("mouseleave", auto);
    slider?.addEventListener("focusin", () => clearInterval(timer));
    document.addEventListener("keydown", (e) => {
      if (!slider || !slider.matches(":hover")) return;
      if (e.key === "ArrowLeft") { show(current - 1); auto(); }
      if (e.key === "ArrowRight") { show(current + 1); auto(); }
    });
    auto();
  }

  /* ------------------------------------------------------------------ */
  /* Categories                                                          */
  /* ------------------------------------------------------------------ */
  function renderBenefits() {
    const rail = $("#benefitsRail");
    if (!rail) return;
    const benefits = [
      ["truck", "Free delivery", `On orders over ${A.money(A.freeShippingUSD)}`],
      ["returns", "7-day returns", "Easy, no-stress refunds"],
      ["shield", "Tundara Guarantee", "Every order is covered"],
      ["help", "24/7 support", "Real humans, real fast"],
    ];
    rail.innerHTML = benefits.map(([ic, title, copy]) => `<div class="benefit">
      <span class="benefit-icon">${A.icon(ic)}</span>
      <div><strong>${title}</strong><span>${copy}</span></div>
    </div>`).join("");
  }

  function renderCategories() {
    const rail = $("#catRail");
    if (!rail) return;
    rail.innerHTML = A.categories.map((c) => `<a class="cat-tile" href="shop.html?category=${c.slug}">
      <span class="cat-tile-img">${A.icon(c.icon)}</span>
      <span>${A.escapeHTML(c.short)}</span>
      <small>${c.count} items</small>
    </a>`).join("") + `<a class="cat-tile" href="shop.html">
      <span class="cat-tile-img">${A.icon("grid")}</span>
      <span>All departments</span>
      <small>179 items</small>
    </a>`;
  }

  /* ------------------------------------------------------------------ */
  /* Countdown helpers                                                   */
  /* ------------------------------------------------------------------ */
  const endOfDay = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };
  const FLASH_END = Date.now() + 1000 * 60 * 60 * 7 + 1000 * 42;

  function bindCountdowns() {
    const tick = () => {
      $$("[data-countdown]").forEach((el) => {
        const target = Number(el.dataset.countdown) || FLASH_END;
        let diff = Math.max(0, target - Date.now());
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        diff %= 3600000;
        const m = String(Math.floor(diff / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        const hEl = el.querySelector("[data-cd-h]");
        const mEl = el.querySelector("[data-cd-m]");
        const sEl = el.querySelector("[data-cd-s]");
        if (hEl) hEl.textContent = h;
        if (mEl) mEl.textContent = m;
        if (sEl) sEl.textContent = s;
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  function countdownHTML(target) {
    return `<div class="countdown" data-countdown="${target}" aria-label="Sale ends soon">
      <span class="countdown-box" data-cd-h>00</span><span class="countdown-sep">:</span>
      <span class="countdown-box" data-cd-m>00</span><span class="countdown-sep">:</span>
      <span class="countdown-box" data-cd-s>00</span>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Flash deals                                                         */
  /* ------------------------------------------------------------------ */
  const flashProducts = () => {
    const flash = A.products.filter((p) => p.flash);
    return (flash.length ? flash : A.products.slice().sort((a, b) => b.discount - a.discount)).slice(0, 10);
  };

  function renderFlash() {
    const rail = $("#flashRail");
    if (!rail) return;
    rail.innerHTML = flashProducts().map((p) => A.productCard(p)).join("");
    $("#flashCountdown") && ($("#flashCountdown").innerHTML = countdownHTML(FLASH_END));
    const soldEl = $("#flashSold");
    if (soldEl) soldEl.textContent = flashProducts().reduce((s, p) => s + p.sold, 0).toLocaleString();
  }

  /* ------------------------------------------------------------------ */
  /* Tabs / rails                                                        */
  /* ------------------------------------------------------------------ */
  const TABS = [
    ["all", "Trending now"],
    ["phones", "Phones & tablets"],
    ["fashion", "Fashion"],
    ["home", "Home & kitchen"],
    ["beauty", "Beauty"],
  ];

  function renderTrending(active) {
    const rail = $("#trendingRail");
    if (!rail) return;
    let list = A.products.filter((p) => p.category !== "groceries" || active === "all");
    if (active !== "all") list = list.filter((p) => p.category === active);
    list = list.sort((a, b) => b.sold - a.sold).slice(0, 10);
    rail.innerHTML = list.map((p) => A.productCard(p)).join("");
    rail.scrollTo({ left: 0 });
  }

  function renderBestsellers() {
    const rail = $("#bestRail");
    if (!rail) return;
    const list = A.products.slice().sort((a, b) => b.rating * 1000 + b.sold - (a.rating * 1000 + a.sold)).slice(0, 10);
    rail.innerHTML = list.map((p) => A.productCard(p)).join("");
  }

  function renderNewArrivals() {
    const grid = $("#newGrid");
    if (!grid) return;
    const list = A.products.filter((p) => p.newArrival).slice(0, 10);
    grid.innerHTML = (list.length >= 10 ? list : A.products.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 10))
      .map((p) => A.productCard(p)).join("");
  }

  function renderRecentlyViewed() {
    const wrap = $("#recentSection");
    const rail = $("#recentRail");
    if (!wrap || !rail) return;
    const list = A.state.recent.map((id) => A.getProduct(id)).filter(Boolean).slice(0, 10);
    wrap.hidden = list.length === 0;
    rail.innerHTML = list.map((p) => A.productCard(p)).join("");
  }

  function bindRails() {
    $$(".rail-wrap").forEach((wrap) => {
      const rail = $(".rail", wrap);
      const prev = $(".rail-prev", wrap);
      const next = $(".rail-next", wrap);
      if (!rail || !prev || !next) return;
      const step = () => Math.max(220, rail.clientWidth * 0.65);
      prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
      next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
      const sync = () => {
        prev.disabled = rail.scrollLeft < 8;
        next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
      };
      rail.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    });
  }

  function bindTabs() {
    const wrap = $("#trendingTabs");
    if (!wrap) return;
    wrap.innerHTML = TABS.map(([key, label], i) => `<button class="pill-tab ${i === 0 ? "is-active" : ""}" data-trend-tab="${key}" aria-pressed="${i === 0}">${label}</button>`).join("");
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-trend-tab]");
      if (!btn) return;
      $$(".pill-tab", wrap).forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      renderTrending(btn.dataset.trendTab);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Data-driven static content                                          */
  /* ------------------------------------------------------------------ */
  function renderCategoryCards() {
    const wrap = $("#categoryCards");
    if (!wrap) return;
    const picks = ["phones", "fashion", "home", "beauty"];
    wrap.innerHTML = picks.slice(0, 3).map((slug) => {
      const c = A.categories.find((x) => x.slug === slug);
      if (!c) return "";
      return `<a class="cat-card" href="shop.html?category=${c.slug}">
        <img src="${c.image}" alt="" loading="lazy">
        <strong>${A.escapeHTML(c.name)}</strong>
        <span>${c.count} products · from ${A.money(Math.min(...A.products.filter((p) => p.category === c.slug).map((p) => p.price)))}</span>
        <span class="go">${A.icon("arrow-up-right")}</span>
      </a>`;
    }).join("");
  }

  function renderBrandStrip() {
    const strip = $("#brandStrip");
    if (!strip) return;
    const brands = [...new Set(A.products.map((p) => p.brand))].filter((b) => b.length < 24).slice(0, 9);
    strip.innerHTML = brands.map((b) => `<a class="brand-logo" href="shop.html?q=${encodeURIComponent(b)}">${A.escapeHTML(b)}</a>`).join("");
  }

  function renderTrustStats() {
    const wrap = $("#trustStats");
    if (!wrap) return;
    const orders = A.products.reduce((s, p) => s + p.sold, 0);
    const stats = [
      [Math.round(orders / 1000) + "k+", "Happy orders delivered"],
      ["4.8/5", "Average customer rating"],
      ["99.2%", "On-time delivery"],
      ["24/7", "Human support"],
    ];
    wrap.innerHTML = stats.map(([v, l]) => `<div class="trust-stat"><strong>${v}</strong><span>${l}</span></div>`).join("");
  }

  function renderTestimonials() {
    const grid = $("#testimonialGrid");
    if (!grid) return;
    const items = [
      { name: "Amaka Okafor", city: "Lagos", stars: 5, text: "Ordered a MacBook on Tuesday and it arrived Thursday morning, sealed and perfect. The delivery updates were spot on — this is how online shopping should feel." },
      { name: "Kwame Mensah", city: "Accra", stars: 5, text: "Tundara has become my default. Prices are honest, the product photos match reality, and returns were painless when I ordered the wrong size." },
      { name: "Zanele Dlamini", city: "Johannesburg", stars: 4, text: "Beautiful packaging and genuinely helpful support. I asked about a warranty at 10pm and had a real answer in minutes. My new go-to marketplace." },
    ];
    grid.innerHTML = items.map((t) => `<div class="testimonial">
      ${A.stars(t.stars)}
      <p>“${t.text}”</p>
      <div class="testimonial-user">
        <span class="avatar">${t.name.charAt(0)}</span>
        <div><strong>${t.name}</strong><span>${t.city} · Verified buyer</span></div>
      </div>
    </div>`).join("");
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  function init() {
    renderHero();
    renderBenefits();
    renderCategories();
    renderFlash();
    bindTabs();
    renderTrending("all");
    renderBestsellers();
    renderNewArrivals();
    renderRecentlyViewed();
    renderCategoryCards();
    renderBrandStrip();
    renderTrustStats();
    renderTestimonials();
    bindRails();
    bindCountdowns();
    A.refreshMoney();

    document.addEventListener("zm:currency", () => {
      renderHero();
      renderBenefits();
      renderFlash();
      renderTrending($(".pill-tab.is-active")?.dataset.trendTab || "all");
      renderBestsellers();
      renderNewArrivals();
      renderRecentlyViewed();
      renderCategoryCards();
    });
    document.addEventListener("zm:wishlist", () => A.refreshMoney());
  }

  onReady(init);
})();
