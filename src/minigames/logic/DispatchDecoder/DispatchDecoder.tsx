import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { SceneId } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { AnswerTile, Button, SpeakerIcon, Text, TrayRow, VocabIcon } from '@/ui';
import type { AnswerState } from '@/ui/kit/AnswerTile';

import { Stage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useHintLadder } from '../shared/useHintLadder';
import { RadioBody, SceneBuilding, radioLcdRect } from '../shared/art/Props';
import { sceneLabel } from '../shared/labels';

const SCENE_IDS: SceneId[] = [
  'bakery',
  'pizza',
  'school',
  'park',
  'clock-tower',
  'apartments',
  'pet-shop',
  'library',
  'market',
  'station-yard',
];

const asScene = (value: string): SceneId | null => {
  const key = value.toLowerCase().replace(/\s+/g, '-');
  const direct = SCENE_IDS.find((s) => s === key);
  if (direct) return direct;
  return SCENE_IDS.find((s) => sceneLabel[s].en.toLowerCase() === value.toLowerCase()) ?? null;
};

interface State {
  phase: 'listening' | 'answering' | 'solved';
  picked: string | null;
  misses: number;
}

type Action = { type: 'MESSAGE_DONE' } | { type: 'PICK'; option: string } | { type: 'MISS' } | { type: 'CLEAR' } | { type: 'SOLVED' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'MESSAGE_DONE':
      return state.phase === 'listening' ? { ...state, phase: 'answering' } : state;
    case 'PICK':
      return { ...state, picked: action.option };
    case 'MISS':
      return { ...state, misses: state.misses + 1 };
    case 'CLEAR':
      return { ...state, picked: null };
    case 'SOLVED':
      return { ...state, phase: 'solved' };
    default:
      return state;
  }
}

const TITLES = {
  address: 'Which address?',
  location: 'Where do we go?',
  sentence: 'Read the call',
} as const;

export function DispatchDecoder({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'dispatch-decoder'>) {
  const session = useMiniGameSession('dispatch-decoder', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'listening', picked: null, misses: 0 });
  const [chars, setChars] = useState(0);
  const hintLadder = useHintLadder(state.misses, session.hint);
  const solvedRef = useRef(false);

  const message = challenge.message;

  /* typewriter */
  useEffect(() => {
    sfx.play('radio');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setChars(i);
      if (i >= message.length) {
        clearInterval(id);
        dispatch({ type: 'MESSAGE_DONE' });
      }
    }, 26);
    return () => clearInterval(id);
  }, [message]);

  useEffect(() => {
    const t = setTimeout(() => speech.say(message, { speaker: 'bea' }), 380);
    session.say('bea', message, challenge.messageEs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const revealAll = useCallback(() => {
    setChars(message.length);
    dispatch({ type: 'MESSAGE_DONE' });
    sfx.play('tap-soft');
  }, [message.length]);

  const replay = useCallback(
    (lang: 'en' | 'es') => {
      sfx.play('radio');
      haptics.tap();
      const text = lang === 'es' ? (challenge.messageEs ?? message) : message;
      speech.say(text, { speaker: 'bea', lang });
    },
    [challenge.messageEs, message],
  );

  const choose = useCallback(
    (option: string) => {
      if (state.phase === 'solved') return;
      sfx.play('tap');
      haptics.select();
      dispatch({ type: 'PICK', option });
      if (option === challenge.correct) {
        dispatch({ type: 'SOLVED' });
        session.correct(option);
        sfx.play('correct');
        haptics.success();
        if (!solvedRef.current) {
          solvedRef.current = true;
          setTimeout(() => session.complete(), 900);
        }
      } else {
        session.incorrect(option);
        dispatch({ type: 'MISS' });
        setTimeout(() => dispatch({ type: 'CLEAR' }), 520);
      }
    },
    [challenge.correct, session, state.phase],
  );

  /* LCD text, with the key word underlined once the hint appears */
  const shown = message.slice(0, chars);
  const glow = useSharedValue(0.75);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [glow]);
  const lcdStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const lcdParts = useMemo(() => {
    if (hintLadder.level === 0) return null;
    const idx = message.toLowerCase().indexOf(challenge.correct.toLowerCase());
    if (idx < 0) return null;
    return {
      before: message.slice(0, idx),
      key: message.slice(idx, idx + challenge.correct.length),
      after: message.slice(idx + challenge.correct.length),
    };
  }, [challenge.correct, hintLadder.level, message]);

  const radioWidth = Math.min(layout.boxWidth - spacing.md * 2, layout.s(320));
  const lcd = radioLcdRect(radioWidth);

  const tileState = (option: string): AnswerState => {
    if (state.phase === 'solved') return option === challenge.correct ? 'correct' : 'disabled';
    if (state.picked === option) return 'wrong';
    if (hintLadder.highlight && option === challenge.correct) return 'highlight';
    return 'idle';
  };

  const hintText =
    challenge.mode === 'address'
      ? `Listen for the number. The radio said ${challenge.correct}.`
      : challenge.mode === 'location'
        ? `The call came from the ${challenge.correct}. Tap that building!`
        : `Read it again — the answer is “${challenge.correct}”.`;

  const scene = challenge.scene;

  return (
    <GameFrame
      title={TITLES[challenge.mode]}
      subtitle={ageBand === 'A' ? undefined : 'Listen to the radio, then tap the answer.'}
      compact={compact}
      backdrop={
        <>
          <Stage variant="radio-room" groundHeight={158} />
          <SceneCrew side="left" size={54} mood={state.phase === 'solved' ? 'cheer' : state.phase === 'listening' ? 'think' : 'idle'} />
        </>
      }
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.tray}>
          <TrayRow>
            {challenge.options.map((option, i) => {
              const sceneId = challenge.mode === 'location' ? asScene(option) : null;
              return (
                <AnswerTile
                  key={option}
                  index={i}
                  state={tileState(option)}
                  size={challenge.mode === 'sentence' ? 'md' : 'lg'}
                  onPress={() => choose(option)}
                  accessibilityLabel={option}
                  label={challenge.mode === 'sentence' ? option : undefined}
                >
                  {challenge.mode === 'address' ? (
                    <View style={styles.addressTile}>
                      <SceneBuilding
                        scene={scene ?? 'apartments'}
                        size={layout.s(56)}
                        tint={[palette.engineRed, palette.waterCyanDark, palette.leafGreen, palette.purple][i % 4]}
                      />
                      <View style={styles.plate}>
                        <Text variant="h3">{option}</Text>
                      </View>
                    </View>
                  ) : challenge.mode === 'location' ? (
                    <View style={styles.addressTile}>
                      {sceneId ? (
                        <SceneBuilding scene={sceneId} size={layout.s(56)} />
                      ) : (
                        <VocabIcon id={option.toLowerCase().replace(/\s+/g, '-')} size={layout.s(52)} />
                      )}
                      <Text variant="tiny" center numberOfLines={1}>
                        {sceneId ? sceneLabel[sceneId].en : option}
                      </Text>
                    </View>
                  ) : null}
                </AnswerTile>
              );
            })}
          </TrayRow>
        </View>
      }
    >
      <View style={styles.stage}>
        <Pressable onPress={revealAll} accessibilityRole="button" accessibilityLabel="Show the whole message">
          <View>
            <RadioBody width={radioWidth} />
            <Animated.View
              style={[styles.lcd, { left: lcd.x, top: lcd.y, width: lcd.width, height: lcd.height }, lcdStyle]}
              pointerEvents="none"
            >
              <Text variant="bodyStrong" color="#8CFFC0" style={[styles.lcdText, { fontSize: layout.s(17), lineHeight: layout.s(23) }]}>
                {lcdParts ? (
                  <>
                    {lcdParts.before}
                    <Text variant="bodyStrong" color={palette.safetyYellow} style={styles.lcdKey}>
                      {lcdParts.key}
                    </Text>
                    {lcdParts.after}
                  </>
                ) : (
                  shown
                )}
                {chars < message.length ? '▌' : ''}
              </Text>
            </Animated.View>
          </View>
        </Pressable>

        <View style={styles.replayRow}>
          <Button
            label="Play again"
            tone="blue"
            size="sm"
            icon={<SpeakerIcon size={20} color={palette.white} />}
            onPress={() => replay('en')}
            sound="none"
          />
          {challenge.messageEs ? (
            <Button
              label="Español"
              tone="purple"
              size="sm"
              icon={<SpeakerIcon size={20} color={palette.white} />}
              onPress={() => replay('es')}
              sound="none"
            />
          ) : null}
        </View>

        {challenge.messageEs && ageBand !== 'A' ? (
          <Animated.View entering={FadeIn.delay(400)} style={styles.esCard}>
            <Text variant="small" color={palette.purple} center>
              {challenge.messageEs}
            </Text>
          </Animated.View>
        ) : null}

        {state.phase === 'solved' ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.stamp}>
            <Text variant="h3" color={palette.leafGreenDark}>
              Copy that! Rolling out.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  lcd: { position: 'absolute', paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  lcdText: {
    textShadowColor: 'rgba(140,255,192,0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  lcdKey: { textDecorationLine: 'underline' },
  replayRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  esCard: {
    backgroundColor: palette.purpleSoft,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 420,
  },
  stamp: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    ...shadows.soft,
  },
  tray: { minHeight: hit.big },
  addressTile: { alignItems: 'center', gap: 2 },
  plate: {
    backgroundColor: palette.white,
    borderRadius: radii.tag,
    paddingHorizontal: 10,
    paddingVertical: 2,
    ...shadows.soft,
  },
});
