import { db } from "services/database/sqlite/database";

export interface AggregatedStats {
  id: string;
  title: string;
  distance: string;
  burned: string;
  ghostWins: string;
  steps: string;
  streak: string; // Required by interface
}

export const getDynamicStats = (): AggregatedStats[] => {
  const getISOString = (daysAgo: number) => {
    const d = new Date();
    if (daysAgo === 0) d.setHours(0, 0, 0, 0);
    else d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  const ranges = [
    { id: 'daily', title: 'Daily', date: getISOString(0) },
    { id: 'weekly', title: 'Weekly', date: getISOString(7) },
    { id: 'monthly', title: 'Monthly', date: getISOString(30) },
  ];

  return ranges.map((range) => {
    const result = db.getFirstSync(`
      SELECT SUM(distance) as totalDist, COUNT(id) as totalWins 
      FROM ghost_runs WHERE date >= ?
    `, [range.date]) as any;

    const km = ((result?.totalDist || 0) / 1000).toFixed(1);

    return {
      id: range.id,
      title: range.title,
      distance: km,
      burned: Math.floor(parseFloat(km) * 60).toString(),
      ghostWins: (result?.totalWins || 0).toString(),
      steps: Math.floor(parseFloat(km) * 1310).toLocaleString(),
      streak: "0", // Placeholder that gets overwritten in the UI
    };
  });
};