/**
 * Utility functions for Paris Metro station validation and matching
 */

import { stations } from '@/lib/stations';
import type { Feature, Point } from 'geojson';
import { CONFIG } from './config';

// Types
export interface StationProperties {
  nom_gares: string;
  id_gares: number;
  indice_lig: string;
  res_com: string;
  colourweb_hexa: string;
}

export type StationFeature = Feature<Point, StationProperties>;

export interface StationMatch {
  station: string;
  score: number;
  coordinates: [number, number];
  properties: StationProperties;
}

export interface ValidationResult {
  isValid: boolean;
  matchedStation?: string;
  confidence: number;
  distanceFromStation?: number;
  error?: string;
}


// Earth's radius in meters for distance calculations
const EARTH_RADIUS_METERS = 6371000;

/**
 * Normalize a station name to ASCII, keeping only letters and numbers
 */
function normalizeStationName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // Convert to lowercase and normalize to ASCII
  const normalized = name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
  
  return normalized;
}

/**
 * Get station features from the GeoJSON
 */
function getStationFeatures(): StationFeature[] {
  return stations.features as StationFeature[];
}

/**
 * Calculate the distance between two points using the Haversine formula
 */
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const lat1Rad = (point1.latitude * Math.PI) / 180;
  const lat2Rad = (point2.latitude * Math.PI) / 180;
  const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Find exact matching station name using normalized ASCII comparison
 */
export function findBestStationMatch(searchTerm: string): StationMatch | null {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }

  const normalizedSearchTerm = normalizeStationName(searchTerm);
  if (!normalizedSearchTerm) {
    return null;
  }

  const stationFeatures = getStationFeatures();
  
  for (const stationFeature of stationFeatures) {
    const normalizedStationName = normalizeStationName(stationFeature.properties.nom_gares);
    
    if (normalizedStationName === normalizedSearchTerm) {
      return {
        station: stationFeature.properties.nom_gares,
        score: 1.0, // Perfect match
        coordinates: stationFeature.geometry.coordinates as [number, number],
        properties: stationFeature.properties,
      };
    }
  }

  return null;
}

/**
 * Check if user coordinates are within acceptable distance of any station
 */
export function isUserNearAnyStation(
  userCoords: { latitude: number; longitude: number }
): { isNearStation: boolean; nearestDistance?: number; nearestStation?: string } {
  if (
    typeof userCoords.latitude !== 'number' ||
    typeof userCoords.longitude !== 'number' ||
    isNaN(userCoords.latitude) ||
    isNaN(userCoords.longitude)
  ) {
    return { isNearStation: false };
  }

  const stationFeatures = getStationFeatures();
  let nearestDistance = Infinity;
  let nearestStation: string | undefined;

  for (const station of stationFeatures) {
    const [longitude, latitude] = station.geometry.coordinates;
    const stationPoint = { latitude, longitude };
    const distance = calculateDistance(userCoords, stationPoint);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestStation = station.properties.nom_gares;
    }

    // Early exit if we find a station within acceptable range
    if (distance <= CONFIG.MAX_DISTANCE_METERS) {
      return {
        isNearStation: true,
        nearestDistance: Math.round(distance),
        nearestStation: station.properties.nom_gares,
      };
    }
  }

  return {
    isNearStation: false,
    nearestDistance: Math.round(nearestDistance),
    nearestStation,
  };
}

/**
 * Check if user coordinates are within acceptable distance of station location
 */
export function isWithinStationRadius(
  userCoords: { latitude: number; longitude: number },
  stationCoords: [number, number]
): { isWithin: boolean; distance: number } {
  const [longitude, latitude] = stationCoords;
  const stationPoint = { latitude, longitude };
  const distance = calculateDistance(userCoords, stationPoint);

  return {
    isWithin: distance <= CONFIG.MAX_DISTANCE_METERS,
    distance,
  };
}

/**
 * Validate if a station name exists and if user is within acceptable distance
 */
export function validateStationAndLocation(
  stationName: string,
  userCoords?: { latitude: number; longitude: number }
): ValidationResult {
  try {
    // Input validation
    if (!stationName || typeof stationName !== 'string') {
      return {
        isValid: false,
        confidence: 0,
        error: 'Invalid station name provided',
      };
    }

    // Find exact matching station
    const match = findBestStationMatch(stationName);
    
    if (!match) {
      return {
        isValid: false,
        confidence: 0,
        error: 'No matching station found',
      };
    }

    // Since we use exact matching now, confidence is always 1.0 for matches
    // No need to check confidence threshold

    // If no user coordinates provided, return match result only
    if (!userCoords) {
      return {
        isValid: true,
        matchedStation: match.station,
        confidence: match.score,
      };
    }

    // Validate user coordinates
    if (
      typeof userCoords.latitude !== 'number' ||
      typeof userCoords.longitude !== 'number' ||
      isNaN(userCoords.latitude) ||
      isNaN(userCoords.longitude)
    ) {
      return {
        isValid: false,
        confidence: match.score,
        error: 'Invalid user coordinates provided',
      };
    }

    // Check if user is within station radius
    const { isWithin, distance } = isWithinStationRadius(
      userCoords,
      match.coordinates
    );

    return {
      isValid: isWithin,
      matchedStation: match.station,
      confidence: match.score,
      distanceFromStation: Math.round(distance),
      error: isWithin
        ? undefined
        : `User location is ${Math.round(distance)}m from station (max: ${CONFIG.MAX_DISTANCE_METERS}m)`,
    };
  } catch (error) {
    console.error('Error in validateStationAndLocation:', error);
    return {
      isValid: false,
      confidence: 0,
      error: 'Internal validation error',
    };
  }
}

/**
 * Get all station names (for autocomplete, etc.)
 */
export function getAllStationNames(): string[] {
  const stationFeatures = getStationFeatures();
  return stationFeatures
    .map(feature => feature.properties.nom_gares)
    .sort();
}

/**
 * Get coordinates for a specific station
 */
export function getStationCoordinates(stationName: string): [number, number] | null {
  const normalizedName = stationName?.trim();
  if (!normalizedName) return null;
  
  const stationFeatures = getStationFeatures();
  const station = stationFeatures.find(
    feature => feature.properties.nom_gares === normalizedName
  );
  
  return station ? (station.geometry.coordinates as [number, number]) : null;
}

/**
 * Check if a station name exists exactly (case-sensitive)
 */
export function stationExists(stationName: string): boolean {
  const stationFeatures = getStationFeatures();
  return stationFeatures.some(
    feature => feature.properties.nom_gares === stationName
  );
}

/**
 * Get station properties by name
 */
export function getStationProperties(stationName: string): StationProperties | null {
  const stationFeatures = getStationFeatures();
  const station = stationFeatures.find(
    feature => feature.properties.nom_gares === stationName
  );
  
  return station ? station.properties : null;
}