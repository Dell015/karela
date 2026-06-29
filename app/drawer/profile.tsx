import { useAuth } from "@/context/AuthContext";
import { updateUserProfileData } from "@/services/database/supabase/userData";
import { getStreakTier } from "@/services/streakMultiplier";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function ProfilePage() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  // Edit states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [aiNotes, setAiNotes] = useState(profile?.stats?.ai_notes || "");
  const [age, setAge] = useState(profile?.stats?.age?.toString() || "20");
  const [weight, setWeight] = useState(profile?.stats?.weight?.toString() || "70");
  const [height, setHeight] = useState(profile?.stats?.height?.toString() || "170");
  const [targetWeight, setTargetWeight] = useState(profile?.stats?.target_weight?.toString() || "70");

  // Stats tab
  const [activeTrack, setActiveTrack] = useState<"physical" | "civic">("physical");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setUsername(profile.username || "");
      setAiNotes(profile.stats?.ai_notes || "");
      setAge(profile.stats?.age?.toString() || "20");
      setWeight(profile.stats?.weight?.toString() || "70");
      setHeight(profile.stats?.height?.toString() || "170");
      setTargetWeight(profile.stats?.target_weight?.toString() || "70");
    }
  }, [profile]);

  const stats = profile?.stats;
  const streak = stats?.streak || 0;
  const tier = getStreakTier(streak);
  const xpProgress = ((stats?.xp || 0) / 1000) * 100;
  const level = stats?.level || 1;
  const gems = stats?.gems || 0;
  const isVanguard = level >= 15;

  const handleSaveProfile = async () => {
    if (!profile?.uid) return;
    try {
      await updateUserProfileData(profile.uid, {
        displayName,
        username,
        "stats.ai_notes": aiNotes,
        "stats.age": Number(age),
        "stats.weight": Number(weight),
        "stats.height": Number(height),
        "stats.target_weight": Number(targetWeight),
      });
      setShowEditProfile(false);
      Alert.alert("Updated", "Profile saved. Ani is recalibrating your metrics.");
    } catch {
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* IDENTITY BANNER */}
      <LinearGradient colors={["#0d1a06", "#0d0d0d"]} style={s.banner}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={s.identityRow}>
          <View style={s.avatarRing}>
            <LinearGradient colors={["#7CF205", "#209F77"]} style={s.avatarGradient}>
              <View style={s.avatarInner}>
                <MaterialCommunityIcons name="account" size={40} color="#7CF205" />
              </View>
            </LinearGradient>
          </View>

          <View style={s.identityText}>
            <Text style={s.displayName}>{profile?.displayName || "Strider"}</Text>
            <View style={s.roleRow}>
              <View style={[s.roleBadge, { backgroundColor: isVanguard ? "rgba(255,179,71,0.15)" : "rgba(124,242,5,0.15)" }]}>
                <Ionicons name={isVanguard ? "shield-checkmark" : "scan"} size={12} color={isVanguard ? "#FFB347" : "#7CF205"} />
                <Text style={[s.roleText, { color: isVanguard ? "#FFB347" : "#7CF205" }]}>
                  {isVanguard ? "VANGUARD" : "SCOUT"}
                </Text>
              </View>
              {streak >= 14 && (
                <View style={s.titleBadge}>
                  <Text style={s.titleText}>Consistent Walker</Text>
                </View>
              )}
            </View>
            <Text style={s.usernameText}>@{profile?.username || "strider"}</Text>
          </View>
        </View>

        <View style={s.bannerActions}>
          <TouchableOpacity style={s.bannerBtn} onPress={() => setShowEditProfile(true)}>
            <Ionicons name="create-outline" size={16} color="#7CF205" />
            <Text style={s.bannerBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* PROGRESSION CORE */}
      <View style={s.section}>
        <View style={s.levelRow}>
          <Text style={s.levelLabel}>LVL {level}</Text>
          <Text style={s.xpLabel}>{stats?.xp || 0} / 1,000 XP</Text>
        </View>
        <View style={s.xpBar}>
          <LinearGradient colors={["#7CF205", "#209F77"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.xpFill, { width: `${Math.min(xpProgress, 100)}%` }]} />
        </View>

        {/* STREAK + GEMS + DISTANCE */}
        <View style={s.metricsRow}>
          <View style={s.metricCard}>
            <Ionicons name="flame" size={18} color="#FFD700" />
            <Text style={s.metricValue}>{streak}d</Text>
            <Text style={s.metricSub}>×{tier.multiplier} {tier.label}</Text>
            {tier.nextTierAt && (
              <Text style={s.metricHint}>{tier.nextTierAt - streak}d to next</Text>
            )}
          </View>
          <View style={s.metricCard}>
            <Ionicons name="diamond" size={18} color="#7CF205" />
            <Text style={s.metricValue}>{gems}</Text>
            <Text style={s.metricSub}>Gems</Text>
          </View>
          <View style={s.metricCard}>
            <Ionicons name="footsteps" size={18} color="#FF6B35" />
            <Text style={s.metricValue}>{(stats?.total_distance_km || 0).toFixed(1)}</Text>
            <Text style={s.metricSub}>Total km</Text>
          </View>
        </View>
      </View>

      {/* DUAL TRACK STATS */}
      <View style={s.section}>
        <View style={s.trackTabs}>
          <TouchableOpacity style={[s.trackTab, activeTrack === "physical" && s.trackTabActive]} onPress={() => setActiveTrack("physical")}>
            <Ionicons name="fitness" size={14} color={activeTrack === "physical" ? "#7CF205" : "#555"} />
            <Text style={[s.trackTabText, activeTrack === "physical" && s.trackTabTextActive]}>Physical</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.trackTab, activeTrack === "civic" && s.trackTabActive]} onPress={() => setActiveTrack("civic")}>
            <Ionicons name="people" size={14} color={activeTrack === "civic" ? "#FF6B35" : "#555"} />
            <Text style={[s.trackTabText, activeTrack === "civic" && s.trackTabTextActive]}>Civic</Text>
          </TouchableOpacity>
        </View>

        {activeTrack === "physical" ? (
          <View style={s.statsGrid}>
            <StatTile icon="location" color="#7CF205" value={`${(stats?.total_distance_km || 0).toFixed(1)} km`} label="Total Distance" />
            <StatTile icon="trophy" color="#FFD700" value={`${stats?.ghostWins || 0}`} label="Ghost Wins" />
            <StatTile icon="flame" color="#FF5A00" value={`${stats?.total_calories_burned || 0}`} label="Calories Burned" />
            <StatTile icon="speedometer" color="#BF5AF2" value={stats?.avg_pace_mins_km ? `${stats.avg_pace_mins_km.toFixed(1)}` : "--"} label="Avg Pace (min/km)" />
          </View>
        ) : (
          <View style={s.statsGrid}>
            <StatTile icon="megaphone" color="#FF6B35" value={`${stats?.total_missions_completed || 0}`} label="Reports Filed" />
            <StatTile icon="checkmark-circle" color="#7CF205" value={isVanguard ? "87%" : "N/A"} label="Accuracy Score" />
            <StatTile icon="star" color="#FFD700" value="0" label="Civic XP" />
            <StatTile icon="analytics" color="#209F77" value="0" label="C-Score" />
          </View>
        )}
      </View>

      {/* ANI COACH SNAPSHOT */}
      <View style={s.section}>
        <View style={s.aniHeader}>
          <View style={s.aniAvatar}>
            <MaterialCommunityIcons name="robot-happy" size={22} color="#7CF205" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.aniName}>Ani</Text>
            <Text style={s.aniSub}>Your AI Coach</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/drawer/ai_coach")}>
            <Text style={s.aniChatLink}>Chat →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.aniMessage}>
          <Text style={s.aniText}>
            {stats?.ai_notes
              ? `Coach's briefing: "${stats.ai_notes}". I'll factor that into your plan.`
              : `At ${stats?.weight || 70}kg and your current level, you're building a solid foundation. Keep showing up daily — consistency beats intensity.`}
          </Text>
        </View>
      </View>

      {/* SQUAD HUB */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Squad</Text>
        {/* EMPTY STATE — no squad yet */}
        <View style={s.emptyCard}>
          <Ionicons name="people-outline" size={32} color="#333" />
          <Text style={s.emptyTitle}>No Squad Yet</Text>
          <Text style={s.emptyDesc}>
            Join or create a squad of 3-12 friends for accountability, streak protection, and shared rewards.
          </Text>
          <TouchableOpacity style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>Find a Squad</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GUILD AFFILIATION */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Guild</Text>
        {/* EMPTY STATE — no guild yet */}
        <View style={s.emptyCard}>
          <Ionicons name="shield-outline" size={32} color="#333" />
          <Text style={s.emptyTitle}>No Guild Yet</Text>
          <Text style={s.emptyDesc}>
            Guilds compete for city landmark ownership. 50+ members required. Claim territory by running through it.
          </Text>
          <TouchableOpacity style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>Browse Guilds</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* UTILITY & SECURITY */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Settings & Privacy</Text>
        <View style={s.utilityGrid}>
          <TouchableOpacity style={s.utilityItem}>
            <Ionicons name="location-outline" size={18} color="#7CF205" />
            <View style={{ flex: 1 }}>
              <Text style={s.utilityLabel}>Privacy Zones</Text>
              <Text style={s.utilityDesc}>0 zones active • GPS masked near home/office</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#333" />
          </TouchableOpacity>

          {isVanguard && (
            <TouchableOpacity style={s.utilityItem}>
              <Ionicons name="checkmark-done" size={18} color="#FFB347" />
              <View style={{ flex: 1 }}>
                <Text style={s.utilityLabel}>Vanguard Review Score</Text>
                <Text style={s.utilityDesc}>Active • Good standing</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#333" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.utilityItem}>
            <Ionicons name="notifications-outline" size={18} color="#888" />
            <View style={{ flex: 1 }}>
              <Text style={s.utilityLabel}>Notifications</Text>
              <Text style={s.utilityDesc}>Quiet hours: 10 PM – 7 AM</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={s.utilityItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#FF453A" />
            <View style={{ flex: 1 }}>
              <Text style={[s.utilityLabel, { color: "#FF453A" }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// --- REUSABLE STAT TILE ---
const StatTile = ({ icon, color, value, label }: { icon: string; color: string; value: string; label: string }) => (
  <View style={s.statTile}>
    <Ionicons name={icon as any} size={18} color={color} />
    <Text style={s.statTileValue}>{value}</Text>
    <Text style={s.statTileLabel}>{label}</Text>
  </View>
);

// --- EDIT PROFILE MODAL (reuse from before, simplified) ---
// Keeping as a placeholder — the handleSaveProfile function is wired up above
// In a real build, you'd add the Modal here. For now the Edit button triggers it.

// --- STYLES ---
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

  // Banner
  banner: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { position: "absolute", top: 58, left: 16, zIndex: 10 },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 },
  avatarRing: { width: 72, height: 72, borderRadius: 36 },
  avatarGradient: { width: 72, height: 72, borderRadius: 36, padding: 3 },
  avatarInner: { flex: 1, borderRadius: 33, backgroundColor: "#0d0d0d", justifyContent: "center", alignItems: "center" },
  identityText: { flex: 1 },
  displayName: { color: "#fff", fontSize: 22, fontWeight: "900" },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  titleBadge: { backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  titleText: { color: "#888", fontSize: 10, fontWeight: "600" },
  usernameText: { color: "#555", fontSize: 13, marginTop: 4 },
  bannerActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  bannerBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(124,242,5,0.08)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "rgba(124,242,5,0.2)" },
  bannerBtnText: { color: "#7CF205", fontSize: 12, fontWeight: "700" },

  // Progression
  section: { paddingHorizontal: 20, marginTop: 24 },
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  levelLabel: { color: "#7CF205", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  xpLabel: { color: "#555", fontSize: 12, fontWeight: "600" },
  xpBar: { height: 6, backgroundColor: "#1A1A1A", borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  metricsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  metricCard: { flex: 1, backgroundColor: "#111", borderRadius: 16, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#1A1A1A" },
  metricValue: { color: "#fff", fontSize: 20, fontWeight: "900" },
  metricSub: { color: "#666", fontSize: 10, fontWeight: "600", textAlign: "center" },
  metricHint: { color: "#444", fontSize: 9, marginTop: 2 },

  // Dual Track
  trackTabs: { flexDirection: "row", backgroundColor: "#111", borderRadius: 14, padding: 4, marginBottom: 16 },
  trackTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  trackTabActive: { backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#222" },
  trackTabText: { color: "#555", fontSize: 12, fontWeight: "800" },
  trackTabTextActive: { color: "#fff" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: { width: (width - 40 - 10) / 2, backgroundColor: "#111", borderRadius: 14, padding: 16, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#1A1A1A" },
  statTileValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statTileLabel: { color: "#555", fontSize: 10, fontWeight: "600", textAlign: "center" },

  // Ani
  aniHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  aniAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(124,242,5,0.1)", justifyContent: "center", alignItems: "center" },
  aniName: { color: "#7CF205", fontSize: 14, fontWeight: "800" },
  aniSub: { color: "#555", fontSize: 11 },
  aniChatLink: { color: "#7CF205", fontSize: 12, fontWeight: "700" },
  aniMessage: { backgroundColor: "#111", borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: "#7CF205" },
  aniText: { color: "#ccc", fontSize: 13, lineHeight: 20 },

  // Social empty states
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "900", marginBottom: 12 },
  emptyCard: { backgroundColor: "#111", borderRadius: 20, padding: 28, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#1A1A1A" },
  emptyTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  emptyDesc: { color: "#555", fontSize: 12, textAlign: "center", lineHeight: 18, maxWidth: 260 },
  emptyBtn: { backgroundColor: "rgba(124,242,5,0.1)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 6, borderWidth: 1, borderColor: "rgba(124,242,5,0.2)" },
  emptyBtnText: { color: "#7CF205", fontSize: 12, fontWeight: "700" },

  // Utility
  utilityGrid: { gap: 2 },
  utilityItem: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#111", paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, marginBottom: 8 },
  utilityLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },
  utilityDesc: { color: "#555", fontSize: 11, marginTop: 2 },
});
