import { validateStationAndLocation, isUserNearAnyStation } from "./utils";
import { parseCoordinates, validateFile, fileToDataUrl } from "./form-data";
import { analyzeImageWithGemini } from "./gemini";
import type { ApiResponse } from "./types";
import { CONFIG } from "./config";

// POST endpoint for station recognition
export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userCoords = parseCoordinates(formData);

    if (!userCoords) {
      return Response.json(
        { success: false, error: "Invalid or missing coordinates" } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return Response.json(
        { success: false, error: fileValidation.error } satisfies ApiResponse,
        { status: 400 }
      );
    }

    if (!file) {
        return Response.json(
            { success: false, error: "No file provided" } satisfies ApiResponse,
            { status: 400 }
        );
    }

    const nearStationCheck = isUserNearAnyStation(userCoords);
    if (!nearStationCheck.isNearStation) {
      const nearestInfo = nearStationCheck.nearestStation && nearStationCheck.nearestDistance
        ? ` The nearest station is ${nearStationCheck.nearestStation} at ${nearStationCheck.nearestDistance}m away.`
        : '';
      
      return Response.json(
        { 
          success: false, 
          error: `You must be within ${CONFIG.MAX_DISTANCE_METERS}m of a metro station to capture a photo.${nearestInfo}` 
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    const { image, type } = await fileToDataUrl(file);
    const aiResult = await analyzeImageWithGemini(image, type);

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
      ? (error.message.includes('API') || error.message.includes('service') ? 'External service error' : 'Internal server error')
      : 'Internal server error';
    
    return Response.json(
      { success: false, error: errorMessage } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
