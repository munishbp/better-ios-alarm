// ─── Design Tokens for WAKE App ────────────────────────────────────
// Dark-first, high-contrast alarm clock design system

export const Colors = {
  // ─── Background Palette ──────────────────────────────────────
  bgPrimary: '#0A0A0C',       // Main app background — near-black
  bgSecondary: '#131316',     // Card / elevated surface background
  bgTertiary: '#1C1C21',      // Input fields, secondary surfaces
  bgOverlay: 'rgba(10, 10, 12, 0.85)', // Modal overlay

  // ─── Alarm / Accent Colors ───────────────────────────────────
  alarmBg: '#FF2D1A',         // Primary alarm red — firing state
  alarmBgMuted: '#CC2415',    // Darker alarm red for pressed states
  alarmGlow: 'rgba(255, 45, 26, 0.3)', // Glow/shadow for alarm elements
  accentOrange: '#FF6B35',    // Secondary accent — warnings, highlights
  accentAmber: '#FFB800',     // Tertiary accent — stars, achievements

  // ─── Text Colors ─────────────────────────────────────────────
  textPrimary: '#E8E8E3',     // Primary text — warm off-white
  textSecondary: '#9999A1',   // Secondary/muted text
  textTertiary: '#5A5A63',    // Disabled / hint text
  textOnAlarm: '#FFFFFF',     // Text on alarm-red backgrounds
  textOnDark: '#E8E8E3',      // Text on dark surfaces

  // ─── UI Element Colors ───────────────────────────────────────
  success: '#22C55E',         // Challenge completed, alarm dismissed
  successMuted: '#16A34A',    // Pressed/darker success
  error: '#EF4444',           // Wrong answer, validation error
  errorMuted: '#DC2626',      // Pressed/darker error
  divider: '#2A2A30',         // Subtle line separators
  border: '#3A3A42',          // Input borders, card outlines

  // ─── Challenge-specific Colors ───────────────────────────────
  mathAccent: '#818CF8',      // Indigo — math challenges
  rhythmAccent: '#F472B6',    // Pink — rhythm challenges
  codeAccent: '#34D399',      // Emerald — code challenges

  // ─── Utility ─────────────────────────────────────────────────
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Typography = {
  // ─── Font Families ───────────────────────────────────────────
  // Using system fonts; swap for custom fonts later if desired
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    mono: 'Courier',
  },

  // ─── Font Sizes ──────────────────────────────────────────────
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    clock: 96,        // Main clock display
  },

  // ─── Font Weights ────────────────────────────────────────────
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
    black: '900' as const,
  },

  // ─── Line Heights ────────────────────────────────────────────
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },

  // ─── Letter Spacing ──────────────────────────────────────────
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 2.0,
    clock: -2.0,      // Tight tracking for large clock numerals
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const Shadows = {
  /** Subtle elevation for cards */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  /** Glow effect for alarm state */
  alarmGlow: {
    shadowColor: Colors.alarmBg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  /** Success glow for victory state */
  successGlow: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

export const Animation = {
  /** Duration presets in ms */
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    glacial: 1000,
  },
  /** Spring config presets for react-native-reanimated */
  spring: {
    snappy: { damping: 15, stiffness: 200 },
    bouncy: { damping: 10, stiffness: 150 },
    gentle: { damping: 20, stiffness: 100 },
  },
} as const;

/** Sound identifiers mapping to asset files */
export const SoundAssets: Record<import('./types').SoundKey, string> = {
  SIREN: 'siren.mp3',
  PULSE: 'pulse.mp3',
  GLASS: 'glass.mp3',
  DRILL: 'drill.mp3',
  HORN: 'horn.mp3',
};

/** Day abbreviations in order */
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Challenge display metadata */
export const CHALLENGE_META = {
  math: {
    label: 'Math',
    icon: 'calculator',
    color: Colors.mathAccent,
    description: 'Solve calculus & algebra problems',
  },
  rhythm: {
    label: 'Rhythm',
    icon: 'musical-notes',
    color: Colors.rhythmAccent,
    description: 'Hit the beats in time',
  },
  code: {
    label: 'Code',
    icon: 'code-slash',
    color: Colors.codeAccent,
    description: 'Answer DSA questions',
  },
} as const;
