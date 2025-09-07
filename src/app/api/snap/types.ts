export interface ApiResponse {
  success: boolean;
  data?: {
    is_official_metro_sign: boolean;
    station_name?: string;
    station_exists?: boolean;
    matched_station_name?: string;
  };
  error?: string;
}

export interface AiResult {
  is_official_metro_sign: boolean;
  station_name?: string;
  confidence?: number;
}
