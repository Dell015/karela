import { KARELA } from "@/styles/designSystem";
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
          <Ionicons name="chevron-back" size={28} color={KARELA.color.brand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LOADOUT_CORE</Text>
        <MaterialCommunityIcons name="shield-sync" size={24} color={KARELA.color.brand} />
      </View>

      {/* --- 3D PREVIEW AREA --- */}
      <View style={styles.previewContainer}>
        <LinearGradient colors={["transparent", "rgba(124, 242, 5, 0.1)", "transparent"]} style={styles.scannerLine} />
        <AniView action={currentAction} />
        <View style={styles.actionPills}>
          {["IDLE", "WALK", "RUN"].map((act) => (
            <TouchableOpacity key={act} onPress={() => setCurrentAction(`Female_rig|female_${act}`)} style={[styles.pill, currentAction.includes(act) && styles.pillActive]}>
              <Text style={[styles.pillText, currentAction.includes(act) && styles.pillTextActive]}>{act}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* --- CATEGORY SELECTOR TABS --- */}
      <View style={styles.categoryBar}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.catItem, selectedCategory === cat && styles.catItemActive]}>
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- INVENTORY GRID --- */}
      <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <TouchableOpacity key={item} style={styles.inventorySlot}>
              <MaterialCommunityIcons name={selectedCategory === "GEAR" ? "shield-check-outline" : "tshirt-crew"} size={32} color={item === 1 ? KARELA.color.brand : "rgba(124, 242, 5, 0.15)"} />
              <View style={styles.slotLevel}><Text style={styles.slotLevelText}>T-0{item}</Text></View>
              {item === 1 && (<View style={styles.equippedBadge}><View style={styles.equippedDot} /></View>)}
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
  container: { flex: 1, backgroundColor: KARELA.color.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: KARELA.space.xl, height: 60, borderBottomWidth: 1, borderBottomColor: KARELA.color.surface },
  backBtn: { padding: 5, marginLeft: -10 },
  headerTitle: { color: KARELA.color.brand, fontSize: KARELA.size.body, fontFamily: KARELA.font.black, letterSpacing: 4 },
  previewContainer: { height: "35%", width: "100%", backgroundColor: "#080808", position: "relative" },
  scannerLine: { position: "absolute", width: "100%", height: 120, top: "20%", zIndex: 1 },
  actionPills: { position: "absolute", right: KARELA.space.xl, top: KARELA.space.xl, gap: KARELA.space.sm, zIndex: 10 },
  pill: { backgroundColor: KARELA.color.surface, paddingVertical: 6, paddingHorizontal: KARELA.space.md, borderRadius: KARELA.space.xs, borderWidth: 1, borderColor: KARELA.color.surfaceSoft },
  pillActive: { borderColor: KARELA.color.brand, backgroundColor: "rgba(124, 242, 5, 0.1)" },
  pillText: { color: KARELA.color.textFaint, fontSize: 9, fontFamily: KARELA.font.bold },
  pillTextActive: { color: KARELA.color.brand },
  categoryBar: { flexDirection: "row", backgroundColor: "#0a0a0a" },
  catItem: { flex: 1, paddingVertical: 18, alignItems: "center" },
  catItemActive: { borderBottomWidth: 2, borderBottomColor: KARELA.color.brand },
  catText: { color: KARELA.color.textFaint, fontFamily: KARELA.font.black, fontSize: 11, letterSpacing: 1 },
  catTextActive: { color: KARELA.color.brand },
  gridContent: { padding: KARELA.space.xl, paddingBottom: KARELA.space.xxxl },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: KARELA.space.md },
  inventorySlot: { width: (width - 64) / 3, aspectRatio: 1, backgroundColor: KARELA.color.bg, borderRadius: KARELA.space.sm, borderWidth: 1, borderColor: KARELA.color.surfaceSoft, justifyContent: "center", alignItems: "center", position: "relative" },
  equippedBadge: { position: "absolute", top: 0, right: 0, padding: 6 },
  equippedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: KARELA.color.brand },
  slotLevel: { position: "absolute", bottom: 6, left: 6 },
  slotLevelText: { color: KARELA.color.textFaint, fontSize: 8, fontFamily: KARELA.font.bold },
  footer: { padding: KARELA.space.xl, borderTopWidth: 1, borderTopColor: KARELA.color.surface },
  saveBtn: { backgroundColor: KARELA.color.brand, padding: 18, borderRadius: KARELA.space.xs, alignItems: "center", ...KARELA.glow.brand },
  saveBtnText: { color: KARELA.color.onBright, fontFamily: KARELA.font.black, letterSpacing: 2 },
});
