import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { GhostEngine } from '@/services/tracker/GhostEngine'; 
import { PermissionManager } from '@/services/PermissionsManager';

export const useLocationEngine = (savedGhostData: any[]) => {
  const [path, setPath] = useState<any[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  
  // Use a Ref to track racing state inside the location callback
  const isRacingRef = useRef(isRacing);
  useEffect(() => { isRacingRef.current = isRacing; }, [isRacing]);

  const startTimeRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<any>(null);

  // 1. Handle Ghost Timer separate from Location Subscription
  useEffect(() => {
    if (isRacing) {
      startTimeRef.current = Date.now();
      setPath([]); // Clear old lines when starting
      
      ghostTimerRef.current = setInterval(() => {
        if (startTimeRef.current && savedGhostData.length > 0) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const pos = GhostEngine.getGhostPosition(savedGhostData, elapsed);
          setGhostPosition(pos);
        }
      }, 50);
    } else {
      setGhostPosition(null);
      if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    }
    return () => { if (ghostTimerRef.current) clearInterval(ghostTimerRef.current); };
  }, [isRacing, savedGhostData]);

  // 2. Handle Location Subscription (Runs once on mount)
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1, // Update every 1 meter
        },
        (location) => {
          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setCurrentLocation(newPoint);

          // Use the REF here to avoid stale closures
          if (isRacingRef.current) {
            setPath((current) => [...current, newPoint]);
          }
        }
      );
    };

    initLocation();
    return () => { if (subscription) subscription.remove(); };
  }, []); // Only run once

  return { path, ghostPosition, isRacing, setIsRacing, currentLocation };
};