import { CIVIC_CATEGORIES, CivicCategory } from "@/services/engines/CivicEngine";
import { ResonanceState } from "@/services/engines/ResonanceSystem";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

/* ============================================================
   DESIGN TOKENS — single source of truth for the Civic HUD
   ============================================================ */
const KARELA_GRADIENT = ["#7CF205", "#209F77"] as const; // signature brand gradient
const CIVIC_GRADIENT = ["#FF6B35", "#F7411D"] as const;   // civic-action accent

const C = {
  brand: "#7CF205",
  brandDeep: "#209F77",
  civic: "#FF6B35",
  gold: "#FFB347",
  bgSheet: "#141414",
  surface: "#161616",
  surfaceAlt: "#1F1F1F",
  cancel: "#202020",
  border: "rgba(255,255,255,0.08)",
  borderSoft: "rgba(255,255,255,0.05)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",
  textMuted: "#6B6B6B",
};

// 4-point spacing scale
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
// Radius scale
const R = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

interface CivicHUDProps {
  isRacing: boolean;
  resonance: ResonanceState | null;
  nearbyCount: number;
  onSubmitReport: (category: CivicCategory, photoUri: string) => Promise<void>;
}

const ROLE_CONFIG = {
  scout: {
    color: C.brand,
    label: "SCOUT",
    sub: "Passive sensing active",
    icon: "scan-outline" as const,
  },
  vanguard: {
    color: C.gold,
    label: "VANGUARD",
    sub: "Civic tasks available",
    icon: "shield-checkmark-outline" as const,
  },
  suppressed: {
    color: C.textMuted,
    label: "FOCUS",
    sub: "Push hard, civic paused",
    icon: "fitness-outline" as const,
  },
};

export const CivicHUD = ({
  isRacing,
  resonance,
  nearbyCount,
  onSubmitReport,
}: CivicHUDProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pulse animation for the FAB
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!isRacing) return null;

  const role = resonance?.currentRole ?? "scout";
  const config = ROLE_CONFIG[role];
  const stamina = resonance ? Math.round(resonance.staminaScore * 100) : 100;
  const suppressed = role === "suppressed";
  const isScout = role === "scout";

  const handlePick = async (category: CivicCategory) => {
    // 1. Request camera permission
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera Required",
        "Karela needs camera access to verify civic reports with a photo.",
      );
      return;
    }

    // 2. Open the in-app camera (gallery disabled — Proof of Impact requires live capture)
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      allowsEditing: false,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return; // user backed out of the camera
    }

    // 3. Upload + submit
    setSubmitting(true);
    await onSubmitReport(category, result.assets[0].uri);
    setSubmitting(false);
    setSheetOpen(false);
  };

  return (
    <>
      {/* RESONANCE INDICATOR PILL (top) */}
      <View style={styles.resonanceWrap} pointerEvents="none">
        <BlurView intensity={45} tint="dark" style={styles.resonancePill}>
          {/* Scout mode gets the signature Karela gradient dot; others a solid color */}
          {isScout ? (
            <LinearGradient
              colors={KARELA_GRADIENT}
              style={styles.roleDot}
            />
          ) : (
            <View style={[styles.roleDot, { backgroundColor: config.color }]} />
          )}

          <View style={styles.roleTextGroup}>
            <Text style={[styles.roleLabel, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.roleSub}>{config.sub}</Text>
          </View>

          {/* Stamina ring — gradient-filled when fresh, dimmed when fatigued */}
          {stamina >= 60 ? (
            <LinearGradient colors={KARELA_GRADIENT} style={styles.staminaRing}>
              <Text style={styles.staminaTextOnBrand}>{stamina}</Text>
              <Text style={styles.staminaPctOnBrand}>%</Text>
            </LinearGradient>
          ) : (
            <View style={styles.staminaRingDim}>
              <Text style={styles.staminaText}>{stamina}</Text>
              <Text style={styles.staminaPct}>%</Text>
            </View>
          )}
        </BlurView>
      </View>

      {/* CIVIC FAB (bottom-left) */}
      <Animated.View style={[styles.fabWrap, fabAnimStyle]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (suppressed) return;
            setSheetOpen(true);
          }}
          disabled={suppressed}
        >
          <LinearGradient
            colors={suppressed ? ["#3A3A3A", "#2A2A2A"] : CIVIC_GRADIENT}
            style={[styles.fab, !suppressed && styles.fabActiveShadow]}
          >
            <Ionicons
              name={suppressed ? "lock-closed" : "camera"}
              size={24}
              color="#fff"
            />
            {nearbyCount > 0 && !suppressed && (
              <LinearGradient colors={KARELA_GRADIENT} style={styles.fabBadge}>
                <Text style={styles.fabBadgeText}>{nearbyCount}</Text>
              </LinearGradient>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.fabLabel}>{suppressed ? "Paused" : "Report"}</Text>
      </Animated.View>

      {/* REPORT BOTTOM SHEET */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => !submitting && setSheetOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => !submitting && setSheetOpen(false)}
        />
        <View style={styles.sheet}>
          {/* Signature gradient accent at the very top of the sheet */}
          <LinearGradient
            colors={KARELA_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sheetAccent}
          />
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Report an Issue</Text>
              <Text style={styles.sheetSub}>
                {submitting
                  ? "Uploading photo & verifying location…"
                  : "Pick a category, then snap a photo. 3 reports verify a node."}
              </Text>
            </View>
            <View style={styles.sheetHeaderIcon}>
              <Ionicons name="camera" size={22} color={C.civic} />
            </View>
          </View>

          <View style={styles.grid}>
            {CIVIC_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
                disabled={submitting}
                onPress={() => handlePick(cat.id)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={cat.icon as any} size={22} color={C.civic} />
                </View>
                <Text style={styles.categoryLabel} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {submitting ? (
            <View style={styles.submittingRow}>
              <ActivityIndicator color={C.brand} />
              <Text style={styles.submittingText}>Submitting report…</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSheetOpen(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  /* ---------- Resonance pill ---------- */
  resonanceWrap: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    zIndex: 50,
  },
  resonancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.md,
    paddingLeft: SP.md,
    paddingRight: SP.xs + 2,
    paddingVertical: SP.xs + 2,
    borderRadius: R.pill,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  roleDot: { width: 10, height: 10, borderRadius: 5 },
  roleTextGroup: { justifyContent: "center" },
  roleLabel: { fontSize: 13, fontWeight: "900", letterSpacing: 1.2 },
  roleSub: { color: C.textSecondary, fontSize: 10, marginTop: 1 },
  staminaRing: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs + 2,
    borderRadius: R.pill,
  },
  staminaRingDim: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs + 2,
    borderRadius: R.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  staminaText: { color: C.textPrimary, fontSize: 15, fontWeight: "800" },
  staminaPct: { color: C.textMuted, fontSize: 10, marginLeft: 1 },
  staminaTextOnBrand: { color: "#04210A", fontSize: 15, fontWeight: "900" },
  staminaPctOnBrand: { color: "#04210A", fontSize: 10, marginLeft: 1, fontWeight: "800" },

  /* ---------- FAB ---------- */
  fabWrap: {
    position: "absolute",
    left: SP.lg,
    bottom: 150,
    alignItems: "center",
    zIndex: 50,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  fabActiveShadow: {
    elevation: 10,
    shadowColor: C.civic,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  fabBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SP.xs,
    borderWidth: 2,
    borderColor: "#0d0d0d",
  },
  fabBadgeText: { color: "#04210A", fontSize: 10, fontWeight: "900" },
  fabLabel: {
    color: C.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: SP.xs + 2,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },

  /* ---------- Bottom sheet ---------- */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bgSheet,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    paddingHorizontal: SP.xl,
    paddingTop: SP.md,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  sheetAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
    alignSelf: "center",
    marginBottom: SP.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SP.xl,
    gap: SP.md,
  },
  sheetHeaderText: { flex: 1 },
  sheetHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,107,53,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetTitle: { color: C.textPrimary, fontSize: 20, fontWeight: "800", letterSpacing: 0.3 },
  sheetSub: {
    color: C.textSecondary,
    fontSize: 12,
    marginTop: SP.xs + 1,
    lineHeight: 17,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SP.md,
  },
  categoryCard: {
    width: (width - SP.xl * 2 - SP.md) / 2,
    backgroundColor: C.surfaceAlt,
    borderRadius: R.md,
    padding: SP.lg,
    alignItems: "center",
    flexDirection: "row",
    gap: SP.md,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,107,53,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: { color: C.textPrimary, fontSize: 13, fontWeight: "600", flex: 1 },
  cancelBtn: {
    marginTop: SP.xl,
    paddingVertical: SP.lg,
    borderRadius: R.md,
    backgroundColor: C.cancel,
    alignItems: "center",
  },
  cancelText: { color: C.textSecondary, fontWeight: "700", fontSize: 14 },
  submittingRow: {
    marginTop: SP.xl,
    paddingVertical: SP.lg,
    borderRadius: R.md,
    backgroundColor: C.cancel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SP.md,
  },
  submittingText: { color: C.textSecondary, fontWeight: "700", fontSize: 13 },
});
