import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('karela.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ghost_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      distance INTEGER,
      duration INTEGER,
      path_data TEXT
    );
  `);
};

export const saveGhostRun = (distance: number, duration: number, path: any[]) => {
  const pathString = JSON.stringify(path);
  const date = new Date().toISOString();
  db.runSync(
    'INSERT INTO ghost_runs (date, distance, duration, path_data) VALUES (?, ?, ?, ?)',
    [date, Math.floor(distance), duration, pathString]
  );
};

/**
 * NEW: Finds the most recent ghost run that STARTED near the user's 
 * current location (within ~500 meters).
 */
export const getNearbyGhostRun = (userLat: number, userLon: number) => {
  // Get all runs so we can check their starting coordinates
  const allRows = db.getAllSync('SELECT * FROM ghost_runs ORDER BY id DESC');
  
  for (const row of allRows as any[]) {
    try {
      const path = JSON.parse(row.path_data);
      if (path && path.length > 0) {
        const startPoint = path[0];
        
        // Calculate rough distance (0.005 degrees is approx 500-550m)
        const latDiff = Math.abs(startPoint.latitude - userLat);
        const lonDiff = Math.abs(startPoint.longitude - userLon);
        
        if (latDiff < 0.005 && lonDiff < 0.005) {
          console.log(`Ghost Found! Match ID: ${row.id}`);
          return path;
        }
      }
    } catch (e) {
      console.error("Error parsing ghost path", e);
    }
  }
  return null; // No ghost recorded in this specific area
};

// Keeping this for "global" latest run if needed
export const getLatestGhostRun = () => {
  const allRows = db.getAllSync('SELECT * FROM ghost_runs ORDER BY id DESC LIMIT 1');
  if (allRows.length === 0) return null;
  const latest: any = allRows[0];
  return JSON.parse(latest.path_data);
};