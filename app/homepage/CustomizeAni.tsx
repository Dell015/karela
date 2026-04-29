import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Internal Components & Styles
import AniView from "@/components/AniModel";

const { width } = Dimensions.get("window");

export default function CustomizeScreen() {
  const [selectedCategory, setSelectedCategory] = useState("OUTFIT");
  const [currentAction, setCurrentAction] = useState("Female_rig|female_IDLE");

  const categories = ["OUTFIT", "HAIR", "GEAR", "COLOR"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- TOP NAVIGATION BAR --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#7CF205" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LOADOUT_CORE</Text>
        <MaterialCommunityIcons name="shield-sync" size={24} color="#7CF205" />
      </View>

      {/* --- 3D PREVIEW AREA --- */}
      <View style={styles.previewContainer}>
        {/* Futuristic Scanner Effect */}
        <LinearGradient
          colors={["transparent", "rgba(124, 242, 5, 0.1)", "transparent"]}
          style={styles.scannerLine}
        />

        <AniView action={currentAction} />

        {/* Quick Action Toggles (Top Right) */}
        <View style={styles.actionPills}>
          {["IDLE", "WALK", "RUN"].map((act) => (
            <TouchableOpacity
              key={act}
              onPress={() => setCurrentAction(`Female_rig|female_${act}`)}
              style={[
                styles.pill,
                currentAction.includes(act) && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  currentAction.includes(act) && styles.pillTextActive,
                ]}
              >
                {act}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* --- CATEGORY SELECTOR TABS --- */}
      <View style={styles.categoryBar}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.catItem,
              selectedCategory === cat && styles.catItemActive,
            ]}
          >
            <Text
              style={[
                styles.catText,
                selectedCategory === cat && styles.catTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- INVENTORY GRID --- */}
      <ScrollView
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <TouchableOpacity key={item} style={styles.inventorySlot}>
              <MaterialCommunityIcons
                name={
                  selectedCategory === "GEAR"
                    ? "shield-check-outline"
                    : "tshirt-crew"
                }
                size={32}
                color={item === 1 ? "#7CF205" : "rgba(124, 242, 5, 0.15)"}
              />
              <View style={styles.slotLevel}>
                <Text style={styles.slotLevelText}>T-0{item}</Text>
              </View>

              {/* Equipping Indicator */}
              {item === 1 && (
                <View style={styles.equippedBadge}>
                  <View style={styles.equippedDot} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* --- FOOTER SAVE ACTION --- */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>INITIALIZE LOADOUT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  backBtn: {
    padding: 5,
    marginLeft: -10,
  },
  headerTitle: {
    color: "#7CF205",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 4,
  },
  previewContainer: {
    height: "35%",
    width: "100%",
    backgroundColor: "#080808",
    position: "relative",
  },
  scannerLine: {
    position: "absolute",
    width: "100%",
    height: 120,
    top: "20%",
    zIndex: 1,
  },
  actionPills: {
    position: "absolute",
    right: 20,
    top: 20,
    gap: 8,
    zIndex: 10,
  },
  pill: {
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  pillActive: {
    borderColor: "#7CF205",
    backgroundColor: "rgba(124, 242, 5, 0.1)",
  },
  pillText: {
    color: "#555",
    fontSize: 9,
    fontWeight: "bold",
  },
  pillTextActive: {
    color: "#7CF205",
  },
  categoryBar: {
    flexDirection: "row",
    backgroundColor: "#0a0a0a",
  },
  catItem: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
  },
  catItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#7CF205",
  },
  catText: {
    color: "#444",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1,
  },
  catTextActive: {
    color: "#7CF205",
  },
  gridContent: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  inventorySlot: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  equippedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 6,
  },
  equippedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7CF205",
  },
  slotLevel: {
    position: "absolute",
    bottom: 6,
    left: 6,
  },
  slotLevelText: {
    color: "#444",
    fontSize: 8,
    fontWeight: "bold",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#111",
  },
  saveBtn: {
    backgroundColor: "#7CF205",
    padding: 18,
    borderRadius: 4,
    alignItems: "center",
    shadowColor: "#7CF205",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "900",
    letterSpacing: 2,
  },
});
