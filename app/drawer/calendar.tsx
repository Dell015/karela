import { getEffectiveStreak } from "@/services/streakService";
import { Button, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import {
  buildMonthGrid,
  dayKey,
  DayTotals,
  formatDuration,
  formatKm,
  getRunsSince,
  groupRunsByDay,
  lastNDays,
  RunRow,
  sumDays,
} from "@/services/calendarData";
import { getStreakTier } from "@/services/streakMultiplier";
import { KARELA } from "@/styles/designSystem";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const VIEWS = ["Daily", "Weekly", "Monthly"] as const;
type View_ = (typeof VIEWS)[number];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** A day ring: full when you ran that day, empty when you did not. */
const DayRing = ({ filled, size, label, isToday }: { filled: boolean; size: number; label: number; isToday: boolean }) => {
  const reduceMotion = useReducedMotion();
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = reduceMotion ? (filled ? 1 : 0) : withTiming(filled ? 1 : 0, { duration: 600 });
  }, [filled, reduceMotion, p]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={KARELA.color.surfaceSoft} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={KARELA.color.brand}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.ringLabel, isToday && { color: KARELA.color.brand }]}>{label}</Text>
      </View>
    </View>
  );
};

/** Distance, time, XP in one row. */
const Totals = ({ t }: { t: ReturnType<typeof sumDays> }) => (
  <View style={styles.totalsRow}>
    <View style={styles.totalItem}>
      <Text style={styles.totalValue}>{formatKm(t.distanceM)}</Text>
      <Text style={styles.totalLabel}>DISTANCE</Text>
    </View>
    <View style={styles.totalItem}>
      <Text style={styles.totalValue}>{formatDuration(t.durationS)}</Text>
      <Text style={styles.totalLabel}>TIME</Text>
    </View>
    <View style={styles.totalItem}>
      <Text style={styles.totalValue}>{t.xp}</Text>
      <Text style={styles.totalLabel}>XP</Text>
    </View>
  </View>
);

const RunItem = ({ run }: { run: RunRow }) => {
  const d = new Date(run.completed_at);
  return (
    <View style={styles.runItem}>
      <View style={styles.runIcon}>
        <MaterialCommunityIcons name="run" size={18} color={KARELA.color.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.runTitle}>{formatKm(Number(run.distance_meters) || 0)}</Text>
        <Text style={styles.runSub}>
          {d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })},{" "}
          {d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })} · {formatDuration(Number(run.duration_seconds) || 0)}
        </Text>
      </View>
      <Text style={styles.runXp}>+{Number(run.xp_earned) || 0} XP</Text>
    </View>
  );
};

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const userId = profile?.uid;

  const [view, setView] = useState<View_>("Weekly");
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedKey, setSelectedKey] = useState(dayKey(today));
  const [runs, setRuns] = useState<RunRow[] | null>(null); // null = not loaded yet
  const [failed, setFailed] = useState(false);

  // Same streak the dashboard shows.
  const streak = getEffectiveStreak(profile?.stats);
  const tier = getStreakTier(streak);

  // One query covers the shown month and the last 7 days. A request id
  // drops replies that arrive after a newer request (fast month switching).
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!userId) return;
    const id = ++requestId.current;
    const monthStart = new Date(month.y, month.m, 1);
    const weekStart = lastNDays(7, today)[0];
    const since = monthStart < weekStart ? monthStart : weekStart;
    const data = await getRunsSince(userId, since);
    if (id !== requestId.current) return;
    setFailed(data === null);
    setRuns(data ?? []);
  }, [userId, month.y, month.m, today]);

  useEffect(() => {
    const t = setTimeout(load, 0); // run after paint; also keeps setState out of the effect body
    return () => clearTimeout(t);
  }, [load]);

  const byDay = useMemo(() => groupRunsByDay(runs ?? []), [runs]);
  const week = useMemo(() => lastNDays(7, today), [today]);
  const monthCells = useMemo(() => buildMonthGrid(month.y, month.m), [month.y, month.m]);
  const isCurrentMonth = month.y === today.getFullYear() && month.m === today.getMonth();

  // Sliding pill under the selected tab (motion that answers a tap).
  const reduceMotion = useReducedMotion();
  const slide = useSharedValue(VIEWS.indexOf(view));
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * ((width - 62) / 3) }],
  }));
  const pickView = (v: View_) => {
    setView(v);
    const i = VIEWS.indexOf(v);
    slide.value = reduceMotion ? i : withTiming(i, { duration: 250 });
  };

  const changeMonth = (delta: number) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
    setRuns(null);
  };

  // What the bottom list shows for each view.
  let listTitle = "";
  let listDays: (DayTotals | undefined)[] = [];
  if (view === "Daily") {
    listTitle = "Today";
    listDays = [byDay.get(dayKey(today))];
  } else if (view === "Weekly") {
    listTitle = "Last 7 days";
    listDays = week.map((d) => byDay.get(dayKey(d)));
  } else {
    // Parse as local noon so the day never shifts across time zones.
    listTitle = selectedKey === dayKey(today)
      ? "Today"
      : new Date(`${selectedKey}T12:00:00`).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" });
    listDays = [byDay.get(selectedKey)];
  }
  const listRuns = listDays.flatMap((d) => d?.runs ?? []);
  const monthTotals = sumDays(
    monthCells.filter((c): c is Date => !!c).map((c) => byDay.get(dayKey(c))),
  );

  const DAY_GAP = 6;
  const cell = Math.floor((width - 50 - 2 * KARELA.space.xl - DAY_GAP * 6) / 7);

  return (
    <Screen variant="calm">
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <IconButton icon="chevron-back" label="Back" onPress={() => router.replace("/drawer/dashboard")} />
            <Text style={styles.headerTitle}>Calendar</Text>
          </View>

          {/* Streak: same value and tiers as the dashboard (services/streakMultiplier.ts) */}
          <View style={styles.streakRow}>
            <MaterialCommunityIcons name="fire" size={22} color={KARELA.color.civic} />
            <Text style={styles.streakText}>
              {streak} day streak
              <Text style={styles.streakTier}>  ·  {tier.multiplier.toFixed(1)}x XP</Text>
            </Text>
          </View>
          <Text style={styles.streakHint}>
            {tier.nextTierAt
              ? `${tier.nextTierAt - streak} more ${tier.nextTierAt - streak === 1 ? "day" : "days"} to the next multiplier.`
              : "You are at the 3.0x cap."}
          </Text>

          <View style={styles.tabContainer}>
            <Animated.View style={[styles.animatedPill, pillStyle]}>
              <LinearGradient colors={KARELA.gradients.brand} style={StyleSheet.absoluteFill} />
            </Animated.View>
            {VIEWS.map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.tabButton}
                onPress={() => pickView(v)}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityState={{ selected: view === v }}
              >
                <Text style={[styles.tabText, { color: view === v ? KARELA.color.onBright : KARELA.color.textMuted }]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {runs === null ? (
            <ActivityIndicator color={KARELA.color.brand} style={{ marginVertical: 40 }} />
          ) : failed ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>Couldn&apos;t load your runs</Text>
              <Text style={styles.emptySub}>Check your connection and try again.</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={load} style={{ marginTop: KARELA.space.md }} />
            </View>
          ) : (
            <>
              {view === "Daily" && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {today.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
                  </Text>
                  <Totals t={sumDays(listDays)} />
                </View>
              )}

              {view === "Weekly" && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Last 7 days</Text>
                  <View style={styles.weekRow}>
                    {week.map((d) => (
                      <View key={dayKey(d)} style={styles.center}>
                        <DayRing
                          filled={!!byDay.get(dayKey(d))}
                          size={38}
                          label={d.getDate()}
                          isToday={dayKey(d) === dayKey(today)}
                        />
                        <Text style={styles.dayLabel}>{WEEKDAYS[(d.getDay() + 6) % 7]}</Text>
                      </View>
                    ))}
                  </View>
                  <Totals t={sumDays(listDays)} />
                </View>
              )}

              {view === "Monthly" && (
                <View style={styles.card}>
                  <View style={styles.monthHeader}>
                    <IconButton icon="chevron-back" label="Previous month" tone="plain" onPress={() => changeMonth(-1)} />
                    <Text style={styles.monthName}>
                      {new Date(month.y, month.m, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                    </Text>
                    <IconButton
                      icon="chevron-forward"
                      label="Next month"
                      tone="plain"
                      disabled={isCurrentMonth}
                      style={isCurrentMonth ? { opacity: 0.3 } : undefined}
                      onPress={() => changeMonth(1)}
                    />
                  </View>
                  <View style={[styles.weekdayRow, { gap: DAY_GAP }]}>
                    {WEEKDAYS.map((w, i) => (
                      <Text key={i} style={[styles.weekdayLabel, { width: cell }]}>{w}</Text>
                    ))}
                  </View>
                  <View style={[styles.grid, { gap: DAY_GAP }]}>
                    {monthCells.map((c, i) => {
                      if (!c) return <View key={`b${i}`} style={{ width: cell, height: cell }} />;
                      const key = dayKey(c);
                      const ran = !!byDay.get(key);
                      const isToday = key === dayKey(today);
                      const isSelected = key === selectedKey;
                      const isFuture = c > today && !isToday;
                      return (
                        <Pressable
                          key={key}
                          disabled={isFuture}
                          onPress={() => setSelectedKey(key)}
                          accessibilityRole="button"
                          accessibilityLabel={`${c.toDateString()}${ran ? ", you ran" : ""}`}
                          accessibilityState={{ selected: isSelected, disabled: isFuture }}
                          style={[
                            styles.dayBox,
                            { width: cell, height: cell },
                            ran && styles.dayRan,
                            isSelected && styles.daySelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isToday && { color: KARELA.color.brand, fontFamily: KARELA.font.black },
                              isFuture && { color: KARELA.color.textFaint },
                            ]}
                          >
                            {c.getDate()}
                          </Text>
                          {ran && <View style={styles.ranDot} />}
                        </Pressable>
                      );
                    })}
                  </View>
                  <Totals t={monthTotals} />
                </View>
              )}

              <Text style={styles.sectionTitle}>{listTitle}</Text>
              {listRuns.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.emptyTitle}>No runs {view === "Weekly" ? "this week" : view === "Daily" ? "today" : "on this day"}</Text>
                  <Text style={styles.emptySub}>Finished runs show up here.</Text>
                  {view !== "Monthly" && (
                    <Button
                      label="Start a run"
                      icon="play"
                      size="sm"
                      onPress={() => router.push("/drawer/maps")}
                      style={{ marginTop: KARELA.space.md }}
                    />
                  )}
                </View>
              ) : (
                <View style={styles.card}>
                  {listRuns.map((r) => (
                    <RunItem key={r.id} run={r} />
                  ))}
                </View>
              )}
            </>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: 25 },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md, marginBottom: KARELA.space.xl },
  headerTitle: { flex: 1, fontSize: KARELA.size.display, fontFamily: KARELA.font.bold, color: KARELA.color.textPrimary },

  streakRow: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm },
  streakText: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  streakTier: { color: KARELA.color.civic, fontFamily: KARELA.font.bold },
  streakHint: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    marginTop: KARELA.space.xs,
    marginBottom: KARELA.space.xl,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    padding: 6,
    marginBottom: KARELA.space.xl,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  animatedPill: { position: "absolute", top: 6, left: 6, bottom: 6, borderRadius: KARELA.radius.pill, overflow: "hidden", width: "31%" },
  tabButton: { flex: 1, minHeight: KARELA.tap, alignItems: "center", justifyContent: "center", zIndex: 1 },
  tabText: { fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },

  card: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    padding: KARELA.space.xl,
    marginBottom: KARELA.space.xl,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  cardTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.medium, marginBottom: KARELA.space.lg },

  totalsRow: {
    flexDirection: "row",
    marginTop: KARELA.space.lg,
    paddingTop: KARELA.space.lg,
    borderTopWidth: 1,
    borderTopColor: KARELA.color.lineSoft,
  },
  totalItem: { flex: 1, alignItems: "center" },
  totalValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  totalLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.bold, marginTop: 2 },

  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  ringLabel: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  dayLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: KARELA.space.sm },

  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: KARELA.space.md },
  monthName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  weekdayRow: { flexDirection: "row", marginBottom: KARELA.space.sm },
  weekdayLabel: { textAlign: "center", color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.bold },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayBox: { justifyContent: "center", alignItems: "center", borderRadius: KARELA.radius.md },
  dayRan: { backgroundColor: KARELA.color.surfaceSoft },
  daySelected: { borderWidth: 2, borderColor: KARELA.color.brand },
  dayText: { color: KARELA.color.textPrimary, fontSize: 14, fontFamily: KARELA.font.medium },
  ranDot: { position: "absolute", bottom: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: KARELA.color.brand },

  sectionTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.bold, marginBottom: KARELA.space.md },
  runItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingVertical: KARELA.space.md,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  runIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124,242,5,0.12)", // lime 12%
    justifyContent: "center",
    alignItems: "center",
  },
  runTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  runSub: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 2 },
  runXp: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },

  emptyTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  emptySub: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: KARELA.space.xs },
});
