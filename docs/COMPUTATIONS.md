# Karela — Computations & Formula Reference

> Central reference for every algorithm, formula, and tuning constant in the Karela engines.
> Maps directly to the thesis components (RQ1, RQ2, RQ3).

---

## Table of Contents

1. [GPS Accuracy Layer](#1-gps-accuracy-layer)
2. [Distance Calculation (Haversine)](#2-distance-calculation-haversine)
3. [Adaptive Ghost Engine (RQ1)](#3-adaptive-ghost-engine-rq1)
4. [Civic Engine (RQ2)](#4-civic-engine-rq2)
5. [Resonance System (RQ3)](#5-resonance-system-rq3)
6. [RPG Economy](#6-rpg-economy)
7. [Civic Contribution Score](#7-civic-contribution-score)
8. [Tuning Constants Reference](#8-tuning-constants-reference)

---

## 1. GPS Accuracy Layer

**File:** `services/tracker/GpsKalmanFilter.ts`, `hooks/useLocationEngine.ts`

### 1.1 Kalman Filter (1-D, applied to lat & lng independently)

A stochastic 1-dimensional Kalman filter smooths noisy GPS by weighting each
measurement against the running estimate using GPS-reported accuracy.

**Prediction step** (uncertainty grows with elapsed time):
```
variance = variance + (Δt_ms × Q² / 1000)
```

**Kalman gain:**
```
K = variance / (variance + accuracy²)
```

**Update step:**
```
state    = state + K × (measurement − state)
variance = (1 − K) × variance
```

| Symbol | Meaning | Value |
|--------|---------|-------|
| `Q` | Process noise (m/s) — expected movement speed | 1.5 (walk) / 3 (run) / 5 (sprint), adaptive |
| `accuracy` | GPS horizontal accuracy (m, 1σ) | from device |
| `variance` | Estimate uncertainty (m²) | dynamic |
| `K` | Kalman gain ∈ [0,1] | 0 = ignore fix, 1 = trust fix fully |

**Adaptive process noise** (set per fix based on raw GPS speed):
```
Q = 5    if speed > 4 m/s   (sprinting)
Q = 3    if speed > 2 m/s   (running)
Q = 1.5  otherwise          (walking / stationary)
```

### 1.2 Measurement Pipeline (per GPS fix)

```
1. Display Gate:    reject if accuracy == null OR accuracy > 50 m  (map display)
2. Kalman Filter:   smooth (lat, lng) using accuracy as measurement noise
3. Strict Gate:     reject for path recording if accuracy > 20 m
4. Outlier Rejection:
     reject if distanceMoved < 2.5 m          (jitter while standing)
     reject if distanceMoved > 100 m          (GPS spike / teleport)
     reject if impliedSpeed > 12.5 m/s AND not vehicle  (faster than human)
5. Distance Accumulation: add distance only if (not vehicle) AND (pedometer active)
```

**Implied speed** (outlier check):
```
impliedSpeed = distanceMoved / Δt_seconds   (m/s)
```

### 1.3 Heading Fusion

```
heading = GPS course      if speed > 2 m/s   (GPS course is reliable when moving)
heading = magnetometer    otherwise          (low-pass filtered, α = 0.1)
```

**Magnetometer angle:**
```
angle = atan2(−x, y) × (180 / π)
if angle < 0: angle += 360
smoothed = prev + (angle − prev) × 0.1     (low-pass filter)
```

---

## 2. Distance Calculation (Haversine)

**Files:** `useLocationEngine.ts`, `AdaptiveGhostEngine.ts`, `statsService.ts`

Great-circle distance between two lat/lng points:

```
a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

| Symbol | Meaning | Value |
|--------|---------|-------|
| `φ` | latitude (radians) | — |
| `λ` | longitude (radians) | — |
| `R` | Earth radius | 6,371,000 m |
| `d` | distance | meters |

---

## 3. Adaptive Ghost Engine (RQ1)

**File:** `services/engines/AdaptiveGhostEngine.ts`

> **RQ1:** Does a dynamically decay-adjusted Ghost avatar produce statistically
> higher exercise adherence than a static personal-best Ghost?

### 3.1 Effort Decay Function (core formula)

Predicted pace at elapsed time `t`:
```
P(t) = P_baseline × e^(−λ × max(0, t − t_fatigue))
```

| Symbol | Meaning | Units |
|--------|---------|-------|
| `P(t)` | predicted pace at time t | m/s |
| `P_baseline` | sustainable baseline pace | m/s |
| `λ` (lambda) | individual decay rate | 1/s |
| `t_fatigue` | fatigue onset time | seconds |

- Before `t_fatigue`: pace holds at `P_baseline` (exponent = 0, e⁰ = 1).
- After `t_fatigue`: pace decays exponentially.

### 3.2 Rolling Aggregation (baseline pace)

Recency-weighted average across weekly pace profiles (4-week window):
```
P_composite = Σ(wᵢ × P_weekᵢ) / Σ(wᵢ)

wᵢ = e^(−α × weekIndex)
```

| Symbol | Meaning | Value |
|--------|---------|-------|
| `P_weekᵢ` | mean pace for week i | m/s |
| `wᵢ` | recency weight | — |
| `α` | recency decay rate | 0.15 |
| `weekIndex` | 0 = this week, 1 = last week, … | — |
| window | rolling window | 28 days |

### 3.3 Decay Parameter Fitting

For each historical run:
1. Segment into 1-minute pace segments.
2. Find **fatigue onset**: first segment where `pace < 0.9 × P_baseline`
   following a segment that was `≥ 0.9 × P_baseline`.
3. Estimate λ from decay segments via log-linear regression:
```
λ_est = −ln(P(t) / P_baseline) / (t − t_onset)
```
4. Average λ and t_fatigue across all runs.

**Clamps:**
```
0.001 ≤ λ ≤ 0.05
t_fatigue ≥ 120 s
default t_fatigue = 600 s (if no decay detected)
```

### 3.4 Synthetic Best Run (ghost generation)

Ghost runs slightly ahead of the user's predicted failure point:
```
ghost_pace(t) = P(t) × (1 + GHOST_AHEAD_FACTOR)
              = P(t) × 1.02
```
Ghost position is generated every 5 seconds, interpolated along a reference
route by cumulative distance.

### 3.5 Reinforcement Calibration (per-run feedback)

After each run, adjust the model using the observed vs. predicted delta:
```
performance_delta = (actual_pace − predicted_pace) / predicted_pace   (per segment)
avg_delta = mean(performance_delta)
```

**Baseline update:**
```
P_baseline_new = P_baseline × (1 + η × avg_delta)
```

**Lambda update:**
```
λ_new = λ × 1.05   if avg_delta < 0   (user fatigued faster → steeper decay)
λ_new = λ × 0.97   if avg_delta ≥ 0   (user held pace → gentler decay)
```

**Fatigue onset update:**
```
t_fatigue_new = t_fatigue + (fatigue_shift × η × 30)
```
where `fatigue_shift` counts segments where fatigue came earlier (−1) or
later (+1) than predicted.

| Symbol | Meaning | Value |
|--------|---------|-------|
| `η` (eta) | learning rate | 0.1 |

### 3.6 Model Confidence

```
confidence = min(1, runCount / 10)
```
Grows linearly to 1.0 at 10 runs.

### 3.7 Fallback Hierarchy

```
runs ≥ 3   → Adaptive Ghost (Synthetic Best Run)
runs 1–2   → Personal Best (static replay of best run)
runs = 0   → Ani Pacer (no ghost; UI prompts first run)
```

---

## 4. Civic Engine (RQ2)

**Files:** `services/engines/CivicEngine.ts`, `supabase/03_civic_engine.sql`

> **RQ2:** Does geospatial crowdsourcing with multi-user verification produce
> higher civic participation and lower false-report rates than flat single-submission?

### 4.1 Spatial Consensus (DBSCAN-inspired)

A pending node is promoted to **verified** when enough independent reporters
corroborate it within a spatial radius and time window:
```
verified  ⟺  COUNT(DISTINCT user_id) ≥ minPts
             WHERE ST_DWithin(report.location, node.location, ε)
               AND |report.time − node.time| ≤ T_window
               AND report.category = node.category
```

| Symbol | Meaning | Value |
|--------|---------|-------|
| `ε` (epsilon) | cluster radius | 25 m |
| `minPts` | minimum unique reporters | 3 |
| `T_window` | temporal window | 72 hours |

**Anti-gaming:** `COUNT(DISTINCT user_id)` ensures one user cannot self-verify.

### 4.2 Temporal Decay (confidence over time)

```
C(t) = C₀ × e^(−μ × (t − t_verified))
```

| Symbol | Meaning | Value |
|--------|---------|-------|
| `C(t)` | confidence at time t | 0–1 |
| `C₀` | initial confidence | 1.0 |
| `μ` (mu) | decay rate (per day) | category-specific |
| `t − t_verified` | days since last confirmation | days |

**Category-specific decay rates (μ):**

| Category | μ | Reasoning |
|----------|-----|-----------|
| `trash` | 0.15 | Cleared within days |
| `flooding` | 0.08 | Seasonal, variable |
| `drain_blockage` | 0.08 | Medium |
| `damaged_infrastructure` | 0.03 | Persists weeks/months |
| `unsafe_area` | 0.05 | Medium-slow |

### 4.3 Node Lifecycle

```
Pending ──(consensus)──> Verified ──(C < 0.5)──> Aging ──(C < 0.1)──> Expired
                            ↑                        |
                            └──── Reconfirmed ───────┘   (resets C = 1.0)

Pending ──(no consensus within 72h)──> Expired
```

Reconfirmation ("Still There?" tap) sets `last_confirmed = now()`, `C = 1.0`,
and resurrects aging nodes back to verified.

---

## 5. Resonance System (RQ3)

**File:** `services/engines/ResonanceSystem.ts`

> **RQ3:** Does a stamina-aware system that suppresses civic prompts during
> high-fatigue states (and surfaces them during low-intensity phases) improve
> combined engagement without degrading exercise performance?

### 5.1 Stamina Score

```
stamina_score(t) = 1 − normalized_fatigue_index(t)
```

**Fatigue estimation — model-based** (when decay model available):
```
performance_ratio = actual_pace / predicted_pace
fatigue = max(0, 1 − performance_ratio)
```

**Fatigue estimation — heuristic** (no model yet):
```
speed_ratio = current_speed / average_speed
fatigue = max(0, 1 − speed_ratio)
time_decay = min(0.5, elapsed_seconds / 6000)
fatigue = max(fatigue, time_decay)
```

### 5.2 Role Assignment

```
role = suppressed   if stamina < 0.2
role = vanguard     if cooldown OR stamina < 0.3
role = scout        if stamina ≥ 0.6
role = vanguard     otherwise (0.3 ≤ stamina < 0.6)
```

| Threshold | Value |
|-----------|-------|
| Scout threshold | 0.6 |
| Vanguard threshold | 0.3 |
| Suppression threshold | 0.2 |

### 5.3 Cooldown Detection

```
cooldown = (totalDistance ≥ 1000 m) AND (current_speed / avg_speed < 0.5)
```

### 5.4 Civic Load Factor

```
load = stamina_score
load = load × 1.2   if nearbyNodeCount > 0   (lower friction near nodes)
load = load × 1.5   if role == vanguard       (low-intensity = more capacity)
load = 0            if role == suppressed
load = clamp(load, 0, 1)
```

### 5.5 Route Deviation Rule

Ghost route may deviate toward a civic node only if:
```
deviate = (role ≠ suppressed)
        AND (deviationDistance ≤ 50 m)
        AND (civicLoadFactor ≥ 0.5)
```

---

## 6. RPG Economy

**Files:** `services/streakMultiplier.ts`, `services/gemSystem.ts`, `context/AuthContext.tsx`

### 6.1 Leveling

```
level_up requires exactly 1000 XP per level
displayed_progress = xp_current % 1000
```

On any XP gain that crosses the threshold:
```
while xp ≥ 1000:
    xp -= 1000
    level += 1
```

### 6.2 Streak Multiplier

```
XP_awarded = floor(XP_raw × multiplier)
```

| Streak (days) | Multiplier |
|---------------|------------|
| 1–3 | 1.0× |
| 4–6 | 1.2× |
| 7–13 | 1.5× |
| 14–29 | 2.0× |
| 30+ | 3.0× (cap) |

Breaking the streak resets to 1.0× immediately.
**Gems are NOT multiplied** (flat rate).

### 6.3 Gem Earnings

| Source | Gems |
|--------|------|
| Sector Bonus (per 500 m beating ghost) | 5 |
| B2B QR scan | 20 |
| Vanguard review | 10 |

**Sector calculation:**
```
total_sectors = floor(distance_meters / 500)
gems_earned = total_sectors × 5
```

### 6.4 Gem Sinks

| Item | Cost |
|------|------|
| Streak Freeze | 80 |
| Squad Shield | 200 |
| Territory Defense Boost | 150 |
| Cosmetic (basic) | 300 |
| Cosmetic (rare) | 600 |

**Seasonal cap:** gems above 500 convert to non-spendable Legacy Tokens.

### 6.5 Streak Calculation (from SQLite run dates)

```
1. Get unique calendar days with runs (strip time component)
2. If most recent run > 1 day before today → streak = 0 (broken)
3. Count consecutive days backwards from latest run until a gap
```

### 6.6 Calorie Estimate

```
calories ≈ distance_km × 60   (rough MET-based approximation)
```

---

## 7. Civic Contribution Score

**File:** `services/engines/CivicEngine.ts` → `calculateCivicScore()`

The primary thesis impact metric:
```
C = (XP_mission × S) + (V × CivicXP_base × B)
```

| Symbol | Meaning | Values |
|--------|---------|--------|
| `XP_mission` | distance-based XP (1 XP / 10 m) | — |
| `S` | streak multiplier | 1.0–3.0 |
| `V` | verification status | 0 / 0.5 / 1.0 |
| `CivicXP_base` | base per category | see below |
| `B` | Bayanihan buff | 1.0 / 1.5 (emergency) |

**CivicXP_base by category:**

| Category | Base |
|----------|------|
| trash | 100 |
| flooding | 150 |
| drain_blockage | 150 |
| damaged_infrastructure | 200 |
| unsafe_area | 175 |

**Design notes:**
- `V = 0.5` for partial (2/3 Vanguard) approval — partial credit, not zero.
- `XP_mission` is distance-only (not time) → slow walkers earn equal credit per meter.

### 7.1 Aggregate LGU Metrics

| Metric | Formula |
|--------|---------|
| Zone Civic Index (ZCI) | Σ C scores for all missions in a barangay zone |
| Disaster Response Velocity (DRV) | avg(time from Emergency activation → first verified Recovery Quest) |
| Community Coverage Rate (CCR) | % of zone users completing ≥1 Civic Quest during emergency |

---

## 8. Tuning Constants Reference

### GPS (`useLocationEngine.ts`)
| Constant | Value | Purpose |
|----------|-------|---------|
| `DISPLAY_ACCURACY_M` | 50 m | Max accuracy to show location on map |
| `ACCURACY_GATE_M` | 20 m | Max accuracy to record into run path |
| `JITTER_THRESHOLD` | 2.5 m | Min movement to register |
| `TELEPORT_THRESHOLD` | 100 m | Max plausible jump |
| `MAX_HUMAN_SPEED_MPS` | 12.5 m/s | Outlier speed rejection |
| `VELOCITY_CAP` | 35 km/h | Vehicle detection |
| `GPS_HEADING_MIN_SPEED` | 2 m/s | GPS course vs magnetometer |

### Adaptive Ghost (`AdaptiveGhostEngine.ts`)
| Constant | Value |
|----------|-------|
| `SEGMENT_DURATION_S` | 60 s |
| `MIN_RUNS_FOR_MODEL` | 3 |
| `ROLLING_WINDOW_DAYS` | 28 |
| `RECENCY_DECAY_ALPHA` | 0.15 |
| `LEARNING_RATE` | 0.1 |
| `MIN_LAMBDA` / `MAX_LAMBDA` | 0.001 / 0.05 |
| `DEFAULT_T_FATIGUE` | 600 s |
| `GHOST_AHEAD_FACTOR` | 0.02 |

### Civic (`CivicEngine.ts` / SQL)
| Constant | Value |
|----------|-------|
| `EPSILON_METERS` | 25 m |
| `MIN_REPORTS` | 3 |
| `TIME_WINDOW_HOURS` | 72 h |

### Resonance (`ResonanceSystem.ts`)
| Constant | Value |
|----------|-------|
| `SCOUT_THRESHOLD` | 0.6 |
| `VANGUARD_THRESHOLD` | 0.3 |
| `SUPPRESSION_THRESHOLD` | 0.2 |
| `COOLDOWN_SPEED_RATIO` | 0.5 |
| `COOLDOWN_MIN_DISTANCE` | 1000 m |

---

*This document should be updated whenever a formula or constant changes.
Last updated: June 29, 2026.*
