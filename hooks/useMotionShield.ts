import { useState, useEffect } from 'react';
import { Pedometer } from 'expo-sensors';

export const useMotionShield = () => {
  const [isPhysicallyMoving, setIsPhysicallyMoving] = useState(false);
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    let subscription: any;

    const watchMovement = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (isAvailable) {
        // Watch for step changes
        subscription = Pedometer.watchStepCount(result => {
          setStepCount(result.steps);
          setIsPhysicallyMoving(true);
          
          // Reset movement flag after 5 seconds of no steps
          setTimeout(() => setIsPhysicallyMoving(false), 5000);
        });
      }
    };

    watchMovement();
    return () => subscription && subscription.remove();
  }, []);

  return { isPhysicallyMoving, stepCount };
};