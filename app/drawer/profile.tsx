import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Import your Auth Context
import { useAuth } from "@/context/AuthContext";
import { updateUserProfileData } from "@/services/database/firebase/firestore";

const { width } = Dimensions.get("window");

// =========================================================
// REUSABLE UI COMPONENTS
// =========================================================
const ProfileRow = ({ label, value, valueComponent }: any) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {valueComponent ? (
      valueComponent
    ) : (
      <Text style={styles.rowValue}>{value}</Text>
    )}
  </View>
);

const ToggleRow = ({ label, value, onValueChange }: any) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      trackColor={{ false: "#333", true: "#52CC39" }}
      thumbColor={"#FFF"}
      ios_backgroundColor="#333"
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const ActionRow = ({
  label,
  actionText,
  onPress,
  color = "#888",
  icon,
}: any) => (
  <TouchableOpacity
    style={styles.actionRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.actionRowLeft}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color="#888"
          style={{ marginRight: 10 }}
        />
      )}
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    {actionText ? (
      <Text style={[styles.rowValue, { color, fontWeight: "600" }]}>
        {actionText}
      </Text>
    ) : null}
  </TouchableOpacity>
);

// --- BOTTOM SHEET MODAL COMPONENT ---
const BottomSheet = ({ visible, onClose, title, children }: any) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <KeyboardAvoidingView
      style={styles.modalOverlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={28} color="#888" />
          </TouchableOpacity>
        </View>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function ProfilePage() {
  const router = useRouter();
  const { profile } = useAuth();

  // --- MODAL STATES ---
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);

  // --- SETTINGS STATES ---
  const [isMetric, setIsMetric] = useState(true);
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  // Dynamic Stats
  const currentXP = profile?.stats?.xp || 452;
  const currentLevel = profile?.stats?.level || 2;
  const totalXP = 1000;
  const progressPercent = Math.min((currentXP / totalXP) * 100, 100);

  const [aiNotes, setAiNotes] = useState(profile?.stats?.ai_notes || "");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        {/* HEADER BANNER */}
        <LinearGradient
          colors={["#2b7a1f", "#0a2e11"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBanner}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/drawer/dashboard")}
          >
            <Ionicons name="chevron-back" size={32} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.thoughtBubbleContainer}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                Sweat now, shine later. 🏃‍♀️💨
              </Text>
            </View>
            <View style={styles.bubbleDot1} />
            <View style={styles.bubbleDot2} />
          </View>
        </LinearGradient>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder} />
          </View>
          <Text style={styles.nameText}>
            {profile?.displayName || "Player Name"}
          </Text>
          <Text style={styles.usernameText}>
            @{profile?.username || "username"}
          </Text>

          {/* XP & LEVEL BAR */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={["#52CC39", "#209F77"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.rankText}>Novice Scout</Text>
              <Text style={styles.levelText}>Level {currentLevel}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "#209F77", marginTop: 20 },
            ]}
            onPress={async () => {
              if (!profile?.uid) return;

              try {
                // 2. Map the local states to the Firestore fields
                await updateUserProfileData(profile.uid, {
                  displayName: profile.displayName, // or your local state for name
                  username: profile.username, // or your local state for username
                  "stats.ai_notes": aiNotes, // This is the key for Ani!
                });

                setShowEditProfile(false);
                Alert.alert(
                  "Success",
                  "Ani has been briefed on your condition.",
                );
              } catch (err) {
                Alert.alert("Error", "Failed to update profile.");
              }
            }}
          >
            <Text style={styles.actionBtnText}>Save Changes</Text>
          </TouchableOpacity>

          {/* 🏆 THE TROPHY CABINET (NEW) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Trophy Cabinet</Text>
            <View style={styles.badgesRow}>
              <View style={styles.badgeItem}>
                <View
                  style={[styles.badgeIconBg, { backgroundColor: "#FFD70020" }]}
                >
                  <Ionicons name="flame" size={28} color="#FFD700" />
                </View>
                <Text style={styles.badgeText}>7 Day Streak</Text>
              </View>
              <View style={styles.badgeItem}>
                <View
                  style={[styles.badgeIconBg, { backgroundColor: "#52CC3920" }]}
                >
                  <Ionicons name="footsteps" size={28} color="#52CC39" />
                </View>
                <Text style={styles.badgeText}>First 5K</Text>
              </View>
              <View style={styles.badgeItem}>
                <View
                  style={[styles.badgeIconBg, { backgroundColor: "#8A2BE220" }]}
                >
                  <Ionicons name="moon" size={28} color="#8A2BE2" />
                </View>
                <Text style={styles.badgeText}>Night Owl</Text>
              </View>
            </View>
          </View>

          {/* 👥 YOUR SQUAD (NEW) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your Squad</Text>
              <Text style={styles.seeAllText}>See All</Text>
            </View>
            <View style={styles.squadRow}>
              <View style={styles.squadAvatar}>
                <Text>🏃‍♂️</Text>
              </View>
              <View style={styles.squadAvatar}>
                <Text>🚴‍♀️</Text>
              </View>
              <View style={styles.squadAvatar}>
                <Text>🏋️</Text>
              </View>
              <TouchableOpacity style={styles.addFriendBtn}>
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ⚙️ SETTINGS & SECURITY */}
          <View style={styles.bottomMenuContainer}>
            <ActionRow
              icon="apps-outline"
              label="Connected Apps (Strava, Spotify)"
              onPress={() => {}} // Hook this up later if needed!
            />
            <View style={styles.divider} />
            <ActionRow
              icon="settings-outline"
              label="General Settings"
              onPress={() => setShowGeneralSettings(true)}
            />
            <View style={styles.divider} />
            <ActionRow
              icon="shield-checkmark-outline"
              label="Account & Security"
              onPress={() => setShowAccountSettings(true)}
            />
          </View>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* MODALS / BOTTOM SHEETS */}
      {/* ========================================================= */}

      {/* EDIT PROFILE MODAL */}
      <BottomSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile"
      >
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            defaultValue={profile?.displayName || ""}
            placeholder="Enter display name"
            placeholderTextColor="#888"
          />
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            defaultValue={profile?.username || ""}
            placeholder="Enter username"
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "#209F77", marginTop: 20 },
            ]}
            onPress={() => setShowEditProfile(false)}
          >
            <Text style={styles.actionBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* GENERAL SETTINGS MODAL */}
      <BottomSheet
        visible={showGeneralSettings}
        onClose={() => setShowGeneralSettings(false)}
        title="App Preferences"
      >
        <View style={styles.modalContent}>
          <ToggleRow
            label="Metric Units (km/kg)"
            value={isMetric}
            onValueChange={setIsMetric}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Mission Alerts"
            value={isPushEnabled}
            onValueChange={setIsPushEnabled}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Dark Mode"
            value={isDarkMode}
            onValueChange={setIsDarkMode}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Public (Leaderboard Visible)"
            value={isPublic}
            onValueChange={setIsPublic}
          />
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "#209F77", marginTop: 20 },
            ]}
            onPress={() => setShowGeneralSettings(false)}
          >
            <Text style={styles.actionBtnText}>Save & Close</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ACCOUNT SETTINGS MODAL */}
      <BottomSheet
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        title="Account Security"
      >
        <View style={styles.modalContent}>
          <ProfileRow
            label="Email"
            valueComponent={
              <Text
                style={[styles.rowValue, { fontSize: 13, textAlign: "right" }]}
              >
                {profile?.email || "No email linked"}
                {"\n"}
                <Text style={styles.successText}>[✅ Verified]</Text>
              </Text>
            }
          />
          <View style={styles.divider} />
          <ActionRow label="Change Password" />
          <View style={styles.divider} />
          <ActionRow label="Help & Support" />
          <View style={{ height: 20 }} />
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#333" }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: "#FFF" }]}>
              Log Out
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "#FF4C4C",
                marginTop: 10,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: "#FF4C4C" }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

// =========================================================
// STYLES
// =========================================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  scrollContainer: { paddingBottom: 40 },

  // --- HEADER & PROFILE ---
  headerBanner: {
    height: 160,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 15,
    zIndex: 10,
    padding: 5,
  },
  thoughtBubbleContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginLeft: 40,
  },
  speechBubble: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  speechText: { color: "#e0e0e0", fontSize: 14 },
  bubbleDot1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    position: "absolute",
    bottom: -15,
    left: 20,
  },
  bubbleDot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    position: "absolute",
    bottom: -25,
    left: 10,
  },
  profileSection: { paddingHorizontal: 25, marginTop: -50 },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#209F77",
  },
  nameText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  usernameText: { color: "#888", fontSize: 14, marginBottom: 20 },
  progressContainer: { marginBottom: 25 },
  progressBarBackground: {
    height: 14,
    backgroundColor: "#222",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#e8f5e9",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: { height: "100%", borderRadius: 7 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  rankText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  levelText: { color: "#888", fontSize: 14 },

  // --- NEW SECTIONS (BADGES & COMMUNITY) ---
  sectionContainer: { marginTop: 25 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  seeAllText: { color: "#209F77", fontSize: 14, fontWeight: "600" },

  badgesRow: { flexDirection: "row", justifyContent: "space-between" },
  badgeItem: { alignItems: "center", width: "30%" },
  badgeIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  squadRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  squadAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  addFriendBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#209F77",
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#FFF",
  },

  // --- BOTTOM MENU ---
  bottomMenuContainer: {
    marginTop: 30,
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  actionRowLeft: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, backgroundColor: "#2a2a2a", marginVertical: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { color: "#888", fontSize: 14, flex: 1 },
  rowValue: { color: "#FFF", fontSize: 14, fontWeight: "500" },
  successText: { color: "#52CC39", fontWeight: "600" },

  // --- BUTTONS ---
  outlineBtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#209F77",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { color: "#209F77", fontSize: 16, fontWeight: "bold" },
  actionBtn: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // --- BOTTOM SHEET MODALS ---
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  bottomSheet: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 50,
    maxHeight: "85%",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bottomSheetTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  modalContent: { gap: 10 },
  inputLabel: { color: "#888", fontSize: 14, marginBottom: 5, marginTop: 10 },
  input: {
    backgroundColor: "#121212",
    color: "#FFF",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
});
