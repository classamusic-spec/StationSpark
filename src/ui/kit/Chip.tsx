import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, radii } from '@/theme';
import { Text } from '../Text';
import { GlyphIcon } from './GlyphIcon';

export type ChipTone = 'cream' | 'navy' | 'green' | 'purple' | 'yellow';
const tones: Record<ChipTone, { bg: string; fg: string }> = {
  cream: { bg: palette.creamDeep, fg: palette.navy },
  navy: { bg: palette.navy, fg: palette.white },
  green: { bg: palette.mint, fg: palette.leafGreenDark },
  purple: { bg: palette.purpleSoft, fg: '#5B3FD6' },
  yellow: { bg: '#FFE9A8', fg: palette.navy },
};

/** Small info chip: "Ask a grown-up", "x3", "Level 2". Optional drawn mark on the left. */
export function Chip({ label, tone = 'cream', glyph }: { label: string; tone?: ChipTone; glyph?: string }) {
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, glyph ? styles.withGlyph : null]}>
      {glyph ? <GlyphIcon id={glyph} size={16} /> : null}
      <Text variant="tiny" color={t.fg}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The mandatory safety chip for anything hot/sharp in the kitchen.
 * The waving hand is drawn (art critique item #21) — it used to be an emoji.
 */
export const GrownUpChip = () => <Chip label="Ask a grown-up" tone="yellow" glyph="wave" />;

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.tag, alignSelf: 'flex-start' },
  withGlyph: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 7 },
});
