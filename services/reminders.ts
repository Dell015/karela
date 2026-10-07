import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

/**
 * Daily movement reminder: one local notification a day, scheduled on the
 * phone (no server, no data used). The hour is always outside Quiet Hours
 * (see REMINDER_HOURS in localSettings.ts).
 */

const REMINDER_ID = "karela-daily-reminder";
const CHANNEL_ID = "reminders";

export type PermissionState = "granted" | "denied" | "undetermined";

export const getNotificationPermission = async (): Promise<PermissionState> => {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
};

/** Asks for notification permission if it hasn't been decided yet. */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  const current = await getNotificationPermission();
  if (current === "granted") return true;
  if (current === "denied") return false; // only the OS settings can change it now
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

export const scheduleDailyReminder = async (hour: number) => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Daily reminder",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Time to move",
      body: "A 10-minute walk still counts toward your streak.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
};

export const cancelDailyReminder = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch {
    // Nothing was scheduled.
  }
};

/** "5 PM" style label for an hour on the 24h clock. */
export const formatHour = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
};

export const openAppSettings = () => Linking.openSettings();
