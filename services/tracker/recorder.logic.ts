import { getDistanceBetweenPoints } from './distance.logic';

// This variable tracks movement state across snapshots
let isUserMoving = false;

// Call this function whenever the user presses "Start Run" 
export const resetTracker = () => {
  isUserMoving = false;
};

interface GPSPoint {
  lat: number;
  lon: number;
  totalDistance: number;
  timestamp: number;
}

/**
 * PHASE 1: REAL-TIME INGESTION
 * Calculated every second to update the UI "Mirror"
 */
export const recordPoint = async (
  db: any, 
  runId: string,
  newLat: number,
  newLon: number,
  previousPoint: GPSPoint | null
): Promise<GPSPoint> => {
  
  const now = Date.now();

  if (!previousPoint) {
    return { lat: newLat, lon: newLon, totalDistance: 0, timestamp: now };
  }

  const segmentDistance = getDistanceBetweenPoints(
    previousPoint.lat,
    previousPoint.lon,
    newLat,
    newLon
  );

  const timeDiffInSeconds = (now - previousPoint.timestamp) / 1000;
  const speed = segmentDistance / (timeDiffInSeconds || 1);

  // Filter 1: Reject Impossible Jumps ( > 36km/h)
  if (speed > 10) { 
    return previousPoint; 
  }

  // Filter 2: Adaptive Anchor (Drift Prevention)
  const threshold = isUserMoving ? 2 : 5;

  if (segmentDistance < threshold) {
    isUserMoving = false; 
    return previousPoint; 
  }

  // Success: Update Total
  isUserMoving = true;
  const newTotalDistance = previousPoint.totalDistance + segmentDistance;

  // Save Raw Data to DB (We audit this later)
  try {
    await db.runAsync(
      'INSERT INTO ghost_points (run_id, latitude, longitude, distance_from_start, timestamp) VALUES (?, ?, ?, ?, ?)',
      [runId, newLat, newLon, newTotalDistance, now]
    );
  } catch (error) {
    console.error("DB Save Error:", error);
  }

  return { 
    lat: newLat, 
    lon: newLon, 
    totalDistance: newTotalDistance, 
    timestamp: now 
  };
};

/**
 * PHASE 2: POST-RUN AUDIT
 * Calculated once when the user hits "STOP" to get the most accurate result.
 */
export const calculateFinalVerifiedDistance = (points: GPSPoint[]): number => {
  if (points.length < 2) return 0;

  let verifiedTotal = 0;
  
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    
    const dist = getDistanceBetweenPoints(p1.lat, p1.lon, p2.lat, p2.lon);

    // Filter 3: Global Segment Validation
    // Only count segments that are clear evidence of purposeful running
    if (dist > 4 && dist < 50) {
      verifiedTotal += dist;
    }
  }

  return verifiedTotal;
};