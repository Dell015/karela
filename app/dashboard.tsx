import React, { useEffect, useRef, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Custom Services
import { initDatabase } from "../services/database/sqlite.service";
import { startLocationTracking } from "../services/tracker/location.service";

// Tracker Logic with Thesis Filtering
import {
    calculateFinalVerifiedDistance,
    recordPoint,
    resetTracker,
} from "../services/tracker/recorder.logic";

export default function Dashboard() {
  // --- STATE ---
  const [distance, setDistance] = useState(0);
  const [verifiedDistance, setVerifiedDistance] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isMoving, setIsMoving] = useState(false); // To show "Moving" vs "Stationary"
  const [log, setLog] = useState<string[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(true);

  // --- REFS ---
  const lastPointRef = useRef<any>(null);
  const dbRef = useRef<any>(null);
  const currentRunIdRef = useRef<string>("");

  // Initialize Database on Mount
  useEffect(() => {
    initDatabase().then((db) => {
      dbRef.current = db;
      addLog("System Ready: Database Connected");
    });
  }, []);

  const addLog = (msg: string) => {
    setLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 15),
    ]);
  };

  const handleStart = async () => {
    // 1. Reset Logic State for new run
    resetTracker();
    setIsTracking(true);
    setDistance(0);
    setVerifiedDistance(null);
    setIsMoving(false);
    lastPointRef.current = null;

    const runId = `RUN_${Date.now()}`;
    currentRunIdRef.current = runId;
    addLog(`Started Run: ${runId}`);

    const subscription = await startLocationTracking(async (location) => {
      const { latitude, longitude, accuracy: acc } = location.coords;
      setAccuracy(acc || 0);

      // 2. Accuracy Gatekeeper
      const threshold = isDebugMode ? 100 : 12;
      if (acc && acc > threshold) {
        addLog(`Signal Weak: ${acc.toFixed(1)}m (Dropped)`);
        return;
      }

      // 3. Process Point through Multi-Stage Filter
      const newPoint = await recordPoint(
        dbRef.current,
        runId,
        latitude,
        longitude,
        lastPointRef.current,
      );

      // 4. Update UI based on filter results
      if (newPoint === lastPointRef.current && lastPointRef.current !== null) {
        // Point was blocked by the Stationary/Displacement filter
        setIsMoving(false);
      } else {
        // Point passed filters
        setIsMoving(true);
        setDistance(newPoint.totalDistance);
        lastPointRef.current = newPoint;
        addLog(`Moved: ${newPoint.totalDistance.toFixed(2)}m`);
      }
    });

    (global as any).testSub = subscription;
  };

  const handleStop = async () => {
    setIsTracking(false);
    setIsMoving(false);
    if ((global as any).testSub) (global as any).testSub.remove();

    addLog("Calculating Final Audit...");

    // 5. THE FINAL AUDIT (Thesis Component)
    try {
      // Fetch all raw points recorded in this run
      const allPoints = await dbRef.current.getAllAsync(
        "SELECT latitude as lat, longitude as lon, timestamp FROM ghost_points WHERE run_id = ? ORDER BY timestamp ASC",
        [currentRunIdRef.current],
      );

      const finalMeters = calculateFinalVerifiedDistance(allPoints);
      setVerifiedDistance(finalMeters);

      addLog(
        `AUDIT: Raw ${distance.toFixed(2)}m -> Verified ${finalMeters.toFixed(2)}m`,
      );
    } catch (err) {
      addLog("Audit Error. Check DB.");
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>KARELA ENGINE</Text>

      <View style={styles.debugToggle}>
        <Text style={{ color: "#fff" }}>Indoor Debug (Accuracy Bypass)</Text>
        <Switch
          value={isDebugMode}
          onValueChange={setIsDebugMode}
          trackColor={{ false: "#767577", true: "#00ff00" }}
        />
      </View>

      <View style={styles.monitor}>
        <Text style={styles.label}>
          {isTracking
            ? isMoving
              ? "🏃 USER MOVING"
              : "📍 STATIONARY"
            : "FINAL RESULT"}
        </Text>

        <Text style={styles.mainValue}>
          {verifiedDistance !== null
            ? verifiedDistance.toFixed(2)
            : distance.toFixed(2)}
          m
        </Text>

        {verifiedDistance !== null && (
          <Text style={styles.auditText}>
            Raw Estimate: {distance.toFixed(2)}m
          </Text>
        )}

        <View style={styles.accuracyRow}>
          <Text style={styles.label}>GPS PRECISION: </Text>
          <Text
            style={[
              styles.accValue,
              accuracy > (isDebugMode ? 100 : 12)
                ? { color: "#ff4444" }
                : { color: "#00ff00" },
            ]}
          >
            {accuracy > 0 ? `${accuracy.toFixed(1)}m` : "Searching..."}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        {!isTracking ? (
          <TouchableOpacity style={styles.btnStart} onPress={handleStart}>
            <Text style={styles.btnText}>START TRACKING</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnStop} onPress={handleStop}>
            <Text style={styles.btnText}>STOP & VERIFY</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.logContainer}>
        {log.map((line, i) => (
          <Text key={i} style={styles.logText}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 20 },
  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 40,
    textAlign: "center",
    letterSpacing: 2,
  },
  debugToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  monitor: {
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 25,
    marginVertical: 20,
    alignItems: "center",
    borderWidth: 1, // Changed from borderWeight
    borderColor: "#333",
  },
  label: { color: "#888", fontSize: 12, letterSpacing: 1, marginBottom: 5 },
  mainValue: { color: "#fff", fontSize: 60, fontWeight: "bold" },
  auditText: { color: "#666", fontSize: 14, marginBottom: 10 },
  accuracyRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  accValue: { fontWeight: "bold" },
  controls: { alignItems: "center" },
  btnStart: {
    backgroundColor: "#00ff00",
    padding: 22,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
  },
  btnStop: {
    backgroundColor: "#ff4444",
    padding: 22,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
  },
  btnText: { fontWeight: "bold", color: "#000", fontSize: 16 },
  logContainer: {
    flex: 1,
    marginTop: 20,
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  logText: {
    color: "#00ff00",
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 3,
  },
});
