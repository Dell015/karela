import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { GhostEngine } from '@/services/tracker/GhostEngine'; 
import { PermissionManager } from '@/services/PermissionsManager';

/**
 * Helper: Haversine formula to calculate distance between two points in meters.
 * This is essential for filtering out "GPS jumps" that are physically impossible.
 */
const getDistance = (p1: { latitude: number, longitude: number }, p2: { latitude: number, longitude: number }) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
  const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLocationEngine = (savedGhostData: any[]) => {
  const [path, setPath] = useState<any[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const isRacingRef = useRef(isRacing);
  useEffect(() => { isRacingRef.current = isRacing; }, [isRacing]);

  const startTimeRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<any>(null);

  // 1. Handle Ghost Timer
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
      setCurrentSpeed(0);
      if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    }
    return () => { if (ghostTimerRef.current) clearInterval(ghostTimerRef.current); };
  }, [isRacing, savedGhostData]);

  // 2. Handle Location Subscription with Anti-Zigzag Logic
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (location) => {
          const { latitude, longitude, speed, accuracy } = location.coords;

          /**
           * FILTER 1: ACCURACY GATEKEEPER
           * If the GPS accuracy is wider than 20 meters, the data is too "noisy"
           * for a clean trail. We ignore these pings to prevent zigzags.
           */
          if (accuracy && accuracy > 20) return;

          const newPoint = { latitude, longitude };
          
          // Always update current location for the "Blue Dot"
          setCurrentLocation(newPoint);

          // Speed calculation (m/s to km/h)
          const speedKmH = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
          setCurrentSpeed(speedKmH);

          /**
           * FILTER 2: PATH SMOOTHING (The Zigzag Killer)
           */
          if (isRacingRef.current) {
            setPath((current) => {
              if (current.length === 0) return [newPoint];

              const lastPoint = current[current.length - 1];
              const distanceMoved = getDistance(lastPoint, newPoint);

              /**
               * FILTER A: STATIONARY FILTER
               * If you haven't moved more than 3 meters, don't add a new point.
               * This stops the "spaghetti" effect when standing still.
               */
              if (distanceMoved < 3) return current;

              /**
               * FILTER B: TELEPORT FILTER (Kalman-lite)
               * A human runner cannot move 25 meters in 1 second.
               * If the jump is that large, it's a GPS glitch/bounce.
               */
              if (distanceMoved > 25) return current;

              return [...current, newPoint];
            });
          }
        }
      );
    };

    initLocation();
    return () => { if (subscription) subscription.remove(); };
  }, []);

  return { path, ghostPosition, isRacing, setIsRacing, currentLocation, currentSpeed };
};