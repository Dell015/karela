import { db } from "services/database/sqlite/database";

export interface AggregatedStats {
  id: string;
  title: string;
  distance: string;
  burned: string;
  ghostWins: string;
  steps: string;
  streak: string;
}

export const getDynamicStats = (): AggregatedStats[] => {
  // 1. Calculate the actual streak from the DB first
  const realStreak = calculateStreak().toString();

  const getTimestamp = (daysAgo: number) => {
    const d = new Date();
    if (daysAgo === 0) d.setHours(0, 0, 0, 0);
    else d.setDate(d.getDate() - daysAgo);
    return d.getTime();
  };

  const ranges = [
    { id: "daily", title: "Daily", date: getTimestamp(0) },
    { id: "weekly", title: "Weekly", date: getTimestamp(7) },
    { id: "monthly", title: "Monthly", date: getTimestamp(30) },
  ];

  return ranges.map((range) => {
    const result = db.getFirstSync(
      `
      SELECT SUM(distance) as totalDist, COUNT(id) as totalWins 
      FROM ghost_runs WHERE date >= ?
    `,
      [range.date],
    ) as any;

    const km = ((result?.totalDist || 0) / 1000).toFixed(1);

    return {
      id: range.id,
      title: range.title,
      distance: km,
      burned: Math.floor(parseFloat(km) * 60).toString(),
      ghostWins: (result?.totalWins || 0).toString(),
      steps: Math.floor(parseFloat(km) * 1310).toLocaleString(),
      streak: realStreak, // <--- CHANGED: Now uses the calculated value
    };
  });
};

export const getChartData = (): { timestamp: number; value: number }[] => {
  try {
    const rows = db.getAllSync(`
      SELECT date, distance 
      FROM ghost_runs 
      ORDER BY date DESC 
      LIMIT 30 
    `) as any[];

    return rows
      .map((row) => ({
        timestamp: new Date(row.date).getTime(),
        value: parseFloat((row.distance / 1000).toFixed(2)),
      }))
      .reverse();
  } catch (e) {
    console.error("Error fetching chart data:", e);
    return [];
  }
};

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

  // Get unique calendar days from the DB
  const runDays = Array.from(new Set(rows.map((r) => stripTime(r.date))));

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
