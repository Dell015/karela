import { GoogleGenAI } from "@google/genai";

// 1. Correct Initialization for 2026 SDK
const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
});

export const summarizeRunForAI = async (runData: any) => {
  try {
    // 2. Stateless Call via ai.models.generateContent
    // Note: Use gemini-2.5-flash for the best cost/speed balance in 2026
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: [
        {
          role: "user",
          parts: [{
            text: `You are the Karela Kinetic Coach. Analyze this run data:
                   Distance: ${runData.distance}m
                   Avg Speed: ${runData.avgSpeed}km/h
                   Sectors: ${JSON.stringify(runData.sectors)}
                   
                   Create a 2-sentence "DNA Summary" of this run. 
                   Identify if there was Stamina Decay in later sectors.
                   Keep it technical but encouraging.`
          }]
        }
      ],
      config: {
        maxOutputTokens: 150,
        temperature: 0.7,
      }
    });

    // 3. Access text directly (it's a property, not a method)
    return response.text || "Run recorded. No specific DNA patterns detected.";
    
  } catch (error) {
    console.error("Gemini Agent Error:", error);
    return "No analysis available for this session.";
  }
};