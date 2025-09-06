/**
 * Configuration constants for the snap API
 */
export const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  GEMINI_MODEL: 'gemini-2.5-flash-lite',
  THINKING_BUDGET: 0,
  MAX_DISTANCE_METERS: 50,
  FUZZY_SEARCH_THRESHOLD: 0.6, // Lower is more strict
  MIN_CONFIDENCE_SCORE: 0.7,
} as const;
