import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Block, confirm, g, Progress, useAction } from "@/components/guild/shared";
import { MemberRow } from "@/components/guild/MemberRow";
import { Button } from "@/components/ui/Button";
import { Field, Sheet, sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/context/AuthContext";
import { GAME_ART } from "@/services/gameArt";
import {
  applyToGuild,
  BADGES,
  cancelGuildApplication,
  foundGuild,
  GUILD_COLORS,
  GuildColor,
  guildColor,
  GuildListItem,
  GuildMember,
  GuildState,
  leaveGuild,
  listGuilds,
  removeGuildSquad,
  respondGuildApplication,
  setGuildRole,
  updateGuild,
} from "@/services/guilds";
import { memberName } from "@/services/squads";
import { KARELA } from "@/styles/designSystem";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLOR_NAMES: Record<GuildColor, string> = {
  lime: "Lime", teal: "Teal", aqua: "Aqua", sky: "Sky", orange: "Orange", coral: "Coral", gold: "Gold",
};
const MEMBERS_SHOWN = 8;

export const GuildTab = ({
  state,
  onChange,
  goToSquad,
}: {
  state: GuildState;
  onChange: (s: GuildState) => void;
  goToSquad: () => void;
}) => {
  const { profile } = useAuth();
  const { busy, run } = useAction();
  const [picked, setPicked] = useState<GuildMember | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(state.guild?.name ?? "");
  const [newColor, setNewColor] = useState<GuildColor>(state.guild?.color ?? "lime");

  const apply = async (key: string, fn: () => Promise<GuildState>, failTitle?: string) => {
    const next = await run(key, fn, failTitle);
    if (next) onChange(next);
    return next;
  };

  if (!state.in_squad) {
    return (
      <View style={{ marginTop: KARELA.space.xl }}>
        <Text style={g.body}>
          Guilds are made of squads. Join or start a squad first, then your squad can found a guild or join one.
        </Text>
        <View style={g.rowButtons}>
          <Button label="Go to Squad" size="sm" onPress={goToSquad} />
        </View>
      </View>
    );
  }

  if (!state.guild) return <NoGuild state={state} apply={apply} busy={busy} />;

  const guild = state.guild;
  const color = guildColor(guild.color);
  const officer = state.my_role === "leader" || state.my_role === "co_leader";
  const leader = state.my_role === "leader";
  const squadLeader = state.squad_role === "leader";
  const members = state.members ?? [];
  const shown = showAll ? members : members.slice(0, MEMBERS_SHOWN);
  const badges = state.badges ?? {};
  const week = state.week;

  const badgeProgress = (id: string) => {
    if (badges[id as keyof typeof badges]) return "Earned";
    if (id === "century_walkers") return `${Number(guild.km_since_founding).toLocaleString()} of ${state.rules.century_km.toLocaleString()} km`;
    if (id === "bayanihan_heart") return `${guild.verified_reports} of ${state.rules.bayanihan_reports} reports`;
    if (id === "vanguard_guild") return "Coming later";
    return "Not yet";
  };

  return (
    <>
      {/* Banner: the guild's colour runs down the side, like its flag on the map */}
      <View style={[s.banner, { borderLeftColor: color }]}>
        <KarelaIcon name="guild" size={36} color={color} />
        <View style={{ flex: 1 }}>
          <Text style={s.guildName}>{guild.name}</Text>
          <Text style={g.muted}>
            {(state.squads ?? []).length} of {state.rules.max_squads} squads, {members.length} members,{" "}
            {Number(guild.xp).toLocaleString()} XP
          </Text>
        </View>
        {leader && <Button label="Edit" variant="link" size="sm" onPress={() => { setNewName(guild.name); setNewColor(guild.color); setSettingsOpen(true); }} />}
      </View>

      {week && (
        <View style={g.stats}>
          <View style={g.stat}>
            <Text style={g.statNum}>{Number(week.km).toLocaleString()}</Text>
            <Text style={g.statLabel}>km this week</Text>
          </View>
          <View style={[g.stat, g.statRule]}>
            <Text style={g.statNum}>{week.reports}</Text>
            <Text style={g.statLabel}>civic reports</Text>
          </View>
          <View style={[g.stat, g.statRule]}>
            <Text style={g.statNum}>{week.active_members}</Text>
            <Text style={g.statLabel}>members ran</Text>
          </View>
        </View>
      )}

      <Block icon="medal" title="Badges">
        <View style={s.badges}>
          {BADGES.map((b) => {
            const earned = !!badges[b.id];
            return (
              <View key={b.id} style={s.badge} accessible accessibilityLabel={`${b.name}. ${b.goal}. ${earned ? "Earned" : badgeProgress(b.id)}. ${b.reward}`}>
                <Image source={GAME_ART[`badge_${b.id}`]} style={[s.badgeArt, !earned && s.badgeLocked]} contentFit="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={[s.badgeName, !earned && { color: KARELA.color.textSecondary }]}>{b.name}</Text>
                  <Text style={g.muted}>{b.goal}</Text>
                  <Text style={[s.badgeState, earned && { color: KARELA.color.brand }]}>
                    {earned ? `Earned. ${b.reward}` : `${badgeProgress(b.id)}. Reward: ${b.reward.charAt(0).toLowerCase()}${b.reward.slice(1)}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Block>

      {officer && (state.applications?.length ?? 0) > 0 && (
        <Block icon="ticket" title={`Squads asking to join (${state.applications!.length})`}>
          {state.applications!.map((a) => (
            <View key={a.squad_id} style={s.appRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowName}>{a.name}</Text>
                <Text style={g.muted}>{a.members} members, {Number(a.xp).toLocaleString()} Squad XP</Text>
              </View>
              <Button label="Accept" size="sm" loading={busy === `acc-${a.squad_id}`}
                onPress={() => apply(`acc-${a.squad_id}`, () => respondGuildApplication(a.squad_id, true), "Not accepted")} />
              <Button label="Decline" size="sm" variant="link"
                onPress={() => apply(`dec-${a.squad_id}`, () => respondGuildApplication(a.squad_id, false))} />
            </View>
          ))}
        </Block>
      )}

      <Block icon="squad" title="Squads">
        {(state.squads ?? []).map((sq) => {
          const mine = sq.id === state.my_squad_id;
          return (
            <View key={sq.id} style={s.appRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowName}>{sq.name}{mine ? <Text style={g.muted}>  your squad</Text> : null}</Text>
                <Text style={g.muted}>{sq.members} members, {Number(sq.xp).toLocaleString()} Squad XP</Text>
              </View>
              {officer && !mine && (
                <Button label="Remove" size="sm" variant="link"
                  onPress={() => confirm("Remove this squad?", `${sq.name} leaves ${guild.name}.`, "Remove",
                    () => apply(`rm-${sq.id}`, () => removeGuildSquad(sq.id), "Not removed"))} />
              )}
            </View>
          );
        })}
      </Block>

      <Block icon="squad" title="Members">
        {shown.map((m, i) => (
          <MemberRow
            key={m.user_id}
            member={m}
            role={m.role}
            sub={m.squad_name}
            isMe={m.user_id === profile?.uid}
            last={i === shown.length - 1}
            onPress={leader && m.user_id !== profile?.uid ? () => setPicked(m) : undefined}
          />
        ))}
        {members.length > MEMBERS_SHOWN && (
          <Button label={showAll ? "Show fewer" : `Show all ${members.length}`} variant="link" size="sm" onPress={() => setShowAll(!showAll)} />
        )}
      </Block>

      {squadLeader && (
        <View style={g.rowButtons}>
          <Button label="Take my squad out" variant="secondary" size="sm" loading={busy === "leave"}
            onPress={() => confirm("Leave the guild?", `Your whole squad leaves ${guild.name}.`, "Leave",
              () => apply("leave", leaveGuild, "Couldn't leave"))} />
        </View>
      )}

      <Sheet visible={!!picked} title={picked ? memberName(picked) : ""} onClose={() => setPicked(null)}>
        {picked && (
          <View style={{ gap: KARELA.space.sm, marginTop: KARELA.space.md }}>
            {picked.role === "member" ? (
              <Button label="Make guild co-leader" variant="secondary" block
                onPress={() => { setPicked(null); apply("role", () => setGuildRole(picked.user_id, "co_leader")); }} />
            ) : (
              <Button label="Make member" variant="secondary" block
                onPress={() => { setPicked(null); apply("role", () => setGuildRole(picked.user_id, "member")); }} />
            )}
            <Button label="Hand over guild leadership" variant="secondary" block
              onPress={() => {
                setPicked(null);
                confirm("Hand over the guild?", `${memberName(picked)} leads ${guild.name}. You become a co-leader.`, "Hand over",
                  () => apply("role", () => setGuildRole(picked.user_id, "leader")), false);
              }} />
          </View>
        )}
      </Sheet>

      <Sheet visible={settingsOpen} title="Guild settings" onClose={() => setSettingsOpen(false)}>
        <Field label="Guild name" value={newName} onChangeText={setNewName} maxLength={30} />
        <Text style={sheet.note}>You can rename the guild once every {state.rules.rename_days} days.</Text>
        <ColorPicker value={newColor} onChange={setNewColor} />
        <View style={sheet.buttons}>
          <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setSettingsOpen(false)} />
          <Button label="Save" style={{ flex: 1 }} loading={busy === "edit"}
            onPress={async () => {
              const ok = await apply("edit", () => updateGuild(newName.trim() === guild.name ? null : newName, newColor === guild.color ? null : newColor), "Not saved");
              if (ok) setSettingsOpen(false);
            }} />
        </View>
      </Sheet>
    </>
  );
};

const ColorPicker = ({ value, onChange }: { value: GuildColor; onChange: (c: GuildColor) => void }) => (
  <View style={{ marginTop: KARELA.space.lg }}>
    <Text style={sheet.fieldLabel}>Banner colour</Text>
    <View style={s.colors}>
      {(Object.keys(GUILD_COLORS) as GuildColor[]).map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          accessibilityRole="radio"
          accessibilityLabel={COLOR_NAMES[c]}
          accessibilityState={{ selected: value === c }}
          hitSlop={4}
          style={[s.swatch, { backgroundColor: GUILD_COLORS[c] }, value === c && s.swatchOn]}
        />
      ))}
    </View>
  </View>
);

/** In a squad but not a guild: found one (leader, enough XP) or apply to one. */
const NoGuild = ({
  state,
  apply,
  busy,
}: {
  state: GuildState;
  apply: (key: string, fn: () => Promise<GuildState>, failTitle?: string) => Promise<GuildState | null>;
  busy: string | null;
}) => {
  const [guilds, setGuilds] = useState<GuildListItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<GuildColor>("lime");
  const { run } = useAction();
  const rules = state.rules;
  const leader = state.squad_role === "leader";
  const xp = Number(state.squad_xp ?? 0);
  const size = Number(state.squad_members ?? 0);
  const canFound = leader && xp >= rules.found_xp && size >= rules.min_squad_members;

  const load = useCallback(async () => {
    const list = await run("list", () => listGuilds(search.trim() || undefined), "Couldn't load guilds");
    if (list) setGuilds(list);
  }, [run, search]);

  // First load only; searching is done with the button.
  useEffect(() => {
    let alive = true;
    listGuilds()
      .then((list) => alive && setGuilds(list))
      .catch(() => alive && setGuilds([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <Text style={[g.body, { marginTop: KARELA.space.xl }]}>
        A guild brings up to {rules.max_squads} squads together for bigger things: clean-up drives, fun runs, and
        winning landmarks around the city.
      </Text>

      {state.application && (
        <View style={[g.panel, { marginTop: KARELA.space.lg }]}>
          <Text style={g.body}>
            Your squad asked to join <Text style={g.strong}>{state.application.guild_name}</Text>. Their leader or a co-leader will decide.
          </Text>
          {leader && (
            <View style={g.rowButtons}>
              <Button label="Withdraw" variant="secondary" size="sm" loading={busy === "withdraw"}
                onPress={() => apply("withdraw", cancelGuildApplication)} />
            </View>
          )}
        </View>
      )}

      <Block icon="guild" title="Found a guild">
        <Progress value={xp} max={rules.found_xp} label={`${xp.toLocaleString()} of ${rules.found_xp.toLocaleString()} Squad XP`} />
        {size < rules.min_squad_members && (
          <Text style={[g.muted, { marginTop: KARELA.space.sm }]}>Your squad also needs {rules.min_squad_members} members ({size} now).</Text>
        )}
        {canFound ? (
          <>
            <Field label="Guild name" value={name} onChangeText={setName} maxLength={30} placeholder="For example: Tuguegarao Striders" />
            <ColorPicker value={color} onChange={setColor} />
            <Button label="Found the guild" size="sm" style={{ marginTop: KARELA.space.md }} loading={busy === "found"}
              disabled={name.trim().length < 3}
              onPress={() => apply("found", () => foundGuild(name, color), "Guild not founded")} />
          </>
        ) : !leader ? (
          <Text style={[g.muted, { marginTop: KARELA.space.sm }]}>Your squad leader can found a guild once the squad gets there.</Text>
        ) : null}
      </Block>

      <Block icon="territory" title="Join a guild">
        <View style={s.searchRow}>
          <Field label="Search by name" value={search} onChangeText={setSearch} wrapStyle={{ flex: 1, marginTop: 0 }} returnKeyType="search" onSubmitEditing={load} />
          <Button label="Search" size="sm" variant="secondary" onPress={load} style={{ marginTop: 22 }} />
        </View>
        {guilds === null ? null : guilds.length === 0 ? (
          <Text style={g.empty}>No guilds yet. Yours could be the first.</Text>
        ) : (
          guilds.map((gl) => {
            const full = gl.squads >= gl.max_squads;
            return (
              <View key={gl.id} style={[s.appRow, { borderLeftWidth: 3, borderLeftColor: guildColor(gl.color), paddingLeft: KARELA.space.md }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowName}>{gl.name}</Text>
                  <Text style={g.muted}>
                    {gl.squads} of {gl.max_squads} squads, {gl.members} members, {Number(gl.xp).toLocaleString()} XP
                    {gl.badges.length ? `, ${gl.badges.length} ${gl.badges.length === 1 ? "badge" : "badges"}` : ""}
                  </Text>
                </View>
                {gl.applied ? (
                  <Text style={g.muted}>Asked</Text>
                ) : leader ? (
                  <Button label={full ? "Full" : "Ask to join"} size="sm" variant="secondary" disabled={full}
                    loading={busy === `apply-${gl.id}`}
                    onPress={async () => { if (await apply(`apply-${gl.id}`, () => applyToGuild(gl.id), "Not sent")) load(); }} />
                ) : null}
              </View>
            );
          })
        )}
        {!leader && <Text style={g.muted}>Only your squad leader can ask a guild to take the squad in.</Text>}
      </Block>
    </>
  );
};

const s = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    marginTop: KARELA.space.xl,
    paddingLeft: KARELA.space.md,
    borderLeftWidth: 4,
  },
  guildName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black },
  badges: { gap: KARELA.space.md },
  badge: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md },
  badgeArt: { width: 56, height: 56 },
  badgeLocked: { opacity: 0.3 },
  badgeName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  badgeState: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginTop: 2 },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.sm,
    minHeight: 60,
    paddingVertical: KARELA.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  rowName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: KARELA.space.md },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: "transparent" },
  swatchOn: { borderColor: KARELA.color.textPrimary },
  searchRow: { flexDirection: "row", alignItems: "flex-start", gap: KARELA.space.sm },
});

