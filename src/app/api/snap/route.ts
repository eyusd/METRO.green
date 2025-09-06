import { GoogleGenAI, Type } from "@google/genai";
import { validateStationAndLocation } from "./utils";

// Configuration constants
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  GEMINI_MODEL: 'gemini-2.5-flash-lite',
  THINKING_BUDGET: 0,
} as const;

// Response types
interface ApiResponse {
  success: boolean;
  data?: {
    is_official_metro_sign: boolean;
    station_name?: string;
    validation?: {
      isValid: boolean;
      matchedStation?: string;
      confidence: number;
      distanceFromStation?: number;
      error?: string;
    };
  };
  error?: string;
}

/**
 * Validate and parse user coordinates from form data
 */
function parseCoordinates(formData: FormData): { latitude: number; longitude: number } | null {
  const latStr = formData.get("latitude") as string | null;
  const lonStr = formData.get("longitude") as string | null;

  if (!latStr || !lonStr) {
    return null;
  }

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lonStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  // Basic coordinate validation for Paris area
  if (
    latitude < 48.0 || latitude > 49.5 ||
    longitude < 1.5 || longitude > 3.5
  ) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * Validate uploaded file
 */
function validateFile(file: File | null): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}` 
    };
  }

  if (file.size > CONFIG.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds limit of ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { valid: true };
}

/**
 * Convert file to base64 data URL
 */
async function fileToDataUrl(file: File | null): Promise<{ image: string, type: string }> {
  if (!file) throw new Error("File is null");
  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");
  return { image: base64Image, type: file.type }; // Return just the base64 data, not the full data URL
}

// POST endpoint for station recognition
export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userCoords = parseCoordinates(formData);

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return Response.json(
        { success: false, error: fileValidation.error } satisfies ApiResponse,
        { status: 400 }
      );
    }

    const { image, type } = await fileToDataUrl(file);

    // Initialize Gemini AI
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return Response.json(
        { success: false, error: "AI service configuration error" } satisfies ApiResponse,
        { status: 500 }
      );
    }

    const config = {
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
- Only identify OFFICIAL Paris metro station signs (blue with white text, or white with blue text)
- The station name must be clearly visible and readable
- Do not guess or make assumptions about unclear text
- If the image is blurry, unclear, or shows non-official signage, mark as not official
- Pay attention to the distinctive Paris metro typography and design
- Consider regional trains (RER) and metro lines as valid Paris transit
- Provide a confidence score based on image clarity and sign authenticity

Station name should be the EXACT text as shown on the sign, including any special characters or formatting.`,
        },
      ],
    };

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Analyze this image to determine if it shows an official Paris metro station name sign. If it does, extract the exact station name. Respond in JSON format with the required fields.`,
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

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: CONFIG.GEMINI_MODEL,
      config,
      contents,
    });

    if (!response.text) {
      console.error("Empty response from Gemini API");
      return Response.json(
        { success: false, error: "No response from AI service" } satisfies ApiResponse,
        { status: 500 }
      );
    }

    // Parse AI response
    let aiResult;
    try {
      aiResult = JSON.parse(response.text);
    } catch (e) {
      console.error("Error parsing AI response as JSON:", e, "Response:", response.text);
      return Response.json(
        { success: false, error: "Invalid response from AI service" } satisfies ApiResponse,
        { status: 500 }
      );
    }

    // Validate AI response structure
    if (
      typeof aiResult !== "object" ||
      typeof aiResult.is_official_metro_sign !== "boolean" ||
      (aiResult.is_official_metro_sign && typeof aiResult.station_name !== "string")
    ) {
      console.error("Invalid AI response structure:", aiResult);
      return Response.json(
        { success: false, error: "Invalid response structure from AI service" } satisfies ApiResponse,
        { status: 500 }
      );
    }

    // Prepare response data
    const responseData: ApiResponse['data'] = {
      is_official_metro_sign: aiResult.is_official_metro_sign,
    };

    // If a station was identified, validate it
    if (aiResult.is_official_metro_sign && aiResult.station_name) {
      responseData.station_name = aiResult.station_name;
      
      // Validate station name and location
      const validation = validateStationAndLocation(
        aiResult.station_name,
        userCoords || undefined
      );
      
      responseData.validation = validation;

      // Log validation results for monitoring
      console.log("Station validation:", {
        aiStation: aiResult.station_name,
        userCoords: userCoords,
        validation: validation,
      });
    }

    return Response.json(
      { success: true, data: responseData } satisfies ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    
    // Don't expose internal error details to client
    const errorMessage = error instanceof Error 
      ? (error.message.includes('API') ? 'External service error' : 'Internal server error')
      : 'Internal server error';
    
    return Response.json(
      { success: false, error: errorMessage } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
