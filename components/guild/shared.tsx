import { KarelaIcon, KarelaIconName } from "@/components/icons/KarelaIcon";
import { errorMessage } from "@/services/rpc";
import { KARELA } from "@/styles/designSystem";
import { ReactNode, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

/**
 * Runs a server action, shows its message if it fails, and tracks which
 * action is busy (so only that button spins).
 */
export const useAction = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async <T,>(key: string, fn: () => Promise<T>, failTitle = "That didn't work"): Promise<T | null> => {
    setBusy(key);
    try {
      return await fn();
    } catch (e) {
      Alert.alert(failTitle, errorMessage(e));
      return null;
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
};

/** Asks before doing something that can't be undone. */
export const confirm = (title: string, body: string, action: string, onYes: () => void, destructive = true) =>
  Alert.alert(title, body, [
    { text: "Cancel", style: "cancel" },
    { text: action, style: destructive ? "destructive" : "default", onPress: onYes },
  ]);

export const Block = ({
  icon,
  title,
  aside,
  children,
}: {
  icon?: KarelaIconName;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) => (
  <View style={g.block}>
    <View style={g.blockHead}>
      {icon && <KarelaIcon name={icon} size={20} color={KARELA.color.brand} />}
      <Text style={g.blockTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      {aside}
    </View>
    {children}
  </View>
);

/** Thin progress bar with a label under it. */
export const Progress = ({ value, max, label, color = KARELA.color.brand }: { value: number; max: number; label: string; color?: string }) => {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <View accessible accessibilityLabel={label} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
      <View style={g.track}>
        <View style={[g.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={g.progressLabel}>{label}</Text>
    </View>
  );
};

export const g = StyleSheet.create({
  block: { marginTop: KARELA.space.xxl },
  blockHead: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm, marginBottom: KARELA.space.sm },
  blockTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  body: { color: KARELA.color.textSecondary, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular, lineHeight: 22 },
  muted: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, lineHeight: 18 },
  strong: { color: KARELA.color.textPrimary, fontFamily: KARELA.font.bold },
  track: { height: 8, borderRadius: 4, backgroundColor: KARELA.color.surfaceSoft, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  progressLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 6 },
  rowButtons: { flexDirection: "row", gap: KARELA.space.sm, flexWrap: "wrap", marginTop: KARELA.space.md },
  panel: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.md,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
    padding: KARELA.space.lg,
  },
  stats: { flexDirection: "row", marginTop: KARELA.space.md },
  stat: { flex: 1, paddingVertical: KARELA.space.sm },
  statRule: { borderLeftWidth: 1, borderLeftColor: KARELA.color.line, paddingLeft: KARELA.space.md },
  statNum: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black },
  statLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 2 },
  empty: { color: KARELA.color.textMuted, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular, lineHeight: 22, paddingVertical: KARELA.space.md },
});
