import { useAuth } from "@/context/AuthContext";
import { db, initDatabase } from "@/services/database/sqlite/database";
import { Alert } from "react-native";

export const useSettings = () => {
  const { profile, logout, reloadProfile } = useAuth();

  /**
   * SEED DATA: Generates a month of high-quality running data
   * for thesis demonstration/testing purposes.
   */
  const injectFakeData = async () => {
    try {
      console.log("Generating a full month of telemetry data...");
      const now = Date.now();
      const oneDay = 86400000;

      // 1. Create a 30-day spread of data (14 sessions total)
      const fakeRuns = [
        { date: now, meters: 3500 }, // Today
        { date: now - oneDay * 1, meters: 2100 }, // Yesterday
        { date: now - oneDay * 3, meters: 4800 }, // 3 days ago
        { date: now - oneDay * 5, meters: 5200 }, // 5 days ago
        { date: now - oneDay * 6, meters: 3100 }, // 6 days ago
        { date: now - oneDay * 9, meters: 6100 }, // 9 days ago
        { date: now - oneDay * 12, meters: 4200 }, // 12 days ago
        { date: now - oneDay * 14, meters: 5000 }, // 14 days ago
        { date: now - oneDay * 18, meters: 7200 }, // 18 days ago
        { date: now - oneDay * 21, meters: 3800 }, // 21 days ago
        { date: now - oneDay * 25, meters: 8500 }, // 25 days ago
        { date: now - oneDay * 28, meters: 4400 }, // 28 days ago
        { date: now - oneDay * 29, meters: 2900 }, // 29 days ago
        { date: now - oneDay * 30, meters: 5500 }, // 30 days ago
      ];

      // --- SAFE SQLITE WIPE ---
      db.execSync("DROP TABLE IF EXISTS ghost_runs");
      db.execSync("DROP TABLE IF EXISTS daily_missions");
      initDatabase(); // Recreate tables properly

      // --- INSERT SESSIONS ---
      for (const run of fakeRuns) {
        db.runSync(
          "INSERT INTO ghost_runs (date, distance, duration, avg_speed) VALUES (?, ?, ?, ?)",
          [run.date, run.meters, 1800, 10.5],
        );
      }

      // 2. Sync Supabase (Cloud Totals)
      if (profile?.uid) {
        await incrementStats(profile.uid, {
          xp: 3500,
          total_distance_km: 66.3,
          ghostWins: 14,
        });
        await setStats(profile.uid, { level: 4 });
      }

      await reloadProfile();
      Alert.alert(
        "Demo Mode Active",
        "Telemetry synchronized: 14 missions injected into history.",
      );
    } catch (error: any) {
      console.error("Seed Error:", error);
      Alert.alert("Injection Failed", error.message);
    }
  };

  /**
   * RESET DATA: Wipes both local SQLite and Cloud Firestore stats.
   */
  const handleResetData = () => {
    Alert.alert(
      "Hard Reset",
      "This will permanently delete local history and reset cloud levels. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Wipe SQLite safely
              db.execSync("DROP TABLE IF EXISTS ghost_runs");
              db.execSync("DROP TABLE IF EXISTS daily_missions");
              initDatabase();

              // 2. Reset Supabase
              if (profile?.uid) {
                await setStats(profile.uid, {
                  xp: 3500, // Total RPG Progress
                  level: 4, // Total RPG Level
                  ghostWins: 14, // Lifetime Wins
                });
              }

              await reloadProfile();
              Alert.alert(
                "Success",
                "Telemetry and cloud profile have been cleared.",
              );
            } catch (e) {
              console.error("Reset Error:", e);
              Alert.alert("Error", "A system error occurred during reset.");
            }
          },
        },
      ],
    );
  };

  return { handleResetData, injectFakeData, logout, profile };
};
