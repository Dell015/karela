import { db } from './database'; // Import the db instance from your config file

export const trackerService = {
  /**
   * Saves the run to SQLite and calculates performance metrics
   * for the Adaptive Difficulty Engine.
   */
  saveRunAndAnalyze: (distance: number, duration: number, path: any[]) => {
    if (!path || path.length === 0) return null;

    // 1. Calculate Average Speed (Distance in meters / Duration in seconds)
    // Convert to km/h: (meters/seconds) * 3.6
    const avgSpeed = duration > 0 ? (distance / duration) * 3.6 : 0;
    const date = new Date().toISOString();
    
    try {
      // 2. Save to SQLite Local Storage
      db.runSync(
        'INSERT INTO ghost_runs (date, distance, duration, avg_speed, path_data) VALUES (?, ?, ?, ?, ?)',
        [date, Math.floor(distance), duration, parseFloat(avgSpeed.toFixed(2)), JSON.stringify(path)]
      );

      console.log(`[SQLite] Run Saved: ${avgSpeed.toFixed(2)} km/h`);
      
      // 3. Return the results so the UI can show a "Run Summary" 
      // and the Firebase sync can update the User's XP.
      return { 
        avgSpeed: parseFloat(avgSpeed.toFixed(2)), 
        distance: Math.floor(distance), 
        duration, 
        date 
      };
    } catch (error) {
      console.error("Failed to save run to SQLite:", error);
      return null;
    }
  }
};