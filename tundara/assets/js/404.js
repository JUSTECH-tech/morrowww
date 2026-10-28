/* ==========================================================================
   Tundara — 404
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = A.escapeHTML;
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  const POPULAR = ["wireless earbuds", "running shoes", "perfume", "kitchen", "smartwatch", "skincare"];

  function init() {
    const params = new URLSearchParams(location.search);
    const direct = ["/", "/404", "/404.html"].includes(location.pathname);
    const missing = params.get("path") || params.get("from") || (direct ? "" : location.pathname + location.search);
    const pathEl = $("#nfPath");
    if (pathEl && missing) {
      pathEl.textContent = missing;
      $("#nfPathWrap")?.removeAttribute("hidden");
    }

    const input = $("#nfInput");
    const form = $("#nfForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = (input?.value || "").trim();
        location.href = "shop.html" + (q ? "?q=" + encodeURIComponent(q) : "");
      });
    }

    const suggestions = $("#nfSuggestions");
    if (suggestions) {
      suggestions.innerHTML = A.categories
        .slice(0, 6)
        .map((c) => `<a class="pill" href="shop.html?category=${c.slug}">${A.icon(c.icon)} ${esc(c.short)}</a>`)
        .join("");
    }

    const searches = $("#nfSearches");
    if (searches) {
      searches.innerHTML = POPULAR.map((q) => `<button class="pill" type="button" data-nf-search="${esc(q)}">${A.icon("search")} ${esc(q)}</button>`).join("");
      searches.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-nf-search]");
        if (!btn) return;
        location.href = "shop.html?q=" + encodeURIComponent(btn.dataset.nfSearch);
      });
    }

    const grid = $("#nfProducts");
    if (grid) {
      const list = A.products
        .slice()
        .sort((a, b) => b.sold - a.sold || b.rating - a.rating)
        .slice(0, 4);
      grid.innerHTML = list.map((p) => A.productCard(p)).join("");
    }

    // Preserve a searched phrase when arriving from the site search.
    const q = params.get("q");
    if (input && q) input.value = q;

    A.refreshMoney();
  }

  onReady(init);
})();
