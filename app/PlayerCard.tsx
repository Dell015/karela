import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from './styles/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * REUSABLE COMPONENT: STAT ITEM
 * Displays a single metric (like Distance or Pace) with a neon icon.
 * Using a sub-component here keeps the main dashboard code clean.
 */
const StatItem = ({ label, value, icon }: { label: string; value: string; icon: any }) => (
  <View style={styles.statItem}>
    {/* Icon using the Karela Green theme color */}
    <Ionicons name={icon} size={20} color="#7CF205" />
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

/**
 * PLAYER CARD SCREEN
 * The "Profile" of the runner. Designed with a high-tech/gaming aesthetic.
 */
export default function PlayerCard() {
  return (
    <View style={theme.container}>
      
      {/* BACKGROUND DECORATION
          Creates the consistent "Karela Glow" using gradients and a deep blur.
      */}
      <View style={theme.glowContainer}>
        <LinearGradient colors={["#209F77", "#7CF205"]} style={theme.leftBlur} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* --- SECTION 1: PROFILE HEADER --- 
            Displays user identity and their current "Gamified" level.
        */}
        <View style={styles.profileHeader}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/150' }} // TODO: Replace with local storage/Firebase URI
              style={styles.profileImage} 
            />
            {/* Level Badge: Overlays the bottom of the profile picture */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL 12</Text>
            </View>
          </View>
          <Text style={styles.userName}>Randel_Karela</Text>
          <Text style={styles.userTitle}>Ghost Runner</Text>
        </View>

        {/* --- SECTION 2: STATS GRID --- 
            A 2x2 grid showing the user's lifetime running achievements.
        */}
        <View style={styles.statsGrid}>
          <StatItem icon="walk-outline" label="Total KM" value="124.5" />
          <StatItem icon="time-outline" label="Avg Pace" value="5'12\" />
          <StatItem icon="flame-outline" label="Calories" value="12,403" />
          <StatItem icon="trophy-outline" label="Runs" value="42" />
        </View>

        {/* --- SECTION 3: GHOST PERFORMANCE (Thesis Core) --- 
            Shows how the user performs against their "Ghost" data.
        */}
        <View style={styles.ghostSection}>
          <Text style={styles.sectionTitle}>Ghost Performance</Text>
          
          {/* Glassmorphic Card: Uses subtle transparency and border to pop against the dark BG */}
          <BlurView intensity={20} style={styles.ghostCard}>
            <View style={styles.ghostRow}>
              <Text style={styles.ghostText}>Ghost Win Rate</Text>
              <Text style={[styles.ghostText, { color: '#7CF205' }]}>68%</Text>
            </View>

            {/* Custom Progress Bar: Visual representation of win rate */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '68%' }]} />
            </View>

            <Text style={styles.ghostSubtext}>
              You are currently faster than your ghost on 4/5 routes.
            </Text>
          </BlurView>
        </View>

        {/* --- SECTION 4: ACTIONS --- */}
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// --- STYLING (LOCAL) ---
const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#7CF205', // Neon Border
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#7CF205',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontFamily: 'Excon-Bold',
    fontSize: 12,
    color: '#000', // Black text on neon green BG for high contrast
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Excon-Bold',
    color: '#fff',
  },
  userTitle: {
    fontSize: 14,
    fontFamily: 'Excon-Regular',
    color: '#7CF205',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 30,
  },
  statItem: {
    width: '47%', // Allows two items per row with spacing
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle "Glass" feel
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Excon-Bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Excon-Regular',
  },
  ghostSection: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Excon-Bold',
    marginBottom: 15,
  },
  ghostCard: {
    padding: 20,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ghostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ghostText: {
    color: '#fff',
    fontFamily: 'Excon-Bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7CF205',
    borderRadius: 4,
  },
  ghostSubtext: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Excon-Regular',
  },
  editButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#7CF205',
  },
  editButtonText: {
    color: '#7CF205',
    fontFamily: 'Excon-Bold',
  },
});