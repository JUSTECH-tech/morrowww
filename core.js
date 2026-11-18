/* =========================================================
   Morrow — core data, helpers and shared utilities
   ========================================================= */

(function () {
  "use strict";

  const M = (window.M = window.M || {});

  M.VERSION = 1;
  M.STORAGE_KEY = "morrow.v1";

  /* ---------- Icon library ---------- */

  const PATHS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
    "check-square": '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    chart: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    settings: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    "arrow-left": '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    "arrow-up-right": '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    "arrow-up": '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    play: '<path d="m7 4 13 8-13 8V4z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    circle: '<circle cx="12" cy="12" r="10"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    sparkles: '<path d="m12 3-1.9 5.1L5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
    quote: '<path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v8c0 2-1 3-3 4"/><path d="M20 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v8c0 2-1 3-3 4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    graduation: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 10v6"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    brain: '<path d="M9.5 2A5 5 0 0 0 4.5 7v.5A4.5 4.5 0 0 0 4 16a5 5 0 0 0 5.5 5c1.5 0 2.5-.5 2.5-2V4c0-1.5-1-2-2.5-2z"/><path d="M14.5 2A5 5 0 0 1 19.5 7v.5a4.5 4.5 0 0 1 .5 8.5 5 5 0 0 1-5.5 5c-1.5 0-2.5-.5-2.5-2V4c0-1.5 1-2 2.5-2z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    "more-horizontal": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    "wifi-off": '<path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 12.55a10 10 0 0 1 5.17-2.39"/><line x1="2" x2="22" y1="2" y2="22"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    "trending-down": '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    command: '<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>',
    "book-marked": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6"/>',
    "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  };

  M.icon = function (name, size) {
    const body = PATHS[name] || PATHS.circle;
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' +
      (size || 18) +
      '" height="' +
      (size || 18) +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body +
      "</svg>"
    );
  };

  /* ---------- Constants ---------- */

  M.DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  M.DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  M.MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  M.SUBJECTS = [
    { name: "General", color: "#8b8d82" },
    { name: "Mathematics", color: "#8b7cf6" },
    { name: "Science", color: "#5ba9e8" },
    { name: "Reading", color: "#56a67d" },
    { name: "Writing", color: "#ef7b57" },
    { name: "Coding", color: "#d9a441" },
    { name: "Work", color: "#e38aac" },
  ];

  M.TASK_TAGS = [
    { name: "Study", color: "#8b7cf6" },
    { name: "Personal", color: "#56a67d" },
    { name: "Health", color: "#ef7b57" },
    { name: "Work", color: "#5ba9e8" },
  ];

  M.HABIT_COLORS = [
    { name: "Violet", value: "#8b7cf6" },
    { name: "Coral", value: "#ef7b57" },
    { name: "Sky", value: "#5ba9e8" },
    { name: "Green", value: "#56a67d" },
    { name: "Pink", value: "#e38aac" },
    { name: "Amber", value: "#d9a441" },
    { name: "Indigo", value: "#7e8ce8" },
    { name: "Slate", value: "#7b8a91" },
  ];

  M.HABIT_ICONS = ["book-open", "activity", "droplet", "moon", "pen", "sparkles", "coffee", "heart", "leaf", "code", "brain", "sun", "briefcase", "target", "music"];

  M.INTERESTS = [
    {
      id: "study",
      label: "Study & learning",
      short: "Study",
      icon: "book-open",
      color: "#8b7cf6",
      habit: { name: "Revise today's notes", icon: "book-open", color: "#8b7cf6", schedule: [1, 2, 3, 4, 5], target: 1 },
    },
    {
      id: "fitness",
      label: "Move your body",
      short: "Fitness",
      icon: "activity",
      color: "#ef7b57",
      habit: { name: "Move for 30 minutes", icon: "activity", color: "#ef7b57", schedule: [0, 1, 2, 3, 4, 5, 6], target: 1 },
    },
    {
      id: "reading",
      label: "Read more",
      short: "Reading",
      icon: "book-marked",
      color: "#5ba9e8",
      habit: { name: "Read 20 pages", icon: "book-open", color: "#5ba9e8", schedule: [0, 1, 2, 3, 4, 5, 6], target: 1 },
    },
    {
      id: "mindfulness",
      label: "Be more present",
      short: "Mindfulness",
      icon: "leaf",
      color: "#56a67d",
      habit: { name: "Take a 10-minute reset", icon: "leaf", color: "#56a67d", schedule: [0, 1, 2, 3, 4, 5, 6], target: 1 },
    },
    {
      id: "creativity",
      label: "Create something",
      short: "Creativity",
      icon: "pen",
      color: "#e38aac",
      habit: { name: "Make something small", icon: "pen", color: "#e38aac", schedule: [0, 1, 2, 3, 4, 5, 6], target: 1 },
    },
    {
      id: "sleep",
      label: "Sleep better",
      short: "Better sleep",
      icon: "moon",
      color: "#7e8ce8",
      habit: { name: "Phone down by 10 pm", icon: "moon", color: "#7e8ce8", schedule: [0, 1, 2, 3, 4, 5, 6], target: 1 },
    },
  ];

  M.ROLES = [
    { id: "student", label: "Student", icon: "graduation" },
    { id: "professional", label: "Professional", icon: "briefcase" },
    { id: "personal", label: "For myself", icon: "user" },
    { id: "creator", label: "Creator", icon: "palette" },
  ];

  M.QUOTES = [
    { text: "Small steps, taken consistently, become a life that feels like yours.", author: "Morrow" },
    { text: "You do not have to see the whole staircase. Just take the first step.", author: "Martin Luther King Jr." },
    { text: "It is not what we do once in a while that shapes our lives, but what we do consistently.", author: "Tony Robbins" },
    { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "You are allowed to be both a masterpiece and a work in progress.", author: "Sophia Bush" },
    { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
    { text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
    { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
    { text: "The quieter you become, the more you are able to hear.", author: "Ram Dass" },
    { text: "Almost everything worth doing is better with a little patience.", author: "Morrow" },
  ];

  /* ---------- Date helpers ---------- */

  M.pad = function (n) {
    return String(n).padStart(2, "0");
  };

  M.toISO = function (date) {
    const d = date || new Date();
    return d.getFullYear() + "-" + M.pad(d.getMonth() + 1) + "-" + M.pad(d.getDate());
  };

  M.parseISO = function (iso) {
    if (!iso) return new Date();
    const parts = String(iso).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  M.todayISO = function () {
    return M.toISO(new Date());
  };

  M.addDays = function (iso, days) {
    const d = M.parseISO(iso);
    d.setDate(d.getDate() + days);
    return M.toISO(d);
  };

  M.diffDays = function (a, b) {
    return Math.round((M.parseISO(a) - M.parseISO(b)) / 86400000);
  };

  M.dayIndex = function (iso) {
    return M.parseISO(iso).getDay();
  };

  M.startOfWeek = function (iso, weekStart) {
    const start = weekStart == null ? M.state.profile.weekStart : weekStart;
    const day = M.dayIndex(iso);
    let offset = day - start;
    if (offset < 0) offset += 7;
    return M.addDays(iso, -offset);
  };

  M.getWeekDays = function (iso, weekStart) {
    const start = M.startOfWeek(iso || M.todayISO(), weekStart);
    return Array.from({ length: 7 }, function (_, i) {
      return M.addDays(start, i);
    });
  };

  M.formatDate = function (iso, style) {
    const d = M.parseISO(iso);
    if (style === "long") {
      return M.DAYS_LONG[d.getDay()] + ", " + M.MONTHS[d.getMonth()] + " " + d.getDate();
    }
    if (style === "full") {
      return M.DAYS_LONG[d.getDay()] + ", " + M.MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }
    if (style === "short") {
      return M.MONTHS[d.getMonth()].slice(0, 3) + " " + d.getDate();
    }
    if (style === "month") {
      return M.MONTHS[d.getMonth()] + " " + d.getFullYear();
    }
    return M.MONTHS[d.getMonth()] + " " + d.getDate();
  };

  M.formatTime = function (dateLike) {
    const d = new Date(dateLike);
    let hours = d.getHours();
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return hours + ":" + M.pad(d.getMinutes()) + " " + suffix;
  };

  M.isToday = function (iso) {
    return iso === M.todayISO();
  };

  M.isFuture = function (iso) {
    return iso > M.todayISO();
  };

  M.dateLabel = function (iso) {
    if (!iso) return "No date";
    const diff = M.diffDays(iso, M.todayISO());
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    if (diff < -1) return M.formatDate(iso, "short") + " · Overdue";
    if (diff > 1 && diff <= 6) return M.DAYS_LONG[M.dayIndex(iso)];
    return M.formatDate(iso, "short");
  };

  M.dueLabel = function (iso) {
    if (!iso) return { text: "No date", cls: "" };
    const diff = M.diffDays(iso, M.todayISO());
    if (diff < 0) return { text: "Overdue · " + M.formatDate(iso, "short"), cls: "overdue" };
    if (diff === 0) return { text: "Today", cls: "" };
    if (diff === 1) return { text: "Tomorrow", cls: "" };
    return { text: M.formatDate(iso, "short"), cls: "" };
  };

  M.timeAgo = function (timestamp) {
    const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return days + "d ago";
    return M.formatDate(M.toISO(new Date(timestamp)), "short");
  };

  M.greeting = function () {
    const hour = new Date().getHours();
    if (hour < 5) return "Still up";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  M.firstName = function (name) {
    const clean = String(name || "").trim();
    if (!clean) return "friend";
    return clean.split(/\s+/)[0];
  };

  M.initials = function (name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "M";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  M.escape = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  M.uid = function (prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  };

  M.clamp = function (n, min, max) {
    return Math.max(min, Math.min(max, n));
  };

  M.range = function (n) {
    return Array.from({ length: n }, function (_, i) {
      return i;
    });
  };

  M.quoteForToday = function () {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const day = Math.floor((new Date() - start) / 86400000);
    return M.QUOTES[day % M.QUOTES.length];
  };

  M.scheduleLabel = function (schedule) {
    const days = Array.from(new Set((schedule || []).slice().sort())).join(",");
    if (days === "0,1,2,3,4,5,6") return "Every day";
    if (days === "1,2,3,4,5") return "Weekdays";
    if (days === "0,6") return "Weekends";
    if (!days) return "No days selected";
    return (schedule || [])
      .slice()
      .sort()
      .map(function (d) {
        return M.DAYS[d];
      })
      .join(", ");
  };

  M.subjectColor = function (name) {
    const found = M.SUBJECTS.find(function (s) {
      return s.name === name;
    });
    if (found) return found.color;
    return M.HABIT_COLORS[Math.abs(String(name).split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0)) % M.HABIT_COLORS.length].value;
  };

  M.tagColor = function (name) {
    const found = M.TASK_TAGS.find(function (t) {
      return t.name === name;
    });
    return found ? found.color : "#7b8a91";
  };

  /* ---------- State ---------- */

  M.defaultState = function () {
    return {
      version: M.VERSION,
      profile: {
        name: "",
        role: "personal",
        onboarded: false,
        focusGoal: 120,
        theme: "system",
        accent: "lime",
        weekStart: 1,
        defaultFocus: 25,
        createdAt: new Date().toISOString(),
      },
      habits: [],
      tasks: [],
      sessions: [],
      timer: {
        mode: "focus",
        duration: 1500,
        remaining: 1500,
        running: false,
        endsAt: null,
        subject: "General",
        startedAt: null,
        completedAt: null,
      },
      meta: {
        lastOpen: null,
        lastSaved: null,
        installDismissed: false,
      },
    };
  };

  M.loadState = function () {
    let loaded = null;
    try {
      const raw = localStorage.getItem(M.STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch (error) {
      console.warn("Morrow could not read local data.", error);
    }

    const base = M.defaultState();
    if (!loaded || typeof loaded !== "object") {
      M.state = base;
      return M.state;
    }

    const state = Object.assign({}, base, loaded);
    state.profile = Object.assign({}, base.profile, loaded.profile || {});
    state.timer = Object.assign({}, base.timer, loaded.timer || {});
    state.meta = Object.assign({}, base.meta, loaded.meta || {});
    state.habits = Array.isArray(loaded.habits) ? loaded.habits : [];
    state.tasks = Array.isArray(loaded.tasks) ? loaded.tasks : [];
    state.sessions = Array.isArray(loaded.sessions) ? loaded.sessions : [];

    state.habits.forEach(function (habit) {
      if (!habit.schedule || !Array.isArray(habit.schedule)) habit.schedule = [0, 1, 2, 3, 4, 5, 6];
      if (!habit.logs || typeof habit.logs !== "object") habit.logs = {};
      habit.target = M.clamp(Number(habit.target) || 1, 1, 20);
      habit.archived = Boolean(habit.archived);
    });

    state.tasks.forEach(function (task) {
      task.done = Boolean(task.done);
    });

    state.sessions = state.sessions.filter(function (session) {
      return session && Number(session.seconds) > 0;
    });

    M.state = state;
    return state;
  };

  M.save = function () {
    if (!M.state) return;
    M.state.meta.lastSaved = Date.now();
    try {
      localStorage.setItem(M.STORAGE_KEY, JSON.stringify(M.state));
    } catch (error) {
      console.warn("Morrow could not save local data.", error);
      if (typeof M.toast === "function") {
        M.toast("Your browser could not save changes. Check available storage.", { icon: "info" });
      }
    }
  };

  M.loadState();

  M.ui = M.ui || {
    view: "today",
    habitFilter: "all",
    taskFilter: "all",
    onboardingStep: 0,
    onboardingDraft: null,
    commandFocus: 0,
    timerJustFinished: false,
  };

  /* ---------- Habits ---------- */

  M.isScheduled = function (habit, iso) {
    return (habit.schedule || []).indexOf(M.dayIndex(iso)) !== -1;
  };

  M.habitCount = function (habit, iso) {
    return Number((habit.logs && habit.logs[iso]) || 0);
  };

  M.isHabitDone = function (habit, iso) {
    return M.habitCount(habit, iso) >= (Number(habit.target) || 1);
  };

  M.habitTargetLabel = function (habit) {
    const target = Number(habit.target) || 1;
    const schedule = M.scheduleLabel(habit.schedule);
    if (target > 1) return target + "× · " + schedule;
    return schedule;
  };

  M.habitStreak = function (habit, endDate) {
    const end = endDate || M.todayISO();
    let cursor = end;

    if (M.isScheduled(habit, end) && !M.isHabitDone(habit, end)) {
      cursor = M.addDays(end, -1);
    }

    let streak = 0;
    for (let i = 0; i < 730; i += 1) {
      if (M.isScheduled(habit, cursor)) {
        if (M.isHabitDone(habit, cursor)) {
          streak += 1;
        } else {
          break;
        }
      }
      cursor = M.addDays(cursor, -1);
    }
    return streak;
  };

  M.habitBestStreak = function (habit) {
    const today = M.todayISO();
    const earliest = habit.createdAt ? String(habit.createdAt).slice(0, 10) : M.addDays(today, -180);
    const start = earliest > M.addDays(today, -730) ? earliest : M.addDays(today, -730);
    let current = 0;
    let best = 0;
    let cursor = start;
    let guard = 0;

    while (cursor <= today && guard < 740) {
      if (M.isScheduled(habit, cursor)) {
        if (M.isHabitDone(habit, cursor)) {
          current += 1;
          if (current > best) best = current;
        } else if (cursor !== today) {
          current = 0;
        }
      }
      cursor = M.addDays(cursor, 1);
      guard += 1;
    }

    return Math.max(best, M.habitStreak(habit));
  };

  M.habitCompletionRate = function (habit, days) {
    const span = days || 30;
    const today = M.todayISO();
    let scheduled = 0;
    let done = 0;
    for (let i = 0; i < span; i += 1) {
      const iso = M.addDays(today, -i);
      if (habit.createdAt && String(habit.createdAt).slice(0, 10) > iso) continue;
      if (!M.isScheduled(habit, iso)) continue;
      scheduled += 1;
      if (M.isHabitDone(habit, iso)) done += 1;
    }
    return {
      scheduled: scheduled,
      done: done,
      percent: scheduled ? Math.round((done / scheduled) * 100) : 0,
    };
  };

  M.toggleHabitCount = function (habit, iso) {
    if (!habit || M.isFuture(iso)) return { completed: false, count: 0 };
    const target = Number(habit.target) || 1;
    let count = M.habitCount(habit, iso);
    if (count >= target) {
      delete habit.logs[iso];
      count = 0;
    } else {
      count += 1;
      habit.logs[iso] = count;
    }
    M.save();
    return { completed: count >= target, count: count };
  };

  M.setHabitCompletion = function (habit, iso, complete) {
    if (!habit || M.isFuture(iso)) return;
    if (complete) {
      habit.logs[iso] = Number(habit.target) || 1;
    } else {
      delete habit.logs[iso];
    }
    M.save();
  };

  M.activeHabits = function () {
    return M.state.habits.filter(function (habit) {
      return !habit.archived;
    });
  };

  M.habitsForDate = function (iso) {
    return M.activeHabits().filter(function (habit) {
      if (habit.createdAt) {
        const created = M.toISO(new Date(habit.createdAt));
        if (created && created > iso) return false;
      }
      return M.isScheduled(habit, iso);
    });
  };

  M.habitCompletionForDate = function (iso) {
    const habits = M.habitsForDate(iso);
    const done = habits.filter(function (habit) {
      return M.isHabitDone(habit, iso);
    }).length;
    return {
      total: habits.length,
      done: done,
      percent: habits.length ? Math.round((done / habits.length) * 100) : 0,
    };
  };

  M.bestCurrentStreak = function () {
    return M.activeHabits().reduce(function (best, habit) {
      return Math.max(best, M.habitStreak(habit));
    }, 0);
  };

  M.bestEverHabitStreak = function () {
    return M.state.habits.reduce(function (best, habit) {
      return Math.max(best, M.habitBestStreak(habit));
    }, 0);
  };

  M.habitCompletionAverage = function (days) {
    const span = days || 30;
    const today = M.todayISO();
    let scheduled = 0;
    let done = 0;
    for (let i = 0; i < span; i += 1) {
      const iso = M.addDays(today, -i);
      const day = M.habitCompletionForDate(iso);
      scheduled += day.total;
      done += day.done;
    }
    return {
      scheduled: scheduled,
      done: done,
      percent: scheduled ? Math.round((done / scheduled) * 100) : 0,
    };
  };

  M.onboardingMyHabits = function () {
    const today = M.todayISO();
    return M.activeHabits().filter(function (habit) {
      return !habit.createdAt || String(habit.createdAt).slice(0, 10) <= today;
    });
  };

  M.createHabit = function (payload) {
    const now = new Date().toISOString();
    return {
      id: M.uid("habit"),
      name: String(payload.name || "New habit").trim(),
      icon: payload.icon || "sparkles",
      color: payload.color || "#8b7cf6",
      schedule: payload.schedule && payload.schedule.length ? payload.schedule.slice() : [0, 1, 2, 3, 4, 5, 6],
      target: M.clamp(Number(payload.target) || 1, 1, 20),
      createdAt: now,
      archived: false,
      logs: payload.logs || {},
    };
  };

  M.createStarterHabits = function (interestIds) {
    const selected = interestIds && interestIds.length ? interestIds : ["study", "fitness", "reading", "mindfulness"];
    return selected
      .map(function (id) {
        return M.INTERESTS.find(function (item) {
          return item.id === id;
        });
      })
      .filter(Boolean)
      .slice(0, 6)
      .map(function (interest) {
        const source = interest.habit;
        return M.createHabit({
          name: source.name,
          icon: source.icon,
          color: source.color,
          schedule: source.schedule,
          target: source.target,
        });
      });
  };

  /* ---------- Tasks ---------- */

  M.openTasks = function () {
    return M.state.tasks.filter(function (task) {
      return !task.done;
    });
  };

  M.priorityWeight = function (priority) {
    if (priority === "high") return 0;
    if (priority === "medium") return 1;
    return 2;
  };

  M.sortTasks = function (tasks) {
    return tasks.slice().sort(function (a, b) {
      const dueA = a.due || "9999-12-31";
      const dueB = b.due || "9999-12-31";
      if (dueA !== dueB) return dueA < dueB ? -1 : 1;
      const priority = M.priorityWeight(a.priority) - M.priorityWeight(b.priority);
      if (priority !== 0) return priority;
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
  };

  M.tasksForDate = function (iso) {
    return M.sortTasks(
      M.state.tasks.filter(function (task) {
        return !task.done && task.due === iso;
      })
    );
  };

  M.overdueTasks = function () {
    const today = M.todayISO();
    return M.sortTasks(
      M.state.tasks.filter(function (task) {
        return !task.done && task.due && task.due < today;
      })
    );
  };

  M.upNextTasks = function (limit) {
    const today = M.todayISO();
    const active = M.sortTasks(
      M.state.tasks.filter(function (task) {
        return !task.done && (!task.due || task.due <= today);
      })
    );
    const upcoming = M.sortTasks(
      M.state.tasks.filter(function (task) {
        return !task.done && task.due && task.due > today;
      })
    );
    return active.concat(upcoming).slice(0, limit || 4);
  };

  M.taskStats = function () {
    const today = M.todayISO();
    const open = M.openTasks();
    const dueToday = open.filter(function (task) {
      return task.due === today;
    }).length;
    const overdue = open.filter(function (task) {
      return task.due && task.due < today;
    }).length;
    const doneToday = M.state.tasks.filter(function (task) {
      return task.done && task.completedAt && M.toISO(new Date(task.completedAt)) === today;
    }).length;
    return {
      open: open.length,
      dueToday: dueToday,
      overdue: overdue,
      doneToday: doneToday,
    };
  };

  M.createTask = function (payload) {
    return {
      id: M.uid("task"),
      title: String(payload.title || "Untitled task").trim(),
      notes: String(payload.notes || "").trim(),
      due: payload.due || M.todayISO(),
      priority: payload.priority || "medium",
      tag: payload.tag || "Personal",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
  };

  M.starterTasks = function (role) {
    const today = M.todayISO();
    const tomorrow = M.addDays(today, 1);
    const map = {
      student: [
        { title: "Outline this week's study plan", due: today, priority: "high", tag: "Study" },
        { title: "Review today's lecture notes", due: today, priority: "medium", tag: "Study" },
        { title: "Practise five problems", due: tomorrow, priority: "medium", tag: "Study" },
      ],
      professional: [
        { title: "Choose your top three priorities", due: today, priority: "high", tag: "Work" },
        { title: "Block 50 minutes for deep work", due: today, priority: "medium", tag: "Work" },
        { title: "Clear your inbox to zero", due: tomorrow, priority: "low", tag: "Work" },
      ],
      creator: [
        { title: "Sketch ten rough ideas", due: today, priority: "high", tag: "Personal" },
        { title: "Collect three references", due: today, priority: "medium", tag: "Study" },
        { title: "Share one small piece", due: tomorrow, priority: "low", tag: "Personal" },
      ],
      personal: [
        { title: "Move your body for 20 minutes", due: today, priority: "medium", tag: "Health" },
        { title: "Tidy one small space", due: today, priority: "low", tag: "Personal" },
        { title: "Read before bed", due: tomorrow, priority: "low", tag: "Personal" },
      ],
    };
    return (map[role] || map.personal).map(function (task) {
      return M.createTask(task);
    });
  };

  M.taskGroups = function (filter) {
    const today = M.todayISO();
    const open = M.openTasks();
    const done = M.state.tasks.filter(function (task) {
      return task.done;
    });
    const overdue = M.sortTasks(open.filter(function (t) { return t.due && t.due < today; }));
    const dueToday = M.sortTasks(open.filter(function (t) { return t.due === today || !t.due; }));
    const upcoming = M.sortTasks(open.filter(function (t) { return t.due && t.due > today; }));
    const completed = done
      .slice()
      .sort(function (a, b) {
        return String(b.completedAt || "").localeCompare(String(a.completedAt || ""));
      })
      .slice(0, 30);

    if (filter === "today") return [{ key: "today", label: "Today", tasks: dueToday.concat(overdue).filter(function (t, i, arr) { return arr.findIndex(function (x) { return x.id === t.id; }) === i; }) }];
    if (filter === "upcoming") return [{ key: "upcoming", label: "Upcoming", tasks: upcoming }];
    if (filter === "done") return [{ key: "completed", label: "Completed", tasks: completed }];

    return [
      { key: "overdue", label: "Overdue", tasks: overdue },
      { key: "today", label: "Today", tasks: dueToday },
      { key: "upcoming", label: "Upcoming", tasks: upcoming },
      { key: "completed", label: "Recently completed", tasks: completed },
    ].filter(function (group) {
      return group.tasks.length;
    });
  };

  /* ---------- Focus sessions ---------- */

  M.sessionsForDate = function (iso) {
    return M.state.sessions.filter(function (session) {
      return M.toISO(new Date(session.endedAt || session.startedAt)) === iso;
    });
  };

  M.focusSecondsOn = function (iso) {
    return M.sessionsForDate(iso).reduce(function (total, session) {
      return total + (Number(session.seconds) || 0);
    }, 0);
  };

  M.focusSecondsBetween = function (startISO, endISO) {
    const start = M.parseISO(startISO).getTime();
    const end = M.parseISO(endISO).getTime() + 86399999;
    return M.state.sessions.reduce(function (total, session) {
      const time = new Date(session.endedAt || session.startedAt).getTime();
      return time >= start && time <= end ? total + (Number(session.seconds) || 0) : total;
    }, 0);
  };

  M.todayFocusSeconds = function () {
    return M.focusSecondsOn(M.todayISO());
  };

  M.weekFocusSeconds = function () {
    const days = M.getWeekDays(M.todayISO());
    return days.reduce(function (total, iso) {
      return total + M.focusSecondsOn(iso);
    }, 0);
  };

  M.lastWeekFocusSeconds = function () {
    const thisWeek = M.getWeekDays(M.todayISO());
    const start = M.addDays(thisWeek[0], -7);
    const end = M.addDays(start, 6);
    return M.focusSecondsBetween(start, end);
  };

  M.recentSessions = function (limit) {
    return M.state.sessions
      .slice()
      .sort(function (a, b) {
        return new Date(b.endedAt || b.startedAt) - new Date(a.endedAt || a.startedAt);
      })
      .slice(0, limit || 5);
  };

  M.sessionsTodayCount = function () {
    return M.sessionsForDate(M.todayISO()).length;
  };

  M.focusGoalPercent = function () {
    const goal = Math.max(1, Number(M.state.profile.focusGoal) || 120);
    return Math.min(100, Math.round((M.todayFocusSeconds() / 60 / goal) * 100));
  };

  M.formatDuration = function (seconds, options) {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    if (options && options.clock) {
      return M.pad(Math.floor(s / 60)) + ":" + M.pad(s % 60);
    }
    if (s < 60) return s + "s";
    if (!hours) return minutes + "m";
    if (!minutes) return hours + "h";
    return hours + "h " + minutes + "m";
  };

  M.formatMinutes = function (minutes) {
    return M.formatDuration((Number(minutes) || 0) * 60);
  };

  M.addFocusSession = function (payload) {
    const seconds = Math.max(60, Math.round(Number(payload.seconds) || 0));
    const session = {
      id: M.uid("session"),
      subject: payload.subject || "General",
      seconds: seconds,
      startedAt: payload.startedAt || new Date(Date.now() - seconds * 1000).toISOString(),
      endedAt: payload.endedAt || new Date().toISOString(),
      source: payload.source || "timer",
    };
    M.state.sessions.push(session);
    M.save();
    return session;
  };

  M.subjectBreakdown = function (days) {
    const span = days || 30;
    const start = M.addDays(M.todayISO(), -(span - 1));
    const startTime = M.parseISO(start).getTime();
    const totals = {};
    M.state.sessions.forEach(function (session) {
      if (new Date(session.endedAt || session.startedAt).getTime() < startTime) return;
      const subject = session.subject || "General";
      totals[subject] = (totals[subject] || 0) + (Number(session.seconds) || 0);
    });
    return Object.keys(totals)
      .map(function (name) {
        return { name: name, seconds: totals[name], color: M.subjectColor(name) };
      })
      .sort(function (a, b) {
        return b.seconds - a.seconds;
      });
  };

  /* ---------- Onboarding + starter content ---------- */

  M.seedWorkspace = function (options) {
    const profile = M.state.profile;
    profile.name = String(options.name || "").trim() || "Friend";
    profile.role = options.role || "personal";
    profile.focusGoal = M.clamp(Number(options.focusGoal) || 120, 15, 480);
    profile.onboarded = true;

    if (options.seed !== false) {
      if (!M.state.habits.length) {
        M.state.habits = M.createStarterHabits(options.interests);
      }
      if (!M.state.tasks.length) {
        M.state.tasks = M.starterTasks(profile.role);
      }
    }

    M.state.meta.lastOpen = new Date().toISOString();
    M.save();
  };

  M.exportPayload = function () {
    return {
      app: "Morrow",
      version: M.VERSION,
      exportedAt: new Date().toISOString(),
      data: M.state,
    };
  };

  M.importPayload = function (payload) {
    if (!payload || typeof payload !== "object") throw new Error("Invalid backup file.");
    const data = payload.data && payload.data.habits ? payload.data : payload;
    if (!data || !Array.isArray(data.habits) || !Array.isArray(data.tasks)) {
      throw new Error("This file does not look like a Morrow backup.");
    }
    const base = M.defaultState();
    const next = Object.assign({}, base, data);
    next.profile = Object.assign({}, base.profile, data.profile || {});
    next.timer = Object.assign({}, base.timer, data.timer || {});
    next.meta = Object.assign({}, base.meta, data.meta || {});
    next.habits = data.habits;
    next.tasks = data.tasks;
    next.sessions = Array.isArray(data.sessions) ? data.sessions : [];
    next.profile.onboarded = true;
    M.state = next;
    M.save();
  };

  /* ---------- Theme ---------- */

  M.resolveTheme = function (theme) {
    if (theme === "system") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme === "dark" ? "dark" : "light";
  };

  M.applyTheme = function (profile) {
    const p = profile || M.state.profile;
    document.documentElement.setAttribute("data-theme", M.resolveTheme(p.theme || "system"));
    document.documentElement.setAttribute("data-accent", p.accent || "lime");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", M.resolveTheme(p.theme || "system") === "dark" ? "#12130f" : "#f4f1e9");
    }
  };

  M.cycleTheme = function () {
    const current = M.state.profile.theme || "system";
    const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
    M.state.profile.theme = next;
    M.applyTheme();
    M.save();
    return next;
  };

  /* ---------- Greeting / headline helpers ---------- */

  M.dayHeadline = function () {
    const completion = M.habitCompletionForDate(M.todayISO());
    const name = M.firstName(M.state.profile.name);
    if (!M.activeHabits().length) {
      return { lead: "A fresh page.", accent: "Start small." };
    }
    if (completion.total && completion.done === completion.total) {
      return { lead: "Everything done.", accent: "Beautifully done." };
    }
    if (completion.done > 0) {
      return { lead: "Keep your rhythm,", accent: name + "." };
    }
    return { lead: "Make today", accent: "yours, " + name + "." };
  };

  M.insightHeadline = function () {
    const week = M.weekFocusSeconds();
    const prev = M.lastWeekFocusSeconds();
    const habitAvg = M.habitCompletionAverage(7);
    if (!M.state.sessions.length && !M.habitCompletionAverage(7).scheduled) {
      return {
        title: "Your first pattern is waiting to be made.",
        body: "Tick off one habit or start a focus session today. After a few days, this space will fill with the story of your progress.",
      };
    }
    if (week > prev && prev > 0) {
      return {
        title: "You're building momentum.",
        body: "You've focused " + M.formatDuration(week) + " this week — " + M.formatDuration(Math.max(0, week - prev)) + " more than last week. Your habit rhythm is at " + habitAvg.percent + "%.",
      };
    }
    if (habitAvg.percent >= 70) {
      return {
        title: "Consistency looks good on you.",
        body: "You've completed " + habitAvg.percent + "% of your scheduled habits over the last week. That's " + habitAvg.done + " small promises kept.",
      };
    }
    return {
      title: "Progress is still progress.",
      body: "You've focused " + M.formatDuration(week) + " this week and kept " + habitAvg.done + " habits on track. Pick one small thing for tomorrow — that's enough.",
    };
  };

  M.storageSize = function () {
    try {
      return new Blob([JSON.stringify(M.state)]).size;
    } catch (error) {
      return JSON.stringify(M.state).length;
    }
  };

})();
