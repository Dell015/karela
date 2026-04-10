import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/database/firebase/config";

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
    const XP_THRESHOLD = 1000;

    let newXP = (profile.stats.xp || 0) + amount;
    let newLevel = profile.stats.level || 1;

    // Level up logic (handles multiple level-ups if amount is huge)
    while (newXP >= XP_THRESHOLD) {
      newXP -= XP_THRESHOLD;
      newLevel += 1;
      console.log(`🔥 Level Up! You are now Level ${newLevel}`);
    }

    try {
      // Update Firestore
      await setDoc(
        userDocRef,
        {
          stats: {
            ...profile.stats,
            xp: newXP,
            level: newLevel,
          },
        },
        { merge: true },
      );

      // Local state will update automatically via the onSnapshot listener in useEffect
    } catch (error) {
      console.error("Error updating XP:", error);
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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const XP_THRESHOLD = 1000;

            // --- AUTO-CORRECTION LOGIC ---
            // If XP is 3500, this will fix it to 500 XP and increase Level accordingly
            if (data.stats.xp >= XP_THRESHOLD) {
              let correctedXP = data.stats.xp;
              let correctedLevel = data.stats.level;

              while (correctedXP >= XP_THRESHOLD) {
                correctedXP -= XP_THRESHOLD;
                correctedLevel += 1;
              }

              // Update Firestore with the "cleaned" numbers
              setDoc(
                userDocRef,
                {
                  stats: {
                    ...data.stats,
                    xp: correctedXP,
                    level: correctedLevel,
                  },
                },
                { merge: true },
              );

              // We don't setProfile here because the next snapshot
              // will fire immediately with the clean data.
              return;
            }

            setProfile(data);
          } else {
            // ... (keep your new profile creation logic here)
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
              },
              settings: { units: "metric", notifications: true },
              createdAt: new Date().toISOString(),
            };
            setDoc(userDocRef, newProfile);
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
