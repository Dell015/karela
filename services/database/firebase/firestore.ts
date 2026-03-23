import { db, auth } from "./config";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";

export const updateFirebaseProgress = async (summary: { distance: number, avgSpeed: number }) => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  
  // 1. Calculate XP (e.g., 1 XP per 10 meters + Bonus for speed)
  const baseXP = Math.floor(summary.distance / 10);
  const speedBonus = Math.floor(summary.avgSpeed * 5); // Faster = More XP
  const totalXP = baseXP + speedBonus;

  try {
    // 2. Atomic update in Firebase
    await updateDoc(userRef, {
      "stats.xp": increment(totalXP),
      "stats.total_meters": increment(summary.distance),
      "stats.last_avg_speed": summary.avgSpeed,
      // Logic: If they ran faster than 8km/h, slightly nudge their fitness_score up
      "stats.fitness_score": increment(summary.avgSpeed > 8 ? 0.05 : 0.01)
    });

    console.log(`[Firebase] Sync Complete: +${totalXP} XP earned.`);
  } catch (error) {
    console.error("Firebase Sync Failed:", error);
  }
};