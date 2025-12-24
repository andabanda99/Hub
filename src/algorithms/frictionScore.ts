/**
 * Friction Score Algorithm (4-Factor Version)
 * Per DOMAIN_RULES.md Section 1
 *
 * Purpose: Quantify the "Pain of Entry" for a user trying to reach a venue.
 * Now supports per-venue friction with foot traffic as primary signal.
 */

import type { FrictionInputs, FrictionFactors } from '../types';

// Weight configuration - 4 factors with normalized weights
const WEIGHTS = {
  uber: 0.15,    // Quaternary - demand signal
  traffic: 0.25, // Secondary - road congestion
  foot: 0.4,     // Primary - direct congestion measure
  garage: 0.2,   // Tertiary - parking difficulty
} as const;

// Confidence penalty weights (when foot traffic is unavailable)
const DEGRADED_WEIGHTS = {
  uber: 0.20,    // +0.05
  traffic: 0.35, // +0.10
  foot: 0.05,    // -0.35 (degraded)
  garage: 0.40,  // +0.20
} as const;

const TOTAL_WEIGHT = 1.0; // Already normalized

/**
 * Normalize Uber surge from raw value (1.0x - 5.0x) to 0-100
 */
export function normalizeUberSurge(surge: number): number {
  // Formula: (surge - 1.0) / 4.0 * 100
  const normalized = ((surge - 1.0) / 4.0) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Normalize traffic flow from raw value to 0-100
 * @param flow Current traffic flow value
 * @param historicalMax The historical maximum for this location/time
 */
export function normalizeTrafficFlow(flow: number, historicalMax: number): number {
  if (historicalMax <= 0) return 0;
  const normalized = (flow / historicalMax) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Normalize foot traffic from raw pedestrian count to 0-100
 * @param count Current foot traffic count
 * @param historicalMax The historical maximum for this location/time
 */
export function normalizeFootTraffic(count: number, historicalMax: number): number {
  if (historicalMax <= 0) return 0;
  const normalized = (count / historicalMax) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Garage occupancy is already 0-100%, no normalization needed
 */
export function normalizeGarageOccupancy(occupancy: number): number {
  return Math.max(0, Math.min(100, occupancy));
}

interface NormalizedInputs {
  uber: number | null;
  traffic: number | null;
  foot: number | null;
  garage: number | null;
}

/**
 * Determine which weight configuration to use based on data availability
 * With normalized weights (sum=1.0), we use confidence penalty when primary source is down
 */
function selectWeights(inputs: NormalizedInputs): typeof WEIGHTS | typeof DEGRADED_WEIGHTS {
  // If foot traffic (primary source) is unavailable, use degraded weights
  if (inputs.foot === null) {
    return DEGRADED_WEIGHTS;
  }
  return WEIGHTS;
}

export interface FrictionScoreResult {
  score: number | null;
  rawFactors: FrictionFactors | null;
  isDegraded: boolean;
  activeSourceCount: number;
}

/**
 * Calculate the Friction Score with graceful degradation
 *
 * @param inputs Raw input values from APIs
 * @param trafficHistoricalMax Historical max for traffic normalization
 * @param footHistoricalMax Historical max for foot traffic normalization
 * @returns Friction score (0-100) or null if total blackout
 */
export function calculateFrictionScore(
  inputs: FrictionInputs,
  trafficHistoricalMax: number,
  footHistoricalMax: number
): FrictionScoreResult {
  // Normalize inputs
  const normalized: NormalizedInputs = {
    uber: inputs.uberSurge !== null ? normalizeUberSurge(inputs.uberSurge) : null,
    traffic: inputs.trafficFlow !== null
      ? normalizeTrafficFlow(inputs.trafficFlow, trafficHistoricalMax)
      : null,
    foot: inputs.footTrafficCount !== null
      ? normalizeFootTraffic(inputs.footTrafficCount, footHistoricalMax)
      : null,
    garage: inputs.garageOccupancy !== null
      ? normalizeGarageOccupancy(inputs.garageOccupancy)
      : null,
  };

  const activeSourceCount = [
    normalized.uber !== null,
    normalized.traffic !== null,
    normalized.foot !== null,
    normalized.garage !== null,
  ].filter(Boolean).length;

  // Total blackout - all sources down
  if (activeSourceCount === 0) {
    return {
      score: null,
      rawFactors: null,
      isDegraded: false,
      activeSourceCount: 0,
    };
  }

  // Select weights based on primary source availability
  const weights = selectWeights(normalized);
  const isDegraded = inputs.footTrafficCount === null;

  // Calculate weighted friction score
  const frictionScore =
    (normalized.uber ?? 0) * weights.uber +
    (normalized.traffic ?? 0) * weights.traffic +
    (normalized.foot ?? 0) * weights.foot +
    (normalized.garage ?? 0) * weights.garage;

  // Store raw normalized factors for UI breakdown
  const rawFactors: FrictionFactors = {
    uber: normalized.uber ?? 0,
    traffic: normalized.traffic ?? 0,
    foot: normalized.foot ?? 0,
    garage: normalized.garage ?? 0,
  };

  return {
    score: Math.round(frictionScore * 10) / 10, // Round to 1 decimal
    rawFactors,
    isDegraded,
    activeSourceCount,
  };
}

/**
 * Check if a venue passes the Open Door friction threshold
 * Per DOMAIN_RULES.md Section 5: Friction_Score < 80
 */
export function passesOpenDoorFrictionThreshold(
  frictionScore: number | null,
  maxFriction: number = 80
): boolean {
  if (frictionScore === null) return false;
  return frictionScore < maxFriction;
}
