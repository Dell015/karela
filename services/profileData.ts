/**
 * Data for the Profile screen. Everything shown there comes from the user's
 * real records: run_history (every finished run), civic_reports, and the
 * profile stats. Nothing here is sample data.
 */
import { supabase } from "./database/supabase/config";
import { logRequestError } from "./networkErrors";
import { getRunsSince, RunRow } from "./calendarData";

export interface RunRecords {
  totalRuns: number;
  totalM: number;
  totalS: number;
  longestM: number;
  /** seconds per km on the fastest run of at least 1 km, null if none */
  fastestPaceS: number | null;
  /** distance since Monday, local time */
  thisWeekM: number;
  recent: RunRow[];
}

const startOfWeek = (now: Date) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
  return d;
};

export const computeRecords = (runs: RunRow[], now = new Date()): RunRecords => {
  const weekStart = startOfWeek(now).getTime();
  let totalM = 0;
  let totalS = 0;
  let longestM = 0;
  let fastestPaceS: number | null = null;
  let thisWeekM = 0;
  for (const r of runs) {
    const m = Number(r.distance_meters) || 0;
    const s = Number(r.duration_seconds) || 0;
    totalM += m;
    totalS += s;
    longestM = Math.max(longestM, m);
    // Under 1 km a pace is too noisy (a GPS jump looks like a sprint).
    if (m >= 1000 && s > 0) {
      const pace = s / (m / 1000);
      if (fastestPaceS === null || pace < fastestPaceS) fastestPaceS = pace;
    }
    if (new Date(r.completed_at).getTime() >= weekStart) thisWeekM += m;
  }
  return { totalRuns: runs.length, totalM, totalS, longestM, fastestPaceS, thisWeekM, recent: runs.slice(0, 3) };
};

/** Every run since the account was made (at most 500, newest first). */
export const getRunRecords = async (userId: string, since: Date): Promise<RunRecords | null> => {
  const runs = await getRunsSince(userId, since);
  return runs ? computeRecords(runs) : null;
};

/** "5:42 /km" */
export const formatPace = (secPerKm: number) => {
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${`${s % 60}`.padStart(2, "0")} /km`;
};

export interface CivicSummary {
  filed: number;
  /** reports on a spot that neighbours have since confirmed */
  verified: number;
}

export const getCivicSummary = async (userId: string): Promise<CivicSummary | null> => {
  const { data, error } = await supabase
    .from("civic_reports")
    .select("node_id, civic_nodes(status)")
    .eq("user_id", userId)
    .limit(1000);
  if (error || !data) {
    logRequestError("Profile: could not load civic reports:", error);
    return null;
  }
  const verified = data.filter((r: any) => {
    const node = Array.isArray(r.civic_nodes) ? r.civic_nodes[0] : r.civic_nodes;
    return node?.status === "verified" || node?.status === "aging";
  }).length;
  return { filed: data.length, verified };
};

export interface Badge {
  id: string;
  label: string;
  hint: string; // how to earn it, shown while locked
  icon: string; // Ionicons name
  civic?: boolean;
  earned: boolean;
}

/**
 * Milestones, all earned from real activity. No purchase, no streak
 * pressure in bad weather: they only mark what already happened.
 */
export const computeBadges = (
  rec: RunRecords | null,
  civic: CivicSummary | null,
  bestStreak: number,
): Badge[] => [
  { id: "first_run", label: "First run", hint: "Finish a run", icon: "footsteps-outline", earned: (rec?.totalRuns ?? 0) >= 1 },
  { id: "5k", label: "5 km run", hint: "Run 5 km in one go", icon: "ribbon-outline", earned: (rec?.longestM ?? 0) >= 5000 },
  { id: "10k", label: "10 km run", hint: "Run 10 km in one go", icon: "medal-outline", earned: (rec?.longestM ?? 0) >= 10000 },
  { id: "total50", label: "50 km total", hint: "Run 50 km in all", icon: "map-outline", earned: (rec?.totalM ?? 0) >= 50000 },
  { id: "streak7", label: "7-day streak", hint: "Run 7 days in a row", icon: "flame-outline", earned: bestStreak >= 7 },
  { id: "streak30", label: "30-day streak", hint: "Run 30 days in a row", icon: "bonfire-outline", earned: bestStreak >= 30 },
  { id: "first_report", label: "First report", hint: "Report a problem in your area", icon: "megaphone-outline", civic: true, earned: (civic?.filed ?? 0) >= 1 },
  { id: "verified", label: "Confirmed", hint: "Have a report confirmed by neighbours", icon: "checkmark-done-outline", civic: true, earned: (civic?.verified ?? 0) >= 1 },
];
