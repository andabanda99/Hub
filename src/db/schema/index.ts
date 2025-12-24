/**
 * WatermelonDB Schema
 * Per ARCHITECTURE_OFFLINE.md Section 3
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Hub-level settings (including filter rules)
    tableSchema({
      name: 'hubs',
      columns: [
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'metro_id', type: 'string', isIndexed: true },
        { name: 'polygon', type: 'string' }, // JSON stringified Coordinates[]
        { name: 'event_phase', type: 'string', isOptional: true },
        { name: 'manifest_version', type: 'string' },
        { name: 'filter_rules_version', type: 'string' }, // SemVer for drift detection
        { name: 'filter_rules', type: 'string' }, // JSON: { open_door: { max_wait_minutes, ... } }
        { name: 'last_sync_timestamp', type: 'number' },
      ],
    }),

    // Venue records
    tableSchema({
      name: 'venues',
      columns: [
        { name: 'venue_id', type: 'string', isIndexed: true },
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'coordinates', type: 'string' }, // JSON stringified {lat, lng}
        { name: 'base_popularity_score', type: 'number' },
        { name: 'historical_wait_avg', type: 'string' }, // JSON { "fri_2000": 45 }
        { name: 'is_anchor', type: 'boolean' },
        { name: 'ad_boost', type: 'number' },
        // RESILIENCE FIELDS
        { name: 'scheduled_closures', type: 'string' }, // JSON array of unix timestamps
        { name: 'last_known_state_id', type: 'number' },
        { name: 'state_timestamp', type: 'number' }, // Unix timestamp of last state update
        { name: 'state_confidence', type: 'string' }, // 'live' | 'recent' | 'stale' | 'historical'
        // FRICTION SCORE FIELDS (4-factor algorithm)
        { name: 'score_friction', type: 'number', isOptional: true }, // 0-100
        { name: 'raw_uber_factor', type: 'number', isOptional: true }, // 0-100
        { name: 'raw_traffic_factor', type: 'number', isOptional: true }, // 0-100
        { name: 'raw_foot_factor', type: 'number', isOptional: true }, // 0-100
        { name: 'raw_garage_factor', type: 'number', isOptional: true }, // 0-100
        { name: 'is_degraded_mode', type: 'boolean', isOptional: true },
        { name: 'friction_calculated_at', type: 'number', isOptional: true }, // Unix timestamp
      ],
    }),

    // Zones within a hub
    tableSchema({
      name: 'zones',
      columns: [
        { name: 'zone_id', type: 'string', isIndexed: true },
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'polygon', type: 'string' }, // JSON stringified Coordinates[]
        { name: 'zone_type', type: 'string' }, // 'walkable' | 'restricted' | 'parking'
      ],
    }),

    // Navigation graph nodes
    tableSchema({
      name: 'navigation_nodes',
      columns: [
        { name: 'node_id', type: 'string', isIndexed: true },
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'coordinates', type: 'string' }, // JSON stringified {lat, lng}
        { name: 'node_type', type: 'string' }, // 'intersection' | 'entrance' | 'waypoint'
      ],
    }),

    // Navigation graph edges
    tableSchema({
      name: 'navigation_edges',
      columns: [
        { name: 'hub_id', type: 'string', isIndexed: true },
        { name: 'from_node_id', type: 'string', isIndexed: true },
        { name: 'to_node_id', type: 'string', isIndexed: true },
        { name: 'distance', type: 'number' }, // meters
        { name: 'is_walkable', type: 'boolean' },
      ],
    }),

    // Scheduled closures
    tableSchema({
      name: 'scheduled_closures',
      columns: [
        { name: 'venue_id', type: 'string', isIndexed: true },
        { name: 'start_time', type: 'number' }, // Unix timestamp
        { name: 'end_time', type: 'number' },
        { name: 'reason', type: 'string', isOptional: true },
      ],
    }),

    // Sync state tracking
    tableSchema({
      name: 'sync_state',
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
