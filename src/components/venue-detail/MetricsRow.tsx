/**
 * Metrics Row Component
 *
 * Displays wait time and distance with separator.
 * Horizontal layout, gray text on dark background.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricsRowProps {
  waitMinutes: number;
  distanceMeters: number;
}

export function MetricsRow({ waitMinutes, distanceMeters }: MetricsRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.metric}>
        <Text style={styles.label}>Wait</Text>
        <Text style={styles.value}>{waitMinutes} min</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.metric}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{distanceMeters} m</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginVertical: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
});
