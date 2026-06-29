import { KARELA } from "@/styles/designSystem";
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

import { DynamicDock } from "@/components/DynamicDock";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

const MOCK_GUILDS = [
  { id: "1", name: "Tuguegarao Striders", members: 124, level: 15, icon: "shield-sword", color: KARELA.color.brand },
  { id: "2", name: "Cagayan Cyclones", members: 89, level: 12, icon: "weather-hurricane", color: KARELA.vibrant.sky },
  { id: "3", name: "Ibanag Warriors", members: 210, level: 20, icon: "fire", color: KARELA.vibrant.coral },
];

const SQUAD_MISSIONS = [
  {
    id: "m1", title: "Sector Sweep", progress: 0.8, goal: "50km Total", poi: "Tuguegarao Cathedral",
    intel: "Squad must maintain GPS presence within 50m of the sector landmark for 5 minutes.",
    rewards: { xp: 500, kp: 150, gems: 10, item: "Thermal Visor" },
  },
  {
    id: "m2", title: "Midnight Stride", progress: 0.3, goal: "10 Members", poi: "Victory Liner Terminal",
    intel: "Coordinate a simultaneous check-in with at least 3 squad members after 22:00.",
    rewards: { xp: 1200, kp: 400, gems: 25, item: "Elite Emblem" },
  },
];

export default function GuildsScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [showDetails, setShowDetails] = useState(false);
  const [expandedMission, setExpandedMission] = useState<string | null>(null);

  const [myGuild] = useState({
    name: "Vanguard Prime", rank: "Global Top 3%", members: "42/50",
    xp: "12,450", level: 18,
    description: "The elite pathfinders of the Tuguegarao Sector. Precision. Endurance. Unity.",
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{showDetails ? "SQUAD INTEL" : "GUILDS"}</Text>
              <Text style={styles.headerSubtitle}>{showDetails ? myGuild.name : "Tuguegarao Sector"}</Text>
            </View>
            <TouchableOpacity style={styles.menuButton} onPress={() => showDetails ? handleToggleDetails() : navigation.openDrawer()}>
              <Ionicons name={showDetails ? "chevron-down" : "menu"} size={28} color={KARELA.color.brand} />
            </TouchableOpacity>
          </View>

          {/* Active Guild Card */}
          <Text style={styles.sectionLabel}>YOUR ACTIVE SQUAD</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={handleToggleDetails}>
            <LinearGradient
              colors={showDetails ? (KARELA.gradients.brand as unknown as string[]) : [KARELA.color.surface, KARELA.color.bg]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.activeGuildCard, showDetails && styles.activeGuildCardExpanded]}
            >
              <View style={styles.guildMainInfo}>
                <View style={[styles.guildIconLarge, showDetails && { backgroundColor: "rgba(0,0,0,0.2)" }]}>
                  <MaterialCommunityIcons name="shield-star" size={40} color={showDetails ? KARELA.color.textPrimary : KARELA.color.brand} />
                  <View style={styles.lvlBadge}><Text style={styles.lvlBadgeText}>{myGuild.level}</Text></View>
                </View>
                <View style={styles.guildNameContainer}>
                  <Text style={[styles.guildName, showDetails && { color: KARELA.color.onBright }]}>{myGuild.name}</Text>
                  <Text style={[styles.guildRankText, showDetails && { color: "rgba(0,0,0,0.6)" }]}>{myGuild.rank}</Text>
                </View>
              </View>
              {showDetails && <Text style={styles.detailsDesc}>{myGuild.description}</Text>}
              <View style={[styles.statsGrid, showDetails && { borderTopColor: "rgba(0,0,0,0.1)" }]}>
                <View style={styles.statBox}><Text style={[styles.statVal, showDetails && { color: KARELA.color.onBright }]}>{myGuild.members}</Text><Text style={[styles.statLab, showDetails && { color: "rgba(0,0,0,0.5)" }]}>MEMBERS</Text></View>
                <View style={[styles.statBox, styles.statBorder, showDetails && { borderColor: "rgba(0,0,0,0.1)" }]}><Text style={[styles.statVal, showDetails && { color: KARELA.color.onBright }]}>{myGuild.xp}</Text><Text style={[styles.statLab, showDetails && { color: "rgba(0,0,0,0.5)" }]}>XP</Text></View>
                <View style={styles.statBox}><Ionicons name="trending-up" size={18} color={showDetails ? KARELA.color.onBright : KARELA.color.brand} /><Text style={[styles.statLab, showDetails && { color: "rgba(0,0,0,0.5)" }]}>RANK</Text></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {showDetails ? (
            <View style={styles.missionSection}>
              <Text style={styles.sectionLabel}>SQUAD OPERATIONS</Text>
              {SQUAD_MISSIONS.map((mission) => {
                const isExpanded = expandedMission === mission.id;
                return (
                  <TouchableOpacity key={mission.id} activeOpacity={0.9} onPress={() => toggleMission(mission.id)} style={[styles.missionCard, isExpanded && styles.missionCardActive]}>
                    <View style={styles.missionInfo}>
                      <View><Text style={styles.missionTitle}>{mission.title}</Text><Text style={styles.missionReward}>+{mission.rewards.xp} XP • {mission.rewards.kp} KP</Text></View>
                      <Ionicons name={isExpanded ? "chevron-up" : "chevron-forward"} size={20} color={isExpanded ? KARELA.color.brand : KARELA.color.textFaint} />
                    </View>
                    {isExpanded ? (
                      <View style={styles.expandedMissionContent}>
                        <View style={styles.poiRow}><Ionicons name="location" size={14} color={KARELA.color.brand} /><Text style={styles.poiText}>POI: {mission.poi}</Text></View>
                        <Text style={styles.intelText}>{mission.intel}</Text>
                        <View style={styles.rewardGrid}>
                          <View style={styles.rewardItem}><Text style={styles.rewardVal}>{mission.rewards.gems}</Text><Text style={styles.rewardLab}>GEMS</Text></View>
                          <View style={styles.rewardItem}><Text style={styles.rewardVal}>{mission.rewards.item}</Text><Text style={styles.rewardLab}>ITEM</Text></View>
                        </View>
                        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${mission.progress * 100}%` }]} /></View>
                        <Text style={styles.missionGoal}>{mission.goal} • {Math.round(mission.progress * 100)}%</Text>
                        <TouchableOpacity style={styles.submitButton} onPress={() => handleSubmitImpact(mission.title)}>
                          <MaterialCommunityIcons name="target" size={18} color={KARELA.color.onBright} />
                          <Text style={styles.submitButtonText}>SUBMIT PROOF OF IMPACT</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.progressTrackMini}><View style={[styles.progressFill, { width: `${mission.progress * 100}%` }]} /></View>
                    )}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.rosterBtn}><Text style={styles.rosterBtnText}>VIEW FULL ROSTER</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>DISCOVER SQUADS</Text><TouchableOpacity><Text style={styles.viewAllText}>FILTER</Text></TouchableOpacity></View>
              {MOCK_GUILDS.map((guild) => (
                <TouchableOpacity key={guild.id} style={styles.listCard}>
                  <View style={styles.listIconBox}><MaterialCommunityIcons name={guild.icon as any} size={24} color={guild.color} /></View>
                  <View style={styles.listContent}><Text style={styles.listName}>{guild.name}</Text><Text style={styles.listMeta}>Lv. {guild.level} • {guild.members} members</Text></View>
                  <Ionicons name="chevron-forward" size={20} color={KARELA.color.textFaint} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.createBtn}><Ionicons name="add-circle-outline" size={20} color={KARELA.color.textMuted} /><Text style={styles.createBtnText}>ESTABLISH NEW GUILD</Text></TouchableOpacity>
            </>
          )}
        </ScrollView>
        <DynamicDock />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KARELA.color.bg },
  mainWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: KARELA.space.xl, paddingBottom: 140 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15, marginBottom: 25 },
  headerTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1 + 4, fontFamily: KARELA.font.black, letterSpacing: 2 },
  headerSubtitle: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, letterSpacing: 1, marginTop: -4 },
  menuButton: { padding: KARELA.space.sm, backgroundColor: "rgba(124, 242, 5, 0.1)", borderRadius: KARELA.radius.sm },
  sectionLabel: { color: "rgba(255,255,255,0.4)", fontSize: KARELA.size.caption, fontFamily: KARELA.font.black, letterSpacing: 1.5, marginBottom: KARELA.space.md },
  activeGuildCard: { borderRadius: KARELA.radius.lg, padding: KARELA.space.xl, borderWidth: 1, borderColor: "rgba(124, 242, 5, 0.2)", marginBottom: 30 },
  activeGuildCardExpanded: { borderColor: KARELA.color.brand },
  guildMainInfo: { flexDirection: "row", alignItems: "center", marginBottom: KARELA.space.xl },
  guildIconLarge: { width: 70, height: 70, borderRadius: KARELA.radius.md, backgroundColor: KARELA.color.surfaceSoft, justifyContent: "center", alignItems: "center", position: "relative" },
  lvlBadge: { position: "absolute", bottom: -5, right: -5, backgroundColor: KARELA.color.brand, paddingHorizontal: 6, borderRadius: 5 },
  lvlBadgeText: { color: KARELA.color.onBright, fontSize: KARELA.size.caption, fontFamily: KARELA.font.black },
  guildNameContainer: { marginLeft: 15 },
  guildName: { color: KARELA.color.textPrimary, fontSize: 22, fontFamily: KARELA.font.bold },
  guildRankText: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  detailsDesc: { color: KARELA.color.onBright, fontSize: 13, marginBottom: KARELA.space.xl, lineHeight: 18, fontFamily: KARELA.font.medium },
  statsGrid: { flexDirection: "row", borderTopWidth: 1, borderTopColor: KARELA.color.lineSoft, paddingTop: 15 },
  statBox: { flex: 1, alignItems: "center" },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: KARELA.color.lineSoft },
  statVal: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.bold },
  statLab: { color: KARELA.color.textMuted, fontSize: 9, marginTop: 2, fontFamily: KARELA.font.bold },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  viewAllText: { color: KARELA.color.brand, fontSize: KARELA.size.caption, fontFamily: KARELA.font.bold, marginBottom: KARELA.space.md },
  listCard: { flexDirection: "row", backgroundColor: KARELA.color.surfaceAlt, borderRadius: KARELA.radius.md, padding: KARELA.space.md, alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: KARELA.color.lineSoft },
  listIconBox: { width: 45, height: 45, borderRadius: 10, backgroundColor: KARELA.color.surfaceSoft, justifyContent: "center", alignItems: "center" },
  listContent: { flex: 1, marginLeft: KARELA.space.md },
  listName: { color: KARELA.color.textPrimary, fontSize: 15, fontFamily: KARELA.font.bold },
  listMeta: { color: KARELA.color.textFaint, fontSize: 11, fontFamily: KARELA.font.regular, marginTop: 2 },
  createBtn: { marginTop: 15, padding: KARELA.space.xl, borderRadius: KARELA.radius.md, borderStyle: "dashed", borderWidth: 1, borderColor: KARELA.color.surfaceSoft, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  createBtnText: { color: KARELA.color.textFaint, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold, letterSpacing: 1 },
  missionSection: { marginTop: 10 },
  missionCard: { backgroundColor: KARELA.color.surfaceAlt, padding: 15, borderRadius: KARELA.radius.md, marginBottom: KARELA.space.md, borderWidth: 1, borderColor: "transparent" },
  missionCardActive: { borderColor: "rgba(124, 242, 5, 0.3)", backgroundColor: KARELA.color.surfaceAlt },
  missionInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  missionReward: { color: KARELA.color.brand, fontSize: 11, fontFamily: KARELA.font.bold },
  progressTrack: { height: 6, backgroundColor: KARELA.color.surfaceSoft, borderRadius: 3, marginVertical: KARELA.space.md },
  progressTrackMini: { height: 2, backgroundColor: KARELA.color.surfaceSoft, borderRadius: 1, marginTop: 10 },
  progressFill: { height: "100%", backgroundColor: KARELA.color.brand, borderRadius: 3 },
  missionGoal: { color: KARELA.color.textFaint, fontSize: KARELA.size.caption, fontFamily: KARELA.font.bold, textAlign: "right", marginBottom: 15 },
  expandedMissionContent: { marginTop: 10, borderTopWidth: 1, borderTopColor: KARELA.color.lineSoft, paddingTop: 10 },
  poiRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 },
  poiText: { color: KARELA.color.brand, fontSize: 11, fontFamily: KARELA.font.bold },
  intelText: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, lineHeight: 18, marginBottom: 10 },
  rewardGrid: { flexDirection: "row", gap: 10, marginBottom: 15 },
  rewardItem: { backgroundColor: KARELA.color.bg, padding: KARELA.space.sm, borderRadius: KARELA.space.sm, flex: 1, alignItems: "center" },
  rewardVal: { color: KARELA.color.textPrimary, fontSize: 11, fontFamily: KARELA.font.bold },
  rewardLab: { color: KARELA.color.textFaint, fontSize: 8, fontFamily: KARELA.font.black },
  submitButton: { backgroundColor: KARELA.color.brand, padding: KARELA.space.lg, borderRadius: 10, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: KARELA.space.sm },
  submitButtonText: { color: KARELA.color.onBright, fontSize: 11, fontFamily: KARELA.font.black },
  rosterBtn: { marginTop: 10, padding: 15, alignItems: "center" },
  rosterBtnText: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.black, letterSpacing: 1 },
});
