# Karela QA Report and to-do list

**Updated:** 2026-10-09 (checks re-run and the work committed late on 2026-10-08 added. Replaces the 2026-10-07 report; every old finding is carried over below with its new status)
**Scope:** the whole app (`app/`, `components/`, `hooks/`, `services/`, `context/`), all 13 SQL files (schema plus 12 migrations), config, and the docs and landing-page claims about the app.

This is the one place that says what is done and what is left. Section 3 is **your** list (things only you can do). Section 5 is the work list, most urgent first.

---

## 1. How this was checked

| Check | Result |
| --- | --- |
| `npm run type-check` (strict TypeScript) | **8 errors** in the app (was 0 on 2026-10-08). All type mismatches, not crashes; see T1 in 5.1b. (Errors in `app-example/`, the old Expo starter, are ignored: it is gitignored and can be deleted.) |
| `npm run lint` | **0 errors, 32 warnings** (was 51 findings with 4 errors on 2026-10-07). Details in 5.6. |
| `npx expo-doctor` | **21 of 21 checks pass** (2026-10-08, not re-run; needs internet). |
| Bundling | `npx expo export` builds for **Android and iOS** with no errors (2026-10-08, not re-run). |
| SQL tests (`supabase/tests`) | **104 of 105 pass** for migrations 10 to 13 (shop, streaks, squads, guilds, territory), on a throwaway Postgres. The one failure is a timing fault in the test, not in the guild code (T2 in 5.1b). Because `npm test` stops at the first failing file, run the four files one by one to see all results. |
| Code read | Every finding from the old report re-checked against today's code. |

**Not checked:**
- **Nothing was run on a phone.** "Done" below means the code is written, type-checks, bundles and (for SQL) passes tests, not that I watched it work on a device. Section 8 is the device test list.
- **I can't see your live Supabase project.** I can't tell which migrations you have run. Section 3 lists the ones I wrote that need running.
- **I can't see EAS** (cloud build) settings or your git history for `.env`.
- `.env` was not read. (expo-doctor printed only the *names* of the variables it loaded: the Gemini and weather keys are now set.)

---

## 2. Status at a glance

| Area | Status | Summary |
| --- | --- | --- |
| Build, types, lint | **Good, 8 type errors** | No lint errors, both platforms bundle; 8 new type mismatches (T1) |
| Auth and profile | **Good, needs signup checks** | Login, signup, verification, profile editing, profile photos. Signup still has no validation or consent (H9) |
| Settings and privacy | **Done** (needs 08) | Privacy Zones, daily reminder, permissions, change password, download data, delete account, honest "Your data" page |
| Streaks | **Done** (needs 10) | Server counts streaks; Freeze, Repair and Collective Shield all protect days |
| Shop | **Done** (needs 10 and 13) | Real catalogue, server-checked purchases, cosmetics on map and profile |
| Squads, guilds, territory | **Done** (needs 11 to 13, plus landmarks) | Full rules on the server, three-tab screen, map zones |
| Run tracking | **Better, one gap left** | New run screen, run outbox with crash recovery and offline finishing, summary opened by id (C5, C7). Still no background tracking (C6) |
| Progress and stats | **Done** | Progress and Your activity read every finished run, with real pace and bar charts (M15) |
| Rewards (XP, Gems) | **Server-side once `15_` is run** | Runs, quests, first-week days and civic reports are paid by server functions; the app can't add XP or Gems (C1, H2, H3). Distance itself still comes from the phone (H4) |
| Civic engine | **Mostly locked** | Writes locked (05), decay scheduled (06). Photos public, reports readable by all, rewards farmable (C4, H5, H6) |
| Ani | **Safer, still client-side** | Wellness-only rules in every prompt. Key in the app, no chat memory (C3, H10) |
| Offline-first | **Built for runs** | Runs and territory uploads queue offline with UUIDs (C7, needs device test) |
| Accessibility | **Improving** | 83 labels/roles now (was 0 on 2026-10-07). Colour-only states remain in places |
| Tests | **SQL only** | 105 SQL tests (104 pass, see T2). No app tests; jest isn't installed (M12) |
| Icons and art | **Done** | Custom Karela icon set and 18 low-poly 3D renders |

---

## 3. Waiting on you (only you can do these)

1. **Run the SQL migrations in Supabase, in this order** (SQL Editor, one file at a time). Each file is safe to run twice and ends with checks you can run.
   | File | What it does | Without it |
   | --- | --- | --- |
   | `07_close_stats_hole.sql` | Logged-out callers can't change stats; signup can't inject XP; only 4 profile columns editable | **Urgent security hole stays open** |
   | `08_account_deletion.sql` | Delete account works | Delete account says "not switched on yet" |
   | `09_profile_pictures.sql` | Profile photo storage | Photo upload says "not switched on yet" |
   | `10_streak_protection_and_shop.sql` | Shop, Streak Freeze/Repair, server streak | Shop shows "not switched on"; streaks fall back to the old count |
   | `11_squads.sql` | Squads and Collective Shield | Squad tab can't load |
   | `12_guilds.sql` | Guilds and badges | Guild tab can't load |
   | `13_territory.sql` | Landmarks, territory scoring, Territory Boost, buffs | Territory tab and map zones can't load |
   | `14_finish_run.sql` | Saves a run and its distance in one step, once per run id | Runs still save (once, by id), but a lost reply could add the distance total twice |
   | `15_server_rewards.sql` | The server pays runs, quests, first-week days and civic reports; the app can't add XP or Gems | **Anyone logged in can still give themselves XP and Gems**; first-week Gems are never paid |
2. **Add landmarks:** the first three (Ugac Sur, Ugac Norte, Buntun) are in `supabase/landmarks_tuguegarao.sql`; run it. Add more there.
3. **Decide the privacy wording about Ani.** `docs/aboutkarela.md` says body data is "never shared with third parties", but Ani's prompts send display name, weight, age, notes for Ani and run summaries to Google Gemini. The in-app "Your data" page describes what really happens. Either change the spec wording or trim the prompts (or both).
4. **Check the app id** `com.worshestershire.karela` (looks like a typo of "worcestershire"). It can't change after the first store upload. (M13)
5. **Set the EAS environment variables** (Supabase, Gemini, weather, Google Maps) before a cloud build, or the release app stops at launch. (H8)
6. **Check git history for `.env`:** `git log --all --full-history -- .env`. If it prints anything, rotate those keys. (C3)
7. **One number still undecided:** how often squad leadership can change hands (the spec asks for a limit). Today there's none.
8. **Point the website host at `website-v2/`** (the old `website/` folder was deleted).
9. **Run the device tests** in section 8.

---

## 4. What's complete

**This round (2026-10-08)**
- **Settings rebuilt:** sample-data button removed; Reset progress fixed (it used to *set* XP to 3,500 and level 4); Privacy Zones (5 zones, 100 m, stored only on the phone, route points inside never saved); daily reminder outside Quiet Hours (10 PM to 7 AM); permission status and shortcuts; keep screen on during runs; change password (checks the current one); download my data; delete account (typed confirmation, dry run first so nothing is half-deleted); "Your data" page that matches the code.
- **Profile photos:** take or choose, square crop, small upload, location data stripped, shown on Profile, Home, Progress and Settings, removed with the account.
- **Streak protection** (`10_`): the server counts streaks from runs plus protected days. Streak Freezes are used automatically for missed days (only when they cover the whole gap), Streak Repair fixes a single missed day, and the squad Collective Shield protects today. Old H1 is fixed.
- **Shop** (`10_`, `13_`): Streak Freeze 80 (hold 2), Streak Repair 150, Bayanihan Boost 120 (+25% civic XP, 24 h), Territory Boost 150 (guild, 1.2x, 24 h), 5 run trails and 3 photo frames (300 / 600). Prices live in the database. Every purchase is checked and paid on the server in one transaction. Cosmetics show on the run map and around profile photos.
- **Squads** (`11_`): create at Level 3, 3 to 12 members, invite code with leader/co-leader approval, roles, hand-over, remove, rename every 7 days, rejoin after 24 h, 10 pending requests max, Squad XP that keeps leavers' contributions, Collective Shield (200 Gems split, 6 PM to midnight, refunds if unfilled).
- **Guilds** (`12_`): found at 5,000 Squad XP and 3 members, up to 10 squads, applications, guild roles and hand-over, leadership passes on automatically when people leave, guild closes when its last squad leaves, all five spec badges with their buffs (Pioneer +2% XP 30 days, Century Walkers +5% Gems, Bayanihan Heart map theme, Iron Streak 500 Gems once; Vanguard Guild shown as "coming later").
- **Territory** (`13_`): landmark zones, monthly scoring, last-month winner holds, 150% weekly challenge, 14-day forfeit, Territory Boost. The phone sends only km inside each zone (never the route), queued offline with a UUID so retries never double-count. Zones and holder colours show on the run map.
- **Icons and art:** a custom Karela SVG icon set (`components/icons/KarelaIcon.tsx`) used in the drawer, dock, Shop, Squad and guild screens, streak and Gem displays; 18 low-poly 3D renders (about 4 KB each) for Shop items and badges, with the render script saved in `scripts/render-game-art/`.
- **Run screen and stats** (committed late on 2026-10-08): a live stats panel on the run screen (`components/run/RunHUD.tsx`); your position shown as an arrow that turns with your heading (`components/run/UserMarker.tsx`); one shared set of run maths (`services/runMath.ts`: distance, time from the clock, pace, XP at 1 per 10 m, calories from body weight) so the run screen, summary and saved run agree; Progress, Your activity and the performance graph read every finished run through `services/runAnalytics.ts` and draw real pace and bar charts (`components/charts/`); the ghost marker moves more smoothly.
- **Gem packs and Scout Pass screens** (2026-10-09): Shop has a Scout Pass entry and four Gem packs; `app/scout-pass.tsx` shows the benefits, your season level from real run XP and the 20-level track. Screens only (N7). Not yet tried on a phone.
- **Territory map** (2026-10-09): Territory tab > See the map opens `app/territory-map.tsx`, with every landmark circle filled in its holder's colour, a legend of who holds what, and a card with this month's km when you tap a circle. Not yet tried on a phone.
- **Housekeeping:** project folders reorganized (docs in `docs/`, 3D sources in `assets/3d/source/`, 40 MB of unused files removed); dead sample-data seeders removed; a misleading notification-permission prompt removed; old client-side gem prices removed (the server holds them).

**Earlier rounds (still true)**
- Civic tables locked to server functions (`05_`), decay scheduled hourly (`06_`): old C2 and C8 are fixed once those are run.
- Ani: wellness-only rules in every prompt; never diagnoses.
- Storm safety (Bayanihan Tier 0 and 1 from live weather): Ani stops asking you to run in strong wind, heavy rain or thunderstorms.
- Calendar on real run history; dashboard Today card; screen transitions; Customize Ani; flag placement on the map.
- GPS pipeline (Kalman smoothing, jump and speed rejection), streak multiplier tiers match the spec, atomic stat increments, RLS on every table.

---

## 5. To do, most urgent first

Status words: **Open** (not started), **Partly** (some done, see note), **Fixed** (kept here for the record).

### 5.1 Critical (fix before any real user)

**C1. Rewards are still decided by the phone. (Fixed by `15_`, 2026-10-11)**
`15_server_rewards.sql`: `finish_run` works out a run's XP, Gems, calories, streak and quest progress from its distance and time; `claim_mission` checks and pays a quest at once; `submit_civic_report` pays the report itself; `reset_my_progress` replaces the phone's reset. The app can't call `increment_stats`, `set_stats` takes only body details, Ani notes and quest dates, and the app can only expire a quest (new quests get capped XP, a minimum target and a limit per day / week / month). All numbers are in `karela_reward_rules()`. The app falls back to the old way until `15_` is run. 30 SQL checks in `supabase/tests/t15.mjs`; the civic report function itself needs PostGIS and isn't covered there (test it on the device).
*Still open:* the distance itself still comes from the phone (H4; the server caps it at 35 km/h). Civic rewards are still paid when a report is sent (C4).

**C3. Gemini and weather keys ship inside the app. (Open)**
*Fix:* a Supabase Edge Function holds the keys, checks the login and rate-limits. Check git history for `.env` (section 3).

**C4. Civic rewards can be farmed. (Partly)**
The app now sends the fixed 25 m radius, but the server still accepts any radius from the caller; no photo is required; +50 XP and +5 Gems are paid before anyone confirms.
*Fix:* ignore the client radius in `submit_civic_report` (**done in `15_`**), require a photo. Owner decision 2026-10-11: **no daily cap**, and the reward stays paid when a report is sent. The same-area, same-day duplicate check still applies.

**C5. Anyone can award themselves a run with a link. (Fixed 2026-10-11)**
`app/summary.tsx` now opens a run by its id from the phone's outbox (`services/runOutbox.ts`); the link carries only the id. With `15_` the server works out the rewards from the distance and time (C1).

**C6. Runs stop when the screen locks. (Built 2026-10-11, needs device test in a development build)** `services/backgroundRun.ts`: during a run a background location task records GPS fixes while the app is in the background (Android: foreground service with a "Karela is recording your run" notification, stopped if the app is force-closed). Privacy Zone points are dropped before they're saved. Back in the app they join the trail through the same checks as live GPS (`hooks/useLocationEngine.ts`). A run cut off by a force-close gets its screen-locked points too. Time was already read from the clock. `app.config.js` now turns on iOS background location and has plain permission text.
*Limits:* needs "Allow all the time" location; without it, or in **Expo Go** (no background tasks), the run records only with the screen on, as before. Distance inside a Privacy Zone while the screen is locked isn't counted (those points are never stored). A change to `app.config.js` needs a new build (`npx expo prebuild --clean` locally; EAS does it itself).

**C7. A run is lost if the app is killed or offline. (Built 2026-10-11, needs device test)**
`services/runOutbox.ts`: a run gets a UUID at Start and is saved to the SQLite table `run_outbox` every 20 s and when the app goes to the background (Privacy Zone points removed first). If the app is killed, the map offers "Review and save" or "Discard" next time. "Save and finish" queues the run; sync runs right away, at sign-in and whenever the app comes back to the front. Each sync step (history, totals, streak, XP, Gems, quests, territory, Ani's summary) is ticked off on the phone, so a retry never repeats a finished step; `finish_run` (`14_`) ignores a repeated id. The row and its route are deleted once everything is sent.
*Closed by `15_`:* a lost reply after XP, Gems or quest progress could repeat them; with `15_` they're paid inside `finish_run`, once per run id. Territory km are now worked out from the route with Privacy Zone points removed (before, from the full route), so a landmark that overlaps a zone can count a little less.

**C2. Anyone could edit civic nodes. (Fixed by `05_`)**
**C8. Civic nodes never decayed. (Fixed by `06_`)**

### 5.1b Found on 2026-10-09 (fix first, both are small)

**T1. 8 TypeScript errors. (Fixed 2026-10-11)** `KarelaIcon` now takes a `ColorValue`; `calculateDistance` takes any `{ latitude, longitude }` (the dummy ids in `app/territory-map.tsx` were removed). `npm run type-check` passes. They came in with the latest commits. None should crash the app, but `npm run type-check` no longer passes.
- `app/drawer/_layout.tsx` lines 115, 122, 129: the drawer gives `KarelaIcon` a `ColorValue`, but its `color` prop only accepts a `string`.
- `services/privacyZones.ts:21`, `services/runMath.ts:29`, `services/territory.ts:87-88`: `calculateDistance` (`services/tracker/geoUtils.ts`) asks for a `MapCoordinate`, which is stricter than the plain `{ latitude, longitude }` points these callers pass.
*Fix:* widen `KarelaIcon`'s `color` to `ColorValue` (or `String(color)` in the drawer), and let `calculateDistance` take any `{ latitude: number; longitude: number }`.

**T2. One SQL test depends on the time of day. (Fixed 2026-10-11)** The Century Walkers run is now logged a minute after founding; `npm test` runs all four files, 105 of 105 pass. `supabase/tests/t12.mjs` (Century Walkers) logs its 1,000 km run at 8:00 AM Manila time today, but the guild is founded "now". After 8 AM the run is earlier than the guild, so it doesn't count and the check fails. It passed when it was written because that was before 8 AM. The guild code is right; the test is wrong. Because the files run with `&&`, the failure also stops `t13` (territory) from running under `npm test`. Run alone, `t13` passes 21 of 21.
*Fix:* log that run a minute after the guild is founded (for example `now() + interval '1 minute'`).

**T3. Territory bars could draw in the wrong order and overflow. (Fixed 2026-10-09)** `get_territories` doesn't promise an order for `month_top`, but the Territory tab treated the first entry as the leader and sized every bar against it. Found while building the demo data. The tab now sorts by km itself (`components/guild/TerritoryTab.tsx`); no SQL change needed.

### 5.2 High

**H2. Quest claim isn't atomic, and its XP comes from the phone. (Fixed by `15_`)** `claim_mission` locks the quest, checks the goal, marks it claimed and pays in one transaction. New quests' XP is capped at the app's own formula (`scaleXP` for the level, times 1.3), so Ani's quests can't carry more.

**H3. The 7-day onboarding never advances. (Fixed by `15_`)** First-week quests carry their day (`missions.onboarding_day`); claiming one pays that day's Gems and moves to the next day on the server. The day key is the local date now. Amounts are copied from `services/onboarding.ts` (Day 4 pays 30 Gems; the spec now says the same).

**H4. Distance is easy to cheat. (Open)** Scoring ignores the step counter; anything under 35 km/h counts (bikes, tricycles, jeepneys in traffic); sector Gems are paid for every 500 m, not sectors beaten. *Fix:* cadence check, smarter vehicle detection, pay only sectors won.

**H5. Civic photos are public. (Open)** Bucket is public with no size, type or folder limits. *Fix:* private bucket, signed URLs, own-folder uploads, size and type limits (`09_` shows the pattern). Profile photos are public by design (unguessable names), noted on the "Your data" page.

**H6. Every user can read every report, with who and where. (Open)** *Fix:* own reports only; expose nodes without `created_by`.

**H8. A cloud build will probably stop at launch. (Partly)** The Maps key is now in `.env.example`; EAS variables still unknown (section 3).

**H9. Signup has no validation, consent or age gate. (Partly)** The server now drops out-of-range body numbers (`07_`), but the form accepts anything and there's no privacy-policy acceptance or minimum age. *Fix:* validate ranges in the form, consent checkbox with a link, decide a minimum age.

**H10. Ani forgets the conversation. (Partly)** Safety rules are in; each message is still sent alone, and calls are made from the phone. *Fix:* send recent turns; move to the Edge Function (C3).

**H11. The website says things the app doesn't do yet. (Partly)** See section 7.

**H1. Streak from the wrong place, freezes did nothing. (Fixed by `10_`)**
**H7. No account deletion; fake privacy rows. (Fixed by `08_`, Privacy Zones, and Settings)**
**H12. Developer tools in Settings. (Fixed: removed)**

### 5.3 New this round

**N1. Squad and guild changes don't notify anyone.** Join requests, accepted requests, shields and applications only show when the screen is opened. *Fix:* push notifications (needs a push service and the notification plan in the spec).
**N2. Squad leadership can change hands without limit.** Needs a number from you (section 3).
**N3. No landmarks yet** (section 3).
**N4. Seasonal Gem cap not built** (spec: Gems above 500 at season end become Legacy Tokens). Needs a season length decision.
**N5. Squad Vision (opt-in live squad locations) not built.** Must stay opt-in and off by default.
**N7. Gem packs and the Scout Pass are screens only.** `services/store.ts` has `STORE_OPEN = false`; Buy says nothing was charged. To sell for real: publish, create the products in Play Console and App Store Connect (ids are in `store.ts`), add a billing library (needs a development build, not Expo Go), and add Gems or the pass only after the server checks the receipt. The Scout Pass track, season dates and pack prices are drafts for the owner to review. **Open decision:** may bought Gems buy competitive items (Territory Boost, streak items)?
**N6. Reset progress lowers Squad XP.** Squad XP counts XP earned while in the squad, so a member who resets takes their share back to zero. Probably fine; decide if a reset should keep it.

### 5.4 Medium

- **M1. Two GPS engines (Open).** Home and Run each start `useLocationEngine`.
- **M2. Performance on low-end Android (Open).** One map line per GPS segment; map in a scroll view; list in a scroll view; 3D on Home; the route is passed in the URL.
- **M3. Time zones (Partly).** Three spots still use UTC dates (`dashboard.tsx:210`, `onboarding.ts:124,137`). The new server code uses Philippine time throughout.
- **M4. Speed quests are tracked by distance (Open).**
- **M5. Adaptive features run on empty input (Open).** `decayModel: null` in 3 places; Resonance always gets `isGhostAhead: false`.
- **M6. Stats are estimates shown as facts (Partly).** Calories now use body weight (1 kcal/kg/km) and are labelled as estimates; steps are still 1,310/km.
- **M8. Robustness (Open).** Level-up lock is per device; `syncRunToMissions` uses `Promise.all`; no limit on `getMissions`; a failed profile load leaves the user signed in with no profile.
- **M9. Accessibility (Partly).** 83 labels and roles now (was 0), and the new screens are labelled. Older screens and colour-only states (ghost ahead/behind) remain.
- **M10. Routing uses the public OSRM demo server (Open).**
- **M11. Auth hardening (Open).** No client throttling; weather city hardcoded to Tuguegarao.
- **M12. No app tests (Open).** jest isn't installed, so `npm test` fails. SQL tests exist now (`supabase/tests`).
- **M13. App id looks like a typo (Open).** Section 3. Also: `react-native-wagmi-charts` is no longer used anywhere (charts are drawn with react-native-svg now); remove it with `npm uninstall react-native-wagmi-charts --legacy-peer-deps` and check the app still starts.
- **M14. Reconfirming a civic node has no limit (Open).**
- **M15. Progress stats only counted runs saved as a ghost (Fixed).** Progress and Your activity now read `run_history` (every finished run) through `services/runAnalytics.ts`, with real charts (`components/charts/`).
- **M7. Placeholder screens (Fixed).** Calendar uses real data, Shop and Guilds are real, the random build id is gone.

### 5.5 Low

- **L1. Unused code (Partly).** Still there: `components/AvatarView.tsx` (empty file), `services/QuestGenerator.ts` (unused), `NotificationService.updateRaceWidget` (never called), `app/dashboard/character_creation.tsx` (no button opens it). Removed: sample-data seeders, unused styles, client-side gem prices.
- **L2.** 14 `console.log` and 75 `any`.
- **L3.** Several copies of the distance (haversine) function.
- **L5. Two ghost systems (Open).** Works because `maps.tsx` converts formats.
- **L6.** The ghost replays from its own start point.
- **L7. Emoji in alerts (Fixed).** None left.

### 5.6 Lint warnings (32, no errors)

22 are `react-hooks/refs` in `app/index.tsx` (animation values read during render). The rest are `set-state-in-effect` in older screens, two `purity` false alarms in `ai_coach.tsx` (`Date.now()` in a tap handler), and unused variables listed in L1/L2.

---

## 6. Spec features still not built

Indoor mode, stride calibration, anti-cheat beyond speed (H4), Bayanihan Tiers 2 to 4 (admin escalation; Tier 0 and 1 are automatic), exportable civic reports, LGU admin panel, Vanguard reviewer system (so the Vanguard Guild badge can't be earned yet), B2B quest nodes, Scout Pass, seasonal Gem cap (N4), Squad Vision (N5), the player character (`character_creation` is a stub), Ani outfits, i18n (Filipino, Ibanag), error monitoring, push notifications (weekly summary, streak at risk, shield alerts, Ani weekly plan), Community Hero mode.

---

## 7. Landing page claims vs the app

| Page says (`website-v2/index.html`) | Now |
| --- | --- |
| "Tracking runs offline in SQLite and syncs ... Every event carries a UUID" | **True once tested on a device** (C7 built 2026-10-11) |
| "Does it work offline? Fully, and it syncs when you're back online" | **Mostly**: runs now finish and sync offline (C7). Ani, the map tiles and civic reports still need a connection, and GPS stops when the screen locks (C6). Owner decides if "Fully" stays |
| "Up to five 100 m Privacy Zones are never stored, even locally" | **True** (Settings > Privacy Zones) |
| "account deletion completes within 72 hours" | **True once `08_` is run** (it's immediate) |
| Civic reports "expire when they go stale" | **True once `06_` is run** |
| Storm rule ("in a storm the app stops asking users to run") | **True** for Tier 0 and 1 (needs the weather key, now set) |
| "Raw GPS stays on your phone" | **True** (runs upload totals; territory uploads km per zone; civic reports upload the report location) |

C7 is built. Once it passes the device test, the first line is true; the "Fully" line is the owner's call. I haven't changed the page.

---

## 8. Device test list

Test on a mid-range Android phone (and an iPhone if you can). Expected failures are marked.

**Settings, profile, privacy**
- [ ] Profile > tap photo > take and choose a photo; it shows on Home and Settings. *(needs 09)*
- [ ] Add a Privacy Zone at home, run out of it, save as ghost; the saved route starts outside the circle.
- [ ] Daily reminder arrives at the chosen hour; turning notifications off in phone settings shows the warning in Settings.
- [ ] Change password, log out, log in with the new one.
- [ ] Download my data opens the share sheet with your data.
- [ ] Delete a throwaway account; you land on login and can't log back in. *(needs 08)*

**Rewards** *(needs 15)*
- [ ] Finish a 2 km run: about +200 XP (more on a streak) and +20 Gems; the profile shows them after the summary closes.
- [ ] Claim a finished quest: the XP and Gems shown match the profile. Tap claim twice quickly: paid once.
- [ ] A new account: the Day 1 quest appears; finish 500 m and claim it: +20 Gems, and the next day brings Day 2.
- [ ] Send a civic report: "+50 XP, +5 Gems" (more on a streak); the third report nearby: "+200 XP, +20 Gems". A civic quest moves by one.
- [ ] Settings > Reset progress: level 1, 0 km, Gems kept.
- [ ] Edit weight and Ani notes in the profile: saved.

**Shop and streaks** *(needs 10)*
- [ ] Buy a Streak Freeze; skip a day; open the app: the streak is kept and you hold one fewer.
- [ ] Miss one day with no freeze; the Shop offers Streak Repair; buy it; the streak comes back.
- [ ] Buy a trail; start a run; the line is the new colour (coral still means vehicle). Buy a frame; it shows around your photo.
- [ ] Buy the Bayanihan Boost; send a civic report; the alert shows the boost.

**Squads, guilds, territory** *(needs 11 to 13, and 2 to 3 test accounts)*
- [ ] Reach Level 3, start a squad, share the code, join from another account, accept.
- [ ] After 6 PM, with a member on a streak who hasn't run: two members chip in to 200; that member's streak survives the night.
- [ ] Squad with 5,000 Squad XP founds a guild; a second squad applies and is accepted.
- [ ] Add a landmark near you; run inside its circle; the guild's km shows in the Territory tab and the circle on the map turns the guild's colour.
- [ ] Turn on airplane mode, run inside a zone, finish, then go online and reopen the app: the km arrive once.

**Run outbox** *(C5, C7; best with 14 run)*
- [ ] Run 1 km, force-close the app mid-run, reopen, open the map: "You have an unsaved run" shows about the distance you'd covered by the last save (up to 20 s missing). "Review and save" opens the summary; save it; it shows once in Calendar.
- [ ] Same, but tap "Discard": nothing is saved and the prompt doesn't come back.
- [ ] Airplane mode on: run, end, "Save and finish": "Saved on this phone" shows. Airplane mode off, bring Karela back to the front: distance, XP and the Calendar entry arrive once.
- [ ] Turn off the connection right after tapping "Save and finish" (or force-close during the save), then reopen online: the run is counted once, not twice.
- [ ] Open `karela://summary?meters=99999&seconds=60&kcal=1&xp=99999`: "Run not found", nothing awarded.
- [ ] Settings > Reset progress with a run waiting offline: the waiting run is gone too.

**Screen locked** *(C6; development build, location set to "Allow all the time")*
- [ ] Start a run, lock the screen, walk 500 m, unlock: the trail has no gap and the distance includes those 500 m. Android shows "Karela is recording your run" while it's locked, and the notification goes when the run ends.
- [ ] Same with Privacy Zone at home: the saved route has a gap inside the circle.
- [ ] Lock the screen mid-run, then force-close Karela from the recent apps: the notification goes; reopen the map: "You have an unsaved run" with the distance up to the force-close.
- [ ] In Expo Go: a run still starts and records with the screen on; nothing crashes.
- [ ] Location set to "While using the app" only: the run still records with the screen on.

**Run tracking** *(still expected to fail)*
- [ ] Ride a bike at 20 km/h: counted as running? *(H4)*

**Map**
- [ ] On an iPhone, place a civic flag by dragging the map under the marker: the flag lands where the marker points.

**Ani**
- [ ] Ask two questions where the second depends on the first. *(H10: she forgets)*
- [ ] Tell Ani your knee hurts: the answer is cautious and suggests rest or a doctor.

---

## 9. Suggested order of work

1. **You:** run `07_` today (security), then `08_` to `13_`, add landmarks, set EAS variables.
2. ~~**T1 + T2**~~ done 2026-10-11.
3. ~~**C5 + C7**~~ built 2026-10-11 (run `14_`, then the device tests for runs below).
4. ~~**C1 + H2 + H3**~~ built 2026-10-11 (run `15_`, then the reward device tests in section 8).
5. ~~**C6**~~ built 2026-10-11 (test it in a development build).
6. **C3 + H10:** Ani behind an Edge Function, with chat memory.
7. **Before a pilot:** H5, H6, C4, H9, N1, and the privacy wording decision.
8. **Quality:** jest and app tests (M12), M2 performance, M3 dates, accessibility on older screens, remove dead code (L1).

---

## 10. How to re-run these checks

```bash
npm install --legacy-peer-deps
npm run type-check                 # app: 0 errors; app-example/ errors can be ignored or the folder deleted
npm run lint                       # 0 errors, 32 warnings today
npx expo-doctor                    # needs internet
npx expo export --platform android --output-dir /tmp/karela-export   # bundles?
cd supabase/tests && npm install && npm test                        # 145 SQL checks, all pass; stops at the first failing file
for f in t10 t11 t12 t13 t14 t15; do node $f.mjs; done               # all six files, even if one fails
git log --all --full-history -- .env                                # should print nothing
```
