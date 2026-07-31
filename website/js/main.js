/* ============================================================
   KARELA WEB — MAIN
   ------------------------------------------------------------
   Vanilla ES2020. No dependencies, no build step.

   Modules, in order:
     1. Sticky nav + scroll progress
     2. Mobile menu (toggle, focus trap, Esc, breakpoint reset)
     3. Scroll reveals
     4. Active nav link tracking
     5. Streak multiplier slider
     6. Consensus animation (Civic Engine)
     7. Waitlist form
     8. Footer year

   Settings live in js/config.js. Scroll listeners are passive and
   rAF-throttled so scrolling stays smooth on low-end Android —
   the same constraint the mobile app is built for.
   ============================================================ */

(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const CONFIG = window.KARELA_CONFIG || {};

  // CSS uses .no-js to keep reveal content visible if this script
  // never runs. It has run, so remove it.
  root.classList.remove("no-js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /** Coalesce rapid events into one animation frame. */
  function rafThrottle(fn) {
    let queued = false;
    return function throttled() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        fn();
      });
    };
  }

  /* ========================================================
     1. STICKY NAV + SCROLL PROGRESS
     ======================================================== */
  (function initNavScroll() {
    const nav = document.querySelector("[data-nav]");
    const progress = document.querySelector("[data-scroll-progress]");
    const THRESHOLD = 24;

    function onScroll() {
      const y = window.scrollY || root.scrollTop;

      if (nav) nav.classList.toggle("is-scrolled", y > THRESHOLD);

      if (progress) {
        const max = root.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(y / max, 1) : 0;
        progress.style.transform = "scaleX(" + ratio + ")";
      }
    }

    window.addEventListener("scroll", rafThrottle(onScroll), { passive: true });
    window.addEventListener("resize", rafThrottle(onScroll), { passive: true });
    onScroll(); // initial state, handles reload mid-page
  })();

  /* ========================================================
     2. MOBILE MENU
     ======================================================== */
  (function initMobileMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    if (!toggle || !menu) return;

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocused = null;

    const isOpen = () => menu.classList.contains("is-open");

    function open() {
      lastFocused = document.activeElement;
      menu.classList.add("is-open");
      menu.removeAttribute("inert");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      body.classList.add("is-locked");

      const first = menu.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    function close() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      body.classList.remove("is-locked");

      // Hide from assistive tech once the fade-out completes.
      window.setTimeout(() => {
        if (!isOpen()) menu.setAttribute("inert", "");
      }, 300);

      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    toggle.addEventListener("click", () => (isOpen() ? close() : open()));

    // Close after tapping an in-page anchor.
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a[href^='#']")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key !== "Tab") return;

      const nodes = Array.from(menu.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Close if the viewport grows past the mobile breakpoint.
    const mq = window.matchMedia("(min-width: 821px)");
    const onChange = (e) => {
      if (e.matches && isOpen()) close();
    };
    // addEventListener on MediaQueryList is unsupported in older Safari.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onChange);
    }
  })();

  /* ========================================================
     3. SCROLL REVEALS
     ======================================================== */
  (function initReveals() {
    const els = document.querySelectorAll(".reveal");

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // reveal once
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );

    els.forEach((el) => observer.observe(el));
  })();

  /* ========================================================
     4. ACTIVE NAV LINK TRACKING
     ======================================================== */
  (function initActiveNav() {
    const links = Array.from(
      document.querySelectorAll(".nav__link[href^='#']")
    );
    const sections = links
      .map((l) => document.querySelector(l.getAttribute("href")))
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    const setActive = (id) => {
      links.forEach((l) => {
        l.classList.toggle("is-active", l.getAttribute("href") === "#" + id);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
  })();

  /* ========================================================
     5. STREAK MULTIPLIER SLIDER
     Mirrors services/streakMultiplier.ts. Tiers in config.js.
     ======================================================== */
  (function initStreakSlider() {
    const wrap = document.querySelector("[data-streak]");
    if (!wrap) return;

    const range = wrap.querySelector("[data-streak-range]");
    const dayOut = wrap.querySelector("[data-streak-day]");
    const multOut = wrap.querySelector("[data-streak-mult]");
    const tierOut = wrap.querySelector("[data-streak-tier]");
    if (!range) return;

    const TIERS = CONFIG.STREAK_TIERS || [
      { minDay: 1, maxDay: 3, multiplier: 1.0, label: "Day 1–3" },
      { minDay: 4, maxDay: 6, multiplier: 1.2, label: "Day 4–6" },
      { minDay: 7, maxDay: 13, multiplier: 1.5, label: "Day 7–13" },
      { minDay: 14, maxDay: 29, multiplier: 2.0, label: "Day 14–29" },
      { minDay: 30, maxDay: Infinity, multiplier: 3.0, label: "Day 30+" },
    ];

    const TIER_NOTE = {
      1: "baseline",
      1.2: "building",
      1.5: "locked in",
      2: "strong habit",
      3: "consistency cap",
    };

    function tierFor(day) {
      for (let i = 0; i < TIERS.length; i++) {
        if (day >= TIERS[i].minDay && day <= TIERS[i].maxDay) return TIERS[i];
      }
      return TIERS[TIERS.length - 1];
    }

    let lastMult = null;

    function update() {
      const day = parseInt(range.value, 10) || 1;
      const tier = tierFor(day);

      if (dayOut) dayOut.textContent = String(day);
      if (multOut) multOut.textContent = tier.multiplier.toFixed(1) + "×";
      if (tierOut) {
        tierOut.textContent =
          tier.label + " · " + (TIER_NOTE[tier.multiplier] || "");
      }

      // Pulse the number when crossing into a new tier.
      if (multOut && lastMult !== null && lastMult !== tier.multiplier) {
        if (!prefersReducedMotion) {
          multOut.classList.add("is-bumped");
          window.setTimeout(() => multOut.classList.remove("is-bumped"), 200);
        }
      }
      lastMult = tier.multiplier;

      range.setAttribute("aria-valuetext",
        "Day " + day + ", " + tier.multiplier.toFixed(1) + " times XP");
    }

    range.addEventListener("input", update);
    update();
  })();

  /* ========================================================
     6. CONSENSUS ANIMATION (Civic Engine)
     Replays the pin-drop -> cluster sequence when scrolled into
     view. Skipped entirely under reduced motion — the CSS shows
     the final verified state instead.
     ======================================================== */
  (function initConsensus() {
    const stage = document.querySelector("[data-consensus]");
    if (!stage) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      return; // CSS renders the resolved state
    }

    const delay = (CONFIG.MOTION && CONFIG.MOTION.civicLoopDelay) || 4200;
    let timer = null;

    function play() {
      stage.classList.remove("is-playing");
      // Force reflow so the animation restarts cleanly.
      void stage.offsetWidth;
      stage.classList.add("is-playing");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            play();
            timer = window.setInterval(play, delay + 1800);
          } else if (timer) {
            window.clearInterval(timer);
            timer = null;
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(stage);
  })();

  /* ========================================================
     7. WAITLIST FORM
     ------------------------------------------------------------
     No backend is wired yet (BACKLOG P0-1). When no endpoint is
     configured the form validates the address and then states
     plainly that it is not live — it does NOT pretend to have
     saved the signup.
     ======================================================== */
  (function initWaitlist() {
    const form = document.querySelector("[data-waitlist-form]");
    if (!form) return;

    const input = form.querySelector("[data-waitlist-email]");
    const submit = form.querySelector("[data-waitlist-submit]");
    const msg = document.querySelector("[data-waitlist-msg]");
    if (!input || !msg) return;

    const WL = CONFIG.WAITLIST || {};
    const M = WL.messages || {};
    const endpoint = WL.endpoint || CONFIG.WAITLIST_ENDPOINT || "";
    const github =
      (CONFIG.LINKS && CONFIG.LINKS.github) ||
      "https://github.com/Dell015/karela";

    /* Pragmatic email check. Deliberately not RFC 5322 — that
       regex is famously unusable and rejects valid addresses.
       The backend is the real validator. */
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setMsg(text, kind) {
      msg.textContent = "";
      msg.className = "waitlist__msg" + (kind ? " waitlist__msg--" + kind : "");

      if (kind === "notconfigured") {
        msg.className = "waitlist__msg";
        msg.textContent = text + " ";
        const a = document.createElement("a");
        a.href = github;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Open the repo";
        msg.appendChild(a);
        return;
      }

      msg.textContent = text;
    }

    function setBusy(busy) {
      if (!submit) return;
      submit.disabled = busy;
      submit.textContent = busy
        ? M.sending || "Adding you…"
        : "Join the Waitlist";
    }

    // Clear the error state as soon as the user starts correcting.
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") {
        input.removeAttribute("aria-invalid");
        setMsg("", null);
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = input.value.trim();

      if (!email) {
        input.setAttribute("aria-invalid", "true");
        setMsg(M.empty || "Enter your email to join the waitlist.", "error");
        input.focus();
        return;
      }

      if (!EMAIL_RE.test(email)) {
        input.setAttribute("aria-invalid", "true");
        setMsg(M.invalid || "That email doesn't look right.", "error");
        input.focus();
        return;
      }

      input.removeAttribute("aria-invalid");

      // No backend configured — be honest rather than silently dropping it.
      if (!endpoint) {
        setMsg(
          M.notConfigured ||
            "The waitlist isn't live yet — we're still wiring up the backend.",
          "notconfigured"
        );
        return;
      }

      setBusy(true);
      setMsg(M.sending || "Adding you to the list…", null);

      try {
        const payload = Object.assign(
          { email: email, timestamp: new Date().toISOString() },
          WL.payloadExtras || {}
        );

        const res = await fetch(endpoint, {
          method: WL.method || "POST",
          headers: WL.headers || { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        form.reset();
        setMsg(M.success || "You're on the list.", "success");
      } catch (err) {
        setMsg(M.error || "Something went wrong. Please try again.", "error");
      } finally {
        setBusy(false);
      }
    });
  })();

  /* ========================================================
     8. FOOTER YEAR
     ======================================================== */
  (function initYear() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
