import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { GhostEngine } from '@/services/tracker/GhostEngine'; 
import { PermissionManager } from '@/services/PermissionsManager';

export const useLocationEngine = (savedGhostData: any[]) => {
  const [path, setPath] = useState<any[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  
  const startTimeRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<any>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      if (isRacing) {
        startTimeRef.current = Date.now();
        setPath([]); 

        ghostTimerRef.current = setInterval(() => {
          if (startTimeRef.current && savedGhostData.length > 0) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const pos = GhostEngine.getGhostPosition(savedGhostData, elapsed);
            
            // Log to console to debug if pos is actually being found
            // console.log("Ghost Pos:", pos); 
            
            setGhostPosition(pos);
          }
        }, 50);
      } else {
        setGhostPosition(null);
        if (ghostTimerRef.current) {
          clearInterval(ghostTimerRef.current);
          ghostTimerRef.current = null;
        }
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
        },
        (location) => {
          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newPoint);
          if (isRacing) {
            setPath((current) => [...current, newPoint]);
          }
        }
      );
    };

    startTracking();

    return () => {
      if (subscription) subscription.remove();
      if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    };
  }, [isRacing]); // Removed savedGhostData from dep array to prevent unnecessary restarts

  return { path, ghostPosition, isRacing, setIsRacing, currentLocation };
};