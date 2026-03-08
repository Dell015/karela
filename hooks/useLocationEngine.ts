import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { GhostEngine } from "@/services/tracker/GhostEngine";
import { PermissionManager } from "@/services/PermissionsManager";
import { Magnetometer } from "expo-sensors";

/**
 * Helper: Haversine formula to calculate distance between two points in meters.
 */
const getDistance = (
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number },
) => {
  const R = 6371000; 
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLocationEngine = (savedGhostData: any[]) => {
  // Path now stores objects to track vehicle status per point
  const [path, setPath] = useState<{latitude: number; longitude: number; isVehicle: boolean}[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  
  const lastHeadingRef = useRef(0);
  const VELOCITY_CAP = 35; // KM/H threshold for Anti-Cheat

  const isRacingRef = useRef(isRacing);
  useEffect(() => {
    isRacingRef.current = isRacing;
    if (isRacing) {
        setTotalDistance(0); // Reset distance when a new race starts
        setPath([]);         // Reset path
    }
  }, [isRacing]);

  const startTimeRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<any>(null);

  // 1. Handle Ghost Timer
  useEffect(() => {
    if (isRacing) {
      startTimeRef.current = Date.now();
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
    return () => {
      if (ghostTimerRef.current) clearInterval(ghostTimerRef.current);
    };
  }, [isRacing, savedGhostData]);

  // 2. Handle Location Subscription with Anti-Cheat & Smoothing
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

          // FILTER 1: ACCURACY GATEKEEPER
          if (accuracy && accuracy > 20) return;

          const newPoint = { latitude, longitude };
          setCurrentLocation(newPoint);

          // Speed calculation (m/s to km/h)
          const speedKmH = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
          setCurrentSpeed(speedKmH);

          // Determine if the user is currently "cheating" (in a vehicle)
          const isVehicle = speedKmH > VELOCITY_CAP;

          if (isRacingRef.current) {
            setPath((current) => {
              const pointWithStatus = { ...newPoint, isVehicle };
              
              if (current.length === 0) return [pointWithStatus];

              const lastPoint = current[current.length - 1];
              const distanceMoved = getDistance(lastPoint, newPoint);

              // FILTER A: STATIONARY FILTER (3m)
              // FILTER B: TELEPORT FILTER (25m)
              if (distanceMoved < 3 || distanceMoved > 25) return current;

              /**
               * CEO ANTI-CHEAT: 
               * Only increment distance if the user is NOT speeding in a vehicle.
               */
              if (!isVehicle) {
                setTotalDistance((prev) => prev + distanceMoved);
              }

              return [...current, pointWithStatus];
            });
          }
        },
      );
    };

    initLocation();
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // 3. Handle Magnetometer (Compass Smoothing)
  useEffect(() => {
    let subscription: any = null;
    Magnetometer.setUpdateInterval(150);

    subscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      const alpha = 0.03;
      const smoothedAngle =
        lastHeadingRef.current + (angle - lastHeadingRef.current) * alpha;

      lastHeadingRef.current = smoothedAngle;
      setCompassHeading(smoothedAngle);
    });

    return () => subscription && subscription.remove();
  }, []);

  return {
    path,
    totalDistance,
    ghostPosition,
    isRacing,
    setIsRacing,
    currentLocation,
    currentSpeed,
    compassHeading,
  };
};