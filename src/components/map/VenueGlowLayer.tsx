/**
 * VenueGlowLayer Component
 *
 * Renders venue markers with Gravity Well glow effects using Mapbox CircleLayer.
 * Per CLAUDE.md: Use light and color to communicate "Vibe"
 */

import React from 'react';
import { ShapeSource, CircleLayer } from '@rnmapbox/maps';
import type { VenueGlowLayerProps } from './types';
import { GLOW_STYLE, createRadiusExpression } from './mapStyles';

/**
 * VenueGlowLayer renders the visual representation of venues on the map
 *
 * Uses 3 overlapping CircleLayers to create a glow effect:
 * 1. Outer glow - large, blurred, low opacity
 * 2. Mid glow - medium, moderately blurred
 * 3. Core - small, solid center point
 */
export function VenueGlowLayer({ venues, isOpenDoorMode }: VenueGlowLayerProps) {
  return (
    <ShapeSource id="venues" shape={venues}>
      {/* Outer Glow Layer - most diffuse */}
      <CircleLayer
        id="venue-glow-outer"
        style={{
          circleRadius: [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, ['*', ['get', 'effectiveRadius'], 0.02 * GLOW_STYLE.OUTER.radiusMultiplier],
            15, ['*', ['get', 'effectiveRadius'], 0.08 * GLOW_STYLE.OUTER.radiusMultiplier],
            17, ['*', ['get', 'effectiveRadius'], 0.32 * GLOW_STYLE.OUTER.radiusMultiplier],
            19, ['*', ['get', 'effectiveRadius'], 1.28 * GLOW_STYLE.OUTER.radiusMultiplier],
          ],
          circleColor: ['get', 'glowColor'],
          circleBlur: GLOW_STYLE.OUTER.blur,
          circleOpacity: [
            '*',
            GLOW_STYLE.OUTER.opacity,
            ['get', 'opacity'],
          ],
        }}
      />

      {/* Mid Glow Layer */}
      <CircleLayer
        id="venue-glow-mid"
        style={{
          circleRadius: [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, ['*', ['get', 'effectiveRadius'], 0.02 * GLOW_STYLE.MID.radiusMultiplier],
            15, ['*', ['get', 'effectiveRadius'], 0.08 * GLOW_STYLE.MID.radiusMultiplier],
            17, ['*', ['get', 'effectiveRadius'], 0.32 * GLOW_STYLE.MID.radiusMultiplier],
            19, ['*', ['get', 'effectiveRadius'], 1.28 * GLOW_STYLE.MID.radiusMultiplier],
          ],
          circleColor: ['get', 'glowColor'],
          circleBlur: GLOW_STYLE.MID.blur,
          circleOpacity: [
            '*',
            GLOW_STYLE.MID.opacity,
            ['get', 'opacity'],
          ],
        }}
      />

      {/* Core Marker - solid center */}
      <CircleLayer
        id="venue-core"
        style={{
          circleRadius: [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 4,
            15, 8,
            17, 16,
            19, 24,
          ],
          circleColor: ['get', 'glowColor'],
          circleBlur: GLOW_STYLE.CORE.blur,
          circleOpacity: [
            '*',
            GLOW_STYLE.CORE.opacity,
            ['get', 'opacity'],
          ],
          // Add a subtle stroke for better visibility
          circleStrokeWidth: 2,
          circleStrokeColor: '#ffffff',
          circleStrokeOpacity: [
            '*',
            0.5,
            ['get', 'opacity'],
          ],
        }}
      />
    </ShapeSource>
  );
}

export default VenueGlowLayer;
