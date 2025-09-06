/**
 * Utility functions for Paris Metro station validation and matching
 */

import Fuse from 'fuse.js';
import { stations } from '@/lib/stations';
import type { Feature, Point } from 'geojson';

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

// Configuration
const VALIDATION_CONFIG = {
  MAX_DISTANCE_METERS: 50,
  FUZZY_SEARCH_THRESHOLD: 0.6, // Lower is more strict
  MIN_CONFIDENCE_SCORE: 0.7,
} as const;

// Earth's radius in meters for distance calculations
const EARTH_RADIUS_METERS = 6371000;

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
 * Create and configure Fuse.js instance for fuzzy station name matching
 */
function createFuseInstance(): Fuse<StationFeature> {
  const stationFeatures = getStationFeatures();
  
  return new Fuse(stationFeatures, {
    includeScore: true,
    threshold: VALIDATION_CONFIG.FUZZY_SEARCH_THRESHOLD,
    ignoreLocation: true,
    keys: ['properties.nom_gares'],
    findAllMatches: false,
    minMatchCharLength: 2,
  });
}

// Singleton Fuse instance for better performance
let fuseInstance: Fuse<StationFeature> | null = null;

/**
 * Get or create the Fuse instance (lazy initialization)
 */
function getFuseInstance(): Fuse<StationFeature> {
  if (!fuseInstance) {
    fuseInstance = createFuseInstance();
  }
  return fuseInstance;
}

/**
 * Find the best matching station name using fuzzy search
 */
export function findBestStationMatch(searchTerm: string): StationMatch | null {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }

  const fuse = getFuseInstance();
  const results = fuse.search(searchTerm.trim());

  if (results.length === 0) {
    return null;
  }

  const bestMatch = results[0];
  const stationFeature = bestMatch.item;
  const score = 1 - (bestMatch.score || 0); // Convert to confidence score (higher is better)

  return {
    station: stationFeature.properties.nom_gares,
    score,
    coordinates: stationFeature.geometry.coordinates as [number, number],
    properties: stationFeature.properties,
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
    isWithin: distance <= VALIDATION_CONFIG.MAX_DISTANCE_METERS,
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

    // Find best matching station
    const match = findBestStationMatch(stationName);
    
    if (!match) {
      return {
        isValid: false,
        confidence: 0,
        error: 'No matching station found',
      };
    }

    // Check confidence threshold
    if (match.score < VALIDATION_CONFIG.MIN_CONFIDENCE_SCORE) {
      return {
        isValid: false,
        confidence: match.score,
        error: `Station match confidence too low (${(match.score * 100).toFixed(1)}%)`,
      };
    }

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
        : `User location is ${Math.round(distance)}m from station (max: ${VALIDATION_CONFIG.MAX_DISTANCE_METERS}m)`,
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