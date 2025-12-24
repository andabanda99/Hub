/**
 * The Hub - Main App Entry Point
 *
 * Digital Twin operating system for nightlife districts.
 * Water Street Tampa - Instance 001
 */

import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { HubMap } from './src/components/map';

export default function App() {
  // Open Door filter toggle state
  const [isOpenDoorMode, setIsOpenDoorMode] = useState(false);

  // Handle venue press (future: show venue detail sheet)
  const handleVenuePress = useCallback((venueId: string) => {
    console.log('Venue pressed:', venueId);
    // TODO: Show venue detail bottom sheet
  }, []);

  // Toggle Open Door filter
  const toggleOpenDoor = useCallback(() => {
    setIsOpenDoorMode((prev) => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Main Map */}
      <HubMap
        isOpenDoorMode={isOpenDoorMode}
        onVenuePress={handleVenuePress}
      />

      {/* Open Door Toggle Button */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.openDoorButton,
            isOpenDoorMode && styles.openDoorButtonActive,
          ]}
          onPress={toggleOpenDoor}
          activeOpacity={0.8}
        >
          <Text style={styles.openDoorIcon}>
            {isOpenDoorMode ? '🚪' : '🔒'}
          </Text>
          <Text
            style={[
              styles.openDoorText,
              isOpenDoorMode && styles.openDoorTextActive,
            ]}
          >
            Open Door
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info - Shows filter state */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Mode: {isOpenDoorMode ? 'Open Door' : 'All Venues'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  openDoorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  openDoorButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  openDoorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  openDoorText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  openDoorTextActive: {
    color: '#FFD700',
  },
  debugContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
  },
});
