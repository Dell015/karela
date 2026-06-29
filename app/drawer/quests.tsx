import { useAuth, UserProfile } from "@/context/AuthContext";
import { ScreenHeader } from "@/components/ui";
import { Screen } from "@/components/ui/Screen";
import { generateAniQuest } from "@/services/database/firebase/aiService";
import {
    addMission,
    subscribeToMissions,
    updateMission
} from "@/services/database/supabase/missions";
import {
    incrementStats,
    setStats,
} from "@/services/database/supabase/profiles";
import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function QuestsScreen() {
  const { user, profile, gainXP } = useAuth();
  const router = useRouter();

  // --- FILTERS ---
  const [activeCategory, setActiveCategory] = useState<"solo" | "team">("solo");
  const [activeFreq, setActiveFreq] = useState<
    "daily" | "weekly" | "monthly" | "limited"
  >("daily");

  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- AUTO-GENERATION ENGINE ---
  const checkAndGenerateQuests = async () => {
    if (!profile?.uid || !profile?.stats || isGenerating) return;

    const now = new Date();
    const todayKey = now.toISOString().split("T")[0];

    // Helper for Week ID
    const getWeekId = (d: Date) => {
      const tempDate = new Date(d.getTime());
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      const weekNo = Math.ceil(
        ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      return `${tempDate.getFullYear()}-W${weekNo}`;
    };

    const weekKey = getWeekId(now);
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

    const { last_daily_reset, last_weekly_reset, last_monthly_reset } =
      profile.stats;

    const saveMission = async (q: any, freq: string, resetKey: string) => {
      await addMission(profile.uid, {
        title: q.title,
        description: q.description,
        target_value: q.goalDistance / 1000, // Storing as KM
        xp_reward: q.rewardXP,
        category: "solo",
        frequency: freq,
        type: "distance",
        created_at_key: todayKey,
      });
      await setStats(profile.uid, { [`last_${freq}_reset`]: resetKey });
    };

    try {
      setIsGenerating(true);

      // 1. DAILY
      if (last_daily_reset !== todayKey) {
        console.log("Generating Daily...");
        const q = await generateAniQuest(profile as UserProfile);
        if (q) await saveMission(q, "daily", todayKey);
      }

      // 2. WEEKLY
      if (last_weekly_reset !== weekKey) {
        console.log("Generating Weekly...");
        const q = await generateAniQuest(profile as UserProfile);
        if (q) await saveMission(q, "weekly", weekKey);
      }
    } catch (err: any) {
      console.error("Gen Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- REAL-TIME MISSION LISTENER ---
  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const unsubscribe = subscribeToMissions(
      user.uid,
      {
        status: "active",
        category: activeCategory,
        frequency: activeFreq,
      },
      (rows) => {
        const missionData = rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          currentValue: r.current_value,
          targetValue: r.target_value,
          xpReward: r.xp_reward,
          status: r.status,
        }));
        setMissions(missionData);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid, activeCategory, activeFreq]);

  // --- TRIGGER GENERATION ON LOAD ---
  useEffect(() => {
    if (profile?.uid) {
      checkAndGenerateQuests();
    }
  }, [profile?.uid]);

  // --- CLAIM LOGIC ---
  const claimReward = async (mission: any) => {
    if (!user?.uid) return;
    try {
      await updateMission(mission.id, {
        status: "claimed",
      });

      await incrementStats(user.uid, {
        xp: Number(mission.xpReward),
        total_missions_completed: 1,
      });

      await gainXP(0); // Trigger level check
      Alert.alert(
        "COMMAND CENTER",
        `Mission Complete. +${mission.xpReward} XP secured.`,
      );
    } catch (err) {
      Alert.alert("ERROR", "Sync failed.");
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Quest Log"
        subtitle={`@${profile?.username || "strider"}`}
        onBack={() => router.back()}
      />

      <View style={styles.categoryContainer}>
        {["solo", "team"].map((cat: any) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.categoryTab,
              activeCategory === cat && styles.activeCategoryTab,
            ]}
          >
            <Text
              style={[
                styles.categoryTabText,
                activeCategory === cat && styles.activeCategoryText,
              ]}
            >
              {cat.toUpperCase()} OPS
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.freqContainer}>
        {["daily", "weekly", "monthly"].map((freq: any) => (
          <TouchableOpacity
            key={freq}
            onPress={() => setActiveFreq(freq)}
            style={[
              styles.freqChip,
              activeFreq === freq && styles.activeFreqChip,
            ]}
          >
            <Text
              style={[
                styles.freqChipText,
                activeFreq === freq && styles.activeFreqText,
              ]}
            >
              {freq.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading || isGenerating ? (
          <ActivityIndicator color={KARELA.color.brand} style={{ marginTop: 50 }} />
        ) : missions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="radio-outline" size={40} color="#2A2A2A" />
            <Text style={styles.emptyText}>No missions detected</Text>
            <Text style={styles.emptySub}>
              Ani is calibrating your next quest.
            </Text>
          </View>
        ) : (
          missions.map((item) => {
            const progress = (item.currentValue || 0) / item.targetValue;
            const isComplete = progress >= 1;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missionTitle}>{item.title}</Text>
                    <Text style={styles.missionDesc}>{item.description}</Text>
                  </View>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{item.xpReward} XP</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.track}>
                    <LinearGradient
                      colors={KARELA.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.fill,
                        { width: `${Math.min(progress * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {(item.currentValue || 0).toFixed(1)} / {item.targetValue} KM
                  </Text>
                </View>

                {isComplete ? (
                  <TouchableOpacity onPress={() => claimReward(item)}>
                    <LinearGradient
                      colors={KARELA.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.claimBtn}
                    >
                      <Text style={styles.btnText}>CLAIM REWARD</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.lockedBtn}>
                    <Text style={styles.lockedText}>MISSION ACTIVE</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  categoryContainer: {
    flexDirection: "row",
    marginHorizontal: KARELA.space.xl,
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.md,
    padding: 5,
    marginBottom: KARELA.space.xl,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: KARELA.radius.sm,
  },
  activeCategoryTab: {
    backgroundColor: KARELA.color.surfaceSoft,
    borderWidth: 1,
    borderColor: "#333",
  },
  categoryTabText: { color: "#555", fontFamily: KARELA.font.bold, fontSize: 12 },
  activeCategoryText: { color: KARELA.color.brand },
  freqContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: KARELA.space.xl,
    marginHorizontal: KARELA.space.xl,
    marginBottom: KARELA.space.xl,
  },
  freqChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  activeFreqChip: { borderBottomWidth: 2, borderBottomColor: KARELA.color.brand },
  freqChipText: { color: "#555", fontSize: 11, fontFamily: KARELA.font.bold, letterSpacing: 1 },
  activeFreqText: { color: "#FFF" },
  list: { paddingHorizontal: KARELA.space.xl, paddingBottom: 140 },
  card: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    padding: KARELA.space.xl,
    marginBottom: KARELA.space.lg,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  cardHeader: { flexDirection: "row", marginBottom: KARELA.space.lg, gap: KARELA.space.md },
  missionTitle: { color: "#FFF", fontSize: 17, fontFamily: KARELA.font.bold },
  missionDesc: {
    color: KARELA.color.textMuted,
    fontSize: 13,
    marginTop: 4,
    fontFamily: KARELA.font.regular,
    lineHeight: 18,
  },
  xpBadge: {
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  xpText: { color: KARELA.color.brand, fontFamily: KARELA.font.bold, fontSize: 11 },
  progressContainer: { marginBottom: KARELA.space.xl },
  track: {
    height: 8,
    backgroundColor: KARELA.color.surfaceSoft,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  fill: { height: "100%", borderRadius: 4 },
  progressLabel: { color: "#555", fontSize: 10, fontFamily: KARELA.font.medium },
  claimBtn: { paddingVertical: 14, borderRadius: KARELA.radius.sm, alignItems: "center" },
  btnText: { color: "#04210A", fontFamily: KARELA.font.bold, letterSpacing: 0.5 },
  lockedBtn: {
    paddingVertical: 14,
    borderRadius: KARELA.radius.sm,
    alignItems: "center",
    backgroundColor: KARELA.color.surfaceSoft,
  },
  lockedText: { color: "#444", fontFamily: KARELA.font.bold, fontSize: 12 },
  emptyWrap: { alignItems: "center", marginTop: 100, gap: KARELA.space.md },
  emptyText: {
    color: "#555",
    textAlign: "center",
    fontFamily: KARELA.font.bold,
    fontSize: 15,
  },
  emptySub: { color: "#444", fontSize: 12, fontFamily: KARELA.font.regular },
});
