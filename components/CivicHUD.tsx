import { CIVIC_CATEGORIES, CivicCategory } from "@/services/engines/CivicEngine";
import { ResonanceState } from "@/services/engines/ResonanceSystem";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
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

interface CivicHUDProps {
  isRacing: boolean;
  resonance: ResonanceState | null;
  nearbyCount: number;
  onSubmitReport: (category: CivicCategory, photoUri: string) => Promise<void>;
}

const ROLE_CONFIG = {
  scout: {
    color: "#7CF205",
    label: "SCOUT",
    sub: "Passive sensing active",
    icon: "scan-outline" as const,
  },
  vanguard: {
    color: "#FFB347",
    label: "VANGUARD",
    sub: "Civic tasks available",
    icon: "shield-checkmark-outline" as const,
  },
  suppressed: {
    color: "#666",
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        <BlurView intensity={40} tint="dark" style={styles.resonancePill}>
          <View style={[styles.roleDot, { backgroundColor: config.color }]} />
          <View>
            <Text style={[styles.roleLabel, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.roleSub}>{config.sub}</Text>
          </View>
          {/* Stamina ring */}
          <View style={styles.staminaRing}>
            <Text style={styles.staminaText}>{stamina}</Text>
            <Text style={styles.staminaPct}>%</Text>
          </View>
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
            colors={suppressed ? ["#444", "#333"] : ["#FF6B35", "#F7411D"]}
            style={styles.fab}
          >
            <Ionicons
              name={suppressed ? "lock-closed" : "camera"}
              size={24}
              color="#fff"
            />
            {nearbyCount > 0 && !suppressed && (
              <View style={styles.fabBadge}>
                <Text style={styles.fabBadgeText}>{nearbyCount}</Text>
              </View>
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
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Report an Issue</Text>
              <Text style={styles.sheetSub}>
                {submitting
                  ? "Uploading photo & verifying location…"
                  : "Pick a category, then snap a photo. 3 reports verify a node."}
              </Text>
            </View>
            <Ionicons name="camera" size={28} color="#FF6B35" />
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
                  <Ionicons name={cat.icon as any} size={24} color="#FF6B35" />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setSheetOpen(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Resonance pill
  resonanceWrap: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    zIndex: 50,
  },
  resonancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  roleDot: { width: 10, height: 10, borderRadius: 5 },
  roleLabel: { fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  roleSub: { color: "#aaa", fontSize: 10, marginTop: 1 },
  staminaRing: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginLeft: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  staminaText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  staminaPct: { color: "#888", fontSize: 10, marginBottom: 2, marginLeft: 1 },

  // FAB
  fabWrap: {
    position: "absolute",
    left: 16,
    bottom: 150,
    alignItems: "center",
    zIndex: 50,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  fabBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#7CF205",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#000",
  },
  fabBadgeText: { color: "#000", fontSize: 10, fontWeight: "900" },
  fabLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    textShadowColor: "#000",
    textShadowRadius: 4,
  },

  // Bottom sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#141414",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sheetTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sheetSub: { color: "#888", fontSize: 12, marginTop: 4, maxWidth: width * 0.7 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,107,53,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
  cancelBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#222",
    alignItems: "center",
  },
  cancelText: { color: "#888", fontWeight: "700" },
});
