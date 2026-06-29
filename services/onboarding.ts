/**
 * ============================================================
 * 7-DAY ONBOARDING ARC
 * ============================================================
 *
 * The structured first-week experience per the README spec.
 * Each day has a specific quest with increasing complexity:
 *
 * Day 1: First Step — 500m walk (prove the app works)
 * Day 2: Neighborhood Scout — 1km + map interaction
 * Day 3: The Daily Route — repeat Day 1 route (Ghost concept)
 * Day 4: Community Eye — photo a local issue (civic intro)
 * Day 5: Squad Up — social layer unlock
 * Day 6: The Push — beat Day 3 ghost
 * Day 7: Week Warrior — any 1km+ mission (streak milestone)
 *
 * On Day 7 completion: unlock 1.5× multiplier, shareable summary card.
 */

import { addMission } from "./database/supabase/missions";
import { setStats } from "./database/supabase/profiles";

export interface OnboardingDay {
  day: number;
  title: string;
  description: string;
  target_value: number;  // km
  xp_reward: number;
  gem_reward: number;
  type: "distance" | "civic" | "social";
  milestone?: string;
}

export const ONBOARDING_ARC: OnboardingDay[] = [
  {
    day: 1,
    title: "First Step",
    description: "Walk 500m to calibrate your sensors. Ani is watching.",
    target_value: 0.5,
    xp_reward: 100,
    gem_reward: 20,
    type: "distance",
    milestone: "Ghost seed planted — your first route is saved.",
  },
  {
    day: 2,
    title: "Neighborhood Scout",
    description: "Cover 1km and explore your local map. Discover what's around you.",
    target_value: 1.0,
    xp_reward: 150,
    gem_reward: 15,
    type: "distance",
  },
  {
    day: 3,
    title: "The Daily Route",
    description: "Run or walk 1km on your usual path. Your Ghost is now racing alongside you.",
    target_value: 1.0,
    xp_reward: 150,
    gem_reward: 15,
    type: "distance",
    milestone: "Ghost concept unlocked — race against yourself.",
  },
  {
    day: 4,
    title: "Community Eye",
    description: "Spot and report 1 local issue (pothole, trash, flooding). Snap a photo.",
    target_value: 1,
    xp_reward: 200,
    gem_reward: 30,
    type: "civic",
    milestone: "Civic reporting unlocked — you're now a sensor for your city.",
  },
  {
    day: 5,
    title: "Squad Up",
    description: "Complete a 1km walk. Tomorrow you'll be able to invite teammates.",
    target_value: 1.0,
    xp_reward: 150,
    gem_reward: 15,
    type: "distance",
  },
  {
    day: 6,
    title: "The Push",
    description: "Push to 1.5km — try to beat your Ghost from Day 3. Every sector counts.",
    target_value: 1.5,
    xp_reward: 200,
    gem_reward: 25,
    type: "distance",
    milestone: "Sector bonus system active — 5 gems per 500m.",
  },
  {
    day: 7,
    title: "Week Warrior",
    description: "Complete any 2km mission to earn your first streak milestone. You made it.",
    target_value: 2.0,
    xp_reward: 300,
    gem_reward: 50,
    type: "distance",
    milestone: "🔥 7-day streak achieved! 1.5× XP multiplier unlocked.",
  },
];

/**
 * Determines which onboarding day the user is on.
 * Returns null if they've completed the full arc.
 */
export const getOnboardingDay = (stats: any): number | null => {
  const completedDays = Number(stats?.onboarding_day_completed || 0);
  if (completedDays >= 7) return null; // Arc complete
  return completedDays + 1;
};

/**
 * Checks if today's onboarding quest needs to be assigned.
 * Should be called on dashboard load.
 */
export const shouldAssignOnboardingQuest = (stats: any): boolean => {
  const day = getOnboardingDay(stats);
  if (day === null) return false;

  // Already assigned today's onboarding quest
  const todayKey = new Date().toISOString().split("T")[0];
  return stats?.onboarding_last_assigned !== todayKey;
};

/**
 * Assigns the next onboarding quest for the user.
 * Call this from the dashboard's daily reset logic.
 */
export const assignOnboardingQuest = async (userId: string, stats: any): Promise<boolean> => {
  const day = getOnboardingDay(stats);
  if (day === null) return false;

  const quest = ONBOARDING_ARC[day - 1];
  const todayKey = new Date().toISOString().split("T")[0];

  await addMission(userId, {
    title: `Day ${day}: ${quest.title}`,
    description: quest.description,
    target_value: quest.target_value,
    xp_reward: quest.xp_reward,
    category: "solo",
    frequency: "daily",
    type: quest.type === "civic" ? "civic" : "distance",
    created_at_key: todayKey,
  });

  await setStats(userId, { onboarding_last_assigned: todayKey });
  return true;
};

/**
 * Marks the current onboarding day as complete.
 * Call this when the user claims the onboarding mission reward.
 */
export const completeOnboardingDay = async (userId: string, stats: any): Promise<OnboardingDay | null> => {
  const day = getOnboardingDay(stats);
  if (day === null) return null;

  const quest = ONBOARDING_ARC[day - 1];

  await setStats(userId, {
    onboarding_day_completed: day,
  });

  return quest;
};

/**
 * Returns progress info for the onboarding UI.
 */
export const getOnboardingProgress = (stats: any) => {
  const currentDay = getOnboardingDay(stats);
  const completed = Number(stats?.onboarding_day_completed || 0);

  return {
    currentDay,
    completedDays: completed,
    totalDays: 7,
    isComplete: completed >= 7,
    progress: completed / 7,
    currentQuest: currentDay ? ONBOARDING_ARC[currentDay - 1] : null,
  };
};
