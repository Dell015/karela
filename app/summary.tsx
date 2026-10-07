import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
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
    Alert,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { incrementStats, setStats } from "@/services/database/supabase/profiles";
import {
    generateAndSaveRunSummary,
    logRunHistory,
} from "@/services/database/supabase/runService";
import { calculateStreak } from "@/services/statsService";
import { fetchStreakFromHistory } from "@/services/streakService";
import { QuestEngine } from "@/services/engines/QuestEngine";

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

  const handleSaveGhost = async () => {
    try {
      if (path) {
        // saveGhostRun is async and resolves to null on failure — without the
        // await, the catch below could never see an error and the success alert
        // fired even when the write failed.
        const saved = await saveGhostRun(
          Number(meters),
          Number(seconds),
          JSON.parse(path as string),
        );

        if (!saved) {
          Alert.alert("Ghost not saved", "This run couldn't be saved as a ghost. Try again.");
          return;
        }

        onRunCompleted({
          id: Date.now(),
          date: Date.now(),
          distance: Number(meters),
          duration: Number(seconds),
          avg_speed: Number(seconds) > 0 ? (Number(meters) / Number(seconds)) * 3.6 : 0,
          path_data: path as string,
        });

        Alert.alert(
          "Ghost saved",
          "Your ghost will learn from this run.",
        );
      }
    } catch {
      Alert.alert("Ghost not saved", "This run couldn't be saved as a ghost. Try again.");
    }
  };

  const handleFinalizeMission = async () => {
    setIsSaving(true);

    if (!user || !profile) {
      Alert.alert("One moment", "Your profile is still loading. Try again in a few seconds.");
      setIsSaving(false);
      return;
    }

    try {
      const distanceInKm = Number(meters) / 1000;
      // Guard against a zero-duration run producing Infinity/NaN, which would
      // be written to the profile and to mission progress.
      const avgSpeedKmh =
        Number(seconds) > 0 ? (Number(meters) / Number(seconds)) * 3.6 : 0;

      await incrementStats(user.uid, {
        total_distance_km: Number(distanceInKm.toFixed(2)),
        total_calories_burned: Number(Number(kcal).toFixed(2)),
      });

      await logRunToHistory();

      const runData = {
        distance: Number(meters),
        duration: Number(seconds),
        avgSpeed: avgSpeedKmh,
        sectors: [],
        pace: avgSpeedKmh,
      };
      await generateAndSaveRunSummary(user.uid, runData);

      // Sync run distance to all active missions via QuestEngine
      await QuestEngine.syncRunProgress(user.uid, distanceInKm, avgSpeedKmh);

      // Count from run_history (has every run, including this one). Falls
      // back to the local count if the history cannot be read.
      const currentStreak = (await fetchStreakFromHistory(user.uid)) ?? calculateStreak();
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
        "Not synced yet",
        "Your run couldn't be sent to your account. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen variant="energy">
    <View style={styles.container}>
      <LinearGradient
        colors={[KARELA.color.bg, KARELA.color.surface]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.missionText}>Run complete</Text>
          <Text style={styles.completeText}>Nice work</Text>
        </View>

        <View style={styles.content}>
          {/* Main XP Display */}
          <View style={styles.xpCircleContainer}>
            <LinearGradient
              colors={KARELA.gradients.brand}
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
          <Button
            label="Save as ghost"
            variant="secondary"
            icon="copy-outline"
            block
            onPress={handleSaveGhost}
            style={styles.ghostButton}
          />

          <Button
            label="Save and finish"
            block
            loading={isSaving}
            onPress={handleFinalizeMission}
          />
        </View>
      </SafeAreaView>
    </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
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
    marginBottom: KARELA.space.md,
  },
});
