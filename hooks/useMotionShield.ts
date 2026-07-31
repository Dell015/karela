import { useState, useEffect, useRef } from 'react';
import { Pedometer } from 'expo-sensors';

export const useMotionShield = () => {
  const [isPhysicallyMoving, setIsPhysicallyMoving] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;
    // If cleanup runs while isAvailableAsync() is still pending, the listener
    // below would be registered after unmount and never removed.
    let cancelled = false;

    const watchMovement = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (isAvailable && !cancelled) {
        subscription = Pedometer.watchStepCount(result => {
          setStepCount(result.steps);
          setIsPhysicallyMoving(true);

          // Clear any existing timeout before setting a new one
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Reset movement flag after 5 seconds of no new steps
          timeoutRef.current = setTimeout(() => {
            setIsPhysicallyMoving(false);
            timeoutRef.current = null;
          }, 5000);
        });
      }
    };

    watchMovement();

    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return { isPhysicallyMoving, stepCount };
};
