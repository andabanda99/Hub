/**
 * HubMap Component
 *
 * Main map component for The Hub.
 * Renders Water Street Tampa with venue glow effects.
 *
 * Per CLAUDE.md: Custom "Midnight" Style, 3D buildings, ambient presence.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox, { MapView, Camera } from '@rnmapbox/maps';
import { ENV } from '../../config/env';
import { VenueGlowLayer } from './VenueGlowLayer';
import { useVenueGeoJSON } from './useVenueGeoJSON';
import { MAP_STYLES, WATER_STREET_CAMERA } from './mapStyles';
import { ZOOM_LEVELS } from './types';
import type { HubMapProps } from './types';

// Initialize Mapbox with access token
// IMPORTANT: This must be called before any Mapbox component renders
if (ENV.MAPBOX_ACCESS_TOKEN) {
  Mapbox.setAccessToken(ENV.MAPBOX_ACCESS_TOKEN);
}

/**
 * HubMap - The visual heart of The Hub
 *
 * Renders the Water Street Tampa district with:
 * - Dark "Midnight" theme for nightlife aesthetic
 * - Venue glow markers with Gravity Well radius
 * - Open Door filter support (ghost mode for non-passing venues)
 * - 3D tilted view for building context
 */
export function HubMap({ isOpenDoorMode, onVenuePress }: HubMapProps) {
  // Transform venues to GeoJSON with glow properties
  const venueGeoJSON = useVenueGeoJSON(isOpenDoorMode);

  // Handle venue marker press
  const handlePress = useCallback(
    (event: { features?: Array<{ properties?: { venueId?: string } }> }) => {
      const feature = event.features?.[0];
      const venueId = feature?.properties?.venueId;
      if (venueId && onVenuePress) {
        onVenuePress(venueId);
      }
    },
    [onVenuePress]
  );

  // Warn if no access token
  if (!ENV.MAPBOX_ACCESS_TOKEN) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          {/* Text would go here but keeping it minimal per design */}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={MAP_STYLES.MIDNIGHT}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={true}
        scaleBarEnabled={false}
      >
        {/* Camera centered on Water Street Tampa */}
        <Camera
          defaultSettings={{
            centerCoordinate: WATER_STREET_CAMERA.centerCoordinate,
            zoomLevel: WATER_STREET_CAMERA.zoomLevel,
            pitch: WATER_STREET_CAMERA.pitch,
            heading: WATER_STREET_CAMERA.heading,
          }}
          minZoomLevel={ZOOM_LEVELS.SHOW_MARKERS}
          maxZoomLevel={ZOOM_LEVELS.MAX}
        />

        {/* Venue glow markers */}
        <VenueGlowLayer
          venues={venueGeoJSON}
          isOpenDoorMode={isOpenDoorMode}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HubMap;
