# Karela Project Audit & Checklist

> Generated: June 25, 2026
> Scope: Full comparison of README v3.1 spec vs. actual codebase implementation

---

## ✅ Completed

- **✅ All API keys configured and working.** Gemini (Ani chat + quest gen), Supabase, OpenWeatherMap all connected via `.env`. No more hardcoded keys anywhere in the codebase.
- **`package.json` broken `"undefined"` entry removed.** (was Issue #3)
- **`tsconfig.json` invalid `ignoreDeprecations` removed.**
- **Expo SDK downgraded 56 → 54** to match the App Store Expo Go.
- **`AuthContext` `needsPatch` bug fixed** — dead-code stat checks now part of the condition. (was Issue #17)
- **Removed worst debug `console.log`** in dashboard. (was Issue #16, partial)
- **✅ SUPABASE MIGRATION COMPLETE (Phase 1).** Auth, profiles, missions, run summaries, run history all moved from Firebase → Supabase. Firebase removed from all app code; orphaned Firebase service files deleted. (was Issue #2 / #20)
  - Schema: `supabase/schema.sql` + `supabase/02_realtime_and_history.sql`
  - Services: `supabase/{config,auth,profiles,missions,runService,userData}.ts`
  - JSONB `stats` column + atomic `increment_stats`/`set_stats` RPCs preserve the app's `profile.stats.*` pattern.
  - Realtime subscriptions replace Firestore `onSnapshot`. Fixed channel-name collisions for multi-screen subscriptions.
  - **Still TODO in migration:** remove `firebase` package from `package.json` (kept installed for now; `aiService.ts` Gemini wrapper still lives in the `firebase/` folder but doesn't use the Firebase SDK). Civic engine tables (PostGIS) are Phase 2.

---

## 🔴 Critical Issues (Fix Now)

### 1. API Keys Hardcoded in Source Code ✅ DONE
- **File:** `services/database/firebase/config.ts`
- **Issue:** Firebase config (apiKey, projectId, appId, etc.) is hardcoded directly in the file and committed to git.
- **File:** `services/database/firebase/aiService.ts`
- **Issue:** Gemini API key is hardcoded as a fallback: `"AIzaSyD7993y1VEE1FWEADoY9_9rsdWDHYe68Cc"`. This is a **leaked secret** in version control.
- **Why it matters:** Anyone with repo access (or if this goes public) gets free access to your Firebase project and Gemini quota. Bots scrape GitHub for exactly this.
- **Fix:** Move ALL keys to `.env` files. Remove hardcoded fallbacks. Rotate the Gemini key immediately — it's already compromised if this repo is shared.

### 2. README Claims Supabase — Code Uses Firebase
- **README says:** "Supabase (PostgreSQL + PostGIS)" is the cloud backend, with RLS policies, Edge Functions, PostGIS spatial queries, and Realtime CDC channels.
- **Reality:** The entire codebase uses **Firebase** (Firestore + Firebase Auth). There is zero Supabase code anywhere.
- **Why it matters:** This is the single largest disconnect. The README's architecture (PostGIS spatial clustering, RLS policies, Edge Functions for sync reconciliation) is fundamentally different from what's built. Anyone reading the README (thesis panel, investors, collaborators) will expect Supabase.
- **Decision needed:** Either migrate to Supabase (significant effort) or rewrite the README to reflect Firebase. Given the thesis claims about PostGIS-powered DBSCAN, a migration may be necessary for academic integrity.

### 3. Broken package.json Entry
- **Line:** `"undefined": "@react-three/drei\\"` exists at the bottom of `dependencies`.
- **Why it matters:** This is a malformed/corrupted entry that could cause install failures on clean machines. Likely from a bad copy-paste.
- **Fix:** Remove this line.

---

## 🟠 Significant Gaps (README vs. Reality)

### 4. Ghost System — Static PB Only, No Adaptive Decay
- **README claims:** Effort Decay Function (`P(t) = P_baseline × e^(−λ × max(0, t − t_fatigue))`), Rolling Aggregation (4-week weighted average), Reinforcement-Style Calibration.
- **Reality:** `GhostEngine.ts` is a simple linear interpolation replay of the user's last saved run. There is no decay modeling, no rolling aggregation, no adaptive calibration, no per-user λ or t_fatigue computation.
- **Status:** The Ghost is a static PB replay — exactly what the README says Karela replaces.

### 5. Civic Engine — Does Not Exist
- **README claims:** Full civic reporting system, DBSCAN-inspired spatial consensus, temporal decay logic, PoI submissions, Vanguard review system.
- **Reality:** Zero civic engine code exists. No civic_nodes table, no spatial clustering, no report submission UI, no Vanguard system.
- **Status:** Entirely unimplemented.

### 6. Resonance System — Does Not Exist
- **README claims:** Stamina-aware civic load modulation that gates civic prompts based on fatigue state.
- **Reality:** No code for this. The fusion layer between fitness and civic engines doesn't exist because neither the adaptive fitness engine nor the civic engine exist in their described forms.

### 7. Bayanihan Protocol — Does Not Exist
- **README claims:** 5-tier safety system, preparation/recovery quests, PAGASA integration, Node Master QR, Proof of Impact verification.
- **Reality:** None of this is implemented. No safety tiers, no disaster quests, no QR scanning.

### 8. Squads & Guilds — Do Not Exist
- **README claims:** Squad formation (3-12 members), Collective Shield mechanic, Guild territory quests (50+ members), landmark claiming.
- **Reality:** No social infrastructure code. No squads table, no guild system, no territory mechanics.

### 9. Offline-First Architecture — Partially Implemented
- **README claims:** "Local-First, Cloud-Sync" with SQLite as primary store, Supabase sync with conflict resolution, UUID-based idempotency.
- **Reality:** SQLite exists for ghost runs and daily missions. But the primary data flow goes directly to Firebase Firestore (online-dependent). The "offline-first" claim is overstated — if connectivity drops during quest generation or XP updates, those operations fail.
- **Partially working:** Ghost run data is saved locally. Daily missions cache locally.

### 10. Sensor Fusion & Anti-Cheat — Minimal
- **README claims:** GPS + Accelerometer dual-lock, phone-shaking detection (>4G), vehicle detection (>25 km/h sustained), teleportation detection, indoor mode with stride calibration.
- **Reality:** `useMotionShield.ts` uses only the Pedometer API (step detection). The location engine has basic vehicle detection (speed > 35 km/h flags segments as "vehicle") and teleportation filtering (>100m jumps discarded), but there's no accelerometer frequency analysis, no G-force shake detection, no indoor stride calibration mode.

### 11. Ani AI Coach — Basic Implementation
- **README claims:** Body-aware coaching, context-aware greetings (time/weather/streak), weekly fitness plans, post-mission recaps, behavioral adaptation over time.
- **Reality:** `aiService.ts` has two functions: `summarizeRunForAI` (post-run summary) and `generateAniQuest` (quest generation). The quest generator does use profile stats (age, weight, level, ai_notes) which is good. But there's no weekly plan generation, no behavioral adaptation logic, no session-start greeting system. The AI coach screen exists but its depth is limited.

### 12. RPG Economy — Partially Implemented
- **README claims:** XP (1 XP/10m), Gems (sector bonuses, B2B scans, Vanguard reviews), Streak Multiplier (1.0x-3.0x), Streak Freezes, Squad Shields, seasonal Gem cap, cosmetic shop.
- **Reality:** XP and levels exist (1000 XP per level). Streak tracking exists. Gems do NOT exist in the user profile or economy. No streak multiplier logic. No streak freezes. No shop. No sector bonus system.

### 13. Onboarding 7-Day Arc — Does Not Exist
- **README claims:** Structured 7-day quest progression, fitness calibration, guided quest arc from Day 1-7.
- **Reality:** The app goes Login → Dashboard. There's a character creation screen but no structured onboarding flow, no calibration assessment, no guided 7-day arc.

---

## 🟡 Code Quality Issues

### 14. `active-run.tsx` is a Static Mockup
- The file in `app/homepage/active-run.tsx` uses hardcoded coordinates, hardcoded "4.20 km", hardcoded "142 BPM", and a hardcoded coaching message. It's a UI prototype, not a functional screen.
- The real run tracking happens in `app/drawer/maps.tsx`.

### 15. Duplicate Marker Rendering
- In `maps.tsx`, the custom user location dot marker is rendered twice — once inside the MapView and once outside it (around line 350 and again floating). The second one won't work outside MapView context.

### 16. Console.log Statements in Production Code
- `dashboard.tsx` has: `console.log("DEBUG PROFILE STATS:", ...)`
- Multiple files have debug logging that should be removed or gated behind a dev flag.

### 17. AuthContext Patch Logic Has Dead Code
- In `AuthContext.tsx`, the `needsPatch` variable has disconnected boolean expressions (lines that evaluate but don't contribute to the `needsPatch` value because they use `;` instead of `||`):
  ```typescript
  data.stats?.ai_notes === undefined;  // This is a standalone expression, not part of needsPatch
  data.stats?.last_weekly_reset === undefined || ...  // Same issue
  ```

### 18. No State Management Library in Use
- **README claims:** Zustand for global state.
- **Reality:** State is managed via React Context (`AuthContext`). Zustand is listed in `package.json` (via node_modules) but never imported or used in any file.

### 19. No TypeScript Strictness
- No `strict: true` in tsconfig (not verified but implied by loosely typed code).
- Extensive use of `any` type throughout: `useState<any[]>`, function parameters typed as `any`.
- This will bite hard as the project scales.

---

## 🟡 Architecture & Scalability Concerns

### 20. Firebase vs. Supabase Decision
- If the thesis requires PostGIS spatial queries (DBSCAN clustering), Firebase/Firestore cannot do this. Firestore has no spatial indexing, no SQL, no server-side clustering.
- **If the thesis claims are real requirements**, a migration to Supabase is mandatory.
- **If the thesis can be scoped down**, Firebase can work for the fitness side but not the civic engine as described.

### 21. No Navigation Guard / Auth Protection
- The drawer layout doesn't check if the user is authenticated. A user could theoretically navigate to protected screens without login.
- The root `_layout.tsx` wraps everything in `AuthProvider` but there's no route protection logic redirecting unauthenticated users.

### 22. Quest Generation Happens on Dashboard Focus
- Every time the dashboard gains focus (`isFocused` changes), it triggers `triggerDailyReset()` which calls the Gemini API. If the user navigates away and back, it re-checks. This is fine for daily quests but could lead to unnecessary API calls if the date check fails or on clock edge cases.

### 23. No Error Boundaries
- No React error boundaries anywhere. A crash in any component (e.g., a Gemini API timeout) could white-screen the entire app.

### 24. No Testing Infrastructure
- Zero test files. No jest config. No test runner setup.
- For a thesis project claiming algorithmic contributions (Effort Decay Function, Spatial Consensus), the absence of unit tests for these algorithms is a significant weakness.

---

## 🟢 What's Working / Done Well

### 25. GPS Tracking & Ghost Replay
- The location engine (`useLocationEngine.ts`) is solid for a prototype: haversine distance, jitter filtering, teleport detection, vehicle speed flagging, compass integration.
- Ghost replay with linear interpolation works correctly.
- Path smoothing is implemented.

### 26. Dark Theme & UI Polish
- The UI is cohesive, well-themed (dark mode with #7CF205 accent), and has good visual hierarchy.
- Map integration with custom dark styling works.
- Dashboard layout is clean and information-dense.

### 27. SQLite + Firebase Hybrid
- The pattern of saving run data to SQLite first, then syncing to Firebase, is a good foundation for offline support. It just needs to be extended to cover more data flows.

### 28. AI Quest Generation
- The Gemini-powered quest generator is functional: it takes user profile data, generates personalized missions, and handles failures gracefully with a fallback quest.
- JSON response format with structured output is a good pattern.

### 29. Route Builder with Checkpoints
- The route builder hook with draggable checkpoints, quest path rendering, and real-time remaining path updates is a nice feature that goes beyond basic GPS tracking.

### 30. Real-time Firestore Listeners
- Mission tracking uses `onSnapshot` for real-time updates, which means progress reflects immediately without manual refresh.

---

## 📋 Priority Action Items

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P0 | Remove hardcoded API keys, move to .env, rotate Gemini key | 1 hour | Security |
| P0 | Fix `"undefined"` entry in package.json | 1 min | Build stability |
| P0 | Decide: Supabase migration or README rewrite | Decision | Thesis integrity |
| P1 | Implement streak multiplier logic (1.0x-3.0x) | 2-3 hours | Core mechanic |
| P1 | Add Gems to user profile and economy | 4-6 hours | Core mechanic |
| P1 | Build the 7-day onboarding arc | 1-2 days | Retention |
| P1 | Implement adaptive ghost (effort decay function) | 3-5 days | Thesis requirement |
| P2 | Add auth route guards | 2-3 hours | Security |
| P2 | Remove debug console.logs | 30 min | Code quality |
| P2 | Fix AuthContext dead code / needsPatch logic | 30 min | Bug prevention |
| P2 | Add error boundaries | 1-2 hours | Stability |
| P3 | Implement civic reporting (even basic version) | 1-2 weeks | Thesis requirement |
| P3 | Build Squad formation | 1 week | Social layer |
| P3 | Add Zustand or remove from README | 2-4 hours | Consistency |
| P4 | Implement Bayanihan Protocol | 2-3 weeks | Thesis feature |
| P4 | Territory/Guild system | 2 weeks | Social layer |

---

## 📊 Implementation Coverage Estimate

| README Section | Implementation Status |
|---|---|
| Running Engine (GPS tracking) | ✅ 70% — tracking works, ghost replay works, no adaptive modeling |
| Adaptive Ghost System | ❌ 5% — static replay only |
| Civic Engine | ❌ 0% |
| Resonance System | ❌ 0% |
| Ani AI Coach | 🟡 30% — quest gen + run summary exist, no weekly plans/greetings |
| RPG Mechanics (XP/Level) | 🟡 40% — XP/levels work, no gems/multiplier/freezes |
| Squads & Guilds | ❌ 0% |
| Bayanihan Protocol | ❌ 0% |
| Onboarding Arc | ❌ 5% — character creation exists, no 7-day flow |
| Offline-First Architecture | 🟡 25% — SQLite for runs only |
| Sensor Fusion & Anti-Cheat | 🟡 30% — basic pedometer + speed filter |
| Database Schema (as described) | ❌ 10% — Firebase, not PostgreSQL |
| Notification Architecture | ❌ 5% — package installed, no implementation |
| Privacy & Data Controls | ❌ 0% — no privacy zones, no data deletion flow |
| B2B Quest Nodes | ❌ 0% |
| Scout Pass | ❌ 0% |

**Overall README-to-Code alignment: ~15-20%**

---

## 🎯 Thesis-Specific Risks

1. **The experimental study design requires both groups (static PB ghost vs. adaptive ghost)**. Currently only the static PB ghost exists. Without the adaptive ghost, the thesis experiment cannot run.

2. **The civic engine's DBSCAN claim requires PostGIS**. Firestore cannot execute spatial clustering queries. Either migrate to Supabase/PostgreSQL or remove the civic engine from the thesis scope.

3. **The Resonance System is the "defining innovation" per the README**. It has zero implementation. If this is the thesis differentiator, it needs to be the development priority after the adaptive ghost.

4. **Data for the research study**: The rolling aggregation model needs at least 4 weeks of run history per user. Plan data collection timeline accordingly.

---

## 💡 Recommendations

1. **Scope the MVP honestly.** The README describes a 12-month product. Decide what's actually needed for the thesis defense and build that. Everything else is post-thesis.

2. **Migrate to Supabase if the thesis requires spatial queries.** If you keep Firebase, rewrite Sections 8, 9, 12, 29 of the README entirely.

3. **Build the adaptive ghost algorithm first.** This is the primary research question (RQ1). Without it, there's no experiment and no thesis.

4. **Add a `.env.example` file** with placeholder keys so collaborators know what environment variables are needed without seeing real secrets.

5. **Consider a monorepo structure** with `/algorithms` for testable, isolated implementations of the Effort Decay Function and Spatial Consensus — separate from the React Native UI. This makes them unit-testable and thesis-presentable.

---

*This audit reflects the state of the codebase as of June 25, 2026.*
