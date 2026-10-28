/* ==========================================================================
   Tundara — order confirmation
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = A.escapeHTML;
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  const params = new URLSearchParams(location.search);
  const requested = params.get("order");
  const orders = A.getOrders();
  const order = requested ? A.getOrder(requested) : orders[0];
  const STEPS = ["Confirmed", "Processing", "Shipped", "Delivered"];

  const fmtDate = (iso) =>
    iso
      ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
      : "—";

  function statusRank(status) {
    if (status === "Delivered") return 3;
    if (status === "Shipped") return 2;
    if (status === "Processing") return 1;
    return 0;
  }

  function confettiHTML() {
    const colors = ["#ffd166", "#ff6b35", "#7fe0bc", "#ffffff", "#f2a516", "#62d6b0"];
    return `<div class="confetti" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => {
      const left = (i * 37) % 100;
      const delay = ((i * 13) % 40) / 10;
      const dur = 3.4 + ((i * 7) % 20) / 10;
      const color = colors[i % colors.length];
      const rotate = (i * 47) % 360;
      return `<i style="left:${left}%;--delay:${delay}s;--dur:${dur}s;background:${color};transform:rotate(${rotate}deg)"></i>`;
    }).join("")}</div>`;
  }

  function timelineHTML(status) {
    const rank = statusRank(status);
    return `<div class="order-track-mini" aria-label="Order progress">
      ${STEPS.map((label, i) => `<div class="order-track-step ${i <= rank ? "is-done" : ""}">
        <span class="dot">${i <= rank ? A.icon("check") : i + 1}</span>${label}
      </div>`).join("")}
    </div>`;
  }

  function itemsHTML() {
    return `<div class="success-items">
      <h2 style="font-size:.9rem;margin-bottom:8px">Your items (${order.items.reduce((s, i) => s + i.qty, 0)})</h2>
      <div class="checkout-items" style="max-height:none">
        ${order.items.map((item) => {
          const p = A.getProduct(item.id);
          if (!p) return "";
          return `<div class="checkout-item">
            <img src="${p.image}" alt="${esc(p.title)}" loading="lazy">
            <div style="min-width:0">
              <a class="ci-title" href="${A.productUrl(p)}">${esc(p.title)}</a>
              <div class="ci-meta">${item.variant ? esc(item.variant) + " · " : ""}Qty ${item.qty}</div>
            </div>
            <span class="ci-price" data-usd="${A.itemPrice(item) * item.qty}">${A.money(A.itemPrice(item) * item.qty)}</span>
          </div>`;
        }).join("")}
      </div>
      <div class="summary-row" style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px"><span>Subtotal</span><strong data-usd="${order.totals?.subtotal || 0}">${A.money(order.totals?.subtotal || 0)}</strong></div>
      ${order.totals?.discount ? `<div class="summary-row"><span>Discount${order.coupon ? ` (${esc(order.coupon)})` : ""}</span><strong class="text-brand">−<span data-usd="${order.totals.discount}">${A.money(order.totals.discount)}</span></strong></div>` : ""}
      <div class="summary-row"><span>Delivery</span><strong>${order.totals?.freeShipping ? "Free" : A.money(order.totals?.shipping || 0)}</strong></div>
      <div class="summary-row"><span>VAT (7.5%)</span><strong data-usd="${order.totals?.tax || 0}">${A.money(order.totals?.tax || 0)}</strong></div>
      <div class="summary-total"><span>Total paid</span><strong data-usd="${order.totals?.total || 0}">${A.money(order.totals?.total || 0)}</strong></div>
    </div>`;
  }

  function infoHTML() {
    return `<aside class="success-info">
      <h2>Delivery details</h2>
      <div class="success-info-row">${A.icon("map-pin")}<div><strong>${esc(order.address?.name || order.customer?.name || "")}</strong><span>${esc(order.address?.line || "")}, ${esc(order.address?.city || "")}<br>${esc(order.address?.state || "")}, ${esc(order.address?.country || "")}${order.address?.postal ? " " + esc(order.address.postal) : ""}</span></div></div>
      <div class="success-info-row">${A.icon("truck")}<div><strong>${esc(order.delivery?.label || "Standard delivery")}</strong><span>${esc(order.delivery?.eta || "2–4 business days")}</span></div></div>
      <div class="success-info-row">${A.icon("credit-card")}<div><strong>${esc(order.payment?.label || "Card")}</strong><span>${order.payment?.method === "cod" ? "Pay on delivery" : "Payment received"}</span></div></div>
      <div class="success-info-row">${A.icon("mail")}<div><strong>Confirmation sent</strong><span>${esc(order.customer?.email || "")}</span></div></div>
      <div class="success-info-row">${A.icon("calendar")}<div><strong>Estimated arrival</strong><span>${esc(order.delivery?.eta || "2–4 business days")}</span></div></div>
      <a class="btn btn-outline btn-sm btn-block" style="margin-top:12px" href="account.html#orders" data-account-link>${A.icon("user")} ${A.state.user ? "View in your account" : "Create an account"}</a>
    </aside>`;
  }

  function render() {
    const root = $("#successRoot");
    if (!root) return;

    if (!order) {
      root.innerHTML = `<div class="empty-state panel" style="margin-top:30px">
        <div class="empty-icon">${A.icon("package")}</div>
        <h2>We couldn’t find that order</h2>
        <p>${requested ? `No order matches “${esc(requested)}”.` : "There are no orders on this device yet."} If you just checked out, open the link from your confirmation email or track it below.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
          <a class="btn btn-primary" href="track.html${requested ? `?order=${encodeURIComponent(requested)}` : ""}">Track an order ${A.icon("arrow-right")}</a>
          <a class="btn btn-outline" href="shop.html">Continue shopping</a>
        </div>
      </div>`;
      document.title = "Order not found · Tundara";
      return;
    }

    document.title = `Order ${order.id} confirmed · Tundara`;
    const first = (order.customer?.name || order.address?.name || "there").split(" ")[0];
    root.innerHTML = `<div class="success-card">
      <div class="success-hero">
        ${confettiHTML()}
        <div class="success-check">${A.icon("check")}</div>
        <h1>Thank you, ${esc(first)}!</h1>
        <p>Your order is confirmed and we’re getting it ready. A receipt is on its way to ${esc(order.customer?.email || "your inbox")}.</p>
        <div class="order-ref">
          ${A.icon("package")} Order ${esc(order.id)}
          <button type="button" data-copy="${esc(order.id)}" aria-label="Copy order number">${A.icon("copy")}</button>
        </div>
        ${timelineHTML(order.status)}
      </div>
      <div class="success-body">
        ${itemsHTML()}
        ${infoHTML()}
      </div>
      <div class="success-actions">
        <a class="btn btn-primary" href="track.html?order=${encodeURIComponent(order.id)}">Track your order ${A.icon("arrow-right")}</a>
        <a class="btn btn-outline" href="shop.html">Continue shopping</a>
        <a class="btn btn-ghost" href="account.html#orders">${A.icon("user")} My orders</a>
        <button class="btn btn-ghost" type="button" id="printReceipt">${A.icon("file-text")} Print receipt</button>
      </div>
    </div>
    <p class="text-center text-muted" style="font-size:.75rem;margin-top:16px">Need help with this order? <a href="help.html#contact" style="color:var(--brand);font-weight:700">Contact support</a> or call +234 700 987 6278.</p>`;

    $("#printReceipt")?.addEventListener("click", () => window.print());
    const accountLink = $("[data-account-link]");
    if (accountLink && !A.state.user) accountLink.href = "account.html";
    A.refreshMoney();
  }

  onReady(() => {
    if (order) {
      // Give the order a moment to feel real, then make sure the header reflects it.
      A.seedDemoOrders();
    }
    render();
    document.addEventListener("zm:currency", render);
  });
})();

