/* ============================================================
   KARELA WEB DEMO
   ------------------------------------------------------------
   The app, rebuilt for the browser from the app's own screens
   (app/drawer/*, components/*). It captures how the app looks
   and behaves; it isn't a pixel copy. Data comes from
   js/demo-data.js and lives in memory only: nothing is saved,
   nothing is sent, and reloading the page starts over.

   Modules, in order:
     1  helpers (DOM, SVG, icons, formatting)
     2  state
     3  shell (status bar, view, dock, drawer, sheets, toasts)
     4  shared pieces (buttons, cards, headers)
     5  screens: home, quests, ani, squad, shop, scout pass,
        progress, calendar, profile, customize, summary
     6  the map and the run
     7  the page around the phone (full screen, try list,
        weather switch, reset)

   All DOM is built with createElement / textContent.
   ============================================================ */
(function () {
  "use strict";

  var D = window.KARELA_DEMO;
  var root = document.querySelector("[data-app]");
  if (!D || !root) return;
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================
     1. HELPERS
     ========================================================== */

  /** h("div", { class, text, on: { click }, attrs... }, [children]) */
  function h(tag, props, kids) {
    var el = document.createElement(tag);
    applyProps(el, props);
    append(el, kids);
    return el;
  }

  var SVGNS = "http://www.w3.org/2000/svg";
  function s(tag, props, kids) {
    var el = document.createElementNS(SVGNS, tag);
    applyProps(el, props);
    append(el, kids);
    return el;
  }

  function applyProps(el, props) {
    if (!props) return;
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === undefined || v === null || v === false) return;
      if (k === "class") el.setAttribute("class", v);
      else if (k === "text") el.textContent = v;
      else if (k === "on") Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === "style") Object.keys(v).forEach(function (p) { el.style.setProperty(p, v[p]); });
      else el.setAttribute(k, v === true ? "" : v);
    });
  }

  function append(el, kids) {
    if (kids === undefined || kids === null || kids === false) return;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (k) {
      if (k === undefined || k === null || k === false) return;
      el.appendChild(typeof k === "string" || typeof k === "number" ? document.createTextNode(String(k)) : k);
    });
  }

  // --- Icons ---
  // Karela's own icons: the same paths as components/icons/KarelaIcon.tsx.
  var FLAME = "M12 2c.8 3.6 6.2 5.9 6.2 11.2a6.2 6.2 0 0 1-12.4 0c0-2.7 1.3-4.7 3-5.9.3 1.9 1.2 3.3 3.1 3.7-.6-3.9 0-6.7.1-9z";
  var KICON = {
    gem: { l: ["M6.5 4h11L22 9.5 12 21 2 9.5z", "M2 9.5h20", "M9 4l3 5.5L15 4", "M7.2 9.5 12 21l4.8-11.5"], f: ["M6.5 4h11L22 9.5 12 21 2 9.5z"] },
    streak: { l: [FLAME], f: ["M12 12.6c2 1.5 3.1 2.9 3.1 4.4a3.1 3.1 0 0 1-6.2 0c0-1.5 1.1-2.9 3.1-4.4z"] },
    freeze: { l: ["M12 2.5v19", "M3.8 7.2l16.4 9.6", "M3.8 16.8l16.4-9.6", "M9.6 3.9 12 6.3l2.4-2.4", "M9.6 20.1 12 17.7l2.4 2.4"], f: ["M12 8.6 15 10.3v3.4L12 15.4 9 13.7v-3.4z"] },
    shield: { l: ["M12 2.6 4.2 5.6v6c0 5 3.3 8.4 7.8 9.8 4.5-1.4 7.8-4.8 7.8-9.8v-6z", "M8.6 12.2l2.4 2.4 4.4-4.6"], f: ["M12 2.6 4.2 5.6v6c0 5 3.3 8.4 7.8 9.8 4.5-1.4 7.8-4.8 7.8-9.8v-6z"] },
    boost: { l: ["M6 12.5 12 6.5l6 6", "M6 18.5l6-6 6 6"], f: ["M12 6.5 18 12.5 12 12.5 6 12.5z"] },
    territory: { l: ["M6.5 21V3.5", "M6.5 4.5h11L15 8l2.5 3.5h-11", "M3 21h8"], f: ["M6.5 4.5h11L15 8l2.5 3.5h-11z"] },
    squad: {
      l: ["M7.5 20.5a4.5 4.5 0 0 1 9 0", "M1.8 19.5a3.8 3.8 0 0 1 5.4-3.4", "M22.2 19.5a3.8 3.8 0 0 0-5.4-3.4",
        "M12 6.2m-2.8 0a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0-5.6 0", "M5.4 10.6m-2.1 0a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0-4.2 0",
        "M18.6 10.6m-2.1 0a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0-4.2 0"],
      f: ["M12 6.2m-2.8 0a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0-5.6 0"]
    },
    guild: { l: ["M5.5 2.8h13v17.4L12 16.3l-6.5 3.9z", "M9 8.2l3 3 3-3"], f: ["M5.5 2.8h13v17.4L12 16.3l-6.5 3.9z"] },
    crown: { l: ["M3 8l4.6 4.2L12 5l4.4 7.2L21 8l-2 11H5z"], f: ["M3 8l4.6 4.2L12 5l4.4 7.2L21 8l-2 11H5z"] },
    star: { l: ["M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6-4.4-4.1 6-.8z"], f: ["M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6-4.4-4.1 6-.8z"] },
    trail: { l: ["M3.5 19.5c3 0 3.2-5.2 6.3-5.2s3 4 6 4 2.5-8.6 4.6-12.8"], d: [[20.4, 5.5, 1.8]], f: ["M3.5 19.5m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0"] },
    frame: { l: ["M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0", "M12 10m-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0", "M7.4 18.2a5 5 0 0 1 9.2 0"], f: ["M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0"] },
    xp: { l: ["M13.2 2.5 5.2 13.2h6l-1 8.3 8.1-10.8h-6.1z"], f: ["M13.2 2.5 5.2 13.2h6l-1 8.3 8.1-10.8h-6.1z"] },
    ghost: { l: ["M5 21V11a7 7 0 0 1 14 0v10l-2.4-1.6L14.3 21 12 19.4 9.7 21l-2.3-1.6z"], f: ["M5 21V11a7 7 0 0 1 14 0v10l-2.4-1.6L14.3 21 12 19.4 9.7 21l-2.3-1.6z"], d: [[9.5, 11, 1.2], [14.5, 11, 1.2]] },
    civic: { l: ["M12 21.8s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z", "M12 6.2v4.4"], f: ["M12 21.8s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z"], d: [[12, 13.4, 1.1]] },
    ticket: { l: ["M3 7h18v3.2a1.8 1.8 0 0 0 0 3.6V17H3v-3.2a1.8 1.8 0 0 0 0-3.6z", "M14.5 7.5v1.6", "M14.5 11.2v1.6", "M14.5 14.9v1.6"], f: ["M3 7h18v3.2a1.8 1.8 0 0 0 0 3.6V17H3v-3.2a1.8 1.8 0 0 0 0-3.6z"] },
    medal: { l: ["M12 15m-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0", "M8.2 2.8 10.6 9.7", "M15.8 2.8 13.4 9.7", "M8.2 2.8h7.6"], f: ["M12 15m-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0"] }
  };

  // Standard controls, drawn in the same line style (the app uses Ionicons).
  var UICON = {
    home: ["M3 11 12 4l9 7", "M5.5 9.5V20h13V9.5", "M10 20v-5.5h4V20"],
    play: { fill: "M8 5.5v13l10.5-6.5z" },
    pause: ["M8.5 5.5v13", "M15.5 5.5v13"],
    stop: { fill: "M7 7h10v10H7z" },
    menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
    back: ["M15 5l-7 7 7 7"],
    fwd: ["M9 5l7 7-7 7"],
    close: ["M6 6l12 12", "M18 6 6 18"],
    map: ["M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z", "M9 4v13.5", "M15 6.5V20"],
    chat: ["M4 5h16v11H9.5L5 19.5V16H4z", "M8 10h.01", "M12 10h.01", "M16 10h.01"],
    calendar: ["M4 6h16v14H4z", "M4 10h16", "M8 3.5v4", "M16 3.5v4"],
    stats: ["M5 20v-7", "M12 20V5", "M19 20v-10"],
    settings: ["M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6", "M12 2.8v3", "M12 18.2v3", "M2.8 12h3", "M18.2 12h3", "M5.5 5.5l2.1 2.1", "M16.4 16.4l2.1 2.1", "M5.5 18.5l2.1-2.1", "M16.4 7.6l2.1-2.1"],
    logout: ["M10 4H5v16h5", "M14 8l4 4-4 4", "M18 12H9"],
    camera: ["M4 8h3.5L9 5.5h6L16.5 8H20v11H4z", "M12 10.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6"],
    compass: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M14.8 9.2 13 13l-3.8 1.8L11 11z"],
    flag: ["M6 21V4", "M6 4.5h11l-2.5 4 2.5 4H6"],
    flash: ["M13 3 5 13.5h6l-1 7.5 8-10.5h-6z"],
    send: ["M4 12 20 4l-4 16-4-7z", "M12 13l8-9"],
    refresh: ["M19 12a7 7 0 1 1-2.1-5", "M19 4.5V8h-3.5"],
    check: ["M5 12.5l4.5 4.5L19 7.5"],
    checkCircle: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M8 12.3l2.8 2.8L16 9.5"],
    walk: ["M13 3.6a1.7 1.7 0 1 0 0 .1", "M12 8l-2.3 5.2 3 2 1 5", "M10.3 10.5 7 12", "M12.4 9.4l2.7 3 2.6-.6", "M9.7 13.3 7.6 19.5"],
    storm: ["M7 15.5a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5 3.3 3.3 0 0 1-.5 6.5", "M12.5 13.5 10.5 17.5h3l-2 4"],
    gift: ["M4 10.5h16V20H4z", "M3 7.5h18v3H3z", "M12 7.5V20", "M12 7.5c-1.5-3.2-5-3.2-5-1.2s3 1.2 5 1.2c2 0 5 .8 5-1.2s-3.5-2-5 1.2"],
    share: ["M12 3.5v11", "M8 7.5l4-4 4 4", "M5 12v8h14v-8"],
    time: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M12 7.5V12l3 2"],
    speed: ["M4.5 17a8 8 0 1 1 15 0", "M12 13l4-4"],
    pin: ["M12 21.5s6.5-6 6.5-11.2a6.5 6.5 0 0 0-13 0c0 5.2 6.5 11.2 6.5 11.2z", "M12 8a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 1 0 0-4.6"],
    trash: ["M5 7h14", "M9.5 7V4.5h5V7", "M6.5 7l1 13h9l1-13"],
    water: ["M12 3.5s6 6.5 6 10.5a6 6 0 0 1-12 0c0-4 6-10.5 6-10.5z"],
    warning: ["M12 4 2.5 20h19z", "M12 10v4.5", "M12 17.3v.2"],
    construct: ["M4 20h16", "M8 20 11 6h2l3 14", "M9.3 14h5.4", "M10.2 10h3.6"],
    alert: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M12 7.5v5.5", "M12 16.3v.2"],
    trend: ["M3 17l6-6 4 4 7-7", "M15 8h5v5"],
    bag: ["M5 8h14l-1 12H6z", "M9 8V6.5a3 3 0 0 1 6 0V8"],
    sun: ["M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8", "M12 2.5v2", "M12 19.5v2", "M2.5 12h2", "M19.5 12h2", "M5.3 5.3l1.4 1.4", "M17.3 17.3l1.4 1.4", "M5.3 18.7l1.4-1.4", "M17.3 6.7l1.4-1.4"],
    palette: ["M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1-1.8-.7-1 0-2.2 1.2-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z", "M7.5 11h.01", "M10 7.5h.01", "M14.5 7.5h.01", "M17 11h.01"],
    navigate: ["M12 3.5 19 20l-7-4-7 4z"],
    lock: ["M6 11h12v9H6z", "M8.5 11V8a3.5 3.5 0 0 1 7 0v3"],
    copy: ["M8.5 8.5h11v11h-11z", "M5 15.5V4.5h11"],
    userPlus: ["M10 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7", "M3.5 20a6.5 6.5 0 0 1 13 0", "M19 8v6", "M16 11h6"],
    arrowUR: ["M7 17 17 7", "M9 7h8v8"],
    arrowR: ["M5 12h14", "M13 6l6 6-6 6"],
    edit: ["M4 20h4l10.5-10.5-4-4L4 16z", "M13 7l4 4"],
    radar: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9", "M12 12l6-6"],
    cart: ["M3 4h2.5l2.2 11h10.6L20.5 7H7"],
    signal: ["M5 19v-3", "M10 19v-6", "M15 19V9", "M20 19V5"],
    battery: ["M3 8h16v8H3z", "M21 10.5v3"]
  };

  function icon(name, size, color, opts) {
    opts = opts || {};
    size = size || 22;
    var svg = s("svg", {
      width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      stroke: color || "currentColor", "stroke-width": opts.sw || 1.8,
      "stroke-linecap": "round", "stroke-linejoin": "round",
      "aria-hidden": "true", focusable: "false", class: "ic" + (opts.cls ? " " + opts.cls : "")
    });
    var k = KICON[name];
    if (k) {
      (k.f || []).forEach(function (d) {
        svg.appendChild(s("path", { d: d, fill: opts.accent || color || "currentColor", "fill-opacity": opts.fo === undefined ? 0.28 : opts.fo, stroke: "none" }));
      });
      k.l.forEach(function (d) { svg.appendChild(s("path", { d: d })); });
      (k.d || []).forEach(function (c) {
        svg.appendChild(s("circle", { cx: c[0], cy: c[1], r: c[2], fill: color || "currentColor", stroke: "none" }));
      });
      return svg;
    }
    var u = UICON[name] || UICON.alert;
    // (Arrays have a .fill method too, so check the shape, not the key.)
    if (!Array.isArray(u)) svg.appendChild(s("path", { d: u.fill, fill: color || "currentColor", stroke: "none" }));
    else u.forEach(function (d) { svg.appendChild(s("path", { d: d })); });
    return svg;
  }

  // --- Formatting (services/runMath.ts) ---
  function kmText(m) { var km = m / 1000; return km < 10 ? km.toFixed(2) : km.toFixed(1); }
  function clockText(sec) {
    sec = Math.max(0, Math.floor(sec));
    var hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
    var two = function (n) { return (n < 10 ? "0" : "") + n; };
    return hh > 0 ? hh + ":" + two(mm) + ":" + two(ss) : two(mm) + ":" + two(ss);
  }
  function paceFor(m, sec) {
    if (m < 100 || sec <= 0) return null;
    var p = sec / (m / 1000);
    return p >= 150 && p <= 1800 ? p : null;
  }
  function paceText(p) {
    if (!p) return "--";
    var mm = Math.floor(p / 60), ss = Math.round(p % 60);
    if (ss === 60) { mm += 1; ss = 0; }
    return mm + ":" + (ss < 10 ? "0" : "") + ss;
  }
  function num(n) { return Number(n).toLocaleString("en-PH"); }
  function peso(n) { return "₱" + num(n); }
  function plural(n, one, many) { return n === 1 ? one : many || one + "s"; }
  function streakMult(days) {
    // services/streakMultiplier.ts
    return days >= 30 ? 3 : days >= 14 ? 2 : days >= 7 ? 1.5 : days >= 4 ? 1.2 : 1;
  }
  function tierLabel(days) {
    return days >= 30 ? "Consistency Cap" : days >= 14 ? "Dedicated" : days >= 7 ? "Committed" : days >= 4 ? "Building" : "Baseline";
  }
  var GUILD_COLORS = { lime: "#7CF205", teal: "#209F77", aqua: "#00F5D4", sky: "#00BBF9", orange: "#FF9F1C", coral: "#FF4D6D", gold: "#FFD60A" };
  var C = {
    brand: "#7CF205", deep: "#209F77", ink: "#F3F5EE", ink2: "#B9C2B3", muted: "#939E8F", faint: "#5F6B61",
    sky: "#00BBF9", aqua: "#00F5D4", civic: "#FF9F1C", coral: "#FF4D6D", gold: "#FFD60A", onBright: "#04210A"
  };
  var CIVIC_CATS = [
    { id: "trash", label: "Trash", icon: "trash" },
    { id: "flooding", label: "Flooding", icon: "water" },
    { id: "drain_blockage", label: "Drain blockage", icon: "warning" },
    { id: "damaged_infrastructure", label: "Road damage", icon: "construct" },
    { id: "unsafe_area", label: "Unsafe area", icon: "alert" }
  ];
  function catOf(id) { for (var i = 0; i < CIVIC_CATS.length; i++) if (CIVIC_CATS[i].id === id) return CIVIC_CATS[i]; return CIVIC_CATS[0]; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function dayStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function daysAgo(n) { var x = dayStart(new Date()); x.setDate(x.getDate() - n); return x; }

  /* ==========================================================
     2. STATE (in memory only)
     ========================================================== */
  var S;
  function freshState() {
    return {
      user: clone(D.user),
      runs: D.runDays.map(function (r) { return { d: r.d, m: Math.round(r.km * 1000), s: Math.round(r.min * 60) }; }),
      ranToday: false,
      quests: clone(D.quests).map(function (q) { q.claimed = false; return q; }),
      reports: clone(D.reports),
      shopOwned: D.shop.owned.slice(),
      worn: { trail: null, frame: null },
      boosts: {},
      squad: clone(D.squad),
      storm: false,
      chat: [],
      ghostOn: false,
      lastRun: null,
      aniMove: "idle"
    };
  }
  S = freshState();

  function effectiveStreak() { return S.user.streak + (S.ranToday ? 1 : 0); }
  function trailColors() {
    if (!S.worn.trail) return [C.brand];
    var t = D.shop.trail.filter(function (x) { return x.id === S.worn.trail; })[0];
    return t ? t.colors : [C.brand];
  }
  function frameColors() {
    if (!S.worn.frame) return null;
    var f = D.shop.frame.filter(function (x) { return x.id === S.worn.frame; })[0];
    return f ? f.colors : null;
  }

  /**
   * Rewards, the way the server works them out (supabase/15_server_rewards.sql):
   * XP x streak tier, then x1.02 for the guild's Pioneer badge (earned in the
   * demo). Levels are 1,000 XP each.
   */
  function boostedXp(raw) { return Math.round(Math.floor(raw * streakMult(effectiveStreak())) * 1.02); }
  function award(xp, gems) {
    var startLevel = S.user.level;
    S.user.xp += xp;
    S.user.gems += gems;
    while (S.user.xp >= 1000) { S.user.xp -= 1000; S.user.level += 1; }
    return S.user.level > startLevel;
  }

  /* ==========================================================
     3. SHELL
     ========================================================== */
  var DOCK_ROUTES = { home: 1, quests: 1, squad: 1, shop: 1 };
  var GLOW = { home: "default", quests: "default", ani: "calm", squad: "ember", shop: "energy", scout: "energy",
    progress: "aurora", calendar: "aurora", profile: "default", customize: "calm", summary: "energy", territory: "ember" };

  root.textContent = "";
  root.classList.add("app");
  var statusTime = h("span", { class: "app__time" });
  var statusBar = h("div", { class: "app__status" }, [
    statusTime,
    h("span", { class: "app__demo", text: "Demo data" }),
    h("span", { class: "app__sys", "aria-hidden": "true" }, [icon("signal", 14, C.ink, { sw: 2.2 }), icon("battery", 18, C.ink)])
  ]);
  var view = h("div", { class: "app__view" });
  var dockEl = h("nav", { class: "dock", "aria-label": "App tabs" });
  var overlay = h("div", { class: "app__overlay" });
  var toastEl = h("div", { class: "toast", role: "status", "aria-live": "polite" });
  root.appendChild(h("div", { class: "app__glow", "aria-hidden": "true" }, [h("i"), h("i"), h("i")]));
  append(root, [statusBar, view, dockEl, overlay, toastEl]);

  function tickTime() {
    var d = new Date();
    statusTime.textContent = d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }
  tickTime();
  setInterval(tickTime, 30000);

  // --- Navigation ---
  var route = "home";
  var params = {};
  var stack = [];
  var SCREENS = {};

  function go(name, p, opts) {
    opts = opts || {};
    if (route === "run" && name !== "run") stopRun(true);
    closeAll();
    if (!opts.replace && route !== name) stack.push({ route: route, params: params });
    if (opts.reset) stack = [];
    route = name;
    params = p || {};
    render(true);
  }
  function back() {
    var prev = stack.pop();
    if (route === "run") stopRun(true);
    closeAll();
    if (!prev) prev = { route: "home", params: {} };
    route = prev.route;
    params = prev.params;
    render(true);
  }

  /** Re-draws the current screen. keepScroll keeps the reader where they were. */
  function render(fresh) {
    var scroller = view.querySelector(".scr");
    var top = !fresh && scroller ? scroller.scrollTop : 0;
    root.setAttribute("data-glow", GLOW[route] || "default");
    root.setAttribute("data-route", route);
    view.textContent = "";
    var node = SCREENS[route](params);
    view.appendChild(node);
    var sc = view.querySelector(".scr");
    if (sc) sc.scrollTop = top;
    renderDock();
    if (fresh) {
      var title = view.querySelector("[data-title]");
      if (title) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
    }
  }

  var TABS = [
    { r: "home", icon: "home", label: "Home" },
    { r: "quests", icon: "medal", label: "Quests" },
    { r: "run", icon: "play", label: "Run", primary: true },
    { r: "squad", icon: "squad", label: "Squad" },
    { r: "shop", icon: "gem", label: "Shop" }
  ];
  function renderDock() {
    dockEl.textContent = "";
    dockEl.hidden = !DOCK_ROUTES[route];
    if (dockEl.hidden) return;
    var row = h("div", { class: "dock__bar" });
    TABS.forEach(function (t) {
      var on = route === t.r;
      var b = h("button", {
        type: "button", class: "dock__tab" + (t.primary ? " dock__tab--run" : "") + (on ? " is-on" : ""),
        "aria-current": on ? "page" : null,
        on: { click: function () { if (!on) go(t.r, {}, { replace: !t.primary && route !== "run", reset: false }); } }
      }, [
        t.primary ? h("span", { class: "dock__run" }, icon("play", 24, C.onBright)) : h("span", { class: "dock__well" }, icon(t.icon, 22, on ? C.brand : C.muted, { fo: on ? 0.35 : 0 })),
        h("span", { class: "dock__label", text: t.label })
      ]);
      row.appendChild(b);
    });
    dockEl.appendChild(row);
  }

  // --- Overlays: drawer, sheet, dialog ---
  var lastFocus = null;
  function openOverlay(panel, kind, onClose) {
    closeAll();
    lastFocus = document.activeElement;
    var backdrop = h("div", { class: "ov__backdrop", on: { click: function () { closeAll(); } } });
    var wrap = h("div", { class: "ov ov--" + kind }, [backdrop, panel]);
    wrap._onClose = onClose;
    overlay.appendChild(wrap);
    overlay.classList.add("is-open");
    view.setAttribute("inert", "");
    dockEl.setAttribute("inert", "");
    requestAnimationFrame(function () {
      wrap.classList.add("is-in");
      var f = panel.querySelector("button, [href], input, [tabindex]");
      if (f) f.focus({ preventScroll: true });
    });
    return wrap;
  }
  function closeAll() {
    var had = overlay.firstChild;
    while (overlay.firstChild) {
      var w = overlay.firstChild;
      if (w._onClose) w._onClose();
      overlay.removeChild(w);
    }
    overlay.classList.remove("is-open");
    view.removeAttribute("inert");
    dockEl.removeAttribute("inert");
    if (had && lastFocus && root.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  root.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.firstChild) { e.stopPropagation(); closeAll(); }
    // Keep Tab inside an open sheet or menu.
    if (e.key === "Tab" && overlay.firstChild) {
      var f = overlay.querySelectorAll("button:not([disabled]), [href], input");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function sheet(title, sub, body, opts) {
    opts = opts || {};
    var panel = h("div", { class: "sheet" + (opts.cls ? " " + opts.cls : ""), role: "dialog", "aria-modal": "true", "aria-label": title }, [
      h("div", { class: "sheet__accent" }),
      h("div", { class: "sheet__handle" }),
      h("div", { class: "sheet__head" }, [
        h("div", { class: "sheet__htext" }, [h("h2", { class: "sheet__title", text: title }), sub ? h("p", { class: "sheet__sub", text: sub }) : null]),
        opts.icon ? h("span", { class: "sheet__hicon" }, icon(opts.icon, 22, opts.iconColor || C.civic)) : null
      ]),
      body
    ]);
    return openOverlay(panel, "sheet", opts.onClose);
  }

  /** Like the app's Alert: a title, a message and buttons. */
  function dialog(title, message, buttons) {
    var row = h("div", { class: "dlg__btns" });
    (buttons || [{ text: "OK" }]).forEach(function (b) {
      row.appendChild(h("button", {
        type: "button", class: "dlg__btn" + (b.style ? " dlg__btn--" + b.style : ""), text: b.text,
        on: { click: function () { closeAll(); if (b.onPress) b.onPress(); } }
      }));
    });
    var panel = h("div", { class: "dlg", role: "alertdialog", "aria-modal": "true", "aria-label": title }, [
      h("h2", { class: "dlg__title", text: title }),
      h("p", { class: "dlg__msg", text: message }),
      row
    ]);
    openOverlay(panel, "dialog");
  }

  var toastTimer = null;
  function toast(text, sub) {
    toastEl.textContent = "";
    append(toastEl, [h("strong", { text: text }), sub ? h("span", { text: sub }) : null]);
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3600);
  }
  var DEMO_NOTE = "Demo data: nothing was saved.";

  function openDrawer() {
    var items = [
      { r: "home", icon: "home", label: "Home" },
      { r: "progress", icon: "stats", label: "My Progress" },
      { r: "run", icon: "map", label: "Run" },
      { r: "quests", icon: "medal", label: "Quests" },
      { r: "squad", icon: "squad", label: "Squad and guild" },
      { r: "shop", icon: "gem", label: "Shop" },
      { r: "ani", icon: "chat", label: "Ani" },
      { r: "calendar", icon: "calendar", label: "Calendar" },
      { r: "settings", icon: "settings", label: "Settings" }
    ];
    var list = h("div", { class: "drawer__list" });
    items.forEach(function (it) {
      var on = route === it.r;
      list.appendChild(h("button", {
        type: "button", class: "drawer__item" + (on ? " is-on" : ""), "aria-current": on ? "page" : null,
        on: {
          click: function () {
            if (it.r === "settings") { closeAll(); toast("Settings aren't part of the demo.", "In the app: units, reminders, Privacy Zones and your data."); return; }
            go(it.r, {}, { reset: it.r === "home" });
          }
        }
      }, [icon(it.icon, 22, on ? C.brand : C.ink), h("span", { text: it.label })]));
    });
    var panel = h("div", { class: "drawer", role: "dialog", "aria-modal": "true", "aria-label": "Menu" }, [
      list,
      h("div", { class: "drawer__foot" }, h("button", {
        type: "button", class: "drawer__item drawer__item--out",
        on: { click: function () { closeAll(); toast("It's the demo, so there's nothing to log out of."); } }
      }, [icon("logout", 22, C.coral), h("span", { text: "Log out" })]))
    ]);
    openOverlay(panel, "drawer");
  }

  /* ==========================================================
     4. SHARED PIECES
     ========================================================== */
  function btn(label, opts) {
    opts = opts || {};
    var cls = "b b--" + (opts.variant || "primary") + (opts.size === "sm" ? " b--sm" : "") + (opts.block ? " b--block" : "");
    return h("button", { type: "button", class: cls, disabled: opts.disabled, on: { click: opts.onPress } }, [
      opts.icon ? icon(opts.icon, opts.size === "sm" ? 16 : 18) : null,
      h("span", { text: label })
    ]);
  }
  function iconBtn(name, label, onPress, opts) {
    opts = opts || {};
    return h("button", {
      type: "button", class: "ib" + (opts.tone ? " ib--" + opts.tone : "") + (opts.cls ? " " + opts.cls : ""),
      "aria-label": label, "aria-pressed": opts.pressed === undefined ? null : String(opts.pressed), on: { click: onPress }
    }, icon(name, opts.size || 22, opts.color));
  }
  function header(title, opts) {
    opts = opts || {};
    return h("div", { class: "hdr" }, [
      h("div", { class: "hdr__left" }, [
        opts.back !== false ? iconBtn("back", "Back", back) : null,
        h("div", {}, [
          h("h1", { class: "hdr__title" + (opts.big ? " hdr__title--big" : ""), "data-title": "", text: title }),
          opts.sub ? h("p", { class: "hdr__sub", text: opts.sub }) : null
        ])
      ]),
      opts.right || (opts.menu ? iconBtn("menu", "Open menu", openDrawer) : null)
    ]);
  }
  function screen(kids, opts) {
    opts = opts || {};
    return h("div", { class: "scr" + (opts.cls ? " " + opts.cls : "") + (DOCK_ROUTES[route] ? " scr--dock" : "") }, kids);
  }
  function avatar(size, frame) {
    var ring = frame || null;
    var el = h("span", { class: "av", style: { "--av": size + "px" } }, h("span", { class: "av__in", text: S.user.name.charAt(0) }));
    if (ring) el.style.setProperty("--ring", "linear-gradient(135deg," + ring[0] + "," + (ring[1] || ring[0]) + ")");
    else el.classList.add("av--plain");
    return el;
  }
  function bar(pct, cls) {
    return h("div", { class: "track" + (cls ? " " + cls : "") }, h("div", { class: "track__fill", style: { width: Math.max(0, Math.min(100, pct)) + "%" } }));
  }
  function block(iconName, title, kids, aside) {
    return h("section", { class: "blk" }, [
      h("div", { class: "blk__head" }, [iconName ? icon(iconName, 20, C.brand) : null, h("h2", { class: "blk__title", text: title }), h("span", { class: "blk__gap" }), aside || null]),
      kids
    ]);
  }
  function demoNote(text) {
    return h("p", { class: "dnote" }, [icon("alert", 14, C.civic), h("span", { text: text })]);
  }

  /* ==========================================================
     5. SCREENS
     ========================================================== */

  // ---------- Home (app/drawer/dashboard.tsx) ----------
  SCREENS.home = function () {
    var streak = effectiveStreak();
    var atRisk = streak > 0 && !S.ranToday;
    var lvl = S.user.level, xp = S.user.xp;
    var stColor = streak === 0 ? C.faint : atRisk ? C.civic : C.civic;

    var player = h("button", {
      type: "button", class: "pc",
      "aria-label": "Level " + lvl + ", " + num(1000 - xp) + " XP to level " + (lvl + 1) + ". " + streak + "-day streak. " + num(S.user.gems) + " Gems. Opens your progress.",
      on: { click: function () { go("progress"); } }
    }, h("span", { class: "pc__in" }, [
      h("span", { class: "pc__top" }, [
        h("span", {}, [h("span", { class: "lbl", text: "Level" }), h("span", { class: "pc__lvl", text: lvl })]),
        h("span", { class: "pc__streak" }, [
          h("span", { class: "lbl", text: "Streak" }),
          h("span", { class: "pc__sv" }, [icon("streak", 20, stColor), h("span", { text: streak + " " + plural(streak, "day") })]),
          h("span", { class: "pc__mult" + (atRisk ? " is-risk" : ""), text: atRisk ? "At risk today" : streakMult(streak) + "x XP" })
        ])
      ]),
      h("span", { class: "pc__meter" }, [
        bar(xp / 10, "track--pulse"),
        h("span", { class: "pc__ml" }, [h("span", { text: num(xp) + " / 1,000 XP" }), h("span", { text: num(1000 - xp) + " to level " + (lvl + 1) })])
      ]),
      h("span", { class: "pc__foot" }, [
        h("span", { class: "pc__pills" }, [
          h("span", { class: "pill" }, [icon("gem", 15, C.sky), h("b", { text: num(S.user.gems) }), h("span", { text: "Gems" })]),
          h("span", { class: "pill" }, [icon("freeze", 15, C.aqua), h("b", { text: S.user.freezes }), h("span", { text: plural(S.user.freezes, "Freeze", "Freezes") })])
        ]),
        h("span", { class: "pc__cta" }, [h("span", { text: "Progress" }), icon("fwd", 14, C.muted)])
      ])
    ]));

    // TodayCard: safety first, then the streak.
    var t;
    if (S.storm) t = { icon: "storm", tint: C.coral, title: "Stay in today", sub: "Strong wind, heavy rain or a storm in Tuguegarao. Ani won't ask you to run." };
    else if (S.ranToday) t = { icon: "checkCircle", tint: C.brand, title: "You ran today", sub: streak + "-day streak. See you tomorrow.", action: btn("Calendar", { variant: "link", size: "sm", onPress: function () { go("calendar"); } }) };
    else t = { icon: "streak", tint: C.civic, title: "Keep your " + streak + "-day streak", sub: "Run any distance today to keep it.", action: btn("Start a run", { icon: "play", size: "sm", onPress: function () { go("run"); } }) };
    var needs = S.reports.filter(function (r) { return r.status !== "verified"; }).length;
    var today = h("div", { class: "card today" }, [
      h("div", { class: "today__row" }, [
        h("span", { class: "today__well", style: { "border-color": t.tint } }, icon(t.icon, 22, t.tint)),
        h("div", {}, [h("p", { class: "today__title", text: t.title }), h("p", { class: "today__sub", text: t.sub })])
      ]),
      t.action ? h("div", { class: "today__act" }, t.action) : null,
      needs > 0 ? h("div", { class: "today__civic" }, [
        icon("camera", 16, C.civic),
        h("span", { text: needs + " " + plural(needs, "report") + " near you " + (needs === 1 ? "needs" : "need") + " a check" }),
        btn("Open map", { variant: "link", size: "sm", onPress: function () { go("run"); } })
      ]) : null
    ]);

    var mapCard = h("div", { class: "mapcard" }, [
      buildMap({ mini: true }),
      h("span", { class: "mapcard__sun", "aria-hidden": "true" }, icon(S.storm ? "storm" : "sun", 30, S.storm ? C.sky : C.gold)),
      btn("Open map", { icon: "map", size: "sm", onPress: function () { go("run"); } })
    ]);

    var aniBox = h("button", {
      type: "button", class: "charbox", "aria-label": "Ani. Tap to wave.",
      on: {
        click: function () {
          var spr = aniBox.querySelector(".sprite");
          spr.className = "sprite sprite--walk";
          setTimeout(function () { if (spr.isConnected) spr.className = "sprite sprite--idle"; }, 2400);
        }
      }
    }, h("span", { class: "sprite sprite--idle", style: { "--fh": "150px" } }));

    var weatherLine = S.storm
      ? "Heavy rain in Tuguegarao, 24°C. Strong wind, heavy rain or a storm. Stay in today. A short indoor stretch is a good option."
      : D.weather.desc + " in " + D.weather.city + ", " + D.weather.temp + "°C. It's hot, so go early or late and bring water.";

    var daily = S.quests.filter(function (q) { return q.freq === "daily" && !q.claimed; });
    var overall = daily.length ? daily.reduce(function (a, q) { return a + Math.min(1, q.current / q.target); }, 0) / daily.length : 0;

    return screen([
      h("div", { class: "home__head" }, [
        h("div", { class: "home__who" }, [
          h("button", { type: "button", class: "home__av", "aria-label": "Your profile", on: { click: function () { go("profile"); } } }, avatar(50, frameColors())),
          h("div", {}, [h("p", { class: "home__wb", text: "Welcome back" }), h("h1", { class: "home__name", "data-title": "", text: S.user.name })])
        ]),
        iconBtn("menu", "Open menu", openDrawer)
      ]),
      player,
      today,
      h("h2", { class: "sec", text: "Your map" }),
      mapCard,
      h("div", { class: "chars" }, [
        h("div", { class: "chars__col" }, [h("p", { class: "chars__t", text: "Ani" }), aniBox,
          btn("Customize", { variant: "secondary", size: "sm", icon: "palette", block: true, onPress: function () { go("customize"); } })]),
        h("div", { class: "chars__col" }, [h("p", { class: "chars__t", text: "You" }),
          h("div", { class: "charbox charbox--locked" }, [icon("userPlus", 32, C.muted), h("span", { text: "Your character is coming soon" })])])
      ]),
      h("h2", { class: "sec", text: "Chat with Ani" }),
      h("button", { type: "button", class: "chatcard", "aria-label": "Message Ani. " + weatherLine, on: { click: function () { go("ani"); } } }, [
        h("span", { class: "chatcard__bar" }),
        h("span", { class: "chatcard__body" }, [
          h("span", { class: "chatcard__text", text: weatherLine }),
          h("span", { class: "chatcard__field" }, [h("span", { text: "Message Ani" }), h("span", { class: "ib ib--brand ib--40" }, icon("arrowR", 20, C.onBright))])
        ])
      ]),
      h("div", { class: "sec__row" }, [h("h2", { class: "sec", text: "Quest Progress" }), btn("View all", { variant: "link", size: "sm", onPress: function () { go("quests"); } })]),
      daily.length ? questCard(overall, daily) : h("div", { class: "card empty" }, [icon("radar", 32, C.faint), h("p", { text: "No quests left today. Ani picks new ones tomorrow." })])
    ]);
  };

  function questCard(overall, quests) {
    var r = 80, cx = 100, cy = 100, len = Math.PI * r;
    var d = "M " + (cx - r) + " " + cy + " A " + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy;
    var status = overall >= 0.9 ? "Elite" : overall >= 0.6 ? "Excellent" : overall >= 0.3 ? "On Track" : "Warming Up";
    var gauge = s("svg", { viewBox: "0 0 200 110", class: "gauge", "aria-hidden": "true" }, [
      s("defs", {}, s("linearGradient", { id: "gaugeG", x1: "0", x2: "1", y1: "0", y2: "0" }, [s("stop", { offset: "0", "stop-color": C.deep }), s("stop", { offset: "1", "stop-color": C.brand })])),
      s("path", { d: d, fill: "none", stroke: "#1E2B22", "stroke-width": 16, "stroke-linecap": "round" }),
      s("path", { d: d, fill: "none", stroke: "url(#gaugeG)", "stroke-width": 16, "stroke-linecap": "round", "stroke-dasharray": len + " " + len, "stroke-dashoffset": len - overall * len })
    ]);
    return h("div", { class: "qc" }, [
      h("div", { class: "qc__top" }, iconBtnLike()),
      h("div", { class: "qc__gauge" }, [gauge, h("div", { class: "qc__over" }, [
        h("p", { class: "qc__status", text: status }),
        h("p", { class: "qc__pct", text: Math.round(overall * 100) + "%" }),
        h("p", { class: "qc__subt", text: "of today's quests done" })
      ])]),
      h("p", { class: "qc__title", text: "Active Quests" }),
      h("div", {}, quests.map(function (q) {
        var p = Math.min(1, q.current / q.target);
        return h("div", { class: "qc__row" }, [
          h("p", { class: "qc__name", text: q.title }),
          bar(p * 100, "track--sm"),
          h("p", { class: "qc__meta" }, [h("span", { text: Math.round(p * 100) + "%" }), h("span", { class: "qc__xp", text: "+" + q.xp + " XP" })])
        ]);
      }))
    ]);
    function iconBtnLike() {
      return h("button", { type: "button", class: "qc__go", "aria-label": "Open Quests", on: { click: function () { go("quests"); } } }, icon("arrowUR", 18, C.onBright));
    }
  }

  // ---------- Quests (app/drawer/quests.tsx) ----------
  var questTab = { cat: "solo", freq: "daily" };
  SCREENS.quests = function () {
    var seg = h("div", { class: "seg", role: "tablist", "aria-label": "Quest type" }, ["solo", "team"].map(function (c) {
      var on = questTab.cat === c;
      return h("button", { type: "button", role: "tab", "aria-selected": String(on), class: "seg__b" + (on ? " is-on" : ""), text: c === "solo" ? "Solo" : "Team",
        on: { click: function () { questTab.cat = c; render(); } } });
    }));
    var chips = h("div", { class: "chips chips--c", role: "tablist", "aria-label": "How often" }, ["daily", "weekly", "monthly"].map(function (f) {
      var on = questTab.freq === f;
      return h("button", { type: "button", role: "tab", "aria-selected": String(on), class: "chip" + (on ? " is-on" : ""), text: f.charAt(0).toUpperCase() + f.slice(1),
        on: { click: function () { questTab.freq = f; render(); } } });
    }));
    var list = S.quests.filter(function (q) { return questTab.cat === "solo" && q.freq === questTab.freq && !q.claimed; });
    var body = !list.length
      ? h("div", { class: "empty" }, [icon("radar", 40, C.faint), h("p", { class: "empty__t", text: questTab.cat === "team" ? "No team quests yet" : "All done here" }),
        h("p", { class: "empty__s", text: questTab.cat === "team" ? "Team quests open when your squad takes one on. Ani is picking the next one." : "Ani is picking your next quest." })])
      : h("div", {}, list.map(function (q) {
        var p = Math.min(1, q.current / q.target), done = p >= 1;
        var unit = q.unit === "km" ? " km" : " " + q.unit;
        var cur = q.unit === "km" ? q.current.toFixed(1) : Math.min(q.current, q.target);
        return h("article", { class: "card quest" }, [
          h("div", { class: "quest__head" }, [
            h("div", {}, [h("h2", { class: "quest__t", text: q.title }), h("p", { class: "quest__d", text: q.desc })]),
            h("span", { class: "xpb", text: "+" + q.xp + " XP" })
          ]),
          bar(p * 100),
          h("p", { class: "quest__p", text: cur + " / " + q.target + unit }),
          done ? btn("Claim reward", { icon: "gift", block: true, onPress: function () { claim(q); } }) : h("div", { class: "quest__lock", text: "In progress" })
        ]);
      }));
    return screen([
      header("Quest Log", { sub: "@" + S.user.username }),
      h("div", { class: "pad" }, [seg, chips, body])
    ]);
  };
  function claim(q) {
    var xp = boostedXp(q.xp);
    var gems = (q.type === "civic" ? 10 : 0) + (q.freq === "weekly" ? 5 : q.freq === "monthly" ? 15 : 0);
    q.claimed = true;
    var up = award(xp, gems);
    render();
    dialog("Reward claimed", "Quest complete. +" + num(xp) + " XP." + (gems ? " +" + gems + " Gems." : "") + (up ? " You reached level " + S.user.level + "." : "") + "\n\n" + DEMO_NOTE);
  }

  // ---------- Ani (app/drawer/ai_coach.tsx) ----------
  SCREENS.ani = function () {
    var A = D.ani;
    var input = h("input", { class: "chat__input", type: "text", placeholder: "Message Ani", "aria-label": "Message Ani", maxlength: 200 });
    var send = iconBtn("send", "Send", function () { ask(input.value, true); }, { tone: "brand", size: 20, color: C.onBright, cls: "ib--44" });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") ask(input.value, true); });

    var content;
    if (!S.chat.length) {
      content = h("div", { class: "ani__empty" }, [
        h("p", { class: "ani__hello", text: "Hello, " + S.user.name }),
        h("p", { class: "ani__q" }, ["How's your", h("br"), "body today?"]),
        h("div", { class: "chips" }, A.chips.map(function (c) {
          return h("button", { type: "button", class: "chip chip--ani", on: { click: function () { ask(c.q); } } }, [icon(c.icon, 18, C.ink), h("span", { text: c.q })]);
        })),
        h("p", { class: "ani__disc", text: A.disclosure }),
        demoNote("Demo: Ani's answers here are written ahead of time, from Randel's demo numbers. In the app, she answers from your real runs.")
      ]);
    } else {
      content = h("div", { class: "chat", "aria-live": "polite" }, S.chat.map(function (m) {
        if (m.typing) return h("div", { class: "bub bub--ai bub--typing", "aria-label": "Ani is typing" }, [h("i"), h("i"), h("i")]);
        return h("div", { class: "bub bub--" + m.from }, m.text.split("\n").map(function (p) { return h("p", { text: p }); }));
      }).concat([
        h("div", { class: "chips chips--again" }, A.chips.map(function (c) {
          return h("button", { type: "button", class: "chip chip--ani chip--sm", on: { click: function () { ask(c.q); } } }, [h("span", { text: c.q })]);
        }))
      ]));
    }
    var el = h("div", { class: "scr scr--chat" }, [
      header("Ani", { right: iconBtn("refresh", "Clear chat", function () { S.chat = []; render(true); }) }),
      h("div", { class: "chat__scroll" }, content),
      h("div", { class: "chat__bar" }, [input, send])
    ]);
    requestAnimationFrame(function () { var sc = el.querySelector(".chat__scroll"); if (sc) sc.scrollTop = sc.scrollHeight; });
    return el;
  };
  var typingTimer = null;
  function ask(text, typed) {
    text = (text || "").trim();
    if (!text || S.chat.some(function (m) { return m.typing; })) return;
    var key = text;
    if (key === "Is it safe to run today?" && S.storm) key = "Is it safe to run today? (storm)";
    var reply = (!typed && D.ani.replies[key]) ? D.ani.replies[key].join("\n") : D.ani.typed;
    S.chat.push({ from: "user", text: text });
    S.chat.push({ typing: true });
    render();
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      S.chat = S.chat.filter(function (m) { return !m.typing; });
      S.chat.push({ from: "ai", text: reply });
      if (route === "ani") render();
    }, reduceMotion ? 200 : 1100);
  }

  // ---------- Squad and guild (app/drawer/guilds.tsx + components/guild) ----------
  var squadTab = "squad";
  SCREENS.squad = function () {
    var tabs = h("div", { class: "utabs", role: "tablist", "aria-label": "Squad, guild or territory" }, [
      ["squad", "squad", "Squad"], ["guild", "guild", "Guild"], ["territory", "territory", "Territory"]
    ].map(function (t) {
      var on = squadTab === t[0];
      return h("button", { type: "button", role: "tab", "aria-selected": String(on), class: "utab" + (on ? " is-on" : ""),
        on: { click: function () { squadTab = t[0]; render(); } } }, [icon(t[1], 18, on ? C.brand : C.muted), h("span", { text: t[2] })]);
    }));
    var body = squadTab === "squad" ? squadBody() : squadTab === "guild" ? guildBody() : territoryBody();
    return screen([
      header("Squad and guild", { back: false, big: true, menu: true }),
      h("div", { class: "pad" }, [tabs, body])
    ]);
  };

  function memberRow(m) {
    var atRisk = m.atRisk && !(m.shield >= S.squad.shieldCost);
    return h("div", { class: "mrow" }, [
      h("span", { class: "av av--plain", style: { "--av": "44px" } }, h("span", { class: "av__in", text: m.name.charAt(0) })),
      h("div", { class: "mrow__mid" }, [
        h("p", { class: "mrow__name" }, [m.name, m.me ? h("span", { class: "mrow__me", text: " (you)" }) : null,
          m.role === "leader" ? icon("crown", 16, C.gold) : m.role === "co_leader" ? icon("star", 15, C.sky) : null]),
        h("p", { class: "mrow__meta", text: [m.role === "leader" ? "Leader" : m.role === "co_leader" ? "Co-leader" : null, "Level " + m.level].filter(Boolean).join(", ") })
      ]),
      h("span", { class: "mrow__streak" + (atRisk ? " is-risk" : "") }, [icon("streak", 18, atRisk ? C.civic : C.brand), h("b", { text: m.me ? effectiveStreak() : m.streak })])
    ]);
  }

  function squadBody() {
    var sq = S.squad;
    var members = h("div", {}, sq.members.map(function (m) {
      var parts = [memberRow(m)];
      if (m.atRisk && !m.me) {
        if (m.shield >= sq.shieldCost) {
          parts.push(h("p", { class: "shield-done", text: "Shielded today by your squad." }));
        } else {
          parts.push(h("div", { class: "risk" }, [
            h("div", { class: "risk__l" }, [
              h("p", { class: "risk__t", text: m.streak + "-day streak at risk today" }),
              bar(m.shield / sq.shieldCost * 100, "track--civic"),
              h("p", { class: "muted", text: m.shield + " of " + sq.shieldCost + " Gems from 1 squadmate" })
            ]),
            btn("Shield", { variant: "civic", size: "sm", onPress: function () { shieldSheet(m); } })
          ]));
        }
      }
      return h("div", {}, parts);
    }));
    return h("div", {}, [
      h("div", { class: "sqhead" }, [icon("squad", 34, C.brand), h("div", {}, [
        h("p", { class: "sqhead__n", text: sq.name }),
        h("p", { class: "muted", text: sq.members.length + " of " + sq.maxMembers + " members, " + num(sq.xp) + " Squad XP" })
      ]), btn("Edit", { variant: "link", size: "sm", onPress: function () { toast("Squad settings aren't part of the demo."); } })]),
      h("div", { class: "code" }, [icon("ticket", 22, C.brand), h("div", {}, [h("p", { class: "muted", text: "Invite code" }), h("p", { class: "code__v", text: sq.code })]),
        btn("Share", { variant: "secondary", size: "sm", icon: "share", onPress: function () { toast("In the app this opens your phone's share sheet.", "DEMO01 is a demo code. It doesn't join anything."); } })]),
      block("streak", "Members", members),
      h("p", { class: "muted muted--gap", text: "Collective Shield: after 6 PM, anyone in the squad can chip in Gems for someone whose streak is at risk. At " + sq.shieldCost + " Gems their streak is safe for the day. Gems come back if the shield doesn't fill by midnight." }),
      demoNote("Demo: in the app, shields open at 6 PM. Here you can try one any time.")
    ]);
  }
  function shieldSheet(m) {
    var need = S.squad.shieldCost - m.shield;
    var body = h("div", { class: "sheet__body" }, [
      h("p", { class: "body", text: m.name + " needs " + need + " more Gems to keep a " + m.streak + "-day streak tonight. You have " + num(S.user.gems) + "." }),
      h("div", { class: "chips" }, [20, 50, need].filter(function (v, i, a) { return v > 0 && a.indexOf(v) === i && v <= need; }).map(function (amt) {
        return h("button", { type: "button", class: "chip", disabled: amt > S.user.gems ? true : null, text: amt === need ? "Fill it (" + amt + ")" : amt + " Gems",
          on: { click: function () {
            S.user.gems -= amt; m.shield += amt; closeAll(); render();
            toast(m.shield >= S.squad.shieldCost ? m.name + "'s streak is safe today." : "You added " + amt + " Gems.", DEMO_NOTE);
          } } });
      })),
      h("p", { class: "muted", text: "If the shield isn't full by midnight, your Gems come back." })
    ]);
    sheet("Collective Shield", null, body, { icon: "shield", iconColor: C.brand });
  }

  function guildBody() {
    var G = D.guild, color = GUILD_COLORS[G.color];
    return h("div", {}, [
      h("p", { class: "body body--gap", text: "A guild brings up to " + G.maxSquads + " squads together for bigger things: clean-up drives, fun runs, and winning landmarks around the city." }),
      h("div", { class: "gbanner", style: { "border-left-color": color } }, [icon("guild", 36, color), h("div", {}, [
        h("p", { class: "gbanner__n", text: G.name }),
        h("p", { class: "muted", text: G.squads.length + " of " + G.maxSquads + " squads, " + G.members + " members, " + num(G.xp) + " XP" })
      ])]),
      h("div", { class: "stats3" }, [
        [num(G.week.km), "km this week"], [G.week.reports, "civic reports"], [G.week.ran, "members ran"]
      ].map(function (x) { return h("div", { class: "stats3__i" }, [h("p", { class: "stats3__n", text: x[0] }), h("p", { class: "stats3__l", text: x[1] })]); })),
      block("medal", "Badges", h("div", { class: "badges" }, G.badges.map(function (b) {
        return h("div", { class: "badge" }, [
          h("img", { src: "assets/demo/badge_" + b.id + ".webp", alt: "", width: 56, height: 56, class: b.earned ? "" : "is-locked", loading: "lazy" }),
          h("div", {}, [
            h("p", { class: "badge__n" + (b.earned ? "" : " is-dim"), text: b.name }),
            h("p", { class: "muted", text: b.goal }),
            h("p", { class: "badge__s" + (b.earned ? " is-on" : ""), text: b.earned ? "Earned. " + b.reward : b.progress + ". Reward: " + b.reward.charAt(0).toLowerCase() + b.reward.slice(1) })
          ])
        ]);
      }))),
      block("squad", "Squads", h("div", {}, G.squads.map(function (sq) {
        return h("div", { class: "lrow" }, [h("div", {}, [
          h("p", { class: "lrow__n" }, [sq.name, sq.mine ? h("span", { class: "muted", text: "  your squad" }) : null]),
          h("p", { class: "muted", text: sq.members + " members, " + num(sq.xp) + " Squad XP" })
        ])]);
      })))
    ]);
  }

  function territoryBody() {
    var R = D.territoryRules;
    var boostOn = !!S.boosts.territory_boost;
    return h("div", {}, [
      h("p", { class: "body body--gap", text: "Guilds win landmarks by running inside the circle around them. Each month's winner holds the landmark the next month and its flag flies on the Run map." }),
      h("p", { class: "muted muted--sm", text: "A guild that runs " + R.challengeRatio + "x the holder's distance in " + R.challengeDays + " days takes it early. A holder that stays away " + R.forfeitDays + " days loses it. Only the distance inside the circle leaves your phone, never your route." }),
      h("div", { class: "boostrow" }, [icon("boost", 22, boostOn ? C.brand : C.muted),
        h("p", { class: "body", text: boostOn ? "Territory Boost is on: your guild's distance counts " + R.boost + "x (24 h left)." : "A Territory Boost makes your guild's distance count " + R.boost + "x for a day." }),
        boostOn ? null : btn("Shop", { variant: "secondary", size: "sm", onPress: function () { go("shop"); } })]),
      block("territory", "Landmarks", h("div", {}, D.landmarks.map(function (l) {
        var held = !!l.holder, color = held ? GUILD_COLORS[l.holder.color] : C.muted;
        var max = Math.max.apply(null, l.top.map(function (t) { return t.km; }).concat([1]));
        return h("div", { class: "lm" }, [
          h("div", { class: "lm__head" }, [icon("territory", 22, color), h("div", {}, [
            h("p", { class: "lm__n", text: l.name }),
            h("p", { class: "lm__h", style: { color: color }, text: held ? l.holder.name + ", " + l.holder.reason.toLowerCase() : "Unclaimed" })
          ])]),
          h("div", { class: "tbars" }, l.top.map(function (t) {
            return h("div", { class: "tbar" }, [
              h("p", { class: "tbar__l" }, [h("span", { text: t.name }), h("span", { text: t.km.toFixed(1) + " km" })]),
              h("div", { class: "track track--sm" }, h("div", { class: "track__fill", style: { width: (t.km / max * 100) + "%", background: GUILD_COLORS[t.color] } }))
            ]);
          })),
          h("p", { class: "muted", text: "Your guild: " + l.mine.month.toFixed(1) + " km this month, " + l.mine.week.toFixed(1) + " km in the last 7 days." })
        ]);
      })), btn("See the map", { variant: "secondary", size: "sm", onPress: function () { go("territory"); } })),
      demoNote("Demo: the landmark names are real places in Tuguegarao. Who holds them, and every kilometre, is made up.")
    ]);
  }

  SCREENS.territory = function () {
    return h("div", { class: "scr scr--map" }, [
      buildMap({ territory: true }),
      h("div", { class: "map__top" }, [iconBtn("back", "Back", back, { tone: "surface" }), h("h1", { class: "map__title", "data-title": "", text: "Landmarks" })]),
      h("div", { class: "map__legend" }, D.landmarks.map(function (l) {
        var color = l.holder ? GUILD_COLORS[l.holder.color] : C.muted;
        return h("p", {}, [icon("territory", 18, color), h("b", { text: l.name }), h("span", { text: l.holder ? l.holder.name : "Unclaimed" })]);
      }))
    ]);
  };

  // ---------- Shop (app/drawer/shop.tsx) ----------
  SCREENS.shop = function () {
    var Sh = D.shop;
    function itemRow(it) {
      var owned = it.id === "streak_freeze" ? S.user.freezes >= 2 : !!S.boosts[it.id];
      var status = it.blocked ? it.blocked : it.id === "streak_freeze" ? "You hold " + S.user.freezes + " of 2" : S.boosts[it.id] ? "On for 24 hours" : null;
      var cant = it.blocked || owned || S.user.gems < it.price;
      return h("div", { class: "srow" }, [
        h("img", { src: "assets/demo/" + it.id + ".webp", alt: "", width: 48, height: 48, loading: "lazy" }),
        h("div", { class: "srow__mid" }, [h("p", { class: "srow__n", text: it.name }), h("p", { class: "srow__d", text: it.desc }), status ? h("p", { class: "srow__s" + (it.blocked ? " is-dim" : ""), text: status }) : null]),
        h("button", { type: "button", class: "price" + (cant ? " is-off" : ""), "aria-label": "Buy " + it.name + " for " + it.price + " Gems", disabled: cant ? true : null,
          on: { click: function () { buy(it); } } }, [icon("gem", 14, cant ? C.muted : C.sky), h("span", { text: it.price })])
      ]);
    }
    function tiles(slot) {
      var items = Sh[slot];
      var row = h("div", { class: "tiles" });
      var def = { id: null, name: slot === "trail" ? "Lime" : "Karela", note: "Default" };
      [def].concat(items).forEach(function (it) {
        var owned = !it.id || S.shopOwned.indexOf(it.id) >= 0;
        var worn = S.worn[slot] === it.id;
        row.appendChild(h("button", {
          type: "button", class: "tile" + (worn ? " is-worn" : ""), "aria-pressed": String(worn),
          "aria-label": it.name + (owned ? (worn ? ", worn" : ", owned. Tap to wear.") : ", " + it.price + " Gems"),
          on: { click: function () {
            if (owned) { S.worn[slot] = it.id; render(); toast(worn ? "Already wearing it." : it.name + " " + slot + " on.", slot === "trail" ? "Start a run to see it." : "See it on Home."); }
            else buy(it, slot);
          } }
        }, [
          it.id ? h("img", { src: "assets/demo/" + it.id + ".webp", alt: "", width: 64, height: 64, loading: "lazy" }) : h("span", { class: "tile__def" }, icon(slot, 34, C.brand)),
          h("span", { class: "tile__n", text: it.name }),
          h("span", { class: "tile__s" }, worn ? "Wearing" : owned ? (it.note || "Owned") : [icon("gem", 12, C.sky), " " + it.price + (it.rare ? ", rare" : "")])
        ]));
      });
      return row;
    }
    function section(ic, title, kids) {
      return h("section", { class: "ssec" }, [h("div", { class: "blk__head" }, [icon(ic, 20, C.brand), h("h2", { class: "blk__title", text: title })]), kids]);
    }
    return screen([
      h("div", { class: "shop__head" }, [
        h("div", { class: "wallet", "aria-label": num(S.user.gems) + " Gems, " + S.user.freezes + " Streak Freezes" }, [
          icon("gem", 22, C.sky), h("b", { text: num(S.user.gems) }), h("span", { class: "wallet__div" }), icon("freeze", 20, C.aqua), h("b", { text: S.user.freezes })
        ]),
        iconBtn("menu", "Open menu", openDrawer)
      ]),
      h("div", { class: "pad" }, [
        h("h1", { class: "shop__title", "data-title": "", text: "Shop" }),
        h("p", { class: "lead2" }, ["Everything here costs ", h("b", { text: "Gems" }), ". Earn them by moving and reporting problems in your city, or top up below."]),
        h("button", { type: "button", class: "pass", on: { click: function () { go("scout"); } } }, [
          icon("ticket", 36, C.sky),
          h("span", { class: "pass__mid" }, [h("span", { class: "pass__t", text: "Scout Pass, " + D.scoutPass.season }),
            h("span", { class: "pass__b", text: peso(D.scoutPass.pesos) + " for " + D.scoutPass.days + " days: rare trails, Ani outfits, +20% Gems and a 20-level reward track." })]),
          icon("fwd", 20, C.ink2)
        ]),
        section("gem", "Get Gems", h("div", {}, D.gemPacks.map(function (p) {
          return h("div", { class: "srow" }, [
            h("img", { src: "assets/demo/gem.webp", alt: "", width: 48, height: 48, loading: "lazy" }),
            h("div", { class: "srow__mid" }, [h("p", { class: "srow__n", text: num(p.gems) + " Gems" }), p.note ? h("p", { class: "srow__s", text: p.note }) : null]),
            h("button", { type: "button", class: "price price--peso", text: peso(p.pesos), on: { click: notOpen } })
          ]);
        }))),
        section("streak", "Keep your streak", h("div", {}, Sh.streak.map(itemRow))),
        section("boost", "Boosts", h("div", {}, Sh.boosts.map(itemRow))),
        section("trail", "Map trails", tiles("trail")),
        section("frame", "Photo frames", tiles("frame")),
        h("p", { class: "muted muted--gap", text: "Trails and frames only change how things look. They never give anyone an edge." }),
        demoNote("Demo: Gems here are demo Gems. Spend them freely; nothing is charged or saved.")
      ])
    ]);
  };
  function notOpen() {
    dialog("Not open yet", "Gem packs and the Scout Pass open when Karela is on Google Play and the App Store. Nothing was charged.");
  }
  function buy(it, slot) {
    if (S.user.gems < it.price) { dialog("Not enough Gems", "You need " + (it.price - S.user.gems) + " more Gems. Run, report or claim a quest to earn some."); return; }
    dialog("Buy " + it.name + (slot ? " " + slot : "") + "?", it.price + " Gems. You have " + num(S.user.gems) + ".", [
      { text: "Cancel" },
      { text: "Buy", style: "primary", onPress: function () {
        S.user.gems -= it.price;
        if (it.id === "streak_freeze") S.user.freezes += 1;
        else if (slot) { S.shopOwned.push(it.id); S.worn[slot] = it.id; }
        else S.boosts[it.id] = true;
        render();
        toast(slot ? it.name + " " + slot + " is yours, and on." : it.name + " bought.", DEMO_NOTE);
      } }
    ]);
  }

  // ---------- Scout Pass (app/scout-pass.tsx) ----------
  SCREENS.scout = function () {
    var P = D.scoutPass;
    var lit = function (lv) { return lv <= P.seasonLevel; };
    return h("div", { class: "scr scr--bar" }, [
      header("Scout Pass"),
      h("div", { class: "pad" }, [
        h("div", { class: "sp__hero" }, [icon("ticket", 40, C.sky), h("p", { class: "sp__t", text: P.season }),
          h("p", { class: "lead2" }, [h("b", { class: "sky", text: peso(P.pesos) }), " for " + P.days + " days. Everything you unlock is yours to keep. Only the +20% Gem rate ends with the season."])]),
        h("div", { class: "sp__lvl" }, [
          h("p", { class: "sp__lrow" }, [h("b", { text: "Level " + P.seasonLevel }), h("span", { text: "of 20" })]),
          bar(P.seasonXp / 750 * 100),
          h("p", { class: "muted", text: P.seasonXp + " of 750 season XP to level " + (P.seasonLevel + 1) + ". Season XP comes from your runs." })
        ]),
        h("h2", { class: "sp__h", text: "With the pass" }),
        h("div", {}, P.benefits.map(function (b) {
          return h("div", { class: "sp__ben" }, [icon(b.icon, 24, C.brand), h("div", {}, [h("p", { class: "sp__bt", text: b.title }), h("p", { class: "muted", text: b.body })])]);
        })),
        h("h2", { class: "sp__h", text: "Reward track" }),
        h("div", { class: "trk", role: "table", "aria-label": "Reward track, first 10 levels" }, [
          h("div", { class: "trk__head", role: "row" }, [h("span", { role: "columnheader", text: "Level" }), h("span", { role: "columnheader", text: "Free" }), h("span", { role: "columnheader", text: "Pass" })])
        ].concat(P.track.map(function (r) {
          return h("div", { class: "trk__row" + (r[0] === P.seasonLevel + 1 ? " is-next" : ""), role: "row" }, [
            h("span", { role: "cell" }, h("span", { class: "trk__dot" + (lit(r[0]) ? " is-lit" : ""), text: r[0] })),
            h("span", { role: "cell", class: "trk__r" + (r[1] && lit(r[0]) ? "" : " is-dim"), text: r[1] || "-" }),
            h("span", { role: "cell", class: "trk__r is-dim", text: r[2] })
          ]);
        }))),
        h("p", { class: "muted muted--gap", text: "Levels 11 to 20 continue the same way, ending with the season finisher outfit for Ani." }),
        demoNote("Demo: the season level and XP are made up.")
      ]),
      h("div", { class: "buybar" }, [h("div", {}, [h("p", { class: "buybar__p", text: peso(P.pesos) }), h("p", { class: "muted", text: P.days + " days" })]),
        btn("Get the pass", { icon: "ticket", onPress: notOpen })])
    ]);
  };

  // ---------- My Progress (app/drawer/progress.tsx) ----------
  function last30() {
    var days = [];
    for (var i = 29; i >= 0; i--) {
      var m = 0, sec = 0;
      S.runs.forEach(function (r) { if (r.d === i) { m += r.m; sec += r.s; } });
      days.push({ d: i, m: m, s: sec });
    }
    return days;
  }
  SCREENS.progress = function () {
    var days = last30();
    var totM = days.reduce(function (a, x) { return a + x.m; }, 0);
    var totS = days.reduce(function (a, x) { return a + x.s; }, 0);
    var active = days.filter(function (x) { return x.m > 0; }).length;
    var max = Math.max.apply(null, days.map(function (x) { return x.m; }).concat([1]));
    var allKm = S.user.totalKm + (S.lastRun && S.ranToday ? S.lastRun.m / 1000 : 0);
    var chart = h("div", { class: "bars", role: "img", "aria-label": "Distance per day for the last 30 days. " + active + " days with a run." }, days.map(function (x) {
      return h("span", { class: "bars__b" + (x.d === 0 ? " is-today" : ""), style: { height: (x.m ? Math.max(6, x.m / max * 100) : 2) + "%" } });
    }));
    function tile(icn, val, lbl) { return h("div", { class: "ptile" }, [icon(icn, 20, C.brand), h("p", { class: "ptile__v", text: val }), h("p", { class: "ptile__l", text: lbl })]); }
    return screen([
      header("Your progress", { menu: true }),
      h("div", { class: "pad" }, [
        h("div", { class: "pr__big" }, [h("p", { class: "lbl", text: "Distance" }), h("p", { class: "pr__km" }, [allKm.toFixed(1), h("span", { text: " km" })]),
          h("p", { class: "muted", text: "All time, " + (S.user.totalRuns + (S.ranToday ? 1 : 0)) + " runs" })]),
        h("div", { class: "ptiles" }, [
          tile("streak", effectiveStreak() + " " + plural(effectiveStreak(), "day"), "Streak"),
          tile("time", Math.round(totS / 3600 * 10) / 10 + " h", "Time"),
          tile("xp", num(Math.round(totM / 1000 * S.user.weightKg)), "Calories, est."),
          tile("walk", num(Math.round(totM * 1.35)), "Steps, est.")
        ]),
        h("div", { class: "sec__row" }, [h("h2", { class: "sec", text: "Last 30 days" }), btn("View details", { variant: "link", size: "sm", onPress: function () { go("calendar"); } })]),
        h("div", { class: "card" }, [chart, h("div", { class: "stats3 stats3--flat" }, [
          [(totM / 1000).toFixed(1) + " km", "distance"], [active, "days you moved"], [paceText(paceFor(totM, totS)), "avg pace /km"]
        ].map(function (x) { return h("div", { class: "stats3__i" }, [h("p", { class: "stats3__n", text: x[0] }), h("p", { class: "stats3__l", text: x[1] })]); }))]),
        demoNote("Demo: these runs are made up. In the app, every finished run lands here.")
      ])
    ]);
  };

  // ---------- Calendar (app/drawer/calendar.tsx) ----------
  var calMode = "Weekly";
  var calMonth = 0; // months back from this one
  SCREENS.calendar = function () {
    var st = effectiveStreak(), mult = streakMult(st);
    var next = st >= 30 ? null : st >= 14 ? 30 : st >= 7 ? 14 : st >= 4 ? 7 : 4;
    var seg = h("div", { class: "seg", role: "tablist", "aria-label": "Weekly or monthly" }, ["Weekly", "Monthly"].map(function (m) {
      var on = calMode === m;
      return h("button", { type: "button", role: "tab", "aria-selected": String(on), class: "seg__b" + (on ? " is-on" : ""), text: m, on: { click: function () { calMode = m; render(); } } });
    }));
    var body;
    var runOn = function (dAgo) { return S.runs.filter(function (r) { return r.d === dAgo; }); };
    if (calMode === "Weekly") {
      var rows = [];
      for (var i = 0; i < 7; i++) {
        var rr = runOn(i), m = rr.reduce(function (a, r) { return a + r.m; }, 0), sec = rr.reduce(function (a, r) { return a + r.s; }, 0);
        var date = daysAgo(i);
        rows.push(h("div", { class: "wk" + (m ? "" : " is-off") }, [
          h("div", { class: "wk__d" }, [h("b", { text: date.toLocaleDateString("en-PH", { weekday: "short" }) }), h("span", { text: date.getDate() })]),
          m ? h("div", { class: "wk__v" }, [h("span", {}, [h("small", { text: "Distance" }), h("b", { text: kmText(m) + " km" })]), h("span", {}, [h("small", { text: "Time" }), h("b", { text: clockText(sec) })])])
            : h("p", { class: "muted", text: i === 0 ? "No run yet today" : "Rest day" })
        ]));
      }
      body = h("div", {}, [h("p", { class: "cal__cap", text: "Last 7 days" })].concat(rows));
    } else {
      var base = new Date(); base.setDate(1); base.setMonth(base.getMonth() - calMonth);
      var y = base.getFullYear(), mo = base.getMonth();
      var first = new Date(y, mo, 1).getDay(), dim = new Date(y, mo + 1, 0).getDate();
      var grid = h("div", { class: "mgrid" });
      ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) { grid.appendChild(h("span", { class: "mgrid__h", text: d, "aria-hidden": "true" })); });
      for (var b = 0; b < first; b++) grid.appendChild(h("span"));
      var today0 = dayStart(new Date());
      for (var dd = 1; dd <= dim; dd++) {
        var dt = new Date(y, mo, dd);
        var ago = Math.round((today0 - dt) / 86400000);
        var ran = ago >= 0 && runOn(ago).length > 0;
        grid.appendChild(h("span", { class: "mgrid__d" + (ran ? " is-ran" : "") + (ago === 0 ? " is-today" : ""), "aria-label": dd + (ran ? ", ran" : ""), text: dd }));
      }
      body = h("div", {}, [
        h("div", { class: "mhead" }, [
          iconBtn("back", "Previous month", function () { calMonth = Math.min(calMonth + 1, 2); render(); }),
          h("p", { class: "mhead__t", text: base.toLocaleDateString("en-PH", { month: "long", year: "numeric" }) }),
          iconBtn("fwd", "Next month", function () { calMonth = Math.max(calMonth - 1, 0); render(); })
        ]),
        grid
      ]);
    }
    return screen([
      header("Calendar"),
      h("div", { class: "pad" }, [
        h("div", { class: "card tier" }, [icon("streak", 26, C.civic), h("div", {}, [
          h("p", { class: "tier__t", text: st + "-day streak, " + mult + "x XP (" + tierLabel(st) + ")" }),
          h("p", { class: "muted", text: next ? (next - st) + " more " + plural(next - st, "day") + " for " + streakMult(next) + "x." : "You are at the 3.0x cap." })
        ])]),
        seg, body,
        demoNote("Demo: the run days are made up.")
      ])
    ]);
  };

  // ---------- Profile (app/drawer/profile.tsx) ----------
  SCREENS.profile = function () {
    var st = effectiveStreak();
    var week = S.runs.filter(function (r) { return r.d < 7; });
    var weekKm = week.reduce(function (a, r) { return a + r.m; }, 0) / 1000;
    function stat(v, l) { return h("div", { class: "pstat" }, [h("p", { class: "pstat__v", text: v }), h("p", { class: "pstat__l", text: l })]); }
    var recent = S.runs.slice().sort(function (a, b) { return a.d - b.d; }).slice(0, 5);
    return screen([
      header("Profile", { right: iconBtn("settings", "Settings", function () { toast("Settings aren't part of the demo."); }) }),
      h("div", { class: "pad" }, [
        h("div", { class: "prof" }, [avatar(96, frameColors()),
          h("p", { class: "prof__n", text: S.user.name }), h("p", { class: "muted", text: "@" + S.user.username + ", level " + S.user.level }),
          btn("Edit profile", { variant: "secondary", size: "sm", icon: "edit", onPress: function () { toast("Editing isn't part of the demo."); } })]),
        h("div", { class: "pstats" }, [stat(st, "Streak"), stat(S.user.bestStreak, "Best streak"), stat(streakMult(st) + "x", "XP bonus")]),
        h("h2", { class: "sec", text: "Your running" }),
        h("div", { class: "pstats" }, [stat(S.user.totalRuns + (S.ranToday ? 1 : 0), "Runs"), stat(S.user.totalKm.toFixed(0) + " km", "Distance"), stat(weekKm.toFixed(1) + " km", "This week")]),
        h("h2", { class: "sec", text: "Recent runs" }),
        h("div", { class: "card" }, recent.map(function (r) {
          var date = daysAgo(r.d);
          return h("div", { class: "rrow" }, [
            h("div", {}, [h("p", { class: "rrow__d", text: r.d === 0 ? "Today" : r.d === 1 ? "Yesterday" : date.toLocaleDateString("en-PH", { weekday: "long", month: "short", day: "numeric" }) }),
              h("p", { class: "muted", text: clockText(r.s) + ", " + paceText(paceFor(r.m, r.s)) + " /km" })]),
            h("p", { class: "rrow__km", text: kmText(r.m) + " km" })
          ]);
        })),
        demoNote("Demo: Randel's profile and runs are made up.")
      ])
    ]);
  };

  // ---------- Customize Ani (app/homepage/CustomizeAni.tsx) ----------
  SCREENS.customize = function () {
    var moves = [["idle", "Idle"], ["walk", "Walk"], ["run", "Run"]];
    return screen([
      header("Customize Ani"),
      h("div", { class: "pad" }, [
        h("div", { class: "cz__stage" }, h("span", { class: "sprite sprite--" + S.aniMove, style: { "--fh": "260px" }, role: "img", "aria-label": "Ani, " + S.aniMove })),
        h("h2", { class: "sec", text: "Moves" }),
        h("div", { class: "chips" }, moves.map(function (m) {
          var on = S.aniMove === m[0];
          return h("button", { type: "button", class: "chip" + (on ? " is-on" : ""), "aria-pressed": String(on), text: m[1], on: { click: function () { S.aniMove = m[0]; render(); } } });
        })),
        h("h2", { class: "sec", text: "Her look" }),
        h("div", { class: "card" }, [["Outfit"], ["Colours"]].map(function (r) {
          return h("div", { class: "lrow" }, [h("p", { class: "lrow__n", text: r[0] }), h("span", { class: "soon", text: "Coming soon" })]);
        })),
        h("p", { class: "muted muted--gap", text: "In the app, Ani is a 3D model. The demo uses drawings of the same model to stay light." }),
        btn("Done", { block: true, onPress: back })
      ])
    ]);
  };

  // ---------- Run summary (app/summary.tsx) ----------
  SCREENS.summary = function () {
    var r = S.lastRun;
    if (!r) return screen([header("Run not found"), h("p", { class: "pad body", text: "This run isn't on this phone any more." })]);
    var xp = Math.floor(r.m / 10);
    var kcal = Math.round(r.m / 1000 * S.user.weightKg);
    var pace = paceFor(r.m, r.s), kmh = r.s > 0 ? r.m / r.s * 3.6 : 0;
    function tile(ic, v, l) { return h("div", { class: "stile" }, [icon(ic, 24, C.brand), h("p", { class: "stile__v", text: v }), h("p", { class: "stile__l", text: l })]); }
    return h("div", { class: "scr scr--sum" }, [
      h("div", { class: "sum__head" }, [h("p", { class: "sum__k", text: "Run complete" }), h("h1", { class: "sum__t", "data-title": "", text: "Nice work" })]),
      h("div", { class: "sum__xp" }, h("div", { class: "sum__xpin" }, [h("p", { class: "sum__xpn", text: "+" + xp }), h("p", { class: "sum__xpl", text: "XP earned" })])),
      h("div", { class: "sum__grid" }, [
        tile("pin", kmText(r.m) + " km", "Distance"), tile("time", clockText(r.s), "Time"),
        tile("speed", pace ? paceText(pace) + " /km" : "--", pace ? "Avg pace, " + kmh.toFixed(1) + " km/h" : "Avg pace"),
        tile("streak", String(kcal), "Calories, est.")
      ]),
      !pace ? h("p", { class: "muted center", text: "Pace shows once a run is at least 100 m long." }) : null,
      r.ghostBeat !== undefined ? h("p", { class: "sum__ghost" }, [icon("ghost", 18, C.gold), h("span", { text: r.ghostBeat >= 0 ? "You beat your ghost by " + clockText(r.ghostBeat) + "." : "Your ghost finished " + clockText(-r.ghostBeat) + " ahead. Next time." })]) : null,
      h("div", { class: "sum__btns" }, [
        btn("Save as ghost", { variant: "secondary", icon: "copy", block: true, onPress: function () { dialog("Ghost saved", "Your ghost will learn from this run.\n\n" + DEMO_NOTE); } }),
        btn("Save and finish", { block: true, onPress: finishRun })
      ])
    ]);
  };
  function finishRun() {
    var r = S.lastRun;
    if (!r || r.saved) return;
    r.saved = true;
    S.ranToday = true;
    S.runs.unshift({ d: 0, m: r.m, s: r.s });
    var km = r.m / 1000;
    S.quests.forEach(function (q) {
      if (q.claimed) return;
      if (q.type === "distance") q.current = Math.round((q.current + km) * 100) / 100;
      if (q.type === "streak") q.current = Math.min(q.target, q.current + 1);
    });
    var xp = boostedXp(Math.floor(r.m / 10));
    var gems = Math.floor(r.m / 500) * 5;
    var up = award(xp, gems);
    go("home", {}, { reset: true });
    toast("+" + num(xp) + " XP, +" + gems + " Gems" + (up ? ". Level " + S.user.level + "!" : ""),
      "With your " + effectiveStreak() + "-day streak (" + streakMult(effectiveStreak()) + "x) and the guild's Pioneer badge. " + DEMO_NOTE);
  }

  /* ==========================================================
     6. THE MAP AND THE RUN
     ========================================================== */
  // A drawn neighbourhood, not real streets. viewBox 400 x 800.
  var ROADS = [
    [[200, 820], [200, 420], [150, 300], [150, -20]],
    [[290, 820], [290, 300], [250, 200], [250, -20]],
    [[40, 200], [420, 200]], [[30, 420], [420, 420]], [[45, 560], [420, 560]], [[-20, 700], [420, 700]],
    [[345, -20], [345, 820]], [[150, 300], [290, 300]], [[95, 90], [420, 60]], [[100, 320], [150, 300]],
    [[200, 640], [290, 640]], [[60, 120], [150, 160]]
  ];
  var MAJOR = [0, 5];
  var LOOP = [[200, 560], [200, 420], [150, 300], [150, 200], [250, 200], [290, 300], [290, 420], [290, 560], [200, 560]];
  var loopLen = 0, segs = [];
  (function () {
    for (var i = 1; i < LOOP.length; i++) {
      var a = LOOP[i - 1], b = LOOP[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push({ a: a, b: b, l: l, at: loopLen });
      loopLen += l;
    }
  })();
  function pointAt(meters) {
    var u = ((meters / (D.run.loopKm * 1000)) % 1) * loopLen;
    for (var i = 0; i < segs.length; i++) {
      var sg = segs[i];
      if (u <= sg.at + sg.l) {
        var t = (u - sg.at) / sg.l;
        return { x: sg.a[0] + (sg.b[0] - sg.a[0]) * t, y: sg.a[1] + (sg.b[1] - sg.a[1]) * t, dir: Math.atan2(sg.b[1] - sg.a[1], sg.b[0] - sg.a[0]) };
      }
    }
    return { x: LOOP[0][0], y: LOOP[0][1], dir: 0 };
  }

  var mapRefs = {};
  function buildMap(opts) {
    opts = opts || {};
    var svg = s("svg", { class: "map" + (opts.mini ? " map--mini" : ""), viewBox: opts.mini ? "70 250 280 240" : "0 0 400 800",
      preserveAspectRatio: "xMidYMid slice", role: "img",
      "aria-label": opts.mini ? "Map preview" : "Map of a drawn neighbourhood in Tuguegarao with your route, reports and landmarks. An illustration, not real streets." });
    // land, river, parks
    svg.appendChild(s("rect", { x: -50, y: -50, width: 520, height: 920, fill: "#111813" }));
    svg.appendChild(s("path", { d: "M-60 -40 L40 -40 C80 140 20 300 70 470 C100 590 30 690 60 840 L-60 840 Z", fill: "#0E3B2E" }));
    [[215, 440, 60, 100], [300, 450, 35, 90], [165, 610, 30, 70], [262, 80, 70, 100]].forEach(function (p) {
      svg.appendChild(s("rect", { x: p[0], y: p[1], width: p[2], height: p[3], rx: 6, fill: "#17211A" }));
    });
    ROADS.forEach(function (r, i) {
      var d = r.map(function (p, j) { return (j ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
      svg.appendChild(s("path", { d: d, fill: "none", stroke: "#1E2B22", "stroke-width": MAJOR.indexOf(i) >= 0 ? 16 : 11, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    });
    svg.appendChild(s("path", { d: "M-20 700 L90 700", stroke: "#2A3A2F", "stroke-width": 18, "stroke-linecap": "round" })); // bridge
    if (!opts.mini) {
      svg.appendChild(s("text", { x: 34, y: 400, class: "map__river", transform: "rotate(-80 34 400)", text: "Cagayan River" }));
      if (opts.territory) svg.appendChild(s("text", { x: 396, y: 600, class: "map__note", "text-anchor": "end", text: "Illustration, not to scale" }));
    }
    // landmarks
    D.landmarks.forEach(function (l) {
      var c = l.holder ? GUILD_COLORS[l.holder.color] : C.muted;
      svg.appendChild(s("circle", { cx: l.x, cy: l.y, r: 46, fill: c, "fill-opacity": l.holder ? 0.13 : 0.06, stroke: c, "stroke-width": 1.6 }));
      if (!opts.mini) {
        var g = s("g", { transform: "translate(" + (l.x - 10) + " " + (l.y - 24) + ")" });
        g.appendChild(icon("territory", 20, c));
        svg.appendChild(g);
        svg.appendChild(s("text", { x: l.x, y: l.y + 14, class: "map__lm", "text-anchor": "middle", text: l.name }));
      }
    });
    if (opts.territory) return svg;
    if (opts.mini) {
      // Home's preview: you, and the reports around you.
      S.reports.forEach(function (r) {
        var col = r.status === "verified" ? C.brand : r.status === "aging" ? C.civic : C.muted;
        svg.appendChild(s("circle", { cx: r.x, cy: r.y, r: 9, fill: col, stroke: C.ink, "stroke-width": 2 }));
      });
      svg.appendChild(s("circle", { cx: 200, cy: 420, r: 22, fill: C.brand, "fill-opacity": 0.16 }));
      svg.appendChild(s("circle", { cx: 200, cy: 420, r: 8, fill: C.brand, stroke: "#0B0F0C", "stroke-width": 3 }));
      return svg;
    }

    // ghost line, trail, reports, ghost, you
    var loopD = LOOP.map(function (p, j) { return (j ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
    mapRefs.ghostLine = s("path", { d: loopD, fill: "none", stroke: "rgba(255,215,0,0.4)", "stroke-width": 4, "stroke-dasharray": "5 10", "stroke-linecap": "round", class: "map__ghostline" });
    svg.appendChild(mapRefs.ghostLine);
    var cols = trailColors();
    if (cols.length > 1) {
      svg.appendChild(s("defs", {}, s("linearGradient", { id: "trailG", x1: "0", y1: "1", x2: "0", y2: "0" },
        cols.map(function (c, i) { return s("stop", { offset: i / (cols.length - 1), "stop-color": c }); }))));
    }
    mapRefs.trail = s("polyline", { points: "", fill: "none", stroke: cols.length > 1 ? "url(#trailG)" : cols[0], "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" });
    svg.appendChild(mapRefs.trail);
    S.reports.forEach(function (r) {
      var col = r.status === "verified" ? C.brand : r.status === "aging" ? C.civic : C.muted;
      var g = s("g", { class: "map__pin", transform: "translate(" + r.x + " " + r.y + ")", tabindex: "0", role: "button", "aria-label": catOf(r.cat).label + ", " + r.status + ". Open the report." });
      g.appendChild(s("circle", { r: 14, fill: col, stroke: C.ink, "stroke-width": 2 }));
      var ig = s("g", { transform: "translate(-7 -7)" });
      ig.appendChild(icon(catOf(r.cat).icon, 14, C.onBright, { sw: 2.2 }));
      g.appendChild(ig);
      var open = function (e) { if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return; e.preventDefault(); nodeSheet(r); };
      g.addEventListener("click", open);
      g.addEventListener("keydown", open);
      svg.appendChild(g);
    });
    mapRefs.ghost = s("circle", { r: 9, fill: C.gold, stroke: "#fff", "stroke-width": 3, class: "map__ghost" });
    svg.appendChild(mapRefs.ghost);
    mapRefs.me = s("g", {}, [s("circle", { r: 18, fill: C.brand, "fill-opacity": 0.18 }), s("circle", { r: 8, fill: C.brand, stroke: "#0B0F0C", "stroke-width": 3 }),
      s("path", { d: "M0 -19 L6 -10 L-6 -10 Z", fill: C.brand })]);
    svg.appendChild(mapRefs.me);
    return svg;
  }

  // --- Run state ---
  var R = null; // { phase, m, s, ghostM, timer, path, paused, stamina }
  function newRun() { return { phase: "idle", m: 0, s: 0, ghostM: 0, timer: null, path: [], paused: false, stamina: 100, reported: false }; }

  SCREENS.run = function () {
    if (!R || R.phase === "done") R = newRun();
    var el = h("div", { class: "scr scr--map" });
    el.appendChild(buildMap());
    mapRefs.root = el;

    // HUD (components/run/RunHUD.tsx)
    mapRefs.hud = h("div", { class: "hud", hidden: R.phase === "idle" ? true : null, "aria-live": "off" });
    el.appendChild(mapRefs.hud);
    // Resonance pill (components/CivicHUD.tsx)
    mapRefs.res = h("div", { class: "res", hidden: R.phase === "idle" ? true : null });
    el.appendChild(mapRefs.res);

    // Tools when not running
    mapRefs.tools = h("div", { class: "tools", hidden: R.phase !== "idle" ? true : null }, [
      iconBtn("back", "Back", back, { tone: "surface", cls: "tools__back" }),
      h("div", { class: "tools__right" }, [
        iconBtn("compass", "Point the map north", function () { toast("The map already points north."); }, { tone: "surface" }),
        iconBtn("flash", S.ghostOn ? "Hide your ghost" : "Race your ghost", function () {
          S.ghostOn = !S.ghostOn; render();
          toast(S.ghostOn ? "Ghost on." : "Ghost off.", S.ghostOn ? "Your ghost runs at your usual pace, 6:30 per km. Beat it." : null);
        }, { tone: S.ghostOn ? "brand" : "surface", pressed: S.ghostOn, color: S.ghostOn ? C.onBright : undefined }),
        iconBtn("flag", "Add a checkpoint", function () { toast("Checkpoints aren't part of the demo.", "In the app you drop flags to build a route."); }, { tone: "surface" })
      ])
    ]);
    el.appendChild(mapRefs.tools);

    // Report button
    var needs = S.reports.filter(function (r) { return r.status !== "verified"; }).length;
    el.appendChild(h("div", { class: "fab" }, [
      h("button", { type: "button", class: "fab__b", "aria-label": "Report an issue. " + needs + " nearby " + plural(needs, "report needs", "reports need") + " a check", on: { click: reportSheet } }, [
        h("span", { class: "fab__well" }, [h("i"), h("i"), h("i"), h("i"), icon("camera", 16, C.onBright)]), h("span", { text: "Report" })
      ]),
      needs ? h("span", { class: "fab__badge", text: needs, "aria-hidden": "true" }) : null
    ]));

    mapRefs.ctrl = h("div", { class: "rctrl" });
    el.appendChild(mapRefs.ctrl);
    el.appendChild(h("p", { class: "map__demo" }, "Demo run, " + D.run.speedUp + "x faster than real time. The map is an illustration."));
    paintRun();
    renderCtrl();
    // Back on this screen mid-run: the run carries on, as in the app.
    if (R.phase === "running" && !R.timer) R.timer = setInterval(stepRun, 100);
    return el;
  };

  function renderCtrl() {
    var c = mapRefs.ctrl;
    if (!c) return;
    c.textContent = "";
    if (R.phase === "idle") c.appendChild(btn("Start", { icon: "play", onPress: startRun }));
    else {
      c.classList.add("rctrl--two");
      append(c, [
        btn(R.paused ? "Resume" : "Pause", { variant: R.paused ? "primary" : "secondary", icon: R.paused ? "play" : "pause", block: true, onPress: togglePause }),
        btn("End", { variant: "danger", icon: "stop", block: true, onPress: askEnd })
      ]);
    }
  }

  function startRun() {
    if (S.storm) {
      dialog("Storm in Tuguegarao", "Ani won't ask you to run in this weather. In the demo you can still try a run; in a real storm, please stay in.", [
        { text: "Not now" }, { text: "Try the demo run", style: "primary", onPress: begin }
      ]);
      return;
    }
    begin();
  }
  function begin() {
    R.phase = "running";
    mapRefs.tools.hidden = true;
    mapRefs.hud.hidden = false;
    mapRefs.res.hidden = false;
    renderCtrl();
    R.timer = setInterval(stepRun, 100);
    paintRun();
  }
  function togglePause() { R.paused = !R.paused; renderCtrl(); paintRun(); }
  function stepRun() {
    if (R.paused || route !== "run") return;
    var dt = 0.1 * D.run.speedUp;
    R.s += dt;
    R.m += dt * 1000 / D.run.paceSPerKm;
    R.ghostM += dt * 1000 / D.run.ghostPaceSPerKm;
    R.stamina = Math.max(58, 100 - R.s / 45);
    var p = pointAt(R.m);
    var last = R.path[R.path.length - 1];
    if (!last || Math.hypot(last[0] - p.x, last[1] - p.y) > 3) R.path.push([Math.round(p.x), Math.round(p.y)]);
    paintRun();
  }
  function nearReport() {
    var p = pointAt(R.m);
    return S.reports.filter(function (r) { return r.status !== "verified" && Math.hypot(r.x - p.x, r.y - p.y) < 55; })[0];
  }
  function paintRun() {
    if (!mapRefs.me || !R) return;
    var p = pointAt(R.m);
    mapRefs.me.setAttribute("transform", "translate(" + p.x + " " + p.y + ") rotate(" + (p.dir * 180 / Math.PI + 90) + ")");
    var pts = R.path.slice(-260).map(function (q) { return q[0] + "," + q[1]; }).join(" ");
    mapRefs.trail.setAttribute("points", pts);
    var gp = pointAt(R.ghostM);
    mapRefs.ghost.setAttribute("cx", gp.x);
    mapRefs.ghost.setAttribute("cy", gp.y);
    mapRefs.ghost.style.display = S.ghostOn ? "" : "none";
    mapRefs.ghostLine.style.display = S.ghostOn ? "" : "none";
    if (R.phase === "idle") return;

    // HUD
    var hud = mapRefs.hud;
    hud.textContent = "";
    hud.classList.toggle("is-paused", R.paused);
    var avg = paceFor(R.m, R.s);
    var now = R.paused ? null : D.run.paceSPerKm + Math.round(Math.sin(R.s / 40) * 12);
    append(hud, [
      h("div", { class: "hud__main" }, [
        h("div", {}, [h("p", { class: "hud__big" }, [kmText(R.m), h("span", { text: " km" })]), h("p", { class: "lbl", text: "Distance" })]),
        h("span", { class: "hud__rule" }),
        h("div", { class: "hud__r" }, [h("p", { class: "hud__big" + (R.paused ? " is-gold" : ""), text: clockText(R.s) }), h("p", { class: "lbl", text: "Time" })])
      ]),
      h("div", { class: "hud__sub" }, [
        h("div", {}, [h("p", { class: "hud__v", text: paceText(avg) }), h("p", { class: "lbl", text: "Avg pace /km" })]),
        h("div", {}, [h("p", { class: "hud__v", text: paceText(now) }), h("p", { class: "lbl", text: "Now /km" })]),
        h("div", { class: "hud__r" }, [h("p", { class: "hud__gps" }, [h("i"), "GPS good"]), h("p", { class: "lbl", text: S.ghostOn ? ghostLine() : "Signal" })])
      ]),
      R.paused ? h("p", { class: "hud__status" }, [icon("pause", 16, C.gold), h("span", { text: "Paused. Distance and time aren't counting." })]) : null
    ]);

    // Resonance
    var near = nearReport();
    var role = R.stamina < 62 ? "focus" : near ? "vanguard" : "scout";
    var RC = { scout: ["SCOUT", "Passive sensing active", C.brand], vanguard: ["VANGUARD", "Civic tasks available", C.gold], focus: ["FOCUS", "Push hard, civic paused", C.muted] }[role];
    var res = mapRefs.res;
    res.textContent = "";
    append(res, [
      h("span", { class: "res__dot" + (role === "scout" ? " is-grad" : ""), style: role === "scout" ? null : { background: RC[2] } }),
      h("span", { class: "res__txt" }, [h("b", { style: { color: RC[2] }, text: RC[0] }), h("span", { text: RC[1] })]),
      h("span", { class: "res__ring" + (R.stamina >= 60 ? " is-grad" : ""), "aria-label": "Stamina " + Math.round(R.stamina) + "%" }, [h("b", { text: Math.round(R.stamina) }), h("small", { text: "%" })])
    ]);
  }
  function ghostLine() {
    var diffM = R.m - R.ghostM;
    var sec = Math.abs(Math.round(diffM / (1000 / D.run.ghostPaceSPerKm)));
    return diffM >= 0 ? "Ghost " + sec + " s behind" : "Ghost " + sec + " s ahead";
  }
  function askEnd() {
    if (R.m < 50) {
      dialog("End this run?", "You've covered less than 50 m, so there's nothing to save yet.", [
        { text: "Keep going" }, { text: "Discard run", style: "danger", onPress: function () { stopRun(true); R = newRun(); render(); } }
      ]);
      return;
    }
    dialog("End this run?", kmText(R.m) + " km in " + clockText(R.s) + ".", [
      { text: "Keep going" },
      { text: "End run", style: "primary", onPress: function () {
        var ghostBeat = S.ghostOn ? Math.round((R.m - R.ghostM) / (1000 / D.run.ghostPaceSPerKm)) : undefined;
        S.lastRun = { m: Math.floor(R.m), s: Math.floor(R.s), ghostBeat: ghostBeat };
        stopRun(true);
        R.phase = "done";
        go("summary", {}, { replace: true });
      } }
    ]);
  }
  function stopRun(keep) {
    if (R && R.timer) { clearInterval(R.timer); R.timer = null; }
    if (!keep) R = null;
  }

  // --- Reporting (CivicHUD sheet, simulated camera) ---
  function reportSheet() {
    if (R && R.phase === "running" && R.stamina < 62) { toast("Reporting is paused while you push hard.", "Resonance turns civic requests off when your body needs the effort."); return; }
    var grid = h("div", { class: "cats" }, CIVIC_CATS.map(function (c) {
      return h("button", { type: "button", class: "cat", on: { click: function () { cameraSheet(c); } } }, [h("span", { class: "cat__i" }, icon(c.icon, 20, C.civic)), h("span", { text: c.label })]);
    }));
    sheet("Report an issue", "Pick a category, then take a photo. Reports from 3 neighbours verify an issue.",
      h("div", { class: "sheet__body" }, [grid, btn("Cancel", { variant: "secondary", block: true, onPress: closeAll })]), { icon: "camera" });
  }
  function cameraSheet(cat) {
    var panel = h("div", { class: "cam", role: "dialog", "aria-modal": "true", "aria-label": "Take a photo" }, [
      h("div", { class: "cam__view" }, [h("i"), h("i"), h("i"), h("i"), h("p", { class: "cam__hint" }, [h("b", { text: catOf(cat.id).label }), h("span", { text: "Demo: no camera is used. Tap the button to pretend." })])]),
      h("div", { class: "cam__bar" }, [
        btn("Cancel", { variant: "link", onPress: closeAll }),
        h("button", { type: "button", class: "cam__shutter", "aria-label": "Take the photo", on: { click: function () { submitReport(cat); } } }),
        h("span", { class: "cam__gap" })
      ])
    ]);
    openOverlay(panel, "cam");
  }
  function submitReport(cat, onto) {
    closeAll();
    var p = R && R.phase !== "idle" ? pointAt(R.m) : { x: 250, y: 470 };
    var verified = false;
    if (onto) {
      onto.count += 1;
      if (onto.count >= 3) { onto.status = "verified"; verified = true; }
    } else {
      S.reports.push({ id: "n" + Date.now(), cat: cat.id, status: "pending", x: Math.round(p.x + 18), y: Math.round(p.y - 14), count: 1, days: 0 });
    }
    S.quests.forEach(function (q) { if (q.type === "civic" && !q.claimed) q.current = Math.min(q.target, q.current + 1); });
    var raw = verified ? 200 : 50;
    if (S.boosts.bayanihan_boost) raw = Math.round(raw * 1.25);
    var xp = boostedXp(raw), gems = verified ? 20 : 5;
    var up = award(xp, gems);
    if (route === "run") rebuildRunKeepingState();
    dialog(verified ? "Report verified" : "Report sent",
      (verified ? "Neighbours confirmed this issue. It's now verified data the city can act on." : "1 of 3 reports. It stays pending until 3 people nearby report it.") +
      "\n+" + xp + " XP, +" + gems + " Gems" + (S.boosts.bayanihan_boost ? "\nBayanihan Boost: +25% XP" : "") + (up ? "\nYou reached level " + S.user.level + "." : "") + "\n\n" + DEMO_NOTE);
  }
  function rebuildRunKeepingState() {
    // The pins changed: draw the map again without resetting the run.
    var sc = view.firstChild;
    var node = SCREENS.run();
    view.replaceChild(node, sc);
    if (R.phase !== "idle") { mapRefs.tools.hidden = true; mapRefs.hud.hidden = false; mapRefs.res.hidden = false; renderCtrl(); paintRun(); }
  }
  function nodeSheet(r) {
    var cat = catOf(r.cat);
    var label = { verified: "VERIFIED", pending: "PENDING", aging: "AGING" }[r.status];
    var conf = r.status === "verified" ? 0.92 : r.status === "aging" ? 0.38 : 0.6;
    var line = r.status === "verified" ? "Recently confirmed by neighbours" : r.status === "aging" ? "Getting old. It needs a fresh check soon." : r.count + " of 3 neighbours have reported it.";
    var act = r.status === "pending"
      ? btn("Report it too", { icon: "camera", variant: "civic", block: true, onPress: function () { submitReport(cat, r); } })
      : btn("Still there", { icon: "check", block: true, onPress: function () {
        r.status = "verified"; r.days = 0; closeAll(); if (route === "run") rebuildRunKeepingState();
        toast("Thanks. It's marked as still there.", "Fresh checks keep reports from going stale. " + DEMO_NOTE);
      } });
    var body = h("div", { class: "sheet__body" }, [
      h("span", { class: "npill npill--" + r.status, text: label }),
      h("p", { class: "lbl", text: "Confidence" }),
      bar(conf * 100, r.status === "aging" ? "track--civic" : ""),
      h("p", { class: "body", text: line }),
      h("p", { class: "muted", text: r.count + " " + plural(r.count, "report") + ", first one " + (r.days === 0 ? "today" : r.days + " " + plural(r.days, "day") + " ago") + "." }),
      act,
      demoNote("Demo: this report is made up.")
    ]);
    sheet(cat.label, null, body, { icon: cat.icon });
  }

  /* ==========================================================
     7. THE PAGE AROUND THE PHONE
     ========================================================== */
  var stage = document.querySelector("[data-stage]");
  var fullBtn = document.querySelector("[data-full]");
  var exitBtn = document.querySelector("[data-full-exit]");
  function setFull(on) {
    if (!stage) return;
    stage.classList.toggle("is-full", on);
    document.body.classList.toggle("demo-locked", on);
    if (fullBtn) fullBtn.setAttribute("aria-pressed", String(on));
    if (exitBtn) exitBtn.hidden = !on;
    // Hide the browser's own bars too where the browser allows it (Android).
    try {
      if (on && stage.requestFullscreen && !document.fullscreenElement) stage.requestFullscreen().catch(function () {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(function () {});
    } catch (e) { /* not supported: the CSS full screen still works */ }
    (on ? (exitBtn || root) : fullBtn || root).focus({ preventScroll: true });
  }
  if (fullBtn) fullBtn.addEventListener("click", function () { setFull(!stage.classList.contains("is-full")); });
  if (exitBtn) exitBtn.addEventListener("click", function () { setFull(false); });
  document.addEventListener("fullscreenchange", function () { if (!document.fullscreenElement && stage.classList.contains("is-full")) setFull(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && stage && stage.classList.contains("is-full") && !overlay.firstChild) setFull(false); });

  // "Things to try": each opens the right screen.
  document.querySelectorAll("[data-try]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-try");
      if (t === "run") { go("run", {}, { reset: true }); }
      else if (t === "report") { go("run", {}, { reset: true }); setTimeout(reportSheet, 60); }
      else if (t === "quest") { questTab = { cat: "solo", freq: "weekly" }; go("quests", {}, { reset: true }); }
      else if (t === "ani") { go("ani", {}, { reset: true }); }
      else if (t === "shield") { squadTab = "squad"; go("squad", {}, { reset: true }); }
      else if (t === "territory") { squadTab = "territory"; go("squad", {}, { reset: true }); }
      else if (t === "shop") { go("shop", {}, { reset: true }); }
      if (window.matchMedia("(max-width: 767.98px)").matches && stage) stage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      else root.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll("[data-weather]").forEach(function (r) {
    r.addEventListener("change", function () {
      if (!r.checked) return;
      S.storm = r.value === "storm";
      render();
      toast(S.storm ? "Storm mode on (demo)." : "Clear skies again (demo).", S.storm ? "See how Home and Ani change: Karela stops asking you to run." : null);
    });
  });

  var resetBtn = document.querySelector("[data-reset]");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    stopRun(); S = freshState(); R = null; questTab = { cat: "solo", freq: "daily" }; squadTab = "squad";
    document.querySelectorAll("[data-weather]").forEach(function (r) { r.checked = r.value === "clear"; });
    route = "home"; stack = []; closeAll(); render(true);
    toast("Demo reset.", "Randel's account is back to how it started.");
  });

  root.setAttribute("tabindex", "-1");
  render(false);
})();
