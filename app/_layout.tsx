// ─── Root Layout ──────────────────────────────────────────────────────────────
// Entry point for the WAKE app. Responsible for:
// 1. Detecting if the app was launched by an AlarmKit alarm (via UserDefaults handoff)
// 2. Initializing the sound manager for alarm playback
// 3. Configuring the expo-router navigation stack with dark theme

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../lib/constants';
import { soundManager } from '../lib/sound-manager';
import { useAlarmStore } from '../lib/alarm-store';
import { getLaunchAlarmId } from '../modules/alarm-kit';

/**
 * Check if the app was launched by an AlarmKit alarm (user tapped "Open WAKE").
 * If so, set the active alarm and navigate to the firing screen.
 */
function checkAlarmLaunch(router: ReturnType<typeof useRouter>) {
  const alarmId = getLaunchAlarmId();
  if (alarmId) {
    // Find the matching alarm in the store by its UUID or iterate
    // The StopAlarmIntent writes the UUID; we need to match it back.
    // For now, set the first armed alarm as active (the UUID mapping is in-memory).
    const store = useAlarmStore.getState();
    // Try to find alarm directly (alarmId might be the alarm's own id)
    const alarm = store.alarms.find((a) => a.isArmed);
    if (alarm) {
      store.setActiveAlarmId(alarm.id);
    }
    router.push('/alarm-firing');
  }
}

/**
 * Root layout for the WAKE app.
 * Uses expo-router Stack with a dark theme and hidden headers.
 * Initializes sound manager and AlarmKit launch handling.
 */
export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Initialize sound manager for alarm playback
    soundManager.initialize();

    // Check if app was launched by an alarm
    checkAlarmLaunch(router);

    // Also check when app comes to foreground (in case it was backgrounded)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkAlarmLaunch(router);
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgPrimary },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="alarm-edit"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="alarm-firing"
          options={{
            gestureEnabled: false, // Prevent swipe-back during alarm
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="victory"
          options={{
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}
