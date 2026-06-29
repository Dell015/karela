import { useAuth } from "@/context/AuthContext";
import { KARELA } from "@/styles/designSystem";
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
      <LinearGradient colors={["#0d1a06", KARELA.color.bg]} style={s.banner}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={KARELA.color.textPrimary} />
        </TouchableOpacity>

        <View style={s.identityRow}>
          <View style={s.avatarRing}>
            <LinearGradient colors={KARELA.gradients.brand as unknown as string[]} style={s.avatarGradient}>
              <View style={s.avatarInner}>
                <MaterialCommunityIcons name="account" size={40} color={KARELA.color.brand} />
              </View>
            </LinearGradient>
          </View>

          <View style={s.identityText}>
            <Text style={s.displayName}>{profile?.displayName || "Strider"}</Text>
            <View style={s.roleRow}>
              <View style={[s.roleBadge, { backgroundColor: isVanguard ? "rgba(255,179,71,0.15)" : "rgba(124,242,5,0.15)" }]}>
                <Ionicons name={isVanguard ? "shield-checkmark" : "scan"} size={12} color={isVanguard ? KARELA.vibrant.techOrange : KARELA.color.brand} />
                <Text style={[s.roleText, { color: isVanguard ? KARELA.vibrant.techOrange : KARELA.color.brand }]}>
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
            <Ionicons name="create-outline" size={16} color={KARELA.color.brand} />
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
          <LinearGradient colors={KARELA.gradients.brand as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.xpFill, { width: `${Math.min(xpProgress, 100)}%` }]} />
        </View>

        {/* STREAK + GEMS + DISTANCE */}
        <View style={s.metricsRow}>
          <View style={s.metricCard}>
            <Ionicons name="flame" size={18} color={KARELA.color.gold} />
            <Text style={s.metricValue}>{streak}d</Text>
            <Text style={s.metricSub}>×{tier.multiplier} {tier.label}</Text>
            {tier.nextTierAt && (
              <Text style={s.metricHint}>{tier.nextTierAt - streak}d to next</Text>
            )}
          </View>
          <View style={s.metricCard}>
            <Ionicons name="diamond" size={18} color={KARELA.color.brand} />
            <Text style={s.metricValue}>{gems}</Text>
            <Text style={s.metricSub}>Gems</Text>
          </View>
          <View style={s.metricCard}>
            <Ionicons name="footsteps" size={18} color={KARELA.color.civic} />
            <Text style={s.metricValue}>{(stats?.total_distance_km || 0).toFixed(1)}</Text>
            <Text style={s.metricSub}>Total km</Text>
          </View>
        </View>
      </View>

      {/* DUAL TRACK STATS */}
      <View style={s.section}>
        <View style={s.trackTabs}>
          <TouchableOpacity style={[s.trackTab, activeTrack === "physical" && s.trackTabActive]} onPress={() => setActiveTrack("physical")}>
            <Ionicons name="fitness" size={14} color={activeTrack === "physical" ? KARELA.color.brand : KARELA.color.textFaint} />
            <Text style={[s.trackTabText, activeTrack === "physical" && s.trackTabTextActive]}>Physical</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.trackTab, activeTrack === "civic" && s.trackTabActive]} onPress={() => setActiveTrack("civic")}>
            <Ionicons name="people" size={14} color={activeTrack === "civic" ? KARELA.color.civic : KARELA.color.textFaint} />
            <Text style={[s.trackTabText, activeTrack === "civic" && s.trackTabTextActive]}>Civic</Text>
          </TouchableOpacity>
        </View>

        {activeTrack === "physical" ? (
          <View style={s.statsGrid}>
            <StatTile icon="location" color={KARELA.color.brand} value={`${(stats?.total_distance_km || 0).toFixed(1)} km`} label="Total Distance" />
            <StatTile icon="trophy" color={KARELA.color.gold} value={`${stats?.ghostWins || 0}`} label="Ghost Wins" />
            <StatTile icon="flame" color={KARELA.vibrant.techOrange} value={`${stats?.total_calories_burned || 0}`} label="Calories Burned" />
            <StatTile icon="speedometer" color="#BF5AF2" value={stats?.avg_pace_mins_km ? `${stats.avg_pace_mins_km.toFixed(1)}` : "--"} label="Avg Pace (min/km)" />
          </View>
        ) : (
          <View style={s.statsGrid}>
            <StatTile icon="megaphone" color={KARELA.color.civic} value={`${stats?.total_missions_completed || 0}`} label="Reports Filed" />
            <StatTile icon="checkmark-circle" color={KARELA.color.brand} value={isVanguard ? "87%" : "N/A"} label="Accuracy Score" />
            <StatTile icon="star" color={KARELA.color.gold} value="0" label="Civic XP" />
            <StatTile icon="analytics" color={KARELA.color.brandDeep} value="0" label="C-Score" />
          </View>
        )}
      </View>

      {/* ANI COACH SNAPSHOT */}
      <View style={s.section}>
        <View style={s.aniHeader}>
          <View style={s.aniAvatar}>
            <MaterialCommunityIcons name="robot-happy" size={22} color={KARELA.color.brand} />
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
        <View style={s.emptyCard}>
          <Ionicons name="people-outline" size={32} color={KARELA.color.surfaceSoft} />
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
        <View style={s.emptyCard}>
          <Ionicons name="shield-outline" size={32} color={KARELA.color.surfaceSoft} />
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
            <Ionicons name="location-outline" size={18} color={KARELA.color.brand} />
            <View style={{ flex: 1 }}>
              <Text style={s.utilityLabel}>Privacy Zones</Text>
              <Text style={s.utilityDesc}>0 zones active • GPS masked near home/office</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={KARELA.color.surfaceSoft} />
          </TouchableOpacity>

          {isVanguard && (
            <TouchableOpacity style={s.utilityItem}>
              <Ionicons name="checkmark-done" size={18} color={KARELA.vibrant.techOrange} />
              <View style={{ flex: 1 }}>
                <Text style={s.utilityLabel}>Vanguard Review Score</Text>
                <Text style={s.utilityDesc}>Active • Good standing</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={KARELA.color.surfaceSoft} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.utilityItem}>
            <Ionicons name="notifications-outline" size={18} color={KARELA.color.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={s.utilityLabel}>Notifications</Text>
              <Text style={s.utilityDesc}>Quiet hours: 10 PM – 7 AM</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={KARELA.color.surfaceSoft} />
          </TouchableOpacity>

          <TouchableOpacity style={s.utilityItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={KARELA.color.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[s.utilityLabel, { color: KARELA.color.danger }]}>Log Out</Text>
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

// --- STYLES ---
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: KARELA.color.bg },

  // Banner
  banner: { paddingTop: 60, paddingHorizontal: KARELA.space.xl, paddingBottom: 24 },
  backBtn: { position: "absolute", top: 58, left: KARELA.space.lg, zIndex: 10 },
  identityRow: { flexDirection: "row", alignItems: "center", gap: KARELA.space.lg, marginTop: 10 },
  avatarRing: { width: 72, height: 72, borderRadius: 36 },
  avatarGradient: { width: 72, height: 72, borderRadius: 36, padding: 3 },
  avatarInner: { flex: 1, borderRadius: 33, backgroundColor: KARELA.color.bg, justifyContent: "center", alignItems: "center" },
  identityText: { flex: 1 },
  displayName: { color: KARELA.color.textPrimary, fontSize: 22, fontFamily: KARELA.font.black },
  roleRow: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm, marginTop: KARELA.space.xs },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: KARELA.space.xs, paddingHorizontal: KARELA.space.sm, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontSize: KARELA.size.caption, fontFamily: KARELA.font.black, letterSpacing: 1 },
  titleBadge: { backgroundColor: KARELA.color.lineSoft, paddingHorizontal: KARELA.space.sm, paddingVertical: 3, borderRadius: 10 },
  titleText: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium },
  usernameText: { color: KARELA.color.textFaint, fontSize: 13, fontFamily: KARELA.font.regular, marginTop: KARELA.space.xs },
  bannerActions: { flexDirection: "row", gap: 10, marginTop: KARELA.space.lg },
  bannerBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(124,242,5,0.08)", paddingHorizontal: KARELA.space.lg, paddingVertical: KARELA.space.sm, borderRadius: KARELA.radius.sm, borderWidth: 1, borderColor: "rgba(124,242,5,0.2)" },
  bannerBtnText: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },

  // Progression
  section: { paddingHorizontal: KARELA.space.xl, marginTop: 24 },
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: KARELA.space.sm },
  levelLabel: { color: KARELA.color.brand, fontSize: KARELA.size.body, fontFamily: KARELA.font.black, letterSpacing: 1 },
  xpLabel: { color: KARELA.color.textFaint, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  xpBar: { height: 6, backgroundColor: KARELA.color.surface, borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  metricsRow: { flexDirection: "row", gap: 10, marginTop: KARELA.space.lg },
  metricCard: { flex: 1, backgroundColor: "#111", borderRadius: KARELA.radius.lg, padding: KARELA.space.lg, alignItems: "center", gap: KARELA.space.xs, borderWidth: 1, borderColor: KARELA.color.surface },
  metricValue: { color: KARELA.color.textPrimary, fontSize: KARELA.space.xl, fontFamily: KARELA.font.black },
  metricSub: { color: KARELA.color.textFaint, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium, textAlign: "center" },
  metricHint: { color: KARELA.color.textFaint, fontSize: 9, marginTop: 2 },

  // Dual Track
  trackTabs: { flexDirection: "row", backgroundColor: "#111", borderRadius: KARELA.radius.md, padding: KARELA.space.xs, marginBottom: KARELA.space.lg },
  trackTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: KARELA.radius.sm },
  trackTabActive: { backgroundColor: KARELA.color.surface, borderWidth: 1, borderColor: KARELA.color.surfaceSoft },
  trackTabText: { color: KARELA.color.textFaint, fontSize: KARELA.size.label, fontFamily: KARELA.font.black },
  trackTabTextActive: { color: KARELA.color.textPrimary },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: { width: (width - 40 - 10) / 2, backgroundColor: "#111", borderRadius: KARELA.radius.md, padding: KARELA.space.lg, alignItems: "center", gap: 6, borderWidth: 1, borderColor: KARELA.color.surface },
  statTileValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  statTileLabel: { color: KARELA.color.textFaint, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium, textAlign: "center" },

  // Ani
  aniHeader: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md, marginBottom: KARELA.space.md },
  aniAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(124,242,5,0.1)", justifyContent: "center", alignItems: "center" },
  aniName: { color: KARELA.color.brand, fontSize: KARELA.size.body, fontFamily: KARELA.font.black },
  aniSub: { color: KARELA.color.textFaint, fontSize: 11, fontFamily: KARELA.font.regular },
  aniChatLink: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  aniMessage: { backgroundColor: "#111", borderRadius: KARELA.radius.lg, padding: KARELA.space.lg, borderLeftWidth: 3, borderLeftColor: KARELA.color.brand },
  aniText: { color: KARELA.color.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: KARELA.font.regular },

  // Social empty states
  sectionTitle: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.black, marginBottom: KARELA.space.md },
  emptyCard: { backgroundColor: "#111", borderRadius: KARELA.radius.lg, padding: KARELA.space.xxl, alignItems: "center", gap: 10, borderWidth: 1, borderColor: KARELA.color.surface },
  emptyTitle: { color: KARELA.color.textPrimary, fontSize: 15, fontFamily: KARELA.font.black },
  emptyDesc: { color: KARELA.color.textFaint, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, textAlign: "center", lineHeight: 18, maxWidth: 260 },
  emptyBtn: { backgroundColor: "rgba(124,242,5,0.1)", paddingHorizontal: KARELA.space.xl, paddingVertical: 10, borderRadius: KARELA.radius.sm, marginTop: 6, borderWidth: 1, borderColor: "rgba(124,242,5,0.2)" },
  emptyBtnText: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },

  // Utility
  utilityGrid: { gap: 2 },
  utilityItem: { flexDirection: "row", alignItems: "center", gap: KARELA.space.lg, backgroundColor: "#111", paddingVertical: KARELA.space.lg, paddingHorizontal: KARELA.space.lg, borderRadius: KARELA.radius.md, marginBottom: KARELA.space.sm },
  utilityLabel: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.medium },
  utilityDesc: { color: KARELA.color.textFaint, fontSize: 11, fontFamily: KARELA.font.regular, marginTop: 2 },
});
