import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, radii } from '@/theme';
import { Text } from '../Text';

export type ChipTone = 'cream' | 'navy' | 'green' | 'purple' | 'yellow';
const tones: Record<ChipTone, { bg: string; fg: string }> = {
  cream: { bg: palette.creamDeep, fg: palette.navy },
  navy: { bg: palette.navy, fg: palette.white },
  green: { bg: palette.mint, fg: palette.leafGreenDark },
  purple: { bg: palette.purpleSoft, fg: '#5B3FD6' },
  yellow: { bg: '#FFE9A8', fg: palette.navy },
};

/** Small info chip: "Ask a grown-up 👋", "x3", "Level 2". */
export function Chip({ label, tone = 'cream' }: { label: string; tone?: ChipTone }) {
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      <Text variant="tiny" color={t.fg}>
        {label}
      </Text>
    </View>
  );
}

/** The mandatory safety chip for anything hot/sharp in the kitchen. */
export const GrownUpChip = () => <Chip label="Ask a grown-up 👋" tone="yellow" />;

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.tag, alignSelf: 'flex-start' },
});
