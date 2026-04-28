import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Components
import { DynamicDock } from "@/components/DynamicDock";

const { width } = Dimensions.get("window");

const MOCK_GUILDS = [
  {
    id: "1",
    name: "Tuguegarao Striders",
    members: 124,
    level: 15,
    icon: "shield-sword",
    color: "#7CF205",
  },
  {
    id: "2",
    name: "Cagayan Cyclones",
    members: 89,
    level: 12,
    icon: "weather-hurricane",
    color: "#00D1FF",
  },
  {
    id: "3",
    name: "Ibanag Warriors",
    members: 210,
    level: 20,
    icon: "fire",
    color: "#FF4B4B",
  },
  {
    id: "4",
    name: "Sierra Madre Rangers",
    members: 45,
    level: 8,
    icon: "tree",
    color: "#A06BFF",
  },
];

export default function GuildsScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [myGuild] = useState({
    name: "Vanguard Prime",
    rank: "Global Top 3%",
    members: "42/50",
    xp: "12,450",
    level: 18,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.mainWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>SQUADS</Text>
              <Text style={styles.headerSubtitle}>Tuguegarao Sector</Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.openDrawer()}
            >
              <Ionicons name="menu" size={28} color="#7CF205" />
            </TouchableOpacity>
          </View>

          {/* Active Guild Card (The "Your Squad" Section) */}
          <Text style={styles.sectionLabel}>YOUR ACTIVE SQUAD</Text>
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={["#1A1A1A", "#0d0d0d"]}
              style={styles.activeGuildCard}
            >
              <View style={styles.guildMainInfo}>
                <View style={styles.guildIconLarge}>
                  <MaterialCommunityIcons
                    name="shield-star"
                    size={40}
                    color="#7CF205"
                  />
                  <View style={styles.lvlBadge}>
                    <Text style={styles.lvlBadgeText}>{myGuild.level}</Text>
                  </View>
                </View>
                <View style={styles.guildNameContainer}>
                  <Text style={styles.guildName}>{myGuild.name}</Text>
                  <Text style={styles.guildRankText}>{myGuild.rank}</Text>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{myGuild.members}</Text>
                  <Text style={styles.statLab}>MEMBERS</Text>
                </View>
                <View style={[styles.statBox, styles.statBorder]}>
                  <Text style={styles.statVal}>{myGuild.xp}</Text>
                  <Text style={styles.statLab}>SQUAD XP</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="trending-up" size={18} color="#7CF205" />
                  <Text style={styles.statLab}>RANKING</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Discover Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>DISCOVER SQUADS</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>FILTER</Text>
            </TouchableOpacity>
          </View>

          {MOCK_GUILDS.map((guild) => (
            <TouchableOpacity key={guild.id} style={styles.listCard}>
              <View style={styles.listIconBox}>
                <MaterialCommunityIcons
                  name={guild.icon as any}
                  size={24}
                  color={guild.color}
                />
              </View>

              <View style={styles.listContent}>
                <Text style={styles.listName}>{guild.name}</Text>
                <Text style={styles.listMeta}>
                  Lv. {guild.level} • {guild.members} members
                </Text>
              </View>

              <TouchableOpacity style={styles.viewButton}>
                <Ionicons name="chevron-forward" size={20} color="#444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {/* Create Guild Button */}
          <TouchableOpacity style={styles.createBtn}>
            <Ionicons name="add-circle-outline" size={20} color="#8A8A8A" />
            <Text style={styles.createBtnText}>ESTABLISH NEW GUILD</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Floating Dynamic Dock */}
        <DynamicDock />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  mainWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140, // Space for the dock
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 25,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: "#7CF205",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: -4,
  },
  menuButton: {
    padding: 8,
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    borderRadius: 12,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  // --- Active Card Styles ---
  activeGuildCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 242, 5, 0.2)",
    marginBottom: 30,
  },
  guildMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  guildIconLarge: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  lvlBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#7CF205",
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  lvlBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  guildNameContainer: {
    marginLeft: 15,
  },
  guildName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  guildRankText: {
    color: "#7CF205",
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 15,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statVal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statLab: {
    color: "#8A8A8A",
    fontSize: 9,
    marginTop: 2,
    fontWeight: "bold",
  },
  // --- List Styles ---
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: {
    color: "#7CF205",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 12,
  },
  listCard: {
    flexDirection: "row",
    backgroundColor: "#161616",
    borderRadius: 15,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  listIconBox: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  listMeta: {
    color: "#555",
    fontSize: 11,
    marginTop: 2,
  },
  viewButton: {
    padding: 5,
  },
  createBtn: {
    marginTop: 15,
    padding: 20,
    borderRadius: 15,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#333",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  createBtnText: {
    color: "#555",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
