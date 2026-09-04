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
    if (support === 'min') speech.say(word[promptLang], { speaker: 'beacon', lang: promptLang });
    else speech.sayWord({ en: word.en, es: word.es }, promptLang);
  }, [promptLang, support, word]);

  useEffect(() => {
    session.say('beacon', word[promptLang], promptLang === 'es' ? word.en : word.es);
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
        setTimeout(() => speech.say(word[other], { speaker: 'beacon', lang: other }), 500);
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

  return (
    <GameFrame
      title={promptLang === 'es' ? '¿Cuál es?' : 'Which one is it?'}
      subtitle={ageBand === 'A' ? undefined : 'Listen to Beacon, then tap the picture.'}
      compact={compact}
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
                <VocabIcon id={option.id} size={iconSize} />
                <Text variant="small" center numberOfLines={1}>
                  {option[promptLang]}
                </Text>
              </View>
            </AnswerTile>
          ))}
        </TrayRow>
      }
    >
      <View style={styles.stage}>
        <View style={styles.wordCard}>
          {state.phase === 'solved' ? (
            <Animated.View entering={ZoomIn.springify()} style={styles.sparkle} pointerEvents="none">
              <SparkleBurst size={layout.s(90)} />
            </Animated.View>
          ) : null}
          <Text variant="hero" center color={promptLang === 'es' ? palette.purple : palette.navy}>
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
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  wordCard: {
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minWidth: 220,
    ...shadows.card,
  },
  sparkle: { position: 'absolute', top: -18, right: -18 },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  option: { alignItems: 'center', gap: 2 },
});
