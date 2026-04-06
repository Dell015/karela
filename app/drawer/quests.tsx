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
      <Line
        x1="0"
        y1="20"
        x2="100%"
        y2="20"
        stroke="#3A3A3C"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <Line
        x1="0"
        y1="50"
        x2="100%"
        y2="50"
        stroke="#3A3A3C"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <Path
        d="M0 60 Q 30 20, 60 45 T 120 35 T 180 55 T 240 30 T 300 40"
        fill="none"
        stroke="#7CF205"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
    <View style={styles.chartLabels}>
      {["1k", "2k", "3k", "4k", "5k"].map((l) => (
        <Text key={l} style={styles.chartLabelText}>
          {l}
        </Text>
      ))}
    </View>
  </View>
);

const ProgressCircle = ({
  progress,
  size,
  strokeWidth = 5,
  color = "#7CF205",
}: any) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 1500 });
  }, [progress]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2C2C2E"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

export default function QuestsScreen() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<"Standard" | "Limited">(
    "Standard",
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);

  const transition = useSharedValue(0);
  useEffect(() => {
    transition.value = withTiming(activeTab === "Standard" ? 0 : 1, {
      duration: 300,
    });
  }, [activeTab]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: transition.value * ((width - 62) / 2) }],
  }));

  const openDetails = (title: string, xp: string) => {
    setSelectedQuest({
      title,
      xp,
      rec: "Focus on high-intensity intervals. Keep your back straight and breathe through your nose, Sander.",
    });
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Quests</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: "#7CF205" }]} />
              <Text style={styles.statusText}>
                Connected: Sander's Airpods Pro 2
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Ionicons name="notifications" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* --- FLOATING TOGGLE PILL --- */}
        <View style={styles.tabContainer}>
          <Animated.View
            style={[
              styles.animatedPill,
              { width: (width - 62) / 2 },
              animatedPillStyle,
            ]}
          >
            <LinearGradient
              colors={["#32D74B", "#248A3D"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab("Standard")}
            activeOpacity={1}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "Standard" ? "white" : "#7CF205" },
              ]}
            >
              Standard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab("Limited")}
            activeOpacity={1}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "Limited" ? "white" : "#7CF205" },
              ]}
            >
              Limited
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Daily Missions</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          <QuestCard
            title="Morning 5km Run"
            xp="150xp"
            progress={0.7}
            onDetails={() => openDetails("Morning 5km Run", "150xp")}
          />
          <QuestCard
            title="Sprint Intervals"
            xp="200xp"
            progress={0.3}
            onDetails={() => openDetails("Sprint Intervals", "200xp")}
          />
        </ScrollView>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Weekly Summary</Text>
            <TouchableOpacity
              onPress={() => router.push("/drawer/calendar")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.daysRow}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <View key={day} style={styles.dayItem}>
                <View
                  style={[styles.circleBase, i < 2 && styles.circleActive]}
                />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsRow}>
          <View style={styles.achievementCard}>
            <MaterialCommunityIcons name="trophy" size={40} color="#3A3A3C" />
            <Text style={styles.achievementLabel}>First 5K</Text>
          </View>
          <View style={styles.achievementCard}>
            <MaterialCommunityIcons name="fire" size={40} color="#3A3A3C" />
            <Text style={styles.achievementLabel}>7 Day Streak</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.modalContent}
          >
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>
              {selectedQuest?.title} Analysis
            </Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailBox}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={24}
                  color="#7CF205"
                />
                <Text style={styles.detailValue}>{selectedQuest?.xp}</Text>
                <Text style={styles.detailLabel}>Reward</Text>
              </View>
              <View style={styles.detailBox}>
                <MaterialCommunityIcons name="fire" size={24} color="#FF453A" />
                <Text style={styles.detailValue}>340 kcal</Text>
                <Text style={styles.detailLabel}>Burned</Text>
              </View>
            </View>
            <PaceChart />
            <View style={styles.recContainer}>
              <View style={styles.coachHeader}>
                <MaterialCommunityIcons
                  name="account-tie-voice"
                  size={20}
                  color="#7CF205"
                />
                <Text style={styles.recTitle}>Karela's Advice</Text>
              </View>
              <Text style={styles.recText}>"{selectedQuest?.rec}"</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const QuestCard = ({ title, xp, progress, onDetails }: any) => (
  <View style={styles.questCard}>
    <View style={styles.cardTop}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardSub}>Daily Running</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.xpTextSmall}>{xp}</Text>
      </View>
      <ProgressCircle progress={progress} size={50} />
    </View>
    <View style={styles.cardButtons}>
      <TouchableOpacity style={{ flex: 2 }}>
        <LinearGradient colors={["#32D74B", "#248A3D"]} style={styles.trackBtn}>
          <Text style={styles.btnText}>Track</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity style={styles.detailsBtn} onPress={onDetails}>
        <Text style={styles.btnText}>Details</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scrollContent: { padding: 25 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: { fontSize: 38, fontWeight: "bold", color: "white" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: "#8E8E93", fontSize: 12 },
  bellButton: { backgroundColor: "#1C1C1E", padding: 12, borderRadius: 25 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 32,
    padding: 6,
    marginBottom: 35,
    position: "relative",
    height: 64,
  },
  animatedPill: {
    position: "absolute",
    top: 6,
    left: 6,
    bottom: 6,
    borderRadius: 26,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 18,
  },
  horizontalScroll: { marginBottom: 35 },
  questCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 28,
    padding: 22,
    width: 280,
    marginRight: 15,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardSub: { color: "#8E8E93", fontSize: 11 },
  cardTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 4,
  },
  xpTextSmall: { color: "#7CF205", fontSize: 10, fontWeight: "600" },
  cardButtons: { flexDirection: "row", gap: 10 },
  trackBtn: { paddingVertical: 12, borderRadius: 22, alignItems: "center" },
  detailsBtn: {
    backgroundColor: "#3A3A3C",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  btnText: { color: "white", fontSize: 12, fontWeight: "bold" },
  summaryContainer: {
    backgroundColor: "#1C1C1E",
    borderRadius: 28,
    padding: 24,
    marginBottom: 35,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  viewAllText: { color: "#8E8E93", fontSize: 12 },
  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayItem: { alignItems: "center" },
  circleBase: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2C2C2E",
  },
  circleActive: { borderColor: "#7CF205" },
  dayLabel: { color: "#8E8E93", fontSize: 10, marginTop: 8 },
  achievementsRow: { flexDirection: "row", gap: 15 },
  achievementCard: {
    flex: 1,
    height: 160,
    backgroundColor: "#1C1C1E",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementLabel: { color: "#8E8E93", fontSize: 12, marginTop: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: 520,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#3A3A3C",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
  },
  detailsGrid: { flexDirection: "row", gap: 15, marginBottom: 20 },
  detailBox: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  detailValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  detailLabel: { color: "#8E8E93", fontSize: 12 },
  chartWrapper: {
    backgroundColor: "#2C2C2E",
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
  },
  chartTitle: {
    color: "#8E8E93",
    fontSize: 12,
    marginBottom: 10,
    fontWeight: "600",
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  chartLabelText: { color: "#48484A", fontSize: 10, fontWeight: "bold" },
  recContainer: {
    backgroundColor: "rgba(124, 242, 5, 0.05)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(124, 242, 5, 0.1)",
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  recTitle: { color: "#7CF205", fontWeight: "bold", fontSize: 14 },
  recText: { color: "#E5E5EA", lineHeight: 20, fontStyle: "italic" },
  closeBtn: {
    backgroundColor: "#2C2C2E",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  closeBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
