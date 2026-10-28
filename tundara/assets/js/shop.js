/* ==========================================================================
   Tundara — shop / listing page
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  const params = new URLSearchParams(location.search);
  const F = {
    q: params.get("q") || "",
    cat: params.get("category") || "",
    sub: params.get("sub") || "",
    brands: params.getAll("brand").flatMap((b) => b.split(",")).filter(Boolean),
    min: Number(params.get("min")) || 0,
    max: Number(params.get("max")) || 0,
    rating: Number(params.get("rating")) || 0,
    free: params.get("free") === "1",
    deals: params.get("deals") === "1",
    sort: params.get("sort") || "popular",
    page: Math.max(1, Number(params.get("page")) || 1),
    perPage: [12, 24, 36, 48].includes(Number(params.get("per"))) ? Number(params.get("per")) : 24,
    view: params.get("view") === "list" ? "list" : "grid",
    brandQuery: "",
  };

  let pageResults = [];

  /* ------------------------------------------------------------------ */
  /* Filtering                                                           */
  /* ------------------------------------------------------------------ */
  function searchScore(p, q) {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    let score = 0;
    const hay = `${p.title} ${p.brand} ${p.category} ${p.subcategory} ${p.tags.join(" ")}`.toLowerCase();
    tokens.forEach((t) => {
      if (p.title.toLowerCase().startsWith(t)) score += 8;
      else if (p.title.toLowerCase().includes(t)) score += 5;
      if (p.brand.toLowerCase().includes(t)) score += 3;
      if (hay.includes(t)) score += 1;
    });
    return score;
  }

  function applyFilters() {
    let list = A.products.slice();
    if (F.cat) list = list.filter((p) => p.category === F.cat);
    if (F.sub) list = list.filter((p) => p.subcategory === F.sub);
    if (F.brands.length) list = list.filter((p) => F.brands.includes(p.brand));
    if (F.min) list = list.filter((p) => p.price >= F.min);
    if (F.max) list = list.filter((p) => p.price <= F.max);
    if (F.rating) list = list.filter((p) => p.rating >= F.rating);
    if (F.free) list = list.filter((p) => p.freeShipping);
    if (F.deals) list = list.filter((p) => p.flash || p.discount >= 20);
    if (F.q) {
      list = list
        .map((p) => ({ p, score: searchScore(p, F.q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p);
    }

    switch (F.sort) {
      case "newest":
        list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || b.id - a.id);
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case "discount":
        list.sort((a, b) => b.discount - a.discount);
        break;
      default:
        if (F.q) break;
        list.sort((a, b) => b.sold - a.sold || b.rating - a.rating);
    }
    return list;
  }

  function currentCategory() {
    return A.categories.find((c) => c.slug === F.cat) || null;
  }

  function activeFilterCount() {
    return (
      (F.cat ? 1 : 0) +
      (F.sub ? 1 : 0) +
      F.brands.length +
      (F.min || F.max ? 1 : 0) +
      (F.rating ? 1 : 0) +
      (F.free ? 1 : 0) +
      (F.deals ? 1 : 0) +
      (F.q ? 1 : 0)
    );
  }

  /* ------------------------------------------------------------------ */
  /* URL sync                                                            */
  /* ------------------------------------------------------------------ */
  function syncUrl() {
    const p = new URLSearchParams();
    if (F.q) p.set("q", F.q);
    if (F.cat) p.set("category", F.cat);
    if (F.sub) p.set("sub", F.sub);
    F.brands.forEach((b) => p.append("brand", b));
    if (F.min) p.set("min", String(F.min));
    if (F.max) p.set("max", String(F.max));
    if (F.rating) p.set("rating", String(F.rating));
    if (F.free) p.set("free", "1");
    if (F.deals) p.set("deals", "1");
    if (F.sort !== "popular") p.set("sort", F.sort);
    if (F.page > 1) p.set("page", String(F.page));
    if (F.perPage !== 24) p.set("per", String(F.perPage));
    if (F.view === "list") p.set("view", "list");
    const qs = p.toString();
    history.replaceState(null, "", `${location.pathname}${qs ? "?" + qs : ""}`);
  }

  function go(patch) {
    Object.assign(F, patch);
    if (patch.page === undefined) F.page = 1;
    render();
    window.scrollTo({ top: $("#shopTop")?.offsetTop || 0, behavior: "smooth" });
  }

  /* ------------------------------------------------------------------ */
  /* Hero / breadcrumb                                                   */
  /* ------------------------------------------------------------------ */
  function renderHead() {
    const cat = currentCategory();
    const hero = $("#shopHero");
    if (hero) {
      const title = F.q
        ? `Results for “${A.escapeHTML(F.q)}”`
        : F.deals
        ? "Flash deals & special offers"
        : F.sub || (cat ? cat.name : "All products");
      const copy = F.q
        ? "Every match from across our departments, ranked by relevance. Use the filters to narrow things down."
        : F.deals
        ? "Limited-time price drops across tech, home, fashion and more. When they're gone, they're gone."
        : cat
        ? `Genuine ${cat.name.toLowerCase()} from trusted sellers, with free delivery on orders over ${A.money(A.freeShippingUSD)}.`
        : "Browse every department in one place — 179 curated products, genuine sellers and delivery you can count on.";
      const art = cat
        ? A.products.filter((p) => p.category === cat.slug).slice(0, 3).map((p) => `<img src="${p.image}" alt="">`).join("")
        : A.products.slice(0, 3).map((p) => `<img src="${p.image}" alt="">`).join("");
      hero.innerHTML = `<div>
        <span class="eyebrow" style="color:#bfe9d9">${A.icon(cat ? cat.icon : "grid")} ${cat ? A.escapeHTML(cat.name) : "Everything you love"}</span>
        <h1>${title}</h1>
        <p>${copy}</p>
      </div>
      <div class="shop-hero-art">${art}</div>`;
    }
    const crumb = $("#shopCrumb");
    if (crumb) {
      crumb.innerHTML = `<a href="index.html">Home</a><span class="sep">/</span>${cat ? `<a href="shop.html">Shop</a><span class="sep">/</span><a href="shop.html?category=${cat.slug}">${A.escapeHTML(cat.name)}</a>${F.sub ? `<span class="sep">/</span><span aria-current="page">${A.escapeHTML(F.sub)}</span>` : ""}` : `<span aria-current="page">${F.q ? "Search results" : F.deals ? "Deals" : "All products"}</span>`}`;
    }
    document.title = `${F.q ? "Search: " + F.q : F.deals ? "Deals" : cat ? cat.name : "Shop all"} · Tundara`;
  }

  /* ------------------------------------------------------------------ */
  /* Sidebar                                                             */
  /* ------------------------------------------------------------------ */
  function renderSidebar() {
    const bar = $("#shopSidebar");
    if (!bar) return;
    const catCounts = {};
    A.products.forEach((p) => (catCounts[p.category] = (catCounts[p.category] || 0) + 1));
    const baseForBrands = A.products.filter((p) => (!F.cat || p.category === F.cat) && (!F.sub || p.subcategory === F.sub));
    const brands = [...new Set(baseForBrands.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
    const brandCounts = {};
    baseForBrands.forEach((p) => (brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1));
    const filteredBrands = brands.filter((b) => b.toLowerCase().includes(F.brandQuery.toLowerCase()));

    bar.innerHTML = `
      <div class="filters-head">
        <h2>${A.icon("sliders")} Filters ${activeFilterCount() ? `<span class="badge badge-soft">${activeFilterCount()}</span>` : ""}</h2>
        <div class="filters-head-actions">
          <button class="filter-clear" id="clearFilters">Clear all</button>
          <button class="filter-close" data-close-layers aria-label="Close filters">${A.icon("x")}</button>
        </div>
      </div>
      <details class="filter-group" ${!F.cat ? "open" : ""}>
        <summary>Department ${A.icon("chevron-down", "chev")}</summary>
        <div class="filter-body">
          <div class="filter-list">
            <label class="check"><input type="radio" name="catFilter" value="" ${!F.cat ? "checked" : ""}><span>All departments</span><span class="filter-count">${A.products.length}</span></label>
            ${A.categories.map((c) => `<label class="check"><input type="radio" name="catFilter" value="${c.slug}" ${F.cat === c.slug ? "checked" : ""}><span>${A.escapeHTML(c.name)}</span><span class="filter-count">${catCounts[c.slug] || 0}</span></label>`).join("")}
          </div>
        </div>
      </details>
      ${F.cat && currentCategory() ? `<details class="filter-group" open>
        <summary>Category ${A.icon("chevron-down", "chev")}</summary>
        <div class="filter-body"><div class="filter-list">
          <label class="check"><input type="radio" name="subFilter" value="" ${!F.sub ? "checked" : ""}><span>All ${A.escapeHTML(currentCategory().name)}</span></label>
          ${currentCategory().subs.map((s) => `<label class="check"><input type="radio" name="subFilter" value="${A.escapeHTML(s)}" ${F.sub === s ? "checked" : ""}><span>${A.escapeHTML(s)}</span></label>`).join("")}
        </div></div>
      </details>` : ""}
      <details class="filter-group" ${F.brands.length ? "open" : ""}>
        <summary>Brand ${A.icon("chevron-down", "chev")}</summary>
        <div class="filter-body">
          <div class="input-group filter-search">${A.icon("search")}<input class="input" id="brandSearch" placeholder="Find a brand" value="${A.escapeHTML(F.brandQuery)}" aria-label="Find a brand"></div>
          <div class="filter-list">
            ${filteredBrands.length ? filteredBrands.map((b) => `<label class="check"><input type="checkbox" name="brandFilter" value="${A.escapeHTML(b)}" ${F.brands.includes(b) ? "checked" : ""}><span>${A.escapeHTML(b)}</span><span class="filter-count">${brandCounts[b]}</span></label>`).join("") : `<span class="text-muted" style="font-size:.76rem;padding:6px 0">No brands match.</span>`}
          </div>
        </div>
      </details>
      <details class="filter-group" ${F.min || F.max ? "open" : ""}>
        <summary>Price ${A.icon("chevron-down", "chev")}</summary>
        <div class="filter-body">
          <div class="price-range">
            <input class="input" type="number" inputmode="decimal" min="0" id="minPrice" placeholder="Min" value="${F.min || ""}" aria-label="Minimum price in USD">
            <span>to</span>
            <input class="input" type="number" inputmode="decimal" min="0" id="maxPrice" placeholder="Max" value="${F.max || ""}" aria-label="Maximum price in USD">
          </div>
          <div class="price-presets">
            <button data-price="0,25">Under $25</button>
            <button data-price="25,75">$25–$75</button>
            <button data-price="75,200">$75–$200</button>
            <button data-price="200,0">$200+</button>
          </div>
          <button class="btn btn-outline btn-sm btn-block" id="applyPrice" style="margin-top:9px">Apply price</button>
          <p class="field-hint" style="margin-top:6px">Prices shown in USD equivalent.</p>
        </div>
      </details>
      <details class="filter-group" ${F.rating ? "open" : ""}>
        <summary>Customer rating ${A.icon("chevron-down", "chev")}</summary>
        <div class="filter-body">
          ${[4.5, 4, 3.5, 3].map((r) => `<label class="rating-option"><input type="radio" name="ratingFilter" value="${r}" ${F.rating === r ? "checked" : ""} class="check" style="appearance:auto;width:15px;height:15px;margin:0"> ${A.stars(r)} <span>${r} & up</span></label>`).join("")}
          <button class="filter-clear" id="clearRating" style="margin-top:6px">Any rating</button>
        </div>
      </details>
      <details class="filter-group" open>
        <summary>More filters ${A.icon("chevron-down", "chev")}</summary>
        <div class="filter-body">
          <div class="switch-row"><span>Free delivery only</span><label class="switch"><input type="checkbox" id="freeFilter" aria-label="Free delivery only" ${F.free ? "checked" : ""}><span></span></label></div>
          <div class="switch-row"><span>On sale only</span><label class="switch"><input type="checkbox" id="dealsFilter" aria-label="On sale only" ${F.deals ? "checked" : ""}><span></span></label></div>
        </div>
      </details>
      <div class="filter-apply-mobile"><button class="btn btn-primary" id="applyMobile">Show ${pageResults.length} results</button></div>`;

    bindSidebar();
  }

  function bindSidebar() {
    const bar = $("#shopSidebar");
    if (!bar) return;
    bar.querySelectorAll('input[name="catFilter"]').forEach((el) => el.addEventListener("change", () => go({ cat: el.value, sub: "", brands: [] })));
    bar.querySelectorAll('input[name="subFilter"]').forEach((el) => el.addEventListener("change", () => go({ sub: el.value })));
    bar.querySelectorAll('input[name="brandFilter"]').forEach((el) => el.addEventListener("change", () => {
      F.brands = $$('input[name="brandFilter"]:checked', bar).map((x) => x.value);
      go({ brands: F.brands });
    }));
    bar.querySelectorAll('input[name="ratingFilter"]').forEach((el) => el.addEventListener("change", () => go({ rating: Number(el.value) })));
    $("#brandSearch")?.addEventListener("input", (e) => {
      F.brandQuery = e.target.value;
      const caret = e.target.selectionStart;
      renderSidebar();
      const next = $("#brandSearch");
      if (next) { next.focus(); next.setSelectionRange(caret, caret); }
    });
    $("#applyPrice")?.addEventListener("click", () => {
      const min = Number($("#minPrice")?.value) || 0;
      const max = Number($("#maxPrice")?.value) || 0;
      if (min && max && min > max) { A.toast("Check your price range", "The minimum is higher than the maximum.", "error"); return; }
      go({ min, max });
    });
    bar.querySelectorAll("[data-price]").forEach((btn) => btn.addEventListener("click", () => {
      const [min, max] = btn.dataset.price.split(",").map(Number);
      go({ min, max });
    }));
    $("#clearRating")?.addEventListener("click", () => go({ rating: 0 }));
    $("#freeFilter")?.addEventListener("change", (e) => go({ free: e.target.checked }));
    $("#dealsFilter")?.addEventListener("change", (e) => go({ deals: e.target.checked }));
    $("#clearFilters")?.addEventListener("click", () => {
      Object.assign(F, { q: "", cat: "", sub: "", brands: [], min: 0, max: 0, rating: 0, free: false, deals: false, page: 1 });
      render();
    });
    $("#applyMobile")?.addEventListener("click", () => A.closeLayers());
  }

  /* ------------------------------------------------------------------ */
  /* Results / toolbar / pagination                                      */
  /* ------------------------------------------------------------------ */
  function renderResults() {
    const list = pageResults;
    const total = F._total || 0;
    const pages = Math.max(1, Math.ceil(total / F.perPage));
    if (F.page > pages) F.page = pages;
    const start = (F.page - 1) * F.perPage;
    const pageItems = list.slice(start, start + F.perPage);

    const count = $("#resultsCount");
    if (count) {
      count.innerHTML = total
        ? `<b>${total}</b> result${total === 1 ? "" : "s"}${F.q ? ` for “${A.escapeHTML(F.q)}”` : ""}${total > F.perPage ? ` <span style="color:var(--muted)">· showing ${start + 1}–${Math.min(start + F.perPage, total)}</span>` : ""}`
        : `No results found`;
    }

    const footerCount = $("#shopFooterCount");
    if (footerCount) {
      footerCount.textContent = total
        ? `Showing ${Math.min(start + 1, total)}–${Math.min(start + F.perPage, total)} of ${total} products`
        : "No products to show";
    }

    const wrap = $("#shopResults");
    if (!wrap) return;
    wrap.className = "shop-results" + (F.view === "list" ? " list-view" : "");
    if (!pageItems.length) {
      wrap.innerHTML = `<div class="empty-state panel" style="grid-column:1/-1">
        <div class="empty-icon">${A.icon("search")}</div>
        <h2>Nothing matches those filters</h2>
        <p>Try removing a filter or searching for something broader. We have 179 products across 9 departments.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
          <button class="btn btn-primary" id="emptyClear">Clear filters</button>
          <a class="btn btn-outline" href="shop.html">Browse everything</a>
        </div>
      </div>`;
      $("#emptyClear")?.addEventListener("click", () => {
        Object.assign(F, { q: "", cat: "", sub: "", brands: [], min: 0, max: 0, rating: 0, free: false, deals: false, page: 1 });
        render();
      });
    } else {
      wrap.innerHTML = `<div class="product-grid cols-4">${pageItems.map((p) => A.productCard(p)).join("")}</div>`;
    }

    renderActiveFilters();
    renderPagination(pages, total);

    const sort = $("#sortSelect");
    if (sort) sort.value = F.sort;
    const per = $("#perPageSelect");
    if (per) per.value = String(F.perPage);
    const countMobile = $("#filterCountMobile");
    if (countMobile) countMobile.textContent = activeFilterCount() ? `(${activeFilterCount()})` : "";

    const toggle = $("#viewToggle");
    if (toggle) $$("button", toggle).forEach((b) => b.classList.toggle("is-active", b.dataset.view === F.view));
  }

  function renderActiveFilters() {
    const wrap = $("#activeFilters");
    if (!wrap) return;
    const chips = [];
    const chip = (label, key) => `<span class="chip">${A.escapeHTML(label)}<button data-clear-chip="${key}" aria-label="Remove ${A.escapeHTML(label)} filter">${A.icon("x")}</button></span>`;
    if (F.q) chips.push(chip(`“${F.q}”`, "q"));
    if (F.cat) chips.push(chip(currentCategory()?.name || F.cat, "cat"));
    if (F.sub) chips.push(chip(F.sub, "sub"));
    F.brands.forEach((b) => chips.push(chip(b, `brand:${b}`)));
    if (F.min || F.max) chips.push(chip(`$${F.min || 0} – ${F.max ? "$" + F.max : "any"}`, "price"));
    if (F.rating) chips.push(chip(`${F.rating}★ & up`, "rating"));
    if (F.free) chips.push(chip("Free delivery", "free"));
    if (F.deals) chips.push(chip("On sale", "deals"));
    wrap.innerHTML = chips.length ? `<span>Active:</span>${chips.join("")}<button class="clear-all" id="chipClearAll">Clear all</button>` : "";
    wrap.querySelectorAll("[data-clear-chip]").forEach((btn) => btn.addEventListener("click", () => {
      const key = btn.dataset.clearChip;
      if (key === "q") go({ q: "" });
      else if (key === "cat") go({ cat: "", sub: "", brands: [] });
      else if (key === "sub") go({ sub: "" });
      else if (key === "price") go({ min: 0, max: 0 });
      else if (key === "rating") go({ rating: 0 });
      else if (key === "free") go({ free: false });
      else if (key === "deals") go({ deals: false });
      else if (key.startsWith("brand:")) go({ brands: F.brands.filter((b) => b !== key.slice(6)) });
    }));
    $("#chipClearAll")?.addEventListener("click", () => {
      Object.assign(F, { q: "", cat: "", sub: "", brands: [], min: 0, max: 0, rating: 0, free: false, deals: false, page: 1 });
      render();
    });
  }

  function renderPagination(pages, total) {
    const wrap = $("#shopPagination");
    if (!wrap) return;
    if (total <= F.perPage) { wrap.innerHTML = ""; return; }
    const nums = [];
    const push = (n) => { if (!nums.includes(n)) nums.push(n); };
    push(1);
    for (let i = F.page - 1; i <= F.page + 1; i++) if (i > 1 && i < pages) push(i);
    push(pages);
    nums.sort((a, b) => a - b);
    let html = `<button class="page-btn" data-page="${F.page - 1}" ${F.page === 1 ? "disabled" : ""} aria-label="Previous page">${A.icon("chevron-left")}</button>`;
    let prev = 0;
    nums.forEach((n) => {
      if (prev && n - prev > 1) html += `<span class="page-of">…</span>`;
      html += `<button class="page-btn ${n === F.page ? "is-active" : ""}" data-page="${n}" ${n === F.page ? 'aria-current="page"' : ""}>${n}</button>`;
      prev = n;
    });
    html += `<button class="page-btn" data-page="${F.page + 1}" ${F.page === pages ? "disabled" : ""} aria-label="Next page">${A.icon("chevron-right")}</button>`;
    html += `<span class="page-of">Page ${F.page} of ${pages}</span>`;
    wrap.innerHTML = html;
    wrap.querySelectorAll("[data-page]").forEach((btn) => btn.addEventListener("click", () => go({ page: Number(btn.dataset.page) })));
  }

  /* ------------------------------------------------------------------ */
  /* Toolbar events                                                      */
  /* ------------------------------------------------------------------ */
  function bindToolbar() {
    $("#sortSelect")?.addEventListener("change", (e) => go({ sort: e.target.value }));
    $("#perPageSelect")?.addEventListener("change", (e) => go({ perPage: Number(e.target.value) }));
    $("#viewToggle")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if (!btn) return;
      F.view = btn.dataset.view;
      syncUrl();
      renderResults();
    });
    $("#filterOpen")?.addEventListener("click", (e) => {
      const bar = $("#shopSidebar");
      if (bar) A.drawers.open(bar, e.currentTarget);
    });
    window.addEventListener("popstate", () => location.reload());
  }

  /* ------------------------------------------------------------------ */
  /* Recommendation strip                                                */
  /* ------------------------------------------------------------------ */
  function renderRecommendations() {
    const grid = $("#shopRecommend");
    if (!grid) return;
    const cat = F.cat;
    let list = A.products.filter((p) => !cat || p.category !== cat);
    list = list.sort((a, b) => b.rating - a.rating).slice(0, 5);
    grid.innerHTML = list.map((p) => A.productCard(p)).join("");
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  function render() {
    pageResults = applyFilters();
    F._total = pageResults.length;
    syncUrl();
    renderHead();
    renderSidebar();
    renderResults();
    renderRecommendations();
    document.title = `${F.q ? "Search: " + F.q : F.deals ? "Deals" : currentCategory()?.name || "Shop all"} · Tundara`;
  }

  function init() {
    render();
    bindToolbar();
    document.addEventListener("zm:currency", render);
    document.addEventListener("zm:wishlist", () => renderResults());
  }

  onReady(init);
})();
