/**
 * RECAP — "You used:" — the quiet, proud beat between the last game and the
 * celebration. Subject pills and the actual skills the child practised stagger
 * in while Captain Bea sums the mission up.
 *
 * Nothing here is a score. It is a list of things they can now do.
 */
import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SkillTag } from '@/learning/types';
import type { MissionDef } from '@/content/types';
import type { MiniGameResult } from '@/minigames/types';
import { palette, radii, shadows, spacing, stagger } from '@/theme';
import { sfx } from '@/services/audio';
import { speech } from '@/services/speech';
import { Button, Panel, SubjectPill, Text } from '@/ui';
import { CheckIcon, ChevronRightIcon } from '@/ui/icons';
import { CharacterPortrait } from '@/characters';

/** Kid-facing names for every skill tag. */
export const skillLabels: Record<SkillTag, string> = {
  counting: 'Counting',
  'number-recognition': 'Reading numbers',
  addition: 'Adding',
  subtraction: 'Taking away',
  multiplication: 'Times tables',
  division: 'Sharing equally',
  'fraction-half': 'Halves',
  'fraction-quarter': 'Quarters',
  'fraction-equivalent': 'Equal fractions',
  measurement: 'Measuring',
  money: 'Money',
  time: 'Telling time',
  patterns: 'Patterns',
  sorting: 'Sorting',
  geometry: 'Shapes',
  spatial: 'Space & shape',
  sequencing: 'Putting things in order',
  comparison: 'Comparing',
  estimation: 'Estimating',
  'reading-words': 'Reading words',
  'reading-sentences': 'Reading sentences',
  'reading-directions': 'Following directions',
  spelling: 'Spelling',
  'vocabulary-en': 'New English words',
  'vocabulary-es': 'New Spanish words',
  'listening-es': 'Listening in Spanish',
  teamwork: 'Teamwork',
};

function SkillRow({ label, index }: { label: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * stagger.tile)
        .springify()
        .damping(15)}
      style={styles.skill}
    >
      <View style={styles.tick}>
        <CheckIcon size={16} color={palette.white} />
      </View>
      <Text variant="bodyStrong">{label}</Text>
    </Animated.View>
  );
}

export interface MissionRecapProps {
  mission: MissionDef;
  results: MiniGameResult[];
  onNext: () => void;
}

export function MissionRecap({ mission, results, onNext }: MissionRecapProps) {
  const insets = useSafeAreaInsets();

  const skills = useMemo(() => {
    const seen = new Set<SkillTag>();
    for (const r of results) for (const s of r.skills) seen.add(s);
    return Array.from(seen);
  }, [results]);

  const words = useMemo(() => {
    const seen = new Set<string>();
    for (const r of results) for (const w of r.wordsLearned ?? []) seen.add(w);
    return Array.from(seen);
  }, [results]);

  const line = `Great work at ${mission.title}! You practised ${skills.length || mission.subjects.length} things today.`;

  useEffect(() => {
    sfx.play('sparkle');
    const t = setTimeout(() => speech.say(line, { speaker: 'bea' }), 420);
    return () => {
      clearTimeout(t);
      speech.stop();
    };
  }, [line]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110, paddingTop: insets.top + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify().damping(16)}>
          <Panel tone="white" radius="panel" style={styles.card}>
            <Text variant="display" center>
              You used:
            </Text>

            <View style={styles.pills}>
              {mission.subjects.map((s, i) => (
                <Animated.View
                  key={s}
                  entering={FadeInUp.delay(120 + i * stagger.tile)
                    .springify()
                    .damping(13)}
                >
                  <SubjectPill subject={s} />
                </Animated.View>
              ))}
            </View>

            <View style={styles.skills}>
              {(skills.length > 0 ? skills.map((s) => skillLabels[s] ?? s) : ['Helping the community']).map((label, i) => (
                <SkillRow key={label} label={label} index={i} />
              ))}
            </View>

            {words.length > 0 ? (
              <Animated.View entering={FadeInUp.delay(560).springify()} style={styles.words}>
                <Text variant="tiny" color={palette.navyMuted}>
                  NEW WORDS
                </Text>
                <Text variant="bodyStrong" color={palette.purple}>
                  {words.join(' · ')}
                </Text>
              </Animated.View>
            ) : null}
          </Panel>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(420).springify().damping(15)} style={styles.beaconRow}>
          <CharacterPortrait id="bea" emotion="proud" size={72} />
          <View style={[styles.bubble, shadows.card]}>
            <Text variant="tiny" color={palette.navyMuted}>
              Captain Bea
            </Text>
            <Text variant="bodyStrong">{line}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
        <Button label="Next" tone="green" size="xl" block iconRight={<ChevronRightIcon size={26} />} onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, gap: spacing.md },
  card: { gap: spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  skills: { gap: 8, marginTop: spacing.xs },
  skill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tick: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.leafGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { marginTop: spacing.xs, gap: 2 },
  beaconRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  bubble: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomLeftRadius: 8,
    padding: spacing.sm,
  },
  ctaWrap: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: 0 },
});
