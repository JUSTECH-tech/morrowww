/* ==========================================================================
   Tundara — basket page
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const esc = A.escapeHTML;
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  const cart = () => A.state.cart;
  const coupon = () => A.state.coupon;
  const savedIds = () => A.getSaved().map((id) => A.getProduct(id)).filter(Boolean);

  /* ------------------------------------------------------------------ */
  /* Summary                                                             */
  /* ------------------------------------------------------------------ */
  function summaryHTML() {
    const totals = A.computeTotals(cart(), coupon());
    const remaining = Math.max(0, A.freeShippingUSD - totals.subtotal);
    const pct = Math.min(100, (totals.subtotal / A.freeShippingUSD) * 100);
    const applied = coupon() ? A.catalog.coupons.find((c) => c.code === coupon()) : null;
    return `<aside class="summary-card" aria-label="Order summary">
      <h2>Order summary</h2>
      <div class="free-ship cart-ship">
        <div class="free-ship-text"><span>${remaining > 0 ? `Add <span data-usd="${remaining}">${A.money(remaining)}</span> more for free delivery` : "You’ve unlocked free delivery 🎉"}</span><span>${Math.round(pct)}%</span></div>
        <div class="free-ship-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="summary-coupon">
        ${applied
          ? `<div class="coupon-applied"><span>${A.icon("tag")} ${esc(applied.code)} applied · ${applied.label}</span><button type="button" data-coupon-remove aria-label="Remove coupon">${A.icon("x")}</button></div>`
          : `<form class="coupon-form" data-coupon-form>
              <input class="input" name="coupon" placeholder="Promo code" aria-label="Promo code" autocomplete="off">
              <button class="btn btn-outline" type="submit">Apply</button>
            </form>
            <p class="coupon-hint">Try <b>TUN10</b> for 10% off your first order.</p>`}
      </div>
      <div class="summary-row"><span>Subtotal (${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"})</span><strong data-usd="${totals.subtotal}">${A.money(totals.subtotal)}</strong></div>
      ${totals.discount > 0 ? `<div class="summary-row"><span>Discount</span><strong class="text-brand">−<span data-usd="${totals.discount}">${A.money(totals.discount)}</span></strong></div>` : ""}
      <div class="summary-row"><span>Delivery</span><strong class="${totals.freeShipping ? "free" : ""}">${totals.freeShipping ? "Free" : `<span data-usd="${totals.shipping}">${A.money(totals.shipping)}</span>`}</strong></div>
      <div class="summary-row"><span>VAT (7.5%)</span><strong data-usd="${totals.tax}">${A.money(totals.tax)}</strong></div>
      <div class="summary-total"><span>Total</span><strong data-usd="${totals.total}">${A.money(totals.total)}</strong></div>
      <a class="btn btn-primary btn-block" href="checkout.html">Continue to checkout ${A.icon("arrow-right")}</a>
      <div class="summary-note">${A.icon("lock")} Secure checkout · 7-day easy returns</div>
      <div class="payment-row">
        <span class="pay-logo">VISA</span>
        <span class="pay-logo mastercard">Mastercard</span>
        <span class="pay-logo verve">Verve</span>
        <span class="pay-logo momo">MTN MoMo</span>
      </div>
    </aside>`;
  }

  /* ------------------------------------------------------------------ */
  /* Basket rows                                                         */
  /* ------------------------------------------------------------------ */
  function rowHTML(item) {
    const p = A.getProduct(item.id);
    if (!p) return "";
    const unit = A.itemPrice(item);
    const line = unit * item.qty;
    const old = p.oldPrice + (Number(item.delta) || 0);
    return `<div class="cart-row" data-cart-line="${p.id}">
      <a class="cart-row-img" href="${A.productUrl(p)}"><img src="${p.image}" alt="${esc(p.title)}" loading="lazy"></a>
      <div>
        <a class="cart-row-title" href="${A.productUrl(p)}">${esc(p.title)}</a>
        <div class="cart-row-meta">
          <span>${esc(p.brand)}</span>
          ${item.variant ? `<span>${esc(item.variant)}</span>` : ""}
          ${p.stock <= 14 ? `<span class="text-accent">Only ${p.stock} left</span>` : `<span class="text-success">In stock</span>`}
        </div>
        <div class="cart-row-actions">
          <button class="cart-remove" type="button" data-remove="${p.id}" data-variant="${esc(item.variant || "")}">${A.icon("trash")} Remove</button>
          <button class="cart-save" type="button" data-save-later="${p.id}" data-variant="${esc(item.variant || "")}">Save for later</button>
        </div>
      </div>
      <div class="cart-qty-col">
        <div class="qty">
          <button type="button" data-qty-minus="${p.id}" data-variant="${esc(item.variant || "")}" aria-label="Decrease quantity of ${esc(p.title)}">${A.icon("minus")}</button>
          <span>${item.qty}</span>
          <button type="button" data-qty-plus="${p.id}" data-variant="${esc(item.variant || "")}" aria-label="Increase quantity of ${esc(p.title)}">${A.icon("plus")}</button>
        </div>
        <small>${A.money(unit)} each</small>
      </div>
      <div class="cart-price-col">
        <strong data-usd="${line}">${A.money(line)}</strong>
        ${old > unit ? `<del data-usd="${old * item.qty}">${A.money(old * item.qty)}</del>` : ""}
        ${p.freeShipping ? `<span class="free-tag">Free delivery</span>` : ""}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Saved for later                                                     */
  /* ------------------------------------------------------------------ */
  function savedHTML() {
    const items = savedIds();
    if (!items.length) return "";
    return `<section class="saved-section" id="savedSection">
      <div class="section-head">
        <div><h2>Saved for later</h2><p>${items.length} item${items.length === 1 ? "" : "s"} waiting for you.</p></div>
      </div>
      <div class="cart-panel">
        ${items.map((p) => `<div class="cart-row" style="grid-template-columns:84px minmax(0,1fr) auto">
          <a class="cart-row-img" href="${A.productUrl(p)}" style="width:84px;height:84px"><img src="${p.image}" alt="${esc(p.title)}" loading="lazy"></a>
          <div>
            <a class="cart-row-title" href="${A.productUrl(p)}">${esc(p.title)}</a>
            <div class="cart-row-meta"><span>${esc(p.brand)}</span><span>${p.stock > 0 ? "In stock" : "Out of stock"}</span></div>
            <div class="cart-row-actions">
              <button class="btn btn-primary btn-xs" type="button" data-move-cart="${p.id}">${A.icon("cart")} Move to basket</button>
              <button class="cart-remove" type="button" data-saved-remove="${p.id}">${A.icon("trash")} Remove</button>
            </div>
          </div>
          <div class="cart-price-col"><strong data-usd="${p.price}">${A.money(p.price)}</strong></div>
        </div>`).join("")}
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  function render() {
    const root = $("#cartRoot");
    if (!root) return;
    const items = cart();

    if (!items.length) {
      root.innerHTML = `<div class="cart-layout">
        <div class="cart-panel">
          <div class="empty-state">
            <div class="empty-icon">${A.icon("bag")}</div>
            <h2>Your basket is empty</h2>
            <p>Looks like you haven’t added anything yet. Explore thousands of genuine products with delivery you can trust.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
              <a class="btn btn-primary" href="shop.html">Start shopping ${A.icon("arrow-right")}</a>
              <a class="btn btn-outline" href="index.html">Back home</a>
            </div>
          </div>
        </div>
        <aside class="summary-card">
          <h2>Your basket</h2>
          <p class="text-muted" style="font-size:.82rem;line-height:1.6">Sign in to see items you saved on another device, or start a fresh basket. Your wishlist is always waiting.</p>
          <a class="btn btn-outline btn-block mt-16" href="wishlist.html">${A.icon("heart")} View wishlist</a>
          <div class="summary-note">${A.icon("truck")} Free delivery on orders over <span data-usd="${A.freeShippingUSD}">${A.money(A.freeShippingUSD)}</span></div>
        </aside>
      </div>`;
      $("#savedSection")?.remove();
      renderRecommendations();
      return;
    }

    const totals = A.computeTotals(items, coupon());
    root.innerHTML = `<div class="cart-layout">
      <div>
        <div class="cart-panel">
          <div class="cart-head">
            <h2>Your basket <span class="badge badge-soft">${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}</span></h2>
            <button class="cart-remove" type="button" data-clear-cart>${A.icon("trash")} Empty basket</button>
          </div>
          ${items.map(rowHTML).join("")}
          <div class="cart-footer-note">
            <span>${A.icon("shield")} Prices include VAT where applicable · Tundara Guarantee on every order</span>
            <a href="shop.html">Continue shopping ${A.icon("arrow-right")}</a>
          </div>
        </div>
        <div id="savedHolder">${savedHTML()}</div>
      </div>
      ${summaryHTML()}
    </div>`;
    renderRecommendations();
  }

  function renderRecommendations() {
    const wrap = $("#cartRecommend");
    if (!wrap) return;
    const inCart = new Set(cart().map((i) => i.id));
    const list = A.products
      .filter((p) => !inCart.has(p.id))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
    wrap.innerHTML = list.map((p) => A.productCard(p)).join("");
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */
  function bind() {
    const root = $("#cartRoot");
    if (!root) return;

    root.addEventListener("submit", (e) => {
      const form = e.target.closest("[data-coupon-form]");
      if (!form) return;
      e.preventDefault();
      const code = form.querySelector('input[name="coupon"]')?.value || "";
      if (!code.trim()) { A.toast("Enter a code", "Type a promo code to apply it.", "error"); return; }
      const result = A.applyCoupon(code);
      if (!result.ok) {
        A.toast("Code not applied", result.message, "error");
        form.querySelector("input")?.focus();
        return;
      }
      A.toast("Promo applied", `${result.coupon.code} — ${result.coupon.label}`, "success");
      render();
    });

    root.addEventListener("click", (e) => {
      const removeCouponBtn = e.target.closest("[data-coupon-remove]");
      if (removeCouponBtn) {
        A.removeCoupon();
        A.toast("Promo removed", "The discount was taken off your basket.", "info");
        render();
        return;
      }
      const clearBtn = e.target.closest("[data-clear-cart]");
      if (clearBtn) {
        if (!cart().length) return;
        A.clearCart();
        A.toast("Basket emptied", "All items were removed from your basket.", "info");
        render();
        return;
      }
      const saveBtn = e.target.closest("[data-save-later]");
      if (saveBtn) {
        A.saveForLater(saveBtn.dataset.saveLater, saveBtn.dataset.variant || "");
        render();
        return;
      }
      const moveBtn = e.target.closest("[data-move-cart]");
      if (moveBtn) {
        A.moveToCart(moveBtn.dataset.moveCart);
        render();
        return;
      }
      const savedRemove = e.target.closest("[data-saved-remove]");
      if (savedRemove) {
        A.removeSaved(savedRemove.dataset.savedRemove);
        A.toast("Removed", "The item was removed from your saved list.", "info");
        render();
      }
    });

    ["zm:cart", "zm:coupon"].forEach((evt) => document.addEventListener(evt, render));
  }

  onReady(() => {
    render();
    bind();
  });
})();
