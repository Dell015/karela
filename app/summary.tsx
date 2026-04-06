import { saveGhostRun } from "@/services/database/sqlite/database"; // Import your DB service
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SummaryScreen() {
  const router = useRouter();
  // 'path' is the new param containing the coordinate array
  const { meters, seconds, kcal, xp, path } = useLocalSearchParams();

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Number(totalSeconds) % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSaveGhost = () => {
    try {
      if (path) {
        // Save to SQLite
        saveGhostRun(
          Number(meters),
          Number(seconds),
          JSON.parse(path as string),
        );
        Alert.alert(
          "Mission Logged",
          "Your Ghost has been saved to the database.",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not save Ghost data.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="trophy" size={80} color="#7CF205" style={styles.icon} />
        <Text style={styles.title}>MISSION COMPLETE</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{meters}m</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>{formatTime(Number(seconds))}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ENERGY</Text>
            <Text style={styles.statValue}>{kcal} kcal</Text>
          </View>
        </View>

        <View style={styles.xpCard}>
          <Text style={styles.xpText}>TOTAL REWARD</Text>
          <Text style={styles.xpValue}>+{xp} XP</Text>
        </View>

        {/* NEW: SAVE GHOST BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: "#1A1A1A",
              borderWidth: 1,
              borderColor: "#7CF205",
              marginBottom: 15,
            },
          ]}
          onPress={handleSaveGhost}
        >
          <Text style={[styles.buttonText, { color: "#7CF205" }]}>
            SAVE AS GHOST
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/dashboard/dashboard")}
        >
          <Text style={styles.buttonText}>RETURN TO BASE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  icon: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: "bold", color: "white", marginBottom: 40 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  statBox: { alignItems: "center" },
  statLabel: { color: "#888", fontSize: 12, marginBottom: 5 },
  statValue: { color: "white", fontSize: 20, fontWeight: "bold" },
  xpCard: {
    backgroundColor: "#1A1A1A",
    padding: 20,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#333",
  },
  xpText: { color: "#7CF205", fontSize: 14, fontWeight: "bold" },
  xpValue: { color: "white", fontSize: 36, fontWeight: "bold" },
  button: {
    backgroundColor: "#7CF205",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  buttonText: { color: "black", fontSize: 18, fontWeight: "bold" },
});
