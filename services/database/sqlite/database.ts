import * as SQLite from 'expo-sqlite';
import { doc, increment, updateDoc } from "firebase/firestore";
import { auth, db as firestore } from "../firebase/config"; // Ensure auth is exported from your config

// Open (or create) the local database
export const db = SQLite.openDatabaseSync('karela.db');

export const initDatabase = () => {
  // 1. GHOST RUNS TABLE
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
  
  // 2. DAILY MISSIONS TABLE
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
 * UPDATED: Saves a completed run to BOTH SQLite and Firebase.
 */
export const saveGhostRun = async (distance: number, duration: number, path: any[]) => {
  const pathString = JSON.stringify(path);
  const date = new Date().toISOString();
  
  // Calculate stats
  const avgSpeed = duration > 0 ? (distance / duration) * 3.6 : 0;
  const km = distance / 1000;

  // --- 1. LOCAL SAVE (Immediate) ---
  try {
    db.runSync(
      'INSERT INTO ghost_runs (date, distance, duration, avg_speed, path_data) VALUES (?, ?, ?, ?, ?)',
      [date, Math.floor(distance), duration, parseFloat(avgSpeed.toFixed(2)), pathString]
    );
    console.log("[SQLite] Run saved locally.");
  } catch (err) {
    console.error("[SQLite] Error saving run:", err);
  }

  // --- 2. CLOUD SYNC (Background) ---
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userRef, {
        "stats.total_distance_km": increment(parseFloat(km.toFixed(2))),
        "stats.total_calories_burned": increment(Math.floor(km * 60)), // 60 cal/km estimate
        "stats.total_missions_completed": increment(1),
        "stats.xp": increment(150), // Standard reward for finishing a run
        "stats.last_active_date": date,
      });
      console.log("[Firebase] Stats successfully synced to cloud.");
    } catch (e) {
      // If this fails (no internet), the local SQLite still has the data.
      console.error("[Firebase] Cloud sync failed:", e);
    }
  }
};

/**
 * Gets the very last run recorded on this device.
 */
export const getLatestGhostRun = () => {
  const result = db.getFirstSync('SELECT * FROM ghost_runs ORDER BY id DESC LIMIT 1');
  return result || null;
};

/**
 * Finds a ghost run that STARTED near the user's current GPS location.
 */
export const getNearbyGhostRun = (userLat: number, userLon: number) => {
  const allRows = db.getAllSync('SELECT * FROM ghost_runs ORDER BY id DESC');
  
  for (const row of allRows as any[]) {
    try {
      const path = JSON.parse(row.path_data);
      if (path && path.length > 0) {
        const startPoint = path[0];
        
        // Approx 500m threshold (0.005 degrees)
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
 * Saves personalized missions.
 */
export const setLocalMissions = (missions: any[]) => {
  const dateStr = new Date().toISOString().split('T')[0]; 
  
  missions.forEach(m => {
    db.runSync(
      'INSERT OR REPLACE INTO daily_missions (id, title, goal_distance, goal_speed, xp_reward, date) VALUES (?, ?, ?, ?, ?, ?)',
      [m.id, m.title, m.goalDistance, m.goalSpeed, m.rewardXP, dateStr]
    );
  });
};

/**
 * Fetches today's missions.
 */
export const getTodaysMissions = () => {
  const dateStr = new Date().toISOString().split('T')[0];
  return db.getAllSync('SELECT * FROM daily_missions WHERE date = ?', [dateStr]);
};

/**
 * DEBUG TOOL: Use this to test Monthly totals without running for 30 days!
 */
export const seedTestingData = () => {
    console.log("Seeding 30 days of data...");
    for (let i = 0; i < 30; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        db.runSync(
            'INSERT INTO ghost_runs (date, distance, duration, avg_speed) VALUES (?, ?, ?, ?)',
            [pastDate.toISOString(), Math.floor(Math.random() * 5000) + 1000, 1800, 10.5]
        );
    }
};