# Karela QA Report and to-do list

**Updated:** 2026-10-08 (replaces the 2026-10-07 report; every old finding is carried over below with its new status)
**Scope:** the whole app (`app/`, `components/`, `hooks/`, `services/`, `context/`), all 13 SQL files (schema plus 12 migrations), config, and the docs and landing-page claims about the app.

This is the one place that says what is done and what is left. Section 3 is **your** list (things only you can do). Section 5 is the work list, most urgent first.

---

## 1. How this was checked

| Check | Result |
| --- | --- |
| `npm run type-check` (strict TypeScript) | **0 errors** in the app. (The only errors are in `app-example/`, the old Expo starter, which is gitignored and can be deleted.) |
| `npm run lint` | **0 errors, 32 warnings** (was 51 findings with 4 errors on 2026-10-07). Details in 5.6. |
| `npx expo-doctor` | **21 of 21 checks pass.** |
| Bundling | `npx expo export` builds for **Android and iOS** with no errors. |
| SQL tests (`supabase/tests`, new) | **105 of 105 pass** for migrations 10 to 13 (shop, streaks, squads, guilds, territory), on a throwaway Postgres. |
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
| Build, types, lint | **Good** | Clean types, no lint errors, both platforms bundle |
| Auth and profile | **Good, needs signup checks** | Login, signup, verification, profile editing, profile photos. Signup still has no validation or consent (H9) |
| Settings and privacy | **Done** (needs 08) | Privacy Zones, daily reminder, permissions, change password, download data, delete account, honest "Your data" page |
| Streaks | **Done** (needs 10) | Server counts streaks; Freeze, Repair and Collective Shield all protect days |
| Shop | **Done** (needs 10 and 13) | Real catalogue, server-checked purchases, cosmetics on map and profile |
| Squads, guilds, territory | **Done** (needs 11 to 13, plus landmarks) | Full rules on the server, three-tab screen, map zones |
| Run tracking | **At risk** | No background tracking, no crash recovery, results passed through the URL (C5 to C7) |
| Rewards (XP, Gems) | **Still forgeable** | The phone still awards XP and Gems itself (C1) |
| Civic engine | **Mostly locked** | Writes locked (05), decay scheduled (06). Photos public, reports readable by all, rewards farmable (C4, H5, H6) |
| Ani | **Safer, still client-side** | Wellness-only rules in every prompt. Key in the app, no chat memory (C3, H10) |
| Offline-first | **Not built for runs** | Only territory uploads queue offline. Runs don't (C7) |
| Accessibility | **Improving** | 61 labels/roles now (was 0). Colour-only states remain in places |
| Tests | **SQL only** | 105 SQL tests. No app tests; jest isn't installed (M12) |
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
2. **Add landmarks** for territory with exact coordinates (I didn't invent any). Example at the top of `13_territory.sql`.
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

**C1. Rewards are still decided by the phone. (Partly)**
`07_` stops logged-out abuse and locks profile columns, and the Shop, shields and territory are server-side now. But a logged-in user can still call `increment_stats` / `set_stats` on their own row and give themselves XP and Gems, and `missions` is still writable by its owner (`for all` policy).
*Fix:* move run rewards (`finish_run`), quest claims (`claim_mission`) and civic rewards into server functions that compute the amount, then revoke `increment_stats` / `set_stats` from the app. Reset progress (Settings) will need a server function at the same time.

**C3. Gemini and weather keys ship inside the app. (Open)**
*Fix:* a Supabase Edge Function holds the keys, checks the login and rate-limits. Check git history for `.env` (section 3).

**C4. Civic rewards can be farmed. (Partly)**
The app now sends the fixed 25 m radius, but the server still accepts any radius from the caller; no photo is required; +50 XP and +5 Gems are paid before anyone confirms.
*Fix:* ignore the client radius in `submit_civic_report`, require a photo, cap reports per day, pay most of the reward on confirmation (in a server function, see C1).

**C5. Anyone can award themselves a run with a link. (Open)**
`app/summary.tsx` still reads distance, time, calories, XP and the route from the URL.
*Fix:* save the finished run on the phone with an id and open the summary by id; let the server compute XP (C1).

**C6. Runs stop when the screen locks. (Partly)** The run time is now read from the clock, so it stays right after a background trip, and the summary never shows NaN. GPS still stops while the screen is locked, so distance has a gap.
No background location task; duration comes from a timer that pauses in the background. ("Keep screen on during runs" in Settings is a stopgap.)
*Fix:* background location task with an Android foreground service; duration from GPS timestamps.

**C7. A run is lost if the app is killed or offline. (Open)**
No run outbox, no run UUIDs. Finishing offline fails. (Territory uploads already use a UUID queue: reuse that pattern.)
*Fix:* write the run to SQLite while it happens, queue the upload with a UUID, and make `finish_run` idempotent on that UUID. Then the website's offline claim becomes true.

**C2. Anyone could edit civic nodes. (Fixed by `05_`)**
**C8. Civic nodes never decayed. (Fixed by `06_`)**

### 5.2 High

**H2. Quest claim isn't atomic, and its XP comes from the phone. (Open)** `QuestEngine.claimQuest` reads, marks claimed, then awards in separate calls; AI-written rewards aren't clamped. *Fix:* one `claim_mission` server function (see C1); clamp AI rewards.

**H3. The 7-day onboarding never advances. (Open)** `completeOnboardingDay()` is never called; its Gems are never paid; it uses UTC dates. *Fix:* call it when an onboarding quest is claimed; use the local-date helper.

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
**N6. Reset progress lowers Squad XP.** Squad XP counts XP earned while in the squad, so a member who resets takes their share back to zero. Probably fine; decide if a reset should keep it.

### 5.4 Medium

- **M1. Two GPS engines (Open).** Home and Run each start `useLocationEngine`.
- **M2. Performance on low-end Android (Open).** One map line per GPS segment; map in a scroll view; list in a scroll view; 3D on Home; the route is passed in the URL.
- **M3. Time zones (Partly).** Three spots still use UTC dates (`dashboard.tsx:210`, `onboarding.ts:124,137`). The new server code uses Philippine time throughout.
- **M4. Speed quests are tracked by distance (Open).**
- **M5. Adaptive features run on empty input (Open).** `decayModel: null` in 3 places; Resonance always gets `isGhostAhead: false`.
- **M6. Stats are estimates shown as facts (Partly).** Calories now use body weight (1 kcal/kg/km) and are labelled as estimates; steps are still 1,310/km.
- **M8. Robustness (Open).** Level-up lock is per device; `syncRunToMissions` uses `Promise.all`; no limit on `getMissions`; a failed profile load leaves the user signed in with no profile.
- **M9. Accessibility (Partly).** 61 labels and roles now (was 0), and the new screens are labelled. Older screens and colour-only states (ghost ahead/behind) remain.
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
| "Tracking runs offline in SQLite and syncs ... Every event carries a UUID" | **Not true yet** for runs (C7). True for territory uploads only |
| "Does it work offline? Fully, and it syncs when you're back online" | **Not true yet** (C7) |
| "Up to five 100 m Privacy Zones are never stored, even locally" | **True** (Settings > Privacy Zones) |
| "account deletion completes within 72 hours" | **True once `08_` is run** (it's immediate) |
| Civic reports "expire when they go stale" | **True once `06_` is run** |
| Storm rule ("in a storm the app stops asking users to run") | **True** for Tier 0 and 1 (needs the weather key, now set) |
| "Raw GPS stays on your phone" | **True** (runs upload totals; territory uploads km per zone; civic reports upload the report location) |

Either build C7 or soften the two offline lines to "planned". I haven't changed the page.

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

**Run tracking** *(old items, still expected to fail)*
- [ ] Lock the screen for 2 minutes mid-run: gap in the path, wrong time? *(C6)*
- [ ] Force-close mid-run: anything recoverable? *(C7)*
- [ ] Finish a run in airplane mode. *(C7)*
- [ ] Ride a bike at 20 km/h: counted as running? *(H4)*
- [ ] Open `karela://summary?meters=99999&seconds=60&kcal=1&xp=99999`: does it award? *(C5)*

**Map**
- [ ] On an iPhone, place a civic flag by dragging the map under the marker: the flag lands where the marker points.

**Ani**
- [ ] Ask two questions where the second depends on the first. *(H10: she forgets)*
- [ ] Tell Ani your knee hurts: the answer is cautious and suggests rest or a doctor.

---

## 9. Suggested order of work

1. **You:** run `07_` today (security), then `08_` to `13_`, add landmarks, set EAS variables.
2. **C5 + C7 together:** runs saved on the phone with a UUID and an outbox, summary opened by id, offline finishing. This also makes the website's offline claim true.
3. **C1:** server-side rewards (`finish_run`, `claim_mission`, civic rewards), then revoke the stats functions from the app. Fold in H2 and H3.
4. **C6:** background tracking with a foreground service.
5. **C3 + H10:** Ani behind an Edge Function, with chat memory.
6. **Before a pilot:** H5, H6, C4, H9, N1, and the privacy wording decision.
7. **Quality:** jest and app tests (M12), M2 performance, M3 dates, accessibility on older screens, remove dead code (L1).

---

## 10. How to re-run these checks

```bash
npm install --legacy-peer-deps
npm run type-check                 # app: no errors (app-example/ errors can be ignored or the folder deleted)
npm run lint                       # 0 errors, 32 warnings today
npx expo-doctor                    # needs internet
npx expo export --platform android --output-dir /tmp/karela-export   # bundles?
cd supabase/tests && npm install && npm test                        # 105 SQL checks
git log --all --full-history -- .env                                # should print nothing
```
