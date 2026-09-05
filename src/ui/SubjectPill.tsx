import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radii, subjectColors, type SubjectId } from '@/theme';
import { GlyphIcon } from './kit/GlyphIcon';
import { Text } from './Text';

const labels: Record<SubjectId, string> = {
  math: 'Math',
  reading: 'Reading',
  english: 'English',
  spanish: 'Español',
  logic: 'Problem Solving',
  teamwork: 'Teamwork',
  cooking: 'Cooking',
};

/**
 * The seven subject marks are drawn SVG (art critique item #21) — an emoji next
 * to a hand-drawn glyph in the same row is the loudest "unfinished" signal in
 * the app. Each is authored white-forward so it reads on its own pill colour.
 */
export function SubjectPill({ subject, small }: { subject: SubjectId; small?: boolean }) {
  const c = subjectColors[subject];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, small && styles.small]}>
      <GlyphIcon id={subject} size={small ? 16 : 20} label={labels[subject]} />
      <Text variant={small ? 'tiny' : 'small'} color={c.fg}>
        {labels[subject]}
      </Text>
    </View>
  );
}

export const subjectLabel = (s: SubjectId) => labels[s];

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 9,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: radii.tag,
    alignSelf: 'flex-start',
  },
  small: { gap: 4, paddingLeft: 7, paddingRight: 9, paddingVertical: 4 },
});
