import { CivicNode } from "@/services/engines/CivicEngine";
import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface NodeDetailModalProps {
  visible: boolean;
  node: CivicNode | null;
  onClose: () => void;
  onReconfirm: (nodeId: string) => void;
}

const STATUS_CONFIG = {
  verified: { color: KARELA.color.civic, label: "VERIFIED", icon: "checkmark-circle" },
  pending: { color: KARELA.color.textMuted, label: "PENDING", icon: "time" },
  aging: { color: KARELA.vibrant.techOrange, label: "AGING", icon: "alert-circle" },
  expired: { color: KARELA.color.danger, label: "EXPIRED", icon: "close-circle" },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  trash: "Trash / Litter",
  flooding: "Flooding",
  drain_blockage: "Drain Blockage",
  damaged_infrastructure: "Damaged Infrastructure",
  unsafe_area: "Unsafe Area",
};

export const NodeDetailModal = ({
  visible,
  node,
  onClose,
  onReconfirm,
}: NodeDetailModalProps) => {
  if (!node) return null;

  const status = STATUS_CONFIG[node.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const confidence = Math.round((node.confidence || 0) * 100);
  const canReconfirm = node.status === "verified" || node.status === "aging";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <LinearGradient
          colors={KARELA.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accent}
        />
        <View style={styles.handle} />

        {/* HEADER */}
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
            <Ionicons name={status.icon as any} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={KARELA.color.textMuted} />
          </TouchableOpacity>
        </View>

        {/* CATEGORY TITLE */}
        <Text style={styles.title}>{CATEGORY_LABELS[node.category] || node.category}</Text>
        <Text style={styles.subtitle}>
          Reported by {node.report_count} {node.report_count === 1 ? "person" : "people"}
        </Text>

        {/* CONFIDENCE METER */}
        <View style={styles.meterSection}>
          <View style={styles.meterHeader}>
            <Text style={styles.meterLabel}>Confidence</Text>
            <Text style={styles.meterValue}>{confidence}%</Text>
          </View>
          <View style={styles.meterTrack}>
            <LinearGradient
              colors={confidence > 60 ? KARELA.gradients.brand : KARELA.gradients.energy as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.meterFill, { width: `${confidence}%` }]}
            />
          </View>
          <Text style={styles.meterHint}>
            {confidence > 70
              ? "Recently confirmed — high reliability"
              : confidence > 40
                ? "Aging — needs reconfirmation soon"
                : "Low confidence — may be resolved"}
          </Text>
        </View>

        {/* RECONFIRM CTA */}
        {canReconfirm && (
          <TouchableOpacity
            style={styles.reconfirmBtn}
            onPress={() => {
              onReconfirm(node.id);
              onClose();
            }}
          >
            <LinearGradient
              colors={KARELA.gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.reconfirmGradient}
            >
              <Ionicons name="checkmark-done" size={18} color={KARELA.color.onBright} />
              <Text style={styles.reconfirmText}>Still There — Reconfirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* INFO FOOTER */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color={KARELA.color.textMuted} />
            <Text style={styles.infoText}>
              {node.first_reported
                ? new Date(node.first_reported).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                : "Unknown"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={14} color={KARELA.color.textMuted} />
            <Text style={styles.infoText}>{node.report_count} reports</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: KARELA.color.surface,
    borderTopLeftRadius: KARELA.radius.xl,
    borderTopRightRadius: KARELA.radius.xl,
    padding: KARELA.space.xl,
    paddingBottom: 40,
    overflow: "hidden",
  },
  accent: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "#3A3A3A", alignSelf: "center", marginBottom: KARELA.space.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: KARELA.space.md },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: KARELA.radius.pill },
  statusText: { fontSize: 11, fontFamily: KARELA.font.bold, letterSpacing: 1 },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.bold },
  subtitle: { color: KARELA.color.textMuted, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular, marginTop: 4, marginBottom: KARELA.space.xl },
  meterSection: { marginBottom: KARELA.space.xl },
  meterHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: KARELA.space.sm },
  meterLabel: { color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  meterValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  meterTrack: { height: 8, backgroundColor: KARELA.color.surfaceSoft, borderRadius: 4, overflow: "hidden" },
  meterFill: { height: "100%", borderRadius: 4 },
  meterHint: { color: KARELA.color.textFaint, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: 6 },
  reconfirmBtn: { borderRadius: KARELA.radius.md, overflow: "hidden", marginBottom: KARELA.space.xl },
  reconfirmGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: KARELA.space.sm, paddingVertical: 14 },
  reconfirmText: { color: KARELA.color.onBright, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  infoRow: { flexDirection: "row", gap: KARELA.space.xl },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
});
