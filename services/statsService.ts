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
    SELECT DISTINCT date FROM ghost_runs 
    ORDER BY date DESC
  `) as any[];

  if (rows.length === 0) return 0;

  // Standardize "Today" to midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique days (milliseconds) from DB to avoid duplicate entries on same day breaking logic
  const runDays = Array.from(
    new Set(
      rows.map((r) => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    ),
  );

  let streak = 0;

  // Check if the user has run today or yesterday.
  // If the latest run is older than yesterday, the streak is broken (0).
  const latestRun = runDays[0];
  if (today.getTime() - latestRun > 86400000) {
    return 0;
  }

  for (let i = 0; i < runDays.length; i++) {
    // We expect the date to be Today - (i days)
    const expectedDate = today.getTime() - i * 86400000;

    // If the user didn't run today, but ran yesterday, the streak can still be valid
    // This handles the case where you haven't run YET today.
    const dateToCheck = runDays.includes(today.getTime())
      ? expectedDate
      : today.getTime() - (i + 1) * 86400000;

    if (runDays.includes(dateToCheck)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};
