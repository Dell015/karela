import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

/**
 * Orange "Sample data" note, like the site's "Sample questions" badge.
 * Put it at the top of any screen that shows made-up content, so nobody
 * mistakes it for real data. Remove it when the screen uses real data.
 */
export const SampleNote = ({ children, style }: { children: string; style?: ViewStyle }) => (
  <View style={[styles.note, style]} accessibilityRole="text">
    <Ionicons name="flask-outline" size={16} color={KARELA.color.civic} />
    <Text style={styles.text}>
      <Text style={styles.strong}>Sample data. </Text>
      {children}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: KARELA.space.sm,
    padding: KARELA.space.md,
    borderRadius: KARELA.radius.md,
    backgroundColor: "rgba(255,159,28,0.10)", // civic orange at 10%
    borderWidth: 1,
    borderColor: "rgba(255,159,28,0.35)",
  },
  text: {
    flex: 1,
    color: KARELA.color.textSecondary,
    fontFamily: KARELA.font.regular,
    fontSize: KARELA.size.label,
    lineHeight: 18,
  },
  strong: { color: KARELA.color.civic, fontFamily: KARELA.font.bold },
});
