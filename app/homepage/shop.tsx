import { KARELA } from "@/styles/designSystem";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DynamicDock } from "@/components/DynamicDock";

const { width } = Dimensions.get("window");
const SHOP_CATEGORIES = ["GEAR", "BOOSTS", "AVATAR"];

const MOCK_ITEMS = [
  { id: "1", name: "Reflective Vest", price: 150, type: "GEAR", icon: "tshirt-crew", desc: "+10% Civic XP", rarity: "Common" },
  { id: "2", name: "Stamina Pack", price: 50, type: "BOOSTS", icon: "lightning-bolt", desc: "Instant Energy Refill", rarity: "Rare" },
  { id: "3", name: "Heavy Duty Boots", price: 450, type: "GEAR", icon: "shoe-cleat", desc: "Reduce Fatigue by 15%", rarity: "Epic" },
  { id: "4", name: "Urban Camo Skin", price: 1200, type: "AVATAR", icon: "shield-account", desc: "Squad Leader Visual", rarity: "Legendary" },
  { id: "5", name: "Digital Pedometer", price: 300, type: "GEAR", icon: "watch-variant", desc: "+5% Step Accuracy", rarity: "Rare" },
  { id: "6", name: "XP Multiplier", price: 100, type: "BOOSTS", icon: "trending-up", desc: "2x XP for 1 Hour", rarity: "Rare" },
];

export default function ShopScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [activeTab, setActiveTab] = useState("GEAR");
  const [userBalance] = useState({ gems: 1250, xp: 4500 });
  const filteredItems = MOCK_ITEMS.filter((item) => item.type === activeTab);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.mainWrapper}>
        <View style={styles.currencyHeader}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color={KARELA.color.brand} />
          </TouchableOpacity>
          <View style={styles.balanceContainer}>
            <View style={styles.currencyBox}>
              <MaterialCommunityIcons name="diamond-stone" size={16} color={KARELA.vibrant.sky} />
              <Text style={styles.currencyText}>{userBalance.gems}</Text>
            </View>
            <View style={styles.currencyBox}>
              <MaterialCommunityIcons name="star-circle" size={16} color={KARELA.color.brand} />
              <Text style={styles.currencyText}>{userBalance.xp}</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.introSection}>
            <Text style={styles.title}>REQUISITION</Text>
            <Text style={styles.subtitle}>Equip yourself for the next operation</Text>
          </View>

          <View style={styles.tabBar}>
            {SHOP_CATEGORIES.map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.itemCard}>
                <LinearGradient colors={[KARELA.color.surface, KARELA.color.bg]} style={styles.cardGradient}>
                  <View style={[styles.rarityTag, { backgroundColor: getRarityColor(item.rarity) }]} />
                  <MaterialCommunityIcons name={item.icon as any} size={40} color={KARELA.color.brand} style={styles.itemIcon} />
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                  <View style={styles.priceTag}>
                    <MaterialCommunityIcons name="diamond-stone" size={12} color={KARELA.vibrant.sky} />
                    <Text style={styles.priceText}>{item.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.buyBtn}><Text style={styles.buyBtnText}>BUY</Text></TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <DynamicDock />
      </View>
    </SafeAreaView>
  );
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "Legendary": return KARELA.color.gold;
    case "Epic": return "#A06BFF";
    case "Rare": return KARELA.vibrant.sky;
    default: return KARELA.color.textFaint;
  }
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KARELA.color.bg },
  mainWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: KARELA.space.xl, paddingBottom: 140 },
  currencyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: KARELA.space.xl, paddingVertical: 15 },
  balanceContainer: { flexDirection: "row", gap: 10 },
  currencyBox: { flexDirection: "row", alignItems: "center", backgroundColor: KARELA.color.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: KARELA.radius.lg, borderWidth: 1, borderColor: KARELA.color.surfaceSoft },
  currencyText: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold, marginLeft: 5 },
  introSection: { marginBottom: 25, marginTop: 10 },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.display, fontFamily: KARELA.font.black, letterSpacing: 2 },
  subtitle: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, letterSpacing: 0.5 },
  tabBar: { flexDirection: "row", gap: 15, marginBottom: 25 },
  tab: { paddingVertical: KARELA.space.sm, paddingHorizontal: 15, borderRadius: KARELA.space.sm, backgroundColor: "#111" },
  activeTab: { backgroundColor: "rgba(124, 242, 5, 0.15)", borderWidth: 1, borderColor: KARELA.color.brand },
  tabText: { color: KARELA.color.textFaint, fontSize: 11, fontFamily: KARELA.font.black },
  activeTabText: { color: KARELA.color.brand },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  itemCard: { width: (width - 55) / 2, marginBottom: 15 },
  cardGradient: { borderRadius: KARELA.radius.lg, padding: 15, alignItems: "center", borderWidth: 1, borderColor: KARELA.color.surfaceSoft },
  rarityTag: { width: 30, height: 4, borderRadius: 2, position: "absolute", top: 10, right: 10 },
  itemIcon: { marginVertical: 15 },
  itemName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold, textAlign: "center" },
  itemDesc: { color: KARELA.color.textFaint, fontSize: 9, fontFamily: KARELA.font.regular, textAlign: "center", marginTop: KARELA.space.xs, height: 25 },
  priceTag: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: KARELA.space.xs },
  priceText: { color: KARELA.vibrant.sky, fontSize: 13, fontFamily: KARELA.font.black },
  buyBtn: { marginTop: 15, backgroundColor: KARELA.color.textPrimary, width: "100%", paddingVertical: KARELA.space.sm, borderRadius: KARELA.space.sm, alignItems: "center" },
  buyBtnText: { color: KARELA.color.onBright, fontSize: 11, fontFamily: KARELA.font.black },
});
