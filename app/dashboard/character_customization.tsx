import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// =========================================================
// 1. CONFIGURATION (ADJUST SPACES HERE)
// =========================================================

type GearType = "head" | "shirt" | "pants" | "shoes" | "accessory";

const SUB_TABS: Record<GearType, string[]> = {
  head: ["Skin", "Body Type", "Hair", "Face"],
  shirt: ["Tops", "Jackets", "Colors"],
  pants: ["Shorts", "Trousers", "Colors"],
  shoes: ["Sneakers", "Socks"],
  accessory: ["Watches", "Hats", "Glasses"],
};

const ITEM_GRID = Array.from({ length: 12 }).map((_, i) => ({ id: `item-${i}` }));

// --- ADJUST SPACING HERE ---
// "start" = The Arc shape (Before selection)
// "end"   = The Straight Row (After selection)
// The bubble size is 60px, so we subtract 30px to center them perfectly.

const CENTER_X = width * 0.5;      // Center of screen width
const CENTER_Y = height * 0.5;    // Vertical center point for the character

const BUBBLE_POSITIONS = {
  head: {
    // Top Center
    start: { top: CENTER_Y - 140, left: CENTER_X - 30 }, 
    // Middle of the row
    end:   { top: height * 0.50,  left: CENTER_X - 30 }, 
  },
  shirt: {
    // Top Left
    start: { top: CENTER_Y - 50,  left: CENTER_X - 120 },
    // Left side of row
    end:   { top: height * 0.50,  left: width * 0.30 - 30 }, 
  },
  pants: {
    // Top Right
    start: { top: CENTER_Y - 50,  left: CENTER_X + 60 },
    // Right side of row
    end:   { top: height * 0.50,  left: width * 0.70 - 30 }, 
  },
  shoes: {
    // Bottom Left
    start: { top: CENTER_Y + 70,  left: CENTER_X - 130 },
    // Far Left of row
    end:   { top: height * 0.50,  left: width * 0.12 - 30 }, 
  },
  accessory: {
    // Bottom Right
    start: { top: CENTER_Y + 70,  left: CENTER_X + 70 },
    // Far Right of row
    end:   { top: height * 0.50,  left: width * 0.88 - 30 }, 
  },
};

// =========================================================
// 2. HELPER COMPONENTS
// =========================================================

const GearNode = ({ 
  icon, 
  onPress, 
  isActive,
  animValue,
  config
}: { 
  icon: string; 
  onPress: () => void; 
  isActive: boolean;
  animValue: Animated.Value;
  config: { start: {top: number, left: number}, end: {top: number, left: number} };
}) => {
  
  // 1. Move Position (Arc -> Row)
  const top = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [config.start.top, config.end.top]
  });

  const left = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [config.start.left, config.end.left]
  });

  // 2. Scale Logic (The requested feature)
  // If Active: Grow to 1.2
  // If Inactive: Shrink to 0.8 (to make the active one pop)
  // If Closed (Start): Stay at 1.0
  const targetScale = isActive ? 1.2 : 0.8; 

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, targetScale] 
  });

  // 3. Opacity Logic (Optional: Dim inactive ones slightly)
  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isActive ? 1 : 0.6] 
  });

  return (
    <Animated.View style={[styles.gearNodeContainer, { top, left, transform: [{scale}], opacity }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchableArea}>
        {isActive && <View style={styles.activeGlow} />}
        <BlurView intensity={40} tint="dark" style={styles.gearNodeBlur}>
          <MaterialCommunityIcons name={icon as any} size={24} color="#fff" />
          <View style={[styles.gearNodeBorder, isActive && styles.activeBorder]} />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const XpBar = ({ current, total, level }: { current: number; total: number; level: number }) => (
  <View style={styles.xpContainer}>
    <View style={styles.levelBadge}>
      <Text style={styles.levelText}>Level {level}</Text>
    </View>
    <View style={styles.barBackground}>
      <LinearGradient
        colors={["#7CF205", "#209F77"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.barFill, { width: `${(current / total) * 100}%` }]}
      />
      <Text style={styles.xpText}>{current}/{total} XP</Text>
    </View>
  </View>
);

// =========================================================
// 3. MAIN COMPONENT
// =========================================================

export default function CharacterCreation() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<GearType | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<string>("");

  // 0 = Default (Arc), 1 = Active (Row)
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: activeCategory ? 1 : 0,
      duration: 400,
      easing: Easing.out(Easing.back(1.5)), 
      useNativeDriver: false, 
    }).start();
  }, [activeCategory]);

  const handleCategoryPress = (category: GearType) => {
    if (activeCategory === category) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category);
      setActiveSubTab(SUB_TABS[category][0]);
    }
  };

  // Character Animations
  const charTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100] // Moves UP by 100px
  });
  
  const charScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9] // Slight shrink
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={["#1a1a1a", "#0d0d0d"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </TouchableOpacity>
          <XpBar current={452} total={1000} level={2} />
        </View>

        {/* INVISIBLE BACKDROP */}
        {activeCategory && (
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={() => setActiveCategory(null)} 
          />
        )}

        {/* CHARACTER (Animated) */}
        <Animated.View 
          style={[
            styles.characterWrapper, 
            { transform: [{ translateY: charTranslateY }, { scale: charScale }] }
          ]}
        >
             <Image 
                source={{ uri: "https://via.placeholder.com/400x600/transparent/ffffff?text=Character" }} 
                style={styles.characterImage}
                resizeMode="contain"
             />
        </Animated.View>


        {/* BUBBLES */}
        {/* Note: I removed the manual scale={1.2} from Head. They are all equal now. */}
        
        <GearNode 
          icon="shoe-sneaker"
          isActive={activeCategory === 'shoes'}
          animValue={animValue}
          config={BUBBLE_POSITIONS.shoes}
          onPress={() => handleCategoryPress('shoes')}
        />

        <GearNode 
          icon="tshirt-crew"
          isActive={activeCategory === 'shirt'}
          animValue={animValue}
          config={BUBBLE_POSITIONS.shirt}
          onPress={() => handleCategoryPress('shirt')}
        />

        <GearNode 
          icon="human-handsup"
          isActive={activeCategory === 'head'}
          animValue={animValue}
          config={BUBBLE_POSITIONS.head}
          onPress={() => handleCategoryPress('head')}
        />

        <GearNode 
          icon="format-vertical-align-bottom"
          isActive={activeCategory === 'pants'}
          animValue={animValue}
          config={BUBBLE_POSITIONS.pants}
          onPress={() => handleCategoryPress('pants')}
        />

        <GearNode 
          icon="watch-variant"
          isActive={activeCategory === 'accessory'}
          animValue={animValue}
          config={BUBBLE_POSITIONS.accessory}
          onPress={() => handleCategoryPress('accessory')}
        />


        {/* BOTTOM PANEL */}
        {activeCategory && (
          <View style={styles.panelContainer}>
            <LinearGradient 
              colors={["#209F77", "#52CC39", "#67DF1F", "#7CF205"]} 
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.tabBar}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                {SUB_TABS[activeCategory].map((tab) => {
                  const isActiveTab = activeSubTab === tab;
                  return (
                    <TouchableOpacity 
                      key={tab} 
                      onPress={() => setActiveSubTab(tab)}
                      style={styles.tabItem}
                    >
                      <Text style={[styles.tabText, isActiveTab && styles.tabTextActive]}>
                        {tab}
                      </Text>
                      {isActiveTab && <View style={styles.activeTabIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </LinearGradient>

            <View style={styles.gridContainer}>
              <ScrollView contentContainerStyle={styles.gridScroll}>
                <View style={styles.grid}>
                  {ITEM_GRID.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.circleItem} />
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

      </SafeAreaView>
    </View>
  );
}

// =========================================================
// 4. STYLES
// =========================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 10, gap: 10, zIndex: 90 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 5 },
  xpContainer: { width: "100%", maxWidth: 400, alignSelf: "center" },
  levelBadge: { alignSelf: 'flex-start', marginBottom: 5 },
  levelText: { color: "#fff", fontSize: 20, fontFamily: "Excon-Bold" },
  barBackground: { height: 24, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, borderWidth: 1, borderColor: "#333", justifyContent: 'center', overflow: 'hidden' },
  barFill: { height: "100%", borderRadius: 12 },
  xpText: { position: "absolute", alignSelf: "center", color: "#fff", fontSize: 10, fontFamily: "Excon-Bold" },

  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'transparent', 
  },

  // CHARACTER
  characterWrapper: {
    position: 'absolute',
    top: height * 0.15, 
    left: 0,
    width: width,
    height: height * 0.6,
    zIndex: 10, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImage: {
    width: width * 0.9,
    height: "100%",
  },

  // BUBBLES
  gearNodeContainer: {
    position: 'absolute',
    width: 60, 
    height: 60,
    zIndex: 60, 
  },
  touchableArea: {
    width: 60, height: 60, justifyContent: 'center', alignItems: 'center'
  },
  gearNodeBlur: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", overflow: 'hidden' },
  gearNodeBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: "#fff", borderRadius: 28, opacity: 0.8, shadowColor: "#fff", shadowOpacity: 0.5, shadowRadius: 5 },
  activeBorder: { borderColor: "#7CF205", opacity: 1, borderWidth: 3 },
  activeGlow: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: '#7CF205', opacity: 0.4 },

  // PANEL
  panelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4, 
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 100, 
    overflow: 'hidden',
    shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 20,
  },
  tabBar: { height: 60, flexDirection: 'row', alignItems: 'center' },
  tabScroll: { paddingHorizontal: 20, gap: 30, alignItems: 'center' },
  tabItem: { height: 60, justifyContent: 'center', marginRight: 10 },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 18, fontFamily: "Excon-Medium" },
  tabTextActive: { color: '#fff', fontFamily: "Excon-Bold" },
  activeTabIndicator: { position: 'absolute', bottom: 12, left: 0, right: 0, height: 4, backgroundColor: '#fff', borderRadius: 2 },
  
  gridContainer: { flex: 1, padding: 25 },
  gridScroll: { paddingBottom: 50 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  circleItem: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#D9D9D9', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
});