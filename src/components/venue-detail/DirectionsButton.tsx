/**
 * Directions Button Component
 *
 * Opens Apple Maps with venue coordinates for walking directions.
 * Falls back to Google Maps on Android or if Apple Maps fails.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Coordinates } from '../../types/domain';

interface DirectionsButtonProps {
  coordinates: Coordinates;
  venueName: string;
}

export function DirectionsButton({ coordinates, venueName }: DirectionsButtonProps) {
  const openDirections = async () => {
    const { lat, lng } = coordinates;

    // Try Apple Maps first (works on iOS)
    const appleMapsUrl = `maps://?daddr=${lat},${lng}&dirflg=w`;

    try {
      const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);

      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapsUrl);
      } else {
        // Fallback to Google Maps (works on Android and web)
        const googleMapsUrl = `https://maps.google.com/?daddr=${lat},${lng}`;
        await Linking.openURL(googleMapsUrl);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not open maps. Please check your device settings.'
      );
      console.error('Error opening maps:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={openDirections}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>📍</Text>
      <Text style={styles.label}>Get Directions</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
  },
});
