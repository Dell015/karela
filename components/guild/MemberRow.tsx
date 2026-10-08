import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Avatar } from "@/components/ui/Avatar";
import { memberName, PublicMember } from "@/services/squads";
import { KARELA } from "@/styles/designSystem";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Role = "leader" | "co_leader" | "member";

/** One person in a squad or guild list: photo, name, role, level, streak. */
export const MemberRow = ({
  member,
  role,
  sub,
  isMe,
  right,
  onPress,
  last,
}: {
  member: PublicMember;
  role?: Role;
  /** small line under the name, e.g. squad name */
  sub?: string;
  isMe?: boolean;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) => {
  const name = memberName(member);
  const atRisk = member.streak > 0 && !member.covered_today;
  const roleLabel = role === "leader" ? "Leader" : role === "co_leader" ? "Co-leader" : null;

  const body = (
    <>
      <Avatar uri={member.profile_picture} name={name} size={44} frame={member.frame} />
      <View style={{ flex: 1 }}>
        <View style={s.nameLine}>
          <Text style={s.name} numberOfLines={1}>
            {name}
            {isMe ? <Text style={s.me}> (you)</Text> : null}
          </Text>
          {role === "leader" && <KarelaIcon name="crown" size={16} color={KARELA.color.gold} />}
          {role === "co_leader" && <KarelaIcon name="star" size={15} color={KARELA.vibrant.sky} />}
        </View>
        <Text style={s.meta}>
          {[roleLabel, `Level ${member.level}`, sub].filter(Boolean).join(", ")}
        </Text>
      </View>
      <View style={s.streak} accessible accessibilityLabel={`${member.streak}-day streak${atRisk ? ", at risk today" : ""}`}>
        <KarelaIcon
          name="streak"
          size={18}
          color={member.streak === 0 ? KARELA.color.textFaint : atRisk ? KARELA.color.civic : KARELA.color.brand}
        />
        <Text style={[s.streakNum, atRisk && { color: KARELA.color.civic }]}>{member.streak}</Text>
      </View>
      {right}
    </>
  );

  if (!onPress) return <View style={[s.row, last && s.last]}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}${roleLabel ? `, ${roleLabel}` : ""}. Options`}
      style={({ pressed }) => [s.row, last && s.last, pressed && { backgroundColor: KARELA.color.surfaceAlt }]}
    >
      {body}
    </Pressable>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    minHeight: 64,
    paddingVertical: KARELA.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  last: { borderBottomWidth: 0 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: KARELA.space.xs },
  name: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold, flexShrink: 1 },
  me: { color: KARELA.color.textMuted, fontFamily: KARELA.font.regular },
  meta: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 2 },
  streak: { flexDirection: "row", alignItems: "center", gap: 3, minWidth: 40, justifyContent: "flex-end" },
  streakNum: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
});
