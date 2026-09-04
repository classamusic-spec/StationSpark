import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { AgeBand } from '@/learning/types';
import { palette, radii, shadows, spacing } from '@/theme';
import { AnswerTile, Text } from '@/ui';
import type { AnswerState } from '@/ui/kit/AnswerTile';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { FlameGlyph } from '@/world/props';

export type CountGlyph = 'flame' | 'paw' | 'drop' | 'none';

function Glyphs({ count, kind, size }: { count: number; kind: CountGlyph; size: number }) {
  if (kind === 'none' || count <= 0 || count > 12) return null;
  return (
    <View style={styles.glyphRow}>
      {Array.from({ length: count }, (_, i) =>
        kind === 'flame' ? (
          <FlameGlyph key={i} size={size} />
        ) : (
          <View key={i} style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }]} />
        ),
      )}
    </View>
  );
}

export interface AskQuestionProps {
  visible: boolean;
  question: string;
  es?: string;
  options: readonly number[];
  correct: number;
  ageBand: AgeBand;
  /** band A gets this many icons drawn on each tile so it can be counted */
  countGlyph?: CountGlyph;
  /** highlight the right answer (hint ladder level 2) */
  assist?: boolean;
  /** called with true on the first correct tap, false on every wrong one */
  onAnswer: (correctTap: boolean, value: number) => void;
  compact?: boolean;
}

/**
 * The mid-game maths beat: a soft scrim, Beacon asking, and big AnswerTiles.
 * Wrong taps wobble the tile and come straight back — nothing is ever lost.
 */
export function AskQuestion(props: AskQuestionProps) {
  if (!props.visible) return null;
  // Fresh mount per question keeps the tile states honest without reset effects.
  return <AskQuestionCard key={props.question} {...props} />;
}

function AskQuestionCard({ question, es, options, correct, ageBand, countGlyph = 'none', assist, onAnswer, compact }: AskQuestionProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      list.length = 0;
    };
  }, []);

  useEffect(() => {
    sfx.play('robot-beep', { volume: 0.7 });
    speech.say(question, { speaker: 'beacon' });
  }, [question]);

  const glyph: CountGlyph = ageBand === 'A' ? countGlyph : 'none';

  const onTap = useCallback(
    (value: number) => {
      if (picked !== null) return;
      if (value === correct) {
        setPicked(value);
        sfx.play('correct');
        haptics.success();
        speech.say(String(value), { speaker: 'beacon' });
        onAnswer(true, value);
      } else {
        setWrong(value);
        sfx.play('wrong-soft');
        haptics.nudge();
        onAnswer(false, value);
        timers.current.push(setTimeout(() => setWrong(null), 620));
      }
    },
    [correct, onAnswer, picked],
  );

  const tileState = useCallback(
    (value: number): AnswerState => {
      if (picked === value) return 'correct';
      if (wrong === value) return 'wrong';
      if (picked !== null) return 'disabled';
      if (assist && value === correct) return 'highlight';
      return 'idle';
    },
    [assist, correct, picked, wrong],
  );

  const list = useMemo(() => Array.from(options), [options]);

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
      <Animated.View entering={ZoomIn.springify().damping(15)} style={[styles.card, shadows.card, compact && styles.cardCompact]}>
        <View style={styles.head}>
          <CharacterPortrait id="beacon" emotion="think" size={compact ? 52 : 64} />
          <View style={styles.headText}>
            <Text variant={compact ? 'h3' : 'h2'}>{question}</Text>
            {es ? (
              <Text variant="small" color={palette.purple}>
                {es}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.row}>
          {list.map((value, i) => (
            <AnswerTile
              key={value}
              index={i}
              size={ageBand === 'A' ? 'lg' : 'md'}
              state={tileState(value)}
              onPress={() => onTap(value)}
              accessibilityLabel={`${value}`}
            >
              <Text variant={ageBand === 'A' ? 'numeral' : 'h1'}>{value}</Text>
              <Glyphs count={value} kind={glyph} size={ageBand === 'A' ? 16 : 12} />
            </AnswerTile>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(31,42,90,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    zIndex: 60,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
  },
  cardCompact: { padding: spacing.md, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  glyphRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginTop: 4, maxWidth: 110 },
  dot: { backgroundColor: palette.waterCyan },
});
