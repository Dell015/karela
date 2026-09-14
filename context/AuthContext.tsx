import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/database/supabase/config";
import {
    getProfile,
    incrementStats,
    setStats,
    subscribeToProfile,
} from "../services/database/supabase/profiles";
import { applyStreakMultiplier } from "../services/streakMultiplier";

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
    gems: number;
    streak_freeze_count: number;
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
  syncProgression: () => Promise<void>;
  earnGems: (amount: number) => Promise<void>;
  useStreakFreeze: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  reloadProfile: async () => {},
  logout: async () => {},
  gainXP: async () => {},
  syncProgression: async () => {},
  earnGems: async () => {},
  useStreakFreeze: async () => false,
});

const DEFAULT_STATS = {
  age: 20,
  weight: 70,
  height: 170,
  bmi: 24.2,
  level: 1,
  xp: 0,
  gems: 0,
  streak_freeze_count: 0,
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
//
// MUTEX: A module-level Set tracks which UIDs are currently being normalized.
// Concurrent calls (e.g. gainXP + realtime subscription firing at the same time)
// would both see xp >= 1000, both compute the same negative delta, and both apply
// it — driving XP deep into negative territory. The mutex makes the second call
// a no-op while the first is in flight.
const normalizingUIDs = new Set<string>();

const normalizeXP = async (uid: string, stats: any): Promise<boolean> => {
  const XP_THRESHOLD = 1000;
  const xp = Number(stats?.xp || 0);
  if (xp < XP_THRESHOLD) return false;

  // Skip if normalization is already running for this user
  if (normalizingUIDs.has(uid)) return false;
  normalizingUIDs.add(uid);

  try {
    // Re-read from DB right before writing so we always act on the latest value,
    // not a potentially stale snapshot passed in via `stats`.
    const fresh = await getProfile(uid);
    const freshXP = Number(fresh?.stats?.xp || 0);
    if (freshXP < XP_THRESHOLD) return false;

    const levelUps = Math.floor(freshXP / XP_THRESHOLD);
    // Atomic deltas rather than an absolute write: a concurrent XP award
    // (e.g. QuestEngine.claimQuest) would otherwise be silently overwritten.
    await incrementStats(uid, {
      xp: -levelUps * XP_THRESHOLD,
      level: levelUps,
    });
  } catch (e) {
    console.warn("XP normalization failed (non-fatal):", e);
  } finally {
    normalizingUIDs.delete(uid);
  }
  return true;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const gainXP = async (amount: number) => {
    if (!user || !profile) return;

    // Apply streak multiplier to the raw XP amount
    const streak = Number(profile.stats?.streak || 0);
    const boostedAmount = amount > 0 ? applyStreakMultiplier(amount, streak) : 0;

    try {
      // Atomic add so a stale client value can never overwrite server state.
      if (boostedAmount > 0) {
        await incrementStats(user.uid, { xp: boostedAmount });
      }
      // normalizeXP re-reads from DB internally and is mutex-protected
      // against concurrent calls from the realtime subscription.
      await normalizeXP(user.uid, { xp: boostedAmount });
      await reloadProfile();
    } catch (error) {
      console.error("XP Update Failed:", error);
    }
  };

  /**
   * Reconciles level/XP after a reward was granted server-side
   * (e.g. QuestEngine.claimQuest) without re-awarding anything.
   */
  const syncProgression = async () => {
    if (!user) return;
    try {
      // Pass xp=1000 so normalizeXP passes the threshold guard and re-reads
      // the real value from DB internally. The mutex prevents any race.
      await normalizeXP(user.uid, { xp: 1000 });
      await reloadProfile();
    } catch (error) {
      console.error("Progression Sync Failed:", error);
    }
  };

  const earnGems = async (amount: number) => {
    if (!user || !profile || amount <= 0) return;
    try {
      await incrementStats(user.uid, { gems: amount });
      await reloadProfile();
    } catch (error) {
      console.error("Gem Update Failed:", error);
    }
  };

  const useStreakFreeze = async (): Promise<boolean> => {
    if (!user || !profile) return false;
    const currentGems = Number(profile.stats?.gems || 0);
    const FREEZE_COST = 80;

    if (currentGems < FREEZE_COST) return false;

    try {
      await incrementStats(user.uid, {
        gems: -FREEZE_COST,
        streak_freeze_count: 1,
      });
      await reloadProfile();
      return true;
    } catch (error) {
      console.error("Streak Freeze Failed:", error);
      return false;
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

      // Missing stat fields patched above; normalization is handled by the
      // realtime subscription callback to avoid double-firing on load.
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
    // getSession() and onAuthStateChange(INITIAL_SESSION) both fire, so two
    // handleSession calls can interleave across their awaits. Without a token,
    // both see unsubscribeProfile === null and each creates a channel — and
    // subscribeToProfile uses a random channel name, so Supabase does not
    // dedupe them and the first one leaks.
    let disposed = false;
    let sessionSeq = 0;

    const handleSession = async (session: any) => {
      const seq = ++sessionSeq;

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

        // Superseded by a newer session event, or unmounted — do not subscribe.
        if (disposed || seq !== sessionSeq) return;

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
      if (!disposed) setLoading(false);
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
      disposed = true;
      subscription.unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, reloadProfile, logout, gainXP, syncProgression, earnGems, useStreakFreeze }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
