import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("⚠️ EXPO_PUBLIC_GEMINI_API_KEY is not set. Ani coaching will use fallback responses.");
}
const genAI = new GoogleGenerativeAI(API_KEY || "");

export const summarizeRunForAI = async (runData: any) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", 
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7,
      },
    });

    const prompt = `Karela run summary: ${runData.distance}m, ${runData.avgSpeed?.toFixed(1)}km/h. Give a 2-sentence coaching summary. Note any pace decay.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Agent Error:", error);
    return "Stamina scan complete. Data synchronized to core.";
  }
};

export const generateAniQuest = async (userProfile: any, runHistory: any[] = []) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        maxOutputTokens: 150  // Reduced — quest JSON is small
      },
    });

    const stats = userProfile.stats;
    const hasHistory = runHistory.length > 0;

    // OPTIMIZED: Minimal prompt — saves ~40% tokens vs the old version
    const prompt = `Generate 1 running quest as JSON. Athlete: level ${stats.level}, ${stats.weight}kg, ${stats.age}y/o. Notes: "${stats.ai_notes || "none"}". ${hasHistory ? `Recent avg: ${Math.round(runHistory.reduce((a: any, r: any) => a + (r.distance || 2000), 0) / runHistory.length)}m.` : "New user."} Return: {"title":"string","description":"string (max 12 words)","goalDistance":number_meters,"goalSpeed":number_kmh,"rewardXP":number}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
    
  } catch (error) {
    console.error("Ani Quest Gen Error:", error);
    return {
      id: `fail_${Date.now()}`,
      title: "Baseline Calibration",
      description: "AI Link unstable. Complete a standard patrol.",
      goalDistance: 2000,
      goalSpeed: 6.5,
      rewardXP: 50
    };
  }
};