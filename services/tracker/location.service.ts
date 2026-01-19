import * as Location from 'expo-location';

/**
 * THESIS LOGIC: Geospatial Acquisition
 * Handles permission requests and sets up the real-time GPS stream.
 */
export const startLocationTracking = async (onLocationUpdate: (location: Location.LocationObject) => void) => {
  // 1. Request Permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.error('Permission to access location was denied');
    return;
  }

  // 2. Start Watching Position
  // Accuracy.BestForNavigation is crucial for running apps
  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000, // Update every 1 second
      distanceInterval: 1, // Or every 1 meter
    },
    (location) => {
      onLocationUpdate(location);
    }
  );
};