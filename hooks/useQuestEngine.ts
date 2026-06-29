/**
 * useQuestEngine — React hook for interacting with the Quest Engine.
 *
 * Provides:
 * - Auto-generation on mount (if quests are stale)
 * - Quest completion stats for dashboard widgets
 * - Claim + progress sync utilities
 */

import { useAuth } from "@/context/AuthContext";
import { QuestEngine, GenerationResult } from "@/services/engines/QuestEngine";
import { subscribeToMissions, MissionRow } from "@/services/database/supabase/missions";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseQuestEngineResult {
  /** Whether initial quest generation is in progress */
  isGenerating: boolean;
  /** Last generation result (null if not yet attempted) */
  lastResult: GenerationResult | null;
  /** Active missions (raw from subscription) */
  activeMissions: MissionRow[];
  /** Overall completion ratio (0-1) across active quests */
  overallCompletion: number;
  /** Loading state for mission subscription */
  loading: boolean;
  /** Manually trigger quest generation */
  regenerate: () => Promise<GenerationResult | null>;
  /** Claim a completed quest */
  claimQuest: (missionId: string, xpReward: number, type?: string, frequency?: string) => Promise<void>;
  /** Sync a run's distance to all active missions */
  syncRun: (distanceKm: number, avgSpeedKmh?: number) => Promise<number>;
  /** Sync a civic report to all active civic missions */
  syncCivic: () => Promise<number>;
}

export const useQuestEngine = (
  options: {
    /** Auto-generate on mount? (default: true) */
    autoGenerate?: boolean;
    /** Subscribe to missions in real-time? (default: true) */
    subscribe?: boolean;
    /** Filter: category */
    category?: "solo" | "team";
    /** Filter: frequency */
    frequency?: "daily" | "weekly" | "monthly" | "limited";
  } = {}
): UseQuestEngineResult => {
  const {
    autoGenerate = true,
    subscribe = true,
    category,
    frequency,
  } = options;

  const { user, profile, gainXP } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  const [activeMissions, setActiveMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const genAttempted = useRef(false);

  // --- Auto-generation ---
  const regenerate = useCallback(async (): Promise<GenerationResult | null> => {
    if (!profile?.uid || !profile?.stats || isGenerating) return null;

    setIsGenerating(true);
    try {
      const result = await QuestEngine.generateQuests({
        userId: profile.uid,
        stats: profile.stats,
        decayModel: null, // TODO: integrate GhostModelManager
        runHistory: [],
      });
      setLastResult(result);
      return result;
    } catch (err) {
      console.error("useQuestEngine: generation failed", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [profile?.uid, profile?.stats, isGenerating]);

  useEffect(() => {
    if (autoGenerate && profile?.uid && !genAttempted.current) {
      genAttempted.current = true;
      regenerate();
    }
  }, [autoGenerate, profile?.uid]);

  // --- Real-time subscription ---
  useEffect(() => {
    if (!subscribe || !user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const filters: { status?: string; category?: string; frequency?: string } = {
      status: "active",
    };
    if (category) filters.category = category;
    if (frequency) filters.frequency = frequency;

    const unsubscribe = subscribeToMissions(user.uid, filters, (rows) => {
      setActiveMissions(rows);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [subscribe, user?.uid, category, frequency]);

  // --- Overall completion ---
  const overallCompletion =
    activeMissions.length > 0
      ? activeMissions.reduce((sum, m) => {
          const progress = m.target_value > 0 ? m.current_value / m.target_value : 0;
          return sum + Math.min(1, progress);
        }, 0) / activeMissions.length
      : 0;

  // --- Claim ---
  const claimQuest = useCallback(
    async (missionId: string, xpReward: number, type?: string, freq?: string) => {
      if (!user?.uid) return;

      const streak = Number(profile?.stats?.streak || 0);
      await QuestEngine.claimQuest(
        user.uid,
        missionId,
        { xpReward, type, frequency: freq },
        streak
      );
      await gainXP(0); // Trigger level normalization
    },
    [user?.uid, profile?.stats?.streak, gainXP]
  );

  // --- Sync run ---
  const syncRun = useCallback(
    async (distanceKm: number, avgSpeedKmh?: number): Promise<number> => {
      if (!user?.uid) return 0;
      return QuestEngine.syncRunProgress(user.uid, distanceKm, avgSpeedKmh);
    },
    [user?.uid]
  );

  // --- Sync civic ---
  const syncCivic = useCallback(async (): Promise<number> => {
    if (!user?.uid) return 0;
    return QuestEngine.syncCivicProgress(user.uid);
  }, [user?.uid]);

  return {
    isGenerating,
    lastResult,
    activeMissions,
    overallCompletion,
    loading,
    regenerate,
    claimQuest,
    syncRun,
    syncCivic,
  };
};
