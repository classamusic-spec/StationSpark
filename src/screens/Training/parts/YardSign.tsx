/**
 * YARD SIGN — a group header on the training course: the one cream sign
 * board, standing on two wooden posts in the grass, with the subject name
 * and how many stations are under it.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, radii } from '@/theme';
import { GlyphIcon, Text } from '@/ui';
import { SignBoard } from '@/screens/Locker/parts/SignBoard';

export interface YardSignProps {
  label: string;
  count: number;
  /** subject glyph id, e.g. "subject-math" */
  glyph?: string;
  /** subject colour for the glyph disc */
  color?: string;
}

export function YardSign({ label, count, glyph, color = palette.safetyYellow }: YardSignProps) {
  return (
    <SignBoard posts>
      {glyph ? (
        <View style={[styles.disc, { backgroundColor: color }]}>
          <GlyphIcon id={glyph} size={20} label="" />
        </View>
      ) : null}
      <Text variant="h3">{label}</Text>
      <View style={styles.count}>
        <Text variant="tiny" color={palette.navy}>
          {String(count)}
        </Text>
      </View>
    </SignBoard>
  );
}

const styles = StyleSheet.create({
  disc: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  count: { minWidth: 26, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: palette.tan, alignItems: 'center' },
});
