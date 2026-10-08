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
 * 3. Protected days (supabase/10_streak_protection_and_shop.sql): a Streak
 *    Freeze, Streak Repair or squad Collective Shield keeps the streak alive
 *    on a day without a run. The server counts them; settleStreak() asks it
 *    to use any freezes and recount, and saves streak_protected_through on
 *    the profile so getEffectiveStreak() knows about them too.
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
type StreakStats = {
  streak?: number | string;
  last_active_date?: string;
  /** "YYYY-MM-DD", the latest protected day (set by the server). */
  streak_protected_through?: string;
};

/** The later of the last run day and the last protected day. */
const lastCoveredDay = (stats: StreakStats): Date | null => {
  const run = stats.last_active_date ? startOfDay(new Date(stats.last_active_date)) : null;
  const p = stats.streak_protected_through?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const prot = p ? new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3])) : null;
  if (!run) return prot;
  if (!prot) return run;
  return prot > run ? prot : run;
};

export const getEffectiveStreak = (
  stats: StreakStats | null | undefined,
  now = new Date(),
): number => {
  const stored = Number(stats?.streak || 0);
  if (!stats || stored <= 0) return 0;
  const last = lastCoveredDay(stats);
  if (!last) return 0;
  const yesterday = startOfDay(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return last >= yesterday ? stored : 0;
};

/** True when the user has not run today but still has a live streak. */
export const isStreakAtRisk = (
  stats: StreakStats | null | undefined,
  now = new Date(),
): boolean => {
  if (!stats || getEffectiveStreak(stats, now) === 0) return false;
  const last = lastCoveredDay(stats);
  return !last || dayKey(last) !== dayKey(now);
};

export interface SettleResult {
  streak: number;
  freezes_used: number;
  freezes_left: number;
  at_risk: boolean;
}

/**
 * Asks the server to use Streak Freezes for missed days, recount the streak
 * (runs plus protected days) and save it on the profile. Returns null when
 * the server function isn't there yet (migration 10 not run) or offline.
 */
export const settleStreak = async (): Promise<SettleResult | null> => {
  const { data, error } = await supabase.rpc("settle_streak");
  if (error) {
    logRequestError("Streak: settle failed:", error);
    return null;
  }
  return data as SettleResult;
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
