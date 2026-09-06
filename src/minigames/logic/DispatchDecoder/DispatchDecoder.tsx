import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { SceneId } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, roles, spacing } from '@/theme';
import { useShowTranslation } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { AnswerTile, Text, TrayRow, VocabIcon } from '@/ui';
import type { AnswerState } from '@/ui/kit/AnswerTile';

import { Stage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useHintLadder } from '../shared/useHintLadder';
import { SceneBuilding } from '../shared/art/Props';
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

const HOW = 'Listen to the radio, then tap the answer.';

export function DispatchDecoder({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'dispatch-decoder'>) {
  const session = useMiniGameSession('dispatch-decoder', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const showEs = useShowTranslation();
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

  /*
   * The call is SPOKEN here and PRINTED on the radio — once each. It used to be
   * raised as a `say` event too, which drew a dialogue card underneath the
   * radio repeating the passage word for word and covering the replay buttons.
   */
  useEffect(() => {
    const t = setTimeout(() => speech.say(message, { speaker: 'bea' }), 380);
    return () => clearTimeout(t);
  }, [message]);

  const revealAll = useCallback(() => {
    setChars(message.length);
    dispatch({ type: 'MESSAGE_DONE' });
    sfx.play('tap-soft');
  }, [message.length]);

  /** The task bar's hear-it-again: the call, then the Spanish if it is shown. */
  const replay = useCallback(() => {
    sfx.play('radio');
    haptics.tap();
    revealAll();
    speech.say(message, { speaker: 'bea' });
    if (showEs && challenge.messageEs) {
      setTimeout(() => speech.say(challenge.messageEs ?? '', { speaker: 'bea', lang: 'es' }), 2200);
    }
  }, [challenge.messageEs, message, revealAll, showEs]);

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
  const glow = useSharedValue(0.8);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [glow]);
  const lampStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

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

  const panelWidth = Math.min(layout.boxWidth - spacing.md * 2, layout.s(360));
  const lcdSize = layout.s(ageBand === 'A' ? 21 : 19);

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
  const stacked = challenge.mode === 'sentence';

  return (
    <GameFrame
      title={TITLES[challenge.mode]}
      subtitle={HOW}
      compact={compact}
      onReplay={replay}
      backdrop={
        <>
          <Stage variant="radio-room" groundHeight={158} />
          <SceneCrew side="left" size={54} mood={state.phase === 'solved' ? 'cheer' : state.phase === 'listening' ? 'think' : 'idle'} />
        </>
      }
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <TrayRow style={styles.options}>
          {challenge.options.map((option, i) => {
            const sceneId = challenge.mode === 'location' ? asScene(option) : null;
            return (
              <AnswerTile
                key={option}
                index={i}
                state={tileState(option)}
                size={stacked ? 'sm' : 'lg'}
                style={stacked ? styles.optionRow : undefined}
                onPress={() => choose(option)}
                accessibilityLabel={option}
                label={stacked ? option : undefined}
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
      }
    >
      <View style={styles.stage}>
        {/*
         * ONE copy of the call. The radio chassis is drawn here rather than
         * pulled from a fixed-aspect sprite so the display grows with the
         * passage instead of squeezing it into a 78 px window.
         */}
        <Pressable
          onPress={revealAll}
          accessibilityRole="button"
          accessibilityLabel="Show the whole message"
          style={[styles.radio, { width: panelWidth }]}
        >
          <View style={styles.radioHead}>
            <Animated.View style={[styles.lamp, lampStyle]} />
            <Text variant="tiny" color={palette.slateLight}>
              DISPATCH
            </Text>
            <View style={styles.grille}>
              {[0, 1, 2, 3, 4, 5].map((d) => (
                <View key={d} style={styles.grilleDot} />
              ))}
            </View>
          </View>

          <View style={styles.lcd}>
            <Text
              variant="bodyStrong"
              color="#8CFFC0"
              style={[styles.lcdText, { fontSize: lcdSize, lineHeight: Math.round(lcdSize * 1.42) }]}
            >
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

            {showEs && challenge.messageEs ? (
              <>
                <View style={styles.lcdRule} />
                <Text
                  variant="small"
                  color="#8FD8FF"
                  style={{ fontSize: Math.round(lcdSize * 0.85), lineHeight: Math.round(lcdSize * 1.24) }}
                >
                  {challenge.messageEs}
                </Text>
              </>
            ) : null}
          </View>
        </Pressable>

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
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  radio: {
    backgroundColor: palette.navy,
    borderRadius: radii.panel,
    padding: spacing.xs,
    gap: 6,
    ...roles.lift.interactive,
  },
  radioHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingTop: 2 },
  lamp: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.waterCyan },
  grille: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 },
  grilleDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: palette.navySoft },
  lcd: {
    backgroundColor: '#0F3D2A',
    borderRadius: radii.tile,
    borderWidth: 3,
    borderColor: palette.charcoalDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: hit.big,
    justifyContent: 'center',
    gap: 6,
  },
  lcdText: {
    textShadowColor: 'rgba(140,255,192,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  lcdKey: { textDecorationLine: 'underline' },
  lcdRule: { height: 2, borderRadius: 1, backgroundColor: 'rgba(140,255,192,0.28)' },
  stamp: {
    backgroundColor: roles.state.successFill,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    ...roles.lift.surface,
  },
  options: { rowGap: spacing.xs },
  optionRow: { width: '100%' },
  addressTile: { alignItems: 'center', gap: 2 },
  plate: {
    backgroundColor: palette.white,
    borderRadius: radii.tag,
    paddingHorizontal: 10,
    paddingVertical: 2,
    ...roles.lift.surface,
  },
});
