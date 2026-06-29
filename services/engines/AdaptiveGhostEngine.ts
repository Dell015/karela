/**
 * ============================================================
 * ADAPTIVE GHOST ENGINE — Karela Running Engine Core
 * ============================================================
 *
 * Thesis Component: Effort Decay Function + Rolling Aggregation + Reinforcement Calibration
 * Research Question (RQ1): "Does a dynamically decay-adjusted Ghost avatar produce
 *   statistically higher exercise adherence than a static personal-best Ghost?"
 *
 * Architecture:
 * 1. Rolling Aggregation: Computes a stable baseline pace from 4 weeks of data
 * 2. Effort Decay Model: Fits a per-user fatigue curve (λ, t_fatigue)
 * 3. Synthetic Best Run: Generates ghost waypoints from the model (not from any single run)
 * 4. Reinforcement Calibration: Adjusts the model after each new run
 *
 * Key Formula:
 *   P(t) = P_baseline × e^(−λ × max(0, t − t_fatigue))
 *
 * Where:
 *   P(t)       = predicted pace at elapsed time t (meters/second)
 *   P_baseline = sustainable baseline pace from rolling aggregation
 *   λ          = individual decay rate (steepness of fatigue onset)
 *   t_fatigue  = fatigue onset time (seconds into run where decay begins)
 */

// ============================================================
// TYPES
// ============================================================

export interface RunWaypoint {
  latitude: number;
  longitude: number;
  timestamp: number; // epoch ms
}

export interface HistoricalRun {
  id: number;
  date: number;         // epoch ms
  distance: number;     // meters
  duration: number;     // seconds
  avg_speed: number;    // km/h
  path_data: string;    // JSON stringified RunWaypoint[]
}

export interface PaceSegment {
  segmentIndex: number;     // 0-based segment number
  startTime: number;        // seconds into run
  endTime: number;          // seconds into run
  distance: number;         // meters covered in this segment
  pace: number;             // meters per second
}

export interface DecayModel {
  P_baseline: number;    // meters/second — sustainable pace
  lambda: number;        // decay rate (higher = faster fatigue)
  t_fatigue: number;     // seconds — onset of decay
  confidence: number;    // 0-1, how reliable this model is
  lastUpdated: number;   // epoch ms
  runCount: number;      // how many runs contributed to this model
}

export interface GhostWaypoint {
  latitude: number;
  longitude: number;
  elapsedMs: number;   // ms since ghost start
}

// ============================================================
// CONSTANTS
// ============================================================

const SEGMENT_DURATION_S = 60;       // 1-minute segments for pace analysis
const MIN_RUNS_FOR_MODEL = 3;        // Minimum runs before adaptive ghost activates
const ROLLING_WINDOW_DAYS = 28;      // 4-week rolling window
const RECENCY_DECAY_ALPHA = 0.15;    // Exponential weight for recent weeks
const LEARNING_RATE = 0.1;           // η — how quickly ghost adjusts per run
const MIN_LAMBDA = 0.001;            // Floor for decay rate
const MAX_LAMBDA = 0.05;             // Ceiling for decay rate
const DEFAULT_T_FATIGUE = 600;       // Default: fatigue starts at 10 min
const MIN_T_FATIGUE = 120;           // Minimum: 2 minutes
const GHOST_AHEAD_FACTOR = 0.02;     // Ghost stays 2% ahead of the user's failure point

// ============================================================
// CORE ALGORITHM
// ============================================================

/**
 * Segments a run's path into time-based pace segments.
 * Each segment represents SEGMENT_DURATION_S seconds of running.
 */
export const segmentRun = (waypoints: RunWaypoint[]): PaceSegment[] => {
  if (waypoints.length < 2) return [];

  const startTime = waypoints[0].timestamp;
  const segments: PaceSegment[] = [];
  let segIdx = 0;
  let segStart = 0;
  let segDist = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const elapsedS = (curr.timestamp - startTime) / 1000;
    const dist = haversine(prev, curr);

    // Which segment does this point belong to?
    const expectedSeg = Math.floor(elapsedS / SEGMENT_DURATION_S);

    if (expectedSeg > segIdx) {
      // Close the current segment
      const segEndTime = (segIdx + 1) * SEGMENT_DURATION_S;
      const segDuration = segEndTime - segStart;
      segments.push({
        segmentIndex: segIdx,
        startTime: segStart,
        endTime: segEndTime,
        distance: segDist,
        pace: segDuration > 0 ? segDist / segDuration : 0,
      });

      // Start new segment(s)
      segIdx = expectedSeg;
      segStart = segIdx * SEGMENT_DURATION_S;
      segDist = dist;
    } else {
      segDist += dist;
    }
  }

  // Close final segment
  const lastElapsed = (waypoints[waypoints.length - 1].timestamp - startTime) / 1000;
  if (segDist > 0) {
    segments.push({
      segmentIndex: segIdx,
      startTime: segStart,
      endTime: lastElapsed,
      distance: segDist,
      pace: (lastElapsed - segStart) > 0 ? segDist / (lastElapsed - segStart) : 0,
    });
  }

  return segments;
};

/**
 * Computes the Rolling Aggregation baseline pace.
 * Uses exponential recency weighting across weeks.
 *
 * Formula: P_composite = Σ(w_i × P_week_i) / Σ(w_i)
 * Where:  w_i = e^(−α × (W_current − W_i))
 */
export const computeRollingBaseline = (
  runs: HistoricalRun[],
  windowDays: number = ROLLING_WINDOW_DAYS
): number => {
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  // Filter to runs within the rolling window
  const recentRuns = runs.filter((r) => now - r.date < windowMs);
  if (recentRuns.length === 0) return 0;

  // Group by week (0 = this week, 1 = last week, etc.)
  const weekBuckets: Map<number, number[]> = new Map();

  for (const run of recentRuns) {
    const daysAgo = (now - run.date) / (24 * 60 * 60 * 1000);
    const weekIndex = Math.floor(daysAgo / 7);
    const paceMs = run.duration > 0 ? run.distance / run.duration : 0; // m/s

    if (!weekBuckets.has(weekIndex)) weekBuckets.set(weekIndex, []);
    weekBuckets.get(weekIndex)!.push(paceMs);
  }

  // Weighted average across weeks
  let weightedSum = 0;
  let weightTotal = 0;

  for (const [weekIndex, paces] of weekBuckets) {
    const weekAvgPace = paces.reduce((a, b) => a + b, 0) / paces.length;
    const weight = Math.exp(-RECENCY_DECAY_ALPHA * weekIndex);

    weightedSum += weight * weekAvgPace;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
};

/**
 * Fits the Effort Decay parameters (λ, t_fatigue) from historical runs.
 *
 * Method:
 * 1. Segment each run into 1-minute pace segments
 * 2. Identify where pace drops below baseline (fatigue onset)
 * 3. Fit exponential decay from the drop point
 * 4. Average λ and t_fatigue across runs (weighted by recency)
 */
export const fitDecayModel = (
  runs: HistoricalRun[],
  baseline: number
): { lambda: number; t_fatigue: number } => {
  if (runs.length < MIN_RUNS_FOR_MODEL || baseline <= 0) {
    return { lambda: 0.01, t_fatigue: DEFAULT_T_FATIGUE };
  }

  const lambdas: number[] = [];
  const fatigueOnsets: number[] = [];

  for (const run of runs) {
    let waypoints: RunWaypoint[];
    try {
      waypoints = JSON.parse(run.path_data);
    } catch {
      continue;
    }
    if (!waypoints || waypoints.length < 5) continue;

    const segments = segmentRun(waypoints);
    if (segments.length < 3) continue;

    // Find fatigue onset: first segment where pace drops below 90% of baseline
    const threshold = baseline * 0.9;
    let onsetIdx = -1;

    for (let i = 1; i < segments.length; i++) {
      if (segments[i].pace < threshold && segments[i - 1].pace >= threshold) {
        onsetIdx = i;
        break;
      }
    }

    if (onsetIdx === -1) {
      // No decay detected in this run — user maintained pace throughout
      fatigueOnsets.push(segments[segments.length - 1].endTime);
      lambdas.push(MIN_LAMBDA);
      continue;
    }

    const t_onset = segments[onsetIdx].startTime;
    fatigueOnsets.push(t_onset);

    // Fit λ from the decay portion
    // Using least-squares-like estimation:
    // If P(t) = P_baseline × e^(-λ × (t - t_onset))
    // Then λ ≈ -ln(P(t) / P_baseline) / (t - t_onset) averaged over decay segments
    let lambdaSum = 0;
    let lambdaCount = 0;

    for (let i = onsetIdx; i < segments.length; i++) {
      const t_delta = segments[i].startTime - t_onset;
      if (t_delta <= 0 || segments[i].pace <= 0) continue;

      const ratio = segments[i].pace / baseline;
      if (ratio <= 0 || ratio >= 1) continue;

      const estimatedLambda = -Math.log(ratio) / t_delta;
      if (estimatedLambda > 0 && estimatedLambda < MAX_LAMBDA * 2) {
        lambdaSum += estimatedLambda;
        lambdaCount++;
      }
    }

    if (lambdaCount > 0) {
      lambdas.push(Math.max(MIN_LAMBDA, Math.min(MAX_LAMBDA, lambdaSum / lambdaCount)));
    }
  }

  // Average across all runs
  const avgLambda =
    lambdas.length > 0
      ? lambdas.reduce((a, b) => a + b, 0) / lambdas.length
      : 0.01;

  const avgFatigue =
    fatigueOnsets.length > 0
      ? fatigueOnsets.reduce((a, b) => a + b, 0) / fatigueOnsets.length
      : DEFAULT_T_FATIGUE;

  return {
    lambda: Math.max(MIN_LAMBDA, Math.min(MAX_LAMBDA, avgLambda)),
    t_fatigue: Math.max(MIN_T_FATIGUE, avgFatigue),
  };
};

/**
 * Builds the full Decay Model from historical runs.
 */
export const buildDecayModel = (runs: HistoricalRun[]): DecayModel => {
  const baseline = computeRollingBaseline(runs);
  const { lambda, t_fatigue } = fitDecayModel(runs, baseline);

  return {
    P_baseline: baseline,
    lambda,
    t_fatigue,
    confidence: Math.min(1, runs.length / 10), // Linearly grows to 1.0 at 10 runs
    lastUpdated: Date.now(),
    runCount: runs.length,
  };
};

/**
 * The core decay function.
 * Returns predicted pace (m/s) at elapsed time t (seconds).
 *
 * P(t) = P_baseline × e^(−λ × max(0, t − t_fatigue))
 */
export const predictPace = (model: DecayModel, t: number): number => {
  const decay = Math.exp(-model.lambda * Math.max(0, t - model.t_fatigue));
  return model.P_baseline * decay;
};

/**
 * Generates a Synthetic Best Run — ghost waypoints from the decay model.
 * The ghost runs at the predicted pace, slightly ahead of the user's failure point.
 *
 * Uses a reference route (latest run path) for the spatial trajectory,
 * but re-times the waypoints according to the decay model.
 */
export const generateSyntheticGhost = (
  model: DecayModel,
  referenceWaypoints: RunWaypoint[],
  totalDurationS: number
): GhostWaypoint[] => {
  if (referenceWaypoints.length < 2 || model.P_baseline <= 0) return [];

  // Compute cumulative distance along the reference route
  const cumDist: number[] = [0];
  for (let i = 1; i < referenceWaypoints.length; i++) {
    cumDist.push(cumDist[i - 1] + haversine(referenceWaypoints[i - 1], referenceWaypoints[i]));
  }
  const totalRefDist = cumDist[cumDist.length - 1];
  if (totalRefDist <= 0) return [];

  // Generate ghost waypoints every 5 seconds
  const ghostPoints: GhostWaypoint[] = [];
  let ghostDist = 0;

  for (let t = 0; t <= totalDurationS; t += 5) {
    // Ghost pace: slightly ahead of the user's predicted pace
    const pace = predictPace(model, t) * (1 + GHOST_AHEAD_FACTOR);
    ghostDist += pace * 5; // distance covered in this 5-sec interval

    // Clamp to reference route length
    const clampedDist = Math.min(ghostDist, totalRefDist);

    // Interpolate position along reference route
    const pos = interpolateAlongRoute(referenceWaypoints, cumDist, clampedDist);

    ghostPoints.push({
      latitude: pos.latitude,
      longitude: pos.longitude,
      elapsedMs: t * 1000,
    });

    if (clampedDist >= totalRefDist) break; // Ghost finished the route
  }

  return ghostPoints;
};

// ============================================================
// REINFORCEMENT CALIBRATION
// ============================================================

/**
 * Calibrates the decay model after a completed run.
 * Compares actual performance against predicted performance
 * and adjusts λ, t_fatigue, and P_baseline accordingly.
 *
 * ghost_target(t+1) = ghost_target(t) + η × (performance_delta)
 */
export const calibrateModel = (
  currentModel: DecayModel,
  completedRun: HistoricalRun
): DecayModel => {
  let waypoints: RunWaypoint[];
  try {
    waypoints = JSON.parse(completedRun.path_data);
  } catch {
    return currentModel;
  }
  if (waypoints.length < 5) return currentModel;

  const segments = segmentRun(waypoints);
  if (segments.length < 2) return currentModel;

  // Compare actual pace vs. predicted pace at each segment
  let totalDelta = 0;
  let fatigueShift = 0;
  let segCount = 0;

  for (const seg of segments) {
    const midTime = (seg.startTime + seg.endTime) / 2;
    const predictedPace = predictPace(currentModel, midTime);
    const actualPace = seg.pace;

    if (predictedPace > 0 && actualPace > 0) {
      // Positive delta = user beat prediction, negative = fell behind
      totalDelta += (actualPace - predictedPace) / predictedPace;
      segCount++;
    }

    // Track if fatigue started earlier or later than predicted
    if (actualPace < currentModel.P_baseline * 0.9 && midTime < currentModel.t_fatigue) {
      fatigueShift -= 1; // Fatigue came earlier than expected
    } else if (actualPace >= currentModel.P_baseline * 0.9 && midTime > currentModel.t_fatigue) {
      fatigueShift += 1; // User held pace longer than expected
    }
  }

  if (segCount === 0) return currentModel;

  const avgDelta = totalDelta / segCount;

  // Adjust baseline: if user consistently beats prediction, nudge up
  const newBaseline = currentModel.P_baseline * (1 + LEARNING_RATE * avgDelta);

  // Adjust lambda: if user decays faster than predicted, increase lambda
  const lambdaAdjust = avgDelta < 0 ? 1.05 : 0.97; // Decay faster if underperforming
  const newLambda = Math.max(
    MIN_LAMBDA,
    Math.min(MAX_LAMBDA, currentModel.lambda * lambdaAdjust)
  );

  // Adjust fatigue onset: shift based on observed fatigue timing
  const fatigueAdjust = fatigueShift * LEARNING_RATE * 30; // 30s per unit shift
  const newTFatigue = Math.max(
    MIN_T_FATIGUE,
    currentModel.t_fatigue + fatigueAdjust
  );

  return {
    P_baseline: newBaseline,
    lambda: newLambda,
    t_fatigue: newTFatigue,
    confidence: Math.min(1, (currentModel.runCount + 1) / 10),
    lastUpdated: Date.now(),
    runCount: currentModel.runCount + 1,
  };
};

// ============================================================
// UTILITIES
// ============================================================

/**
 * Haversine distance between two points (meters).
 */
const haversine = (
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number }
): number => {
  const R = 6371000;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Interpolates a lat/lng position along a route at a given cumulative distance.
 */
const interpolateAlongRoute = (
  waypoints: RunWaypoint[],
  cumDist: number[],
  targetDist: number
): { latitude: number; longitude: number } => {
  // Find the segment containing targetDist
  for (let i = 1; i < cumDist.length; i++) {
    if (cumDist[i] >= targetDist) {
      const segLen = cumDist[i] - cumDist[i - 1];
      if (segLen <= 0) return waypoints[i - 1];

      const ratio = (targetDist - cumDist[i - 1]) / segLen;
      return {
        latitude:
          waypoints[i - 1].latitude +
          (waypoints[i].latitude - waypoints[i - 1].latitude) * ratio,
        longitude:
          waypoints[i - 1].longitude +
          (waypoints[i].longitude - waypoints[i - 1].longitude) * ratio,
      };
    }
  }

  // Past the end — return last point
  return waypoints[waypoints.length - 1];
};
