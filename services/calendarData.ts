/**
 * Data for the Calendar screen: the user's real runs grouped by day.
 *
 * Source: Supabase run_history, which gets every finished run
 * (app/summary.tsx -> logRunHistory). The local ghost_runs table only holds
 * runs saved as a ghost, so it would miss most days.
 *
 * Dates are grouped by the phone's local day, so a run at 11 PM counts for
 * that evening, not the next UTC day.
 */
import { supabase } from "./database/supabase/config";
import { logRequestError } from "./networkErrors";

export interface RunRow {
  id: string;
  distance_meters: number;
  duration_seconds: number;
  calories: number;
  xp_earned: number;
  completed_at: string;
}

export interface DayTotals {
  key: string; // YYYY-MM-DD, local time
  distanceM: number;
  durationS: number;
  xp: number;
  runs: RunRow[];
}

/** Local-time YYYY-MM-DD for a date. */
export const dayKey = (d: Date): string => {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Groups runs by local day. */
export const groupRunsByDay = (runs: RunRow[]): Map<string, DayTotals> => {
  const byDay = new Map<string, DayTotals>();
  for (const r of runs) {
    const key = dayKey(new Date(r.completed_at));
    const t = byDay.get(key) ?? { key, distanceM: 0, durationS: 0, xp: 0, runs: [] };
    t.distanceM += Number(r.distance_meters) || 0;
    t.durationS += Number(r.duration_seconds) || 0;
    t.xp += Number(r.xp_earned) || 0;
    t.runs.push(r);
    byDay.set(key, t);
  }
  return byDay;
};

/** Adds up a set of days. */
export const sumDays = (days: (DayTotals | undefined)[]) =>
  days.reduce(
    (acc, d) => ({
      distanceM: acc.distanceM + (d?.distanceM ?? 0),
      durationS: acc.durationS + (d?.durationS ?? 0),
      xp: acc.xp + (d?.xp ?? 0),
      runCount: acc.runCount + (d?.runs.length ?? 0),
    }),
    { distanceM: 0, durationS: 0, xp: 0, runCount: 0 },
  );

/**
 * Cells for a month grid that starts on Monday. Leading blanks are null.
 * month is 0-based (0 = January).
 */
export const buildMonthGrid = (year: number, month: number): (Date | null)[] => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Sunday=0 -> 6, Monday=1 -> 0
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
};

/** The last n days ending today, oldest first. */
export const lastNDays = (n: number, today = new Date()): Date[] =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });

export const formatKm = (m: number) => `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km`;

export const formatDuration = (totalS: number) => {
  const s = Math.round(totalS);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${`${m}`.padStart(2, "0")}:${`${sec}`.padStart(2, "0")}`
    : `${m}:${`${sec}`.padStart(2, "0")}`;
};

/**
 * Runs completed on or after `since`, newest first. One small query.
 * Returns null on error (offline, etc.) so the screen can say so.
 */
export const getRunsSince = async (userId: string, since: Date): Promise<RunRow[] | null> => {
  const { data, error } = await supabase
    .from("run_history")
    .select("id, distance_meters, duration_seconds, calories, xp_earned, completed_at")
    .eq("user_id", userId)
    .gte("completed_at", since.toISOString())
    .order("completed_at", { ascending: false })
    .limit(500);
  if (error) {
    logRequestError("Calendar: could not load runs:", error);
    return null;
  }
  return (data ?? []) as RunRow[];
};
