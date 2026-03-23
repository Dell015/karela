import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

interface QuestCardProps {
  title: string;
  mission: string;
  xp: number;
  progress: number; // 0 to 1
  colors: string[];
}

export const QuestCard = ({ title, mission, xp, progress, colors }: QuestCardProps) => {
  const size = 70;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={styles.cardContainer}>
      {/* The Top Gradient "Border" */}
      <LinearGradient colors={colors as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topBar} />
      
      <View style={styles.content}>
        {/* Left: Circular Progress */}
        <View style={styles.progressWrapper}>
          <Svg width={size} height={size}>
            {/* Background Circle */}
            <Circle cx={size/2} cy={size/2} r={radius} stroke="#222" strokeWidth={strokeWidth} fill="transparent" />
            {/* Progress Circle */}
            <Circle 
              cx={size/2} cy={size/2} r={radius} 
              stroke={colors[0]} strokeWidth={strokeWidth} 
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size/2}, ${size/2}`}
            />
          </Svg>
        </View>

        {/* Right: Text Info */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.missionText}>{mission}</Text>
          <Text style={styles.xpText}>+{xp}xp</Text>
        </View>
      </View>

      {/* View Details Button */}
      <TouchableOpacity style={styles.detailsButton}>
        <LinearGradient colors={colors as [string, string]} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>View Details</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#151515',
    borderRadius: 25,
    width: 280,
    marginRight: 15,
    overflow: 'hidden',
    paddingBottom: 15,
  },
  topBar: { height: 20 },
  content: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  progressWrapper: { marginRight: 15 },
  textContainer: { flex: 1 },
  titleText: { color: '#8A8A8A', fontSize: 12, marginBottom: 4 },
  missionText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  xpText: { color: '#7CF205', fontSize: 10, marginTop: 2 },
  detailsButton: { alignSelf: 'flex-end', marginRight: 15 },
  buttonGradient: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 8 },
  buttonText: { color: '#FFF', fontSize: 12, fontWeight: '600' }
});