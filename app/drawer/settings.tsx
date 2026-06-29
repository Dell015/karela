import { useSettings } from "@/hooks/useSettings";
import { KARELA } from "@/styles/designSystem";
import { Screen } from "@/components/ui/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { handleResetData, injectFakeData, logout, profile } = useSettings();

  return (
    <Screen variant="calm" glow={false}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/drawer/dashboard")}
        >
          <Ionicons name="chevron-back" size={24} color={KARELA.color.textPrimary} />
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
                <Ionicons name="flask" size={20} color={KARELA.color.brand} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.itemLabel}>Seed 30-Day History</Text>
                <Text style={styles.itemSublabel}>Populate graphs with mock mission data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={KARELA.color.surfaceSoft} />
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
                <Ionicons name="trash-outline" size={20} color={KARELA.color.danger} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.itemLabel, { color: KARELA.color.danger }]}>Clear Local Storage</Text>
                <Text style={styles.itemSublabel}>Wipe ghost runs and local cache</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.itemRow, { borderBottomWidth: 0 }]}
              onPress={logout}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name="log-out-outline" size={20} color={KARELA.color.textMuted} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KARELA.color.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: KARELA.space.xl,
    paddingTop: 60,
    paddingBottom: KARELA.space.xl,
  },
  backButton: { 
    backgroundColor: KARELA.color.surface, 
    width: 44, 
    height: 44, 
    borderRadius: KARELA.radius.md, 
    justifyContent: "center", 
    alignItems: "center",
  },
  headerTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black, letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: KARELA.space.xl, paddingBottom: KARELA.space.xxxl },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: KARELA.color.bg,
    padding: KARELA.space.xl,
    borderRadius: KARELA.radius.xl,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: KARELA.color.surface,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: KARELA.radius.lg,
    backgroundColor: KARELA.color.brand,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: KARELA.size.h1, fontFamily: KARELA.font.bold, color: KARELA.color.onBright },
  username: { color: KARELA.color.textPrimary, fontSize: KARELA.space.xl, fontFamily: KARELA.font.black },
  userEmail: { color: KARELA.color.textFaint, fontSize: 13, fontFamily: KARELA.font.regular, marginTop: 2 },
  section: { marginBottom: 30 },
  sectionLabel: {
    color: KARELA.color.textFaint,
    fontSize: 11,
    fontFamily: KARELA.font.black,
    marginBottom: KARELA.space.md,
    marginLeft: KARELA.space.sm,
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: KARELA.color.bg,
    borderRadius: KARELA.radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: KARELA.color.surface,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.surface,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: KARELA.radius.sm,
    backgroundColor: KARELA.color.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.bold },
  itemSublabel: { color: KARELA.color.textFaint, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 2 },
  footer: { alignItems: "center", marginTop: 10 },
  versionText: { color: KARELA.color.surfaceSoft, fontSize: KARELA.size.caption, fontFamily: KARELA.font.black, letterSpacing: 1 },
  buildText: { color: KARELA.color.surface, fontSize: 9, fontFamily: KARELA.font.bold, marginTop: KARELA.space.xs },
});
