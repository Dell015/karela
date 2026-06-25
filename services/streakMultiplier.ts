/**
 * Streak Multiplier System
 * 
 * Per README spec:
 * Day 1–3:   1.0x (baseline)
 * Day 4–6:   1.2x
 * Day 7–13:  1.5x
 * Day 14–29: 2.0x
 * Day 30+:   3.0x (Consistency Cap)
 * 
 * Breaking a streak resets the multiplier to 1.0x immediately.
 */

export const getStreakMultiplier = (streakDays: number): number => {
  if (streakDays >= 30) return 3.0;
  if (streakDays >= 14) return 2.0;
  if (streakDays >= 7) return 1.5;
  if (streakDays >= 4) return 1.2;
  return 1.0;
};

/**
 * Returns the tier label for display purposes.
 */
export const getStreakTier = (
  streakDays: number
): { multiplier: number; label: string; nextTierAt: number | null } => {
  if (streakDays >= 30) {
    return { multiplier: 3.0, label: "Consistency Cap", nextTierAt: null };
  }
  if (streakDays >= 14) {
    return { multiplier: 2.0, label: "Dedicated", nextTierAt: 30 };
  }
  if (streakDays >= 7) {
    return { multiplier: 1.5, label: "Committed", nextTierAt: 14 };
  }
  if (streakDays >= 4) {
    return { multiplier: 1.2, label: "Building", nextTierAt: 7 };
  }
  return { multiplier: 1.0, label: "Baseline", nextTierAt: 4 };
};

/**
 * Applies the streak multiplier to a raw XP amount.
 * Returns the boosted XP (floored to integer).
 */
export const applyStreakMultiplier = (rawXP: number, streakDays: number): number => {
  const multiplier = getStreakMultiplier(streakDays);
  return Math.floor(rawXP * multiplier);
};
