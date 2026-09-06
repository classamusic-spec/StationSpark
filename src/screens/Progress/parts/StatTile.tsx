import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radii, roles, spacing } from '@/theme';
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
  /**
   * The reference row layout (glyph left, number + label right) needs ~220 px;
   * narrower tiles stack glyph + number over a full-width label so a word is
   * never broken in half (rule 10: change the layout, not the label).
   */
  wide?: boolean;
}

/**
 * One of the four counting tiles on the progress board (reference frame F6):
 * a coloured glyph square with a darker edge and a white inner sheen, then
 * the number and its two-line label. The number counts up on arrival.
 */
export function StatTile({ value, label, color, glyph, delayMs = 0, wide = false }: StatTileProps) {
  const shown = useCountUp(value, { delayMs });
  const glyphBox = (
    <View style={[styles.glyphEdge, { backgroundColor: mix(color, palette.navy, 0.28) }]}>
      <View style={[styles.glyph, { backgroundColor: color }]}>
        {glyph}
        <View pointerEvents="none" style={styles.sheen} />
      </View>
    </View>
  );

  if (wide) {
    return (
      <Animated.View entering={FadeInDown.delay(delayMs).springify().damping(16)} style={[styles.tile, styles.row]}>
        {glyphBox}
        <View style={styles.text}>
          <Text variant="h1" color={palette.navy} style={styles.number}>
            {shown}
          </Text>
          <Text variant="small" color={palette.navySoft} style={styles.label}>
            {label.replace('\n', ' ')}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(delayMs).springify().damping(16)} style={[styles.tile, styles.stack]}>
      <View style={styles.top}>
        {glyphBox}
        <Text variant="h1" color={palette.navy} style={styles.number}>
          {shown}
        </Text>
      </View>
      <Text variant="small" color={palette.navySoft} style={styles.label}>
        {label}
      </Text>
    </Animated.View>
  );
}

const GLYPH = 56;

const styles = StyleSheet.create({
  tile: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    /* a number you read, not a button you press: no lift, one hairline */
    borderWidth: 1,
    borderColor: roles.border.hairline,
    padding: spacing.sm,
    flexGrow: 1,
    flexBasis: '46%',
  },
  stack: { gap: 6, minHeight: 118 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexBasis: '100%', minHeight: 92 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  glyphEdge: { borderRadius: radii.tile, paddingBottom: 4 },
  glyph: { width: GLYPH, height: GLYPH, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  sheen: { ...StyleSheet.absoluteFill, borderRadius: radii.tile, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  text: { flex: 1, minWidth: 0 },
  number: { includeFontPadding: false, lineHeight: 36 },
  label: { lineHeight: 19 },
});
