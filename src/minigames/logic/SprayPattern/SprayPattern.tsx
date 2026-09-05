import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { AnswerTile, Text, TrayRow } from '@/ui';
import type { AnswerState } from '@/ui/kit/AnswerTile';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useHintLadder } from '../shared/useHintLadder';
import { PatternGlyph, SparkleBurst, WaterBurst, type PatternSymbol } from '../shared/art/Glyphs';

const NAMES: Record<PatternSymbol, { en: string; es: string }> = {
  fire: { en: 'fire', es: 'fuego' },
  water: { en: 'water', es: 'agua' },
  cone: { en: 'cone', es: 'cono' },
  star: { en: 'star', es: 'estrella' },
};

interface State {
  phase: 'guessing' | 'spraying' | 'solved';
  picked: PatternSymbol | null;
  misses: number;
}

type Action = { type: 'PICK'; symbol: PatternSymbol } | { type: 'MISS' } | { type: 'CLEAR' } | { type: 'SOLVE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PICK':
      return { ...state, picked: action.symbol, phase: 'spraying' };
    case 'MISS':
      return { ...state, misses: state.misses + 1, phase: 'guessing' };
    case 'CLEAR':
      return { ...state, picked: null, phase: 'guessing' };
    case 'SOLVE':
      return { ...state, phase: 'solved' };
    default:
      return state;
  }
}

export function SprayPattern({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'spray-pattern'>) {
  const session = useMiniGameSession('spray-pattern', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'guessing', picked: null, misses: 0 });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const done = useRef(false);

  /** The shown part of the pattern (the answer is always the hidden slot at the end). */
  const shown = useMemo(() => {
    const seq = challenge.sequence;
    const last = seq[seq.length - 1];
    return last === challenge.answer ? seq.slice(0, -1) : seq;
  }, [challenge.answer, challenge.sequence]);

  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.25, { duration: 700 })), -1, true);
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.55 + glow.value * 0.45, transform: [{ scale: 1 + glow.value * 0.05 }] }));

  const spray = useSharedValue(0);
  const sprayStyle = useAnimatedStyle(() => ({ opacity: spray.value, transform: [{ scale: 0.6 + spray.value * 0.6 }] }));

  /* say the pattern out loud on mount */
  useEffect(() => {
    const words = shown.map((s) => NAMES[s].en).join(', ');
    session.say('beacon', `${words}… what comes next?`);
    const t = setTimeout(() => speech.say(`${words}. What comes next?`, { speaker: 'beacon' }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = useCallback(
    (symbol: PatternSymbol) => {
      // `done` is set the moment the right tile is tapped. Without it, a second
      // tap during the ~1.4 s victory beat was scored as a mistake and cost the
      // child a star for a game they had already solved.
      if (state.phase === 'solved' || done.current) return;
      sfx.play('tap');
      haptics.select();
      if (symbol === challenge.answer) {
        dispatch({ type: 'PICK', symbol });
        session.correct(symbol);
        spray.value = withSequence(withTiming(1, { duration: 240 }), withTiming(0, { duration: 420 }));
        sfx.play('water-spray');
        haptics.success();
        setTimeout(() => {
          dispatch({ type: 'SOLVE' });
          sfx.play('sparkle');
        }, 420);
        if (!done.current) {
          done.current = true;
          setTimeout(() => session.complete(), 1400);
        }
      } else {
        dispatch({ type: 'PICK', symbol });
        session.incorrect(symbol);
        setTimeout(() => dispatch({ type: 'MISS' }), 60);
        setTimeout(() => dispatch({ type: 'CLEAR' }), 520);
      }
    },
    [challenge.answer, session, spray, state.phase],
  );

  const slotSize = Math.max(
    layout.s(44),
    Math.min(layout.s(66), (layout.boxWidth - spacing.md * 2 - shown.length * 8) / (shown.length + 1)),
  );

  const hintText = useMemo(() => {
    const a = shown[shown.length - 2];
    const b = shown[shown.length - 1];
    if (a && b) return `Say it out loud: ${NAMES[a].en}, ${NAMES[b].en}… so next comes ${NAMES[challenge.answer].en}!`;
    return `Next comes ${NAMES[challenge.answer].en}.`;
  }, [challenge.answer, shown]);

  const tileState = (symbol: PatternSymbol): AnswerState => {
    if (state.phase === 'solved') return symbol === challenge.answer ? 'correct' : 'disabled';
    if (state.picked === symbol && symbol !== challenge.answer) return 'wrong';
    if (hintLadder.highlight && symbol === challenge.answer) return 'highlight';
    return 'idle';
  };

  return (
    <GameFrame
      title="What Comes Next?"
      subtitle={ageBand === 'A' ? undefined : 'Finish the spray pattern.'}
      compact={compact}
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <TrayRow>
          {challenge.options.map((symbol, i) => (
            <AnswerTile
              key={symbol}
              index={i}
              size={ageBand === 'A' ? 'lg' : 'md'}
              state={tileState(symbol)}
              onPress={() => choose(symbol)}
              accessibilityLabel={NAMES[symbol].en}
            >
              <View style={styles.optionInner}>
                <PatternGlyph symbol={symbol} size={layout.s(ageBand === 'A' ? 56 : 48)} />
                <Text variant="tiny" center>
                  {NAMES[symbol].en}
                </Text>
              </View>
            </AnswerTile>
          ))}
        </TrayRow>
      }
    >
      <View style={styles.stage}>
        <View style={styles.nozzle}>
          <View style={styles.nozzleGrip} />
          <View style={styles.nozzleTip} />
        </View>
        <View style={styles.row}>
          {shown.map((symbol, i) => (
            <Animated.View
              key={`${symbol}-${i}`}
              entering={ZoomIn.delay(i * 90).springify().damping(13)}
              style={[styles.target, { width: slotSize, height: slotSize }]}
            >
              <PatternGlyph symbol={symbol} size={slotSize * 0.72} />
              {state.phase === 'solved' ? (
                <Animated.View entering={FadeIn.delay(i * 60)} style={styles.shimmer} pointerEvents="none">
                  <SparkleBurst size={slotSize * 0.6} />
                </Animated.View>
              ) : null}
            </Animated.View>
          ))}

          <View style={[styles.target, styles.mystery, { width: slotSize, height: slotSize }]}>
            {state.phase === 'solved' || (state.picked === challenge.answer && state.phase === 'spraying') ? (
              <Animated.View entering={ZoomIn.springify().damping(10)}>
                <PatternGlyph symbol={challenge.answer} size={slotSize * 0.72} />
              </Animated.View>
            ) : (
              <Animated.View style={glowStyle}>
                <Text variant="numeral" color={palette.gold}>
                  ?
                </Text>
              </Animated.View>
            )}
            <Animated.View style={[styles.spray, sprayStyle]} pointerEvents="none">
              <WaterBurst size={slotSize * 1.3} />
            </Animated.View>
          </View>
        </View>

        {state.phase === 'solved' ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              Pattern complete!
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  target: {
    backgroundColor: palette.white,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  mystery: { borderWidth: 4, borderColor: palette.safetyYellow, backgroundColor: palette.cream },
  shimmer: { position: 'absolute' },
  spray: { position: 'absolute' },
  nozzle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: spacing.md },
  nozzleGrip: { width: 34, height: 14, borderRadius: 7, backgroundColor: palette.engineRed },
  nozzleTip: { width: 22, height: 10, borderRadius: 5, backgroundColor: palette.charcoal },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  optionInner: { alignItems: 'center', gap: 2 },
});
