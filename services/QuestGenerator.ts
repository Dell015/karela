import { QuestEngine } from "./engines/QuestEngine";

/**
 * @deprecated Use QuestEngine.generateQuests() instead.
 * This file is kept for backward compatibility only.
 */
export const QuestGenerator = {
  /**
   * Generates the daily set of missions.
   * @deprecated Use QuestEngine.generateQuests() for full lifecycle management.
   */
  generateDailySet: async (userProfile: any) => {
    console.warn("QuestGenerator.generateDailySet is deprecated. Use QuestEngine.generateQuests() instead.");

    if (!userProfile?.uid || !userProfile?.stats) {
      return [];
    }

    const result = await QuestEngine.generateQuests({
      userId: userProfile.uid,
      stats: userProfile.stats,
    });

    // Return a compatible shape for any legacy callers
    return result.generated.length > 0
      ? [{ id: "delegated", title: "Generated via QuestEngine" }]
      : [];
  },
};