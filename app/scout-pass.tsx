import { Progress } from "@/components/guild/shared";
import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Button, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { getRunsSince } from "@/services/calendarData";
import {
  pesoText,
  Reward,
  REWARD_ICON,
  SCOUT_PASS,
  SEASON,
  SEASON_TRACK,
  seasonEnds,
  seasonLevel,
  STORE_CLOSED_MESSAGE,
  STORE_CLOSED_TITLE,
  STORE_OPEN,
  XP_PER_LEVEL,
} from "@/services/store";
import { KARELA } from "@/styles/designSystem";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * The Scout Pass: the spec's seasonal pass (aboutkarela.md section 24), with
 * a reward track. Screens only for now (services/store.ts): buying says
 * plainly that it isn't open and that nothing was charged.
 */

const shortDay = (d: Date) => d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });

export default function ScoutPassScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [seasonXp, setSeasonXp] = useState<number | null>(null);

  const start = new Date(`${SEASON.startsOn}T00:00:00+08:00`);
  const end = seasonEnds();
  const [openedAt] = useState(() => Date.now()); // read the clock once, not on every render
  // `end` is the start of the last day, so count to the end of it.
  const daysLeft = Math.max(0, Math.ceil((end.getTime() + 86_400_000 - openedAt) / 86_400_000));

  // Season XP = XP from runs since the season started (run_history).
  useEffect(() => {
    if (!user?.uid) return;
    let alive = true;
    getRunsSince(user.uid, new Date(`${SEASON.startsOn}T00:00:00+08:00`)).then((runs) => {
      if (alive) setSeasonXp((runs ?? []).reduce((sum, r) => sum + Number(r.xp_earned || 0), 0));
    });
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  const { level, intoLevel, max } = seasonLevel(seasonXp ?? 0);

  const buy = () => {
    if (!STORE_OPEN) {
      Alert.alert(STORE_CLOSED_TITLE, STORE_CLOSED_MESSAGE);
    }
  };

  return (
    <Screen variant="calm">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={s.header}>
          <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
          <Text style={s.headerTitle} accessibilityRole="header">
            Scout Pass
          </Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={s.hero}>
            <KarelaIcon name="ticket" size={44} color={KARELA.vibrant.sky} />
            <Text style={s.title}>
              {SEASON.name}, {shortDay(start)} to {shortDay(end)}
            </Text>
            <Text style={s.lead}>
              <Text style={s.price}>{pesoText(SCOUT_PASS.pesos)}</Text> for the whole season, {SCOUT_PASS.days} days.
              {daysLeft > 0 ? ` ${daysLeft} days left.` : ""}
            </Text>
          </View>

          {/* Progress */}
          <View style={s.block}>
            <View style={s.levelRow}>
              <Text style={s.levelNum}>Level {level}</Text>
              <Text style={s.levelOf}>of {max}</Text>
            </View>
            {seasonXp === null ? (
              <Text style={s.muted}>Counting your season XP…</Text>
            ) : (
              <Progress
                value={intoLevel}
                max={XP_PER_LEVEL}
                color={KARELA.vibrant.sky}
                label={
                  level >= max
                    ? "Track complete."
                    : `${intoLevel.toLocaleString()} of ${XP_PER_LEVEL.toLocaleString()} season XP to level ${level + 1}`
                }
              />
            )}
            <Text style={[s.muted, { marginTop: KARELA.space.sm }]}>
              Season XP is the XP from your runs since {shortDay(start)}. This is a preview: the Scout Pass isn&apos;t open
              yet, so nothing is unlocked.
            </Text>
          </View>

          {/* Benefits */}
          <Text style={s.sectionTitle} accessibilityRole="header">
            What you get
          </Text>
          {SCOUT_PASS.benefits.map((b) => (
            <View key={b.title} style={s.benefit}>
              <KarelaIcon name={b.icon} size={24} color={KARELA.vibrant.sky} />
              <View style={{ flex: 1 }}>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.muted}>{b.body}</Text>
              </View>
            </View>
          ))}
          <Text style={[s.muted, { marginTop: KARELA.space.md }]}>{SCOUT_PASS.keepNote}</Text>

          {/* Reward track */}
          <Text style={s.sectionTitle} accessibilityRole="header">
            Reward track
          </Text>
          <View style={s.trackHead}>
            <Text style={[s.colHead, s.colLevel]}>Level</Text>
            <Text style={[s.colHead, s.colReward]}>Free</Text>
            <Text style={[s.colHead, s.colReward]}>Scout Pass</Text>
          </View>
          {SEASON_TRACK.map((t) => {
            const reached = t.level <= level;
            const next = t.level === level + 1;
            return (
              <View
                key={t.level}
                style={[s.trackRow, next && s.trackRowNext]}
                accessible
                accessibilityLabel={`Level ${t.level}${reached ? ", reached" : ""}. Free: ${t.free?.label ?? "nothing"}. Scout Pass: ${t.pass.label}.`}
              >
                <View style={s.colLevel}>
                  <View style={[s.levelDot, reached && s.levelDotReached]}>
                    <Text style={[s.levelDotText, reached && s.levelDotTextReached]}>{t.level}</Text>
                  </View>
                </View>
                <RewardCell reward={t.free} reached={reached} />
                <RewardCell reward={t.pass} reached={reached} pass />
              </View>
            );
          })}
          <Text style={[s.muted, { marginTop: KARELA.space.lg }]}>
            Free rewards are for everyone. Scout Pass rewards need the pass; buy it any time in the season and every level
            you&apos;ve reached unlocks at once.
          </Text>
        </ScrollView>

        {/* Buy bar */}
        <View style={s.buyBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.buyPrice}>{pesoText(SCOUT_PASS.pesos)}</Text>
            <Text style={s.muted}>{SEASON.name}, {SCOUT_PASS.days} days</Text>
          </View>
          <Button label="Get the Scout Pass" onPress={buy} />
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const RewardCell = ({ reward, reached, pass = false }: { reward: Reward | null; reached: boolean; pass?: boolean }) => {
  if (!reward) return <View style={s.colReward} />;
  // Free rewards light up when reached; Scout Pass ones stay locked (nobody has the pass yet).
  const lit = reached && !pass;
  const color = pass ? KARELA.vibrant.sky : KARELA.color.brand;
  return (
    <View style={[s.colReward, s.reward, !lit && s.rewardDim]}>
      <KarelaIcon name={REWARD_ICON[reward.kind]} size={20} color={color} />
      <Text style={s.rewardText} numberOfLines={2}>
        {reward.label}
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingHorizontal: KARELA.space.xl,
    paddingVertical: KARELA.space.md,
  },
  headerTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  scroll: { paddingHorizontal: KARELA.space.xl, paddingBottom: KARELA.space.xxxl },

  hero: { alignItems: "flex-start", gap: KARELA.space.sm, marginTop: KARELA.space.sm },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black, marginTop: KARELA.space.xs },
  lead: { color: KARELA.color.textSecondary, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular, lineHeight: 22 },
  price: { color: KARELA.vibrant.sky, fontFamily: KARELA.font.bold },

  block: {
    marginTop: KARELA.space.xl,
    paddingVertical: KARELA.space.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: KARELA.color.line,
  },
  levelRow: { flexDirection: "row", alignItems: "baseline", gap: KARELA.space.sm, marginBottom: KARELA.space.sm },
  levelNum: { color: KARELA.color.textPrimary, fontSize: KARELA.size.display, fontFamily: KARELA.font.black },
  levelOf: { color: KARELA.color.textMuted, fontSize: KARELA.size.body, fontFamily: KARELA.font.medium },
  muted: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, lineHeight: 18 },

  sectionTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginTop: KARELA.space.xxl,
    marginBottom: KARELA.space.sm,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingVertical: KARELA.space.md,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  benefitTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },

  trackHead: { flexDirection: "row", paddingBottom: KARELA.space.sm, borderBottomWidth: 1, borderBottomColor: KARELA.color.line },
  colHead: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  colLevel: { width: 56 },
  colReward: { flex: 1 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: KARELA.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  trackRowNext: { backgroundColor: KARELA.color.surfaceAlt, borderRadius: KARELA.radius.sm },
  levelDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: KARELA.space.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: KARELA.color.line,
  },
  levelDotReached: { backgroundColor: KARELA.color.brand, borderColor: KARELA.color.brand },
  levelDotText: { color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  levelDotTextReached: { color: KARELA.color.onBright },
  reward: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm, paddingRight: KARELA.space.sm },
  rewardDim: { opacity: 0.55 },
  rewardText: { flex: 1, color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },

  buyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingHorizontal: KARELA.space.xl,
    paddingTop: KARELA.space.md,
    paddingBottom: KARELA.space.md,
    borderTopWidth: 1,
    borderTopColor: KARELA.color.line,
    backgroundColor: KARELA.color.surface,
  },
  buyPrice: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
});
