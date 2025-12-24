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
 * Mock friction scores for POC
 * In production, these would come from the Friction Score algorithm
 */
const MOCK_FRICTION_SCORES: Record<string, number> = {
  'the-edition': 65, // Busy anchor venue
  'boulon': 45, // Moderate
  'the-pearl': 35, // Relaxed
  'alter-ego': 70, // Party spot
  'predalina': 25, // Open Door candidate - low friction
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

      // Get friction-based glow color
      const frictionScore = MOCK_FRICTION_SCORES[venue.venueId] ?? 50;
      const glowColor = getGlowColor(frictionScore);

      // Check Open Door eligibility
      const openDoorResult = checkOpenDoor(
        {
          waitTime: venue.initialState.waitMinutes,
          frictionScore,
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
      const frictionScore = MOCK_FRICTION_SCORES[venue.venueId] ?? 50;
      const result = checkOpenDoor(
        {
          waitTime: venue.initialState.waitMinutes,
          frictionScore,
          isPrivateEvent: venue.initialState.isPrivateEvent,
          stateConfidence: 'live',
        },
        OPEN_DOOR_RULES
      );
      return result.isOpen;
    })
    .map((venue) => venue.name);
}
