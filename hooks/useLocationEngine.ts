import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { GhostEngine } from '@/services/tracker/GhostEngine'; 
import { PermissionManager } from '@/services/PermissionsManager';

export const useLocationEngine = (savedGhostData: any[]) => {
  const [path, setPath] = useState<any[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  // NEW: Speed state
  const [currentSpeed, setCurrentSpeed] = useState(0); 
  
  const isRacingRef = useRef(isRacing);
  useEffect(() => { isRacingRef.current = isRacing; }, [isRacing]);

  const startTimeRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isRacing) {
      startTimeRef.current = Date.now();
      setPath([]); 
      
      ghostTimerRef.current = setInterval(() => {
        if (startTimeRef.current && savedGhostData.length > 0) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const pos = GhostEngine.getGhostPosition(savedGhostData, elapsed);
          setGhostPosition(pos);
        }
      }, 50);
    } else {
      setGhostPosition(null);
      setCurrentSpeed(0); // Reset speed when not racing
      if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    }
    return () => { if (ghostTimerRef.current) clearInterval(ghostTimerRef.current); };
  }, [isRacing, savedGhostData]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1, 
          // Added timeInterval to ensure consistent speed updates
          timeInterval: 1000, 
        },
        (location) => {
          const { latitude, longitude, speed } = location.coords;
          
          const newPoint = { latitude, longitude };
          setCurrentLocation(newPoint);

          // 1. Calculate Speed (m/s to km/h)
          // GPS speed can be null or negative on some devices if signal is weak
          const speedKmH = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
          setCurrentSpeed(speedKmH);

          // 2. Update Path
          if (isRacingRef.current) {
            setPath((current) => [...current, newPoint]);
          }
        }
      );
    };

    initLocation();
    return () => { if (subscription) subscription.remove(); };
  }, []); 

  // Added currentSpeed to the return object
  return { path, ghostPosition, isRacing, setIsRacing, currentLocation, currentSpeed };
};