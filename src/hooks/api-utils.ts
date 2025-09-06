/**
 * API processing utilities for station detection and validation
 */

import { stations } from "@/lib/stations";
import type { NotificationData, CelebrationData } from "@/components/main-content";

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface StationLine {
  lineName: string;
  lineColor: string;
  rescom: string;
}

export interface ProcessCaptureCallbacks {
  showNotification: (data: NotificationData) => void;
  showCelebration: (data: CelebrationData) => void;
  addStation: (stationName: string) => void;
  hasVisitedStation: (stationName: string) => boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SnapApiResponse {
  success: boolean;
  error?: string;
  data?: {
    is_official_metro_sign: boolean;
    station_name?: string;
    validation?: {
      isValid: boolean;
      matchedStation?: string;
      confidence?: number;
      distanceFromStation?: number;
      error?: string;
    };
  };
}

/**
 * Prepare form data for API submission
 */
export function createApiFormData(blob: Blob, locationData?: LocationData | null): FormData {
  const formData = new FormData();
  formData.append("file", blob, "station-capture.jpg");

  if (locationData) {
    formData.append("latitude", locationData.latitude.toString());
    formData.append("longitude", locationData.longitude.toString());
  }

  return formData;
}

/**
 * Send image to snap API for processing
 */
export async function submitCaptureToApi(formData: FormData): Promise<SnapApiResponse> {
  const response = await fetch("/api/snap", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "API request failed");
  }

  return result;
}

/**
 * Extract station line information from stations data
 */
export function getStationLines(stationName: string): StationLine[] {
  // Find ALL station features with this name (multiple lines)
  const stationFeatures = stations.features.filter(
    (feature) => feature.properties?.nom_gares === stationName
  );

  // Create lines array from all matching features
  return stationFeatures
    .map((feature) => {
      const rescom = feature.properties?.res_com || "";
      const lineColor = feature.properties?.colourweb_hexa || "666666";
      const lineName = rescom.split(" ").slice(1).join(" ");
      return {
        lineName,
        lineColor,
        rescom,
      };
    })
    .filter((line) => line.lineName); // Remove any invalid lines
}

/**
 * Handle successful station validation
 */
export function handleValidStationCapture(
  stationName: string,
  validation: NonNullable<SnapApiResponse['data']>['validation'],
  callbacks: ProcessCaptureCallbacks
): boolean {
  const { addStation, hasVisitedStation, showCelebration, showNotification } = callbacks;
  
  const wasAlreadyVisited = hasVisitedStation(stationName);
  const lines = getStationLines(stationName);

  if (!wasAlreadyVisited) {
    addStation(stationName);

    // Show celebration for new station
    showCelebration({
      stationName,
      lines,
      confidence: validation?.confidence ? validation.confidence * 100 : undefined,
      distanceFromStation: validation?.distanceFromStation,
      isNewStation: true,
    });

    return true; // Station was added
  } else {
    // Show notification for already visited station
    showNotification({
      type: "info",
      title: "Station Already Collected",
      message: `You've already visited ${stationName}!`,
      details: {
        stationName,
        confidence: validation?.confidence ? validation.confidence * 100 : undefined,
        distanceFromStation: validation?.distanceFromStation,
        tip: "Find new stations to expand your collection",
      },
    });

    return false; // Station was not added
  }
}

/**
 * Handle validation failure
 */
export function handleValidationFailure(
  validation: NonNullable<SnapApiResponse['data']>['validation'],
  callbacks: ProcessCaptureCallbacks
): void {
  const { showNotification } = callbacks;

  showNotification({
    type: "warning",
    title: "Station Validation Failed",
    message: validation?.matchedStation
      ? `Station "${validation.matchedStation}" didn't meet validation criteria`
      : "Could not validate this as a metro station",
    details: {
      stationName: validation?.matchedStation,
      confidence: validation?.confidence ? validation.confidence * 100 : undefined,
      distanceFromStation: validation?.distanceFromStation,
      reason: validation?.error || "Validation criteria not met",
      tip: "Try getting closer to the station or ensuring the sign is clearly visible",
    },
  });
}

/**
 * Handle metro sign detected but no validation
 */
export function handleMetroSignNoValidation(
  stationName: string | undefined,
  callbacks: ProcessCaptureCallbacks
): void {
  const { showNotification } = callbacks;

  showNotification({
    type: "warning",
    title: "Metro Sign Detected",
    message: "Official metro sign found but could not validate station",
    details: {
      stationName: stationName || "Unknown",
      reason: "Station validation service unavailable",
      tip: "Try again in a moment or check your internet connection",
    },
  });
}

/**
 * Handle non-metro sign detection
 */
export function handleNonMetroSign(callbacks: ProcessCaptureCallbacks): void {
  const { showNotification } = callbacks;

  showNotification({
    type: "info",
    title: "Not a Metro Station Sign",
    message: "The image doesn't appear to show an official RATP metro station sign.",
    details: {
      reason: "No metro station signage detected in image",
      tip: "Look for official blue RATP metro signs with station names clearly visible",
    },
  });
}

/**
 * Process the API response and handle all possible scenarios
 */
export function processApiResponse(
  result: SnapApiResponse,
  callbacks: ProcessCaptureCallbacks
): boolean {
  if (!result.success) {
    throw new Error(result.error || "Unknown API error");
  }

  const { data } = result;
  let stationAdded = false;

  if (data?.is_official_metro_sign) {
    if (data.validation) {
      const { validation } = data;

      // Add station to game if validation criteria are met
      if (validation.isValid && validation.matchedStation) {
        stationAdded = handleValidStationCapture(validation.matchedStation, validation, callbacks);
      } else {
        // Validation failed
        handleValidationFailure(validation, callbacks);
      }
    } else {
      // No validation data
      handleMetroSignNoValidation(data.station_name, callbacks);
    }
  } else {
    // Not a metro sign
    handleNonMetroSign(callbacks);
  }
  return stationAdded;
}

/**
 * Complete capture processing pipeline
 */
export async function processCaptureWithApi(
  blob: Blob,
  locationData: LocationData | null,
  callbacks: ProcessCaptureCallbacks
): Promise<boolean> {
  // Prepare and submit to API
  const formData = createApiFormData(blob, locationData);
  const result = await submitCaptureToApi(formData);

  // Process the response
  const stationAdded = processApiResponse(result, callbacks);

  // Close dialog if station was successfully added
  if (stationAdded) {
    callbacks.onOpenChange(false);
  }

  return stationAdded;
}
