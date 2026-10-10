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

  /* ----------------------------------------------------------
     0. WHERE THE WAITLIST AND SURVEY ARE SAVED

     The website's OWN Supabase project (not the app's), set up
     with backend/supabase-site.sql. Visitors can only add rows;
     nobody can read, change or delete them with this key. Read
     the rows in the Supabase dashboard (Table Editor).

     The publishable key below is meant to be public. Never put
     the app's keys here, and never a service_role / secret key.
     If you move the project, change SITE_DB here and the
     connect-src origin in netlify.toml and vercel.json.
     ---------------------------------------------------------- */
  var SITE_DB = "https://jyvvuwlxjfqxrfgshqxh.supabase.co";
  var SITE_DB_HEADERS = {
    apikey: "sb_publishable_MXY1zUf7F8shTsn8ga32_g_uMKlxmuU",
    Prefer: "return=minimal",
    "Content-Type": "application/json",
  };

  return {
    /* The site's own database (section 0), for pages like /unsubscribe. */
    SITE_DB: { url: SITE_DB, headers: SITE_DB_HEADERS },

    /* --------------------------------------------------------
       1. SURVEY

       The survey is fully built and reads its questions from
       this list, so adding content means editing this array
       only. No HTML or CSS changes needed.

       These are the Karela Market Validation Survey questions
       (shortened from 20 to 13 questions, plus an optional email at the end).
       showSampleBadge is false, so the orange "Sample questions"
       note is hidden.

       Question types
         info     text only, no answer   { text: "..." }
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

       Where answers go: the survey_responses table in the
       site's Supabase project (section 0). If endpoint is ever
       set back to "", the survey says plainly that answers were
       not saved. It never pretends.
       -------------------------------------------------------- */
    SURVEY: {
      endpoint: SITE_DB + "/rest/v1/survey_responses",
      method: "POST",
      headers: SITE_DB_HEADERS,
      payloadExtras: { source: "karela-website-survey" },
      showSampleBadge: false,

      messages: {
        required: "Pick an answer to continue.",
        emailInvalid: "That email doesn't look right. Check it, or leave it blank.",
        sending: "Sending your answers…",
        doneTitle: "Thank you.",
        doneBody: "Your answers help shape Karela. Karela Research Team, University of Saint Louis, Tuguegarao City.",
        error: "Something went wrong sending your answers. Try again in a moment.",
        notConfigured:
          "The survey isn't connected to a backend yet, so your answers weren't saved.",
      },

      questions: [
        {
          id: "uses_app",
          type: "single",
          title: "Do you currently use a fitness, running or walking tracker app (Strava, Nike Run Club, Pacer, Google Fit, or similar)?",
          required: true,
          options: ["Yes, regularly", "Yes, but rarely", "I used to, but stopped", "No, never"],
        },
        {
          id: "walk_frequency",
          type: "single",
          title: "How often do you walk, jog or commute on foot in a typical week?",
          required: true,
          options: ["Rarely or never", "1 to 2 times", "3 to 5 times", "Almost daily"],
        },
        {
          id: "noticed_issues",
          type: "single",
          title: "Have you noticed a public problem while walking or commuting, like trash, flooding or broken roads?",
          required: true,
          options: ["Yes, often", "Yes, a few times", "No, never"],
        },
        {
          id: "built_for_athletes",
          type: "scale",
          title: "My fitness app feels built for athletes, not for someone who just walks or commutes daily.",
          required: true,
          low: "Strongly disagree",
          high: "Strongly agree",
        },
        {
          id: "everyday_not_counted",
          type: "scale",
          title: "My everyday walking (commuting, errands, campus walks) feels like it doesn\u2019t count, because no app rewards it.",
          required: true,
          low: "Strongly disagree",
          high: "Strongly agree",
        },
        {
          id: "stopped_before",
          type: "single",
          title: "Have you ever stopped using a fitness app because you lost motivation?",
          required: true,
          options: ["Yes", "No", "I have never used one"],
        },
        {
          id: "data_and_phone",
          type: "scale",
          title: "My fitness app doesn\u2019t suit my phone or mobile data (needs strong internet, uses a lot of data, runs slowly).",
          required: true,
          low: "Strongly disagree",
          high: "Strongly agree",
        },
        {
          id: "wants_reporting",
          type: "scale",
          title: "I wish I could report community problems, like trash, damaged roads or flood-prone spots, easily through an app.",
          required: true,
          low: "Strongly disagree",
          high: "Strongly agree",
        },
        {
          id: "community_motivation",
          type: "scale",
          title: "I would be more motivated to exercise regularly if my effort also helped my community.",
          required: true,
          low: "Strongly disagree",
          high: "Strongly agree",
        },
        {
          id: "about_karela",
          type: "info",
          title: "About Karela",
          text: "Karela is a mobile app that turns your everyday walking, jogging or commuting into an adaptive fitness experience with a personal AI coach. It also lets you report and verify community problems like trash and flood risks, so your movement counts for your own progress and for your city.",
        },
        {
          id: "likely_to_use",
          type: "single",
          title: "How likely are you to use an app like this if it were available today?",
          required: true,
          options: ["Definitely will not", "Probably will not", "Not sure", "Probably will", "Definitely will"],
        },
        {
          id: "would_recommend",
          type: "scale",
          title: "I would recommend an app like this to friends, classmates or family.",
          required: true,
          low: "Strongly disagree",
          high: "Strongly agree",
        },
        {
          id: "feature_feedback",
          type: "text",
          title: "What excites you most about this idea, or what would you add or change?",
          hint: "Optional.",
          required: false,
          placeholder: "Anything goes",
        },
        {
          id: "age_range",
          type: "single",
          title: "What is your age range?",
          required: true,
          options: ["Under 18", "18 to 24", "25 to 34", "35 and above"],
        },
        {
          id: "contact_email",
          type: "email",
          title: "Want to hear when Karela opens?",
          hint: "Optional. We will only use your email to contact you about Karela. Under 18? Please skip this one.",
          required: false,
          placeholder: "you@example.com",
        },
      ],
    },

    /* --------------------------------------------------------
       2. WAITLIST BACKEND

       Emails go to the waitlist table in the site's Supabase
       project (section 0), one row per email. If endpoint is
       ever set back to "", the form says honestly that it isn't
       live instead of pretending to save it.
       -------------------------------------------------------- */
    WAITLIST: {
      endpoint: SITE_DB + "/rest/v1/waitlist",
      method: "POST",
      headers: SITE_DB_HEADERS,
      payloadExtras: { source: "karela-website" },
      messages: {
        invalid: "That email doesn't look right. Check it and try again.",
        empty: "Enter your email to join the waitlist.",
        sending: "Adding you to the list…",
        success: "You're on the list. We'll email you when the beta opens.",
        successEmail: "You're on the list. A confirmation is on its way to your inbox.",
        duplicate: "That email is already on the list. We'll email you when the beta opens.",
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
