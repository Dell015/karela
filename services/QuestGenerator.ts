import { generateAniQuest } from "./database/firebase/aiService";
import { setLocalMissions } from "./database/sqlite/database";

export const QuestGenerator = {
  /**
   * Generates the daily set of missions
   */
  generateDailySet: async (userProfile: any) => {
    const quests = [];

    // 1. GENERATE SYSTEM QUEST (The "Normal" one)
    // Basic logic: Level 1 = 1km, Level 2 = 1.5km, etc.
    const level = userProfile.stats?.level || 1;
    const systemQuest = {
      id: `sys_${Date.now()}`,
      title: "Daily Baseline",
      goalDistance: 1000 + (level * 500), 
      goalSpeed: 8.0,
      rewardXP: 100,
    };
    quests.push(systemQuest);

    // 2. GENERATE ANI QUEST (The "Special" one)
    const aniQuest = await generateAniQuest(userProfile);
    if (aniQuest) {
      // Add a flag or prefix to identify Ani's quest in the UI
      quests.push({ ...aniQuest, id: `ani_${aniQuest.id}` });
    }

    // 3. SAVE TO SQLITE
    if (quests.length > 0) {
      setLocalMissions(quests);
    }

    return quests;
  }
};