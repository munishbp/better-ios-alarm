import type { Beatmap, BeatTarget } from './types';

// ─── Difficulty Configuration ────────────────────────────────────────

interface DifficultyConfig {
  bpm: number;
  targetCount: number;
  timingJitterMs: number; // max random offset applied to beat times
}

const DIFFICULTY_MAP: Record<number, DifficultyConfig> = {
  1: { bpm: 60,  targetCount: 5, timingJitterMs: 0 },
  2: { bpm: 75,  targetCount: 6, timingJitterMs: 0 },
  3: { bpm: 90,  targetCount: 7, timingJitterMs: 25 },
  4: { bpm: 105, targetCount: 8, timingJitterMs: 40 },
  5: { bpm: 120, targetCount: 8, timingJitterMs: 50 },
};

// ─── Spatial Constraints ─────────────────────────────────────────────

/** Minimum padding from screen edges (normalized) */
const EDGE_PADDING = 0.15;

/** Range for valid coordinates: [EDGE_PADDING, 1 - EDGE_PADDING] */
const COORD_MIN = EDGE_PADDING;
const COORD_MAX = 1 - EDGE_PADDING;

/** Minimum Euclidean distance between consecutive targets */
const MIN_DISTANCE = 0.2;

/** Maximum Euclidean distance between consecutive targets */
const MAX_DISTANCE = 0.6;

/** Safety valve: max attempts to place a single target before relaxing constraints */
const MAX_PLACEMENT_ATTEMPTS = 100;

// ─── Utility Functions ───────────────────────────────────────────────

/** Euclidean distance between two normalized points */
function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Random float in [min, max] */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Clamp a value to the valid coordinate range */
function clampCoord(value: number): number {
  return Math.min(COORD_MAX, Math.max(COORD_MIN, value));
}

// ─── Target Generation ──────────────────────────────────────────────

/**
 * Generate a single target whose position satisfies spacing constraints
 * relative to the previous target (if any).
 */
function generateTarget(
  previous: BeatTarget | null,
  time: number,
): BeatTarget {
  // First target: purely random within padded bounds
  if (previous === null) {
    return {
      x: randomInRange(COORD_MIN, COORD_MAX),
      y: randomInRange(COORD_MIN, COORD_MAX),
      time,
    };
  }

  // Subsequent targets: must satisfy distance constraints
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const x = randomInRange(COORD_MIN, COORD_MAX);
    const y = randomInRange(COORD_MIN, COORD_MAX);
    const dist = distance(previous.x, previous.y, x, y);

    if (dist >= MIN_DISTANCE && dist <= MAX_DISTANCE) {
      return { x, y, time };
    }
  }

  // Fallback: deterministically place at exactly MIN_DISTANCE away
  // Pick a random angle and project from the previous target
  const angle = Math.random() * 2 * Math.PI;
  const targetDist = (MIN_DISTANCE + MAX_DISTANCE) / 2; // midpoint of valid range
  const x = clampCoord(previous.x + Math.cos(angle) * targetDist);
  const y = clampCoord(previous.y + Math.sin(angle) * targetDist);

  return { x, y, time };
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Generate a complete beatmap for the rhythm challenge.
 *
 * @param difficulty - Integer 1–5 controlling BPM, target count, and jitter.
 *                     Values outside 1–5 are clamped to the nearest bound.
 * @returns A fully-formed Beatmap ready for the rhythm challenge UI.
 *
 * Target generation rules:
 * - x and y are normalized 0–1 (caller converts to screen coordinates)
 * - 15% edge padding: coordinates stay within [0.15, 0.85]
 * - Consecutive targets are 0.2–0.6 apart (Euclidean distance)
 * - Base timing is one target per beat (60000 / bpm)
 * - Higher difficulties add random timing jitter (up to ±50ms)
 */
export function generateBeatmap(difficulty: number): Beatmap {
  // Clamp difficulty to valid range
  const clampedDifficulty = Math.max(1, Math.min(5, Math.round(difficulty)));

  const config = DIFFICULTY_MAP[clampedDifficulty];
  const beatIntervalMs = 60000 / config.bpm;

  const targets: BeatTarget[] = [];
  let previousTarget: BeatTarget | null = null;

  for (let i = 0; i < config.targetCount; i++) {
    // Base time: one target per beat
    let time = Math.round(i * beatIntervalMs);

    // Apply timing jitter at higher difficulties (skip first target for clean start)
    if (i > 0 && config.timingJitterMs > 0) {
      const jitter = randomInRange(-config.timingJitterMs, config.timingJitterMs);
      time = Math.max(0, Math.round(time + jitter));
    }

    const target = generateTarget(previousTarget, time);
    targets.push(target);
    previousTarget = target;
  }

  // Ensure targets are sorted by time (jitter could theoretically swap adjacent ones)
  targets.sort((a, b) => a.time - b.time);

  // Total duration: last target time + one extra beat interval for the final hit window
  const lastTargetTime = targets.length > 0 ? targets[targets.length - 1].time : 0;
  const duration = Math.round(lastTargetTime + beatIntervalMs);

  return {
    targets,
    bpm: config.bpm,
    duration,
    difficulty: clampedDifficulty,
  };
}
