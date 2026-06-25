import { summarizeRunForAI } from "../firebase/aiService";
import { supabase } from "./config";

/**
 * Generates an AI run summary (Gemini) and stores it in run_summaries.
 */
export const generateAndSaveRunSummary = async (uid: string, runData: any) => {
  try {
    const aiSummary = await summarizeRunForAI(runData);

    const { error } = await supabase.from("run_summaries").insert({
      user_id: uid,
      summary: aiSummary,
      distance: runData.distance,
      avg_speed: runData.avgSpeed,
    });

    if (error) throw error;
    console.log("AI DNA Summary archived successfully.");
  } catch (e) {
    console.error("Failed to generate AI DNA:", e);
  }
};

/**
 * Fetches the most recent run summaries (Ani memory).
 */
export const getRecentRunMemories = async (uid: string, days = 3) => {
  try {
    const { data, error } = await supabase
      .from("run_summaries")
      .select("summary, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(days);

    if (error) throw error;

    return (data || []).map((row) => ({
      summary: row.summary,
      date: row.created_at,
    }));
  } catch (error) {
    console.error("Error fetching AI memories:", error);
    return [];
  }
};

/**
 * Logs a completed run to run_history.
 */
export const logRunHistory = async (
  uid: string,
  run: {
    distance_meters: number;
    duration_seconds: number;
    calories: number;
    xp_earned: number;
  }
) => {
  const { error } = await supabase.from("run_history").insert({
    user_id: uid,
    ...run,
  });
  if (error) throw error;
};
