import { useAuth } from "@/context/AuthContext";
import { ProgressScreenUI } from '@/styles/progressScreenStyle';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');


export default function ProgressScreen() {
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly'>('weekly');
  const { profile, loading } = useAuth();

  // Placeholder Data
  const stats = {
    weekly: { distance: "14.2", streak: "5", burned: "5,880", ghostWins: "3", steps: "53,178" },
    monthly: { distance: "62.5", streak: "18", burned: "24,500", ghostWins: "12", steps: "210,442" }
  };

  const currentXP = profile?.stats?.xp || 0; 
  const currentLevel = profile?.stats?.level || 1;
  const currentStats = stats[timeFrame];
  const currentStreak = profile?.stats?.streak || 0;
  const totalXP = 1000;
  const progressPercent = (currentXP / totalXP) * 100;

  return (
    <ScrollView style={ProgressScreenUI.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER & AVATAR */}
      <View style={ProgressScreenUI.header}>
        <TouchableOpacity 
          style={ProgressScreenUI.backButton} 
          onPress={() => router.push("/dashboard/dashboard")}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={ProgressScreenUI.menuButton}>
          <Ionicons name="menu" size={28} color="#7CF205" />
        </TouchableOpacity>
      </View>

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

      {/* ACTIVITY HEATMAP PREVIEW */}
      <View style={ProgressScreenUI.sectionContainer}>
        <Text style={ProgressScreenUI.sectionTitle}>Activity Heatmap</Text>
        <View style={ProgressScreenUI.cardPlaceholder}>
          <Ionicons name="map-outline" size={40} color="#333" />
          <Text style={ProgressScreenUI.placeholderText}>[Glow Trails Preview]</Text>
          <TouchableOpacity style={ProgressScreenUI.mapBadge}>
            <Text style={ProgressScreenUI.mapBadgeText}>Click to see more</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PERFORMANCE GRAPH */}
      <View style={ProgressScreenUI.sectionContainer}>
        <Text style={ProgressScreenUI.sectionTitle}>Performance graph</Text>
        <View style={[ProgressScreenUI.cardPlaceholder, { height: 150 }]}>
           <Text style={ProgressScreenUI.placeholderText}>[Graph based on activity]</Text>
        </View>
      </View>

      {/* STATISTICS WITH TOGGLE */}
      <View style={ProgressScreenUI.sectionContainer}>
        <View style={ProgressScreenUI.row}>
          <Text style={ProgressScreenUI.sectionTitle}>
            {timeFrame === 'weekly' ? 'Weekly' : 'Monthly'} Statistics
          </Text>
          <TouchableOpacity onPress={() => setTimeFrame(timeFrame === 'weekly' ? 'monthly' : 'weekly')}>
             <Ionicons name="ellipsis-horizontal" size={24} color="#7CF205" />
          </TouchableOpacity>
        </View>

        <View style={ProgressScreenUI.statsGrid}>
          {/* Big Card */}
          <View style={[ProgressScreenUI.statCard, ProgressScreenUI.bigCard]}>
            <Text style={ProgressScreenUI.statLabel}>Distance</Text>
            <Text style={ProgressScreenUI.statValue}>{currentStats.distance} km</Text>
            <Ionicons name="location" size={30} color="white" style={ProgressScreenUI.statIcon} />
            <View style={ProgressScreenUI.miniPathLine} />
          </View>

          <View style={ProgressScreenUI.statsRightCol}>
            <View style={ProgressScreenUI.statCardRow}>
              <View style={ProgressScreenUI.smallCard}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Streak</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{currentStats.streak} days</Text>
                </View>
              </View>
              <View style={ProgressScreenUI.smallCard}>
                <MaterialCommunityIcons name="fire" size={24} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Burned</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{currentStats.burned} kcal</Text>
                </View>
              </View>
            </View>

            <View style={ProgressScreenUI.statCardRow}>
              <View style={ProgressScreenUI.smallCard}>
                <Ionicons name="trophy" size={20} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Ghost Wins</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{currentStats.ghostWins}</Text>
                </View>
              </View>
              <View style={ProgressScreenUI.smallCard}>
                <MaterialCommunityIcons name="shoe-print" size={20} color="white" />
                <View>
                  <Text style={ProgressScreenUI.statLabelSmall}>Steps</Text>
                  <Text style={ProgressScreenUI.statValueSmall}>{currentStats.steps}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ACHIEVEMENTS */}
      <View style={ProgressScreenUI.sectionContainer}>
        <Text style={ProgressScreenUI.sectionTitle}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ProgressScreenUI.achievementScroll}>
          {['Velocity', 'Discovery', 'Endurance', 'Tactics', 'Vitality'].map((item, index) => (
            <View key={index} style={ProgressScreenUI.achievementItem}>
              <View style={ProgressScreenUI.achievementCircle} />
              <Text style={ProgressScreenUI.achievementTitle}>{item}</Text>
              <Text style={ProgressScreenUI.achievementProgress}>{index * 2 + 3}/20</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}