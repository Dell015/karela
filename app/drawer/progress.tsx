import { BarChart } from "@/components/charts/BarChart";
import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { RunHistory } from "@/components/RunHistory";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useBuffs } from "@/services/buffs";
import { formatDuration, getRunsSince, lastNDays, RunRow } from "@/services/calendarData";
import {
  analyzeRuns,
  bucketLabel,
  formatKmValue,
  formatPace,
  shortDate,
} from "@/services/runAnalytics";
import { getEffectiveStreak } from "@/services/streakService";
import { KARELA } from "@/styles/designSystem";
import { ProgressScreenUI as ui } from "@/styles/progressScreenStyle";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useNavigation, useRouter } from "expo-router";
import type { DrawerNavigationProp } from "expo-router/drawer";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

const PERIODS = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
];

/** Steps are an estimate from distance (COMPUTATIONS.md). */
const STEPS_PER_KM = 1310;

export default function ProgressScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const buffs = useBuffs();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const level = Number(profile?.stats?.level || 1);
  // XP can read 1000+ for a moment before the level-up lands.
  const levelXP = Math.min(Math.max(0, Number(profile?.stats?.xp || 0)), 1000);
  const uid = profile?.uid;

  // Every finished run from the account (run_history), last 30 days.
  const [runs, setRuns] = useState<RunRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [period, setPeriod] = useState(7);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      let alive = true;
      getRunsSince(uid, lastNDays(30)[0]).then((r) => {
        if (!alive) return;
        setRuns(r ?? []);
        setFailed(r === null);
      });
      return () => {
        alive = false;
      };
    }, [uid]),
  );

  const stats = useMemo(() => (runs ? analyzeRuns(runs, period) : null), [runs, period]);
  const month = useMemo(() => (runs ? analyzeRuns(runs, 30) : null), [runs]);
  const streak = getEffectiveStreak(profile?.stats);

  // Average on the days you ran (rest days aren't failures).
  const activeAvg = month && month.activeDays > 0 ? month.totalKm / month.activeDays : 0;
  const bestIdx = month?.bestBucket ? month.buckets.indexOf(month.bestBucket) : -1;

  return (
    <Screen variant="aurora">
      <ScrollView style={ui.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />

        <View style={ui.header}>
          <IconButton icon="chevron-back" label="Back" onPress={() => router.replace("/drawer/dashboard")} />
          <Text style={ui.headerTitle}>
            {profile?.displayName || (profile?.username ? `@${profile.username}` : "Your progress")}
          </Text>
          <IconButton icon="menu" label="Open menu" onPress={() => navigation.openDrawer()} />
        </View>

        {/* Level and XP (from the account) */}
        <View style={ui.profileSection}>
          <Avatar uri={profile?.profilePicture} name={profile?.displayName} size={120} ring frame={buffs.frame} style={{ marginBottom: 10 }} />
          <Text style={ui.rankText}>Level {level}</Text>
          <Text style={ui.xpText}>
            {levelXP.toLocaleString()} / 1,000 XP, {(1000 - levelXP).toLocaleString()} to level {level + 1}
          </Text>
          <View style={ui.xpTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 1000, now: levelXP }}>
            <View style={[ui.xpFill, { width: `${levelXP / 10}%` }]} />
          </View>
        </View>

        {/* Period totals */}
        <View style={ui.sectionContainer}>
          <View style={ui.periodRow} accessibilityRole="tablist">
            {PERIODS.map((p) => (
              <Chip key={p.days} label={p.label} selected={period === p.days} onPress={() => setPeriod(p.days)} />
            ))}
          </View>

          {!stats ? (
            <ActivityIndicator color={KARELA.color.brand} style={{ marginVertical: 30 }} />
          ) : (
            <View style={ui.statsGrid}>
              <View style={[ui.statCard, ui.bigCard]} accessible accessibilityLabel={`Distance: ${formatKmValue(stats.totalKm)} kilometres`}>
                <Text style={ui.statLabel}>Distance</Text>
                <Text style={ui.statValue}>
                  {formatKmValue(stats.totalKm)}
                  <Text style={ui.statUnit}> km</Text>
                </Text>
                <Text style={ui.statFoot}>
                  {stats.runs} {stats.runs === 1 ? "run" : "runs"}
                  {stats.avgPaceS ? `, avg ${formatPace(stats.avgPaceS)} /km` : ""}
                </Text>
              </View>

              <View style={ui.statsRightCol}>
                <View style={ui.statCardRow}>
                  <SmallStat icon={<KarelaIcon name="streak" size={18} color={KARELA.color.gold} />} label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
                  <SmallStat icon={<MaterialCommunityIcons name="timer-outline" size={18} color={KARELA.vibrant.sky} />} label="Time" value={formatDuration(stats.durationS)} />
                </View>
                <View style={ui.statCardRow}>
                  <SmallStat icon={<MaterialCommunityIcons name="fire" size={18} color={KARELA.color.civic} />} label="Calories, est." value={Math.round(stats.calories).toLocaleString()} />
                  <SmallStat icon={<MaterialCommunityIcons name="shoe-print" size={16} color={KARELA.vibrant.neonTeal} />} label="Steps, est." value={Math.round(stats.totalKm * STEPS_PER_KM).toLocaleString()} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Last 30 days, day by day */}
        <View style={ui.sectionContainer}>
          <View style={ui.row}>
            <Text style={ui.sectionTitle}>Last 30 days</Text>
            <Button label="View details" variant="link" size="sm" onPress={() => router.push("/performanceGraph")} />
          </View>
          <View style={ui.chartCard}>
            {!month ? (
              <ActivityIndicator color={KARELA.color.brand} style={{ marginVertical: 50 }} />
            ) : month.runs === 0 ? (
              <Text style={ui.empty}>
                {failed
                  ? "Couldn't load your runs. Check your connection, then open this screen again."
                  : "No runs in the last 30 days yet. Your days will fill in here as you go."}
              </Text>
            ) : (
              <>
                <View style={ui.chartStats}>
                  <ChartStat value={`${formatKmValue(month.totalKm)} km`} label="distance" />
                  <ChartStat value={`${month.activeDays} of 30`} label="days you moved" rule />
                  <ChartStat value={formatPace(month.avgPaceS)} label="avg pace /km" rule />
                </View>
                <BarChart
                  data={month.buckets.map((b) => ({
                    value: b.km,
                    readout: `${bucketLabel(b, "day")}: ${b.km > 0 ? `${formatKmValue(b.km)} km in ${b.runs} ${b.runs === 1 ? "run" : "runs"}` : "rest day"}`,
                  }))}
                  unit="km"
                  height={150}
                  xLabels={[
                    { index: 0, text: shortDate(month.buckets[0].date) },
                    { index: 14, text: shortDate(month.buckets[14].date) },
                    { index: 29, text: "Today" },
                  ]}
                  highlight={29}
                  average={activeAvg}
                  averageLabel={`avg ${formatKmValue(activeAvg)}`}
                  bestIndex={bestIdx >= 0 ? bestIdx : undefined}
                  bestLabel={month.bestBucket ? `${formatKmValue(month.bestBucket.km)} km` : undefined}
                  summary={`Distance per day for the last 30 days. You moved on ${month.activeDays} days, ${formatKmValue(month.totalKm)} kilometres in total. Best day ${month.bestBucket ? `${shortDate(month.bestBucket.date)}, ${formatKmValue(month.bestBucket.km)} kilometres` : "none"}.`}
                />
                <Text style={ui.chartNote}>
                  The line is your average on the days you moved. Short marks are rest days.
                </Text>
              </>
            )}
          </View>
        </View>

        {profile?.uid && (
          <RunHistory userId={profile.uid} streak={streak} gems={profile.stats?.gems || 0} />
        )}
      </ScrollView>
    </Screen>
  );
}

const SmallStat = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <View style={ui.smallCard} accessible accessibilityLabel={`${label}: ${value}`}>
    {icon}
    <View style={{ flexShrink: 1 }}>
      <Text style={ui.statLabelSmall}>{label}</Text>
      <Text style={ui.statValueSmall} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const ChartStat = ({ value, label, rule }: { value: string; label: string; rule?: boolean }) => (
  <View style={[ui.chartStat, rule && ui.chartStatRule]}>
    <Text style={ui.chartStatValue}>{value}</Text>
    <Text style={ui.chartStatLabel}>{label}</Text>
  </View>
);
