import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { KARELA } from "@/styles/designSystem";
import { saveGhostRun } from "@/services/database/sqlite/database";
import { onRunCompleted } from "@/services/engines/GhostModelManager";
import { stripPrivacyZones } from "@/services/privacyZones";
import {
  caloriesFor,
  clockText,
  kmText,
  paceFor,
  paceText,
  speedFor,
  xpFor,
} from "@/services/runMath";
import { getRun, queueRun } from "@/services/runOutbox";
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

const { width } = Dimensions.get("window");

export default function SummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile, syncRuns } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // The run is read from the phone by its id (services/runOutbox.ts), so a
  // link can't hand this screen a distance. XP and calories are worked out
  // here with the shared formulas (services/runMath.ts), never NaN.
  const [run] = useState(() => (typeof id === "string" ? getRun(id) : null));
  const meters = run?.meters ?? 0;
  const seconds = run?.seconds ?? 0;
  const xp = xpFor(meters);
  const kcal = caloriesFor(meters, profile?.stats?.weight);
  const avgPace = paceFor(meters, seconds);
  const avgKmh = speedFor(meters, seconds);

  const handleSaveGhost = async () => {
    if (!run) return;
    try {
      // Points inside Privacy Zones were dropped before the run was saved;
      // this also drops any zone added since.
      const safePath = await stripPrivacyZones(run.path);
      if (safePath.length < 2) {
        Alert.alert(
          "Ghost not saved",
          "Most of this run was inside your Privacy Zones, so there's no route left to save. Your distance and XP still count.",
        );
        return;
      }

      // saveGhostRun is async and resolves to null on failure — without the
      // await, the catch below could never see an error and the success alert
      // fired even when the write failed.
      const saved = await saveGhostRun(meters, seconds, safePath);

      if (!saved) {
        Alert.alert("Ghost not saved", "This run couldn't be saved as a ghost. Try again.");
        return;
      }

      onRunCompleted({
        id: Date.now(),
        date: Date.now(),
        distance: meters,
        duration: seconds,
        avg_speed: seconds > 0 ? (meters / seconds) * 3.6 : 0,
        path_data: JSON.stringify(safePath),
      });

      Alert.alert("Ghost saved", "Your ghost will learn from this run.");
    } catch {
      Alert.alert("Ghost not saved", "This run couldn't be saved as a ghost. Try again.");
    }
  };

  // The run joins the outbox, then syncs. Offline it waits on the phone and
  // goes the next time Karela opens with a connection; every step is keyed
  // to the run's id, so nothing is counted twice.
  const handleFinalizeMission = async () => {
    if (!user || !run) return;
    setIsSaving(true);
    try {
      queueRun(run.id, kcal, xp);
      await syncRuns();
      if (getRun(run.id)) {
        Alert.alert(
          "Saved on this phone",
          "Your run couldn't reach your account just now. It's kept on this phone and will be sent the next time you open Karela with a connection.",
        );
      }
      router.replace("/drawer/dashboard");
    } catch (error) {
      console.error("Finalize Error:", error);
      Alert.alert("Run not saved", "This run couldn't be saved on your phone. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!run) {
    return (
      <Screen variant="energy">
        <SafeAreaView style={[styles.container, styles.missing]}>
          <Text style={styles.completeText}>Run not found</Text>
          <Text style={styles.missingText}>
            This run isn&apos;t on this phone any more. If you saved it, it&apos;s already in your history.
          </Text>
          <Button label="Back to home" block onPress={() => router.replace("/drawer/dashboard")} />
        </SafeAreaView>
      </Screen>
    );
  }

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
            <LinearGradient colors={KARELA.gradients.brand} style={styles.xpCircle}>
              <Text style={styles.xpAmount}>+{xp}</Text>
              <Text style={styles.xpLabel}>XP earned</Text>
            </LinearGradient>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statTile} accessible accessibilityLabel={`Distance ${kmText(meters)} kilometres`}>
              <Ionicons name="location-outline" size={24} color={KARELA.color.brand} />
              <Text style={styles.tileValue}>{kmText(meters)} km</Text>
              <Text style={styles.tileLabel}>Distance</Text>
            </View>

            <View style={styles.statTile} accessible accessibilityLabel={`Time ${clockText(seconds)}`}>
              <Ionicons name="time-outline" size={24} color={KARELA.color.brand} />
              <Text style={styles.tileValue}>{clockText(seconds)}</Text>
              <Text style={styles.tileLabel}>Time</Text>
            </View>

            <View
              style={styles.statTile}
              accessible
              accessibilityLabel={avgPace ? `Average pace ${paceText(avgPace)} per kilometre` : "Average pace not available"}
            >
              <Ionicons name="speedometer-outline" size={24} color={KARELA.color.brand} />
              <Text style={styles.tileValue}>{avgPace ? `${paceText(avgPace)} /km` : "--"}</Text>
              <Text style={styles.tileLabel}>
                {avgPace && avgKmh ? `Avg pace, ${avgKmh.toFixed(1)} km/h` : "Avg pace"}
              </Text>
            </View>

            <View style={styles.statTile} accessible accessibilityLabel={`About ${kcal} calories`}>
              <Ionicons name="flame-outline" size={24} color={KARELA.color.brand} />
              <Text style={styles.tileValue}>{kcal}</Text>
              <Text style={styles.tileLabel}>Calories, est.</Text>
            </View>
          </View>
          {!avgPace && (
            <Text style={styles.paceNote}>Pace shows once a run is at least 100 m long.</Text>
          )}
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
  tileLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium, marginTop: KARELA.space.xs, textAlign: "center" },
  paceNote: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: KARELA.space.sm },

  footer: { padding: 30, width: "100%" },
  missing: { justifyContent: "center", alignItems: "center", padding: KARELA.space.xl, gap: KARELA.space.lg },
  missingText: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    textAlign: "center",
  },
  ghostButton: {
    marginBottom: KARELA.space.md,
  },
});
