import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '../Text';

export type CountIcon = 'flame' | 'star' | 'drop' | 'dot' | 'paw';

const glyph: Record<CountIcon, { on: string; off: string }> = {
  flame: { on: '🔥', off: '💧' },
  star: { on: '⭐', off: '☆' },
  drop: { on: '💧', off: '○' },
  dot: { on: '●', off: '○' },
  paw: { on: '🐾', off: '○' },
};

/**
 * "3 / 6" progress strip with icons — done items render as `done` glyph.
 * `remainingFirst` shows the remaining ones first (like the Hose Hero reference).
 */
export function CountStrip({
  current,
  total,
  icon = 'dot',
  label,
  invert,
}: {
  current: number;
  total: number;
  icon?: CountIcon;
  label?: string;
  /** when true, "done" items show the OFF glyph (e.g. flames extinguished become water drops) */
  invert?: boolean;
}) {
  const g = glyph[icon];
  const items = Array.from({ length: total }, (_, i) => i < current);
  return (
    <Animated.View entering={FadeIn} style={[styles.wrap, shadows.card]}>
      <View style={styles.row}>
        {items.map((done, i) => (
          <Animated.Text key={`${i}-${done}`} entering={done ? ZoomIn.springify() : undefined} style={[styles.glyph, !done && styles.dim]}>
            {done ? (invert ? g.off : g.on) : invert ? g.on : g.off}
          </Animated.Text>
        ))}
      </View>
      <Text variant="h2" center>
        {current} / {total}
      </Text>
      {label ? (
        <Text variant="small" color={palette.navySoft} center>
          {label}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 2 },
  glyph: { fontSize: 30 },
  dim: { opacity: 0.35 },
});
