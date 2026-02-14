import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PaceChart = () => (
  <View style={styles.chartWrapper}>
    <Text style={styles.chartTitle}>Pace Consistency (min/km)</Text>
    <Svg height="80" width="100%">
      <Line x1="0" y1="20" x2="100%" y2="20" stroke="#3A3A3C" strokeWidth="1" strokeDasharray="4 4" />
      <Line x1="0" y1="50" x2="100%" y2="50" stroke="#3A3A3C" strokeWidth="1" strokeDasharray="4 4" />
      <Path
        d="M0 60 Q 30 20, 60 45 T 120 35 T 180 55 T 240 30 T 300 40"
        fill="none"
        stroke="#7CF205"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
    <View style={styles.chartLabels}>
      {['1k', '2k', '3k', '4k', '5k'].map(l => <Text key={l} style={styles.chartLabelText}>{l}</Text>)}
    </View>
  </View>
);

const ProgressCircle = ({ progress, size, date, strokeWidth = 5, color = "#7CF205" }: any) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  useEffect(() => { animatedProgress.value = withTiming(progress, { duration: 1000 }); }, [progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - animatedProgress.value) }));
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#2C2C2E" strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" />
      </Svg>
      {date && <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{date}</Text></View>}
    </View>
  );
};

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const [viewType, setViewType] = useState('Weekly');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  
  const today = 11; 
  const currentStreak = 5;
  const transition = useSharedValue(1); 
  const GRID_SPACING = 12;
  const DAY_SIZE = (width - 50 - (GRID_SPACING * 6)) / 7;

  const handleToggle = (type: string, index: number) => { 
    setViewType(type); 
    transition.value = withTiming(index, { duration: 300 }); 
  };
  
  const animatedPillStyle = useAnimatedStyle(() => ({ 
    transform: [{ translateX: transition.value * ((width - 62) / 3) }] 
  }));

  const openDetails = (title: string, dist: string, type: string) => {
    const recommendations = type === 'Daily' 
      ? "Focus on high-intensity intervals. Karela noticed you're on a streak—keep that momentum!"
      : "Maintain a steady heart rate. Your consistency is paying off. Hydrate well, Sander.";
    
    setSelectedQuest({ title, dist, rec: recommendations, type });
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.View entering={FadeInUp.duration(500)} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Calendar</Text>
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: '#7CF205' }]} />
                <Text style={styles.statusText}>Connected: Sander's Airpods Pro 2</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellButton}><Ionicons name="notifications" size={24} color="white" /></TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <Animated.View style={[styles.animatedPill, animatedPillStyle]}><LinearGradient colors={['#32D74B', '#248A3D']} style={StyleSheet.absoluteFill} /></Animated.View>
            {['Daily', 'Weekly', 'Monthly'].map((type, i) => (
              <TouchableOpacity key={type} style={styles.tabButton} onPress={() => handleToggle(type, i)} activeOpacity={1}>
                <Text style={[styles.tabText, { color: viewType === type ? 'white' : '#8E8E93' }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {viewType === 'Monthly' ? (
            <View style={styles.modernMonthContainer}>
              <View style={styles.monthHeaderRow}>
                <View>
                  <Text style={styles.monthName}>February</Text>
                  <Text style={styles.yearName}>2026</Text>
                </View>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={16} color="#FF9500" />
                  <Text style={styles.streakText}>{currentStreak} Day Streak</Text>
                </View>
              </View>
              <View style={styles.weekdayRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (<Text key={i} style={styles.weekdayLabel}>{day}</Text>))}
              </View>
              <View style={styles.modernGrid}>
                {Array.from({ length: 28 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === today;
                  const hasActivity = dayNum < today;
                  return (
                    <TouchableOpacity key={i} style={[styles.modernDayBox, { width: DAY_SIZE, height: DAY_SIZE }, isToday && styles.todayActiveBox, hasActivity && styles.activityDotBox]}>
                      <Text style={[styles.modernDayText, isToday && styles.todayActiveText, !isToday && !hasActivity && { color: '#48484A' }]}>{dayNum}</Text>
                      {hasActivity && !isToday && <View style={styles.smallActivityIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}><Text style={styles.summaryTitle}>History Overview</Text><TouchableOpacity onPress={() => router.back()}><Text style={styles.viewAllText}>Dashboard</Text></TouchableOpacity></View>
              <View style={styles.daysRow}>
                {[9, 10, 11, 12, 13, 14, 15].map((d, i) => (<View key={d} style={styles.dayItem}><ProgressCircle progress={d <= today ? 1 : 0} size={38} date={d} /><Text style={styles.dayLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text></View>))}
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{viewType} Focus</Text></View>
          
          <NewQuestCard 
            title={viewType === 'Daily' ? "Morning 5km" : "15km Endurance"} 
            distance={viewType === 'Daily' ? "3.2/5 km" : "11.5/15 km"} 
            time={viewType === 'Daily' ? "24:12" : "1:12:04"} 
            progress={0.64}
            onDetails={() => openDetails(viewType === 'Daily' ? "Morning 5km" : "Running Milestone", "Analysis Ready", viewType)}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{selectedQuest?.title} Analysis</Text>
            <View style={styles.detailsGrid}>
               <View style={styles.detailBox}><MaterialCommunityIcons name="run-fast" size={24} color="#7CF205" /><Text style={styles.detailValue}>3.2km</Text><Text style={styles.detailLabel}>Distance</Text></View>
               <View style={styles.detailBox}><MaterialCommunityIcons name="fire" size={24} color="#FF453A" /><Text style={styles.detailValue}>340 kcal</Text><Text style={styles.detailLabel}>Burned</Text></View>
            </View>
            <PaceChart />
            <View style={styles.recContainer}>
               <View style={styles.coachHeader}>
                  <MaterialCommunityIcons name="account-tie-voice" size={20} color="#7CF205" />
                  <Text style={styles.recTitle}>Karela's Advice</Text>
               </View>
               <Text style={styles.recText}>"{selectedQuest?.rec}"</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}><Text style={styles.closeBtnText}>Dismiss</Text></TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const NewQuestCard = ({ title, distance, time, progress, onDetails }: any) => (
  <View style={styles.newCard}>
    <View style={styles.cardHeaderRow}>
      <View><Text style={styles.newCardTitle}>{title}</Text><Text style={styles.newCardSub}>Goal: {distance}</Text></View>
      <View style={styles.timeTag}><Ionicons name="time-outline" size={14} color="#7CF205" /><Text style={styles.timeTagText}>{time}</Text></View>
    </View>
    <View style={styles.progressSection}><View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} /></View><Text style={styles.percentText}>{Math.round(progress * 100)}%</Text></View>
    <View style={styles.buttonRow}>
       <TouchableOpacity style={styles.detailsBtn} onPress={onDetails}><Text style={styles.detailsBtnText}>Details</Text></TouchableOpacity>
       <TouchableOpacity style={styles.fullTrackBtn}>
          <LinearGradient colors={['#32D74B', '#248A3D']} style={styles.gradientBtn}><Text style={styles.trackBtnText}>Track Progress</Text></LinearGradient>
       </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { fontSize: 38, fontWeight: 'bold', color: 'white' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: '#8E8E93', fontSize: 12 },
  bellButton: { backgroundColor: '#1C1C1E', padding: 12, borderRadius: 25 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 22, padding: 6, marginBottom: 35, position: 'relative' },
  animatedPill: { position: 'absolute', top: 6, left: 6, bottom: 6, borderRadius: 18, overflow: 'hidden', width: '31%' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabText: { fontSize: 18, fontWeight: 'bold' },
  summaryContainer: { backgroundColor: '#1C1C1E', borderRadius: 28, padding: 22, marginBottom: 35 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  summaryTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  viewAllText: { color: '#8E8E93', fontSize: 12 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center' },
  dayLabel: { color: '#8E8E93', fontSize: 10, marginTop: 8 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  newCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  newCardTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  newCardSub: { color: '#8E8E93', fontSize: 12 },
  timeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timeTagText: { color: '#7CF205', fontSize: 12, fontWeight: '600' },
  progressSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#2C2C2E', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#7CF205', borderRadius: 3 },
  percentText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 12 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  detailsBtn: { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  detailsBtnText: { color: '#8E8E93', fontWeight: 'bold' },
  fullTrackBtn: { flex: 2.5 },
  gradientBtn: { paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  trackBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 520 },
  handle: { width: 40, height: 5, backgroundColor: '#3A3A3C', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  detailsGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  detailBox: { flex: 1, backgroundColor: '#2C2C2E', padding: 15, borderRadius: 20, alignItems: 'center' },
  detailValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  detailLabel: { color: '#8E8E93', fontSize: 12 },
  chartWrapper: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 20, marginBottom: 20 },
  chartTitle: { color: '#8E8E93', fontSize: 12, marginBottom: 10, fontWeight: '600' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  chartLabelText: { color: '#48484A', fontSize: 10, fontWeight: 'bold' },
  recContainer: { backgroundColor: 'rgba(124, 242, 5, 0.05)', padding: 20, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(124, 242, 5, 0.1)' },
  coachHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  recTitle: { color: '#7CF205', fontWeight: 'bold', fontSize: 14 },
  recText: { color: '#E5E5EA', lineHeight: 20, fontStyle: 'italic' },
  closeBtn: { backgroundColor: '#2C2C2E', paddingVertical: 16, borderRadius: 20, alignItems: 'center' },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modernMonthContainer: { backgroundColor: '#1C1C1E', borderRadius: 32, padding: 20, marginBottom: 35, borderWidth: 1, borderColor: '#2C2C2E' },
  monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  monthName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  yearName: { color: '#8E8E93', fontSize: 14 },
  streakBadge: { backgroundColor: 'rgba(255, 149, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { color: '#FF9500', fontSize: 12, fontWeight: 'bold' },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  weekdayLabel: { flex: 1, textAlign: 'center', color: '#48484A', fontSize: 12, fontWeight: 'bold' },
  modernGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modernDayBox: { justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  modernDayText: { color: 'white', fontSize: 15, fontWeight: '600' },
  todayActiveBox: { backgroundColor: '#7CF205' },
  todayActiveText: { color: 'black' },
  activityDotBox: { backgroundColor: '#2C2C2E' },
  smallActivityIndicator: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: '#7CF205' }
});