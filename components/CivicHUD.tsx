import { CIVIC_CATEGORIES, CivicCategory } from "@/services/engines/CivicEngine";
import { KARELA } from "@/styles/designSystem";
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
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

/* Short local names for the shared tokens in styles/designSystem.ts. */
const KARELA_GRADIENT = KARELA.gradient;
// Civic is the site's orange, solid (orange -> coral would read as danger).
const CIVIC_GRADIENT = [KARELA.color.civic, KARELA.color.civic] as const;
const MUTED_GRADIENT = [KARELA.color.surfaceSoft, KARELA.color.surfaceAlt] as const;

const C = {
  brand: KARELA.color.brand,
  civic: KARELA.color.civic,
  gold: KARELA.color.gold,
  bgSheet: KARELA.color.surface,
  surfaceAlt: KARELA.color.surfaceAlt,
  cancel: KARELA.color.surfaceSoft,
  border: KARELA.color.line,
  borderSoft: KARELA.color.lineSoft,
  textPrimary: KARELA.color.textPrimary,
  textSecondary: KARELA.color.textSecondary,
  textMuted: KARELA.color.textMuted,
  onBright: KARELA.color.onBright,
  civicTint: "rgba(255,159,28,0.14)", // civic orange at 14%
};
const SP = KARELA.space;
const R = KARELA.radius;
const FONT = KARELA.font;

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
    // An infinite withRepeat keeps running on the UI thread unless cancelled.
    return () => cancelAnimation(pulse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // 1. Check existing permission status first to decide whether to show
    //    a "go to settings" alert instead of re-requesting (iOS blocks re-prompts
    //    after the user has previously denied).
    const { status: existing } = await ImagePicker.getCameraPermissionsAsync();

    if (existing === 'denied') {
      // Already denied — can't re-prompt, send to Settings
      Alert.alert(
        "Camera access needed",
        "A report needs a photo. Turn on the camera for Karela in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // 2. Request permission (first-time prompt or undetermined state)
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera access needed",
        "A report needs a photo taken with your camera.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
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
    try {
      await onSubmitReport(category, result.assets[0].uri);
      setSheetOpen(false);
    } catch (e) {
      // Without this, a network failure leaves submitting=true forever and the
      // sheet becomes un-dismissable (backdrop/close are gated on !submitting).
      console.error("Civic report submit failed:", e);
      Alert.alert(
        "Report not sent",
        "Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
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
            colors={suppressed ? MUTED_GRADIENT : CIVIC_GRADIENT}
            style={[styles.fab, !suppressed && styles.fabActiveShadow]}
          >
            <Ionicons
              name={suppressed ? "lock-closed" : "camera"}
              size={24}
              color={suppressed ? C.textSecondary : C.onBright}
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
              <Text style={styles.sheetTitle}>Report an issue</Text>
              <Text style={styles.sheetSub}>
                {submitting
                  ? "Uploading your photo and checking your location…"
                  : "Pick a category, then take a photo. Reports from 3 neighbours verify an issue."}
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
  roleLabel: { fontSize: 13, fontFamily: FONT.black, letterSpacing: 1.2 },
  roleSub: { color: C.textSecondary, fontSize: KARELA.size.caption, fontFamily: FONT.regular, marginTop: 1 },
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
    backgroundColor: KARELA.color.surfaceSoft,
  },
  staminaText: { color: C.textPrimary, fontSize: 15, fontFamily: FONT.bold },
  staminaPct: { color: C.textMuted, fontSize: KARELA.size.caption, fontFamily: FONT.regular, marginLeft: 1 },
  staminaTextOnBrand: { color: C.onBright, fontSize: 15, fontFamily: FONT.black },
  staminaPctOnBrand: { color: C.onBright, fontSize: KARELA.size.caption, marginLeft: 1, fontFamily: FONT.bold },

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
  // A shadow is right here: the button floats over the map.
  fabActiveShadow: KARELA.glow.civic,
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
    borderColor: KARELA.color.bg,
  },
  fabBadgeText: { color: C.onBright, fontSize: KARELA.size.caption, fontFamily: FONT.black },
  fabLabel: {
    color: C.textPrimary,
    fontSize: KARELA.size.caption,
    fontFamily: FONT.bold,
    marginTop: SP.xs + 2,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },

  /* ---------- Bottom sheet ---------- */
  backdrop: {
    ...StyleSheet.absoluteFill,
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
    backgroundColor: KARELA.color.textFaint,
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
    backgroundColor: C.civicTint,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetTitle: { color: C.textPrimary, fontSize: 20, fontFamily: FONT.bold },
  sheetSub: {
    color: C.textSecondary,
    fontSize: KARELA.size.label,
    fontFamily: FONT.regular,
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
    backgroundColor: C.civicTint,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: { color: C.textPrimary, fontSize: 13, fontFamily: FONT.medium, flex: 1 },
  cancelBtn: {
    marginTop: SP.xl,
    paddingVertical: SP.lg,
    borderRadius: R.md,
    backgroundColor: C.cancel,
    alignItems: "center",
  },
  cancelText: { color: C.textSecondary, fontFamily: FONT.bold, fontSize: 14 },
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
  submittingText: { color: C.textSecondary, fontFamily: FONT.bold, fontSize: 13 },
});
