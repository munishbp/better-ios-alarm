import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  PanResponder,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAlarmStore } from '../lib/alarm-store';
import { getSystemVolume } from '../modules/alarm-kit';
import type { Alarm } from '../lib/types';

// Below 30% the alarm is hard to hear; triggers banner + alert on arm
const VOLUME_THRESHOLD = 0.3;

// ─── Constants ──────────────────────────────────────────────────────

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SWIPE_THRESHOLD = -80;

// ─── Swipeable Alarm Row ────────────────────────────────────────────

function AlarmRow({
  alarm,
  onPress,
  onToggle,
  onDelete,
}: {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          onDelete();
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const timeStr = `${String(alarm.time.hour).padStart(2, '0')}:${String(alarm.time.minute).padStart(2, '0')}`;

  const activeDays = alarm.enabledDays
    .map((on, i) => (on ? DAY_LETTERS[i] : null))
    .filter(Boolean)
    .join('  ');

  return (
    <View style={styles.rowWrapper}>
      {/* Delete background */}
      <View style={styles.deleteBackground}>
        <Text style={styles.deleteText}>Delete</Text>
      </View>

      <Animated.View
        style={[styles.row, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.rowContent}
          activeOpacity={0.7}
          onPress={onPress}
        >
          <View style={styles.rowLeft}>
            <Text style={[styles.rowTime, !alarm.isArmed && styles.rowTimeDimmed]}>
              {timeStr}
            </Text>
            <Text style={styles.rowDays}>{activeDays || 'No days'}</Text>
          </View>
        </TouchableOpacity>

        {/* Arm/disarm toggle */}
        <TouchableOpacity
          style={[styles.toggleTrack, alarm.isArmed && styles.toggleTrackOn]}
          activeOpacity={0.7}
          onPress={onToggle}
        >
          <View style={[styles.toggleThumb, alarm.isArmed && styles.toggleThumbOn]} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Home Screen ────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const alarms = useAlarmStore((s) => s.alarms);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);
  const [volumeLow, setVolumeLow] = useState(false);

  const hasArmedAlarm = alarms.some((a) => a.isArmed);

  // Check volume on mount and when app returns to foreground
  const checkVolume = useCallback(() => {
    const vol = getSystemVolume();
    setVolumeLow(vol < VOLUME_THRESHOLD);
  }, []);

  useEffect(() => {
    checkVolume();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkVolume();
    });
    return () => sub.remove();
  }, [checkVolume]);

  // Wrapper around toggleAlarm: fires an alert when arming with low volume
  // so the user increases it before going to sleep
  const handleToggle = useCallback(
    (id: string) => {
      const alarm = alarms.find((a) => a.id === id);
      const willBeArmed = alarm && !alarm.isArmed;

      toggleAlarm(id);

      if (willBeArmed) {
        const vol = getSystemVolume();
        if (vol < VOLUME_THRESHOLD) {
          const pct = Math.round(vol * 100);
          Alert.alert(
            'Volume is low',
            `Your volume is at ${pct}%. Increase it so you can hear your alarm.`,
          );
        }
        // Refresh banner state
        setVolumeLow(vol < VOLUME_THRESHOLD);
      }
    },
    [alarms, toggleAlarm],
  );

  const renderItem = useCallback(
    ({ item }: { item: Alarm }) => (
      <AlarmRow
        alarm={item}
        onPress={() => router.push(`/alarm-edit?id=${item.id}`)}
        onToggle={() => handleToggle(item.id)}
        onDelete={() => deleteAlarm(item.id)}
      />
    ),
    [router, handleToggle, deleteAlarm],
  );

  const keyExtractor = useCallback((item: Alarm) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.header}>WAKE</Text>

        {/* Volume warning banner — only visible when armed and below threshold */}
        {volumeLow && hasArmedAlarm && (
          <TouchableOpacity
            style={styles.volumeBanner}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                'Volume is low',
                'Open Settings → Sounds & Haptics to increase your volume so you can hear your alarm.',
              )
            }
          >
            <Text style={styles.volumeBannerText}>
              Volume is low — you might not hear your alarm
            </Text>
          </TouchableOpacity>
        )}

        {/* Alarm List */}
        {alarms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alarms set</Text>
            <Text style={styles.emptySubtext}>Tap + to create one</Text>
          </View>
        ) : (
          <FlatList
            data={alarms}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Bottom bar: Add + Test */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/alarm-edit')}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>

          {/* Test Alarm -- development shortcut */}
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => router.push('/alarm-firing')}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Test Alarm</Text>
          </TouchableOpacity>
        </View>
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
  },
  header: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 4,
    color: '#5A5A63',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },

  // ── Empty state ──────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    color: '#5A5A63',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#3A3A42',
    marginTop: 8,
  },

  // ── Volume warning ─────────────────────────────────────────
  volumeBanner: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  volumeBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── List ─────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
  },

  // ── Row ──────────────────────────────────────────────────────
  rowWrapper: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  row: {
    backgroundColor: '#131316',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rowContent: {
    flex: 1,
  },
  rowLeft: {
    gap: 4,
  },
  rowTime: {
    fontSize: 36,
    fontWeight: '200',
    color: '#E8E8E3',
    letterSpacing: -1,
  },
  rowTimeDimmed: {
    opacity: 0.35,
  },
  rowDays: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9999A1',
    letterSpacing: 2,
  },

  // ── Toggle ───────────────────────────────────────────────────
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2A2A30',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: '#E8E8E3',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#5A5A63',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#0A0A0C',
  },

  // ── Bottom bar ───────────────────────────────────────────────
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#3A3A42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#E8E8E3',
    marginTop: -2,
  },
  testButton: {
    paddingVertical: 4,
  },
  testButtonText: {
    fontSize: 13,
    color: '#5A5A63',
  },
});
