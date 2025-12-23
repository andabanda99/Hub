/**
 * Water Street Tampa Seed Data
 *
 * Real coordinates for POC testing at Water Street Tampa district.
 * These venues are used for the "Stadium Test" POC scenario.
 *
 * Coordinates sourced from public map data (Google Maps, OpenStreetMap).
 */

import type { Coordinates } from '../../types';

// ============================================================================
// HUB DEFINITION
// ============================================================================

export const WATER_STREET_HUB = {
  hubId: 'water-street-tampa',
  metroId: 'tampa-bay',
  name: 'Water Street Tampa',
  manifestVersion: '2024.1.0',
  filterRulesVersion: '1.0.0',
  filterRules: {
    openDoor: {
      maxWaitMinutes: 15,
      maxFriction: 80,
      allowedConfidence: ['live', 'recent'] as const,
    },
  },
  // Polygon defining the Water Street district boundary
  // Roughly bounded by Channelside Dr, Meridian Ave, Kennedy Blvd, and the waterfront
  geofence: [
    { lat: 27.9425, lng: -82.4535 }, // NW corner
    { lat: 27.9425, lng: -82.4445 }, // NE corner
    { lat: 27.9375, lng: -82.4445 }, // SE corner
    { lat: 27.9375, lng: -82.4535 }, // SW corner
    { lat: 27.9425, lng: -82.4535 }, // Close polygon
  ] as Coordinates[],
  eventPhase: null,
};

// ============================================================================
// VENUE DATA
// ============================================================================

export interface VenueSeedData {
  venueId: string;
  hubId: string;
  name: string;
  coordinates: Coordinates;
  basePopularityScore: number;
  isAnchor: boolean;
  adBoost: number;
  capacity: number;
  // Mock initial state for POC
  initialState: {
    stateId: 0 | 1 | 2 | 3;
    waitMinutes: number;
    isPrivateEvent: boolean;
  };
}

export const WATER_STREET_VENUES: VenueSeedData[] = [
  {
    venueId: 'sparkman-wharf',
    hubId: 'water-street-tampa',
    name: 'Sparkman Wharf',
    coordinates: { lat: 27.9395, lng: -82.4515 },
    basePopularityScore: 85,
    isAnchor: true, // Major destination, gets +20% radius
    adBoost: 30,
    capacity: 500,
    initialState: {
      stateId: 2, // Social
      waitMinutes: 5,
      isPrivateEvent: false,
    },
  },
  {
    venueId: 'predalina',
    hubId: 'water-street-tampa',
    name: 'Predalina',
    coordinates: { lat: 27.9402, lng: -82.4488 },
    basePopularityScore: 78,
    isAnchor: true, // Major restaurant
    adBoost: 25,
    capacity: 150,
    initialState: {
      stateId: 2, // Social
      waitMinutes: 12,
      isPrivateEvent: false,
    },
  },
  {
    venueId: 'jw-marriott-rooftop',
    hubId: 'water-street-tampa',
    name: 'JW Marriott Rooftop Bar',
    coordinates: { lat: 27.9410, lng: -82.4478 },
    basePopularityScore: 72,
    isAnchor: false,
    adBoost: 20,
    capacity: 100,
    initialState: {
      stateId: 3, // Party
      waitMinutes: 20,
      isPrivateEvent: false,
    },
  },
  {
    venueId: 'american-social',
    hubId: 'water-street-tampa',
    name: 'American Social',
    coordinates: { lat: 27.9388, lng: -82.4505 },
    basePopularityScore: 70,
    isAnchor: false,
    adBoost: 15,
    capacity: 200,
    initialState: {
      stateId: 1, // Quiet
      waitMinutes: 0,
      isPrivateEvent: false,
    },
  },
  {
    venueId: 'the-sail',
    hubId: 'water-street-tampa',
    name: 'The Sail Pavilion',
    coordinates: { lat: 27.9380, lng: -82.4520 },
    basePopularityScore: 65,
    isAnchor: false,
    adBoost: 10,
    capacity: 300,
    initialState: {
      stateId: 2, // Social
      waitMinutes: 8,
      isPrivateEvent: false,
    },
  },
];

// ============================================================================
// ZONE DATA
// ============================================================================

export interface ZoneSeedData {
  zoneId: string;
  hubId: string;
  name: string;
  zoneType: 'walkable' | 'restricted' | 'parking' | 'quiet' | 'party';
  polygon: Coordinates[];
}

export const WATER_STREET_ZONES: ZoneSeedData[] = [
  {
    zoneId: 'main-promenade',
    hubId: 'water-street-tampa',
    name: 'Main Promenade',
    zoneType: 'walkable',
    polygon: [
      { lat: 27.9405, lng: -82.4520 },
      { lat: 27.9405, lng: -82.4475 },
      { lat: 27.9390, lng: -82.4475 },
      { lat: 27.9390, lng: -82.4520 },
    ],
  },
  {
    zoneId: 'waterfront-park',
    hubId: 'water-street-tampa',
    name: 'Waterfront Park',
    zoneType: 'quiet',
    polygon: [
      { lat: 27.9390, lng: -82.4535 },
      { lat: 27.9390, lng: -82.4515 },
      { lat: 27.9375, lng: -82.4515 },
      { lat: 27.9375, lng: -82.4535 },
    ],
  },
  {
    zoneId: 'sparkman-plaza',
    hubId: 'water-street-tampa',
    name: 'Sparkman Plaza',
    zoneType: 'party',
    polygon: [
      { lat: 27.9400, lng: -82.4525 },
      { lat: 27.9400, lng: -82.4505 },
      { lat: 27.9390, lng: -82.4505 },
      { lat: 27.9390, lng: -82.4525 },
    ],
  },
  {
    zoneId: 'meridian-garage',
    hubId: 'water-street-tampa',
    name: 'Meridian Parking Garage',
    zoneType: 'parking',
    polygon: [
      { lat: 27.9420, lng: -82.4460 },
      { lat: 27.9420, lng: -82.4445 },
      { lat: 27.9410, lng: -82.4445 },
      { lat: 27.9410, lng: -82.4460 },
    ],
  },
];

// ============================================================================
// NAVIGATION NODES
// ============================================================================

export interface NavigationNodeSeedData {
  nodeId: string;
  hubId: string;
  nodeType: 'intersection' | 'entrance' | 'waypoint';
  coordinates: Coordinates;
}

export const WATER_STREET_NODES: NavigationNodeSeedData[] = [
  // Main intersections
  {
    nodeId: 'int-main-channelside',
    hubId: 'water-street-tampa',
    nodeType: 'intersection',
    coordinates: { lat: 27.9405, lng: -82.4500 },
  },
  {
    nodeId: 'int-water-morgan',
    hubId: 'water-street-tampa',
    nodeType: 'intersection',
    coordinates: { lat: 27.9395, lng: -82.4490 },
  },
  {
    nodeId: 'int-sparkman-entry',
    hubId: 'water-street-tampa',
    nodeType: 'intersection',
    coordinates: { lat: 27.9392, lng: -82.4510 },
  },
  // Venue entrances
  {
    nodeId: 'ent-sparkman',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9394, lng: -82.4513 },
  },
  {
    nodeId: 'ent-predalina',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9401, lng: -82.4486 },
  },
  {
    nodeId: 'ent-jw-marriott',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9408, lng: -82.4476 },
  },
  {
    nodeId: 'ent-american-social',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9387, lng: -82.4503 },
  },
  {
    nodeId: 'ent-the-sail',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9379, lng: -82.4518 },
  },
];

// ============================================================================
// NAVIGATION EDGES
// ============================================================================

export interface NavigationEdgeSeedData {
  hubId: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  isWalkable: boolean;
}

export const WATER_STREET_EDGES: NavigationEdgeSeedData[] = [
  // Main promenade connections
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-main-channelside',
    toNodeId: 'int-water-morgan',
    distanceMeters: 120,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-water-morgan',
    toNodeId: 'int-sparkman-entry',
    distanceMeters: 80,
    isWalkable: true,
  },
  // Sparkman Wharf access
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-sparkman-entry',
    toNodeId: 'ent-sparkman',
    distanceMeters: 25,
    isWalkable: true,
  },
  // Predalina access
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-water-morgan',
    toNodeId: 'ent-predalina',
    distanceMeters: 60,
    isWalkable: true,
  },
  // JW Marriott access
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-main-channelside',
    toNodeId: 'ent-jw-marriott',
    distanceMeters: 95,
    isWalkable: true,
  },
  // American Social access
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-sparkman-entry',
    toNodeId: 'ent-american-social',
    distanceMeters: 55,
    isWalkable: true,
  },
  // The Sail access
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'ent-american-social',
    toNodeId: 'ent-the-sail',
    distanceMeters: 85,
    isWalkable: true,
  },
  // Bidirectional edges (reverse directions)
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-water-morgan',
    toNodeId: 'int-main-channelside',
    distanceMeters: 120,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-sparkman-entry',
    toNodeId: 'int-water-morgan',
    distanceMeters: 80,
    isWalkable: true,
  },
];

// ============================================================================
// METRO DATA
// ============================================================================

export const TAMPA_BAY_METRO = {
  metroId: 'tampa-bay',
  name: 'Tampa Bay',
  timezone: 'America/New_York',
};

// ============================================================================
// HELPER: Generate historical wait averages
// ============================================================================

/**
 * Generate realistic historical wait times for a venue
 * Pattern: Quiet during day, busy evenings, peak on weekends
 */
export function generateHistoricalWaitAvg(
  baseWait: number
): Record<string, number> {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const result: Record<string, number> = {};

  days.forEach((day, dayIndex) => {
    const isWeekend = dayIndex === 0 || dayIndex === 5 || dayIndex === 6;
    const weekendMultiplier = isWeekend ? 1.5 : 1.0;

    // Hours 18-23 (6 PM - 11 PM)
    for (let hour = 18; hour <= 23; hour++) {
      const hourStr = hour.toString().padStart(2, '0') + '00';
      const key = `${day}_${hourStr}`;

      // Peak at 10 PM
      const hourMultiplier = hour === 22 ? 1.3 : hour >= 20 ? 1.1 : 0.8;
      const wait = Math.round(baseWait * weekendMultiplier * hourMultiplier);

      result[key] = Math.min(wait, 45); // Cap at 45 min
    }
  });

  return result;
}

// ============================================================================
// EXPORT ALL SEED DATA
// ============================================================================

export const SEED_DATA = {
  metro: TAMPA_BAY_METRO,
  hub: WATER_STREET_HUB,
  venues: WATER_STREET_VENUES,
  zones: WATER_STREET_ZONES,
  nodes: WATER_STREET_NODES,
  edges: WATER_STREET_EDGES,
};

export default SEED_DATA;
