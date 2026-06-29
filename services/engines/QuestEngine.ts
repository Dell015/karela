/**
 * ============================================================
 * QUEST ENGINE — Karela Mission Generation & Lifecycle
 * ============================================================
 *
 * Centralized quest system that handles:
 * 1. Daily / Weekly / Monthly quest generation (AI-powered + system templates)
 * 2. Quest difficulty scaling (uses Adaptive Ghost decay model)
 * 3. Quest type diversity (distance, speed, civic, social)
 * 4. Resonance integration (adjusts civic quest load based on stamina)
 * 5. Expiration & rotation (marks stale quests as expired)
 * 6. Onboarding arc (delegates to onboarding service for first 7 days)
 *
 * This engine is the single source of truth for all quest generation.
 * UI screens call into this engine rather than generating quests inline.
 */

import { generateAniQuest } from "../ai/aiService";
import {
  addMission,
  getMissions,
  MissionRow,
  updateMission,
} from "../database/supabase/missions";
import { incrementStats, setStats } from "../database/supabase/profiles";
import {
  assignOnboardingQuest,
  getOnboardingDay,
  shouldAssignOnboardingQuest,
} from "../onboarding";
import { getStreakMultiplier } from "../streakMultiplier";
import { DecayModel } from "./AdaptiveGhostEngine";

// ============================================================
// TYPES
// ============================================================

export type QuestFrequency = "daily" | "weekly" | "monthly" | "limited";
export type QuestCategory = "solo" | "team";
export type QuestType = "distance" | "speed" | "civic" | "social" | "streak";

export interface QuestTemplate {
  title: string;
  description: string;
  target_value: number;    // km for distance, km/h for speed, count for civic/social
  xp_reward: number;
  gem_reward?: number;
  category: QuestCategory;
  frequency: QuestFrequency;
  type: QuestType;
}

export interface GenerationResult {
  generated: string[];     // IDs or titles of quests generated
  skipped: string[];       // Reasons for skipped generations
  errors: string[];        // Any errors encountered
}

export interface QuestEngineConfig {
  userId: string;
  stats: any;
  decayModel?: DecayModel | null;
  runHistory?: any[];
  teamMembers?: string[];  // For team quest generation (future)
}

// ============================================================
// CONSTANTS
// ============================================================

// Quest count per frequency
const DAILY_QUEST_COUNT = 2;    // 1 AI + 1 system
const WEEKLY_QUEST_COUNT = 2;   // 1 distance + 1 variety
const MONTHLY_QUEST_COUNT = 1;  // 1 big challenge

// Difficulty scaling based on level
const BASE_DISTANCE_KM = 1.0;
const DISTANCE_PER_LEVEL = 0.3;     // +300m per level
const BASE_SPEED_KMH = 6.0;
const SPEED_PER_LEVEL = 0.2;        // +0.2 km/h per level

// XP rewards scale with difficulty
const BASE_DAILY_XP = 100;
const BASE_WEEKLY_XP = 300;
const BASE_MONTHLY_XP = 750;

// Expiration windows (hours)
const EXPIRATION_HOURS: Record<QuestFrequency, number> = {
  daily: 24,
  weekly: 168,     // 7 days
  monthly: 720,    // 30 days
  limited: 48,     // 2 days for special events
};

// ============================================================
// DIFFICULTY SCALING
// ============================================================

/**
 * Calculates appropriate distance target based on user level and decay model.
 * Uses the adaptive ghost model when available for more personalized targets.
 */
const scaleDistance = (
  level: number,
  frequency: QuestFrequency,
  decayModel?: DecayModel | null
): number => {
  let base = BASE_DISTANCE_KM + (level * DISTANCE_PER_LEVEL);

  // Use decay model for better personalization
  if (decayModel && decayModel.P_baseline > 0 && decayModel.confidence > 0.3) {
    // Estimate what they can sustain for the target duration
    // Daily: ~20 min effort, Weekly: ~40 min, Monthly: ~60 min
    const targetDurationS: Record<QuestFrequency, number> = {
      daily: 1200,    // 20 min
      weekly: 2400,   // 40 min
      monthly: 3600,  // 60 min
      limited: 1800,  // 30 min
    };

    const duration = targetDurationS[frequency];
    // Average pace over the target duration (accounting for fatigue)
    const midPace = decayModel.P_baseline * Math.exp(
      -decayModel.lambda * Math.max(0, duration / 2 - decayModel.t_fatigue)
    );

    // Convert to km (pace is m/s, multiply by duration, divide by 1000)
    const modelDistance = (midPace * duration) / 1000;

    // Blend model prediction with level-based scaling (70/30 when confident)
    const blendFactor = Math.min(0.7, decayModel.confidence * 0.7);
    base = base * (1 - blendFactor) + modelDistance * blendFactor;
  }

  // Scale by frequency
  const frequencyMultiplier: Record<QuestFrequency, number> = {
    daily: 1.0,
    weekly: 2.5,
    monthly: 5.0,
    limited: 1.5,
  };

  return Math.round(base * frequencyMultiplier[frequency] * 10) / 10; // Round to 0.1
};

/**
 * Calculates appropriate speed target based on level and decay model.
 */
const scaleSpeed = (
  level: number,
  decayModel?: DecayModel | null
): number => {
  let base = BASE_SPEED_KMH + (level * SPEED_PER_LEVEL);

  if (decayModel && decayModel.P_baseline > 0 && decayModel.confidence > 0.3) {
    // Convert baseline pace (m/s) to km/h
    const baselineKmh = decayModel.P_baseline * 3.6;
    // Target is 90% of their baseline (achievable but challenging)
    const modelSpeed = baselineKmh * 0.9;

    const blendFactor = Math.min(0.6, decayModel.confidence * 0.6);
    base = base * (1 - blendFactor) + modelSpeed * blendFactor;
  }

  return Math.round(base * 10) / 10;
};

/**
 * Scales XP reward based on frequency and level.
 */
const scaleXP = (frequency: QuestFrequency, level: number): number => {
  const baseXP: Record<QuestFrequency, number> = {
    daily: BASE_DAILY_XP,
    weekly: BASE_WEEKLY_XP,
    monthly: BASE_MONTHLY_XP,
    limited: 200,
  };

  // +10% per level beyond 1
  const levelBonus = 1 + (Math.max(0, level - 1) * 0.1);
  return Math.floor(baseXP[frequency] * levelBonus);
};

// ============================================================
// SYSTEM QUEST TEMPLATES
// ============================================================

/**
 * Generates a system distance quest (deterministic, no AI needed).
 */
const generateSystemDistanceQuest = (
  level: number,
  frequency: QuestFrequency,
  decayModel?: DecayModel | null
): QuestTemplate => {
  const distance = scaleDistance(level, frequency, decayModel);
  const xp = scaleXP(frequency, level);

  const titles: Record<QuestFrequency, string[]> = {
    daily: ["Daily Patrol", "Baseline Run", "Sector Sweep", "Morning Recon"],
    weekly: ["Weekly Expedition", "Long Haul", "Distance Push", "Endurance Test"],
    monthly: ["Monthly Marathon", "The Gauntlet", "Iron Distance", "Month's Challenge"],
    limited: ["Flash Mission", "Time Trial", "Quick Op"],
  };

  const titlePool = titles[frequency];
  const title = titlePool[Math.floor(Math.random() * titlePool.length)];

  return {
    title,
    description: `Cover ${distance} km to complete this ${frequency} mission.`,
    target_value: distance,
    xp_reward: xp,
    category: "solo",
    frequency,
    type: "distance",
  };
};

/**
 * Generates a speed-based quest.
 */
const generateSpeedQuest = (
  level: number,
  frequency: QuestFrequency,
  decayModel?: DecayModel | null
): QuestTemplate => {
  const targetSpeed = scaleSpeed(level, decayModel);
  const distance = scaleDistance(level, frequency, decayModel) * 0.6; // Shorter distance for speed quests
  const xp = Math.floor(scaleXP(frequency, level) * 1.2); // Speed quests reward more

  return {
    title: frequency === "weekly" ? "Velocity Week" : "Speed Surge",
    description: `Maintain ${targetSpeed} km/h average over ${distance} km.`,
    target_value: distance, // Track by distance, but speed is the challenge
    xp_reward: xp,
    category: "solo",
    frequency,
    type: "speed",
  };
};

/**
 * Generates a civic quest (report or verify issues).
 */
const generateCivicQuest = (
  level: number,
  frequency: QuestFrequency
): QuestTemplate => {
  const xp = Math.floor(scaleXP(frequency, level) * 1.3); // Civic quests reward more
  const targetReports = frequency === "weekly" ? 3 : frequency === "monthly" ? 7 : 1;

  const civicTitles = [
    "Community Eye",
    "Urban Sensor",
    "City Watch",
    "Civic Patrol",
    "Street Report",
  ];

  return {
    title: civicTitles[Math.floor(Math.random() * civicTitles.length)],
    description: `Report ${targetReports} civic issue${targetReports > 1 ? "s" : ""} during your run.`,
    target_value: targetReports,
    xp_reward: xp,
    gem_reward: targetReports * 10,
    category: "solo",
    frequency,
    type: "civic",
  };
};

/**
 * Generates a streak-based quest (maintain daily activity).
 */
const generateStreakQuest = (
  level: number,
  frequency: QuestFrequency,
  currentStreak: number
): QuestTemplate => {
  // Target is to extend streak by X days
  const targets: Record<QuestFrequency, number> = {
    daily: 1,       // Just don't break it today
    weekly: 5,      // Run 5 out of 7 days
    monthly: 20,    // Run 20 out of 30 days
    limited: 3,
  };

  const target = targets[frequency];
  const xp = Math.floor(scaleXP(frequency, level) * 1.1);

  return {
    title: currentStreak > 7 ? "Keep the Fire" : "Build the Streak",
    description: `Complete ${target} run${target > 1 ? "s" : ""} this ${frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"}.`,
    target_value: target,
    xp_reward: xp,
    gem_reward: target * 5,
    category: "solo",
    frequency,
    type: "streak",
  };
};

// ============================================================
// CORE ENGINE
// ============================================================

export const QuestEngine = {
  /**
   * Main generation entry point.
   * Call this on dashboard load or when checking for fresh quests.
   * Handles all frequencies in one pass.
   */
  generateQuests: async (config: QuestEngineConfig): Promise<GenerationResult> => {
    const { userId, stats, decayModel, runHistory } = config;
    const result: GenerationResult = { generated: [], skipped: [], errors: [] };

    if (!userId || !stats) {
      result.errors.push("Missing userId or stats");
      return result;
    }

    const now = new Date();
    const todayKey = now.toISOString().split("T")[0];
    const weekKey = getWeekKey(now);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const level = Number(stats.level || 1);
    const streak = Number(stats.streak || 0);

    // --- Check onboarding first ---
    if (shouldAssignOnboardingQuest(stats)) {
      try {
        const assigned = await assignOnboardingQuest(userId, stats);
        if (assigned) {
          result.generated.push("onboarding_quest");
          return result; // During onboarding, only assign onboarding quests
        }
      } catch (err: any) {
        result.errors.push(`Onboarding: ${err.message}`);
      }
    }

    // If still in onboarding arc, don't generate regular quests
    if (getOnboardingDay(stats) !== null) {
      result.skipped.push("Still in onboarding arc — skipping regular generation");
      return result;
    }

    // --- DAILY GENERATION ---
    if (stats.last_daily_reset !== todayKey) {
      try {
        await QuestEngine.generateDailyQuests(userId, level, streak, decayModel, runHistory, stats);
        result.generated.push("daily_quests");
      } catch (err: any) {
        result.errors.push(`Daily: ${err.message}`);
      }
      // Update reset key
      await setStats(userId, { last_daily_reset: todayKey });
    } else {
      result.skipped.push("Daily already generated");
    }

    // --- WEEKLY GENERATION ---
    if (stats.last_weekly_reset !== weekKey) {
      try {
        await QuestEngine.generateWeeklyQuests(userId, level, streak, decayModel);
        result.generated.push("weekly_quests");
      } catch (err: any) {
        result.errors.push(`Weekly: ${err.message}`);
      }
      await setStats(userId, { last_weekly_reset: weekKey });
    } else {
      result.skipped.push("Weekly already generated");
    }

    // --- MONTHLY GENERATION ---
    if (stats.last_monthly_reset !== monthKey) {
      try {
        await QuestEngine.generateMonthlyQuests(userId, level, streak, decayModel);
        result.generated.push("monthly_quests");
      } catch (err: any) {
        result.errors.push(`Monthly: ${err.message}`);
      }
      await setStats(userId, { last_monthly_reset: monthKey });
    } else {
      result.skipped.push("Monthly already generated");
    }

    // --- EXPIRE OLD QUESTS ---
    try {
      const expired = await QuestEngine.expireStaleQuests(userId);
      if (expired > 0) {
        result.generated.push(`expired_${expired}_quests`);
      }
    } catch (err: any) {
      result.errors.push(`Expiration: ${err.message}`);
    }

    return result;
  },

  /**
   * Generates the daily quest set:
   * - 1 AI-generated personalized quest (via Gemini)
   * - 1 system distance quest (deterministic fallback)
   */
  generateDailyQuests: async (
    userId: string,
    level: number,
    streak: number,
    decayModel?: DecayModel | null,
    runHistory?: any[],
    stats?: any
  ): Promise<void> => {
    const todayKey = new Date().toISOString().split("T")[0];

    // 1. AI-generated quest (personalized by Gemini)
    try {
      const aiQuest = await generateAniQuest(
        { stats: { level, streak, weight: stats?.weight || 70, age: stats?.age || 25, ai_notes: stats?.ai_notes || "" } },
        runHistory || []
      );

      if (aiQuest) {
        await addMission(userId, {
          title: `🤖 ${aiQuest.title}`,
          description: aiQuest.description || "Ani has a special mission for you.",
          target_value: (aiQuest.goalDistance || 2000) / 1000,  // Convert m → km
          xp_reward: aiQuest.rewardXP || scaleXP("daily", level),
          category: "solo",
          frequency: "daily",
          type: "distance",
          created_at_key: todayKey,
        });
      }
    } catch (err) {
      console.error("AI quest generation failed, using fallback:", err);
    }

    // 2. System quest (always generated — acts as fallback)
    const systemQuest = generateSystemDistanceQuest(level, "daily", decayModel);
    await addMission(userId, {
      title: systemQuest.title,
      description: systemQuest.description,
      target_value: systemQuest.target_value,
      xp_reward: systemQuest.xp_reward,
      category: systemQuest.category,
      frequency: systemQuest.frequency,
      type: systemQuest.type,
      created_at_key: todayKey,
    });
  },

  /**
   * Generates the weekly quest set:
   * - 1 longer distance quest
   * - 1 variety quest (speed OR civic OR streak, rotated)
   */
  generateWeeklyQuests: async (
    userId: string,
    level: number,
    streak: number,
    decayModel?: DecayModel | null
  ): Promise<void> => {
    const todayKey = new Date().toISOString().split("T")[0];

    // 1. Weekly distance challenge
    const weeklyDistance = generateSystemDistanceQuest(level, "weekly", decayModel);
    await addMission(userId, {
      title: weeklyDistance.title,
      description: weeklyDistance.description,
      target_value: weeklyDistance.target_value,
      xp_reward: weeklyDistance.xp_reward,
      category: weeklyDistance.category,
      frequency: weeklyDistance.frequency,
      type: weeklyDistance.type,
      created_at_key: todayKey,
    });

    // 2. Variety quest — rotate between speed, civic, and streak
    const weekNum = getISOWeekNumber(new Date());
    const varietyType = weekNum % 3; // 0=speed, 1=civic, 2=streak

    let varietyQuest: QuestTemplate;
    switch (varietyType) {
      case 0:
        varietyQuest = generateSpeedQuest(level, "weekly", decayModel);
        break;
      case 1:
        varietyQuest = generateCivicQuest(level, "weekly");
        break;
      case 2:
      default:
        varietyQuest = generateStreakQuest(level, "weekly", streak);
        break;
    }

    await addMission(userId, {
      title: varietyQuest.title,
      description: varietyQuest.description,
      target_value: varietyQuest.target_value,
      xp_reward: varietyQuest.xp_reward,
      category: varietyQuest.category,
      frequency: varietyQuest.frequency,
      type: varietyQuest.type,
      created_at_key: todayKey,
    });
  },

  /**
   * Generates the monthly quest:
   * - 1 big cumulative distance challenge
   */
  generateMonthlyQuests: async (
    userId: string,
    level: number,
    streak: number,
    decayModel?: DecayModel | null
  ): Promise<void> => {
    const todayKey = new Date().toISOString().split("T")[0];

    const monthlyQuest = generateSystemDistanceQuest(level, "monthly", decayModel);

    await addMission(userId, {
      title: monthlyQuest.title,
      description: monthlyQuest.description,
      target_value: monthlyQuest.target_value,
      xp_reward: monthlyQuest.xp_reward,
      category: monthlyQuest.category,
      frequency: monthlyQuest.frequency,
      type: monthlyQuest.type,
      created_at_key: todayKey,
    });
  },

  /**
   * Expires missions that have exceeded their time window.
   * Returns the count of expired missions.
   */
  expireStaleQuests: async (userId: string): Promise<number> => {
    const activeMissions = await getMissions(userId, { status: "active" });
    const now = Date.now();
    let expiredCount = 0;

    for (const mission of activeMissions) {
      const createdAt = new Date(mission.created_at).getTime();
      const frequency = (mission.frequency as QuestFrequency) || "daily";
      const maxAgeMs = EXPIRATION_HOURS[frequency] * 60 * 60 * 1000;

      if (now - createdAt > maxAgeMs) {
        await updateMission(mission.id, { status: "expired" });
        expiredCount++;
      }
    }

    return expiredCount;
  },

  /**
   * Claims a completed quest — awards XP, gems, and updates stats.
   * Returns the total XP awarded (after streak multiplier).
   */
  claimQuest: async (
    userId: string,
    missionId: string,
    mission: { xpReward: number; type?: string; frequency?: string },
    streak: number
  ): Promise<{ xpAwarded: number; gemsAwarded: number }> => {
    // Mark as claimed
    await updateMission(missionId, { status: "claimed" });

    // Apply streak multiplier to XP
    const multiplier = getStreakMultiplier(streak);
    const xpAwarded = Math.floor(mission.xpReward * multiplier);

    // Gems are NOT multiplied (flat rate based on quest type)
    let gemsAwarded = 0;
    if (mission.type === "civic") gemsAwarded = 10;
    if (mission.frequency === "weekly") gemsAwarded += 5;
    if (mission.frequency === "monthly") gemsAwarded += 15;

    // Increment stats atomically
    const deltas: Record<string, number> = {
      xp: xpAwarded,
      total_missions_completed: 1,
    };
    if (gemsAwarded > 0) deltas.gems = gemsAwarded;

    await incrementStats(userId, deltas);

    return { xpAwarded, gemsAwarded };
  },

  /**
   * Syncs a completed run to all active distance/speed missions.
   * Called by the run tracker after a run finishes.
   */
  syncRunProgress: async (
    userId: string,
    runDistanceKm: number,
    avgSpeedKmh?: number
  ): Promise<number> => {
    const activeMissions = await getMissions(userId, { status: "active" });
    let updatedCount = 0;

    for (const mission of activeMissions) {
      let shouldUpdate = false;
      let newValue = Number(mission.current_value || 0);

      if (mission.type === "distance" || mission.type === "speed") {
        // Distance missions: add km
        newValue += runDistanceKm;
        shouldUpdate = true;
      } else if (mission.type === "streak") {
        // Streak missions: increment run count
        newValue += 1;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await updateMission(mission.id, {
          current_value: Number(newValue.toFixed(2)),
        });
        updatedCount++;
      }
    }

    return updatedCount;
  },

  /**
   * Syncs a civic report to all active civic missions.
   * Called by the CivicEngine after a successful report submission.
   */
  syncCivicProgress: async (userId: string): Promise<number> => {
    const activeMissions = await getMissions(userId, { status: "active" });
    let updatedCount = 0;

    const civicMissions = activeMissions.filter((m) => m.type === "civic");
    for (const mission of civicMissions) {
      const newValue = Number(mission.current_value || 0) + 1;
      await updateMission(mission.id, {
        current_value: newValue,
      });
      updatedCount++;
    }

    return updatedCount;
  },

  /**
   * Gets quest completion stats for the dashboard widget.
   */
  getCompletionStats: async (
    userId: string
  ): Promise<{
    overallCompletion: number;
    activeQuests: { id: string; mission: string; progress: number; xp: number }[];
    totalActive: number;
    totalCompleted: number;
  }> => {
    const active = await getMissions(userId, { status: "active" });

    const quests = active.map((m) => ({
      id: m.id,
      mission: m.title || "Unknown Mission",
      progress: m.target_value > 0 ? Number(m.current_value || 0) / m.target_value : 0,
      xp: m.xp_reward,
    }));

    // Overall = average progress across all active quests
    const overallCompletion =
      quests.length > 0
        ? quests.reduce((sum, q) => sum + Math.min(1, q.progress), 0) / quests.length
        : 0;

    // Count completed this week (claimed missions)
    const weekStart = getWeekStartDate(new Date());
    // We approximate by checking missions that exist — real count is from claimed
    const totalCompleted = active.filter(
      (m) => Number(m.current_value || 0) >= m.target_value
    ).length;

    return {
      overallCompletion,
      activeQuests: quests.slice(0, 5), // Top 5 for the widget
      totalActive: active.length,
      totalCompleted,
    };
  },
};

// ============================================================
// UTILITIES
// ============================================================

/**
 * Returns ISO week key like "2026-W26"
 */
function getWeekKey(date: Date): string {
  const weekNum = getISOWeekNumber(date);
  const year = date.getFullYear();
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

/**
 * Returns ISO week number (1-53).
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns the Monday of the current week.
 */
function getWeekStartDate(date: Date): Date {
  const d = new Date(date.getTime());
  const day = d.getDay() || 7; // Make Sunday = 7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default QuestEngine;
