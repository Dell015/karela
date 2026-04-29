import * as SQLite from "expo-sqlite";
import { doc, increment, updateDoc } from "firebase/firestore";
import { auth, db as firestore } from "../firebase/config";

export const db = SQLite.openDatabaseSync("karela.db");

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ghost_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER, 
      distance INTEGER,
      duration INTEGER,
      avg_speed REAL,
      path_data TEXT
    );
    CREATE TABLE IF NOT EXISTS daily_missions (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      goal_distance INTEGER,
      goal_speed REAL,
      xp_reward INTEGER,
      status TEXT DEFAULT 'pending', 
      date INTEGER
    );
  `);
};

export const saveGhostRun = async (
  distance: number,
  duration: number,
  path: any[],
) => {
  // Ensure we are saving numeric timestamps within the path for the Ghost Engine
  const pathWithTimestamps = path.map((p) => ({
    ...p,
    timestamp: p.timestamp || Date.now(),
  }));

  const pathString = JSON.stringify(pathWithTimestamps);
  const date = Date.now();
  const avgSpeed = duration > 0 ? (distance / duration) * 3.6 : 0;

  try {
    // SQLite Save
    db.runSync(
      "INSERT INTO ghost_runs (date, distance, duration, avg_speed, path_data) VALUES (?, ?, ?, ?, ?)",
      [
        date,
        Math.floor(distance),
        duration,
        parseFloat(avgSpeed.toFixed(2)),
        pathString,
      ],
    );

    // Firebase Sync
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(firestore, "users", user.uid);
      const km = distance / 1000;
      await updateDoc(userRef, {
        "stats.total_distance_km": increment(parseFloat(km.toFixed(2))),
        "stats.total_calories_burned": increment(Math.floor(km * 60)),
        "stats.total_missions_completed": increment(1),
        "stats.xp": increment(150),
        "stats.last_active_date": new Date(date).toISOString(),
      });
    }
    return { success: true, avgSpeed, distance, duration };
  } catch (err) {
    console.error("Save failed:", err);
    return null;
  }
};

export const getLatestGhostRun = () => {
  return (
    db.getFirstSync("SELECT * FROM ghost_runs ORDER BY id DESC LIMIT 1") || null
  );
};
export const setLocalMissions = (missions: any[]) => {
  try {
    // 1. Clear existing missions for the new day
    db.runSync("DELETE FROM daily_missions");

    // 2. Prepare the insert statement
    const statement = db.prepareSync(`
      INSERT INTO daily_missions (
        id, title, description, goal_distance, goal_speed, xp_reward, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      missions.forEach((m) => {
        statement.executeSync([
          m.id,
          m.title || "Daily Mission",
          m.mission || m.description || "", // Handle both system and Ani names
          m.goalDistance || m.goal_distance || 0,
          m.goalSpeed || m.goal_speed || 0,
          m.rewardXP || m.xp_reward || m.xp || 0,
          Date.now(),
        ]);
      });
    } finally {
      statement.finalizeSync();
    }

    console.log(`✅ SQLITE: Successfully saved ${missions.length} missions.`);
  } catch (err) {
    console.error("❌ SQLITE: Failed to save missions:", err);
  }
};

export const getLocalMissions = () => {
  try {
    return db.getAllSync("SELECT * FROM daily_missions") || [];
  } catch (err) {
    console.error("Failed to fetch missions:", err);
    return [];
  }
};