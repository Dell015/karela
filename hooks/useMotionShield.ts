import { useState, useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { Pedometer } from 'expo-sensors';

export const useMotionShield = () => {
  const [isPhysicallyMoving, setIsPhysicallyMoving] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;
    let cancelled = false;

    const watchMovement = async () => {
      // Check hardware availability first
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable || cancelled) return;

      // Request Motion & Fitness permission explicitly (iOS requires this)
      const { status: existing } = await Pedometer.getPermissionsAsync();

      let granted = existing === 'granted';

      if (!granted) {
        const { status } = await Pedometer.requestPermissionsAsync();
        granted = status === 'granted';
      }

      if (!granted) {
        setPermissionDenied(true);
        Alert.alert(
          "Motion Access Required",
          "Karela uses your motion data to detect when you're physically running and prevent GPS cheating. Enable it in Settings → Privacy → Motion & Fitness.",
          [
            { text: "Skip", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      if (cancelled) return;

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

  return { isPhysicallyMoving, stepCount, permissionDenied };
};
