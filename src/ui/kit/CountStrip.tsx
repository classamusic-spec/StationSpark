import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '../Text';
import { GlyphIcon, type GlyphId } from './GlyphIcon';

export type CountIcon = 'flame' | 'star' | 'drop' | 'dot' | 'paw';

/**
 * on  — the "done" mark; off — the "still to go" mark.
 * All drawn (art critique item #21) — no emoji anywhere in the strip.
 */
const glyph: Record<CountIcon, { on: GlyphId; off: GlyphId | 'socket' }> = {
  flame: { on: 'flame', off: 'drop' },
  star: { on: 'star', off: 'star-empty' },
  drop: { on: 'drop', off: 'socket' },
  dot: { on: 'dot', off: 'socket' },
  paw: { on: 'paw', off: 'socket' },
};

const GLYPH_SIZE = 30;

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
        {items.map((done, i) => {
          const shown = done ? (invert ? g.off : g.on) : invert ? g.on : g.off;
          return (
            <Animated.View key={`${i}-${done}`} entering={done ? ZoomIn.springify() : undefined}>
              <GlyphIcon id={shown} size={GLYPH_SIZE} muted={shown === 'socket'} />
            </Animated.View>
          );
        })}
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
});
