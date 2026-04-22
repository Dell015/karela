import { db } from "./config";
import { collection, addDoc } from "firebase/firestore";
import { summarizeRunForAI } from "./aiService"; 

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
        duration: runData.duration || 0 
      }
    });

    console.log("AI DNA Summary archived successfully.");
  } catch (e) {
    console.error("Failed to generate AI DNA:", e);
  }
};