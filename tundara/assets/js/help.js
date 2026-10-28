/* ==========================================================================
   Tundara — help centre
   ========================================================================== */
(function () {
  "use strict";

  const A = window.TDApp;
  if (!A) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const onReady = (fn) => (document.body.classList.contains("is-ready") ? fn() : document.addEventListener("zm:ready", fn, { once: true }));

  function setActiveNav(hash) {
    const id = String(hash || "").replace("#", "");
    if (!id) return;
    $$(".help-nav a").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id || link.dataset.section === id);
    });
  }

  function filter(query) {
    const q = query.trim().toLowerCase();
    const items = $$(".faq-item");
    let visible = 0;

    items.forEach((item) => {
      const match = !q || item.textContent.toLowerCase().includes(q);
      item.hidden = !match;
      if (match) visible++;
      if (q && match) item.open = true;
      else if (!q) item.open = false;
    });

    $$(".faq-group").forEach((group) => {
      const any = $$(".faq-item", group).some((item) => !item.hidden);
      group.hidden = !any;
    });

    const empty = $("#helpEmpty");
    if (empty) empty.hidden = visible !== 0;

    const count = $("#helpSearchCount");
    if (count) {
      count.hidden = !q;
      count.textContent = q ? `${visible} answer${visible === 1 ? "" : "s"} for “${query.trim()}”` : "";
    }

    const clear = $("#helpSearchClear");
    if (clear) clear.hidden = !q;
  }

  function init() {
    const form = $("#helpSearchForm");
    const input = $("#helpSearch");
    const clear = $("#helpSearchClear");

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      filter(input?.value || "");
    });
    input?.addEventListener("input", () => filter(input.value));
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        filter("");
      }
    });
    clear?.addEventListener("click", () => {
      if (!input) return;
      input.value = "";
      filter("");
      input.focus();
    });
    $("#helpEmptyReset")?.addEventListener("click", () => {
      if (!input) return;
      input.value = "";
      filter("");
      input.focus();
    });

    // Smooth in-page navigation + active state
    $$(".help-nav a").forEach((link) => {
      link.addEventListener("click", () => setActiveNav(link.getAttribute("href")));
    });
    $$("[data-help-jump]").forEach((link) => {
      link.addEventListener("click", () => setActiveNav(link.dataset.helpJump));
    });
    window.addEventListener("hashchange", () => setActiveNav(location.hash));
    if (location.hash) {
      setActiveNav(location.hash);
      const target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }

    // Support actions
    $$("[data-open-chat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const fab = document.getElementById("chatFab");
        const panel = document.getElementById("chatPanel");
        if (fab && panel && !panel.classList.contains("is-open")) fab.click();
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });

    $$("[data-search-topic]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!input) return;
        input.value = btn.dataset.searchTopic;
        filter(input.value);
        input.focus();
        $("#faqTop")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    filter("");
  }

  onReady(init);
})();
