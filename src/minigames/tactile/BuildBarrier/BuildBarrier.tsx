import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { Button, Text, Tray, TrayRow } from '@/ui';
import { ResetIcon } from '@/ui/icons';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';

import { Stage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { BarrierPiece, Campfire, Cone, RingPanel, ringSlots } from '@/world/props';
import {
  DragToken,
  GameShell,
  bestNextPiece,
  equationText,
  sumOf,
  useHintLadder,
  useMeasuredBox,
  useSpokenPrompt,
  useStage,
} from '../shared';

/* ------------------------------------------------------------------ */
/* State machine: building → reject → done                              */
/* ------------------------------------------------------------------ */

type Phase = 'building' | 'reject' | 'done';

interface State {
  phase: Phase;
  /** indices into `pieces`, in placement order */
  placed: number[];
}

type Action = { type: 'place'; index: number } | { type: 'undo' } | { type: 'reject' } | { type: 'settle' } | { type: 'finish' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'place':
      if (state.phase !== 'building') return state;
      return { ...state, placed: [...state.placed, action.index] };
    case 'undo':
      if (state.phase !== 'building' || state.placed.length === 0) return state;
      return { ...state, placed: state.placed.slice(0, -1) };
    case 'reject':
      return { ...state, phase: 'reject' };
    case 'settle':
      return state.phase === 'reject' ? { ...state, phase: 'building' } : state;
    case 'finish':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

export function BuildBarrier({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'build-barrier'>) {
  const session = useMiniGameSession('build-barrier', onComplete, onEvent);
  const stage = useStage(compact);
  const hints = useHintLadder(session.hint);
  const { box, ready, onLayout } = useMeasuredBox();

  const pieces = challenge.pieces;
  const target = Math.max(1, challenge.target);

  const [state, dispatch] = useReducer(reducer, { phase: 'building', placed: [] });

  const placedValues = useMemo(() => state.placed.map((i) => pieces[i] ?? 0), [pieces, state.placed]);
  const filled = sumOf(placedValues);
  const available = useMemo(
    () => pieces.map((v, i) => ({ value: v, index: i, used: state.placed.includes(i) })),
    [pieces, state.placed],
  );
  const suggestion = useMemo(
    () => bestNextPiece(available.filter((p) => !p.used).map((p) => p.value), placedValues, target),
    [available, placedValues, target],
  );

  const shake = useSharedValue(0);
  const pop = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      list.length = 0;
    };
  }, []);

  /* ---- prompt ---- */
  const prompt = ageBand === 'A' ? `Fence the fire with ${target}!` : `Build a ${target}-unit safety ring`;
  const subtitle = compact || ageBand === 'A' ? undefined : 'Drag barriers into the dashed outline.';
  useSpokenPrompt(`Build a safety ring of ${target}`, { speaker: 'beacon' });

  /* ---- geometry ---- */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const cx = w / 2;
    const cy = h * 0.5;
    const radius = Math.min(w, h) * 0.36;
    const slotSize = Math.max(10, Math.min(((2 * Math.PI * radius) / target) * 0.92, radius * 0.55));
    return { w, h, cx, cy, radius, slotSize, fire: Math.min(radius * 1.3, Math.min(w, h) * 0.42) };
  }, [box.h, box.w, target]);

  const slots = useMemo(() => ringSlots(geo.cx, geo.cy, geo.radius, target), [geo.cx, geo.cy, geo.radius, target]);

  /** which placed piece owns each slot (for the alternating stripe) */
  const owners = useMemo(() => {
    const out: number[] = new Array(target).fill(-1);
    let cursor = 0;
    placedValues.forEach((value, piece) => {
      for (let k = 0; k < value && cursor < target; k += 1, cursor += 1) out[cursor] = piece;
    });
    return out;
  }, [placedValues, target]);

  const runStart = useMemo(() => {
    const out: number[] = new Array(target).fill(0);
    let cursor = 0;
    placedValues.forEach((value) => {
      const start = cursor;
      for (let k = 0; k < value && cursor < target; k += 1, cursor += 1) out[cursor] = start;
    });
    return out;
  }, [placedValues, target]);

  /* ---- placing ---- */
  const finish = useCallback(() => {
    dispatch({ type: 'finish' });
    sfx.play('correct');
    haptics.celebrate();
    pop.value = withSequence(withSpring(1, springs.bounce), withSpring(0.6, springs.gentle));
    session.correct(equationText(placedValues));
    session.progress(target, target);
    const line = `${placedValues.join(' plus ')} equals ${target}. The ring is closed!`;
    session.say('beacon', line);
    speech.say(line, { speaker: 'beacon' });
    timers.current.push(
      setTimeout(() => {
        sfx.play('success');
        session.complete();
      }, 1200),
    );
  }, [placedValues, pop, session, target]);

  const place = useCallback(
    (index: number) => {
      if (state.phase !== 'building') return;
      const value = pieces[index];
      if (value === undefined || state.placed.includes(index)) return;
      if (filled + value > target) {
        dispatch({ type: 'reject' });
        session.incorrect(`overflow ${filled}+${value}`);
        sfx.play('wrong-soft');
        haptics.nudge();
        shake.value = withSequence(
          withTiming(-7, { duration: 60 }),
          withTiming(7, { duration: 60 }),
          withTiming(-5, { duration: 60 }),
          withTiming(0, { duration: 70 }),
        );
        hints.miss({
          text: suggestion
            ? `That one is too long — only ${target - filled} spaces left. The ${suggestion} fits!`
            : `Only ${target - filled} spaces left. Take one off with Undo.`,
          es: `Solo quedan ${target - filled} espacios.`,
        });
        timers.current.push(setTimeout(() => dispatch({ type: 'settle' }), 520));
        return;
      }
      dispatch({ type: 'place', index });
      sfx.play('drop');
      haptics.drop();
      const next = [...placedValues, value];
      if (ageBand !== 'C') speech.say(String(sumOf(next)), { speaker: 'beacon' });
      if (sumOf(next) === target) timers.current.push(setTimeout(finish, 420));
    },
    [ageBand, filled, finish, hints, pieces, placedValues, session, shake, state.phase, state.placed, suggestion, target],
  );

  const undo = useCallback(() => {
    if (state.placed.length === 0) return;
    dispatch({ type: 'undo' });
    sfx.play('tap-soft');
    haptics.select();
  }, [state.placed.length]);

  /* ---- idle nudge ---- */
  useEffect(() => {
    if (state.phase !== 'building' || filled >= target) return;
    const t = setTimeout(() => {
      if (suggestion !== null) {
        hints.nudge({
          text: `${target - filled} spaces still open — the ${suggestion} barrier fits there.`,
          es: `Faltan ${target - filled} espacios.`,
        });
      }
    }, 14000);
    return () => clearTimeout(t);
  }, [filled, hints, state.phase, state.placed.length, suggestion, target]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const fireStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pop.value * 0.1 }] }));

  // critique: the longest piece (10) used to overflow the tray row and get
  // clipped. Size a segment so the widest piece always fits one tray line.
  const segPx = Math.max(13, Math.min(stage.s(24), (Math.min(stage.windowW, 520) - 96) / Math.max(...pieces, 1)));

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      es={`Haz un círculo de ${target}`}
      compact={compact}
      onStageLayout={onLayout}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      backdrop={<Stage variant="park" groundHeight={150} />}
      overlay={<SceneCrew side="right" size={58} showPepper mood={state.phase === 'done' ? 'cheer' : state.placed.length > 0 ? 'happy' : 'idle'} />}
      footer={
        <View style={styles.mathRow}>
          <Text variant="h3" color={filled === target ? palette.leafGreenDark : palette.navy}>
            {placedValues.length > 0 ? equationText(placedValues) : `0 of ${target}`}
          </Text>
        </View>
      }
      tray={
        <Tray>
          <TrayRow>
            {available.map((p) => (
              <DragToken
                key={p.index}
                disabled={p.used || state.phase !== 'building'}
                highlight={hints.assist && !p.used && p.value === suggestion}
                onPlace={() => place(p.index)}
                accessibilityLabel={`Barrier of ${p.value}`}
              >
                <BarrierPiece segments={p.value} segmentPx={segPx} height={Math.max(56, stage.s(58))} tone={p.used ? 'ghost' : 'red'} />
              </DragToken>
            ))}
            <Button
              label="Undo"
              tone="white"
              size="md"
              icon={<ResetIcon size={20} />}
              onPress={undo}
              disabled={state.placed.length === 0 || state.phase === 'done'}
              sound="tap-soft"
              accessibilityLabel="Take the last barrier off"
            />
          </TrayRow>
        </Tray>
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          {/* the picnic clearing: a rounded grass field with a dirt patch, a
              worn path and tufts — never a hard-cornered rectangle */}
          <View style={[styles.yard, { top: geo.cy - geo.radius * 1.62, height: geo.radius * 3.24 }]} pointerEvents="none">
            <View style={styles.yardLip} />
          </View>
          <Svg style={StyleSheet.absoluteFill} width={geo.w} height={geo.h} pointerEvents="none">
            <Ellipse cx={geo.cx} cy={geo.cy} rx={geo.radius * 1.22} ry={geo.radius * 1.05} fill="#D8C39A" opacity={0.55} />
            <Path
              d={`M ${geo.cx - geo.radius * 0.2} ${geo.h} Q ${geo.cx + geo.radius * 0.4} ${geo.cy + geo.radius * 1.3} ${geo.cx + geo.radius * 0.1} ${geo.cy + geo.radius * 1.05} L ${geo.cx + geo.radius * 0.6} ${geo.cy + geo.radius * 1.15} Q ${geo.cx + geo.radius * 0.8} ${geo.cy + geo.radius * 1.6} ${geo.cx + geo.radius * 0.5} ${geo.h} Z`}
              fill="#E4D3AE"
              opacity={0.7}
            />
            {[0.1, 0.24, 0.76, 0.9].map((f, i) => (
              <G key={`tuft${i}`}>
                <Path
                  d={`M ${geo.w * f} ${geo.cy + geo.radius * (i % 2 ? 1.24 : -1.24)} q ${-5} ${-12} 0 ${-17} q 5 6 0 17 z`}
                  fill="#3E9A55"
                />
                <Path
                  d={`M ${geo.w * f + 7} ${geo.cy + geo.radius * (i % 2 ? 1.24 : -1.24)} q ${-4} ${-9} 1 ${-13} q 4 5 -1 13 z`}
                  fill={palette.grass}
                />
              </G>
            ))}
          </Svg>

          {/* cones + tape ringing the clearing */}
          <View style={[styles.cone, { left: stage.s(6), top: geo.cy + geo.radius * 1.12 }]} pointerEvents="none">
            <Cone size={stage.s(40)} />
          </View>
          <View style={[styles.cone, { left: stage.s(6), top: geo.cy - geo.radius * 1.42 }]} pointerEvents="none">
            <Cone size={stage.s(34)} />
          </View>
          <View style={[styles.cone, { right: stage.s(6), top: geo.cy - geo.radius * 1.42 }]} pointerEvents="none">
            <Cone size={stage.s(40)} />
          </View>
          <View style={[styles.cone, { right: stage.s(6), top: geo.cy + geo.radius * 1.12 }]} pointerEvents="none">
            <Cone size={stage.s(34)} />
          </View>

          {/* the campfire in the middle */}
          <Animated.View
            style={[styles.fire, { left: geo.cx - geo.fire / 2, top: geo.cy - geo.fire / 2, width: geo.fire, height: geo.fire }, fireStyle]}
            pointerEvents="none"
          >
            <Campfire size={geo.fire} calm={state.phase === 'done'} />
          </Animated.View>

          {/* the perimeter */}
          <Animated.View style={[StyleSheet.absoluteFill, ringStyle]} pointerEvents="none">
            <Svg width={geo.w} height={geo.h}>
              {slots.map((slot) => {
                const owner = owners[slot.index] ?? -1;
                const start = runStart[slot.index] ?? 0;
                return (
                  <RingPanel
                    key={slot.index}
                    slot={slot}
                    size={geo.slotSize}
                    filled={owner >= 0}
                    alt={owner >= 0 && (slot.index - start) % 2 === 1}
                  />
                );
              })}
            </Svg>
          </Animated.View>
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  yard: {
    position: 'absolute',
    left: -14,
    right: -14,
    backgroundColor: palette.grassDark,
    borderRadius: 90,
    overflow: 'hidden',
  },
  yardLip: { position: 'absolute', left: 0, right: 0, top: 0, height: 10, backgroundColor: palette.grass },
  cone: { position: 'absolute' },
  fire: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  mathRow: {
    alignItems: 'center',
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
});
