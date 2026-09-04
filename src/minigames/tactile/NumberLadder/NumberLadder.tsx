import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { easings, palette, radii, shadows, spacing, springs } from '@/theme';
import { Button, Chip, Text, Tray, TrayRow } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { Animal, LadderRails } from '@/world/props';
import { GameShell, clampNum, minJumps, useHintLadder, useMeasuredBox, useSpokenPrompt, useStage } from '../shared';

/* ------------------------------------------------------------------ */
/* State machine: idle → hopping → (overshoot → idle) | done            */
/* ------------------------------------------------------------------ */

type Phase = 'idle' | 'hopping' | 'overshoot' | 'done';

interface State {
  phase: Phase;
  pos: number;
  /** the jumps taken so far, for the equation strip */
  history: number[];
  moves: number;
}

type Action =
  | { type: 'hop'; jump: number }
  | { type: 'land'; pos: number }
  | { type: 'bounce' }
  | { type: 'settle' }
  | { type: 'finish' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hop':
      if (state.phase !== 'idle') return state;
      return { ...state, phase: 'hopping', history: [...state.history, action.jump], moves: state.moves + 1 };
    case 'land':
      return { ...state, phase: 'idle', pos: action.pos };
    case 'bounce':
      return { ...state, phase: 'overshoot', history: state.history.slice(0, -1), moves: Math.max(0, state.moves - 1) };
    case 'settle':
      return state.phase === 'overshoot' ? { ...state, phase: 'idle' } : state;
    case 'finish':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

const HOP_MS = 135;

const jumpLabel = (j: number) => (j > 0 ? `+${j}` : `−${Math.abs(j)}`);

/** "7 + 5 = 12" (with real minus signs for the down-jumps). */
function equationLine(start: number, history: readonly number[], pos: number): string {
  if (history.length === 0) return `${start}`;
  const body = history.map((j) => (j > 0 ? `+ ${j}` : `− ${Math.abs(j)}`)).join(' ');
  return `${start} ${body} = ${pos}`;
}

export function NumberLadder({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'number-ladder'>) {
  const session = useMiniGameSession('number-ladder', onComplete, onEvent);
  const stage = useStage(compact);
  const hints = useHintLadder(session.hint);
  const { box, ready, onLayout } = useMeasuredBox();

  const min = Math.min(challenge.min, challenge.max);
  const max = Math.max(challenge.min, challenge.max);
  const span = Math.max(1, max - min);
  const start = clampNum(challenge.start, min, max);
  const target = clampNum(challenge.target, min, max);

  const jumps = useMemo(() => {
    const list = challenge.jumps.filter((j) => j !== 0);
    return ageBand === 'A' ? list.filter((j) => j > 0) : list;
  }, [ageBand, challenge.jumps]);
  const positiveOnly = jumps.every((j) => j > 0);

  const best = useMemo(() => minJumps(start, target, jumps, min, max), [jumps, max, min, start, target]);

  const [state, dispatch] = useReducer(reducer, { phase: 'idle', pos: start, history: [], moves: 0 });

  const pos = useSharedValue(start);
  const bob = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      list.length = 0;
    };
  }, []);

  /* ---- prompt ---- */
  const prompt = ageBand === 'A' ? `Climb to ${target}!` : `Start at ${start} — climb to ${target}`;
  const subtitle = compact ? undefined : ageBand === 'C' ? 'Fewest jumps earns a star bonus.' : 'Tap a jump button to hop.';
  useSpokenPrompt(`Climb to ${target}`, { speaker: 'beacon' });

  /* ---- geometry ---- */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const topPad = h * 0.07;
    const botPad = h * 0.08;
    const unitPx = Math.max(16, (h - topPad - botPad) / span);
    const ladderW = Math.max(58, Math.min(stage.s(78), w * 0.24));
    const ladderX = w * 0.36;
    const bottomY = h - botPad;
    return { w, h, unitPx, ladderW, ladderX, bottomY, ladderH: unitPx * span };
  }, [box.h, box.w, span, stage]);

  const rookieSize = Math.max(48, Math.min(stage.s(74), geo.ladderW * 1.1));

  /* ---- what to suggest ---- */
  const suggestion = useMemo(() => {
    const need = target - state.pos;
    if (need === 0) return null;
    const exact = jumps.find((j) => j === need);
    if (exact !== undefined) return exact;
    const sameWay = jumps.filter((j) => Math.sign(j) === Math.sign(need) && Math.abs(j) <= Math.abs(need));
    if (sameWay.length > 0) return sameWay.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
    return jumps.find((j) => Math.sign(j) === Math.sign(need)) ?? null;
  }, [jumps, state.pos, target]);

  /* ---- hopping ---- */
  const win = useCallback(
    (moves: number) => {
      dispatch({ type: 'finish' });
      sfx.play('correct');
      haptics.success();
      session.correct(`${state.pos}→${target}`);
      session.progress(1, 1);
      const shortest = best !== null && moves <= best;
      const line = shortest && ageBand === 'C' ? `${target}! And that was the shortest path!` : `${target}! You made it!`;
      session.say('beacon', line);
      speech.say(line, { speaker: 'beacon' });
      timers.current.push(
        setTimeout(() => {
          sfx.play(shortest ? 'fanfare' : 'success');
          session.complete();
        }, 1000),
      );
    },
    [ageBand, best, session, state.pos, target],
  );

  const hop = useCallback(
    (jump: number) => {
      if (state.phase !== 'idle') return;
      const from = state.pos;
      const to = from + jump;
      const outside = to < min || to > max;
      const overshot = positiveOnly && to > target;

      dispatch({ type: 'hop', jump });
      haptics.tap();

      const steps = Math.min(Math.abs(jump), 12);
      const anims = Array.from({ length: steps }, (_, k) =>
        withTiming(from + Math.sign(jump) * (k + 1) * (Math.abs(jump) / steps), {
          duration: HOP_MS,
          easing: easings.out,
        }),
      );
      if (anims.length > 0) pos.value = withSequence(...(anims as [(typeof anims)[number], ...typeof anims]));
      for (let k = 0; k < steps; k += 1) {
        timers.current.push(setTimeout(() => sfx.play('pop', { volume: 0.7 }), k * HOP_MS));
      }
      bob.value = withSequence(
        ...Array.from({ length: steps * 2 }, (_, k) => withTiming(k % 2 === 0 ? -6 : 0, { duration: HOP_MS / 2 })),
      );

      timers.current.push(
        setTimeout(
          () => {
            if (outside || overshot) {
              dispatch({ type: 'bounce' });
              sfx.play('wrong-soft');
              pos.value = withSpring(from, springs.bounce);
              hints.miss({
                text: suggestion
                  ? `That goes past ${target}. You need ${target - from} more — try ${jumpLabel(suggestion)}.`
                  : `That goes past ${target}. Try a smaller jump.`,
                es: `Te pasaste de ${target}.`,
              });
              session.incorrect(`overshoot ${to}`);
              timers.current.push(setTimeout(() => dispatch({ type: 'settle' }), 460));
              return;
            }
            dispatch({ type: 'land', pos: to });
            speech.say(String(to), { speaker: 'beacon' });
            if (to === target) win(state.moves + 1);
          },
          steps * HOP_MS + 60,
        ),
      );
    },
    [bob, hints, max, min, pos, positiveOnly, session, state.moves, state.phase, state.pos, suggestion, target, win],
  );

  /* ---- idle nudge ---- */
  useEffect(() => {
    if (state.phase !== 'idle' || state.pos === target) return;
    const t = setTimeout(() => {
      if (suggestion !== null) {
        hints.nudge({
          text: `You are on ${state.pos} and need ${target}. Try ${jumpLabel(suggestion)}!`,
          es: `Prueba ${jumpLabel(suggestion)}.`,
        });
      }
    }, 15000);
    return () => clearTimeout(t);
  }, [hints, state.phase, state.pos, suggestion, target]);

  const climberStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -(pos.value - min) * geo.unitPx + bob.value }],
  }));

  const flagTop = geo.bottomY - (target - min) * geo.unitPx;

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      compact={compact}
      onStageLayout={onLayout}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      footer={
        <View style={styles.mathRow}>
          <Text variant="h3" color={state.pos === target ? palette.leafGreenDark : palette.navy}>
            {equationLine(start, state.history, state.pos)}
          </Text>
          {ageBand === 'C' && best !== null ? <Chip label={`Best: ${best} jump${best === 1 ? '' : 's'}`} tone="yellow" /> : null}
        </View>
      }
      tray={
        <Tray>
          <TrayRow>
            {jumps.map((j) => (
              <Button
                key={j}
                label={jumpLabel(j)}
                tone={j > 0 ? 'yellow' : 'blue'}
                size="lg"
                sound="none"
                disabled={state.phase !== 'idle'}
                onPress={() => hop(j)}
                accessibilityLabel={j > 0 ? `Jump up ${j}` : `Jump down ${Math.abs(j)}`}
                style={hints.assist && j === suggestion ? styles.suggest : undefined}
              />
            ))}
          </TrayRow>
        </Tray>
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          {/* ladder */}
          <View
            style={[styles.ladder, { left: geo.ladderX, top: geo.bottomY - geo.ladderH, width: geo.ladderW, height: geo.ladderH }]}
            pointerEvents="none"
          >
            <LadderRails width={geo.ladderW} height={geo.ladderH} rungs={span} unitPx={geo.unitPx} markAt={target - min} />
          </View>

          {/* rung numbers */}
          {Array.from({ length: span + 1 }, (_, i) => min + i).map((n) => {
            const showEvery = span > 14 ? 2 : 1;
            if ((n - min) % showEvery !== 0) return null;
            const top = geo.bottomY - (n - min) * geo.unitPx - 12;
            const isTarget = n === target;
            return (
              <View
                key={n}
                style={[
                  styles.rungLabel,
                  { left: geo.ladderX - stage.s(40), top, backgroundColor: isTarget ? palette.leafGreen : palette.white },
                ]}
                pointerEvents="none"
              >
                <Text variant="tiny" color={isTarget ? palette.white : palette.navy}>
                  {n}
                </Text>
              </View>
            );
          })}

          {/* target flag */}
          <View style={[styles.flag, { left: geo.ladderX + geo.ladderW + 4, top: flagTop - stage.s(46) }]} pointerEvents="none">
            <Svg width={stage.s(52)} height={stage.s(52)} viewBox="0 0 60 60">
              <Rect x={6} y={6} width={5} height={50} rx={2.5} fill={palette.charcoal} />
              <Path d="M11 8h38l-9 11 9 11H11z" fill={palette.leafGreen} />
            </Svg>
            <View style={styles.flagPet}>
              <Animal id="kitten" size={stage.s(40)} mood={state.phase === 'done' ? 'happy' : 'help'} />
            </View>
          </View>

          {/* ground */}
          <View style={[styles.ground, { top: geo.bottomY, height: Math.max(0, geo.h - geo.bottomY) }]} pointerEvents="none" />

          {/* Rookie */}
          <Animated.View
            style={[
              styles.rookie,
              { left: geo.ladderX + geo.ladderW / 2 - rookieSize / 2, top: geo.bottomY - rookieSize + 6 },
              climberStyle,
            ]}
            pointerEvents="none"
          >
            <CharacterPortrait id="rookie" emotion={state.phase === 'done' ? 'proud' : 'happy'} size={rookieSize} />
          </Animated.View>
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  ladder: { position: 'absolute' },
  rungLabel: {
    position: 'absolute',
    minWidth: 30,
    alignItems: 'center',
    borderRadius: radii.tag,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...shadows.soft,
  },
  flag: { position: 'absolute', alignItems: 'center' },
  flagPet: { marginTop: -6 },
  ground: { position: 'absolute', left: 0, right: 0, backgroundColor: palette.grass },
  rookie: { position: 'absolute', alignItems: 'center' },
  mathRow: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
  suggest: { borderRadius: radii.pill, ...shadows.glowGold },
});
