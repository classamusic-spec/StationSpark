import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radii, subjectColors, type SubjectId } from '@/theme';
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

const glyphs: Record<SubjectId, string> = {
  math: '＋',
  reading: '📖',
  english: '💬',
  spanish: '💬',
  logic: '💡',
  teamwork: '🤝',
  cooking: '🍳',
};

export function SubjectPill({ subject, small }: { subject: SubjectId; small?: boolean }) {
  const c = subjectColors[subject];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, small && styles.small]}>
      <Text variant={small ? 'tiny' : 'small'} color={c.fg}>
        {glyphs[subject]} {labels[subject]}
      </Text>
    </View>
  );
}

export const subjectLabel = (s: SubjectId) => labels[s];

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.tag,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 9, paddingVertical: 4 },
});
