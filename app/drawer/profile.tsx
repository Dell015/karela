import { Button, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { useBuffs } from "@/services/buffs";
import { Field, Sheet, sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/context/AuthContext";
import { formatDuration, formatKm } from "@/services/calendarData";
import { updateUserProfileData } from "@/services/database/supabase/userData";
import {
  CivicSummary,
  RunRecords,
  computeBadges,
  formatPace,
  getCivicSummary,
  getRunRecords,
} from "@/services/profileData";
import { getEffectiveStreak } from "@/services/streakService";
import { getStreakTier } from "@/services/streakMultiplier";
import {
  changeProfilePhoto,
  openPhoneSettings,
  PermissionBlockedError,
  removeProfilePhoto,
} from "@/services/profilePhoto";
import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const XP_PER_LEVEL = 1000; // COMPUTATIONS.md: every level needs 1000 XP
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Same ranges the server accepts at sign-up (supabase/07_close_stats_hole.sql).
const USERNAME_RE = /^[A-Za-z0-9_.]{3,20}$/;
const NOTES_MAX = 300;

const memberSince = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : `Member since ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const runDate = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
};

export default function ProfilePage() {
  const router = useRouter();
  const { profile, logout, reloadProfile } = useAuth();
  const buffs = useBuffs();
  const uid = profile?.uid;
  const createdAt = profile?.createdAt;

  // --- Real records, loaded each time the screen is opened ---
  const [records, setRecords] = useState<RunRecords | null>(null);
  const [civic, setCivic] = useState<CivicSummary | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestId = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      const id = ++requestId.current;
      // Fall back to two years back if the account date is missing.
      const since = createdAt ? new Date(createdAt) : new Date(Date.now() - 730 * 86400000);
      since.setDate(since.getDate() - 1);
      Promise.all([getRunRecords(uid, since), getCivicSummary(uid)]).then(([r, c]) => {
        if (id !== requestId.current) return; // a newer load replaced this one
        setRecords(r);
        setCivic(c);
        setLoadFailed(r === null);
      });
    }, [uid, createdAt]),
  );

  // --- Profile photo ---
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const runPhotoAction = async (action: () => Promise<unknown>) => {
    if (!uid) return;
    setShowPhoto(false);
    setPhotoBusy(true);
    try {
      await action();
      await reloadProfile();
    } catch (e: any) {
      if (e instanceof PermissionBlockedError) {
        Alert.alert("Access needed", e.message, [
          { text: "Not now", style: "cancel" },
          { text: "Open settings", onPress: openPhoneSettings },
        ]);
      } else {
        Alert.alert("Photo not changed", e?.message ?? "Something went wrong. Try again.");
      }
    } finally {
      setPhotoBusy(false);
    }
  };

  // --- Edit sheet ---
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fillForm = useCallback(() => {
    setDisplayName(profile?.displayName || "");
    setUsername(profile?.username || "");
    setAiNotes(profile?.stats?.ai_notes || "");
    setAge(profile?.stats?.age ? `${profile.stats.age}` : "");
    setWeight(profile?.stats?.weight ? `${profile.stats.weight}` : "");
    setHeight(profile?.stats?.height ? `${profile.stats.height}` : "");
    setFormError(null);
  }, [profile]);

  const openEdit = () => {
    fillForm();
    setShowEdit(true);
  };

  const stats = profile?.stats;
  const streak = getEffectiveStreak(stats);
  const bestStreak = Math.max(streak, Number(stats?.longest_streak || 0));
  const tier = getStreakTier(streak);
  const level = Number(stats?.level || 1);
  const xp = Number(stats?.xp || 0);
  const xpPct = Math.min(100, (xp / XP_PER_LEVEL) * 100);
  const name = profile?.displayName || "Strider";
  const since = memberSince(profile?.createdAt);
  const badges = computeBadges(records, civic, bestStreak);
  const earnedCount = badges.filter((b) => b.earned).length;
  const totalM = records?.totalM ?? Number(stats?.total_distance_km || 0) * 1000;

  const validate = (): string | null => {
    if (!displayName.trim()) return "Add a display name.";
    if (displayName.trim().length > 40) return "Keep the display name under 40 characters.";
    if (!USERNAME_RE.test(username)) return "Usernames are 3 to 20 letters, numbers, _ or . with no spaces.";
    const a = Number(age), w = Number(weight), h = Number(height);
    if (!Number.isInteger(a) || a < 10 || a > 100) return "Age should be a whole number from 10 to 100.";
    if (!(w >= 20 && w <= 300)) return "Weight should be between 20 and 300 kg.";
    if (!(h >= 100 && h <= 250)) return "Height should be between 100 and 250 cm.";
    if (aiNotes.length > NOTES_MAX) return `Notes for Ani can be up to ${NOTES_MAX} characters.`;
    return null;
  };

  const handleSave = async () => {
    if (!uid || saving) return;
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError(null);
    const w = Number(weight), h = Number(height);
    try {
      await updateUserProfileData(uid, {
        displayName: displayName.trim(),
        username,
        "stats.ai_notes": aiNotes.trim(),
        "stats.age": Number(age),
        "stats.weight": w,
        "stats.height": h,
        "stats.bmi": Math.round((w / ((h / 100) * (h / 100))) * 100) / 100,
      });
      setShowEdit(false);
    } catch (e: any) {
      // 23505: unique_violation on profiles.username
      setFormError(
        e?.code === "23505"
          ? "That username is taken. Try another one."
          : "Your changes weren't saved. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () =>
    Alert.alert("Log out?", "Runs you finished are saved to your account. You can log back in any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);

  return (
    <Screen variant="default">
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={s.topBar}>
          <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
          <IconButton icon="settings-outline" label="Settings" onPress={() => router.push("/drawer/settings")} />
        </View>

        <View style={s.identity}>
          <Pressable
            onPress={() => setShowPhoto(true)}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            disabled={photoBusy}
            style={({ pressed }) => pressed && { opacity: 0.8 }}
          >
            <Avatar uri={profile?.profilePicture} name={name} size={76} ring frame={buffs.frame} />
            <View style={s.photoBadge}>
              {photoBusy ? (
                <ActivityIndicator size="small" color={KARELA.color.onBright} />
              ) : (
                <Ionicons name="camera" size={14} color={KARELA.color.onBright} />
              )}
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={1}>{name}</Text>
            <Text style={s.handle} numberOfLines={1}>@{profile?.username || "strider"}</Text>
            {since && <Text style={s.since}>{since}</Text>}
          </View>
        </View>
        <Button label="Edit profile" variant="secondary" size="sm" icon="create-outline" onPress={openEdit} style={s.editBtn} />

        {/* LEVEL */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.levelText}>Level {level}</Text>
            <Text style={s.muted}>{xp.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP</Text>
          </View>
          <View style={s.xpBar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: XP_PER_LEVEL, now: xp }}>
            <LinearGradient colors={KARELA.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.xpFill, { width: `${xpPct}%` }]} />
          </View>
          <Text style={s.muted}>{(XP_PER_LEVEL - xp).toLocaleString()} XP to level {level + 1}</Text>
        </View>

        {/* STREAK */}
        <View style={s.metricsRow}>
          <Metric icon="flame" color={KARELA.color.civic} value={`${streak}`} unit={streak === 1 ? "day" : "days"} label="Streak" />
          <Metric icon="trophy" color={KARELA.color.gold} value={`${bestStreak}`} unit={bestStreak === 1 ? "day" : "days"} label="Best streak" />
          <Metric icon="flash" color={KARELA.color.brand} value={`${tier.multiplier}x`} label="XP bonus" />
        </View>
        {tier.nextTierAt ? (
          <Text style={s.hint}>
            {streak === 0
              ? "Run today to start a streak."
              : `${tier.nextTierAt - streak} more ${tier.nextTierAt - streak === 1 ? "day" : "days"} to the next bonus.`}
          </Text>
        ) : (
          <Text style={s.hint}>Top bonus reached. Keep it going.</Text>
        )}

        {/* RECORDS */}
        <Text style={s.sectionTitle}>Your running</Text>
        {loadFailed && <Text style={s.notice}>Couldn&apos;t load your runs. Showing what&apos;s saved on your profile.</Text>}
        <View style={s.grid}>
          <Tile label="Runs" value={records ? `${records.totalRuns}` : "-"} />
          <Tile label="Distance" value={formatKm(totalM)} />
          <Tile label="This week" value={records ? formatKm(records.thisWeekM) : "-"} />
          <Tile label="Longest run" value={records?.longestM ? formatKm(records.longestM) : "-"} />
          <Tile label="Fastest pace" value={records?.fastestPaceS ? formatPace(records.fastestPaceS) : "-"} sub="runs of 1 km or more" />
          <Tile label="Time running" value={records ? formatDuration(records.totalS) : "-"} />
        </View>

        {/* RECENT RUNS */}
        <View style={[s.rowBetween, s.sectionHead]}>
          <Text style={[s.sectionTitle, s.inlineTitle]}>Recent runs</Text>
          <Button label="Calendar" variant="link" size="sm" onPress={() => router.push("/drawer/calendar")} />
        </View>
        <View style={s.list}>
          {records && records.recent.length === 0 && (
            <Text style={s.emptyText}>No runs yet. Your first one shows up here.</Text>
          )}
          {records?.recent.map((r) => (
            <View key={r.id} style={s.listRow}>
              <Text style={s.listDate}>{runDate(r.completed_at)}</Text>
              <Text style={s.listMain}>{formatKm(Number(r.distance_meters) || 0)}</Text>
              <Text style={s.muted}>{formatDuration(Number(r.duration_seconds) || 0)}</Text>
              <Text style={[s.muted, s.listXp]}>+{r.xp_earned || 0} XP</Text>
            </View>
          ))}
        </View>

        {/* CIVIC */}
        <Text style={s.sectionTitle}>In your city</Text>
        <View style={[s.card, s.civicCard]}>
          <View style={s.civicStat}>
            <Text style={[s.bigValue, { color: KARELA.color.civic }]}>{civic ? civic.filed : "-"}</Text>
            <Text style={s.muted}>reports filed</Text>
          </View>
          <View style={s.divider} />
          <View style={s.civicStat}>
            <Text style={s.bigValue}>{civic ? civic.verified : "-"}</Text>
            <Text style={s.muted}>confirmed by neighbours</Text>
          </View>
        </View>

        {/* BADGES */}
        <View style={[s.rowBetween, s.sectionHead]}>
          <Text style={[s.sectionTitle, s.inlineTitle]}>Badges</Text>
          <Text style={s.muted}>{earnedCount} of {badges.length}</Text>
        </View>
        <View style={s.badges}>
          {badges.map((b) => {
            const color = b.civic ? KARELA.color.civic : KARELA.color.brand;
            return (
              <View
                key={b.id}
                style={s.badge}
                accessible
                accessibilityLabel={b.earned ? `${b.label}, earned` : `${b.label}, locked. ${b.hint}`}
              >
                <View style={[s.badgeIcon, b.earned ? { borderColor: color, backgroundColor: KARELA.color.surfaceAlt } : s.badgeLocked]}>
                  <Ionicons name={(b.earned ? b.icon : "lock-closed-outline") as any} size={20} color={b.earned ? color : KARELA.color.textFaint} />
                </View>
                <Text style={[s.badgeLabel, !b.earned && { color: KARELA.color.textMuted }]}>{b.label}</Text>
                {!b.earned && <Text style={s.badgeHint}>{b.hint}</Text>}
              </View>
            );
          })}
        </View>

        {/* ANI NOTES */}
        <Text style={s.sectionTitle}>Notes for Ani</Text>
        <View style={[s.card, s.aniCard]}>
          <Text style={stats?.ai_notes ? s.body : s.muted}>
            {stats?.ai_notes ||
              "Tell Ani what she should know, like an old injury or when you like to run. She uses it for general wellness coaching only, never to diagnose."}
          </Text>
          <View style={s.aniActions}>
            <Button label={stats?.ai_notes ? "Edit notes" : "Add notes"} variant="secondary" size="sm" onPress={openEdit} />
            <Button label="Talk to Ani" variant="link" size="sm" onPress={() => router.push("/drawer/ai_coach")} />
          </View>
        </View>

        {/* SOCIAL + ACCOUNT */}
        <Text style={s.sectionTitle}>More</Text>
        <View style={s.list}>
          <Row icon="people-outline" label="Squad and guild" onPress={() => router.push("/drawer/guilds")} />
          <Row icon="settings-outline" label="Settings" onPress={() => router.push("/drawer/settings")} />
          <Row icon="log-out-outline" label="Log out" danger onPress={confirmLogout} last />
        </View>
      </ScrollView>

      {/* PHOTO SHEET */}
      <Sheet visible={showPhoto} title="Profile photo" onClose={() => setShowPhoto(false)}>
        <View style={s.photoOptions}>
          <Button
            label="Take a photo"
            icon="camera-outline"
            variant="secondary"
            block
            onPress={() => runPhotoAction(() => changeProfilePhoto(uid!, "camera"))}
          />
          <Button
            label="Choose from your photos"
            icon="images-outline"
            variant="secondary"
            block
            onPress={() => runPhotoAction(() => changeProfilePhoto(uid!, "library"))}
          />
          {profile?.profilePicture ? (
            <Button
              label="Remove photo"
              icon="trash-outline"
              variant="link"
              onPress={() => runPhotoAction(() => removeProfilePhoto(uid!))}
              style={{ alignSelf: "center" }}
            />
          ) : null}
        </View>
        <Text style={sheet.note}>
          Your photo is cropped to a square and kept small to save data. Location details are removed before upload.
        </Text>
      </Sheet>

      {/* EDIT SHEET */}
      <Sheet visible={showEdit} title="Edit profile" onClose={() => setShowEdit(false)}>
        <Field label="Display name" value={displayName} onChangeText={setDisplayName} maxLength={40} />
        <Field label="Username" value={username} onChangeText={(t) => setUsername(t.replace(/\s/g, ""))} autoCapitalize="none" autoCorrect={false} maxLength={20} />
        <View style={s.fieldRow}>
          <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" wrapStyle={{ flex: 1 }} />
          <Field label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" wrapStyle={{ flex: 1 }} />
          <Field label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" wrapStyle={{ flex: 1 }} />
        </View>
        <Text style={sheet.note}>Used to estimate calories and to fit Ani&apos;s quests to you. Other people can&apos;t see these.</Text>
        <Field
          label="Notes for Ani"
          value={aiNotes}
          onChangeText={setAiNotes}
          multiline
          maxLength={NOTES_MAX}
          placeholder="For example: bad left knee, I prefer morning runs"
          inputStyle={{ minHeight: 84, textAlignVertical: "top" }}
        />
        <Text style={sheet.note}>{aiNotes.length}/{NOTES_MAX}</Text>
        {formError && <Text style={sheet.error} accessibilityLiveRegion="polite">{formError}</Text>}
        <View style={sheet.buttons}>
          <Button label="Cancel" variant="secondary" onPress={() => setShowEdit(false)} style={{ flex: 1 }} />
          <Button label="Save" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </Sheet>
    </Screen>
  );
}

// --- Small pieces ---

const Metric = ({ icon, color, value, unit, label }: { icon: string; color: string; value: string; unit?: string; label: string }) => (
  <View style={s.metric}>
    <Ionicons name={icon as any} size={18} color={color} />
    <Text style={s.metricValue}>
      {value}
      {unit ? <Text style={s.metricUnit}> {unit}</Text> : null}
    </Text>
    <Text style={s.muted}>{label}</Text>
  </View>
);

const Tile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <View style={s.tile}>
    <Text style={s.muted}>{label}</Text>
    <Text style={s.tileValue}>{value}</Text>
    {sub && <Text style={s.tileSub}>{sub}</Text>}
  </View>
);

const Row = ({ icon, label, onPress, danger, last }: { icon: string; label: string; onPress: () => void; danger?: boolean; last?: boolean }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={({ pressed }) => [s.row, last && { borderBottomWidth: 0 }, pressed && { backgroundColor: KARELA.color.surfaceAlt }]}
  >
    <Ionicons name={icon as any} size={20} color={danger ? KARELA.color.danger : KARELA.color.textSecondary} />
    <Text style={[s.rowLabel, danger && { color: KARELA.color.danger }]}>{label}</Text>
    {!danger && <Ionicons name="chevron-forward" size={16} color={KARELA.color.textFaint} />}
  </Pressable>
);

// --- Styles ---
const s = StyleSheet.create({
  content: { paddingTop: 56, paddingHorizontal: KARELA.space.xl, paddingBottom: 60 },
  topBar: { flexDirection: "row", justifyContent: "space-between", marginBottom: KARELA.space.lg },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  identity: { flexDirection: "row", alignItems: "center", gap: KARELA.space.lg },
  photoBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KARELA.color.brand,
    borderWidth: 2,
    borderColor: KARELA.color.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  photoOptions: { gap: KARELA.space.md, marginTop: KARELA.space.lg },
  name: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black },
  handle: { color: KARELA.color.textSecondary, fontSize: 14, fontFamily: KARELA.font.regular, marginTop: 2 },
  since: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: KARELA.space.xs },
  editBtn: { marginTop: KARELA.space.lg, alignSelf: "flex-start" },

  card: { backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.lg, padding: KARELA.space.lg, marginTop: KARELA.space.xl, gap: KARELA.space.sm, borderWidth: 1, borderColor: KARELA.color.lineSoft },
  levelText: { color: KARELA.color.brand, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  xpBar: { height: 8, backgroundColor: KARELA.color.surfaceSoft, borderRadius: 4, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 4 },

  metricsRow: { flexDirection: "row", gap: KARELA.space.sm, marginTop: KARELA.space.md },
  metric: { flex: 1, backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.md, paddingVertical: KARELA.space.md, alignItems: "center", gap: 2 },
  metricValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black, marginTop: 2 },
  metricUnit: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  hint: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: KARELA.space.sm, textAlign: "center" },

  sectionTitle: { color: KARELA.color.textPrimary, fontSize: 16, fontFamily: KARELA.font.black, marginTop: KARELA.space.xxl, marginBottom: KARELA.space.md },
  sectionHead: { marginTop: KARELA.space.xxl, marginBottom: KARELA.space.sm },
  inlineTitle: { marginTop: 0, marginBottom: 0 },
  notice: { color: KARELA.color.civic, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginBottom: KARELA.space.sm },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: KARELA.space.sm },
  tile: { flexBasis: "31%", flexGrow: 1, backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.sm, padding: KARELA.space.md, gap: 4 },
  tileValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  tileSub: { color: KARELA.color.textMuted, fontSize: 10, fontFamily: KARELA.font.regular },

  list: { backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.md, overflow: "hidden" },
  listRow: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md, paddingHorizontal: KARELA.space.lg, paddingVertical: KARELA.space.md, borderBottomWidth: 1, borderBottomColor: KARELA.color.lineSoft },
  listDate: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, width: 52 },
  listMain: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold, flex: 1 },
  listXp: { color: KARELA.color.brand },
  emptyText: { color: KARELA.color.textMuted, fontSize: 13, fontFamily: KARELA.font.regular, padding: KARELA.space.lg },

  civicCard: { flexDirection: "row", alignItems: "center", marginTop: 0 },
  civicStat: { flex: 1, alignItems: "center", gap: 2 },
  bigValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black },
  divider: { width: 1, alignSelf: "stretch", backgroundColor: KARELA.color.line },

  badges: { flexDirection: "row", flexWrap: "wrap", rowGap: KARELA.space.lg },
  badge: { width: "25%", alignItems: "center", gap: 4, paddingHorizontal: 2 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  badgeLocked: { borderColor: KARELA.color.line, borderStyle: "dashed" },
  badgeLabel: { color: KARELA.color.textPrimary, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium, textAlign: "center" },
  badgeHint: { color: KARELA.color.textMuted, fontSize: 10, fontFamily: KARELA.font.regular, textAlign: "center" },

  aniCard: { marginTop: 0, borderLeftWidth: 3, borderLeftColor: KARELA.color.brand },
  aniActions: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md, marginTop: KARELA.space.xs },
  body: { color: KARELA.color.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: KARELA.font.regular },
  muted: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },

  row: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md, minHeight: KARELA.tap + 4, paddingHorizontal: KARELA.space.lg, borderBottomWidth: 1, borderBottomColor: KARELA.color.lineSoft },
  rowLabel: { flex: 1, color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.medium },

  fieldRow: { flexDirection: "row", gap: KARELA.space.sm },
});
