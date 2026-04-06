import { useAuth } from "@/context/AuthContext";
import { ProgressScreenUI } from '@/styles/progressScreenStyle';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


  import { AggregatedStats, getDynamicStats } from '@/services/statsService';

  const { width } = Dimensions.get('window');

  export default function ProgressScreen() {
    const { profile } = useAuth();
    const [activeIndex, setActiveIndex] = useState(0);
    const [statsArray, setStatsArray] = useState<AggregatedStats[]>([]);

    // useFocusEffect ensures stats refresh every time you navigate to this screen
    useFocusEffect(
      useCallback(() => {
        // 1. Get the local activity from SQLite
        const localData = getDynamicStats(); 
        
        // 2. Get the streak from Firebase/AuthContext
        const currentStreak = profile?.stats?.streak?.toString() || "0";

        // 3. Merge them so the UI has everything in one object
        const mergedData = localData.map(item => ({
          ...item,
          streak: currentStreak 
        }));

        setStatsArray(mergedData);
      }, [profile])
    );

    const currentXP = profile?.stats?.xp || 0; 
    const currentLevel = profile?.stats?.level || 1;
    const totalXP = 1000;

    // 2. Handle Snapping Index for Dots
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollOffset / width);
      setActiveIndex(index);
    };

    // 3. Render Individual Statistics Group (The Bento Boxes)
    const renderStats = ({ item }: { item: typeof statsArray[0] }) => (
      <View style={ProgressScreenUI.statsSlide}>
        <View style={ProgressScreenUI.row}>
          <Text style={ProgressScreenUI.sectionTitle}>{item.title} Statistics</Text>
          <View style={ProgressScreenUI.activeIndicator}>
              <Text style={ProgressScreenUI.activeIndicatorText}>LIVE DATA</Text>
          </View>
        </View>

        <View style={ProgressScreenUI.statsGrid}>
          {/* Main Distance Bento */}
          <View style={[ProgressScreenUI.statCard, ProgressScreenUI.bigCard]}>
            <Text style={ProgressScreenUI.statLabel}>Distance</Text>
            <Text style={ProgressScreenUI.statValue}>{item.distance} km</Text>
            <Ionicons name="location" size={28} color="white" style={ProgressScreenUI.statIcon} />
            <View style={ProgressScreenUI.miniPathLine} />
          </View>

          {/* Four Small Bento Cards */}
          <View style={ProgressScreenUI.statsRightCol}>
            <View style={ProgressScreenUI.statCardRow}>
              <View style={ProgressScreenUI.smallCard}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Streak</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{item.streak} d</Text>
                </View>
              </View>
              <View style={ProgressScreenUI.smallCard}>
                <MaterialCommunityIcons name="fire" size={18} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Burned</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{item.burned}</Text>
                </View>
              </View>
            </View>

            <View style={ProgressScreenUI.statCardRow}>
              <View style={ProgressScreenUI.smallCard}>
                <Ionicons name="trophy" size={16} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Wins</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{item.ghostWins}</Text>
                </View>
              </View>
              <View style={ProgressScreenUI.smallCard}>
                <MaterialCommunityIcons name="shoe-print" size={16} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Steps</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{item.steps}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );

    return (
      <ScrollView 
        style={ProgressScreenUI.container} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={ProgressScreenUI.header}>
          <TouchableOpacity 
            style={ProgressScreenUI.backButton}
            onPress={() => router.push("/drawer/dashboard")}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={ProgressScreenUI.menuButton}>
            <Ionicons name="menu" size={28} color="#7CF205" />
          </TouchableOpacity>
        </View>

        {/* PROFILE SECTION */}
        <View style={ProgressScreenUI.profileSection}>
          <View style={ProgressScreenUI.avatarWrapper}>
            <LinearGradient colors={['#7CF205', '#209F77']} style={ProgressScreenUI.avatarGradient}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/150' }} 
                style={ProgressScreenUI.avatarImage} 
              />
            </LinearGradient>
          </View>
          <Text style={ProgressScreenUI.rankText}>LVL {currentLevel} STRIDER</Text>
          <Text style={ProgressScreenUI.xpText}>{currentXP}/{totalXP} XP</Text>
          
          <TouchableOpacity style={ProgressScreenUI.rankButton}>
            <LinearGradient 
              colors={['#7CF205', '#209F77']} 
              start={{x:0, y:0}} 
              end={{x:1, y:0}} 
              style={ProgressScreenUI.gradientButton}
            >
              <Text style={ProgressScreenUI.buttonText}>See Ranks</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* SWIPEABLE BENTO BOXES (STATS) */}
        <View style={ProgressScreenUI.swipeWrapper}>
          <FlatList
            data={statsArray}
            renderItem={renderStats}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled={false} // False because we use snapToInterval for custom width snapping
            snapToInterval={width} 
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Animated Pagination Dots */}
          <View style={ProgressScreenUI.dotContainer}>
            {statsArray.map((_, index) => (
              <View 
                key={index} 
                style={[
                  ProgressScreenUI.dot, 
                  activeIndex === index ? ProgressScreenUI.dotActive : null
                ]} 
              />
            ))}
          </View>
        </View>

        {/* ACTIVITY HEATMAP */}
        <View style={ProgressScreenUI.sectionContainer}>
          <Text style={ProgressScreenUI.sectionTitle}>Activity Heatmap</Text>
          <View style={ProgressScreenUI.cardPlaceholder}>
            <Ionicons name="map-outline" size={40} color="#333" />
            <Text style={ProgressScreenUI.placeholderText}>[Glow Trails Preview]</Text>
            <TouchableOpacity style={ProgressScreenUI.mapBadge}>
              <Text style={ProgressScreenUI.mapBadgeText}>EXPLORE MAP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PERFORMANCE GRAPH */}
        <View style={ProgressScreenUI.sectionContainer}>
          <Text style={ProgressScreenUI.sectionTitle}>Performance Graph</Text>
          <View style={[ProgressScreenUI.cardPlaceholder, { height: 150 }]}>
            <Text style={ProgressScreenUI.placeholderText}>[Graph based on activity]</Text>
          </View>
        </View>

        {/* ACHIEVEMENTS */}  
        <View style={ProgressScreenUI.sectionContainer}>
          <Text style={ProgressScreenUI.sectionTitle}>Achievements</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={ProgressScreenUI.achievementScroll}
          >
            {['Velocity', 'Discovery', 'Endurance', 'Tactics', 'Vitality'].map((item, index) => (
              <View key={index} style={ProgressScreenUI.achievementItem}>
                <View style={ProgressScreenUI.achievementCircle}>
                  <Ionicons name="ribbon-outline" size={30} color="#333" />
                </View>
                <Text style={ProgressScreenUI.achievementTitle}>{item}</Text>
                <Text style={ProgressScreenUI.achievementProgress}>{index * 2 + 3}/20</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    );
  }