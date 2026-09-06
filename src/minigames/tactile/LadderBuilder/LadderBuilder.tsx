import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing } from '@/theme';
import { Chip, Text, Tray, TrayRow } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { CaptainBea, Rookie } from '@/characters';
import { Stage } from '@/world';

import { Animal, LadderPiece, UnitWall, animalName } from '@/world/props';
import {
  DragToken,
  GameShell,
  bestNextPiece,
  comboKey,
  equationText,
  sumOf,
  useHintLadder,
  useMeasuredBox,
  useSpokenPrompt,
  useStage,
} from '../shared';

/* ------------------------------------------------------------------ */
/* State machine: building → wobble → climbing → again → done           */
/* ------------------------------------------------------------------ */

type Phase = 'building' | 'wobble' | 'climbing' | 'again' | 'done';

interface State {
  phase: Phase;
  /** indices into `pieces` */
  placed: number[];
  /** combos already accepted, as order-insensitive keys */
  found: string[];
  round: number;
}

type Action =
  | { type: 'place'; index: number }
  | { type: 'remove'; at: number }
  | { type: 'reject' }
  | { type: 'settle' }
  | { type: 'climb' }
  | { type: 'record'; key: string }
  | { type: 'again' }
  | { type: 'finish' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'place':
      if (state.phase !== 'building') return state;
      return { ...state, placed: [...state.placed, action.index] };
    case 'remove':
      if (state.phase !== 'building') return state;
      return { ...state, placed: state.placed.filter((_, i) => i !== action.at) };
    case 'reject':
      return { ...state, phase: 'wobble' };
    case 'settle':
      return state.phase === 'wobble' ? { ...state, phase: 'building' } : state;
    case 'climb':
      return { ...state, phase: 'climbing' };
    case 'record':
      return { ...state, found: [...state.found, action.key] };
    case 'again':
      return { ...state, phase: 'building', placed: [], round: state.round + 1 };
    case 'finish':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */

export function LadderBuilder({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'ladder-builder'>) {
  const session = useMiniGameSession('ladder-builder', onComplete, onEvent);
  const stage = useStage(compact);
  const hints = useHintLadder(session.hint);
  const { box, ready, onLayout } = useMeasuredBox();

  const pieces = challenge.pieces;
  const target = Math.max(1, challenge.target);
  const needed = ageBand === 'C' ? challenge.requiredSolutions : 1;
  const pet = animalName[challenge.animal];

  const [state, dispatch] = useReducer(reducer, { phase: 'building', placed: [], found: [], round: 0 });

  const placedValues = useMemo(
    () => state.placed.map((i) => pieces[i] ?? 0),
    [pieces, state.placed],
  );
  const total = sumOf(placedValues);
  const available = useMemo(
    () => pieces.map((v, i) => ({ value: v, index: i, used: state.placed.includes(i) })),
    [pieces, state.placed],
  );
  const suggestion = useMemo(
    () => bestNextPiece(available.filter((p) => !p.used).map((p) => p.value), placedValues, target),
    [available, placedValues, target],
  );

  const climb = useSharedValue(0);
  const wobble = useSharedValue(0);
  const spokenTotal = useRef(-1);

  /* ---- prompt ---- */
  const prompt =
    state.phase === 'again' || (state.found.length === 1 && needed === 2)
      ? 'Find another way!'
      : ageBand === 'A'
        ? `Build a ladder ${target} tall!`
        : `Reach the ${pet.en} at ${target}!`;
  const subtitle = compact || ageBand === 'A' ? undefined : 'Tap or drag a ladder piece onto the stack.';
  useSpokenPrompt(prompt, { speaker: 'bea' });

  /* ---- speak the running total ---- */
  useEffect(() => {
    if (total === 0 || total === spokenTotal.current) return;
    spokenTotal.current = total;
    if (ageBand !== 'C') speech.say(String(total), { speaker: 'bea' });
  }, [ageBand, total]);

  /* ---- geometry ---- */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const groundY = h * 0.9;
    const topPad = h * 0.08;
    const unitPx = Math.max(12, Math.min(stage.s(30), (groundY - topPad) / (target + 0.8)));
    const ladderW = Math.max(54, Math.min(stage.s(66), w * 0.2));
    const wallX = Math.min(w * 0.46, w - ladderW - stage.s(96));
    const wallW = w - wallX;
    const ledgeY = groundY - target * unitPx;
    return { w, h, groundY, unitPx, ladderW, wallX, wallW, ledgeY, stackX: Math.max(8, wallX - ladderW - stage.s(6)) };
  }, [box.h, box.w, stage, target]);

  const trayUnitPx = Math.max(11, Math.min(geo.unitPx, stage.s(19)));

  /* ---- placing ---- */
  const rejectPiece = useCallback(
    (value: number) => {
      dispatch({ type: 'reject' });
      session.incorrect(`overshoot ${total}+${value}`);
      sfx.play('wrong-soft');
      haptics.nudge();
      wobble.value = withSequence(
        withTiming(-7, { duration: 60 }),
        withTiming(7, { duration: 60 }),
        withTiming(-5, { duration: 60 }),
        withTiming(0, { duration: 70 }),
      );
      hints.miss({
        text: suggestion
          ? `Too tall! ${total} + ${value} is more than ${target}. Try the ${suggestion}.`
          : `Too tall! Take a piece off and try a shorter one.`,
        es: '¡Muy alta! Prueba una más corta.',
      });
      setTimeout(() => dispatch({ type: 'settle' }), 520);
    },
    [hints, session, suggestion, target, total, wobble],
  );

  const finishRound = useCallback(
    (values: number[]) => {
      const key = comboKey(values);
      if (state.found.includes(key)) {
        session.incorrect('duplicate combo');
        sfx.play('wrong-soft');
        haptics.nudge();
        hints.miss({
          text: `That's the same way as before. Try different pieces that still make ${target}.`,
          es: '¡Esa ya la hiciste! Prueba otra combinación.',
        });
        dispatch({ type: 'again' });
        return;
      }
      session.correct(equationText(values));
      sfx.play('correct');
      haptics.success();
      dispatch({ type: 'record', key });
      dispatch({ type: 'climb' });
      climb.value = withTiming(1, { duration: 1100 });
      speech.say(`${values.join(' plus ')} equals ${target}`, { speaker: 'bea' });

      setTimeout(() => {
        sfx.play(pet.sound);
        haptics.celebrate();
      }, 1150);

      setTimeout(() => {
        const done = state.found.length + 1 >= needed;
        if (done) {
          dispatch({ type: 'finish' });
          session.progress(needed, needed);
          session.say('rookie', `Got you, little ${pet.en}!`);
          sfx.play('success');
          setTimeout(() => session.complete(), 900);
        } else {
          session.progress(state.found.length + 1, needed);
          session.say('bea', 'Great! Now find another way to make the same height.');
          speech.say('Now find another way!', { speaker: 'bea' });
          climb.value = withTiming(0, { duration: 320 });
          dispatch({ type: 'again' });
        }
      }, 1800);
    },
    [climb, hints, needed, pet, session, state.found, target],
  );

  const place = useCallback(
    (index: number) => {
      if (state.phase !== 'building') return;
      const value = pieces[index];
      if (value === undefined || state.placed.includes(index)) return;
      if (total + value > target) {
        rejectPiece(value);
        return;
      }
      dispatch({ type: 'place', index });
      sfx.play('clank');
      haptics.drop();
      const next = [...placedValues, value];
      if (sumOf(next) === target) setTimeout(() => finishRound(next), 380);
    },
    [finishRound, pieces, placedValues, rejectPiece, state.phase, state.placed, target, total],
  );

  const removeAt = useCallback(
    (at: number) => {
      if (state.phase !== 'building') return;
      dispatch({ type: 'remove', at });
      sfx.play('tap-soft');
      haptics.select();
    },
    [state.phase],
  );

  /* ---- idle hint ---- */
  useEffect(() => {
    if (state.phase !== 'building') return;
    const t = setTimeout(() => {
      if (suggestion !== null && total < target) {
        hints.nudge({
          text: `You need ${target - total} more. The ${suggestion} piece fits!`,
          es: `Faltan ${target - total}.`,
        });
      }
    }, 14000);
    return () => clearTimeout(t);
  }, [hints, state.phase, state.placed.length, suggestion, target, total]);

  /* ---- climber + animal positions ---- */
  /** full-rig height (the rig is drawn tall, so the box is 1.75 × the old head) */
  const rookieSize = Math.max(46, Math.min(stage.s(70), geo.ladderW * 1.15));
  const rookieH = rookieSize * 1.75;
  const climberStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -climb.value * (geo.groundY - geo.ledgeY - rookieSize * 0.25) }],
  }));
  const stackStyle = useAnimatedStyle(() => ({ transform: [{ translateX: wobble.value }] }));
  const animalOnShoulder = state.phase === 'climbing' || state.phase === 'done';

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      es={`Llega hasta ${target}`}
      compact={compact}
      onStageLayout={onLayout}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      backdrop={<Stage variant="park" groundHeight={150} />}
      footer={
        <View style={styles.mathRow}>
          <Text variant="h3" color={total === target ? palette.leafGreenDark : palette.navy}>
            {placedValues.length > 0 ? equationText(placedValues) : `0 of ${target}`}
          </Text>
          {needed === 2 ? (
            <View style={styles.chips}>
              {state.found.map((k) => (
                <Chip key={k} label={k.split('+').join(' + ')} tone="green" />
              ))}
            </View>
          ) : null}
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
                accessibilityLabel={`Ladder piece of ${p.value}`}
              >
                <LadderPiece
                  units={p.value}
                  unitPx={trayUnitPx}
                  width={Math.max(48, stage.s(54))}
                  tone={p.used ? 'ghost' : 'yellow'}
                />
              </DragToken>
            ))}
          </TrayRow>
        </Tray>
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          {/* wall + unit marks */}
          <View style={[styles.wall, { left: geo.wallX, top: 0, width: geo.wallW, height: geo.groundY }]} pointerEvents="none">
            <UnitWall width={geo.wallW} height={geo.groundY} units={target + 1} unitPx={geo.unitPx} />
          </View>

          {/* unit numbers up the wall */}
          {Array.from({ length: target + 1 }, (_, i) => i).map((i) =>
            i % (target > 10 ? 2 : 1) === 0 ? (
              <View key={i} style={[styles.unitLabel, { left: geo.wallX + 8, top: geo.groundY - i * geo.unitPx - 11 }]} pointerEvents="none">
                <Text variant="tiny" color={palette.navy}>
                  {i}
                </Text>
              </View>
            ) : null,
          )}

          {/* ledge with the animal */}
          <View
            style={[styles.ledge, { left: geo.stackX - 6, top: geo.ledgeY - 10, width: geo.wallX - geo.stackX + geo.ladderW + 24 }]}
            pointerEvents="none"
          />
          {!animalOnShoulder ? (
            <View style={[styles.animal, { left: geo.stackX + 2, top: geo.ledgeY - stage.s(62) }]} pointerEvents="none">
              <Animal id={challenge.animal} size={stage.s(62)} mood="help" />
            </View>
          ) : null}

          {/* ground — a soft-lipped plane, never a hard-edged rectangle */}
          <View style={[styles.ground, { top: geo.groundY, height: Math.max(0, geo.h - geo.groundY + 40) }]} pointerEvents="none">
            <View style={styles.groundLip} />
          </View>

          {/* Captain Bea foots the ladder while the child climbs */}
          <View style={[styles.pepper, { left: Math.max(4, geo.stackX - stage.s(60)), top: geo.groundY - stage.s(62) }]} pointerEvents="none">
            <CaptainBea
              size={stage.s(78)}
              emotion={state.phase === 'done' ? 'proud' : 'calm'}
              pose={state.phase === 'done' ? 'cheer' : 'stand'}
              bobPhase={0.55}
            />
          </View>

          {/* the ladder stack */}
          <Animated.View style={[styles.stack, { left: geo.stackX, width: geo.ladderW, height: geo.groundY }, stackStyle]}>
            {state.placed.map((pieceIndex, pos) => {
              const value = pieces[pieceIndex] ?? 0;
              const below = sumOf(state.placed.slice(0, pos).map((i) => pieces[i] ?? 0));
              const h = value * geo.unitPx;
              return (
                <Animated.View
                  key={`${pieceIndex}-${pos}-${state.round}`}
                  entering={ZoomIn.springify().damping(13)}
                  style={[styles.stacked, { bottom: below * geo.unitPx, height: h, width: geo.ladderW }]}
                >
                  <Pressable
                    onPress={() => removeAt(pos)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ladder piece of ${value}`}
                    hitSlop={6}
                  >
                    <LadderPiece units={value} unitPx={geo.unitPx} width={geo.ladderW} tone="placed" labelSize="sm" />
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Rookie climbing */}
          <Animated.View
            style={[styles.rookie, { left: geo.stackX + geo.ladderW / 2 - rookieH * 0.29, top: geo.groundY - rookieH }, climberStyle]}
            pointerEvents="none"
          >
            {/* critique #23 — the full rig, never a head in a circle */}
            <Rookie
              size={rookieSize * 1.75}
              emotion={state.phase === 'done' ? 'proud' : 'happy'}
              pose={state.phase === 'climbing' ? 'cheer' : 'stand'}
              jumping={state.phase === 'done'}
            />
            {animalOnShoulder ? (
              <Animated.View entering={FadeIn.delay(900)} style={styles.shoulder}>
                <Animal id={challenge.animal} size={rookieSize * 0.62} mood="happy" />
              </Animated.View>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  wall: { position: 'absolute' },
  unitLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.tag,
    paddingHorizontal: 6,
    minWidth: 22,
    alignItems: 'center',
  },
  ledge: { position: 'absolute', height: 14, borderRadius: 7, backgroundColor: palette.wood, ...shadows.soft },
  animal: { position: 'absolute' },
  ground: {
    position: 'absolute',
    left: -20,
    right: -20,
    backgroundColor: palette.grassDark,
    borderTopLeftRadius: radii.panel * 3,
    borderTopRightRadius: radii.panel * 3,
  },
  groundLip: { position: 'absolute', left: 0, right: 0, top: 0, height: 10, backgroundColor: palette.grass, borderTopLeftRadius: radii.panel * 3, borderTopRightRadius: radii.panel * 3 },
  pepper: { position: 'absolute' },
  stack: { position: 'absolute', bottom: 0, justifyContent: 'flex-end' },
  stacked: { position: 'absolute', alignItems: 'center' },
  rookie: { position: 'absolute', alignItems: 'center' },
  shoulder: { position: 'absolute', right: -8, top: -10 },
  mathRow: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  highlight: { borderRadius: radii.tile, ...shadows.glowGold },
});
