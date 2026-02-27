# Architecture

## Overview

```
React Native UI (expo-router screens)
        │
        ▼
Zustand store (alarm-store.ts)
        │
        ▼
Alarm Scheduler (alarm-scheduler.ts)
        │
        ▼
Expo Native Module (AlarmKitModule.swift)
        │
        ▼
AlarmKit Framework → iOS System Alarm
```

The app is a thin React Native layer on top of Apple's AlarmKit. State lives in Zustand, scheduling happens through an Expo native module, and the system handles the actual alarm firing.

## Directory structure

```
app/
  _layout.tsx          Root layout — alarm launch detection, sound init, nav stack
  index.tsx            Home screen — alarm list, volume warning banner
  alarm-edit.tsx       Create/edit alarm — time, days, sound
  alarm-firing.tsx     Alarm experience — brightness, haptics, sound, challenge
  victory.tsx          Post-dismiss — stats, auto-navigate home

lib/
  alarm-store.ts       Zustand store — alarms array, persist to AsyncStorage
  alarm-scheduler.ts   Bridge to native AlarmKit — UUID mapping, scheduling
  sound-manager.ts     expo-av wrapper — alarm sound playback
  math-generator.ts    Arithmetic/algebra problem generator
  rhythm-generator.ts  Beatmap generator for rhythm challenge
  code-problems.ts     Code snippet problem bank
  types.ts             Shared TypeScript types
  constants.ts         Colors, typography, spacing tokens

components/
  TimeScroller.tsx     Snap-to-scroll hour/minute picker
  DaySelector.tsx      7-day toggle row
  SoundSelector.tsx    Modal bottom sheet sound picker
  ChallengeSelector.tsx  Challenge type toggle
  ArmButton.tsx        Animated arm/disarm circle
  VictoryDisplay.tsx   Dismiss stats display
  challenges/
    MathChallenge.tsx    Solve arithmetic to dismiss
    CodeChallenge.tsx    Pick correct code output
    RhythmChallenge.tsx  Tap rhythm targets

modules/alarm-kit/
  ios/AlarmKitModule.swift   Native module — AlarmKit scheduling, intents, volume
  src/index.ts               JS bindings for the native module
  index.ts                   Public re-exports
```

## Data flow

### Alarm creation → system scheduling

1. User sets time/days/sound in `alarm-edit.tsx`
2. On save, `alarm-store.addAlarm()` generates a short ID and appends to the alarms array
3. If armed, `alarm-scheduler.scheduleAlarm()` is called
4. Scheduler generates a UUID, maps it to the alarm ID, and calls `AlarmKitModule.scheduleRecurringAlarm()`
5. The native module creates an `AlarmManager.AlarmConfiguration` and schedules via `AlarmManager.shared.schedule()`

### Lock screen → challenge → dismissal

1. iOS fires the alarm — the lock screen shows "Open WAKE" and "Snooze" buttons
2. Both buttons trigger `LiveActivityIntent` subclasses that write the alarm UUID to `UserDefaults` and set `openAppWhenRun = true`
3. `_layout.tsx` checks `getLaunchAlarmId()` on foreground, reads the UUID from UserDefaults, and navigates to `alarm-firing`
4. `alarm-firing.tsx` maxes brightness, starts sound/haptics, and renders a random challenge
5. On challenge completion, `completeDismiss()` records elapsed time, stops effects, reschedules the alarm, and navigates to `victory.tsx`

## Native bridge

`AlarmKitModule.swift` is an Expo Module exposing these functions to JS:

- `requestAuthorization()` — prompts for alarm permission
- `scheduleFixedAlarm()` / `scheduleRecurringAlarm()` — schedule via AlarmKit
- `cancelAlarm()` / `cancelAllAlarms()` — cancel by UUID
- `getSystemVolume()` — reads `AVAudioSession.outputVolume`
- `getLaunchAlarmId()` — reads and clears the UUID from UserDefaults

### Intent system

Two `LiveActivityIntent` subclasses (`StopAlarmIntent`, `SnoozeAlarmIntent`) both set `openAppWhenRun = true`. This forces the app to open regardless of which button the user taps on the lock screen — there is no system-level snooze. The `secondaryButtonBehavior: .custom` on the alarm presentation bypasses the default snooze behavior.

## Challenge system

On `alarm-firing` mount, a challenge type is randomly selected from `['math', 'rhythm', 'code']`. Each challenge component receives an `onComplete` callback.

- **Math** — generates problems at difficulty 3 (two-step arithmetic). Wrong answer flashes white and generates a new problem.
- **Code** — picks a random code snippet from the problem bank. Wrong answer flashes and cycles to a new problem. Syntax highlighting is done with a lightweight regex tokenizer.
- **Rhythm** — generates a beatmap with targets at random positions. User must land 5 consecutive hits (within ±120ms timing window) without a miss. A miss resets the streak and generates a new beatmap.

## State management

Zustand store with `persist` middleware writing to AsyncStorage.

**Persisted** (via `partialize`):
- `alarms: Alarm[]` — the only thing that survives app restart

**Transient** (reset on restart):
- `activeAlarmId` — which alarm is currently firing
- `isRinging` — whether the alarm is actively sounding
- `challengeStartTime` — timestamp for calculating dismiss duration

**Migration**: `onRehydrateStorage` handles upgrading from v1 (single-alarm top-level fields) to v2 (alarms array). Also validates sound keys against the known set.

## Sound system

`sound-manager.ts` wraps expo-av. On `initialize()`, it configures the audio session for alarm playback (plays in silent mode). `playAlarm(soundKey)` loads the matching asset, sets looping, and starts playback. `stop()` unloads the sound.

## Volume warning

1. `AlarmKitModule.getSystemVolume()` reads `AVAudioSession.sharedInstance().outputVolume` (0.0–1.0)
2. JS wrapper returns 1.0 on non-iOS so the warning never triggers
3. `index.tsx` checks on mount and on foreground return
4. If below 30% and an alarm is armed: shows an orange banner + fires an alert when toggling arm on
