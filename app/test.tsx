import { loadRun, saveRun } from "@/services/tracker/StorageService";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { GhostPoint } from "../services/tracker/GhostEngine";
import { startRecording } from "../services/tracker/GhostRecorder";
import { styles } from "./styles/engineStyle";

export default function TestRecorderScreen() {
  /**
   * 2. STATE MANAGEMENT
   * currentPath: Stores the growing array of GPS points.
   * isRecording: Toggles the UI between "Start" and "Stop" modes.
   * subscription: Holds the active GPS watcher so we can kill it later.
   */
  const [currentPath, setCurrentPath] = useState<GhostPoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  /**
   * 3. START HANDLER
   * Triggered when the user hits "START RECORDING".
   */
  const handleStart = async () => {
    // UI Feedback: Change button color/text immediately
    setIsRecording(true);

    // Clear previous run data so we start fresh
    setCurrentPath([]);

    // Call our backend recorder.
    // It takes a "callback" function that runs every time the GPS moves 5 meters.
    const sub = await startRecording((newPath) => {
      // Every time a new point is added, update the screen
      setCurrentPath(newPath);
    });

    // Save the subscription to memory so we can stop it later
    setSubscription(sub);
  };

  /**
   * 4. STOP HANDLER
   * Triggered when the user hits "STOP RECORDING".
   */
  const handleStop = async () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }

    setIsRecording(false);

    // Saving Logic
    // We only want to save if we actually collected some data!
    if (currentPath.length > 0) {
      try {
        // call storage service
        await saveRun(currentPath);
        console.log("Success Run saved to permanent storage.");
        alert("Run Saved!");
      } catch (error) {
        console.error("Save failed:", error);
      }
    }

    console.log("Run Finnished! Total Points:", currentPath.length);
  };

  const handleLoad = async () => {
    const savedPoints = await loadRun();
    if (savedPoints.length > 0) {
      setCurrentPath(savedPoints);
      alert(`Loaded ${savedPoints.length} points from last run!`);
    } else {
      alert("No saved runs found.");
    }
  };

  /**
   * 5. DATA EXTRACTION
   * We grab the very last point in the array to show live stats (Speed, Distance, etc.)
   */
  const latestPoint = currentPath[currentPath.length - 1];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GPS Diagnostics</Text>

      {/* DISPLAY BOX: Shows live data from the Engine/Recorder */}
      <View style={styles.statsBox}>
        <Text style={styles.label}>Points Collected: {currentPath.length}</Text>

        {/* .toFixed(2) keeps the numbers from having 15 decimal places */}
        <Text style={styles.label}>
          Total Distance: {latestPoint?.distanceFromStart.toFixed(2) || 0}m
        </Text>

        <Text style={styles.label}>
          Lat: {latestPoint?.latitude.toFixed(5) || "0"}
        </Text>

        <Text style={styles.label}>
          Lon: {latestPoint?.longitude.toFixed(5) || "0"}
        </Text>
      </View>

      {/* DYNAMIC BUTTON: Switches styles based on isRecording state */}
      <TouchableOpacity
        style={[styles.button, isRecording ? styles.stopBtn : styles.startBtn]}
        onPress={isRecording ? handleStop : handleStart}
      >
        <Text style={styles.buttonText}>
          {isRecording ? "STOP RECORDING" : "START RECORDING"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loadBtn} onPress={handleLoad}>
        <Text style={styles.btnText}>LOAD LAST RUN</Text>
      </TouchableOpacity>
    </View>
  );
}
