import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/database/supabase/config";
import {
    getProfile,
    setStats,
    subscribeToProfile,
} from "../services/database/supabase/profiles";

// 1. STYLED INTERFACE (unchanged — keeps the rest of the app compatible)
export interface UserProfile {
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
    last_daily_reset?: string;
    last_weekly_reset?: string;
    last_monthly_reset?: string;
  };
  settings: {
    units: "metric" | "imperial";
    notifications: boolean;
  };
  createdAt: string;
}

// Normalized user object so existing `user.uid` / `user.displayName` usages keep working.
interface AppUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: AppUser | null;
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

const DEFAULT_STATS = {
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
  last_daily_reset: "",
  last_weekly_reset: "",
  last_monthly_reset: "",
};

// Maps a Supabase profiles row → the app's UserProfile shape.
const mapRowToProfile = (row: any): UserProfile => ({
  uid: row.id,
  email: row.email || "",
  displayName: row.display_name || "New Strider",
  username: row.username,
  isVerified: row.is_verified ?? false,
  profilePicture: row.profile_picture,
  stats: { ...DEFAULT_STATS, ...(row.stats || {}) },
  settings: row.settings || { units: "metric", notifications: true },
  createdAt: row.created_at,
});

// If accumulated XP has crossed the 1000 threshold, roll it into levels
// and persist the correction. Returns true if a correction was applied.
const normalizeXP = async (uid: string, stats: any): Promise<boolean> => {
  const XP_THRESHOLD = 1000;
  let xp = Number(stats?.xp || 0);
  let level = Number(stats?.level || 1);
  if (xp < XP_THRESHOLD) return false;

  while (xp >= XP_THRESHOLD) {
    xp -= XP_THRESHOLD;
    level += 1;
  }
  try {
    await setStats(uid, { xp, level });
  } catch (e) {
    console.warn("XP normalization failed (non-fatal):", e);
  }
  return true;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const gainXP = async (amount: number) => {
    if (!user || !profile) return;
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
      await setStats(user.uid, { xp: newXP, level: newLevel });
    } catch (error) {
      console.error("XP Update Failed:", error);
    }
  };

  const loadProfile = async (uid: string) => {
    try {
      const row = await getProfile(uid);
      const mapped = mapRowToProfile(row);

      // Patch any missing stat fields (older rows / partial signup data)
      const missingKeys = Object.keys(DEFAULT_STATS).filter(
        (k) => (row.stats || {})[k] === undefined,
      );
      if (missingKeys.length > 0) {
        const patch: Record<string, any> = {};
        missingKeys.forEach((k) => {
          patch[k] = (DEFAULT_STATS as any)[k];
        });
        try {
          await setStats(uid, patch);
        } catch (e) {
          console.warn("Stat patch failed (non-fatal):", e);
        }
      }

      setProfile(mapped);

      // Auto-level if XP crossed the threshold (realtime will deliver the corrected row)
      await normalizeXP(uid, mapped.stats);
    } catch (error) {
      console.error("Profile load failed:", error);
    }
  };

  const reloadProfile = async () => {
    if (user) await loadProfile(user.uid);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const handleSession = async (session: any) => {
      if (session?.user) {
        const su = session.user;
        const appUser: AppUser = {
          uid: su.id,
          email: su.email || "",
          displayName:
            su.user_metadata?.display_name || su.email?.split("@")[0] || "Strider",
        };
        setUser(appUser);

        await loadProfile(su.id);

        // Realtime profile subscription (replaces Firestore onSnapshot)
        if (unsubscribeProfile) unsubscribeProfile();
        unsubscribeProfile = subscribeToProfile(su.id, (row) => {
          const mapped = mapRowToProfile(row);
          setProfile(mapped);
          // Correct XP overflow if a write pushed xp past the threshold
          normalizeXP(su.id, mapped.stats);
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data }) => handleSession(data.session));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
