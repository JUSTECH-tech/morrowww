/* =========================================================
   Morrow — interactions
   ========================================================= */

(function () {
  "use strict";

  const M = window.M;
  const esc = M.escape;

  let appShell = null;
  let mainContent = null;
  let modal = null;
  let modalPanel = null;
  let onboardingRoot = null;
  let toastStack = null;
  let themeButton = null;
  let fileInput = null;
  let deferredPrompt = null;
  let pendingConfirm = null;
  let timerInterval = null;
  let timerTicks = 0;
  let hasStarted = false;

  const VIEWS = ["today", "habits", "focus", "planner", "insights", "settings"];
  const TITLES = {
    today: "Today",
    habits: "Habits",
    focus: "Focus",
    planner: "Planner",
    insights: "Insights",
    settings: "Settings",
  };

  /* ---------- Tiny utilities ---------- */

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function isTyping() {
    const el = document.activeElement;
    if (!el) return false;
    return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
  }

  function isModalOpen() {
    return Boolean(modal && modal.open);
  }

  function icon(name, size) {
    return M.icon(name, size);
  }

  function dateTitle(iso) {
    return M.formatDate(iso || M.todayISO(), "long");
  }

  function currentTimerRemaining() {
    return M.timerRemaining ? M.timerRemaining() : Math.max(0, Math.round(M.state.timer.remaining || 0));
  }

  function currentTimerPercent() {
    const timer = M.state.timer;
    const duration = Number(timer.duration) || 1;
    return clamp(Math.round(((duration - currentTimerRemaining()) / duration) * 100), 0, 100);
  }

  /* ---------- Toasts ---------- */

  M.toast = function (message, options) {
    if (!toastStack) return;
    const opts = options || {};
    while (toastStack.children.length >= 4) {
      toastStack.removeChild(toastStack.firstElementChild);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      '<span class="toast-icon">' +
      icon(opts.icon || "check", 13) +
      "</span>" +
      '<span class="toast-message">' +
      esc(message) +
      "</span>" +
      '<button class="toast-close" type="button" aria-label="Dismiss">' +
      icon("x", 12) +
      "</button>";
    const remove = function () {
      if (!el.parentNode) return;
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 230);
    };
    const close = el.querySelector(".toast-close");
    close.addEventListener("click", remove);
    toastStack.appendChild(el);
    window.setTimeout(remove, opts.duration || 4200);
  };

  /* ---------- Confetti ---------- */

  const confetti = (function () {
    const canvas = document.getElementById("confettiCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    let particles = [];
    let frame = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function palette() {
      const styles = getComputedStyle(document.documentElement);
      return [
        styles.getPropertyValue("--accent").trim() || "#dcf56f",
        styles.getPropertyValue("--accent-strong").trim() || "#c7e354",
        "#8b7cf6",
        "#5ba9e8",
        "#ef7b57",
        "#e38aac",
        "#56a67d",
      ];
    }

    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function (p) {
        p.vy += 0.17;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        p.life -= 0.008;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      particles = particles.filter(function (p) {
        return p.life > 0 && p.y < height + 40;
      });
      if (particles.length) {
        frame = window.requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
        frame = null;
      }
    }

    return function burst(count) {
      if (!ctx) return;
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      resize();
      const colors = palette();
      const amount = count || 80;
      const originX = width / 2;
      const originY = height * 0.34;
      for (let i = 0; i < amount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 9;
        particles.push({
          x: originX + (Math.random() - 0.5) * 60,
          y: originY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          size: 5 + Math.random() * 7,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.22,
          life: 1,
        });
      }
      if (!frame) frame = window.requestAnimationFrame(tick);
    };
  })();

  /* ---------- Modal ---------- */

  function openModal(html, options) {
    const opts = options || {};
    if (!modal || !modalPanel) return;
    modal.className = "modal" + (opts.wide ? " modal-wide" : "") + (opts.narrow ? " modal-narrow" : "");
    modalPanel.innerHTML = html;
    if (!modal.open) modal.showModal();
    document.body.classList.add("is-locked");
    if (opts.focus !== false) {
      window.setTimeout(function () {
        const field = modalPanel.querySelector("[autofocus], input:not([type=hidden]), textarea, select, button");
        if (field) field.focus();
      }, 60);
    }
  }

  function closeModal() {
    if (modal && modal.open) modal.close();
  }

  function openConfirm(options) {
    const opts = options || {};
    pendingConfirm = typeof opts.onConfirm === "function" ? opts.onConfirm : null;
    openModal(
      M.confirmModal({
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel,
        icon: opts.icon,
      }),
      { narrow: true, focus: false }
    );
  }

  /* ---------- App chrome ---------- */

  function renderApp(keepScroll) {
    if (!mainContent) return;
    const scroll = window.scrollY;
    mainContent.innerHTML = M.renderView(M.ui.view);
    updateChrome();
    if (keepScroll) {
      window.scrollTo(0, scroll);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function updateThemeButton() {
    if (!themeButton) return;
    const resolved = document.documentElement.getAttribute("data-theme") || "light";
    const holder = themeButton.querySelector("[data-icon]");
    if (holder) {
      holder.setAttribute("data-icon", resolved === "dark" ? "moon" : "sun");
      holder.innerHTML = icon(resolved === "dark" ? "moon" : "sun", 17);
    }
    themeButton.setAttribute("aria-label", resolved === "dark" ? "Switch to light mode" : "Switch to dark mode");
    themeButton.setAttribute("title", resolved === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  function updateChrome() {
    if (!M.state || !M.state.profile.onboarded) return;
    const profile = M.state.profile;
    const iso = M.todayISO();
    const focusLive = document.getElementById("focusNavLive");
    const badge = document.getElementById("todayNavBadge");

    document.querySelectorAll(".nav-item[data-view]").forEach(function (item) {
      const active = item.getAttribute("data-view") === M.ui.view;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });

    document.querySelectorAll(".mobile-nav-item[data-view]").forEach(function (item) {
      const active = item.getAttribute("data-view") === M.ui.view;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });

    const dateEl = document.getElementById("topbarDate");
    if (dateEl) dateEl.textContent = dateTitle(iso);

    const completion = M.habitCompletionForDate(iso);
    const remaining = Math.max(0, completion.total - completion.done);
    if (badge) {
      badge.textContent = String(remaining);
      badge.hidden = remaining <= 0;
    }
    if (focusLive) focusLive.hidden = !M.state.timer.running;

    const name = profile.name || "Friend";
    const initials = M.initials(name);
    const topAvatarText = document.getElementById("topAvatarText");
    if (topAvatarText) topAvatarText.textContent = initials;
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    const sidebarName = document.getElementById("sidebarName");
    if (sidebarName) sidebarName.textContent = M.firstName(name);
    const sidebarRole = document.getElementById("sidebarRole");
    if (sidebarRole) sidebarRole.textContent = M.roleLabel ? M.roleLabel(profile.role) : "Your personal space";

    const streakCard = document.getElementById("sidebarStreak");
    if (streakCard) {
      const streak = M.bestCurrentStreak();
      const active = M.activeHabits().length;
      const week = M.getWeekDays(iso);
      streakCard.innerHTML =
        '<div class="streak-mini">' +
        '<div class="streak-mini-top">' +
        icon("flame", 14) +
        (streak ? "Best rhythm" : "Starting out") +
        "</div>" +
        '<p class="streak-mini-number">' +
        (streak || (active ? 0 : "—")) +
        "<span>" +
        (active ? " days" : "") +
        "</span></p>" +
        '<p class="streak-mini-copy">' +
        (active
          ? streak
            ? "Your longest active habit streak. Keep it gentle."
            : "Today is a good place to begin again."
          : "Add one small habit and let it grow here.") +
        "</p>" +
        '<div class="streak-dots">' +
        week
          .map(function (dayISO) {
            const c = M.habitCompletionForDate(dayISO);
            const on = c.done > 0 || M.focusSecondsOn(dayISO) > 0;
            return '<span class="' + (on ? "on" : "") + '"></span>';
          })
          .join("") +
        "</div>" +
        "</div>";
    }

    updateThemeButton();
    document.title = (TITLES[M.ui.view] || "Morrow") + " · Morrow";
  }

  function hydrateShellIcons() {
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      if (el.children.length) return;
      el.innerHTML = icon(el.getAttribute("data-icon"), 18);
    });
  }

  /* ---------- Navigation ---------- */

  function navigate(view, options) {
    const opts = options || {};
    if (!M.state.profile.onboarded) return;
    const next = VIEWS.indexOf(view) !== -1 ? view : "today";
    M.ui.view = next;
    M.ui.commandFocus = 0;
    if (opts.hash !== false) {
      try {
        history.replaceState(null, "", "#" + next);
      } catch (error) {
        /* file:// can reject history changes in some browsers. */
      }
    }
    renderApp(false);
    if (mainContent) mainContent.focus({ preventScroll: true });
  }

  /* ---------- Onboarding ---------- */

  function decorateOnboarding() {
    if (!onboardingRoot) return;
    const range = onboardingRoot.querySelector('[data-onboarding-field="focusGoal"]');
    if (range) {
      const min = Number(range.min) || 15;
      const max = Number(range.max) || 300;
      const value = Number(range.value) || 120;
      range.style.setProperty("--range-progress", ((value - min) / (max - min)) * 100 + "%");
    }
  }

  function showOnboarding() {
    if (!appShell || !onboardingRoot) return;
    M.ui.onboardingStep = 0;
    M.ui.onboardingDraft = null;
    appShell.hidden = true;
    onboardingRoot.innerHTML = M.renderOnboarding();
    document.body.classList.add("is-locked");
    decorateOnboarding();
  }

  function refreshOnboarding() {
    if (!onboardingRoot) return;
    const screen = onboardingRoot.querySelector("[data-onboarding-screen]");
    const scroll = screen ? screen.scrollTop : 0;
    onboardingRoot.innerHTML = M.renderOnboarding();
    const nextScreen = onboardingRoot.querySelector("[data-onboarding-screen]");
    if (nextScreen) nextScreen.scrollTop = scroll;
    decorateOnboarding();
  }

  function completeOnboarding() {
    const draft = M.onboardingDraft();
    M.seedWorkspace({
      name: draft.name,
      role: draft.role,
      focusGoal: draft.focusGoal,
      interests: draft.interests,
      seed: draft.seed !== false,
    });
    onboardingRoot.innerHTML = "";
    appShell.hidden = false;
    document.body.classList.remove("is-locked");
    M.ui.onboardingStep = 0;
    M.ui.onboardingDraft = null;
    M.applyTheme();
    M.ui.view = "today";
    try {
      history.replaceState(null, "", "#today");
    } catch (error) {
      /* ignore */
    }
    renderApp(false);
    confetti(75);
    M.toast("Welcome to Morrow, " + M.firstName(M.state.profile.name) + ".", { icon: "sparkles" });
  }

  /* ---------- Timer ---------- */

  function startTicker() {
    if (timerInterval) return;
    timerTicks = 0;
    timerInterval = window.setInterval(tickTimer, 1000);
  }

  function stopTicker() {
    if (!timerInterval) return;
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  function ensureTicker() {
    if (M.state.timer.running) startTicker();
    else stopTicker();
  }

  function updateTimerDom() {
    const timer = M.state.timer;
    const remaining = currentTimerRemaining();
    const percent = currentTimerPercent();
    const clock = M.formatClock(remaining);
    document.querySelectorAll("[data-timer-mini-time]").forEach(function (el) {
      el.textContent = clock;
    });
    document.querySelectorAll("[data-focus-time]").forEach(function (el) {
      el.textContent = clock;
    });
    const circumference = 2 * Math.PI * 46;
    document.querySelectorAll(".mini-timer-ring .ring-fill, .focus-ring .focus-ring-progress").forEach(function (circle) {
      circle.setAttribute("stroke-dashoffset", String(circumference * (1 - percent / 100)));
    });
    document.querySelectorAll("[data-timer-mini-mode]").forEach(function (el) {
      el.textContent = timer.mode === "break" ? "Break" : "Focus";
    });
  }

  function tickTimer() {
    const timer = M.state.timer;
    if (!timer.running) {
      stopTicker();
      return;
    }
    const remaining = currentTimerRemaining();
    if (remaining <= 0) {
      finishTimer();
      return;
    }
    timer.remaining = remaining;
    timerTicks += 1;
    if (timerTicks % 5 === 0) M.save();
    updateTimerDom();
  }

  function startTimer() {
    const timer = M.state.timer;
    if (timer.remaining <= 0) timer.remaining = timer.duration;
    timer.running = true;
    timer.endsAt = Date.now() + timer.remaining * 1000;
    timer.startedAt = timer.startedAt || new Date().toISOString();
    timer.completedAt = null;
    M.save();
    startTicker();
    updateChrome();
  }

  function pauseTimer() {
    const timer = M.state.timer;
    timer.remaining = currentTimerRemaining();
    timer.running = false;
    timer.endsAt = null;
    M.save();
    stopTicker();
    updateChrome();
  }

  function resetTimer(showMessage) {
    const timer = M.state.timer;
    timer.running = false;
    timer.remaining = timer.duration;
    timer.endsAt = null;
    timer.startedAt = null;
    timer.completedAt = null;
    M.save();
    stopTicker();
    if (showMessage) M.toast("Timer reset to " + Math.round(timer.duration / 60) + " minutes.", { icon: "rotate" });
  }

  function finishTimer() {
    const timer = M.state.timer;
    const wasFocus = timer.mode !== "break";
    const seconds = Math.max(60, Math.round(Number(timer.duration) || 0));
    const startedAt = timer.startedAt || new Date(Date.now() - seconds * 1000).toISOString();
    const endedAt = new Date().toISOString();

    timer.running = false;
    timer.remaining = 0;
    timer.endsAt = null;
    timer.completedAt = Date.now();

    if (wasFocus) {
      M.addFocusSession({
        seconds: seconds,
        subject: timer.subject || "General",
        startedAt: startedAt,
        endedAt: endedAt,
        source: "timer",
      });
    }
    timer.startedAt = null;
    M.save();
    stopTicker();
    updateTimerDom();
    updateChrome();

    if (wasFocus) {
      confetti(85);
      M.toast("Focus session complete. " + M.formatDuration(seconds) + " logged — the rest can wait.", { icon: "check-circle" });
    } else {
      M.toast("Break complete. Come back when you are ready.", { icon: "coffee" });
    }

    if (isModalOpen()) {
      M.ui.timerJustFinished = true;
    } else {
      renderApp(true);
    }
  }

  function beginFocus() {
    const timer = M.state.timer;
    if (timer.running) {
      navigate("focus");
      M.toast("Your timer is already running.", { icon: "timer" });
      return;
    }
    if (timer.mode !== "focus" || timer.remaining <= 0) {
      timer.mode = "focus";
      timer.duration = Math.max(1, Number(M.state.profile.defaultFocus) || 25) * 60;
      timer.remaining = timer.duration;
      timer.startedAt = null;
      timer.completedAt = null;
    }
    startTimer();
    navigate("focus");
    M.toast("Focus timer started · " + Math.round(timer.duration / 60) + " minutes.", { icon: "play" });
  }

  /* ---------- Habit actions ---------- */

  function findHabit(id) {
    return M.state.habits.find(function (habit) {
      return habit.id === id;
    });
  }

  function openHabitModal(habit) {
    openModal(M.habitModal(habit), { wide: true });
  }

  function updateHabitPreview() {
    if (!modalPanel) return;
    const form = modalPanel.querySelector('[data-form="habit"]');
    if (!form) return;
    const nameInput = form.querySelector('[name="name"]');
    const nameEl = form.querySelector("[data-habit-preview-name]");
    const metaEl = form.querySelector("[data-habit-preview-meta]");
    const scheduleInput = form.querySelector("[data-habit-schedule-input]");
    const targetInput = form.querySelector("[data-habit-target-input]");
    if (nameEl && nameInput) nameEl.textContent = nameInput.value.trim() || "Your new habit";
    if (metaEl) {
      const schedule = String(scheduleInput ? scheduleInput.value : "")
        .split(",")
        .filter(function (part) { return part !== ""; })
        .map(Number)
        .sort(function (a, b) { return a - b; });
      const target = Number(targetInput ? targetInput.value : 1) || 1;
      metaEl.textContent = M.scheduleLabel(schedule) + " · " + target + "× daily";
    }
  }

  function deleteHabit(id) {
    const habit = findHabit(id);
    if (!habit) return;
    openConfirm({
      title: "Let this habit go?",
      message: "“" + habit.name + "” and its history will be removed from this device. You can always start it again later.",
      confirmLabel: "Delete habit",
      icon: "trash",
      onConfirm: function () {
        M.state.habits = M.state.habits.filter(function (item) {
          return item.id !== id;
        });
        M.save();
        renderApp(true);
        updateChrome();
        M.toast("Habit removed. More room to breathe.", { icon: "leaf" });
      },
    });
  }

  /* ---------- Task actions ---------- */

  function findTask(id) {
    return M.state.tasks.find(function (task) {
      return task.id === id;
    });
  }

  function openTaskModal(task) {
    openModal(M.taskModal(task), { wide: true });
  }

  function deleteTask(id) {
    const task = findTask(id);
    if (!task) return;
    openConfirm({
      title: "Remove this task?",
      message: "“" + task.title + "” will be deleted. If it matters, it can always come back later.",
      confirmLabel: "Delete task",
      icon: "trash",
      onConfirm: function () {
        M.state.tasks = M.state.tasks.filter(function (item) {
          return item.id !== id;
        });
        M.save();
        renderApp(true);
        updateChrome();
        M.toast("Task removed.", { icon: "check-square" });
      },
    });
  }

  function addQuickTask(title, form) {
    const clean = String(title || "").trim();
    if (!clean) {
      if (form) {
        const input = form.querySelector("input");
        if (input) input.focus();
      }
      return;
    }
    M.state.tasks.push(
      M.createTask({
        title: clean,
        due: M.todayISO(),
        priority: "medium",
        tag: "Personal",
      })
    );
    if (M.ui.taskFilter === "done") M.ui.taskFilter = "all";
    M.save();
    renderApp(true);
    M.toast("Task added to today.", { icon: "plus" });
    window.setTimeout(function () {
      const input = mainContent.querySelector('[data-form="quick-task"] input');
      if (input) input.focus();
    }, 20);
  }

  /* ---------- Command palette ---------- */

  function setCommandFocus(index) {
    const items = modalPanel ? Array.prototype.slice.call(modalPanel.querySelectorAll("#commandList .command-item")) : [];
    if (!items.length) {
      M.ui.commandFocus = 0;
      return;
    }
    M.ui.commandFocus = clamp(index, 0, items.length - 1);
    items.forEach(function (item, i) {
      item.classList.toggle("is-focused", i === M.ui.commandFocus);
    });
    const active = items[M.ui.commandFocus];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }

  function openCommand() {
    if (!M.state.profile.onboarded) return;
    M.ui.commandFocus = 0;
    openModal(M.renderCommand(""), { wide: true, focus: false });
    window.setTimeout(function () {
      const input = modalPanel.querySelector("[data-command-input]");
      if (input) {
        input.focus();
        if (input.setSelectionRange) input.setSelectionRange(input.value.length, input.value.length);
      }
      setCommandFocus(0);
    }, 50);
  }

  function filterCommand(query) {
    if (!modalPanel) return;
    const list = modalPanel.querySelector("#commandList");
    if (!list) return;
    const temp = document.createElement("div");
    temp.innerHTML = M.renderCommand(query);
    const fresh = temp.querySelector("#commandList");
    if (fresh) list.innerHTML = fresh.innerHTML;
    M.ui.commandFocus = 0;
    setCommandFocus(0);
  }

  function runCommand(id) {
    const item = M.commandItems().find(function (command) {
      return command.id === id;
    });
    if (!item) return;
    closeModal();
    if (item.action === "nav") {
      navigate(item.view);
      return;
    }
    handleAction(item.action, { dataset: {} }, null);
  }

  /* ---------- Theme / data ---------- */

  function setTheme(theme) {
    M.state.profile.theme = theme;
    M.applyTheme();
    M.save();
    updateThemeButton();
    renderApp(true);
  }

  function setAccent(accent) {
    M.state.profile.accent = accent;
    M.applyTheme();
    M.save();
    renderApp(true);
  }

  function toggleTheme() {
    const next = M.cycleTheme();
    updateThemeButton();
    renderApp(true);
    const resolved = document.documentElement.getAttribute("data-theme") || "light";
    M.toast(next === "system" ? "Following your system theme." : "Theme set to " + (resolved === "dark" ? "dark" : "light") + ".", {
      icon: resolved === "dark" ? "moon" : "sun",
    });
  }

  function exportData() {
    const payload = M.exportPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "morrow-backup-" + M.todayISO() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
    M.toast("Backup downloaded. Keep it somewhere safe.", { icon: "download" });
  }

  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      let payload;
      try {
        payload = JSON.parse(String(reader.result || "{}"));
      } catch (error) {
        M.toast("That file could not be read as a Morrow backup.", { icon: "info" });
        return;
      }
      const habitCount = payload && payload.data && Array.isArray(payload.data.habits) ? payload.data.habits.length : 0;
      openConfirm({
        title: "Replace your data?",
        message:
          "This backup contains " +
          habitCount +
          " habits. Importing will replace everything currently in Morrow on this device.",
        confirmLabel: "Import backup",
        cancelLabel: "Keep current data",
        icon: "upload",
        onConfirm: function () {
          try {
            M.importPayload(payload);
            M.applyTheme();
            M.ui.view = "today";
            M.ui.habitFilter = "all";
            M.ui.taskFilter = "all";
            try {
              history.replaceState(null, "", "#today");
            } catch (error) {
              /* ignore */
            }
            onboardingRoot.innerHTML = "";
            appShell.hidden = false;
            document.body.classList.remove("is-locked");
            renderApp(false);
            M.toast("Backup restored. Welcome back.", { icon: "check-circle" });
          } catch (error) {
            M.toast(error.message || "This file does not look like a Morrow backup.", { icon: "info" });
          }
        },
      });
    };
    reader.readAsText(file);
  }

  function resetApp() {
    openConfirm({
      title: "Start with a fresh page?",
      message:
        "This deletes every habit, task, focus session and preference on this device. Export a backup first if you might want them later.",
      confirmLabel: "Delete everything",
      cancelLabel: "Keep my space",
      icon: "trash",
      onConfirm: function () {
        try {
          localStorage.removeItem(M.STORAGE_KEY);
        } catch (error) {
          /* ignore */
        }
        stopTicker();
        M.state = M.defaultState();
        M.ui = {
          view: "today",
          habitFilter: "all",
          taskFilter: "all",
          onboardingStep: 0,
          onboardingDraft: null,
          commandFocus: 0,
          timerJustFinished: false,
        };
        M.applyTheme();
        showOnboarding();
        M.toast("A fresh page. Let's begin again.", { icon: "sparkles" });
      },
    });
  }

  /* ---------- Onboarding actions ---------- */

  function finishOnboardingStep() {
    if (M.ui.onboardingStep < 2) {
      M.ui.onboardingStep += 1;
      refreshOnboarding();
      return;
    }
    completeOnboarding();
  }

  /* ---------- Main action handler ---------- */

  function handleAction(action, el, event) {
    if (!action) return;
    const dataset = el && el.dataset ? el.dataset : {};

    switch (action) {
      case "command":
        openCommand();
        break;

      case "quick-add":
        openModal(M.quickAddModal(), { wide: false });
        break;

      case "close-modal":
        closeModal();
        break;

      case "confirm-modal": {
        const callback = pendingConfirm;
        pendingConfirm = null;
        closeModal();
        if (callback) callback();
        break;
      }

      case "toggle-theme":
        toggleTheme();
        break;

      case "set-theme":
        setTheme(dataset.themeValue);
        break;

      case "set-accent":
        setAccent(dataset.accentValue);
        break;

      case "start-focus":
        beginFocus();
        break;

      case "new-habit":
        openHabitModal(null);
        break;

      case "edit-habit": {
        const habit = findHabit(dataset.id);
        if (habit) openHabitModal(habit);
        break;
      }

      case "delete-habit":
        deleteHabit(dataset.id);
        break;

      case "archive-habit": {
        const habit = findHabit(dataset.id);
        if (!habit) break;
        habit.archived = !habit.archived;
        if (!habit.archived && M.ui.habitFilter === "archived") M.ui.habitFilter = "all";
        M.save();
        closeModal();
        renderApp(true);
        updateChrome();
        M.toast(
          habit.archived ? "Habit archived. Find it under Archived." : "Habit restored.",
          { icon: habit.archived ? "layers" : "rotate" }
        );
        break;
      }

      case "new-task":
        openTaskModal(null);
        break;

      case "edit-task": {
        const task = findTask(dataset.id);
        if (task) openTaskModal(task);
        break;
      }

      case "delete-task":
        deleteTask(dataset.id);
        break;

      case "toggle-task": {
        const task = findTask(dataset.id);
        if (!task) break;
        task.done = !task.done;
        task.completedAt = task.done ? new Date().toISOString() : null;
        M.save();
        renderApp(true);
        updateChrome();
        if (task.done) M.toast("One less thing.", { icon: "check-circle" });
        break;
      }

      case "task-filter":
        M.ui.taskFilter = dataset.filter || "all";
        renderApp(true);
        break;

      case "habit-filter":
        M.ui.habitFilter = dataset.filter || "all";
        renderApp(true);
        break;

      case "insight-range":
        M.ui.insightRange = Number(dataset.range) || 30;
        renderApp(true);
        break;

      case "toggle-habit": {
        const habit = findHabit(dataset.id);
        if (!habit) break;
        const iso = dataset.date || M.todayISO();
        const result = M.toggleHabitCount(habit, iso);
        const completion = M.habitCompletionForDate(iso);
        renderApp(true);
        updateChrome();
        if (result.completed && completion.total && completion.done === completion.total) {
          confetti(60);
          M.toast("Every habit kept today. Let it be enough.", { icon: "sparkles" });
        }
        break;
      }

      case "toggle-habit-day": {
        const habit = findHabit(dataset.id);
        if (!habit) break;
        M.toggleHabitCount(habit, dataset.date);
        renderApp(true);
        updateChrome();
        break;
      }

      case "toggle-schedule-day": {
        const form = el.closest('[data-form="habit"]');
        if (!form) break;
        const active = el.classList.toggle("is-active");
        el.setAttribute("aria-pressed", active ? "true" : "false");
        const input = form.querySelector("[data-habit-schedule-input]");
        if (input) {
          const values = Array.prototype.slice
            .call(form.querySelectorAll("[data-day-picker] .day-choice.is-active"))
            .map(function (button) {
              return Number(button.getAttribute("data-day"));
            })
            .sort(function (a, b) {
              return a - b;
            });
          input.value = values.join(",");
        }
        updateHabitPreview();
        break;
      }

      case "step-target": {
        const form = el.closest('[data-form="habit"]');
        if (!form) break;
        const output = form.querySelector("[data-target-output]");
        const input = form.querySelector("[data-habit-target-input]");
        if (!output || !input) break;
        const delta = Number(dataset.delta) || 0;
        const next = clamp((Number(output.textContent) || 1) + delta, 1, 20);
        output.textContent = String(next);
        input.value = String(next);
        updateHabitPreview();
        break;
      }

      case "choose-habit-icon": {
        const form = el.closest('[data-form="habit"]');
        if (!form) break;
        form.querySelectorAll("[data-icon-picker] .icon-choice").forEach(function (button) {
          button.classList.toggle("is-active", button === el);
        });
        const input = form.querySelector("[data-habit-icon-input]");
        if (input) input.value = dataset.iconName;
        const preview = form.querySelector("[data-habit-preview-icon]");
        if (preview) preview.innerHTML = icon(dataset.iconName, 18);
        break;
      }

      case "choose-habit-color": {
        const form = el.closest('[data-form="habit"]');
        if (!form) break;
        form.querySelectorAll("[data-color-picker] .color-choice").forEach(function (button) {
          button.classList.toggle("is-active", button === el);
        });
        const input = form.querySelector("[data-habit-color-input]");
        if (input) input.value = dataset.color;
        const preview = form.querySelector("[data-habit-preview-icon]");
        if (preview) preview.style.setProperty("--tint", dataset.color);
        break;
      }

      case "timer-toggle": {
        const timer = M.state.timer;
        if (timer.running) {
          pauseTimer();
        } else {
          startTimer();
          M.toast(
            (timer.mode === "break" ? "Break started" : "Focus started") + " · " + Math.round(timer.duration / 60) + " minutes.",
            { icon: timer.mode === "break" ? "coffee" : "play" }
          );
        }
        renderApp(true);
        break;
      }

      case "timer-reset":
        resetTimer(true);
        renderApp(true);
        break;

      case "timer-preset": {
        const timer = M.state.timer;
        const minutes = clamp(Number(dataset.minutes) || 25, 1, 600);
        timer.duration = minutes * 60;
        timer.remaining = timer.duration;
        timer.running = false;
        timer.endsAt = null;
        timer.startedAt = null;
        timer.completedAt = null;
        M.save();
        stopTicker();
        renderApp(true);
        M.toast("Timer set to " + minutes + " minutes.", { icon: "timer" });
        break;
      }

      case "timer-mode": {
        const mode = dataset.mode === "break" ? "break" : "focus";
        const timer = M.state.timer;
        timer.mode = mode;
        timer.duration = mode === "break" ? 5 * 60 : Math.max(5, Number(M.state.profile.defaultFocus) || 25) * 60;
        timer.remaining = timer.duration;
        timer.running = false;
        timer.endsAt = null;
        timer.startedAt = null;
        timer.completedAt = null;
        M.save();
        stopTicker();
        renderApp(true);
        break;
      }

      case "log-session":
        openModal(M.sessionModal(), { wide: false });
        break;

      case "manual-duration": {
        const minutes = clamp(Number(dataset.minutes) || 25, 1, 600);
        if (modalPanel) {
          modalPanel.querySelectorAll(".manual-duration").forEach(function (button) {
            button.classList.toggle("is-active", Number(button.getAttribute("data-minutes")) === minutes);
          });
          const input = modalPanel.querySelector("[data-session-minutes]");
          if (input) input.value = String(minutes);
        }
        break;
      }

      case "delete-session": {
        const session = M.state.sessions.find(function (item) {
          return item.id === dataset.id;
        });
        if (!session) break;
        openConfirm({
          title: "Delete this session?",
          message: M.formatDuration(session.seconds) + " of " + (session.subject || "General") + " focus will be removed from your history.",
          confirmLabel: "Delete session",
          icon: "trash",
          onConfirm: function () {
            M.state.sessions = M.state.sessions.filter(function (item) {
              return item.id !== dataset.id;
            });
            M.save();
            renderApp(true);
            updateChrome();
            M.toast("Focus session removed.", { icon: "clock" });
          },
        });
        break;
      }

      case "clear-done": {
        const done = M.state.tasks.filter(function (task) {
          return task.done;
        });
        if (!done.length) {
          M.toast("Nothing completed to clear yet.", { icon: "check-square" });
          break;
        }
        openConfirm({
          title: "Clear completed tasks?",
          message: "This removes " + done.length + " finished task" + (done.length === 1 ? "" : "s") + " from your planner.",
          confirmLabel: "Clear completed",
          icon: "trash",
          onConfirm: function () {
            M.state.tasks = M.state.tasks.filter(function (task) {
              return !task.done;
            });
            M.save();
            renderApp(true);
            updateChrome();
            M.toast("Completed tasks cleared.", { icon: "check-circle" });
          },
        });
        break;
      }

      case "export-data":
        exportData();
        break;

      case "import-data":
        if (fileInput) {
          fileInput.value = "";
          fileInput.click();
        }
        break;

      case "reset-app":
        resetApp();
        break;

      case "install-app": {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.finally(function () {
            deferredPrompt = null;
          });
        } else {
          M.toast("Use your browser menu and choose “Install app” or “Add to Home Screen”.", { icon: "smartphone", duration: 6000 });
        }
        break;
      }

      case "run-command":
        runCommand(dataset.command);
        break;

      case "onboarding-role": {
        const draft = M.onboardingDraft();
        draft.role = dataset.role || "personal";
        refreshOnboarding();
        break;
      }

      case "onboarding-interest": {
        const draft = M.onboardingDraft();
        const id = dataset.interest;
        if (!id) break;
        const index = draft.interests.indexOf(id);
        if (index !== -1) {
          draft.interests.splice(index, 1);
        } else if (draft.interests.length >= 6) {
          M.toast("Six interests is plenty to begin with.", { icon: "sparkles" });
          break;
        } else {
          draft.interests.push(id);
        }
        refreshOnboarding();
        break;
      }

      case "toggle-seed": {
        const draft = M.onboardingDraft();
        draft.seed = !draft.seed;
        el.setAttribute("aria-checked", draft.seed ? "true" : "false");
        break;
      }

      case "onboarding-next":
        finishOnboardingStep();
        break;

      case "onboarding-back":
        M.ui.onboardingStep = Math.max(0, (M.ui.onboardingStep || 0) - 1);
        refreshOnboarding();
        break;

      case "onboarding-skip": {
        const draft = M.onboardingDraft();
        if (!draft.name) draft.name = "Friend";
        if (!draft.interests.length) draft.interests = ["study", "reading", "fitness"];
        draft.seed = true;
        completeOnboarding();
        break;
      }

      default:
        break;
    }
  }

  /* ---------- Form submissions ---------- */

  function handleSubmit(event) {
    const form = event.target;
    if (!form || !form.getAttribute) return;
    const kind = form.getAttribute("data-form");
    if (!kind) return;
    event.preventDefault();
    const data = new FormData(form);

    if (kind === "habit") {
      const schedule = String(data.get("schedule") || "")
        .split(",")
        .filter(function (part) { return part !== ""; })
        .map(Number)
        .sort(function (a, b) { return a - b; });
      if (!schedule.length) {
        M.toast("Choose at least one day for this habit.", { icon: "calendar" });
        return;
      }
      const name = String(data.get("name") || "").trim();
      if (!name) {
        M.toast("Give the habit a name first.", { icon: "info" });
        return;
      }
      const payload = {
        name: name,
        icon: data.get("icon") || "sparkles",
        color: data.get("color") || "#8b7cf6",
        schedule: schedule,
        target: clamp(Number(data.get("target")) || 1, 1, 20),
      };
      const id = form.getAttribute("data-id");
      if (id) {
        const habit = findHabit(id);
        if (habit) {
          habit.name = payload.name;
          habit.icon = payload.icon;
          habit.color = payload.color;
          habit.schedule = payload.schedule;
          habit.target = payload.target;
        }
      } else {
        const habit = M.createHabit(payload);
        habit.createdAt = new Date().toISOString();
        M.state.habits.push(habit);
      }
      M.save();
      closeModal();
      renderApp(true);
      updateChrome();
      M.toast(id ? "Habit updated." : "A new habit, planted.", { icon: "sparkles" });
      return;
    }

    if (kind === "task") {
      const title = String(data.get("title") || "").trim();
      if (!title) {
        M.toast("A task needs a title.", { icon: "info" });
        return;
      }
      const payload = {
        title: title,
        notes: String(data.get("notes") || "").trim(),
        due: String(data.get("due") || "") || M.todayISO(),
        priority: String(data.get("priority") || "medium"),
        tag: String(data.get("tag") || "Personal"),
      };
      const id = form.getAttribute("data-id");
      if (id) {
        const task = findTask(id);
        if (task) {
          task.title = payload.title;
          task.notes = payload.notes;
          task.due = payload.due;
          task.priority = payload.priority;
          task.tag = payload.tag;
        }
      } else {
        M.state.tasks.push(M.createTask(payload));
        if (M.ui.taskFilter === "done") M.ui.taskFilter = "all";
      }
      M.save();
      closeModal();
      renderApp(true);
      updateChrome();
      M.toast(id ? "Task updated." : "Task added.", { icon: "check-square" });
      return;
    }

    if (kind === "session") {
      const minutes = Number(data.get("minutes"));
      if (!minutes || minutes < 1 || minutes > 600) {
        M.toast("Choose a duration between 1 and 600 minutes.", { icon: "clock" });
        return;
      }
      M.addFocusSession({
        seconds: Math.round(minutes * 60),
        subject: String(data.get("subject") || "General"),
        source: "manual",
      });
      closeModal();
      renderApp(true);
      updateChrome();
      M.toast(M.formatDuration(minutes * 60) + " of focus logged.", { icon: "check-circle" });
      return;
    }

    if (kind === "profile") {
      const profile = M.state.profile;
      profile.name = String(data.get("name") || "").trim() || "Friend";
      profile.role = String(data.get("role") || "personal");
      profile.focusGoal = clamp(Number(data.get("focusGoal")) || 120, 15, 480);
      profile.weekStart = Number(data.get("weekStart")) === 0 ? 0 : 1;
      profile.defaultFocus = clamp(Number(data.get("defaultFocus")) || 25, 5, 180);
      M.save();
      renderApp(true);
      updateChrome();
      M.toast("Profile saved.", { icon: "check" });
      return;
    }

    if (kind === "quick-task") {
      addQuickTask(data.get("title"), form);
    }
  }

  /* ---------- Global events ---------- */

  function handleClick(event) {
    const viewTarget = event.target.closest("[data-view]");
    if (viewTarget) {
      event.preventDefault();
      navigate(viewTarget.getAttribute("data-view"));
      return;
    }

    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.getAttribute("data-action");

    if (action !== "close-modal" && action !== "confirm-modal" && action !== "run-command" && action !== "manual-duration") {
      if (actionTarget.disabled) return;
    }
    handleAction(action, actionTarget, event);
  }

  function handleInput(event) {
    const target = event.target;
    if (!target) return;

    if (target.matches('[data-onboarding-field="name"]')) {
      const draft = M.onboardingDraft();
      draft.name = target.value;
      const avatar = onboardingRoot.querySelector("[data-onboarding-avatar]");
      if (avatar) avatar.textContent = M.initials(target.value || "M");
      return;
    }

    if (target.matches('[data-onboarding-field="focusGoal"]')) {
      const draft = M.onboardingDraft();
      draft.focusGoal = clamp(Number(target.value) || 120, 15, 300);
      const valueEl = onboardingRoot.querySelector("[data-onboarding-goal-value]");
      if (valueEl) valueEl.innerHTML = draft.focusGoal + " <span>min / day</span>";
      const caption = onboardingRoot.querySelector("[data-onboarding-goal-caption]");
      if (caption) {
        caption.textContent =
          draft.focusGoal <= 60 ? "A light touch" : draft.focusGoal <= 120 ? "A steady rhythm" : "An ambitious season";
      }
      const min = Number(target.min) || 15;
      const max = Number(target.max) || 300;
      target.style.setProperty("--range-progress", ((draft.focusGoal - min) / (max - min)) * 100 + "%");
      return;
    }

    if (target.matches("[data-command-input]")) {
      filterCommand(target.value);
      return;
    }

    if (target.matches("[data-session-minutes]")) {
      const minutes = Number(target.value);
      if (modalPanel) {
        modalPanel.querySelectorAll(".manual-duration").forEach(function (button) {
          button.classList.toggle("is-active", Number(button.getAttribute("data-minutes")) === minutes);
        });
      }
      return;
    }

    if (target.matches('[data-form="habit"] [name="name"]')) {
      updateHabitPreview();
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (!target || !target.matches) return;

    if (target.matches('[data-field="timer-subject"]') || target.matches('[data-field="focus-subject"]')) {
      M.state.timer.subject = target.value || "General";
      M.save();
      renderApp(true);
      M.toast("Focus subject set to " + M.state.timer.subject + ".", { icon: "target" });
      return;
    }

    if (target.matches("#importFile")) {
      const file = target.files && target.files[0];
      handleImportFile(file);
    }
  }

  function handleKeydown(event) {
    const commandInput = document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-command-input]");

    if (isModalOpen() && commandInput) {
      const items = modalPanel ? modalPanel.querySelectorAll("#commandList .command-item") : [];
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCommandFocus((M.ui.commandFocus || 0) + 1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCommandFocus((M.ui.commandFocus || 0) - 1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const active = items[M.ui.commandFocus || 0];
        if (active) {
          const id = active.getAttribute("data-command");
          runCommand(id);
        }
        return;
      }
    }

    if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === "k") {
      if (!M.state.profile.onboarded) return;
      event.preventDefault();
      if (isModalOpen()) closeModal();
      window.setTimeout(openCommand, 30);
      return;
    }

    if (!M.state.profile.onboarded || isModalOpen() || isTyping()) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = String(event.key).toLowerCase();
    if (key === "t") {
      event.preventDefault();
      openTaskModal(null);
    } else if (key === "h") {
      event.preventDefault();
      openHabitModal(null);
    } else if (key === "d") {
      event.preventDefault();
      toggleTheme();
    } else if (key === " " && (M.ui.view === "focus" || M.ui.view === "today")) {
      event.preventDefault();
      handleAction("timer-toggle", { dataset: {} }, null);
    } else if (key === "r" && M.ui.view === "focus") {
      event.preventDefault();
      handleAction("timer-reset", { dataset: {} }, null);
    }
  }

  function setupConnectivity() {
    const pill = document.getElementById("offlinePill");
    const sync = function () {
      if (pill) pill.hidden = Boolean(navigator.onLine);
    };
    window.addEventListener("online", function () {
      sync();
      M.toast("Back online. Everything is still local.", { icon: "wifi-off" });
    });
    window.addEventListener("offline", function () {
      sync();
      M.toast("You're offline. Morrow still works.", { icon: "wifi-off" });
    });
    sync();
  }

  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredPrompt = event;
    });
    window.addEventListener("appinstalled", function () {
      deferredPrompt = null;
      M.toast("Morrow installed. It is yours now.", { icon: "smartphone" });
    });
  }

  function setupServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    navigator.serviceWorker.register("sw.js").catch(function (error) {
      console.warn("Morrow service worker could not register.", error);
    });
  }

  /* ---------- Boot ---------- */

  function boot() {
    if (hasStarted) return;
    hasStarted = true;

    appShell = document.getElementById("appShell");
    mainContent = document.getElementById("mainContent");
    modal = document.getElementById("modal");
    modalPanel = document.getElementById("modalPanel");
    onboardingRoot = document.getElementById("onboardingRoot");
    toastStack = document.getElementById("toastStack");
    themeButton = document.querySelector(".theme-btn");
    fileInput = document.getElementById("importFile");

    hydrateShellIcons();
    M.applyTheme();

    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal();
      });
      modal.addEventListener("close", function () {
        if (modalPanel) modalPanel.innerHTML = "";
        pendingConfirm = null;
        if (!onboardingRoot || !onboardingRoot.firstElementChild) document.body.classList.remove("is-locked");
        if (M.ui.timerJustFinished) {
          M.ui.timerJustFinished = false;
          if (M.state.profile.onboarded) renderApp(true);
        }
      });
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);

    if (fileInput) {
      fileInput.addEventListener("change", function (event) {
        const file = event.target.files && event.target.files[0];
        handleImportFile(file);
        fileInput.value = "";
      });
    }

    window.addEventListener("hashchange", function () {
      if (!M.state.profile.onboarded) return;
      const view = location.hash.replace(/^#/, "");
      if (VIEWS.indexOf(view) !== -1 && view !== M.ui.view) {
        M.ui.view = view;
        renderApp(false);
      }
    });

    window.addEventListener("resize", function () {
      /* The canvas resizes only when confetti is active, which avoids idle work. */
    });

    /* Every change to the file input is already delegated; keep the ref for later renders. */
    const observer = new MutationObserver(function () {
      fileInput = document.getElementById("importFile");
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setupConnectivity();
    setupInstallPrompt();
    setupServiceWorker();

    if (!M.state.profile.onboarded) {
      showOnboarding();
      return;
    }

    const hash = location.hash.replace(/^#/, "");
    M.ui.view = VIEWS.indexOf(hash) !== -1 ? hash : "today";
    M.state.meta.lastOpen = new Date().toISOString();
    M.save();

    renderApp(false);

    const timer = M.state.timer;
    if (timer.running) {
      if (currentTimerRemaining() <= 0) {
        finishTimer();
      } else {
        startTicker();
        updateTimerDom();
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
