/* ============================================================
   KARELA WEB DEMO: SAMPLE DATA
   ------------------------------------------------------------
   Everything the demo app (demo.html, js/demo.js) shows. All of
   it is made up for the demo: Randel's account, the squad, the
   guild, the runs and the numbers. Nothing is saved or sent.

   Names of the other people, squads and guilds match the app's
   own demo data (supabase/demo/tuguegarao_demo_guilds.sql).
   Rules and prices match the app (services/store.ts, the
   karela_*_rules() functions in supabase/). If the app changes,
   change them here.
   ============================================================ */
(function () {
  "use strict";

  // Runs on these days before today (1 = yesterday). The streak is the
  // unbroken run 1..12; the rest are older days with gaps.
  var RUN_DAYS = [
    { d: 1, km: 3.1, min: 20.3 }, { d: 2, km: 2.4, min: 16.9 }, { d: 3, km: 4.2, min: 27.6 },
    { d: 4, km: 2.0, min: 14.2 }, { d: 5, km: 3.6, min: 23.4 }, { d: 6, km: 5.2, min: 33.1 },
    { d: 7, km: 2.2, min: 15.8 }, { d: 8, km: 3.0, min: 19.9 }, { d: 9, km: 1.8, min: 13.0 },
    { d: 10, km: 2.9, min: 19.4 }, { d: 11, km: 3.4, min: 22.5 }, { d: 12, km: 2.6, min: 18.0 },
    { d: 14, km: 4.0, min: 27.2 }, { d: 15, km: 2.1, min: 15.1 }, { d: 17, km: 3.3, min: 22.7 },
    { d: 20, km: 2.5, min: 17.5 }, { d: 22, km: 4.6, min: 30.4 }, { d: 25, km: 2.0, min: 14.6 },
    { d: 27, km: 3.0, min: 21.0 }
  ];

  window.KARELA_DEMO = {
    user: {
      name: "Randel",
      username: "randel",
      level: 7,
      xp: 640, // inside the level, of 1,000
      streak: 12, // days, not counting today
      bestStreak: 19,
      gems: 640,
      freezes: 1,
      weightKg: 64,
      totalKm: 148.6,
      totalRuns: 41
    },

    runDays: RUN_DAYS,

    // Weather on Home. The demo page has a switch for "storm".
    weather: { city: "Tuguegarao", temp: 31, desc: "Clear sky" },

    // The demo run: a loop through the drawn neighbourhood.
    run: {
      paceSPerKm: 375, // 6:15 per km
      ghostPaceSPerKm: 390, // 6:30 per km, from Randel's own runs
      loopKm: 1.6,
      speedUp: 20 // the demo run plays 20x faster than real time
    },

    // Reports on the map (made up). status: verified | pending | aging
    reports: [
      { id: "r1", cat: "drain_blockage", status: "pending", x: 268, y: 330, count: 2, days: 1 },
      { id: "r2", cat: "trash", status: "verified", x: 128, y: 520, count: 4, days: 3 },
      { id: "r3", cat: "damaged_infrastructure", status: "aging", x: 300, y: 610, count: 3, days: 19 }
    ],

    // freq: daily | weekly | monthly; type: distance | civic | streak
    quests: [
      { id: "q1", freq: "daily", type: "distance", title: "Ani's pick: an easy 2 km",
        desc: "Keep it conversational. Your legs did 5.2 km six days ago.", target: 2, current: 0, unit: "km", xp: 160 },
      { id: "q2", freq: "daily", type: "civic", title: "Community Eye",
        desc: "Report 1 local issue: a blocked drain, trash or a broken road.", target: 1, current: 0, unit: "report", xp: 208 },
      { id: "q3", freq: "daily", type: "distance", title: "Steady run",
        desc: "Cover 2.5 km at any pace.", target: 2.5, current: 0, unit: "km", xp: 160 },
      { id: "q4", freq: "weekly", type: "streak", title: "Build the Streak",
        desc: "Complete 5 runs this week.", target: 5, current: 5, unit: "runs", xp: 528 },
      { id: "q5", freq: "weekly", type: "distance", title: "Weekly distance",
        desc: "Cover 15 km this week.", target: 15, current: 11.4, unit: "km", xp: 480 },
      { id: "q6", freq: "monthly", type: "distance", title: "Monthly goal",
        desc: "Cover 60 km this month.", target: 60, current: 38.2, unit: "km", xp: 1200 },
      { id: "q7", freq: "monthly", type: "civic", title: "City Watch",
        desc: "Report 7 local issues this month.", target: 7, current: 3, unit: "reports", xp: 1560 }
    ],

    squad: {
      name: "Ugac Morning Crew",
      code: "DEMO01",
      xp: 5420,
      maxMembers: 12,
      shieldCost: 200,
      members: [
        { name: "Randel", level: 7, streak: 12, role: "leader", me: true },
        { name: "Joy T.", level: 9, streak: 21, role: "co_leader" },
        { name: "Paolo R.", level: 5, streak: 6, role: "member" },
        { name: "Liza M.", level: 4, streak: 8, role: "member", atRisk: true, shield: 80 }
      ]
    },

    guild: {
      name: "Ugac Striders",
      color: "teal",
      xp: 18240,
      maxSquads: 10,
      members: 7,
      week: { km: 46.3, reports: 9, ran: 6 },
      squads: [
        { name: "Ugac Morning Crew", members: 4, xp: 5420, mine: true },
        { name: "Kalye Runners", members: 3, xp: 4110 }
      ],
      badges: [
        { id: "pioneer", name: "Pioneer", goal: "Hold a landmark for the first time", reward: "+2% XP for every member for 30 days", earned: true },
        { id: "century_walkers", name: "Century Walkers", goal: "1,000 km together since the guild was founded", reward: "+5% Gems for every member, for good", progress: "612 of 1,000 km" },
        { id: "bayanihan_heart", name: "Bayanihan Heart", goal: "50 civic reports confirmed by neighbours", reward: "A guild map theme", progress: "21 of 50 reports" },
        { id: "iron_streak", name: "Iron Streak", goal: "Every member on a 7-day streak at the same time", reward: "500 Gems shared among members", progress: "Not yet" },
        { id: "vanguard_guild", name: "Vanguard Guild", goal: "Review civic reports for the city", reward: "Coming later", progress: "Coming later" }
      ]
    },

    // Real landmark names (supabase/landmarks_tuguegarao.sql). Holders and
    // kilometres are made up. x, y place them on the drawn map.
    landmarks: [
      { name: "Ugac Sur", x: 150, y: 250, holder: { name: "Ugac Striders", color: "teal", reason: "Won last month" },
        top: [{ name: "Ugac Striders", color: "teal", km: 31.4 }, { name: "Cagayan Pacers", color: "orange", km: 18.9 }],
        mine: { month: 31.4, week: 8.2 } },
      { name: "Ugac Norte", x: 300, y: 140, holder: { name: "Cagayan Pacers", color: "orange", reason: "Took it this week" },
        top: [{ name: "Cagayan Pacers", color: "orange", km: 22.0 }, { name: "Ugac Striders", color: "teal", km: 12.5 }],
        mine: { month: 12.5, week: 3.1 } },
      { name: "Buntun", x: 92, y: 690, holder: null,
        top: [{ name: "Sunrise Lakad Club", color: "sky", km: 0.8 }],
        mine: { month: 0, week: 0 } }
    ],

    territoryRules: { challengeRatio: 1.5, challengeDays: 7, forfeitDays: 14, boost: 1.2 },

    // services/store.ts and the shop_items rows in supabase/10_ and 13_
    gemPacks: [
      { gems: 120, pesos: 49 }, { gems: 300, pesos: 99 },
      { gems: 650, pesos: 199, note: "Popular" }, { gems: 1400, pesos: 399, note: "Best value" }
    ],
    shop: {
      streak: [
        { id: "streak_freeze", name: "Streak Freeze", price: 80,
          desc: "Saves your streak on a day you can't move. Used by itself when you miss a day. Hold up to 2." },
        { id: "streak_repair", name: "Streak Repair", price: 150,
          desc: "Missed yesterday? Bring your streak back. Only works the day after a single missed day.", blocked: "Your streak isn't broken" }
      ],
      boosts: [
        { id: "bayanihan_boost", name: "Bayanihan Boost", price: 120, desc: "+25% XP from civic reports for 24 hours." },
        { id: "territory_boost", name: "Territory Boost", price: 150, desc: "Your whole guild's distance in landmark zones counts 1.2x for 24 hours." }
      ],
      trail: [
        { id: "trail_aqua", name: "Aqua", price: 300, colors: ["#00F5D4"] },
        { id: "trail_sky", name: "Sky", price: 300, colors: ["#00BBF9"] },
        { id: "trail_teal", name: "Teal", price: 300, colors: ["#209F77"] },
        { id: "trail_gold", name: "Gold", price: 600, rare: true, colors: ["#FFD60A"] },
        { id: "trail_karela", name: "Karela", price: 600, rare: true, colors: ["#7CF205", "#00F5D4", "#209F77"] }
      ],
      frame: [
        { id: "frame_aqua", name: "Aqua", price: 300, colors: ["#00F5D4", "#00BBF9"] },
        { id: "frame_ember", name: "Ember", price: 300, colors: ["#FF9F1C", "#FFD60A"] },
        { id: "frame_gold", name: "Gold", price: 600, rare: true, colors: ["#FFD60A", "#FFD60A"] }
      ],
      owned: ["trail_aqua"]
    },

    scoutPass: {
      season: "Season 1",
      pesos: 149,
      days: 90,
      seasonLevel: 4,
      seasonXp: 320, // of 750 to the next level
      benefits: [
        { icon: "gem", title: "+20% Gems from sector bonuses", body: "For the whole season, on every run." },
        { icon: "trail", title: "Rare map trails", body: "Season-only trail colours for your run line." },
        { icon: "star", title: "Exclusive Ani outfits", body: "Dress Ani in this season's looks." },
        { icon: "civic", title: "Early access to new quest types", body: "Try new quests before everyone else." },
        { icon: "medal", title: "A season badge", body: "Shows on your profile, for good." }
      ],
      track: [
        [1, null, "Season 1 badge"], [2, "20 Gems", "40 Gems"], [3, null, "Streak Freeze"],
        [4, "20 Gems", "50 Gems"], [5, "Streak Freeze", "Sunrise trail"], [6, null, "60 Gems"],
        [7, "30 Gems", "Streak Freeze"], [8, null, "Season 1 frame"], [9, "30 Gems", "70 Gems"],
        [10, "Streak Freeze", "Ani outfit: season jacket"]
      ]
    },

    // Ani's answers to the quick-reply buttons. Same wording and rules as
    // the app's premade replies (services/ai/demoReplies.ts): general
    // wellness coaching, never a diagnosis.
    ani: {
      disclosure: "Ani gives general wellness guidance, not medical advice. For pain or injury, see a health professional.",
      chips: [
        { q: "Analyze my last run", icon: "time" },
        { q: "My progress", icon: "trend" },
        { q: "Best shoes for me?", icon: "bag" },
        { q: "Is it safe to run today?", icon: "sun" }
      ],
      replies: {
        "Analyze my last run": [
          "Here's your last run, Randel: 3.10 km in 20:18, about 6:33 per km.",
          "That's approximately 14 seconds per km quicker than your 30-day average (6:47). Nice work. Keep the next one easy so your legs can recover.",
          "You're on a 12-day streak, so the main job is to keep it going, not to go faster.",
          "Next time, try the first 5 minutes as a brisk walk to warm up. If anything hurts, rest, and see a health professional if it doesn't settle."
        ],
        "My progress": [
          "Last 30 days, Randel: 57.9 km over 19 runs on 19 days, at about 6:47 per km on average. You're level 7.",
          "You're on a 12-day streak, so the main job is to keep it going, not to go faster.",
          "For the next two weeks, add a little at a time, roughly 10% more distance per week at most. Kaya mo 'yan."
        ],
        "Best shoes for me?": [
          "Good question, Randel. You don't need an expensive pair. Fit matters more than the brand.",
          "Look for a thumb's width of space at the toes, a heel that doesn't slip, and enough cushioning to feel comfortable on concrete. Try them on in the afternoon, when your feet are a little bigger.",
          "Most running shoes last approximately 500 to 800 km. If yours feel flat or your legs ache more than usual after runs, it may be time for a new pair, and if the ache stays, check with a health professional."
        ],
        "Is it safe to run today?": [
          "Clear sky in Tuguegarao, 31°C. Safe for a run, but it's warm.",
          "Go early or after 5 PM, bring water, and slow down if you start feeling dizzy.",
          "If the weather turns into a storm, I won't ask you to run. Your streak can wait. Karela should never be the reason someone gets hurt."
        ],
        "Is it safe to run today? (storm)": [
          "Heavy rain and strong wind in Tuguegarao right now. Stay in today.",
          "A short indoor stretch is a good option: 10 minutes of slow lunges, calf raises and shoulder rolls.",
          "Your streak can wait. Karela should never be the reason someone gets hurt."
        ]
      },
      typed: "This is the demo, so I can only answer the questions in the buttons above. In the app, you can ask me anything about your running."
    }
  };
})();
