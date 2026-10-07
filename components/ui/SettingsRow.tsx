import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface SettingsRowProps {
  icon: IconName;
  label: string;
  sublabel?: string;
  /** coral label and icon, for destructive actions */
  danger?: boolean;
  /** short value on the right, e.g. "Allowed" */
  value?: string;
  valueTone?: "ok" | "warn" | "muted";
  /** Renders a switch instead of a chevron. */
  toggle?: { value: boolean; onChange: (next: boolean) => void; disabled?: boolean };
  onPress?: () => void;
  /** last row in a group: no divider */
  last?: boolean;
}

/** One row of a settings group: icon, label, hint, and a switch, value or chevron. */
export const SettingsRow = ({
  icon,
  label,
  sublabel,
  danger,
  value,
  valueTone = "muted",
  toggle,
  onPress,
  last,
}: SettingsRowProps) => {
  const ink = danger ? KARELA.color.danger : KARELA.color.textPrimary;
  const valueColor =
    valueTone === "ok"
      ? KARELA.color.brand
      : valueTone === "warn"
        ? KARELA.color.civic
        : KARELA.color.textMuted;

  const body = (
    <>
      <View style={[s.iconBox, danger && s.iconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? KARELA.color.danger : KARELA.color.textSecondary} />
      </View>
      <View style={s.text}>
        <Text style={[s.label, { color: ink }]}>{label}</Text>
        {sublabel ? <Text style={s.sublabel}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={[s.value, { color: valueColor }]}>{value}</Text> : null}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          disabled={toggle.disabled}
          trackColor={{ false: KARELA.color.surfaceSoft, true: KARELA.color.brandDeep }}
          thumbColor={toggle.value ? KARELA.color.brand : KARELA.color.textMuted}
          ios_backgroundColor={KARELA.color.surfaceSoft}
          accessibilityLabel={label}
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={KARELA.color.textFaint} />
      ) : null}
    </>
  );

  // A toggle row is pressable as a whole too: the switch alone is a small target.
  const press = toggle && !toggle.disabled ? () => toggle.onChange(!toggle.value) : onPress;

  if (!press) {
    return <View style={[s.row, last && s.last]}>{body}</View>;
  }
  return (
    <Pressable
      onPress={press}
      accessibilityRole={toggle ? "switch" : "button"}
      accessibilityLabel={label}
      accessibilityHint={sublabel}
      accessibilityState={toggle ? { checked: toggle.value } : undefined}
      style={({ pressed }) => [s.row, last && s.last, pressed && s.pressed]}
    >
      {body}
    </Pressable>
  );
};

/** A titled group of rows. */
export const SettingsGroup = ({
  title,
  footnote,
  children,
}: {
  title: string;
  footnote?: string;
  children: React.ReactNode;
}) => (
  <View style={s.group}>
    <Text style={s.groupTitle} accessibilityRole="header">
      {title}
    </Text>
    <View style={s.card}>{children}</View>
    {footnote ? <Text style={s.footnote}>{footnote}</Text> : null}
  </View>
);

const s = StyleSheet.create({
  group: { marginBottom: KARELA.space.xxl },
  groupTitle: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.sm,
    marginLeft: KARELA.space.xs,
  },
  card: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  footnote: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.regular,
    lineHeight: 16,
    marginTop: KARELA.space.sm,
    marginHorizontal: KARELA.space.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingVertical: KARELA.space.md,
    paddingHorizontal: KARELA.space.lg,
    gap: KARELA.space.md,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  last: { borderBottomWidth: 0 },
  pressed: { backgroundColor: KARELA.color.surfaceAlt },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: KARELA.radius.sm,
    backgroundColor: KARELA.color.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  iconDanger: { backgroundColor: "rgba(255,77,109,0.12)" /* coral 12% */ },
  text: { flex: 1 },
  label: { fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  sublabel: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 17,
    marginTop: 2,
  },
  value: { fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
});
