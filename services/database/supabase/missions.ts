import { supabase } from "./config";

export interface MissionRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  status: string;
  category: string;
  frequency: string;
  type: string;
  created_at_key: string;
  created_at: string;
}

/**
 * Inserts a new mission for a user.
 */
export const addMission = async (
  uid: string,
  mission: {
    title: string;
    description: string;
    target_value: number;
    xp_reward: number;
    category?: string;
    frequency?: string;
    type?: string;
    created_at_key?: string;
  }
) => {
  const { error } = await supabase.from("missions").insert({
    user_id: uid,
    title: mission.title,
    description: mission.description,
    target_value: mission.target_value,
    current_value: 0,
    xp_reward: mission.xp_reward,
    status: "active",
    category: mission.category ?? "solo",
    frequency: mission.frequency ?? "daily",
    type: mission.type ?? "distance",
    created_at_key: mission.created_at_key,
  });
  if (error) throw error;
};

/**
 * Fetches a user's missions filtered by status/category/frequency.
 */
export const getMissions = async (
  uid: string,
  filters: { status?: string; category?: string; frequency?: string } = {}
) => {
  let q = supabase.from("missions").select("*").eq("user_id", uid);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.frequency) q = q.eq("frequency", filters.frequency);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as MissionRow[];
};

/**
 * Updates fields on a mission.
 */
export const updateMission = async (
  missionId: string,
  updates: Record<string, any>
) => {
  const { error } = await supabase
    .from("missions")
    .update(updates)
    .eq("id", missionId);
  if (error) throw error;
};

/**
 * Adds run distance (km) to all active distance-type missions for a user.
 */
export const syncRunToMissions = async (uid: string, runKm: number) => {
  const active = await getMissions(uid, { status: "active" });
  const distanceMissions = active.filter((m) => m.type === "distance");

  await Promise.all(
    distanceMissions.map((m) =>
      updateMission(m.id, {
        current_value: Number((Number(m.current_value || 0) + runKm).toFixed(2)),
      })
    )
  );
};

/**
 * Realtime subscription to a user's missions (replaces Firestore onSnapshot).
 * Re-fetches the filtered list on any change. Returns an unsubscribe function.
 */
export const subscribeToMissions = (
  uid: string,
  filters: { status?: string; category?: string; frequency?: string },
  onChange: (missions: MissionRow[]) => void
) => {
  const refetch = async () => {
    try {
      onChange(await getMissions(uid, filters));
    } catch (e) {
      console.error("Mission refetch failed:", e);
    }
  };

  // initial load
  refetch();

  const channel = supabase
    .channel(`missions:${uid}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "missions",
        filter: `user_id=eq.${uid}`,
      },
      () => refetch()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
