/* ============================================================
   KARELA WEB — CONFIGURATION
   ------------------------------------------------------------
   Every tunable value on the site lives here. If you are picking
   this project up cold, START WITH THIS FILE.

   See BACKLOG.md items P0-1 (waitlist) and P0-3 (stats).
   ============================================================ */

window.KARELA_CONFIG = (function () {
  "use strict";

  return {
    /* --------------------------------------------------------
       WAITLIST BACKEND  — BACKLOG P0-1

       TODO(waitlist): no backend is connected. While `endpoint`
       is an empty string the form validates the email and then
       shows an honest "not connected yet" message rather than
       pretending to have saved it.

       Option A — Formspree:
         endpoint: "https://formspree.io/f/YOUR_FORM_ID"

       Option B — a SEPARATE Supabase project (never the app's):
         endpoint: "https://YOUR.supabase.co/rest/v1/waitlist",
         headers: {
           apikey: "YOUR_SEPARATE_ANON_KEY",
           Authorization: "Bearer YOUR_SEPARATE_ANON_KEY",
           Prefer: "return=minimal"
         }

       SECURITY: do not paste the mobile app's
       EXPO_PUBLIC_SUPABASE_ANON_KEY here. That key is scoped to
       real user data (profiles, missions, civic nodes). A public
       marketing page must not carry it.
       -------------------------------------------------------- */
    WAITLIST_ENDPOINT: "",

    WAITLIST: {
      endpoint: "", // mirrors WAITLIST_ENDPOINT; set both or just this
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      /** Extra fields sent alongside the email. */
      payloadExtras: {
        source: "karela-website",
      },
      messages: {
        invalid: "That email doesn't look right. Mind checking it?",
        empty: "Enter your email to join the waitlist.",
        sending: "Adding you to the list…",
        success:
          "You're on the list. We'll email you the moment the beta opens.",
        error: "Something went wrong. Please try again in a moment.",
        /* Shown when no endpoint is configured. Deliberately honest —
           see BACKLOG.md P0-1 for the reasoning. */
        notConfigured:
          "The waitlist isn't live yet — we're still wiring up the backend. " +
          "Star the repo on GitHub and you'll see the announcement there first.",
      },
    },

    /* --------------------------------------------------------
       STORE LINKS  — BACKLOG P1-8

       The app is NOT published (aboutkarela.md line 5:
       Status: Active_Development, v3.1). Badges render disabled
       with a "Coming soon" label while these are null.

       TODO(stores): set these on launch and remove the
       aria-disabled attributes in index.html.
       -------------------------------------------------------- */
    STORE_LINKS: {
      ios: null,
      android: null,
    },

    /* --------------------------------------------------------
       PROJECT LINKS
       -------------------------------------------------------- */
    LINKS: {
      github: "https://github.com/Dell015/karela",
    },

    /* --------------------------------------------------------
       STATS  — BACKLOG P0-3

       TODO(stats): THESE ARE DESIGN TARGETS, NOT MEASUREMENTS.
       The app is pre-launch with no pilot data collected. Every
       figure here is rendered in the UI beneath a "Design
       targets, not results" label.

       Do not remove that label without replacing these with real
       measured numbers. Publishing invented metrics as
       achievements is a reputational and legal risk for a thesis
       project.
       -------------------------------------------------------- */
    STATS: [
      { value: "3.0", suffix: "×", label: "Max streak multiplier" },
      { value: "1,000", suffix: "", label: "XP per level, flat" },
      { value: "3", suffix: "", label: "Reports to verify a node" },
      { value: "100", suffix: "%", label: "Offline-capable tracking" },
    ],

    /* --------------------------------------------------------
       STREAK MULTIPLIER TIERS
       Source: aboutkarela.md §17 (line 742). These mirror
       services/streakMultiplier.ts in the app.
       -------------------------------------------------------- */
    STREAK_TIERS: [
      { minDay: 1, maxDay: 3, multiplier: 1.0, label: "Day 1–3" },
      { minDay: 4, maxDay: 6, multiplier: 1.2, label: "Day 4–6" },
      { minDay: 7, maxDay: 13, multiplier: 1.5, label: "Day 7–13" },
      { minDay: 14, maxDay: 29, multiplier: 2.0, label: "Day 14–29" },
      { minDay: 30, maxDay: 60, multiplier: 3.0, label: "Day 30+" },
    ],

    /* --------------------------------------------------------
       MOTION
       -------------------------------------------------------- */
    MOTION: {
      /** Delay before the civic consensus animation loops again (ms). */
      civicLoopDelay: 4200,
      /** Counter roll-up duration (ms). */
      counterDuration: 1400,
    },
  };
})();
