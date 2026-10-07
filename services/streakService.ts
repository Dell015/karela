/**
 * Streak: consecutive days with at least one finished run.
 *
 * Two rules every screen and the XP multiplier must agree on:
 *
 * 1. The stored streak (profile.stats.streak) is only updated when a run is
 *    finished. If the user then misses a day, it still holds the old number.
 *    getEffectiveStreak() returns 0 once the last run is older than
 *    yesterday, so nobody keeps a multiplier they have lost.
 *
 * 2. The streak is counted from run_history, which has every finished run.
 *    (The old count used the local ghost_runs table, which only holds runs
 *    the user chose to save as a ghost.)
 *
 * Tiers and multipliers live in services/streakMultiplier.ts.
 */
import { dayKey } from "./calendarData";
import { logRequestError } from "./networkErrors";
import { supabase } from "./database/supabase/config";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * The streak that actually counts right now. last_active_date is set when a
 * run is finished (app/summary.tsx).
 */
export const getEffectiveStreak = (
  stats: { streak?: number | string; last_active_date?: string } | null | undefined,
  now = new Date(),
): number => {
  const stored = Number(stats?.streak || 0);
  if (stored <= 0 || !stats?.last_active_date) return 0;
  const last = startOfDay(new Date(stats.last_active_date));
  const yesterday = startOfDay(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return last >= yesterday ? stored : 0;
};

/** True when the user has not run today but still has a live streak. */
export const isStreakAtRisk = (
  stats: { streak?: number | string; last_active_date?: string } | null | undefined,
  now = new Date(),
): boolean => {
  if (getEffectiveStreak(stats, now) === 0 || !stats?.last_active_date) return false;
  return dayKey(new Date(stats.last_active_date)) !== dayKey(now);
};

/** Counts consecutive run days ending today (or yesterday, if today has none yet). */
export const streakFromDayKeys = (days: Set<string>, now = new Date()): number => {
  const cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * Recounts the streak from run_history. Reads only the completion times of
 * the last 400 days (a few KB). Returns null if it cannot be read.
 */
export const fetchStreakFromHistory = async (userId: string, now = new Date()): Promise<number | null> => {
  const since = startOfDay(now);
  since.setDate(since.getDate() - 400);
  const { data, error } = await supabase
    .from("run_history")
    .select("completed_at")
    .eq("user_id", userId)
    .gte("completed_at", since.toISOString())
    .order("completed_at", { ascending: false })
    .limit(2000);
  if (error || !data) {
    logRequestError("Streak: could not read run history:", error);
    return null;
  }
  const days = new Set(data.map((r: { completed_at: string }) => dayKey(new Date(r.completed_at))));
  return streakFromDayKeys(days, now);
};
