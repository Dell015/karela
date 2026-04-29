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

// Components
import { DynamicDock } from "@/components/DynamicDock";

const { width } = Dimensions.get("window");

const SHOP_CATEGORIES = ["GEAR", "BOOSTS", "AVATAR"];

const MOCK_ITEMS = [
  {
    id: "1",
    name: "Reflective Vest",
    price: 150,
    type: "GEAR",
    icon: "tshirt-crew",
    desc: "+10% Civic XP",
    rarity: "Common",
  },
  {
    id: "2",
    name: "Stamina Pack",
    price: 50,
    type: "BOOSTS",
    icon: "lightning-bolt",
    desc: "Instant Energy Refill",
    rarity: "Rare",
  },
  {
    id: "3",
    name: "Heavy Duty Boots",
    price: 450,
    type: "GEAR",
    icon: "shoe-cleat",
    desc: "Reduce Fatigue by 15%",
    rarity: "Epic",
  },
  {
    id: "4",
    name: "Urban Camo Skin",
    price: 1200,
    type: "AVATAR",
    icon: "shield-account",
    desc: "Squad Leader Visual",
    rarity: "Legendary",
  },
  {
    id: "5",
    name: "Digital Pedometer",
    price: 300,
    type: "GEAR",
    icon: "watch-variant",
    desc: "+5% Step Accuracy",
    rarity: "Rare",
  },
  {
    id: "6",
    name: "XP Multiplier",
    price: 100,
    type: "BOOSTS",
    icon: "trending-up",
    desc: "2x XP for 1 Hour",
    rarity: "Rare",
  },
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
        {/* Currency Header */}
        <View style={styles.currencyHeader}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#7CF205" />
          </TouchableOpacity>
          <View style={styles.balanceContainer}>
            <View style={styles.currencyBox}>
              <MaterialCommunityIcons
                name="diamond-stone"
                size={16}
                color="#00D1FF"
              />
              <Text style={styles.currencyText}>{userBalance.gems}</Text>
            </View>
            <View style={styles.currencyBox}>
              <MaterialCommunityIcons
                name="star-circle"
                size={16}
                color="#7CF205"
              />
              <Text style={styles.currencyText}>{userBalance.xp}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introSection}>
            <Text style={styles.title}>REQUISITION</Text>
            <Text style={styles.subtitle}>
              Equip yourself for the next operation
            </Text>
          </View>

          {/* Category Tabs */}
          <View style={styles.tabBar}>
            {SHOP_CATEGORIES.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Item Grid */}
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.itemCard}>
                <LinearGradient
                  colors={["#1A1A1A", "#0d0d0d"]}
                  style={styles.cardGradient}
                >
                  <View
                    style={[
                      styles.rarityTag,
                      { backgroundColor: getRarityColor(item.rarity) },
                    ]}
                  />

                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={40}
                    color="#7CF205"
                    style={styles.itemIcon}
                  />

                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>

                  <View style={styles.priceTag}>
                    <MaterialCommunityIcons
                      name="diamond-stone"
                      size={12}
                      color="#00D1FF"
                    />
                    <Text style={styles.priceText}>{item.price}</Text>
                  </View>

                  <TouchableOpacity style={styles.buyBtn}>
                    <Text style={styles.buyBtnText}>BUY</Text>
                  </TouchableOpacity>
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
    case "Legendary":
      return "#FFD700";
    case "Epic":
      return "#A06BFF";
    case "Rare":
      return "#00D1FF";
    default:
      return "#555";
  }
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  mainWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },

  // Header
  currencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  balanceContainer: { flexDirection: "row", gap: 10 },
  currencyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  currencyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },

  // Titles
  introSection: { marginBottom: 25, marginTop: 10 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 2 },
  subtitle: {
    color: "#7CF205",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Tabs
  tabBar: { flexDirection: "row", gap: 15, marginBottom: 25 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  activeTab: {
    backgroundColor: "rgba(124, 242, 5, 0.15)",
    borderWidth: 1,
    borderColor: "#7CF205",
  },
  tabText: { color: "#555", fontSize: 11, fontWeight: "900" },
  activeTabText: { color: "#7CF205" },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: { width: (width - 55) / 2, marginBottom: 15 },
  cardGradient: {
    borderRadius: 18,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  rarityTag: {
    width: 30,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    top: 10,
    right: 10,
  },
  itemIcon: { marginVertical: 15 },
  itemName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  itemDesc: {
    color: "#555",
    fontSize: 9,
    textAlign: "center",
    marginTop: 4,
    height: 25,
  },

  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  priceText: { color: "#00D1FF", fontSize: 13, fontWeight: "900" },

  buyBtn: {
    marginTop: 15,
    backgroundColor: "#fff",
    width: "100%",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  buyBtnText: { color: "#000", fontSize: 11, fontWeight: "900" },
});
