import { Avatar } from "@/components/ui/Avatar";
import { useBuffs } from "@/services/buffs";
import { Button, Chip, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { SettingsGroup, SettingsRow } from "@/components/ui/SettingsRow";
import { Field, Sheet, sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/context/AuthContext";
import {
  changePassword,
  deleteAccount,
  exportMyData,
  MIN_PASSWORD_LENGTH,
  resetProgress,
} from "@/services/account";
import {
  MAX_PRIVACY_ZONES,
  QUIET_HOURS,
  REMINDER_HOURS,
  updateLocalSettings,
  useLocalSettings,
} from "@/services/localSettings";
import {
  cancelDailyReminder,
  ensureNotificationPermission,
  formatHour,
  getNotificationPermission,
  openAppSettings,
  PermissionState,
  scheduleDailyReminder,
} from "@/services/reminders";
import { KARELA } from "@/styles/designSystem";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

type LocationAccess = "always" | "while-using" | "denied" | "undetermined";

interface Permissions {
  location: LocationAccess;
  notifications: PermissionState;
  camera: PermissionState;
}

const DELETE_WORD = "DELETE";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, user, logout, reloadProfile } = useAuth();
  const local = useLocalSettings();
  const buffs = useBuffs();

  // ---------------- Permissions (re-read when the user comes back from OS settings)
  const [perms, setPerms] = useState<Permissions | null>(null);

  const readPermissions = useCallback(async () => {
    try {
      const [fg, bg, notif, cam] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        getNotificationPermission(),
        ImagePicker.getCameraPermissionsAsync(),
      ]);
      const location: LocationAccess =
        fg.status !== "granted"
          ? (fg.status as "denied" | "undetermined")
          : bg.status === "granted"
            ? "always"
            : "while-using";
      setPerms({ location, notifications: notif, camera: cam.status as PermissionState });
    } catch (e) {
      console.warn("Permission read failed:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      readPermissions();
    }, [readPermissions]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") readPermissions();
    });
    return () => sub.remove();
  }, [readPermissions]);

  const askOrOpenSettings = async (
    state: PermissionState | LocationAccess | undefined,
    request: () => Promise<unknown>,
  ) => {
    if (state === "undetermined") {
      await request();
      readPermissions();
    } else {
      openAppSettings();
    }
  };

  // ---------------- Reminder
  const [reminderBusy, setReminderBusy] = useState(false);

  const setReminder = async (enabled: boolean, hour = local?.reminderHour ?? 17) => {
    setReminderBusy(true);
    try {
      if (enabled) {
        const allowed = await ensureNotificationPermission();
        readPermissions();
        if (!allowed) {
          Alert.alert(
            "Notifications are off",
            "Turn on notifications for Karela in your phone settings, then switch the reminder on again.",
            [
              { text: "Not now", style: "cancel" },
              { text: "Open settings", onPress: openAppSettings },
            ],
          );
          return;
        }
        await scheduleDailyReminder(hour);
      } else {
        await cancelDailyReminder();
      }
      await updateLocalSettings({ reminderEnabled: enabled, reminderHour: hour });
    } catch (e) {
      console.warn("Reminder update failed:", e);
      Alert.alert("Reminder not changed", "Something went wrong. Try again.");
    } finally {
      setReminderBusy(false);
    }
  };

  // ---------------- Account actions
  const [busy, setBusy] = useState<null | "export" | "reset">(null);

  const handleExport = async () => {
    if (!user) return;
    setBusy("export");
    try {
      const json = await exportMyData(user.uid);
      await Share.share({ title: "My Karela data", message: json });
    } catch (e: any) {
      Alert.alert("Couldn't download your data", e?.message ?? "Try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleReset = () => {
    if (!user) return;
    Alert.alert(
      "Reset progress?",
      "This deletes your run history (on this phone and in your account) and sets your level, XP, distance and streak back to the start. Your Gems, Streak Freezes, quests and civic reports are kept. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset progress",
          style: "destructive",
          onPress: async () => {
            setBusy("reset");
            try {
              await resetProgress(user.uid);
              await reloadProfile();
              Alert.alert("Progress reset", "You're back at level 1. Your next run starts a new history.");
            } catch (e: any) {
              Alert.alert("Reset didn't finish", e?.message ?? "Try again.");
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Log out?", "Your runs on this phone stay here. You can log back in any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", onPress: logout },
    ]);
  };

  // ---------------- Change password sheet
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const openPassword = () => {
    setPwCurrent("");
    setPwNext("");
    setPwConfirm("");
    setPwError(null);
    setPwOpen(true);
  };

  const submitPassword = async () => {
    if (!user?.email) return;
    if (!pwCurrent || !pwNext) return setPwError("Fill in your current and new password.");
    if (pwNext !== pwConfirm) return setPwError("The new passwords don't match. Type the same password twice.");
    setPwSaving(true);
    setPwError(null);
    try {
      await changePassword(user.email, pwCurrent, pwNext);
      setPwOpen(false);
      Alert.alert("Password changed", "Use your new password the next time you log in.");
    } catch (e: any) {
      setPwError(e?.message ?? "Your password wasn't changed. Try again.");
    } finally {
      setPwSaving(false);
    }
  };

  // ---------------- Delete account sheet
  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState("");
  const [delError, setDelError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submitDelete = async () => {
    if (!user) return;
    setDeleting(true);
    setDelError(null);
    try {
      await deleteAccount(user.uid);
      // Signing out sends the app back to the login screen (AuthGate).
    } catch (e: any) {
      setDelError(e?.message ?? "Your account wasn't deleted. Try again.");
      setDeleting(false);
    }
  };

  // ---------------- Labels
  const locationValue = {
    always: { text: "Always", tone: "ok" as const },
    "while-using": { text: "While using", tone: "warn" as const },
    denied: { text: "Off", tone: "warn" as const },
    undetermined: { text: "Not asked", tone: "muted" as const },
  }[perms?.location ?? "undetermined"];

  const simpleValue = (st?: PermissionState) =>
    st === "granted"
      ? { text: "Allowed", tone: "ok" as const }
      : st === "denied"
        ? { text: "Off", tone: "warn" as const }
        : { text: "Not asked", tone: "muted" as const };

  const notifValue = simpleValue(perms?.notifications);
  const cameraValue = simpleValue(perms?.camera);

  const zoneCount = local?.privacyZones.length ?? 0;
  const reminderOn = !!local?.reminderEnabled;
  const reminderBlocked = reminderOn && perms?.notifications === "denied";
  const version = Constants.expoConfig?.version ?? "";

  return (
    <Screen variant="calm" glow={false}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Back" onPress={() => router.replace("/drawer/dashboard")} />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: KARELA.tap }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Who is signed in. Tapping opens the profile, where it can be edited. */}
        <Pressable
          onPress={() => router.push("/drawer/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.85 }]}
        >
          <Avatar uri={profile?.profilePicture} name={profile?.displayName || profile?.username} size={56} frame={buffs.frame} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.displayName || "Your profile"}</Text>
            {profile?.username ? <Text style={styles.handle}>@{profile.username}</Text> : null}
            <Text style={styles.email}>{user?.email || profile?.email}</Text>
          </View>
          <Text style={styles.editLink}>Edit</Text>
        </Pressable>

        <SettingsGroup title="Running">
          <SettingsRow
            icon="sunny-outline"
            label="Keep screen on during runs"
            sublabel="Easier to glance at the map. Uses more battery."
            toggle={{
              value: !!local?.keepScreenOn,
              onChange: (v) => updateLocalSettings({ keepScreenOn: v }),
              disabled: !local,
            }}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Zones"
            sublabel={
              zoneCount === 0
                ? "Hide the start and end of runs near home, school or work"
                : `${zoneCount} of ${MAX_PRIVACY_ZONES} zones. Your route isn't saved inside them.`
            }
            onPress={() => router.push("/settings/privacy-zones")}
          />
          <SettingsRow
            icon="thunderstorm-outline"
            label="Storm safety"
            sublabel="In strong wind, heavy rain or a thunderstorm, Karela won't ask you to run."
            value="Always on"
            valueTone="ok"
            last
          />
        </SettingsGroup>

        <SettingsGroup
          title="Reminders"
          footnote={`Karela never sends reminders between ${formatHour(QUIET_HOURS.start)} and ${formatHour(QUIET_HOURS.end)}.`}
        >
          <SettingsRow
            icon="alarm-outline"
            label="Daily reminder"
            sublabel={
              reminderBlocked
                ? "Notifications are off for Karela. Turn them on in your phone settings."
                : reminderOn
                  ? `Every day at ${formatHour(local!.reminderHour)}`
                  : "A gentle nudge to move, once a day"
            }
            toggle={{
              value: reminderOn,
              onChange: (v) => setReminder(v),
              disabled: !local || reminderBusy,
            }}
            last={!reminderOn}
          />
          {reminderOn && (
            <View style={styles.hourPicker}>
              <Text style={styles.hourLabel}>Remind me at</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourRow}>
                {REMINDER_HOURS.map((h) => (
                  <Chip
                    key={h}
                    label={formatHour(h)}
                    selected={local?.reminderHour === h}
                    disabled={reminderBusy}
                    onPress={() => setReminder(true, h)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </SettingsGroup>

        <SettingsGroup
          title="Permissions"
          footnote={'Tap one to change it. Set location to "Always" so a run keeps tracking while your screen is off.'}
        >
          <SettingsRow
            icon="navigate-outline"
            label="Location"
            sublabel="Tracks your runs and shows reports near you"
            value={locationValue.text}
            valueTone={locationValue.tone}
            onPress={() =>
              askOrOpenSettings(perms?.location, Location.requestForegroundPermissionsAsync)
            }
          />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            sublabel="For your daily reminder"
            value={notifValue.text}
            valueTone={notifValue.tone}
            onPress={() => askOrOpenSettings(perms?.notifications, ensureNotificationPermission)}
          />
          <SettingsRow
            icon="camera-outline"
            label="Camera"
            sublabel="For photos of civic reports"
            value={cameraValue.text}
            valueTone={cameraValue.tone}
            onPress={() =>
              askOrOpenSettings(perms?.camera, ImagePicker.requestCameraPermissionsAsync)
            }
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsRow icon="key-outline" label="Change password" onPress={openPassword} />
          <SettingsRow
            icon="download-outline"
            label={busy === "export" ? "Collecting your data..." : "Download my data"}
            sublabel="Everything your account holds, as a file you can save or send"
            onPress={busy ? undefined : handleExport}
          />
          <SettingsRow icon="log-out-outline" label="Log out" onPress={handleLogout} last />
        </SettingsGroup>

        <SettingsGroup title="Privacy and data">
          <SettingsRow
            icon="document-text-outline"
            label="How Karela uses your data"
            onPress={() => router.push("/settings/your-data")}
          />
          <SettingsRow
            icon="refresh-outline"
            label={busy === "reset" ? "Resetting..." : "Reset progress"}
            sublabel="Start your level and run history over"
            danger
            onPress={busy ? undefined : handleReset}
          />
          <SettingsRow
            icon="trash-outline"
            label="Delete account"
            sublabel="Deletes your account and everything linked to it"
            danger
            onPress={() => {
              setDelText("");
              setDelError(null);
              setDelOpen(true);
            }}
            last
          />
        </SettingsGroup>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Ani gives general wellness tips, not medical advice. If something hurts, stop and talk to a doctor.
          </Text>
          <Text style={styles.versionText}>Karela {version} beta</Text>
        </View>
      </ScrollView>

      {/* Change password */}
      <Sheet visible={pwOpen} title="Change password" onClose={() => setPwOpen(false)}>
        <Field
          label="Current password"
          value={pwCurrent}
          onChangeText={setPwCurrent}
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
        />
        <Field
          label="New password"
          value={pwNext}
          onChangeText={setPwNext}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <Field
          label="Type the new password again"
          value={pwConfirm}
          onChangeText={setPwConfirm}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <Text style={sheet.note}>At least {MIN_PASSWORD_LENGTH} characters.</Text>
        {pwError && (
          <Text style={sheet.error} accessibilityLiveRegion="polite">
            {pwError}
          </Text>
        )}
        <View style={sheet.buttons}>
          <Button label="Cancel" variant="secondary" onPress={() => setPwOpen(false)} style={{ flex: 1 }} />
          <Button label="Change password" onPress={submitPassword} loading={pwSaving} style={{ flex: 1 }} />
        </View>
      </Sheet>

      {/* Delete account */}
      <Sheet visible={delOpen} title="Delete account" onClose={() => !deleting && setDelOpen(false)}>
        <Text style={styles.sheetBody}>
          This deletes your account right away: your profile, level, Gems, Shop items, run history, quests, and your
          civic reports and their photos. Problems you reported stay on the map for your neighbours, without your name.
          You leave your squad; if you lead it, the next person in line takes over.
        </Text>
        <Text style={styles.sheetBody}>
          Runs saved on this phone are deleted too. This can&apos;t be undone. If you want a copy first, use
          Download my data.
        </Text>
        <Field
          label={`Type ${DELETE_WORD} to confirm`}
          value={delText}
          onChangeText={setDelText}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {delError && (
          <Text style={sheet.error} accessibilityLiveRegion="polite">
            {delError}
          </Text>
        )}
        <View style={sheet.buttons}>
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => setDelOpen(false)}
            disabled={deleting}
            style={{ flex: 1 }}
          />
          <Button
            label="Delete account"
            variant="danger"
            onPress={submitDelete}
            loading={deleting}
            disabled={delText.trim().toUpperCase() !== DELETE_WORD}
            style={{ flex: 1 }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: KARELA.space.xl,
    paddingTop: 60,
    paddingBottom: KARELA.space.lg,
  },
  headerTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  scrollContent: { paddingHorizontal: KARELA.space.xl, paddingBottom: KARELA.space.xxxl },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.lg,
    paddingVertical: KARELA.space.lg,
    marginBottom: KARELA.space.xl,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.line,
  },
  name: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  handle: { color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginTop: 2 },
  email: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 2 },
  editLink: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },

  hourPicker: { paddingBottom: KARELA.space.lg },
  hourLabel: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.medium,
    marginLeft: KARELA.space.lg,
    marginBottom: KARELA.space.sm,
  },
  hourRow: { gap: KARELA.space.sm, paddingHorizontal: KARELA.space.lg },

  sheetBody: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    lineHeight: 22,
    marginTop: KARELA.space.md,
  },

  footer: { alignItems: "center", marginTop: KARELA.space.sm, gap: KARELA.space.md },
  footerNote: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: KARELA.space.lg,
  },
  versionText: { color: KARELA.color.textFaint, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium },
});
