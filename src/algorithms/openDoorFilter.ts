/**
 * Open Door Filter Algorithm
 * Per DOMAIN_RULES.md Section 5 and CLAUDE.md Section 4.B
 *
 * Purpose: Filter venues to show only those with immediate access.
 * SECURITY: Server-side filtering is authoritative. This is the client fallback.
 */

import type { Venue, FilterRules, StateConfidence } from '../types';
import { isOpenDoorEligible } from './stateConfidence';

/**
 * Default filter rules (should be overridden by server-provided rules)
 */
export const DEFAULT_FILTER_RULES: FilterRules = {
  openDoor: {
    maxWaitMinutes: 15,
    maxFriction: 80,
    allowedConfidence: ['live', 'recent'],
  },
};

export interface OpenDoorCheckResult {
  isOpen: boolean;
  failedReason: OpenDoorFailReason | null;
}

export type OpenDoorFailReason =
  | 'wait_time_exceeded'
  | 'friction_exceeded'
  | 'private_event'
  | 'stale_data'
  | 'unknown_state';

/**
 * Check if a venue passes the Open Door filter
 *
 * Per DOMAIN_RULES.md Section 5:
 * A venue is "Open" if ALL conditions are met:
 * 1. Wait_Time < 15 minutes
 * 2. AND Friction_Score < 80
 * 3. AND Status != "Private Event"
 * 4. AND State_Confidence IN ('live', 'recent')
 */
export function checkOpenDoor(
  venue: {
    waitTime: number; // in minutes
    frictionScore: number | null;
    isPrivateEvent: boolean;
    stateConfidence: StateConfidence;
  },
  rules: FilterRules['openDoor'] = DEFAULT_FILTER_RULES.openDoor
): OpenDoorCheckResult {
  // Check friction score first (handles null case)
  if (venue.frictionScore === null) {
    return { isOpen: false, failedReason: 'unknown_state' };
  }

  // Check state confidence
  if (!isOpenDoorEligible(venue.stateConfidence, rules.allowedConfidence)) {
    return { isOpen: false, failedReason: 'stale_data' };
  }

  // Check private event
  if (venue.isPrivateEvent) {
    return { isOpen: false, failedReason: 'private_event' };
  }

  // Check wait time
  if (venue.waitTime >= rules.maxWaitMinutes) {
    return { isOpen: false, failedReason: 'wait_time_exceeded' };
  }

  // Check friction
  if (venue.frictionScore >= rules.maxFriction) {
    return { isOpen: false, failedReason: 'friction_exceeded' };
  }

  return { isOpen: true, failedReason: null };
}

/**
 * Filter a list of venues using Open Door rules
 * Returns venues that pass all checks
 */
export function filterOpenDoorVenues(
  venues: Array<{
    venue: Venue;
    waitTime: number;
    frictionScore: number | null;
    isPrivateEvent: boolean;
  }>,
  rules: FilterRules['openDoor'] = DEFAULT_FILTER_RULES.openDoor
): Venue[] {
  return venues
    .filter(({ venue, waitTime, frictionScore, isPrivateEvent }) => {
      const result = checkOpenDoor(
        {
          waitTime,
          frictionScore,
          isPrivateEvent,
          stateConfidence: venue.stateConfidence,
        },
        rules
      );
      return result.isOpen;
    })
    .map(({ venue }) => venue);
}

/**
 * Get the UI opacity for a venue based on Open Door status
 * Per CLAUDE.md Section 4.B: Set 3D Object Opacity to 0.3 (Ghost Mode) for non-open venues
 */
export function getVenueOpacity(isOpenDoor: boolean, isOpenDoorMode: boolean): number {
  if (!isOpenDoorMode) {
    return 1.0; // Normal mode - all venues visible
  }

  return isOpenDoor ? 1.0 : 0.3; // Ghost mode for non-open venues
}

/**
 * Get human-readable reason for why a venue failed Open Door check
 */
export function getFailReasonMessage(reason: OpenDoorFailReason | null): string | null {
  if (reason === null) return null;

  switch (reason) {
    case 'wait_time_exceeded':
      return 'Wait time too long';
    case 'friction_exceeded':
      return 'High friction area';
    case 'private_event':
      return 'Private event';
    case 'stale_data':
      return 'Data too old';
    case 'unknown_state':
      return 'Status unknown';
  }
}
