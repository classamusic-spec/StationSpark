/**
 * RECAP — "You used:" — the quiet, proud beat between the last game and the
 * celebration. Subject pills and the actual skills the child practised stagger
 * in while Captain Bea sums the mission up.
 *
 * Nothing here is a score. It is a list of things they can now do.
 *
 * Three layout faults lived here and are fixed. The screen used to add its own
 * `insets.top + 96` on top of the chrome offset the runner had already applied,
 * which opened ~200 px of raw sky above the card; the "Next" pill was absolutely
 * pinned to the bottom, so on a phone it sat *over* the last rows of the card
 * and the new-words line was unreadable behind it; and a big mission ticks
 * seventeen skills, one per line, which ran nine hundred pixels down a phone —
 * the child had to scroll past a receipt to find the way on, and Captain Bea's
 * line about it was off the bottom of the screen.
 *
 * So the ticks stop at a screenful and the rest are counted, and "Next" is a
 * sibling of the scroller rather than a layer over it: always on screen, and
 * incapable of covering a word.
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

/** one ticked line, and everything on the recap that is not one */
const TICK_ROW = 34;
const RECAP_FURNITURE = 660;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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
  const { contentWidth, height } = useScaledLayout();
  /** a reading column this wide fits two ticked skills side by side */
  const twoUp = contentWidth >= 460;

  /**
   * A big mission touches seventeen skill tags, and one green tick per tag ran
   * nine hundred pixels down a phone: the child had to scroll past a receipt to
   * find "Next", and Captain Bea's line about it was off the bottom of the
   * screen. A proud list is one you can take in — so the ticks stop at a
   * screenful and the rest are counted, which is also what Bea already says out
   * loud ("you practised 17 things today").
   *
   * `TICK_ROW` is one ticked line and `RECAP_FURNITURE` is everything on the
   * screen that is not one — the mission chrome, the heading, the subject pills,
   * the new-words line, Captain Bea and the "Next" pill — so the list takes the
   * rows the screen in hand actually has (its safe area included) and no more,
   * and the whole proud beat lands on one screen with nothing to scroll for.
   *
   * The budget is in ROWS, not ticks: a landscape tablet is the shortest screen
   * the game runs on, so twelve ticks fitted its two columns but pushed Captain
   * Bea off the bottom. Two columns buy twice the *list*, not twice the height —
   * which is the same bargain the rest of the app makes with a tablet.
   */
  const room = height - insets.top - insets.bottom;
  const tickRows = clamp(Math.floor((room - RECAP_FURNITURE) / TICK_ROW), 4, 10);
  const maxTicks = tickRows * (twoUp ? 2 : 1);

  const skills = useMemo(() => {
    const seen = new Set<SkillTag>();
    for (const r of results) for (const s of r.skills) seen.add(s);
    return Array.from(seen);
  }, [results]);
  const ticks = useMemo(
    () => (skills.length > 0 ? skills.map((s) => skillLabels[s] ?? s) : ['Helping the community']),
    [skills],
  );

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
        style={styles.scroller}
        contentContainerStyle={styles.scroll}
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
                {ticks.slice(0, maxTicks).map((label, i) => (
                  <SkillRow key={label} label={label} index={i} half={twoUp} />
                ))}
              </View>
              {ticks.length > maxTicks ? (
                <Animated.View entering={FadeInUp.delay(300 + maxTicks * stagger.tile).springify()}>
                  <Text variant="small" color={palette.navyMuted} center>
                    {`…and ${ticks.length - maxTicks} more`}
                  </Text>
                </Animated.View>
              ) : null}

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

          <Animated.View
            entering={FadeInUp.delay(420).springify().damping(15)}
            style={styles.beaconRow}
          >
            <CharacterPortrait id="bea" emotion="proud" size={72} />
            <View style={[styles.bubble, shadows.card]}>
              <Text variant="tiny" color={palette.navyMuted}>
                Captain Bea
              </Text>
              <Text variant="bodyStrong">{line}</Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Outside the scroller, always on screen. Seventeen ticked skills push
          "Next" a long way down a phone, and a child should never have to go
          looking for the way on from a celebration. It is a sibling of the
          scroller, not pinned over it, so it can never cover a word either —
          which is how it used to hide the new-words line. */}
      <Animated.View
        entering={FadeInUp.delay(560).springify().damping(15)}
        style={[
          styles.cta,
          { width: contentWidth, paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <Button
          label="Next"
          tone="green"
          size="xl"
          block
          iconRight={<ChevronRightIcon size={26} />}
          onPress={onNext}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  scroller: { alignSelf: 'stretch' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  /* The gutter lives *inside* the capped width, never outside it. `contentWidth`
     is `min(window, 520)`, so on a phone it IS the window: pad the scroller and
     the card is centred at full window width and clipped by both screen edges,
     which is how the recap and the reward card ended up with their corners cut
     off and their buttons touching the bezel. */
  stack: { gap: spacing.md, paddingHorizontal: spacing.md },
  cta: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  card: { gap: spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.xs,
    rowGap: 8,
    marginTop: spacing.xs,
  },
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
