/**
 * Map Styles Configuration
 *
 * Midnight theme and Water Street Tampa camera settings.
 * Per CLAUDE.md: Custom "Midnight" Style for nightlife aesthetic.
 */

import type { Position } from 'geojson';
import type { MapCameraState } from './types';

/**
 * Mapbox style URLs
 * Using dark style as base for "Midnight" theme
 */
export const MAP_STYLES = {
  /** Dark style - base for nightlife aesthetic */
  MIDNIGHT: 'mapbox://styles/mapbox/dark-v11',
  /** Navigation style for when routing is active */
  NAVIGATION: 'mapbox://styles/mapbox/navigation-night-v1',
  /** Satellite for venue verification */
  SATELLITE: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

/**
 * Water Street Tampa - Center of the bar cluster
 * Based on seed data venue coordinates
 */
export const WATER_STREET_CENTER: Position = [
  -82.4485, // lng - Edition hotel area
  27.9415,  // lat
];

/**
 * Default camera state for Water Street Tampa
 */
export const WATER_STREET_CAMERA: MapCameraState = {
  centerCoordinate: WATER_STREET_CENTER,
  zoomLevel: 16, // Good for seeing all 5 venues
  pitch: 45, // Tilted for 3D building effect
  heading: 0, // North up
};

/**
 * Glow layer styling constants
 * Per CLAUDE.md: Use light and color to communicate "Vibe"
 */
export const GLOW_STYLE = {
  /** Number of overlapping circles for glow effect */
  LAYER_COUNT: 3,

  /** Outer glow layer (most diffuse) */
  OUTER: {
    blur: 1.0,
    opacity: 0.25,
    radiusMultiplier: 1.0, // Full radius
  },

  /** Middle glow layer */
  MID: {
    blur: 0.6,
    opacity: 0.4,
    radiusMultiplier: 0.7,
  },

  /** Core marker (solid center) */
  CORE: {
    blur: 0,
    opacity: 0.9,
    radiusMultiplier: 0.15, // Small solid center
  },

  /** Opacity when venue fails Open Door filter */
  GHOST_OPACITY: 0.3,
} as const;

/**
 * Convert meters to pixels at a given zoom level
 * Mapbox CircleLayer uses pixels, but we calculate radius in meters
 *
 * Formula: pixelRadius = metersRadius / metersPerPixel
 * metersPerPixel = 156543.03 * cos(lat) / (2 ^ zoom)
 */
export function metersToPixels(
  meters: number,
  latitude: number,
  zoomLevel: number
): number {
  const metersPerPixel =
    (156543.03 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoomLevel);
  return meters / metersPerPixel;
}

/**
 * Create zoom-based interpolation expression for circle radius
 * This ensures the glow radius appears consistent in meters across zoom levels
 */
export function createRadiusExpression(
  radiusMeters: number,
  latitude: number = 27.9415 // Water Street latitude
): (string | number | (string | number)[])[] {
  // Pre-calculate pixels at key zoom levels
  const zoomStops = [
    [13, metersToPixels(radiusMeters, latitude, 13)],
    [15, metersToPixels(radiusMeters, latitude, 15)],
    [17, metersToPixels(radiusMeters, latitude, 17)],
    [19, metersToPixels(radiusMeters, latitude, 19)],
  ];

  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    ...zoomStops.flat(),
  ];
}

/**
 * Animation timing for state transitions
 */
export const ANIMATION = {
  /** Duration for glow color transitions */
  COLOR_TRANSITION_MS: 500,
  /** Duration for opacity transitions (Open Door toggle) */
  OPACITY_TRANSITION_MS: 300,
} as const;
