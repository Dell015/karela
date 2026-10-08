import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Block, g } from "@/components/guild/shared";
import { Button } from "@/components/ui/Button";
import { guildColor } from "@/services/guilds";
import { timeLeft } from "@/services/shop";
import { HOLDER_REASON, TerritoryState } from "@/services/territory";
import { KARELA } from "@/styles/designSystem";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/** Landmarks around the city and which guild holds each one. */
export const TerritoryTab = ({ state }: { state: TerritoryState }) => {
  const router = useRouter();
  const inGuild = !!state.my_guild_id;
  const r = state.rules;

  return (
    <>
      <Text style={[g.body, { marginTop: KARELA.space.xl }]}>
        Guilds win landmarks by running inside the circle around them. Each month&apos;s winner holds the landmark the
        next month and its flag flies on the Run map.
      </Text>
      <Text style={[g.muted, { marginTop: KARELA.space.sm }]}>
        A guild that runs {r.challenge_ratio}x the holder&apos;s distance in {r.challenge_days} days takes it early. A holder
        that stays away {r.forfeit_days} days loses it. Only the distance inside the circle leaves your phone, never your route.
      </Text>

      {inGuild && (
        <View style={s.boost}>
          <KarelaIcon name="boost" size={22} color={state.boost_until ? KARELA.color.brand : KARELA.color.textMuted} />
          <Text style={[g.body, { flex: 1 }]}>
            {state.boost_until
              ? `Territory Boost is on: your guild's distance counts ${r.boost_multiplier}x (${timeLeft(state.boost_until)}).`
              : "A Territory Boost makes your guild's distance count 1.2x for a day."}
          </Text>
          {!state.boost_until && <Button label="Shop" size="sm" variant="secondary" onPress={() => router.push("/drawer/shop")} />}
        </View>
      )}
      {!inGuild && (
        <Text style={[g.muted, { marginTop: KARELA.space.md }]}>Join a guild to count your runs toward a landmark.</Text>
      )}

      <Block icon="territory" title="Landmarks">
        {state.landmarks.length === 0 ? (
          <Text style={g.empty}>
            No landmarks yet. The Karela team adds landmarks around Tuguegarao, and they&apos;ll show here and on the Run map.
          </Text>
        ) : (
          state.landmarks.map((l) => {
            const held = !!l.holder.guild_id;
            const color = held ? guildColor(l.holder.color) : KARELA.color.textMuted;
            const top = l.month_top[0]?.km ?? 0;
            return (
              <View key={l.id} style={s.landmark}>
                <View style={s.lmHead}>
                  <KarelaIcon name="territory" size={22} color={color} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.lmName}>{l.name}</Text>
                    <Text style={[s.holder, { color }]}>
                      {held ? `${l.holder.name}, ${HOLDER_REASON[l.holder.reason].toLowerCase()}` : "Unclaimed"}
                    </Text>
                  </View>
                </View>
                {l.month_top.length > 0 ? (
                  <View style={{ marginTop: KARELA.space.sm, gap: 6 }}>
                    <Text style={g.muted}>This month</Text>
                    {l.month_top.map((t) => (
                      <View key={t.guild_id} style={s.barRow} accessible accessibilityLabel={`${t.name}, ${t.km} kilometres`}>
                        <Text style={s.barName} numberOfLines={1}>{t.name}</Text>
                        <View style={s.barTrack}>
                          <View style={[s.barFill, { width: `${Math.max(4, (t.km / Math.max(top, 0.01)) * 100)}%`, backgroundColor: guildColor(t.color) }]} />
                        </View>
                        <Text style={s.barKm}>{Number(t.km).toLocaleString()} km</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[g.muted, { marginTop: KARELA.space.sm }]}>No guild has run here this month.</Text>
                )}
                {inGuild && (
                  <Text style={[g.muted, { marginTop: KARELA.space.sm }]}>
                    Your guild: {Number(l.my_guild_month_km).toLocaleString()} km this month, {Number(l.my_guild_week_km).toLocaleString()} km in the last {r.challenge_days} days.
                  </Text>
                )}
              </View>
            );
          })
        )}
      </Block>
    </>
  );
};

const s = StyleSheet.create({
  boost: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    marginTop: KARELA.space.lg,
    paddingVertical: KARELA.space.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: KARELA.color.line,
  },
  landmark: { paddingVertical: KARELA.space.lg, borderBottomWidth: 1, borderBottomColor: KARELA.color.lineSoft },
  lmHead: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md },
  lmName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  holder: { fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginTop: 2 },
  barRow: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm },
  barName: { width: 96, color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: KARELA.color.surfaceSoft, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  barKm: { width: 64, textAlign: "right", color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
});
