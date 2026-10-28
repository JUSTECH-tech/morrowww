/* ==========================================================================
   Tundara — order tracking
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = A.escapeHTML;
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  const STEPS = [
    { key: "confirmed", label: "Order confirmed", icon: "check-circle", note: "We've received your order and payment." },
    { key: "packed", label: "Picked & packed", icon: "package", note: "Your items were checked and packed by the seller." },
    { key: "shipped", label: "On the way", icon: "truck", note: "Your parcel has been handed to the courier." },
    { key: "delivered", label: "Delivered", icon: "home", note: "Delivered safely to your address." },
  ];

  const statusRank = (status) => {
    if (status === "Delivered") return 3;
    if (status === "Shipped") return 2;
    if (status === "Processing") return 1;
    return 0;
  };

  const fmtDate = (iso) =>
    iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";
  const fmtDateTime = (iso) =>
    iso
      ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
      : "Pending";

  function addHours(iso, hours) {
    const d = new Date(iso);
    d.setHours(d.getHours() + hours);
    return d.toISOString();
  }

  function stepDates(order) {
    const shipped = order.history?.find((h) => h.status === "Shipped")?.date;
    const delivered = order.history?.find((h) => h.status === "Delivered")?.date;
    const eta = new Date(order.date);
    eta.setDate(eta.getDate() + (order.delivery?.method === "express" ? 2 : 4));
    return {
      confirmed: order.date,
      packed: addHours(order.date, 2),
      shipped: shipped || null,
      delivered: delivered || null,
      eta: eta.toISOString(),
    };
  }

  function badgeClass(status) {
    if (status === "Delivered") return "badge-success";
    if (status === "Cancelled") return "badge-danger";
    if (status === "Shipped") return "badge-official";
    return "badge-soft";
  }

  function timelineHTML(order) {
    const rank = statusRank(order.status);
    const dates = stepDates(order);
    const keys = ["confirmed", "packed", "shipped", "delivered"];
    return `<div class="track-timeline">
      ${STEPS.map((step, i) => {
        const done = i < rank || (order.status === "Delivered" && i === 3);
        const current = i === rank && order.status !== "Delivered";
        let when = dates[keys[i]] ? fmtDateTime(dates[keys[i]]) : "";
        if (!when && i === 3) when = `Estimated ${fmtDate(dates.eta)}`;
        if (!when && i === 2 && order.delivery?.eta) when = `Expected in ${order.delivery.eta}`;
        if (!when) when = "Pending";
        return `<div class="tl-step ${done ? "is-done" : ""}">
          <div class="tl-rail">
            <span class="tl-dot">${done ? A.icon("check") : A.icon(step.icon)}</span>
            ${i < STEPS.length - 1 ? `<span class="tl-line"></span>` : ""}
          </div>
          <div class="tl-body ${current ? "is-current" : ""}">
            <strong>${step.label}${current ? ` <span class="badge badge-success">Current</span>` : ""}</strong>
            <span>${esc(step.note)}</span>
            <span style="display:block;margin-top:2px;font-weight:600">${esc(when)}</span>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  function itemsHTML(order) {
    return order.items
      .map((item) => {
        const p = A.getProduct(item.id);
        if (!p) return "";
        return `<div class="checkout-item">
          <img src="${p.image}" alt="">
          <div style="min-width:0">
            <div class="ci-title">${esc(p.title)}</div>
            <div class="ci-meta">Qty ${item.qty}${item.variant ? " · " + esc(item.variant) : ""}</div>
          </div>
          <span class="ci-price" data-usd="${((p.price + (item.delta || 0)) * item.qty).toFixed(2)}">${A.money((p.price + (item.delta || 0)) * item.qty)}</span>
        </div>`;
      })
      .join("");
  }

  function resultHTML(order) {
    const address = order.address || {};
    const dest = [address.line, address.city, address.state, address.country].filter(Boolean).join(", ");
    return `<div class="track-order-head">
        <div>
          <span class="badge ${badgeClass(order.status)}">${esc(order.status)}</span>
          <h2 style="margin-top:8px">Order ${esc(order.id)}</h2>
          <p>Placed ${fmtDate(order.date)} · ${order.items.reduce((s, i) => s + i.qty, 0)} item${order.items.reduce((s, i) => s + i.qty, 0) === 1 ? "" : "s"} · <strong style="color:var(--ink)" data-usd="${order.totals?.total || 0}">${A.money(order.totals?.total || 0)}</strong></p>
        </div>
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          <a class="btn btn-outline btn-sm" href="account.html#orders">${A.icon("file-text")} Order details</a>
          <a class="btn btn-soft btn-sm" href="help.html#contact">${A.icon("help")} Need help?</a>
        </div>
      </div>
      ${timelineHTML(order)}
      <div class="panel" style="margin-top:8px">
        <div class="panel-head"><h3>Items in this order</h3><span class="badge badge-soft">${esc(order.delivery?.label || "Standard delivery")}</span></div>
        <div class="panel-body" style="padding:10px 18px"><div class="checkout-items" style="max-height:none">${itemsHTML(order)}</div></div>
      </div>
      <div class="track-info-grid">
        <div class="panel" style="padding:16px">
          <h4 style="font-size:.82rem;margin-bottom:6px;display:flex;align-items:center;gap:6px">${A.icon("map-pin")} Delivery address</h4>
          <p style="font-size:.78rem;color:var(--muted);line-height:1.55">${esc(address.name || order.customer?.name || "")}${dest ? "<br>" + esc(dest) : ""}${address.phone ? "<br>" + esc(address.phone) : ""}</p>
        </div>
        <div class="panel" style="padding:16px">
          <h4 style="font-size:.82rem;margin-bottom:6px;display:flex;align-items:center;gap:6px">${A.icon("credit-card")} Payment & delivery</h4>
          <p style="font-size:.78rem;color:var(--muted);line-height:1.55">${esc(order.payment?.label || "Card")}<br>${esc(order.delivery?.label || "Standard delivery")} · ${esc(order.delivery?.eta || "2–4 business days")}<br>${order.coupon ? "Coupon " + esc(order.coupon) : "No coupon applied"}</p>
        </div>
      </div>`;
  }

  function show(order, animate) {
    const wrap = $("#trackResult");
    const err = $("#trackError");
    if (!wrap) return;
    if (err) { err.style.display = "none"; err.textContent = ""; }
    if (!order) {
      wrap.classList.remove("is-visible");
      wrap.innerHTML = "";
      if (err) {
        err.style.display = "block";
        err.textContent = "We couldn't find an order with that number. Check the reference on your confirmation email — it starts with TD-.";
      }
      A.toast("Order not found", "Double-check the order number and try again.", "error");
      return;
    }
    wrap.innerHTML = resultHTML(order);
    wrap.classList.add("is-visible");
    A.refreshMoney();
    if (animate !== false) {
      const top = wrap.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }

  function lookup(value, animate) {
    const id = String(value || "").trim();
    if (!id) {
      const err = $("#trackError");
      if (err) { err.style.display = "block"; err.textContent = "Enter your order number to see its status."; }
      $("#trackInput")?.focus();
      return;
    }
    show(A.getOrder(id), animate);
  }

  function init() {
    A.seedDemoOrders();

    const form = $("#trackForm");
    const input = $("#trackInput");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      lookup(input?.value, true);
    });

    document.querySelectorAll("[data-demo-order]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (input) input.value = btn.dataset.demoOrder;
        lookup(btn.dataset.demoOrder, true);
      });
    });

    const params = new URLSearchParams(location.search);
    const requested = params.get("order");
    if (requested) {
      if (input) input.value = requested;
      lookup(requested, false);
    }
  }

  onReady(init);
})();
