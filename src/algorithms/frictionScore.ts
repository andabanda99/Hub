/**
 * Friction Score Algorithm
 * Per DOMAIN_RULES.md Section 1
 *
 * Purpose: Quantify the "Pain of Entry" for a user trying to reach a Hub.
 */

import type { FrictionInputs } from '../types';

// Weight configuration per DOMAIN_RULES.md
const WEIGHTS = {
  uber: 1.5,
  traffic: 1.2,
  garage: 1.0,
} as const;

const TOTAL_WEIGHT = WEIGHTS.uber + WEIGHTS.traffic + WEIGHTS.garage; // 3.7

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
 * Garage occupancy is already 0-100%, no normalization needed
 */
export function normalizeGarageOccupancy(occupancy: number): number {
  return Math.max(0, Math.min(100, occupancy));
}

interface NormalizedInputs {
  uber: number | null;
  traffic: number | null;
  garage: number | null;
}

interface WeightScenario {
  uber: number;
  traffic: number;
  garage: number;
  divisor: number;
}

/**
 * Get the weight scenario based on which APIs are available
 * Per DOMAIN_RULES.md Fallback Waterfall table
 */
function getWeightScenario(inputs: NormalizedInputs): WeightScenario | null {
  const uberUp = inputs.uber !== null;
  const trafficUp = inputs.traffic !== null;
  const garageUp = inputs.garage !== null;

  const activeCount = [uberUp, trafficUp, garageUp].filter(Boolean).length;

  // Total Blackout - return null
  if (activeCount === 0) {
    return null;
  }

  // All systems go
  if (uberUp && trafficUp && garageUp) {
    return { uber: 1.5, traffic: 1.2, garage: 1.0, divisor: 3.7 };
  }

  // Single source down scenarios
  if (!uberUp && trafficUp && garageUp) {
    // Uber Down
    return { uber: 0, traffic: 1.8, garage: 1.35, divisor: 3.15 };
  }

  if (uberUp && !trafficUp && garageUp) {
    // Traffic Down
    return { uber: 2.25, traffic: 0, garage: 1.5, divisor: 3.75 };
  }

  if (uberUp && trafficUp && !garageUp) {
    // Garage Down
    return { uber: 1.85, traffic: 1.48, garage: 0, divisor: 3.33 };
  }

  // Two sources down - use remaining source × 3.7
  if (activeCount === 1) {
    if (uberUp) {
      return { uber: 3.7, traffic: 0, garage: 0, divisor: 3.7 };
    }
    if (trafficUp) {
      return { uber: 0, traffic: 3.7, garage: 0, divisor: 3.7 };
    }
    if (garageUp) {
      return { uber: 0, traffic: 0, garage: 3.7, divisor: 3.7 };
    }
  }

  // Fallback for any edge case
  return null;
}

export interface FrictionScoreResult {
  score: number | null;
  scenario: 'all_up' | 'uber_down' | 'traffic_down' | 'garage_down' | 'two_down' | 'blackout';
  activeSourceCount: number;
}

/**
 * Calculate the Friction Score with graceful degradation
 *
 * @param inputs Raw input values from APIs
 * @param trafficHistoricalMax Historical max for traffic normalization
 * @returns Friction score (0-100) or null if total blackout
 */
export function calculateFrictionScore(
  inputs: FrictionInputs,
  trafficHistoricalMax: number
): FrictionScoreResult {
  // Normalize inputs
  const normalized: NormalizedInputs = {
    uber: inputs.uberSurge !== null ? normalizeUberSurge(inputs.uberSurge) : null,
    traffic: inputs.trafficFlow !== null
      ? normalizeTrafficFlow(inputs.trafficFlow, trafficHistoricalMax)
      : null,
    garage: inputs.garageOccupancy !== null
      ? normalizeGarageOccupancy(inputs.garageOccupancy)
      : null,
  };

  const activeSourceCount = [
    normalized.uber !== null,
    normalized.traffic !== null,
    normalized.garage !== null,
  ].filter(Boolean).length;

  // Get weight scenario
  const scenario = getWeightScenario(normalized);

  if (scenario === null) {
    return {
      score: null,
      scenario: 'blackout',
      activeSourceCount: 0,
    };
  }

  // Calculate raw score
  const rawScore =
    (normalized.uber ?? 0) * scenario.uber +
    (normalized.traffic ?? 0) * scenario.traffic +
    (normalized.garage ?? 0) * scenario.garage;

  // Divide by weight sum to get 0-100 output
  const frictionScore = rawScore / scenario.divisor;

  // Determine scenario name
  let scenarioName: FrictionScoreResult['scenario'];
  if (activeSourceCount === 3) {
    scenarioName = 'all_up';
  } else if (activeSourceCount === 1) {
    scenarioName = 'two_down';
  } else if (normalized.uber === null) {
    scenarioName = 'uber_down';
  } else if (normalized.traffic === null) {
    scenarioName = 'traffic_down';
  } else {
    scenarioName = 'garage_down';
  }

  return {
    score: Math.round(frictionScore * 10) / 10, // Round to 1 decimal
    scenario: scenarioName,
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
