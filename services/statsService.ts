import { db } from "@/services/database/sqlite/database";

/**
 * Last-resort streak count from the phone's saved ghost runs, used by the
 * summary screen only when neither the server (settle_streak) nor
 * run_history can be reached. Charts and totals use run_history
 * (services/runAnalytics.ts).
 */
export const calculateStreak = (): number => {
  const rows = db.getAllSync(`
    SELECT date FROM ghost_runs 
    ORDER BY date DESC
  `) as any[];

  if (rows.length === 0) return 0;

  // Helper to strip time from a date
  const stripTime = (dateInput: number | string | Date) => {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const today = stripTime(Date.now());

  // Get unique calendar days from the DB, sorted descending (most recent first)
  const runDays = Array.from(new Set(rows.map((r) => stripTime(r.date)))).sort(
    (a, b) => b - a,
  );

  // Check if the most recent run was today or yesterday
  // If the last run is older than 1 day ago, the streak is dead.
  const latestRun = runDays[0];
  const diffInMs = today - latestRun;
  const oneDayInMs = 86400000;

  if (diffInMs > oneDayInMs) {
    return 0; // Streak broken: last run was more than 24h before today started
  }

  let streak = 0;
  // Start checking from the most recent run day and count backwards
  for (let i = 0; i < runDays.length; i++) {
    const expectedDate = latestRun - i * oneDayInMs;

    if (runDays.includes(expectedDate)) {
      streak++;
    } else {
      break; // Gap found
    }
  }

  return streak;
};
