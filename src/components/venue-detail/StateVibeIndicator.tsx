/**
 * State Vibe Indicator Component
 *
 * Displays venue state (Closed, Quiet, Social, Party) with color-coded badge.
 * Follows "Ambient Presence" principle - use color to communicate vibe.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VenueStateId } from '../../types/domain';

interface StateVibeIndicatorProps {
  stateId: VenueStateId;
}

const STATE_CONFIG = {
  0: { label: 'Closed', color: '#2a2a2a', textColor: '#888' },      // Dark gray
  1: { label: 'Quiet', color: '#4A90E2', textColor: '#fff' },       // Blue
  2: { label: 'Social', color: '#7ED321', textColor: '#000' },      // Green
  3: { label: 'Party', color: '#FFD700', textColor: '#000' },       // Gold
} as const;

export function StateVibeIndicator({ stateId }: StateVibeIndicatorProps) {
  const config = STATE_CONFIG[stateId];

  return (
    <View style={[styles.container, { backgroundColor: config.color }]}>
      <Text style={[styles.label, { color: config.textColor }]}>
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
