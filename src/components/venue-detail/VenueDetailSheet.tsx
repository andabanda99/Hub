/**
 * Venue Detail Bottom Sheet Component
 *
 * Main bottom sheet that displays venue information when tapped.
 * Features smooth venue switching without dismissing the sheet.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { getVenueById } from '../map/useVenueGeoJSON';
import { StateVibeIndicator } from './StateVibeIndicator';
import { FrictionMeter } from './FrictionMeter';
import { OpenDoorBadge } from './OpenDoorBadge';
import { MetricsRow } from './MetricsRow';
import { DirectionsButton } from './DirectionsButton';

interface VenueDetailSheetProps {
  venueId: string | null;
  onClose: () => void;
}

export function VenueDetailSheet({ venueId, onClose }: VenueDetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentVenueId, setCurrentVenueId] = useState<string | null>(venueId);

  // Snap points: collapsed (200px) and expanded (50% screen)
  const snapPoints = useMemo(() => [200, '50%'], []);

  // Get venue data
  const venue = currentVenueId ? getVenueById(currentVenueId) : null;

  // Handle venue ID changes with smooth fade animation
  useEffect(() => {
    if (venueId === null) {
      // Close the sheet
      bottomSheetRef.current?.close();
      setCurrentVenueId(null);
    } else if (venueId !== currentVenueId) {
      // Smooth switch to new venue
      Animated.sequence([
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        // Update venue ID mid-animation
      ]).start(() => {
        setCurrentVenueId(venueId);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [venueId, currentVenueId, fadeAnim]);

  // Open sheet when venue is selected
  useEffect(() => {
    if (venueId) {
      bottomSheetRef.current?.expand();
    }
  }, [venueId]);

  // Handle sheet close
  const handleSheetChange = (index: number) => {
    if (index === -1) {
      onClose();
    }
  };

  if (!venue) {
    return null;
  }

  const { properties } = venue;
  const {
    name,
    stateId,
    frictionScore = 50,
    passesOpenDoor,
    waitMinutes,
    coordinates,
  } = properties;

  // Calculate distance (mock for now - would use user location in production)
  const distanceMeters = Math.round((coordinates?.lat ? 27.9441 - coordinates.lat : 0) * 111000);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header: Venue Name + Open Door Badge */}
          <View style={styles.header}>
            <Text style={styles.venueName}>{name}</Text>
            <OpenDoorBadge isOpenDoor={passesOpenDoor} />
          </View>

          {/* State Indicator */}
          <StateVibeIndicator stateId={stateId} />

          {/* Friction Meter */}
          <FrictionMeter frictionScore={frictionScore} />

          {/* Metrics Row */}
          <MetricsRow
            waitMinutes={waitMinutes}
            distanceMeters={Math.abs(distanceMeters)}
          />

          {/* Directions Button */}
          {coordinates && (
            <DirectionsButton
              coordinates={coordinates}
              venueName={name}
            />
          )}
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#16213e',
  },
  handleIndicator: {
    backgroundColor: '#666',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
});
