import { useSettings } from "@/hooks/useSettings";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { handleResetData, injectFakeData, logout, profile } = useSettings();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/drawer/dashboard")}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.username?.[0] || "U").toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.username}>
              @{profile?.username || "strider"}
            </Text>
            <Text style={styles.userEmail}>{profile?.email || "No email linked"}</Text>
          </View>
        </View>

        {/* Developer Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEVELOPER TELEMETRY</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity 
                style={styles.itemRow} 
                onPress={injectFakeData}
                activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: "rgba(124, 242, 5, 0.1)" }]}>
                <Ionicons name="flask" size={20} color="#7CF205" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.itemLabel}>Seed 30-Day History</Text>
                <Text style={styles.itemSublabel}>Populate graphs with mock mission data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CORE PROTOCOLS</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity 
                style={styles.itemRow} 
                onPress={handleResetData}
                activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: "rgba(255, 69, 58, 0.1)" }]}>
                <Ionicons name="trash-outline" size={20} color="#FF453A" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.itemLabel, { color: "#FF453A" }]}>Clear Local Storage</Text>
                <Text style={styles.itemSublabel}>Wipe ghost runs and local cache</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.itemRow, { borderBottomWidth: 0 }]}
              onPress={logout}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name="log-out-outline" size={20} color="#8E8E93" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.itemLabel}>Terminate Session</Text>
                <Text style={styles.itemSublabel}>Safely log out of the network</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
            <Text style={styles.versionText}>KARELA OS v1.0.4-BETA</Text>
            <Text style={styles.buildText}>BUILD ID: {Math.floor(Math.random() * 90000) + 10000}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: { 
    backgroundColor: "#111", 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    padding: 20,
    borderRadius: 28,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#111"
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#7CF205",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "bold", color: "#000" },
  username: { color: "white", fontSize: 20, fontWeight: "800" },
  userEmail: { color: "#666", fontSize: 13, marginTop: 2 },
  section: { marginBottom: 30 },
  sectionLabel: {
    color: "#444",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: "#0A0A0A",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#111"
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: { color: "white", fontSize: 16, fontWeight: "700" },
  itemSublabel: { color: "#555", fontSize: 12, marginTop: 2 },
  footer: { alignItems: 'center', marginTop: 10 },
  versionText: { color: "#222", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  buildText: { color: "#111", fontSize: 9, fontWeight: "700", marginTop: 4 }
});