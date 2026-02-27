import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Pressable,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { generateBeatmap } from '../../lib/rhythm-generator';
import type { Beatmap, HitResult } from '../../lib/types';

// ─── Constants ──────────────────────────────────────────────────────────

const CIRCLE_SIZE = 72;
const APPROACH_RING_SIZE = 144;
const REQUIRED_CONSECUTIVE = 5; // Must land 5 in a row to dismiss the alarm
const PERFECT_WINDOW_MS = 50;   // ±50ms from beat center = "perfect"
const GOOD_WINDOW_MS = 120;     // ±120ms = "good"; anything beyond is a miss
const ADVANCE_DELAY_MS = 300;
const DIFFICULTY = 3;

const DOT_COUNT = 5;
const DOT_SIZE = 12;

const COLOR_PERFECT = '#00E676';
const COLOR_GOOD = '#FFD600';
const COLOR_DEFAULT = '#FFFFFF';
const DOT_FILLED = '#E8E8E3';
const DOT_EMPTY = '#990F00';

// ─── Props ──────────────────────────────────────────────────────────────

interface RhythmChallengeProps {
  onComplete: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────

export function RhythmChallenge({ onComplete }: RhythmChallengeProps) {
  const [beatmap, setBeatmap] = useState<Beatmap>(() => generateBeatmap(DIFFICULTY));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hitFlash, setHitFlash] = useState<HitResult | null>(null);
  const [isMissAnimating, setIsMissAnimating] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Animated values
  const approachScale = useRef(new Animated.Value(2)).current;
  const circleOpacity = useRef(new Animated.Value(1)).current;
  const circleTranslateY = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // Timing refs
  const animationStartRef = useRef<number>(0);
  const beatIntervalRef = useRef<number>(60000 / beatmap.bpm);
  const completedRef = useRef(false);

  // Compute beat interval whenever beatmap changes
  useEffect(() => {
    beatIntervalRef.current = 60000 / beatmap.bpm;
  }, [beatmap.bpm]);

  // ─── Start approach ring animation for current target ───────────────

  const startApproachAnimation = useCallback(() => {
    // Reset animated values
    approachScale.setValue(2);
    circleOpacity.setValue(1);
    circleTranslateY.setValue(0);
    flashOpacity.setValue(0);
    setHitFlash(null);
    setIsMissAnimating(false);

    animationStartRef.current = performance.now();

    Animated.timing(approachScale, {
      toValue: 1,
      duration: beatIntervalRef.current,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // If animation finishes without a tap, it's a miss
      if (finished && !completedRef.current) {
        handleMiss();
      }
    });
  }, [approachScale]);

  // ─── Kick off animation whenever target changes ────────────────────

  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    if (currentIndex >= beatmap.targets.length) return;
    if (completedRef.current) return;

    startApproachAnimation();
  }, [currentIndex, beatmap, containerSize, startApproachAnimation]);

  // ─── Advance to next target ────────────────────────────────────────

  const advanceTarget = useCallback(() => {
    setIsAdvancing(true);
    setTimeout(() => {
      setIsAdvancing(false);
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= beatmap.targets.length) {
          // Ran out of targets without completing — generate new beatmap
          const newBeatmap = generateBeatmap(DIFFICULTY);
          setBeatmap(newBeatmap);
          return 0;
        }
        return next;
      });
    }, ADVANCE_DELAY_MS);
  }, [beatmap.targets.length]);

  // ─── Handle a miss ─────────────────────────────────────────────────

  const handleMiss = useCallback(() => {
    approachScale.stopAnimation();
    setIsMissAnimating(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

    // Miss animation: drop + fade
    Animated.parallel([
      Animated.timing(circleTranslateY, {
        toValue: 80,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(circleOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset consecutive hits and generate new beatmap
      setConsecutiveHits(0);
      const newBeatmap = generateBeatmap(DIFFICULTY);
      setBeatmap(newBeatmap);
      setCurrentIndex(0);
    });
  }, [approachScale, circleTranslateY, circleOpacity]);

  // ─── Handle tap on circle ──────────────────────────────────────────

  const handleTap = useCallback(() => {
    if (completedRef.current) return;
    if (isMissAnimating) return;
    if (isAdvancing) return;

    const now = performance.now();
    const elapsed = now - animationStartRef.current;
    const perfectTime = beatIntervalRef.current;
    const delta = Math.abs(elapsed - perfectTime);

    // Stop approach animation
    approachScale.stopAnimation();

    let result: HitResult;

    if (delta < PERFECT_WINDOW_MS) {
      result = 'perfect';
    } else if (delta < GOOD_WINDOW_MS) {
      result = 'good';
    } else {
      result = 'miss';
    }

    if (result === 'miss') {
      handleMiss();
      return;
    }

    // Hit feedback
    Haptics.impactAsync(
      result === 'perfect'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});

    setHitFlash(result);

    // Flash the hit color
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Win condition: REQUIRED_CONSECUTIVE hits without a miss
    const newConsecutive = consecutiveHits + 1;
    setConsecutiveHits(newConsecutive);

    if (newConsecutive >= REQUIRED_CONSECUTIVE) {
      completedRef.current = true;
      // Brief delay so the user sees the final dot fill
      setTimeout(() => {
        onComplete();
      }, 200);
      return;
    }

    advanceTarget();
  }, [
    isMissAnimating,
    isAdvancing,
    approachScale,
    flashOpacity,
    consecutiveHits,
    onComplete,
    advanceTarget,
    handleMiss,
  ]);

  // ─── Layout handler ────────────────────────────────────────────────

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  // ─── Derive target position ────────────────────────────────────────

  const currentTarget = beatmap.targets[currentIndex];
  const targetX = currentTarget
    ? currentTarget.x * containerSize.width - CIRCLE_SIZE / 2
    : 0;
  const targetY = currentTarget
    ? currentTarget.y * containerSize.height - CIRCLE_SIZE / 2
    : 0;

  const flashColor = hitFlash === 'perfect' ? COLOR_PERFECT : COLOR_GOOD;

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < consecutiveHits ? DOT_FILLED : DOT_EMPTY },
            ]}
          />
        ))}
      </View>

      {/* Target area */}
      <View style={styles.targetArea} onLayout={handleLayout}>
        {containerSize.width > 0 && currentTarget && !isAdvancing && (
          <Pressable
            onPress={handleTap}
            style={[
              styles.targetPressable,
              {
                left: targetX,
                top: targetY,
                width: APPROACH_RING_SIZE,
                height: APPROACH_RING_SIZE,
                marginLeft: -(APPROACH_RING_SIZE - CIRCLE_SIZE) / 2,
                marginTop: -(APPROACH_RING_SIZE - CIRCLE_SIZE) / 2,
              },
            ]}
          >
            {/* Approach ring */}
            <Animated.View
              style={[
                styles.approachRing,
                {
                  transform: [{ scale: approachScale }],
                },
              ]}
            />

            {/* Main circle */}
            <Animated.View
              style={[
                styles.circle,
                {
                  opacity: circleOpacity,
                  transform: [{ translateY: circleTranslateY }],
                },
              ]}
            >
              {/* Hit flash overlay */}
              <Animated.View
                style={[
                  styles.flashOverlay,
                  {
                    backgroundColor: flashColor,
                    opacity: flashOpacity,
                  },
                ]}
              />
            </Animated.View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  targetArea: {
    flex: 1,
    position: 'relative',
  },
  targetPressable: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approachRing: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: COLOR_DEFAULT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CIRCLE_SIZE / 2,
  },
});
