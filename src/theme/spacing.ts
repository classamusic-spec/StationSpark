export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Everything in Station Spark is *very* rounded. */
export const radii = {
  tag: 14,
  tile: 20,
  card: 24,
  panel: 28,
  pill: 999,
} as const;

/** Minimum tap target for small hands. */
export const hit = {
  min: 56,
  big: 72,
} as const;
