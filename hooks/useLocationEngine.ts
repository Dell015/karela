import { PermissionManager } from "@/services/PermissionsManager";
import { GhostEngine } from "@/services/tracker/GhostEngine";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { useMotionShield } from "./useMotionShield";

/**
 * Helper: Haversine formula to calculate distance between two points in meters.
 * Essential for translating GPS coordinates into physical exercise metrics.
 */
const getDistance = (
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number },
) => {
  const R = 6371000; // Earth's radius in meters
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
  // 1. SENSOR FUSION: Initialize the Pedometer-based "Motion Shield"
  // This helps us verify if movement is actually coming from human steps.
  const { isPhysicallyMoving, stepCount } = useMotionShield();

  const [path, setPath] = useState<
    { latitude: number; longitude: number; isVehicle: boolean }[]
  >([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);

  const lastHeadingRef = useRef(0);
  const isRacingRef = useRef(isRacing);

  // ANTI-CHEAT CONSTANTS
  const VELOCITY_CAP = 35; // Speed in KM/H. Anything above this is flagged as a vehicle (Car/Tricycle).
  const JITTER_THRESHOLD = 2; // Meters. GPS drifts smaller than this are ignored.
  const TELEPORT_THRESHOLD = 100; // Meters. Sudden jumps larger than this are ignored (Signal glitches).

  // Sync Racing state with a Ref to allow the Location Listener to access it without closure staleness
  useEffect(() => {
    isRacingRef.current = isRacing;
    if (isRacing) {
      setTotalDistance(0);
      setPath([]);
    }
  }, [isRacing]);

  // 2. GHOST ENGINE TIMER
  // Interpolates the ghost's position based on elapsed time for a smooth 10Hz visual update
  useEffect(() => {
    if (!isRacing || !savedGhostData || savedGhostData.length === 0) {
      setGhostPosition(null);
      return;
    }

    // 1. Capture the exact moment the user hits START
    const raceStartClockTime = Date.now();

    // 2. Identify the Ghost's own internal start time (the timestamp of its first point)
    const ghostBaseTimestamp = savedGhostData[0].timestamp;

    const ghostTimer = setInterval(() => {
      // 3. How many seconds has the USER been running? (e.g., 5.2 seconds)
      const userElapsedSeconds = (Date.now() - raceStartClockTime) / 1000;

      // 4. Synchronize: Tell the engine to find where the ghost was
      // at its own "Start Time" + "User's Elapsed Time"
      const syncedTime = ghostBaseTimestamp + userElapsedSeconds;

      const pos = GhostEngine.getGhostPosition(savedGhostData, syncedTime);
      setGhostPosition(pos);
    }, 100); // 10Hz update for buttery smooth movement

    return () => clearInterval(ghostTimer);
  }, [isRacing, savedGhostData]);
  
  // 3. CORE TRACKING ENGINE (GPS + SENSOR VALIDATION)
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: isRacing
            ? Location.Accuracy.BestForNavigation
            : Location.Accuracy.Balanced,
          distanceInterval: isRacing ? 2 : 15,
          timeInterval: isRacing ? 1000 : 5000,
        },
        (location) => {
          const { latitude, longitude, speed, accuracy } = location.coords;

          // FILTER: Ignore poor signal quality
          if (accuracy && accuracy > 35) return;

          const newPoint = { latitude, longitude };
          
          // ALWAYS update current location for the UI/Map Dot
          setCurrentLocation(newPoint);

          if (isRacingRef.current) {
            // Convert m/s to km/h
            const speedKmH = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
            setCurrentSpeed(speedKmH);

            // FLAG: Identify if the user is currently in a vehicle
            const isVehicle = speedKmH > VELOCITY_CAP;

            setPath((current) => {
            const pointWithStatus = { ...newPoint, isVehicle };
            if (current.length === 0) return [pointWithStatus];

            const lastPoint = current[current.length - 1];
            const distanceMoved = getDistance(lastPoint, newPoint);

            // 1. FILTER: Jitter & Teleport (Data Quality)
            if (distanceMoved < JITTER_THRESHOLD || distanceMoved > TELEPORT_THRESHOLD) {
              return current;
            }

            // 2. PERFORMANCE FILTER: "The Point Saver"
            // If we are moving fast (Vehicle), we don't need a point every 2 meters.
            // 10 meters is enough to draw a smooth red line.
            const requiredDistance = isVehicle ? 10 : JITTER_THRESHOLD;
            
            if (distanceMoved < requiredDistance) {
              return current; // Skip this point to prevent the "Black Screen"
            }

            // 3. ANTI-CHEAT: Distance Accumulation
            if (!isVehicle && isPhysicallyMoving) {
              setTotalDistance((prev) => prev + distanceMoved);
            }

            // 4. UPDATE: This will still draw the RED line because 'isVehicle' is true
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

  // 5. COMPASS ENGINE (Magnetometer)
  // Provides orientation for the "3D" follow-camera mode
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

      // Low-pass filter: Reduces compass "shaking" for a smoother map experience
      const alpha = 0.1;
      const smoothedAngle =
        lastHeadingRef.current + (angle - lastHeadingRef.current) * alpha;
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
    isPhysicallyMoving, // Used to show the "Shield" icon in the UI
    stepCount,
    setPath,
  };
};
