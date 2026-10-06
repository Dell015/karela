# Karela QA Report

**Date:** 2026-10-07
**Scope:** the whole app: 20 screens and routes, 14 components, 5 hooks, 25 services and engines, `context/`, 4 SQL migrations, config and build files, and the docs that make claims about the app.
**Replaces:** `AUDIT_CHECKLIST.md` (June 2026) and `AUDIT_FINDINGS.md` (July 2026). Both are out of date. Section 3 shows what happened to every old finding, so nothing is lost. You can delete the two old files once you have read it.

---

## 1. How this was checked (and what was not)

| Method | Result |
| --- | --- |
| `tsc --noEmit` (strict) | **Passes with 0 errors** |
| `eslint` (expo config, includes React Compiler rules) | **51 findings, 4 of them marked error** (see 4.12) |
| `expo-doctor` | 19 of 21 checks pass. The 2 failures were network lookups from my workspace, not problems in your project |
| Code read | Every file in `app/`, `components/`, `hooks/`, `services/`, `context/`, `supabase/`, plus `app.config.js`, `eas.json`, `package.json`, `.gitignore`, `.env.example` |
| Search checks | Each old audit finding re-checked against the current code |

**Not checked, and why it matters:**

- **Nothing was run on a phone.** Every "works" below means "the code looks right and type-checks", not "I watched it work". Section 8 is a device test script for this.
- **I can't see your git history.** I could not confirm whether `.env` was ever committed (see C3).
- **I can't see your live Supabase project.** I read the SQL files. If you changed policies in the dashboard, the deployed rules may differ from these files.
- **I can't see EAS settings.** See H8.
- `.env` was deliberately not read.

**Severity scale:** Critical means exploitable or breaks the core promise, so fix before any real user. High means likely to hurt users, data, or the thesis claims. Medium means quality, performance, or maintainability. Low means cleanup.

---

## 2. Scorecard

| Area | Status | One-line summary |
| --- | --- | --- |
| Build and types | Good | Strict TypeScript is clean. Lint has real issues but nothing blocks the build |
| Auth and profile | Works, weak validation | Login, signup and email verification flow exist. No input validation, consent or account deletion |
| Run tracking | **At risk** | GPS filtering is good. No background tracking, no crash recovery, and timing relies on a JS timer |
| XP, gems, streaks | **Not trustworthy** | Everything is client-writable, the streak depends on a local table, streak freezes do nothing |
| Quests and onboarding | Partly broken | Claim is not atomic. The 7-day onboarding arc never advances |
| Civic engine | **At risk** | Spatial consensus works on paper. Anyone can edit nodes, the consensus radius is client-controlled, and nodes never decay |
| Ani (AI coach) | Works, unguarded | Gemini key is in the bundle, replies have no memory of the chat, no safety guardrails |
| Offline-first | **Not implemented** | Marketing and docs say it is. The code has no sync queue |
| Security and RLS | **Critical gaps** | See C1 to C5 |
| Privacy and compliance | **Gaps** | No deletion, no consent, public photos, UI claims features that don't exist |
| Performance | Medium risk | Per-segment polylines, two GPS engines, 3D on the dashboard |
| Accessibility | Failing | Zero accessibility labels in the whole app |
| Tests | None | No test files, and `npm test` can't run because jest isn't installed |
| Screens with mock data | 5 screens | Calendar, guilds, shop, active-run demo, settings build id |
| Landing page vs app | **Mismatch** | The page promises things the app doesn't do yet (section 7) |

**If you only fix ten things, fix these in this order:** C1, C2, C5, C3, C6, C7, H1, H3, H5, H8.

---

## 3. What happened to the old audit findings

Legend: Fixed, Open (still true), Changed (different now, see note), Unverified.

| Old finding | Now | Notes |
| --- | --- | --- |
| 1.1 Missing `applyStreakMultiplier` import | **Fixed** | Imported in `AuthContext.tsx` |
| 1.2 Missing imports in `useSettings.ts` | **Fixed** | |
| 1.3 `database.ts` missing imports | **Fixed** | `saveGhostRun` now only writes SQLite. Cloud sync lives in `summary.tsx` |
| 2.1 Gemini key in client bundle | **Open** | Still `EXPO_PUBLIC_GEMINI_API_KEY`. See C3 |
| 2.2 `.env` in git history | **Unverified** | `.env` is in `.gitignore`. History not visible to me |
| 2.3 Civic photos public | **Open** | Bucket is `public: true`. See H5 |
| 2.4 Public OSRM demo server | **Open** | Still `router.project-osrm.org`. See M10 |
| 2.5 No auth rate limiting | **Open** | Relies on Supabase server limits only |
| 3 XP hardcoded at 150 per run | **Fixed** | Now `meters × 0.1`. The 150 award was removed |
| 3 Calories flat 60/km | **Open** | Now 62/km flat (`maps.tsx`), still ignores weight. M6 |
| 3 Steps flat 1310/km | **Open** | `statsService.ts`. M6 |
| 3 Day 7 requires 2 km (spec says 1 km) | **Open** | `onboarding.ts` |
| 3 Gemini model | **Changed** | Now one constant, `gemini-2.5-flash`. Good fix. README spec is outdated |
| 3 Zustand not used | **Open** | Context only. Fine for now, see M8 |
| 3 SQLite schema differs from spec | **Open** | Only `ghost_runs` and `daily_missions` |
| 3 Seasonal gem cap not enforced | **Open** | Constant exists, unused |
| 4 Missing features list | **Mostly open** | Re-checked in section 6 |
| 5.1 One Polyline per GPS segment | **Open** | `maps.tsx` ~line 479 |
| 5.2 GPS always on in dashboard | **Open** | Dashboard still mounts `useLocationEngine` |
| 5.3 MapView inside ScrollView | **Open** | `dashboard.tsx` |
| 5.4 FlatList inside ScrollView | **Open** | `progress.tsx` |
| 5.5 No AI response caching | **Open** | |
| 6 `useMotionShield` timeout leak | **Fixed** | Timeout is stored and cleared |
| 6 No AbortController in ai_coach | **Open** | |
| 6 `fetchWeather` has no cleanup | **Open** | |
| 7.1 Duplicate `haversine` | **Open** | Now 5 copies (3 services, `useLocationEngine`, `maps.tsx`) |
| 7.2 Two ghost systems | **Changed** | `maps.tsx` converts adaptive waypoints so the legacy replayer works. Works, but fragile. L5 |
| 7.3 Screens bypass `useQuestEngine` | **Open** | Dashboard and quests call `QuestEngine` directly |
| 7.5 `any` everywhere | **Open** | 90 occurrences |
| 7.6 Edit Profile modal never rendered | **Fixed** | Modal is rendered and has a save handler |
| 7.6 `QuestGenerator.ts`, `AvatarView.tsx` dead | **Open** | Unused or empty |
| 7.6 `active-run.tsx` hardcoded demo | **Open** | M7 |
| 8.1 Missing Expo plugins | **Fixed** | location, sensors, image-picker, task-manager all present |
| 8.2 Missing permissions | **Fixed** | `ACTIVITY_RECOGNITION` and `NSMotionUsageDescription` added |
| 8.3 Stale Firebase refs | **Fixed** | Gone from `tsconfig.json` and `.env.example` |
| 8.4 Missing scripts | **Changed** | `test` and `type-check` exist now, but jest isn't installed. M12 |
| 8.5 ngrok in dependencies | **Fixed** | Now in devDependencies |
| 8.6 React Compiler experiment | **Changed** | Not enabled in `app.config.js`, but the compiler lint rules still run and report issues. 4.12 |
| 9 Zero accessibility labels | **Open** | Still zero |
| 10 Zero tests | **Open** | |
| 12.1 Streak sort bug | **Fixed** | Sorted. But the streak has a bigger problem now, see H1 |
| 12.2 Claim without completion check | **Fixed** | Checks `current_value >= target_value`. Still not atomic, see H2 |
| 12.3 Civic decay client-side | **Changed, worse** | `applyDecay()` is never called by anything, so decay never runs. C8 |
| 12.4 `Promise.all` in `syncRunToMissions` | **Open** | |
| 12.5 No pagination on missions | **Open** | |
| 13 Calendar personal names and "February" | **Open** | Still there |
| 13 Settings random build id | **Open** | |
| 13 Shop and guilds mocked | **Open** | |

---

## 4. Findings

Each finding says where it is, what goes wrong, and the fix. Anything marked *(device-test)* I'm confident about from the code but you should confirm on a phone.

### Critical

**C1. The whole economy can be forged by any logged-in user.**
`supabase/schema.sql`
- The `profiles` update policy has no column limits and no `WITH CHECK`. `set_stats` accepts any JSON. `increment_stats` accepts any number, including huge or negative values. The `missions` table policy is `for all`, so users can edit their own `xp_reward`, `current_value` and `status`.
- Anyone with the app, which ships the anon key, can sign in and set their own XP, gems, level, streak, `is_verified` and the Vanguard flag. That makes leaderboards, guilds and the "civic contribution" data meaningless.
- **Fix:** Stop letting clients write stats directly. Revoke direct `update` on `profiles.stats`, `is_verified` and `missions` reward fields. Move awards into `SECURITY DEFINER` functions that compute the reward on the server (for example `claim_mission(id)` and `finish_run(...)`), with limits on every input.

**C2. Anyone can edit or "verify" any civic node.**
`supabase/03_civic_engine.sql`
- The policy "System can update nodes" is `FOR UPDATE USING (true)`, applied to every role. Anyone holding the anon key can change a node's status, location or category, with no login.
- This breaks the thesis claim that verification needs 3 independent people.
- **Fix:** Drop that policy so only the `SECURITY DEFINER` functions can update nodes. Also add `REVOKE EXECUTE ... FROM public` on `apply_temporal_decay` and `check_spatial_consensus`, and grant them only where needed.

**C3. The Gemini and weather keys ship inside the app, and the keys may be in git history.**
`services/ai/aiService.ts`, `app/drawer/ai_coach.tsx`, `app/drawer/dashboard.tsx`
- `EXPO_PUBLIC_*` values are readable by anyone who unpacks the APK. Anyone can run up your Gemini bill or exhaust the quota.
- **Fix:** Put Gemini behind a Supabase Edge Function that holds the key, checks the user's login, and rate-limits. Same for the weather key.
- **Check now:** run `git log --all --full-history -- .env`. If it prints anything, rotate every key in that file. Rotate the Gemini key anyway if the APK was ever shared.

**C4. Rewards can be farmed from the civic system.**
`supabase/03_civic_engine.sql`, `app/drawer/maps.tsx`
- `submit_civic_report` takes `p_epsilon_meters` from the client and passes it into the consensus check. A client can send a huge radius and make "3 unique reporters" much easier.
- The location is whatever the phone says, with no check that the user is actually there. No photo is required (the app still submits if the upload fails). A duplicate check only blocks the same spot on the same day, so spreading reports out or returning daily earns repeatedly.
- The app awards +50 XP and +5 gems for every pending report before anyone has verified it.
- Several accounts can corroborate each other with no real-world check.
- **Fix:** Ignore the client epsilon (use the constant). Require a photo for a report. Cap reports per user per day. Pay XP only after verification, or pay a small amount only when a photo exists. Consider a minimum account age and a distance-from-recent-GPS check.

**C5. Anyone can award themselves XP with a link.**
`app/summary.tsx`, `app/drawer/maps.tsx`
- The summary screen reads `meters`, `seconds`, `kcal`, `xp` and `path` from the URL and then writes them to the account. Your app registers the `karela://` scheme, so a link like `karela://summary?meters=999999&xp=99999` should open that screen with those values *(device-test)*. Pressing "Return to Base" would then award it.
- **Fix:** Don't pass results through the URL. Save the finished run locally (an id), and have the summary screen load it by id. Better, let the server recompute XP from the saved distance and duration.

**C6. Runs stop when the screen locks, but the app says they don't.**
`hooks/useLocationEngine.ts`, `services/PermissionsManager.ts`, `app.config.js`
- The app asks for "Always" location and declares background modes, but nothing uses them. There is no `startLocationUpdatesAsync` and no `TaskManager.defineTask`. Tracking uses `watchPositionAsync`, which is foreground only.
- The elapsed time in `maps.tsx` is a `setInterval` counter that pauses when the app is backgrounded, so duration is undercounted and average speed is inflated.
- The lock-screen widget in `notificationService.ts` is never called anywhere.
- Result: a runner who locks their phone gets a gap in distance and a wrong time. This is a core-product failure.
- **Fix:** Use a background location task with a foreground service on Android. Derive duration from GPS timestamps (end minus start), not a counter.

**C7. A run is lost if the app is killed, and "offline-first" isn't real.**
`app/drawer/maps.tsx`, `app/summary.tsx`, `services/database/sqlite/database.ts`
- The run path lives only in React state. If the app crashes, is killed by Android's memory manager, or the battery dies, the whole run is gone.
- A run is written to SQLite only if the user taps "Record as Ghost". "Return to Base" sends several Supabase calls one after another with no queue and no retry. Offline, you get "Sync Failed" and nothing is saved.
- If the sequence fails halfway (for example after distance is added but before the history is logged), tapping again adds the distance twice. The finalize step isn't idempotent.
- The docs and the website say every event carries a UUID and syncs later. The code has no UUIDs and no sync queue.
- **Fix:** Write the run to SQLite incrementally while it's happening (with a UUID). Add an outbox table that retries. Make the server calls idempotent by using the run UUID as the key.

**C8. Civic nodes never decay.**
`services/engines/CivicEngine.ts`, `supabase/03_civic_engine.sql`
- `applyDecay()` is never called by anything and there is no scheduled job. Verified nodes stay verified forever, and unverified ones never expire. The map fills with stale reports.
- **Fix:** a Supabase scheduled job (`pg_cron`) that runs `apply_temporal_decay()` hourly.

### High

**H1. The streak is computed from the wrong place, and streak freezes do nothing.**
`services/statsService.ts`, `context/AuthContext.tsx`
- `calculateStreak()` reads the local SQLite `ghost_runs` table, which only has runs where the user tapped "Record as Ghost". Runs that weren't saved as a ghost don't count. A reinstall or a new phone resets the streak to 0.
- `streak_freeze_count` is bought for 80 gems but is never read anywhere, so streak freezes don't protect anything. Players spend gems for nothing.
- `useStreakFreeze` checks the gem balance from the local profile, which can be stale, so the balance can go negative. The function is also named like a React hook, which is confusing.
- **Fix:** Compute the streak from `run_history` on the server. Make freeze purchase a server function that checks the balance and is actually used when a day is missed.

**H2. Claiming a quest isn't atomic, and the XP amount comes from the client.**
`services/engines/QuestEngine.ts` (`claimQuest`)
- It reads the mission, marks it claimed, then adds XP in separate calls. Double tap or two devices can award twice. The XP comes from the `xpReward` argument, not the database row.
- The AI-written quest's `rewardXP` goes in unvalidated (`aiQuest.rewardXP || scaleXP(...)`), so a bad model reply could set a huge reward.
- **Fix:** One server function: `update missions set status='claimed' where id=... and status='active' and current_value >= target_value returning xp_reward`, then award from the returned value. Clamp AI rewards to a range.

**H3. The 7-day onboarding arc never advances.**
`services/onboarding.ts`, `services/engines/QuestEngine.ts`
- `completeOnboardingDay()` is never called, so `onboarding_day_completed` stays 0 and a new "Day 1" quest is assigned every day, forever. The `gem_reward` values in the arc are never paid out.
- The onboarding date key uses UTC (`toISOString`) while quests use local time, so the "day" flips at 8 AM Philippine time for onboarding. Day 7 asks for 2 km but the spec says 1 km.
- **Fix:** Call `completeOnboardingDay` and grant its gems when an onboarding mission is claimed. Use the same local-date helper everywhere.

**H4. It's easy to cheat distance, and gem rewards don't match the design.**
`app/drawer/maps.tsx`, `hooks/useLocationEngine.ts`, `app/summary.tsx`
- Scoring uses `physicalMeters` in `maps.tsx`, which does not use the pedometer ("motion shield"). The motion check only affects an unused counter (`totalDistance`). So the anti-GPS-cheating message in the app is not enforced.
- The vehicle cutoff is 35 km/h, so a bicycle, a tricycle, or a jeepney in traffic (typical 15 to 30 km/h) counts as running and earns XP.
- Gems are paid 5 per 500 m for every run, but the design says only for sectors where you beat the ghost. `sectors` is passed as an empty array.
- **Fix:** Require steps in step with distance (cadence plausibility), lower or smarter vehicle detection, and award sector gems only for sectors actually won.

**H5. Civic photos are public and uploads are unlimited.**
`supabase/04_civic_fixes_and_storage.sql`, `services/engines/CivicEngine.ts`
- The bucket is `public: true` with a public read policy, and the app uses `getPublicUrl`. Photos taken on the street can show faces and licence plates and are readable by anyone with the link.
- Any logged-in user can upload any number of files of any size or type, anywhere in the bucket (the upload policy doesn't check the folder is the user's own).
- **Fix:** Make the bucket private, use short-lived signed URLs, limit uploads to `{user_id}/…` paths, and set file size and type limits.

**H6. Every user can read every other user's reports, including who and where.**
`supabase/03_civic_engine.sql`
- `civic_reports` is readable by all logged-in users, including `user_id`, exact location and photo. `civic_nodes.created_by` is also exposed. For categories like `unsafe_area` this lets someone track a person's reporting pattern.
- **Fix:** Let users read only their own reports. Expose nodes through a view or function that leaves out `created_by` and `user_id`.

**H7. No account deletion, and the UI shows privacy features that don't exist.**
`app/drawer/profile.tsx`, `supabase/03_civic_engine.sql`
- There is no delete-account flow anywhere, which the Data Privacy Act (RA 10173) expects. A database detail also blocks it: `civic_nodes.created_by` references `auth.users` without `ON DELETE`, so deleting a user who created nodes fails.
- The Profile screen shows "Privacy Zones: 0 zones active, GPS masked near home/office" and "Quiet hours: 10 PM to 7 AM". Both rows do nothing, and neither feature exists. A privacy statement that isn't true is worse than no statement.
- **Fix:** Add a delete-account Edge Function (profile, missions, runs, reports, and storage objects), change the foreign key to `ON DELETE SET NULL`, and either build Privacy Zones or remove those two rows.

**H8. A production build will probably crash on launch.**
`services/database/supabase/config.ts`, `eas.json`, `.gitignore`
- `config.ts` deliberately throws when the Supabase variables are missing. `.env` is gitignored, and EAS cloud builds don't see it. Unless the variables are set in EAS, the release app fails at startup. `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is read by `app.config.js` but isn't in `.env.example`, so the map would be blank on a release build.
- **Fix:** Set the variables with EAS environment variables, add the Maps key to `.env.example`, and do one `preview` build and launch it *(device-test)*.

**H9. Signup collects health data with no checks, consent, or age gate.**
`app/auth/signup.tsx`
- Weight, height and age are `parseFloat`ed with no range or NaN checks. Letters give NaN in the BMI, and a height of 0 gives Infinity. There is no email format check, no username rules, and the only password rule is Supabase's minimum of 6.
- There is no terms or privacy-policy acceptance and no minimum age. Weight and age are sensitive personal information.
- **Fix:** Validate ranges (for example age 13+ or 18+ depending on your policy, height 100 to 250, weight 25 to 300), require consent with a link to the policy, and raise the password minimum.

**H10. Ani is stateless and has no safety rules.**
`app/drawer/ai_coach.tsx`, `services/ai/aiService.ts`
- Each message is sent alone, with no previous turns, so Ani forgets what you said a moment ago. The chat isn't saved when you leave the screen.
- The prompt has no medical guardrails (the spec says she doesn't diagnose), nothing about stopping when someone reports pain or dizziness, and nothing about heat or storm safety. User text and the saved notes (`ai_notes`) go straight into the prompt.
- There is no rate limit or abort. The quest generator trusts the model's JSON.
- **Fix:** Send recent turns, add a system prompt with safety rules, validate the quest JSON, and move calls server-side with limits (see C3).

**H12. Developer tools are in the real Settings screen.**
`app/drawer/settings.tsx`, `hooks/useSettings.ts`
- "Inject fake data" adds 3,500 XP and 66 km, drops the local `ghost_runs` and `daily_missions` tables, and "Reset data" wipes progress. Both are visible to every user in a release build.
- **Fix:** show them only when `__DEV__` is true.

**H11. The website says things the app doesn't do yet.** See section 7.

### Medium

**M1. Two GPS engines.** `dashboard.tsx` and `maps.tsx` each start their own `useLocationEngine`. The dashboard tracks GPS the whole time it is open and also requests permissions. Wasteful for battery.

**M2. Performance on low-end Android.** One `<Polyline>` per GPS segment (`maps.tsx`), `MapView` inside a `ScrollView` (`dashboard.tsx`), `FlatList` inside a `ScrollView` (`progress.tsx`), and a 3D `Canvas` on the main dashboard (`AniModel`). The run path is also passed in the URL as JSON, which can be very large for long runs and can fail on Android.

**M3. Time zones.** `dashboard.tsx` and `onboarding.ts` use UTC dates; `QuestEngine` uses local dates. Between midnight and 8 AM in the Philippines they disagree, so quest generation can be attempted again on every app start.

**M4. Speed quests aren't speed quests.** `QuestEngine.ts` creates a "speed" quest that is tracked by distance, and `syncRunProgress` receives `avgSpeedKmh` but never uses it.

**M5. Adaptive features run on empty input.** `decayModel: null` is passed to the quest engine in three places (TODOs), and `maps.tsx` always sends `isGhostAhead: false` and no decay model to Resonance. So difficulty scaling and Resonance don't use the thesis models in real runs yet.

**M6. Stats are approximations presented as measurements.** Calories at 62 per km regardless of weight, steps at 1,310 per km, and "Ghost wins" is just the number of saved runs (`statsService.ts`).

**M7. Placeholder screens.** Calendar (hardcoded "February", and "Sander's Airpods Pro 2" and a name in the text), Guilds (`MOCK_GUILDS`, the submit button only `console.log`s), Shop (`MOCK_ITEMS`, the BUY button does nothing), Active-run (fixed coordinates), Settings build id (changes on every render).

**M8. Concurrency and robustness.**
- XP level-up (`normalizeXP`) is protected by a lock on one device only; two devices can both apply it.
- Default stats capture a date once at import time.
- `Promise.all` in `syncRunToMissions`, and no limit on `getMissions`.
- Profile load errors are only logged, so a failed load leaves the user signed in with no profile.
- The auth listener reloads the profile and re-subscribes on every token refresh.

**M9. Accessibility.** There are zero `accessibilityLabel` or `accessibilityRole` props in `app/` and `components/`. Ghost ahead/behind and civic status are color only. Login and signup fields use placeholders as the only label.

**M10. Routing service.** The free OSRM demo server is "for testing only". Also `routingService.ts` computes XP as `distance / 20` and "coins", which doesn't match the XP and gem rules (check whether this path is used before relying on it).

**M11. Auth hardening.** No client-side throttling on sign-in or verification emails. The weather city is hardcoded to "Tuguegarao".

**M12. Tests and tooling.** No test files exist and `jest` isn't installed, so `npm test` fails. No CI, no error monitoring (Sentry or similar), no formatter.

**M13. Config to confirm.**
- The bundle id and package name is `com.worshestershire.karela`, which looks like a typo. It can't be changed after you publish, so check it now.
- `react-native-wagmi-charts` (a financial chart library) and `react-native-worklets` are used or declared. Confirm both are needed.
- The three.js stack adds weight to the bundle.

**M14. Reconfirming a civic node has no limit.** `reconfirm_civic_node` doesn't check you're near the node or limit how often you can do it, so nodes can be kept alive indefinitely.

### Low

- **L1.** Unused code: `QuestGenerator.ts` (deprecated), empty `AvatarView.tsx`, `NotificationService` (never called), `seedTestData`, unused constants in `QuestEngine.ts` and `ResonanceSystem.ts`, unused vars in `PermissionsManager.ts`, `routingService.ts`, `dashboardStyle.ts`, `useLocationEngine.ts`.
- **L2.** 17 `console.log` calls and 90 uses of `any`.
- **L3.** Five copies of the haversine distance function.
- **L4.** Random channel names via `Math.random` (works, but unusual).
- **L5.** Legacy `GhostEngine` and the adaptive ghost both exist. It works today only because `maps.tsx` converts one format into the other.
- **L6.** The ghost replays from its recorded start, whether or not you start the run in the same place.
- **L7.** Emoji in alert titles.

### 4.12 Lint details (all 51)

Errors (4): `hooks/useQuestEngine.ts` lines 65, 127, 144, 152: React Compiler can't preserve the manual memoization.

Warnings by rule:
- `react-hooks/refs` ×22, all in `app/index.tsx` (reading refs during render).
- `react-hooks/set-state-in-effect` ×9: `dashboard.tsx:137`, `maps.tsx:104,225`, `profile.tsx:44`, `quests.tsx:67,99`, `RunHistory.tsx:38`, `useLocationEngine.ts:72`, `useQuestEngine.ts:97`.
- `react-hooks/purity` ×4: `ai_coach.tsx:109,143`, `settings.tsx:110` (the random build id), `Screen.tsx:45`.
- `react-hooks/immutability` ×1: `AniConsole.tsx:37`.
- `@typescript-eslint/no-unused-vars` ×11 (see L1).

---

## 5. What is working

- **Strict TypeScript compiles clean** across the whole app.
- **The July crash bugs are fixed.** Missing imports are in, and XP awards no longer double-count (the duplicate sync in `saveGhostRun` was removed and documented).
- **Auth flow:** signup with a profile created by a database trigger, email verification message on login, session persisted, route guard (`AuthGate`).
- **Row-level security is switched on for every table**, and each function that changes data checks `auth.uid()` against the caller.
- **Atomic stat increments** (`increment_stats`) instead of read-modify-write, with a lock to stop duplicate level-ups on one device.
- **GPS pipeline is good:** Kalman smoothing, a 50 m display gate and a 20 m recording gate, jump and speed rejection, GPS timestamps, heading fusion. The subscription is cleaned up properly.
- **Civic engine design:** PostGIS tables and a spatial index, a 3-reporter consensus function (unique users, 25 m, 72 h), category-specific decay rates, node lifecycle, live camera only (gallery disabled), duplicate-report guard.
- **Streak multiplier tiers** match the spec exactly (1.0, 1.2, 1.5, 2.0, 3.0).
- **Quests:** daily, weekly and monthly generation, expiry, claim validation, civic progress sync.
- **Gemini model name in one place**, so a shutdown can't silently break three files again.
- **Config:** all needed Expo plugins and permissions are present, Firebase leftovers are gone, `.env` is gitignored, `.env.example` exists, the Supabase client fails with a clear message when misconfigured.
- **Design system** is centralized in `styles/designSystem.ts`.
- **Edit Profile** is wired and rendered.

---

## 6. Spec features still not built (checked by search)

Not found anywhere in the code: Collective Shield, Territory quests (only mentioned in text), Indoor mode, stride calibration, anti-cheat integrity filter beyond speed, Quiet hours (UI text only), Privacy Zones (UI text only), Bayanihan safety tiers 1 to 4 (only a 1.5× buff parameter in `calculateCivicScore`, never turned on), exportable civic reports, LGU admin panel, B2B quest nodes, Scout Pass, account deletion, i18n, error monitoring, weekly and streak-at-risk notifications, Ani weekly plan.

Partly built: Vanguard roles (decided by stamina in `ResonanceSystem`, not a reviewer system), notifications (a widget exists but is never called), guilds (mock only).

**Why this matters now:** the landing page describes the Bayanihan safety tiers as the app's most important rule ("Karela must never be the reason someone gets hurt"). The app doesn't implement it yet.

---

## 7. Landing page claims vs the app

The page was written from the project spec. These statements are **not yet true in the app**, so either build the feature or soften the copy before launch:

| Page says (in `website-v2/index.html`) | Reality |
| --- | --- |
| "Tracking runs offline in SQLite and syncs to Supabase when you're back online. Every event carries a UUID, so syncing twice never double-counts." | No sync queue and no UUIDs (C7) |
| "Up to five 100 m Privacy Zones are never stored, even locally" | Privacy Zones don't exist (H7) |
| "Account deletion completes within 72 hours" | No account deletion (H7) |
| Civic reports "expire when they go stale" | Decay is never run (C8 below) |
| "Local first" / "Yes: SQLite first, low memory, batched sync" | See C7. Batched sync is unverified |
| Safety tiers 0 to 4 and the "storm" rule | Not implemented (section 6) |
| "Raw GPS stays on your phone and is never uploaded as a full trail" | **True today**: only totals and civic report points are uploaded |

I have not changed the page. Tell me whether you want the copy softened to "planned" language until the features exist.

---

## 8. Device test script (things only a phone can confirm)

Mark each after testing on a real Android phone (mid-range) and, if you can, an iPhone.

**Launch and auth**
- [ ] Fresh install opens to the intro slides, then signup works.
- [ ] Bad input on signup (letters in weight, height 0) is rejected. *(Expected to fail today: H9)*
- [ ] Unverified email shows the verification message on login.
- [ ] Log out and back in restores the profile.
- [ ] A `preview` EAS build launches and shows the map. *(H8)*

**Run tracking**
- [ ] Start a run outdoors, walk 500 m: distance is within 5% of a known route.
- [ ] Lock the screen for 2 minutes mid-run. Does the path have a gap? Is the time right? *(Expected to fail: C6)*
- [ ] Force-close the app mid-run, reopen: is anything recoverable? *(Expected: no, C7)*
- [ ] Ride a bicycle or take a jeepney at 20 km/h: does it count as running? *(Expected: yes, H4)*
- [ ] Walk slowly (about 3 km/h): distance still counts.
- [ ] Turn on airplane mode, finish a run, tap Return to Base. *(Expected: sync failure, C7)*
- [ ] Tap Return to Base twice quickly, and after a forced failure: is distance doubled? *(C7)*

**Rewards**
- [ ] Open `karela://summary?meters=99999&seconds=60&kcal=1&xp=99999` from a link: does the screen open and award on tap? *(C5)*
- [ ] Buy a streak freeze, then skip a day: is the streak protected? *(Expected: no, H1)*
- [ ] Complete Day 1 onboarding, claim it, wait a day: is Day 2 assigned? *(Expected: another Day 1, H3)*
- [ ] Double-tap Claim on a finished quest: is XP awarded once? *(H2)*
- [ ] Run a streak across midnight, and at 6 AM local time. *(M3)*

**Civic**
- [ ] Report with the camera: photo uploads and the report appears for a second account.
- [ ] Open a photo URL while logged out. *(Expected: opens, H5)*
- [ ] Three accounts report the same spot: node becomes verified, and the third account gets the verified reward.
- [ ] Submit a report with the photo upload disabled (airplane mode on and off). *(C4)*
- [ ] Leave the app for a week: do old nodes disappear? *(Expected: no, C8)*

**Ani and settings**
- [ ] Ask Ani two questions in a row where the second depends on the first. *(Expected: she forgets, H10)*
- [ ] Tell Ani your knee hurts. Is the answer safe?
- [ ] Settings screen: "Inject fake data" and "Reset data" are visible in a release build. *(Expected: yes, H12)* Gate them with `__DEV__`.

**Quality**
- [ ] A 30-minute run stays smooth on the map and doesn't heat the phone. *(M2)*
- [ ] TalkBack can read the login screen. *(Expected: poorly, M9)*

---

## 9. Suggested order of work

**This week: stop the bleeding**
1. C2: drop the open `civic_nodes` update policy (a 5-minute SQL fix).
2. C1: lock down `profiles` and `missions` writes, and move awards into server functions.
3. C5: stop passing results through the URL.
4. C3: rotate keys if needed and move Gemini behind an Edge Function.
5. H12: gate the Inject and Reset buttons with `__DEV__`.

**Next: make runs reliable**
6. C6 and C7: background location, SQLite-first runs with UUIDs, an outbox with retry, and timestamp-based duration.
7. H1: server-side streaks, and make freezes work.
8. H3 and H2: onboarding completion, atomic claims.
9. C8: schedule decay.

**Before any pilot with real people**
10. H5, H6, H7: private photos, limited report visibility, account deletion.
11. H9: signup validation and consent, and a privacy policy page (also needed on the website).
12. H8: EAS environment variables and a test build.
13. C4, H4: anti-abuse for civic rewards and distance.
14. Fix the page copy (section 7), or build the features.

**Then quality**
15. Tests for `streakMultiplier`, `GpsKalmanFilter`, the decay model, and the SQL functions. Add jest.
16. Accessibility labels, performance fixes (M2), lint cleanup, remove dead code.

---

## 10. How to re-run these checks

```bash
npm install --legacy-peer-deps
npm run type-check        # should print nothing
npx eslint .              # currently 51 findings
npx expo-doctor           # needs internet
git log --all --full-history -- .env    # should print nothing
```
