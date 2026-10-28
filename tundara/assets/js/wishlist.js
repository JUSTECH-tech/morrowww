/* ==========================================================================
   Tundara — wishlist page
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  let sort = "recent";

  const SORTS = {
    recent: (a, b) => A.state.wishlist.indexOf(a.id) - A.state.wishlist.indexOf(b.id),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    discount: (a, b) => b.discount - a.discount,
    name: (a, b) => a.title.localeCompare(b.title),
  };

  const savedProducts = () => A.state.wishlist.map((id) => A.getProduct(id)).filter(Boolean);

  function totalSaving(list) {
    return list.reduce((sum, p) => sum + Math.max(0, (p.oldPrice || p.price) - p.price), 0);
  }

  function toolbarHTML(count, saving) {
    return `<div class="wishlist-toolbar">
      <span><b style="color:var(--ink)">${count}</b> saved item${count === 1 ? "" : "s"}${saving > 0 ? ` · you're saving <b style="color:var(--brand)" data-usd="${saving.toFixed(2)}">${A.money(saving)}</b>` : ""}</span>
      <div class="actions">
        <label class="sort-wrap" style="margin-right:2px"><span>Sort</span>
          <select class="select" id="wishSort" aria-label="Sort wishlist" style="min-height:34px;width:150px;padding:5px 28px 5px 9px;font-size:.74rem">
            <option value="recent" ${sort === "recent" ? "selected" : ""}>Recently saved</option>
            <option value="price-asc" ${sort === "price-asc" ? "selected" : ""}>Price: low to high</option>
            <option value="price-desc" ${sort === "price-desc" ? "selected" : ""}>Price: high to low</option>
            <option value="rating" ${sort === "rating" ? "selected" : ""}>Top rated</option>
            <option value="discount" ${sort === "discount" ? "selected" : ""}>Biggest discount</option>
            <option value="name" ${sort === "name" ? "selected" : ""}>A – Z</option>
          </select>
        </label>
        <button class="btn btn-outline btn-xs" type="button" data-share="${A.escapeHTML(location.href)}">${A.icon("share")} Share</button>
        <button class="btn btn-soft btn-xs" type="button" data-add-all>${A.icon("cart")} Add all to basket</button>
        <button class="btn btn-danger-soft btn-xs" type="button" data-clear-wishlist>${A.icon("trash")} Clear</button>
      </div>
    </div>`;
  }

  function emptyHTML() {
    return `<div class="empty-state panel" style="padding:70px 20px">
      <div class="empty-icon">${A.icon("heart")}</div>
      <h2>Your wishlist is waiting</h2>
      <p>Tap the heart on anything you love and it will live here. Prices update automatically, so you never miss a drop.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <a class="btn btn-primary" href="shop.html">Discover products ${A.icon("arrow-right")}</a>
        <a class="btn btn-outline" href="shop.html?deals=1">${A.icon("flame")} See flash deals</a>
      </div>
    </div>`;
  }

  function renderRecommendations() {
    const wrap = $("#wishlistRecommend");
    if (!wrap) return;
    const saved = new Set(A.state.wishlist);
    const list = A.products
      .filter((p) => !saved.has(p.id))
      .sort((a, b) => b.rating * 1000 + b.sold - (a.rating * 1000 + a.sold))
      .slice(0, 5);
    wrap.innerHTML = list.map((p) => A.productCard(p)).join("");
  }

  function render() {
    const root = $("#wishlistRoot");
    if (!root) return;
    const list = savedProducts().sort(SORTS[sort] || SORTS.recent);

    if (!list.length) {
      root.innerHTML = emptyHTML();
      renderRecommendations();
      return;
    }

    root.innerHTML = `${toolbarHTML(list.length, totalSaving(list))}
      <div class="product-grid cols-4">${list.map((p) => A.productCard(p)).join("")}</div>
      <p class="text-muted" style="font-size:.72rem;margin-top:14px;display:flex;align-items:center;gap:6px">${A.icon("shield")} Saved items are kept on this device. Prices and availability can change — we'll show you the latest when you come back.</p>`;

    renderRecommendations();
    A.refreshMoney();
  }

  function confirmClear() {
    const box = A.openModal(`<div class="modal-head">
        <h3 id="modalTitle">Clear your wishlist?</h3>
        <button class="modal-close" data-close-modal aria-label="Close">${A.icon("x")}</button>
      </div>
      <div class="modal-body">
        <p class="text-muted" style="font-size:.84rem;line-height:1.6">This removes all ${A.state.wishlist.length} saved item${A.state.wishlist.length === 1 ? "" : "s"} from this device. You can always save them again.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
          <button class="btn btn-outline btn-sm" type="button" data-close-modal>Keep them</button>
          <button class="btn btn-danger-soft btn-sm" type="button" id="confirmWishClear">Yes, clear wishlist</button>
        </div>
      </div>`, { size: "sm" });
    box?.querySelector("#confirmWishClear")?.addEventListener("click", () => {
      A.clearWishlist();
      A.closeModal();
      A.toast("Wishlist cleared", "All saved items were removed.", "info");
    });
  }

  function bind() {
    const root = $("#wishlistRoot");
    if (!root) return;

    root.addEventListener("change", (e) => {
      if (e.target.id === "wishSort") {
        sort = e.target.value;
        render();
      }
    });

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-clear-wishlist]")) { confirmClear(); return; }
      if (e.target.closest("[data-add-all]")) {
        const list = savedProducts();
        if (!list.length) return;
        list.forEach((p) => A.addToCart(p.id, 1, null, { silent: true }));
        A.toast("Added to basket", `${list.length} item${list.length === 1 ? "" : "s"} from your wishlist.`, "success");
        A.openCartDrawer();
      }
    });
  }

  function init() {
    render();
    bind();
    document.addEventListener("zm:wishlist", render);
    document.addEventListener("zm:currency", render);
    document.addEventListener("zm:cart", render);
  }

  onReady(init);
})();
