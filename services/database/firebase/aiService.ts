import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyD_9TTZcU8rTk5i7JgU24DHDy8U3Q3Hmek";
const genAI = new GoogleGenerativeAI(API_KEY);

export const summarizeRunForAI = async (runData: any) => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7,
        }
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
    return "No analysis available for this session.";
  }
};

export const generateAniQuest = async (userProfile: any) => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { responseMimeType: "application/json" } 
    });

    const stats = userProfile.stats;
    const prompt = `
        You are Ani, a witty high-performance coach. Generate 1 custom mission.
        
        ATHLETE VITALS:
        - Age: ${stats.age}
        - Weight: ${stats.weight}kg
        - Height: ${stats.height}cm
        - Target Weight: ${stats.target_weight}kg
        - Level: ${stats.level}
        - Injury/Notes: "${stats.ai_notes || "None"}"

        Return ONLY a JSON object:
        {
          "id": "${Date.now()}",
          "title": "Short Catchy Name",
          "description": "Ani's personal encouragement based on their specific weight/injury notes (max 15 words)",
          "goalDistance": number (meters),
          "goalSpeed": number (km/h),
          "rewardXP": number
        }
        
        LOGIC: 
        1. If "ai_notes" mentions injury, goalSpeed MUST be < 5.0 (Walking).
        2. If Weight > Target Weight, focus on steady-state distance.
        3. If Age > 50, include a reminder about joint health.
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Ani Quest Gen Error:", error);
    return null;
  }
};