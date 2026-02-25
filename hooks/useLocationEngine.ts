import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { GhostEngine } from '@/services/tracker/GhostEngine'; 
import { PermissionManager } from '@/services/PermissionsManager';

export const useLocationEngine = (savedGhostData: any[]) => {
  const [path, setPath] = useState<any[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  
  const startTimeRef = useRef<number | null>(null);
  
  /**
   * FIX: Using 'any' or 'ReturnType<typeof setInterval>' avoids the 
   * "Type 'Timer' is not assignable to type 'number'" error in React Native.
   */
  const ghostTimerRef = useRef<any>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      if (isRacing) {
        startTimeRef.current = Date.now();
        setPath([]); 

        // GHOST HEARTBEAT
        ghostTimerRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const pos = GhostEngine.getGhostPosition(savedGhostData, elapsed);
            setGhostPosition(pos);
          }
        }, 50);
      } else {
        // Clear ghost position and timer when not racing
        setGhostPosition(null);
        if (ghostTimerRef.current) {
          clearInterval(ghostTimerRef.current);
          ghostTimerRef.current = null;
        }
      }

      // GPS TRACKER
      subscription = await Location.watchPositionAsync(
        {
          accuracy: isRacing ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
          distanceInterval: isRacing ? 2 : 10,
          timeInterval: isRacing ? 1000 : 5000,
        },
        (location) => {
          // If we aren't racing, we still update the "currentLocation" via path
          const secondsPassed = startTimeRef.current 
            ? (Date.now() - startTimeRef.current) / 1000 
            : 0;

          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: secondsPassed,
          };

          setPath((current) => {
            // Keep the path short if not racing to save memory
            if (!isRacing) return [newPoint];
            return [...current, newPoint];
          });
        }
      );
    };

    startTracking();

    return () => {
      if (subscription) subscription.remove();
      if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    };
  }, [isRacing, savedGhostData]); // Added savedGhostData to dependencies

  return {
    path,
    ghostPosition,
    isRacing,
    setIsRacing,
    currentLocation: path.length > 0 ? path[path.length - 1] : null
  };
};