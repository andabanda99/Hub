-- Migration: Add per-venue friction tracking
-- Date: 2024-12-24
-- Purpose: Store calculated friction scores and raw factor breakdown for each venue

-- Add friction score columns to venues table
ALTER TABLE public.venues
ADD COLUMN score_friction REAL CHECK (score_friction >= 0 AND score_friction <= 100),
ADD COLUMN raw_uber_factor REAL CHECK (raw_uber_factor >= 0 AND raw_uber_factor <= 100),
ADD COLUMN raw_traffic_factor REAL CHECK (raw_traffic_factor >= 0 AND raw_traffic_factor <= 100),
ADD COLUMN raw_foot_factor REAL CHECK (raw_foot_factor >= 0 AND raw_foot_factor <= 100),
ADD COLUMN raw_garage_factor REAL CHECK (raw_garage_factor >= 0 AND raw_garage_factor <= 100),
ADD COLUMN is_degraded_mode BOOLEAN DEFAULT false,
ADD COLUMN friction_calculated_at TIMESTAMPTZ;

-- Add index for friction filtering
CREATE INDEX idx_venues_friction ON public.venues(score_friction);

-- Add index for degraded mode queries
CREATE INDEX idx_venues_degraded ON public.venues(is_degraded_mode) WHERE is_degraded_mode = true;

-- Add comment explaining the columns
COMMENT ON COLUMN public.venues.score_friction IS 'Calculated friction score (0-100) using 4-factor algorithm';
COMMENT ON COLUMN public.venues.raw_uber_factor IS 'Normalized Uber surge factor (0-100) for UI breakdown';
COMMENT ON COLUMN public.venues.raw_traffic_factor IS 'Normalized traffic flow factor (0-100) for UI breakdown';
COMMENT ON COLUMN public.venues.raw_foot_factor IS 'Normalized foot traffic factor (0-100) for UI breakdown';
COMMENT ON COLUMN public.venues.raw_garage_factor IS 'Normalized garage occupancy factor (0-100) for UI breakdown';
COMMENT ON COLUMN public.venues.is_degraded_mode IS 'True if friction score was calculated without primary source (foot traffic)';
COMMENT ON COLUMN public.venues.friction_calculated_at IS 'Timestamp of last friction calculation';
