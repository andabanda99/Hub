-- ============================================================================
-- THE HUB - Initial Database Schema
-- Migration: 20240101_init.sql
--
-- Per CLAUDE.md Section 2: Backend: Supabase (PostgreSQL + PostGIS)
-- Per ARCHITECTURE_OFFLINE.md Section 3: WatermelonDB Schema Structure
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable PostGIS for geospatial operations (geofences, distance calculations)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- State confidence levels per DOMAIN_RULES.md Section 4
CREATE TYPE state_confidence_level AS ENUM ('live', 'recent', 'stale', 'historical');

-- Venue state IDs per DOMAIN_RULES.md Section 3
CREATE TYPE venue_state_id AS ENUM ('0', '1', '2', '3');
-- 0 = Closed/Empty, 1 = Quiet, 2 = Social, 3 = Party

-- Zone types per domain model
CREATE TYPE zone_type AS ENUM ('walkable', 'restricted', 'parking', 'quiet', 'party');

-- ============================================================================
-- TABLE: metros
-- Top-level geographic container (e.g., Tampa Bay)
-- ============================================================================

CREATE TABLE metros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: hubs
-- Container for a nightlife district (e.g., Water Street)
-- Per CLAUDE.md Section 3: Defined by a strict Polygon Geofence
-- ============================================================================

CREATE TABLE hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id TEXT UNIQUE NOT NULL, -- Human-readable ID (e.g., 'water-street')
    metro_id UUID NOT NULL REFERENCES metros(id) ON DELETE CASCADE,
    name TEXT NOT NULL,

    -- Geofence polygon (PostGIS geometry)
    -- Per CLAUDE.md: "Defined by a strict Polygon Geofence"
    geofence GEOMETRY(Polygon, 4326) NOT NULL,

    -- Global state tracking
    -- Per CLAUDE.md: "Tracks Event Phase (e.g., Lightning Game Egress)"
    event_phase TEXT,

    -- Manifest versioning per ARCHITECTURE_OFFLINE.md
    manifest_version TEXT NOT NULL DEFAULT '1.0.0',

    -- Filter rules versioning per ARCHITECTURE_OFFLINE.md
    -- SemVer for drift detection between server and client
    filter_rules_version TEXT NOT NULL DEFAULT '1.0.0',

    -- Filter rules JSON per ARCHITECTURE_OFFLINE.md
    -- Structure: { open_door: { max_wait_minutes, max_friction, allowed_confidence } }
    filter_rules JSONB NOT NULL DEFAULT '{
        "open_door": {
            "max_wait_minutes": 15,
            "max_friction": 80,
            "allowed_confidence": ["live", "recent"]
        }
    }'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for geofence queries
CREATE INDEX idx_hubs_geofence ON hubs USING GIST (geofence);
CREATE INDEX idx_hubs_hub_id ON hubs (hub_id);

-- ============================================================================
-- TABLE: venues
-- Individual venues within a hub (e.g., Predalina)
-- Per CLAUDE.md Section 3: Belongs to ONE Hub, has Sensor-Driven States
-- ============================================================================

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id TEXT UNIQUE NOT NULL, -- Human-readable ID
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,

    -- Location (PostGIS point)
    location GEOMETRY(Point, 4326) NOT NULL,

    -- Popularity and historical data
    base_popularity_score INTEGER NOT NULL DEFAULT 50 CHECK (base_popularity_score >= 0 AND base_popularity_score <= 100),

    -- Historical wait averages per ARCHITECTURE_OFFLINE.md
    -- Structure: { "fri_2000": 45, "sat_2100": 60, ... }
    historical_wait_avg JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Anchor status per DOMAIN_RULES.md Section 2
    -- Anchor venues (Sparkman, Predalina) get +20% base radius
    is_anchor BOOLEAN NOT NULL DEFAULT FALSE,

    -- Ad boost per DOMAIN_RULES.md Section 2
    -- Range 0-40, affects visibility radius on 3D map
    ad_boost INTEGER NOT NULL DEFAULT 0 CHECK (ad_boost >= 0 AND ad_boost <= 40),

    -- Scheduled closures per ARCHITECTURE_OFFLINE.md
    -- Array of { start_time, end_time, reason? } objects
    scheduled_closures JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Real-time state per DOMAIN_RULES.md Section 3
    -- State IDs: 0=Closed, 1=Quiet, 2=Social, 3=Party
    last_known_state_id venue_state_id NOT NULL DEFAULT '0',

    -- Timestamp of last state update (Unix timestamp in milliseconds)
    state_timestamp BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,

    -- State confidence per DOMAIN_RULES.md Section 4
    state_confidence state_confidence_level NOT NULL DEFAULT 'historical',

    -- Current wait time in minutes (updated by sensors/managers)
    current_wait_minutes INTEGER DEFAULT 0 CHECK (current_wait_minutes >= 0),

    -- Private event status per DOMAIN_RULES.md Section 5
    is_private_event BOOLEAN NOT NULL DEFAULT FALSE,

    -- Capacity for percentage calculations
    capacity INTEGER NOT NULL DEFAULT 100 CHECK (capacity > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for location queries
CREATE INDEX idx_venues_location ON venues USING GIST (location);
CREATE INDEX idx_venues_hub_id ON venues (hub_id);
CREATE INDEX idx_venues_venue_id ON venues (venue_id);
CREATE INDEX idx_venues_state ON venues (last_known_state_id, state_confidence);

-- ============================================================================
-- TABLE: zones
-- Sub-regions within a hub (walkable areas, parking, quiet zones, party zones)
-- ============================================================================

CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id TEXT UNIQUE NOT NULL, -- Human-readable ID
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,

    -- Zone polygon (PostGIS geometry)
    polygon GEOMETRY(Polygon, 4326) NOT NULL,

    -- Zone type
    zone_type zone_type NOT NULL DEFAULT 'walkable',

    -- Optional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for zone queries
CREATE INDEX idx_zones_polygon ON zones USING GIST (polygon);
CREATE INDEX idx_zones_hub_id ON zones (hub_id);

-- ============================================================================
-- TABLE: navigation_nodes
-- Graph nodes for offline pathfinding per ARCHITECTURE_OFFLINE.md
-- ============================================================================

CREATE TABLE navigation_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id TEXT UNIQUE NOT NULL,
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,

    -- Node location
    location GEOMETRY(Point, 4326) NOT NULL,

    -- Node type
    node_type TEXT NOT NULL CHECK (node_type IN ('intersection', 'entrance', 'waypoint')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_navigation_nodes_hub_id ON navigation_nodes (hub_id);
CREATE INDEX idx_navigation_nodes_location ON navigation_nodes USING GIST (location);

-- ============================================================================
-- TABLE: navigation_edges
-- Graph edges for offline pathfinding per ARCHITECTURE_OFFLINE.md
-- ============================================================================

CREATE TABLE navigation_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,

    -- Edge properties
    distance_meters REAL NOT NULL CHECK (distance_meters > 0),
    is_walkable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate edges
    UNIQUE (from_node_id, to_node_id)
);

CREATE INDEX idx_navigation_edges_hub_id ON navigation_edges (hub_id);
CREATE INDEX idx_navigation_edges_from ON navigation_edges (from_node_id);
CREATE INDEX idx_navigation_edges_to ON navigation_edges (to_node_id);

-- ============================================================================
-- TABLE: scheduled_closures
-- Explicit closure records (alternative to JSONB for complex queries)
-- ============================================================================

CREATE TABLE scheduled_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

    -- Closure period
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    -- Optional reason
    reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_time > start_time)
);

CREATE INDEX idx_scheduled_closures_venue_id ON scheduled_closures (venue_id);
CREATE INDEX idx_scheduled_closures_time ON scheduled_closures (start_time, end_time);

-- ============================================================================
-- TABLE: friction_inputs
-- Cached friction score inputs (updated by backend services)
-- Per DOMAIN_RULES.md Section 1
-- ============================================================================

CREATE TABLE friction_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,

    -- Normalized inputs (0-100) per DOMAIN_RULES.md
    uber_surge_normalized REAL CHECK (uber_surge_normalized IS NULL OR (uber_surge_normalized >= 0 AND uber_surge_normalized <= 100)),
    traffic_flow_normalized REAL CHECK (traffic_flow_normalized IS NULL OR (traffic_flow_normalized >= 0 AND traffic_flow_normalized <= 100)),
    garage_occupancy_normalized REAL CHECK (garage_occupancy_normalized IS NULL OR (garage_occupancy_normalized >= 0 AND garage_occupancy_normalized <= 100)),

    -- Calculated friction score
    friction_score REAL CHECK (friction_score IS NULL OR (friction_score >= 0 AND friction_score <= 100)),

    -- Which sources were available
    sources_available TEXT[] NOT NULL DEFAULT '{}',

    -- Timestamp
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hub_id) -- One active record per hub
);

CREATE INDEX idx_friction_inputs_hub_id ON friction_inputs (hub_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Per CLAUDE.md Section 4.B: "SECURITY CRITICAL: Filtering happens at the Edge"
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE metros ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE friction_inputs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: metros
-- ============================================================================

-- Public can read metros
CREATE POLICY "Metros are publicly readable"
    ON metros FOR SELECT
    TO public
    USING (true);

-- Only service_role can modify metros
CREATE POLICY "Only service_role can insert metros"
    ON metros FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service_role can update metros"
    ON metros FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Only service_role can delete metros"
    ON metros FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- RLS POLICIES: hubs
-- ============================================================================

-- Public can read hubs
CREATE POLICY "Hubs are publicly readable"
    ON hubs FOR SELECT
    TO public
    USING (true);

-- Only service_role can modify hubs
CREATE POLICY "Only service_role can insert hubs"
    ON hubs FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service_role can update hubs"
    ON hubs FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Only service_role can delete hubs"
    ON hubs FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- RLS POLICIES: venues
-- CRUCIAL: Readable by public, writable ONLY by service_role (managers)
-- ============================================================================

-- Public can read venues
CREATE POLICY "Venues are publicly readable"
    ON venues FOR SELECT
    TO public
    USING (true);

-- Only service_role can insert venues
CREATE POLICY "Only service_role can insert venues"
    ON venues FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Only service_role can update venues
CREATE POLICY "Only service_role can update venues"
    ON venues FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Only service_role can delete venues
CREATE POLICY "Only service_role can delete venues"
    ON venues FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- RLS POLICIES: zones
-- ============================================================================

-- Public can read zones
CREATE POLICY "Zones are publicly readable"
    ON zones FOR SELECT
    TO public
    USING (true);

-- Only service_role can modify zones
CREATE POLICY "Only service_role can insert zones"
    ON zones FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service_role can update zones"
    ON zones FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Only service_role can delete zones"
    ON zones FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- RLS POLICIES: navigation_nodes & navigation_edges
-- ============================================================================

-- Public can read navigation data (needed for offline pathfinding)
CREATE POLICY "Navigation nodes are publicly readable"
    ON navigation_nodes FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Navigation edges are publicly readable"
    ON navigation_edges FOR SELECT
    TO public
    USING (true);

-- Only service_role can modify navigation data
CREATE POLICY "Only service_role can modify navigation_nodes"
    ON navigation_nodes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Only service_role can modify navigation_edges"
    ON navigation_edges FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: scheduled_closures
-- ============================================================================

-- Public can read closures
CREATE POLICY "Scheduled closures are publicly readable"
    ON scheduled_closures FOR SELECT
    TO public
    USING (true);

-- Only service_role can modify closures
CREATE POLICY "Only service_role can modify scheduled_closures"
    ON scheduled_closures FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: friction_inputs
-- ============================================================================

-- Public can read friction inputs
CREATE POLICY "Friction inputs are publicly readable"
    ON friction_inputs FOR SELECT
    TO public
    USING (true);

-- Only service_role can modify friction inputs
CREATE POLICY "Only service_role can modify friction_inputs"
    ON friction_inputs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS: Open Door Filter (Server-Side)
-- Per CLAUDE.md Section 4.B: "SECURITY CRITICAL: Filtering happens at the Edge"
-- ============================================================================

-- Function to get venues passing Open Door filter
CREATE OR REPLACE FUNCTION get_open_door_venues(p_hub_id UUID)
RETURNS SETOF venues
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_filter_rules JSONB;
    v_max_wait INTEGER;
    v_max_friction INTEGER;
    v_allowed_confidence state_confidence_level[];
    v_friction_score REAL;
BEGIN
    -- Get filter rules for this hub
    SELECT filter_rules INTO v_filter_rules
    FROM hubs WHERE id = p_hub_id;

    IF v_filter_rules IS NULL THEN
        RETURN;
    END IF;

    -- Extract filter parameters
    v_max_wait := (v_filter_rules->'open_door'->>'max_wait_minutes')::INTEGER;
    v_max_friction := (v_filter_rules->'open_door'->>'max_friction')::INTEGER;

    -- Get current friction score for this hub
    SELECT friction_score INTO v_friction_score
    FROM friction_inputs WHERE hub_id = p_hub_id;

    -- Return venues matching Open Door criteria
    -- Per DOMAIN_RULES.md Section 5
    RETURN QUERY
    SELECT v.*
    FROM venues v
    WHERE v.hub_id = p_hub_id
      AND v.current_wait_minutes < v_max_wait
      AND (v_friction_score IS NULL OR v_friction_score < v_max_friction)
      AND v.is_private_event = FALSE
      AND v.state_confidence IN ('live', 'recent');
END;
$$;

-- ============================================================================
-- FUNCTIONS: Hub Manifest
-- Per ARCHITECTURE_OFFLINE.md Phase A
-- ============================================================================

-- Function to get complete hub manifest for offline sync
CREATE OR REPLACE FUNCTION get_hub_manifest(p_hub_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_hub RECORD;
    v_result JSONB;
BEGIN
    -- Get hub
    SELECT * INTO v_hub FROM hubs WHERE hub_id = p_hub_id;

    IF v_hub IS NULL THEN
        RETURN NULL;
    END IF;

    -- Build manifest
    v_result := jsonb_build_object(
        'hub_id', v_hub.hub_id,
        'manifest_version', v_hub.manifest_version,
        'filter_rules_version', v_hub.filter_rules_version,
        'filter_rules', v_hub.filter_rules,
        'venues', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'venue_id', venue_id,
                'name', name,
                'coordinates', jsonb_build_object(
                    'lat', ST_Y(location::geometry),
                    'lng', ST_X(location::geometry)
                ),
                'base_popularity_score', base_popularity_score,
                'historical_wait_avg', historical_wait_avg,
                'is_anchor', is_anchor,
                'ad_boost', ad_boost,
                'scheduled_closures', scheduled_closures,
                'last_known_state_id', last_known_state_id,
                'state_timestamp', state_timestamp,
                'state_confidence', state_confidence
            )), '[]'::jsonb)
            FROM venues WHERE hub_id = v_hub.id
        ),
        'zones', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'zone_id', zone_id,
                'name', name,
                'polygon', ST_AsGeoJSON(polygon)::jsonb,
                'zone_type', zone_type
            )), '[]'::jsonb)
            FROM zones WHERE hub_id = v_hub.id
        ),
        'navigation_graph', jsonb_build_object(
            'nodes', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'node_id', node_id,
                    'coordinates', jsonb_build_object(
                        'lat', ST_Y(location::geometry),
                        'lng', ST_X(location::geometry)
                    ),
                    'node_type', node_type
                )), '[]'::jsonb)
                FROM navigation_nodes WHERE hub_id = v_hub.id
            ),
            'edges', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'from_node_id', nn_from.node_id,
                    'to_node_id', nn_to.node_id,
                    'distance', ne.distance_meters,
                    'is_walkable', ne.is_walkable
                )), '[]'::jsonb)
                FROM navigation_edges ne
                JOIN navigation_nodes nn_from ON ne.from_node_id = nn_from.id
                JOIN navigation_nodes nn_to ON ne.to_node_id = nn_to.id
                WHERE ne.hub_id = v_hub.id
            )
        )
    );

    RETURN v_result;
END;
$$;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metros_updated_at
    BEFORE UPDATE ON metros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_hubs_updated_at
    BEFORE UPDATE ON hubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_zones_updated_at
    BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA: Tampa Bay / Water Street (Instance 001)
-- Per CLAUDE.md: "Tampa (Water Street) is just Instance 001"
-- ============================================================================

-- Insert Tampa Bay metro
INSERT INTO metros (id, name, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Tampa Bay',
    'America/New_York'
);

-- Insert Water Street hub with approximate geofence
INSERT INTO hubs (id, hub_id, metro_id, name, geofence, manifest_version, filter_rules_version)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'water-street',
    '00000000-0000-0000-0000-000000000001',
    'Water Street Tampa',
    ST_GeomFromText('POLYGON((-82.4575 27.9425, -82.4525 27.9425, -82.4525 27.9375, -82.4575 27.9375, -82.4575 27.9425))', 4326),
    '2024.1.0',
    '1.0.0'
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE metros IS 'Top-level geographic container (e.g., Tampa Bay)';
COMMENT ON TABLE hubs IS 'Nightlife district container with geofence polygon';
COMMENT ON TABLE venues IS 'Individual venues with real-time state tracking';
COMMENT ON TABLE zones IS 'Sub-regions within a hub for categorization';
COMMENT ON TABLE navigation_nodes IS 'Graph nodes for offline pathfinding';
COMMENT ON TABLE navigation_edges IS 'Graph edges for offline pathfinding';
COMMENT ON TABLE scheduled_closures IS 'Venue closure schedules';
COMMENT ON TABLE friction_inputs IS 'Cached friction score calculation inputs';

COMMENT ON COLUMN venues.state_confidence IS 'Data freshness: live (<5m), recent (5-30m), stale (30-60m), historical (>60m)';
COMMENT ON COLUMN venues.last_known_state_id IS 'Venue state: 0=Closed, 1=Quiet, 2=Social, 3=Party';
COMMENT ON COLUMN hubs.filter_rules_version IS 'SemVer for client/server filter rule drift detection';
