import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { Button, Text, Tray, TrayRow } from '@/ui';
import { ResetIcon } from '@/ui/icons';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';

import { Stage } from '@/world';

import { BarrierPiece, Campfire, Cone, RingPanel, ringSlots } from '@/world/props';
import {
  DragToken,
  GameShell,
  HILITE,
  SHADE,
  bark,
  leaf,
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
  useSpokenPrompt(`Build a safety ring of ${target}`, { speaker: 'bea' });

  /* ---- geometry ---- */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const cx = w / 2;
    const cy = h * 0.5;
    /* the safety ring is the subject: grow it until the widest barrier panel
       just touches the edge of the play area, then stop */
    const radius = Math.min(w * 0.36, h * 0.4);
    const slotSize = Math.max(10, Math.min(((2 * Math.PI * radius) / target) * 0.92, radius * 0.55));
    /* the clearing is an island of grass, sized to end *inside* the play area:
       an ellipse clipped by the frame reads as a green card again */
    const clearW = Math.min(w * 0.49, radius * 2);
    const clearH = Math.min(h * 0.48, radius * 1.5);
    return { w, h, cx, cy, radius, slotSize, clearW, clearH, fire: Math.min(radius * 1.55, Math.min(w, h) * 0.52) };
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
    session.say('bea', line);
    speech.say(line, { speaker: 'bea' });
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
      if (ageBand !== 'C') speech.say(String(sumOf(next)), { speaker: 'bea' });
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
          {/* the picnic clearing — an organic grass bowl with a scorched
              centre, a worn path, seating logs and the safety kit. Never a
              hard-cornered rectangle: the old one read as a green card pasted
              over the sky. */}
          <Svg style={StyleSheet.absoluteFill} width={geo.w} height={geo.h} pointerEvents="none">
            {/* the clearing itself, and the mown lip that catches the light */}
            <Ellipse cx={geo.cx} cy={geo.cy + geo.radius * 0.08} rx={geo.clearW} ry={geo.clearH} fill={palette.grassDark} />
            <Ellipse cx={geo.cx} cy={geo.cy + geo.radius * 0.02} rx={geo.clearW * 0.955} ry={geo.clearH * 0.95} fill={palette.grass} />
            <Ellipse cx={geo.cx} cy={geo.cy + geo.radius * 0.06} rx={geo.clearW * 0.9} ry={geo.clearH * 0.9} fill="#9BD97A" />
            {/* the bare earth inside the ring, scorched at the middle */}
            <Ellipse cx={geo.cx} cy={geo.cy} rx={geo.radius * 0.8} ry={geo.radius * 0.77} fill="#D8C39A" />
            <Ellipse cx={geo.cx} cy={geo.cy + 2} rx={geo.radius * 0.6} ry={geo.radius * 0.57} fill="#C6AC7C" opacity={0.7} />
            <Path
              d={`M ${geo.cx - geo.radius * 0.44} ${geo.cy - geo.radius * 0.52} q ${geo.radius * 0.44} ${-geo.radius * 0.14} ${geo.radius * 0.84} ${geo.radius * 0.05}`}
              stroke={HILITE}
              strokeWidth={Math.max(2, geo.radius * 0.03)}
              fill="none"
              strokeLinecap="round"
            />
            {/* the worn path somebody walked in on */}
            <Path
              d={`M ${geo.cx - geo.radius * 0.34} ${geo.h} Q ${geo.cx - geo.radius * 0.1} ${geo.cy + geo.radius * 1.5} ${geo.cx - geo.radius * 0.05} ${geo.cy + geo.radius * 0.94} L ${geo.cx + geo.radius * 0.42} ${geo.cy + geo.radius * 1.02} Q ${geo.cx + geo.radius * 0.5} ${geo.cy + geo.radius * 1.6} ${geo.cx + geo.radius * 0.36} ${geo.h} Z`}
              fill="#E4D3AE"
              opacity={0.8}
            />
            {/* two seating logs, outside the ring where nobody has to reach */}
            {[
              { x: Math.max(8, geo.cx - geo.clearW * 0.86), y: geo.cy + geo.radius * 0.94, f: 1 },
              { x: Math.min(geo.w - geo.radius * 0.66 - 8, geo.cx + geo.clearW * 0.42), y: geo.cy - geo.clearH * 0.78, f: -1 },
            ].map((log, i) => {
              const lw = geo.radius * 0.62;
              const lh = Math.max(12, geo.radius * 0.17);
              return (
                <G key={`log${i}`}>
                  <Ellipse cx={log.x + lw / 2} cy={log.y + lh * 0.95} rx={lw * 0.56} ry={lh * 0.34} fill={palette.navy} opacity={0.1} />
                  <Rect x={log.x} y={log.y} width={lw} height={lh} rx={lh / 2} fill={bark.mid} />
                  <Rect x={log.x} y={log.y} width={lw} height={lh * 0.34} rx={lh * 0.17} fill={bark.rim} opacity={0.8} />
                  <Ellipse cx={log.f > 0 ? log.x + lw : log.x} cy={log.y + lh / 2} rx={lh * 0.3} ry={lh / 2} fill={bark.lit} />
                  <Ellipse cx={log.f > 0 ? log.x + lw : log.x} cy={log.y + lh / 2} rx={lh * 0.16} ry={lh * 0.26} fill={bark.deep} />
                </G>
              );
            })}
            {/* the water bucket that belongs beside any camp fire */}
            <G>
              <Ellipse cx={Math.min(geo.w - geo.radius * 0.24, geo.cx + geo.radius * 1.16)} cy={geo.cy + geo.radius * 1.12} rx={geo.radius * 0.2} ry={geo.radius * 0.06} fill={palette.navy} opacity={0.11} />
              <Path
                d={`M ${Math.min(geo.w - geo.radius * 0.42, geo.cx + geo.radius * 0.98)} ${geo.cy + geo.radius * 0.82} h ${geo.radius * 0.36} l ${-geo.radius * 0.05} ${geo.radius * 0.28} h ${-geo.radius * 0.26} z`}
                fill={palette.slate}
              />
              <Ellipse cx={Math.min(geo.w - geo.radius * 0.24, geo.cx + geo.radius * 1.16)} cy={geo.cy + geo.radius * 0.82} rx={geo.radius * 0.18} ry={geo.radius * 0.05} fill={palette.waterCyan} />
              <Path
                d={`M ${Math.min(geo.w - geo.radius * 0.42, geo.cx + geo.radius * 0.98)} ${geo.cy + geo.radius * 0.82} a ${geo.radius * 0.18} ${geo.radius * 0.18} 0 0 1 ${geo.radius * 0.36} 0`}
                stroke={palette.charcoal}
                strokeWidth={Math.max(1.6, geo.radius * 0.025)}
                fill="none"
              />
              <Path
                d={`M ${Math.min(geo.w - geo.radius * 0.4, geo.cx + geo.radius * 1.0)} ${geo.cy + geo.radius * 0.88} l ${geo.radius * 0.06} ${geo.radius * 0.2}`}
                stroke={HILITE}
                strokeWidth={Math.max(1.4, geo.radius * 0.02)}
                fill="none"
                strokeLinecap="round"
              />
            </G>
            {/* grass tufts around the clearing, densest at the edges */}
            {[0.06, 0.16, 0.85, 0.95, 0.3, 0.72].map((f, i) => {
              const x = geo.w * f;
              const y = geo.cy + geo.radius * (i % 2 ? 1.36 : -1.34);
              const k = Math.max(0.7, geo.radius * 0.013);
              return (
                <G key={`tuft${i}`}>
                  <Path d={`M ${x} ${y} q ${-5 * k} ${-12 * k} 0 ${-17 * k} q ${5 * k} ${6 * k} 0 ${17 * k} z`} fill={leaf.deep} />
                  <Path d={`M ${x + 7 * k} ${y} q ${-4 * k} ${-9 * k} ${1 * k} ${-13 * k} q ${4 * k} ${5 * k} ${-1 * k} ${13 * k} z`} fill={palette.grass} />
                  <Path d={`M ${x - 7 * k} ${y} q ${-3 * k} ${-7 * k} ${-2 * k} ${-11 * k} q ${5 * k} ${4 * k} ${2 * k} ${11 * k} z`} fill={leaf.lit} />
                </G>
              );
            })}
            {/* a few pebbles kicked out of the fire ring */}
            {[
              [geo.cx - geo.radius * 0.86, geo.cy + geo.radius * 0.56],
              [geo.cx + geo.radius * 0.78, geo.cy - geo.radius * 0.62],
              [geo.cx - geo.radius * 0.2, geo.cy - geo.radius * 0.82],
            ].map(([x, y], i) => (
              <G key={`peb${i}`}>
                <Circle cx={x} cy={y} r={Math.max(3, geo.radius * 0.045)} fill="#9AA4C0" />
                <Circle cx={(x ?? 0) - geo.radius * 0.014} cy={(y ?? 0) - geo.radius * 0.014} r={Math.max(1.2, geo.radius * 0.02)} fill={HILITE} />
              </G>
            ))}
            <Ellipse cx={geo.cx} cy={geo.cy + geo.radius * 0.06} rx={geo.radius * 0.84} ry={geo.radius * 0.8} fill={SHADE} opacity={0.14} />
          </Svg>

          {/* cones marking the clearing — always inside the frame, never a
              half-cone clipped by the edge of the play area */}
          {[
            { left: true, y: Math.min(geo.h - stage.s(46), geo.cy + geo.clearH * 0.82), size: stage.s(40) },
            { left: true, y: Math.max(stage.s(4), geo.cy - geo.clearH * 0.92), size: stage.s(34) },
            { left: false, y: Math.max(stage.s(4), geo.cy - geo.clearH * 0.92), size: stage.s(40) },
            { left: false, y: Math.min(geo.h - stage.s(46), geo.cy + geo.clearH * 0.82), size: stage.s(34) },
          ].map((c, i) => (
            <View
              key={i}
              style={[styles.cone, c.left ? { left: stage.s(6) } : { right: stage.s(6) }, { top: c.y }]}
              pointerEvents="none"
            >
              <Cone size={c.size} />
            </View>
          ))}

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
