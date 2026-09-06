import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radii, roles, subjectColors, type SubjectId } from '@/theme';
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

/**
 * The quiet form of the same information.
 *
 * A row of seven-colour pills on a chooser card shouts as loudly as the title
 * and the picture, and a five-year-old cannot use it to choose. Where a card
 * only needs to *mention* what it practises, it prints one muted line and
 * leaves the colour-coded pills to the detail views (the map's location sheet,
 * the mission recap, the Grown-Ups report).
 */
export function SubjectLine({ subjects, max = 3, color }: { subjects: readonly SubjectId[]; max?: number; color?: string }) {
  if (subjects.length === 0) return null;
  const shown = subjects.slice(0, max).map((s) => labels[s]);
  const rest = subjects.length - shown.length;
  return (
    <Text variant="small" color={color ?? roles.ink.muted} numberOfLines={1}>
      {rest > 0 ? `${shown.join(' · ')} +${rest}` : shown.join(' · ')}
    </Text>
  );
}

/** "Math, Reading and Problem Solving" — for accessibility labels. */
export const subjectSentence = (subjects: readonly SubjectId[]) => subjects.map((s) => labels[s]).join(', ');

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
