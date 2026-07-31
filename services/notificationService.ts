import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const NotificationService = {
  // 1. Setup the visual channel for Android
  setup: async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('race-tracker', {
        name: 'Ghost Race Tracker',
        importance: Notifications.AndroidImportance.LOW,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  },

  // 2. Update the "Live Widget"
  updateRaceWidget: async (distanceMeters: number, speedKmH: number) => {
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    
    try {
      // identifier: 'race-progress' ensures it updates the existing notification 
      // instead of creating a new one every second.
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "👻 Ghost Race Active",
          body: `Distance: ${distanceKm} km  |  Speed: ${speedKmH} km/h`,
          sticky: true, // Android specific
          color: "#7CF205",
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
        // On Android the channel is selected via the trigger, not the content.
        // With `null` this posted to the DEFAULT channel, so the LOW-importance
        // 'race-tracker' channel created in setup() was never used and every
        // per-second update could buzz/heads-up instead of staying silent.
        trigger: { channelId: 'race-tracker' },
        identifier: 'race-progress', 
      });
    } catch (error) {
      console.warn("Notification update failed:", error);
    }
  },

  // 3. Remove it when finished
  stopWidget: async () => {
    // Specifically dismiss the race progress notification
    await Notifications.dismissNotificationAsync('race-progress');
  }
};