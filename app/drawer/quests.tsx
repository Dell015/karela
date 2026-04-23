import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/database/firebase/config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import {
  collection,
  doc,
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
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<"Standard" | "Limited">(
    "Standard",
  );
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Missions Logic
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const missionsRef = collection(db, "users", user.uid, "missions");
    const q = query(missionsRef, where("type", "==", activeTab.toLowerCase()));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const missionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Only show missions that aren't claimed yet
        setMissions(missionData.filter((m: any) => m.status !== "claimed"));
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [activeTab, user?.uid]);

  // 2. Claim Reward Logic
  const claimReward = async (mission: any) => {
    if (!user?.uid) return;

    try {
      const missionRef = doc(db, "users", user.uid, "missions", mission.id);

      // Update mission status
      await updateDoc(missionRef, { status: "claimed" });

      // Use the gainXP function from your AuthContext
      await gainXP(mission.xpReward);

      Alert.alert(
        "Quest Complete!",
        `Successfully claimed ${mission.xpReward} XP.`,
      );
    } catch (err) {
      console.error("Claim error:", err);
      Alert.alert("Error", "Could not process reward.");
    }
  };

  return (
    <View style={styles.container}>
      {/* --- UNIFIED NAV BAR --- */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => router.push("/drawer/dashboard")}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>

        <Text style={styles.usernameText}>
          @{profile?.username || "strider"}
        </Text>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={32} color="#7CF205" />
        </TouchableOpacity>
      </View>

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.title}>Quest Log</Text>
        <Text style={styles.subtitle}>
          Audit your efforts, claim your rewards.
        </Text>
      </View>

      {/* --- TAB TOGGLE --- */}
      <View style={styles.tabBar}>
        {["Standard", "Limited"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as "Standard" | "Limited")}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- QUEST LIST --- */}
      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator color="#7CF205" style={{ marginTop: 50 }} />
        ) : missions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="ghost" size={80} color="#2C2C2E" />
            <Text style={styles.emptyText}>No quests available.</Text>
            <Text style={styles.emptySub}>
              Come back another time, Stryder.
            </Text>
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

              {/* Progress Section */}
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
                  {item.currentValue} / {item.targetValue}
                </Text>
              </View>

              {/* Action Button */}
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
                  <Text style={styles.lockedText}>IN PROGRESS</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },
  navBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    padding: 5,
  },
  usernameText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 5,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 25,
    backgroundColor: "#1C1C1E",
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#2C2C2E",
  },
  tabText: {
    color: "#8E8E93",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#7CF205",
  },
  list: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  missionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  missionDesc: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 4,
  },
  xpBadge: {
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  xpText: {
    color: "#7CF205",
    fontWeight: "bold",
    fontSize: 12,
  },
  progressContainer: {
    marginBottom: 20,
  },
  track: {
    height: 10,
    backgroundColor: "#2C2C2E",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  fill: {
    height: "100%",
    backgroundColor: "#7CF205",
  },
  progressLabel: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "600",
  },
  claimBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  lockedBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#2C2C2E",
  },
  lockedText: {
    color: "#555",
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySub: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 8,
  },
});
