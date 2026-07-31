/* ============================================================
   KARELA WEB — MAIN
   ------------------------------------------------------------
   Vanilla ES2020. No dependencies, no build step.

   Responsibilities:
     1. Remove .no-js so CSS reveal states activate
     2. Sticky nav background on scroll
     3. Scroll progress bar
     4. Mobile menu (toggle, focus trap, Esc, outside click)
     5. IntersectionObserver scroll reveals
     6. Active nav link tracking via section observer
     7. Footer year injection

   All listeners are passive where possible and rAF-throttled so
   scrolling stays smooth on low-end Android — the same
   constraint the app is built for.
   ============================================================ */

(function () {
  "use strict";

  /* --------------------------------------------------------
     Setup
     -------------------------------------------------------- */
  const root = document.documentElement;
  const body = document.body;

  // CSS uses .no-js as a fallback to keep reveal content visible
  // if this script never runs. It has run, so remove it.
  root.classList.remove("no-js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /** rAF throttle: coalesce rapid scroll events into one frame. */
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

  /* --------------------------------------------------------
     1. Sticky nav + scroll progress
     -------------------------------------------------------- */
  const nav = document.querySelector("[data-nav]");
  const progress = document.querySelector("[data-scroll-progress]");
  const SCROLL_THRESHOLD = 24;

  function onScroll() {
    const y = window.scrollY || root.scrollTop;

    if (nav) {
      nav.classList.toggle("is-scrolled", y > SCROLL_THRESHOLD);
    }

    if (progress) {
      const max = root.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progress.style.transform = "scaleX(" + ratio + ")";
    }
  }

  window.addEventListener("scroll", rafThrottle(onScroll), { passive: true });
  onScroll(); // set initial state (handles reload mid-page)

  /* --------------------------------------------------------
     2. Mobile menu
     -------------------------------------------------------- */
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");

  if (menuToggle && menu) {
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocused = null;

    const isOpen = () => menu.classList.contains("is-open");

    function openMenu() {
      lastFocused = document.activeElement;
      menu.classList.add("is-open");
      menu.removeAttribute("inert");
      menuToggle.setAttribute("aria-expanded", "true");
      body.classList.add("is-locked");

      // Move focus to the first link for keyboard users.
      const first = menu.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    function closeMenu() {
      menu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      body.classList.remove("is-locked");

      // Hide from AT once the fade-out finishes.
      window.setTimeout(() => {
        if (!isOpen()) menu.setAttribute("inert", "");
      }, 300);

      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    menuToggle.addEventListener("click", () => {
      isOpen() ? closeMenu() : openMenu();
    });

    // Close after navigating to an in-page anchor.
    menu.addEventListener("click", (e) => {
      const link = e.target.closest("a[href^='#']");
      if (link) closeMenu();
    });

    // Esc closes; Tab is trapped inside the panel while open.
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key !== "Tab") return;

      const nodes = Array.from(menu.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) return;

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
    window.matchMedia("(min-width: 821px)").addEventListener("change", (e) => {
      if (e.matches && isOpen()) closeMenu();
    });
  }

  /* --------------------------------------------------------
     3. Scroll reveals
     -------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    // Show everything immediately — no animation, no observer.
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target); // reveal once
        });
      },
      {
        // Trigger slightly before the element reaches the viewport
        // so the transition is already underway when it appears.
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.1,
      }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* --------------------------------------------------------
     4. Active nav link tracking
     -------------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll(".nav__link[href^='#']"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (sections.length > 0 && "IntersectionObserver" in window) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) setActive(visible[0].target.id);
      },
      {
        // Band across the upper-middle of the viewport.
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* --------------------------------------------------------
     5. Footer year
     -------------------------------------------------------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
