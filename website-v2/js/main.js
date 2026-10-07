/* ============================================================
   KARELA WEB v2: MAIN
   Vanilla ES2020. No dependencies, no build step.

   1. Scroll engine   one rAF loop: palette blend, parallax,
                      run tracker, hero echo, scroll-lit words
   2. Nav + menu
   3. Resonance chart (drag through a run)
   4. Ghost chart wipe
   5. Tour (sticky phone screens)
   6. Consensus animation
   7. Streak slider
   8. Safety tiers
   9. Waitlist
  10. Survey
  11. Footer year

   Scroll work is passive and rAF-coalesced, and only touches
   CSS variables on the elements that use them, so scrolling
   stays smooth on the mid-range Android phones Karela targets.
   ============================================================ */

(function () {
  "use strict";

  const root = document.documentElement;
  const CONFIG = window.KARELA_CONFIG || {};
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* Pause SMIL animations (the run-screen dots) for reduced motion. */
  if (reduceMotion) {
    $$("svg").forEach((s) => {
      if (typeof s.pauseAnimations === "function") s.pauseAnimations();
    });
  }

  /* ========================================================
     1. SCROLL ENGINE
     ======================================================== */
  (function scrollEngine() {
    const nav = $("[data-nav]");
    const bg = $(".bg");
    const blobs = $$("[data-blob]");
    const run = $("[data-run]");
    const runM = $("[data-run-m]");
    const hero = $("#hero");
    const stops = $$("[data-palette]");
    const lits = $$("[data-lit]");
    const RUN_METERS = CONFIG.RUN_METERS || 4200;

    /* Palettes as rgb triplets: [c1, c2, c3]. Each section names
       one with data-palette; the bg blends between neighbours. */
    const PAL = {
      lime: [[124, 242, 5], [32, 159, 119], [0, 245, 212]],
      lime2: [[124, 242, 5], [0, 245, 212], [32, 159, 119]],
      aqua: [[0, 245, 212], [0, 187, 249], [124, 242, 5]],
      aqua2: [[0, 187, 249], [0, 245, 212], [124, 242, 5]],
      ember: [[255, 159, 28], [255, 77, 109], [32, 159, 119]],
      civic: [[255, 107, 53], [255, 0, 110], [255, 159, 28]],
      storm: [[255, 77, 109], [255, 0, 110], [150, 10, 50]],
      energy: [[255, 214, 10], [255, 159, 28], [251, 86, 7]],
      cool: [[0, 187, 249], [32, 159, 119], [0, 245, 212]],
      deep: [[32, 159, 119], [14, 70, 52], [32, 159, 119]],
    };

    /* Split each [data-lit] element into word spans once. */
    lits.forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach((w, i) => {
        const s = document.createElement("span");
        s.className = /^meaninglessness/.test(w) ? "w grad" : "w";
        s.textContent = w;
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
      el._words = $$(".w", el);
    });

    let ghost = 0;
    let queued = false;
    let lastMeters = -1;
    let lastScrolled = null;
    let lastRunOn = null;

    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    }

    function frame() {
      queued = false;
      const y = window.scrollY || root.scrollTop;
      const vh = window.innerHeight;
      const max = Math.max(1, root.scrollHeight - vh);
      const p = clamp(y / max, 0, 1);

      /* nav background */
      const scrolled = y > 24;
      if (nav && scrolled !== lastScrolled) {
        nav.classList.toggle("is-scrolled", scrolled);
        lastScrolled = scrolled;
      }

      /* run tracker: you are solid, the ghost runs slightly ahead
         and eases toward its target, so scrolling fast overtakes it */
      if (run) {
        run.style.setProperty("--p", p.toFixed(4));
        const target = clamp(p + 0.025, 0, 1);
        ghost += (target - ghost) * 0.07;
        if (Math.abs(target - ghost) > 0.0007) schedule();
        else ghost = target;
        run.style.setProperty("--g", ghost.toFixed(4));

        const on = y > vh * 0.3;
        if (on !== lastRunOn) {
          run.classList.toggle("is-on", on);
          lastRunOn = on;
        }
        if (runM) {
          const m = Math.round((p * RUN_METERS) / 10) * 10;
          if (m !== lastMeters) {
            runM.textContent = m.toLocaleString("en-US") + " m";
            lastMeters = m;
          }
        }
      }

      /* hero headline echo drifts as the hero leaves */
      if (hero && y < vh * 1.4) hero.style.setProperty("--hy", String(Math.round(y)));

      /* palette blend: measure section centres against the viewport middle */
      if (bg && stops.length) {
        const mid = vh * 0.5;
        let a = null;
        let b = null;
        let ca = 0;
        let cb = 0;
        for (let i = 0; i < stops.length; i++) {
          const r = stops[i].getBoundingClientRect();
          const c = r.top + r.height / 2;
          if (c <= mid) {
            a = stops[i];
            ca = c;
          } else {
            b = stops[i];
            cb = c;
            break;
          }
        }
        const pa = PAL[(a || b).dataset.palette] || PAL.lime;
        const pb = PAL[(b || a).dataset.palette] || pa;
        let t = a && b ? smooth(clamp((mid - ca) / (cb - ca), 0, 1)) : 0;
        for (let k = 0; k < 3; k++) {
          const c = [0, 1, 2].map((j) => Math.round(lerp(pa[k][j], pb[k][j], t)));
          bg.style.setProperty("--c" + (k + 1), c.join(" "));
        }
      }

      /* parallax: three blobs at three speeds */
      if (!reduceMotion && blobs.length) {
        const sway = Math.sin(y / 900);
        blobs[0].style.transform = "translate3d(" + (sway * -50).toFixed(1) + "px," + (y * -0.07).toFixed(1) + "px,0)";
        if (blobs[1]) blobs[1].style.transform = "translate3d(" + (sway * 60).toFixed(1) + "px," + (y * -0.13).toFixed(1) + "px,0)";
        if (blobs[2]) blobs[2].style.transform = "translate3d(" + (Math.cos(y / 700) * 70).toFixed(1) + "px," + (y * -0.04).toFixed(1) + "px,0)";
      }

      /* scroll-lit words */
      lits.forEach((el) => {
        const words = el._words;
        if (!words) return;
        if (reduceMotion) {
          words.forEach((w) => w.classList.add("on"));
          return;
        }
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) {
          if (r.top > vh) words.forEach((w) => w.classList.remove("on"));
          else words.forEach((w) => w.classList.add("on"));
          return;
        }
        const start = vh * 0.82;
        const end = vh * 0.4;
        const prog = clamp((start - r.top) / (start - end + r.height * 0.9), 0, 1);
        const n = Math.round(prog * words.length * 1.04);
        words.forEach((w, i) => w.classList.toggle("on", i < n));
      });
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("load", schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(document.body);
    frame();
  })();

  /* ========================================================
     2. NAV + MENU
     ======================================================== */
  (function nav() {
    const toggle = $("[data-menu-toggle]");
    const menu = $("[data-menu]");

    /* scroll-spy: the section crossing the middle of the screen is
       active. Sections without a nav link clear the highlight. */
    const links = $$(".nav__link[href^='#']");
    const byId = {};
    links.forEach((l) => (byId[l.getAttribute("href").slice(1)] = l));
    const secs = $$("[data-nav-section]");
    if (secs.length && "IntersectionObserver" in window) {
      let current = null;
      const paint = () => links.forEach((l) => l.classList.toggle("is-active", !!current && byId[current] === l));
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            const id = e.target.id;
            if (e.isIntersecting) current = id;
            else if (current === id) current = null;
          });
          paint();
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      secs.forEach((s) => io.observe(s));
    }

    if (!toggle || !menu) return;
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocused = null;
    const isOpen = () => menu.classList.contains("is-open");

    function open() {
      lastFocused = document.activeElement;
      menu.classList.add("is-open");
      menu.removeAttribute("inert");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      document.body.classList.add("is-locked");
      const first = $(FOCUSABLE, menu);
      if (first) first.focus();
    }
    function close() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      document.body.classList.remove("is-locked");
      window.setTimeout(() => {
        if (!isOpen()) menu.setAttribute("inert", "");
      }, 300);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    toggle.addEventListener("click", () => (isOpen() ? close() : open()));
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
      /* the toggle sits above the menu, so include it in the trap */
      const nodes = [toggle].concat($$(FOCUSABLE, menu)).filter((el) => el.offsetParent !== null);
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
    const mq = window.matchMedia("(min-width: 900px)");
    const onChange = (e) => {
      if (e.matches && isOpen()) close();
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  })();

  /* ========================================================
     3. RESONANCE CHART
     Stamina falls through a run and civic requests mirror it.
     Both curves come from the same control points, so the dots
     sit exactly on the lines.
     ======================================================== */
  (function resonance() {
    const wrap = $("[data-reso]");
    if (!wrap) return;
    const chart = $("[data-reso-chart]", wrap);
    const range = $("[data-reso-range]", wrap);
    const svg = $("svg", chart);
    const line = $("[data-reso-line]", chart);
    const dots = { stamina: $('[data-reso-dot="stamina"]', chart), civic: $('[data-reso-dot="civic"]', chart) };
    const paths = { stamina: $('[data-reso-path="stamina"]', chart), civic: $('[data-reso-path="civic"]', chart) };
    const bandsG = $("[data-reso-bands]", chart);
    const axis = $$(".reso__axis span", wrap);
    const states = $$("[data-reso-states] li", wrap);
    const sprite = $("[data-reso-sprite]", wrap);

    const W = 600;
    const H = 220;
    const TOP = 40;
    const SPAN = 140;
    const ZONES = [0.2, 0.45, 0.65, 0.82, 1];
    const POSE = ["run", "run", "walk", "walk", "idle"];
    const DUR = ["0.8s", "0.95s", "1.3s", "1.5s", "2s"];

    /* value 1 = high, 0 = low */
    const DATA = {
      stamina: [[0, 0.95], [0.12, 0.88], [0.3, 0.68], [0.45, 0.45], [0.6, 0.12], [0.68, 0.2], [0.8, 0.4], [1, 0.62]],
      civic: [[0, 0.4], [0.12, 0.46], [0.3, 0.3], [0.45, 0.14], [0.6, 0.08], [0.68, 0.3], [0.82, 0.7], [1, 0.95]],
    };

    /* cubic Hermite through the points, Catmull-Rom tangents */
    function curve(pts) {
      const n = pts.length;
      const m = pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(n - 1, i + 1)];
        return (b[1] - a[1]) / (b[0] - a[0] || 1);
      });
      return function (x) {
        let i = 0;
        while (i < n - 2 && x > pts[i + 1][0]) i++;
        const x0 = pts[i][0];
        const x1 = pts[i + 1][0];
        const h = x1 - x0;
        const t = clamp((x - x0) / h, 0, 1);
        const t2 = t * t;
        const t3 = t2 * t;
        return (
          (2 * t3 - 3 * t2 + 1) * pts[i][1] +
          (t3 - 2 * t2 + t) * h * m[i] +
          (-2 * t3 + 3 * t2) * pts[i + 1][1] +
          (t3 - t2) * h * m[i + 1]
        );
      };
    }
    const fn = { stamina: curve(DATA.stamina), civic: curve(DATA.civic) };
    const yOf = (v) => TOP + (1 - clamp(v, 0, 1)) * SPAN;

    ["stamina", "civic"].forEach((k) => {
      let d = "";
      for (let i = 0; i <= 160; i++) {
        const x = i / 160;
        d += (i ? "L" : "M") + (x * W).toFixed(1) + " " + yOf(fn[k](x)).toFixed(1);
      }
      paths[k].setAttribute("d", d);
    });

    /* zone bands behind the lines */
    const bands = [];
    let x0 = 0;
    ZONES.forEach((z) => {
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("class", "band");
      r.setAttribute("x", String(x0 * W));
      r.setAttribute("y", "0");
      r.setAttribute("width", String((z - x0) * W));
      r.setAttribute("height", String(H));
      bandsG.appendChild(r);
      bands.push(r);
      x0 = z;
    });

    states.forEach((s) => (s.parentNode.classList.add("is-enhanced")));
    let zone = -1;

    function update() {
      const v = Number(range.value);
      const t = v / 100;
      range.style.setProperty("--fill", v + "%");
      line.style.left = v + "%";
      ["stamina", "civic"].forEach((k) => {
        dots[k].style.left = v + "%";
        dots[k].style.top = ((yOf(fn[k](t)) / H) * 100).toFixed(2) + "%";
      });
      let z = ZONES.findIndex((b) => t <= b);
      if (z < 0) z = ZONES.length - 1;
      if (z !== zone) {
        zone = z;
        bands.forEach((b, i) => b.classList.toggle("is-on", i === z));
        axis.forEach((a, i) => a.classList.toggle("is-on", i === z));
        states.forEach((s, i) => s.classList.toggle("is-on", i === z));
        if (sprite) {
          sprite.className = "sprite sprite--" + POSE[z];
          sprite.style.setProperty("--dur", DUR[z]);
        }
      }
      range.setAttribute("aria-valuetext", states[z] ? $("h4", states[z]).textContent : "");
    }

    /* intro sweep: shows the idea once, then hands over to you */
    let sweeping = false;
    function stopSweep() {
      sweeping = false;
    }
    function sweep() {
      if (reduceMotion || sweeping) return;
      sweeping = true;
      const start = performance.now();
      const from = Number(range.value);
      const to = 94;
      const dur = 6200;
      (function step(now) {
        if (!sweeping) return;
        const k = clamp((now - start) / dur, 0, 1);
        range.value = String(Math.round(lerp(from, to, k * (2 - k))));
        update();
        if (k < 1) requestAnimationFrame(step);
        else sweeping = false;
      })(start);
    }

    range.addEventListener("input", () => {
      stopSweep();
      update();
    });
    range.addEventListener("pointerdown", stopSweep);

    /* drag anywhere on the chart too */
    let dragging = false;
    function fromPointer(e) {
      const r = chart.getBoundingClientRect();
      range.value = String(Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100)));
      update();
    }
    chart.addEventListener("pointerdown", (e) => {
      stopSweep();
      dragging = true;
      chart.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    chart.addEventListener("pointermove", (e) => dragging && fromPointer(e));
    chart.addEventListener("pointerup", () => (dragging = false));
    chart.addEventListener("pointercancel", () => (dragging = false));

    update();
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            io.disconnect();
            window.setTimeout(sweep, 500);
          }
        },
        { threshold: 0.6 }
      );
      io.observe(chart);
    }
  })();

  /* ========================================================
     4. GHOST CHART: the three lines wipe in when seen
     ======================================================== */
  (function ghostChart() {
    const fig = $("[data-ghost]");
    if (!fig) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      fig.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fig.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(fig);
  })();

  /* ========================================================
     5. TOUR: one sticky phone on wide screens, one phone per
        step on small screens. Screens are cloned from the
        <template>s at the end of index.html.
     ======================================================== */
  (function tour() {
    const holder = $("[data-screens]");
    const steps = $$("[data-step]");
    if (!holder || !steps.length) return;

    const keys = steps.map((s) => s.dataset.step);
    const stickyScreens = {};

    keys.forEach((key) => {
      const tpl = document.getElementById("tpl-" + key);
      if (!tpl) return;

      const s = document.createElement("div");
      s.className = "screen";
      s.appendChild(tpl.content.cloneNode(true));
      holder.appendChild(s);
      stickyScreens[key] = s;

      const inline = $('[data-step-phone="' + key + '"]');
      if (inline) {
        const phone = document.createElement("div");
        phone.className = "phone";
        const scr = document.createElement("div");
        scr.className = "phone__screen";
        const inner = document.createElement("div");
        inner.className = "screen";
        inner.appendChild(tpl.content.cloneNode(true));
        scr.appendChild(inner);
        phone.appendChild(scr);
        inline.appendChild(phone);

        if ("IntersectionObserver" in window) {
          const io = new IntersectionObserver(
            (e) => {
              if (e[0].isIntersecting) inner.classList.add("is-active");
              else inner.classList.remove("is-active");
            },
            { threshold: 0.55 }
          );
          io.observe(inline);
        } else inner.classList.add("is-active");
      }
    });

    function show(key) {
      Object.keys(stickyScreens).forEach((k) => stickyScreens[k].classList.toggle("is-active", k === key));
    }
    show(keys[0]);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) show(e.target.dataset.step);
          });
        },
        { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
      );
      steps.forEach((s) => io.observe(s));
    }
  })();

  /* ========================================================
     6. CONSENSUS ANIMATION: replays while it is on screen
     ======================================================== */
  (function consensus() {
    const el = $("[data-consensus]");
    if (!el || reduceMotion || !("IntersectionObserver" in window)) return;
    let timer = null;
    const play = () => {
      el.classList.remove("is-playing");
      void el.offsetWidth;
      el.classList.add("is-playing");
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          play();
          timer = window.setInterval(play, 7400);
        } else if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
  })();

  /* ========================================================
     7. STREAK SLIDER: drives the number AND the phone screen
     ======================================================== */
  (function streak() {
    const wrap = $("[data-streak]");
    if (!wrap) return;
    const range = $("[data-streak-range]", wrap);
    const dayOut = $("[data-streak-day]", wrap);
    const multOut = $("[data-streak-mult]", wrap);
    const tierOut = $("[data-streak-tier]", wrap);
    const TIERS = CONFIG.STREAK_TIERS || [];
    if (!range || !TIERS.length) return;

    const tierFor = (d) => TIERS.find((t) => d >= t.minDay && d <= t.maxDay) || TIERS[TIERS.length - 1];
    let last = null;

    function update() {
      const day = parseInt(range.value, 10) || 1;
      const t = tierFor(day);
      const mult = t.multiplier.toFixed(1);
      range.style.setProperty("--fill", ((day - range.min) / (range.max - range.min)) * 100 + "%");
      dayOut.textContent = String(day);
      multOut.textContent = mult + "×";
      tierOut.textContent = t.label + ": " + t.note;
      $$("[data-streak-days]").forEach((n) => (n.textContent = String(day)));
      $$("[data-streak-mult-view]").forEach((n) => (n.textContent = "×" + mult));
      range.setAttribute("aria-valuetext", "Day " + day + ", " + mult + " times XP");
      if (last !== null && last !== t.multiplier && !reduceMotion) {
        multOut.classList.remove("is-bumped");
        void multOut.offsetWidth;
        multOut.classList.add("is-bumped");
      }
      last = t.multiplier;
    }
    range.addEventListener("input", update);
    update();
  })();

  /* ========================================================
     8. SAFETY TIERS: also shifts the page palette
     ======================================================== */
  (function tiers() {
    const wrap = $("[data-tiers]");
    if (!wrap) return;
    const section = wrap.closest("[data-palette]");
    const blocks = $$("[data-tier]", wrap);
    const radios = $$('input[name="tier"]', wrap);
    const PALETTE = { 0: "civic", 1: "energy", 2: "civic", 3: "storm", 4: "cool" };
    const base = section ? section.dataset.palette : null;

    function set(v) {
      wrap.dataset.active = v;
      blocks.forEach((b) => b.classList.toggle("is-on", b.dataset.tier === v));
      if (section) section.dataset.palette = v === "0" ? base : PALETTE[v];
      window.dispatchEvent(new Event("scroll"));
    }
    radios.forEach((r) => r.addEventListener("change", () => r.checked && set(r.value)));
    const checked = radios.find((r) => r.checked);
    set(checked ? checked.value : "0");
  })();

  /* ========================================================
     9. WAITLIST
     ======================================================== */
  (function waitlist() {
    const form = $("[data-waitlist-form]");
    if (!form) return;
    const input = $("[data-waitlist-email]", form);
    const submit = $("[data-waitlist-submit]", form);
    const msg = $("[data-waitlist-msg]");
    const WL = CONFIG.WAITLIST || {};
    const M = WL.messages || {};
    const github = (CONFIG.LINKS && CONFIG.LINKS.github) || "https://github.com/Dell015/karela";
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function say(text, kind, link) {
      msg.textContent = text;
      msg.className = "paper__msg" + (kind ? " paper__msg--" + kind : "");
      if (link) {
        msg.appendChild(document.createTextNode(" "));
        const a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.text;
        if (link.external) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        msg.appendChild(a);
      }
    }
    function busy(b) {
      submit.disabled = b;
      submit.textContent = b ? "Adding you…" : "Join the waitlist";
    }

    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") {
        input.removeAttribute("aria-invalid");
        say("", "");
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email || !EMAIL_RE.test(email)) {
        input.setAttribute("aria-invalid", "true");
        say(!email ? M.empty : M.invalid, "error");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");

      if (!WL.endpoint) {
        say(M.notConfigured, "", { href: github, text: "Open the repo", external: true });
        return;
      }

      busy(true);
      say(M.sending, "");
      try {
        const res = await fetch(WL.endpoint, {
          method: WL.method || "POST",
          headers: WL.headers || { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign({ email: email, timestamp: new Date().toISOString() }, WL.payloadExtras || {})),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        say(M.success + " Got a minute?", "success", { href: "#survey", text: "Answer a quick survey" });
      } catch (err) {
        say(M.error, "error");
      } finally {
        busy(false);
      }
    });
  })();

  /* ========================================================
     10. SURVEY: rendered from CONFIG.SURVEY
     Built with createElement and textContent only, so config
     text can never inject markup.
     ======================================================== */
  (function survey() {
    const form = $("[data-survey]");
    if (!form) return;
    const S = CONFIG.SURVEY || {};
    const Q = S.questions || [];
    const M = S.messages || {};
    const section = form.closest("section");
    if (!Q.length) {
      if (section) section.hidden = true;
      return;
    }

    const body = $("[data-survey-body]", form);
    const bar = $("[data-survey-bar]", form);
    const progress = $("[data-survey-progress]", form);
    const count = $("[data-survey-count]", form);
    const back = $("[data-survey-back]", form);
    const next = $("[data-survey-next]", form);
    const msg = $("[data-survey-msg]", form);
    const sample = $("[data-survey-sample]", form);
    const github = (CONFIG.LINKS && CONFIG.LINKS.github) || "https://github.com/Dell015/karela";
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (sample && S.showSampleBadge) sample.hidden = false;

    const answers = {};
    let idx = 0;
    let uid = 0;

    const el = (tag, cls, text) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };
    function say(text, kind, link) {
      msg.textContent = text || "";
      msg.className = "survey__msg" + (kind ? " survey__msg--" + kind : "");
      if (link) {
        msg.appendChild(document.createTextNode(" "));
        const a = el("a", "", link.text);
        a.href = link.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        msg.appendChild(a);
      }
    }

    function option(type, name, value, label, checked) {
      const l = el("label", "opt");
      const i = document.createElement("input");
      i.type = type;
      i.name = name;
      i.value = value;
      i.checked = !!checked;
      l.appendChild(i);
      l.appendChild(el("span", "", label));
      return l;
    }

    function render(moveFocus) {
      const q = Q[idx];
      const name = "q" + ++uid;
      body.textContent = "";
      const wrap = el("div", "q");
      const title = el("h3", "q__title", q.title);
      title.tabIndex = -1;
      wrap.appendChild(title);
      if (q.hint) wrap.appendChild(el("p", "q__hint", q.hint));
      const saved = answers[q.id];

      if (q.type === "info") {
        wrap.appendChild(el("p", "q__info", q.text || ""));
      } else if (q.type === "single" || q.type === "multi") {
        const list = el("div", "q__opts");
        q.options.forEach((o) => {
          const on = q.type === "multi" ? Array.isArray(saved) && saved.indexOf(o) > -1 : saved === o;
          list.appendChild(option(q.type === "multi" ? "checkbox" : "radio", name, o, o, on));
        });
        wrap.appendChild(list);
      } else if (q.type === "scale") {
        const sc = el("div", "q__scale");
        for (let n = 1; n <= 5; n++) sc.appendChild(option("radio", name, String(n), String(n), saved === n));
        wrap.appendChild(sc);
        const ends = el("div", "q__ends");
        ends.appendChild(el("span", "", q.low || ""));
        ends.appendChild(el("span", "", q.high || ""));
        wrap.appendChild(ends);
      } else if (q.type === "text") {
        const t = el("textarea", "q__text");
        t.name = name;
        t.rows = 4;
        t.placeholder = q.placeholder || "";
        t.value = saved || "";
        t.setAttribute("aria-label", q.title);
        wrap.appendChild(t);
      } else if (q.type === "email") {
        const t = el("input", "q__text");
        t.type = "email";
        t.name = name;
        t.autocomplete = "email";
        t.placeholder = q.placeholder || "";
        t.value = saved || "";
        t.setAttribute("aria-label", q.title);
        t.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            next.click();
          }
        });
        wrap.appendChild(t);
      }
      body.appendChild(wrap);

      const last = idx === Q.length - 1;
      next.textContent = last ? "Send answers" : "Next";
      back.hidden = idx === 0;
      const realTotal = Q.filter((x) => x.type !== "info").length;
      const realNo = Q.slice(0, idx + 1).filter((x) => x.type !== "info").length;
      count.textContent = q.type === "info" ? "Before the next questions" : "Question " + realNo + " of " + realTotal;
      const pct = Math.round((idx / Q.length) * 100);
      bar.style.width = pct + "%";
      progress.setAttribute("aria-valuenow", String(pct));
      say("");
      if (moveFocus) title.focus({ preventScroll: true });
    }

    /* read the current answer; returns false (and says why) if invalid */
    function collect() {
      const q = Q[idx];
      let v = null;
      if (q.type === "info") return true;
      if (q.type === "single" || q.type === "scale") {
        const c = $("input:checked", body);
        v = c ? (q.type === "scale" ? Number(c.value) : c.value) : null;
      } else if (q.type === "multi") {
        v = $$("input:checked", body).map((c) => c.value);
        if (!v.length) v = null;
      } else {
        const t = $(".q__text", body);
        v = t && t.value.trim() ? t.value.trim() : null;
        if (v && q.type === "email" && !EMAIL_RE.test(v)) {
          say(M.emailInvalid, "error");
          t.focus();
          return false;
        }
      }
      if (q.required && v === null) {
        say(M.required || "Answer to continue.", "error");
        return false;
      }
      if (v === null) delete answers[q.id];
      else answers[q.id] = v;
      return true;
    }

    async function send() {
      if (!S.endpoint) {
        say(M.notConfigured, "", { href: github, text: "Open the repo" });
        return;
      }
      next.disabled = true;
      say(M.sending);
      try {
        const res = await fetch(S.endpoint, {
          method: S.method || "POST",
          headers: S.headers || { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign({ answers: answers, timestamp: new Date().toISOString() }, S.payloadExtras || {})),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        done();
      } catch (err) {
        say(M.error, "error");
      } finally {
        next.disabled = false;
      }
    }

    function done() {
      body.textContent = "";
      const w = el("div", "q q--done");
      const t = el("h3", "q__title", M.doneTitle || "Thank you.");
      t.tabIndex = -1;
      w.appendChild(t);
      w.appendChild(el("p", "", M.doneBody || ""));
      body.appendChild(w);
      bar.style.width = "100%";
      progress.setAttribute("aria-valuenow", "100");
      count.textContent = "Done";
      back.hidden = true;
      next.hidden = true;
      say("");
      t.focus({ preventScroll: true });
    }

    next.addEventListener("click", () => {
      if (!collect()) return;
      if (idx < Q.length - 1) {
        idx++;
        render(true);
      } else send();
    });
    back.addEventListener("click", () => {
      collect();
      if (idx > 0) {
        idx--;
        render(true);
      }
    });
    form.addEventListener("submit", (e) => e.preventDefault());

    render(false);
  })();

  /* ========================================================
     12. RUN TRACKER AS A SCROLLBAR: drag the dot, click the
         line, or use the arrow keys. Ticks mark each section.
     ======================================================== */
  (function runScrub() {
    const run = $("[data-run]");
    const hit = $("[data-run-hit]");
    const tip = $("[data-run-tip]");
    if (!run || !hit || !tip) return;

    const LABELS = {
      hero: "Start",
      problem: "The problem",
      system: "How it works",
      ghost: "The ghost",
      ani: "Meet Ani",
      bayanihan: "Bayanihan",
      compare: "Why not Strava",
      philippines: "Built for here",
      waitlist: "Waitlist",
      survey: "Survey",
      team: "The team",
    };
    const root = document.documentElement;
    const wide = window.matchMedia("(min-width: 1100px)");
    const maxScroll = () => Math.max(1, root.scrollHeight - window.innerHeight);
    const marks = [];

    function buildTicks() {
      marks.forEach((m) => m.el.remove());
      marks.length = 0;
      const max = maxScroll();
      Object.keys(LABELS).forEach((id) => {
        const s = document.getElementById(id);
        if (!s) return;
        const t = Math.min(1, Math.max(0, (s.getBoundingClientRect().top + window.scrollY - 70) / max));
        const el = document.createElement("i");
        el.className = "run__tick";
        el.style.setProperty("--t", t.toFixed(4));
        run.appendChild(el);
        marks.push({ id, t, el });
      });
    }

    function fractionFrom(e) {
      const r = run.getBoundingClientRect();
      const f = wide.matches ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
      return Math.min(1, Math.max(0, f));
    }

    function nearest(f) {
      let best = null;
      marks.forEach((m) => {
        if (!best || Math.abs(m.t - f) < Math.abs(best.t - f)) best = m;
      });
      return best;
    }

    function showTip(f) {
      const n = nearest(f);
      if (!n) return;
      tip.textContent = LABELS[n.id];
      run.style.setProperty(wide.matches ? "--ty" : "--tx", (f * 100).toFixed(2) + "%");
      marks.forEach((m) => m.el.classList.toggle("is-near", m === n));
      run.classList.add("is-hot");
    }

    function scrubTo(f, smooth) {
      window.scrollTo({ top: f * maxScroll(), behavior: smooth ? "smooth" : "instant" });
    }

    let dragging = false;
    hit.addEventListener("pointerdown", (e) => {
      dragging = true;
      run.classList.add("is-drag");
      hit.setPointerCapture(e.pointerId);
      const f = fractionFrom(e);
      const n = nearest(f);
      /* a click close to a section tick snaps to that section */
      const snap = n && Math.abs(n.t - f) < 0.012 ? n.t : f;
      scrubTo(snap, false);
      showTip(f);
    });
    hit.addEventListener("pointermove", (e) => {
      const f = fractionFrom(e);
      showTip(f);
      if (dragging) scrubTo(f, false);
    });
    const end = () => {
      dragging = false;
      run.classList.remove("is-drag");
    };
    hit.addEventListener("pointerup", end);
    hit.addEventListener("pointercancel", end);
    hit.addEventListener("pointerleave", () => {
      if (!dragging) run.classList.remove("is-hot");
    });
    hit.addEventListener("pointerup", (e) => {
      if (e.pointerType !== "mouse") setTimeout(() => run.classList.remove("is-hot"), 700);
    });
    hit.addEventListener("focus", () => showTip(current()));
    hit.addEventListener("blur", () => run.classList.remove("is-hot"));

    function current() {
      return Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    }

    /* keyboard: arrows step between sections, Home/End jump */
    hit.addEventListener("keydown", (e) => {
      const f = current();
      let target = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") target = marks.find((m) => m.t > f + 0.005);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") target = [...marks].reverse().find((m) => m.t < f - 0.005);
      else if (e.key === "Home") target = { t: 0 };
      else if (e.key === "End") target = { t: 1 };
      else return;
      e.preventDefault();
      if (target) scrubTo(target.t, true);
    });

    /* keep aria-valuenow honest */
    let raf = 0;
    window.addEventListener(
      "scroll",
      () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          hit.setAttribute("aria-valuenow", String(Math.round(current() * 100)));
        });
      },
      { passive: true }
    );

    const orient = () => hit.setAttribute("aria-orientation", wide.matches ? "vertical" : "horizontal");
    orient();
    wide.addEventListener("change", orient);
    buildTicks();
    window.addEventListener("load", buildTicks);
    let rt = 0;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(buildTicks, 200);
    });
  })();

  /* ========================================================
     11. FOOTER YEAR
     ======================================================== */
  (function year() {
    const n = $("[data-year]");
    if (n) n.textContent = String(new Date().getFullYear());
  })();
})();
