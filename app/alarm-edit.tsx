// ─── Alarm Edit Screen ────────────────────────────────────────────────────────
// Create or edit an alarm. Uses local component state for in-progress edits,
// only committing to the Zustand store on save. Supports time, repeat days,
// and sound selection.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlarmStore } from '../lib/alarm-store';
import { TimeScroller } from '../components/TimeScroller';
import { DaySelector } from '../components/DaySelector';
import { SoundSelector } from '../components/SoundSelector';
import type { SoundKey } from '../lib/types';

// ─── Default values for new alarm ───────────────────────────────────

const DEFAULT_HOUR = 7;
const DEFAULT_MINUTE = 0;
const DEFAULT_DAYS = [true, true, true, true, true, false, false];
const DEFAULT_SOUND: SoundKey = 'SIREN';

// ─── Component ──────────────────────────────────────────────────────

export default function AlarmEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!params.id;

  const existingAlarm = useAlarmStore((s) =>
    params.id ? s.alarms.find((a) => a.id === params.id) : undefined,
  );
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);

  // Local editing state — copies from store on mount, written back on save
  const [hour, setHour] = useState(existingAlarm?.time.hour ?? DEFAULT_HOUR);
  const [minute, setMinute] = useState(existingAlarm?.time.minute ?? DEFAULT_MINUTE);
  const [enabledDays, setEnabledDays] = useState<boolean[]>(
    existingAlarm?.enabledDays ?? [...DEFAULT_DAYS],
  );
  const [soundChoice, setSoundChoice] = useState<SoundKey>(
    existingAlarm?.soundChoice ?? DEFAULT_SOUND,
  );

  const handleTimeChange = (h: number, m: number) => {
    setHour(h);
    setMinute(m);
  };

  const handleToggleDay = (index: number) => {
    setEnabledDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleSave = () => {
    if (isEditMode && params.id) {
      updateAlarm(params.id, {
        time: { hour, minute },
        enabledDays,
        soundChoice,
      });
    } else {
      addAlarm({
        time: { hour, minute },
        enabledDays,
        soundChoice,
        isArmed: true,
      });
    }
    router.back();
  };

  const handleDelete = () => {
    if (params.id) {
      deleteAlarm(params.id);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Navigation bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.navCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {isEditMode ? 'Edit Alarm' : 'New Alarm'}
          </Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.navSave}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Time Scroller */}
        <View style={styles.timeSection}>
          <TimeScroller
            hour={hour}
            minute={minute}
            onTimeChange={handleTimeChange}
          />
        </View>

        {/* Day Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REPEAT</Text>
          <DaySelector enabledDays={enabledDays} onToggle={handleToggleDay} />
        </View>

        {/* Sound Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SOUND</Text>
          <SoundSelector selected={soundChoice} onSelect={setSoundChoice} />
        </View>

        {/* Delete button (edit mode only) */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.7}
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>Delete Alarm</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },

  // ── Nav bar ──────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navCancel: {
    fontSize: 15,
    color: '#9999A1',
  },
  navTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#5A5A63',
    textTransform: 'uppercase',
  },
  navSave: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8E8E3',
  },

  // ── Time section ─────────────────────────────────────────────
  timeSection: {
    marginTop: 16,
    marginBottom: 40,
  },

  // ── Sections ─────────────────────────────────────────────────
  section: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#5A5A63',
    textTransform: 'uppercase',
  },

  // ── Delete ───────────────────────────────────────────────────
  deleteButton: {
    marginTop: 'auto',
    marginBottom: 32,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  deleteText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '500',
  },
});
