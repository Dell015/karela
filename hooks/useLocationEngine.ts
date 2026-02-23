import { useState, useEffect } from 'react';
import { GhostEngine } from '@/services/tracker/GhostEngine'; // Import your service

// Inside hooks/useLocationEngine.ts

export const useLocationEngine = (savedGhostData?: any[]) => {
  const [path, setPath] = useState([]);
  const [ghostPosition, setGhostPosition] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRacing, setIsRacing] = useState(false);

  useEffect(() => {
    let interval: any;

    if (isRacing) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;

          // 1. Update Ghost Position based on the new clock tick
          if (savedGhostData) {
            const newGhostPos = GhostEngine.getGhostPosition(savedGhostData, newTime);
            setGhostPosition(newGhostPos);
          }

          // 2. Handle Player movement (Simulator for now, GPS later)
          // ... (existing simulation logic)
          
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRacing]);

  return {
    path,
    ghostPosition,
    isRacing,
    setIsRacing,
    currentLocation: path[path.length - 1] // This fixes the "currentLocation" error
  };
};