/**
 * Domain Types for The Hub
 * Based on CLAUDE.md Domain Model (Section 3)
 */

// State Confidence levels per DOMAIN_RULES.md Section 4
export type StateConfidence = 'live' | 'recent' | 'stale' | 'historical';

// Venue State IDs per DOMAIN_RULES.md Section 3
export type VenueStateId = 0 | 1 | 2 | 3;
export const VenueState = {
  CLOSED: 0 as VenueStateId,
  QUIET: 1 as VenueStateId,
  SOCIAL: 2 as VenueStateId,
  PARTY: 3 as VenueStateId,
} as const;

// Coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// Metro (Top level - e.g., Tampa Bay)
export interface Metro {
  id: string;
  name: string;
  timezone: string;
}

// Hub (Container - e.g., Water Street)
export interface Hub {
  id: string;
  metroId: string;
  name: string;
  polygon: Coordinates[]; // Geofence boundary
  eventPhase?: string; // e.g., "Lightning Game Egress"
  manifestVersion: string;
  filterRulesVersion: string;
  filterRules: FilterRules;
  lastSyncTimestamp: number;
}

// Filter Rules (for offline/online parity)
export interface FilterRules {
  openDoor: {
    maxWaitMinutes: number;
    maxFriction: number;
    allowedConfidence: StateConfidence[];
  };
}

// Venue (Node - e.g., Predalina)
export interface Venue {
  id: string;
  hubId: string;
  name: string;
  coordinates: Coordinates;
  basePopularityScore: number;
  historicalWaitAvg: Record<string, number>; // e.g., { "fri_2000": 45 }
  scheduledClosures: number[]; // Unix timestamps
  lastKnownStateId: VenueStateId;
  stateTimestamp: number;
  stateConfidence: StateConfidence;
  // Business features
  isAnchor: boolean; // Anchor venues get +20% base radius
  adBoost: number; // 0-40 range per DOMAIN_RULES.md
}

// Real-time venue state update (from WebSocket)
export interface VenueStateDelta {
  venueId: string;
  stateId: VenueStateId;
  confidence: StateConfidence;
  timestamp: number;
}

// WebSocket sync response per CLAUDE.md Section 6
export interface SyncResponse {
  type: 'sync';
  lastEventId: string;
  deltas: VenueStateDelta[];
}

// Friction Score input sources
export interface FrictionInputs {
  uberSurge: number | null; // 1.0x - 5.0x, null if API down
  trafficFlow: number | null; // 0 - historical_max, null if API down
  footTrafficCount: number | null; // Pedestrian count, null if API down
  garageOccupancy: number | null; // 0-100%, null if API down
}

// Raw friction factor breakdown for UI
export interface FrictionFactors {
  uber: number; // 0-100
  traffic: number; // 0-100
  foot: number; // 0-100
  garage: number; // 0-100
}

// Hub Manifest (downloaded on geofence entry)
export interface HubManifest {
  hubId: string;
  manifestVersion: string;
  filterRulesVersion: string;
  filterRules: FilterRules;
  venues: Venue[];
  zones: Zone[];
  navigationGraph: NavigationGraph;
  scheduledClosures: ScheduledClosure[];
}

// Zone within a Hub
export interface Zone {
  id: string;
  hubId: string;
  name: string;
  polygon: Coordinates[];
  type: 'walkable' | 'restricted' | 'parking';
}

// Navigation graph for offline pathfinding
export interface NavigationGraph {
  nodes: NavigationNode[];
  edges: NavigationEdge[];
}

export interface NavigationNode {
  id: string;
  coordinates: Coordinates;
  type: 'intersection' | 'entrance' | 'waypoint';
}

export interface NavigationEdge {
  from: string;
  to: string;
  distance: number; // meters
  walkable: boolean;
}

// Scheduled closures
export interface ScheduledClosure {
  venueId: string;
  startTime: number; // Unix timestamp
  endTime: number;
  reason?: string;
}
