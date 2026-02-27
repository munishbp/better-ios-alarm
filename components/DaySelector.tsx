// ─── Day Selector ─────────────────────────────────────────────────────────────
// Row of 7 toggle circles (M T W T F S S) for selecting alarm repeat days

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// ─── Constants ───────────────────────────────────────────────────────
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CIRCLE_SIZE = 36;

// ─── Props ───────────────────────────────────────────────────────────
interface DaySelectorProps {
  enabledDays: boolean[];
  onToggle: (index: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function DaySelector({ enabledDays, onToggle }: DaySelectorProps) {
  return (
    <View style={styles.container}>
      {DAY_LETTERS.map((letter, index) => {
        const isActive = enabledDays[index] ?? false;
        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => onToggle(index)}
            style={[
              styles.circle,
              isActive ? styles.circleActive : styles.circleInactive,
            ]}
          >
            <Text
              style={[
                styles.letter,
                isActive ? styles.letterActive : styles.letterInactive,
              ]}
            >
              {letter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: '#E8E8E3',
  },
  circleInactive: {
    backgroundColor: '#1C1C21',
  },
  letter: {
    fontSize: 13,
    fontWeight: '600',
  },
  letterActive: {
    color: '#0A0A0C',
  },
  letterInactive: {
    color: '#9999A1',
  },
});
