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
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { handleResetData, injectFakeData, logout, profile } = useSettings();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/drawer/dashboard")}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <Text style={styles.userEmail}>{profile?.email || ""}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Developer Tools</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity style={styles.itemRow} onPress={injectFakeData}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(124, 242, 5, 0.1)" },
                ]}
              >
                <Ionicons name="flask-outline" size={20} color="#7CF205" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.itemLabel}>Seed Demo Data</Text>
                <Text style={styles.itemSublabel}>
                  Add fake runs for testing
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account Management</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity style={styles.itemRow} onPress={handleResetData}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(255, 69, 58, 0.1)" },
                ]}
              >
                <Ionicons name="refresh-outline" size={20} color="#FF453A" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.itemLabel, { color: "#FF453A" }]}>
                  Reset Performance
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.itemRow, { borderBottomWidth: 0 }]}
              onPress={logout}
            >
              <View style={styles.iconBox}>
                <Ionicons name="log-out-outline" size={20} color="#8E8E93" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.itemLabel}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>
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
    padding: 20,
  },
  backButton: { backgroundColor: "#111", padding: 10, borderRadius: 14 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  scrollContent: { paddingHorizontal: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#7CF205",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "bold" },
  username: { color: "white", fontSize: 18, fontWeight: "800" },
  userEmail: { color: "#666", fontSize: 13 },
  section: { marginBottom: 25 },
  sectionLabel: {
    color: "#444",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 10,
    marginLeft: 5,
  },
  groupCard: {
    backgroundColor: "#0A0A0A",
    borderRadius: 24,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: { color: "white", fontSize: 15, fontWeight: "600" },
  itemSublabel: { color: "#666", fontSize: 11 },
});
