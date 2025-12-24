/**
 * useVenueGeoJSON Hook
 *
 * Transforms venue seed data into GeoJSON FeatureCollection
 * with Gravity Well radius and glow color calculations.
 */

import { useMemo } from 'react';
import { WATER_STREET_VENUES, WATER_STREET_HUB } from '../../db/seed/waterStreetTampa';
import { calculateEffectiveRadius, getGlowColor } from '../../algorithms/gravityWell';
import { checkOpenDoor } from '../../algorithms/openDoorFilter';
import type { StateConfidence } from '../../types';
import type { VenueFeatureCollection, VenueFeature } from './types';
import { GLOW_STYLE } from './mapStyles';

// Extract filter rules with proper typing (seed uses `as const` which makes it readonly)
const OPEN_DOOR_RULES = {
  maxWaitMinutes: WATER_STREET_HUB.filterRules.openDoor.maxWaitMinutes,
  maxFriction: WATER_STREET_HUB.filterRules.openDoor.maxFriction,
  allowedConfidence: [...WATER_STREET_HUB.filterRules.openDoor.allowedConfidence] as StateConfidence[],
};

/**
 * Mock friction data with 4-factor breakdown for POC
 * In production, these would come from real-time friction calculation
 *
 * Formula: F = (Uber*0.15) + (Traffic*0.25) + (Foot*0.4) + (Garage*0.2)
 */
interface MockFrictionData {
  score: number;
  rawFactors: {
    uber: number;
    traffic: number;
    foot: number;
    garage: number;
  };
  isDegraded: boolean;
}

const MOCK_FRICTION_DATA: Record<string, MockFrictionData> = {
  'the-edition': {
    score: 65,
    rawFactors: { uber: 60, traffic: 70, foot: 65, garage: 60 },
    isDegraded: false,
  },
  'boulon': {
    score: 45,
    rawFactors: { uber: 40, traffic: 50, foot: 45, garage: 40 },
    isDegraded: false,
  },
  'the-pearl': {
    score: 35,
    rawFactors: { uber: 30, traffic: 40, foot: 35, garage: 30 },
    isDegraded: false,
  },
  'alter-ego': {
    score: 70,
    rawFactors: { uber: 70, traffic: 75, foot: 70, garage: 65 },
    isDegraded: false,
  },
  'predalina': {
    score: 25,
    rawFactors: { uber: 20, traffic: 30, foot: 25, garage: 20 },
    isDegraded: false,
  },
};

/**
 * Transform venues to GeoJSON for Mapbox rendering
 *
 * @param isOpenDoorMode Whether Open Door filter is active
 * @returns GeoJSON FeatureCollection with venue features
 */
export function useVenueGeoJSON(isOpenDoorMode: boolean): VenueFeatureCollection {
  return useMemo(() => {
    const features: VenueFeature[] = WATER_STREET_VENUES.map((venue) => {
      // Calculate Gravity Well radius
      const gravityResult = calculateEffectiveRadius(venue.adBoost, venue.isAnchor);

      // Get friction data with factor breakdown
      const frictionData = MOCK_FRICTION_DATA[venue.venueId] ?? {
        score: 50,
        rawFactors: { uber: 50, traffic: 50, foot: 50, garage: 50 },
        isDegraded: false,
      };
      const glowColor = getGlowColor(frictionData.score);

      // Check Open Door eligibility
      const openDoorResult = checkOpenDoor(
        {
          waitTime: venue.initialState.waitMinutes,
          frictionScore: frictionData.score,
          isPrivateEvent: venue.initialState.isPrivateEvent,
          stateConfidence: 'live', // POC assumes live data
        },
        OPEN_DOOR_RULES
      );
      const passesOpenDoor = openDoorResult.isOpen;

      // Calculate opacity based on filter state
      const opacity = isOpenDoorMode && !passesOpenDoor
        ? GLOW_STYLE.GHOST_OPACITY
        : 1.0;

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          // IMPORTANT: Mapbox uses [lng, lat], seed uses { lat, lng }
          coordinates: [venue.coordinates.lng, venue.coordinates.lat],
        },
        properties: {
          venueId: venue.venueId,
          name: venue.name,
          effectiveRadius: gravityResult.effectiveRadius,
          glowColor,
          stateId: venue.initialState.stateId,
          waitMinutes: venue.initialState.waitMinutes,
          isPrivateEvent: venue.initialState.isPrivateEvent,
          passesOpenDoor,
          opacity,
          isAnchor: venue.isAnchor,
          frictionScore: frictionData.score,
          rawFactors: frictionData.rawFactors,
          isDegraded: frictionData.isDegraded,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [isOpenDoorMode]);
}

/**
 * Get venue names that pass Open Door filter
 * Useful for debugging and UI indicators
 */
export function getOpenDoorVenues(): string[] {
  return WATER_STREET_VENUES
    .filter((venue) => {
      const frictionData = MOCK_FRICTION_DATA[venue.venueId] ?? {
        score: 50,
        rawFactors: { uber: 50, traffic: 50, foot: 50, garage: 50 },
        isDegraded: false,
      };
      const result = checkOpenDoor(
        {
          waitTime: venue.initialState.waitMinutes,
          frictionScore: frictionData.score,
          isPrivateEvent: venue.initialState.isPrivateEvent,
          stateConfidence: 'live',
        },
        OPEN_DOOR_RULES
      );
      return result.isOpen;
    })
    .map((venue) => venue.name);
}

/**
 * Get venue by ID with all calculated properties
 * Used by VenueDetailSheet to display venue information
 *
 * @param venueId The venue ID to fetch
 * @returns Venue feature with properties, or null if not found
 */
export function getVenueById(venueId: string): VenueFeature | null {
  const venue = WATER_STREET_VENUES.find((v) => v.venueId === venueId);

  if (!venue) {
    return null;
  }

  // Calculate Gravity Well radius
  const gravityResult = calculateEffectiveRadius(venue.adBoost, venue.isAnchor);

  // Get friction data with factor breakdown
  const frictionData = MOCK_FRICTION_DATA[venue.venueId] ?? {
    score: 50,
    rawFactors: { uber: 50, traffic: 50, foot: 50, garage: 50 },
    isDegraded: false,
  };
  const glowColor = getGlowColor(frictionData.score);

  // Check Open Door eligibility
  const openDoorResult = checkOpenDoor(
    {
      waitTime: venue.initialState.waitMinutes,
      frictionScore: frictionData.score,
      isPrivateEvent: venue.initialState.isPrivateEvent,
      stateConfidence: 'live',
    },
    OPEN_DOOR_RULES
  );
  const passesOpenDoor = openDoorResult.isOpen;

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [venue.coordinates.lng, venue.coordinates.lat],
    },
    properties: {
      venueId: venue.venueId,
      name: venue.name,
      effectiveRadius: gravityResult.effectiveRadius,
      glowColor,
      stateId: venue.initialState.stateId,
      waitMinutes: venue.initialState.waitMinutes,
      isPrivateEvent: venue.initialState.isPrivateEvent,
      passesOpenDoor,
      opacity: 1.0,
      isAnchor: venue.isAnchor,
      frictionScore: frictionData.score,
      rawFactors: frictionData.rawFactors,
      isDegraded: frictionData.isDegraded,
      coordinates: venue.coordinates,
    },
  };
}
