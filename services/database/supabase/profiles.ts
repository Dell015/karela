import { supabase } from "./config";

/**
 * Fetches a user's profile row.
 */
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Updates top-level profile columns (display_name, username, profile_picture, etc.)
 */
export const updateProfile = async (
  userId: string,
  updates: Record<string, any>
) => {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw error;
};

/**
 * Atomically adds numeric deltas to stat fields (replaces Firestore increment()).
 * Example: incrementStats(uid, { xp: 150, total_distance_km: 2.3 })
 */
export const incrementStats = async (
  userId: string,
  deltas: Record<string, number>
) => {
  const { error } = await supabase.rpc("increment_stats", {
    p_user_id: userId,
    p_deltas: deltas,
  });
  if (error) throw error;
};

/**
 * Overwrites stat fields (for non-numeric or absolute values).
 * Example: setStats(uid, { last_daily_reset: '2026-06-25' })
 */
export const setStats = async (
  userId: string,
  values: Record<string, any>
) => {
  const { error } = await supabase.rpc("set_stats", {
    p_user_id: userId,
    p_values: values,
  });
  if (error) throw error;
};

/**
 * Subscribes to realtime changes on a user's profile row.
 * Returns an unsubscribe function. Replaces Firestore onSnapshot.
 */
export const subscribeToProfile = (
  userId: string,
  onChange: (profile: any) => void
) => {
  const channel = supabase
    .channel(`profile:${userId}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) onChange(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
