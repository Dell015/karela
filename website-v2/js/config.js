/* ============================================================
   KARELA WEB v2: CONFIGURATION
   ------------------------------------------------------------
   Everything you are likely to edit lives here. Start with this
   file if you are picking the project up cold.

   1. SURVEY      questions + where answers go (new in v2)
   2. WAITLIST    where emails go
   3. STORE_LINKS fill in at launch
   4. STREAK_TIERS mirrors services/streakMultiplier.ts in the app
   ============================================================ */

window.KARELA_CONFIG = (function () {
  "use strict";

  return {
    /* --------------------------------------------------------
       1. SURVEY

       The survey is fully built and reads its questions from
       this list, so adding content means editing this array
       only. No HTML or CSS changes needed.

       The questions below are SAMPLES. Replace them, then set
       showSampleBadge to false to hide the orange "Sample
       questions" note.

       Question types
         single   pick one         { options: [...] }
         multi    pick any         { options: [...] }
         scale    1 to 5           { low: "label", high: "label" }
         text     free text        { placeholder: "..." }
         email    email address    (validated if filled in)

       Every question takes:
         id        short unique key, used in the saved answers
         title     the question itself
         hint      optional small line under the title
         required  true / false

       Where answers go (same options as the waitlist)
         Formspree:  endpoint: "https://formspree.io/f/YOUR_ID"
         Supabase:   a SEPARATE project, never the app's.
       Until an endpoint is set, the survey says plainly that
       answers were not saved. It never pretends.

       CSP: when you set an endpoint, add its origin to
       connect-src in netlify.toml and vercel.json.
       -------------------------------------------------------- */
    SURVEY: {
      endpoint: "",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      payloadExtras: { source: "karela-website-survey" },
      showSampleBadge: true,

      messages: {
        required: "Pick an answer to continue.",
        emailInvalid: "That email doesn't look right. Check it, or leave it blank.",
        sending: "Sending your answers…",
        doneTitle: "Thank you.",
        doneBody: "Your answers will help decide what we build first.",
        error: "Something went wrong sending your answers. Try again in a moment.",
        notConfigured:
          "The survey isn't connected to a backend yet, so your answers weren't saved.",
      },

      questions: [
        {
          id: "exercise_frequency",
          type: "single",
          title: "How often do you exercise in a normal week?",
          required: true,
          options: ["Almost never", "1 to 2 times", "3 to 4 times", "5 times or more"],
        },
        {
          id: "barriers",
          type: "multi",
          title: "What gets in the way most?",
          hint: "Pick all that apply.",
          required: false,
          options: [
            "Not enough time",
            "Low motivation",
            "Safety outdoors",
            "Cost",
            "Not sure where to start",
          ],
        },
        {
          id: "report_likelihood",
          type: "scale",
          title: "If it took one tap, how likely are you to report a flooded drain or broken road?",
          required: true,
          low: "Very unlikely",
          high: "Very likely",
        },
        {
          id: "daily_use",
          type: "text",
          title: "What would make a running app worth opening every day?",
          required: false,
          placeholder: "Anything goes",
        },
        {
          id: "contact_email",
          type: "email",
          title: "Want to hear about the results?",
          hint: "Optional. Leave your email and we'll share them.",
          required: false,
          placeholder: "you@example.com",
        },
      ],
    },

    /* --------------------------------------------------------
       2. WAITLIST BACKEND

       No backend is connected yet. While `endpoint` is empty the
       form validates the email and says honestly that it isn't
       live, instead of pretending to save it.

       Option A, Formspree:
         endpoint: "https://formspree.io/f/YOUR_FORM_ID"
       Option B, a SEPARATE Supabase project (never the app's):
         endpoint: "https://YOUR.supabase.co/rest/v1/waitlist",
         headers: { apikey: "...", Authorization: "Bearer ...",
                    Prefer: "return=minimal",
                    "Content-Type": "application/json" }

       SECURITY: never paste the mobile app's
       EXPO_PUBLIC_SUPABASE_ANON_KEY here.
       -------------------------------------------------------- */
    WAITLIST: {
      endpoint: "",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      payloadExtras: { source: "karela-website" },
      messages: {
        invalid: "That email doesn't look right. Check it and try again.",
        empty: "Enter your email to join the waitlist.",
        sending: "Adding you to the list…",
        success: "You're on the list. We'll email you when the beta opens.",
        error: "Something went wrong. Try again in a moment.",
        notConfigured:
          "The waitlist isn't live yet. We're still connecting the backend, so your email wasn't saved. Star the repo on GitHub and you'll see the announcement there first.",
      },
    },

    /* --------------------------------------------------------
       3. STORE LINKS (null until the app is published)
       -------------------------------------------------------- */
    STORE_LINKS: { ios: null, android: null },

    LINKS: { github: "https://github.com/Dell015/karela" },

    /* --------------------------------------------------------
       4. STREAK MULTIPLIER TIERS (aboutkarela.md section 17)
       -------------------------------------------------------- */
    STREAK_TIERS: [
      { minDay: 1, maxDay: 3, multiplier: 1.0, label: "Day 1 to 3", note: "baseline" },
      { minDay: 4, maxDay: 6, multiplier: 1.2, label: "Day 4 to 6", note: "building" },
      { minDay: 7, maxDay: 13, multiplier: 1.5, label: "Day 7 to 13", note: "locked in" },
      { minDay: 14, maxDay: 29, multiplier: 2.0, label: "Day 14 to 29", note: "strong habit" },
      { minDay: 30, maxDay: 9999, multiplier: 3.0, label: "Day 30 and up", note: "the cap" },
    ],

    /* How far the page "run" is mapped to meters in the margin tracker. */
    RUN_METERS: 4200,
  };
})();
