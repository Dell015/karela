import { KARELA } from "@/styles/designSystem";
import { supabase } from "@/services/database/supabase/config";
import { getStreakTier } from "@/services/streakMultiplier";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RunRecord {
  id: string;
  distance_meters: number;
  duration_seconds: number;
  calories: number;
  xp_earned: number;
  completed_at: string;
}

interface RunHistoryProps {
  userId: string;
  streak: number;
  gems: number;
}

export const RunHistory = ({ userId, streak, gems }: RunHistoryProps) => {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchRuns = async () => {
      const { data, error } = await supabase
        .from("run_history")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setRuns(data);
      }
      setLoading(false);
    };

    fetchRuns();
  }, [userId]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  const formatPace = (meters: number, seconds: number) => {
    if (seconds <= 0 || meters <= 0) return "--";
    const paceSecsPerKm = (seconds / meters) * 1000;
    const m = Math.floor(paceSecsPerKm / 60);
    const s = Math.floor(paceSecsPerKm % 60);
    return `${m}:${s.toString().padStart(2, "0")}/km`;
  };

  const tier = getStreakTier(streak);

  return (
    <View style={styles.container}>
      {/* STREAK & GEMS BAR */}
      <View style={styles.metricsBar}>
        <View style={styles.metricPill}>
          <Ionicons name="flame" size={14} color={KARELA.color.gold} />
          <Text style={styles.metricValue}>{streak}d</Text>
          <Text style={styles.metricLabel}>
            {tier.multiplier}x
          </Text>
        </View>
        <View style={styles.metricPill}>
          <Ionicons name="diamond" size={14} color={KARELA.color.brand} />
          <Text style={styles.metricValue}>{gems}</Text>
          <Text style={styles.metricLabel}>gems</Text>
        </View>
        <View style={styles.metricPill}>
          <Ionicons name="fitness" size={14} color={KARELA.color.civic} />
          <Text style={styles.metricValue}>{runs.length}</Text>
          <Text style={styles.metricLabel}>runs</Text>
        </View>
      </View>

      {/* RUN HISTORY LIST */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.collapseHeader}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Run History</Text>
          <View style={styles.collapseRight}>
            <Text style={styles.runCount}>{runs.length} runs</Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={KARELA.color.textFaint}
            />
          </View>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={KARELA.color.brand} style={{ marginTop: KARELA.space.xl }} />
        ) : !expanded ? null : runs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="footsteps-outline" size={32} color={KARELA.color.surfaceSoft} />
            <Text style={styles.emptyText}>
              No runs recorded yet.{"\n"}Start a run to see your history here.
            </Text>
          </View>
        ) : (
          runs.map((run, index) => (
            <View key={run.id} style={styles.runCard}>
              <View style={styles.runHeader}>
                <Text style={styles.runDate}>{formatDate(run.completed_at)}</Text>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>+{run.xp_earned} XP</Text>
                </View>
              </View>

              <View style={styles.runStats}>
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>
                    {(run.distance_meters / 1000).toFixed(2)}
                  </Text>
                  <Text style={styles.runStatLabel}>km</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>
                    {formatTime(run.duration_seconds)}
                  </Text>
                  <Text style={styles.runStatLabel}>time</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>
                    {formatPace(run.distance_meters, run.duration_seconds)}
                  </Text>
                  <Text style={styles.runStatLabel}>pace</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>
                    {Math.round(run.calories)}
                  </Text>
                  <Text style={styles.runStatLabel}>kcal</Text>
                </View>
              </View>

              {index < runs.length - 1 && <View style={styles.separator} />}
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: KARELA.space.xl },
  metricsBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: KARELA.space.md,
    paddingHorizontal: KARELA.space.xl,
    marginBottom: KARELA.space.xl,
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: KARELA.color.surface,
    paddingHorizontal: KARELA.space.lg,
    paddingVertical: KARELA.space.sm,
    borderRadius: KARELA.radius.lg,
    borderWidth: 1,
    borderColor: KARELA.color.surfaceSoft,
  },
  metricValue: { color: KARELA.color.textPrimary, fontFamily: KARELA.font.black, fontSize: KARELA.size.body },
  metricLabel: { color: KARELA.color.textFaint, fontSize: 11, fontFamily: KARELA.font.regular },
  section: { paddingHorizontal: KARELA.space.xl },
  collapseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  collapseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  runCount: { color: KARELA.color.textFaint, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  sectionTitle: {
    color: KARELA.color.textPrimary,
    fontSize: 16,
    fontFamily: KARELA.font.black,
    marginBottom: KARELA.space.lg,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: KARELA.space.xxxl,
    gap: 10,
  },
  emptyText: {
    color: KARELA.color.textFaint,
    textAlign: "center",
    fontSize: 13,
    fontFamily: KARELA.font.regular,
    lineHeight: 20,
  },
  runCard: { marginBottom: KARELA.space.xs },
  runHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: KARELA.space.sm,
  },
  runDate: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  xpBadge: {
    backgroundColor: "rgba(124,242,5,0.1)",
    paddingHorizontal: KARELA.space.sm,
    paddingVertical: 3,
    borderRadius: KARELA.space.sm,
  },
  xpText: { color: KARELA.color.brand, fontSize: 11, fontFamily: KARELA.font.bold },
  runStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: KARELA.radius.md,
    paddingVertical: KARELA.space.lg,
    paddingHorizontal: KARELA.space.lg,
  },
  runStat: { flex: 1, alignItems: "center" },
  runStatValue: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.black },
  runStatLabel: { color: KARELA.color.textFaint, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: 2, letterSpacing: 0.5 },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: KARELA.color.surfaceSoft,
  },
  separator: {
    height: 1,
    backgroundColor: KARELA.color.surface,
    marginVertical: KARELA.space.md,
  },
});
