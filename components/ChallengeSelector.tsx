// ─── Challenge Selector ───────────────────────────────────────────────────────
// Horizontal pill-style toggle for choosing the wake-up challenge type

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ChallengeType } from '../lib/types';

// ─── Constants ───────────────────────────────────────────────────────
const CHALLENGE_OPTIONS: { type: ChallengeType; label: string }[] = [
  { type: 'rhythm', label: 'RHYTHM' },
  { type: 'math', label: 'MATH' },
  { type: 'code', label: 'CODE' },
];

// ─── Props ───────────────────────────────────────────────────────────
interface ChallengeSelectorProps {
  selected: ChallengeType;
  onSelect: (type: ChallengeType) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function ChallengeSelector({ selected, onSelect }: ChallengeSelectorProps) {
  return (
    <View style={styles.container}>
      {CHALLENGE_OPTIONS.map(({ type, label }) => {
        const isSelected = type === selected;
        return (
          <TouchableOpacity
            key={type}
            activeOpacity={0.7}
            onPress={() => onSelect(type)}
          >
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
            >
              {label}
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
    gap: 32,
  },
  label: {
    fontSize: 15,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  labelSelected: {
    color: '#E8E8E3',
    fontWeight: '600',
  },
  labelUnselected: {
    color: '#5A5A63',
    fontWeight: '500',
  },
});
