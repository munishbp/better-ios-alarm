import type { Alarm, SoundKey } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestAuthorization,
  scheduleFixedAlarm,
  scheduleRecurringAlarm,
  cancelAlarm as cancelNativeAlarm,
  cancelAllAlarms as cancelAllNativeAlarms,
} from '../modules/alarm-kit';

// ─── Helpers ────────────────────────────────────────────────────────

/** Map SoundKey to the sound name in the iOS bundle (without extension) */
const SOUND_NAMES: Record<SoundKey, string> = {
  SIREN: 'siren',
  PULSE: 'pulse',
  GLASS: 'glass',
  DRILL: 'drill',
  HORN: 'horn',
};

// AlarmKit requires UUID identifiers but our store uses short IDs (base36).
// This in-memory map bridges the two; entries are created on schedule and
// cleaned up on cancel. Lost on app restart, but alarms re-schedule on hydrate
const alarmUUIDs = new Map<string, string>();

// ─── Re-trigger persistence ─────────────────────────────────────────
// Maps alarm ID -> array of native UUIDs for the re-trigger alarms.
// Persisted to AsyncStorage so we can cancel them after an app restart.
const RETRIGGER_STORAGE_KEY = 'wake-retrigger-uuids';
const retriggerUUIDs = new Map<string, string[]>();

const RETRIGGER_COUNT = 10;
const RETRIGGER_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

async function loadRetriggerUUIDs(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RETRIGGER_STORAGE_KEY);
    if (raw) {
      const entries: [string, string[]][] = JSON.parse(raw);
      retriggerUUIDs.clear();
      for (const [key, uuids] of entries) {
        retriggerUUIDs.set(key, uuids);
      }
    }
  } catch (e) {
    console.warn('[AlarmScheduler] Failed to load retrigger UUIDs:', e);
  }
}

async function saveRetriggerUUIDs(): Promise<void> {
  try {
    const entries = Array.from(retriggerUUIDs.entries());
    await AsyncStorage.setItem(RETRIGGER_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('[AlarmScheduler] Failed to save retrigger UUIDs:', e);
  }
}

/**
 * Generate a deterministic UUID v4 string from an alarm ID.
 * AlarmKit requires UUID format, so we pad/hash our short IDs.
 */
function getUUID(alarmId: string): string {
  const existing = alarmUUIDs.get(alarmId);
  if (existing) return existing;

  // Generate a proper UUID and associate it
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  alarmUUIDs.set(alarmId, uuid);
  return uuid;
}

/**
 * Convert our enabledDays (0=Mon..6=Sun) to AlarmKit weekday ints.
 * AlarmKit uses Apple's Locale.Weekday convention: 1=Sun, 2=Mon, ..., 7=Sat
 */
function toAlarmKitWeekdays(enabledDays: boolean[]): number[] {
  // Our index:  0=Mon  1=Tue  2=Wed  3=Thu  4=Fri  5=Sat  6=Sun
  // AlarmKit:   2=Mon  3=Tue  4=Wed  5=Thu  6=Fri  7=Sat  1=Sun
  const mapping = [2, 3, 4, 5, 6, 7, 1];
  const weekdays: number[] = [];
  for (let i = 0; i < enabledDays.length; i++) {
    if (enabledDays[i]) {
      weekdays.push(mapping[i]);
    }
  }
  return weekdays;
}

/**
 * Calculate the next Date when the alarm should fire (for one-shot scheduling).
 */
function getNextTriggerDate(
  hour: number,
  minute: number,
  enabledDays: boolean[],
): Date | null {
  const now = new Date();

  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);

    const jsDay = candidate.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    if (!enabledDays[dayIndex]) continue;
    if (offset === 0 && candidate.getTime() <= now.getTime()) continue;

    return candidate;
  }

  return null;
}

// ─── Re-trigger scheduling ──────────────────────────────────────────

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Schedule 10 re-trigger alarms at +2, +4, ... +20 min after the alarm's
 * next fire time. These are independent one-shot native alarms that fire
 * even if the app is killed, ensuring the user can't just dismiss the
 * notification and go back to sleep.
 */
async function scheduleRetriggers(alarm: Alarm): Promise<void> {
  // Cancel any existing re-triggers for this alarm first
  await cancelRetriggers(alarm.id);

  const baseDate = getNextTriggerDate(
    alarm.time.hour,
    alarm.time.minute,
    alarm.enabledDays,
  );
  if (!baseDate) return;

  const baseTime = baseDate.getTime();
  const now = Date.now();
  const soundName = SOUND_NAMES[alarm.soundChoice];
  const uuids: string[] = [];

  for (let i = 1; i <= RETRIGGER_COUNT; i++) {
    const triggerTime = baseTime + i * RETRIGGER_INTERVAL_MS;
    if (triggerTime <= now) continue; // skip past timestamps

    const uuid = generateUUID();
    await scheduleFixedAlarm(uuid, triggerTime, soundName, 'WAKE UP');
    uuids.push(uuid);
  }

  if (uuids.length > 0) {
    retriggerUUIDs.set(alarm.id, uuids);
    await saveRetriggerUUIDs();
  }
}

/**
 * Cancel all pending re-trigger alarms for the given alarm ID.
 */
export async function cancelRetriggers(alarmId: string): Promise<void> {
  const uuids = retriggerUUIDs.get(alarmId);
  if (uuids) {
    for (const uuid of uuids) {
      await cancelNativeAlarm(uuid);
    }
    retriggerUUIDs.delete(alarmId);
    await saveRetriggerUUIDs();
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Restore persisted retrigger UUID maps on app start.
 * Must be called before checkAlarmLaunch so cancellation works after restart.
 */
export async function initializeScheduler(): Promise<void> {
  await loadRetriggerUUIDs();
}

/**
 * Request alarm permissions. Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const status = await requestAuthorization();
  return status === 'authorized';
}

/**
 * Schedule a native AlarmKit alarm for the given alarm config.
 * Uses recurring schedule if multiple days are enabled,
 * otherwise falls back to a fixed one-shot alarm.
 */
export async function scheduleAlarm(alarm: Alarm): Promise<void> {
  // Cancel existing first
  await cancelAlarm(alarm.id);

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    console.warn('[AlarmScheduler] Alarm permissions not granted.');
    return;
  }

  const uuid = getUUID(alarm.id);
  const soundName = SOUND_NAMES[alarm.soundChoice];
  const weekdays = toAlarmKitWeekdays(alarm.enabledDays);

  if (weekdays.length === 0) {
    console.warn('[AlarmScheduler] No enabled days — alarm not scheduled.');
    return;
  }

  // Prefer recurring schedule so the alarm repeats automatically each week
  const success = await scheduleRecurringAlarm(
    uuid,
    alarm.time.hour,
    alarm.time.minute,
    weekdays,
    soundName,
    'WAKE UP',
  );

  if (!success) {
    // Recurring scheduling can fail on older OS versions; fall back to a
    // one-shot fixed alarm targeting the next matching day
    const triggerDate = getNextTriggerDate(
      alarm.time.hour,
      alarm.time.minute,
      alarm.enabledDays,
    );
    if (triggerDate) {
      await scheduleFixedAlarm(
        uuid,
        triggerDate.getTime(),
        soundName,
        'WAKE UP',
      );
    }
  }

  // Schedule re-trigger alarms so the alarm keeps firing until the challenge is solved
  await scheduleRetriggers(alarm);
}

/**
 * Cancel a specific alarm and its re-triggers.
 */
export async function cancelAlarm(alarmId: string): Promise<void> {
  const uuid = alarmUUIDs.get(alarmId);
  if (uuid) {
    await cancelNativeAlarm(uuid);
    alarmUUIDs.delete(alarmId);
  }
  await cancelRetriggers(alarmId);
}

/**
 * Cancel all alarms.
 */
export async function cancelAllAlarms(): Promise<void> {
  await cancelAllNativeAlarms();
  alarmUUIDs.clear();
}
