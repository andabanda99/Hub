/**
 * Water Street Tampa Seed Data
 *
 * Real coordinates for POC testing at Water Street Tampa district.
 * Focus: The bar cluster (Edition, Boulon, Pearl, Alter Ego) + Predalina edge case.
 *
 * The "Predalina Problem": Predalina is ~250m from the main cluster - just far
 * enough that natural foot traffic doesn't flow there. This is the core use case
 * for The Hub's Gravity Well and Open Door features.
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
  // Tighter polygon focused on the actual bar cluster + Predalina
  // The cluster is near the Tampa Edition hotel area
  geofence: [
    { lat: 27.9435, lng: -82.4520 }, // NW corner (past Predalina)
    { lat: 27.9435, lng: -82.4470 }, // NE corner
    { lat: 27.9395, lng: -82.4470 }, // SE corner
    { lat: 27.9395, lng: -82.4520 }, // SW corner
    { lat: 27.9435, lng: -82.4520 }, // Close polygon
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
  // =========================================================================
  // THE CLUSTER: Edition, Boulon, Pearl, Alter Ego
  // These are ~50-100m apart - natural foot traffic between them
  // =========================================================================
  {
    venueId: 'the-edition',
    hubId: 'water-street-tampa',
    name: 'The Tampa EDITION',
    // The Edition hotel bar/lounge - anchor of the cluster
    coordinates: { lat: 27.9420, lng: -82.4485 },
    basePopularityScore: 90,
    isAnchor: true, // Major destination, gets +20% radius
    adBoost: 35,
    capacity: 200,
    initialState: {
      stateId: 3, // Party - typically busy
      waitMinutes: 18,
      isPrivateEvent: false,
    },
  },
  {
    venueId: 'boulon',
    hubId: 'water-street-tampa',
    name: 'Boulon Brasserie',
    // French brasserie, upscale cocktails
    coordinates: { lat: 27.9415, lng: -82.4480 },
    basePopularityScore: 82,
    isAnchor: false,
    adBoost: 20,
    capacity: 120,
    initialState: {
      stateId: 2, // Social
      waitMinutes: 10,
      isPrivateEvent: false,
    },
  },
  {
    venueId: 'the-pearl',
    hubId: 'water-street-tampa',
    name: 'The Pearl',
    // Oyster bar and cocktails
    coordinates: { lat: 27.9412, lng: -82.4478 },
    basePopularityScore: 78,
    isAnchor: false,
    adBoost: 15,
    capacity: 80,
    initialState: {
      stateId: 2, // Social
      waitMinutes: 5,
      isPrivateEvent: false,
    },
  },
  {
    venueId: 'alter-ego',
    hubId: 'water-street-tampa',
    name: 'Alter Ego',
    // Late night spot, more party-oriented
    coordinates: { lat: 27.9408, lng: -82.4482 },
    basePopularityScore: 75,
    isAnchor: false,
    adBoost: 25,
    capacity: 150,
    initialState: {
      stateId: 3, // Party
      waitMinutes: 15,
      isPrivateEvent: false,
    },
  },

  // =========================================================================
  // THE EDGE CASE: Predalina
  // ~250m from the cluster - the "Predalina Problem"
  // Just far enough that foot traffic doesn't naturally flow here
  // This is THE use case for The Hub's Gravity Well
  // =========================================================================
  {
    venueId: 'predalina',
    hubId: 'water-street-tampa',
    name: 'Predalina',
    // Italian restaurant/bar - great venue but slightly isolated
    coordinates: { lat: 27.9428, lng: -82.4510 },
    basePopularityScore: 80,
    isAnchor: true, // Paying for visibility to overcome distance
    adBoost: 40, // MAX boost to extend radius toward cluster
    capacity: 150,
    initialState: {
      stateId: 1, // Quiet - lower traffic due to distance
      waitMinutes: 0, // Open Door candidate!
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
    zoneId: 'edition-cluster',
    hubId: 'water-street-tampa',
    name: 'Edition Bar Cluster',
    zoneType: 'party',
    // The main cluster area: Edition, Boulon, Pearl, Alter Ego
    polygon: [
      { lat: 27.9425, lng: -82.4490 },
      { lat: 27.9425, lng: -82.4475 },
      { lat: 27.9405, lng: -82.4475 },
      { lat: 27.9405, lng: -82.4490 },
    ],
  },
  {
    zoneId: 'water-street-promenade',
    hubId: 'water-street-tampa',
    name: 'Water Street Promenade',
    zoneType: 'walkable',
    // Main walkway connecting cluster to Predalina
    polygon: [
      { lat: 27.9430, lng: -82.4515 },
      { lat: 27.9430, lng: -82.4490 },
      { lat: 27.9420, lng: -82.4490 },
      { lat: 27.9420, lng: -82.4515 },
    ],
  },
  {
    zoneId: 'predalina-area',
    hubId: 'water-street-tampa',
    name: 'Predalina Area',
    zoneType: 'walkable',
    // Slightly isolated - the edge case zone
    polygon: [
      { lat: 27.9432, lng: -82.4518 },
      { lat: 27.9432, lng: -82.4505 },
      { lat: 27.9424, lng: -82.4505 },
      { lat: 27.9424, lng: -82.4518 },
    ],
  },
  {
    zoneId: 'water-street-garage',
    hubId: 'water-street-tampa',
    name: 'Water Street Parking',
    zoneType: 'parking',
    polygon: [
      { lat: 27.9420, lng: -82.4470 },
      { lat: 27.9420, lng: -82.4460 },
      { lat: 27.9410, lng: -82.4460 },
      { lat: 27.9410, lng: -82.4470 },
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
  // =========================================================================
  // CLUSTER INTERSECTIONS
  // =========================================================================
  {
    nodeId: 'int-cluster-center',
    hubId: 'water-street-tampa',
    nodeType: 'intersection',
    // Central point of the bar cluster
    coordinates: { lat: 27.9415, lng: -82.4482 },
  },
  {
    nodeId: 'int-cluster-north',
    hubId: 'water-street-tampa',
    nodeType: 'intersection',
    // North end of cluster, toward Predalina
    coordinates: { lat: 27.9422, lng: -82.4490 },
  },
  {
    nodeId: 'int-predalina-junction',
    hubId: 'water-street-tampa',
    nodeType: 'intersection',
    // The decision point: continue to Predalina or stay in cluster
    coordinates: { lat: 27.9425, lng: -82.4500 },
  },

  // =========================================================================
  // VENUE ENTRANCES - The Cluster
  // =========================================================================
  {
    nodeId: 'ent-edition',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9419, lng: -82.4484 },
  },
  {
    nodeId: 'ent-boulon',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9414, lng: -82.4479 },
  },
  {
    nodeId: 'ent-pearl',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9411, lng: -82.4477 },
  },
  {
    nodeId: 'ent-alter-ego',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    coordinates: { lat: 27.9407, lng: -82.4481 },
  },

  // =========================================================================
  // VENUE ENTRANCE - Predalina (the edge case)
  // =========================================================================
  {
    nodeId: 'ent-predalina',
    hubId: 'water-street-tampa',
    nodeType: 'entrance',
    // ~250m from cluster center - the "Predalina Problem"
    coordinates: { lat: 27.9427, lng: -82.4509 },
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
  // =========================================================================
  // CLUSTER INTERNAL CONNECTIONS (short distances, natural foot traffic)
  // =========================================================================

  // Cluster center to all venues
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-cluster-center',
    toNodeId: 'ent-edition',
    distanceMeters: 55,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-cluster-center',
    toNodeId: 'ent-boulon',
    distanceMeters: 35,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-cluster-center',
    toNodeId: 'ent-pearl',
    distanceMeters: 45,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-cluster-center',
    toNodeId: 'ent-alter-ego',
    distanceMeters: 85,
    isWalkable: true,
  },

  // Inter-venue connections (bar hopping paths)
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'ent-edition',
    toNodeId: 'ent-boulon',
    distanceMeters: 60,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'ent-boulon',
    toNodeId: 'ent-pearl',
    distanceMeters: 40,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'ent-pearl',
    toNodeId: 'ent-alter-ego',
    distanceMeters: 55,
    isWalkable: true,
  },

  // =========================================================================
  // CLUSTER TO PREDALINA (the critical "edge case" path)
  // This is ~250m total - just far enough to break foot traffic
  // =========================================================================
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-cluster-center',
    toNodeId: 'int-cluster-north',
    distanceMeters: 90,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-cluster-north',
    toNodeId: 'int-predalina-junction',
    distanceMeters: 75,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-predalina-junction',
    toNodeId: 'ent-predalina',
    distanceMeters: 85,
    isWalkable: true,
  },

  // =========================================================================
  // BIDIRECTIONAL EDGES (return paths)
  // =========================================================================
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'ent-predalina',
    toNodeId: 'int-predalina-junction',
    distanceMeters: 85,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-predalina-junction',
    toNodeId: 'int-cluster-north',
    distanceMeters: 75,
    isWalkable: true,
  },
  {
    hubId: 'water-street-tampa',
    fromNodeId: 'int-cluster-north',
    toNodeId: 'int-cluster-center',
    distanceMeters: 90,
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
