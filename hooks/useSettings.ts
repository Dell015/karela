import { useAuth } from "@/context/AuthContext";
import { db as firestore } from "@/services/database/firebase/config";
import { db } from "@/services/database/sqlite/database";
import { doc, increment, updateDoc, setDoc } from "firebase/firestore";
import { Alert } from "react-native";

export const useSettings = () => {
  const { profile, logout, reloadProfile } = useAuth();

  const injectFakeData = async () => {
    try {
      console.log("Generating a full month of thesis data...");
      const now = Date.now();
      const oneDay = 86400000;

      // 1. Create a 30-day spread of data (14 sessions total)
      const fakeRuns = [
        // --- WEEK 1 (Most Recent) ---
        { date: now, meters: 3500 },                // Today
        { date: now - oneDay * 1, meters: 2100 },   // Yesterday
        { date: now - oneDay * 3, meters: 4800 },   // 3 days ago
        { date: now - oneDay * 5, meters: 5200 },   // 5 days ago
        { date: now - oneDay * 6, meters: 3100 },   // 6 days ago

        // --- WEEK 2 ---
        { date: now - oneDay * 9, meters: 6100 },   // 9 days ago
        { date: now - oneDay * 12, meters: 4200 },  // 12 days ago
        { date: now - oneDay * 14, meters: 5000 },  // 14 days ago

        // --- WEEK 3 ---
        { date: now - oneDay * 18, meters: 7200 },  // 18 days ago
        { date: now - oneDay * 21, meters: 3800 },  // 21 days ago

        // --- WEEK 4 (Oldest) ---
        { date: now - oneDay * 25, meters: 8500 },  // 25 days ago
        { date: now - oneDay * 28, meters: 4400 },  // 28 days ago
        { date: now - oneDay * 29, meters: 2900 },  // 29 days ago
        { date: now - oneDay * 30, meters: 5500 },  // 30 days ago
      ];

      // Wipe old data first
      db.execSync("DELETE FROM ghost_runs");

      // Insert all 14 runs into SQLite
      for (const run of fakeRuns) {
        db.execSync(
          `INSERT INTO ghost_runs (date, distance, duration) 
           VALUES (${run.date}, ${run.meters}, 1800)`
        );
      }

      // 2. Sync Firebase (Cloud Totals)
      // We calculate the total km: ~66.3km
      if (profile?.uid) {
        const userRef = doc(firestore, "users", profile.uid);
        try {
          await updateDoc(userRef, {
            "stats.xp": increment(3500),
            "stats.total_distance_km": increment(66.3),
            "stats.ghostWins": increment(14),
            "stats.level": 4, // Higher level for the demo
          });
        } catch (e) {
          // Fallback if the user document is brand new
          await setDoc(userRef, {
            stats: {
              xp: 3500,
              total_distance_km: 66.3,
              ghostWins: 14,
              level: 4
            }
          }, { merge: true });
        }
      }

      await reloadProfile();
      Alert.alert("Demo Mode", "A full month of running has been simulated!");
    } catch (error: any) {
      console.error("Seed Error:", error);
      Alert.alert("Seed Failed", error.message);
    }
  };

  const handleResetData = () => {
    Alert.alert("Reset Stats?", "Permanently wipe history?", [
      { text: "Cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          try {
            db.execSync("DELETE FROM ghost_runs");
            if (profile?.uid) {
              const userRef = doc(firestore, "users", profile.uid);
              await updateDoc(userRef, {
                "stats.xp": 0,
                "stats.level": 1,
                "stats.ghostWins": 0,
                "stats.total_distance_km": 0,
              });
            }
            await reloadProfile();
            Alert.alert("Reset Complete");
          } catch (e) {
            Alert.alert("Error", "Reset failed.");
          }
        },
      },
    ]);
  };

  return { handleResetData, injectFakeData, logout, profile };
};