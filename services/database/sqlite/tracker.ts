import { saveGhostRun } from "./database";

export const trackerService = {
  /**
   * Analyzes the finished run and triggers the save process.
   */
  saveRunAndAnalyze: async (
    distance: number,
    duration: number,
    path: any[],
  ) => {
    if (!path || path.length === 0) return null;

    // Trigger the unified save function
    const result = await saveGhostRun(distance, duration, path);

    if (result) {
      console.log(`[Tracker] Run Analyzed & Saved: ${result.avgSpeed} km/h`);
      return {
        avgSpeed: result.avgSpeed,
        distance: result.distance,
        duration: result.duration,
        date: new Date().toISOString(),
      };
    }
    return null;
  },
};
