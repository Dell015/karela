import * as Location from 'expo-location';
import { getPreciseDistance } from 'geolib';
import { GhostPoint } from './GhostEngine';

// State variables to track the current recording session
let pathData: GhostPoint[] = [];
let totalDistanceCovered = 0;
let lastPoint: { latitude: number; longitude: number } | null = null;

/**
 * THE RECORDER
 * This function handles the heavy lifting of watching the user's movement.
 */
export const startRecording = async (onPointAdded: (path: GhostPoint[]) => void) => {
  pathData = [];
  totalDistanceCovered = 0;
  lastPoint = null;
  
  // A. PERMISSIONS
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert("Karela needs location access to track your run!");
    return null; // Stop here if permission is denied
  }

  // B. THE WATCHER
  // We add "const subscription =" so the return at the bottom knows what it is
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 3, // Changed to 3 for better walk/run responsiveness
      timeInterval: 1000,   
    },
    (location) => {
      const { latitude, longitude } = location.coords;

      // C. DISTANCE MATH
      if (lastPoint) {
        const metersMoved = getPreciseDistance(lastPoint, { latitude, longitude });
        
        // Your 1.5m Noise Gate
        if (metersMoved > 1.5 && metersMoved < 15) {
          totalDistanceCovered += metersMoved;
        } else {
          console.log(`Filtered out ${metersMoved}m of noise.`);
        }
      }

      // D. CREATE GHOST POINT
      const newPoint: GhostPoint = {
        latitude,
        longitude,
        timestamp: location.timestamp,
        distanceFromStart: totalDistanceCovered
      };

      pathData.push(newPoint);
      lastPoint = { latitude, longitude };

      onPointAdded([...pathData]);
    }
  );

  return subscription; // Now this works because we defined it above!
};