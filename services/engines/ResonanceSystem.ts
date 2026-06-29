/**
 * ============================================================
 * RESONANCE SYSTEM — Karela Fusion Layer
 * ============================================================
 *
 * Thesis Component: Stamina-Aware Civic Load Modulation
 * Research Question (RQ3): "Does a stamina-aware Resonance System — which
 *   suppresses civic interaction prompts during high-fatigue states and surfaces
 *   them during low-intensity phases — produce higher combined fitness-civic
 *   engagement without degrading exercise performance metrics?"
 *
 * Core Concept:
 *   The Running Engine and Civic Engine are NOT independent. They share a
 *   bidirectional influence relationship mediated by the user's current
 *   physical state.
 *
 * Fusion Logic Model:
 *   civic_load(t) = f(stamina_score(t), route_proximity(t), role(t))
 *
 *   where:
 *     stamina_score(t) = 1 − normalized_fatigue_index(t)
 *     role(t) = Scout if stamina_score > threshold, else Vanguard
 *     civic_load(t) = 0 if stamina_score < suppression_threshold
 *
 * User Roles:
 *   Scout (High Intensity): one-tap flags, passive "Still There" reconfirmation
 *   Vanguard (Low Intensity): detailed verification, cleanup tasks, extended docs
 */

import { DecayModel, predictPace } from "./AdaptiveGhostEngine";

// ============================================================
// TYPES
// ============================================================

export type CivicRole = "scout" | "vanguard" | "suppressed";

export type CivicPromptType =
  | "reconfirm"          // "Still There?" tap while passing a node
  | "quick_report"       // One-tap issue flag (Scout)
  | "detailed_report"    // Full photo + description (Vanguard)
  | "cleanup_task"       // Minor cleanup quest (Vanguard)
  | "none";              // Civic prompts suppressed

export interface ResonanceState {
  staminaScore: number;         // 0–1 (1 = fresh, 0 = exhausted)
  fatigueIndex: number;         // 0–1 (inverse of stamina)
  currentRole: CivicRole;
  allowedPrompts: CivicPromptType[];
  civicLoadFactor: number;      // 0–1, how much civic interaction is appropriate
  reasoning: string;            // Human-readable explanation of current state
}

export interface RunContext {
  elapsedTimeS: number;         // seconds since run started
  currentSpeedMps: number;      // current speed in m/s
  averageSpeedMps: number;      // average speed so far
  totalDistanceM: number;       // total distance in meters
  isGhostAhead: boolean;        // user is behind ghost
  heartRateZone?: number;       // 1-5, if available (future)
}

// ============================================================
// CONSTANTS
// ============================================================

// Stamina thresholds for role assignment
const SCOUT_THRESHOLD = 0.6;              // Above this = Scout (high intensity)
const VANGUARD_THRESHOLD = 0.3;           // Between this and Scout = Vanguard
const SUPPRESSION_THRESHOLD = 0.2;        // Below this = all civic suppressed

// Speed-based fatigue estimation (when no decay model available)
const SPEED_FATIGUE_THRESHOLD = 0.7;      // Below 70% of avg pace = fatigue signal

// Civic load scaling
const MAX_CIVIC_LOAD = 1.0;
const MIN_CIVIC_LOAD = 0.0;

// Cooldown detection
const COOLDOWN_SPEED_RATIO = 0.5;         // Below 50% of avg = cooldown phase
const COOLDOWN_MIN_DISTANCE = 1000;       // Must have run ≥1km before cooldown detection

// ============================================================
// CORE ALGORITHM
// ============================================================

/**
 * Computes the user's current stamina score based on their run context
 * and (optionally) the adaptive ghost decay model.
 *
 * stamina_score(t) = 1 − normalized_fatigue_index(t)
 *
 * Fatigue is estimated from:
 * 1. Decay model (if available): compare predicted pace to actual pace
 * 2. Speed trend: current speed vs average speed
 * 3. Time-based heuristic: stamina naturally decreases over time
 */
export const computeStaminaScore = (
  context: RunContext,
  decayModel?: DecayModel | null
): number => {
  if (context.elapsedTimeS <= 0) return 1.0; // Just started

  let fatigueFactor = 0;

  if (decayModel && decayModel.P_baseline > 0) {
    // Model-based estimation (most accurate)
    const predictedPace = predictPace(decayModel, context.elapsedTimeS);
    const actualPace = context.currentSpeedMps;

    if (predictedPace > 0) {
      // How far below prediction is the user?
      const performanceRatio = actualPace / predictedPace;
      // If performing at 100%+ of predicted = no fatigue
      // If at 60% of predicted = high fatigue
      fatigueFactor = Math.max(0, 1 - performanceRatio);
    }
  } else {
    // Heuristic estimation (no model yet)
    if (context.averageSpeedMps > 0) {
      const speedRatio = context.currentSpeedMps / context.averageSpeedMps;
      fatigueFactor = Math.max(0, 1 - speedRatio);
    }

    // Time-based decay (gentle — 0.1 fatigue per 10 minutes)
    const timeDecay = Math.min(0.5, context.elapsedTimeS / 6000);
    fatigueFactor = Math.max(fatigueFactor, timeDecay);
  }

  // Clamp to [0, 1]
  const normalizedFatigue = Math.max(0, Math.min(1, fatigueFactor));
  return 1 - normalizedFatigue;
};

/**
 * Detects if the user is in a cooldown phase.
 * Cooldown = significantly slower than average, after running ≥1km.
 * This is when Vanguard tasks should surface.
 */
export const isCooldownPhase = (context: RunContext): boolean => {
  if (context.totalDistanceM < COOLDOWN_MIN_DISTANCE) return false;
  if (context.averageSpeedMps <= 0) return false;

  const speedRatio = context.currentSpeedMps / context.averageSpeedMps;
  return speedRatio < COOLDOWN_SPEED_RATIO;
};

/**
 * Determines the user's civic role based on stamina.
 */
export const assignRole = (staminaScore: number, inCooldown: boolean): CivicRole => {
  if (staminaScore < SUPPRESSION_THRESHOLD) return "suppressed";
  if (inCooldown || staminaScore < VANGUARD_THRESHOLD) return "vanguard";
  if (staminaScore >= SCOUT_THRESHOLD) return "scout";
  return "vanguard"; // Between thresholds
};

/**
 * Determines which civic prompt types are appropriate given the current role.
 */
export const getAllowedPrompts = (role: CivicRole): CivicPromptType[] => {
  switch (role) {
    case "scout":
      return ["reconfirm", "quick_report"];
    case "vanguard":
      return ["reconfirm", "quick_report", "detailed_report", "cleanup_task"];
    case "suppressed":
      return ["none"];
  }
};

/**
 * Computes the civic load factor — how much civic interaction is appropriate.
 * 0 = completely suppressed, 1 = full civic engagement available.
 *
 * civic_load(t) = f(stamina_score(t), route_proximity(t), role(t))
 */
export const computeCivicLoad = (
  staminaScore: number,
  role: CivicRole,
  nearbyNodeCount: number = 0
): number => {
  if (role === "suppressed") return MIN_CIVIC_LOAD;

  // Base load from stamina
  let load = staminaScore;

  // Boost if user is near civic nodes (they're already there, lower friction)
  if (nearbyNodeCount > 0) {
    load = Math.min(MAX_CIVIC_LOAD, load * 1.2);
  }

  // Vanguard mode gets higher civic load (user is in low-intensity state)
  if (role === "vanguard") {
    load = Math.min(MAX_CIVIC_LOAD, load * 1.5);
  }

  return Math.max(MIN_CIVIC_LOAD, Math.min(MAX_CIVIC_LOAD, load));
};

// ============================================================
// MAIN RESONANCE FUNCTION
// ============================================================

/**
 * The primary Resonance System function.
 * Call this continuously during a run (e.g., every 10 seconds)
 * to get the current civic interaction state.
 *
 * This is what the UI layer uses to decide whether to show
 * civic prompts, which kind, and how prominently.
 */
export const getResonanceState = (
  context: RunContext,
  decayModel?: DecayModel | null,
  nearbyNodeCount: number = 0
): ResonanceState => {
  const staminaScore = computeStaminaScore(context, decayModel);
  const cooldown = isCooldownPhase(context);
  const role = assignRole(staminaScore, cooldown);
  const allowedPrompts = getAllowedPrompts(role);
  const civicLoadFactor = computeCivicLoad(staminaScore, role, nearbyNodeCount);
  const fatigueIndex = 1 - staminaScore;

  // Build reasoning string for debugging/UI
  let reasoning: string;
  if (role === "suppressed") {
    reasoning = "High fatigue detected. Civic prompts suppressed to protect performance.";
  } else if (role === "vanguard") {
    reasoning = cooldown
      ? "Cooldown phase detected. Vanguard tasks available nearby."
      : "Moderate fatigue. Light civic tasks available.";
  } else {
    reasoning = "Strong stamina. Passive civic sensing active (Scout mode).";
  }

  return {
    staminaScore,
    fatigueIndex,
    currentRole: role,
    allowedPrompts,
    civicLoadFactor,
    reasoning,
  };
};

/**
 * Determines if a specific civic prompt should be shown right now.
 * Used by the map overlay to decide whether to render a "Still There?" button
 * or a "Report Issue" card.
 */
export const shouldShowCivicPrompt = (
  promptType: CivicPromptType,
  resonanceState: ResonanceState
): boolean => {
  if (resonanceState.currentRole === "suppressed") return false;
  return resonanceState.allowedPrompts.includes(promptType);
};

/**
 * Route civic integration: determines if the ghost route should subtly
 * deviate toward a civic node during the user's run.
 *
 * Only applies when:
 * - User has sufficient stamina (Scout or Vanguard)
 * - Node is within acceptable deviation distance
 * - Deviation would not materially harm the fitness experience
 */
export const shouldDeviateForCivicNode = (
  resonanceState: ResonanceState,
  deviationDistanceM: number,
  maxAcceptableDeviationM: number = 50
): boolean => {
  if (resonanceState.currentRole === "suppressed") return false;
  if (deviationDistanceM > maxAcceptableDeviationM) return false;

  // Only deviate if civic load is high enough
  return resonanceState.civicLoadFactor >= 0.5;
};
