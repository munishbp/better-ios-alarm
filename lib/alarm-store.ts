import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Alarm, ChallengeType, SoundKey } from './types';
import {
  scheduleAlarm,
  cancelAlarm,
  cancelAllAlarms,
} from './alarm-scheduler';

// ─── Helpers ───────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── State Shape ────────────────────────────────────────────────────

interface AlarmStoreState {
  // Persisted
  alarms: Alarm[];

  // Transient runtime state (not persisted)
  activeAlarmId: string | null;
  isRinging: boolean;
  challengeStartTime: number | null;
}

interface AlarmStoreActions {
  addAlarm: (alarm: Omit<Alarm, 'id'>) => string;
  updateAlarm: (id: string, updates: Partial<Omit<Alarm, 'id'>>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setActiveAlarmId: (id: string | null) => void;
  startRinging: () => void;
  stopRinging: () => void;
  startChallenge: () => void;
  completeDismiss: () => number;
}

type AlarmStore = AlarmStoreState & AlarmStoreActions;

// ─── Default Values ─────────────────────────────────────────────────

const DEFAULT_ENABLED_DAYS: boolean[] = [true, true, true, true, true, false, false];
const DEFAULT_SOUND_CHOICE: SoundKey = 'SIREN';

/** Valid sound keys for migration check */
const VALID_SOUND_KEYS: readonly string[] = ['SIREN', 'PULSE', 'GLASS', 'DRILL', 'HORN'];

// ─── Store ──────────────────────────────────────────────────────────

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set, get) => ({
      // ── Persisted state ──────────────────────────────────────────
      alarms: [],

      // ── Transient state ──────────────────────────────────────────
      activeAlarmId: null,
      isRinging: false,
      challengeStartTime: null,

      // ── Actions ──────────────────────────────────────────────────

      addAlarm: (alarm) => {
        const id = generateId();
        const newAlarm: Alarm = { ...alarm, id };
        set((state) => ({ alarms: [...state.alarms, newAlarm] }));
        if (newAlarm.isArmed) {
          scheduleAlarm(newAlarm);
        }
        return id;
      },

      updateAlarm: (id, updates) => {
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        }));
        const updated = get().alarms.find((a) => a.id === id);
        if (updated) {
          if (updated.isArmed) {
            scheduleAlarm(updated);
          } else {
            cancelAlarm(id);
          }
        }
      },

      deleteAlarm: (id) => {
        cancelAlarm(id);
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
        }));
      },

      toggleAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, isArmed: !a.isArmed } : a,
          ),
        }));
        const toggled = get().alarms.find((a) => a.id === id);
        if (toggled) {
          if (toggled.isArmed) {
            scheduleAlarm(toggled);
          } else {
            cancelAlarm(id);
          }
        }
      },

      setActiveAlarmId: (id) => set({ activeAlarmId: id }),

      startRinging: () => set({ isRinging: true }),

      stopRinging: () => set({ isRinging: false }),

      startChallenge: () => set({ challengeStartTime: Date.now() }),

      // Called after the user completes a challenge. Returns elapsed seconds
      // for the victory screen, then reschedules the alarm for its next
      // occurrence so recurring alarms keep firing on future days
      completeDismiss: () => {
        const state = get();
        const now = Date.now();
        const elapsedMs =
          state.challengeStartTime != null
            ? now - state.challengeStartTime
            : 0;
        const elapsedSeconds = Math.round(elapsedMs / 1000);

        set({
          isRinging: false,
          challengeStartTime: null,
        });

        // Reschedule the active alarm for its next occurrence
        if (state.activeAlarmId) {
          const alarm = state.alarms.find(
            (a) => a.id === state.activeAlarmId,
          );
          if (alarm && alarm.isArmed) {
            scheduleAlarm(alarm);
          }
        }

        return elapsedSeconds;
      },
    }),
    {
      name: 'wake-alarm-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the alarms array — transient state (isRinging, activeAlarmId,
      // challengeStartTime) resets on app restart and doesn't belong in storage
      partialize: (state) => ({
        alarms: state.alarms,
      }),
      // Migration: v1 stored a single alarm as top-level fields (alarmTime,
      // enabledDays, etc). This converts that shape into the v2 alarms array
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;

        // Migration: if persisted data has old single-alarm fields
        const raw = state as unknown as Record<string, unknown>;
        if (!Array.isArray(raw.alarms) || (raw.alarms.length === 0 && raw.alarmTime)) {
          const alarmTime = (raw.alarmTime as { hour: number; minute: number }) ?? {
            hour: 7,
            minute: 0,
          };
          const enabledDays =
            (raw.enabledDays as boolean[]) ?? DEFAULT_ENABLED_DAYS;
          let soundChoice =
            (raw.soundChoice as SoundKey) ?? DEFAULT_SOUND_CHOICE;
          if (!VALID_SOUND_KEYS.includes(soundChoice)) {
            soundChoice = DEFAULT_SOUND_CHOICE;
          }
          const isArmed = (raw.isArmed as boolean) ?? false;

          state.alarms = [
            {
              id: generateId(),
              time: alarmTime,
              enabledDays,
              soundChoice,
              isArmed,
            },
          ];
        }

        // Validate sound keys on all alarms
        for (const alarm of state.alarms) {
          if (!VALID_SOUND_KEYS.includes(alarm.soundChoice)) {
            alarm.soundChoice = DEFAULT_SOUND_CHOICE;
          }
        }
      },
    },
  ),
);
