// ─── Arm Button ───────────────────────────────────────────────────────────────
// Circular toggle that arms/disarms an alarm. Uses an animated fill that
// rises from the bottom of the circle when armed, providing visual feedback
// beyond a simple color swap.

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// ─── Constants ───────────────────────────────────────────────────────
const CIRCLE_SIZE = 72;

// ─── Props ───────────────────────────────────────────────────────────
interface ArmButtonProps {
  isArmed: boolean;
  onToggle: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function ArmButton({ isArmed, onToggle }: ArmButtonProps) {
  const fillAnim = useRef(new Animated.Value(isArmed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: isArmed ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isArmed, fillAnim]);

  const handlePress = () => {
    if (isArmed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle();
  };

  // Interpolate 0→1 into 0→CIRCLE_SIZE to fill the circle from bottom up
  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCLE_SIZE],
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.circle,
          isArmed ? styles.circleArmed : styles.circleDisarmed,
        ]}
      >
        {/* Animated fill from bottom */}
        <Animated.View
          style={[
            styles.fill,
            {
              height: fillHeight,
            },
          ]}
        />
        {isArmed ? (
          <Text style={styles.icon}>⏰</Text>
        ) : (
          <Text style={styles.setText}>SET</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleArmed: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3A3A42',
  },
  circleDisarmed: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3A3A42',
  },
  fill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E8E8E3',
    borderRadius: CIRCLE_SIZE / 2,
  },
  icon: {
    fontSize: 24,
    zIndex: 1,
  },
  setText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#5A5A63',
    zIndex: 1,
  },
});
