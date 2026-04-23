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
import { Stack, useRouter } from "expo-router";
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [statsArray, setStatsArray] = useState<AggregatedStats[]>([]);
  const [realChartData, setRealChartData] = useState<
    { timestamp: number; value: number }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      // Pulls fresh calculations from SQLite
      setStatsArray(getDynamicStats());
      setRealChartData(getChartData());
    }, [profile]),
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    setActiveIndex(index);
  };

  const renderStats = ({ item }: { item: AggregatedStats }) => {
    return (
      <View style={ProgressScreenUI.statsSlide}>
        <View style={ProgressScreenUI.row}>
          <Text style={ProgressScreenUI.sectionTitle}>
            {item.title} Statistics
          </Text>
          <View style={ProgressScreenUI.activeIndicator}>
            <View
              style={[ProgressScreenUI.dot, { backgroundColor: "#7CF205" }]}
            />
            <Text style={ProgressScreenUI.activeIndicatorText}>
              TELEMETRY ACTIVE
            </Text>
          </View>
        </View>

        <View style={ProgressScreenUI.statsGrid}>
          {/* Main Distance Card */}
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

          {/* Right Column Metrics */}
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
  };

  return (
    <ScrollView
      style={ProgressScreenUI.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />

      {/* Custom Header */}
      <View style={ProgressScreenUI.header}>
        <TouchableOpacity
          style={ProgressScreenUI.backButton}
          onPress={() => router.replace("/drawer/dashboard")}
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

      {/* RPG Profile Section (Still uses Firebase for XP/Level) */}
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

        {/* XP Bar Progress */}
        <View
          style={{
            width: "60%",
            height: 6,
            backgroundColor: "#111",
            borderRadius: 3,
            marginTop: 10,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${Math.min((profile?.stats?.xp || 0) / 10, 100)}%`,
              height: "100%",
              backgroundColor: "#7CF205",
            }}
          />
        </View>

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

      {/* Paging Stats (SQLite Driven) */}
      <FlatList
        data={statsArray}
        renderItem={renderStats}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
      />

      {/* Page Dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        {statsArray.map((_, i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIndex === i ? "#7CF205" : "#222",
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>

      {/* Performance Preview Chart */}
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
                No mission history yet
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
