import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { updateUserProfileData } from "@/services/database/firebase/firestore";

const { width } = Dimensions.get("window");

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function ProfilePage() {
  const router = useRouter();
  const { profile } = useAuth();

  // --- EDITABLE STATES ---
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [aiNotes, setAiNotes] = useState(profile?.stats?.ai_notes || "");

  // NEW NUMERIC STATES
  const [age, setAge] = useState(profile?.stats?.age?.toString() || "20");
  const [weight, setWeight] = useState(
    profile?.stats?.weight?.toString() || "70",
  );
  const [height, setHeight] = useState(
    profile?.stats?.height?.toString() || "170",
  );
  const [targetWeight, setTargetWeight] = useState(
    profile?.stats?.target_weight?.toString() || "70",
  );

  const [showEditProfile, setShowEditProfile] = useState(false);

  // Sync states when profile data loads
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

  // --- HANDLERS ---
  const handleSaveProfile = async () => {
    if (!profile?.uid) return;
    try {
      await updateUserProfileData(profile.uid, {
        displayName: displayName,
        username: username,
        // Using dot notation for nested stats object
        "stats.ai_notes": aiNotes,
        "stats.age": Number(age),
        "stats.weight": Number(weight),
        "stats.height": Number(height),
        "stats.target_weight": Number(targetWeight),
      });
      setShowEditProfile(false);
      Alert.alert(
        "Success",
        "Profile updated! Ani is recalculating your metrics.",
      );
    } catch (error) {
      console.error("Save failed:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const progressPercent = Math.min(
    ((profile?.stats?.xp || 0) / 1000) * 100,
    100,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        <LinearGradient
          colors={["#2b7a1f", "#0a2e11"]}
          style={styles.headerBanner}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={32} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.thoughtBubbleContainer}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                Sweat now, shine later. 🏃‍♀️💨
              </Text>
            </View>
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

          {/* QUICK STATS DISPLAY */}
          <View style={styles.statsOverviewRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{profile?.stats?.weight}kg</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Height</Text>
              <Text style={styles.statValue}>{profile?.stats?.height}cm</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Target</Text>
              <Text style={styles.statValue}>
                {profile?.stats?.target_weight}kg
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "#209F77", marginTop: 20 },
            ]}
            onPress={() => setShowEditProfile(true)}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.actionBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <BottomSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Physical Profile"
      >
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Name"
            placeholderTextColor="#555"
          />

          {/* AGED, WEIGHT, HEIGHT ROW */}
          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor="#555"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="175"
                placeholderTextColor="#555"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor="#555"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Target (kg)</Text>
              <TextInput
                style={styles.input}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                placeholder="65"
                placeholderTextColor="#555"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>
            Coach's Briefing (Injuries, Vibes)
          </Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            multiline
            value={aiNotes}
            onChangeText={setAiNotes}
            placeholder="Tell Ani how you feel..."
            placeholderTextColor="#555"
          />

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "#209F77", marginTop: 20 },
            ]}
            onPress={handleSaveProfile}
          >
            <Text style={styles.actionBtnText}>Save All Changes</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

// --- SUB-COMPONENTS ---
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
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  scrollContainer: { paddingBottom: 40 },
  headerBanner: { height: 160, justifyContent: "center", alignItems: "center" },
  backButton: { position: "absolute", top: 20, left: 15 },
  thoughtBubbleContainer: { alignItems: "center" },
  speechBubble: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    padding: 10,
    borderRadius: 20,
  },
  speechText: { color: "#e0e0e0" },
  profileSection: { paddingHorizontal: 25, marginTop: -50 },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#209F77",
  },
  nameText: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
  usernameText: { color: "#888", marginBottom: 15 },
  statsOverviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statBox: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 12,
    width: "30%",
    alignItems: "center",
  },
  statLabel: { color: "#888", fontSize: 12 },
  statValue: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  actionBtn: {
    flexDirection: "row",
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: { color: "#FFF", fontWeight: "bold" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  bottomSheet: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "90%",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  bottomSheetTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  modalContent: { gap: 5 },
  inputRow: { flexDirection: "row", justifyContent: "space-between" },
  inputLabel: { color: "#888", fontSize: 13, marginTop: 10, marginBottom: 5 },
  input: {
    backgroundColor: "#121212",
    color: "#FFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
});
