/**
 * SAFETY POSTER — the five real-world lines, framed in wood on the station
 * wall. These are the only real-world emergency messages the app gives
 * (docs/ART_DIRECTION.md), so they get a proper poster, not a bullet list.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, radii, shadows, spacing } from '@/theme';
import { GlyphIcon, GrownUpChip, Text } from '@/ui';

export const SAFETY_LINES = [
  'Get away from danger.',
  'Tell a grown-up.',
  'Follow emergency instructions.',
  'Call your local emergency number.',
  'Never hide from firefighters.',
] as const;

export function SafetyPoster() {
  return (
    <View style={[styles.frame, shadows.card]} accessible accessibilityRole="summary" accessibilityLabel="Safety poster">
      <View style={styles.inner}>
        <View style={styles.poster}>
          <View style={styles.band}>
            <GlyphIcon id="flame" size={22} label="" />
            <Text variant="buttonSmall" color={palette.white} center style={styles.bandText}>
              IF THERE IS A REAL EMERGENCY
            </Text>
          </View>
          <Text variant="small" color={palette.navySoft} center>
            Station Spark is a game and never teaches real fire procedure. These are the only real-world messages it gives:
          </Text>
          <View style={styles.list}>
            {SAFETY_LINES.map((line, i) => (
              <View key={line} style={styles.row}>
                <View style={styles.disc}>
                  <Text variant="tiny" color={palette.white} center style={styles.digit}>
                    {String(i + 1)}
                  </Text>
                </View>
                <Text variant="bodyStrong" style={styles.line}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.foot}>
            <GrownUpChip />
            <Text variant="tiny" color={palette.navyMuted}>
              before anything hot or sharp in the kitchen
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: palette.wood, borderRadius: radii.card, padding: 9 },
  inner: { backgroundColor: palette.woodDark, borderRadius: radii.tile, padding: 3 },
  poster: {
    backgroundColor: palette.cream,
    borderRadius: radii.tile - 2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.engineRed,
    borderRadius: radii.tag,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  bandText: { flexShrink: 1 },
  list: { gap: spacing.xs, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  disc: { width: 28, height: 28, borderRadius: 14, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  digit: { includeFontPadding: false, letterSpacing: 0 },
  line: { flex: 1 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap', marginTop: 2 },
});
