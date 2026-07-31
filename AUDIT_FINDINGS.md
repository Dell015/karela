# Karela — Full Codebase Audit Report

**Date:** July 31, 2026  
**Auditor:** Automated Code Analysis  
**Scope:** All 590 files, 76 prioritized source files (~13,400 LOC)  
**Expo SDK:** 57 | **React Native:** 0.81.5 | **React:** 19.1.0

---

## Executive Summary

The Karela codebase has a strong architectural vision and several well-implemented core engines (AdaptiveGhostEngine, QuestEngine, ResonanceSystem). However, the project suffers from **3 critical runtime crash bugs**, **2 critical security vulnerabilities**, **significant spec-implementation divergences**, **zero test coverage**, and multiple screens that are entirely hardcoded mock data with no backend integration.

The app will crash immediately on any XP-earning action due to a missing import in `AuthContext.tsx`.

---

## Table of Contents

1. [Critical Bugs (App Crashers)](#1-critical-bugs-app-crashers)
2. [Security Vulnerabilities](#2-security-vulnerabilities)
3. [Spec vs. Implementation Mismatches](#3-spec-vs-implementation-mismatches)
4. [Missing Features (Spec Defined, Not Implemented)](#4-missing-features-spec-defined-not-implemented)
5. [Performance Issues](#5-performance-issues)
6. [Memory Leaks](#6-memory-leaks)
7. [Architecture & Code Quality](#7-architecture--code-quality)
8. [Configuration & Build Issues](#8-configuration--build-issues)
9. [Accessibility Failures](#9-accessibility-failures)
10. [Testing Gap](#10-testing-gap)
11. [Dependency Concerns](#11-dependency-concerns)
12. [Data Integrity Risks](#12-data-integrity-risks)
13. [Mock/Placeholder Screens](#13-mockplaceholder-screens)
14. [Future-Proofing Recommendations](#14-future-proofing-recommendations)
15. [Priority Action Plan](#15-priority-action-plan)

---

## 1. Critical Bugs (App Crashers)

These bugs will cause immediate runtime crashes. The app cannot function correctly until these are fixed.

### 1.1 `context/AuthContext.tsx` — Missing `applyStreakMultiplier` import

**Severity:** 🔴 CRITICAL — Crashes on every XP-earning action

`gainXP()` calls `applyStreakMultiplier(amount, streak)` but the function is **never imported** from `@/services/streakMultiplier`. Every completed run, quest claim, and mission finalization triggers this crash.

**Fix:**
```typescript
import { applyStreakMultiplier } from "@/services/streakMultiplier";
```

---

### 1.2 `hooks/useSettings.ts` — Missing `incrementStats` and `setStats` imports

**Severity:** 🔴 CRITICAL — Crashes on fake data injection and reset

The file uses `incrementStats()` and `setStats()` but never imports them. Both `injectFakeData` and `handleResetData` will throw `ReferenceError`.

**Fix:**
```typescript
import { incrementStats, setStats } from "@/services/database/supabase/profiles";
```

---

### 1.3 `services/database/sqlite/database.ts` — Missing `supabase`, `incrementStats`, `setStats` imports

**Severity:** 🔴 CRITICAL — Crashes on `saveGhostRun()`

The `saveGhostRun` function references `supabase`, `incrementStats`, and `setStats` but the file only imports from `expo-sqlite`. Any run save operation will crash.

**Fix:** Add proper imports or refactor to separate local SQLite operations from cloud sync operations.

---

## 2. Security Vulnerabilities

### 2.1 Gemini API Key Exposed in Client Bundle

**Severity:** 🔴 CRITICAL

**File:** `services/ai/aiService.ts`

The API key is accessed via `process.env.EXPO_PUBLIC_GEMINI_API_KEY`. The `EXPO_PUBLIC_` prefix means the key is embedded in the JavaScript bundle and visible to anyone who decompiles the APK.

**Risk:** Anyone can extract the key and make unlimited API calls on your billing account.

**Fix:** Route all Gemini calls through a Supabase Edge Function that holds the key server-side.

---

### 2.2 `.env` File May Be in Git History

**Severity:** 🔴 CRITICAL

The `.env` file contains a real Gemini API key (`AIzaSy...`). While `.env` is in `.gitignore`, it was last modified April 27 — check if it was ever committed before the gitignore entry was added.

**Fix:**
1. Run `git log --all -- .env` to check history
2. Rotate the API key immediately
3. If found in history, use `git filter-branch` or BFG Repo-Cleaner to purge it

---

### 2.3 Civic Photos Are Publicly Accessible

**Severity:** 🟠 HIGH

**File:** `services/engines/CivicEngine.ts`

`uploadCivicPhoto` uses `getPublicUrl()` which makes every civic photo publicly accessible to anyone with the URL. The README spec (Section 23) requires RLS-gated access where only the owner and assigned Vanguards can view photos.

**Fix:** Use `createSignedUrl()` with short expiry, or serve photos through an authenticated endpoint.

---

### 2.4 Public OSRM Demo Server Used for Routing

**Severity:** 🟠 HIGH

**File:** `services/tracker/routingService.ts`

The app uses `https://router.project-osrm.org/route/v1/foot/` which is explicitly "for testing only, not for production use." It's rate-limited and can be shut off at any time.

**Fix:** Self-host OSRM or use a commercial routing API (Mapbox Directions, Google Directions API).

---

### 2.5 No Rate Limiting on Auth Attempts

**Severity:** 🟡 MEDIUM

**File:** `services/database/supabase/auth.ts`

No client-side rate limiting on `signIn` or `resendVerification`. Brute force and email spam protection relies entirely on Supabase server-side limits.

---

## 3. Spec vs. Implementation Mismatches

| Spec Requirement | Implementation | File |
|---|---|---|
| XP: `1 XP / 10m` distance-based | Hardcoded `xp: 150` per run | `database/sqlite/database.ts` |
| XP from routing: `1 XP / 10m` → `distance / 10` | `distance / 20` (half rate) | `tracker/routingService.ts` |
| Currency: "Gems" | Uses "coins" | `tracker/routingService.ts` |
| Calories: weight-adjusted estimates | Flat `60 cal/km` for all users | `database.ts`, `statsService.ts` |
| Steps: stride-calibrated | Flat `1310 steps/km` | `statsService.ts` |
| Day 7 onboarding: "any 1km+ mission" | Requires 2.0km | `services/onboarding.ts` |
| Gemini model: `gemini-1.5-flash` | Uses `gemini-2.0-flash` | `ai/aiService.ts` |
| State management: Zustand v4+ | React Context only | `context/AuthContext.tsx` |
| SQLite schema: `run_sessions`, `gps_waypoints`, `ghost_routes`, `pending_missions` | Only `ghost_runs` and `daily_missions` tables | `database/sqlite/database.ts` |
| Seasonal Gem Cap: 500 gems | Constant defined but never enforced | `services/gemSystem.ts` |
| Legacy Token conversion at season end | Not implemented | — |

---

## 4. Missing Features (Spec Defined, Not Implemented)

### Fully Missing (No code exists)

| Feature | Spec Section |
|---|---|
| Collective Shield (Squad streak protection) | §20 |
| Territory Quests (Guild landmark claiming) | §20 |
| Squad Vision (opt-in live location) | §20 |
| Bayanihan Protocol (Tiers 2-4) | §21 |
| Before/After photo split-screen | §21 |
| Node Master QR verification | §21 |
| Privacy Zones (blur zones) | §23 |
| B2B Quest Nodes / Local Hero system | §24 |
| Scout Pass subscription | §24 |
| LGU Admin Panel | §30 |
| Exportable civic reports (ZCI, DRV, CCR) | §30 |
| Community Hero accessibility mode | §28 |
| Quiet Hours notification suppression | §27 |
| Streak-at-risk notifications | §27 |
| Weekly summary push notification | §27 |
| Ani weekly fitness plan generation | §16 |
| Indoor Mode (treadmill/indoor walking) | §18 |
| Anti-cheat integrity filter | §18 |
| Stride calibration walk | §18 |
| Account deletion (RA 10173 compliance) | §23 |

### Partially Implemented (Scaffolded but incomplete)

| Feature | Status | Gap |
|---|---|---|
| Ghost System | Adaptive engine exists; legacy GhostEngine conflicts | Two incompatible ghost systems coexist |
| Civic Engine | Submit/fetch works | Consensus algorithm runs client-side (should be server Edge Function) |
| Vanguard System | Basic role flag exists | No blind assignment, no anti-collusion, no accuracy tracking |
| Notification System | Only race widget implemented | Missing all 8 notification types from spec |
| Onboarding 7-Day Arc | Days 1-7 defined | Gem rewards never persisted to database |
| Squad System | Basic formation exists | No Collective Shield, no geo-proximity discovery |

---

## 5. Performance Issues

### 5.1 O(n) Polyline Rendering on Map

**File:** `app/drawer/maps.tsx`

Each GPS waypoint renders a separate `<Polyline>` component. A 30-minute run at 1-second intervals creates ~1,800 Polyline elements, severely degrading map performance.

**Fix:** Batch contiguous same-color segments into single polylines.

---

### 5.2 `useLocationEngine` Always Active on Dashboard

**File:** `app/drawer/dashboard.tsx`

GPS tracking starts immediately when the dashboard mounts — consuming battery even when the user is just browsing stats.

**Fix:** Only activate location tracking when a run session begins.

---

### 5.3 MapView Inside ScrollView

**File:** `app/drawer/dashboard.tsx`

`<MapView>` is rendered inside a `<ScrollView>`, causing gesture conflicts (pan/zoom on map intercepted by scroll).

---

### 5.4 FlatList Inside ScrollView

**File:** `app/drawer/progress.tsx`

Nested virtualized list breaks React Native's VirtualizedList optimizations.

---

### 5.5 No Request Caching for AI Service

**File:** `services/ai/aiService.ts`

No caching or deduplication. Component re-renders trigger duplicate Gemini API calls.

---

## 6. Memory Leaks

| File | Issue |
|---|---|
| `hooks/useMotionShield.ts` | `setTimeout` never stored/cleared — rapid stepping creates hundreds of stale timeouts |
| `app/drawer/ai_coach.tsx` | No AbortController on Gemini API calls — response writes to unmounted component state |
| `app/drawer/dashboard.tsx` | `fetchWeather` has no cleanup on unmount |
| `app/drawer/maps.tsx` | Resonance interval can persist after unmount if racing is active |

---

## 7. Architecture & Code Quality

### 7.1 Duplicated Utilities

`haversine()` is implemented in 3 separate files:
- `services/engines/AdaptiveGhostEngine.ts`
- `services/tracker/routingService.ts`
- `services/tracker/geoUtils.ts`

Should be a single shared utility.

### 7.2 Conflicting Ghost Systems

Two ghost systems coexist:
- **Legacy:** `services/tracker/GhostEngine.ts` — simple timestamp replay
- **Adaptive:** `services/engines/AdaptiveGhostEngine.ts` + `GhostModelManager.ts` — synthetic ghost with decay model

The legacy system expects absolute timestamps; the adaptive system generates relative `elapsedMs`. These formats are incompatible. It's unclear which is used at runtime.

### 7.3 Hook/Direct-Call Inconsistency

`hooks/useQuestEngine.ts` exists as a clean abstraction, but `quests.tsx` and `dashboard.tsx` call `QuestEngine.generateQuests()` directly — bypassing the hook and duplicating logic.

### 7.4 Massive Components

`app/drawer/maps.tsx` is ~758 LOC with interleaved hooks, state, handlers, and JSX. Should be decomposed into sub-components (MapHUD, GhostLayer, CivicMarkers, RaceControls).

### 7.5 TypeScript Discipline

Pervasive `any` usage across the codebase:
- `useState<any[]>` in dashboard, maps, ai_coach
- `(wp: any)` in ghost waypoint mapping
- `Record<string, any>` in mission updates
- Function params typed as `any` in hooks

### 7.6 Dead Code

| File | Dead Code |
|---|---|
| `app/drawer/profile.tsx` | Entire Edit Profile modal state, form fields, and `handleSaveProfile` — modal never rendered |
| `services/QuestGenerator.ts` | Entire file — marked deprecated, delegates to QuestEngine |
| `components/AvatarView.tsx` | Empty file (0 bytes) |
| `app/homepage/active-run.tsx` | Hardcoded demo — not connected to any real tracking |

---

## 8. Configuration & Build Issues

### 8.1 Missing Expo Plugins in `app.json`

These plugins are required for native module linking but missing:
- `expo-location` — **background location will silently fail on Android builds**
- `expo-sensors` — accelerometer/pedometer linking
- `expo-image-picker` — camera permissions
- `expo-task-manager` — background tasks

### 8.2 Missing Permissions

| Permission | Platform | Purpose |
|---|---|---|
| `ACTIVITY_RECOGNITION` | Android | Step counter — **won't work without this** |
| `NSMotionUsageDescription` | iOS | Accelerometer — **access will be denied** |
| `BODY_SENSORS` | Android | Health data |

### 8.3 Stale Firebase References

`tsconfig.json` has a path alias for `firebase/auth` → `./node_modules/@firebase/auth/dist/index.rn.d.ts` but no Firebase packages are installed. Dead reference.

`.env.example` still contains Firebase variable placeholders.

### 8.4 Missing Scripts in `package.json`

- ❌ `test` — no test runner
- ❌ `type-check` — no `tsc --noEmit`
- ❌ `format` — no Prettier

### 8.5 `@expo/ngrok` in Production Dependencies

Development tunneling tool is in `dependencies` instead of `devDependencies`.

### 8.6 Experimental React Compiler Enabled

`app.json` has `experiments.reactCompiler: true`. This is experimental and may cause runtime issues with `react-native-reanimated` and 3D libraries.

---

## 9. Accessibility Failures

### 9.1 Zero Accessibility Labels

Across all 31 screen/component files, there is **zero usage** of:
- `accessibilityLabel`
- `accessibilityRole`
- `accessibilityHint`
- `accessibilityLiveRegion`

The entire app is inaccessible to screen reader users (TalkBack/VoiceOver).

### 9.2 Color-Only Information Encoding

- Ghost system: green = ahead, red = behind (no shape supplement in actual code, despite README claiming it)
- Civic node markers use color alone (orange/yellow/gray) for status

### 9.3 Form Inputs Use Placeholder Only

Login/signup `TextInput` components use `placeholder` as the only label. Placeholders disappear during typing, providing no persistent label for assistive tech.

---

## 10. Testing Gap

**🚨 Zero test files exist in the entire project.**

- No `*.test.ts`, `*.test.tsx`, `*.spec.ts` files
- No `__tests__` directories
- No `jest`, `jest-expo`, or `@testing-library/react-native` installed
- No `test` script in `package.json`

This is particularly concerning because:
1. The thesis claims algorithmic contributions (effort decay, spatial consensus) — these must be verifiable
2. The streak multiplier, XP formulas, and gem calculations have specific spec values that should be unit tested
3. The Kalman filter and haversine calculations are mathematical and perfect candidates for tests

---

## 11. Dependency Concerns

### 11.1 Zustand Missing

The README spec mandates Zustand v4+ for state management. It's **not installed**. The app uses React Context instead, which creates unnecessary re-renders (AuthContext is a god-context holding profile, stats, missions, AND methods — any change re-renders everything consuming it).

### 11.2 Heavy 3D Libraries Not in Spec

These add ~2MB+ to the bundle and are not required by the spec:
- `@react-three/drei`
- `@react-three/fiber`
- `expo-three`
- `expo-gl`
- `three`

They're used only for the character creation/Ani 3D model which is a nice-to-have, not core.

### 11.3 Unusual Dependencies

- `react-native-wagmi-charts` — Financial charting library, unusual for a fitness app
- `react-native-worklets` — Standalone worklets package, potential conflict with reanimated

### 11.4 Missing Zustand means AuthContext is a bottleneck

The single `AuthContext` holds:
- User profile
- Stats (XP, gems, streak, level)
- Missions
- Loading state
- All mutation methods (gainXP, earnGems, etc.)

Any state change re-renders every consumer. With Zustand, these would be separate stores with independent subscriptions.

---

## 12. Data Integrity Risks

### 12.1 Streak Calculation May Produce Wrong Results

**File:** `services/statsService.ts`

`calculateStreak()` uses `Array.from(new Set(...))` which doesn't guarantee sorted order. `runDays[0]` may not be the most recent day, producing incorrect streak counts.

**Fix:** Sort `runDays` descending before processing.

### 12.2 Quest Claiming Without Completion Validation

**File:** `services/engines/QuestEngine.ts`

`claimQuest()` has no check that `current_value >= target_value` before awarding XP/Gems. A user could claim incomplete quests.

### 12.3 Civic Decay Running Client-Side

**File:** `services/engines/CivicEngine.ts`

`applyDecay()` is called from the client, but should be a scheduled Supabase Edge Function. Multiple users triggering decay simultaneously creates race conditions and inconsistent confidence scores.

### 12.4 `syncRunToMissions` Uses Promise.all

**File:** `services/database/supabase/missions.ts`

If one mission update fails, the entire batch rejects — but some may have already been processed server-side. Should use `Promise.allSettled`.

### 12.5 No Pagination on Mission Queries

`getMissions()` fetches ALL matching missions with no `.limit()`. Over time this becomes a growing payload.

---

## 13. Mock/Placeholder Screens

These screens are entirely hardcoded with no backend connection:

| Screen | Status |
|---|---|
| `app/homepage/shop.tsx` | Static gem balance, no purchase logic, "BUY" button is non-functional |
| `app/homepage/guilds.tsx` | `MOCK_GUILDS` array, "SUBMIT PROOF OF IMPACT" only logs to console |
| `app/homepage/active-run.tsx` | Hardcoded Tuguegarao coordinates, not connected to tracking engine |
| `app/drawer/calendar.tsx` | Hardcoded "February 2026", personal device names ("Sander's Airpods Pro 2", "Steven's Galaxy Buds Pro"), fake streak data |
| `app/drawer/settings.tsx` | Random build ID regenerates on every render (`Math.random()`) |

---

## 14. Future-Proofing Recommendations

### 14.1 Immediate (Before any user testing)

1. **Fix the 3 crash bugs** (§1) — the app literally cannot award XP right now
2. **Move Gemini API key server-side** — create a Supabase Edge Function proxy
3. **Add `expo-location` plugin to app.json** — background tracking is broken without it
4. **Add `ACTIVITY_RECOGNITION` permission** — step counting is broken without it
5. **Install Zustand** and migrate AuthContext into separate stores (profile, stats, missions, session)
6. **Add a test framework** (`jest-expo` + `@testing-library/react-native`) and write unit tests for:
   - `streakMultiplier.ts` (verify all tier values)
   - `GpsKalmanFilter.ts`
   - `AdaptiveGhostEngine.ts` decay model
   - `gemSystem.ts` calculations

### 14.2 Short-term (Before Phase 1 pilot)

7. **Implement proper XP formula** — `distance_m / 10` as spec requires
8. **Implement stride-calibrated step counting** and weight-based calorie estimates
9. **Remove or gate 3D libraries** behind a lazy import — save 2MB on bundle
10. **Add accessibility labels** to all interactive elements
11. **Replace OSRM demo server** with a production routing service
12. **Implement Privacy Zones** — required for RA 10173 compliance
13. **Implement account deletion** — legally required under Philippine Data Privacy Act
14. **Add offline sync conflict resolution** per the TSR spec in README §8
15. **Add input validation** to signup (email format, password strength, numeric range checks)

### 14.3 Medium-term (Phase 2 preparation)

16. **Implement the notification architecture** — currently only a race widget exists
17. **Build the Bayanihan Protocol safety tiers** — the ethical foundation of the civic system
18. **Implement Collective Shield** — the signature social mechanic
19. **Build Territory Quests** — the primary Guild engagement driver
20. **Move civic consensus algorithm to Edge Function** — remove client-side race conditions
21. **Implement Vanguard governance** — blind assignment, accuracy tracking
22. **Add i18n framework** (react-i18next) — required for Tagalog/Ibanag localization
23. **Add Sentry or similar error monitoring** — critical for pilot with real users

### 14.4 Long-term (Phase 3+)

24. **PAGASA integration** for automated safety tier escalation
25. **LGU Admin Panel** — separate web dashboard (React/Next.js)
26. **B2B Quest Node management** system
27. **Scout Pass** subscription with in-app purchases
28. **Community Hero mode** for mobility-limited users
29. **Multi-city expansion** data architecture (city-scoped queries)
30. **Performance monitoring** (React Native Performance, Flipper integration)

---

## 15. Priority Action Plan

### 🔴 Do Now (App is Broken)

| # | Action | Time Estimate |
|---|---|---|
| 1 | Fix `AuthContext.tsx` missing import | 5 min |
| 2 | Fix `useSettings.ts` missing imports | 5 min |
| 3 | Fix `database.ts` missing imports / refactor | 30 min |
| 4 | Move Gemini API key to Edge Function | 2 hours |
| 5 | Add `expo-location` plugin to app.json | 5 min |
| 6 | Add `ACTIVITY_RECOGNITION` + `NSMotionUsageDescription` | 10 min |

### 🟠 Do This Week (Core Stability)

| # | Action | Time Estimate |
|---|---|---|
| 7 | Install Zustand, create profile/stats/session stores | 4 hours |
| 8 | Fix XP formula to match spec (1 XP / 10m) | 1 hour |
| 9 | Fix streak calculation sort bug | 30 min |
| 10 | Add quest completion validation before claiming | 30 min |
| 11 | Install jest-expo, write unit tests for core formulas | 4 hours |
| 12 | Fix CivicEngine photo privacy (signed URLs) | 1 hour |
| 13 | Remove stale Firebase references | 15 min |
| 14 | Fix memory leaks (useMotionShield, ai_coach) | 1 hour |

### 🟡 Do This Sprint (User-Facing Quality)

| # | Action | Time Estimate |
|---|---|---|
| 15 | Add accessibility labels to all interactive elements | 4 hours |
| 16 | Add input validation to signup/profile forms | 2 hours |
| 17 | Batch polyline rendering on map | 2 hours |
| 18 | Remove mock data from calendar, replace with real data | 3 hours |
| 19 | Implement Edit Profile modal (currently dead code) | 2 hours |
| 20 | Add loading/error states to all screens | 3 hours |

---

## Appendix: Files Audited

<details>
<summary>All 76 prioritized source files</summary>

**Engines (5):** QuestEngine.ts, AdaptiveGhostEngine.ts, ResonanceSystem.ts, CivicEngine.ts, GhostModelManager.ts  
**Services (12):** aiService.ts, database.ts, tracker.ts, config.ts, auth.ts, missions.ts, profiles.ts, runService.ts, userData.ts, gemSystem.ts, streakMultiplier.ts, statsService.ts, notificationService.ts, PermissionsManager.ts, onboarding.ts, QuestGenerator.ts, routingService.ts, GpsKalmanFilter.ts, GhostEngine.ts, geoUtils.ts  
**Screens (18):** dashboard.tsx, maps.tsx, ai_coach.tsx, quests.tsx, calendar.tsx, progress.tsx, profile.tsx, settings.tsx, active-run.tsx, guilds.tsx, shop.tsx, CustomizeAni.tsx, login.tsx, signup.tsx, index.tsx, summary.tsx, performanceGraph.tsx, character_creation.tsx  
**Hooks (5):** useQuestEngine.ts, useSettings.ts, useLocationEngine.ts, useRouteBuilder.ts, useMotionShield.ts  
**Components (11):** AuthGate.tsx, CivicHUD.tsx, RunHistory.tsx, PlayerCard.tsx, QuestCard.tsx, NodeDetailModal.tsx, DynamicDock.tsx, AniConsole.tsx, AniModel.tsx, GradientText.tsx, Screen.tsx  
**Context (1):** AuthContext.tsx  
**Config (6):** package.json, tsconfig.json, app.json, babel.config.js, metro.config.js, eslint.config.js

</details>

---

*End of Audit Report*
