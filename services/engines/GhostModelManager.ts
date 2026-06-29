/**
 * Ghost Model Manager
 *
 * Manages the lifecycle of the Adaptive Ghost model:
 * - Loads historical runs from SQLite
 * - Builds/rebuilds the decay model
 * - Persists the model locally (SQLite)
 * - Provides the synthetic ghost for a given route
 * - Calibrates after each new run
 *
 * Fallback hierarchy (per README spec):
 * 1. Adaptive Ghost (Synthetic Best Run) — if ≥3 runs exist
 * 2. Personal Ghost (static PB replay) — if <3 runs but ≥1 exists
 * 3. Ani Pacer (beginner ghost) — if no runs exist
 */

import { db } from "../database/sqlite/database";
import {
    buildDecayModel,
    calibrateModel,
    DecayModel,
    generateSyntheticGhost,
    GhostWaypoint,
    HistoricalRun,
    RunWaypoint,
} from "./AdaptiveGhostEngine";

// ============================================================
// SQLite Schema for Model Persistence
// ============================================================

export const initGhostModelTable = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ghost_model (
      id INTEGER PRIMARY KEY DEFAULT 1,
      p_baseline REAL,
      lambda REAL,
      t_fatigue REAL,
      confidence REAL,
      last_updated INTEGER,
      run_count INTEGER
    );
  `);
};

// ============================================================
// DATA ACCESS
// ============================================================

/**
 * Loads all historical runs from the last 4 weeks.
 */
export const getRecentRuns = (): HistoricalRun[] => {
  const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;

  const rows = db.getAllSync(
    `SELECT id, date, distance, duration, avg_speed, path_data
     FROM ghost_runs
     WHERE date >= ? AND path_data IS NOT NULL
     ORDER BY date DESC`,
    [fourWeeksAgo]
  ) as any[];

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    distance: r.distance,
    duration: r.duration,
    avg_speed: r.avg_speed,
    path_data: r.path_data,
  }));
};

/**
 * Loads the persisted decay model from SQLite, or returns null.
 */
export const loadModel = (): DecayModel | null => {
  initGhostModelTable();

  const row = db.getFirstSync(
    `SELECT * FROM ghost_model WHERE id = 1`
  ) as any;

  if (!row || !row.p_baseline) return null;

  return {
    P_baseline: row.p_baseline,
    lambda: row.lambda,
    t_fatigue: row.t_fatigue,
    confidence: row.confidence,
    lastUpdated: row.last_updated,
    runCount: row.run_count,
  };
};

/**
 * Persists the decay model to SQLite.
 */
export const saveModel = (model: DecayModel) => {
  initGhostModelTable();

  db.runSync(
    `INSERT OR REPLACE INTO ghost_model (id, p_baseline, lambda, t_fatigue, confidence, last_updated, run_count)
     VALUES (1, ?, ?, ?, ?, ?, ?)`,
    [
      model.P_baseline,
      model.lambda,
      model.t_fatigue,
      model.confidence,
      model.lastUpdated,
      model.runCount,
    ]
  );
};

// ============================================================
// PUBLIC API
// ============================================================

export type GhostType = "adaptive" | "personal_best" | "ani_pacer";

export interface GhostResult {
  type: GhostType;
  waypoints: GhostWaypoint[] | RunWaypoint[];
  model: DecayModel | null;
  metadata: {
    baselinePace: number;   // m/s
    predictedFatigue: number; // seconds
    confidence: number;
  };
}

/**
 * Gets the best available ghost for the user's next run.
 * Implements the fallback hierarchy.
 *
 * @param estimatedDurationS — how long the user expects to run (for ghost generation)
 */
export const getGhost = (estimatedDurationS: number = 1800): GhostResult => {
  const runs = getRecentRuns();

  // Fallback 3: Ani Pacer (no runs at all)
  if (runs.length === 0) {
    return {
      type: "ani_pacer",
      waypoints: [],
      model: null,
      metadata: { baselinePace: 1.4, predictedFatigue: 600, confidence: 0 },
    };
  }

  // Fallback 2: Personal Best (1-2 runs — not enough for adaptive model)
  if (runs.length < 3) {
    const bestRun = runs.reduce((best, r) =>
      r.distance > best.distance ? r : best
    );
    let waypoints: RunWaypoint[] = [];
    try {
      waypoints = JSON.parse(bestRun.path_data);
    } catch {}

    return {
      type: "personal_best",
      waypoints,
      model: null,
      metadata: {
        baselinePace: bestRun.duration > 0 ? bestRun.distance / bestRun.duration : 1.4,
        predictedFatigue: 600,
        confidence: 0.1,
      },
    };
  }

  // Primary: Adaptive Ghost (≥3 runs)
  let model = loadModel();

  // Rebuild if stale (>24h old) or if we have more runs than the model was built from
  const isStale = !model || Date.now() - model.lastUpdated > 24 * 60 * 60 * 1000;
  const hasNewRuns = model && runs.length > model.runCount;

  if (!model || isStale || hasNewRuns) {
    model = buildDecayModel(runs);
    saveModel(model);
  }

  // Use the latest run as the spatial reference for the ghost path
  const latestRun = runs[0];
  let referenceWaypoints: RunWaypoint[] = [];
  try {
    referenceWaypoints = JSON.parse(latestRun.path_data);
  } catch {}

  if (referenceWaypoints.length < 2) {
    // Can't generate spatial ghost without reference — fallback to PB
    return {
      type: "personal_best",
      waypoints: referenceWaypoints,
      model,
      metadata: {
        baselinePace: model.P_baseline,
        predictedFatigue: model.t_fatigue,
        confidence: model.confidence,
      },
    };
  }

  const syntheticGhost = generateSyntheticGhost(
    model,
    referenceWaypoints,
    estimatedDurationS
  );

  return {
    type: "adaptive",
    waypoints: syntheticGhost,
    model,
    metadata: {
      baselinePace: model.P_baseline,
      predictedFatigue: model.t_fatigue,
      confidence: model.confidence,
    },
  };
};

/**
 * Called after each completed run to update the model.
 * This is the reinforcement feedback loop.
 */
export const onRunCompleted = (completedRun: HistoricalRun): DecayModel => {
  let model = loadModel();

  if (!model) {
    // First time building — use all available runs
    const runs = getRecentRuns();
    model = buildDecayModel(runs);
  } else {
    // Calibrate the existing model with the new run
    model = calibrateModel(model, completedRun);
  }

  saveModel(model);
  return model;
};
