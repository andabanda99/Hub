/**
 * Open Door Badge Component
 *
 * Shows gold "🚪 Open Door" badge if venue passes Open Door filter.
 * Only renders if venue is eligible.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OpenDoorBadgeProps {
  isOpenDoor: boolean;
}

export function OpenDoorBadge({ isOpenDoor }: OpenDoorBadgeProps) {
  if (!isOpenDoor) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚪</Text>
      <Text style={styles.label}>Open Door</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '700',
  },
});
