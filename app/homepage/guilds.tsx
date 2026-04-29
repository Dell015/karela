import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Components
import { DynamicDock } from "@/components/DynamicDock";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
];

const SQUAD_MISSIONS = [
  {
    id: "m1",
    title: "Sector Sweep",
    progress: 0.8,
    goal: "50km Total",
    poi: "Tuguegarao Cathedral",
    intel:
      "Squad must maintain GPS presence within 50m of the sector landmark for 5 minutes.",
    rewards: { xp: 500, kp: 150, gems: 10, item: "Thermal Visor" },
  },
  {
    id: "m2",
    title: "Midnight Stride",
    progress: 0.3,
    goal: "10 Members",
    poi: "Victory Liner Terminal",
    intel:
      "Coordinate a simultaneous check-in with at least 3 squad members after 22:00.",
    rewards: { xp: 1200, kp: 400, gems: 25, item: "Elite Emblem" },
  },
];

export default function GuildsScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [showDetails, setShowDetails] = useState(false);
  const [expandedMission, setExpandedMission] = useState<string | null>(null);

  const [myGuild] = useState({
    name: "Vanguard Prime",
    rank: "Global Top 3%",
    members: "42/50",
    xp: "12,450",
    level: 18,
    description:
      "The elite pathfinders of the Tuguegarao Sector. Precision. Endurance. Unity.",
  });

  const toggleMission = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMission(expandedMission === id ? null : id);
  };

  const handleToggleDetails = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setShowDetails(!showDetails);
  };

  const handleSubmitImpact = (title: string) => {
    Alert.alert(
      "UPLINK INITIATED",
      `Prepare to submit proof for ${title}. This will verify your current GPS location and squad proximity.`,
      [
        { text: "CANCEL", style: "cancel" },
        { text: "SUBMIT", onPress: () => console.log("Impact Submitted") },
      ],
    );
  };

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
              <Text style={styles.headerTitle}>
                {showDetails ? "SQUAD INTEL" : "GUILDS"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {showDetails ? myGuild.name : "Tuguegarao Sector"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() =>
                showDetails ? handleToggleDetails() : navigation.openDrawer()
              }
            >
              <Ionicons
                name={showDetails ? "chevron-down" : "menu"}
                size={28}
                color="#7CF205"
              />
            </TouchableOpacity>
          </View>

          {/* Active Guild Card */}
          <Text style={styles.sectionLabel}>YOUR ACTIVE SQUAD</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={handleToggleDetails}>
            <LinearGradient
              colors={
                showDetails ? ["#7CF205", "#209F77"] : ["#1A1A1A", "#0d0d0d"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.activeGuildCard,
                showDetails && styles.activeGuildCardExpanded,
              ]}
            >
              <View style={styles.guildMainInfo}>
                <View
                  style={[
                    styles.guildIconLarge,
                    showDetails && { backgroundColor: "rgba(0,0,0,0.2)" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-star"
                    size={40}
                    color={showDetails ? "#fff" : "#7CF205"}
                  />
                  <View style={styles.lvlBadge}>
                    <Text style={styles.lvlBadgeText}>{myGuild.level}</Text>
                  </View>
                </View>
                <View style={styles.guildNameContainer}>
                  <Text
                    style={[styles.guildName, showDetails && { color: "#000" }]}
                  >
                    {myGuild.name}
                  </Text>
                  <Text
                    style={[
                      styles.guildRankText,
                      showDetails && { color: "rgba(0,0,0,0.6)" },
                    ]}
                  >
                    {myGuild.rank}
                  </Text>
                </View>
              </View>
              {showDetails && (
                <Text style={styles.detailsDesc}>{myGuild.description}</Text>
              )}
              <View
                style={[
                  styles.statsGrid,
                  showDetails && { borderTopColor: "rgba(0,0,0,0.1)" },
                ]}
              >
                <View style={styles.statBox}>
                  <Text
                    style={[styles.statVal, showDetails && { color: "#000" }]}
                  >
                    {myGuild.members}
                  </Text>
                  <Text
                    style={[
                      styles.statLab,
                      showDetails && { color: "rgba(0,0,0,0.5)" },
                    ]}
                  >
                    MEMBERS
                  </Text>
                </View>
                <View
                  style={[
                    styles.statBox,
                    styles.statBorder,
                    showDetails && { borderColor: "rgba(0,0,0,0.1)" },
                  ]}
                >
                  <Text
                    style={[styles.statVal, showDetails && { color: "#000" }]}
                  >
                    {myGuild.xp}
                  </Text>
                  <Text
                    style={[
                      styles.statLab,
                      showDetails && { color: "rgba(0,0,0,0.5)" },
                    ]}
                  >
                    XP
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={showDetails ? "#000" : "#7CF205"}
                  />
                  <Text
                    style={[
                      styles.statLab,
                      showDetails && { color: "rgba(0,0,0,0.5)" },
                    ]}
                  >
                    RANK
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {showDetails ? (
            <View style={styles.missionSection}>
              <Text style={styles.sectionLabel}>SQUAD OPERATIONS</Text>
              {SQUAD_MISSIONS.map((mission) => {
                const isExpanded = expandedMission === mission.id;
                return (
                  <TouchableOpacity
                    key={mission.id}
                    activeOpacity={0.9}
                    onPress={() => toggleMission(mission.id)}
                    style={[
                      styles.missionCard,
                      isExpanded && styles.missionCardActive,
                    ]}
                  >
                    <View style={styles.missionInfo}>
                      <View>
                        <Text style={styles.missionTitle}>{mission.title}</Text>
                        <Text style={styles.missionReward}>
                          +{mission.rewards.xp} XP • {mission.rewards.kp} KP
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-forward"}
                        size={20}
                        color={isExpanded ? "#7CF205" : "#444"}
                      />
                    </View>

                    {isExpanded ? (
                      <View style={styles.expandedMissionContent}>
                        <View style={styles.poiRow}>
                          <Ionicons name="location" size={14} color="#7CF205" />
                          <Text style={styles.poiText}>POI: {mission.poi}</Text>
                        </View>
                        <Text style={styles.intelText}>{mission.intel}</Text>

                        {/* Rewards Grid */}
                        <View style={styles.rewardGrid}>
                          <View style={styles.rewardItem}>
                            <Text style={styles.rewardVal}>
                              {mission.rewards.gems}
                            </Text>
                            <Text style={styles.rewardLab}>GEMS</Text>
                          </View>
                          <View style={styles.rewardItem}>
                            <Text style={styles.rewardVal}>
                              {mission.rewards.item}
                            </Text>
                            <Text style={styles.rewardLab}>ITEM</Text>
                          </View>
                        </View>

                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${mission.progress * 100}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.missionGoal}>
                          {mission.goal} • {Math.round(mission.progress * 100)}%
                        </Text>

                        {/* Submit Button */}
                        <TouchableOpacity
                          style={styles.submitButton}
                          onPress={() => handleSubmitImpact(mission.title)}
                        >
                          <MaterialCommunityIcons
                            name="target"
                            size={18}
                            color="#000"
                          />
                          <Text style={styles.submitButtonText}>
                            SUBMIT PROOF OF IMPACT
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.progressTrackMini}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${mission.progress * 100}%` },
                          ]}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.rosterBtn}>
                <Text style={styles.rosterBtnText}>VIEW FULL ROSTER</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
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
                  <Ionicons name="chevron-forward" size={20} color="#444" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.createBtn}>
                <Ionicons name="add-circle-outline" size={20} color="#8A8A8A" />
                <Text style={styles.createBtnText}>ESTABLISH NEW GUILD</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        <DynamicDock />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  mainWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
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
  activeGuildCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 242, 5, 0.2)",
    marginBottom: 30,
  },
  activeGuildCardExpanded: { borderColor: "#7CF205" },
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
  lvlBadgeText: { color: "#000", fontSize: 10, fontWeight: "900" },
  guildNameContainer: { marginLeft: 15 },
  guildName: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  guildRankText: { color: "#7CF205", fontSize: 12, fontWeight: "600" },
  detailsDesc: {
    color: "#000",
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 15,
  },
  statBox: { flex: 1, alignItems: "center" },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statVal: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  statLab: { color: "#8A8A8A", fontSize: 9, marginTop: 2, fontWeight: "bold" },
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
  listContent: { flex: 1, marginLeft: 12 },
  listName: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  listMeta: { color: "#555", fontSize: 11, marginTop: 2 },
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
  missionSection: { marginTop: 10 },
  missionCard: {
    backgroundColor: "#161616",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  missionCardActive: {
    borderColor: "rgba(124, 242, 5, 0.3)",
    backgroundColor: "#1c1c1c",
  },
  missionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  missionTitle: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  missionReward: { color: "#7CF205", fontSize: 11, fontWeight: "bold" },
  progressTrack: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 3,
    marginVertical: 12,
  },
  progressTrackMini: {
    height: 2,
    backgroundColor: "#222",
    borderRadius: 1,
    marginTop: 10,
  },
  progressFill: { height: "100%", backgroundColor: "#7CF205", borderRadius: 3 },
  missionGoal: {
    color: "#555",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 15,
  },
  expandedMissionContent: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 10,
  },
  poiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  poiText: { color: "#7CF205", fontSize: 11, fontWeight: "bold" },
  intelText: { color: "#888", fontSize: 12, lineHeight: 18, marginBottom: 10 },
  rewardGrid: { flexDirection: "row", gap: 10, marginBottom: 15 },
  rewardItem: {
    backgroundColor: "#000",
    padding: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  rewardVal: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  rewardLab: { color: "#444", fontSize: 8, fontWeight: "900" },
  submitButton: {
    backgroundColor: "#7CF205",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: { color: "#000", fontSize: 11, fontWeight: "900" },
  rosterBtn: { marginTop: 10, padding: 15, alignItems: "center" },
  rosterBtnText: {
    color: "#7CF205",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
