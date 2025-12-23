/**
 * State Confidence Algorithm
 * Per DOMAIN_RULES.md Section 4
 *
 * Purpose: Define how data freshness affects feature availability,
 * especially for offline scenarios.
 */

import type { StateConfidence } from '../types';

// Thresholds in milliseconds
const THRESHOLDS = {
  LIVE: 5 * 60 * 1000, // < 5 min
  RECENT: 30 * 60 * 1000, // 5-30 min
  STALE: 60 * 60 * 1000, // 30-60 min
  // > 60 min = historical
} as const;

/**
 * Determine state confidence based on data age
 *
 * | Confidence Level | Data Age   | Open Door Eligible |
 * |------------------|------------|-------------------|
 * | `live`           | < 5 min    | Yes               |
 * | `recent`         | 5-30 min   | Yes               |
 * | `stale`          | 30-60 min  | No                |
 * | `historical`     | > 60 min   | No                |
 */
export function calculateStateConfidence(
  stateTimestamp: number,
  currentTime: number = Date.now()
): StateConfidence {
  const age = currentTime - stateTimestamp;

  if (age < THRESHOLDS.LIVE) {
    return 'live';
  }

  if (age < THRESHOLDS.RECENT) {
    return 'recent';
  }

  if (age < THRESHOLDS.STALE) {
    return 'stale';
  }

  return 'historical';
}

/**
 * Check if a confidence level is eligible for Open Door filter
 * Per DOMAIN_RULES.md: Only 'live' and 'recent' are eligible
 */
export function isOpenDoorEligible(
  confidence: StateConfidence,
  allowedConfidence: StateConfidence[] = ['live', 'recent']
): boolean {
  return allowedConfidence.includes(confidence);
}

/**
 * Get UI treatment for a confidence level
 */
export interface ConfidenceUITreatment {
  prefix: string;
  suffix: string;
  opacity: number;
  showPredictedLabel: boolean;
}

export function getConfidenceUITreatment(
  confidence: StateConfidence
): ConfidenceUITreatment {
  switch (confidence) {
    case 'live':
      return {
        prefix: '',
        suffix: '',
        opacity: 1.0,
        showPredictedLabel: false,
      };

    case 'recent':
      // Show "~" prefix on wait times
      return {
        prefix: '~',
        suffix: '',
        opacity: 0.9,
        showPredictedLabel: false,
      };

    case 'stale':
      return {
        prefix: '',
        suffix: '', // Caller should add "Last updated X min ago"
        opacity: 0.7,
        showPredictedLabel: false,
      };

    case 'historical':
      return {
        prefix: '',
        suffix: '',
        opacity: 0.5,
        showPredictedLabel: true, // Show "Predicted" label, grey tint
      };
  }
}

/**
 * Format the staleness message for UI
 */
export function formatStalenessMessage(
  stateTimestamp: number,
  currentTime: number = Date.now()
): string | null {
  const confidence = calculateStateConfidence(stateTimestamp, currentTime);

  if (confidence === 'live' || confidence === 'recent') {
    return null;
  }

  const ageMinutes = Math.floor((currentTime - stateTimestamp) / (60 * 1000));

  if (confidence === 'stale') {
    return `Last updated ${ageMinutes} min ago`;
  }

  // historical
  if (ageMinutes < 120) {
    return `Predicted (${ageMinutes} min old)`;
  }

  const ageHours = Math.floor(ageMinutes / 60);
  return `Predicted (${ageHours}h old)`;
}
