import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/database/firebase/config";
import { saveGhostRun } from "@/services/database/sqlite/database";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  doc, // Add this
  getDocs,
  query, // Add this
  updateDoc, // Add this
  where,
} from "firebase/firestore";
import { generateAndSaveRunSummary } from "@/services/database/firebase/runService";

const { width } = Dimensions.get("window");

export default function SummaryScreen() {
  const router = useRouter();
  const { meters, seconds, kcal, xp, path } = useLocalSearchParams();
  const { user, profile, gainXP } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(Number(totalSeconds) / 60);
    const s = Number(totalSeconds) % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const logRunToFirebase = async () => {
    if (!user) return;
    try {
      const historyRef = collection(db, "users", user.uid, "run_history");
      await addDoc(historyRef, {
        distance_meters: Number(meters),
        duration_seconds: Number(seconds),
        calories: Number(kcal),
        xp_earned: Number(xp),
        completed_at: serverTimestamp(),
      });
    } catch (error) {
      console.error("Firebase Log Error:", error);
      throw error;
    }
  };

  const handleSaveGhost = () => {
    try {
      if (path) {
        saveGhostRun(
          Number(meters),
          Number(seconds),
          JSON.parse(path as string),
        );
        Alert.alert(
          "Ghost Saved",
          "You can now race against this run in the Map!",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not save Ghost data locally.");
    }
  };

  const handleFinalizeMission = async () => {
    setIsSaving(true);

    // Safety check: if there's no user or profile, we can't save stats
    if (!user || !profile) {
      Alert.alert("Error", "Profile not loaded. Please wait.");
      setIsSaving(false);
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const distanceInKm = Number(meters) / 1000;

      // 1. Update the Main Profile Stats (Total Distance & Calories)
      await updateDoc(userDocRef, {
        "stats.total_distance_km": Number(
          ((profile.stats?.total_distance_km || 0) + distanceInKm).toFixed(2),
        ),
        "stats.total_calories_burned": Number(
          ((profile.stats?.total_calories_burned || 0) + Number(kcal)).toFixed(
            2,
          ),
        ),
      });

      // 2. Log the raw data to history
      await logRunToFirebase();

      // 3. Trigger the AI Summary Generation
      const runData = {
        distance: Number(meters),
        duration: Number(seconds),
        avgSpeed: (Number(meters) / Number(seconds)) * 3.6,
        sectors: [],
        pace: (Number(meters) / Number(seconds)) * 3.6,
      };
      await generateAndSaveRunSummary(user.uid, runData);

      // 4. Update the Active Missions (Progress Bars)
      await syncRunToMissions(user.uid, distanceInKm);

      // 5. Award the Run XP
      if (xp) await gainXP(Number(xp));

      router.replace("/drawer/dashboard");
    } catch (error) {
      console.error("Finalize Error:", error);
      Alert.alert(
        "Sync Failed",
        "Could not synchronize stats to the Command Center.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const syncRunToMissions = async (userId: string, runKm: number) => {
    try {
      const missionsRef = collection(db, "users", userId, "missions");
      // Find only missions that are 'active' and track 'distance'
      const q = query(
        missionsRef,
        where("status", "==", "active"),
        where("type", "==", "distance"),
      );

      const querySnapshot = await getDocs(q);

      const updatePromises = querySnapshot.docs.map((missionDoc) => {
        const data = missionDoc.data();
        const newProgress = Number(data.currentValue || 0) + runKm;

        // Update each mission's document
        return updateDoc(doc(db, "users", userId, "missions", missionDoc.id), {
          currentValue: Number(newProgress.toFixed(2)), // Keep it clean to 2 decimal places
        });
      });

      await Promise.all(updatePromises);
      console.log(
        `Synced ${runKm}km to ${updatePromises.length} active missions.`,
      );
    } catch (error) {
      console.error("Mission Sync Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0d0d0d", "#1a1a1a"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.missionText}>MISSION STATUS</Text>
          <Text style={styles.completeText}>SUCCESSFUL</Text>
        </View>

        <View style={styles.content}>
          {/* Main XP Display */}
          <View style={styles.xpCircleContainer}>
            <LinearGradient
              colors={["#7CF205", "#209F77"]}
              style={styles.xpCircle}
            >
              <Text style={styles.xpAmount}>+{xp}</Text>
              <Text style={styles.xpLabel}>XP GAINED</Text>
            </LinearGradient>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statTile}>
              <Ionicons name="location-outline" size={24} color="#7CF205" />
              <Text style={styles.tileValue}>{meters}m</Text>
              <Text style={styles.tileLabel}>DISTANCE</Text>
            </View>

            <View style={styles.statTile}>
              <Ionicons name="time-outline" size={24} color="#7CF205" />
              <Text style={styles.tileValue}>
                {formatTime(Number(seconds))}
              </Text>
              <Text style={styles.tileLabel}>DURATION</Text>
            </View>

            <View style={styles.statTile}>
              <Ionicons name="flame-outline" size={24} color="#7CF205" />
              <Text style={styles.tileValue}>{kcal}</Text>
              <Text style={styles.tileLabel}>CALORIES</Text>
            </View>

            <View style={styles.statTile}>
              <Ionicons name="speedometer-outline" size={24} color="#7CF205" />
              <Text style={styles.tileValue}>
                {seconds && meters
                  ? ((Number(meters) / Number(seconds)) * 3.6).toFixed(1)
                  : 0}
              </Text>
              <Text style={styles.tileLabel}>AVG KM/H</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={handleSaveGhost}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={20} color="#7CF205" />
            <Text style={styles.ghostButtonText}>RECORD AS GHOST</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFinalizeMission}
            disabled={isSaving}
          >
            <LinearGradient
              colors={["#7CF205", "#209F77"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isSaving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryButtonText}>RETURN TO BASE</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  header: { alignItems: "center", marginTop: 40 },
  missionText: {
    color: "#7CF205",
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: "600",
  },
  completeText: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    fontStyle: "italic",
  },

  content: { flex: 1, justifyContent: "center", alignItems: "center" },

  xpCircleContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    padding: 10,
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  xpCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
    shadowColor: "#7CF205",
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  xpAmount: { fontSize: 48, fontWeight: "900", color: "#ffffff" },
  xpLabel: { fontSize: 12, fontWeight: "bold", color: "#ffffff", opacity: 0.7 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  statTile: {
    width: width * 0.4,
    backgroundColor: "#1a1a1a",
    margin: 8,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  tileValue: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 8 },
  tileLabel: { color: "#888", fontSize: 10, letterSpacing: 1, marginTop: 4 },

  footer: { padding: 30, width: "100%" },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    marginBottom: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#7CF205",
  },
  ghostButtonText: { color: "#7CF205", fontWeight: "bold", marginLeft: 10 },
  primaryButton: {
    width: "100%",
    height: 60,
    borderRadius: 15,
    overflow: "hidden",
  },
  gradientButton: { flex: 1, justifyContent: "center", alignItems: "center" },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
