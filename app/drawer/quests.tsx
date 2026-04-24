import { useAuth } from "@/context/AuthContext";
import { generateAniQuest } from "@/services/database/firebase/aiService";
import { db } from "@/services/database/firebase/config";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
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
    const today = now.toISOString().split("T")[0]; // "2026-04-25"

    // Logic for Week Number (e.g., "2026-W17")
    const getWeekId = (d: Date) => {
      const tempDate = new Date(d.getTime());
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      const weekNo = Math.ceil(
        ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      return `${tempDate.getFullYear()}-W${weekNo}`;
    };

    const currentWeek = getWeekId(now);
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    const { last_daily_reset, last_weekly_reset, last_monthly_reset } =
      profile.stats;

    try {
      // 1. DAILY RESET
      if (last_daily_reset !== today) {
        setIsGenerating(true);
        console.log("Ani: Analyzing stats for new Daily Mission...");
        const newQuest = await generateAniQuest(profile);

        if (newQuest) {
          const missionsRef = collection(db, "users", profile.uid, "missions");
          await addDoc(missionsRef, {
            title: newQuest.title,
            description: newQuest.description,
            targetValue: newQuest.goalDistance / 1000,
            currentValue: 0,
            xpReward: newQuest.rewardXP,
            status: "active",
            category: "solo",
            frequency: "daily",
            type: "distance",
            createdAt: today,
          });

          await updateDoc(doc(db, "users", profile.uid), {
            "stats.last_daily_reset": today,
          });
        }
      }

      // 2. WEEKLY RESET
      if (last_weekly_reset !== currentWeek) {
        console.log("Ani: Drafting Weekly Objective...");
        // Weekly logic can go here (similar to above but frequency: "weekly")
        await updateDoc(doc(db, "users", profile.uid), {
          "stats.last_weekly_reset": currentWeek,
        });
      }
    } catch (err) {
      console.error("Quest Engine Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (profile) checkAndGenerateQuests();
  }, [profile?.stats?.last_daily_reset]);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const missionsRef = collection(db, "users", user.uid, "missions");
    const q = query(
      missionsRef,
      where("status", "==", "active"),
      where("category", "==", activeCategory),
      where("frequency", "==", activeFreq),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const missionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMissions(missionData);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid, activeCategory, activeFreq]);

  // --- ACTIONS ---
  const claimReward = async (mission: any) => {
    if (!user?.uid) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const missionRef = doc(db, "users", user.uid, "missions", mission.id);

      // 1. Close Mission
      await updateDoc(missionRef, {
        status: "claimed",
        claimedAt: new Date().toISOString(),
      });

      // 2. Add Rewards
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.data();
      const currentXP = Number(userData?.stats?.xp || 0);
      const currentMissions = Number(
        userData?.stats?.total_missions_completed || 0,
      );

      await updateDoc(userDocRef, {
        "stats.xp": currentXP + Number(mission.xpReward),
        "stats.total_missions_completed": currentMissions + 1,
      });

      // 3. Trigger Level Check
      await gainXP(0);
      Alert.alert(
        "COMMAND CENTER",
        `Mission Complete. +${mission.xpReward} XP secured.`,
      );
    } catch (err) {
      Alert.alert("ERROR", "Failed to sync reward with headquarters.");
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Quest Log</Text>
          <Text style={styles.subtitle}>@{profile?.username || "strider"}</Text>
        </View>
        <TouchableOpacity style={styles.squadBtn}>
          <FontAwesome5 name="users" size={18} color="#7CF205" />
        </TouchableOpacity>
      </View>

      {/* CATEGORY TOGGLE */}
      <View style={styles.categoryContainer}>
        {(["solo", "team"] as const).map((cat) => (
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
              {cat === "solo" ? "SOLO OPS" : "TEAM OPS"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FREQUENCY CHIPS */}
      <View style={styles.freqContainer}>
        {["daily", "weekly", "monthly", "limited"].map((freq: any) => (
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

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {loading || isGenerating ? (
          <View style={{ marginTop: 100, alignItems: "center" }}>
            <ActivityIndicator color="#7CF205" />
            {isGenerating && (
              <Text style={styles.generatingText}>
                Ani is calculating new missions...
              </Text>
            )}
          </View>
        ) : missions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="radar" size={60} color="#222" />
            <Text style={styles.emptyText}>
              NO {activeFreq.toUpperCase()} MISSIONS DETECTED
            </Text>
            <Text style={styles.emptySub}>Check back later for new intel.</Text>
          </View>
        ) : (
          missions.map((item) => (
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
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min((item.currentValue / item.targetValue) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {item.currentValue.toFixed(1)} / {item.targetValue}{" "}
                  {item.type === "distance" ? "KM" : "Units"}
                </Text>
              </View>

              {item.currentValue >= item.targetValue ? (
                <TouchableOpacity onPress={() => claimReward(item)}>
                  <LinearGradient
                    colors={["#7CF205", "#209F77"]}
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
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    marginBottom: 25,
  },
  backBtn: { width: 40 },
  headerText: { flex: 1 },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#7CF205",
    fontSize: 12,
    fontWeight: "bold",
    opacity: 0.8,
  },
  squadBtn: {
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  categoryContainer: {
    flexDirection: "row",
    marginHorizontal: 25,
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeCategoryTab: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333",
  },
  categoryTabText: { color: "#444", fontWeight: "900", fontSize: 12 },
  activeCategoryText: { color: "#7CF205" },
  freqContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 25,
    marginBottom: 25,
  },
  freqChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeFreqChip: { borderBottomColor: "#7CF205" },
  freqChipText: { color: "#444", fontSize: 10, fontWeight: "900" },
  activeFreqText: { color: "#FFF" },
  list: { paddingHorizontal: 25, paddingBottom: 40 },
  card: {
    backgroundColor: "#111",
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  missionTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  missionDesc: { color: "#888", fontSize: 13, marginTop: 4 },
  xpBadge: {
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  xpText: { color: "#7CF205", fontWeight: "bold", fontSize: 11 },
  progressContainer: { marginBottom: 20 },
  track: {
    height: 8,
    backgroundColor: "#222",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  fill: { height: "100%", backgroundColor: "#7CF205" },
  progressLabel: { color: "#555", fontSize: 10, fontWeight: "bold" },
  claimBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#000", fontWeight: "900", letterSpacing: 1 },
  lockedBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  lockedText: { color: "#333", fontWeight: "bold", fontSize: 12 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#333", fontWeight: "900", fontSize: 14, marginTop: 15 },
  emptySub: { color: "#222", fontSize: 12, marginTop: 5 },
  generatingText: {
    color: "#7CF205",
    marginTop: 15,
    fontSize: 12,
    fontWeight: "bold",
  },
});
