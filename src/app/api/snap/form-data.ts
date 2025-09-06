import { CONFIG } from "./config";

/**
 * Validate and parse user coordinates from form data
 */
export function parseCoordinates(formData: FormData): { latitude: number; longitude: number } | null {
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
export function validateFile(file: File | null): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type as typeof CONFIG.ALLOWED_IMAGE_TYPES[number])) {
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
export async function fileToDataUrl(file: File | null): Promise<{ image: string, type: string }> {
  if (!file) throw new Error("File is null");
  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");
  return { image: base64Image, type: file.type };
}
