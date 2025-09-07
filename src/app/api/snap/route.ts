import { findBestStationMatch } from "./utils";
import { validateFile, fileToDataUrl } from "./form-data";
import { analyzeImageWithGemini } from "./gemini";
import type { ApiResponse } from "./types";
import { withRateLimit } from "@/lib/rate-limit";

// POST endpoint for station recognition
export async function POST(request: Request): Promise<Response> {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
        return Response.json(
            { success: false, error: "No file provided" } satisfies ApiResponse,
            { status: 400 }
        );
    }

    // Validate the uploaded file
    const fileValidation = await validateFile(file);
    if (!fileValidation.valid) {
      return Response.json(
        { success: false, error: fileValidation.error } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Convert file to data URL for AI analysis
    const { image, type } = await fileToDataUrl(file);
    const aiResult = await analyzeImageWithGemini(image, type);

    // Prepare response data
    const responseData: ApiResponse['data'] = {
      is_official_metro_sign: aiResult.is_official_metro_sign,
    };

    // If a station was identified, validate it exists in our station database
    if (aiResult.is_official_metro_sign && aiResult.station_name) {
      responseData.station_name = aiResult.station_name;
      
      // Cross-check if the station name exists in our database
      const stationMatch = findBestStationMatch(aiResult.station_name);
      responseData.station_exists = !!stationMatch;
      
      if (stationMatch) {
        responseData.matched_station_name = stationMatch.station;
      }
    }

    return Response.json(
      { success: true, data: responseData } satisfies ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    
    // Don't expose internal error details to client
    const errorMessage = error instanceof Error 
      ? (error.message.includes('API') || error.message.includes('service') ? 'External service error' : 'Internal server error')
      : 'Internal server error';
    
    return Response.json(
      { success: false, error: errorMessage } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
