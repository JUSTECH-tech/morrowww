/* ==========================================================================
   Tundara — checkout
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const esc = A.escapeHTML;
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  const STEP_LABELS = ["Delivery", "Payment", "Review"];
  const DELIVERY = {
    standard: { label: "Standard delivery", eta: "2–4 business days", note: "Tracked courier · signature on delivery", fee: undefined },
    express: { label: "Express delivery", eta: "1–2 business days", note: "Priority dispatch · available in major cities", fee: 5.99 },
    pickup: { label: "Click & collect", eta: "Ready in 24 hours", note: "Collect free from your nearest Tundara hub", fee: 0 },
  };
  const PAYMENTS = {
    card: { label: "Debit / credit card", note: "Visa, Mastercard and Verve accepted" },
    transfer: { label: "Bank transfer", note: "Transfer to a one-time account number" },
    momo: { label: "Mobile money", note: "MTN MoMo, Airtel Money and more" },
    cod: { label: "Pay on delivery", note: "Cash or card when your order arrives" },
  };

  let step = 0;
  let deliveryMethod = "standard";
  let paymentMethod = "card";
  let processing = false;
  let form = {
    name: "", email: "", phone: "", line: "", city: "", state: "", country: "Nigeria", postal: "", notes: "",
  };

  /* ------------------------------------------------------------------ */
  /* Prefill from saved address / account                                */
  /* ------------------------------------------------------------------ */
  function prefill() {
    const addresses = A.getAddresses();
    const chosen = addresses.find((a) => a.isDefault) || addresses[0];
    if (chosen) {
      form = {
        name: chosen.name || form.name,
        email: A.state.user?.email || form.email,
        phone: chosen.phone || form.phone,
        line: chosen.line || "",
        city: chosen.city || A.state.region.city,
        state: chosen.state || A.state.region.state,
        country: chosen.country || A.state.region.country,
        postal: chosen.postal || "",
        notes: "",
      };
    } else {
      form = {
        ...form,
        name: A.state.user?.name || "",
        email: A.state.user?.email || "",
        phone: A.state.user?.phone || "",
        city: A.state.region.city,
        state: A.state.region.state,
        country: A.state.region.country,
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Money helpers                                                       */
  /* ------------------------------------------------------------------ */
  function fee() {
    return DELIVERY[deliveryMethod].fee;
  }
  function totals() {
    return A.computeTotals(A.state.cart, A.state.coupon, fee());
  }
  function deliveryLabel() {
    const d = DELIVERY[deliveryMethod];
    return `${d.label} · ${d.eta}`;
  }
  function paymentLabel() {
    if (paymentMethod === "card") {
      const digits = ($("#cardNumber")?.value || "").replace(/\D/g, "");
      return `Card ending ${digits.slice(-4) || "••••"}`;
    }
    if (paymentMethod === "momo") {
      const phone = ($("#momoPhone")?.value || "").trim();
      return `Mobile money${phone ? " · " + phone : ""}`;
    }
    return PAYMENTS[paymentMethod].label;
  }

  /* ------------------------------------------------------------------ */
  /* Summary                                                             */
  /* ------------------------------------------------------------------ */
  function summaryHTML() {
    const t = totals();
    const coupon = A.state.coupon ? A.catalog.coupons.find((c) => c.code === A.state.coupon) : null;
    return `<aside class="summary-card checkout-summary" aria-label="Order summary">
      <h2>Order summary <span class="badge badge-soft">${t.itemCount} item${t.itemCount === 1 ? "" : "s"}</span></h2>
      <div class="checkout-items">
        ${A.state.cart.map((item) => {
          const p = A.getProduct(item.id);
          if (!p) return "";
          return `<div class="checkout-item">
            <img src="${p.image}" alt="${esc(p.title)}" loading="lazy">
            <div style="min-width:0"><div class="ci-title">${esc(p.title)}</div><div class="ci-meta">${item.variant ? esc(item.variant) + " · " : ""}Qty ${item.qty}</div></div>
            <span class="ci-price" data-usd="${A.itemPrice(item) * item.qty}">${A.money(A.itemPrice(item) * item.qty)}</span>
          </div>`;
        }).join("")}
      </div>
      <div class="summary-coupon">
        ${coupon
          ? `<div class="coupon-applied"><span>${A.icon("tag")} ${esc(coupon.code)} · ${coupon.label}</span><button type="button" data-coupon-remove aria-label="Remove coupon">${A.icon("x")}</button></div>`
          : `<form class="coupon-form" data-coupon-form>
              <input class="input" name="coupon" placeholder="Promo code" aria-label="Promo code" autocomplete="off">
              <button class="btn btn-outline" type="submit">Apply</button>
            </form>`}
      </div>
      <div class="summary-row"><span>Subtotal</span><strong data-usd="${t.subtotal}">${A.money(t.subtotal)}</strong></div>
      ${t.discount > 0 ? `<div class="summary-row"><span>Discount</span><strong class="text-brand">−<span data-usd="${t.discount}">${A.money(t.discount)}</span></strong></div>` : ""}
      <div class="summary-row"><span>Delivery</span><strong class="${t.freeShipping ? "free" : ""}">${t.freeShipping ? "Free" : `<span data-usd="${t.shipping}">${A.money(t.shipping)}</span>`}</strong></div>
      <div class="summary-row"><span>VAT (7.5%)</span><strong data-usd="${t.tax}">${A.money(t.tax)}</strong></div>
      <div class="summary-total"><span>Total</span><strong data-usd="${t.total}">${A.money(t.total)}</strong></div>
      <div class="summary-note">${A.icon("lock")} 256-bit SSL · your details are safe</div>
      <div class="payment-row">
        <span class="pay-logo">VISA</span>
        <span class="pay-logo mastercard">Mastercard</span>
        <span class="pay-logo verve">Verve</span>
        <span class="pay-logo momo">MTN MoMo</span>
      </div>
    </aside>`;
  }

  function refreshSummary() {
    const holder = $("#checkoutSummary");
    if (holder) holder.innerHTML = summaryHTML();
  }

  /* ------------------------------------------------------------------ */
  /* Step indicators                                                     */
  /* ------------------------------------------------------------------ */
  function stepsHTML() {
    return `<div class="checkout-steps" aria-label="Checkout progress">
      ${STEP_LABELS.map((label, i) => `<div class="checkout-step-ind ${i === step ? "is-active" : ""} ${i < step ? "is-done" : ""}">
        <span class="num">${i < step ? A.icon("check") : i + 1}</span><span>${label}</span>
      </div>${i < STEP_LABELS.length - 1 ? `<div class="checkout-step-line"></div>` : ""}`).join("")}
    </div>`;
  }

  function refreshSteps() {
    const holder = $("#checkoutSteps");
    if (holder) holder.innerHTML = stepsHTML();
  }

  /* ------------------------------------------------------------------ */
  /* Delivery panel                                                      */
  /* ------------------------------------------------------------------ */
  function field(name, label, value, opts = {}) {
    return `<div class="field ${opts.span ? "span-2" : ""}" data-field="${name}">
      <label for="${name}">${label}${opts.required ? " *" : ""}</label>
      <input class="input" id="${name}" name="${name}" value="${esc(value || "")}" ${opts.type ? `type="${opts.type}"` : ""} ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ""} ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ""} autocomplete="${opts.autocomplete || "on"}" ${opts.required ? "required" : ""}>
      <span class="field-error">Please complete this field.</span>
    </div>`;
  }

  function savedAddressHTML() {
    const addresses = A.getAddresses();
    if (!addresses.length) return "";
    return `<div class="address-grid" style="margin-bottom:16px">
      ${addresses.map((a, i) => `<button class="address-card ${a.isDefault || i === 0 ? "is-default" : ""}" type="button" data-use-address="${i}" style="text-align:left">
        ${a.isDefault ? `<span class="addr-tag">Default</span>` : ""}
        <strong>${esc(a.name)}</strong>
        <p>${esc(a.line)}, ${esc(a.city)}, ${esc(a.state)}<br>${esc(a.country)}${a.postal ? " · " + esc(a.postal) : ""}<br>${esc(a.phone || "")}</p>
        <span class="addr-actions"><span>Use this address ${A.icon("arrow-right")}</span></span>
      </button>`).join("")}
    </div>`;
  }

  function deliveryPanel() {
    return `<section class="checkout-step-panel is-active" data-step-panel="0" aria-label="Delivery details">
      <div class="checkout-card">
        <div class="checkout-card-head"><h2>${A.icon("map-pin")} Where should we deliver?</h2>${A.state.user ? `<a href="account.html#addresses">Manage addresses</a>` : `<a href="account.html">Sign in for faster checkout</a>`}</div>
        <div class="checkout-card-body">
          ${savedAddressHTML()}
          <form id="deliveryForm">
            <div class="form-grid">
              ${field("name", "Full name", form.name, { required: true, autocomplete: "name", placeholder: "e.g. Ada Obi" })}
              ${field("phone", "Phone number", form.phone, { required: true, type: "tel", autocomplete: "tel", placeholder: "+234 801 234 5678" })}
              ${field("email", "Email address", form.email, { required: true, type: "email", autocomplete: "email", placeholder: "you@example.com", span: true })}
              ${field("line", "Street address", form.line, { required: true, autocomplete: "street-address", placeholder: "House number and street", span: true })}
              ${field("city", "City", form.city, { required: true, autocomplete: "address-level2" })}
              ${field("state", "State / region", form.state, { required: true, autocomplete: "address-level1" })}
              ${field("country", "Country", form.country, { required: true, autocomplete: "country-name" })}
              ${field("postal", "Postal code", form.postal, { autocomplete: "postal-code", placeholder: "Optional" })}
              <div class="field span-2">
                <label for="notes">Delivery notes <span class="text-muted" style="font-weight:500">(optional)</span></label>
                <textarea class="textarea" id="notes" name="notes" rows="2" placeholder="Landmark, gate code or a safe place to leave your parcel" style="min-height:70px">${esc(form.notes)}</textarea>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div class="checkout-card">
        <div class="checkout-card-head"><h2>${A.icon("truck")} Delivery method</h2></div>
        <div class="checkout-card-body">
          <div class="delivery-methods">
            ${Object.entries(DELIVERY).map(([key, d]) => {
              const t = totals();
              const price = key === "standard" ? (t.freeShipping ? "Free" : A.money(3.99)) : key === "express" ? A.money(5.99) : "Free";
              return `<label class="delivery-method ${deliveryMethod === key ? "is-selected" : ""}">
                <input type="radio" name="deliveryMethod" value="${key}" ${deliveryMethod === key ? "checked" : ""}>
                <span class="radio-dot"></span>
                <span><strong>${d.label}</strong><span>${d.eta} · ${d.note}</span></span>
                <span class="price">${price}</span>
              </label>`;
            }).join("")}
          </div>
        </div>
      </div>
      <div class="checkout-nav">
        <a class="btn-back" href="cart.html">${A.icon("arrow-left")} Back to basket</a>
        <button class="btn btn-primary" type="button" data-next-step="0">Continue to payment ${A.icon("arrow-right")}</button>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Payment panel                                                       */
  /* ------------------------------------------------------------------ */
  function paymentPanel() {
    return `<section class="checkout-step-panel" data-step-panel="1" aria-label="Payment method">
      <div class="checkout-card">
        <div class="checkout-card-head"><h2>${A.icon("credit-card")} How would you like to pay?</h2><span class="badge badge-success">${A.icon("lock")} Secure</span></div>
        <div class="checkout-card-body">
          <div class="pay-methods">
            ${Object.entries(PAYMENTS).map(([key, p]) => `<label class="pay-method ${paymentMethod === key ? "is-selected" : ""}">
              <input type="radio" name="paymentMethod" value="${key}" ${paymentMethod === key ? "checked" : ""}>
              <span class="radio-dot"></span>
              <span class="pay-method-icon">${A.icon(key === "card" ? "credit-card" : key === "transfer" ? "bank" : key === "momo" ? "mobile" : "wallet")}</span>
              <span><strong>${p.label}</strong><span>${p.note}</span></span>
            </label>`).join("")}
          </div>

          <div class="pay-fields ${paymentMethod === "card" ? "is-active" : ""}" data-pay-fields="card">
            <div class="card-preview" aria-hidden="true">
              <div class="card-top"><span>TundaraPay</span><span id="cardBrand">CARD</span></div>
              <div class="card-number" id="cardNumberPreview">•••• •••• •••• ••••</div>
              <div class="card-bottom">
                <div><small>Card holder</small><span id="cardNamePreview">YOUR NAME</span></div>
                <div style="text-align:right"><small>Expires</small><span id="cardExpiryPreview">MM/YY</span></div>
              </div>
            </div>
            <div class="form-grid">
              <div class="field span-2" data-field="cardNumber">
                <label for="cardNumber">Card number *</label>
                <div class="input-group">${A.icon("credit-card")}<input class="input" id="cardNumber" name="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="23"></div>
                <span class="field-error">Enter a valid 16-digit card number.</span>
              </div>
              <div class="field span-2" data-field="cardName">
                <label for="cardName">Name on card *</label>
                <input class="input" id="cardName" name="cardName" autocomplete="cc-name" placeholder="ADA OBI">
                <span class="field-error">Enter the name printed on your card.</span>
              </div>
              <div class="field" data-field="cardExpiry">
                <label for="cardExpiry">Expiry date *</label>
                <input class="input" id="cardExpiry" name="cardExpiry" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5">
                <span class="field-error">Use a future expiry date (MM/YY).</span>
              </div>
              <div class="field" data-field="cardCvv">
                <label for="cardCvv">CVV *</label>
                <input class="input" id="cardCvv" name="cardCvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4">
                <span class="field-error">Enter the 3 or 4-digit security code.</span>
              </div>
            </div>
            <p class="field-hint mt-8">${A.icon("lock")} This is a demo checkout — no real payment is taken and card details are never stored.</p>
          </div>

          <div class="pay-fields ${paymentMethod === "transfer" ? "is-active" : ""}" data-pay-fields="transfer">
            <h4 style="font-size:.9rem;margin-bottom:6px">Transfer to your one-time account</h4>
            <p class="text-muted" style="font-size:.78rem;margin-bottom:12px">We’ll show account details after you place the order. Your order is held for 30 minutes while payment clears.</p>
            <div class="panel" style="padding:12px 14px;font-size:.78rem">
              <div class="summary-row" style="padding:3px 0"><span>Bank</span><strong>TundaraPay MFB</strong></div>
              <div class="summary-row" style="padding:3px 0"><span>Account name</span><strong>Tundara Ltd</strong></div>
              <div class="summary-row" style="padding:3px 0"><span>Account number</span><strong>0123456789</strong></div>
            </div>
            <p class="field-hint mt-8">Use your order number as the transfer reference so we can match it instantly.</p>
          </div>

          <div class="pay-fields ${paymentMethod === "momo" ? "is-active" : ""}" data-pay-fields="momo">
            <div class="field" data-field="momoPhone">
              <label for="momoPhone">Mobile money number *</label>
              <div class="input-group">${A.icon("phone")}<input class="input" id="momoPhone" name="momoPhone" inputmode="tel" placeholder="+234 801 234 5678"></div>
              <span class="field-error">Enter the phone number registered for mobile money.</span>
            </div>
            <p class="field-hint mt-8">You’ll receive a prompt on your phone to approve the payment. Supported: MTN MoMo, Airtel Money, M-Pesa.</p>
          </div>

          <div class="pay-fields ${paymentMethod === "cod" ? "is-active" : ""}" data-pay-fields="cod">
            <h4 style="font-size:.9rem;margin-bottom:6px">Pay when it arrives</h4>
            <p class="text-muted" style="font-size:.78rem;line-height:1.6">Pay with cash or card at your door. Our courier will confirm your order with a call first. Available on orders up to ${A.money(500)} in selected cities.</p>
          </div>
        </div>
      </div>
      <div class="checkout-nav">
        <button class="btn-back" type="button" data-prev-step="1">${A.icon("arrow-left")} Back to delivery</button>
        <button class="btn btn-primary" type="button" data-next-step="1">Review order ${A.icon("arrow-right")}</button>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Review panel                                                        */
  /* ------------------------------------------------------------------ */
  function reviewPanel() {
    const t = totals();
    const address = `${esc(form.line)}, ${esc(form.city)}, ${esc(form.state)}, ${esc(form.country)}${form.postal ? " " + esc(form.postal) : ""}`;
    return `<section class="checkout-step-panel" data-step-panel="2" aria-label="Review and place order">
      <div class="checkout-card">
        <div class="checkout-card-head"><h2>${A.icon("package")} Review your order</h2><span class="text-muted" style="font-size:.72rem">${t.itemCount} item${t.itemCount === 1 ? "" : "s"}</span></div>
        <div class="checkout-card-body">
          <div class="form-grid">
            <div class="panel" style="padding:14px">
              <div class="review-block-head"><strong>${A.icon("map-pin")} Delivery address</strong><button type="button" data-edit-step="0">Edit</button></div>
              <p style="font-size:.78rem;color:var(--muted);line-height:1.6">${esc(form.name)}<br>${address}<br>${esc(form.phone)} · ${esc(form.email)}</p>
              ${form.notes ? `<p style="font-size:.72rem;color:var(--muted);margin-top:6px"><b>Note:</b> ${esc(form.notes)}</p>` : ""}
            </div>
            <div class="panel" style="padding:14px">
              <div class="review-block-head"><strong>${A.icon("truck")} Delivery method</strong><button type="button" data-edit-step="0">Edit</button></div>
              <p style="font-size:.78rem;color:var(--muted);line-height:1.6">${DELIVERY[deliveryMethod].label}<br>${DELIVERY[deliveryMethod].eta}<br>${t.freeShipping ? "Free delivery" : A.money(t.shipping)}</p>
            </div>
            <div class="panel span-2" style="padding:14px">
              <div class="review-block-head"><strong>${A.icon("credit-card")} Payment</strong><button type="button" data-edit-step="1">Edit</button></div>
              <p style="font-size:.78rem;color:var(--muted);line-height:1.6">${esc(paymentLabel())}<br>${PAYMENTS[paymentMethod].note}</p>
            </div>
          </div>

          <div class="checkout-items" style="max-height:none;margin-top:16px">
            ${A.state.cart.map((item) => {
              const p = A.getProduct(item.id);
              if (!p) return "";
              return `<div class="checkout-item">
                <img src="${p.image}" alt="${esc(p.title)}" loading="lazy">
                <div style="min-width:0"><div class="ci-title">${esc(p.title)}</div><div class="ci-meta">${item.variant ? esc(item.variant) + " · " : ""}Qty ${item.qty}</div></div>
                <span class="ci-price" data-usd="${A.itemPrice(item) * item.qty}">${A.money(A.itemPrice(item) * item.qty)}</span>
              </div>`;
            }).join("")}
          </div>

          <label class="check terms-row" style="display:flex;align-items:flex-start;gap:8px">
            <input type="checkbox" id="acceptTerms">
            <span>I agree to Tundara’s <a href="help.html#terms">Terms of Service</a>, <a href="help.html#privacy">Privacy Policy</a> and <a href="help.html#returns">Returns Policy</a>. I confirm my delivery details are correct.</span>
          </label>
          <span class="field-error" id="termsError" style="display:none">Please accept the terms to continue.</span>

          <div class="summary-note" style="justify-content:flex-start;margin-top:8px">${A.icon("shield")} Protected by Tundara Guarantee · 7-day returns · genuine products guaranteed</div>
        </div>
      </div>
      <div class="checkout-nav">
        <button class="btn-back" type="button" data-prev-step="2">${A.icon("arrow-left")} Back to payment</button>
        <button class="btn btn-primary btn-lg" type="button" id="placeOrder">${A.icon("lock")} Place order · <span data-usd="${t.total}">${A.money(t.total)}</span></button>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Empty / boot                                                        */
  /* ------------------------------------------------------------------ */
  function emptyHTML() {
    return `<div class="empty-state panel" style="margin-top:20px">
      <div class="empty-icon">${A.icon("bag")}</div>
      <h2>Your basket is empty</h2>
      <p>Add something you love before heading to checkout. Free delivery on orders over ${A.money(A.freeShippingUSD)}.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <a class="btn btn-primary" href="shop.html">Browse products ${A.icon("arrow-right")}</a>
        <a class="btn btn-outline" href="wishlist.html">View wishlist</a>
      </div>
    </div>`;
  }

  function renderAll() {
    const root = $("#checkoutRoot");
    if (!root) return;
    if (!A.state.cart.length) {
      root.innerHTML = emptyHTML();
      return;
    }
    root.innerHTML = `<div id="checkoutSteps">${stepsHTML()}</div>
      <div class="checkout-layout">
        <div class="checkout-main">
          ${deliveryPanel()}
          ${paymentPanel()}
          ${reviewPanel()}
        </div>
        <div id="checkoutSummary">${summaryHTML()}</div>
      </div>
      <div class="order-processing" id="orderProcessing" aria-hidden="true">
        <div class="processing-card" role="status" aria-live="polite">
          <div class="processing-spinner"></div>
          <h2>Placing your order…</h2>
          <p>Hang tight, we’re confirming everything.</p>
          <div class="processing-steps">
            <div class="processing-step is-done" data-proc="0"><span class="step-dot">${A.icon("check")}</span> Validating your details</div>
            <div class="processing-step" data-proc="1"><span class="step-dot">${A.icon("check")}</span> Reserving your items</div>
            <div class="processing-step" data-proc="2"><span class="step-dot">${A.icon("check")}</span> Confirming payment</div>
          </div>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Step navigation                                                     */
  /* ------------------------------------------------------------------ */
  function showStep(next) {
    step = Math.max(0, Math.min(STEP_LABELS.length - 1, next));
    $$("[data-step-panel]").forEach((panel) => panel.classList.toggle("is-active", Number(panel.dataset.stepPanel) === step));
    refreshSteps();
    window.scrollTo({ top: ($("#checkoutRoot")?.offsetTop || 0) - 20, behavior: "smooth" });
  }

  function setError(name, message) {
    const wrapper = $(`[data-field="${name}"]`);
    if (!wrapper) return;
    wrapper.classList.add("has-error");
    const err = wrapper.querySelector(".field-error");
    if (err && message) err.textContent = message;
  }
  function clearError(name) {
    $(`[data-field="${name}"]`)?.classList.remove("has-error");
  }
  function clearAllErrors() {
    $$("[data-field]").forEach((el) => el.classList.remove("has-error"));
    const termsError = $("#termsError");
    if (termsError) termsError.style.display = "none";
  }
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const phoneOk = (v) => v.replace(/[^\d]/g, "").length >= 7;

  function collectDelivery() {
    ["name", "email", "phone", "line", "city", "state", "country", "postal", "notes"].forEach((key) => {
      const el = $(`#${key}`);
      if (el) form[key] = el.value.trim();
    });
  }

  function validateDelivery() {
    clearAllErrors();
    collectDelivery();
    let first = null;
    const fail = (key, message) => {
      setError(key, message);
      if (!first) first = key;
    };
    if (!form.name) fail("name", "Please enter your full name.");
    if (!form.email) fail("email", "Please enter your email address.");
    else if (!emailOk(form.email)) fail("email", "That email address doesn’t look right.");
    if (!form.phone) fail("phone", "Please enter your phone number.");
    else if (!phoneOk(form.phone)) fail("phone", "Enter a valid phone number.");
    if (!form.line) fail("line", "Please enter your street address.");
    if (!form.city) fail("city", "Please enter your city.");
    if (!form.state) fail("state", "Please enter your state or region.");
    if (!form.country) fail("country", "Please enter your country.");
    if (first) {
      const el = $(`#${first}`);
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      A.toast("Check your details", "Some delivery fields need your attention.", "error");
      return false;
    }
    return true;
  }

  function validatePayment() {
    clearAllErrors();
    if (paymentMethod === "card") {
      let first = null;
      const fail = (key, message) => { setError(key, message); if (!first) first = key; };
      const digits = ($("#cardNumber")?.value || "").replace(/\D/g, "");
      const name = ($("#cardName")?.value || "").trim();
      const expiry = ($("#cardExpiry")?.value || "").trim();
      const cvv = ($("#cardCvv")?.value || "").replace(/\D/g, "");
      if (digits.length !== 16) fail("cardNumber", "Enter a valid 16-digit card number.");
      if (!name) fail("cardName", "Enter the name printed on your card.");
      const m = expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
      const now = new Date();
      const validExpiry = m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && new Date(2000 + Number(m[2]), Number(m[1]), 0) >= new Date(now.getFullYear(), now.getMonth(), 1);
      if (!validExpiry) fail("cardExpiry", "Use a future expiry date (MM/YY).");
      if (cvv.length < 3) fail("cardCvv", "Enter the 3 or 4-digit security code.");
      if (first) {
        $(`#${first}`)?.focus();
        A.toast("Check your card details", "We couldn’t verify your card yet.", "error");
        return false;
      }
    }
    if (paymentMethod === "momo") {
      const phone = ($("#momoPhone")?.value || "").trim();
      if (!phoneOk(phone)) {
        setError("momoPhone", "Enter the phone number registered for mobile money.");
        $("#momoPhone")?.focus();
        return false;
      }
    }
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Card formatting                                                     */
  /* ------------------------------------------------------------------ */
  function bindCard() {
    const number = $("#cardNumber");
    const name = $("#cardName");
    const expiry = $("#cardExpiry");
    const cvv = $("#cardCvv");

    number?.addEventListener("input", () => {
      const digits = number.value.replace(/\D/g, "").slice(0, 16);
      number.value = digits.replace(/(.{4})/g, "$1 ").trim();
      const preview = $("#cardNumberPreview");
      if (preview) {
        const shown = digits.padEnd(16, "•").replace(/(.{4})/g, "$1 ").trim();
        preview.textContent = shown;
      }
      const brand = $("#cardBrand");
      if (brand) {
        const brandName = digits.startsWith("4") ? "VISA" : /^5[1-5]/.test(digits) ? "MASTERCARD" : /^(506|507|650)/.test(digits) ? "VERVE" : "CARD";
        brand.textContent = brandName;
      }
      clearError("cardNumber");
    });
    name?.addEventListener("input", () => {
      const preview = $("#cardNamePreview");
      if (preview) preview.textContent = (name.value || "YOUR NAME").toUpperCase().slice(0, 26);
      clearError("cardName");
    });
    expiry?.addEventListener("input", () => {
      let digits = expiry.value.replace(/\D/g, "").slice(0, 4);
      if (digits.length >= 3) digits = digits.slice(0, 2) + "/" + digits.slice(2);
      expiry.value = digits;
      const preview = $("#cardExpiryPreview");
      if (preview) preview.textContent = digits || "MM/YY";
      clearError("cardExpiry");
    });
    cvv?.addEventListener("input", () => {
      cvv.value = cvv.value.replace(/\D/g, "").slice(0, 4);
      clearError("cardCvv");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Place order                                                         */
  /* ------------------------------------------------------------------ */
  function placeOrder() {
    if (processing) return;
    clearAllErrors();
    if (!A.state.cart.length) { A.toast("Basket empty", "Add an item before placing an order.", "error"); return; }
    collectDelivery();
    if (!form.name || !form.email || !form.phone || !form.line || !form.city) {
      showStep(0);
      validateDelivery();
      return;
    }
    if (paymentMethod === "card") {
      showStep(1);
      if (!validatePayment()) return;
      showStep(2);
    }
    if (paymentMethod === "momo") {
      showStep(1);
      if (!validatePayment()) return;
      showStep(2);
    }
    const terms = $("#acceptTerms");
    if (terms && !terms.checked) {
      const err = $("#termsError");
      if (err) err.style.display = "block";
      terms.focus();
      A.toast("One more thing", "Please accept the terms to place your order.", "error");
      return;
    }

    processing = true;
    const overlay = $("#orderProcessing");
    overlay?.classList.add("is-open");
    overlay?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const t = totals();
    const orderItems = A.state.cart.map((item) => ({ ...item }));
    const payload = {
      items: orderItems,
      totals: t,
      coupon: A.state.coupon || null,
      customer: { name: form.name, email: form.email, phone: form.phone },
      address: { name: form.name, line: form.line, city: form.city, state: form.state, country: form.country, postal: form.postal, phone: form.phone, notes: form.notes },
      delivery: { method: deliveryMethod, label: DELIVERY[deliveryMethod].label, fee: t.shipping, eta: DELIVERY[deliveryMethod].eta },
      payment: { method: paymentMethod, label: paymentLabel() },
    };

    const markDone = (index) => {
      const el = $(`[data-proc="${index}"]`);
      if (el) el.classList.add("is-done");
    };

    setTimeout(() => markDone(1), 650);
    setTimeout(() => markDone(2), 1350);
    setTimeout(() => {
      const order = A.createOrder(payload);
      A.clearCart();
      A.toast("Order confirmed", `Thanks ${form.name.split(" ")[0]} — your order is in.`, "success");
      window.location.href = "order-success.html?order=" + encodeURIComponent(order.id);
    }, 2150);
  }

  /* ------------------------------------------------------------------ */
  /* Bind                                                                */
  /* ------------------------------------------------------------------ */
  function bind() {
    const root = $("#checkoutRoot");
    if (!root) return;

    root.addEventListener("click", (e) => {
      const next = e.target.closest("[data-next-step]");
      if (next) {
        const current = Number(next.dataset.nextStep);
        if (current === 0) {
          if (!validateDelivery()) return;
          refreshSummary();
          showStep(1);
        } else if (current === 1) {
          if (!validatePayment()) return;
          // Keep review panel in sync with the latest details.
          const panel = $('[data-step-panel="2"]');
          if (panel) panel.outerHTML = reviewPanel();
          refreshSummary();
          showStep(2);
        }
        return;
      }
      const prev = e.target.closest("[data-prev-step]");
      if (prev) {
        const current = Number(prev.dataset.prevStep);
        if (current === 2) {
          // Rebuild review panel content on re-entry if needed.
          const panel = $('[data-step-panel="2"]');
          if (panel) panel.outerHTML = reviewPanel();
        }
        showStep(current - 1);
        return;
      }
      const edit = e.target.closest("[data-edit-step]");
      if (edit) { showStep(Number(edit.dataset.editStep)); return; }

      const useAddress = e.target.closest("[data-use-address]");
      if (useAddress) {
        const addresses = A.getAddresses();
        const a = addresses[Number(useAddress.dataset.useAddress)];
        if (!a) return;
        form = { ...form, name: a.name || form.name, phone: a.phone || form.phone, line: a.line || "", city: a.city || form.city, state: a.state || form.state, country: a.country || form.country, postal: a.postal || "" };
        $$('[data-use-address]').forEach((el) => el.classList.remove("is-default"));
        useAddress.classList.add("is-default");
        $$("#deliveryForm [id]").forEach((el) => {
          if (el.id in form) el.value = form[el.id] || "";
        });
        A.toast("Address selected", "Your delivery details have been filled in.", "success");
        return;
      }

      const couponRemove = e.target.closest("[data-coupon-remove]");
      if (couponRemove) {
        A.removeCoupon();
        A.toast("Promo removed", "The discount was taken off your order.", "info");
        refreshSummary();
        return;
      }

      if (e.target.closest("#placeOrder")) { placeOrder(); return; }
    });

    root.addEventListener("submit", (e) => {
      const couponForm = e.target.closest("[data-coupon-form]");
      if (couponForm) {
        e.preventDefault();
        const code = couponForm.querySelector('input[name="coupon"]')?.value || "";
        if (!code.trim()) { A.toast("Enter a code", "Type a promo code to apply it.", "error"); return; }
        const result = A.applyCoupon(code);
        if (!result.ok) { A.toast("Code not applied", result.message, "error"); return; }
        A.toast("Promo applied", `${result.coupon.code} — ${result.coupon.label}`, "success");
        refreshSummary();
        return;
      }
      if (e.target.id === "deliveryForm") {
        e.preventDefault();
        if (validateDelivery()) { refreshSummary(); showStep(1); }
      }
    });

    // Delivery method radios
    root.addEventListener("change", (e) => {
      const radio = e.target.closest('input[name="deliveryMethod"]');
      if (radio) {
        deliveryMethod = radio.value;
        $$(".delivery-method").forEach((el) => el.classList.toggle("is-selected", el.querySelector("input")?.value === deliveryMethod));
        $$(".delivery-method").forEach((el) => {
          const price = el.querySelector(".price");
          if (!price) return;
          const key = el.querySelector("input")?.value;
          if (key === "standard") {
            const sub = A.computeTotals(A.state.cart, A.state.coupon, undefined).subtotal;
            price.innerHTML = sub >= A.freeShippingUSD ? "Free" : A.money(3.99);
          } else if (key === "express") {
            price.innerHTML = A.money(5.99);
          } else {
            price.innerHTML = "Free";
          }
        });
        refreshSummary();
        return;
      }
      const pay = e.target.closest('input[name="paymentMethod"]');
      if (pay) {
        paymentMethod = pay.value;
        $$(".pay-method").forEach((el) => el.classList.toggle("is-selected", el.querySelector("input")?.value === paymentMethod));
        $$("[data-pay-fields]").forEach((el) => el.classList.toggle("is-active", el.dataset.payFields === paymentMethod));
        if (paymentMethod === "card") bindCard();
        return;
      }
      if (e.target.id === "acceptTerms") {
        const err = $("#termsError");
        if (err) err.style.display = "none";
      }
    });

    bindCard();
  }

  onReady(() => {
    prefill();
    if (!A.state.cart.length) { renderAll(); return; }
    renderAll();
    bind();
  });
})();
