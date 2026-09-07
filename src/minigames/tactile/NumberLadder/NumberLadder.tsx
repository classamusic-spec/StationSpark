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
import { Rookie } from '@/characters';
import { Stage } from '@/world';
import { Animal, LadderRails } from '@/world/props';
import {
  GameShell,
  PlayGround,
  TownFacade,
  clampNum,
  minJumps,
  useHintLadder,
  useMeasuredBox,
  useSpokenPrompt,
  useStage,
} from '../shared';

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

  // The challenge carries jump *sizes*; direction is ours. Climbing down to a
  // lower rung needs "−" buttons (18 → 12 is −6). The youngest band only sees
  // the direction it needs; older bands get both so an overshoot can be fixed.
  const jumps = useMemo(() => {
    const sizes = Array.from(new Set(challenge.jumps.map((j) => Math.abs(j)).filter((j) => j > 0))).sort((a, b) => a - b);
    const down = sizes.map((j) => -j);
    if (ageBand === 'A') return target < start ? down : sizes;
    return target < start ? [...down, ...sizes] : [...sizes, ...down];
  }, [ageBand, challenge.jumps, start, target]);
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
  useSpokenPrompt(`Climb to ${target}`, { speaker: 'bea' });

  /* ---- geometry ----
   * Two things were wrong here. The ladder leaned on a tan panel in a screen
   * half full of sky; and for bands B and C the number line runs 0…100, so a
   * ladder drawn rung-for-rung was 1 600 px tall in a 500 px box — the child
   * saw rungs 0 to 28 and the flag they were climbing to was off the top of the
   * screen. So the ladder now shows a *window* of the line around the start and
   * the target, wide enough that a jump can never land out of sight, and it
   * leans on a building that runs the full width of the play area. */
  const maxJump = useMemo(() => Math.max(1, ...jumps.map((j) => Math.abs(j))), [jumps]);

  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);

    const ladderW = Math.max(58, Math.min(stage.s(80), w * 0.24));
    const rookieH = Math.max(48, Math.min(stage.s(74), ladderW * 1.1)) * 1.7;
    /* the climber stands ON the top rung, so the gutter above it is his height */
    const topPad = Math.max(h * 0.07, 26, rookieH * 0.86);
    const botPad = Math.max(h * 0.1, 44);
    const avail = Math.max(60, h - topPad - botPad);

    /* the visible window: everything between start and target, plus a jump's
       worth of room at each end so an overshoot still lands on a drawn rung */
    let lo = Math.max(min, Math.min(start, target) - maxJump);
    let hi = Math.min(max, Math.max(start, target) + maxJump);
    const cap = stage.s(34);
    /* ...then widened until the ladder fills the height it was given */
    for (let guard = 0; guard < 200 && avail / Math.max(1, hi - lo) > cap && (lo > min || hi < max); guard += 1) {
      if (lo > min) lo -= 1;
      if (hi < max) hi += 1;
    }
    const rungs = Math.max(1, hi - lo);
    const unitPx = Math.max(9, Math.min(cap, avail / rungs));
    /* label every 1, 2, 5 or 10 — whichever first leaves the pills clear */
    const step = [1, 2, 5, 10, 20].find((k) => k * unitPx >= 28) ?? 20;
    /* a rung every whole number is unreadable once the window is 40 wide, so
       rungs land on a multiple of the unit — always one the labels also use */
    const rungStep = [1, 2, 5, 10, 20].find((k) => k * unitPx >= 16) ?? 20;

    const gaugeW = Math.max(38, stage.s(48));
    const ladderX = Math.max(gaugeW + stage.s(14), w * 0.44);
    const bottomY = h - botPad;
    return {
      w,
      h,
      lo,
      hi,
      rungs,
      step,
      rungStep,
      unitPx,
      ladderW,
      ladderX,
      gaugeW,
      gaugeX: ladderX - gaugeW - stage.s(6),
      bottomY,
      groundY: bottomY + 18,
      ladderH: unitPx * rungs,
    };
  }, [box.h, box.w, max, maxJump, min, stage, start, target]);

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
      session.say('bea', line);
      speech.say(line, { speaker: 'bea' });
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
            speech.say(String(to), { speaker: 'bea' });
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

  const lo = geo.lo;
  const hi = geo.hi;
  const climberStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -(Math.min(hi, Math.max(lo, pos.value)) - lo) * geo.unitPx + bob.value }],
  }));

  const flagTop = geo.bottomY - (target - geo.lo) * geo.unitPx;

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      es={`Sube hasta ${target}`}
      compact={compact}
      onStageLayout={onLayout}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      backdrop={<Stage variant="street" groundHeight={130} />}
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
          {/* the building the ladder leans on, running the full width */}
          <View style={styles.wall} pointerEvents="none">
            <TownFacade
              width={geo.w}
              height={geo.groundY}
              tone="cream"
              rows={Math.max(2, Math.min(5, Math.round(geo.groundY / Math.max(70, stage.s(104)))))}
              cols={2}
              awning={false}
              seed={1}
              gauge={{ x: geo.gaugeX, w: geo.gaugeW, unitPx: geo.unitPx, units: geo.rungs, baseY: geo.bottomY, markAt: target - geo.lo }}
              leftGutter={stage.s(12)}
            />
          </View>

          {/* ladder */}
          <View
            style={[styles.ladder, { left: geo.ladderX, top: geo.bottomY - geo.ladderH, width: geo.ladderW, height: geo.ladderH }]}
            pointerEvents="none"
          >
            <LadderRails
              width={geo.ladderW}
              height={geo.ladderH}
              rungs={Math.max(1, Math.round(geo.rungs / geo.rungStep))}
              unitPx={geo.unitPx * geo.rungStep}
              markAt={Math.round((target - geo.lo) / geo.rungStep)}
            />
          </View>

          {/* rung numbers, painted on the gauge band */}
          {Array.from({ length: geo.rungs + 1 }, (_, i) => geo.lo + i).map((n) => {
            const isTarget = n === target;
            /* the target always gets a pill; a step label that would sit on top
               of it stands down, so two numbers never overlap */
            if (!isTarget && (n % geo.step !== 0 || Math.abs(n - target) * geo.unitPx < 22)) return null;
            const top = geo.bottomY - (n - geo.lo) * geo.unitPx - 12;
            return (
              <View
                key={n}
                style={[
                  styles.rungLabel,
                  {
                    left: geo.gaugeX + geo.gaugeW / 2 - 17,
                    top,
                    backgroundColor: isTarget ? palette.leafGreen : palette.white,
                  },
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

          {/* the pavement the ladder is footed on */}
          <PlayGround width={geo.w} height={geo.h} top={geo.groundY} variant="pavement" dressed kerb seed={span} />

          {/* Rookie — critique #23: the full rig, not a head in a circle */}
          <Animated.View
            style={[
              styles.rookie,
              { left: geo.ladderX + geo.ladderW / 2 - rookieSize * 0.5, top: geo.groundY - rookieSize * 1.7 },
              climberStyle,
            ]}
            pointerEvents="none"
          >
            <Rookie size={rookieSize * 1.7} emotion={state.phase === 'done' ? 'proud' : 'happy'} pose={state.phase === 'done' ? 'cheer' : 'stand'} jumping={state.phase === 'done'} />
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
    minWidth: 34,
    alignItems: 'center',
    borderRadius: radii.tag,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...shadows.soft,
  },
  flag: { position: 'absolute', alignItems: 'center' },
  flagPet: { marginTop: -6 },
  wall: { position: 'absolute', left: 0, top: 0 },
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
