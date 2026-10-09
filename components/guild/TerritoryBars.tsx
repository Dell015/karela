import { g } from "@/components/guild/shared";
import { guildColor } from "@/services/guilds";
import { LandmarkState } from "@/services/territory";
import { KARELA } from "@/styles/designSystem";
import { StyleSheet, Text, View } from "react-native";

/**
 * This month's km per guild at one landmark, leader first. Used by the
 * Territory tab and the territory map.
 */
export const TerritoryBars = ({ monthTop }: { monthTop: LandmarkState["month_top"] }) => {
  // The server doesn't promise an order, so sort here: leader first, and every
  // bar is sized against the leader. (Stable sort keeps the server's
  // tie-break order for equal km.)
  const rows = [...monthTop].sort((a, b) => Number(b.km) - Number(a.km));
  const top = Number(rows[0]?.km ?? 0);

  if (rows.length === 0) {
    return <Text style={[g.muted, { marginTop: KARELA.space.sm }]}>No guild has run here this month.</Text>;
  }
  return (
    <View style={{ marginTop: KARELA.space.sm, gap: 6 }}>
      <Text style={g.muted}>This month</Text>
      {rows.map((t) => (
        <View key={t.guild_id} style={s.barRow} accessible accessibilityLabel={`${t.name}, ${t.km} kilometres`}>
          <Text style={s.barName} numberOfLines={1}>{t.name}</Text>
          <View style={s.barTrack}>
            <View
              style={[
                s.barFill,
                { width: `${Math.max(4, (Number(t.km) / Math.max(top, 0.01)) * 100)}%`, backgroundColor: guildColor(t.color) },
              ]}
            />
          </View>
          <Text style={s.barKm}>{Number(t.km).toLocaleString()} km</Text>
        </View>
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  barRow: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm },
  barName: { width: 96, color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: KARELA.color.surfaceSoft, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  barKm: { width: 64, textAlign: "right", color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
});
