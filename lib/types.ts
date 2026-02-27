// ─── Core Types for WAKE App ───────────────────────────────────────
// Strict TypeScript types — no `any` types allowed.

// ─── Challenge Types ─────────────────────────────────────────────────

/** Discriminated union of available challenge modes */
export type ChallengeType = 'rhythm' | 'math' | 'code';

// ─── Sound Types ─────────────────────────────────────────────────────

/** Type-safe sound asset keys */
export type SoundKey = 'SIREN' | 'PULSE' | 'GLASS' | 'DRILL' | 'HORN';

// ─── Alarm Configuration ─────────────────────────────────────────────

/** Seven-element boolean tuple representing enabled days Mon through Sun */
export type EnabledDaysTuple = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

/** A single alarm entry */
export interface Alarm {
  id: string;
  time: { hour: number; minute: number };
  enabledDays: boolean[];
  soundChoice: SoundKey;
  isArmed: boolean;
}

// ─── Math Challenge Types ────────────────────────────────────────────

/** A generated math problem for the math challenge */
export interface MathProblem {
  question: string;
  answer: number;
  display: string;
  difficulty: number;
}

// ─── Code Challenge Types ────────────────────────────────────────────

/** Supported code snippet languages */
export type CodeLanguage = 'python' | 'javascript';

/** A multiple-choice code/DSA challenge problem */
export interface CodeProblem {
  id: string;
  code: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  language: CodeLanguage;
}

// ─── Rhythm Challenge Types ──────────────────────────────────────────

/** A single beat target in normalized coordinates */
export interface BeatTarget {
  x: number;      // 0–1 normalized horizontal position
  y: number;      // 0–1 normalized vertical position
  time: number;   // ms from start of the beatmap
}

/** A complete beatmap for one rhythm challenge attempt */
export interface Beatmap {
  targets: BeatTarget[];
  bpm: number;
  duration: number; // total duration in ms
  difficulty: number;
}

/** Accuracy classification for a single tap */
export type HitResult = 'perfect' | 'good' | 'miss';

// ─── Challenge Component Types ───────────────────────────────────────

/** Callback invoked when a challenge is successfully completed */
export type OnChallengeComplete = () => void;

/** Props shared by all challenge screen components */
export interface ChallengeProps {
  onComplete: OnChallengeComplete;
}
