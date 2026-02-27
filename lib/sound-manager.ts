import { Audio } from 'expo-av';
import type { SoundKey } from './types';

// ─── Sound Asset Map ─────────────────────────────────────────────────

const SOUND_ASSETS: Record<SoundKey, number> = {
  SIREN: require('../assets/sounds/siren.mp3'),
  PULSE: require('../assets/sounds/pulse.mp3'),
  GLASS: require('../assets/sounds/glass.mp3'),
  DRILL: require('../assets/sounds/drill.mp3'),
  HORN: require('../assets/sounds/horn.mp3'),
};

// ─── SoundManager Singleton ──────────────────────────────────────────

class SoundManager {
  private sound: Audio.Sound | null = null;

  /**
   * Configure the audio session for alarm playback.
   * Must be called once (e.g. at app startup) before any playback.
   */
  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    } catch (error: unknown) {
      console.warn('[SoundManager] Failed to set audio mode:', error);
    }
  }

  /**
   * Load and play an alarm sound in a loop at full volume.
   */
  async playAlarm(soundKey: SoundKey): Promise<void> {
    await this.stop();

    const asset = SOUND_ASSETS[soundKey];

    try {
      const { sound } = await Audio.Sound.createAsync(asset, {
        isLooping: true,
        volume: 1.0,
        shouldPlay: true,
      });

      this.sound = sound;
    } catch (error: unknown) {
      console.warn('[SoundManager] Failed to play alarm sound:', error);
      this.sound = null;
    }
  }

  /**
   * Stop playback and unload the sound.
   */
  async stop(): Promise<void> {
    if (this.sound !== null) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error: unknown) {
        console.warn('[SoundManager] Error while stopping sound:', error);
      }
      this.sound = null;
    }
  }
}

/** Singleton instance — import this throughout the app */
export const soundManager = new SoundManager();
