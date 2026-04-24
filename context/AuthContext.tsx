import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/database/firebase/config";
import { string } from "three/src/nodes/tsl/TSLCore.js";

// 1. STYLED INTERFACE
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  isVerified: boolean;
  profilePicture?: string;
  stats: {
    age: number;
    weight: number;
    height: number;
    bmi: number;
    level: number;
    xp: number;
    fitness_score: number;
    ghostWins: number;
    streak: number;
    longest_streak: number;
    last_active_date: string;
    total_distance_km: number;
    total_calories_burned: number;
    total_missions_completed: number;
    avg_pace_mins_km: number;
    target_weight: number;
    ai_notes: string;
  };
  settings: {
    units: "metric" | "imperial";
    notifications: boolean;
  };
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  reloadProfile: () => Promise<void>;
  logout: () => Promise<void>;
  gainXP: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  reloadProfile: async () => {},
  logout: async () => {},
  gainXP: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const gainXP = async (amount: number) => {
    if (!user || !profile) return;
    const userDocRef = doc(db, "users", user.uid);
    const currentXP = Number(profile.stats?.xp || 0);
    const currentLevel = Number(profile.stats?.level || 1);
    const XP_THRESHOLD = 1000;

    let newXP = currentXP + amount;
    let newLevel = currentLevel;

    while (newXP >= XP_THRESHOLD) {
      newXP -= XP_THRESHOLD;
      newLevel += 1;
    }

    try {
      await updateDoc(userDocRef, {
        "stats.xp": newXP,
        "stats.level": newLevel,
      });
    } catch (error) {
      console.error("XP Update Failed:", error);
    }
  };

  const reloadProfile = async () => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);

        const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;

            // AUTO-PATCH LOGIC
            const needsPatch =
              !data.settings ||
              data.stats?.streak === undefined ||
              data.stats?.total_calories_burned === undefined;
              data.stats?.ai_notes === undefined;

            if (needsPatch) {
              console.log("🛠 Stryder System: Patching missing data fields...");
              const patchedStats = {
                ...data.stats,
                streak: data.stats?.streak ?? 0,
                longest_streak: data.stats?.longest_streak ?? 0,
                last_active_date: data.stats?.last_active_date ?? new Date().toISOString(),
                total_calories_burned: data.stats?.total_calories_burned ?? 0,
                avg_pace_mins_km: data.stats?.avg_pace_mins_km ?? 0,
                target_weight: data.stats?.target_weight ?? (data.stats?.weight || 70),
                total_missions_completed: Number(data.stats?.total_missions_completed) || 0,
                ai_notes: data.stats?.ai_notes ?? "",
              };

              const updatedData = {
                ...data,
                stats: patchedStats,
                settings: data.settings || { units: "metric", notifications: true },
              };

              await setDoc(userDocRef, updatedData, { merge: true });
              // We do NOT return here; let the next logic blocks run
            }

            // XP OVERFLOW CORRECTION
            const XP_THRESHOLD = 1000;
            if (data.stats?.xp >= XP_THRESHOLD) {
              let cXP = data.stats.xp;
              let cLvl = data.stats.level;
              while (cXP >= XP_THRESHOLD) {
                cXP -= XP_THRESHOLD;
                cLvl += 1;
              }
              await updateDoc(userDocRef, {
                "stats.xp": cXP,
                "stats.level": cLvl,
              });
            }

            // SET THE PROFILE STATE
            setProfile(data as UserProfile);
          } else {
            // INITIAL NEW PROFILE CREATION
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "New Strider",
              username: "Strider_" + firebaseUser.uid.slice(0, 4),
              isVerified: false,
              stats: {
                age: 20,
                weight: 70,
                height: 170,
                bmi: 24.2,
                level: 1,
                xp: 0,
                fitness_score: 1.0,
                ghostWins: 0,
                streak: 0,
                longest_streak: 0,
                last_active_date: new Date().toISOString(),
                total_distance_km: 0,
                total_calories_burned: 0,
                total_missions_completed: 0,
                avg_pace_mins_km: 0,
                target_weight: 70,
                ai_notes: "",
              },
              settings: { units: "metric", notifications: true },
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, reloadProfile, logout, gainXP }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);