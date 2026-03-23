import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const NotificationService = {
  // 1. Setup the visual channel for Android
  setup: async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('race-tracker', {
        name: 'Ghost Race Tracker',
        importance: Notifications.AndroidImportance.LOW, // Low means no annoying sound every second
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  },

  // 2. Update the "Live Widget"
  updateRaceWidget: async (distanceMeters: number, speedKmH: number) => {
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "👻 Ghost Race Active",
        body: `Distance: ${distanceKm} km  |  Speed: ${speedKmH} km/h`,
        sticky: true, // Android: cannot be swiped away
        color: "#7CF205", // Neon Green
        priority: Notifications.AndroidNotificationPriority.LOW,
      },
      trigger: null, // "null" means show it immediately
      identifier: 'race-progress', // Same ID means it overwrites the old one (updating it)
    });
  },

  // 3. Remove it when finished
  stopWidget: async () => {
    // This clears the specific notification from the lockscreen
    await Notifications.dismissAllNotificationsAsync();
    // Or specifically: await Notifications.dismissNotificationAsync('race-progress');
  }
};