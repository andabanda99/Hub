/**
 * WatermelonDB Schema
 *
 * Per ARCHITECTURE_OFFLINE.md Section 3: WatermelonDB Schema Structure
 * Matches the Supabase SQL schema in backend/supabase/migrations/20240101_init.sql
 *
 * IMPORTANT: This schema must stay in sync with the backend SQL schema.
 * Any changes here should be reflected in a new SQL migration.
 */

import { appSchema, tableSchema, ColumnSchema } from '@nozbe/watermelondb';

/**
 * Schema version - increment when making breaking changes
 * This triggers WatermelonDB migrations
 */
export const SCHEMA_VERSION = 1;

/**
 * State confidence levels per DOMAIN_RULES.md Section 4
 * Must match SQL enum: state_confidence_level
 */
export type StateConfidenceLevel = 'live' | 'recent' | 'stale' | 'historical';

/**
 * Venue state IDs per DOMAIN_RULES.md Section 3
 * Must match SQL enum: venue_state_id
 * 0 = Closed/Empty, 1 = Quiet, 2 = Social, 3 = Party
 */
export type VenueStateId = 0 | 1 | 2 | 3;

/**
 * Zone types per domain model
 * Must match SQL enum: zone_type
 */
export type ZoneType = 'walkable' | 'restricted' | 'parking' | 'quiet' | 'party';

/**
 * Navigation node types
 * Must match SQL CHECK constraint on navigation_nodes.node_type
 */
export type NavigationNodeType = 'intersection' | 'entrance' | 'waypoint';

/**
 * Filter rules structure per ARCHITECTURE_OFFLINE.md
 * Matches SQL JSONB column: hubs.filter_rules
 */
export interface FilterRules {
  open_door: {
    max_wait_minutes: number;
    max_friction: number;
    allowed_confidence: StateConfidenceLevel[];
  };
}

/**
 * Coordinates structure
 * Used in JSON columns for locations
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Historical wait average structure
 * Matches SQL JSONB column: venues.historical_wait_avg
 * Keys are in format: "day_hour" (e.g., "fri_2000" for Friday 8PM)
 */
export interface HistoricalWaitAvg {
  [dayHour: string]: number;
}

/**
 * Scheduled closure structure
 * Matches SQL JSONB array: venues.scheduled_closures
 */
export interface ScheduledClosure {
  start_time: number; // Unix timestamp (milliseconds)
  end_time: number; // Unix timestamp (milliseconds)
  reason?: string;
}

// ============================================================================
// TABLE NAMES (Constants for type safety)
// ============================================================================

export const TableNames = {
  METROS: 'metros',
  HUBS: 'hubs',
  VENUES: 'venues',
  ZONES: 'zones',
  NAVIGATION_NODES: 'navigation_nodes',
  NAVIGATION_EDGES: 'navigation_edges',
  SCHEDULED_CLOSURES: 'scheduled_closures',
  FRICTION_INPUTS: 'friction_inputs',
  SYNC_STATE: 'sync_state',
} as const;

export type TableName = (typeof TableNames)[keyof typeof TableNames];

// ============================================================================
// COLUMN DEFINITIONS (For strict typing)
// ============================================================================

/**
 * Metros table columns
 */
export interface MetroColumns {
  metro_id: string; // Matches SQL: id (UUID as string)
  name: string;
  timezone: string;
  created_at: number;
  updated_at: number;
}

/**
 * Hubs table columns
 */
export interface HubColumns {
  hub_id: string; // Human-readable ID (e.g., 'water-street')
  metro_id: string; // Foreign key to metros
  name: string;
  geofence: string; // JSON stringified Coordinates[] (polygon)
  event_phase: string | null;
  manifest_version: string;
  filter_rules_version: string; // SemVer for drift detection
  filter_rules: string; // JSON stringified FilterRules
  last_sync_timestamp: number;
  created_at: number;
  updated_at: number;
}

/**
 * Venues table columns
 */
export interface VenueColumns {
  venue_id: string; // Human-readable ID
  hub_id: string; // Foreign key to hubs
  name: string;
  coordinates: string; // JSON stringified Coordinates
  base_popularity_score: number; // 0-100
  historical_wait_avg: string; // JSON stringified HistoricalWaitAvg
  is_anchor: boolean; // Anchor venues get +20% base radius
  ad_boost: number; // 0-40, affects visibility radius
  scheduled_closures: string; // JSON stringified ScheduledClosure[]
  last_known_state_id: number; // VenueStateId: 0-3
  state_timestamp: number; // Unix timestamp (milliseconds)
  state_confidence: string; // StateConfidenceLevel
  current_wait_minutes: number;
  is_private_event: boolean;
  capacity: number;
  created_at: number;
  updated_at: number;
}

/**
 * Zones table columns
 */
export interface ZoneColumns {
  zone_id: string; // Human-readable ID
  hub_id: string; // Foreign key to hubs
  name: string;
  polygon: string; // JSON stringified Coordinates[]
  zone_type: string; // ZoneType
  metadata: string; // JSON stringified object
  created_at: number;
  updated_at: number;
}

/**
 * Navigation nodes table columns
 */
export interface NavigationNodeColumns {
  node_id: string; // Human-readable ID
  hub_id: string; // Foreign key to hubs
  coordinates: string; // JSON stringified Coordinates
  node_type: string; // NavigationNodeType
  created_at: number;
}

/**
 * Navigation edges table columns
 */
export interface NavigationEdgeColumns {
  hub_id: string; // Foreign key to hubs
  from_node_id: string; // Foreign key to navigation_nodes
  to_node_id: string; // Foreign key to navigation_nodes
  distance_meters: number;
  is_walkable: boolean;
  created_at: number;
}

/**
 * Scheduled closures table columns
 * (Alternative to JSONB for complex queries)
 */
export interface ScheduledClosureColumns {
  venue_id: string; // Foreign key to venues
  start_time: number; // Unix timestamp
  end_time: number; // Unix timestamp
  reason: string | null;
  created_at: number;
}

/**
 * Friction inputs table columns
 */
export interface FrictionInputColumns {
  hub_id: string; // Foreign key to hubs
  uber_surge_normalized: number | null; // 0-100
  traffic_flow_normalized: number | null; // 0-100
  garage_occupancy_normalized: number | null; // 0-100
  friction_score: number | null; // 0-100
  sources_available: string; // JSON stringified string[]
  calculated_at: number;
}

/**
 * Sync state table columns
 * (For tracking sync progress)
 */
export interface SyncStateColumns {
  key: string;
  value: string;
  updated_at: number;
}

// ============================================================================
// WATERMELONDB SCHEMA
// ============================================================================

export const schema = appSchema({
  version: SCHEMA_VERSION,
  tables: [
    // ========================================================================
    // TABLE: metros
    // Top-level geographic container (e.g., Tampa Bay)
    // ========================================================================
    tableSchema({
      name: TableNames.METROS,
      columns: [
        { name: 'metro_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'timezone', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: hubs
    // Container for a nightlife district (e.g., Water Street)
    // Per CLAUDE.md Section 3: Defined by a strict Polygon Geofence
    // ========================================================================
    tableSchema({
      name: TableNames.HUBS,
      columns: [
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'metro_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'geofence', type: 'string' }, // JSON: Coordinates[]
        { name: 'event_phase', type: 'string', isOptional: true },
        { name: 'manifest_version', type: 'string' },
        { name: 'filter_rules_version', type: 'string' }, // SemVer for drift detection
        { name: 'filter_rules', type: 'string' }, // JSON: FilterRules
        { name: 'last_sync_timestamp', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: venues
    // Individual venues within a hub (e.g., Predalina)
    // Per CLAUDE.md Section 3: Belongs to ONE Hub, has Sensor-Driven States
    // Per ARCHITECTURE_OFFLINE.md: Includes state_confidence and scheduled_closures
    // ========================================================================
    tableSchema({
      name: TableNames.VENUES,
      columns: [
        { name: 'venue_id', type: 'string', isIndexed: true },
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'coordinates', type: 'string' }, // JSON: Coordinates
        { name: 'base_popularity_score', type: 'number' }, // 0-100
        { name: 'historical_wait_avg', type: 'string' }, // JSON: HistoricalWaitAvg
        { name: 'is_anchor', type: 'boolean' }, // Anchor venues get +20% base radius
        { name: 'ad_boost', type: 'number' }, // 0-40
        { name: 'scheduled_closures', type: 'string' }, // JSON: ScheduledClosure[]
        { name: 'last_known_state_id', type: 'number' }, // VenueStateId: 0-3
        { name: 'state_timestamp', type: 'number' }, // Unix timestamp (ms)
        { name: 'state_confidence', type: 'string', isIndexed: true }, // StateConfidenceLevel
        { name: 'current_wait_minutes', type: 'number' },
        { name: 'is_private_event', type: 'boolean' },
        { name: 'capacity', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: zones
    // Sub-regions within a hub (walkable areas, parking, quiet zones, party zones)
    // ========================================================================
    tableSchema({
      name: TableNames.ZONES,
      columns: [
        { name: 'zone_id', type: 'string', isIndexed: true },
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'polygon', type: 'string' }, // JSON: Coordinates[]
        { name: 'zone_type', type: 'string' }, // ZoneType
        { name: 'metadata', type: 'string' }, // JSON: object
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: navigation_nodes
    // Graph nodes for offline pathfinding per ARCHITECTURE_OFFLINE.md
    // ========================================================================
    tableSchema({
      name: TableNames.NAVIGATION_NODES,
      columns: [
        { name: 'node_id', type: 'string', isIndexed: true },
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'coordinates', type: 'string' }, // JSON: Coordinates
        { name: 'node_type', type: 'string' }, // NavigationNodeType
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: navigation_edges
    // Graph edges for offline pathfinding per ARCHITECTURE_OFFLINE.md
    // ========================================================================
    tableSchema({
      name: TableNames.NAVIGATION_EDGES,
      columns: [
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'from_node_id', type: 'string', isIndexed: true },
        { name: 'to_node_id', type: 'string', isIndexed: true },
        { name: 'distance_meters', type: 'number' },
        { name: 'is_walkable', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: scheduled_closures
    // Explicit closure records (alternative to JSONB for complex queries)
    // ========================================================================
    tableSchema({
      name: TableNames.SCHEDULED_CLOSURES,
      columns: [
        { name: 'venue_id', type: 'string', isIndexed: true },
        { name: 'start_time', type: 'number', isIndexed: true },
        { name: 'end_time', type: 'number', isIndexed: true },
        { name: 'reason', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: friction_inputs
    // Cached friction score inputs (updated by backend services)
    // Per DOMAIN_RULES.md Section 1
    // ========================================================================
    tableSchema({
      name: TableNames.FRICTION_INPUTS,
      columns: [
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'uber_surge_normalized', type: 'number', isOptional: true },
        { name: 'traffic_flow_normalized', type: 'number', isOptional: true },
        { name: 'garage_occupancy_normalized', type: 'number', isOptional: true },
        { name: 'friction_score', type: 'number', isOptional: true },
        { name: 'sources_available', type: 'string' }, // JSON: string[]
        { name: 'calculated_at', type: 'number' },
      ],
    }),

    // ========================================================================
    // TABLE: sync_state
    // For tracking sync progress and last event IDs
    // Per CLAUDE.md Section 6: WebSocket Connection Lifecycle
    // ========================================================================
    tableSchema({
      name: TableNames.SYNC_STATE,
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

// ============================================================================
// SCHEMA VALIDATION HELPERS
// ============================================================================

/**
 * Validate state confidence level
 */
export function isValidStateConfidence(value: string): value is StateConfidenceLevel {
  return ['live', 'recent', 'stale', 'historical'].includes(value);
}

/**
 * Validate venue state ID
 */
export function isValidVenueStateId(value: number): value is VenueStateId {
  return [0, 1, 2, 3].includes(value);
}

/**
 * Validate zone type
 */
export function isValidZoneType(value: string): value is ZoneType {
  return ['walkable', 'restricted', 'parking', 'quiet', 'party'].includes(value);
}

/**
 * Validate navigation node type
 */
export function isValidNavigationNodeType(value: string): value is NavigationNodeType {
  return ['intersection', 'entrance', 'waypoint'].includes(value);
}

/**
 * Parse filter rules from JSON string
 */
export function parseFilterRules(json: string): FilterRules {
  try {
    return JSON.parse(json) as FilterRules;
  } catch {
    // Return default filter rules
    return {
      open_door: {
        max_wait_minutes: 15,
        max_friction: 80,
        allowed_confidence: ['live', 'recent'],
      },
    };
  }
}

/**
 * Parse coordinates from JSON string
 */
export function parseCoordinates(json: string): Coordinates {
  try {
    return JSON.parse(json) as Coordinates;
  } catch {
    return { lat: 0, lng: 0 };
  }
}

/**
 * Parse polygon (array of coordinates) from JSON string
 */
export function parsePolygon(json: string): Coordinates[] {
  try {
    return JSON.parse(json) as Coordinates[];
  } catch {
    return [];
  }
}

/**
 * Parse scheduled closures from JSON string
 */
export function parseScheduledClosures(json: string): ScheduledClosure[] {
  try {
    return JSON.parse(json) as ScheduledClosure[];
  } catch {
    return [];
  }
}

/**
 * Parse historical wait averages from JSON string
 */
export function parseHistoricalWaitAvg(json: string): HistoricalWaitAvg {
  try {
    return JSON.parse(json) as HistoricalWaitAvg;
  } catch {
    return {};
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default schema;
