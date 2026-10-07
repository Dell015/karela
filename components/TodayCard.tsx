import { Button } from "@/components/ui/Button";
import { WeatherTier } from "@/services/weatherSafety";
import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface TodayCardProps {
  /** Effective streak (services/streakService.getEffectiveStreak). */
  streak: number;
  ranToday: boolean;
  /** Bayanihan tier from the weather; null while unknown. */
  weatherTier: WeatherTier | null;
  city: string;
  /** Nearby reports that need someone (pending or aging). */
  needsCheckCount: number;
  onStartRun: () => void;
  onOpenCalendar: () => void;
  onOpenMap: () => void;
  now?: Date;
}

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * "What should I do today?" in one line. Safety first: in bad weather it
 * never asks the user to run, even if a streak is at stake (Bayanihan
 * protocol: Karela must never be the reason someone gets hurt).
 */
export const TodayCard = ({
  streak,
  ranToday,
  weatherTier,
  city,
  needsCheckCount,
  onStartRun,
  onOpenCalendar,
  onOpenMap,
  now = new Date(),
}: TodayCardProps) => {
  let icon: IconName;
  let tint: string;
  let title: string;
  let sub: string;
  let action: React.ReactNode = null;

  if (weatherTier !== null && weatherTier >= 1) {
    icon = "thunderstorm-outline";
    tint = KARELA.color.danger;
    title = "Stay in today";
    sub = `Strong wind, heavy rain or a storm in ${city}. Ani won't ask you to run.`;
  } else if (ranToday) {
    icon = "checkmark-circle-outline";
    tint = KARELA.color.brand;
    title = "You ran today";
    sub = streak > 1 ? `${streak}-day streak. See you tomorrow.` : "Nice start. Come back tomorrow to build a streak.";
    action = <Button label="Calendar" variant="link" size="sm" onPress={onOpenCalendar} />;
  } else if (streak > 0) {
    const hoursLeft = 24 - now.getHours();
    icon = "flame-outline";
    tint = KARELA.color.civic;
    title = `Keep your ${streak}-day streak`;
    sub =
      now.getHours() >= 18
        ? `Run any distance today to keep it. About ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"} left.`
        : "Run any distance today to keep it.";
    action = <Button label="Start a run" icon="play" size="sm" onPress={onStartRun} />;
  } else {
    icon = "walk-outline";
    tint = KARELA.color.brand;
    title = "Start a streak today";
    // Tiers from services/streakMultiplier.ts: 4 days in a row = 1.2x XP.
    sub = "Any run counts. Run 4 days in a row for 1.2x XP.";
    action = <Button label="Start a run" icon="play" size="sm" onPress={onStartRun} />;
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWell, { borderColor: tint }]}>
          <Ionicons name={icon} size={22} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
      </View>
      {action && <View style={styles.action}>{action}</View>}

      {needsCheckCount > 0 && (
        <View style={styles.civicRow}>
          <Ionicons name="camera-outline" size={16} color={KARELA.color.civic} />
          <Text style={styles.civicText}>
            {needsCheckCount} {needsCheckCount === 1 ? "report" : "reports"} near you{" "}
            {needsCheckCount === 1 ? "needs" : "need"} a check
          </Text>
          <Button label="Open map" variant="link" size="sm" onPress={onOpenMap} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    padding: KARELA.space.lg,
    marginBottom: KARELA.space.xl,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  row: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  sub: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 18,
    marginTop: 2,
  },
  action: { marginTop: KARELA.space.md, alignItems: "flex-start" },
  civicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.sm,
    marginTop: KARELA.space.md,
    paddingTop: KARELA.space.md,
    borderTopWidth: 1,
    borderTopColor: KARELA.color.lineSoft,
  },
  civicText: { flex: 1, color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
});
