import { db, initDatabase } from "@/services/database/sqlite/database";
import { supabase } from "@/services/database/supabase/config";
import { setStats } from "@/services/database/supabase/profiles";
import { clearLocalSettings, getLocalSettings } from "@/services/localSettings";
import { deleteAllProfilePhotos } from "@/services/profilePhoto";
import { cancelDailyReminder } from "@/services/reminders";

/**
 * Account actions behind the Settings screen. Each one throws an Error whose
 * message is safe to show the user as is.
 */

/** Same minimum the sign-up screen and Supabase Auth use. */
export const MIN_PASSWORD_LENGTH = 6;

const wipeLocalRuns = () => {
  db.execSync("DROP TABLE IF EXISTS ghost_runs");
  db.execSync("DROP TABLE IF EXISTS daily_missions");
  db.execSync("DROP TABLE IF EXISTS run_outbox");
  initDatabase();
};

export const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string,
) => {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  // Check the current password first, so a phone left unlocked can't be
  // used to take over the account.
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (checkError) throw new Error("Your current password isn't right. Try again.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("different")) throw new Error("Pick a password you haven't used here before.");
    if (m.includes("weak") || m.includes("short")) throw new Error("That password is too weak. Make it longer.");
    throw new Error("Your password wasn't changed. Check your connection and try again.");
  }
};

/**
 * Everything the account holds on the server, as readable JSON
 * (RA 10173 right of access). The route of each run is not included because
 * it never leaves the phone.
 */
export const exportMyData = async (uid: string): Promise<string> => {
  const read = async (table: string, column = "user_id") => {
    const { data, error } = await supabase.from(table).select("*").eq(column, uid);
    if (error) throw new Error("Couldn't collect your data. Check your connection and try again.");
    return data ?? [];
  };

  const [profile, runHistory, runSummaries, missions, civicReports] = await Promise.all([
    read("profiles", "id"),
    read("run_history"),
    read("run_summaries"),
    read("missions"),
    read("civic_reports"),
  ]);
  // Shop and streak tables (migration 10). Missing before it's run: skip them.
  const optional = async (table: string) => {
    const { data, error } = await supabase.from(table).select("*").eq("user_id", uid);
    return error ? undefined : data;
  };
  const [purchases, items, protectedDays] = await Promise.all([
    optional("purchases"),
    optional("user_items"),
    optional("streak_protections"),
  ]);
  const squad = await supabase.rpc("get_my_squad");
  const { privacyZones } = await getLocalSettings();

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      about:
        "Your Karela data. Run routes are not included: they are stored only on your phone.",
      profile: profile[0] ?? null,
      run_history: runHistory,
      run_summaries: runSummaries,
      missions,
      civic_reports: civicReports,
      shop_purchases: purchases,
      owned_items: items,
      protected_streak_days: protectedDays,
      squad: squad.error || !squad.data?.squad
        ? null
        : { name: squad.data.squad.name, role: squad.data.my_role },
      on_this_phone: {
        privacy_zone_count: privacyZones.length,
      },
    },
    null,
    2,
  );
};

/**
 * Starts the running side over: run history (phone and account), Ani's run
 * notes, and level, XP, distance and streak. Gems, Streak Freezes, quests and
 * civic reports are kept.
 */
export const resetProgress = async (uid: string) => {
  const del = async (table: string) => {
    const { error } = await supabase.from(table).delete().eq("user_id", uid);
    if (error) throw new Error("Reset didn't finish. Check your connection and try again.");
  };

  await del("run_history");
  await del("run_summaries");
  await setStats(uid, {
    level: 1,
    xp: 0,
    ghostWins: 0,
    streak: 0,
    longest_streak: 0,
    total_distance_km: 0,
    total_calories_burned: 0,
    avg_pace_mins_km: 0,
    fitness_score: 1.0,
  });
  wipeLocalRuns();
};

/**
 * Deletes the account and everything linked to it (RA 10173), then signs out.
 * Needs supabase/08_account_deletion.sql on the server.
 */
export const deleteAccount = async (uid: string) => {
  // 0. Dry run: make sure the server can do the deletion before touching
  //    anything, so a missing migration never leaves a half-deleted account.
  const { error: checkError } = await supabase.rpc("delete_my_account", { p_dry_run: true });
  if (checkError) {
    if (checkError.code === "PGRST202") {
      throw new Error(
        "Account deletion isn't switched on for this server yet. Nothing was deleted. Contact the Karela team to delete your account.",
      );
    }
    throw new Error("Couldn't reach your account. Check your connection and try again.");
  }

  // 1. Report photos. Storage files have to go through the Storage API;
  //    the database function can't remove them.
  const { data: files, error: listError } = await supabase.storage
    .from("civic-photos")
    .list(uid, { limit: 1000 });
  if (listError) throw new Error("Couldn't reach your account. Check your connection and try again.");
  if (files && files.length > 0) {
    const { error } = await supabase.storage
      .from("civic-photos")
      .remove(files.map((f) => `${uid}/${f.name}`));
    if (error) throw new Error("Couldn't delete your report photos. Check your connection and try again.");
  }

  // 1b. Profile photos (supabase/09_profile_pictures.sql).
  try {
    await deleteAllProfilePhotos(uid);
  } catch {
    throw new Error("Couldn't delete your profile photo. Check your connection and try again.");
  }

  // 2. The account row and everything that cascades from it.
  const { error } = await supabase.rpc("delete_my_account", { p_dry_run: false });
  if (error) {
    throw new Error(
      "Your photos were removed, but the rest of your account wasn't deleted. Check your connection and try again.",
    );
  }

  // 3. This phone.
  try {
    wipeLocalRuns();
    await cancelDailyReminder();
    await clearLocalSettings();
  } catch (e) {
    console.warn("Local cleanup after account deletion failed:", e);
  }
  await supabase.auth.signOut();
};
