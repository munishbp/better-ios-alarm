// ─── Alarm Firing Screen ──────────────────────────────────────────────────────
// The full alarm experience. On mount this screen:
// 1. Maxes screen brightness and saves the previous level
// 2. Starts looping alarm sound via SoundManager
// 3. Fires continuous heavy haptics on an interval
// 4. Randomly selects a challenge (math, code, or rhythm)
// 5. On challenge completion: stops sound/haptics, restores brightness,
//    records dismiss time, and navigates to the victory screen
// Hold-to-skip (30s) provides an escape hatch if the challenge is too hard

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Brightness from 'expo-brightness';
import * as Haptics from 'expo-haptics';
import { useAlarmStore } from '../lib/alarm-store';
import { soundManager } from '../lib/sound-manager';
import { Colors, Typography, Spacing } from '../lib/constants';
import { MathChallenge } from '../components/challenges/MathChallenge';
import { RhythmChallenge } from '../components/challenges/RhythmChallenge';
import { CodeChallenge } from '../components/challenges/CodeChallenge';
import type { ChallengeType, SoundKey } from '../lib/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const ALARM_COLOR_A = '#FF2D1A';
const ALARM_COLOR_B = '#FF6B47';
const CHALLENGE_BG = '#CC2415';
const SKIP_TEXT_COLOR = '#FF8A75';

const HAPTIC_INTERVAL_MS = 800;
const SHAKE_INTERVAL_MS = 400;
const SHAKE_AMPLITUDE = 2;
const SKIP_HOLD_DURATION_MS = 30_000;
const PULSE_DURATION_MS = 500;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AlarmFiringScreen() {
  const router = useRouter();

  // ── Store selectors ─────────────────────────────────────────────────────
  const [challengeType] = useState<ChallengeType>(() => {
    const options: ChallengeType[] = ['math', 'rhythm', 'code'];
    return options[Math.floor(Math.random() * options.length)];
  });
  const activeAlarmId = useAlarmStore((s) => s.activeAlarmId);
  const activeAlarm = useAlarmStore((s) =>
    s.activeAlarmId ? s.alarms.find((a) => a.id === s.activeAlarmId) : undefined,
  );
  const soundChoice = activeAlarm?.soundChoice ?? 'SIREN';

  // ── Refs for cleanup ────────────────────────────────────────────────────
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousBrightnessRef = useRef<number>(0.5);
  const isMountedRef = useRef<boolean>(true);
  const skipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipStartTimeRef = useRef<number | null>(null);

  // ── Live clock ──────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState<string>(formatTime(new Date()));

  // ── Skip state ──────────────────────────────────────────────────────────
  const [skipProgress, setSkipProgress] = useState<number>(0);

  // ── Animated values ─────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;

  // ── handleComplete ──────────────────────────────────────────────────────
  const handleComplete = useCallback(async () => {
    if (!isMountedRef.current) return;

    // 1. Stop sound
    try {
      await soundManager.stop();
    } catch (e) {
      console.warn('[AlarmFiring] Error stopping sound:', e);
    }

    // 2. Stop haptic interval
    if (hapticIntervalRef.current !== null) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }

    // 3. Get elapsed time from store
    const seconds = useAlarmStore.getState().completeDismiss();

    // 4. Restore brightness
    try {
      await Brightness.setBrightnessAsync(previousBrightnessRef.current);
    } catch (e) {
      console.warn('[AlarmFiring] Error restoring brightness:', e);
    }

    // 5. Navigate to victory
    if (isMountedRef.current) {
      router.replace({
        pathname: '/victory',
        params: { seconds: String(Math.round(seconds)) },
      });
    }
  }, [router]);

  // ── Mount: Start all alarm effects ──────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    async function boot() {
      // 1. Save and force max brightness
      try {
        const current = await Brightness.getBrightnessAsync();
        previousBrightnessRef.current = current;
        await Brightness.setBrightnessAsync(1);
      } catch (e) {
        console.warn('[AlarmFiring] Brightness error:', e);
      }

      // 2. Start ringing state in store
      useAlarmStore.getState().startRinging();

      // 3. Start challenge timer
      useAlarmStore.getState().startChallenge();

      // 4. Play alarm sound
      try {
        await soundManager.playAlarm(soundChoice as SoundKey);
      } catch (e) {
        console.warn('[AlarmFiring] Sound playback error:', e);
      }
    }

    boot();

    // 5. Haptic loop
    hapticIntervalRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, HAPTIC_INTERVAL_MS);

    // ── Clock update ────────────────────────────────────────────────────
    const clockInterval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000);

    // ── Cleanup on unmount ──────────────────────────────────────────────
    return () => {
      isMountedRef.current = false;

      // Clear haptics
      if (hapticIntervalRef.current !== null) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }

      // Clear clock
      clearInterval(clockInterval);

      // Stop sound (fire and forget)
      soundManager.stop().catch(() => {});

      // Restore brightness (fire and forget)
      Brightness.setBrightnessAsync(previousBrightnessRef.current).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Background pulse animation ──────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: PULSE_DURATION_MS,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: PULSE_DURATION_MS,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulseAnim]);

  // ── Screen shake effect ─────────────────────────────────────────────────
  useEffect(() => {
    shakeIntervalRef.current = setInterval(() => {
      const randX = (Math.random() * 2 - 1) * SHAKE_AMPLITUDE;
      const randY = (Math.random() * 2 - 1) * SHAKE_AMPLITUDE;
      shakeX.setValue(randX);
      shakeY.setValue(randY);
    }, SHAKE_INTERVAL_MS);

    return () => {
      if (shakeIntervalRef.current !== null) {
        clearInterval(shakeIntervalRef.current);
        shakeIntervalRef.current = null;
      }
    };
  }, [shakeX, shakeY]);

  // ── Interpolated background color ───────────────────────────────────────
  const animatedBgColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [ALARM_COLOR_A, ALARM_COLOR_B],
  });

  // ── Skip hold handlers ──────────────────────────────────────────────────
  const handleSkipPressIn = useCallback(() => {
    skipStartTimeRef.current = Date.now();
    setSkipProgress(0);

    skipTimerRef.current = setInterval(() => {
      if (skipStartTimeRef.current === null) return;

      const elapsed = Date.now() - skipStartTimeRef.current;
      const progress = Math.min(elapsed / SKIP_HOLD_DURATION_MS, 1);
      setSkipProgress(progress);

      if (progress >= 1) {
        // 30 seconds held — dismiss
        if (skipTimerRef.current !== null) {
          clearInterval(skipTimerRef.current);
          skipTimerRef.current = null;
        }
        skipStartTimeRef.current = null;
        handleComplete();
      }
    }, 100);
  }, [handleComplete]);

  const handleSkipPressOut = useCallback(() => {
    // Release early — reset
    skipStartTimeRef.current = null;
    setSkipProgress(0);

    if (skipTimerRef.current !== null) {
      clearInterval(skipTimerRef.current);
      skipTimerRef.current = null;
    }
  }, []);

  // ── Cleanup skip timer on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      if (skipTimerRef.current !== null) {
        clearInterval(skipTimerRef.current);
        skipTimerRef.current = null;
      }
    };
  }, []);

  // ── Render challenge by type ────────────────────────────────────────────
  function renderChallenge(type: ChallengeType) {
    switch (type) {
      case 'math':
        return <MathChallenge onComplete={handleComplete} />;
      case 'rhythm':
        return <RhythmChallenge onComplete={handleComplete} />;
      case 'code':
        return <CodeChallenge onComplete={handleComplete} />;
      default: {
        // Exhaustive check — should never reach here
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.container, { backgroundColor: animatedBgColor }]}>
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            transform: [{ translateX: shakeX }, { translateY: shakeY }],
          },
        ]}
      >
        {/* ── Top Third: Clock & Label ──────────────────────────────── */}
        <View style={styles.clockSection}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.wakeUpText}>WAKE UP</Text>
        </View>

        {/* ── Bottom Two-Thirds: Challenge Panel ───────────────────── */}
        <View style={styles.challengeSection}>
          {renderChallenge(challengeType)}
        </View>

        {/* ── Skip Bar ─────────────────────────────────────────────── */}
        <Pressable
          style={styles.skipContainer}
          onPressIn={handleSkipPressIn}
          onPressOut={handleSkipPressOut}
        >
          {skipProgress > 0 && (
            <View style={styles.skipProgressTrack}>
              <View
                style={[
                  styles.skipProgressFill,
                  { width: `${Math.round(skipProgress * 100)}%` },
                ]}
              />
            </View>
          )}
          <Text style={styles.skipText}>hold to skip</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },

  // ── Clock Section (top third) ─────────────────────────────────────────
  clockSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing['5xl'],
  },
  timeText: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  wakeUpText: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.widest,
    marginTop: Spacing.sm,
  },

  // ── Challenge Section (bottom two-thirds) ─────────────────────────────
  challengeSection: {
    flex: 2,
    backgroundColor: CHALLENGE_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  // ── Skip mechanism ────────────────────────────────────────────────────
  skipContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing['3xl'],
    paddingTop: Spacing.md,
    alignItems: 'center',
    backgroundColor: CHALLENGE_BG,
  },
  skipText: {
    fontSize: 13,
    color: SKIP_TEXT_COLOR,
    fontWeight: Typography.fontWeight.regular,
  },
  skipProgressTrack: {
    width: SCREEN_WIDTH * 0.6,
    height: 3,
    backgroundColor: 'rgba(255, 138, 117, 0.2)',
    borderRadius: 1.5,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  skipProgressFill: {
    height: '100%',
    backgroundColor: SKIP_TEXT_COLOR,
    borderRadius: 1.5,
  },
});
