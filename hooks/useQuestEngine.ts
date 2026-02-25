import { useState } from 'react';
import { MapCoordinate, getMultiPointRoute } from '@/services/tracker/routingService';

export const useQuestEngine = () => {
  const [checkpoints, setCheckpoints] = useState<MapCoordinate[]>([]);
  const [questPath, setQuestPath] = useState<MapCoordinate[]>([]);
  const [questRewards, setQuestRewards] = useState<{ coins: number; xp: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const refreshRoute = async (userLoc: MapCoordinate | null, points: MapCoordinate[]) => {
    if (userLoc && points.length > 0) {
      const data = await getMultiPointRoute([userLoc, ...points]);
      if (data) {
        setQuestPath(data.coordinates);
        setQuestRewards(data.rewards);
      }
    } else {
      setQuestPath([]);
      setQuestRewards(null);
    }
  };

  const addCheckpoint = (coords: MapCoordinate, userLoc: MapCoordinate | null) => {
    const updated = [...checkpoints, coords];
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const deleteCheckpoint = (index: number, userLoc: MapCoordinate | null) => {
    const updated = checkpoints.filter((_, i) => i !== index);
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const moveCheckpoint = (index: number, newCoords: MapCoordinate, userLoc: MapCoordinate | null) => {
    const updated = [...checkpoints];
    updated[index] = newCoords;
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  return {
    checkpoints,
    questPath,
    questRewards,
    isDragging,
    setIsDragging,
    addCheckpoint,
    deleteCheckpoint,
    moveCheckpoint
  };
};