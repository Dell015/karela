import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

/**
 * REUSABLE OUTFIT PREVIEW
 * The small cards at the bottom for selecting different Dati skins.
 */
const SkinThumbnail = ({ label }: { label: string }) => (
  <View style={styles.skinThumbContainer}>
    <View style={styles.skinThumbBox}>
       {/* Placeholder for chibi skin variants */}
      <Image 
        source={{ uri: 'https://via.placeholder.com/100' }} 
        style={styles.thumbImage} 
      />
    </View>
    <Text style={styles.thumbText}>{label}</Text>
  </View>
);

export default function PlayerCard() {
  return (
    <View style={theme.container}>
      {/* Background Glows */}
      <View style={theme.glowContainer}>
        <LinearGradient colors={["#209F77", "#7CF205"]} style={theme.leftBlur} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- HEADER --- */}
        <View style={styles.topNav}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* --- MAIN DATI DISPLAY --- 
            Mimicking the green rounded container from your screenshot.
        */}
        <View style={styles.mainCharacterCard}>
          <View style={styles.nameBadge}>
            <Text style={styles.nameBadgeText}>Dati 1</Text>
          </View>

          {/* Sidebar Icons for customization */}
          <View style={styles.sideToolbar}>
            <Ionicons name="shirt-outline" size={20} color="#7CF205" />
            <Ionicons name="body-outline" size={20} color="#7CF205" />
            <Ionicons name="color-palette-outline" size={20} color="#7CF205" />
          </View>

          {/* Large Chibi Image */}
          <Image 
            source={{ uri: 'https://via.placeholder.com/300' }} // Replace with your chibi image
            style={styles.mainChibi}
            resizeMode="contain"
          />

          <TouchableOpacity style={styles.moreSkinsBtn}>
            <Text style={styles.moreSkinsText}>More Outfits</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* --- OUTFIT SELECTION ROW --- */}
        <View style={styles.skinSelectionRow}>
          <SkinThumbnail label="chibi 2" />
          <SkinThumbnail label="chibi 3" />
          <SkinThumbnail label="chibi 4" />
          <SkinThumbnail label="chibi 5" />
        </View>

        {/* --- STATS SECTION --- */}
        <View style={styles.statsContainer}>
            <View style={styles.statBox}>
                <Text style={styles.statNum}>124.5</Text>
                <Text style={styles.statLabel}>Total KM</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statNum}>68%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  topNav: {
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 10,
  },
  mainCharacterCard: {
    backgroundColor: '#209F77', // The green base color from your image
    width: width * 0.9,
    height: 400,
    alignSelf: 'center',
    borderRadius: 40,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7CF205',
  },
  nameBadge: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  nameBadgeText: {
    color: '#fff',
    fontFamily: 'Excon-Bold',
    fontSize: 22,
  },
  sideToolbar: {
    position: 'absolute',
    left: 20,
    top: 100,
    gap: 25,
  },
  mainChibi: {
    width: '80%',
    height: '80%',
  },
  moreSkinsBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  moreSkinsText: {
    color: '#fff',
    fontFamily: 'Excon-Bold',
    marginRight: 5,
  },
  skinSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  skinThumbContainer: {
    alignItems: 'center',
  },
  skinThumbBox: {
    width: 75,
    height: 100,
    backgroundColor: 'rgba(124, 242, 5, 0.2)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#7CF205',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbText: {
    color: '#7CF205',
    fontSize: 10,
    fontFamily: 'Excon-Regular',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Excon-Bold',
  },
  statLabel: {
    color: '#7CF205',
    fontSize: 12,
    fontFamily: 'Excon-Regular',
    textTransform: 'uppercase',
  }
});