import { BarChart } from "@/components/charts/BarChart";
import { PaceChart } from "@/components/charts/PaceChart";
import { Button, Chip, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { formatDuration, getRunsSince, lastNDays, RunRow } from "@/services/calendarData";
import {
  analyzeRuns,
  bucketLabel,
  formatKmValue,
  formatPace,
  MIN_PACE_KM,
  shortDate,
  WEEKDAYS,
} from "@/services/runAnalytics";
import { KARELA } from "@/styles/designSystem";
import { useRouter } from "expo-router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Activity in detail: the wider view behind Progress > Last 30 days.
 * One range filter at the top scopes every number and chart below it, so
 * they always agree. Every value in a chart is also in the run table.
 * Source: run_history (every finished run in the account).
 */

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];
const TABLE_ROWS = 10;

export default function PerformanceGraph() {
  const router = useRouter();
  const { profile } = useAuth();
  const uid = profile?.uid;
  const [all, setAll] = useState<RunRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [days, setDays] = useState(30);
  const [showAll, setShowAll] = useState(false);

  // One query for the whole year (a few KB); every range is cut from it.
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    getRunsSince(uid, lastNDays(365)[0]).then((r) => {
      if (!alive) return;
      setAll(r ?? []);
      setFailed(r === null);
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  const a = useMemo(() => (all ? analyzeRuns(all, days) : null), [all, days]);
  const rangeLabel = RANGES.find((r) => r.days === days)?.label ?? `${days} days`;
  const tableRuns = useMemo(() => {
    if (!all) return [];
    const start = lastNDays(days)[0];
    return all.filter((r) => new Date(r.completed_at) >= start);
  }, [all, days]);

  const n = a?.buckets.length ?? 0;
  const activeBuckets = a ? a.buckets.filter((b) => b.km > 0) : [];
  const avgBucket = activeBuckets.length ? activeBuckets.reduce((x, b) => x + b.km, 0) / activeBuckets.length : 0;
  const bestIdx = a?.bestBucket ? a.buckets.indexOf(a.bestBucket) : -1;
  const unitWord = a?.bucket === "week" ? "week" : "day";

  const topWeekday = a ? a.weekdayKm.indexOf(Math.max(...a.weekdayKm)) : -1;

  return (
    <Screen variant="aurora">
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
          <Text style={s.headerTitle}>Your activity</Text>
          <View style={{ width: KARELA.tap }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* The one filter: scopes everything below */}
          <View style={s.filters} accessibilityRole="tablist">
            {RANGES.map((r) => (
              <Chip key={r.days} label={r.label} selected={days === r.days} onPress={() => { setDays(r.days); setShowAll(false); }} />
            ))}
          </View>

          {!a ? (
            <ActivityIndicator color={KARELA.color.brand} style={{ marginTop: 60 }} />
          ) : a.runs === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.body}>
                {failed
                  ? "Couldn't load your runs. Check your connection, then open this screen again."
                  : `No runs in the last ${rangeLabel}. Pick a longer range, or finish a run and it shows up here.`}
              </Text>
              {!failed && days < 365 && (
                <Button label="Show 1 year" size="sm" variant="secondary" onPress={() => setDays(365)} />
              )}
            </View>
          ) : (
            <>
              {/* Headline: one number */}
              <View style={s.hero} accessible accessibilityLabel={`${formatKmValue(a.totalKm)} kilometres in the last ${rangeLabel}, ${a.runs} runs on ${a.activeDays} days`}>
                <Text style={s.heroValue}>
                  {formatKmValue(a.totalKm)}
                  <Text style={s.heroUnit}> km</Text>
                </Text>
                <Text style={s.heroSub}>
                  in the last {rangeLabel}: {a.runs} {a.runs === 1 ? "run" : "runs"} on {a.activeDays} of {a.days} days
                </Text>
              </View>

              {/* Stat tiles, separated by rules */}
              <View style={s.tiles}>
                <Tile label="Time moving" value={formatDuration(a.durationS)} />
                <Tile label="Average pace" value={a.avgPaceS ? `${formatPace(a.avgPaceS)} /km` : "--"} rule />
                <Tile label="Longest run" value={a.longestRun ? `${formatKmValue(a.longestRun.km)} km` : "--"} sub={a.longestRun ? shortDate(a.longestRun.date) : undefined} top />
                <Tile label="Most days in a row" value={`${a.bestStreak}`} rule top />
                <Tile label="Fastest pace" value={a.fastest ? `${formatPace(a.fastest.paceS)} /km` : "--"} sub={a.fastest ? `${shortDate(a.fastest.date)}, ${formatKmValue(a.fastest.km)} km` : undefined} top />
                <Tile label="Calories, est." value={Math.round(a.calories).toLocaleString()} rule top />
              </View>

              {/* Distance over time */}
              <Section title={a.bucket === "week" ? "Distance per week" : "Distance per day"}>
                <BarChart
                  data={a.buckets.map((b) => ({
                    value: b.km,
                    readout: `${bucketLabel(b, a.bucket)}: ${b.km > 0 ? `${formatKmValue(b.km)} km in ${b.runs} ${b.runs === 1 ? "run" : "runs"}` : "no runs"}`,
                  }))}
                  unit="km"
                  height={170}
                  hint={`Tap a bar to see its ${unitWord}`}
                  xLabels={[
                    { index: 0, text: shortDate(a.buckets[0].date) },
                    { index: Math.floor((n - 1) / 2), text: shortDate(a.buckets[Math.floor((n - 1) / 2)].date) },
                    { index: n - 1, text: a.bucket === "week" ? "This week" : "Today" },
                  ]}
                  highlight={n - 1}
                  average={avgBucket}
                  averageLabel={`avg ${formatKmValue(avgBucket)}`}
                  bestIndex={bestIdx >= 0 ? bestIdx : undefined}
                  bestLabel={a.bestBucket ? `${formatKmValue(a.bestBucket.km)} km` : undefined}
                  summary={`Distance per ${unitWord}, last ${rangeLabel}. Best ${unitWord}: ${a.bestBucket ? `${bucketLabel(a.bestBucket, a.bucket)}, ${formatKmValue(a.bestBucket.km)} kilometres` : "none"}. Average ${formatKmValue(avgBucket)} kilometres on active ${unitWord}s.`}
                />
                <Text style={s.note}>The line is your average per {unitWord} you moved.</Text>
              </Section>

              {/* Pace */}
              <Section title="Pace per run">
                {a.pace.length >= 2 ? (
                  <>
                    <PaceChart
                      points={a.pace}
                      average={a.avgPaceS}
                      summary={`Pace per run, last ${rangeLabel}. Average ${formatPace(a.avgPaceS)} per kilometre, fastest ${formatPace(a.fastest?.paceS ?? null)}.`}
                    />
                    <Text style={s.note}>Higher is faster. {paceTrendText(a.paceTrendS)}</Text>
                  </>
                ) : (
                  <Text style={s.body}>
                    Pace shows up after two runs of at least {MIN_PACE_KM * 1000} m in this range.
                  </Text>
                )}
              </Section>

              {/* Weekday pattern */}
              <Section title="When you move">
                <BarChart
                  data={a.weekdayKm.map((k, i) => ({
                    value: k,
                    readout: `${WEEKDAYS[i]}: ${formatKmValue(k)} km in ${a.weekdayRuns[i]} ${a.weekdayRuns[i] === 1 ? "run" : "runs"}`,
                  }))}
                  unit="km"
                  height={130}
                  hint="Tap a day of the week"
                  labelWidth={34}
                  xLabels={WEEKDAYS.map((d, i) => ({ index: i, text: d }))}
                  summary={`Distance by day of the week, last ${rangeLabel}. ${WEEKDAYS.map((d, i) => `${d} ${formatKmValue(a.weekdayKm[i])}`).join(", ")} kilometres.`}
                />
                {topWeekday >= 0 && a.weekdayKm[topWeekday] > 0 && (
                  <Text style={s.note}>You move most on {WEEKDAYS_LONG[topWeekday]}s.</Text>
                )}
              </Section>

              {/* Table view: every run, so no value depends on tapping a chart */}
              <Section title={`Runs (${tableRuns.length})`}>
                <View style={s.tableHead}>
                  <Text style={[s.th, { flex: 1.3 }]}>Date</Text>
                  <Text style={[s.th, s.num]}>Distance</Text>
                  <Text style={[s.th, s.num]}>Time</Text>
                  <Text style={[s.th, s.num]}>Pace</Text>
                </View>
                {(showAll ? tableRuns : tableRuns.slice(0, TABLE_ROWS)).map((r) => {
                  const k = (Number(r.distance_meters) || 0) / 1000;
                  const sec = Number(r.duration_seconds) || 0;
                  const p = k >= MIN_PACE_KM && sec > 0 ? sec / k : null;
                  const d = new Date(r.completed_at);
                  return (
                    <View key={r.id} style={s.tr} accessible accessibilityLabel={`${shortDate(d)}: ${formatKmValue(k)} kilometres in ${formatDuration(sec)}${p ? `, pace ${formatPace(p)} per kilometre` : ""}`}>
                      <Text style={[s.td, { flex: 1.3 }]}>{`${WEEKDAYS[(d.getDay() + 6) % 7]}, ${shortDate(d)}`}</Text>
                      <Text style={[s.td, s.num]}>{formatKmValue(k)} km</Text>
                      <Text style={[s.td, s.num]}>{formatDuration(sec)}</Text>
                      <Text style={[s.td, s.num]}>{p && p >= 150 && p <= 1200 ? formatPace(p) : "--"}</Text>
                    </View>
                  );
                })}
                {tableRuns.length > TABLE_ROWS && (
                  <Button
                    label={showAll ? "Show fewer" : `Show all ${tableRuns.length}`}
                    variant="link"
                    size="sm"
                    onPress={() => setShowAll(!showAll)}
                    style={{ marginTop: KARELA.space.sm }}
                  />
                )}
              </Section>

              <Text style={s.footnote}>
                From every run saved to your account. Calories are an estimate. Runs under {MIN_PACE_KM * 1000} m, or with a
                pace no person could run, are left out of pace figures.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Plain-words trend: negative seconds = faster. Neutral about slowing down. */
const paceTrendText = (t: number | null) => {
  if (t === null) return "";
  if (Math.abs(t) < 5) return "Your pace has held steady across this range.";
  return t < 0
    ? `Your recent runs are ${formatPace(-t)} per km faster than your earlier ones in this range.`
    : `Your recent runs are ${formatPace(t)} per km slower than your earlier ones. Longer or easier runs do that, and that's fine.`;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle} accessibilityRole="header">
      {title}
    </Text>
    <View style={s.card}>{children}</View>
  </View>
);

const Tile = ({ label, value, sub, rule, top }: { label: string; value: string; sub?: string; rule?: boolean; top?: boolean }) => (
  <View style={[s.tile, rule && s.tileRule, top && s.tileTop]} accessible accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ""}`}>
    <Text style={s.tileLabel}>{label}</Text>
    <Text style={s.tileValue}>{value}</Text>
    {sub && <Text style={s.tileSub}>{sub}</Text>}
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: KARELA.space.xl,
    paddingTop: KARELA.space.md,
  },
  headerTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  scroll: { paddingHorizontal: KARELA.space.xl, paddingBottom: KARELA.space.xxxl },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: KARELA.space.sm, marginTop: KARELA.space.lg },
  emptyBox: { marginTop: KARELA.space.xxl, gap: KARELA.space.md, alignItems: "flex-start" },
  body: { color: KARELA.color.textSecondary, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular, lineHeight: 22 },

  hero: { marginTop: KARELA.space.xl },
  heroValue: { color: KARELA.color.textPrimary, fontSize: 48, fontFamily: KARELA.font.black },
  heroUnit: { color: KARELA.color.textSecondary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  heroSub: { color: KARELA.color.textMuted, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular, marginTop: 2 },

  tiles: { flexDirection: "row", flexWrap: "wrap", marginTop: KARELA.space.lg },
  tile: { width: "50%", paddingVertical: KARELA.space.md, paddingRight: KARELA.space.sm },
  tileRule: { borderLeftWidth: 1, borderLeftColor: KARELA.color.line, paddingLeft: KARELA.space.md },
  tileTop: { borderTopWidth: 1, borderTopColor: KARELA.color.lineSoft },
  tileLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  tileValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold, marginTop: 2 },
  tileSub: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: 2 },

  section: { marginTop: KARELA.space.xxl },
  sectionTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold, marginBottom: KARELA.space.sm },
  card: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    padding: KARELA.space.lg,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  note: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, lineHeight: 16, marginTop: KARELA.space.sm },

  tableHead: { flexDirection: "row", paddingBottom: KARELA.space.sm, borderBottomWidth: 1, borderBottomColor: KARELA.color.line },
  th: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium, flex: 1 },
  tr: { flexDirection: "row", paddingVertical: KARELA.space.sm, borderBottomWidth: 1, borderBottomColor: KARELA.color.lineSoft, minHeight: 40, alignItems: "center" },
  td: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, flex: 1 },
  num: { textAlign: "right", fontVariant: ["tabular-nums"] },

  footnote: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, lineHeight: 16, marginTop: KARELA.space.xl },
});
