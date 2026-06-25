import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("⚠️ EXPO_PUBLIC_GEMINI_API_KEY is not set. Ani coaching will use fallback responses.");
}
const genAI = new GoogleGenerativeAI(API_KEY || "");

export const summarizeRunForAI = async (runData: any) => {
  try {
    // 2. FIXED: Switched to gemini-1.5-flash (Stable)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", 
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7,
      },
    });

    const prompt = `
        You are the Karela Kinetic Coach named Ani. Analyze this run data:
        Distance: ${runData.distance}m
        Avg Speed: ${runData.avgSpeed}km/h
        Sectors: ${JSON.stringify(runData.sectors)}
        
        Create a 2-sentence "DNA Summary" of this run. 
        Identify if there was Stamina Decay in later sectors.
        Keep it technical but encouraging.
    `;

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
      model: "gemini-1.5-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        maxOutputTokens: 200 
      },
    });

    // 1. DEFINE formattedHistory INSIDE THE FUNCTION
    // This maps your run summaries or raw data into a string Ani can read.
    const formattedHistory = runHistory.length > 0 
      ? runHistory.map((run, i) => `Run ${i+1}: ${run.distance}m, Speed: ${run.avgSpeed}km/h. Summary: ${run.summary || "No summary"}`).join("\n")
      : "No previous run history found. This is a fresh start.";

    const stats = userProfile.stats;

    // 2. USE formattedHistory IN THE PROMPT
    const prompt = `
        You are Ani, a witty high-performance coach. Generate 1 custom mission.
        
        RECENT PERFORMANCE HISTORY:
        ${formattedHistory}

        ATHLETE VITALS:
        - Age: ${stats.age}, Weight: ${stats.weight}kg, Level: ${stats.level}
        - Injury/Notes: "${stats.ai_notes || "None"}"

        Return ONLY a JSON object:
        {
          "id": "${Date.now()}",
          "title": "Short Catchy Name",
          "description": "Ani's personal coaching based on their history and vitals (max 15 words)",
          "goalDistance": number (meters),
          "goalSpeed": number (km/h),
          "rewardXP": number
        }
        
        LOGIC: 
        1. Look at RECENT PERFORMANCE HISTORY. Set goalDistance ~10% higher than their average.
        2. If "ai_notes" mentions injury, goalSpeed MUST be < 5.0.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // 3. Clean and Parse
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