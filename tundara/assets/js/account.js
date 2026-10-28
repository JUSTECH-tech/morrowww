/* ==========================================================================
   Tundara — account, auth, orders & addresses
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const esc = A.escapeHTML;
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  const PANELS = ["overview", "orders", "wishlist", "addresses", "reviews", "settings"];
  const STATUS_CLASS = { Processing: "processing", Shipped: "shipped", Delivered: "delivered", Cancelled: "cancelled" };

  let authMode = "login";
  let activePanel = "overview";
  let orderFilter = "all";

  const fmtDate = (iso) =>
    iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";
  const fmtShort = (iso) =>
    iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso)) : "—";

  /* ------------------------------------------------------------------ */
  /* Auth screen                                                         */
  /* ------------------------------------------------------------------ */
  function authHTML() {
    const register = authMode === "register";
    return `<div class="auth-wrap">
      <div class="auth-visual">
        <img src="assets/img/lifestyle/shopping-bags.jpg" alt="" loading="lazy">
        <a class="brand" href="index.html" style="color:#fff">
          <span class="brand-mark">${A.icon("bag")}</span>
          <span><span class="brand-name">tun<em>dara</em></span><span class="brand-tag" style="color:rgba(255,255,255,.6)">Shop happy</span></span>
        </a>
        <div>
          <span class="eyebrow" style="color:#bfe9d9">${A.icon("sparkles")} Members get more</span>
          <h2>Your favourite things, all in one place.</h2>
          <p>Save your wishlist, track every order in real time and check out in seconds with saved addresses.</p>
          <div class="auth-perks">
            <div class="auth-perk">${A.icon("check-circle")} Early access to flash sales</div>
            <div class="auth-perk">${A.icon("check-circle")} Free delivery on orders over ${A.money(A.freeShippingUSD)}</div>
            <div class="auth-perk">${A.icon("check-circle")} 7-day easy returns, no stress</div>
          </div>
        </div>
        <p style="font-size:.7rem;color:rgba(255,255,255,.55)">Trusted by 1.2 million shoppers across Africa.</p>
      </div>
      <div class="auth-card">
        <h1>${register ? "Create your account" : "Welcome back"}</h1>
        <p>${register ? "Join Tundara and start collecting the good stuff." : "Sign in to see your orders, wishlist and saved addresses."}</p>
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab ${!register ? "is-active" : ""}" type="button" data-auth-tab="login" role="tab" aria-selected="${!register}">Sign in</button>
          <button class="auth-tab ${register ? "is-active" : ""}" type="button" data-auth-tab="register" role="tab" aria-selected="${register}">Create account</button>
        </div>
        <form class="auth-form" id="authForm" novalidate>
          ${register ? `<div class="field"><label for="authName">Full name</label><input class="input" id="authName" name="name" autocomplete="name" placeholder="e.g. Ada Obi" required><span class="field-error">Enter your full name.</span></div>` : ""}
          <div class="field"><label for="authEmail">Email address</label><input class="input" id="authEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" required><span class="field-error">Enter a valid email address.</span></div>
          ${register ? `<div class="field"><label for="authPhone">Phone number <span class="text-muted" style="font-weight:500">(optional)</span></label><input class="input" id="authPhone" name="phone" type="tel" autocomplete="tel" placeholder="+234 801 234 5678"></div>` : ""}
          <div class="field"><label for="authPassword">Password</label>
            <div class="input-group">${A.icon("lock")}<input class="input" id="authPassword" name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" placeholder="${register ? "At least 6 characters" : "Your password"}" required></div>
            <span class="field-error">${register ? "Use at least 6 characters." : "Enter your password."}</span>
          </div>
          ${register ? `<div class="field"><label for="authConfirm">Confirm password</label><input class="input" id="authConfirm" name="confirm" type="password" autocomplete="new-password" placeholder="Repeat your password" required><span class="field-error">Passwords must match.</span></div>` : ""}
          <div class="auth-row">
            <label class="check" style="font-size:.72rem"><input type="checkbox" id="authRemember" ${register ? "" : "checked"}> <span>${register ? "Send me deals and updates" : "Remember me"}</span></label>
            ${!register ? `<a href="help.html#contact">Forgot password?</a>` : `<a href="help.html#privacy">Privacy policy</a>`}
          </div>
          ${register ? `<label class="check" style="font-size:.72rem;align-items:flex-start"><input type="checkbox" id="authTerms"><span>I agree to the <a href="help.html#terms" style="color:var(--brand)">Terms</a> and <a href="help.html#privacy" style="color:var(--brand)">Privacy Policy</a>.</span></label>` : ""}
          <button class="btn btn-primary btn-block" type="submit">${register ? "Create my account" : "Sign in"} ${A.icon("arrow-right")}</button>
        </form>
        <div class="auth-divider">or continue with</div>
        <div class="social-auth">
          <button class="btn btn-outline" type="button" data-social="Google">${A.icon("globe")} Google</button>
          <button class="btn btn-outline" type="button" data-social="Apple">${A.icon("apple")} Apple</button>
        </div>
        <div class="auth-demo">Demo mode — use any email and password. Try <strong>demo@tundara.com</strong> / <strong>demo1234</strong>.</div>
      </div>
    </div>`;
  }

  function signIn(user) {
    A.saveAuth(user);
    A.seedDemoOrders();
    A.emit("zm:auth", { user });
    A.toast("Signed in", `Welcome ${user.name.split(" ")[0]} — happy shopping.`, "success");
    if (!location.hash || location.hash === "#login") history.replaceState(null, "", "account.html#overview");
    activePanel = "overview";
    render();
  }

  function handleAuthSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const register = authMode === "register";
    const email = form.email.value.trim();
    const password = form.password.value;
    let first = null;
    const fail = (field, message) => {
      const wrap = form.querySelector(`[name="${field}"]`)?.closest(".field");
      if (wrap) {
        wrap.classList.add("has-error");
        const err = wrap.querySelector(".field-error");
        if (err && message) err.textContent = message;
      }
      if (!first) first = form.querySelector(`[name="${field}"]`);
    };
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));

    if (register) {
      const name = form.name.value.trim();
      const confirm = form.confirm.value;
      const terms = $("#authTerms");
      if (!name) fail("name", "Enter your full name.");
      if (!email) fail("email", "Enter your email address.");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail("email", "That email doesn’t look right.");
      if (!password) fail("password", "Choose a password.");
      else if (password.length < 6) fail("password", "Use at least 6 characters.");
      if (confirm !== password) fail("confirm", "Passwords must match.");
      if (terms && !terms.checked) { A.toast("Almost there", "Please accept the terms to create your account.", "error"); if (!first) first = terms; }
      if (first) { first.focus(); return; }
      signIn({ name, email, phone: form.phone?.value.trim() || "", joined: new Date().toISOString() });
      return;
    }

    if (!email) fail("email", "Enter your email address.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail("email", "That email doesn’t look right.");
    if (!password) fail("password", "Enter your password.");
    if (first) { first.focus(); return; }

    const demo = email.toLowerCase() === "demo@tundara.com";
    const name = demo ? "Demo Shopper" : email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    signIn({ name, email, phone: "", joined: new Date().toISOString() });
  }

  /* ------------------------------------------------------------------ */
  /* Overview                                                            */
  /* ------------------------------------------------------------------ */
  function statCard(icon, value, label) {
    return `<div class="stat-card"><span class="stat-icon">${A.icon(icon)}</span><div><strong>${value}</strong><span>${label}</span></div></div>`;
  }

  function orderProductRows(order, limit) {
    const items = limit ? order.items.slice(0, limit) : order.items;
    return items.map((item) => {
      const p = A.getProduct(item.id);
      if (!p) return "";
      return `<div class="order-product-row">
        <a href="${A.productUrl(p)}"><img src="${p.image}" alt="${esc(p.title)}" loading="lazy"></a>
        <div style="min-width:0">
          <a class="op-title" href="${A.productUrl(p)}">${esc(p.title)}</a>
          <div class="op-meta">${item.variant ? esc(item.variant) + " · " : ""}Qty ${item.qty}</div>
        </div>
        <span class="op-price" data-usd="${A.itemPrice(item) * item.qty}">${A.money(A.itemPrice(item) * item.qty)}</span>
      </div>`;
    }).join("");
  }

  function orderCardHTML(order, compact) {
    const total = order.totals?.total || order.items.reduce((s, i) => s + A.itemPrice(i) * i.qty, 0);
    return `<article class="order-card" data-order="${esc(order.id)}">
      <div class="order-card-head">
        <div><span class="order-num">${esc(order.id)}</span> <span class="order-date">· ${fmtDate(order.date)}</span></div>
        <span class="order-status ${STATUS_CLASS[order.status] || "processing"}">${esc(order.status)}</span>
      </div>
      <div class="order-card-body">
        ${orderProductRows(order, compact ? 2 : order.items.length)}
        ${compact && order.items.length > 2 ? `<p class="text-muted" style="font-size:.7rem;padding-top:4px">+ ${order.items.length - 2} more item${order.items.length - 2 === 1 ? "" : "s"}</p>` : ""}
      </div>
      <div class="order-card-foot">
        <span class="total">Total <strong data-usd="${total}">${A.money(total)}</strong></span>
        <div class="actions">
          <a class="btn btn-outline btn-xs" href="track.html?order=${encodeURIComponent(order.id)}">${A.icon("truck")} Track</a>
          <button class="btn btn-soft btn-xs" type="button" data-reorder="${esc(order.id)}">${A.icon("refresh")} Buy again</button>
          ${compact ? "" : `<button class="btn btn-ghost btn-xs" type="button" data-print>${A.icon("file-text")} Receipt</button>`}
        </div>
      </div>
    </article>`;
  }

  function overviewHTML() {
    const orders = A.getOrders();
    const inTransit = orders.filter((o) => o.status === "Processing" || o.status === "Shipped").length;
    const addresses = A.getAddresses();
    const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
    return `<section class="account-panel ${activePanel === "overview" ? "is-active" : ""}" data-panel-content="overview">
      <div class="account-panel-head">
        <div><h1>Hello, ${esc(A.state.user.name.split(" ")[0])} 👋</h1><p>Here’s what’s happening with your Tundara account.</p></div>
        <a class="btn btn-primary btn-sm" href="shop.html">${A.icon("bag")} Start shopping</a>
      </div>
      <div class="stats-grid">
        ${statCard("package", orders.length, "Total orders")}
        ${statCard("truck", inTransit, "In transit")}
        ${statCard("heart", A.state.wishlist.length, "Wishlist items")}
        ${statCard("bookmark", A.getSaved().length, "Saved for later")}
      </div>
      <div class="account-card">
        <div class="panel-head"><h2>Recent orders</h2><button class="btn btn-ghost btn-xs" type="button" data-panel-link="orders">View all ${A.icon("arrow-right")}</button></div>
        <div class="panel-body">
          ${orders.length ? orders.slice(0, 2).map((o) => orderCardHTML(o, true)).join("") : `<div class="empty-orders"><div class="empty-icon">${A.icon("package")}</div><p>No orders yet. Your first find is waiting.</p><a class="btn btn-primary btn-sm" href="shop.html">Browse products</a></div>`}
        </div>
      </div>
      <div class="account-card">
        <div class="panel-head"><h2>Default delivery address</h2><button class="btn btn-ghost btn-xs" type="button" data-panel-link="addresses">Manage ${A.icon("arrow-right")}</button></div>
        <div class="panel-body">
          ${defaultAddress ? `<div class="address-card is-default" style="max-width:420px">
            <span class="addr-tag">Default</span>
            <strong>${esc(defaultAddress.name)}</strong>
            <p>${esc(defaultAddress.line)}<br>${esc(defaultAddress.city)}, ${esc(defaultAddress.state)}<br>${esc(defaultAddress.country)}${defaultAddress.postal ? " · " + esc(defaultAddress.postal) : ""}<br>${esc(defaultAddress.phone || "")}</p>
          </div>` : `<p class="text-muted" style="font-size:.82rem">No saved addresses yet. <button class="text-brand" style="font-weight:700" type="button" data-address-add>Add one</button> for faster checkout.</p>`}
        </div>
      </div>
      <div class="account-card">
        <div class="panel-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <span class="stat-icon" style="width:44px;height:44px">${A.icon("gift")}</span>
          <div style="flex:1;min-width:200px"><strong style="font-size:.9rem">Your welcome offer is waiting</strong><p class="text-muted" style="font-size:.78rem">Use code <b>TUN10</b> at checkout for 10% off your next order.</p></div>
          <button class="btn btn-outline btn-sm" type="button" data-copy="TUN10">${A.icon("copy")} Copy code</button>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Orders                                                              */
  /* ------------------------------------------------------------------ */
  function ordersHTML() {
    const orders = A.getOrders();
    const filtered = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);
    const counts = { all: orders.length };
    ["Processing", "Shipped", "Delivered", "Cancelled"].forEach((s) => (counts[s] = orders.filter((o) => o.status === s).length));
    return `<section class="account-panel ${activePanel === "orders" ? "is-active" : ""}" data-panel-content="orders">
      <div class="account-panel-head">
        <div><h1>My orders</h1><p>Track, reorder or download a receipt for any order.</p></div>
        <a class="btn btn-outline btn-sm" href="track.html">${A.icon("truck")} Track an order</a>
      </div>
      <div class="pill-tabs" style="margin-bottom:14px">
        ${["all", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => `<button class="pill-tab ${orderFilter === s ? "is-active" : ""}" type="button" data-order-filter="${s}">${s === "all" ? "All orders" : s}${counts[s] ? ` (${counts[s]})` : ""}</button>`).join("")}
      </div>
      ${filtered.length
        ? filtered.map((o) => orderCardHTML(o, false)).join("")
        : `<div class="panel empty-orders"><div class="empty-icon">${A.icon("package")}</div><h2 style="font-size:1.1rem;margin-bottom:4px">${orders.length ? "No orders in this status" : "No orders yet"}</h2><p>${orders.length ? "Try a different filter to see the rest of your orders." : "When you place your first order, it will appear here with live tracking."}</p><a class="btn btn-primary btn-sm" href="shop.html">Start shopping</a></div>`}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Wishlist                                                            */
  /* ------------------------------------------------------------------ */
  function wishlistHTML() {
    const items = A.state.wishlist.map((id) => A.getProduct(id)).filter(Boolean);
    return `<section class="account-panel ${activePanel === "wishlist" ? "is-active" : ""}" data-panel-content="wishlist">
      <div class="account-panel-head">
        <div><h1>Wishlist</h1><p>${items.length ? `${items.length} item${items.length === 1 ? "" : "s"} you’ve saved for later.` : "Everything you save will live here."}</p></div>
        <div style="display:flex;gap:6px">
          ${items.length ? `<button class="btn btn-outline btn-sm" type="button" data-clear-wishlist>${A.icon("trash")} Clear all</button>` : ""}
          <a class="btn btn-primary btn-sm" href="wishlist.html">Open wishlist</a>
        </div>
      </div>
      ${items.length
        ? `<div class="product-grid">${items.slice(0, 8).map((p) => A.productCard(p)).join("")}</div>`
        : `<div class="panel empty-state"><div class="empty-icon">${A.icon("heart")}</div><h2>Nothing saved yet</h2><p>Tap the heart on any product to keep it here while you decide.</p><a class="btn btn-primary btn-sm" href="shop.html">Find something you love</a></div>`}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Addresses                                                           */
  /* ------------------------------------------------------------------ */
  function addressCardHTML(a, index) {
    return `<div class="address-card ${a.isDefault ? "is-default" : ""}">
      ${a.isDefault ? `<span class="addr-tag">Default</span>` : ""}
      <strong>${esc(a.name)}</strong>
      <p>${esc(a.line)}<br>${esc(a.city)}, ${esc(a.state)}<br>${esc(a.country)}${a.postal ? " · " + esc(a.postal) : ""}<br>${esc(a.phone || "")}</p>
      <div class="addr-actions">
        <button type="button" data-address-edit="${index}">Edit</button>
        ${a.isDefault ? "" : `<button type="button" data-address-default="${index}">Set default</button>`}
        <button class="del" type="button" data-address-delete="${index}">Delete</button>
      </div>
    </div>`;
  }

  function addressesHTML() {
    const addresses = A.getAddresses();
    return `<section class="account-panel ${activePanel === "addresses" ? "is-active" : ""}" data-panel-content="addresses">
      <div class="account-panel-head">
        <div><h1>Delivery addresses</h1><p>Save the places you shop for, so checkout takes seconds.</p></div>
        <button class="btn btn-primary btn-sm" type="button" data-address-add>${A.icon("plus")} Add address</button>
      </div>
      <div class="address-grid">
        ${addresses.map(addressCardHTML).join("")}
        <button class="address-add" type="button" data-address-add>${A.icon("plus")} Add a new address</button>
      </div>
    </section>`;
  }

  function addressModal(index) {
    const addresses = A.getAddresses();
    const a = index === undefined ? null : addresses[index];
    const box = A.openModal(`
      <div class="modal-head"><h3 id="modalTitle">${a ? "Edit address" : "Add a new address"}</h3><button class="modal-close" data-close-modal aria-label="Close">${A.icon("x")}</button></div>
      <div class="modal-body">
        <form id="addressForm" class="auth-form" novalidate>
          <div class="form-grid">
            <div class="field span-2"><label for="addrName">Full name *</label><input class="input" id="addrName" name="name" value="${esc(a?.name || A.state.user?.name || "")}" required><span class="field-error">Enter a full name.</span></div>
            <div class="field span-2"><label for="addrPhone">Phone number *</label><input class="input" id="addrPhone" name="phone" type="tel" value="${esc(a?.phone || A.state.user?.phone || "")}" required><span class="field-error">Enter a phone number.</span></div>
            <div class="field span-2"><label for="addrLine">Street address *</label><input class="input" id="addrLine" name="line" value="${esc(a?.line || "")}" placeholder="House number and street" required><span class="field-error">Enter your street address.</span></div>
            <div class="field"><label for="addrCity">City *</label><input class="input" id="addrCity" name="city" value="${esc(a?.city || A.state.region.city)}" required><span class="field-error">Enter your city.</span></div>
            <div class="field"><label for="addrState">State / region *</label><input class="input" id="addrState" name="state" value="${esc(a?.state || A.state.region.state)}" required><span class="field-error">Enter your state.</span></div>
            <div class="field"><label for="addrCountry">Country *</label><input class="input" id="addrCountry" name="country" value="${esc(a?.country || A.state.region.country)}" required><span class="field-error">Enter your country.</span></div>
            <div class="field"><label for="addrPostal">Postal code</label><input class="input" id="addrPostal" name="postal" value="${esc(a?.postal || "")}" placeholder="Optional"></div>
          </div>
          <label class="check" style="font-size:.78rem"><input type="checkbox" id="addrDefault" ${a?.isDefault ? "checked" : ""}> <span>Make this my default address</span></label>
          <div style="display:flex;gap:8px;margin-top:4px">
            <button class="btn btn-primary" type="submit" style="flex:1">${a ? "Save changes" : "Add address"}</button>
            <button class="btn btn-ghost" type="button" data-close-modal>Cancel</button>
          </div>
        </form>
      </div>`, { size: "sm" });
    if (!box) return;

    box.querySelector("#addressForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const values = {};
      ["name", "phone", "line", "city", "state", "country", "postal"].forEach((key) => (values[key] = form[key].value.trim()));
      let first = null;
      ["name", "phone", "line", "city", "state", "country"].forEach((key) => {
        const wrap = form[key].closest(".field");
        const ok = !!values[key];
        wrap.classList.toggle("has-error", !ok);
        if (!ok && !first) first = form[key];
      });
      if (first) { first.focus(); return; }
      const list = A.getAddresses().slice();
      const isDefault = $("#addrDefault").checked;
      if (isDefault) list.forEach((x) => (x.isDefault = false));
      if (a) {
        list[index] = { ...list[index], ...values, isDefault: isDefault || (a.isDefault && !list.some((x) => x.isDefault)) };
        if (!list.some((x) => x.isDefault)) list[index].isDefault = true;
      } else {
        list.push({ id: Date.now(), ...values, isDefault: isDefault || list.length === 0 });
      }
      A.saveAddresses(list);
      A.closeModal();
      A.toast(a ? "Address updated" : "Address saved", "Your delivery details are ready.", "success");
      render();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reviews                                                             */
  /* ------------------------------------------------------------------ */
  function reviewsHTML() {
    const entries = Object.entries(A.state.reviews || {}).filter(([, list]) => Array.isArray(list) && list.length);
    const rows = [];
    entries.forEach(([id, list]) => {
      const p = A.getProduct(id);
      if (!p) return;
      list.forEach((r, index) => rows.push({ p, r, index }));
    });
    rows.sort((a, b) => new Date(b.r.date) - new Date(a.r.date));
    return `<section class="account-panel ${activePanel === "reviews" ? "is-active" : ""}" data-panel-content="reviews">
      <div class="account-panel-head"><div><h1>My reviews</h1><p>${rows.length ? "Thanks for helping other shoppers choose well." : "Reviews you write will appear here."}</p></div></div>
      ${rows.length
        ? `<div class="account-card"><div class="panel-body">${rows.map(({ p, r, index }) => `<div class="review-item">
            <div class="review-item-head">
              <a href="${A.productUrl(p)}" style="display:flex;align-items:center;gap:8px;min-width:0">
                <img src="${p.image}" alt="" style="width:38px;height:38px;object-fit:contain;border:1px solid var(--line);border-radius:7px;background:var(--img-bg)">
                <strong style="font-weight:600;font-size:.8rem">${esc(p.title.length > 46 ? p.title.slice(0, 46) + "…" : p.title)}</strong>
              </a>
              <span class="review-date">${fmtDate(r.date)}</span>
            </div>
            ${A.stars(r.rating)}
            <h5>${esc(r.title)}</h5>
            <p>${esc(r.body)}</p>
            <button class="btn btn-ghost btn-xs" type="button" data-delete-review="${esc(p.id)}" data-review-index="${index}" style="margin-top:8px">${A.icon("trash")} Delete review</button>
          </div>`).join("")}</div></div>`
        : `<div class="panel empty-state"><div class="empty-icon">${A.icon("star")}</div><h2>No reviews yet</h2><p>Bought something you love? Share a review on the product page and help the community.</p><a class="btn btn-primary btn-sm" href="account.html#orders">View my orders</a></div>`}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Settings                                                            */
  /* ------------------------------------------------------------------ */
  function settingsHTML() {
    const u = A.state.user;
    return `<section class="account-panel ${activePanel === "settings" ? "is-active" : ""}" data-panel-content="settings">
      <div class="account-panel-head"><div><h1>Account settings</h1><p>Manage your profile, password and preferences.</p></div></div>
      <div class="account-card">
        <div class="panel-head"><h2>Profile</h2></div>
        <div class="panel-body">
          <form class="auth-form profile-form" id="profileForm" novalidate>
            <div class="form-grid">
              <div class="field"><label for="setName">Full name</label><input class="input" id="setName" name="name" value="${esc(u.name)}" required><span class="field-error">Enter your name.</span></div>
              <div class="field"><label for="setPhone">Phone number</label><input class="input" id="setPhone" name="phone" type="tel" value="${esc(u.phone || "")}" placeholder="+234 801 234 5678"></div>
              <div class="field span-2"><label for="setEmail">Email address</label><input class="input" id="setEmail" name="email" type="email" value="${esc(u.email)}" required><span class="field-error">Enter a valid email address.</span></div>
            </div>
            <button class="btn btn-primary btn-sm" type="submit" style="align-self:flex-start">Save changes</button>
          </form>
        </div>
      </div>
      <div class="account-card">
        <div class="panel-head"><h2>Password</h2></div>
        <div class="panel-body">
          <form class="auth-form profile-form" id="passwordForm" novalidate>
            <div class="field"><label for="curPass">Current password</label><input class="input" id="curPass" name="current" type="password" placeholder="Your current password"><span class="field-error">Enter your current password.</span></div>
            <div class="form-grid">
              <div class="field"><label for="newPass">New password</label><input class="input" id="newPass" name="next" type="password" placeholder="At least 6 characters"><span class="field-error">Use at least 6 characters.</span></div>
              <div class="field"><label for="confirmPass">Confirm new password</label><input class="input" id="confirmPass" name="confirm" type="password" placeholder="Repeat new password"><span class="field-error">Passwords must match.</span></div>
            </div>
            <button class="btn btn-primary btn-sm" type="submit" style="align-self:flex-start">Update password</button>
          </form>
        </div>
      </div>
      <div class="account-card">
        <div class="panel-head"><h2>Preferences</h2></div>
        <div class="panel-body" style="display:grid;gap:12px">
          <div class="switch-row" style="padding:0"><span><strong style="font-size:.82rem;display:block">Dark mode</strong><span class="text-muted" style="font-size:.72rem">A calmer look for late-night browsing.</span></span><label class="switch"><input type="checkbox" id="prefTheme" ${A.state.theme === "dark" ? "checked" : ""}><span></span></label></div>
          <div class="switch-row" style="padding:0"><span><strong style="font-size:.82rem;display:block">Deals & updates</strong><span class="text-muted" style="font-size:.72rem">Flash sales, new arrivals and members-only offers.</span></span><label class="switch"><input type="checkbox" id="prefDeals" checked><span></span></label></div>
          <div class="switch-row" style="padding:0"><span><strong style="font-size:.82rem;display:block">Order updates by SMS</strong><span class="text-muted" style="font-size:.72rem">Delivery alerts on ${esc(u.phone || "your saved phone number")}.</span></span><label class="switch"><input type="checkbox" id="prefSms" ${u.phone ? "checked" : ""}><span></span></label></div>
        </div>
      </div>
      <div class="account-card">
        <div class="panel-head"><h2>Session</h2></div>
        <div class="panel-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <p class="text-muted" style="font-size:.8rem;flex:1;min-width:200px">Signed in as <strong style="color:var(--ink)">${esc(u.email)}</strong>. Signing out won’t remove your orders from this device.</p>
          <button class="btn btn-danger-soft btn-sm" type="button" data-signout>Sign out</button>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Dashboard shell                                                     */
  /* ------------------------------------------------------------------ */
  function navItem(icon, key, label, count) {
    return `<button type="button" data-panel-link="${key}" class="${activePanel === key ? "is-active" : ""}">${A.icon(icon)} ${label}${count ? `<span class="count-badge">${count}</span>` : ""}</button>`;
  }

  function dashboardHTML() {
    const u = A.state.user;
    const orders = A.getOrders();
    return `<div class="account-layout">
      <aside class="account-sidebar">
        <div class="account-user">
          <span class="avatar">${esc(u.name.charAt(0).toUpperCase())}</span>
          <strong>${esc(u.name)}</strong>
          <span>${esc(u.email)}</span>
        </div>
        <nav class="account-nav" aria-label="Account sections">
          ${navItem("home", "overview", "Overview")}
          ${navItem("package", "orders", "My orders", orders.length)}
          ${navItem("heart", "wishlist", "Wishlist", A.state.wishlist.length)}
          ${navItem("map-pin", "addresses", "Addresses", A.getAddresses().length)}
          ${navItem("star", "reviews", "My reviews")}
          ${navItem("sliders", "settings", "Settings")}
          <button class="signout" type="button" data-signout>${A.icon("x")} Sign out</button>
        </nav>
      </aside>
      <div class="account-content">
        ${overviewHTML()}
        ${ordersHTML()}
        ${wishlistHTML()}
        ${addressesHTML()}
        ${reviewsHTML()}
        ${settingsHTML()}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Render / bind                                                       */
  /* ------------------------------------------------------------------ */
  function render() {
    const root = $("#accountRoot");
    if (!root) return;
    if (!A.state.user) {
      document.title = "Sign in · Tundara";
      root.innerHTML = authHTML();
      A.refreshMoney();
      return;
    }
    A.seedDemoOrders();
    if (!PANELS.includes(activePanel)) activePanel = "overview";
    document.title = `${activePanel.charAt(0).toUpperCase() + activePanel.slice(1)} · My Tundara`;
    root.innerHTML = dashboardHTML();
    A.refreshMoney();
    A.syncWishButtons?.();
  }

  function goPanel(name) {
    if (!PANELS.includes(name)) name = "overview";
    activePanel = name;
    $$("[data-panel-content]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panelContent === name));
    $$(".account-nav [data-panel-link]").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.panelLink === name));
    history.replaceState(null, "", "account.html#" + name);
    window.scrollTo({ top: ($("#accountRoot")?.offsetTop || 0) - 90, behavior: "smooth" });
  }

  function handleReorder(orderId) {
    const order = A.getOrder(orderId);
    if (!order) return;
    order.items.forEach((item) => {
      if (!A.getProduct(item.id)) return;
      A.addToCart(item.id, item.qty, item.variant || null, { silent: true });
    });
    A.toast("Added to basket", `${order.items.length} item${order.items.length === 1 ? "" : "s"} from ${order.id} added.`, "success");
    A.openCartDrawer();
  }

  function bind() {
    const root = $("#accountRoot");
    if (!root) return;

    root.addEventListener("click", (e) => {
      const authTab = e.target.closest("[data-auth-tab]");
      if (authTab) {
        authMode = authTab.dataset.authTab;
        render();
        return;
      }
      const social = e.target.closest("[data-social]");
      if (social) {
        signIn({
          name: `${social.dataset.social} Shopper`,
          email: `${social.dataset.social.toLowerCase()}.shopper@tundara.com`,
          phone: "",
          joined: new Date().toISOString(),
        });
        return;
      }
      const nav = e.target.closest("[data-panel-link]");
      if (nav) { goPanel(nav.dataset.panelLink); return; }
      const signout = e.target.closest("[data-signout]");
      if (signout) {
        A.logout();
        activePanel = "overview";
        authMode = "login";
        history.replaceState(null, "", "account.html");
        A.toast("Signed out", "You’ve been signed out of this device.", "info");
        render();
        return;
      }
      const filter = e.target.closest("[data-order-filter]");
      if (filter) {
        orderFilter = filter.dataset.orderFilter;
        render();
        return;
      }
      const reorder = e.target.closest("[data-reorder]");
      if (reorder) { handleReorder(reorder.dataset.reorder); return; }
      if (e.target.closest("[data-print]")) { window.print(); return; }
      const addAddress = e.target.closest("[data-address-add]");
      if (addAddress) { addressModal(); return; }
      const editAddress = e.target.closest("[data-address-edit]");
      if (editAddress) { addressModal(Number(editAddress.dataset.addressEdit)); return; }
      const delAddress = e.target.closest("[data-address-delete]");
      if (delAddress) {
        const list = A.getAddresses().slice();
        const index = Number(delAddress.dataset.addressDelete);
        const wasDefault = list[index]?.isDefault;
        list.splice(index, 1);
        if (wasDefault && list.length) list[0].isDefault = true;
        A.saveAddresses(list);
        A.toast("Address removed", "The address was deleted.", "info");
        render();
        return;
      }
      const defAddress = e.target.closest("[data-address-default]");
      if (defAddress) {
        const list = A.getAddresses().map((a, i) => ({ ...a, isDefault: i === Number(defAddress.dataset.addressDefault) }));
        A.saveAddresses(list);
        A.toast("Default updated", "This address will be used at checkout.", "success");
        render();
        return;
      }
      const clearWish = e.target.closest("[data-clear-wishlist]");
      if (clearWish) {
        A.clearWishlist();
        A.toast("Wishlist cleared", "All saved items were removed.", "info");
        render();
        return;
      }
      const delReview = e.target.closest("[data-delete-review]");
      if (delReview) {
        A.removeReview(Number(delReview.dataset.deleteReview), Number(delReview.dataset.reviewIndex));
        A.toast("Review deleted", "Your review was removed.", "info");
        render();
        return;
      }
    });

    root.addEventListener("change", (e) => {
      if (e.target.id === "prefTheme") {
        document.querySelector("[data-theme-toggle]")?.click();
      }
      if (e.target.id === "prefDeals" || e.target.id === "prefSms") {
        A.toast("Preference saved", "Your notification settings were updated.", "success");
      }
    });

    root.addEventListener("submit", (e) => {
      if (e.target.id === "authForm") { handleAuthSubmit(e); return; }
      if (e.target.id === "profileForm") {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const phone = form.phone.value.trim();
        let first = null;
        form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
        if (!name) { form.name.closest(".field").classList.add("has-error"); first = form.name; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { form.email.closest(".field").classList.add("has-error"); if (!first) first = form.email; }
        if (first) { first.focus(); return; }
        A.saveAuth({ ...A.state.user, name, email, phone });
        A.toast("Profile updated", "Your details have been saved.", "success");
        render();
        return;
      }
      if (e.target.id === "passwordForm") {
        e.preventDefault();
        const form = e.target;
        form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
        const current = form.current.value;
        const next = form.next.value;
        const confirm = form.confirm.value;
        let first = null;
        if (!current) { form.current.closest(".field").classList.add("has-error"); first = form.current; }
        if (next.length < 6) { form.next.closest(".field").classList.add("has-error"); if (!first) first = form.next; }
        if (next !== confirm) { form.confirm.closest(".field").classList.add("has-error"); if (!first) first = form.confirm; }
        if (first) { first.focus(); return; }
        form.reset();
        A.toast("Password updated", "Use your new password next time you sign in.", "success");
      }
    });
  }

  function readHash() {
    const raw = (location.hash || "").replace(/^#/, "").split("?")[0];
    return PANELS.includes(raw) ? raw : "overview";
  }

  onReady(() => {
    activePanel = readHash();
    render();
    bind();
    document.addEventListener("zm:auth", () => render());
    document.addEventListener("zm:wishlist", () => { if (activePanel === "wishlist" && A.state.user) render(); });
    window.addEventListener("hashchange", () => {
      if (!A.state.user) return;
      const next = readHash();
      if (next !== activePanel) { activePanel = next; render(); }
    });
  });
})();
