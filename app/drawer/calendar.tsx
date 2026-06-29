import { KARELA } from "@/styles/designSystem";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PaceChart = () => (
  <View style={styles.chartWrapper}>
    <Text style={styles.chartTitle}>Pace Consistency (min/km)</Text>
    <Svg height="80" width="100%">
      <Line x1="0" y1="20" x2="100%" y2="20" stroke="#3A3A3C" strokeWidth="1" strokeDasharray="4 4" />
      <Line x1="0" y1="50" x2="100%" y2="50" stroke="#3A3A3C" strokeWidth="1" strokeDasharray="4 4" />
      <Path d="M0 60 Q 30 20, 60 45 T 120 35 T 180 55 T 240 30 T 300 40" fill="none" stroke={KARELA.color.brand} strokeWidth="3" strokeLinecap="round" />
    </Svg>
    <View style={styles.chartLabels}>
      {["1k", "2k", "3k", "4k", "5k"].map((l) => (
        <Text key={l} style={styles.chartLabelText}>{l}</Text>
      ))}
    </View>
  </View>
);

const ProgressCircle = ({ progress, size, date, strokeWidth = 5, color = KARELA.color.brand }: any) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  useEffect(() => { animatedProgress.value = withTiming(progress, { duration: 1000 }); }, [progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - animatedProgress.value) }));

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#2C2C2E" strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" />
      </Svg>
      {date && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold }}>{date}</Text>
        </View>
      )}
    </View>
  );
};

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const [viewType, setViewType] = useState("Weekly");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);

  const today = 11;
  const currentStreak = 5;
  const transition = useSharedValue(1);
  const GRID_SPACING = 12;
  const DAY_SIZE = (width - 50 - GRID_SPACING * 6) / 7;

  const handleToggle = (type: string, index: number) => {
    setViewType(type);
    transition.value = withTiming(index, { duration: 300 });
  };

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: transition.value * ((width - 62) / 3) }],
  }));

  const openDetails = (title: string, dist: string, type: string) => {
    const recommendations = type === "Daily"
      ? "Focus on high-intensity intervals. Karela noticed you're on a streak—keep that momentum!"
      : "Maintain a steady heart rate. Your consistency is paying off. Hydrate well, Sander.";
    setSelectedQuest({ title, dist, rec: recommendations, type });
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.View entering={FadeInUp.duration(500)} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Calendar</Text>
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: KARELA.color.brand }]} />
                <Text style={styles.statusText}>Connected: Sander's Airpods Pro 2</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Ionicons name="notifications" size={24} color={KARELA.color.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <Animated.View style={[styles.animatedPill, animatedPillStyle]}>
              <LinearGradient colors={KARELA.gradients.brand as unknown as string[]} style={StyleSheet.absoluteFill} />
            </Animated.View>
            {["Daily", "Weekly", "Monthly"].map((type, i) => (
              <TouchableOpacity key={type} style={styles.tabButton} onPress={() => handleToggle(type, i)} activeOpacity={1}>
                <Text style={[styles.tabText, { color: viewType === type ? KARELA.color.textPrimary : KARELA.color.textMuted }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {viewType === "Monthly" ? (
            <View style={styles.modernMonthContainer}>
              <View style={styles.monthHeaderRow}>
                <View>
                  <Text style={styles.monthName}>February</Text>
                  <Text style={styles.yearName}>2026</Text>
                </View>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={16} color={KARELA.vibrant.techOrange} />
                  <Text style={styles.streakText}>{currentStreak} Day Streak</Text>
                </View>
              </View>
              <View style={styles.weekdayRow}>
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <Text key={i} style={styles.weekdayLabel}>{day}</Text>
                ))}
              </View>
              <View style={styles.modernGrid}>
                {Array.from({ length: 28 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === today;
                  const hasActivity = dayNum < today;
                  return (
                    <TouchableOpacity key={i} style={[styles.modernDayBox, { width: DAY_SIZE, height: DAY_SIZE }, isToday && styles.todayActiveBox, hasActivity && styles.activityDotBox]}>
                      <Text style={[styles.modernDayText, isToday && styles.todayActiveText, !isToday && !hasActivity && { color: "#48484A" }]}>{dayNum}</Text>
                      {hasActivity && !isToday && <View style={styles.smallActivityIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>History Overview</Text>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.viewAllText}>Dashboard</Text></TouchableOpacity>
              </View>
              <View style={styles.daysRow}>
                {[9, 10, 11, 12, 13, 14, 15].map((d, i) => (
                  <View key={d} style={styles.dayItem}>
                    <ProgressCircle progress={d <= today ? 1 : 0} size={38} date={d} />
                    <Text style={styles.dayLabel}>{["M", "T", "W", "T", "F", "S", "S"][i]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{viewType} Focus</Text></View>
          <NewQuestCard
            title={viewType === "Daily" ? "Morning 5km" : "15km Endurance"}
            distance={viewType === "Daily" ? "3.2/5 km" : "11.5/15 km"}
            time={viewType === "Daily" ? "24:12" : "1:12:04"}
            progress={0.64}
            onDetails={() => openDetails(viewType === "Daily" ? "Morning 5km" : "Running Milestone", "Analysis Ready", viewType)}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{selectedQuest?.title} Analysis</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailBox}>
                <MaterialCommunityIcons name="run-fast" size={24} color={KARELA.color.brand} />
                <Text style={styles.detailValue}>3.2km</Text>
                <Text style={styles.detailLabel}>Distance</Text>
              </View>
              <View style={styles.detailBox}>
                <MaterialCommunityIcons name="fire" size={24} color={KARELA.color.danger} />
                <Text style={styles.detailValue}>340 kcal</Text>
                <Text style={styles.detailLabel}>Burned</Text>
              </View>
            </View>
            <PaceChart />
            <View style={styles.recContainer}>
              <View style={styles.coachHeader}>
                <MaterialCommunityIcons name="account-tie-voice" size={20} color={KARELA.color.brand} />
                <Text style={styles.recTitle}>Karela's Advice</Text>
              </View>
              <Text style={styles.recText}>"{selectedQuest?.rec}"</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const NewQuestCard = ({ title, distance, time, progress, onDetails }: any) => (
  <View style={styles.newCard}>
    <View style={styles.cardHeaderRow}>
      <View>
        <Text style={styles.newCardTitle}>{title}</Text>
        <Text style={styles.newCardSub}>Goal: {distance}</Text>
      </View>
      <View style={styles.timeTag}>
        <Ionicons name="time-outline" size={14} color={KARELA.color.brand} />
        <Text style={styles.timeTagText}>{time}</Text>
      </View>
    </View>
    <View style={styles.progressSection}>
      <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} /></View>
      <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
    </View>
    <View style={styles.buttonRow}>
      <TouchableOpacity style={styles.detailsBtn} onPress={onDetails}><Text style={styles.detailsBtnText}>Details</Text></TouchableOpacity>
      <TouchableOpacity style={styles.fullTrackBtn}>
        <LinearGradient colors={KARELA.gradients.brand as unknown as string[]} style={styles.gradientBtn}>
          <Text style={styles.trackBtnText}>Track Progress</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KARELA.color.bg },
  scrollContent: { padding: 25 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  headerTitle: { fontSize: 38, fontFamily: KARELA.font.bold, color: KARELA.color.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  bellButton: { backgroundColor: KARELA.color.surface, padding: KARELA.space.md, borderRadius: 25 },
  tabContainer: { flexDirection: "row", backgroundColor: KARELA.color.surface, borderRadius: 22, padding: 6, marginBottom: 35, position: "relative" },
  animatedPill: { position: "absolute", top: 6, left: 6, bottom: 6, borderRadius: KARELA.radius.lg, overflow: "hidden", width: "31%" },
  tabButton: { flex: 1, paddingVertical: KARELA.space.lg, alignItems: "center", justifyContent: "center", zIndex: 1 },
  tabText: { fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  summaryContainer: { backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.xl, padding: 22, marginBottom: 35 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: KARELA.space.xl },
  summaryTitle: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.medium },
  viewAllText: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayItem: { alignItems: "center" },
  dayLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: KARELA.space.sm },
  sectionHeader: { marginBottom: KARELA.space.xl },
  sectionTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.bold },
  newCard: { backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.xl, padding: KARELA.space.xl, marginBottom: KARELA.space.lg },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 },
  newCardTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.space.xl, fontFamily: KARELA.font.bold },
  newCardSub: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  timeTag: { flexDirection: "row", alignItems: "center", backgroundColor: KARELA.color.surfaceSoft, paddingHorizontal: 10, paddingVertical: KARELA.space.xs, borderRadius: KARELA.radius.sm },
  timeTagText: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  progressSection: { flexDirection: "row", alignItems: "center", marginBottom: KARELA.space.xl },
  progressBarBg: { flex: 1, height: 6, backgroundColor: KARELA.color.surfaceSoft, borderRadius: 3 },
  progressBarFill: { height: "100%", backgroundColor: KARELA.color.brand, borderRadius: 3 },
  percentText: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold, marginLeft: KARELA.space.md },
  buttonRow: { flexDirection: "row", gap: 10 },
  detailsBtn: { flex: 1, backgroundColor: KARELA.color.surfaceSoft, borderRadius: KARELA.radius.lg, justifyContent: "center", alignItems: "center" },
  detailsBtnText: { color: KARELA.color.textMuted, fontFamily: KARELA.font.bold },
  fullTrackBtn: { flex: 2.5 },
  gradientBtn: { paddingVertical: KARELA.space.lg, borderRadius: KARELA.radius.lg, alignItems: "center" },
  trackBtnText: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.bold },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: KARELA.color.surface, borderTopLeftRadius: KARELA.radius.xl, borderTopRightRadius: KARELA.radius.xl, padding: 25, minHeight: 520 },
  handle: { width: 40, height: 5, backgroundColor: KARELA.color.surfaceSoft, borderRadius: 3, alignSelf: "center", marginBottom: KARELA.space.xl },
  modalTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.bold, marginBottom: 25 },
  detailsGrid: { flexDirection: "row", gap: 15, marginBottom: KARELA.space.xl },
  detailBox: { flex: 1, backgroundColor: KARELA.color.surfaceSoft, padding: 15, borderRadius: KARELA.radius.lg, alignItems: "center" },
  detailValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold, marginTop: 5 },
  detailLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  chartWrapper: { backgroundColor: KARELA.color.surfaceSoft, padding: 15, borderRadius: KARELA.radius.lg, marginBottom: KARELA.space.xl },
  chartTitle: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginBottom: 10 },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  chartLabelText: { color: KARELA.color.textFaint, fontSize: KARELA.size.caption, fontFamily: KARELA.font.bold },
  recContainer: { backgroundColor: "rgba(124, 242, 5, 0.05)", padding: KARELA.space.xl, borderRadius: KARELA.radius.lg, marginBottom: 25, borderWidth: 1, borderColor: "rgba(124, 242, 5, 0.1)" },
  coachHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: KARELA.space.sm },
  recTitle: { color: KARELA.color.brand, fontFamily: KARELA.font.bold, fontSize: KARELA.size.body },
  recText: { color: KARELA.color.textSecondary, fontFamily: KARELA.font.regular, lineHeight: 20, fontStyle: "italic" },
  closeBtn: { backgroundColor: KARELA.color.surfaceSoft, paddingVertical: KARELA.space.lg, borderRadius: KARELA.radius.lg, alignItems: "center" },
  closeBtnText: { color: KARELA.color.textPrimary, fontFamily: KARELA.font.bold, fontSize: 16 },
  modernMonthContainer: { backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.xl + 2, padding: KARELA.space.xl, marginBottom: 35, borderWidth: 1, borderColor: KARELA.color.surfaceSoft },
  monthHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  monthName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.bold },
  yearName: { color: KARELA.color.textMuted, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular },
  streakBadge: { backgroundColor: "rgba(255, 149, 0, 0.1)", paddingHorizontal: KARELA.space.md, paddingVertical: 6, borderRadius: KARELA.radius.sm, flexDirection: "row", alignItems: "center", gap: 6 },
  streakText: { color: KARELA.vibrant.techOrange, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  weekdayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  weekdayLabel: { flex: 1, textAlign: "center", color: KARELA.color.textFaint, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  modernGrid: { flexDirection: "row", flexWrap: "wrap", gap: KARELA.space.md },
  modernDayBox: { justifyContent: "center", alignItems: "center", borderRadius: KARELA.radius.md },
  modernDayText: { color: KARELA.color.textPrimary, fontSize: 15, fontFamily: KARELA.font.medium },
  todayActiveBox: { backgroundColor: KARELA.color.brand },
  todayActiveText: { color: KARELA.color.onBright },
  activityDotBox: { backgroundColor: KARELA.color.surfaceSoft },
  smallActivityIndicator: { position: "absolute", bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: KARELA.color.brand },
});
