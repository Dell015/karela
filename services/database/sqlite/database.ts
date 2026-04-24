import * as SQLite from 'expo-sqlite';
import { doc, increment, updateDoc } from "firebase/firestore";
import { auth, db as firestore } from "../firebase/config";

// Open (or create) the local database
export const db = SQLite.openDatabaseSync('karela.db');

export const initDatabase = () => {
  // 1. GHOST RUNS TABLE
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ghost_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER, 
      distance INTEGER,
      duration INTEGER,
      avg_speed REAL,
      path_data TEXT
    );
  `);
  
  // 2. DAILY MISSIONS TABLE
  db.execSync(`
    CREATE TABLE IF NOT EXISTS daily_missions (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      goal_distanace INTEGER,
      goal_speed REAL,
      xp_reward INTEGER,
      status TEXT DEFAULT 'pending', 
      date INTEGER
    );
  `);
};

/**
 * Saves a completed run to BOTH SQLite and Firebase.
 */
export const saveGhostRun = async (distance: number, duration: number, path: any[]) => {
  const pathString = JSON.stringify(path);
  const date = Date.now(); // Numeric timestamp for SQLite
  
  // Calculate stats
  const avgSpeed = duration > 0 ? (distance / duration) * 3.6 : 0;
  const km = distance / 1000;

  // --- 1. LOCAL SAVE (SQLite) ---
  try {
    db.runSync(
      'INSERT INTO ghost_runs (date, distance, duration, avg_speed, path_data) VALUES (?, ?, ?, ?, ?)',
      [date, Math.floor(distance), duration, parseFloat(avgSpeed.toFixed(2)), pathString]
    );
    console.log("[SQLite] Run saved locally.");
  } catch (err) {
    console.error("[SQLite] Error saving run:", err);
  }

  // --- 2. CLOUD SYNC (Firebase) ---
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userRef, {
        "stats.total_distance_km": increment(parseFloat(km.toFixed(2))),
        "stats.total_calories_burned": increment(Math.floor(km * 60)),
        "stats.total_missions_completed": increment(1),
        "stats.xp": increment(150),
        "stats.last_active_date": new Date(date).toISOString(), // Keep ISO for Firebase readability
      });
      console.log("[Firebase] Stats successfully synced.");
    } catch (e) {
      console.error("[Firebase] Cloud sync failed:", e);
    }
  }
};

/**
 * Saves personalized missions with a numeric timestamp.
 */
export const setLocalMissions = (missions: any[]) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dateTimestamp = d.getTime(); 
  
  missions.forEach(m => {
    db.runSync(
      'INSERT OR REPLACE INTO daily_missions (id, title, description, goal_distance, goal_speed, xp_reward, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [m.id, m.title, m.goalDistance, m.goalSpeed, m.rewardXP, dateTimestamp]
    );
  });
};

/**
 * Fetches today's missions using numeric comparison.
 */
export const getTodaysMissions = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return db.getAllSync('SELECT * FROM daily_missions WHERE date = ?', [d.getTime()]);
};

/**
 * DEBUG TOOL: Seed 30 days of telemetry data.
 */
export const seedTestingData = () => {
    console.log("🛠 Seeding 30 days of data...");
    for (let i = 0; i < 30; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        db.runSync(
            'INSERT INTO ghost_runs (date, distance, duration, avg_speed) VALUES (?, ?, ?, ?)',
            [pastDate.getTime(), Math.floor(Math.random() * 5000) + 1000, 1800, 10.5]
        );
    }
};

/**
 * WIPE TOOL: Clears the local DB for testing.
 */
export const clearDatabase = () => {
    db.execSync('DELETE FROM ghost_runs');
    db.execSync('DELETE FROM daily_missions');
    console.log("🧹 Database cleared.");
};

export const getLatestGhostRun = () => {
  const result = db.getFirstSync('SELECT * FROM ghost_runs ORDER BY id DESC LIMIT 1');
  return result || null;
};

export const getNearbyGhostRun = (userLat: number, userLon: number) => {
  const allRows = db.getAllSync('SELECT * FROM ghost_runs ORDER BY id DESC');
  
  for (const row of allRows as any[]) {
    try {
      const path = JSON.parse(row.path_data);
      if (path && path.length > 0) {
        const startPoint = path[0];
        const latDiff = Math.abs(startPoint.latitude - userLat);
        const lonDiff = Math.abs(startPoint.longitude - userLon);
        
        if (latDiff < 0.005 && lonDiff < 0.005) {
          return path;
        }
      }
    } catch (e) {
      console.error("Error parsing path", e);
    }
  }
  return null; 
};