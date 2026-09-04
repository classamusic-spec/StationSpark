import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Motion vocabulary. Use these instead of ad-hoc numbers so the whole
 * station "moves like one thing".
 */
export const springs = {
  /** Snappy pop for buttons, tiles appearing, tokens landing. */
  pop: { damping: 14, stiffness: 220, mass: 0.8 } satisfies WithSpringConfig,
  /** Overshooting celebration bounce. */
  bounce: { damping: 9, stiffness: 180, mass: 0.9 } satisfies WithSpringConfig,
  /** Gentle settle for panels, drawers, cards. */
  gentle: { damping: 20, stiffness: 140, mass: 1 } satisfies WithSpringConfig,
  /** Very soft, for idle bobbing and breathing. */
  soft: { damping: 26, stiffness: 90, mass: 1.2 } satisfies WithSpringConfig,
  /** Drag-release snapping into slots. */
  snap: { damping: 18, stiffness: 320, mass: 0.7 } satisfies WithSpringConfig,
} as const;

export const durations = {
  instant: 90,
  fast: 160,
  base: 260,
  slow: 420,
  cinematic: 800,
} as const;

export const easings = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  in: Easing.in(Easing.cubic),
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: Easing.linear,
} as const;

export const timings = {
  fast: { duration: durations.fast, easing: easings.out } satisfies WithTimingConfig,
  base: { duration: durations.base, easing: easings.out } satisfies WithTimingConfig,
  slow: { duration: durations.slow, easing: easings.inOut } satisfies WithTimingConfig,
  overshoot: { duration: durations.slow, easing: easings.overshoot } satisfies WithTimingConfig,
} as const;

/** Idle life: every character and prop should breathe a little. */
export const idle = {
  bobAmplitude: 3,
  bobPeriodMs: 2200,
  breatheScale: 0.02,
  blinkMinMs: 2600,
  blinkMaxMs: 5200,
  cloudDriftMs: 42000,
  flagWavePeriodMs: 1400,
} as const;

/** Stagger for lists/grids of tiles appearing. */
export const stagger = {
  tile: 60,
  card: 90,
} as const;
