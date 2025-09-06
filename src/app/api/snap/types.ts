import type { ValidationResult } from "./utils";

export interface ApiResponse {
  success: boolean;
  data?: {
    is_official_metro_sign: boolean;
    station_name?: string;
    validation?: ValidationResult;
  };
  error?: string;
}

export interface AiResult {
  is_official_metro_sign: boolean;
  station_name?: string;
  confidence?: number;
}
