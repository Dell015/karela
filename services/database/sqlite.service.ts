import * as SQLite from 'expo-sqlite';

/**
 * THESIS LOGIC: Database Persistence
 * Manages the local SQLite storage for recording and retrieving Ghost runs.
 */
export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('karela_db');

  // Create the table for coordinates
  // We use "EXEC" to run the SQL command
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS ghost_points (
      id INTEGER PRIMARY KEY NOT NULL,
      run_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      distance_from_start REAL NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);
  
  console.log("DATABASE: Initialized successfully");
  return db;
};