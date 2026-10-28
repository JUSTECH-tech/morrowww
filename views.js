/* =========================================================
   Morrow — view renderers
   All views are plain HTML strings rendered into #mainContent.
   ========================================================= */

(function () {
  "use strict";

  const M = window.M;
  const icon = M.icon;
  const esc = M.escape;
  const today = function () {
    return M.todayISO();
  };

  /* ---------- Shared little components ---------- */

  M.timerRemaining = function () {
    const timer = M.state.timer;
    if (timer.running && timer.endsAt) {
      return Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
    }
    return Math.max(0, Math.round(Number(timer.remaining) || 0));
  };

  M.timerElapsedPercent = function () {
    const timer = M.state.timer;
    const duration = Number(timer.duration) || 1;
    const remaining = M.timerRemaining();
    return M.clamp(Math.round(((duration - remaining) / duration) * 100), 0, 100);
  };

  function formatClock(seconds) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));
    return M.pad(Math.floor(value / 60)) + ":" + M.pad(value % 60);
  }

  function ringSvg(percent, className, strokeWidth) {
    const clamped = M.clamp(Number(percent) || 0, 0, 100);
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const dash = (circumference * clamped) / 100;
    return (
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<circle class="' +
      (className === "focus-ring" ? "focus-ring-track" : className === "mini-timer-ring" ? "ring-track" : "ring-track") +
      '" cx="50" cy="50" r="' +
      radius +
      '"' +
      (strokeWidth ? ' style="stroke-width:' + strokeWidth + '"' : "") +
      "></circle>" +
      '<circle class="' +
      (className === "focus-ring" ? "focus-ring-progress" : className === "mini-timer-ring" ? "ring-fill" : "ring-fill") +
      '" cx="50" cy="50" r="' +
      radius +
      '" stroke-dasharray="' +
      circumference.toFixed(2) +
      '" stroke-dashoffset="' +
      (circumference - dash).toFixed(2) +
      '"' +
      (strokeWidth ? ' style="stroke-width:' + strokeWidth + '"' : "") +
      "></circle>" +
      "</svg>"
    );
  }

  function tint(iconName, color, size) {
    return (
      '<span class="tint-box" style="--tint:' +
      color +
      '">' +
      icon(iconName, size || 18) +
      "</span>"
    );
  }

  function tagPill(name) {
    return (
      '<span class="tag" style="--tag-color:' +
      M.tagColor(name) +
      '"><span class="tag-dot"></span>' +
      esc(name) +
      "</span>"
    );
  }

  function subjectPill(name) {
    return (
      '<span class="tag" style="--tag-color:' +
      M.subjectColor(name) +
      '"><span class="tag-dot"></span>' +
      esc(name) +
      "</span>"
    );
  }

  function emptyState(iconName, title, copy, action) {
    return (
      '<div class="empty-state">' +
      '<span class="empty-orb">' +
      icon(iconName, 21) +
      "</span>" +
      '<p class="empty-title">' +
      esc(title) +
      "</p>" +
      '<p class="empty-copy">' +
      esc(copy) +
      "</p>" +
      (action || "") +
      "</div>"
    );
  }

  function pageIntro(eyebrow, title, subtitle, actions) {
    return (
      '<header class="page-intro">' +
      '<div class="page-intro-main">' +
      '<p class="eyebrow">' +
      eyebrow +
      "</p>" +
      '<h1 class="page-title">' +
      title +
      "</h1>" +
      (subtitle ? '<p class="page-subtitle">' + subtitle + "</p>" : "") +
      "</div>" +
      (actions ? '<div class="page-actions">' + actions + "</div>" : "") +
      "</header>"
    );
  }

  function taskCheck(task, extraClass) {
    return (
      '<button class="task-check ' +
      (task.done ? "is-complete " : "") +
      (extraClass || "") +
      '" type="button" data-action="toggle-task" data-id="' +
      task.id +
      '" aria-label="' +
      (task.done ? "Mark task incomplete" : "Complete task") +
      '" aria-pressed="' +
      (task.done ? "true" : "false") +
      '">' +
      icon("check", 11) +
      "</button>"
    );
  }

  function habitToggle(habit, iso) {
    const count = M.habitCount(habit, iso);
    const target = Number(habit.target) || 1;
    const done = count >= target;
    const partial = count > 0 && !done;
    let content = icon("check", 15);
    if (target > 1) {
      content = '<span class="habit-toggle-count">' + count + "<small>/" + target + "</small></span>";
    }
    const label = done
      ? "Undo " + habit.name
      : target > 1
        ? count + "/" + target + " — Complete " + habit.name
        : "Complete " + habit.name;
    return (
      '<button class="habit-toggle ' +
      (done ? "is-complete " : "") +
      (partial ? "is-partial " : "") +
      '" type="button" data-action="toggle-habit" data-id="' +
      habit.id +
      '" data-date="' +
      iso +
      '" aria-label="' +
      esc(label) +
      '" aria-pressed="' +
      (done ? "true" : "false") +
      '">' +
      (done ? icon("check", 15) : content) +
      "</button>"
    );
  }

  function miniTaskRow(task) {
    const due = M.dueLabel(task.due);
    return (
      '<div class="mini-task-row ' +
      (task.done ? "is-done" : "") +
      '">' +
      taskCheck(task) +
      '<div class="mini-task-copy">' +
      '<span class="mini-task-title">' +
      esc(task.title) +
      "</span>" +
      (task.notes ? '<p class="mini-task-notes">' + esc(task.notes) + "</p>" : "") +
      '<div class="mini-task-meta">' +
      '<span class="mini-task-due ' +
      due.cls +
      '">' +
      icon("calendar", 9) +
      esc(due.text) +
      "</span>" +
      tagPill(task.tag) +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function sessionRow(session) {
    const when = new Date(session.endedAt || session.startedAt);
    return (
      '<div class="session-row">' +
      '<span class="session-subject-dot" style="--session-color:' +
      M.subjectColor(session.subject) +
      '"></span>' +
      '<div class="session-copy">' +
      '<span class="session-subject">' +
      esc(session.subject || "General") +
      "</span>" +
      '<span class="session-meta">' +
      esc(M.formatTime(when)) +
      " · " +
      esc(M.timeAgo(when.getTime())) +
      "</span>" +
      "</div>" +
      '<span class="session-duration">' +
      M.formatDuration(session.seconds) +
      "</span>" +
      '<button class="session-delete" type="button" data-action="delete-session" data-id="' +
      session.id +
      '" aria-label="Delete session">' +
      icon("trash", 12) +
      "</button>" +
      "</div>"
    );
  }

  function weekBarsForFocus() {
    const days = M.getWeekDays(today());
    const values = days.map(function (iso) {
      return M.focusSecondsOn(iso) / 60;
    });
    const max = Math.max.apply(null, values.concat([25]));
    return days
      .map(function (iso, index) {
        const value = values[index];
        const height = value > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
        return (
          '<div class="focus-bar ' +
          (M.isToday(iso) ? "is-today " : "") +
          (value <= 0 ? "is-empty" : "") +
          '" title="' +
          esc(M.formatDate(iso, "long") + " · " + M.formatDuration(value * 60)) +
          '">' +
          '<span class="focus-bar-track"><span class="focus-bar-fill" style="height:' +
          height +
          '%"></span></span>' +
          "<span>" +
          M.DAYS[M.dayIndex(iso)][0] +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function heatLevel(iso) {
    const habits = M.habitCompletionForDate(iso);
    const focus = M.focusSecondsOn(iso);
    if (!habits.total && !focus) return 0;
    const habitPart = habits.total ? habits.done / habits.total : 0;
    const focusPart = Math.min(1, focus / (Math.max(15, Number(M.state.profile.focusGoal) || 120) * 60));
    const score = Math.max(habitPart, focusPart);
    if (score >= 0.9) return 4;
    if (score >= 0.6) return 3;
    if (score >= 0.3) return 2;
    return 1;
  }

  function heatmapMarkup() {
    const end = today();
    const start = M.addDays(M.startOfWeek(end), -14 * 7);
    const cells = [];
    const labels = [];
    let monthTracker = "";
    let activeDays = 0;
    for (let i = 0; i < 15 * 7; i += 1) {
      const iso = M.addDays(start, i);
      const level = M.isFuture(iso) ? 0 : heatLevel(iso);
      if (level) activeDays += 1;
      cells.push(
        '<span class="heat-cell ' +
          (level ? "level-" + level : "") +
          (M.isToday(iso) ? " is-today" : "") +
          '" title="' +
          esc(M.formatDate(iso, "full") + " · " + (level ? "Activity logged" : "No activity")) +
          '"></span>'
      );
      if (i % 7 === 0) {
        const month = M.MONTHS[M.parseISO(iso).getMonth()].slice(0, 3);
        if (month !== monthTracker) {
          labels.push(month);
          monthTracker = month;
        } else {
          labels.push("");
        }
      }
    }
    return (
      '<div class="heatmap-months" aria-hidden="true">' +
      labels
        .slice(0, 15)
        .map(function (label) {
          return "<span>" + esc(label) + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="heatmap-wrap" role="img" aria-label="Habit and focus activity over the last 15 weeks: ' +
      activeDays +
      " active day" +
      (activeDays === 1 ? "" : "s") +
      '.">' +
      '<div class="heatmap-days"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>' +
      '<div class="heatmap-grid">' +
      cells.join("") +
      "</div>" +
      "</div>"
    );
  }

  function focusSubjectOptions(selected) {
    return M.SUBJECTS.map(function (subject) {
      return (
        '<option value="' +
        esc(subject.name) +
        '"' +
        (subject.name === selected ? " selected" : "") +
        ">" +
        esc(subject.name) +
        "</option>"
      );
    }).join("");
  }

  function timerPresets(mode, duration) {
    const values = mode === "break" ? [5, 10, 15] : [15, 25, 50, 90];
    return values
      .map(function (minutes) {
        return (
          '<button class="timer-preset ' +
          (duration === minutes * 60 ? "is-active" : "") +
          '" type="button" data-action="timer-preset" data-minutes="' +
          minutes +
          '">' +
          minutes +
          "m</button>"
        );
      })
      .join("");
  }

  function focusPresets(mode, duration) {
    const values = mode === "break" ? [5, 10, 15] : [15, 25, 50, 90];
    return values
      .map(function (minutes) {
        return (
          '<button class="focus-preset ' +
          (duration === minutes * 60 ? "is-active" : "") +
          '" type="button" data-action="timer-preset" data-minutes="' +
          minutes +
          '">' +
          minutes +
          " min</button>"
        );
      })
      .join("");
  }

  function roleLabel(id) {
    const role = M.ROLES.find(function (item) {
      return item.id === id;
    });
    return role ? role.label : "Your personal space";
  }

  M.roleLabel = roleLabel;
  M.formatClock = formatClock;

  /* =========================================================
     Today
     ========================================================= */

  function renderToday() {
    const iso = today();
    const name = M.firstName(M.state.profile.name);
    const completion = M.habitCompletionForDate(iso);
    const habits = M.habitsForDate(iso);
    const tasks = M.upNextTasks(4);
    const taskStats = M.taskStats();
    const focusSeconds = M.todayFocusSeconds();
    const streak = M.bestCurrentStreak();
    const headline = M.dayHeadline();
    const timer = M.state.timer;
    const remaining = M.timerRemaining();
    const elapsed = M.timerElapsedPercent();
    const quote = M.quoteForToday();
    const weekFocus = M.weekFocusSeconds();

    const habitRows = habits.length
      ? habits
          .map(function (habit) {
            const done = M.isHabitDone(habit, iso);
            const count = M.habitCount(habit, iso);
            const target = Number(habit.target) || 1;
            const streakCount = M.habitStreak(habit);
            const dots =
              target > 1
                ? '<span class="habit-target">' +
                  Array.from({ length: target }, function (_, index) {
                    return '<i class="' + (index < count ? "on" : "") + '"></i>';
                  }).join("") +
                  "</span>"
                : "";
            return (
              '<div class="habit-row ' +
              (done ? "is-done" : "") +
              '">' +
              tint(habit.icon, habit.color, 17) +
              '<div class="habit-row-copy">' +
              '<div class="habit-row-title-line"><span class="habit-row-title">' +
              esc(habit.name) +
              "</span></div>" +
              '<div class="habit-row-meta">' +
              (streakCount
                ? '<span class="streak-inline">' + icon("flame", 10) + streakCount + " day" + (streakCount === 1 ? "" : "s") + "</span>" + '<span class="meta-divider"></span>'
                : "") +
              "<span>" +
              esc(M.habitTargetLabel(habit)) +
              "</span>" +
              dots +
              "</div>" +
              "</div>" +
              habitToggle(habit, iso) +
              "</div>"
            );
          })
          .join("")
      : emptyState(
          "repeat",
          "A fresh start",
          "Add your first habit and it will appear here each day it is scheduled.",
          '<button class="btn btn-dark btn-sm" style="margin-top:8px" type="button" data-action="new-habit">' +
            icon("plus", 14) +
            "Add a habit</button>"
        );

    const taskList = tasks.length
      ? tasks.map(miniTaskRow).join("")
      : '<p class="session-empty">Nothing waiting. Add a task below when something comes up.</p>';

    const weekDays = M.getWeekDays(iso);

    return (
      '<section class="page-view" data-page="today">' +
      pageIntro(
        M.formatDate(iso, "long"),
        M.greeting() + ", <span class=\"title-accent\">" + esc(name) + ".</span>",
        "A quiet place to keep the promises you make to yourself.",
        '<button class="btn btn-light" type="button" data-action="new-task">' +
          icon("plus", 15) +
          "Add task</button>" +
          '<button class="btn btn-dark" type="button" data-view="focus">' +
          icon("timer", 15) +
          "Start focusing</button>"
      ) +

      '<div class="dashboard-layout">' +
      '<div class="dashboard-main">' +

      /* Hero */
      '<section class="hero-card">' +
      '<span class="hero-orbit" aria-hidden="true"></span>' +
      '<div class="hero-inner">' +
      '<div class="hero-copy">' +
      '<span class="hero-streak">' +
      icon("flame", 12) +
      (streak ? "<strong>" + streak + "-day</strong> current rhythm" : "Your <strong>first</strong> day") +
      "</span>" +
      '<h2 class="hero-title">' +
      esc(headline.lead) +
      "<br><em>" +
      esc(headline.accent) +
      "</em></h2>" +
      '<p class="hero-copy-text">' +
      (completion.total
        ? "You have kept " +
          completion.done +
          " of " +
          completion.total +
          " habits today. " +
          (focusSeconds > 0 ? M.formatDuration(focusSeconds) + " of focus already logged." : "A focus session is a good next step.")
        : "Nothing is scheduled for today. Add a habit or use the time for a little deep work.") +
      "</p>" +
      '<div class="hero-stats">' +
      '<span class="hero-stat">' +
      icon("check-circle", 13) +
      "<strong>" +
      completion.done +
      "/" +
      completion.total +
      "</strong> habits</span>" +
      '<span class="hero-stat">' +
      icon("timer", 13) +
      "<strong>" +
      escapeHTML(M.formatDuration(focusSeconds)) +
      "</strong> focused</span>" +
      '<span class="hero-stat">' +
      icon("check-square", 13) +
      "<strong>" +
      taskStats.dueToday +
      "</strong> due today</span>" +
      "</div>" +
      '<div class="hero-actions">' +
      '<button class="btn btn-accent" type="button" data-action="start-focus">' +
      icon("play", 15) +
      "Start a focus session</button>" +
      '<button class="btn btn-outline-dark" type="button" data-view="planner">' +
      icon("check-square", 15) +
      "Open planner</button>" +
      "</div>" +
      "</div>" +
      '<div class="hero-progress">' +
      '<div class="hero-ring">' +
      ringSvg(completion.percent, "hero-ring") +
      '<div class="hero-ring-center"><span class="hero-ring-value">' +
      completion.percent +
      '%</span><span class="hero-ring-label">Today</span></div>' +
      "</div>" +
      '<span class="hero-progress-copy">' +
      (completion.total
        ? completion.done + " of " + completion.total + " habits complete"
        : "No habits scheduled") +
      "</span>" +
      "</div>" +
      "</div>" +
      "</section>" +

      /* Weekly rhythm */
      '<section class="card week-card">' +
      '<div class="card-head">' +
      '<div class="card-heading"><h2 class="card-title">Weekly rhythm</h2><p class="card-sub">How your habits have moved through the week</p></div>' +
      '<button class="link-btn" type="button" data-view="insights">See insights' +
      icon("arrow-right", 13) +
      "</button></div>" +
      '<div class="week-grid">' +
      weekDays
        .map(function (dayISO) {
          const dayCompletion = M.habitCompletionForDate(dayISO);
          const isFuture = M.isFuture(dayISO);
          return (
            '<div class="week-day ' +
            (M.isToday(dayISO) ? "is-today " : "") +
            (dayCompletion.total === 0 ? "is-empty" : "") +
            '" title="' +
            esc(M.formatDate(dayISO, "long")) +
            '">' +
            '<span class="week-day-name">' +
            M.DAYS[M.dayIndex(dayISO)].slice(0, 3) +
            "</span>" +
            '<span class="week-day-num">' +
            M.parseISO(dayISO).getDate() +
            "</span>" +
            '<span class="week-day-track"><span class="week-day-fill" style="height:' +
            (isFuture ? 0 : Math.max(3, dayCompletion.percent)) +
            '%"></span></span>' +
            '<span class="week-day-score">' +
            (isFuture ? "—" : dayCompletion.total ? dayCompletion.done + "/" + dayCompletion.total : "—") +
            "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="week-focus-note">' +
      icon("timer", 13) +
      "<span>You've focused <strong>" +
      escapeHTML(M.formatDuration(weekFocus)) +
      "</strong> this week. Every small block counts.</span>" +
      "</div>" +
      "</section>" +

      /* Habits today */
      '<section class="card habits-card">' +
      '<div class="card-head">' +
      '<div class="card-heading"><h2 class="card-title">Today\'s habits</h2><p class="card-sub">' +
      (completion.total ? completion.done + " of " + completion.total + " complete" : "Nothing scheduled for today") +
      "</p></div>" +
      '<button class="link-btn" type="button" data-view="habits">All habits' +
      icon("arrow-right", 13) +
      "</button></div>" +
      habitRows +
      "</section>" +
      "</div>" +

      /* Side */
      '<aside class="dashboard-side">' +

      /* Focus timer */
      '<section class="timer-card" data-timer-card>' +
      '<div class="timer-head">' +
      '<h2 class="card-title">' +
      icon("timer", 15) +
      "Focus room</h2>" +
      (timer.running ? '<span class="timer-live-badge">Live</span>' : '<span class="badge">Ready</span>') +
      "</div>" +
      '<div class="timer-center">' +
      '<div class="mini-timer-ring">' +
      ringSvg(elapsed, "mini-timer-ring") +
      '<div class="mini-timer-center"><span class="timer-mini-time" data-timer-mini-time>' +
      formatClock(remaining) +
      '</span><span class="timer-mini-mode" data-timer-mini-mode>' +
      (timer.mode === "break" ? "Break" : "Focus") +
      "</span></div>" +
      "</div>" +
      '<div class="timer-mini-side">' +
      '<span class="eyebrow">Today\'s focus</span>' +
      '<span class="timer-mini-goal">' +
      escapeHTML(M.formatDuration(focusSeconds)) +
      " <span>of " +
      escapeHTML(M.formatDuration((Number(M.state.profile.focusGoal) || 120) * 60)) +
      "</span></span>" +
      '<span class="timer-goal-bar"><span style="width:' +
      M.focusGoalPercent() +
      '%"></span></span>' +
      '<span class="timer-mini-sessions">' +
      M.sessionsTodayCount() +
      " session" +
      (M.sessionsTodayCount() === 1 ? "" : "s") +
      " today</span>" +
      "</div>" +
      "</div>" +
      '<select class="select timer-subject" data-field="timer-subject" aria-label="Focus subject">' +
      focusSubjectOptions(timer.subject) +
      "</select>" +
      '<div class="timer-presets">' +
      timerPresets(timer.mode, timer.duration) +
      "</div>" +
      '<button class="btn btn-dark btn-block timer-action" type="button" data-action="timer-toggle">' +
      icon(timer.running ? "pause" : "play", 14) +
      (timer.running ? "Pause session" : "Start " + timer.duration / 60 + " minutes") +
      "</button>" +
      '<p class="timer-hint">Sessions log automatically when the timer ends.</p>' +
      "</section>" +

      /* Up next */
      '<section class="card tasks-card">' +
      '<div class="card-head">' +
      '<div class="card-heading"><h2 class="card-title">Up next</h2><p class="card-sub">' +
      (taskStats.open ? taskStats.open + " open task" + (taskStats.open === 1 ? "" : "s") : "You're all clear") +
      "</p></div>" +
      '<button class="link-btn" type="button" data-view="planner">Planner' +
      icon("arrow-right", 13) +
      "</button></div>" +
      '<div class="mini-task-list">' +
      taskList +
      "</div>" +
      '<form class="quick-add-row" data-form="quick-task">' +
      icon("plus", 13) +
      '<input type="text" name="title" placeholder="Add a task..." maxlength="140" aria-label="New task title" autocomplete="off">' +
      '<button type="submit" aria-label="Add task">' +
      icon("plus", 13) +
      "</button>" +
      "</form>" +
      "</section>" +

      /* Quote */
      '<section class="quote-card">' +
      '<span class="quote-mark">' +
      icon("quote", 12) +
      "</span>" +
      '<p class="quote-copy">' +
      esc(quote.text) +
      "</p>" +
      '<p class="quote-author">' +
      esc(quote.author) +
      "</p>" +
      "</section>" +
      "</aside>" +
      "</div>" +
      "</section>"
    );
  }

  /* =========================================================
     Habits
     ========================================================= */

  function matchesHabitFilter(habit, filter) {
    const schedule = habit.schedule || [];
    if (filter === "archived") return habit.archived;
    if (habit.archived) return false;
    if (filter === "daily") return schedule.length === 7;
    if (filter === "weekdays") return schedule.length === 5 && [1, 2, 3, 4, 5].every(function (d) { return schedule.indexOf(d) !== -1; });
    if (filter === "weekends") return schedule.length === 2 && schedule.indexOf(0) !== -1 && schedule.indexOf(6) !== -1;
    return true;
  }

  function habitCard(habit) {
    const iso = today();
    const week = M.getWeekDays(iso);
    const rate = M.habitCompletionRate(habit, 30);
    const streak = M.habitStreak(habit);
    return (
      '<article class="habit-card ' +
      (habit.archived ? "is-archived" : "") +
      '" data-habit-card="' +
      habit.id +
      '">' +
      '<div class="habit-card-top">' +
      tint(habit.icon, habit.color, 18) +
      '<div class="habit-card-title-wrap">' +
      '<h3 class="habit-card-title">' +
      esc(habit.name) +
      "</h3>" +
      '<div class="habit-card-meta">' +
      "<span>" +
      esc(M.scheduleLabel(habit.schedule)) +
      "</span>" +
      "<span>·</span>" +
      '<span class="streak-inline">' +
      icon("flame", 10) +
      streak +
      " day" +
      (streak === 1 ? "" : "s") +
      "</span>" +
      (Number(habit.target) > 1 ? "<span>·</span><span>" + habit.target + "× daily</span>" : "") +
      "</div>" +
      "</div>" +
      '<button class="icon-btn habit-card-edit" type="button" data-action="edit-habit" data-id="' +
      habit.id +
      '" aria-label="Edit ' +
      esc(habit.name) +
      '">' +
      icon("more-horizontal", 16) +
      "</button>" +
      "</div>" +
      '<div class="habit-week-label"><span>This week</span><span>' +
      rate.percent +
      "% · 30 days</span></div>" +
      '<div class="habit-week">' +
      week
        .map(function (dayISO) {
          const scheduled = M.isScheduled(habit, dayISO);
          const count = M.habitCount(habit, dayISO);
          const target = Number(habit.target) || 1;
          const done = count >= target;
          const partial = count > 0 && !done;
          const future = M.isFuture(dayISO);
          let mark = "";
          if (done) mark = icon("check", 12);
          else if (partial) mark = count;
          else if (!scheduled) mark = "·";
          return (
            '<button class="habit-day ' +
            (M.isToday(dayISO) ? "is-today " : "") +
            (future ? "is-future " : "") +
            (scheduled ? "is-scheduled " : "is-off ") +
            (done ? "is-done " : "") +
            (partial ? "is-partial " : "") +
            '" type="button" data-action="toggle-habit-day" data-id="' +
            habit.id +
            '" data-date="' +
            dayISO +
            '"' +
            (future || !scheduled || habit.archived ? " disabled" : "") +
            ' title="' +
            esc(M.formatDate(dayISO, "long")) +
            '">' +
            '<span class="habit-day-label">' +
            M.DAYS[M.dayIndex(dayISO)].slice(0, 1) +
            "</span>" +
            '<span class="habit-day-mark">' +
            mark +
            "</span>" +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="habit-card-bottom">' +
      '<span class="habit-completion-badge">' +
      icon("chart", 10) +
      rate.percent +
      "% complete</span>" +
      '<button class="link-btn" type="button" data-action="edit-habit" data-id="' +
      habit.id +
      '">Manage' +
      icon("arrow-right", 12) +
      "</button>" +
      "</div>" +
      "</article>"
    );
  }

  function renderHabits() {
    const filter = M.ui.habitFilter || "all";
    const active = M.activeHabits();
    const list = M.state.habits.filter(function (habit) {
      return matchesHabitFilter(habit, filter);
    });
    const best = M.bestCurrentStreak();
    const avg = M.habitCompletionAverage(30);
    const filters = [
      { id: "all", label: "All" },
      { id: "daily", label: "Every day" },
      { id: "weekdays", label: "Weekdays" },
      { id: "weekends", label: "Weekends" },
      { id: "archived", label: "Archived" },
    ];

    return (
      '<section class="page-view" data-page="habits">' +
      pageIntro(
        "The small things",
        "Small things, <span class=\"title-accent\">kept.</span>",
        "Habits are not a test. They are a way of coming back to the life you want, one ordinary day at a time.",
        '<button class="btn btn-dark" type="button" data-action="new-habit">' +
          icon("plus", 16) +
          "New habit</button>"
      ) +
      '<div class="habit-stats">' +
      '<article class="stat-tile"><span class="stat-tile-icon">' +
      icon("repeat", 18) +
      '</span><div class="stat-tile-copy"><span class="stat-tile-label">Active habits</span><span class="stat-tile-value">' +
      active.length +
      "</span></div></article>" +
      '<article class="stat-tile"><span class="stat-tile-icon">' +
      icon("flame", 18) +
      '</span><div class="stat-tile-copy"><span class="stat-tile-label">Best current streak</span><span class="stat-tile-value">' +
      best +
      " <small>days</small></span></div></article>" +
      '<article class="stat-tile"><span class="stat-tile-icon">' +
      icon("target", 18) +
      '</span><div class="stat-tile-copy"><span class="stat-tile-label">30-day consistency</span><span class="stat-tile-value">' +
      avg.percent +
      "%</span></div></article>" +
      "</div>" +
      '<div class="habit-toolbar">' +
      '<div class="filter-row">' +
      filters
        .map(function (item) {
          return (
            '<button class="filter-pill ' +
            (filter === item.id ? "is-active" : "") +
            '" type="button" data-action="habit-filter" data-filter="' +
            item.id +
            '">' +
            item.label +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<button class="btn btn-light btn-sm" type="button" data-action="new-habit">' +
      icon("plus", 14) +
      "Add habit</button>" +
      "</div>" +
      (list.length
        ? '<div class="habit-list">' +
          list.map(habitCard).join("") +
          (filter === "archived"
            ? ""
            : '<button class="new-habit-card" type="button" data-action="new-habit"><span class="new-habit-plus">' +
              icon("plus", 17) +
              "</span>Start a new habit</button>") +
          "</div>"
        : '<section class="card">' +
          emptyState(
            filter === "archived" ? "layers" : "repeat",
            filter === "archived" ? "No archived habits" : "No habits here yet",
            filter === "archived"
              ? "Habits you archive will wait here, with their history intact."
              : filter === "all"
              ? "A habit can be tiny: one page, one glass of water, one honest ten minutes. Add the first one below."
              : "Nothing matches this filter right now. Try another view or add a new habit.",
            filter === "archived"
              ? '<button class="btn btn-light btn-sm" style="margin-top:8px" type="button" data-action="habit-filter" data-filter="all">' +
                icon("arrow-left", 14) +
                "Back to all habits</button>"
              : '<button class="btn btn-dark btn-sm" style="margin-top:8px" type="button" data-action="new-habit">' +
                icon("plus", 14) +
                "New habit</button>"
          ) +
          "</section>") +
      "</section>"
    );
  }

  /* =========================================================
     Focus
     ========================================================= */

  function renderFocus() {
    const timer = M.state.timer;
    const remaining = M.timerRemaining();
    const elapsed = M.timerElapsedPercent();
    const mode = timer.mode === "break" ? "break" : "focus";
    const goal = Math.max(1, Number(M.state.profile.focusGoal) || 120);
    const todayMinutes = M.todayFocusSeconds() / 60;
    const goalPercent = M.focusGoalPercent();
    const weekSeconds = M.weekFocusSeconds();
    const sessions = M.recentSessions(4);
    const sessionsToday = M.sessionsTodayCount();

    return (
      '<section class="page-view" data-page="focus">' +
      pageIntro(
        "Deep work, gently held",
        "A room for <span class=\"title-accent\">focus.</span>",
        "Choose a subject, settle in, and let the timer hold the edges of your attention.",
        '<button class="btn btn-light" type="button" data-action="log-session">' +
          icon("clock", 15) +
          "Log a session</button>" +
          '<button class="btn btn-dark" type="button" data-action="new-task">' +
          icon("plus", 15) +
          "Add task</button>"
      ) +
      '<div class="focus-layout">' +
      '<section class="focus-room" data-focus-room>' +
      '<div class="focus-room-head">' +
      '<div class="focus-mode-switch" role="group" aria-label="Timer mode">' +
      '<button class="' +
      (mode === "focus" ? "is-active" : "") +
      '" type="button" data-action="timer-mode" data-mode="focus">Focus</button>' +
      '<button class="' +
      (mode === "break" ? "is-active" : "") +
      '" type="button" data-action="timer-mode" data-mode="break">Break</button>' +
      "</div>" +
      '<span class="focus-live-label ' +
      (timer.running ? "is-running" : "") +
      '">' +
      (timer.running ? (mode === "break" ? "On a break" : "In the zone") : "Ready when you are") +
      "</span>" +
      "</div>" +
      '<div class="focus-main">' +
      '<div class="focus-ring-wrap">' +
      ringSvg(elapsed, "focus-ring") +
      '<div class="focus-ring-center">' +
      '<span class="focus-time" data-focus-time>' +
      formatClock(remaining) +
      "</span>" +
      '<span class="focus-status">' +
      icon(mode === "break" ? "coffee" : "zap", 11) +
      (mode === "break" ? "Break" : "Focus") +
      "</span>" +
      '<span class="focus-subject-wrap" style="--subject-color:' +
      M.subjectColor(timer.subject) +
      '"><span class="focus-subject-dot"></span>' +
      '<select class="focus-subject-select" data-field="focus-subject" aria-label="Focus subject">' +
      focusSubjectOptions(timer.subject) +
      "</select></span>" +
      "</div>" +
      "</div>" +
      '<div class="focus-presets">' +
      focusPresets(mode, timer.duration) +
      "</div>" +
      "</div>" +
      '<div class="focus-controls">' +
      '<button class="btn btn-accent btn-primary-focus" type="button" data-action="timer-toggle">' +
      icon(timer.running ? "pause" : "play", 16) +
      (timer.running ? "Pause" : remaining < timer.duration ? "Resume" : mode === "break" ? "Start break" : "Begin focus") +
      "</button>" +
      '<button class="focus-reset-btn" type="button" data-action="timer-reset" aria-label="Reset timer">' +
      icon("rotate", 17) +
      "</button>" +
      "</div>" +
      '<p class="focus-footer-hint">' +
      icon("keyboard", 11) +
      "Space to start or pause · R to reset · sessions save automatically" +
      "</p>" +
      "</section>" +

      '<aside class="focus-side">' +
      '<section class="focus-goal-card">' +
      '<div class="focus-goal-head"><span class="eyebrow">Daily focus goal</span><span class="focus-goal-icon">' +
      icon("target", 14) +
      "</span></div>" +
      '<div class="focus-goal-value">' +
      Math.round(todayMinutes) +
      "<span> / " +
      goal +
      " min</span></div>" +
      '<p class="focus-goal-copy">' +
      (goalPercent >= 100
        ? "Goal met. Anything else is a bonus."
        : todayMinutes > 0
        ? goalPercent + "% of the way there. Keep it unhurried."
        : "One honest session is enough to begin.") +
      "</p>" +
      '<div class="focus-goal-bar"><span style="width:' +
      goalPercent +
      '%"></span></div>' +
      "</section>" +
      '<div class="focus-stat-row">' +
      '<article class="focus-stat-mini"><span class="eyebrow">Sessions today</span><strong>' +
      sessionsToday +
      "</strong><span>" +
      (sessionsToday ? "logged" : "none yet") +
      "</span></article>" +
      '<article class="focus-stat-mini"><span class="eyebrow">This week</span><strong>' +
      escapeHTML(M.formatDuration(weekSeconds)) +
      "</strong><span>total focus</span></article>" +
      "</div>" +
      '<section class="card focus-week-card">' +
      '<div class="card-head" style="margin-bottom:0"><div class="card-heading"><h2 class="card-title">Focus this week</h2><p class="card-sub">Minutes per day</p></div></div>' +
      '<div class="focus-week-chart">' +
      weekBarsForFocus() +
      "</div>" +
      "</section>" +
      '<section class="card sessions-card">' +
      '<div class="card-head">' +
      '<div class="card-heading"><h2 class="card-title">Recent sessions</h2><p class="card-sub">Your latest focus blocks</p></div>' +
      '<button class="link-btn" type="button" data-action="log-session">Log' +
      icon("plus", 12) +
      "</button></div>" +
      '<div class="session-list">' +
      (sessions.length
        ? sessions.map(sessionRow).join("")
        : '<p class="session-empty">No sessions yet. Start the timer or log one you completed away from the app.</p>') +
      "</div>" +
      "</section>" +
      "</aside>" +
      "</div>" +
      "</section>"
    );
  }

  /* =========================================================
     Planner
     ========================================================= */

  function taskItem(task) {
    const due = M.dueLabel(task.due);
    return (
      '<div class="task-item priority-' +
      esc(task.priority || "medium") +
      " " +
      (task.done ? "is-done" : "") +
      '">' +
      taskCheck(task) +
      '<div class="task-item-main">' +
      '<span class="task-item-title">' +
      esc(task.title) +
      "</span>" +
      (task.notes ? '<p class="task-item-notes">' + esc(task.notes) + "</p>" : "") +
      '<div class="task-item-meta">' +
      '<span class="task-item-due ' +
      due.cls +
      '">' +
      icon("calendar", 9) +
      esc(due.text) +
      "</span>" +
      tagPill(task.tag) +
      (task.priority === "high" ? '<span class="badge danger">High</span>' : "") +
      "</div>" +
      "</div>" +
      '<button class="task-item-edit" type="button" data-action="edit-task" data-id="' +
      task.id +
      '" aria-label="Edit task">' +
      icon("pencil", 13) +
      "</button>" +
      "</div>"
    );
  }

  function renderPlanner() {
    const filter = M.ui.taskFilter || "all";
    const groups = M.taskGroups(filter);
    const stats = M.taskStats();
    const week = M.getWeekDays(today());
    const doneTotal = M.state.tasks.filter(function (t) { return t.done; }).length;
    const allTotal = M.state.tasks.length;
    const progress = allTotal ? Math.round((doneTotal / allTotal) * 100) : 0;
    const filters = [
      { id: "all", label: "All" },
      { id: "today", label: "Today" },
      { id: "upcoming", label: "Upcoming" },
      { id: "done", label: "Done" },
    ];

    return (
      '<section class="page-view" data-page="planner">' +
      pageIntro(
        "Make space for what matters",
        "Plan a <span class=\"title-accent\">gentler</span> week.",
        "Keep the list short enough to be kind. Then give the next thing your full attention.",
        '<button class="btn btn-dark" type="button" data-action="new-task">' +
          icon("plus", 16) +
          "New task</button>"
      ) +
      '<div class="planner-layout">' +
      '<div class="planner-main">' +
      '<section class="card planner-card">' +
      '<form class="task-composer" data-form="quick-task">' +
      icon("plus", 15) +
      '<input type="text" name="title" placeholder="What needs doing? Press Enter to add." maxlength="140" aria-label="New task title" autocomplete="off">' +
      '<button class="btn btn-dark" type="submit">' +
      icon("plus", 13) +
      "<span>Add</span></button>" +
      "</form>" +
      '<div class="flex-between" style="margin-top:16px">' +
      '<div class="segmented">' +
      filters
        .map(function (item) {
          return (
            '<button class="' +
            (filter === item.id ? "is-active" : "") +
            '" type="button" data-action="task-filter" data-filter="' +
            item.id +
            '">' +
            item.label +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<button class="link-btn clear-done" type="button" data-action="clear-done">Clear completed</button>' +
      "</div>" +
      '<div class="task-groups">' +
      (groups.length
        ? groups
            .map(function (group) {
              return (
                '<section class="task-group ' +
                (group.key === "completed" ? "is-completed" : "") +
                '">' +
                '<div class="task-group-head"><h3>' +
                group.label +
                '</h3><span class="task-group-count">' +
                group.tasks.length +
                '</span><span class="group-line"></span>' +
                (group.key === "completed"
                  ? '<button class="link-btn clear-done" type="button" data-action="clear-done">Clear</button>'
                  : "") +
                "</div>" +
                group.tasks.map(taskItem).join("") +
                "</section>"
              );
            })
            .join("")
        : '<div class="task-empty">Nothing on this list. Add a task above, or take the space as permission to rest.</div>') +
      "</div>" +
      "</section>" +
      "</div>" +

      '<aside class="planner-side">' +
      '<section class="plan-progress-card">' +
      '<div class="plan-progress-top"><span class="eyebrow">All-time progress</span><span class="plan-progress-icon">' +
      icon("flag", 14) +
      "</span></div>" +
      '<div class="plan-progress-value">' +
      progress +
      "%<span> complete</span></div>" +
      '<p class="plan-progress-copy">' +
      doneTotal +
      " of " +
      allTotal +
      " tasks finished</p>" +
      '<div class="plan-progress-bar"><span style="width:' +
      progress +
      '%"></span></div>' +
      "</section>" +
      '<section class="card plan-week-card">' +
      '<div class="card-head" style="margin-bottom:0"><div class="card-heading"><h2 class="card-title">This week</h2><p class="card-sub">Task load by day</p></div></div>' +
      '<div class="plan-week-grid">' +
      week
        .map(function (iso) {
          const count = M.state.tasks.filter(function (t) {
            return !t.done && t.due === iso;
          }).length;
          return (
            '<div class="plan-week-day ' +
            (M.isToday(iso) ? "is-today " : "") +
            (count ? "has-tasks" : "") +
            '" title="' +
            esc(M.formatDate(iso, "long") + " · " + count + " tasks") +
            '">' +
            "<span>" +
            M.DAYS[M.dayIndex(iso)][0] +
            "</span><strong>" +
            M.parseISO(iso).getDate() +
            '</strong><span class="plan-task-dot"></span></div>'
          );
        })
        .join("") +
      "</div>" +
      '<div class="plan-week-footer"><span>' +
      stats.dueToday +
      " due today</span><span>" +
      stats.overdue +
      " overdue</span></div>" +
      "</section>" +
      '<section class="planning-note">' +
      '<span class="eyebrow">A gentle nudge</span>' +
      "<p>" +
      (stats.overdue > 0
        ? "Start with the smallest overdue thing. Momentum likes an easy first step."
        : stats.open > 6
        ? "Your list is getting long. Choose the three that would make today feel complete."
        : "Leave a little space between tasks. The gaps are part of the plan too.") +
      "</p>" +
      "<small>" +
      (stats.doneToday
        ? "You've already finished " + stats.doneToday + " task" + (stats.doneToday === 1 ? "" : "s") + " today. That counts."
        : "A completed list is not the point. A life that feels like yours is.") +
      "</small>" +
      "</section>" +
      "</aside>" +
      "</div>" +
      "</section>"
    );
  }

  /* =========================================================
     Insights
     ========================================================= */

  function completedTasksInRange(days) {
    const start = M.addDays(today(), -(days - 1));
    return M.state.tasks.filter(function (task) {
      if (!task.done || !task.completedAt) return false;
      const iso = M.toISO(new Date(task.completedAt));
      return iso >= start && iso <= today();
    }).length;
  }

  function renderInsights() {
    const range = Number(M.ui.insightRange) || 30;
    const habitAvg = M.habitCompletionAverage(range);
    const focusStart = M.addDays(today(), -(range - 1));
    const focusSeconds = M.focusSecondsBetween(focusStart, today());
    const best = M.bestEverHabitStreak();
    const doneTasks = completedTasksInRange(range);
    const week = M.getWeekDays(today());
    const weekFocus = M.weekFocusSeconds();
    const lastWeek = M.lastWeekFocusSeconds();
    const weekDelta = weekFocus - lastWeek;
    const weekDeltaBadge =
      weekDelta > 0
        ? '<span class="badge success">' + icon("trending-up", 11) + M.formatDuration(weekDelta) + " more than last week</span>"
        : weekDelta < 0
        ? '<span class="badge">' + icon("trending-down", 11) + M.formatDuration(Math.abs(weekDelta)) + " less than last week</span>"
        : '<span class="badge">' + icon("activity", 11) + "Same as last week</span>";
    const heat = heatmapMarkup();
    const rawSubjects = M.subjectBreakdown(range);
    const subjects = rawSubjects.length
      ? rawSubjects
      : [{ name: "No focus yet", seconds: 0, color: "#b9b7ad" }];
    const totalSubjectSeconds = subjects.reduce(function (sum, s) {
      return sum + s.seconds;
    }, 0);
    const headline = M.insightHeadline();
    const rates = M.activeHabits()
      .map(function (habit) {
        return { habit: habit, rate: M.habitCompletionRate(habit, 30) };
      })
      .sort(function (a, b) {
        return b.rate.percent - a.rate.percent;
      })
      .slice(0, 5);

    let donutStops = [];
    if (totalSubjectSeconds <= 0) {
      donutStops.push("var(--surface-2) 0 100%");
    } else {
      let cursor = 0;
      subjects.forEach(function (subject) {
        const start = cursor;
        cursor += (subject.seconds / totalSubjectSeconds) * 100;
        donutStops.push(subject.color + " " + start.toFixed(2) + "% " + cursor.toFixed(2) + "%");
      });
    }

    const chartDays = Array.from({ length: 7 }, function (_, i) {
      return M.addDays(today(), -(6 - i));
    });
    const chartValues = chartDays.map(function (iso) {
      return Math.round(M.focusSecondsOn(iso) / 60);
    });
    const chartMax = Math.max.apply(null, chartValues.concat([25]));

    return (
      '<section class="page-view" data-page="insights">' +
      pageIntro(
        "Look how far you've come",
        "Your progress, <span class=\"title-accent\">in patterns.</span>",
        "Not a verdict. Just a gentle look at what is working, and what might need a little more room.",
        '<div class="segmented">' +
          [7, 30, 90]
            .map(function (days) {
              return (
                '<button class="' +
                (range === days ? "is-active" : "") +
                '" type="button" data-action="insight-range" data-range="' +
                days +
                '">' +
                days +
                " days</button>"
              );
            })
            .join("") +
          "</div>"
      ) +
      '<div class="insights-overview">' +
      '<article class="overview-stat" style="--stat-accent:#8b7cf6">' +
      '<div class="overview-stat-head"><span class="overview-stat-label">Habit consistency</span><span class="overview-stat-icon">' +
      icon("repeat", 13) +
      '</span></div><div class="overview-stat-value">' +
      habitAvg.percent +
      "%</div>" +
      '<div class="overview-stat-foot">' +
      (habitAvg.percent >= 60 ? icon("trending-up", 10) : icon("activity", 10)) +
      "<span>" +
      habitAvg.done +
      " of " +
      habitAvg.scheduled +
      " kept</span></div></article>" +
      '<article class="overview-stat" style="--stat-accent:#5ba9e8">' +
      '<div class="overview-stat-head"><span class="overview-stat-label">Focus time</span><span class="overview-stat-icon">' +
      icon("timer", 13) +
      '</span></div><div class="overview-stat-value">' +
      escapeHTML(M.formatDuration(focusSeconds)) +
      "</div>" +
      '<div class="overview-stat-foot">' +
      icon("clock", 10) +
      "<span>last " +
      range +
      " days</span></div></article>" +
      '<article class="overview-stat" style="--stat-accent:#ef7b57">' +
      '<div class="overview-stat-head"><span class="overview-stat-label">Best streak</span><span class="overview-stat-icon">' +
      icon("flame", 13) +
      '</span></div><div class="overview-stat-value">' +
      best +
      " <small>days</small></div>" +
      '<div class="overview-stat-foot">' +
      icon("sparkles", 10) +
      "<span>personal best</span></div></article>" +
      '<article class="overview-stat" style="--stat-accent:#56a67d">' +
      '<div class="overview-stat-head"><span class="overview-stat-label">Tasks finished</span><span class="overview-stat-icon">' +
      icon("check-square", 13) +
      '</span></div><div class="overview-stat-value">' +
      doneTasks +
      "</div>" +
      '<div class="overview-stat-foot">' +
      icon("check", 10) +
      "<span>in " +
      range +
      " days</span></div></article>" +
      "</div>" +

      '<div class="insights-grid">' +
      '<div class="insight-main">' +
      '<section class="card chart-card">' +
      '<div class="card-head">' +
      '<div class="card-heading"><h2 class="card-title">Focus rhythm</h2><div class="chart-summary"><strong>' +
      escapeHTML(M.formatDuration(weekFocus)) +
      "</strong><span>this week</span></div></div>" +
      weekDeltaBadge +
      "</div>" +
      '<div class="bar-chart">' +
      chartDays
        .map(function (iso, index) {
          const value = chartValues[index];
          const height = value > 0 ? Math.max(3, Math.round((value / chartMax) * 100)) : 2;
          return (
            '<div class="bar-col ' +
            (M.isToday(iso) ? "is-today " : "") +
            (value <= 0 ? "is-empty" : "") +
            '" title="' +
            esc(M.formatDate(iso, "long") + " · " + value + " minutes") +
            '">' +
            '<span class="bar-value">' +
            value +
            'm</span><span class="bar-column" style="height:' +
            height +
            '%"></span><span class="bar-label">' +
            M.DAYS[M.dayIndex(iso)].slice(0, 1) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="chart-legend"><span><i class="legend-dot"></i>Focus minutes</span><span><i class="legend-dot muted"></i>No focus</span></div>' +
      "</section>" +

      '<section class="card heatmap-card">' +
      '<div class="card-head" style="margin-bottom:12px">' +
      '<div class="card-heading"><h2 class="card-title">A year of small days</h2><p class="card-sub">Habit and focus activity over the last 15 weeks</p></div>' +
      '<span class="badge accent">' +
      icon("activity", 11) +
      "Consistency</span></div>" +
      heat +
      '<div class="heatmap-foot"><span>Each square is a day. Lighter means quieter.</span><div class="heatmap-key"><span>Less</span>' +
      '<i style="background:var(--surface-2)"></i>' +
      '<i style="background:color-mix(in srgb, var(--accent-strong) 26%, transparent)"></i>' +
      '<i style="background:color-mix(in srgb, var(--accent-strong) 48%, transparent)"></i>' +
      '<i style="background:color-mix(in srgb, var(--accent-strong) 72%, transparent)"></i>' +
      '<i style="background:var(--accent-strong)"></i><span>More</span></div></div>' +
      "</section>" +

      '<section class="card">' +
      '<div class="card-head"><div class="card-heading"><h2 class="card-title">Habit performance</h2><p class="card-sub">Completion over the last 30 days</p></div>' +
      '<button class="link-btn" type="button" data-view="habits">Manage habits' +
      icon("arrow-right", 12) +
      "</button></div>" +
      '<div class="habit-performance">' +
      (rates.length
        ? rates
            .map(function (item) {
              return (
                '<div class="habit-performance-row">' +
                '<span class="habit-perf-icon" style="--tint:' +
                item.habit.color +
                '">' +
                icon(item.habit.icon, 14) +
                "</span>" +
                '<div class="habit-perf-main"><div class="habit-perf-top"><span class="habit-perf-name">' +
                esc(item.habit.name) +
                '</span><span class="habit-perf-pct">' +
                item.rate.percent +
                '%</span></div><div class="habit-perf-bar"><span style="width:' +
                item.rate.percent +
                '%;background:' +
                item.habit.color +
                '"></span></div></div>' +
                '<span class="habit-perf-streak">' +
                icon("flame", 9) +
                M.habitStreak(item.habit) +
                "</span></div>"
              );
            })
            .join("")
        : '<p class="session-empty">Add a habit to see how it is growing.</p>') +
      "</div>" +
      "</section>" +
      "</div>" +

      '<aside class="insight-side">' +
      '<section class="card donut-card">' +
      '<div class="card-head"><div class="card-heading"><h2 class="card-title">Where focus went</h2><p class="card-sub">Last ' +
      range +
      " days</p></div></div>" +
      '<div class="donut-wrap">' +
      '<div class="donut" style="--donut-bg:conic-gradient(' +
      donutStops.join(",") +
      ')"><div class="donut-center"><strong>' +
      escapeHTML(M.formatDuration(totalSubjectSeconds)) +
      "</strong><span>focused</span></div></div>" +
      '<div class="donut-legend">' +
      subjects
        .slice(0, 5)
        .map(function (subject) {
          return (
            '<div class="donut-legend-row"><span class="donut-legend-dot" style="--dot:' +
            subject.color +
            '"></span><span>' +
            esc(subject.name) +
            "</span><strong>" +
            (totalSubjectSeconds ? Math.round((subject.seconds / totalSubjectSeconds) * 100) : 0) +
            "%</strong></div>"
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      "</section>" +
      '<section class="card subject-card">' +
      '<div class="card-head"><div class="card-heading"><h2 class="card-title">Subjects</h2><p class="card-sub">Time by what you gave attention to</p></div></div>' +
      '<div class="subject-list">' +
      (rawSubjects.length
        ? rawSubjects
            .map(function (subject) {
              const percent = totalSubjectSeconds ? Math.round((subject.seconds / totalSubjectSeconds) * 100) : 0;
              return (
                '<div class="subject-row"><div class="subject-row-top" style="--subject-color:' +
                subject.color +
                '"><span class="subject-dot"></span><span>' +
                esc(subject.name) +
                "</span><strong>" +
                escapeHTML(M.formatDuration(subject.seconds)) +
                "</strong></div>" +
                '<div class="subject-row-bar" style="--subject-color:' +
                subject.color +
                '"><span style="width:' +
                percent +
                '%"></span></div></div>'
              );
            })
            .join("")
        : '<p class="session-empty">Your subject breakdown will appear after your first focus session.</p>') +
      "</div>" +
      "</section>" +
      '<section class="reflection-card">' +
      '<span class="reflection-icon">' +
      icon("sparkles", 15) +
      "</span>" +
      '<p class="eyebrow">A note for you</p>' +
      '<p class="reflection-copy">' +
      esc(headline.title) +
      "</p>" +
      '<p class="reflection-sub">' +
      esc(headline.body) +
      "</p>" +
      "</section>" +
      "</aside>" +
      "</div>" +
      "</section>"
    );
  }

  /* =========================================================
     Settings
     ========================================================= */

  function renderSettings() {
    const profile = M.state.profile;
    const storage = M.storageSize();
    const storagePercent = Math.min(100, Math.max(1, Math.round((storage / (5 * 1024 * 1024)) * 100)));
    const accents = [
      { id: "lime", label: "Lime", color: "#dcf56f" },
      { id: "coral", label: "Coral", color: "#ff9c7a" },
      { id: "lilac", label: "Lilac", color: "#c8baff" },
      { id: "sky", label: "Sky", color: "#a5daf8" },
    ];
    const themes = [
      { id: "light", label: "Light" },
      { id: "dark", label: "Dark" },
      { id: "system", label: "System" },
    ];

    // Onboarding offers the daily goal in 15-minute steps, so settings must too.
    const focusGoalOptions = [];
    for (let minutes = 15; minutes <= 300; minutes += 15) focusGoalOptions.push(minutes);
    const currentGoal = Number(profile.focusGoal);
    if (currentGoal && focusGoalOptions.indexOf(currentGoal) === -1) {
      focusGoalOptions.push(currentGoal);
      focusGoalOptions.sort(function (a, b) { return a - b; });
    }

    // Keep a custom or imported default length selectable rather than silently resetting it.
    const defaultFocusOptions = [15, 20, 25, 30, 45, 50, 60, 90];
    const currentDefault = Number(profile.defaultFocus);
    if (currentDefault && defaultFocusOptions.indexOf(currentDefault) === -1) {
      defaultFocusOptions.push(currentDefault);
      defaultFocusOptions.sort(function (a, b) { return a - b; });
    }

    return (
      '<section class="page-view" data-page="settings">' +
      pageIntro(
        "Your space, your rules",
        "Make Morrow <span class=\"title-accent\">yours.</span>",
        "Everything lives on this device. No account, no feed, no one else deciding what matters today.",
        ""
      ) +
      '<div class="settings-layout">' +
      '<div class="settings-column">' +

      '<section class="card settings-card">' +
      '<div class="settings-section-head"><span class="settings-section-icon">' +
      icon("user", 17) +
      '</span><div class="settings-section-copy"><h2>Profile</h2><p>How Morrow greets you and shapes your day.</p></div></div>' +
      '<div class="avatar-settings-row"><span class="avatar avatar-lg" id="settingsAvatar">' +
      esc(M.initials(profile.name)) +
      '</span><div class="avatar-settings-copy"><strong>' +
      esc(profile.name || "Friend") +
      "</strong><span>" +
      esc(roleLabel(profile.role)) +
      " · local profile</span></div></div>" +
      '<form class="settings-form" data-form="profile">' +
      '<div class="field"><label for="settingsName">Your name</label><input class="input" id="settingsName" name="name" type="text" maxlength="40" value="' +
      esc(profile.name) +
      '" placeholder="What should we call you?"></div>' +
      '<div class="field-grid"><div class="field"><label for="settingsRole">This space is mostly for</label><select class="select" id="settingsRole" name="role">' +
      M.ROLES.map(function (role) {
        return '<option value="' + role.id + '"' + (profile.role === role.id ? " selected" : "") + ">" + esc(role.label) + "</option>";
      }).join("") +
      '</select></div><div class="field"><label for="settingsGoal">Daily focus goal</label><select class="select" id="settingsGoal" name="focusGoal">' +
      focusGoalOptions.map(function (minutes) {
        return '<option value="' + minutes + '"' + (Number(profile.focusGoal) === minutes ? " selected" : "") + ">" + minutes + " minutes</option>";
      }).join("") +
      "</select></div></div>" +
      '<div class="field-grid"><div class="field"><label for="settingsWeek">Week starts on</label><select class="select" id="settingsWeek" name="weekStart"><option value="0"' +
      (Number(profile.weekStart) === 0 ? " selected" : "") +
      '>Sunday</option><option value="1"' +
      (Number(profile.weekStart) === 1 ? " selected" : "") +
      '>Monday</option></select></div><div class="field"><label for="settingsDefault">Default focus length</label><select class="select" id="settingsDefault" name="defaultFocus">' +
      defaultFocusOptions.map(function (minutes) {
        return '<option value="' + minutes + '"' + (Number(profile.defaultFocus) === minutes ? " selected" : "") + ">" + minutes + " minutes</option>";
      }).join("") +
      "</select></div></div>" +
      '<div class="form-actions"><button class="btn btn-dark" type="submit">' +
      icon("check", 15) +
      "Save profile</button></div>" +
      "</form>" +
      "</section>" +

      '<section class="card settings-card">' +
      '<div class="settings-section-head"><span class="settings-section-icon">' +
      icon("palette", 17) +
      '</span><div class="settings-section-copy"><h2>Appearance</h2><p>Soft by day, quiet by night. Pick what feels like you.</p></div></div>' +
      '<div class="field" style="margin-bottom:17px"><span class="field-label">Theme</span>' +
      '<div class="theme-options">' +
      themes
        .map(function (theme) {
          return (
            '<button class="theme-option ' +
            theme.id +
            " " +
            (profile.theme === theme.id ? "is-active" : "") +
            '" type="button" data-action="set-theme" data-theme-value="' +
            theme.id +
            '" aria-pressed="' +
            (profile.theme === theme.id ? "true" : "false") +
            '"><span class="theme-preview"></span><span>' +
            theme.label +
            "</span></button>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="field"><span class="field-label">Accent colour</span><div class="accent-picker">' +
      accents
        .map(function (accent) {
          return (
            '<button class="accent-choice ' +
            (profile.accent === accent.id ? "is-active" : "") +
            '" type="button" data-action="set-accent" data-accent-value="' +
            accent.id +
            '"><span class="accent-swatch" style="--swatch:' +
            accent.color +
            '"></span>' +
            accent.label +
            "</button>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="settings-inline-note" style="margin-top:17px">' +
      icon("info", 13) +
      "<span>Morrow follows your system theme by default and remembers your choice on this device.</span></div>" +
      "</section>" +

      '<section class="card settings-card">' +
      '<div class="settings-section-head"><span class="settings-section-icon">' +
      icon("database", 17) +
      '</span><div class="settings-section-copy"><h2>Your data</h2><p>Private to this browser. Export a copy whenever you like.</p></div></div>' +
      '<div class="data-actions">' +
      '<button class="data-action" type="button" data-action="export-data"><span class="data-action-icon">' +
      icon("download", 14) +
      '</span><span class="data-action-copy"><strong>Export a backup</strong><span>Download habits, tasks and sessions as JSON</span></span>' +
      icon("chevron-right", 13) +
      "</button>" +
      '<button class="data-action" type="button" data-action="import-data"><span class="data-action-icon">' +
      icon("upload", 14) +
      '</span><span class="data-action-copy"><strong>Import a backup</strong><span>Restore a previous Morrow export</span></span>' +
      icon("chevron-right", 13) +
      "</button>" +
      '<button class="data-action danger" type="button" data-action="reset-app"><span class="data-action-icon">' +
      icon("trash", 14) +
      '</span><span class="data-action-copy"><strong>Start fresh</strong><span>Delete everything on this device</span></span>' +
      icon("chevron-right", 13) +
      "</button>" +
      "</div>" +
      '<div class="storage-meter"><span>Local storage</span><span class="storage-meter-bar"><span style="width:' +
      storagePercent +
      '%"></span></span><span>' +
      (storage / 1024).toFixed(1) +
      " KB</span></div>" +
      "</section>" +

      "</div>" +
      '<div class="settings-column">' +

      '<section class="install-card">' +
      '<span class="install-card-icon">' +
      icon("smartphone", 18) +
      '</span><div class="install-card-copy"><strong>Keep Morrow close</strong><span>Install it as an app for a calmer, offline space.</span></div>' +
      '<button class="btn btn-light btn-sm" type="button" data-action="install-app">Install</button>' +
      "</section>" +

      '<section class="card settings-card">' +
      '<div class="settings-section-head"><span class="settings-section-icon">' +
      icon("keyboard", 17) +
      '</span><div class="settings-section-copy"><h2>Shortcuts</h2><p>A few quick ways around.</p></div></div>' +
      '<div class="shortcut-list">' +
      '<div class="shortcut-row"><span>Quick command</span><span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>K</kbd></span></div>' +
      '<div class="shortcut-row"><span>New task</span><span class="shortcut-keys"><kbd>T</kbd></span></div>' +
      '<div class="shortcut-row"><span>New habit</span><span class="shortcut-keys"><kbd>H</kbd></span></div>' +
      '<div class="shortcut-row"><span>Start or pause focus</span><span class="shortcut-keys"><kbd>Space</kbd></span></div>' +
      '<div class="shortcut-row"><span>Reset focus timer</span><span class="shortcut-keys"><kbd>R</kbd></span></div>' +
      '<div class="shortcut-row"><span>Toggle theme</span><span class="shortcut-keys"><kbd>D</kbd></span></div>' +
      "</div>" +
      "</section>" +

      '<section class="card settings-card">' +
      '<div class="settings-section-head" style="margin-bottom:12px"><span class="settings-section-icon">' +
      icon("shield", 17) +
      '</span><div class="settings-section-copy"><h2>Private by design</h2><p>No analytics, no account, no cloud.</p></div></div>' +
      '<p class="card-sub" style="line-height:1.7">Morrow stores everything in your browser using local storage. Clearing your browser data or using another device means starting fresh — so keep an occasional export somewhere safe.</p>' +
      '<div class="settings-inline-note" style="margin-top:14px">' +
      icon("wifi-off", 13) +
      "<span>Works offline once installed. Your data never leaves this device unless you export it.</span></div>" +
      "</section>" +

      '<section class="card settings-card">' +
      '<div class="flex-between"><div><p class="eyebrow">Morrow</p><p class="card-sub" style="margin-top:4px">Habits, focus & progress.</p></div><span class="badge accent">v1.0</span></div>' +
      '<div class="settings-footer"><span>Made for ordinary days.</span><strong>Yours, locally.</strong></div>' +
      "</section>" +

      "</div>" +
      "</div>" +
      '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
      "</section>"
    );
  }

  /* =========================================================
     Command palette, quick add and modals
     ========================================================= */

  M.commandItems = function () {
    return [
      { id: "go-today", group: "Go to", label: "Today", hint: "Your daily dashboard", icon: "home", action: "nav", view: "today" },
      { id: "go-habits", group: "Go to", label: "Habits", hint: "All your habits", icon: "repeat", action: "nav", view: "habits" },
      { id: "go-focus", group: "Go to", label: "Focus", hint: "Start a focus session", icon: "timer", action: "nav", view: "focus" },
      { id: "go-planner", group: "Go to", label: "Planner", hint: "Tasks and the week ahead", icon: "check-square", action: "nav", view: "planner" },
      { id: "go-insights", group: "Go to", label: "Insights", hint: "Patterns in your progress", icon: "chart", action: "nav", view: "insights" },
      { id: "go-settings", group: "Go to", label: "Settings", hint: "Profile, theme and data", icon: "settings", action: "nav", view: "settings" },
      { id: "new-habit", group: "Create", label: "New habit", hint: "Something small, repeated", icon: "plus", action: "new-habit", keys: "H" },
      { id: "new-task", group: "Create", label: "New task", hint: "Add to your planner", icon: "check-square", action: "new-task", keys: "T" },
      { id: "start-focus", group: "Create", label: "Start focus timer", hint: "Begin a focus block", icon: "play", action: "start-focus" },
      { id: "log-session", group: "Create", label: "Log a focus session", hint: "Record focus done offline", icon: "clock", action: "log-session" },
      { id: "toggle-theme", group: "Settings", label: "Toggle theme", hint: "Light, dark or system", icon: "sun", action: "toggle-theme", keys: "D" },
      { id: "export-data", group: "Settings", label: "Export a backup", hint: "Download your data as JSON", icon: "download", action: "export-data" },
      { id: "import-data", group: "Settings", label: "Import a backup", hint: "Restore a Morrow export", icon: "upload", action: "import-data" },
    ];
  };

  M.renderCommand = function (query) {
    const q = String(query || "").trim().toLowerCase();
    const items = M.commandItems().filter(function (item) {
      return !q || (item.label + " " + item.hint + " " + item.group).toLowerCase().indexOf(q) !== -1;
    });
    const groups = [];
    items.forEach(function (item) {
      let group = groups.find(function (g) { return g.name === item.group; });
      if (!group) {
        group = { name: item.group, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });

    return (
      '<h2 class="sr-only" id="modalTitle">Quick command</h2>' +
      '<div class="command-panel">' +
      '<div class="command-search">' +
      icon("search", 17) +
      '<input type="text" id="commandInput" data-command-input placeholder="Search Morrow..." autocomplete="off" aria-label="Search commands">' +
      '<kbd>Esc</kbd>' +
      "</div>" +
      '<div class="command-list" id="commandList">' +
      (items.length
        ? groups
            .map(function (group) {
              return (
                '<p class="command-group-label">' +
                esc(group.name) +
                "</p>" +
                group.items
                  .map(function (item) {
                    return (
                      '<button class="command-item" type="button" data-action="run-command" data-command="' +
                      item.id +
                      '"><span class="command-item-icon">' +
                      icon(item.icon, 14) +
                      '</span><span class="command-item-copy"><strong>' +
                      esc(item.label) +
                      "</strong><span>" +
                      esc(item.hint) +
                      "</span></span>" +
                      (item.keys ? "<kbd>" + item.keys + "</kbd>" : "") +
                      "</button>"
                    );
                  })
                  .join("")
              );
            })
            .join("")
        : '<p class="command-empty">No commands match “' + esc(query) + '”. Try “focus”, “habit” or “theme”.</p>') +
      "</div>" +
      '<div class="command-footer"><span>' +
      icon("command", 9) +
      "Use arrows and Enter</span><span>Morrow · local-first</span></div>" +
      "</div>"
    );
  };

  M.quickAddModal = function () {
    return (
      '<div class="modal-head"><div><h2 class="modal-title" id="modalTitle">What next?</h2><p class="modal-sub">A small action, then back to your day.</p></div>' +
      '<button class="modal-close" type="button" data-action="close-modal" aria-label="Close">' +
      icon("x", 15) +
      "</button></div>" +
      '<div class="data-actions">' +
      '<button class="data-action" type="button" data-action="new-habit"><span class="data-action-icon">' +
      icon("repeat", 14) +
      '</span><span class="data-action-copy"><strong>New habit</strong><span>Build a small daily rhythm</span></span>' +
      icon("chevron-right", 13) +
      "</button>" +
      '<button class="data-action" type="button" data-action="new-task"><span class="data-action-icon">' +
      icon("check-square", 14) +
      '</span><span class="data-action-copy"><strong>New task</strong><span>Add something to your planner</span></span>' +
      icon("chevron-right", 13) +
      "</button>" +
      '<button class="data-action" type="button" data-action="start-focus"><span class="data-action-icon">' +
      icon("play", 14) +
      '</span><span class="data-action-copy"><strong>Start a focus session</strong><span>Choose a subject and settle in</span></span>' +
      icon("chevron-right", 13) +
      "</button>" +
      '<button class="data-action" type="button" data-action="log-session"><span class="data-action-icon">' +
      icon("clock", 14) +
      '</span><span class="data-action-copy"><strong>Log a session</strong><span>Record focus you did elsewhere</span></span>' +
      icon("chevron-right", 13) +
      "</button>" +
      "</div>"
    );
  };

  M.habitModal = function (habit) {
    const editing = Boolean(habit);
    const draft = habit || {
      id: "",
      name: "",
      icon: "sparkles",
      color: "#8b7cf6",
      schedule: [0, 1, 2, 3, 4, 5, 6],
      target: 1,
    };
    const schedule = draft.schedule || [0, 1, 2, 3, 4, 5, 6];

    return (
      '<div class="modal-head"><div><h2 class="modal-title" id="modalTitle">' +
      (editing ? "Tend this habit" : "A new habit") +
      '</h2><p class="modal-sub">' +
      (editing ? "Adjust the shape of it, or let it go." : "Make it small enough to keep on an ordinary day.") +
      "</p></div>" +
      '<button class="modal-close" type="button" data-action="close-modal" aria-label="Close">' +
      icon("x", 15) +
      "</button></div>" +
      '<form data-form="habit" data-id="' +
      esc(draft.id) +
      '">' +
      '<div class="field"><label for="habitName">Habit name</label><input class="input" id="habitName" name="name" type="text" maxlength="60" required value="' +
      esc(draft.name) +
      '" placeholder="e.g. Read ten pages"></div>' +
      '<div class="field" style="margin-top:17px"><span class="field-label">Which days?</span><div class="day-picker" data-day-picker>' +
      M.DAYS.map(function (day, index) {
        return (
          '<button class="day-choice ' +
          (schedule.indexOf(index) !== -1 ? "is-active" : "") +
          '" type="button" data-action="toggle-schedule-day" data-day="' +
          index +
          '" aria-pressed="' +
          (schedule.indexOf(index) !== -1 ? "true" : "false") +
          '">' +
          day.slice(0, 1) +
          "</button>"
        );
      }).join("") +
      "</div>" +
      '<span class="field-hint">Pick the days this habit actually belongs to. Rest days are allowed.</span></div>' +
      '<div class="field-grid" style="margin-top:17px">' +
      '<div class="field"><span class="field-label">Times per day</span><div class="stepper"><button type="button" data-action="step-target" data-delta="-1" aria-label="Decrease target">' +
      icon("minus", 14) +
      '</button><output id="habitTarget" data-target-output>' +
      (Number(draft.target) || 1) +
      '</output><button type="button" data-action="step-target" data-delta="1" aria-label="Increase target">' +
      icon("plus", 14) +
      "</button></div></div>" +
      '<div class="field"><span class="field-label">Colour</span><div class="color-picker" data-color-picker>' +
      M.HABIT_COLORS.map(function (color) {
        return (
          '<button class="color-choice ' +
          (draft.color === color.value ? "is-active" : "") +
          '" type="button" data-action="choose-habit-color" data-color="' +
          color.value +
          '" style="--swatch:' +
          color.value +
          '" aria-label="' +
          color.name +
          '" title="' +
          color.name +
          '"></button>'
        );
      }).join("") +
      "</div></div>" +
      "</div>" +
      '<div class="field" style="margin-top:17px"><span class="field-label">Icon</span><div class="icon-picker" data-icon-picker>' +
      M.HABIT_ICONS.map(function (name) {
        return (
          '<button class="icon-choice ' +
          (draft.icon === name ? "is-active" : "") +
          '" type="button" data-action="choose-habit-icon" data-icon-name="' +
          name +
          '" aria-label="' +
          name.replace(/-/g, " ") +
          '">' +
          icon(name, 18) +
          "</button>"
        );
      }).join("") +
      "</div></div>" +
      '<div class="habit-form-preview" style="margin-top:18px"><span class="tint-box" style="--tint:' +
      draft.color +
      '" data-habit-preview-icon>' +
      icon(draft.icon, 18) +
      '</span><span class="habit-form-preview-copy"><strong data-habit-preview-name>' +
      esc(draft.name || "Your new habit") +
      "</strong><span data-habit-preview-meta>" +
      esc(M.scheduleLabel(schedule)) +
      " · " +
      (Number(draft.target) || 1) +
      "× daily</span></span></div>" +
      '<input type="hidden" name="icon" value="' +
      esc(draft.icon) +
      '" data-habit-icon-input>' +
      '<input type="hidden" name="color" value="' +
      esc(draft.color) +
      '" data-habit-color-input>' +
      '<input type="hidden" name="schedule" value="' +
      schedule.join(",") +
      '" data-habit-schedule-input>' +
      '<input type="hidden" name="target" value="' +
      (Number(draft.target) || 1) +
      '" data-habit-target-input>' +
      (editing
        ? '<p class="form-note" style="margin-top:16px">Archive a habit to keep its history out of the way. Delete removes it from this device for good.</p>'
        : "") +
      '<div class="form-actions">' +
      (editing
        ? '<button class="btn btn-light" type="button" data-action="archive-habit" data-id="' +
          habit.id +
          '">' +
          icon(habit.archived ? "rotate" : "layers", 14) +
          (habit.archived ? "Restore" : "Archive") +
          "</button>" +
          '<button class="btn btn-danger" type="button" data-action="delete-habit" data-id="' +
          habit.id +
          '">' +
          icon("trash", 14) +
          "Delete</button>"
        : "") +
      '<button class="btn btn-light" type="button" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-dark" type="submit">' +
      icon("check", 14) +
      (editing ? "Save habit" : "Create habit") +
      "</button>" +
      "</div>" +
      "</form>"
    );
  };

  M.taskModal = function (task) {
    const editing = Boolean(task);
    const draft = task || {
      id: "",
      title: "",
      notes: "",
      due: today(),
      priority: "medium",
      tag: "Personal",
    };
    return (
      '<div class="modal-head"><div><h2 class="modal-title" id="modalTitle">' +
      (editing ? "Shape this task" : "Something to do") +
      '</h2><p class="modal-sub">' +
      (editing ? "Change the details or remove it from your list." : "Keep it clear enough to start.") +
      "</p></div>" +
      '<button class="modal-close" type="button" data-action="close-modal" aria-label="Close">' +
      icon("x", 15) +
      "</button></div>" +
      '<form data-form="task" data-id="' +
      esc(draft.id) +
      '">' +
      '<div class="field"><label for="taskTitle">Task</label><input class="input" id="taskTitle" name="title" type="text" maxlength="140" required value="' +
      esc(draft.title) +
      '" placeholder="What needs doing?"></div>' +
      '<div class="field" style="margin-top:15px"><label for="taskNotes">Notes <span class="subtle">(optional)</span></label><textarea class="textarea" id="taskNotes" name="notes" maxlength="500" placeholder="Any context, a first step, a link...">' +
      esc(draft.notes) +
      "</textarea></div>" +
      '<div class="field-grid" style="margin-top:15px">' +
      '<div class="field"><label for="taskDue">Due date</label><input class="input" id="taskDue" name="due" type="date" value="' +
      esc(draft.due || today()) +
      '"></div>' +
      '<div class="field"><label for="taskPriority">Priority</label><select class="select" id="taskPriority" name="priority">' +
      ["high", "medium", "low"].map(function (priority) {
        return '<option value="' + priority + '"' + (draft.priority === priority ? " selected" : "") + ">" + priority.charAt(0).toUpperCase() + priority.slice(1) + "</option>";
      }).join("") +
      "</select></div>" +
      "</div>" +
      '<div class="field" style="margin-top:15px"><label for="taskTag">Area</label><select class="select" id="taskTag" name="tag">' +
      M.TASK_TAGS.map(function (tag) {
        return '<option value="' + tag.name + '"' + (draft.tag === tag.name ? " selected" : "") + ">" + esc(tag.name) + "</option>";
      }).join("") +
      "</select></div>" +
      '<div class="form-actions">' +
      (editing
        ? '<button class="btn btn-danger" type="button" data-action="delete-task" data-id="' +
          task.id +
          '">' +
          icon("trash", 14) +
          "Delete</button>"
        : "") +
      '<button class="btn btn-light" type="button" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-dark" type="submit">' +
      icon("check", 14) +
      (editing ? "Save task" : "Add task") +
      "</button>" +
      "</div>" +
      "</form>"
    );
  };

  M.sessionModal = function () {
    const timer = M.state.timer;
    return (
      '<div class="modal-head"><div><h2 class="modal-title" id="modalTitle">Log a session</h2><p class="modal-sub">For focus you did away from the timer. It still counts.</p></div>' +
      '<button class="modal-close" type="button" data-action="close-modal" aria-label="Close">' +
      icon("x", 15) +
      "</button></div>" +
      '<form data-form="session">' +
      '<div class="field"><label for="sessionSubject">What did you focus on?</label><select class="select" id="sessionSubject" name="subject">' +
      focusSubjectOptions(timer.subject) +
      "</select></div>" +
      '<div class="field" style="margin-top:17px"><span class="field-label">How long?</span><div class="manual-duration-grid" data-duration-grid>' +
      [15, 25, 45, 60]
        .map(function (minutes) {
          return (
            '<button class="manual-duration ' +
            (minutes === 25 ? "is-active" : "") +
            '" type="button" data-action="manual-duration" data-minutes="' +
            minutes +
            '">' +
            minutes +
            " min</button>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="field" style="margin-top:15px"><label for="sessionMinutes">Minutes</label><input class="input" id="sessionMinutes" name="minutes" type="number" min="1" max="600" step="1" value="25" data-session-minutes required><span class="field-hint">Anywhere from 1 to 600 minutes.</span></div>' +
      '<div class="form-actions"><button class="btn btn-light" type="button" data-action="close-modal">Cancel</button><button class="btn btn-dark" type="submit">' +
      icon("check", 14) +
      "Log session</button></div>" +
      "</form>"
    );
  };

  M.confirmModal = function (options) {
    const opts = options || {};
    return (
      '<div class="confirm-orb">' +
      icon(opts.icon || "trash", 22) +
      "</div>" +
      '<h2 class="confirm-title" id="modalTitle">' +
      esc(opts.title || "Are you sure?") +
      "</h2>" +
      '<p class="confirm-copy">' +
      esc(opts.message || "") +
      "</p>" +
      '<div class="form-actions" style="margin-top:24px">' +
      '<button class="btn btn-light" type="button" data-action="close-modal">' +
      esc(opts.cancelLabel || "Keep it") +
      "</button>" +
      '<button class="btn btn-danger" type="button" data-action="confirm-modal">' +
      esc(opts.confirmLabel || "Delete") +
      "</button>" +
      "</div>"
    );
  };

  /* =========================================================
     Onboarding
     ========================================================= */

  M.onboardingDraft = function () {
    if (!M.ui.onboardingDraft) {
      M.ui.onboardingDraft = {
        name: "",
        role: "personal",
        interests: ["study", "reading", "fitness"],
        focusGoal: 120,
        seed: true,
      };
    }
    return M.ui.onboardingDraft;
  };

  function onboardingArt() {
    const miniHabits = [
      { name: "Read 20 pages", meta: "Every day · 4 day streak", color: "#5ba9e8", icon: "book-open", done: true },
      { name: "Move for 30 minutes", meta: "Weekdays · 9 day streak", color: "#ef7b57", icon: "activity", done: true },
      { name: "One focus session", meta: "Today · 25 minutes", color: "#8b7cf6", icon: "timer", done: false },
    ];
    return (
      '<section class="onboarding-art">' +
      '<div class="onboarding-brand"><a class="brand" href="#today" aria-label="Morrow">' +
      '<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none"><path d="M8 26V14.5c0-1.6 1.9-2.4 3-1.2L18 21l7-7.7c1.1-1.2 3-.4 3 1.2V26" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28.5" cy="9.5" r="2.3" fill="var(--accent)"/></svg></span>' +
      '<span class="brand-word">morrow<span class="brand-dot">.</span></span></a>' +
      '<span class="onboarding-brand-tag">Local-first · private</span></div>' +
      '<div class="onboarding-art-main">' +
      '<div class="onboarding-art-copy"><p class="eyebrow">Habits, focus & progress</p>' +
      "<h1>A softer way to <em>become</em> who you're becoming.</h1>" +
      "<p>Morrow is a quiet home for your habits, study sessions and the small promises that add up to a life. No streak guilt. No noisy feed.</p></div>" +
      '<div class="onboarding-preview"><div class="preview-top"><span class="preview-title">Today <span>· a good day</span></span><span class="preview-date">' +
      esc(M.formatDate(today(), "short")) +
      '</span></div><div class="preview-body"><div class="preview-habits">' +
      miniHabits
        .map(function (habit) {
          return (
            '<div class="preview-habit"><span class="preview-habit-dot" style="--preview-color:' +
            habit.color +
            '">' +
            icon(habit.icon, 10) +
            '</span><span class="preview-habit-copy"><strong>' +
            esc(habit.name) +
            "</strong><span>" +
            esc(habit.meta) +
            '</span></span><span class="preview-check ' +
            (habit.done ? "done" : "") +
            '">' +
            icon("check", 8) +
            "</span></div>"
          );
        })
        .join("") +
      '</div><div class="preview-timer"><div class="preview-ring"><strong>18:42</strong></div><span class="preview-timer-label">Focus</span><span class="preview-timer-subject">Mathematics</span></div></div></div>' +
      "</div>" +
      '<div class="onboarding-art-foot"><span class="onboarding-foot-item">' +
      icon("shield", 11) +
      "Stays on your device</span><span class=\"onboarding-foot-item\">" +
      icon("wifi-off", 11) +
      "Works offline</span><span class=\"onboarding-foot-item\">" +
      icon("heart", 11) +
      "No accounts, ever</span></div>" +
      "</section>"
    );
  }

  M.renderOnboarding = function () {
    const step = M.ui.onboardingStep || 0;
    const draft = M.onboardingDraft();
    const roleChoices = M.ROLES.map(function (role) {
      return (
        '<button class="role-choice ' +
        (draft.role === role.id ? "is-active" : "") +
        '" type="button" data-action="onboarding-role" data-role="' +
        role.id +
        '">' +
        icon(role.icon, 15) +
        esc(role.label) +
        "</button>"
      );
    }).join("");
    const interestChoices = M.INTERESTS.map(function (interest) {
      const active = draft.interests.indexOf(interest.id) !== -1;
      return (
        '<button class="interest-choice ' +
        (active ? "is-active" : "") +
        '" type="button" data-action="onboarding-interest" data-interest="' +
        interest.id +
        '" style="--color:' +
        interest.color +
        '"><span class="interest-choice-icon">' +
        icon(interest.icon, 14) +
        "</span><span>" +
        esc(interest.short) +
        '</span><span class="interest-choice-check">' +
        icon("check", 9) +
        "</span></button>"
      );
    }).join("");

    let content = "";
    if (step === 0) {
      content =
        '<div class="onboarding-step"><span class="onboarding-step-kicker">Let\'s begin</span>' +
        "<h2>First, what should we call you?</h2>" +
        "<p>Morrow is yours alone. A name makes it feel a little more like home.</p>" +
        '<div class="onboarding-fields"><div class="onboarding-name-row"><span class="onboarding-avatar-preview" data-onboarding-avatar>' +
        esc(M.initials(draft.name || "M")) +
        '</span><input class="input" type="text" maxlength="40" value="' +
        esc(draft.name) +
        '" placeholder="Your first name" data-onboarding-field="name" autocomplete="given-name" aria-label="Your name"></div>' +
        '<div class="field"><span class="field-label">This space is mostly for</span><div class="role-grid">' +
        roleChoices +
        "</div></div></div></div>";
    } else if (step === 1) {
      content =
        '<div class="onboarding-step"><span class="onboarding-step-kicker">A place to begin</span>' +
        "<h2>What would you like more of?</h2>" +
        "<p>Choose a few. We'll shape a gentle starter rhythm around them — you can change everything later.</p>" +
        '<div class="onboarding-fields"><div class="onboarding-choice-grid">' +
        interestChoices +
        '</div><div class="settings-inline-note">' +
        icon("sparkles", 13) +
        "<span>Starter habits are suggestions, not commitments. Keep only what feels useful.</span></div></div></div>";
    } else {
      content =
        '<div class="onboarding-step"><span class="onboarding-step-kicker">Set the tone</span>' +
        "<h2>How much focus feels right?</h2>" +
        "<p>A daily target you can reach on a normal day. Morrow will keep it visible, not turn it into a scoreboard.</p>" +
        '<div class="onboarding-fields"><div><div class="onboarding-goal"><span class="onboarding-goal-value" data-onboarding-goal-value>' +
        draft.focusGoal +
        ' <span>min / day</span></span><span class="onboarding-goal-caption" data-onboarding-goal-caption>' +
        (draft.focusGoal <= 60 ? "A light touch" : draft.focusGoal <= 120 ? "A steady rhythm" : "An ambitious season") +
        '</span></div><input class="range" type="range" min="15" max="300" step="15" value="' +
        draft.focusGoal +
        '" data-onboarding-field="focusGoal" aria-label="Daily focus goal"></div>' +
        '<div class="range-labels"><span>15 min</span><span>1 hour</span><span>2 hours</span><span>3 hours</span><span>5 hours</span></div>' +
        '<div class="onboarding-seed"><div class="onboarding-seed-copy"><strong>Start with a few suggestions</strong><span>Add starter habits and tasks shaped around your choices.</span></div><button class="switch" type="button" role="switch" aria-checked="' +
        (draft.seed ? "true" : "false") +
        '" data-action="toggle-seed" aria-label="Seed starter habits and tasks"></button></div>' +
        '<div class="settings-inline-note">' +
        icon("lock", 13) +
        "<span>Everything stays on this device. You can export or start fresh at any time.</span></div></div></div>";
    }

    return (
      '<div class="onboarding-screen" data-onboarding-screen>' +
      onboardingArt() +
      '<div class="onboarding-form-panel"><div class="onboarding-form-inner">' +
      '<div class="onboarding-topline"><span>Step <strong>' +
      (step + 1) +
      "</strong> of 3</span>" +
      '<button class="onboarding-skip" type="button" data-action="onboarding-skip">Skip for now</button></div>' +
      '<div class="onboarding-progress">' +
      [0, 1, 2]
        .map(function (index) {
          return '<span class="' + (index <= step ? "is-done" : "") + '"></span>';
        })
        .join("") +
      "</div>" +
      content +
      '<div class="onboarding-footer">' +
      (step > 0
        ? '<button class="onboarding-back" type="button" data-action="onboarding-back">' +
          icon("arrow-left", 13) +
          "Back</button>"
        : '<span></span>') +
      '<button class="btn btn-dark" type="button" data-action="onboarding-next">' +
      (step === 2 ? "Enter Morrow" : "Continue") +
      icon("arrow-right", 15) +
      "</button></div>" +
      '<p class="onboarding-note">No account needed. Your data stays in this browser.</p>' +
      "</div></div></div>"
    );
  };

  /* =========================================================
     Router
     ========================================================= */

  M.renderView = function (view) {
    const name = view || M.ui.view || "today";
    if (name === "habits") return renderHabits();
    if (name === "focus") return renderFocus();
    if (name === "planner") return renderPlanner();
    if (name === "insights") return renderInsights();
    if (name === "settings") return renderSettings();
    return renderToday();
  };

  // Local escape helper kept separate from M.escape for readable template code.
  function escapeHTML(value) {
    return esc(value);
  }
})();
