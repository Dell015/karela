import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { GhostPoint } from "../services/tracker/GhostEngine";
import { startRecording } from "../services/tracker/GhostRecorder";
import { styles } from "../styles/Run-Record";

export default function App() {
  // 1. This stores the array of points we get from the Recorder
  const [points, setPoints] = useState<GhostPoint[]>([]);

  // 2. This tracks if we are currently recording or not
  const [isBusy, setIsBusy] = useState(false);

  // 3. This stores the "Subscription" so we can turn the GPS OFF
  const [watcher, setWatcher] = useState<any>(null);

  const handleStart = async () => {
    setIsBusy(true); // Change UI to "Recording..."
    setPoints([]); // Reset the screen to 0 points

    // We call the recorder and pass it a function to run every time it gets a point
    const sub = await startRecording((newPoints) => {
      setPoints(newPoints); // Update our state with the new list
    });

    setWatcher(sub); // Save the sub so we can "Unsubscribe" later
  };

  const handleStop = () => {
    if (watcher) {
      watcher.remove(); // This tells the GPS hardware: "Stop listening!"
      setWatcher(null);
    }
    setIsBusy(false);
  };

  const lastPoint = points[points.length - 1];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>KARELA TRACKER</Text>

      <View style={styles.dashboard}>
        <Text style={styles.label}>
          Distance: {lastPoint?.distanceFromStart.toFixed(2) || "0.00"}m
        </Text>
        <Text style={styles.label}>Points: {points.length}</Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, isBusy ? styles.stopBtn : styles.startBtn]}
        onPress={isBusy ? handleStop : handleStart}
      >
        <Text style={styles.btnText}>{isBusy ? "STOP" : "START RUN"}</Text>
      </TouchableOpacity>
    </View>
  );
}
