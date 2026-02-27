// ─── Victory Display ──────────────────────────────────────────────────────────
// Fade-in component showing dismiss stats after a challenge is completed

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Typography } from '../lib/constants';

interface VictoryDisplayProps {
  dismissTime: number; // seconds it took to dismiss
  alarmTime: string;   // formatted time string e.g. "5:47 AM"
}

export function VictoryDisplay({ dismissTime, alarmTime }: VictoryDisplayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        You're up.
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
        {alarmTime} — {dismissTime} seconds
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: '#6B6B70',
    marginTop: 8,
  },
});
