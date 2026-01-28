import * as Location from "expo-location";
import { getDistance } from "geolib";
import { GhostPoint } from "./GhostEngine";

// State variables to track the current recording session
let pathData: GhostPoint[] = [];
let totalDistanceCovered = 0;
let lastPoint: { latitude: number; longitude: number } | null = null;

/**
 * THE RECORDER
 * This function handles the heavy lifting of watching the user's movement.
 */
export const startRecording = async (
  onPointAdded: (path: GhostPoint[]) => void,
) => {
  // A. PERMISSIONS
  // We can't track them without asking first!
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    alert("Karela needs location access to track your run!");
    return;
  }

  // B. THE WATCHER
  // This stays open and pings every time the phone moves
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation, // High power, high precision
      distanceInterval: 5, // Only trigger every 5 meters moved (prevents jitter)
      timeInterval: 2000, // Or every 2 seconds
    },
    (location) => {
      const { latitude, longitude } = location.coords;

      // C. DISTANCE MATH
      // If we have a previous point, calculate the gap and add to total
      if (lastPoint) {
        const metersMoved = getDistance(lastPoint, { latitude, longitude });
        totalDistanceCovered += metersMoved;
      }

      // D. CREATE GHOST POINT
      const newPoint: GhostPoint = {
        latitude,
        longitude,
        timestamp: location.timestamp,
        distanceFromStart: totalDistanceCovered,
      };

      // E. UPDATE STATE
      pathData.push(newPoint);
      lastPoint = { latitude, longitude };

      // Send the whole path back to the UI so we can see the progress
      onPointAdded([...pathData]);
    },
  );

  return subscription; // We return this so we can stop() it later
};
