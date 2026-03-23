import * as SQLite from 'expo-sqlite';

// Open (or create) the local database
export const db = SQLite.openDatabaseSync('karela.db');

export const initDatabase = () => {
  // 1. GHOST RUNS TABLE (Added avg_speed for faster performance analysis)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ghost_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      distance INTEGER,
      duration INTEGER,
      avg_speed REAL,
      path_data TEXT
    );
  `);
  
  // 2. DAILY MISSIONS TABLE (Powers the Adaptive Difficulty Engine)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS daily_missions (
      id TEXT PRIMARY KEY,
      title TEXT,
      goal_distance INTEGER,
      goal_speed REAL,
      xp_reward INTEGER,
      status TEXT DEFAULT 'pending', 
      date TEXT
    );
  `);
};

/**
 * Saves a completed run.
 * We calculate avg_speed here so the Adaptive Engine can read it 
 * without having to parse the huge path_data JSON every time.
 */
export const saveGhostRun = (distance: number, duration: number, path: any[]) => {
  const pathString = JSON.stringify(path);
  const date = new Date().toISOString();
  
  // Calculate km/h: (meters / seconds) * 3.6
  const avgSpeed = duration > 0 ? (distance / duration) * 3.6 : 0;

  db.runSync(
    'INSERT INTO ghost_runs (date, distance, duration, avg_speed, path_data) VALUES (?, ?, ?, ?, ?)',
    [date, Math.floor(distance), duration, parseFloat(avgSpeed.toFixed(2)), pathString]
  );
};

/**
 * Finds the most recent ghost run that STARTED near the user.
 */
export const getNearbyGhostRun = (userLat: number, userLon: number) => {
  const allRows = db.getAllSync('SELECT * FROM ghost_runs ORDER BY id DESC');
  
  for (const row of allRows as any[]) {
    try {
      const path = JSON.parse(row.path_data);
      if (path && path.length > 0) {
        const startPoint = path[0];
        
        // Approx 500m threshold
        const latDiff = Math.abs(startPoint.latitude - userLat);
        const lonDiff = Math.abs(startPoint.longitude - userLon);
        
        if (latDiff < 0.005 && lonDiff < 0.005) {
          console.log(`[SQLite] Ghost Found! Match ID: ${row.id}`);
          return path;
        }
      }
    } catch (e) {
      console.error("Error parsing ghost path", e);
    }
  }
  return null; 
};

/**
 * MISSION ENGINE: Saves the 3 personalized missions generated from Firebase data.
 */
export const setLocalMissions = (missions: any[]) => {
  const dateStr = new Date().toISOString().split('T')[0]; // Current YYYY-MM-DD
  
  missions.forEach(m => {
    db.runSync(
      'INSERT OR REPLACE INTO daily_missions (id, title, goal_distance, goal_speed, xp_reward, date) VALUES (?, ?, ?, ?, ?, ?)',
      [m.id, m.title, m.goalDistance, m.goalSpeed, m.rewardXP, dateStr]
    );
  });
};

/**
 * MISSION ENGINE: Fetches today's personalized missions for the Dashboard UI.
 */
export const getTodaysMissions = () => {
  const dateStr = new Date().toISOString().split('T')[0];
  return db.getAllSync('SELECT * FROM daily_missions WHERE date = ?', [dateStr]);
};