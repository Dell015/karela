import { useAuth } from "@/context/AuthContext";
import {
  AggregatedStats,
  getChartData,
  getDynamicStats,
} from "@/services/statsService";
import { ProgressScreenUI } from "@/styles/progressScreenStyle";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router"; // Added Stack
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-wagmi-charts";

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  // States
  const [activeIndex, setActiveIndex] = useState(0);
  const [statsArray, setStatsArray] = useState<AggregatedStats[]>([]);
  const [realChartData, setRealChartData] = useState<
    { timestamp: number; value: number }[]
  >([]);

  // useFocusEffect ensures data refreshes every time the screen is viewed
  useFocusEffect(
    useCallback(() => {
      // 1. Load Aggregated Stats (Daily/Weekly/Monthly)
      // Note: getDynamicStats now handles the streak logic internally via statsService
      const localData = getDynamicStats();
      setStatsArray(localData);

      // 2. Load Real Database Chart Data
      const dbChart = getChartData();
      setRealChartData(dbChart);

      return () => {};
    }, [profile]),
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    setActiveIndex(index);
  };

  const renderStats = ({ item }: { item: AggregatedStats }) => (
    <View style={ProgressScreenUI.statsSlide}>
      <View style={ProgressScreenUI.row}>
        <Text style={ProgressScreenUI.sectionTitle}>
          {item.title} Statistics
        </Text>
        <View
          style={[
            ProgressScreenUI.activeIndicator,
            { height: 22, justifyContent: "center" },
          ]}
        >
          <Text style={ProgressScreenUI.activeIndicatorText}>LIVE DATA</Text>
        </View>
      </View>

      <View style={ProgressScreenUI.statsGrid}>
        <View style={[ProgressScreenUI.statCard, ProgressScreenUI.bigCard]}>
          <Text style={ProgressScreenUI.statLabel}>Distance</Text>
          <Text style={ProgressScreenUI.statValue}>{item.distance} km</Text>
          <Ionicons
            name="location"
            size={28}
            color="#7CF205"
            style={ProgressScreenUI.statIcon}
          />
        </View>
        <View style={ProgressScreenUI.statsRightCol}>
          <View style={ProgressScreenUI.statCardRow}>
            <View style={ProgressScreenUI.smallCard}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={18}
                color="#FFD700"
              />
              <View>
                <Text style={ProgressScreenUI.statLabelSmall}>Streak</Text>
                <Text style={ProgressScreenUI.statValueSmall}>
                  {item.streak} d
                </Text>
              </View>
            </View>
            <View style={ProgressScreenUI.smallCard}>
              <MaterialCommunityIcons name="fire" size={18} color="#FF5A00" />
              <View>
                <Text style={ProgressScreenUI.statLabelSmall}>Burned</Text>
                <Text style={ProgressScreenUI.statValueSmall}>
                  {item.burned}
                </Text>
              </View>
            </View>
          </View>
          <View style={ProgressScreenUI.statCardRow}>
            <View style={ProgressScreenUI.smallCard}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <View>
                <Text style={ProgressScreenUI.statLabelSmall}>Wins</Text>
                <Text style={ProgressScreenUI.statValueSmall}>
                  {item.ghostWins}
                </Text>
              </View>
            </View>
            <View style={ProgressScreenUI.smallCard}>
              <MaterialCommunityIcons
                name="shoe-print"
                size={16}
                color="#BF5AF2"
              />
              <View>
                <Text style={ProgressScreenUI.statLabelSmall}>Steps</Text>
                <Text style={ProgressScreenUI.statValueSmall}>
                  {item.steps}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={ProgressScreenUI.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. STACK CONFIG: Disable Swipe-Back Gesture */}
      <Stack.Screen
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />

      {/* 2. CONSISTENT HEADER: BACK ON LEFT, BURGER ON RIGHT */}
      <View style={ProgressScreenUI.header}>
        <TouchableOpacity
          style={ProgressScreenUI.backButton}
          onPress={() => router.push("/drawer/dashboard")}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>

        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
          @{profile?.username || "strider"}
        </Text>

        <TouchableOpacity
          style={ProgressScreenUI.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={32} color="#7CF205" />
        </TouchableOpacity>
      </View>

      {/* PROFILE SECTION */}
      <View style={ProgressScreenUI.profileSection}>
        <View style={ProgressScreenUI.avatarWrapper}>
          <LinearGradient
            colors={["#7CF205", "#209F77"]}
            style={ProgressScreenUI.avatarGradient}
          >
            <Image
              source={{
                uri:
                  profile?.profilePicture || "https://via.placeholder.com/150",
              }}
              style={ProgressScreenUI.avatarImage}
            />
          </LinearGradient>
        </View>
        <Text style={ProgressScreenUI.rankText}>
          LVL {profile?.stats?.level || 1} STRIDER
        </Text>
        <Text style={ProgressScreenUI.xpText}>
          {profile?.stats?.xp || 0}/1000 XP
        </Text>
        <TouchableOpacity style={ProgressScreenUI.rankButton}>
          <LinearGradient
            colors={["#7CF205", "#209F77"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={ProgressScreenUI.gradientButton}
          >
            <Text style={ProgressScreenUI.buttonText}>See Ranks</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* STATS CARDS (Horizontal Swipeable List) */}
      <FlatList
        data={statsArray}
        renderItem={renderStats}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
      />

      {/* PERFORMANCE CHART PREVIEW */}
      <View style={ProgressScreenUI.sectionContainer}>
        <View style={ProgressScreenUI.row}>
          <Text style={ProgressScreenUI.sectionTitle}>Performance Preview</Text>
          <TouchableOpacity onPress={() => router.push("/performanceGraph")}>
            <Text style={ProgressScreenUI.viewDetailsText}>VIEW DETAILS</Text>
          </TouchableOpacity>
        </View>

        <View style={ProgressScreenUI.previewChartWrapper}>
          {realChartData && realChartData.length > 1 ? (
            <LineChart.Provider data={realChartData}>
              <LineChart height={100} width={width - 72} yGutter={10}>
                <LineChart.Path color="#7CF205">
                  <LineChart.Gradient color="#7CF205" opacity={0.1} />
                </LineChart.Path>
                <LineChart.Dot at={0} color="transparent" size={0} />
              </LineChart>
            </LineChart.Provider>
          ) : (
            <View
              style={{
                height: 100,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#444", fontSize: 12 }}>
                {realChartData.length === 1
                  ? "Need more sessions to graph"
                  : "No session history yet"}
              </Text>
            </View>
          )}
          <View style={ProgressScreenUI.daysRow}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <Text key={i} style={ProgressScreenUI.dayLabelMini}>
                {day}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
