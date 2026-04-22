import { addDoc, collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { summarizeRunForAI } from "./aiService";
import { db } from "./config";

export const generateAndSaveRunSummary = async (uid: string, runData: any) => {
  try {
    // 1. Call the AI Service we built (aiService.ts)
    // This function handles the Gemini API call internally
    const aiSummary = await summarizeRunForAI(runData);

    // 2. Save to the "run_summaries" sub-collection
    await addDoc(collection(db, "users", uid, "run_summaries"), {
      summary: aiSummary,
      date: new Date().toISOString(),
      stats: {
        distance: runData.distance,
        avgSpeed: runData.avgSpeed,
        // Using duration from runData if available
        duration: runData.duration || 0,
      },
    });

    console.log("AI DNA Summary archived successfully.");
  } catch (e) {
    console.error("Failed to generate AI DNA:", e);
  }
};

export const getRecentRunMemories = async (uid: string, days = 3) => {
  try {
    const memoriesRef = collection(db, "users", uid, "run_summaries");
    // We get the last few summaries ordered by date
    const q = query(memoriesRef, orderBy("date", "desc"), limit(days));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      summary: doc.data().summary,
      date: doc.data().date,
    }));
  } catch (error) {
    console.error("Error fetching AI memories:", error);
    return [];
  }
};
