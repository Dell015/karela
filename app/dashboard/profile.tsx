import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/services/database/firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView, StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function ProfileScreen() {
  const { profile, user, loading } = useAuth();
  const router = useRouter();

  // Local state for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [weight, setWeight] = useState("");

  // Sync local weight state when profile finally loads
  useEffect(() => {
    if (profile?.stats?.weight) {
      setWeight(profile.stats.weight.toString());
    }
  }, [profile]);

  // 1. CRITICAL GUARD: If data is still fetching, show a loader instead of crashing
  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7CF205" size="large" />
        <Text style={styles.loadingText}>Syncing Engine Data...</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: async () => {
          await signOut(auth);
          router.replace("/auth/login");
      }}
    ]);
  };

  const updateWeight = async () => {
    if (!user || !profile) return;
    try {
      const newWeight = parseFloat(weight);
      const hMeters = profile.stats.height / 100;
      const newBmi = newWeight / (hMeters * hMeters);

      await updateDoc(doc(db, "users", user.uid), {
        "stats.weight": newWeight,
        "stats.bmi": parseFloat(newBmi.toFixed(2))
      });
      setIsEditing(false);
      Alert.alert("Success", "Physical profile updated.");
    } catch (e) {
      Alert.alert("Error", "Could not update data.");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1A1A1A", "#000"]} style={StyleSheet.absoluteFill} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* 1. IDENTITY & VISUALS */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={["#7CF205", "#209F77"]} style={styles.levelBorder} />
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{profile.displayName?.[0] || "?"}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LVL {profile.stats?.level ?? 1}</Text>
            </View>
          </View>
          
          <Text style={styles.nameText}>{profile.displayName}</Text>
          <Text style={styles.usernameText}>@{profile.username}</Text>
          <Text style={styles.rankText}>Elite Strider</Text>
        </View>

        {/* 2. PERFORMANCE SUMMARY */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats?.total_missions_completed ?? 0}</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.stats?.total_distance_km ?? 0}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#7CF205' }]}>{profile.stats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* 3. PHYSICAL PROFILE (ENGINE DATA) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engine Parameters</Text>
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Weight</Text>
              {isEditing ? (
                <TextInput 
                  style={styles.input} 
                  value={weight} 
                  onChangeText={setWeight} 
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.stats?.weight} kg</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Body Mass Index (BMI)</Text>
              <Text style={[styles.infoValue, { color: '#7CF205' }]}>{profile.stats?.bmi}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={isEditing ? updateWeight : () => setIsEditing(true)}
            >
              <Text style={styles.editBtnText}>{isEditing ? "Save Changes" : "Update Weight"}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* 4. ENGINE INSIGHTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engine Insights</Text>
          <LinearGradient colors={["rgba(124, 242, 5, 0.1)", "transparent"]} style={styles.card}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>Fitness Score</Text>
                <Text style={styles.subLabel}>AI-Adapted scaling factor</Text>
              </View>
              <Text style={styles.scoreText}>{profile.stats?.fitness_score ?? "1.0"}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* 5. SETTINGS (Safe Optional Chaining) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Measurement Units</Text>
              <Text style={styles.infoValue}>{profile.settings?.units ?? "metric"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Push Notifications</Text>
              <Switch 
                value={profile.settings?.notifications ?? true} 
                trackColor={{ true: '#7CF205' }} 
              />
            </View>
          </View>
        </View>

        {/* 6. LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "2026"}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 10, fontFamily: 'Excon-Regular' },
  scrollPadding: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  headerSection: { alignItems: "center", marginBottom: 30 },
  avatarWrapper: { width: 100, height: 100, justifyContent: "center", alignItems: "center" },
  levelBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 50, padding: 3 },
  avatarInner: { flex: 1, width: '94%', backgroundColor: '#1A1A1A', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  levelBadge: { position: 'absolute', bottom: -5, backgroundColor: '#7CF205', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  levelBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  nameText: { color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 15 },
  usernameText: { color: "rgba(255,255,255,0.5)", fontSize: 16 },
  rankText: { color: "#7CF205", fontSize: 14, fontWeight: "600", marginTop: 5 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  statCard: { backgroundColor: "#1A1A1A", padding: 15, borderRadius: 15, width: "30%", alignItems: "center" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  statLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 5 },
  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  card: { backgroundColor: "#1A1A1A", borderRadius: 20, padding: 20, gap: 15, overflow: 'hidden' },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  infoValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  subLabel: { color: "rgba(255,255,255,0.3)", fontSize: 10 },
  scoreText: { color: "#7CF205", fontSize: 24, fontWeight: "bold" },
  input: { color: '#7CF205', borderBottomWidth: 1, borderBottomColor: '#7CF205', width: 60, textAlign: 'right' },
  editBtn: { marginTop: 10, alignItems: 'center' },
  editBtnText: { color: '#7CF205', fontSize: 14, fontWeight: '600' },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 15, backgroundColor: "rgba(255, 68, 68, 0.1)", borderRadius: 15, marginTop: 10 },
  logoutText: { color: "#FF4444", fontWeight: "bold", marginLeft: 10 },
  footerText: { textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 30 }
});