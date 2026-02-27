import { requireNativeModule, Platform } from 'expo-modules-core';

interface AlarmKitNativeModule {
  requestAuthorization(): Promise<string>;
  getAuthorizationStatus(): string;
  getSystemVolume(): number;
  scheduleFixedAlarm(
    id: string,
    timestamp: number,
    soundName: string,
    title: string,
  ): Promise<boolean>;
  scheduleRecurringAlarm(
    id: string,
    hour: number,
    minute: number,
    weekdays: number[],
    soundName: string,
    title: string,
  ): Promise<boolean>;
  cancelAlarm(id: string): Promise<boolean>;
  cancelAllAlarms(): Promise<boolean>;
  getLaunchAlarmId(): string | null;
}

const NativeModule: AlarmKitNativeModule | null =
  Platform.OS === 'ios' ? requireNativeModule('AlarmKit') : null;

export type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined';

export async function requestAuthorization(): Promise<AuthorizationStatus> {
  if (!NativeModule) return 'denied';
  const result = await NativeModule.requestAuthorization();
  return result as AuthorizationStatus;
}

export function getAuthorizationStatus(): AuthorizationStatus {
  if (!NativeModule) return 'denied';
  return NativeModule.getAuthorizationStatus() as AuthorizationStatus;
}

/** Returns device output volume (0.0–1.0), or 1.0 on non-iOS so the warning never shows */
export function getSystemVolume(): number {
  if (!NativeModule) return 1.0;
  return NativeModule.getSystemVolume();
}

export async function scheduleFixedAlarm(
  id: string,
  timestamp: number,
  soundName: string,
  title: string = 'WAKE UP',
): Promise<boolean> {
  if (!NativeModule) return false;
  return NativeModule.scheduleFixedAlarm(id, timestamp, soundName, title);
}

export async function scheduleRecurringAlarm(
  id: string,
  hour: number,
  minute: number,
  weekdays: number[],
  soundName: string,
  title: string = 'WAKE UP',
): Promise<boolean> {
  if (!NativeModule) return false;
  return NativeModule.scheduleRecurringAlarm(id, hour, minute, weekdays, soundName, title);
}

export async function cancelAlarm(id: string): Promise<boolean> {
  if (!NativeModule) return false;
  return NativeModule.cancelAlarm(id);
}

export async function cancelAllAlarms(): Promise<boolean> {
  if (!NativeModule) return false;
  return NativeModule.cancelAllAlarms();
}

export function getLaunchAlarmId(): string | null {
  if (!NativeModule) return null;
  return NativeModule.getLaunchAlarmId();
}
