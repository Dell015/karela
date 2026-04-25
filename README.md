# Karela 🏃‍♂️🇵🇭
### *A Better You, One Quest at a Time.*

![Status](https://img.shields.io/badge/Status-Active_Development-brightgreen)
![Version](https://img.shields.io/badge/Version-3.0-blue)
![Stack](https://img.shields.io/badge/Stack-React_Native_%7C_Expo_%7C_Firebase_%7C_SQLite-orange)
![Platform](https://img.shields.io/badge/Platform-iOS_%7C_Android-lightgrey)
![License](https://img.shields.io/badge/License-All_Rights_Reserved-red)
![Pilot](https://img.shields.io/badge/Pilot_City-Tuguegarao%2C_Cagayan-green)

**Karela** is a lifestyle-optimization platform that gamifies physical movement and civic engagement for the Filipino context. It is designed not for the elite athlete, but for the everyday hero — the student commuting to school, the neighbor helping an elderly relative, and the volunteer organizing a community cleanup after a typhoon.

Unlike any other fitness app in the market, Karela bridges two worlds: **personal health data** and **real civic impact**. Every step logged, every quest completed, and every community task verified flows into a unified system that rewards consistency, builds social accountability, and generates measurable data for local governments during disaster response.

> **Core Philosophy:** Consistency over Intensity. A user who walks 30 minutes every day for a year contributes more to their health and their community than one who runs a marathon once.

---

## Table of Contents

1. [The Vision](#the-vision)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [RPG Mechanics](#rpg-mechanics)
5. [Sensor Fusion & Anti-Cheat](#sensor-fusion--anti-cheat)
6. [Onboarding & The First 7 Days](#onboarding--the-first-7-days)
7. [Social Infrastructure](#social-infrastructure)
8. [The Bayanihan Protocol](#the-bayanihan-protocol)
9. [Data Privacy & RA 10173 Compliance](#data-privacy--ra-10173-compliance)
10. [Monetization](#monetization)
11. [Notification Architecture](#notification-architecture)
12. [Accessibility](#accessibility)
13. [Database Schema](#database-schema)
14. [Civic Contribution Score](#civic-contribution-score)
15. [KPIs & Success Metrics](#kpis--success-metrics)
16. [Competitive Analysis](#competitive-analysis)
17. [Roadmap](#roadmap)
18. [Creator](#creator)

---

## The Vision

Karela transforms the Filipino *Bayanihan* spirit — the cultural value of communal unity — into a digital engine for health and civic progress. It is simultaneously:

- A **thesis project** demonstrating that gamification produces measurable civic behavior change
- A **startup** competing in the Philippine startup ecosystem
- A **personal portfolio** project showcasing full-stack mobile engineering

**Target Users:**

| Persona | Profile | Pain Point | Karela's Answer |
|---|---|---|---|
| 🏃 "The Resilient Commuter" (Juan) | 22–35 y/o, mid-range Android, prepaid data, Tuguegarao or Metro Manila | High daily walking but feels like wasted effort | Converts the existing commute into XP, Gems, and civic pride |
| 🎓 "The Civic Student" (Sita) | 18–22 y/o, campus Wi-Fi, active in school orgs | Wants to volunteer but has no structured rewarding platform | Guild leaderboards for social status; Vanguard role for recognition |
| 🏛️ "The LGU Coordinator" (Mang Ben) | 35–55 y/o, DRRMO or Barangay official | No digital system to coordinate verified volunteer activity during emergencies | Real-time volunteer heatmap, verified task data, exportable civic reports |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend & Dev | React Native + Expo | SDK 51+ | Unified cross-platform codebase with hot-reloading and sensor testing |
| Local Database | expo-sqlite | v14+ | Offline mission caching, run telemetry, high-frequency data logging |
| Cloud Backend | Firebase Firestore | v10+ (modular) | Real-time source of truth for user profiles, RPG stats, Guild sync |
| Authentication | Firebase Auth | OAuth2 + JWT | Secure Google/Email login; persistent local session management |
| Media Storage | Firebase Storage | Rules v2 | Encrypted repository for Proof of Impact photos |
| Maps & Geo | react-native-maps | v1.10+ | Apple Maps (iOS) and Google Maps (Android) for battery-efficient rendering |
| Weather API | OpenWeatherMap | v3.0 One Call | Environmental context for Ani's mission engine |
| AI Dialogue | Gemini Flash | gemini-1.5-flash | Lightweight LLM for personalized Ani coaching messages |
| State Management | Zustand | v4+ | Lightweight global state for session and RPG data |
| Navigation | React Navigation | v6+ | Stack + Tab navigation with deep linking |
| Push Notifications | Expo Notifications | SDK 51+ | Streak alerts, Squad events, Bayanihan Protocol alerts |

---

## Architecture

Karela uses a **Local-First, Cloud-Sync** architecture — a deliberate design for the Philippine market where mobile data is expensive, 4G coverage is inconsistent in peri-urban areas, and users frequently operate on prepaid data promos.

### The Dual-Engine Stack

```
┌─────────────────────────────────────────────────────────┐
│                     USER DEVICE                          │
│                                                         │
│  ┌─────────────────┐      ┌──────────────────────────┐  │
│  │  SQLite (Local) │      │   React Native App UI    │  │
│  │                 │      │                          │  │
│  │ • Raw GPS logs  │◄────►│ • RPG HUD & Map          │  │
│  │ • Step counts   │      │ • Ghost distance meter   │  │
│  │ • Ghost routes  │      │ • Quest feed             │  │
│  │ • Pending PoI   │      │ • Ani dialogue           │  │
│  │ • Offline quests│      └──────────────────────────┘  │
│  └────────┬────────┘                                     │
│           │ Sync on connectivity restored                │
└───────────┼─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                  FIREBASE (CLOUD)                        │
│                                                         │
│  Firestore: User profiles, XP/Level, Guild state        │
│  Firebase Storage: PoI photos (encrypted)               │
│  Firebase Auth: Session management                       │
│  Cloud Functions: Sync reconciliation, fraud detection  │
└─────────────────────────────────────────────────────────┘
```

### Offline Sync & Conflict Resolution (Timestamp-Sequence Reconciliation)

When a user completes a run or mission offline, SQLite logs every event with a high-precision ISO 8601 timestamp and a UUID. When connectivity is restored:

1. The client sends its local event sequence to a Cloud Function
2. The function compares timestamps against the Firestore state
3. **Mission completions: local wins** — a user who completed a quest offline is never penalized for poor connectivity
4. **XP/Gem balances: server recalculates** from the event log — not from the client total — preventing local manipulation
5. **Streak continuity: local timestamp honored** — if the device shows completion before midnight, the streak is preserved regardless of when the sync arrives
6. **Idempotency: all events carry a UUID** — duplicate sync attempts are silently discarded

---

## RPG Mechanics

### XP, Leveling & The Momentum Multiplier

Every user needs exactly **1,000 XP to level up** — at every level. The UI displays progress as `XP % 1000`. This makes progression clear and infinitely scalable without power creep.

The Streak Multiplier rewards consistency:

| Streak Window | XP Multiplier |
|---|---|
| Day 1–3 | 1.0x (baseline) |
| Day 4–6 | 1.2x |
| Day 7–13 | 1.5x |
| Day 14–29 | 2.0x |
| Day 30+ | **3.0x (Consistency Cap)** |

Breaking a streak resets the multiplier to 1.0x immediately — creating a meaningful psychological incentive to maintain the habit.

### The Ghost System (Asynchronous Specter)

The Ghost is a data-shadow of the user's personal best on a given route, used for real-time pacing comparison.

**Route matching** is dynamic — not pre-mapped. A route is identified by a bounding box hash with ±50m tolerance. Two runs are considered the same route if their bounding boxes overlap by at least 70%.

**Ghost data model:**
```
ghost_routes table (SQLite)
├── route_id         → Bounding box hash (TEXT PRIMARY KEY)
├── best_time_seconds
├── best_distance_m
├── waypoints_json   → [{lat, lng, elapsed_seconds}] sampled every 5 seconds
├── achieved_at      → ISO 8601 timestamp
└── synced_to_cloud  → 0 or 1 (top 10 routes synced to Firestore)
```

**Fallback hierarchy (when no personal best exists):**

1. **Personal Ghost** — user's own best time (always preferred)
2. **Squad Ghost** — best time by any Squad member on this route (opt-in)
3. **Community Ghost** — median pace of all users in the same Level band (±3 levels) on similar route lengths
4. **Ani Pacer** — a generated "Beginner Ghost" based on the onboarding fitness assessment, targeting 10% above comfortable walking pace

**UI rendering:**
- 🟢 Green pulsing dot = user is **ahead** of Ghost
- 🔴 Red pulsing dot = user is **behind** Ghost
- Live HUD: *"Ghost is 42m behind you"* or *"You are 18m behind Ghost"*
- Every 500m segment = a **Sector**. Beating the Ghost in a sector awards **5 Gems**.

### The Dual Currency Economy

| Property | XP | Gems |
|---|---|---|
| Primary Source | Distance (1 XP / 10m) + mission bonus | Sector Bonuses (5), B2B scans (20), Vanguard reviews (10) |
| Multiplied By | Streak Multiplier (1.0x–3.0x) | Flat rate — not multiplied |
| Spendable? | Never | Yes |
| Primary Use | Leveling, Vanguard eligibility | Streak Freezes, Squad Shields, cosmetics |

**Gem sinks (preventing inflation):**
- Streak Freeze: **80 Gems** — protects streak for 1 day
- Squad Shield: **200 Gems** — pooled by Squad to protect a teammate
- Territory Defense Boost: **150 Gems** — 1.2x Guild distance multiplier for 24 hours
- Map Trail Cosmetics: **300–600 Gems** — permanent visual customizations
- **Seasonal cap:** Gems above 500 at season-end convert to non-spendable Legacy Tokens. This hard-caps the max advantage any user can accumulate.

---

## Sensor Fusion & Anti-Cheat

### Outdoor Mode — The Double Lock

Movement is recorded only when two independent signals agree:

1. **GPS Displacement** — net movement of at least 3 meters between consecutive 2-second samples
2. **Accelerometer Cadence** — rhythmic oscillation consistent with walking (1.5–3.5 Hz) or running (2.5–4.5 Hz)

GPS movement without accelerometer cadence (e.g., a car ride) is flagged. Accelerometer cadence without GPS displacement triggers an Indoor Mode prompt.

### Indoor Mode — Treadmill & Indoor Walking

- **Step Detection:** Accelerometer sampled at 50Hz. Peak-detection identifies each step via Z-axis acceleration signature (heel strike peak + toe-off secondary peak)
- **Stride Calibration:** 20-step calibration walk on first use. `Stride Length = GPS distance / step count`. Refined over time via moving average stored in SQLite
- **Distance:** `Distance = Step Count × Stride Length`

### The Integrity Filter — Anti-Cheat

| Detected Pattern | Signal | Action |
|---|---|---|
| Phone shaking in place | G-force >4G, no net displacement, irregular frequency | Data discarded; no XP awarded |
| Vehicle movement | GPS speed >25 km/h sustained >30 seconds | Auto-pause; user prompted to confirm mode |
| GPS teleportation | GPS jumps >500m in a 2-second interval | Waypoint discarded; no XP for that interval |
| Stationary GPS jitter | Displacement <3m over 10s despite accelerometer inactivity | Data discarded; run paused after 60s |

---

## Onboarding & The First 7 Days

The cold start problem is Karela's most critical UX challenge: a new user has no Ghost, no Squad, no Guild, and no streak. The First 7 Days protocol ensures every new user feels rewarded within their first **5 minutes**.

### First 5 Minutes Flow

1. **Ani greets the user** with a context-aware, time-of-day message (*"Good morning, Juan! Tuguegarao looks clear today — perfect for your first quest."*)
2. **60-second fitness calibration** — 3 questions: fitness level, preferred activity time, primary motivation (Health / Community / Social)
3. **Immediate first quest** — Ani assigns a 500m walk. No tutorial video. It starts now.
4. **Permission grants** with plain-language justifications tied to specific features
5. **Welcome Bonus** — completing the 500m walk earns 100 XP + 20 Gems. The level bar jumps visibly. Ani comments.

### The 7-Day Guided Quest Arc

| Day | Quest | Goal |
|---|---|---|
| 1 | *First Step* — 500m walk | Prove the app works. Seeds the first Ghost. |
| 2 | *Neighborhood Scout* — 1km, map 3 landmarks | Introduce the map layer. Unlock Squad invites. |
| 3 | *The Daily Route* — repeat Day 1 route | Introduce Ghost concept. First Sector Bonus eligible. |
| 4 | *Community Eye* — photo a local issue (pothole, drain) | Introduce Bayanihan mechanic gently. +50 Gems. |
| 5 | *Squad Up* — invite 1 person or join a Squad | Unlock social layer. 'Founding Member' badge if new Squad. |
| 6 | *The Push* — beat Day 3 Ghost by any margin | Introduce competitive self-improvement. 1.2x preview. |
| 7 | *Week Warrior* — complete any 1km+ mission | Earn first streak milestone. **1.5x multiplier unlocked.** |

On Day 7, Ani delivers a personalized shareable summary card — organic marketing built into the onboarding loop.

---

## Social Infrastructure

### Squads (3–12 Members) — The Inner Circle

Small accountability groups. The primary social unit.

**Formation:** Any Level 2+ user can create a Squad. Discovery is via geographic proximity (majority of members within 5km) or mutual friend suggestion.

**The Collective Shield — Karela's signature Bayanihan mechanic:**

When a Squad member's streak is at risk (less than 6 hours left in the day, no mission completed):

1. All Squad members receive: *"Juan's 14-day streak is at risk! Help him out?"*
2. Any member can contribute Gems toward a Shield (total cost: **200 Gems**, splittable among members)
3. The Shield freezes Juan's streak for 24 hours — at no cost to Juan's own Gem balance
4. Protected member receives: *"Your Squad has your back! Maria, Carlo, and 2 others protected your streak."*

**Squad Vision:** Optional real-time location sharing (opt-in, revocable anytime) shows active Squad runners on the map.

### Guilds (50+ Members) — The Regional Force

Large regional organizations competing for landmark territory.

**Territory Quest Specification:**

| Property | Detail |
|---|---|
| Zone Definition | 250m radius circle around a landmark's GPS coordinate |
| Scoring Period | Monthly — resets 1st of each month at 00:00 local time |
| Scoring Metric | Total verified distance (km) by Guild members whose GPS tracks pass through the zone |
| Tie-Breaking | Higher member count → earlier first entry into zone |
| Ownership Display | Winning Guild's banner (color + name) renders on the map for the following month |
| Mid-Month Contest | A landmark can be challenged if a Guild logs 150% of the leader's distance in a single week |
| Inactive Forfeiture | Zero activity in the zone for 14 consecutive days → landmark becomes Unclaimed |

**Guild Badges & Permanent Buffs:**

| Badge | Threshold | Buff |
|---|---|---|
| Pioneer | First landmark claim | +2% XP for all members for 30 days |
| Century Walkers | 1,000 km total Guild distance | +5% Gem earning rate (permanent) |
| The Vanguard Guild | 10 Vanguard-level members | +10% PoI approval speed (permanent) |
| Bayanihan Heart | 50 verified Civic Quests | Exclusive Guild map theme |
| Iron Streak | Every member maintains a 7-day streak simultaneously | 500 Gems split equally among members |

---

## The Bayanihan Protocol

The feature that fundamentally differentiates Karela from every fitness app in the global market. It transforms the platform from a personal health tool into **civic infrastructure** — a verified volunteer coordination system that generates real data for local governments.

### The Safety Hard-Lock — Ani as the Ethical Gatekeeper

Karela must never be the reason a user puts themselves in danger.

| Tier | Trigger | App Behavior |
|---|---|---|
| Tier 0: Normal | No weather advisory; no admin flag | All features active |
| Tier 1: Watch | Wind >40 km/h OR rainfall >10mm/hr | Outdoor missions flagged with caution. Ani suggests indoor alternatives. |
| Tier 2: Warning | PAGASA Signal 2–3 OR admin Pre-Disaster | Outdoor missions suspended. Only indoor Preparation Quests active. Ghost paused. Emergency banner. |
| Tier 3: Hard Lock | PAGASA Signal 4–5 OR admin Emergency Lock | **All movement rewards disabled.** GPS tracking suspended. Only Safety Check-in and Request Assistance visible. Gems awarded for staying safe. |
| Tier 4: Recovery | Admin marks zone Yellow or Green | Recovery Quests unlock in cleared zones only. PoI required for all civic missions. |

> **PAGASA Integration Note:** PAGASA does not currently provide a public REST API. Tier 2–4 escalation is a hybrid system: OpenWeatherMap handles Tier 0–1 automatically; a Karela Admin or verified LGU coordinator manually escalates to Tier 2–4 using official PAGASA bulletins. A PAGASA webhook partnership is a Phase 4 roadmap milestone.

### Quest Timeline — Before vs. After

**Phase A: Preparation Quests (24–72 hours before event)**

| Quest | Description | Proof Required |
|---|---|---|
| Clear the Drainage | Clean the gutter in front of your home or street | Before/After photo |
| The Supply Run | Help an elderly neighbor buy 3 days of water/canned goods | Receipt photo + neighbor confirmation QR |
| Home Fortify | Help 3 neighbors install window shutters | Group photo with visible shutters |
| Evacuation Route Scout | Walk and photograph the official barangay evacuation route | GPS-tagged photo trail |

**Phase B: Recovery Quests (post-event, cleared zones only)**

| Quest | Description | Proof Required |
|---|---|---|
| Debris Clearing | Clear fallen branches from a public sidewalk | Before/After GPS-tagged photo |
| Information Scout | Report passability of a specific bridge/road | Photo + GPS (feeds LGU dashboard) |
| Relief Hub Support | Help sort goods at an evacuation center | Node Master QR at arrival + departure |
| Wellness Check | Visit 3 vulnerable neighbors to confirm safety | In-app tap-to-confirm from each neighbor |
| Water Source Report | Report status of a community water source | GPS-tagged photo (feeds LGU water map) |

### Proof of Impact — Multi-Factor Verification

1. **In-App Camera Only** — gallery uploads are blocked to prevent submission of old photos
2. **Before & After Split-Screen** — dual-capture enforced for cleanup and fortification quests
3. **Metadata Fingerprint** — every photo tagged with exact GPS, altitude, device ID, and a **server-generated timestamp** (not device clock)
4. **Vanguard Blind Audit** — 3 independent Vanguards from outside the submitter's Guild must all approve before XP and Gems are released
5. **Node Master QR (major missions)** — dynamic QR rotating every 15 minutes; scanned at arrival and departure to verify presence and duration

### The Vanguard System

**Becoming a Vanguard:**

| Requirement | Specification |
|---|---|
| Minimum Level | Level 15 (~90–120 days of consistent use) |
| Civic XP Threshold | 500 Civic XP from personal Bayanihan completions |
| Clean Record | Zero Black Marks in past 90 days |
| Application | Automatic eligibility notification — voluntary acceptance, no form required |
| Regional Cap | Max 1 Vanguard per 50 active users in a zone |

**Anti-Collusion Governance:**
- Blind assignment — Vanguards never review submissions from their own Guild or Squad
- Geographic separation — submissions assigned to Vanguards in a different barangay wherever possible
- 2/3 split triggers a 4th Vanguard as tiebreaker
- Fraud Ring Detection — if 3 socially-connected Vanguards all approve the same submission, it is auto-flagged for admin review
- Vanguards with Review Accuracy Score below 70% are temporarily suspended

---

## Data Privacy & RA 10173 Compliance

Karela is fully designed to comply with the **Philippine Data Privacy Act of 2012 (Republic Act 10173)** and its Implementing Rules and Regulations.

### Data Minimization

| Data Type | How Karela Minimizes Collection |
|---|---|
| Raw GPS Coordinates | Processed on-device only. Only mission check-in coordinates (start, end, zone entry) sent to Firestore — not the full trail. |
| Accelerometer Data | Never stored or transmitted. Discarded after real-time step counting and anti-cheat detection. |
| PoI Photos | Stored in Firebase Storage with restricted access rules. Only the owner and assigned Vanguards can access a specific photo. |
| Location History | Leaderboards show total distances and Level only — never location data. |
| Device Identifiers | Used only for Ghost restoration and fraud ring detection. Never shared with B2B partners. |

### User Privacy Controls
- **Privacy Zones:** Up to 5 "Blur Zones" (100m radius) around any location. GPS trails inside these zones are never stored — not even in SQLite.
- **Location Sharing:** Squad Vision is opt-in, off by default, revocable at any time.
- **Data Deletion:** Full account deletion within 72 hours of request, per RA 10173.
- **Consent:** All permissions granted with plain-language justifications; revocable at OS level without account penalty.

### B2B Partner Data Policy
Partners **receive:** aggregate foot traffic counts, voucher redemption counts, time-of-day visit distribution.

Partners **never receive:** individual user names, IDs, GPS trails, movement history, Level, Squad membership, or any personally identifiable information.

---

## Monetization

### Revenue Stream 1 — Local Hero (B2B Quest Nodes)

SMEs pay a monthly subscription to become a gamified destination on the Karela map.

| Tier | Monthly Fee | Features |
|---|---|---|
| Starter Node | ₱500/mo | Single map pin, 1 QR code, monthly aggregate foot traffic report |
| Active Node | ₱1,500/mo | Highlighted pin with logo, weekly reports, 1 featured Double XP promo/month |
| Anchor Node | ₱3,500/mo | Premium placement, real-time dashboard, unlimited promos, priority in Ani's mission suggestions |

**Anti-Fraud QR Specification:**
- **Dynamic Rotating QR** — regenerates every 15 minutes with a time-bound, single-use token
- **Geofence Confirmation** — GPS must be within 50m of the Quest Node coordinate at moment of scan
- **Single-Use Token** — duplicate scans (screen sharing, photos) are rejected server-side

### Revenue Stream 2 — The Scout Pass (Seasonal Subscription)

90-day seasonal battle pass at **₱149/season**.

Benefits: exclusive Ani skins, rare map trail cosmetics, +20% Gems from Sector Bonuses, early access to new quest types, season badge.

All cosmetics earned are **permanent** — users keep their content when the season ends. Only the +20% Gem rate expires.

### Revenue Stream 3 — LGU / NGO White-Label (B2G)

If B2B Quest Node adoption is slow, Karela pivots to licensing its volunteer coordination infrastructure to Local Government Units and NGOs.

Pricing: **₱15,000–₱50,000/year** depending on LGU population size.

This is the primary thesis for Karela's institutional sustainability — once an LGU coordinates a disaster response through Karela, it becomes civic infrastructure that is very difficult to replace.

---

## Notification Architecture

| Notification | Trigger | Timing | Example |
|---|---|---|---|
| Daily Mission Reminder | No app open by preferred activity time | Within 30 min of preferred time | *"Hey Juan, your 14-day streak is waiting. Just 10 minutes is all it takes."* |
| Streak at Risk | <3 hours left in day, no mission done | 3 hours before midnight | *"Emergency! Your streak ends in 3 hours. A quick 5-minute walk counts."* |
| Squad Shield Alert | Squad member's streak is at risk | Same as streak-at-risk | *"Maria's 21-day streak is at risk. Your Squad can save it with a Shield."* |
| Streak Freeze Reminder | User has unused freezes and streak is at risk | 2 hours before midnight | *"You have 2 Streak Freezes saved. Use one now?"* |
| Territory Alert | Rival Guild within 80% of your territory distance | Checked hourly | *"Cagayan Runners Guild is closing in on your territory at Tuguegarao Plaza."* |
| Bayanihan Protocol | Emergency Mode activated | Immediate, high-priority | *"IMPORTANT: Bayanihan Protocol is now active for Cagayan Valley."* |
| Weekly Summary | Every Sunday, 6:00 PM | Fixed schedule | Ani: *"Your Week in Review — X km walked, X quests completed, Day X streak."* |

**Fatigue Prevention:**
- Quiet Hours window (default 10 PM – 7 AM) — only emergency alerts pass through
- Squad activity notifications are batched (max once per day)
- Low-engagement users auto-downgrade to 1 daily summary only

---

## Accessibility

### Physical Accessibility
Non-running users can participate fully through:
- Civic Intelligence Quests (photographing/reporting local issues from any position)
- Vanguard review work (entirely sedentary)
- Community Wellness Checks and Relief Hub Support
- Indoor Mobility Quests (step-count based targets, not distance)

**Roadmap — Phase 3:** A dedicated "Community Hero" mode for users with limited mobility, replacing all distance-based XP with task-based flat XP per civic action.

### Visual Accessibility
- Ghost system red/green color coding is **supplemented by shape** (circle = ahead, triangle = behind) — no information is conveyed by color alone
- OS-level text size settings are respected throughout
- High-contrast map theme available for low-vision users

### Language & Literacy
- **Launch:** English primary interface
- **Phase 2:** Filipino (Tagalog) localization
- **Phase 3:** Ibanag localization for the Tuguegarao pilot market
- Core actions (Start Run, Complete Quest, Check In Safe) are accessible via large icon-based buttons — no reading required

---

## Database Schema

### Firestore Collections (Cloud)

<details>
<summary><strong>users/{userId}</strong></summary>

```
uid                   String    Firebase Auth UID
display_name          String
level                 Integer   RPG level (1–∞)
xp_total              Integer   Lifetime XP (never decreases)
xp_current_level      Integer   xp_total % 1000
gems                  Integer   Spendable Gem balance
streak_current        Integer   Days in current streak
streak_longest        Integer   Lifetime longest streak
streak_freeze_count   Integer   Unused Streak Freezes
squad_id              String?   Reference to squads/{id}
guild_id              String?   Reference to guilds/{id}
is_vanguard           Boolean
vanguard_accuracy     Float     0.0–1.0 review accuracy
civic_xp              Integer   Separate civic XP pool
privacy_zones         Array     [{lat, lng, radius_m}] up to 5
notification_prefs    Map       Quiet hours, toggles per type
preferred_time        String    'morning' | 'afternoon' | 'evening'
scout_pass_active     Boolean
scout_pass_season     String    e.g. '2026-Q2'
```
</details>

<details>
<summary><strong>missions/{missionId}</strong></summary>

```
mission_id            String    UUID
type                  String    'run' | 'civic' | 'preparation' | 'recovery'
title                 String
assigned_to_uid       String
assigned_by           String    'ani' | 'admin' | 'guild'
status                String    'active' | 'completed' | 'expired' | 'pending_verification'
xp_reward             Integer   Base XP before multiplier
gem_reward            Integer
requires_poi          Boolean
poi_submission_id     String?
completed_at          Timestamp?   Server-side
expires_at            Timestamp    Typically 24h from assignment
```
</details>

<details>
<summary><strong>squads/{squadId} / guilds/{guildId} / poi_submissions/{id}</strong></summary>

```
-- squads --
squad_id              String    UUID
name                  String
is_private            Boolean
member_uids           Array     Max 12
gem_pool              Integer   Pooled Gems for Collective Shields
area_tag              String?

-- guilds --
guild_id              String    UUID
name                  String
banner_color          String    Hex
member_uids           Array     50+ for active status
total_distance_km     Float     Lifetime cumulative
territories_owned     Array     Landmark IDs currently claimed
badges                Array     Earned badge IDs
gem_reserve           Integer   For Territory Defense Boosts

-- poi_submissions --
submission_id         String    UUID
mission_id            String
submitted_by_uid      String
photo_urls            Array     Firebase Storage URLs (before/after)
gps_lat / gps_lng     Float     Server-side tagged coordinates
server_timestamp      Timestamp Not device clock
vanguard_reviews      Array     [{vanguard_uid, decision, reviewed_at}]
status                String    'pending' | 'approved' | 'rejected' | 'flagged'
```
</details>

### SQLite Tables (On-Device)

<details>
<summary><strong>run_sessions / gps_waypoints / ghost_routes / pending_missions</strong></summary>

```sql
-- run_sessions --
session_id        TEXT PRIMARY KEY   UUID generated at run start
mission_id        TEXT
status            TEXT               'active' | 'completed' | 'synced'
started_at        TEXT               ISO 8601
ended_at          TEXT
total_distance_m  REAL
total_steps       INTEGER
mode              TEXT               'outdoor' | 'indoor'
ghost_route_id    TEXT
xp_earned_raw     INTEGER            Before multiplier
gems_earned       INTEGER
sync_status       TEXT               'pending' | 'synced' | 'failed'

-- gps_waypoints --
waypoint_id       INTEGER PRIMARY KEY AUTOINCREMENT
session_id        TEXT               FK → run_sessions
latitude          REAL
longitude         REAL
altitude_m        REAL
accuracy_m        REAL
recorded_at       TEXT               ISO 8601
is_privacy_zone   INTEGER            1 = inside blur zone, never synced

-- ghost_routes --
route_id          TEXT PRIMARY KEY   Bounding box hash
best_time_seconds INTEGER
best_distance_m   REAL
waypoints_json    TEXT               [{lat, lng, elapsed_seconds}] @ 5s intervals
achieved_at       TEXT
synced_to_cloud   INTEGER            0 or 1

-- pending_missions --
mission_id        TEXT PRIMARY KEY   Matches Firestore ID
type              TEXT
title             TEXT
xp_reward         INTEGER
gem_reward        INTEGER
requires_poi      INTEGER            0 or 1
expires_at        TEXT
cached_at         TEXT
```
</details>

---

## Civic Contribution Score

The **Civic Contribution Score (C)** is the primary measurable thesis metric — a per-user, per-mission score that aggregates into LGU-level impact reports.

### Formula

```
C = (XP_mission × S) + (V × CivicXP_base × B)
```

| Variable | Description |
|---|---|
| `XP_mission` | XP from distance component (1 XP / 10m — normalizes pace, not speed) |
| `S` | Streak Multiplier (1.0x–3.0x) — rewards consistent contributors |
| `V` | Verification Status: 0 = unverified, 0.5 = partial (2/3 Vanguards), 1.0 = fully verified |
| `CivicXP_base` | Fixed base per mission type (Debris Clearing = 200, Info Scout = 150, etc.) |
| `B` | Bayanihan Buff: 1.0x baseline, up to 1.5x during Emergency Mode |

**Why this formula is defensible:**
- The slow-walker problem is resolved — XP_mission is distance-only, not time-based
- The binary V problem is resolved — partial verification gives 50% civic credit, not zero
- The streak multiplier on civic missions is intentional — a 30-day consistent user is a more reliable civic contributor than a one-time volunteer

### Aggregate LGU Metrics

| Metric | Description |
|---|---|
| Zone Civic Index (ZCI) | Sum of all C scores for missions in a barangay zone — shows LGU where volunteer activity was concentrated |
| Disaster Response Velocity (DRV) | Average time from Emergency Mode activation to first verified Recovery Quest in a zone |
| Community Coverage Rate (CCR) | % of registered users in a zone who completed at least 1 Civic Quest during an emergency window |

---

## KPIs & Success Metrics

| KPI | Phase 1 Target | Phase 3 Target |
|---|---|---|
| Day 7 Retention | 40% complete the 7-day arc | 55%+ |
| Day 30 Retention | 20% reach a 30-day streak | 30%+ |
| Daily Active Users (DAU) | 500 in Tuguegarao | 10,000 multi-city |
| Ghost Usage Rate | 60% of run sessions load a Ghost | 70%+ |
| Squad Formation Rate | 30% join/create a Squad within 14 days | 50%+ |
| Civic Quest Participation | 25% of active users complete 1 civic quest/month | 40%+ |
| PoI Approval Rate | 70% pass Vanguard review | 80%+ |
| B2B Quest Node Partners | 5 partners in Tuguegarao by Phase 3 | 50 nodes across 3 cities |
| Average Session Length | 18 minutes | 22 minutes |

---

## Competitive Analysis

| Feature | Strava / MapMyRun | Karela |
|---|---|---|
| Primary Goal | Athletic performance | Daily consistency & civic utility |
| Target User | Runners, cyclists, athletes | Everyday Filipino commuters & students |
| Data Usage | High (constant GPS sync) | Optimized (SQLite batch sync) |
| Offline Function | Limited | Full, with seamless cloud sync |
| Motivation Model | Competitive leaderboards | Bayanihan group success |
| Civic Integration | None | Full Bayanihan Protocol + LGU data |
| Disaster Response | None | Emergency Mode with Civic Quest prioritization |
| B2B Monetization | None | Quest Nodes + LGU White-Label |
| Low-end Device Support | Poor | Excellent (SQLite-first, low RAM footprint) |
| Philippine Market Fit | Low | Built specifically for PH context |

**The Defensible Moat:** Once a Guild claims a local landmark, it becomes a social anchor for the entire local user base. Every new user in Tuguegarao sees their neighbors' Guild Banners on the map — a local network effect that global apps cannot replicate because they have no mechanism for hyper-local territorial ownership.

---

## Roadmap

- [x] System Specification v3.0 (this document)
- [ ] **Phase 1 — Foundation** *(Month 1–3)*
  - Mirror Run (GPS + Accelerometer sensor fusion)
  - Ghost System with fallback hierarchy
  - SQLite offline logging + Firebase sync (TSR model)
  - Ani weather logic (OpenWeatherMap integration)
  - XP / Streak / Gem system
  - First 7-Day onboarding arc
  - **Gate:** 500 DAU in Tuguegarao; 40% Day-7 retention
- [ ] **Phase 2 — Social Release** *(Month 4–6)*
  - Squad system + Collective Shield mechanic
  - Guild formation + Territory Quests
  - Squad Vision (opt-in live location sharing)
  - Full notification architecture
  - **Gate:** 30% of users in a Squad; 5 active Guilds; 10 landmarks claimed
- [ ] **Phase 3 — The Impact** *(Month 7–9)*
  - Bayanihan Protocol (all 5 tiers)
  - PoI camera + metadata fingerprinting
  - Vanguard program launch
  - B2B Quest Node pilot (5 Tuguegarao businesses)
  - Admin Panel for LGU coordinators
  - Community Hero accessibility mode
  - **Gate:** 5 B2B partners; 1 LGU MOU signed; 25% civic quest participation
- [ ] **Phase 4 — Scale** *(Month 10–12)*
  - Multi-city expansion (Cauayan, Santiago City)
  - Ibanag localization (partnership with Cagayan State University)
  - PAGASA webhook partnership
  - LGU White-Label product launch
  - Scout Pass Season 1
  - **Gate:** 3 LGU partners; ₱50k MRR; 10,000 DAU across Cagayan Valley

---

## Creator

**Randel Serafica**
*Lead Developer & Architect*

Built for the Philippine startup ecosystem, as a thesis submission, and as a personal portfolio project demonstrating full-stack mobile engineering with a real social impact thesis.

*Pilot site: Tuguegarao City, Cagayan Valley, Philippines.*

---

> **Karela** — *Building a resilient Philippines, one step at a time.* 🇵🇭

---

*© 2026 Randel Serafica. All rights reserved. This project is part of a personal mega-project, thesis, and startup competition entry.*
