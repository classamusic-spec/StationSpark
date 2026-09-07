import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { VocabWord } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { AnswerTile, Button, SpeakerIcon, Text, TrayRow, VocabIcon } from '@/ui';
import type { AnswerState } from '@/ui/kit/AnswerTile';

import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useHintLadder } from '../shared/useHintLadder';
import { SparkleBurst } from '../shared/art/Glyphs';
import { Classroom, RoomWash, classroomMetrics, clamp, usePlayBox } from '../shared/art/Scene';

interface State {
  phase: 'listening' | 'solved';
  picked: string | null;
  misses: number;
}

type Action = { type: 'PICK'; id: string } | { type: 'MISS' } | { type: 'CLEAR' } | { type: 'SOLVE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PICK':
      return { ...state, picked: action.id };
    case 'MISS':
      return { ...state, misses: state.misses + 1 };
    case 'CLEAR':
      return { ...state, picked: null };
    case 'SOLVE':
      return { ...state, phase: 'solved' };
    default:
      return state;
  }
}

export function VocabTap({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'vocab-tap'>) {
  const session = useMiniGameSession('vocab-tap', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'listening', picked: null, misses: 0 });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const done = useRef(false);

  const { word, promptLang, support } = challenge;
  const other: 'en' | 'es' = promptLang === 'en' ? 'es' : 'en';
  const showBoth = support === 'full';
  const showSecondary = support !== 'min';

  const speakWord = useCallback(() => {
    sfx.play('robot-beep');
    if (support === 'min') speech.say(word[promptLang], { speaker: 'bea', lang: promptLang });
    else speech.sayWord({ en: word.en, es: word.es }, promptLang);
  }, [promptLang, support, word]);

  /*
   * The word is spoken, and printed once on the board. It used to be mirrored
   * into a speech bubble as well, which sat across the answer tiles.
   */
  useEffect(() => {
    const t = setTimeout(speakWord, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = useCallback(
    (option: VocabWord) => {
      if (state.phase === 'solved') return;
      sfx.play('tap');
      haptics.select();
      dispatch({ type: 'PICK', id: option.id });
      if (option.id === word.id) {
        dispatch({ type: 'SOLVE' });
        session.correct(option.id);
        session.learnedWord(word.en);
        session.learnedWord(word.es);
        sfx.play('correct');
        haptics.success();
        setTimeout(() => speech.say(word[other], { speaker: 'bea', lang: other }), 500);
        if (!done.current) {
          done.current = true;
          setTimeout(() => session.complete(), 1600);
        }
      } else {
        dispatch({ type: 'MISS' });
        session.incorrect(option.id);
        setTimeout(() => dispatch({ type: 'CLEAR' }), 520);
      }
    },
    [other, session, state.phase, word],
  );

  const tileState = (option: VocabWord): AnswerState => {
    if (state.phase === 'solved') return option.id === word.id ? 'correct' : 'disabled';
    if (state.picked === option.id) return 'wrong';
    if (hintLadder.highlight && option.id === word.id) return 'highlight';
    return 'idle';
  };

  const hintText = `“${word[promptLang]}” means “${word[other]}”. Tap the ${word.en}!`;
  const iconSize = layout.s(ageBand === 'A' ? 72 : 62);

  /* the word is pinned ON the classroom board, measured from the play area */
  const { box, onLayout } = usePlayBox();
  const room = classroomMetrics(box);
  const cardWidth = box.w > 0 ? clamp(room.boardW * 0.82, 180, 520) : layout.s(280);
  const wordSize = clamp(cardWidth * 0.16, 26, 62);

  return (
    <GameFrame
      title={promptLang === 'es' ? '¿Cuál es?' : 'Which one is it?'}
      subtitle={ageBand === 'A' ? undefined : 'Listen to Captain Bea, then tap the picture.'}
      compact={compact}
      backdrop={<RoomWash top="#F6EEDC" bottom="#C7B181" />}
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <TrayRow>
          {challenge.options.map((option, i) => (
            <AnswerTile
              key={option.id}
              index={i}
              size="lg"
              state={tileState(option)}
              onPress={() => choose(option)}
              accessibilityLabel={option[promptLang]}
            >
              <View style={styles.option}>
                <VocabIcon id={option.icon} size={iconSize} />
                <Text variant="small" center numberOfLines={1}>
                  {option[promptLang]}
                </Text>
              </View>
            </AnswerTile>
          ))}
        </TrayRow>
      }
    >
      <View style={styles.stage} onLayout={onLayout}>
        {/* the station's learning corner — the word is pinned on the board */}
        <Classroom box={box} />

        <View
          style={[
            styles.deck,
            box.w > 0
              ? { left: room.boardX, top: room.boardY, width: room.boardW, height: room.boardH }
              : { left: 0, right: 0, top: 0, bottom: 0 },
          ]}
        >
          <View style={[styles.wordCard, { width: cardWidth }]}>
            <View style={styles.pins} pointerEvents="none">
              <View style={styles.pin} />
              <View style={styles.pin} />
            </View>
            {state.phase === 'solved' ? (
              <Animated.View entering={ZoomIn.springify()} style={styles.sparkle} pointerEvents="none">
                <SparkleBurst size={layout.s(90)} />
              </Animated.View>
            ) : null}
            <Text
              variant="hero"
              center
              color={promptLang === 'es' ? palette.purple : palette.navy}
              style={{ fontSize: wordSize, lineHeight: wordSize * 1.16 }}
            >
              {word[promptLang]}
            </Text>
            {showSecondary ? (
              <Text variant={showBoth ? 'h3' : 'small'} center color={palette.navySoft}>
                {showBoth ? word[other] : `(${word[other]})`}
              </Text>
            ) : null}
          </View>

          <Button
            label={promptLang === 'es' ? 'Escuchar' : 'Hear it again'}
            tone="blue"
            size="md"
            sound="none"
            icon={<SpeakerIcon size={22} color={palette.white} />}
            onPress={speakWord}
          />

          {state.phase === 'solved' ? (
            <Animated.View entering={FadeIn} style={styles.banner}>
              <Text variant="h3" color={palette.leafGreenDark} center>
                {word.en} = {word.es}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignSelf: 'stretch' },
  deck: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  wordCard: {
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  pins: { position: 'absolute', top: -7, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly' },
  pin: { width: 14, height: 14, borderRadius: 7, backgroundColor: palette.engineRed },
  sparkle: { position: 'absolute', top: -18, right: -18 },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  option: { alignItems: 'center', gap: 2 },
});
