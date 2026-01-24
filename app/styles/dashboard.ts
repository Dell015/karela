import { Header } from '@react-navigation/elements';
import { Profiler } from 'react';
import { StyleSheet } from 'react-native';

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
  },
  Image: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  CoachImage: {
    width: 50,
    height: 50,
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
});