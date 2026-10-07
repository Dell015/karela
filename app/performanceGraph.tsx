import { Screen } from "@/components/ui/Screen";
import { KARELA } from "@/styles/designSystem";
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
      <Screen variant="aurora">
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color={KARELA.color.brand} size="large" />
      </View>
      </Screen>
    );
  }

  return (
    <Screen variant="aurora">
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={KARELA.color.textPrimary} />
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
                <LineChart.Path color={KARELA.color.brand} width={3}>
                  <LineChart.Gradient color={KARELA.color.brand} opacity={0.15} />
                </LineChart.Path>
                <LineChart.CursorCrosshair color={KARELA.color.brand}>
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
                color={KARELA.color.brand}
                style={{ opacity: 0.2 }}
              />
              <Text style={styles.emptyText}>
                Not enough runs yet. Finish a few runs to see your graph.
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
            color={KARELA.color.brand}
          />
          <MetricCard
            icon="fire"
            label="Energy"
            value={Math.floor(totalKm * 60)}
            unit="kcal"
            color={KARELA.color.danger}
          />
          <MetricCard
            icon="account-clock"
            label="Sessions"
            value={data.length}
            unit="total"
            color={KARELA.vibrant.sky}
          />
          <MetricCard
            icon="trophy-outline"
            label="Wins"
            value={profile?.stats?.ghostWins || 0}
            unit="pts"
            color={KARELA.vibrant.neonTeal}
          />
        </View>
      </View>
    </SafeAreaView>
    </Screen>
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
  container: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { backgroundColor: KARELA.color.surface, padding: 10, borderRadius: 14 },
  headerTitle: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.black },
  userSubtitle: { color: KARELA.color.brand, fontSize: 12, fontFamily: KARELA.font.medium },
  avatarMini: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: KARELA.color.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: KARELA.color.line,
  },
  avatarText: { color: KARELA.color.textPrimary, fontFamily: KARELA.font.bold },
  content: { flex: 1, paddingHorizontal: 20 },
  chartWrapper: {
    backgroundColor: KARELA.color.surface,
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
    marginVertical: 15,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  chartSubtitle: { color: KARELA.color.textMuted, fontSize: 12, fontFamily: KARELA.font.bold },
  mainValueRow: { flexDirection: "row", alignItems: "baseline" },
  chartMainValue: { color: KARELA.color.textPrimary, fontSize: 34, fontFamily: KARELA.font.black },
  mainUnit: { color: KARELA.color.textMuted, fontSize: 16, fontFamily: KARELA.font.black, marginLeft: 6 },
  badge: {
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    paddingHorizontal: 10,
    height: 24,
    justifyContent: "center",
    borderRadius: 8,
  },
  badgeText: { color: KARELA.color.brand, fontSize: KARELA.size.caption, fontFamily: KARELA.font.black },
  tooltipContainer: {
    backgroundColor: KARELA.color.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KARELA.color.brand,
    alignItems: "center",
  },
  tooltipValue: { color: KARELA.color.textPrimary, fontSize: 18, fontFamily: KARELA.font.black },
  tooltipDate: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, marginTop: 4 },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  axisText: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.black },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: KARELA.color.surface,
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 26,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLabel: { color: KARELA.color.textMuted, fontSize: 12, fontFamily: KARELA.font.bold },
  cardValue: { color: KARELA.color.textPrimary, fontSize: 22, fontFamily: KARELA.font.black },
  cardUnit: { color: KARELA.color.textMuted, fontSize: 12, fontFamily: KARELA.font.bold },
  emptyState: { height: 220, justifyContent: "center", alignItems: "center" },
  emptyText: { color: KARELA.color.textMuted, marginTop: 10, fontFamily: KARELA.font.medium, fontSize: 12 },
});
