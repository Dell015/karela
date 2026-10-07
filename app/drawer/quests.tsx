import { useAuth } from "@/context/AuthContext";
import { Button, Chip, ScreenHeader } from "@/components/ui";
import { Screen } from "@/components/ui/Screen";
import { QuestEngine } from "@/services/engines/QuestEngine";
import {
    subscribeToMissions,
} from "@/services/database/supabase/missions";
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
    View,
} from "react-native";

export default function QuestsScreen() {
  const { user, profile, syncProgression } = useAuth();
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

    try {
      setIsGenerating(true);

      const result = await QuestEngine.generateQuests({
        userId: profile.uid,
        stats: profile.stats,
        decayModel: null, // TODO: Load from GhostModelManager when available
        runHistory: [],   // TODO: Load recent run history
      });

      if (result.errors.length > 0) {
        console.warn("Quest generation errors:", result.errors);
      }
      if (result.generated.length > 0) {
        console.log("Generated:", result.generated);
      }
    } catch (err: any) {
      console.error("Quest Engine Error:", err);
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
          type: r.type,
          frequency: r.frequency,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  // --- CLAIM LOGIC ---
  const claimReward = async (mission: any) => {
    if (!user?.uid) return;
    try {
      const { xpAwarded, gemsAwarded } = await QuestEngine.claimQuest(
        user.uid,
        mission.id,
        {
          xpReward: Number(mission.xpReward),
          type: mission.type,
          frequency: mission.frequency,
        },
        Number(profile?.stats?.streak || 0)
      );

      await syncProgression(); // Reconcile level from server state (no re-award)

      // claimQuest returns 0/0 when objectives are not actually met.
      if (xpAwarded === 0 && gemsAwarded === 0) {
        Alert.alert("Not done yet", "Finish the quest goal first, then claim your reward.");
        return;
      }

      let message = `Quest complete. +${xpAwarded} XP.`;
      if (gemsAwarded > 0) message += ` +${gemsAwarded} Gems.`;
      Alert.alert("Reward claimed", message);
    } catch {
      Alert.alert("Couldn't claim", "Your reward wasn't saved. Check your connection and try again.");
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
        {(["solo", "team"] as const).map((cat) => (
          <Chip
            key={cat}
            label={cat === "solo" ? "Solo" : "Team"}
            selected={activeCategory === cat}
            onPress={() => setActiveCategory(cat)}
            style={styles.categoryTab}
          />
        ))}
      </View>

      <View style={styles.freqContainer}>
        {(["daily", "weekly", "monthly"] as const).map((freq) => (
          <Chip
            key={freq}
            label={freq.charAt(0).toUpperCase() + freq.slice(1)}
            selected={activeFreq === freq}
            onPress={() => setActiveFreq(freq)}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading || isGenerating ? (
          <ActivityIndicator color={KARELA.color.brand} style={{ marginTop: 50 }} />
        ) : missions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="radio-outline" size={40} color={KARELA.color.textFaint} />
            <Text style={styles.emptyText}>No quests yet</Text>
            <Text style={styles.emptySub}>
              Ani is picking your next quest.
            </Text>
          </View>
        ) : (
          missions.map((item) => {
            const target = Number(item.targetValue) || 0;
            const progress = target > 0 ? (item.currentValue || 0) / target : 0;
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
                    {(item.currentValue || 0).toFixed(1)} / {item.targetValue} km
                  </Text>
                </View>

                {isComplete ? (
                  <Button label="Claim reward" icon="gift-outline" block onPress={() => claimReward(item)} />
                ) : (
                  <View style={styles.lockedBtn}>
                    <Text style={styles.lockedText}>In progress</Text>
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
  categoryTab: { flex: 1, justifyContent: "center", borderWidth: 0 },
  freqContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: KARELA.space.sm,
    marginHorizontal: KARELA.space.xl,
    marginBottom: KARELA.space.xl,
  },
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
  missionTitle: { color: KARELA.color.textPrimary, fontSize: 17, fontFamily: KARELA.font.bold },
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
  progressLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium },
  // A status, not a button: no pill, so it is never mistaken for one.
  lockedBtn: {
    paddingVertical: 14,
    borderRadius: KARELA.radius.md,
    alignItems: "center",
    backgroundColor: KARELA.color.surfaceSoft,
  },
  lockedText: { color: KARELA.color.textMuted, fontFamily: KARELA.font.bold, fontSize: 13 },
  emptyWrap: { alignItems: "center", marginTop: 100, gap: KARELA.space.md },
  emptyText: {
    color: KARELA.color.textSecondary,
    textAlign: "center",
    fontFamily: KARELA.font.bold,
    fontSize: 15,
  },
  emptySub: { color: KARELA.color.textMuted, fontSize: 12, fontFamily: KARELA.font.regular },
});
