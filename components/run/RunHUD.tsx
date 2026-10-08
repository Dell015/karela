import { KARELA } from "@/styles/designSystem";
import { clockText, kmText, paceText } from "@/services/runMath";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The live panel during a run. Big numbers you can read at arm's length
 * while moving (distance and time), the pace underneath, and a status line
 * that only appears when something needs your attention.
 */

type Gps = "waiting" | "good" | "fair" | "weak";

export const gpsQuality = (accuracyM: number | null, hasFix: boolean): Gps => {
  if (!hasFix || accuracyM === null) return "waiting";
  if (accuracyM <= 10) return "good";
  if (accuracyM <= 20) return "fair";
  return "weak";
};

const GPS_LABEL: Record<Gps, string> = { waiting: "Finding GPS", good: "GPS good", fair: "GPS fair", weak: "GPS weak" };
const GPS_COLOR: Record<Gps, string> = {
  waiting: KARELA.color.textMuted,
  good: KARELA.color.brand,
  fair: KARELA.color.gold,
  weak: KARELA.color.civic,
};

export const RunHUD = ({
  meters,
  seconds,
  avgPaceS,
  speedKmh,
  gps,
  paused,
  inVehicle,
  flags,
}: {
  meters: number;
  seconds: number;
  avgPaceS: number | null;
  /** current speed from GPS */
  speedKmh: number;
  gps: Gps;
  paused: boolean;
  /** the last stretch was too fast to be on foot */
  inVehicle: boolean;
  /** checkpoints on the route, if any */
  flags?: { reached: number; total: number };
}) => {
  const insets = useSafeAreaInsets();
  // Current pace from GPS speed; below a slow walk it means nothing.
  const nowPace = speedKmh >= 3 ? 3600 / speedKmh : null;

  const status = paused
    ? { icon: "pause" as const, text: "Paused. Distance and time aren't counting.", color: KARELA.color.gold }
    : inVehicle
      ? { icon: "car-outline" as const, text: "Moving too fast for running. This stretch doesn't count.", color: KARELA.color.danger }
      : gps === "waiting"
        ? { icon: "locate-outline" as const, text: "Finding your location. Stay in the open for a moment.", color: KARELA.color.textSecondary }
        : gps === "weak"
          ? { icon: "cellular-outline" as const, text: "Weak GPS. Distance may lag until the signal improves.", color: KARELA.color.civic }
          : null;

  const a11y = `${kmText(meters)} kilometres in ${clockText(seconds)}. Average pace ${paceText(avgPaceS)} per kilometre. ${GPS_LABEL[gps]}.${paused ? " Paused." : ""}`;

  return (
    <View style={[s.wrap, { top: insets.top + KARELA.space.sm }]} pointerEvents="none">
      <View style={[s.card, paused && s.cardPaused]} accessible accessibilityLabel={a11y} accessibilityLiveRegion="none">
        <View style={s.main}>
          <View style={{ flex: 1 }}>
            <Text style={s.bigValue} numberOfLines={1} adjustsFontSizeToFit>
              {kmText(meters)}
              <Text style={s.bigUnit}> km</Text>
            </Text>
            <Text style={s.label}>Distance</Text>
          </View>
          <View style={s.mainRule} />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[s.bigValue, paused && { color: KARELA.color.gold }]} numberOfLines={1} adjustsFontSizeToFit>
              {clockText(seconds)}
            </Text>
            <Text style={s.label}>Time</Text>
          </View>
        </View>

        <View style={s.sub}>
          <View style={s.subItem}>
            <Text style={s.subValue}>{paceText(avgPaceS)}</Text>
            <Text style={s.label}>Avg pace /km</Text>
          </View>
          <View style={s.subItem}>
            <Text style={s.subValue}>{paused ? "--" : paceText(nowPace)}</Text>
            <Text style={s.label}>Now /km</Text>
          </View>
          <View style={[s.subItem, { alignItems: "flex-end" }]}>
            <View style={s.gpsRow}>
              <View style={[s.gpsDot, { backgroundColor: GPS_COLOR[gps] }]} />
              <Text style={s.gpsText}>{GPS_LABEL[gps]}</Text>
            </View>
            {flags && flags.total > 0 ? (
              <Text style={s.label}>
                Checkpoints {flags.reached} of {flags.total}
              </Text>
            ) : (
              <Text style={s.label}>Signal</Text>
            )}
          </View>
        </View>

        {status && (
          <View style={s.status}>
            <Ionicons name={status.icon} size={16} color={status.color} />
            <Text style={[s.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { position: "absolute", left: KARELA.space.md, right: KARELA.space.md, zIndex: 1000 },
  card: {
    backgroundColor: "rgba(17,24,19,0.94)", // KARELA.color.surface at 94%, so the map shows at the edges
    borderRadius: KARELA.radius.lg,
    borderWidth: 1,
    borderColor: KARELA.color.line,
    paddingHorizontal: KARELA.space.lg,
    paddingTop: KARELA.space.md,
    paddingBottom: KARELA.space.md,
    ...KARELA.glow.soft,
  },
  cardPaused: { borderColor: KARELA.color.gold },
  main: { flexDirection: "row", alignItems: "flex-end", gap: KARELA.space.md },
  mainRule: { width: 1, alignSelf: "stretch", backgroundColor: KARELA.color.line, marginVertical: 4 },
  bigValue: { color: KARELA.color.textPrimary, fontSize: 40, lineHeight: 46, fontFamily: KARELA.font.black, fontVariant: ["tabular-nums"] },
  bigUnit: { color: KARELA.color.textSecondary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  label: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: 1 },
  sub: {
    flexDirection: "row",
    marginTop: KARELA.space.md,
    paddingTop: KARELA.space.sm,
    borderTopWidth: 1,
    borderTopColor: KARELA.color.lineSoft,
  },
  subItem: { flex: 1 },
  subValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold, fontVariant: ["tabular-nums"] },
  gpsRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 24 },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsText: { color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.sm,
    marginTop: KARELA.space.sm,
    paddingTop: KARELA.space.sm,
    borderTopWidth: 1,
    borderTopColor: KARELA.color.lineSoft,
  },
  statusText: { flex: 1, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, lineHeight: 17 },
});
