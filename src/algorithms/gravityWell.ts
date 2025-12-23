/**
 * Gravity Well Algorithm
 * Per DOMAIN_RULES.md Section 2
 *
 * Purpose: Calculate the effective "Pull" radius of a venue on the 3D Map.
 */

// Constraints per DOMAIN_RULES.md
const CONSTRAINTS = {
  BASE_RADIUS: 100, // meters - default visibility for all venues
  MAX_RADIUS: 200, // meters - prevents district domination
  MIN_RADIUS: 80, // meters - non-paying venues minimum visibility
  AD_BOOST_MAX: 40, // capped to prevent exceeding max radius
  MULTIPLIER: 2.5, // meters per boost point
  ANCHOR_BONUS: 1.2, // +20% base radius for anchor venues
} as const;

export interface GravityWellResult {
  effectiveRadius: number;
  baseRadius: number;
  boostContribution: number;
  wasCapped: boolean;
}

/**
 * Calculate the effective visibility radius for a venue
 *
 * Formula: Effective_Radius = min(Base_Radius + (Ad_Boost * Multiplier), Max_Radius)
 *
 * @param adBoost The venue's paid boost level (0-40)
 * @param isAnchor Whether this is an anchor venue (Sparkman, Predalina, etc.)
 */
export function calculateEffectiveRadius(
  adBoost: number,
  isAnchor: boolean = false
): GravityWellResult {
  // Cap ad boost to max allowed
  const cappedBoost = Math.min(Math.max(0, adBoost), CONSTRAINTS.AD_BOOST_MAX);

  // Calculate base radius (anchor venues get +20%)
  const baseRadius = isAnchor
    ? CONSTRAINTS.BASE_RADIUS * CONSTRAINTS.ANCHOR_BONUS
    : CONSTRAINTS.BASE_RADIUS;

  // Calculate boost contribution
  const boostContribution = cappedBoost * CONSTRAINTS.MULTIPLIER;

  // Calculate uncapped radius
  const uncappedRadius = baseRadius + boostContribution;

  // Apply max cap
  const effectiveRadius = Math.min(uncappedRadius, CONSTRAINTS.MAX_RADIUS);

  // Ensure minimum visibility for non-paying venues
  const finalRadius = Math.max(effectiveRadius, CONSTRAINTS.MIN_RADIUS);

  return {
    effectiveRadius: finalRadius,
    baseRadius,
    boostContribution,
    wasCapped: uncappedRadius > CONSTRAINTS.MAX_RADIUS,
  };
}

export interface OverlapResult {
  venue1Radius: number;
  venue2Radius: number;
  overlapPercentage: number;
  wasReduced: boolean;
}

/**
 * Check and reduce overlapping venue radii
 * Per DOMAIN_RULES.md: If two venue radii overlap > 50%, reduce both proportionally
 *
 * @param venue1Radius First venue's effective radius
 * @param venue2Radius Second venue's effective radius
 * @param distance Distance between venue centers in meters
 */
export function resolveRadiusOverlap(
  venue1Radius: number,
  venue2Radius: number,
  distance: number
): OverlapResult {
  const totalRadii = venue1Radius + venue2Radius;

  // No overlap if distance >= sum of radii
  if (distance >= totalRadii) {
    return {
      venue1Radius,
      venue2Radius,
      overlapPercentage: 0,
      wasReduced: false,
    };
  }

  // Calculate overlap
  const overlap = totalRadii - distance;
  const smallerRadius = Math.min(venue1Radius, venue2Radius);
  const overlapPercentage = (overlap / (smallerRadius * 2)) * 100;

  // Only reduce if overlap > 50%
  if (overlapPercentage <= 50) {
    return {
      venue1Radius,
      venue2Radius,
      overlapPercentage,
      wasReduced: false,
    };
  }

  // Reduce both proportionally to achieve exactly 50% overlap
  // Target: overlap / (smallerRadius * 2) = 0.5
  // So new overlap should be: smallerRadius * 2 * 0.5 = smallerRadius
  const targetOverlap = smallerRadius;
  const reductionNeeded = overlap - targetOverlap;

  // Distribute reduction proportionally
  const ratio1 = venue1Radius / totalRadii;
  const ratio2 = venue2Radius / totalRadii;

  const newVenue1Radius = Math.max(
    CONSTRAINTS.MIN_RADIUS,
    venue1Radius - reductionNeeded * ratio1
  );
  const newVenue2Radius = Math.max(
    CONSTRAINTS.MIN_RADIUS,
    venue2Radius - reductionNeeded * ratio2
  );

  return {
    venue1Radius: newVenue1Radius,
    venue2Radius: newVenue2Radius,
    overlapPercentage,
    wasReduced: true,
  };
}

/**
 * Get the glow intensity based on friction score
 * Per CLAUDE.md: High Friction (>80) = Red, Low Friction (<30) = Gold/Green
 */
export function getGlowColor(frictionScore: number | null): string {
  if (frictionScore === null) {
    return '#808080'; // Grey for unknown
  }

  if (frictionScore >= 80) {
    return '#FF4444'; // Red - high friction
  }

  if (frictionScore < 30) {
    return '#FFD700'; // Gold - low friction (open door)
  }

  // Gradient between gold and red for 30-80
  const ratio = (frictionScore - 30) / 50;
  const r = Math.round(255);
  const g = Math.round(215 - ratio * 147); // 215 (gold) to 68 (red-ish)
  const b = Math.round(0 + ratio * 68);

  return `rgb(${r}, ${g}, ${b})`;
}
