import { KARELA } from "@/styles/designSystem";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { IconButton } from "./Button";

/** Bottom sheet with a title and a close button. Used for short forms. */
export const Sheet = ({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={sheet.backdrop}
    >
      <View style={sheet.body}>
        <View style={sheet.head}>
          <Text style={sheet.title} accessibilityRole="header">
            {title}
          </Text>
          <IconButton icon="close" label="Close" tone="plain" onPress={onClose} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

/** Labelled text input in the sheet style. */
export const Field = ({
  label,
  wrapStyle,
  inputStyle,
  ...input
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  inputStyle?: object;
  wrapStyle?: object;
}) => (
  <View style={[sheet.field, wrapStyle]}>
    <Text style={sheet.fieldLabel}>{label}</Text>
    <TextInput
      {...input}
      style={[sheet.input, inputStyle]}
      placeholderTextColor={KARELA.color.textFaint}
      accessibilityLabel={label}
    />
  </View>
);

export const sheet = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  body: {
    backgroundColor: KARELA.color.surface,
    borderTopLeftRadius: KARELA.radius.xl,
    borderTopRightRadius: KARELA.radius.xl,
    padding: KARELA.space.xl,
    paddingBottom: KARELA.space.xxxl,
    maxHeight: "90%",
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  field: { marginTop: KARELA.space.md },
  fieldLabel: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.medium,
    marginBottom: 6,
  },
  note: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.regular,
    lineHeight: 16,
    marginTop: 6,
  },
  input: {
    backgroundColor: KARELA.color.bg,
    borderRadius: KARELA.radius.sm,
    paddingHorizontal: KARELA.space.md,
    minHeight: KARELA.tap,
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    borderWidth: 1,
    borderColor: KARELA.color.line,
  },
  error: {
    color: KARELA.color.danger,
    fontSize: 13,
    fontFamily: KARELA.font.medium,
    marginTop: KARELA.space.md,
  },
  buttons: { flexDirection: "row", gap: KARELA.space.md, marginTop: KARELA.space.xl },
});
