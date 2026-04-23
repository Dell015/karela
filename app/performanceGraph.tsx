import { useAuth } from "@/context/AuthContext";
import { getChartData } from "@/services/statsService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-wagmi-charts";

const { width } = Dimensions.get("window");

export default function PerformanceGraph() {
  const router = useRouter();
  const { profile } = useAuth();
  const [data, setData] = useState<{ timestamp: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const result = getChartData();
      setData(result);
      setLoading(false);
    };
    loadData();
  }, []);

  const totalKm = data.reduce((acc, curr) => acc + curr.value, 0);
  const avgDist = data.length > 0 ? (totalKm / data.length).toFixed(2) : "0.00";

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color="#7CF205" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Activity Analysis</Text>
          <Text style={styles.userSubtitle}>
            @{profile?.username || "strider"}
          </Text>
        </View>
        <View style={styles.avatarMini}>
          <Text style={styles.avatarText}>
            {(profile?.username?.[0] || "S").toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.chartWrapper}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartSubtitle}>Total Progress</Text>
              <View style={styles.mainValueRow}>
                <Text style={styles.chartMainValue}>{totalKm.toFixed(2)}</Text>
                <Text style={styles.mainUnit}>KM</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{data.length} SESSIONS</Text>
            </View>
          </View>

          {data.length > 1 ? (
            <LineChart.Provider data={data}>
              <LineChart height={220} width={width - 80} yGutter={20}>
                <LineChart.Path color="#7CF205" width={3}>
                  <LineChart.Gradient color="#7CF205" opacity={0.15} />
                </LineChart.Path>
                <LineChart.CursorCrosshair color="#7CF205">
                  <LineChart.Tooltip style={styles.tooltipContainer}>
                    <LineChart.PriceText
                      style={styles.tooltipValue}
                      format={({ value }) => {
                        "worklet";
                        return `${parseFloat(value).toFixed(2)} KM`;
                      }}
                    />
                    <LineChart.DatetimeText
                      style={styles.tooltipDate}
                      options={{
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }}
                    />
                  </LineChart.Tooltip>
                </LineChart.CursorCrosshair>
              </LineChart>
            </LineChart.Provider>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="radar"
                size={40}
                color="#7CF205"
                style={{ opacity: 0.2 }}
              />
              <Text style={styles.emptyText}>
                Insufficient data for mission telemetry
              </Text>
            </View>
          )}

          <View style={styles.xAxis}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <Text key={i} style={styles.axisText}>
                {day}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="map-marker-distance"
            label="Avg Session"
            value={avgDist}
            unit="km"
            color="#7CF205"
          />
          <MetricCard
            icon="fire"
            label="Energy"
            value={Math.floor(totalKm * 60)}
            unit="kcal"
            color="#FF453A"
          />
          <MetricCard
            icon="account-clock"
            label="Sessions"
            value={data.length}
            unit="total"
            color="#0A84FF"
          />
          <MetricCard
            icon="trophy-outline"
            label="Wins"
            value={profile?.stats?.ghostWins || 0}
            unit="pts"
            color="#BF5AF2"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MetricCard({ icon, label, value, unit, color }: any) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardUnit}> {unit}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { backgroundColor: "#111", padding: 10, borderRadius: 14 },
  headerTitle: { color: "white", fontSize: 16, fontWeight: "900" },
  userSubtitle: { color: "#7CF205", fontSize: 12, fontWeight: "600" },
  avatarMini: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  avatarText: { color: "white", fontWeight: "bold" },
  content: { flex: 1, paddingHorizontal: 20 },
  chartWrapper: {
    backgroundColor: "#0A0A0A",
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginVertical: 15,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  chartSubtitle: { color: "#8E8E93", fontSize: 12, fontWeight: "700" },
  mainValueRow: { flexDirection: "row", alignItems: "baseline" },
  chartMainValue: { color: "white", fontSize: 34, fontWeight: "900" },
  mainUnit: { color: "#444", fontSize: 16, fontWeight: "900", marginLeft: 6 },
  badge: {
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    paddingHorizontal: 10,
    height: 24,
    justifyContent: "center",
    borderRadius: 8,
  },
  badgeText: { color: "#7CF205", fontSize: 9, fontWeight: "900" },
  tooltipContainer: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#7CF205",
    alignItems: "center",
  },
  tooltipValue: { color: "white", fontSize: 18, fontWeight: "900" },
  tooltipDate: { color: "#8E8E93", fontSize: 10, marginTop: 4 },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  axisText: { color: "#333", fontSize: 10, fontWeight: "900" },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#0A0A0A",
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 26,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLabel: { color: "#8E8E93", fontSize: 12, fontWeight: "700" },
  cardValue: { color: "white", fontSize: 22, fontWeight: "900" },
  cardUnit: { color: "#444", fontSize: 12, fontWeight: "700" },
  emptyState: { height: 220, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#444", marginTop: 10, fontWeight: "600", fontSize: 12 },
});
