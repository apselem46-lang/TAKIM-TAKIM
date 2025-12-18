import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Challenge, ValidationResult } from "../types";

// Initialize Gemini Client
// Note: In a real production app, this should be proxied through a backend to protect the key.
// For this demo, we assume the environment variable is injected safely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Role: You are the "Football Career Link" Game Engine. 
Your goal is to test the player’s knowledge of football transfers and player histories.
The game has 10 levels of difficulty.

Difficulty Scaling:
Levels 1-2 (Easiest): Global giants (Real Madrid, Barcelona, Man Utd, Bayern, etc.)
Levels 3-4 (Easy-Mid): Top-tier Big 5 clubs (Arsenal, Dortmund, Roma, etc.)
Levels 5-6 (Middle): Major non-Big 5 or mid-table Big 5 (Benfica, Ajax, Everton, etc.)
Levels 7-8 (Hard): Lower-table Big 5 or top-tier smaller leagues (Getafe, Celtic, etc.)
Levels 9-10 (Hardest): Lower divisions or obscure clubs (Hull City, Luton Town, etc.)

Constraints:
- Provide two teams.
- Ensure there is at least one well-documented player who played for both.
- Do not repeat teams if possible (context provided in prompt).
`;

export const generateChallenge = async (level: number, avoidTeams: string[]): Promise<Challenge> => {
  const modelId = "gemini-3-flash-preview";
  
  const prompt = `
    Generate a football challenge for Level ${level}.
    Previously used or currently active teams to avoid repetition if possible: ${avoidTeams.join(', ')}.
    Return a JSON object with 'teamA' and 'teamB'.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      teamA: { type: Type.STRING, description: "Name of the first football club" },
      teamB: { type: Type.STRING, description: "Name of the second football club" },
    },
    required: ["teamA", "teamB"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Slight randomness for variety
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as Challenge;
  } catch (error) {
    console.error("Error generating challenge:", error);
    // Fallback for demo purposes if API fails or quotas hit
    return { teamA: "Real Madrid", teamB: "Manchester United" };
  }
};

export const validateAnswer = async (
  teamA: string, 
  teamB: string, 
  playerName: string
): Promise<ValidationResult> => {
  const modelId = "gemini-3-flash-preview";

  const prompt = `
    Team A: ${teamA}
    Team B: ${teamB}
    User Answer: ${playerName}

    Did the player '${playerName}' play for both ${teamA} and ${teamB} at a senior professional level?
    If yes, return isCorrect: true and a short message confirming years played.
    If no, return isCorrect: false and a message explaining why (e.g., played for Team A but not B) and provide an 'alternativeAnswer' (a player who DID play for both).
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isCorrect: { type: Type.BOOLEAN },
      message: { type: Type.STRING, description: "Feedback message to the user" },
      alternativeAnswer: { type: Type.STRING, description: "A correct player name if the user was wrong", nullable: true },
    },
    required: ["isCorrect", "message"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "You are a football statistician verifying career paths. Be strict but fair about spelling.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    return JSON.parse(jsonText) as ValidationResult;
  } catch (error) {
    console.error("Error validating answer:", error);
    return { 
      isCorrect: false, 
      message: "There was an error verifying your answer. Please try again.",
      alternativeAnswer: "Error"
    };
  }
};
