// ─── MathChallenge Component ──────────────────────────────────────────────────
// Full-screen math problem challenge for dismissing the alarm.
// User solves arithmetic/algebra and types answer via native iOS keyboard.

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { generateMathProblem, checkAnswer } from '../../lib/math-generator';
import type { MathProblem } from '../../lib/math-generator';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MathChallengeProps {
  onComplete: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY = 3;

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  default: 'monospace',
});

// ─── Component ────────────────────────────────────────────────────────────────

export function MathChallenge({ onComplete }: MathChallengeProps) {
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() =>
    generateMathProblem(DIFFICULTY)
  );
  const [userInput, setUserInput] = useState<string>('');
  const inputRef = useRef<TextInput>(null);

  // Animated overlay for wrong-answer flash
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // Auto-focus the input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Generate a fresh problem (guaranteed different from current)
  const generateNewProblem = useCallback(() => {
    let next = generateMathProblem(DIFFICULTY);
    let attempts = 0;
    while (next.question === currentProblem.question && attempts < 10) {
      next = generateMathProblem(DIFFICULTY);
      attempts++;
    }
    return next;
  }, [currentProblem.question]);

  const handleSubmit = useCallback(() => {
    if (userInput.length === 0) return;

    const parsed = parseInt(userInput, 10);

    if (checkAnswer(currentProblem, parsed)) {
      onComplete();
    } else {
      // Wrong answer: flash, haptic, clear, new problem
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setUserInput('');

      // Re-focus input after clearing
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [userInput, currentProblem, onComplete, flashOpacity, generateNewProblem]);

  // ─── Main render ──────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Problem display */}
      <View style={styles.problemContainer}>
        <Text style={styles.problemLabel}>SOLVE</Text>
        <Text style={styles.problemText}>{currentProblem.display}</Text>
      </View>

      {/* Answer input */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={handleSubmit}
          keyboardType="number-pad"
          returnKeyType="done"
          placeholder="?"
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCorrect={false}
          maxLength={8}
          selectionColor="#FFFFFF"
        />
      </View>

      {/* Wrong-answer flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ─── Problem ────────────────────────────────────────────────────────
  problemContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  problemLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  problemText: {
    fontSize: 40,
    fontFamily: MONO_FONT,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  // ─── Input ──────────────────────────────────────────────────────────
  inputRow: {
    width: '100%',
    maxWidth: 200,
  },
  input: {
    fontSize: 36,
    fontFamily: MONO_FONT,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 12,
  },

  // ─── Flash overlay ─────────────────────────────────────────────────
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
});
