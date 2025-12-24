/**
 * Friction Meter Component
 *
 * Visual bar showing friction score (0-100) with color gradient.
 * Green (0-30) → Yellow (31-70) → Red (71-100)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FrictionMeterProps {
  frictionScore: number; // 0-100
}

function getFrictionColor(score: number): string {
  if (score <= 30) return '#7ED321'; // Green
  if (score <= 70) return '#F5A623'; // Yellow
  return '#D0021B'; // Red
}

export function FrictionMeter({ frictionScore }: FrictionMeterProps) {
  const normalizedScore = Math.max(0, Math.min(100, frictionScore));
  const fillPercentage = normalizedScore;
  const color = getFrictionColor(normalizedScore);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Friction</Text>
      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <View
            style={[
              styles.meterFill,
              {
                width: `${fillPercentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={styles.value}>{Math.round(normalizedScore)}/100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600',
  },
  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meterBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
});
