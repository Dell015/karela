import { useAuth } from "@/context/AuthContext";
import { KARELA } from "@/styles/designSystem";
import { saveGhostRun } from "@/services/database/sqlite/database";
import { onRunCompleted } from "@/services/engines/GhostModelManager";
import { GEM_EARNINGS, getTotalSectors } from "@/services/gemSystem";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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

import { syncRunToMissions } from "@/services/database/supabase/missions";
import { incrementStats, setStats } from "@/services/database/supabase/profiles";
import {
    generateAndSaveRunSummary,
    logRunHistory,
} from "@/services/database/supabase/runService";
import { calculateStreak } from "@/services/statsService";

const { width } = Dimensions.get("window");

export default function SummaryScreen() {
  const router = useRouter();
  const { meters, seconds, kcal, xp, path } = useLocalSearchParams();
  const { user, profile, gainXP, earnGems } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(Number(totalSeconds) / 60);
    const s = Number(totalSeconds) % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const logRunToHistory = async () => {
    if (!user) return;
    try {
      await logRunHistory(user.uid, {
        distance_meters: Number(meters),
        duration_seconds: Number(seconds),
        calories: Number(kcal),
        xp_earned: Number(xp),
      });
    } catch (error) {
      console.error("Run history log error:", error);
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

        const parsedPath = JSON.parse(path as string);
        onRunCompleted({
          id: Date.now(),
          date: Date.now(),
          distance: Number(meters),
          duration: Number(seconds),
          avg_speed: Number(seconds) > 0 ? (Number(meters) / Number(seconds)) * 3.6 : 0,
          path_data: path as string,
        });

        Alert.alert(
          "Ghost Saved",
          "Your adaptive ghost is learning from this run!",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not save Ghost data locally.");
    }
  };

  const handleFinalizeMission = async () => {
    setIsSaving(true);

    if (!user || !profile) {
      Alert.alert("Error", "Profile not loaded. Please wait.");
      setIsSaving(false);
      return;
    }

    try {
      const distanceInKm = Number(meters) / 1000;

      await incrementStats(user.uid, {
        total_distance_km: Number(distanceInKm.toFixed(2)),
        total_calories_burned: Number(Number(kcal).toFixed(2)),
      });

      await logRunToHistory();

      const runData = {
        distance: Number(meters),
        duration: Number(seconds),
        avgSpeed: (Number(meters) / Number(seconds)) * 3.6,
        sectors: [],
        pace: (Number(meters) / Number(seconds)) * 3.6,
      };
      await generateAndSaveRunSummary(user.uid, runData);

      await syncRunToMissions(user.uid, distanceInKm);

      const currentStreak = calculateStreak();
      const longestStreak = Math.max(
        currentStreak,
        Number(profile?.stats?.longest_streak || 0)
      );
      await setStats(user.uid, {
        streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: new Date().toISOString(),
      });

      if (xp) await gainXP(Number(xp));

      const totalSectors = getTotalSectors(Number(meters));
      if (totalSectors > 0) {
        const gemsEarned = totalSectors * GEM_EARNINGS.SECTOR_BONUS;
        await earnGems(gemsEarned);
      }

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[KARELA.color.bg, KARELA.color.surface]}
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
              colors={KARELA.gradients.brand as unknown as string[]}
              style={styles.xpCircle}
            >
              <Text style={styles.xpAmount}>+{xp}</Text>
              <Text style={styles.xpLabel}>XP GAINED</Text>
            </LinearGradient>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statTile}>
              <Ionicons name="location-outline" size={24} color={KARELA.color.brand} />
              <Text style={styles.tileValue}>{meters}m</Text>
              <Text style={styles.tileLabel}>DISTANCE</Text>
            </View>

            <View style={styles.statTile}>
              <Ionicons name="time-outline" size={24} color={KARELA.color.brand} />
              <Text style={styles.tileValue}>
                {formatTime(Number(seconds))}
              </Text>
              <Text style={styles.tileLabel}>DURATION</Text>
            </View>

            <View style={styles.statTile}>
              <Ionicons name="flame-outline" size={24} color={KARELA.color.brand} />
              <Text style={styles.tileValue}>{kcal}</Text>
              <Text style={styles.tileLabel}>CALORIES</Text>
            </View>

            <View style={styles.statTile}>
              <Ionicons name="speedometer-outline" size={24} color={KARELA.color.brand} />
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
            <Ionicons name="copy-outline" size={20} color={KARELA.color.brand} />
            <Text style={styles.ghostButtonText}>RECORD AS GHOST</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFinalizeMission}
            disabled={isSaving}
          >
            <LinearGradient
              colors={KARELA.gradients.brand as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isSaving ? (
                <ActivityIndicator color={KARELA.color.onBright} />
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
  container: { flex: 1, backgroundColor: KARELA.color.bg },
  header: { alignItems: "center", marginTop: KARELA.space.xxxl },
  missionText: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.medium,
    letterSpacing: 4,
  },
  completeText: {
    color: KARELA.color.textPrimary,
    fontSize: 38,
    fontFamily: KARELA.font.black,
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
    marginBottom: KARELA.space.xxxl,
  },
  xpCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
    shadowColor: KARELA.color.brand,
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  xpAmount: { fontSize: 48, fontFamily: KARELA.font.black, color: KARELA.color.textPrimary },
  xpLabel: { fontSize: KARELA.size.label, fontFamily: KARELA.font.bold, color: KARELA.color.textPrimary, opacity: 0.7 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: KARELA.space.xl,
  },
  statTile: {
    width: width * 0.4,
    backgroundColor: KARELA.color.surface,
    margin: KARELA.space.sm,
    padding: KARELA.space.xl,
    borderRadius: KARELA.radius.lg,
    borderWidth: 1,
    borderColor: KARELA.color.surfaceSoft,
    alignItems: "center",
  },
  tileValue: { color: KARELA.color.textPrimary, fontSize: KARELA.space.xl, fontFamily: KARELA.font.bold, marginTop: KARELA.space.sm },
  tileLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium, letterSpacing: 1, marginTop: KARELA.space.xs },

  footer: { padding: 30, width: "100%" },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    marginBottom: 15,
    borderRadius: KARELA.radius.md,
    borderWidth: 1,
    borderColor: KARELA.color.brand,
  },
  ghostButtonText: { color: KARELA.color.brand, fontFamily: KARELA.font.bold, marginLeft: 10 },
  primaryButton: {
    width: "100%",
    height: 60,
    borderRadius: KARELA.radius.md,
    overflow: "hidden",
  },
  gradientButton: { flex: 1, justifyContent: "center", alignItems: "center" },
  primaryButtonText: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.black,
    letterSpacing: 1,
  },
});
