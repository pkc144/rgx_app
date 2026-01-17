import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

/**
 * CrossPlatformOverlay - Cross-platform overlay for broker connection UIs
 * Uses FullWindowOverlay on iOS, direct rendering on Android
 *
 * This is used for full-screen broker connection modals
 */
const CrossPlatformOverlay = ({ children, visible }) => {
  if (!visible) return null;

  // FullWindowOverlay only works on iOS
  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        {children}
      </FullWindowOverlay>
    );
  }

  // For Android, render children directly with absolute positioning
  // The broker UIs already have full-screen styling
  return (
    <View style={styles.androidOverlay}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  androidOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default CrossPlatformOverlay;
