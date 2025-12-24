/**
 * Map Component Types
 *
 * Types specific to Mapbox rendering and venue visualization.
 */

import type { Position } from 'geojson';

/**
 * GeoJSON Feature properties for a venue marker
 */
export interface VenueFeatureProperties {
  venueId: string;
  name: string;
  // Gravity Well calculations
  effectiveRadius: number; // meters
  glowColor: string; // hex color based on friction
  // State information
  stateId: 0 | 1 | 2 | 3;
  waitMinutes: number;
  isPrivateEvent: boolean;
  // Open Door filter
  passesOpenDoor: boolean;
  // Display properties
  opacity: number; // 1.0 for passing, 0.3 for failing Open Door
  isAnchor: boolean;
  // Additional properties for detail view
  frictionScore?: number; // 0-100 friction score
  rawFactors?: {
    uber: number;
    traffic: number;
    foot: number;
    garage: number;
  }; // Raw 0-100 factors for UI breakdown
  isDegraded?: boolean; // True if calculated without primary source (foot traffic)
  coordinates?: { lat: number; lng: number }; // Lat/lng coordinates (not Mapbox [lng, lat])
}

/**
 * GeoJSON Feature for a venue
 */
export interface VenueFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: Position; // [lng, lat] - Mapbox order
  };
  properties: VenueFeatureProperties;
}

/**
 * GeoJSON FeatureCollection for all venues
 */
export interface VenueFeatureCollection {
  type: 'FeatureCollection';
  features: VenueFeature[];
}

/**
 * Map camera state
 */
export interface MapCameraState {
  centerCoordinate: Position; // [lng, lat]
  zoomLevel: number;
  pitch: number;
  heading: number;
}

/**
 * Props for the HubMap component
 */
export interface HubMapProps {
  isOpenDoorMode: boolean;
  onVenuePress?: (venueId: string) => void;
}

/**
 * Props for the VenueGlowLayer component
 */
export interface VenueGlowLayerProps {
  venues: VenueFeatureCollection;
  isOpenDoorMode: boolean;
}

/**
 * Zoom level thresholds for map behavior
 */
export const ZOOM_LEVELS = {
  /** Minimum zoom to show venue markers */
  SHOW_MARKERS: 13,
  /** Zoom level for district overview */
  DISTRICT: 15,
  /** Zoom level for venue detail */
  VENUE_DETAIL: 17,
  /** Maximum zoom */
  MAX: 20,
} as const;
