/* ==========================================================================
   Tundara — product detail page
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));
  const esc = A.escapeHTML;
  const fmtDate = (iso) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

  const id = Number(new URLSearchParams(location.search).get("id"));
  const product = A.getProduct(id);
  let qty = 1;
  let variant = product?.variants?.[0]?.options?.[0]?.label || "";
  let delta = product ? A.variantDelta(product, variant) : 0;
  let activeTab = "overview";

  /* ------------------------------------------------------------------ */
  /* Not found                                                           */
  /* ------------------------------------------------------------------ */
  function renderNotFound() {
    const root = $("#pdpRoot");
    if (!root) return;
    document.title = "Product not found · Tundara";
    root.innerHTML = `<div class="empty-state" style="padding-top:60px">
      <div class="empty-icon">${A.icon("package")}</div>
      <h1 style="font-size:1.5rem">We couldn't find that product</h1>
      <p>The link may be old or the product may have sold out. Let's find you something else.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <a class="btn btn-primary" href="shop.html">Browse all products ${A.icon("arrow-right")}</a>
        <a class="btn btn-outline" href="index.html">Back home</a>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Delivery estimate                                                   */
  /* ------------------------------------------------------------------ */
  function etaText() {
    const days = product.deliveryDays || 3;
    const d = new Date();
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) added++;
    }
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  /* ------------------------------------------------------------------ */
  /* Gallery / info                                                      */
  /* ------------------------------------------------------------------ */
  function galleryHTML() {
    const images = product.images?.length ? product.images : [product.image];
    const badges = `<div class="gallery-badge">
      ${product.discount ? `<span class="badge badge-sale">-${product.discount}%</span>` : ""}
      ${product.badge ? `<span class="badge ${product.badge === "Flash Sale" ? "badge-flash" : product.badge === "New Arrival" ? "badge-new" : "badge-best"}">${product.badge}</span>` : ""}
      ${product.official ? `<span class="badge badge-official">${A.icon("badge-check")} Official store</span>` : ""}
    </div>`;
    return `<div class="gallery-wrap">
      ${images.length > 1 ? `<div class="gallery-thumbs" role="group" aria-label="Product images">
        ${images.map((src, i) => `<button class="gallery-thumb ${i === 0 ? "is-active" : ""}" data-thumb="${i}" data-src="${src}" aria-label="View image ${i + 1}"><img src="${src}" alt=""></button>`).join("")}
      </div>` : ""}
      <div>
        <div class="gallery-main" id="galleryMain">
          <img src="${images[0]}" alt="${esc(product.title)}" id="galleryImage">
          ${badges}
          <button class="gallery-wish ${A.inWishlist(product.id) ? "is-active" : ""}" data-wish="${product.id}" aria-label="Save to wishlist" aria-pressed="${A.inWishlist(product.id)}">${A.icon("heart")}</button>
          <span class="zoom-hint">${A.icon("search")} Hover to zoom</span>
        </div>
        <div class="gallery-mobile-dots">${images.map((_, i) => `<span class="${i === 0 ? "is-active" : ""}" data-dot="${i}"></span>`).join("")}</div>
      </div>
    </div>`;
  }

  function ratingLine() {
    return `<div class="rating">${A.stars(product.rating)} <b>${product.rating.toFixed(1)}</b> <button class="rating-count" id="jumpReviews" style="text-decoration:underline">(${Number(product.reviewCount).toLocaleString()} reviews)</button></div>`;
  }

  function infoHTML() {
    const lowStock = product.stock <= 14;
    const saving = product.oldPrice - product.price;
    return `<div class="pdp-info">
      <div class="pdp-brand">${esc(product.brand)} ${product.verifiedSeller ? `<span class="verified" title="Verified brand">${A.icon("check")}</span>` : ""}</div>
      <h1 class="pdp-title">${esc(product.title)}</h1>
      <div class="pdp-meta">
        ${ratingLine()}
        <span class="meta-div"></span>
        <span>${Number(product.sold).toLocaleString()} sold</span>
        <span class="meta-div"></span>
        <span class="in-stock">${A.icon("check-circle")} ${lowStock ? `Only ${product.stock} left` : "In stock"}</span>
        <span class="meta-div"></span>
        <span>SKU: ${esc(product.sku)}</span>
      </div>
      <div class="pdp-price-box">
        <div class="pdp-price-row">
          <span class="pdp-price" id="pdpPrice" data-usd="${product.price + delta}">${A.money(product.price + delta)}</span>
          <span class="pdp-old" id="pdpOld" data-usd="${product.oldPrice + delta}">${A.money(product.oldPrice + delta)}</span>
          <span class="pdp-off" id="pdpOff">Save ${Math.round(product.discount)}%</span>
        </div>
        <div class="pdp-price-note">${A.icon("tag")} You save <strong id="pdpSaving" data-usd="${saving}">${A.money(saving)}</strong> today · VAT included where applicable</div>
        ${lowStock ? `<div class="stock-urgency"><span>Almost gone</span><div class="stock-mini-bar"><span style="width:${Math.max(15, 100 - product.stock * 5)}%"></span></div><span>${product.stock} left</span></div>` : ""}
      </div>

      ${product.variants?.length && product.variants[0].options.length > 1 ? `<div class="variant-group">
        <div class="variant-label">${esc(product.variants[0].name)} <span id="variantNote">${esc(variant)} selected</span></div>
        <div class="variant-options">
          ${product.variants[0].options.map((o) => `<button class="variant-btn ${o.label === variant ? "is-active" : ""}" data-variant="${esc(o.label)}" data-delta="${o.delta}">${esc(o.label)}${Number(o.delta) > 0 ? ` <small>+${A.money(o.delta)}</small>` : ""}</button>`).join("")}
        </div>
      </div>` : ""}

      <div class="variant-group">
        <div class="variant-label">Quantity <span>${lowStock ? `Max ${product.stock}` : "In stock"}</span></div>
        <div class="qty-row" style="display:flex;gap:10px;align-items:center">
          <div class="qty qty-lg"><button id="pdpMinus" aria-label="Decrease quantity">${A.icon("minus")}</button><span id="pdpQty">1</span><button id="pdpPlus" aria-label="Increase quantity">${A.icon("plus")}</button></div>
          <span style="font-size:.72rem;color:var(--muted)">${product.freeShipping ? "Free delivery on this item" : `Free delivery over ${A.money(A.freeShippingUSD)}`}</span>
        </div>
      </div>

      <div class="pdp-actions">
        <button class="btn btn-primary btn-add" id="pdpAdd">${A.icon("cart")} Add to basket</button>
        <button class="btn btn-accent btn-buy" id="pdpBuy">Buy now</button>
        <button class="btn btn-outline btn-icon" data-wish="${product.id}" aria-label="Save to wishlist">${A.icon("heart")}</button>
      </div>

      <div class="pdp-delivery">
        <div class="delivery-row">${A.icon("truck")}<div><strong>Delivery to ${esc(A.regionLabel())}</strong><span>Arrives <b>${etaText()}</b> · Standard delivery ${product.freeShipping ? "free" : A.money(3.99)}</span><span class="loc-link" data-region-open>Change location</span></div></div>
        <div class="delivery-row">${A.icon("returns")}<div><strong>7-day easy returns</strong><span>${esc(product.returnPolicy)} · ${esc(product.warranty)}</span></div></div>
        <div class="delivery-row">${A.icon("shield")}<div><strong>Tundara Guarantee</strong><span>Genuine product guarantee or your money back.</span></div></div>
      </div>

      <div class="seller-box">
        <span class="seller-avatar">${esc(product.seller.charAt(0))}</span>
        <div style="min-width:0">
          <strong>${esc(product.seller)} ${product.verifiedSeller ? `<span class="badge badge-success">${A.icon("badge-check")} Verified</span>` : ""}</strong>
          <span>${product.sellerRating.toFixed(1)}★ seller rating · ${Number(product.sellerFollowers).toLocaleString()} followers</span>
        </div>
        <button class="btn btn-outline btn-sm" id="sellerChat">Message</button>
      </div>

      <div class="pdp-perks">
        <div class="pdp-perk">${A.icon("shield")} Genuine product</div>
        <div class="pdp-perk">${A.icon("truck")} Fast dispatch</div>
        <div class="pdp-perk">${A.icon("credit-card")} Secure payment</div>
      </div>

      <div class="pdp-share">
        <span>Share:</span>
        <button data-copy="${location.href}" aria-label="Copy product link">${A.icon("copy")}</button>
        <button data-share="${location.href}" aria-label="Share product">${A.icon("share")}</button>
        <a href="https://wa.me/?text=${encodeURIComponent(product.title + " " + location.href)}" target="_blank" rel="noopener" class="pdp-share" aria-label="Share on WhatsApp" style="margin:0;width:28px;height:28px;border-radius:7px;background:var(--surface-2);display:grid;place-items:center;color:var(--muted)">${A.icon("chat")}</a>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Tabs                                                                */
  /* ------------------------------------------------------------------ */
  function specsTable() {
    return `<table class="spec-table"><tbody>${product.specs.map((s) => `<tr><th scope="row">${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join("")}</tbody></table>`;
  }

  function reviewsHTML() {
    const reviews = A.generateReviews(product);
    const dist = A.ratingDistribution(product);
    return `<h2 class="sr-only">Customer reviews</h2>
    <div class="review-summary">
      <div class="review-score"><strong>${product.rating.toFixed(1)}</strong>${A.stars(product.rating)}<span>${Number(product.reviewCount).toLocaleString()} verified reviews</span></div>
      <div class="review-bars">
        ${dist.map((d) => `<button class="review-bar" data-star-filter="${d.star}" style="border:0;background:none;padding:0;text-align:left"><span>${d.star} star</span><span class="bar"><span style="width:${d.pct}%"></span></span><span>${d.pct}%</span></button>`).join("")}
      </div>
    </div>
    <div class="review-toolbar">
      <span style="font-size:.8rem;color:var(--muted)">Showing ${reviews.length} reviews</span>
      <button class="btn btn-primary btn-sm" id="writeReviewBtn">${A.icon("star")} Write a review</button>
    </div>
    <div id="reviewList">${reviews.map(reviewHTML).join("")}</div>
    <form class="review-form" id="reviewForm" hidden>
      <h2>Share your experience</h2>
      <div class="star-input" id="starInput" role="radiogroup" aria-label="Your rating">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n <= 5 ? "is-on" : ""}" data-star="${n}" role="radio" aria-checked="${n === 5}" aria-label="${n} stars">★</button>`).join("")}
      </div>
      <div class="form-grid">
        <div class="field"><label for="revName">Your name</label><input class="input" id="revName" placeholder="e.g. Ada O." required></div>
        <div class="field"><label for="revTitle">Review title</label><input class="input" id="revTitle" placeholder="Sum it up in a few words" required></div>
        <div class="field span-2"><label for="revBody">Your review</label><textarea class="textarea" id="revBody" placeholder="What did you like or dislike? How was the quality?" required></textarea></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn-primary" type="submit">Publish review</button>
        <button class="btn btn-ghost" type="button" id="cancelReview">Cancel</button>
      </div>
    </form>`;
  }

  function reviewHTML(r) {
    return `<article class="review-item">
      <div class="review-item-head">
        <span class="avatar" style="width:32px;height:32px;font-size:.72rem">${esc(r.name.charAt(0))}</span>
        <strong>${esc(r.name)}</strong>
        ${r.verified ? `<span class="badge badge-success">${A.icon("check")} Verified purchase</span>` : ""}
        ${r.mine ? `<span class="badge badge-soft">Your review</span>` : ""}
        <span class="review-date">${fmtDate(r.date)}</span>
      </div>
      ${A.stars(r.rating)}
      <h3>${esc(r.title)}</h3>
      <p>${esc(r.body)}</p>
      <button class="btn btn-ghost btn-xs" style="margin-top:8px" data-helpful>${A.icon("check-circle")} Helpful (${r.helpful})</button>
    </article>`;
  }

  function tabsHTML() {
    return `<section class="pdp-tabs-section" id="pdpTabs">
      <div class="tabs-nav" role="tablist">
        <button class="tab-btn ${activeTab === "overview" ? "is-active" : ""}" data-tab="overview" role="tab">Overview</button>
        <button class="tab-btn ${activeTab === "specs" ? "is-active" : ""}" data-tab="specs" role="tab">Specifications</button>
        <button class="tab-btn ${activeTab === "reviews" ? "is-active" : ""}" data-tab="reviews" role="tab">Reviews (${Number(product.reviewCount).toLocaleString()})</button>
        <button class="tab-btn ${activeTab === "delivery" ? "is-active" : ""}" data-tab="delivery" role="tab">Delivery & returns</button>
      </div>
      <div class="tab-panel ${activeTab === "overview" ? "is-active" : ""}" data-panel="overview">
        <div class="overview-grid">
          <div class="prose">
            <h2>About this product</h2>
            <p>${esc(product.description)}</p>
            <p>Every item sold on Tundara is checked by our team and backed by Tundara Guarantee. If it isn't as described, we'll make it right — no stress, no small print.</p>
            <ul class="highlight-list">${(product.highlights || []).map((h) => `<li>${A.icon("check-circle")} ${esc(h)}</li>`).join("")}</ul>
          </div>
          <div>
            <h2 style="font-size:.92rem;margin-bottom:8px">At a glance</h2>
            ${specsTable()}
          </div>
        </div>
      </div>
      <div class="tab-panel ${activeTab === "specs" ? "is-active" : ""}" data-panel="specs">
        <div class="overview-grid">
          <div>${specsTable()}</div>
          <div class="prose"><h2>What's in the box</h2><ul class="highlight-list">${(product.highlights || []).slice(0, 5).map((h) => `<li>${A.icon("package")} ${esc(h)}</li>`).join("")}</ul><p style="margin-top:14px;font-size:.78rem;color:var(--muted)">Actual contents may vary slightly by variant. Contact support if anything is missing.</p></div>
        </div>
      </div>
      <div class="tab-panel ${activeTab === "reviews" ? "is-active" : ""}" data-panel="reviews">${reviewsHTML()}</div>
      <div class="tab-panel ${activeTab === "delivery" ? "is-active" : ""}" data-panel="delivery">
        <div class="overview-grid">
          <div class="prose">
            <h2>Delivery</h2>
            <p>Orders placed before 2pm are dispatched the same working day. Standard delivery takes ${product.deliveryDays || 3}–${(product.deliveryDays || 3) + 2} business days and is free on orders over ${A.money(A.freeShippingUSD)}. Express delivery is available in major cities.</p>
            <p>${esc(product.shippingInfo)}. You'll receive tracking details by email and SMS as soon as your parcel leaves the seller.</p>
            <h2>Returns & warranty</h2>
            <p>${esc(product.returnPolicy)}. Change your mind? You have 7 days from delivery to return eligible items in their original condition. ${esc(product.warranty)} is provided by the seller and backed by Tundara.</p>
          </div>
          <div class="pdp-delivery" style="margin-top:0">
            <div class="delivery-row">${A.icon("truck")}<div><strong>Standard delivery</strong><span>${etaText()} · ${product.freeShipping ? "Free" : A.money(3.99)}</span></div></div>
            <div class="delivery-row">${A.icon("zap")}<div><strong>Express delivery</strong><span>1–2 business days · ${A.money(5.99)}</span></div></div>
            <div class="delivery-row">${A.icon("store")}<div><strong>Click & collect</strong><span>Ready in 24 hours · Free</span></div></div>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Related / recent                                                    */
  /* ------------------------------------------------------------------ */
  function relatedHTML() {
    const related = A.products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
    const recent = A.state.recent.map((rid) => A.getProduct(rid)).filter((p) => p && p.id !== product.id).slice(0, 5);
    return `<section class="section" id="relatedSection">
      <div class="section-head">
        <div><h2>More in ${esc(A.categories.find((c) => c.slug === product.category)?.name || "this department")}</h2><p>Handpicked favourites from the same department.</p></div>
        <a class="section-link" href="shop.html?category=${product.category}">View all ${A.icon("arrow-right")}</a>
      </div>
      <div class="product-grid">${related.map((p) => A.productCard(p)).join("")}</div>
    </section>
    ${recent.length ? `<section class="section" id="recentSection">
      <div class="section-head"><div><h2>Recently viewed</h2></div></div>
      <div class="product-grid">${recent.map((p) => A.productCard(p)).join("")}</div>
    </section>` : ""}`;
  }

  /* ------------------------------------------------------------------ */
  /* Interactions                                                        */
  /* ------------------------------------------------------------------ */
  function updatePrice() {
    const priceEl = $("#pdpPrice");
    const oldEl = $("#pdpOld");
    const savingEl = $("#pdpSaving");
    const stickyPrice = $("#stickyPrice");
    if (priceEl) { priceEl.dataset.usd = product.price + delta; priceEl.textContent = A.money(product.price + delta); }
    if (oldEl) { oldEl.dataset.usd = product.oldPrice + delta; oldEl.textContent = A.money(product.oldPrice + delta); }
    if (savingEl) { savingEl.dataset.usd = Math.max(0, product.oldPrice - product.price); savingEl.textContent = A.money(Math.max(0, product.oldPrice - product.price)); }
    if (stickyPrice) { stickyPrice.dataset.usd = product.price + delta; stickyPrice.textContent = A.money(product.price + delta); }
    const note = $("#variantNote");
    if (note) note.textContent = `${variant} selected`;
    $$(".variant-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.variant === variant));
  }

  function bindGallery() {
    $$(".gallery-thumb").forEach((btn) => btn.addEventListener("click", () => {
      $$(".gallery-thumb").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const img = $("#galleryImage");
      if (img) img.src = btn.dataset.src;
    }));
    const main = $("#galleryMain");
    const img = $("#galleryImage");
    if (main && img) {
      main.addEventListener("mousemove", (e) => {
        const rect = main.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = "scale(1.65)";
      });
      main.addEventListener("mouseleave", () => { img.style.transform = ""; img.style.transformOrigin = ""; });
      main.addEventListener("click", (e) => {
        if (e.target.closest("[data-wish]")) return;
        if (matchMedia("(hover: none)").matches) {
          const isZoom = img.style.transform.includes("scale");
          img.style.transform = isZoom ? "" : "scale(1.7)";
          img.style.transformOrigin = "center";
        }
      });
    }
  }

  function bindInfo() {
    $("#pdpMinus")?.addEventListener("click", () => { qty = Math.max(1, qty - 1); const el = $("#pdpQty"); if (el) el.textContent = qty; });
    $("#pdpPlus")?.addEventListener("click", () => { qty = Math.min(product.stock || 99, qty + 1); const el = $("#pdpQty"); if (el) el.textContent = qty; });
    $$(".variant-btn").forEach((btn) => btn.addEventListener("click", () => {
      variant = btn.dataset.variant;
      delta = Number(btn.dataset.delta) || 0;
      updatePrice();
    }));
    $("#pdpAdd")?.addEventListener("click", () => A.addToCart(product.id, qty, variant));
    $("#pdpBuy")?.addEventListener("click", () => {
      A.addToCart(product.id, qty, variant, { silent: true });
      location.href = "checkout.html";
    });
    $("#stickyAdd")?.addEventListener("click", () => A.addToCart(product.id, qty, variant));
    $("#stickyBuy")?.addEventListener("click", () => { A.addToCart(product.id, qty, variant, { silent: true }); location.href = "checkout.html"; });
    $("#jumpReviews")?.addEventListener("click", () => switchTab("reviews", true));
    $("#sellerChat")?.addEventListener("click", () => {
      document.getElementById("chatFab")?.click();
      A.toast("Chat opened", `You're now chatting about ${product.seller}.`, "info");
    });
    $("#sellerChat")?.setAttribute("title", `Chat about ${product.seller}`);
    document.querySelector("[data-region-open]")?.addEventListener("click", () => A.openRegionModal());
  }

  function bindTabs() {
    $$("[data-tab]").forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
  }

  function switchTab(name, scroll) {
    activeTab = name;
    $$(".tab-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
    $$(".tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
    if (scroll) $("#pdpTabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindReviews() {
    $("#writeReviewBtn")?.addEventListener("click", () => {
      const form = $("#reviewForm");
      if (!form) return;
      form.hidden = !form.hidden;
      if (!form.hidden) form.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    $("#cancelReview")?.addEventListener("click", () => { const form = $("#reviewForm"); if (form) form.hidden = true; });
    let rating = 5;
    $$("#starInput [data-star]").forEach((btn) => btn.addEventListener("click", () => {
      rating = Number(btn.dataset.star);
      $$("#starInput [data-star]").forEach((b) => {
        b.classList.toggle("is-on", Number(b.dataset.star) <= rating);
        b.setAttribute("aria-checked", String(Number(b.dataset.star) === rating));
      });
    }));
    $("#reviewForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#revName").value.trim();
      const title = $("#revTitle").value.trim();
      const body = $("#revBody").value.trim();
      if (!name || !title || !body) { A.toast("Almost there", "Please complete every field before publishing.", "error"); return; }
      A.addReview(product.id, { name, rating, title, body, helpful: 0 });
      A.toast("Review published", "Thanks for helping other shoppers.", "success");
      const panel = $('[data-panel="reviews"]');
      if (panel) panel.innerHTML = reviewsHTML();
      bindReviews();
    });
    $$("[data-helpful]").forEach((btn) => btn.addEventListener("click", () => {
      if (btn.dataset.voted) return;
      btn.dataset.voted = "1";
      btn.innerHTML = `${A.icon("badge-check")} Helpful · thanks!`;
    }));
    $$("[data-star-filter]").forEach((btn) => btn.addEventListener("click", () => A.toast("Filter applied", `Showing ${btn.dataset.star}-star reviews.`, "info")));
  }

  /* ------------------------------------------------------------------ */
  /* Sticky bar                                                          */
  /* ------------------------------------------------------------------ */
  function stickyHTML() {
    return `<div class="pdp-sticky-bar">
      <img src="${product.image}" alt="">
      <div><span class="price" id="stickyPrice" data-usd="${product.price + delta}">${A.money(product.price + delta)}</span><div style="font-size:.62rem;color:var(--muted)">${esc(product.title.slice(0, 38))}${product.title.length > 38 ? "…" : ""}</div></div>
      <button class="btn btn-outline btn-sm" id="stickyBuy">Buy now</button>
      <button class="btn btn-primary btn-sm" id="stickyAdd">${A.icon("cart")} Add</button>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  function init() {
    if (!product) { renderNotFound(); return; }
    A.pushRecent(product.id);
    document.title = `${product.title} · Tundara`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", product.description.slice(0, 160));

    const root = $("#pdpRoot");
    root.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span class="sep">/</span>
        <a href="shop.html?category=${product.category}">${esc(A.categories.find((c) => c.slug === product.category)?.name || product.category)}</a><span class="sep">/</span>
        <a href="shop.html?category=${product.category}&sub=${encodeURIComponent(product.subcategory)}">${esc(product.subcategory)}</a><span class="sep">/</span>
        <span aria-current="page">${esc(product.title)}</span>
      </nav>
      <div class="pdp-layout">
        ${galleryHTML()}
        ${infoHTML()}
      </div>
      ${tabsHTML()}
      ${relatedHTML()}`;
    document.body.insertAdjacentHTML("beforeend", stickyHTML());
    document.body.classList.add("has-sticky-bar");

    bindGallery();
    bindInfo();
    bindTabs();
    bindReviews();

    document.addEventListener("zm:currency", updatePrice);
    document.addEventListener("zm:region", () => {
      const row = $(".pdp-delivery .delivery-row strong");
      if (row) row.textContent = `Delivery to ${A.regionLabel()}`;
    });
    document.addEventListener("zm:wishlist", () => {
      const btn = $(".gallery-wish");
      if (!btn) return;
      const active = A.inWishlist(product.id);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    A.refreshMoney();
  }

  onReady(init);
})();
