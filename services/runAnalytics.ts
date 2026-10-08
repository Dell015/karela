/**
 * Numbers for the Progress charts, worked out from run_history (every
 * finished run; see services/calendarData.ts). Pure functions: no network.
 *
 * Pace is seconds per km. Runs under 300 m or with an impossible pace
 * (faster than 2:30 or slower than 20:00 per km) are left out of pace
 * figures so one GPS glitch can't wreck an average.
 */
import { dayKey, groupRunsByDay, lastNDays, RunRow } from "./calendarData";
import { paceText } from "./runMath";

export const MIN_PACE_KM = 0.3;
const PACE_MIN_S = 150; // 2:30 /km
const PACE_MAX_S = 1200; // 20:00 /km

export interface BarPoint {
  /** first day of the bucket */
  date: Date;
  /** last day of the bucket (same as date for daily buckets) */
  end: Date;
  km: number;
  runs: number;
}

export interface PacePoint {
  date: Date;
  km: number;
  paceS: number;
}

export interface RunAnalysis {
  days: number;
  /** one bar per day (ranges up to 31 days) or per week (longer ranges) */
  buckets: BarPoint[];
  bucket: "day" | "week";
  totalKm: number;
  runs: number;
  activeDays: number;
  durationS: number;
  calories: number;
  /** total time / total distance, for runs with a sensible pace */
  avgPaceS: number | null;
  bestBucket: BarPoint | null;
  longestRun: { date: Date; km: number } | null;
  fastest: PacePoint | null;
  pace: PacePoint[];
  /** km per weekday, Monday first */
  weekdayKm: number[];
  weekdayRuns: number[];
  /** longest run of consecutive active days inside the range */
  bestStreak: number;
  /**
   * Seconds per km the pace changed from the first half of the runs to the
   * second half (negative = got faster). Null with fewer than 4 runs.
   */
  paceTrendS: number | null;
}

const km = (m: number) => (Number(m) || 0) / 1000;

const paceOf = (r: RunRow): number | null => {
  const k = km(r.distance_meters);
  const s = Number(r.duration_seconds) || 0;
  if (k < MIN_PACE_KM || s <= 0) return null;
  const p = s / k;
  return p >= PACE_MIN_S && p <= PACE_MAX_S ? p : null;
};

export const analyzeRuns = (runs: RunRow[], days: number, today = new Date()): RunAnalysis => {
  const dates = lastNDays(days, today);
  const start = dates[0];
  const inRange = runs.filter((r) => new Date(r.completed_at) >= start);
  const byDay = groupRunsByDay(inRange);

  const daily: BarPoint[] = dates.map((d) => {
    const t = byDay.get(dayKey(d));
    return { date: d, end: d, km: t ? km(t.distanceM) : 0, runs: t?.runs.length ?? 0 };
  });

  // Weekly buckets for long ranges, so bars stay readable on a phone.
  const bucket: "day" | "week" = days > 31 ? "week" : "day";
  let buckets = daily;
  if (bucket === "week") {
    buckets = [];
    for (let i = daily.length; i > 0; i -= 7) {
      const slice = daily.slice(Math.max(0, i - 7), i);
      buckets.unshift({
        date: slice[0].date,
        end: slice[slice.length - 1].date,
        km: slice.reduce((a, b) => a + b.km, 0),
        runs: slice.reduce((a, b) => a + b.runs, 0),
      });
    }
  }

  const pace: PacePoint[] = inRange
    .map((r) => ({ r, p: paceOf(r) }))
    .filter((x): x is { r: RunRow; p: number } => x.p !== null)
    .map(({ r, p }) => ({ date: new Date(r.completed_at), km: km(r.distance_meters), paceS: p }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const paceKm = pace.reduce((a, b) => a + b.km, 0);
  const paceS = pace.reduce((a, b) => a + b.paceS * b.km, 0);

  let bestStreak = 0;
  let run = 0;
  for (const d of daily) {
    run = d.runs > 0 ? run + 1 : 0;
    bestStreak = Math.max(bestStreak, run);
  }

  const weekdayKm = [0, 0, 0, 0, 0, 0, 0];
  const weekdayRuns = [0, 0, 0, 0, 0, 0, 0];
  for (const r of inRange) {
    const wd = (new Date(r.completed_at).getDay() + 6) % 7; // Monday = 0
    weekdayKm[wd] += km(r.distance_meters);
    weekdayRuns[wd] += 1;
  }

  let paceTrendS: number | null = null;
  if (pace.length >= 4) {
    const half = Math.floor(pace.length / 2);
    const avg = (xs: PacePoint[]) => xs.reduce((a, b) => a + b.paceS, 0) / xs.length;
    paceTrendS = avg(pace.slice(half)) - avg(pace.slice(0, half));
  }

  const longest = inRange.reduce<RunRow | null>(
    (best, r) => (!best || km(r.distance_meters) > km(best.distance_meters) ? r : best),
    null,
  );
  const bestBucket = buckets.reduce<BarPoint | null>((b, x) => (x.km > 0 && (!b || x.km > b.km) ? x : b), null);

  return {
    days,
    buckets,
    bucket,
    totalKm: daily.reduce((a, b) => a + b.km, 0),
    runs: inRange.length,
    activeDays: daily.filter((d) => d.runs > 0).length,
    durationS: inRange.reduce((a, r) => a + (Number(r.duration_seconds) || 0), 0),
    calories: inRange.reduce((a, r) => a + (Number(r.calories) || 0), 0),
    avgPaceS: paceKm > 0 ? paceS / paceKm : null,
    bestBucket,
    longestRun: longest ? { date: new Date(longest.completed_at), km: km(longest.distance_meters) } : null,
    fastest: pace.reduce<PacePoint | null>((b, p) => (!b || p.paceS < b.paceS ? p : b), null),
    pace,
    weekdayKm,
    weekdayRuns,
    bestStreak,
    paceTrendS,
  };
};

/** "6:12" for 372 seconds per km. */
export const formatPace = (s: number | null) => paceText(s);

export const formatKmValue = (k: number) => (k >= 100 ? k.toFixed(0) : k >= 10 ? k.toFixed(1) : k.toFixed(2));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "Oct 7" */
export const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

/** "Oct 1 to 7" or "Sep 29 to Oct 5" for a week bucket; "Tue, Oct 7" for a day. */
export const bucketLabel = (b: BarPoint, kind: "day" | "week") => {
  if (kind === "day") return `${WEEKDAYS[(b.date.getDay() + 6) % 7]}, ${shortDate(b.date)}`;
  return b.date.getMonth() === b.end.getMonth()
    ? `${shortDate(b.date)} to ${b.end.getDate()}`
    : `${shortDate(b.date)} to ${shortDate(b.end)}`;
};
