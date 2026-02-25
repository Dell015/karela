import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { GhostEngine } from '@/services/tracker/GhostEngine';
import { PermissionManager } from '@/services/PermissionsManager';

/**
 * Custom hook to manage real-time location tracking and ghost racing logic.
 * Handles adaptive GPS configurations to balance performance and battery life.
 * * @param savedGhostData - Array of coordinates from a previous run to compare against.
 * @returns Object containing current path, ghost position, racing status, and controls.
 */
export const useLocationEngine = (savedGhostData: any[]) => {
  // --- State Management ---
  const [path, setPath] = useState<any[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    /**
     * Initializes the location watcher with settings based on the current mode.
     * Higher frequency and accuracy are prioritized during active racing.
     */
    const startTracking = async () => {
      // Ensure location permissions are active before initializing hardware
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;
      
      /**
       * Adaptive Configuration:
       * - Racing: High-precision GPS for competitive accuracy (1s / 3m updates).
       * - Passive: Balanced power mode for errands (5s / 15m updates).
       */
      const trackingConfig = isRacing
        ? {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 3,
            timeInterval: 1000
          }
        : {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 15,
            timeInterval: 5000
          };

      // Reference timestamp used to calculate relative race time
      const startTime = Date.now();

      // Subscribe to device location updates
      subscription = await Location.watchPositionAsync(
        trackingConfig,
        (location) => {
          // Calculate elapsed time in seconds for synchronization with ghost data
          const secondsPassed = Math.floor((Date.now() - startTime) / 1000);

          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: secondsPassed,
          };

          // Update local path state using functional update to ensure latest state access
          setPath((current) => [...current, newPoint]);

          // Synchronize ghost position only if the user is in an active race state
          if (isRacing) {
            const ghostPos = GhostEngine.getGhostPosition(savedGhostData, secondsPassed);
            setGhostPosition(ghostPos);
          }
        }
      );
    };

    startTracking();

    /**
     * Cleanup: Ensure GPS hardware is released when the component unmounts
     * or when the racing mode switches to prevent memory/battery leaks.
     */
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isRacing]); // Re-run effect to apply new trackingConfig when isRacing changes

  return {
    path,
    ghostPosition,
    isRacing,
    setIsRacing,
    /** Derived state: Returns the most recent coordinate for map centering */
    currentLocation: path.length > 0 ? path[path.length - 1] : null
  };
};