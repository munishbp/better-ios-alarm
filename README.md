# WAKE

iOS alarm app that forces you out of bed with wake-up challenges.

## What it does

WAKE uses the iOS 26 AlarmKit framework to fire real system alarms. When the alarm goes off, you have to solve a math problem, read code output, or hit a rhythm pattern before it stops. No snooze button — both lock screen actions open the app.

## Features

- **Math challenges** — arithmetic and algebra at configurable difficulty
- **Code challenges** — read a code snippet and pick the correct output
- **Rhythm challenges** — tap targets in time, 5 consecutive hits to dismiss
- **AlarmKit native integration** — system-level alarms that ring even when the app is killed
- **Volume warnings** — detects low volume and warns before you go to sleep
- **Hold-to-skip** — 30-second hold as an escape hatch

## Tech stack

- React Native 0.81 + Expo 54
- expo-router for navigation
- Zustand for state management (persisted via AsyncStorage)
- Custom Expo native module bridging AlarmKit
- expo-av, expo-brightness, expo-haptics

## Setup

```bash
npm install
cd ios && pod install && cd ..
npx expo run:ios
```

Requires Xcode with iOS 26 SDK.
