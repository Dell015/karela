import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { useMotionShield } from "./useMotionShield";
import { GhostEngine } from "@/services/tracker/GhostEngine";
import { PermissionManager } from "@/services/PermissionsManager";

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
  // 1. Hook initializations
  const { isPhysicallyMoving, stepCount } = useMotionShield();

  // 2. State definitions
  const [path, setPath] = useState<{ latitude: number; longitude: number; isVehicle: boolean }[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);

  // 3. Refs (Must be declared before any useEffect uses them)
  const raceStartTimeRef = useRef<number | null>(null);
  const lastHeadingRef = useRef(0);
  const isRacingRef = useRef(isRacing);

  // ANTI-CHEAT CONSTANTS
  const VELOCITY_CAP = 35; 
  const JITTER_THRESHOLD = 2; 
  const TELEPORT_THRESHOLD = 100; 

  // --- 1. RACE STATE SYNC & RESET ---
  useEffect(() => {
    isRacingRef.current = isRacing;
    if (isRacing) {
      raceStartTimeRef.current = Date.now();
      setTotalDistance(0);
      setPath([]); // Clears the trail for the new run
    } else {
      raceStartTimeRef.current = null;
      setGhostPosition(null);
    }
  }, [isRacing]);

  // --- 2. GHOST SYNC ENGINE ---
  useEffect(() => {
    let ghostTimer: any;

    if (isRacing && savedGhostData && savedGhostData.length > 0) {
      // Get the timestamp of the first point in the saved data
      const ghostStartTime = savedGhostData[0].timestamp;

      ghostTimer = setInterval(() => {
        if (!raceStartTimeRef.current) return;

        // Calculate how many seconds have passed since YOU pressed Start
        const userElapsedSeconds = (Date.now() - raceStartTimeRef.current) / 1000;
        
        // Calculate the "Target Time" within the ghost's timeline
        const targetTimestamp = ghostStartTime + userElapsedSeconds;

        const pos = GhostEngine.getGhostPosition(savedGhostData, targetTimestamp);
        
        if (pos) {
          setGhostPosition({
            latitude: pos.latitude,
            longitude: pos.longitude
          });
        } else {
          // If the ghost has finished its recorded path
          setGhostPosition(savedGhostData[savedGhostData.length - 1]);
        }
      }, 100); 
    }

    return () => clearInterval(ghostTimer);
  }, [isRacing, savedGhostData]);

  // --- 3. CORE GPS TRACKING ENGINE ---
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) setCurrentLocation(lastKnown.coords);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: isRacing ? Location.Accuracy.High : Location.Accuracy.Balanced,
          distanceInterval: isRacing ? 2 : 10,
          timeInterval: isRacing ? 1000 : 5000,
        },
        (location) => {
          const { latitude, longitude, speed, accuracy } = location.coords;
          
          // Filter poor signals
          if (accuracy && accuracy > 40) return;

          const newPoint = { latitude, longitude };
          setCurrentLocation(newPoint);

          if (isRacingRef.current) {
            const speedKmH = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
            setCurrentSpeed(speedKmH);
            const isVehicle = speedKmH > VELOCITY_CAP;

            setPath((current) => {
              const pointWithStatus = { ...newPoint, isVehicle };
              if (current.length === 0) return [pointWithStatus];

              const lastPoint = current[current.length - 1];
              const distanceMoved = getDistance(lastPoint, newPoint);

              // Filter jitter and "teleporting"
              if (distanceMoved < JITTER_THRESHOLD || distanceMoved > TELEPORT_THRESHOLD) {
                return current;
              }

              // Only accumulate distance if moving and not in a vehicle
              if (!isVehicle && isPhysicallyMoving) {
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
  }, [isRacing, isPhysicallyMoving]);

  // --- 4. COMPASS & CAMERA ENGINE ---
  useEffect(() => {
    if (!isRacing) {
      setCompassHeading(0);
      return;
    }
    let magnetSubscription: any = null;
    Magnetometer.setUpdateInterval(200);
    magnetSubscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      // Smoothing filter for the camera rotation
      const alpha = 0.1;
      const smoothedAngle = lastHeadingRef.current + (angle - lastHeadingRef.current) * alpha;
      lastHeadingRef.current = smoothedAngle;
      setCompassHeading(smoothedAngle);
    });
    return () => {
      if (magnetSubscription) magnetSubscription.remove();
    };
  }, [isRacing]);

  return {
    path,
    totalDistance,
    ghostPosition,
    isRacing,
    setIsRacing,
    currentLocation,
    currentSpeed,
    compassHeading,
    isPhysicallyMoving,
    stepCount,
    setPath,
  };
};