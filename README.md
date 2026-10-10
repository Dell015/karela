# Karela

**A hybrid fitness and civic intelligence mobile app** built with React Native and Expo.

Karela combines adaptive running algorithms with crowdsourced urban sensing — turning everyday movement into health progress and civic impact. Features an AI coach (Ani), RPG progression, Ghost pacing, squads, guilds and territory, a Gem shop, and a Bayanihan disaster-response protocol.

> For the full project vision, specification, algorithms, and research framework, see **[docs/aboutkarela.md](./docs/aboutkarela.md)**.
> For what is built today and what is left, see **[docs/QA_REPORT.md](./docs/QA_REPORT.md)**.

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)
- **Expo CLI** — installed globally or via npx
- **Expo Go** app on your phone (latest version from App Store / Play Store)
- **Supabase** project (for backend services)
- **Gemini API key** (for Ani AI coaching)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd karela

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL, Supabase anon key, and Gemini API key
```

> **Note:** `--legacy-peer-deps` is required due to a peer conflict in `@react-native-community/datetimepicker`. This will be resolved in a future update.

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
EXPO_PUBLIC_WEATHER_API_KEY=your-openweathermap-api-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

`.env.example` is the template and the list of every variable. For cloud (EAS) builds, set the same variables in EAS too, or the release app stops at launch.

> **Security note:** The `EXPO_PUBLIC_` prefix exposes these in the client bundle. The Supabase anon key is designed for this (protected by RLS). The Gemini key should ideally be proxied through a Supabase Edge Function in production.

### Running the App

```bash
# Start the Expo dev server
npm start

# Or target a specific platform
npm run android
npm run ios
npm run web
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to open on your device.

> **Expo Go Compatibility:** This project uses **Expo SDK 57**. Make sure your Expo Go app is updated to the latest version. If you get "Project is incompatible with this version of Expo Go", update Expo Go from the store or use a development build (`npx expo run:android`).

### Database Setup

1. Create a [Supabase](https://supabase.com) project
2. Run the SQL migrations in order:
   ```
   supabase/schema.sql
   supabase/02_realtime_and_history.sql
   supabase/03_civic_engine.sql
   supabase/04_civic_fixes_and_storage.sql
   supabase/05_lock_down_civic.sql
   supabase/06_schedule_decay.sql
   supabase/07_close_stats_hole.sql
   supabase/08_account_deletion.sql
   supabase/09_profile_pictures.sql
   supabase/10_streak_protection_and_shop.sql
   supabase/11_squads.sql
   supabase/12_guilds.sql
   supabase/13_territory.sql
   supabase/14_finish_run.sql
   ```
   Then add the territory landmarks: `supabase/landmarks_tuguegarao.sql`.

   `supabase/demo/` is **not** part of this order. It holds mock data for screenshots, each with a file that removes it: civic reports (`tuguegarao_demo_reports.sql`, `remove_demo_reports.sql`) and guilds competing for the landmarks (`tuguegarao_demo_guilds.sql`, `remove_demo_guilds.sql`).
3. Enable the **PostGIS** extension in your Supabase dashboard (Database → Extensions)
4. Enable **Realtime** on the `profiles`, `missions`, and `civic_nodes` tables

---

## Project Structure

```
karela/
├── app/                        # Screens (Expo Router file-based routing)
│   ├── _layout.tsx             # Root layout
│   ├── index.tsx               # Entry / splash / onboarding screen
│   ├── summary.tsx             # Post-run summary screen
│   ├── performanceGraph.tsx    # Performance analytics
│   ├── territory-map.tsx       # Map of landmarks coloured by the guild that holds them
│   ├── scout-pass.tsx          # Scout Pass: benefits, season level, reward track
│   ├── auth/                   # Login & signup screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── settings/               # Settings sub-screens
│   │   ├── privacy-zones.tsx   # Up to 5 Privacy Zones (100 m)
│   │   └── your-data.tsx       # What Karela stores and sends, download, delete
│   ├── drawer/                 # Main app drawer screens
│   │   ├── _layout.tsx         # Drawer navigation layout
│   │   ├── dashboard.tsx       # Home dashboard
│   │   ├── maps.tsx            # Map & run tracking
│   │   ├── ai_coach.tsx        # Ani AI chat interface
│   │   ├── quests.tsx          # Quest management
│   │   ├── calendar.tsx        # Activity calendar (real run history)
│   │   ├── progress.tsx        # Progress & stats (pace and bar charts)
│   │   ├── profile.tsx         # User profile (with edit modal)
│   │   ├── guilds.tsx          # Squad, Guild and Territory tabs
│   │   ├── shop.tsx            # Gem shop (prices and purchases on the server)
│   │   └── settings.tsx        # Settings, privacy, account
│   ├── homepage/               # Sub-screens
│   │   └── CustomizeAni.tsx    # Ani customization
│   └── dashboard/
│       └── character_creation.tsx  # Stub, not reachable yet (player character not built)
├── components/                 # Reusable UI components
│   ├── ui/                     # Base UI primitives (Screen, Button, Sheet, Avatar, SettingsRow)
│   ├── icons/KarelaIcon.tsx    # Custom Karela SVG icon set (Gems, streak, squad, guild...)
│   ├── guild/                  # Squad, Guild and Territory tabs
│   ├── run/                    # Run screen stats panel (RunHUD) and heading marker (UserMarker)
│   ├── charts/                 # Pace and bar charts (react-native-svg)
│   ├── DynamicDock.tsx         # Bottom dock shared by the tab screens
│   ├── TodayCard.tsx           # Dashboard "Today" card
│   ├── AuthGate.tsx            # Auth route protection
│   ├── CivicHUD.tsx            # Civic reporting overlay
│   ├── RunHistory.tsx          # Run history list
│   ├── PlayerCard.tsx          # User stats card
│   ├── QuestCard.tsx           # Quest display card
│   ├── NodeDetailModal.tsx     # Civic node detail view
│   ├── AniConsole.tsx          # Ani dialogue component
│   └── AniModel.tsx            # 3D Ani model viewer
├── context/
│   └── AuthContext.tsx         # Authentication & user state
├── hooks/                      # Custom React hooks
│   ├── useLocationEngine.ts    # GPS tracking & sensor fusion
│   ├── useQuestEngine.ts       # Quest state management
│   ├── useRouteBuilder.ts      # Route creation utilities
│   └── useMotionShield.ts      # Motion detection guard
├── services/                   # Business logic & data layer
│   ├── engines/                # Core algorithm engines
│   │   ├── QuestEngine.ts      # Quest generation & tracking
│   │   ├── AdaptiveGhostEngine.ts  # Adaptive ghost pacing
│   │   ├── ResonanceSystem.ts  # Fitness-civic fusion layer
│   │   ├── CivicEngine.ts      # Civic reporting & consensus
│   │   └── GhostModelManager.ts   # Ghost model persistence
│   ├── ai/
│   │   ├── aiService.ts        # Gemini AI integration (Ani)
│   │   └── aniPersona.ts       # Ani's voice and wellness-only rules
│   ├── database/
│   │   ├── sqlite/             # Local offline storage
│   │   │   ├── database.ts     # SQLite operations
│   │   │   └── tracker.ts      # Run tracking queries
│   │   └── supabase/           # Cloud backend
│   │       ├── config.ts       # Supabase client init
│   │       ├── auth.ts         # Authentication service
│   │       ├── missions.ts     # Mission CRUD & realtime
│   │       ├── profiles.ts     # User profile operations
│   │       ├── runService.ts   # Run history & AI summaries
│   │       └── userData.ts     # Download my data, delete account
│   ├── tracker/                # GPS & movement utilities
│   │   ├── routingService.ts   # Route planning (OSRM)
│   │   ├── GpsKalmanFilter.ts  # GPS noise filtering
│   │   ├── GhostEngine.ts      # Legacy ghost replay
│   │   └── geoUtils.ts         # Geo math utilities
│   ├── gemSystem.ts            # How Gems are earned (prices live on the server)
│   ├── shop.ts                 # Shop catalogue and purchases (server functions)
│   ├── store.ts                # Gem packs, Scout Pass, season and reward track (real-money items; screens only)
│   ├── buffs.ts                # Active boosts and guild badge buffs
│   ├── squads.ts               # Squads and Collective Shield
│   ├── guilds.ts               # Guilds and badges
│   ├── territory.ts            # Landmark zones; queues km-per-zone uploads with UUIDs
│   ├── gameArt.ts              # Maps Shop items and badges to their art
│   ├── streakMultiplier.ts     # Streak XP multiplier tiers
│   ├── streakService.ts        # Asks the server to settle the streak
│   ├── runMath.ts              # Distance, time, pace, XP and calories in one place
│   ├── runAnalytics.ts         # Progress and activity stats from run history
│   ├── statsService.ts         # Stats helpers
│   ├── calendarData.ts         # Calendar month grid from run history
│   ├── privacyZones.ts         # Privacy Zones (stored only on the phone)
│   ├── profileData.ts          # Profile edits through server functions
│   ├── profilePhoto.ts         # Profile photo crop, strip location, upload
│   ├── account.ts              # Change password, delete account
│   ├── reminders.ts            # Daily reminder outside quiet hours
│   ├── weatherSafety.ts        # Storm safety (Bayanihan Tier 0 and 1)
│   ├── onboarding.ts           # 7-day onboarding arc (not wired up yet, QA H3)
│   ├── notificationService.ts  # Notification helpers
│   ├── PermissionsManager.ts   # OS permissions handler
│   └── QuestGenerator.ts       # (Unused) Legacy quest gen
├── styles/                     # Shared stylesheets
├── supabase/                   # Database migrations
│   ├── schema.sql              # Core schema (run first)
│   ├── 02_ ... 13_*.sql        # Migrations, run in number order
│   └── tests/                  # SQL tests for 10 to 13 (PGlite, no live database needed)
├── assets/
│   ├── fonts/                  # Excon font family
│   ├── images/                 # App icons, onboarding slides, UI images
│   │   └── game/               # 3D-rendered Shop items and guild badges (WebP)
│   └── 3d/                     # Ani (female_final.glb) and other .glb models
│       └── source/             # Blender and FBX source files (not bundled)
├── docs/                       # Project documentation (see below)
├── scripts/render-game-art/    # Re-renders assets/images/game from low-poly models
├── website-v2/                 # Landing page (plain HTML/CSS/JS, separate from the app)
├── .env.example                # Environment variable template
├── app.config.js               # Expo configuration
├── package.json
└── tsconfig.json
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React Native + Expo | SDK 57 | Cross-platform mobile app |
| Language | TypeScript | ~6.0 | Type safety |
| Navigation | Expo Router | file-based | Screen routing |
| Local DB | expo-sqlite | ~57.0 | On-device storage |
| Cloud Backend | Supabase (PostgreSQL + PostGIS) | ^2.108 | Auth, database, storage, realtime |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) | ^0.24 | Ani coaching & quest generation |
| Maps | react-native-maps | 1.27 | GPS visualization (Apple Maps on iOS, Google Maps on Android) |
| Sensors | expo-location + expo-sensors | ~57.0 | GPS + accelerometer |
| 3D | Three.js + @react-three/fiber | ^0.182 / ^9.6 | Character model rendering |
| Animations | react-native-reanimated | 4.5 | Smooth UI animations |
| Charts | react-native-svg | 15.15 | Pace and bar charts (drawn in `components/charts/`) |
| Notifications | expo-notifications | ~57.0 | Daily reminder |

---

## Available Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in browser
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking (tsc --noEmit)
npm test           # App tests: not set up yet (jest isn't installed, QA M12)

# SQL tests for migrations 10 to 13
cd supabase/tests && npm install && npm test
```

---

## Key Concepts

- **Ghost System** — An adaptive pacing avatar that models your personal fatigue patterns, not your peak performance
- **Ani** — AI coach powered by Gemini Flash that generates personalized quests based on your body profile, history, and local context
- **Resonance System** — Fusion layer that uses your stamina state to dynamically adjust civic contribution load
- **Civic Engine** — Crowdsourced urban issue reporting with DBSCAN-inspired spatial consensus verification
- **Bayanihan Protocol** — Disaster preparedness and recovery quest system with safety tier hard-locks
- **Streak Multiplier** — XP bonus (1.0×–3.0×) that rewards daily consistency over peak performance. The server counts streaks, and protected days (Streak Freeze, Streak Repair, a squad's Collective Shield) keep a streak alive
- **Squads, Guilds and Territory** — squads of 3 to 12, guilds of up to 10 squads, and monthly contests for 250 m landmark zones. All rules run on the server
- **Gems and the Shop** — Gems are earned by playing and can also be bought in Gem packs. They buy streak protection, boosts and visual-only cosmetics. The **Scout Pass** is a paid 90-day season pass with a 20-level reward track. Paying isn't switched on yet (screens only)

---

## Architecture

**Local-First, Cloud-Sync** — designed for the Philippine market where mobile data is expensive and inconsistent.

The design:
- Run tracking works with no signal and syncs to Supabase later
- Every synced event carries a UUID, so syncing twice never double-counts
- Game rules that involve Gems, streaks, squads, guilds and territory run on the server, never only on the phone

Where it stands today (details in `docs/QA_REPORT.md`):
- **Built:** a run outbox (`services/runOutbox.ts`): each run gets a UUID at Start, is saved on the phone while it happens, survives the app being killed, and syncs when online without counting twice (`14_finish_run.sql`). Territory uploads (km per zone) queue offline with a UUID. Shop purchases, streaks, squads, guilds and territory are server functions.
- **Not built yet:** XP and Gems for runs are still worked out by the phone (QA C1). GPS stops when the screen locks (QA C6).

---

## Permissions Required

| Permission | Platform | Purpose |
|---|---|---|
| Fine/Coarse Location | Both | GPS tracking during runs |
| Background Location | Both | Tracking with the screen off (permission configured; the background task isn't built yet, QA C6) |
| Activity Recognition | Android | Step counting & movement detection |
| Motion Usage | iOS | Accelerometer & pedometer access |
| Camera | Both | Civic report photo capture |
| Notifications | Both | Daily reminder |

All permissions are configured in `app.config.js` with user-facing descriptions.

---

## Development Notes

### Expo Go vs Development Build

This project uses several native modules (background location, task manager, sensors) that work best with a **development build** rather than Expo Go:

```bash
# Build and install a custom dev client (recommended)
npx expo run:android

# Or stick with Expo Go (some features limited)
npx expo start
```

### Known Dependency Issues

- `@react-native-community/datetimepicker` has a peer conflict with `react-native-windows`. Use `--legacy-peer-deps` when installing packages.
- `react-native-worklets` may show a deprecation warning about the "main" field — this is cosmetic and doesn't affect functionality.

### Lint Status

ESLint: **0 errors, 32 warnings** (2026-10-09; the warnings are listed in `docs/QA_REPORT.md` 5.6). TypeScript: **8 errors** (QA T1).
```bash
npm run lint
```

---

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run type-check` before committing
4. Submit a pull request with a clear description

### Code Style

- TypeScript strict mode enabled
- Use proper types — avoid `any`
- Keep components under 300 lines — extract sub-components
- Shared utilities go in `services/`, not duplicated across files
- Use the existing style system in `styles/` — don't inline styles for shared elements
- Clean up unused imports and variables

### Commit Convention

```
feat: add streak freeze purchase flow
fix: resolve ghost timestamp mismatch
docs: update API integration guide
refactor: extract haversine into shared geoUtils
```

---

## Resolved Issues (July 2026 Audit)

The following critical issues were identified and fixed (some of these files have since moved or been removed, for example `app.json` is now `app.config.js` and `useSettings.ts` is gone):

- `AuthContext.tsx` — missing `applyStreakMultiplier` import (crashed XP earning)
- `useSettings.ts` — missing `incrementStats`/`setStats` imports
- `database.ts` — missing Supabase imports for run saving
- `app.json` — added `expo-location` plugin (background location was broken)
- `app.json` — added `ACTIVITY_RECOGNITION` + `NSMotionUsageDescription`
- `app.json` — added `expo-sensors`, `expo-image-picker`, `expo-task-manager` plugins
- `tsconfig.json` — removed stale Firebase path alias
- `useMotionShield.ts` — fixed setTimeout memory leak
- `statsService.ts` — fixed unsorted streak calculation
- `QuestEngine.ts` — added completion validation before claiming
- `PermissionsManager.ts` — fixed error handler returning wrong boolean
- `profile.tsx` — implemented Edit Profile modal (was dead code)
- All ESLint errors and warnings resolved at the time (59 → 0)

---

## What's Built and What's Left

**[docs/QA_REPORT.md](./docs/QA_REPORT.md)** is the one place that tracks this, with priorities and item codes (C1, H3, ...). This is a short summary as of 2026-10-09.

### Built
- [x] Login, signup with email verification, profile editing, profile photos
- [x] Run tracking with GPS smoothing (Kalman filter, jump and vehicle-speed rejection), live stats panel, heading marker, Ghost pacing
- [x] One shared set of run maths: XP at 1 per 10 m, calories from body weight (shown as an estimate), pace and time from the clock
- [x] Progress and activity stats from every finished run, with pace and bar charts
- [x] Calendar on real run history; dashboard Today card
- [x] Streaks counted on the server, with Streak Freeze, Streak Repair and the squad Collective Shield
- [x] Gem Shop: prices and purchases on the server; trails and photo frames show on the map and profile
- [x] Squads, Guilds (with all five badges; Vanguard Guild shown as "coming later") and Territory (needs landmarks to be added)
- [x] Civic reports locked to server functions; stale reports decay hourly
- [x] Settings: Privacy Zones, daily reminder, permissions, change password, download my data, delete account, "Your data" page (RA 10173)
- [x] Ani: wellness-only rules in every prompt; storm safety (Bayanihan Tier 0 and 1 from live weather)
- [x] Custom Karela icon set and 3D-rendered Shop and badge art
- [x] SQL tests for migrations 10 to 13

Most of the server features need their SQL file run in Supabase first (see Database Setup and QA section 3).

### Left, most urgent first
- [ ] Fix 8 TypeScript errors and one time-dependent SQL test (QA T1, T2)
- [x] Save runs on the phone with a UUID and an outbox so offline and crashed runs aren't lost; open the summary by id instead of from the URL (QA C5, C7)
- [ ] Award XP and Gems on the server, not the phone (QA C1, H2)
- [ ] Background tracking with the screen locked (QA C6)
- [ ] Move the Gemini and weather keys behind a Supabase Edge Function; give Ani chat memory (QA C3, H10)
- [ ] Civic photos private with signed URLs; limit who can read reports; stop civic reward farming (QA H5, H6, C4)
- [ ] Signup validation, consent and minimum age (QA H9)
- [ ] Wire up the 7-day onboarding (QA H3)
- [ ] Replace the OSRM demo server with a production routing service (QA M10)
- [ ] Push notifications for squads and guilds (QA N1)
- [ ] Optional: Zustand for state management (replace the large AuthContext)

### Quality
- [ ] Set up `jest-expo` + `@testing-library/react-native` for unit tests (QA M12)
- [ ] Accessibility labels on the older screens; no colour-only states (83 labels so far, QA M9)
- [ ] Add i18n framework (react-i18next) for Tagalog/Ibanag
- [ ] Draw the run trail as one map line instead of one per GPS segment, for low-end Android (QA M2)
- [ ] Add Sentry error monitoring for pilot

---

## Documentation

| Document | Contents |
|---|---|
| [docs/aboutkarela.md](./docs/aboutkarela.md) | Full project specification, algorithms, research framework, business model |
| [docs/QA_REPORT.md](./docs/QA_REPORT.md) | What is built and what is left (updated 2026-10-09): findings, priorities, device test list |
| [docs/COMPUTATIONS.md](./docs/COMPUTATIONS.md) | Algorithm computations and formulas |
| [docs/SDK_UPGRADE_LOG.md](./docs/SDK_UPGRADE_LOG.md) | Record of Expo SDK upgrades |
| [supabase/tests/README.md](./supabase/tests/README.md) | How to run the SQL tests |
| [website-v2/BACKLOG.md](./website-v2/BACKLOG.md) | Landing page to-do list |

---

## Team

| Name | Role |
|---|---|
| Randel Serafica | Lead Developer & Architect |
| Trishia Rirao | UI Designer & Pitch Presenter |
| Steven Sanidad | UX Designer & Quality Assurance |
| Qarisha Collado | UI/UX Designer & Research |
| Cyduanne Biraquit | Database & 3D Modelling |
| Sander Sedano | Team Mentor/Adviser |

---

## License

All Rights Reserved © 2026 Randel Serafica

---

*Pilot City: Tuguegarao City, Cagayan Valley, Philippines*
