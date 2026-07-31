# Karela 🏃‍♂️🇵🇭

**A hybrid fitness and civic intelligence mobile app** built with React Native and Expo.

Karela combines adaptive running algorithms with crowdsourced urban sensing — turning everyday movement into health progress and civic impact. Features an AI coach (Ani), RPG progression, Ghost pacing, and a Bayanihan disaster-response protocol.

> For the full project vision, specification, algorithms, and research framework, see **[aboutkarela.md](./aboutkarela.md)**.

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
```

> ⚠️ **Security Note:** The `EXPO_PUBLIC_` prefix exposes these in the client bundle. The Supabase anon key is designed for this (protected by RLS). The Gemini key should ideally be proxied through a Supabase Edge Function in production.

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
   ```
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
│   ├── auth/                   # Login & signup screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── drawer/                 # Main app drawer screens
│   │   ├── _layout.tsx         # Drawer navigation layout
│   │   ├── dashboard.tsx       # Home dashboard
│   │   ├── maps.tsx            # Map & run tracking
│   │   ├── ai_coach.tsx        # Ani AI chat interface
│   │   ├── quests.tsx          # Quest management
│   │   ├── calendar.tsx        # Activity calendar
│   │   ├── progress.tsx        # Progress & stats
│   │   ├── profile.tsx         # User profile (with edit modal)
│   │   └── settings.tsx        # App settings
│   ├── homepage/               # Sub-screens
│   │   ├── active-run.tsx      # Active run view
│   │   ├── guilds.tsx          # Guild & squad screen
│   │   ├── shop.tsx            # Gem shop
│   │   └── CustomizeAni.tsx    # Ani customization
│   └── dashboard/
│       └── character_creation.tsx
├── components/                 # Reusable UI components
│   ├── ui/                     # Base UI primitives (Screen, etc.)
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
│   ├── useSettings.ts          # Settings & dev tools
│   └── useMotionShield.ts      # Motion detection guard
├── services/                   # Business logic & data layer
│   ├── engines/                # Core algorithm engines
│   │   ├── QuestEngine.ts      # Quest generation & tracking
│   │   ├── AdaptiveGhostEngine.ts  # Adaptive ghost pacing
│   │   ├── ResonanceSystem.ts  # Fitness-civic fusion layer
│   │   ├── CivicEngine.ts      # Civic reporting & consensus
│   │   └── GhostModelManager.ts   # Ghost model persistence
│   ├── ai/
│   │   └── aiService.ts        # Gemini AI integration (Ani)
│   ├── database/
│   │   ├── sqlite/             # Local offline storage
│   │   │   ├── database.ts     # SQLite operations
│   │   │   └── tracker.ts      # Run tracking queries
│   │   └── supabase/           # Cloud backend
│   │       ├── config.ts       # Supabase client init
│   │       ├── auth.ts         # Authentication service
│   │       ├── missions.ts     # Mission CRUD & realtime
│   │       ├── profiles.ts     # User profile operations
│   │       └── runService.ts   # Run history & AI summaries
│   ├── tracker/                # GPS & movement utilities
│   │   ├── routingService.ts   # Route planning (OSRM)
│   │   ├── GpsKalmanFilter.ts  # GPS noise filtering
│   │   ├── GhostEngine.ts      # Legacy ghost replay
│   │   └── geoUtils.ts         # Geo math utilities
│   ├── gemSystem.ts            # Gem economy logic
│   ├── streakMultiplier.ts     # Streak XP multiplier tiers
│   ├── statsService.ts         # Stats aggregation
│   ├── onboarding.ts           # 7-day onboarding arc
│   ├── notificationService.ts  # Push notifications
│   ├── PermissionsManager.ts   # OS permissions handler
│   └── QuestGenerator.ts       # (Deprecated) Legacy quest gen
├── styles/                     # Shared stylesheets
├── supabase/                   # Database migrations
│   ├── schema.sql              # Core schema
│   ├── 02_realtime_and_history.sql
│   ├── 03_civic_engine.sql
│   └── 04_civic_fixes_and_storage.sql
├── assets/                     # Images, fonts, 3D models
├── .env.example                # Environment variable template
├── app.json                    # Expo configuration
├── package.json
├── tsconfig.json
└── aboutkarela.md              # Full project specification
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React Native + Expo | SDK 57 | Cross-platform mobile app |
| Language | TypeScript | 5.9 | Type safety |
| Navigation | Expo Router | file-based | Screen routing |
| Local DB | expo-sqlite | ~16.0 | Offline-first data storage |
| Cloud Backend | Supabase (PostgreSQL + PostGIS) | ^2.108 | Auth, database, storage, realtime |
| AI | Google Gemini 2.0 Flash | ^0.24 | Ani coaching & quest generation |
| Maps | react-native-maps | 1.20 | GPS visualization |
| Sensors | expo-location + expo-sensors | ~19.0 / ~15.0 | GPS + accelerometer |
| 3D | Three.js + @react-three/fiber | ^0.182 / ^9.6 | Character model rendering |
| Animations | react-native-reanimated | ~4.1 | Smooth UI animations |
| Charts | react-native-wagmi-charts | ^2.9 | Performance graphs |

---

## Available Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in browser
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking (tsc --noEmit)
npm test           # Run tests (requires jest-expo setup)
```

---

## Key Concepts

- **Ghost System** — An adaptive pacing avatar that models your personal fatigue patterns, not your peak performance
- **Ani** — AI coach powered by Gemini Flash that generates personalized quests based on your body profile, history, and local context
- **Resonance System** — Fusion layer that uses your stamina state to dynamically adjust civic contribution load
- **Civic Engine** — Crowdsourced urban issue reporting with DBSCAN-inspired spatial consensus verification
- **Bayanihan Protocol** — Disaster preparedness and recovery quest system with safety tier hard-locks
- **Streak Multiplier** — XP bonus (1.0×–3.0×) that rewards daily consistency over peak performance

---

## Architecture

**Local-First, Cloud-Sync** — designed for the Philippine market where mobile data is expensive and inconsistent.

- All sensor data and run tracking happens offline in SQLite
- Sync to Supabase when connectivity is available
- Conflict resolution: local timestamps honored for streaks, server recalculates XP from event log
- All events carry UUIDs for idempotent sync

---

## Permissions Required

| Permission | Platform | Purpose |
|---|---|---|
| Fine/Coarse Location | Both | GPS tracking during runs |
| Background Location | Both | Ghost tracking with screen off |
| Activity Recognition | Android | Step counting & movement detection |
| Motion Usage | iOS | Accelerometer & pedometer access |
| Camera | Both | Civic report photo capture |
| Notifications | Both | Run widget & streak alerts |

All permissions are configured in `app.json` with user-facing descriptions.

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

The project currently passes ESLint with **0 errors and 0 warnings**:
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

The following critical issues were identified and fixed:

- ✅ `AuthContext.tsx` — missing `applyStreakMultiplier` import (crashed XP earning)
- ✅ `useSettings.ts` — missing `incrementStats`/`setStats` imports
- ✅ `database.ts` — missing Supabase imports for run saving
- ✅ `app.json` — added `expo-location` plugin (background location was broken)
- ✅ `app.json` — added `ACTIVITY_RECOGNITION` + `NSMotionUsageDescription`
- ✅ `app.json` — added `expo-sensors`, `expo-image-picker`, `expo-task-manager` plugins
- ✅ `tsconfig.json` — removed stale Firebase path alias
- ✅ `useMotionShield.ts` — fixed setTimeout memory leak
- ✅ `statsService.ts` — fixed unsorted streak calculation
- ✅ `QuestEngine.ts` — added completion validation before claiming
- ✅ `PermissionsManager.ts` — fixed error handler returning wrong boolean
- ✅ `profile.tsx` — implemented Edit Profile modal (was dead code)
- ✅ All ESLint errors and warnings resolved (59 → 0)

---

## Remaining Work

See **[AUDIT_FINDINGS.md](./AUDIT_FINDINGS.md)** for the full audit report with priorities.

### High Priority (Security)
- [ ] Move Gemini API key to a Supabase Edge Function (currently exposed in client bundle)
- [ ] Switch civic photo uploads from `getPublicUrl` to signed URLs
- [ ] Replace OSRM demo server with production routing API

### Medium Priority (Features)
- [ ] Install Zustand for proper state management (replace god-context)
- [ ] Fix XP formula to match spec (`1 XP / 10m` distance-based)
- [ ] Implement stride-calibrated steps and weight-based calories
- [ ] Add notification architecture (currently only race widget exists)
- [ ] Implement Privacy Zones & account deletion (RA 10173 compliance)
- [ ] Build out Guild/Squad systems (currently mock data)
- [ ] Connect Calendar screen to real data (currently hardcoded)
- [ ] Connect Shop screen to gem system (currently non-functional)

### Low Priority (Quality)
- [ ] Set up `jest-expo` + `@testing-library/react-native` for unit tests
- [ ] Add accessibility labels to all interactive elements
- [ ] Add i18n framework (react-i18next) for Tagalog/Ibanag
- [ ] Batch polyline rendering on map for performance
- [ ] Add Sentry error monitoring for pilot

---

## Documentation

| Document | Contents |
|---|---|
| [aboutkarela.md](./aboutkarela.md) | Full project specification, algorithms, research framework, business model |
| [AUDIT_FINDINGS.md](./AUDIT_FINDINGS.md) | Codebase audit results, all findings, and priority action plan |
| [COMPUTATIONS.md](./COMPUTATIONS.md) | Algorithm computations and formulas |
| [AUDIT_CHECKLIST.md](./AUDIT_CHECKLIST.md) | Audit checklist |

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

*Pilot City: Tuguegarao City, Cagayan Valley, Philippines 🇵🇭*
