import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const STROKE_WIDTH = 20;

interface IndividualQuest {
  id: string;
  mission: string;
  progress: number; // 0 to 1
  xp: number;
}

interface QuestCardProps {
  overallCompletion: number; // e.g., 0.7 for 70%
  quests: IndividualQuest[];
}

// 1. HELPER: Draws the semi-circle gauge background and filled path
const SemiCircleGauge = ({ percentage, size }: { percentage: number; size: number }) => {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // SVG Path for a half circle starting from left
  const pathData = `
    M ${cx - radius}, ${cy}
    A ${radius}, ${radius} 0 0, 1 ${cx + radius}, ${cy}
  `;

  // Calculate length for dashing
  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength - (percentage * arcLength);

  return (
    <Svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2}`}>
      <Defs>
        <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#209F77" stopOpacity="1" />
          <Stop offset="100%" stopColor="#7CF205" stopOpacity="1" />
        </SvgGradient>
      </Defs>
      {/* Background Track */}
      <Path
        d={pathData}
        fill="none"
        stroke="#222"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Progress Fill */}
      <Path
        d={pathData}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${arcLength}, ${arcLength}`}
        strokeDashoffset={strokeDashoffset}
      />
    </Svg>
  );
};

// 2. MAIN COMPONENT
export const QuestCard = ({ overallCompletion, quests }: QuestCardProps) => {
  const completionText = `${Math.round(overallCompletion * 100)}%`;

  return (
    <View style={styles.container}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => router.push("/drawer/quests")}
        >
          <Ionicons name="arrow-up-outline" size={18} color="white" style={{transform: [{rotate: '45deg'}]}} />
        </TouchableOpacity>
      </View>

      {/* OVERALL GAUGE SECTION */}
      <View style={styles.gaugeSection}>
        <View style={styles.gaugeWrapper}>
          <SemiCircleGauge percentage={overallCompletion} size={200} />
          <View style={styles.gaugeTextOverlay}>
            <Text style={styles.statusText}>Excellent</Text>
            <Text style={styles.percentageText}>{completionText}</Text>
            <Text style={styles.subText}>task completed this week</Text>
          </View>
        </View>
      </View>

      {/* ACTIVE QUESTS LIST */}
      <View style={styles.questsListSection}>
        <Text style={styles.sectionTitle}>Active Quests</Text>
        
        {quests.map((quest) => (
          <View key={quest.id} style={styles.questRow}>
            {/* Title */}
            <Text style={styles.questMissionText}>{quest.mission}</Text>
            
            {/* Horizontal Progress Bar */}
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']} // Orange/Yellow like picture
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${quest.progress * 100}%` }]}
              />
            </View>

            {/* XP Value */}
            <Text style={styles.questXpText}>{quest.xp}xp</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111', // Match dashboard background
    borderRadius: 30,
    padding: 25,
    width: '100%', // Take full width of parent padding
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconButton: {
    backgroundColor: '#1A1A1A',
    padding: 8,
    borderRadius: 12,
  },
  gaugeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    height: 120, // Constrain height for semi-circle
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTextOverlay: {
    position: 'absolute',
    top: STROKE_WIDTH + 10, // Adjust based on stroke width
    alignItems: 'center',
  },
  statusText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontFamily: 'Excon-Regular',
  },
  percentageText: {
    color: 'white',
    fontSize: 36,
    fontFamily: 'Excon-Black',
    marginVertical: -2,
  },
  subText: {
    color: '#A1A1AA',
    fontSize: 8,
    fontFamily: 'Excon-Thin',
  },
  questsListSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Excon-Bold',
    marginBottom: 15,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#1A1A1A', // Slightly lighter than card
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  questMissionText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Excon-Bold',
    flex: 2, // Take more space
  },
  progressBarTrack: {
    flex: 3, // Take most space
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  questXpText: {
    color: '#7CF205', // Lime green XP
    fontSize: 12,
    fontFamily: 'Excon-Bold',
    width: 45,
    textAlign: 'right',
  },
});