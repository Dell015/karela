import { getDistanceBetweenPoints } from './distance.logic';
import * as SQLite from 'expo-sqlite';

/**
 * THESIS LOGIC: Run Recorder
 * Processes raw GPS pings and persists them to the database.
 */
export const recordPoint = async (
  db: any,
  runId: string,
  newLat: number,
  newLon: number,
  previousPoint: { lat: number; lon: number; totalDistance: number } | null
) => {
  let currentTotalDistance = 0;

  // 1. If there's a previous point, calculate the new total distance
  if (previousPoint) {
    const segmentDistance = getDistanceBetweenPoints(
      previousPoint.lat,
      previousPoint.lon,
      newLat,
      newLon
    );
    currentTotalDistance = previousPoint.totalDistance + segmentDistance;
  }

  const timestamp = Date.now();

  // 2. Save the data to SQLite
  await db.runAsync(
    'INSERT INTO ghost_points (run_id, latitude, longitude, distance_from_start, timestamp) VALUES (?, ?, ?, ?, ?)',
    [runId, runId, newLat, newLon, currentTotalDistance, timestamp]
  );

  return {
    lat: newLat,
    lon: newLon,
    totalDistance: currentTotalDistance,
    timestamp
  };
};