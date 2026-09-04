import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Button, CheckIcon, Chip, SpeakerIcon, Text, VocabIcon } from '@/ui';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useHintLadder } from '../shared/useHintLadder';
import { CrateBox } from '../shared/art/Props';
import { numberWordFor } from '../shared/labels';

interface State {
  phase: 'counting' | 'solved';
  taken: number[];
  misses: number;
}

type Action = { type: 'TAKE'; index: number } | { type: 'PUT_BACK'; index: number } | { type: 'MISS' } | { type: 'SOLVE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TAKE':
      return state.taken.includes(action.index) ? state : { ...state, taken: [...state.taken, action.index] };
    case 'PUT_BACK':
      return { ...state, taken: state.taken.filter((i) => i !== action.index) };
    case 'MISS':
      return { ...state, misses: state.misses + 1 };
    case 'SOLVE':
      return { ...state, phase: 'solved' };
    default:
      return state;
  }
}

export function ListenCount({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'listen-count'>) {
  const session = useMiniGameSession('listen-count', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'counting', taken: [], misses: 0 });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const [revealed, setRevealed] = useState(false);
  const done = useRef(false);

  const support = challenge.support ?? (ageBand === 'C' ? 'min' : ageBand === 'B' ? 'some' : 'full');
  const showEnglish = support === 'full' || (support === 'some' && revealed) || (support === 'min' && revealed);

  const shelf = useMemo(
    () => Array.from({ length: Math.max(challenge.count, challenge.maxOnScreen) }, (_, i) => i),
    [challenge.count, challenge.maxOnScreen],
  );

  const speakPhrase = useCallback(() => {
    sfx.play('robot-beep');
    speech.say(challenge.phraseEs, { speaker: 'beacon', lang: 'es' });
  }, [challenge.phraseEs]);

  useEffect(() => {
    session.say('beacon', challenge.phraseEn, challenge.phraseEs);
    const t = setTimeout(speakPhrase, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    session.progress(state.taken.length, challenge.count);
  }, [challenge.count, session, state.taken.length]);

  const take = useCallback(
    (index: number) => {
      if (state.phase === 'solved') return;
      sfx.play('pop');
      haptics.select();
      dispatch({ type: 'TAKE', index });
    },
    [state.phase],
  );

  const putBack = useCallback(
    (index: number) => {
      if (state.phase === 'solved') return;
      sfx.play('tap-soft');
      haptics.tap();
      dispatch({ type: 'PUT_BACK', index });
    },
    [state.phase],
  );

  const check = useCallback(() => {
    if (state.phase === 'solved') return;
    if (state.taken.length === challenge.count) {
      dispatch({ type: 'SOLVE' });
      session.correct(String(challenge.count));
      session.learnedWord(challenge.item.es);
      session.learnedWord(numberWordFor(challenge.count).es);
      sfx.play('correct');
      haptics.celebrate();
      setTimeout(
        () => speech.say(`${numberWordFor(challenge.count).es} ${challenge.item.es}`, { speaker: 'beacon', lang: 'es' }),
        450,
      );
      if (!done.current) {
        done.current = true;
        setTimeout(() => session.complete(), 1500);
      }
    } else {
      dispatch({ type: 'MISS' });
      session.incorrect(String(state.taken.length));
      sfx.play('wrong-soft');
      haptics.nudge();
      speakPhrase();
    }
  }, [challenge.count, challenge.item.es, session, speakPhrase, state.phase, state.taken.length]);

  const word = numberWordFor(challenge.count);
  const hintText = `Beacon said “${word.es}”. ${word.es} = ${challenge.count}. Put ${challenge.count} in the crate!`;
  const itemSize = layout.s(ageBand === 'A' ? 58 : 50);
  const crateWidth = Math.min(layout.s(190), layout.boxWidth * 0.6);

  return (
    <GameFrame
      title="Listen & Count"
      subtitle={ageBand === 'A' ? undefined : 'Beacon speaks Spanish. Fill the crate!'}
      compact={compact}
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.trayInner}>
          <View style={styles.trayRow}>
            <Button
              label="Otra vez"
              tone="purple"
              size="md"
              sound="none"
              icon={<SpeakerIcon size={22} color={palette.white} />}
              onPress={speakPhrase}
            />
            <Button
              label="Done"
              tone="green"
              size="md"
              icon={<CheckIcon size={22} />}
              onPress={check}
              disabled={state.phase === 'solved' || state.taken.length === 0}
            />
          </View>
          {hintLadder.level > 0 && state.phase !== 'solved' ? (
            <Animated.View entering={FadeIn} style={styles.fingers}>
              <Text variant="bodyStrong" center>
                {word.es} = {challenge.count}
              </Text>
              <View style={styles.fingerRow}>
                {Array.from({ length: challenge.count }, (_, i) => (
                  <View key={i} style={styles.finger} />
                ))}
              </View>
            </Animated.View>
          ) : null}
        </View>
      }
    >
      <View style={styles.stage}>
        <Pressable
          onPress={() => {
            setRevealed(true);
            speakPhrase();
          }}
          accessibilityRole="button"
          accessibilityLabel="Hear the phrase again"
        >
          <View style={styles.phraseCard}>
            <Text variant="h3" color={palette.purple} center>
              {challenge.phraseEs}
            </Text>
            {showEnglish ? (
              <Text variant="small" color={palette.navySoft} center>
                {challenge.phraseEn}
              </Text>
            ) : (
              <Text variant="tiny" color={palette.navyMuted} center>
                TAP FOR ENGLISH
              </Text>
            )}
          </View>
        </Pressable>

        <View style={styles.shelfWrap}>
          <View style={styles.shelfItems}>
            {shelf.map((i) =>
              state.taken.includes(i) ? null : (
                <Pressable
                  key={i}
                  onPress={() => take(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add one ${challenge.item.es}`}
                  hitSlop={6}
                >
                  <Animated.View entering={ZoomIn.delay(i * 45).springify().damping(14)} style={styles.shelfItem}>
                    <VocabIcon id={challenge.item.id} size={itemSize} />
                  </Animated.View>
                </Pressable>
              ),
            )}
          </View>
          <View style={styles.shelfBoard} />
        </View>

        <View style={styles.crateWrap}>
          <CrateBox width={crateWidth} height={crateWidth * 0.7} />
          <View style={styles.crateItems}>
            {state.taken.map((i) => (
              <Pressable
                key={i}
                onPress={() => putBack(i)}
                accessibilityRole="button"
                accessibilityLabel={`Take one ${challenge.item.es} out`}
              >
                <Animated.View entering={ZoomIn.springify().damping(11)}>
                  <VocabIcon id={challenge.item.id} size={itemSize * 0.62} />
                </Animated.View>
              </Pressable>
            ))}
          </View>
          <View style={styles.crateChip}>
            <Chip label={`${state.taken.length}`} tone={state.phase === 'solved' ? 'green' : 'navy'} />
          </View>
        </View>

        {state.phase === 'solved' ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              ¡{word.es} {challenge.item.es}! ({challenge.count} {challenge.item.en})
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  phraseCard: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    maxWidth: 420,
    ...shadows.card,
  },
  shelfWrap: { alignItems: 'center' },
  shelfItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.xs,
    minHeight: hit.min,
  },
  shelfItem: { padding: 2 },
  shelfBoard: {
    height: 12,
    width: '92%',
    borderRadius: 6,
    backgroundColor: palette.wood,
    marginTop: 2,
    ...shadows.soft,
  },
  crateWrap: { alignItems: 'center', justifyContent: 'center' },
  crateItems: {
    position: 'absolute',
    top: '28%',
    left: '12%',
    right: '12%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  crateChip: { position: 'absolute', right: -6, top: -6 },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  trayInner: { gap: spacing.xs },
  trayRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  fingers: { alignItems: 'center', backgroundColor: palette.cream, borderRadius: radii.card, padding: spacing.xs },
  fingerRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  finger: { width: 12, height: 26, borderRadius: 6, backgroundColor: palette.safetyYellow },
});
