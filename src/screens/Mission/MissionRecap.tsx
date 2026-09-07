/**
 * RECAP — "You used:" — the quiet, proud beat between the last game and the
 * celebration. Subject pills and the actual skills the child practised stagger
 * in while Captain Bea sums the mission up.
 *
 * Nothing here is a score. It is a list of things they can now do.
 *
 * Two layout faults lived here and are fixed. The screen used to add its own
 * `insets.top + 96` on top of the chrome offset the runner had already applied,
 * which opened ~200 px of raw sky above the card; and the "Next" pill was
 * absolutely pinned to the bottom, so on a phone it sat *over* the last rows of
 * the card and the new-words line was unreadable behind it. The CTA is in the
 * flow now — `space-between` puts it at the foot when there is room and pushes
 * it down when there is not, and it can never cover a word.
 *
 * The list is the content, so it is what the extra width on a tablet buys:
 * past a reading column's worth of room the skills run in two columns instead
 * of leaving half the card empty, while the card and the pill stay capped at
 * `contentWidth` (see `src/screens/shared/useScaledLayout.ts`).
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
import { useScaledLayout } from '@/screens/shared';

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

function SkillRow({ label, index, half }: { label: string; index: number; half: boolean }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * stagger.tile)
        .springify()
        .damping(15)}
      style={[styles.skill, half ? styles.skillHalf : styles.skillFull]}
    >
      <View style={styles.tick}>
        <CheckIcon size={16} color={palette.white} />
      </View>
      <Text variant="bodyStrong" style={styles.skillLabel}>
        {label}
      </Text>
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
  const { contentWidth } = useScaledLayout();
  /** a reading column this wide fits two ticked skills side by side */
  const twoUp = contentWidth >= 460;

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
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.stack, { width: contentWidth }]}>
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
                <SkillRow key={label} label={label} index={i} half={twoUp} />
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
      </View>

      <Animated.View entering={FadeInUp.delay(560).springify().damping(15)} style={{ width: contentWidth }}>
        <Button label="Next" tone="green" size="xl" block iconRight={<ChevronRightIcon size={26} />} onPress={onNext} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  stack: { gap: spacing.md },
  card: { gap: spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  skills: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xs, rowGap: 8, marginTop: spacing.xs },
  skill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  skillFull: { width: '100%' },
  skillHalf: { width: '48%' },
  skillLabel: { flexShrink: 1 },
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
  /* the CTA lives in the flow now — nothing is pinned over the card */
  bubble: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomLeftRadius: 8,
    padding: spacing.sm,
  },
});
