import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Block, confirm, g, Progress, useAction } from "@/components/guild/shared";
import { MemberRow } from "@/components/guild/MemberRow";
import { Button } from "@/components/ui/Button";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { Field, Sheet, sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/context/AuthContext";
import {
  cancelJoinRequest,
  contributeShield,
  createSquad,
  disbandSquad,
  isAtRisk,
  leaveSquad,
  memberName,
  newSquadCode,
  previewSquad,
  removeSquadMember,
  requestJoinSquad,
  respondJoinRequest,
  setSquadRole,
  SquadMember,
  SquadPreview,
  SquadState,
  updateSquad,
} from "@/services/squads";
import { KARELA } from "@/styles/designSystem";
import { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";

const SHIELD_STEPS = [20, 50, 100];

export const SquadTab = ({ state, onChange }: { state: SquadState; onChange: (s: SquadState) => void }) => {
  const { profile, reloadProfile } = useAuth();
  const { busy, run } = useAction();
  const me = profile?.uid;

  // Apply a server result and refresh Gems where they may have changed.
  const apply = async (key: string, fn: () => Promise<SquadState>, failTitle?: string) => {
    const next = await run(key, fn, failTitle);
    if (next) onChange(next);
    return next;
  };

  // Hooks first: they must run the same way whether or not there's a squad.
  const [picked, setPicked] = useState<SquadMember | null>(null);
  const [shieldFor, setShieldFor] = useState<SquadMember | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(state.squad?.name ?? "");

  if (!state.squad) return <NoSquad state={state} apply={apply} busy={busy} />;

  const squad = state.squad;
  const members = state.members ?? [];
  const officer = state.my_role === "leader" || state.my_role === "co_leader";
  const leader = state.my_role === "leader";
  const rules = state.rules;
  const gems = Number(profile?.stats?.gems ?? 0);


  const poolFor = (userId: string) => state.shields?.find((p) => p.target_id === userId);

  const share = () => {
    if (!squad.invite_code) return;
    Share.share({
      message: `Join my Karela squad "${squad.name}". In Karela, open Squad and guild, then enter the code ${squad.invite_code}.`,
    });
  };

  return (
    <>
      {/* Squad header: name, XP, size */}
      <View style={s.header}>
        <KarelaIcon name="squad" size={34} color={KARELA.color.brand} />
        <View style={{ flex: 1 }}>
          <Text style={s.squadName}>{squad.name}</Text>
          <Text style={g.muted}>
            {members.length} of {rules.max_members} members, {Number(squad.xp).toLocaleString()} Squad XP
          </Text>
        </View>
        {leader && (
          <Button label="Edit" variant="link" size="sm" onPress={() => { setNewName(squad.name); setSettingsOpen(true); }} />
        )}
      </View>
      {members.length < rules.min_members && (
        <Text style={[g.muted, { marginTop: KARELA.space.sm }]}>
          A squad is complete at {rules.min_members} people. Share the code to bring in {rules.min_members - members.length} more.
        </Text>
      )}

      {squad.invite_code && (
        <View style={s.codeBox}>
          <KarelaIcon name="ticket" size={22} color={KARELA.color.brand} />
          <View style={{ flex: 1 }}>
            <Text style={g.muted}>Invite code</Text>
            <Text style={s.code} selectable accessibilityLabel={`Invite code ${squad.invite_code.split("").join(" ")}`}>
              {squad.invite_code}
            </Text>
          </View>
          <Button label="Share" size="sm" variant="secondary" icon="share-outline" onPress={share} />
        </View>
      )}

      {/* Join requests */}
      {officer && (state.requests?.length ?? 0) > 0 && (
        <Block icon="ticket" title={`Asking to join (${state.requests!.length})`}>
          {state.requests!.map((r, i) => (
            <MemberRow
              key={r.user_id}
              member={r}
              last={i === state.requests!.length - 1}
              right={
                <View style={s.reqButtons}>
                  <Button
                    label="Accept"
                    size="sm"
                    loading={busy === `acc-${r.user_id}`}
                    onPress={() => apply(`acc-${r.user_id}`, () => respondJoinRequest(r.user_id, true), "Not accepted")}
                  />
                  <Button
                    label="Decline"
                    size="sm"
                    variant="link"
                    onPress={() => apply(`dec-${r.user_id}`, () => respondJoinRequest(r.user_id, false))}
                  />
                </View>
              }
            />
          ))}
        </Block>
      )}

      {/* Members */}
      <Block icon="streak" title="Members">
        {members.map((m, i) => {
          const pool = poolFor(m.user_id);
          const risk = isAtRisk(m) && !pool?.completed;
          return (
            <View key={m.user_id}>
              <MemberRow
                member={m}
                role={m.role}
                isMe={m.user_id === me}
                last={i === members.length - 1 && !risk}
                onPress={officer && m.user_id !== me ? () => setPicked(m) : undefined}
              />
              {pool?.completed && (
                <Text style={s.shieldDone}>Shielded today by {pool.helpers} {pool.helpers === 1 ? "squadmate" : "squadmates"}.</Text>
              )}
              {risk && m.user_id !== me && (
                <View style={s.riskRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.riskText}>{m.streak}-day streak at risk today</Text>
                    {pool && (
                      <Progress value={pool.collected} max={rules.shield_cost} label={`${pool.collected} of ${rules.shield_cost} Gems from ${pool.helpers}`} color={KARELA.color.civic} />
                    )}
                  </View>
                  {state.shield_window_open ? (
                    <Button label="Shield" size="sm" variant="civic" onPress={() => setShieldFor(m)} />
                  ) : (
                    <Text style={g.muted}>Shields open at 6 PM</Text>
                  )}
                </View>
              )}
              {risk && m.user_id === me && (
                <Text style={s.riskSelf}>Your streak is at risk today. A short walk saves it, or your squad can shield you after 6 PM.</Text>
              )}
            </View>
          );
        })}
      </Block>

      <Text style={[g.muted, { marginTop: KARELA.space.lg }]}>
        Collective Shield: after 6 PM, anyone in the squad can chip in Gems for someone whose streak is at risk. At{" "}
        {rules.shield_cost} Gems their streak is safe for the day. Gems come back if the shield doesn&apos;t fill by midnight.
      </Text>

      <View style={g.rowButtons}>
        <Button
          label="Leave squad"
          variant="secondary"
          size="sm"
          loading={busy === "leave"}
          onPress={() =>
            confirm(
              "Leave the squad?",
              `The XP you earned stays with ${squad.name}. You can ask to rejoin after ${rules.rejoin_hours} hours.`,
              "Leave",
              () => apply("leave", leaveSquad, "Couldn't leave"),
            )
          }
        />
      </View>

      {/* Officer options for one member */}
      <Sheet visible={!!picked} title={picked ? memberName(picked) : ""} onClose={() => setPicked(null)}>
        {picked && (
          <View style={{ gap: KARELA.space.sm, marginTop: KARELA.space.md }}>
            {leader && picked.role === "member" && (
              <Button label="Make co-leader" variant="secondary" block icon="star-outline"
                onPress={() => { setPicked(null); apply("role", () => setSquadRole(picked.user_id, "co_leader")); }} />
            )}
            {leader && picked.role === "co_leader" && (
              <Button label="Make member" variant="secondary" block
                onPress={() => { setPicked(null); apply("role", () => setSquadRole(picked.user_id, "member")); }} />
            )}
            {leader && (
              <Button label="Hand over leadership" variant="secondary" block
                onPress={() => {
                  setPicked(null);
                  confirm("Hand over leadership?", `${memberName(picked)} becomes the leader and you become a co-leader.`, "Hand over",
                    () => apply("role", () => setSquadRole(picked.user_id, "leader")), false);
                }} />
            )}
            {(leader || picked.role === "member") && (
              <Button label="Remove from squad" variant="danger" block
                onPress={() => {
                  setPicked(null);
                  confirm("Remove from the squad?", `${memberName(picked)} can ask to rejoin after ${rules.rejoin_hours} hours.`, "Remove",
                    () => apply("remove", () => removeSquadMember(picked.user_id)));
                }} />
            )}
          </View>
        )}
      </Sheet>

      {/* Collective Shield */}
      <Sheet visible={!!shieldFor} title="Collective Shield" onClose={() => setShieldFor(null)}>
        {shieldFor && (() => {
          const pool = poolFor(shieldFor.user_id);
          const left = rules.shield_cost - (pool?.collected ?? 0);
          return (
            <View>
              <Text style={[g.body, { marginTop: KARELA.space.md }]}>
                Help save <Text style={g.strong}>{memberName(shieldFor)}</Text>&apos;s {shieldFor.streak}-day streak.{" "}
                {left} Gems to go. You have {gems}.
              </Text>
              <View style={g.rowButtons}>
                {[...SHIELD_STEPS.filter((n) => n < left), left].map((n) => (
                  <Button
                    key={n}
                    label={n === left ? `All ${n}` : `${n}`}
                    size="sm"
                    variant={n === left ? "civic" : "secondary"}
                    disabled={gems < n}
                    loading={busy === `shield-${n}`}
                    onPress={async () => {
                      const next = await apply(`shield-${n}`, () => contributeShield(shieldFor.user_id, n), "Shield not added");
                      if (next) {
                        setShieldFor(null);
                        reloadProfile();
                      }
                    }}
                  />
                ))}
              </View>
              <Text style={sheet.note}>If the shield isn&apos;t full by midnight, your Gems come back.</Text>
            </View>
          );
        })()}
      </Sheet>

      {/* Leader settings */}
      <Sheet visible={settingsOpen} title="Squad settings" onClose={() => setSettingsOpen(false)}>
        <Field label="Squad name" value={newName} onChangeText={setNewName} maxLength={30} />
        <Text style={sheet.note}>You can rename the squad once every {rules.rename_days} days.</Text>
        <Button
          label="Save name"
          size="sm"
          style={{ marginTop: KARELA.space.md }}
          loading={busy === "rename"}
          disabled={newName.trim() === squad.name}
          onPress={async () => { if (await apply("rename", () => updateSquad(newName, null), "Not renamed")) setSettingsOpen(false); }}
        />
        <View style={{ marginTop: KARELA.space.lg }}>
          <SettingsRow
            icon="people-outline"
            label="Members can share the code"
            sublabel="Off: only you and co-leaders see it"
            toggle={{ value: squad.members_can_invite, onChange: (v) => apply("invite", () => updateSquad(null, v)) }}
          />
          <SettingsRow icon="refresh-outline" label="Make a new code" sublabel="The old code stops working"
            onPress={() => apply("code", newSquadCode)} />
          <SettingsRow icon="trash-outline" label="Disband the squad" danger last
            sublabel="Everyone leaves. Open shields give their Gems back."
            onPress={() => {
              setSettingsOpen(false);
              confirm("Disband the squad?", `${squad.name} closes for everyone. This can't be undone.`, "Disband",
                () => apply("disband", disbandSquad, "Not disbanded"));
            }} />
        </View>
      </Sheet>
    </>
  );
};

/** Not in a squad: join with a code, or start one. */
const NoSquad = ({
  state,
  apply,
  busy,
}: {
  state: SquadState;
  apply: (key: string, fn: () => Promise<SquadState>, failTitle?: string) => Promise<SquadState | null>;
  busy: string | null;
}) => {
  const { run } = useAction();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<SquadPreview | null>(null);
  const [name, setName] = useState("");
  const level = state.my_level ?? 1;
  const canCreate = level >= state.rules.min_level;

  if (state.pending_request) {
    return (
      <View style={[g.panel, { marginTop: KARELA.space.xl }]}>
        <Text style={g.body}>
          You asked to join <Text style={g.strong}>{state.pending_request.squad_name}</Text>. Their leader or a co-leader
          will let you in.
        </Text>
        <View style={g.rowButtons}>
          <Button label="Cancel request" variant="secondary" size="sm" loading={busy === "cancel"}
            onPress={() => apply("cancel", cancelJoinRequest)} />
        </View>
      </View>
    );
  }

  return (
    <>
      <Text style={[g.body, { marginTop: KARELA.space.xl }]}>
        A squad is {state.rules.min_members} to {state.rules.max_members} people who keep each other moving. You see each
        other&apos;s streaks, and when one is at risk the squad can chip in Gems to shield it.
      </Text>

      <Block icon="ticket" title="Join with a code">
        <Field
          label="Invite code"
          value={code}
          onChangeText={(t) => { setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); setPreview(null); }}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="6 letters or numbers"
          maxLength={6}
        />
        {preview ? (
          <View style={[g.panel, { marginTop: KARELA.space.md }]}>
            <Text style={g.body}>
              <Text style={g.strong}>{preview.name}</Text>, {preview.members} of {preview.max_members} members,{" "}
              {Number(preview.xp).toLocaleString()} Squad XP
            </Text>
            <View style={g.rowButtons}>
              <Button label="Ask to join" size="sm" loading={busy === "join"}
                onPress={() => apply("join", () => requestJoinSquad(code), "Request not sent")} />
            </View>
          </View>
        ) : (
          <Button label="Find squad" size="sm" variant="secondary" style={{ marginTop: KARELA.space.md }}
            disabled={code.length !== 6}
            onPress={async () => setPreview(await run("find", () => previewSquad(code), "No squad found"))} />
        )}
      </Block>

      <Block icon="squad" title="Start a squad">
        {canCreate ? (
          <>
            <Field label="Squad name" value={name} onChangeText={setName} maxLength={30} placeholder="For example: Carig Morning Crew" />
            <Button label="Start squad" size="sm" style={{ marginTop: KARELA.space.md }} loading={busy === "create"}
              disabled={name.trim().length < 3}
              onPress={() => apply("create", () => createSquad(name), "Squad not started")} />
          </>
        ) : (
          <Progress value={level} max={state.rules.min_level}
            label={`You can start a squad at Level ${state.rules.min_level}. You're Level ${level}. You can still join one with a code.`} />
        )}
      </Block>
    </>
  );
};

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md, marginTop: KARELA.space.xl },
  squadName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    marginTop: KARELA.space.lg,
    paddingVertical: KARELA.space.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: KARELA.color.line,
  },
  code: { color: KARELA.color.brand, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black, letterSpacing: 4 },
  reqButtons: { alignItems: "flex-end", gap: 2 },
  riskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingBottom: KARELA.space.md,
    paddingLeft: 56,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  riskText: { color: KARELA.color.civic, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold, marginBottom: 6 },
  riskSelf: { color: KARELA.color.civic, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, lineHeight: 18, paddingLeft: 56, paddingBottom: KARELA.space.md },
  shieldDone: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, paddingLeft: 56, paddingBottom: KARELA.space.sm },
});
