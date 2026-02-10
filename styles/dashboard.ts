import { Header } from '@react-navigation/elements';
import { Profiler } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createNavigationContainerRef } from '@react-navigation/native';

export const dashboard_ui = StyleSheet.create({
  
  dashboard: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dashboardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  LeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  RightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  ProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  Image: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  CoachImage: {
    width: 40,
    height: 40,
  },
  welcomeText: {
    fontFamily: 'Excon-Regular',
    fontSize: 18.71,
    color: '#8A8A8A',
  },
  nameText: {
    fontFamily: 'Excon-Bold',
    fontSize: 30.27,
    color: '#fff',
  },
  RunCard: {
    height: 250,
    borderRadius: 20,
    marginTop: 20,
    overflow: 'hidden',
    padding: 5,
  },
  CardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    borderRadius: 22,
  },
  CardContent: {
    flex: 1,
    padding: 20,
  },
  flameImage: {
    width: 30,
    height: 30,
  },
  Streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  StreakText: {
    fontFamily: 'Excon-Bold',
    fontSize: 22,
    color: '#fff',
  },
  LevelText: {
    fontFamily: 'Excon-Bold',
    fontSize: 28,
    color: '#fff',
    marginTop: 10,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
  },
  progressBarTrack: {
    width: '100%',
    height: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(124, 242, 5, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
    shadowColor: '#7CF205',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  xpText: {
    color: '#8A8A8A',
    fontFamily: 'Excon-Regular',
    fontSize: 20,
    marginTop: 6,
    fontWeight: '500',
  },
  runButtonContainer: {
    marginTop: 6,
    width: '100%',
    borderRadius: 10,
  },
  runButton: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButtonText: {
    fontFamily: 'Excon-Bold',
    fontSize: 20,
    color: '#FFF',
    textTransform: 'none'
  },
  WeatherText: {
    fontFamily: 'Excon-Bold',
    color: '#FFF',
    fontSize: 20,
    marginTop: 20,
  },
  weatherCard: {
    padding: 20,
    backgroundColor: '#222222',
    borderRadius: 22,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  weatherIcon: {
    height: 70,
    width: 70,
  },
  cityText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Excon-Bold',
  },
  weatherDesc: {
    color: '#8A8A8A',

  },
  tempText: {
    color: '#FFF',
    fontSize: 28,
    fontFamily: 'Excon-Bold', 
  },
  tipCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingLeft: 30,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  tipIcon: {
    height: 40,
    width: 40,
  },

  tipText: {
    color: '#888', // Grey text for the tip
    fontSize: 14,
    flex: 1,
    marginLeft: 15,
    lineHeight: 20,
  },

  // --- Daily Missions Section ---
  missionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 25,
    paddingLeft: 30,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionIcon: {
    height: 40,
    width: 40,
  },
  missionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  missionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  missionSub: {
    color: '#7CF205', // Green XP text
    fontSize: 12,
  },
  missionStats: {
    alignItems: 'flex-end',
  },
  statsText: {
    color: '#888',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  }
});