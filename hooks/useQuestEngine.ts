import { 
  MapCoordinate, 
  getMultiPointRoute, 
  snapToRoad 
} from "@/services/tracker/routingService";
import { useState } from "react";
import MapView from "react-native-maps";

// --- PH GPS DRIFT OPTIMIZATION ---
// ~100 meters tolerance for shortcuts and drift
const OFF_TRACK_THRESHOLD = 0.001; 
// ~20-25 meters for "popping" a flag (Accounts for signal bouncing off buildings)
const CHECKPOINT_PROXIMITY = 0.00025;
const COMPLETION_THRESHOLD = 0.00015;

export interface Checkpoint extends MapCoordinate {
  id: string;
  isReached: boolean;
}

export const useQuestEngine = (mapRef: React.RefObject<MapView | null>) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [questPath, setQuestPath] = useState<MapCoordinate[]>([]);
  const [questRewards, setQuestRewards] = useState<{ coins: number; xp: number } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [totalDistance, setTotalDistance] = useState<number>(0);

  /**
   * Real-time path & checkpoint logic
   * Triggered by MapScreen whenever currentLocation changes during a race.
   */
  const updateRemainingPath = (userLoc: MapCoordinate) => {
    // 1. UPDATE CHECKPOINTS (THE "POP" LOGIC)
    setCheckpoints((current) => {
      let hasChanged = false;
      const updated = current.map((cp) => {
        if (cp.isReached) return cp;

        const latDiff = Math.abs(cp.latitude - userLoc.latitude);
        const lonDiff = Math.abs(cp.longitude - userLoc.longitude);

        // Check if user is within the proximity of the flag
        if (latDiff < CHECKPOINT_PROXIMITY && lonDiff < CHECKPOINT_PROXIMITY) {
          hasChanged = true;
          console.log(`[QuestEngine] Popped Checkpoint: ${cp.id}`);
          return { ...cp, isReached: true };
        }
        return cp;
      });
      return hasChanged ? updated : current;
    });

    // 2. UPDATE QUEST PATH (THE "EATING" LOGIC)
    setQuestPath((currentPath) => {
      if (currentPath.length === 0) return currentPath;

      let closestIndex = 0;
      let minDistance = Number.MAX_VALUE;

      // Find the segment of the gold line closest to the user
      currentPath.forEach((point, index) => {
        const dist = Math.sqrt(
          Math.pow(point.latitude - userLoc.latitude, 2) +
          Math.pow(point.longitude - userLoc.longitude, 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      });

      // Finish Logic: If user is at the very end of the line
      if (currentPath.length <= 2 && minDistance < COMPLETION_THRESHOLD) {
        return []; 
      }

      // Off-track stretching: If user moves far away from the road, 
      // stretch the gold line to their current position
      if (minDistance > OFF_TRACK_THRESHOLD) {
        return [userLoc, ...currentPath.slice(closestIndex)];
      }

      // "Eat" the path: Remove the parts of the line the user has already passed
      return closestIndex > 0 ? currentPath.slice(closestIndex) : currentPath;
    });
  };

  /**
   * Re-calculates the route via the Routing Service
   */
  const refreshRoute = async (userLoc: MapCoordinate | null, points: Checkpoint[]) => {
    if (userLoc && points.length > 0) {
      const activePoints = points.filter(p => !p.isReached);
      if (activePoints.length === 0) {
        setQuestPath([]);
        return;
      }

      const data = await getMultiPointRoute([userLoc, ...activePoints]);
      if (data) {
        setQuestPath(data.coordinates);
        setQuestRewards(data.rewards);
        setTotalDistance(data.distanceMeters);
      }
    } else {
      setQuestPath([]);
      setQuestRewards(null);
      setTotalDistance(0);
    }
  };

  const addCheckpoint = (coords: { latitude: number; longitude: number }, userLoc: MapCoordinate | null) => {
    const newPoint: Checkpoint = {
      ...coords,
      id: Math.random().toString(36).substring(7),
      isReached: false,
    };
    const updated = [...checkpoints, newPoint];
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const deleteCheckpoint = (index: number, userLoc: MapCoordinate | null) => {
    const updated = checkpoints.filter((_, i) => i !== index);
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const moveCheckpoint = async (index: number, newCoords: any, userLoc: any) => {
    // Snap to road ensures the flag isn't placed inside a building
    const snapped = await snapToRoad(newCoords.latitude, newCoords.longitude);
    const updated = [...checkpoints];
    updated[index] = { ...updated[index], ...snapped };
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const changeCameraHeading = (direction: "N" | "S" | "E" | "W") => {
    if (!mapRef.current) return;
    
    let heading = 0;
    if (direction === "E") heading = 90;
    if (direction === "S") heading = 180;
    if (direction === "W") heading = 270;

    mapRef.current.animateCamera({
        heading,
        pitch: 45,
        zoom: 17,
      }, { duration: 1000 });
  };

  return {
    checkpoints,
    questPath,
    questRewards,
    totalDistance,
    isDragging,
    setIsDragging,
    isOverTrash,
    setIsOverTrash,
    addCheckpoint,
    deleteCheckpoint,
    moveCheckpoint,
    changeCameraHeading,
    updateRemainingPath,
  };
};