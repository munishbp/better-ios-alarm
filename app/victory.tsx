import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Typography } from '../lib/constants';
import { useAlarmStore } from '../lib/alarm-store';

// ─── Timing Constants ───────────────────────────────────────────────

/** Duration of the background color transition (ms) */
const BG_TRANSITION_DURATION = 800;

/** Duration of the text fade-in (ms) */
const TEXT_FADE_DURATION = 600;

/** Delay before haptic fires after text is visible (ms) */
const HAPTIC_DELAY = BG_TRANSITION_DURATION + TEXT_FADE_DURATION + 1000;

/** Total time before auto-navigating home (ms) */
const AUTO_NAV_DELAY = 4000;

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Formats an alarm time object into a padded "HH:MM" string.
 */
function formatTime(hour: number, minute: number): string {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Victory Screen ─────────────────────────────────────────────────

export default function VictoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dismissTime?: string; seconds?: string }>();

  // Read active alarm from store
  const activeAlarm = useAlarmStore((s) =>
    s.activeAlarmId ? s.alarms.find((a) => a.id === s.activeAlarmId) : undefined,
  );

  // Resolve display values from route params or store
  const displayTime = params.dismissTime ?? (activeAlarm
    ? formatTime(activeAlarm.time.hour, activeAlarm.time.minute)
    : '--:--');
  const displaySeconds = params.seconds ?? '0';

  // ── Animated values ──────────────────────────────────────────────
  const bgProgress = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Background: animate from alarm red to near-black
    const bgAnimation = Animated.timing(bgProgress, {
      toValue: 1,
      duration: BG_TRANSITION_DURATION,
      useNativeDriver: false, // backgroundColor cannot use native driver
    });

    // 2. Text: fade in after background transition completes
    const textAnimation = Animated.timing(textOpacity, {
      toValue: 1,
      duration: TEXT_FADE_DURATION,
      useNativeDriver: true,
    });

    // Run sequentially: bg first, then text
    Animated.sequence([bgAnimation, textAnimation]).start();

    // 3. Gentle haptic feedback 1 second after text appears
    const hapticTimer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, HAPTIC_DELAY);

    // 4. Auto-navigate home after 4 seconds total
    const navTimer = setTimeout(() => {
      router.replace('/');
    }, AUTO_NAV_DELAY);

    return () => {
      clearTimeout(hapticTimer);
      clearTimeout(navTimer);
    };
    // We intentionally run this effect only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Interpolate background color from alarm red to primary dark
  const backgroundColor = bgProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.alarmBg, Colors.bgPrimary],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <View style={styles.center}>
        <Animated.Text style={[styles.headline, { opacity: textOpacity }]}>
          You're up.
        </Animated.Text>

        <Animated.Text style={[styles.stats, { opacity: textOpacity }]}>
          {`${displayTime} \u2014 ${displaySeconds} seconds`}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  stats: {
    fontSize: Typography.fontSize.md, // 15pt
    color: '#6B6B70',
  },
});
