import { GoogleGenAI, Type } from "@google/genai";
import { CONFIG } from "./config";
import type { AiResult } from "./types";

const geminiConfig = {
  thinkingConfig: {
    thinkingBudget: CONFIG.THINKING_BUDGET,
  },
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    required: ["is_official_metro_sign"],
    properties: {
      station_name: {
        type: Type.STRING,
        description: "The exact name of the Paris metro station as it appears on the sign",
      },
      is_official_metro_sign: {
        type: Type.BOOLEAN,
        description: "Whether this is an official Paris metro station name sign",
      },
      confidence: {
        type: Type.NUMBER,
        description: "Confidence level from 0 to 1 in the identification",
      },
    },
  },
  systemInstruction: [
    {
      text: `You are an expert on the Paris metro system with extensive knowledge of all station names and official signage.

Your task is to analyze images and determine:
1. Whether the image shows an official Paris metro station name sign
2. If so, extract the exact station name as it appears

IMPORTANT GUIDELINES:
- Only identify OFFICIAL Paris metro, tram and RER station signs (blue with white text, or white with blue text)
- The station name must be clearly visible and readable
- Do not guess or make assumptions about unclear text
- If the image is blurry, unclear, or shows non-official signage, mark as not official
- Pay attention to the distinctive Paris metro typography and design
- Consider regional trains (RER), tramways, and metro lines as valid Paris transit
- Provide a confidence score based on image clarity and sign authenticity

Station name should be the EXACT text as shown on the sign, including any special characters or formatting.`,
    },
  ],
};

function getContents(image: string, type: string) {
    return [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this image to determine if it shows an official Paris public transport station name sign. If it does, extract the exact station name. Respond in JSON format with the required fields.`,
            },
            {
              inlineData: {
                mimeType: type,
                data: image,
              },
            },
          ],
        },
      ];
}

export async function analyzeImageWithGemini(image: string, type: string): Promise<AiResult> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is not set");
    throw new Error("AI service configuration error");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const contents = getContents(image, type);

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL,
    config: geminiConfig,
    contents,
  });

  if (!response.text) {
    console.error("Empty response from Gemini API");
    throw new Error("No response from AI service");
  }

  try {
    const aiResult = JSON.parse(response.text);
    
    // Validate AI response structure
    if (
      typeof aiResult !== "object" ||
      typeof aiResult.is_official_metro_sign !== "boolean" ||
      (aiResult.is_official_metro_sign && typeof aiResult.station_name !== "string")
    ) {
      console.error("Invalid AI response structure:", aiResult);
      throw new Error("Invalid response structure from AI service");
    }

    return aiResult;
  } catch (e) {
    console.error("Error parsing AI response as JSON:", e, "Response:", response.text);
    throw new Error("Invalid response from AI service");
  }
}
