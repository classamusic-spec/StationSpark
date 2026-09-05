import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui';
import { useCountUp } from '@/hooks';
import { mix } from '@/characters/rig/palettes';

export interface StatTileProps {
  value: number;
  /** two short lines, e.g. "Missions\nCompleted" */
  label: string;
  /** the glyph tile colour */
  color: string;
  /** a drawn glyph from ./StatGlyphs — never an emoji */
  glyph: React.ReactNode;
  delayMs?: number;
}

/**
 * One of the four counting tiles on the progress board (reference frame F6):
 * a coloured glyph square with a darker edge and a white inner sheen, then
 * the number and its two-line label. The number counts up on arrival.
 */
export function StatTile({ value, label, color, glyph, delayMs = 0 }: StatTileProps) {
  const shown = useCountUp(value, { delayMs });
  return (
    <Animated.View entering={FadeInDown.delay(delayMs).springify().damping(16)} style={[styles.tile, shadows.soft]}>
      <View style={[styles.glyphEdge, { backgroundColor: mix(color, palette.navy, 0.28) }]}>
        <View style={[styles.glyph, { backgroundColor: color }]}>
          {glyph}
          <View pointerEvents="none" style={styles.sheen} />
        </View>
      </View>
      <View style={styles.text}>
        <Text variant="h1" color={palette.navy} style={styles.number}>
          {shown}
        </Text>
        <Text variant="small" color={palette.navySoft} style={styles.label}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

const GLYPH = 58;

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.sm,
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 92,
  },
  glyphEdge: { borderRadius: radii.tile, paddingBottom: 4 },
  glyph: { width: GLYPH, height: GLYPH, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  sheen: { ...StyleSheet.absoluteFill, borderRadius: radii.tile, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  text: { flex: 1, minWidth: 0 },
  number: { includeFontPadding: false, lineHeight: 34 },
  label: { lineHeight: 19 },
});
