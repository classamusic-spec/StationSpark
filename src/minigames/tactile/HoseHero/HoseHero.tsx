import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Fraction } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, spacing } from '@/theme';
import { CountStrip, Text } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useReducedMotion } from '@/hooks';
import { formatFraction, toNumber } from '@/utils/fractions';
import { Stage } from '@/world';
import { SceneCrew } from '@/world/scenes';

import { BuildingFacade, Flame, FractionBar, HoseRig, Hydrant, facadeLayout, sceneTheme, windowAt } from '@/world/props';
import {
  AskQuestion,
  GameShell,
  PulseRing,
  fractionStageTargets,
  optionsFor,
  useHintLadder,
  useClock,
  useMeasuredBox,
  useSpokenPrompt,
  useStage,
} from '../shared';

/* ------------------------------------------------------------------ */
/* State machine: aiming → spraying → flameOut → asking → done          */
/* ------------------------------------------------------------------ */

type Phase = 'aiming' | 'spraying' | 'flameOut' | 'asking' | 'done';
type FlameStatus = 'burning' | 'steaming' | 'out';

interface State {
  phase: Phase;
  /** one entry per entry in `flameSlots` */
  status: FlameStatus[];
  /** flames out in total (including the ones that started out) */
  outCount: number;
  /** current fraction beat */
  stage: number;
  /** flames put out inside the current fraction beat */
  stageDone: number;
  asked: boolean;
}

type Action =
  | { type: 'press' }
  | { type: 'release' }
  | { type: 'douse'; i: number }
  | { type: 'settle'; i: number }
  | { type: 'resume'; pressing: boolean }
  | { type: 'ask' }
  | { type: 'answered' }
  | { type: 'nextStage' }
  | { type: 'finish' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'press':
      return state.phase === 'aiming' ? { ...state, phase: 'spraying' } : state;
    case 'release':
      return state.phase === 'spraying' ? { ...state, phase: 'aiming' } : state;
    case 'douse': {
      if (state.status[action.i] !== 'burning') return state;
      const status = [...state.status];
      status[action.i] = 'steaming';
      return { ...state, status, outCount: state.outCount + 1, stageDone: state.stageDone + 1, phase: 'flameOut' };
    }
    case 'settle': {
      if (state.status[action.i] !== 'steaming') return state;
      const status = [...state.status];
      status[action.i] = 'out';
      return { ...state, status };
    }
    case 'resume':
      return state.phase === 'flameOut' ? { ...state, phase: action.pressing ? 'spraying' : 'aiming' } : state;
    case 'ask':
      return { ...state, phase: 'asking', asked: true };
    case 'answered':
      return state.phase === 'asking' ? { ...state, phase: 'aiming' } : state;
    case 'nextStage':
      return { ...state, stage: state.stage + 1, stageDone: 0 };
    case 'finish':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */

const DOUSE_MS = 600;
const TICK_MS = 90;
const FLAME_OUT_BEAT_MS = 620;

function promptFor(total: number, fraction: Fraction | undefined, remainingInStage: number, hasStages: boolean) {
  if (!hasStages) return `Put Out ${total} Flames!`;
  if (fraction) return `Put out ${formatFraction(fraction)} of the flames!`;
  return `Put out the last ${remainingInStage}!`;
}

export function HoseHero({ challenge, ageBand, onComplete, onEvent, compact, missionContext }: MiniGameProps<'hose-hero'>) {
  const session = useMiniGameSession('hose-hero', onComplete, onEvent);
  const stage = useStage(compact);
  const reduced = useReducedMotion();
  const hints = useHintLadder(session.hint);

  const total = Math.max(1, challenge.totalFlames);
  const slots = useMemo(() => challenge.flameSlots.slice(0, total), [challenge.flameSlots, total]);
  const alreadyOut = Math.max(0, Math.min(challenge.alreadyOut, slots.length));
  const toExtinguish = slots.length - alreadyOut;

  const stageTargets = useMemo(
    () => (challenge.fractionTargets && challenge.fractionTargets.length > 0 ? fractionStageTargets(challenge.fractionTargets, toExtinguish) : []),
    [challenge.fractionTargets, toExtinguish],
  );
  const hasStages = stageTargets.length > 0 && ageBand !== 'A';

  const [state, dispatch] = useReducer(reducer, undefined, (): State => ({
    phase: 'aiming',
    status: slots.map((_, i) => (i < alreadyOut ? 'out' : 'burning')),
    outCount: alreadyOut,
    stage: 0,
    stageDone: 0,
    asked: false,
  }));

  /* ---- water rig shared values ---- */
  const aimX = useSharedValue(0);
  const aimY = useSharedValue(0);
  const power = useSharedValue(0);
  const clock = useClock(state.phase !== 'asking' && state.phase !== 'done');
  const lastSentX = useSharedValue(-999);
  const lastSentY = useSharedValue(-999);

  const aimRef = useRef({ x: 0, y: 0 });
  const pressingRef = useRef(false);
  const wetRef = useRef({ slot: -1, ms: 0 });
  const idleRef = useRef(0);
  const nudgedRef = useRef(0);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const [wet, setWet] = useState<{ slot: number; amount: number } | null>(null);
  const { box, ready, onLayout } = useMeasuredBox();

  /* ---- geometry ---- */
  const layout = useMemo(
    () => facadeLayout(challenge.grid, { w: Math.max(1, box.w), h: Math.max(1, box.h) }, { maxWidth: stage.isTablet ? 620 : 520 }),
    [box.h, box.w, challenge.grid, stage.isTablet],
  );
  const nozzle = useMemo(() => ({ x: box.w * 0.18, y: box.h * 0.82 }), [box.h, box.w]);
  const flameSize = layout.u * (ageBand === 'A' ? 2.5 : 2.15);
  const hitRadius = Math.max(46, layout.u * (hints.assist ? 3.6 : 2.4));

  const windowFor = useCallback((slot: number) => layout.windows.find((w) => w.index === slot) ?? null, [layout.windows]);

  const nextBurning = useMemo(() => {
    const i = state.status.findIndex((s) => s === 'burning');
    return i < 0 ? null : { i, slot: slots[i] ?? 0 };
  }, [slots, state.status]);

  /* ---- prompt ---- */
  const currentFraction = hasStages ? challenge.fractionTargets?.[state.stage] : undefined;
  const stageTarget = hasStages ? (stageTargets[state.stage] ?? 0) : 0;
  const prompt = promptFor(total, currentFraction, Math.max(0, stageTarget - state.stageDone), hasStages);
  const theme = sceneTheme(challenge.scene);
  const place = missionContext?.locationName ?? theme.name;
  const subtitle = compact || ageBand === 'A' ? undefined : `Drag to aim, hold to spray the ${place}.`;
  const promptEs = hasStages && currentFraction ? `Apaga ${formatFraction(currentFraction)} de las llamas` : `¡Apaga ${total} llamas!`;
  useSpokenPrompt(state.phase === 'asking' ? null : prompt, { speaker: 'beacon' });

  /* ---- effects: idle nudges ---- */
  useEffect(() => {
    if (state.phase !== 'aiming' && state.phase !== 'spraying') return;
    const id = setInterval(() => {
      idleRef.current += 500;
      if (idleRef.current >= 6000 && nudgedRef.current === 0) {
        nudgedRef.current = 1;
        hints.nudge({ text: 'Point the hose at the next flame and hold!', es: '¡Apunta a la llama!' });
      } else if (idleRef.current >= 13000 && nudgedRef.current === 1) {
        nudgedRef.current = 2;
        hints.nudge({ text: 'I put a ring around it — spray right there!', es: '¡Rocía justo ahí!' }, { assist: true });
      }
    }, 500);
    return () => clearInterval(id);
  }, [hints, state.phase]);

  /* ---- spray → wetness → douse ---- */
  const douse = useCallback(
    (i: number) => {
      wetRef.current = { slot: -1, ms: 0 };
      idleRef.current = 0;
      setWet(null);
      dispatch({ type: 'douse', i });
      sfx.play('steam');
      sfx.play('sparkle', { volume: 0.5 });
      haptics.thud();
      const t = setTimeout(() => dispatch({ type: 'settle', i }), 950);
      return () => clearTimeout(t);
    },
    [dispatch],
  );

  useEffect(() => {
    if (state.phase !== 'spraying') {
      wetRef.current = { slot: -1, ms: 0 };
      return;
    }
    const id = setInterval(() => {
      const { x, y } = aimRef.current;
      const hit = windowAt(layout.windows, x, y, hitRadius);
      const i = hit ? slots.findIndex((s, k) => s === hit.index && statusRef.current[k] === 'burning') : -1;
      if (i < 0) {
        wetRef.current = { slot: -1, ms: 0 };
        setWet((w) => (w === null ? w : null));
        return;
      }
      wetRef.current = wetRef.current.slot === i ? { slot: i, ms: wetRef.current.ms + TICK_MS } : { slot: i, ms: TICK_MS };
      idleRef.current = 0;
      const amount = Math.min(1, wetRef.current.ms / DOUSE_MS);
      setWet({ slot: i, amount });
      if (wetRef.current.ms >= DOUSE_MS) douse(i);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [douse, hitRadius, layout.windows, slots, state.phase]);

  /* ---- what happens after a flame goes out ---- */
  const finish = useCallback(() => {
    dispatch({ type: 'finish' });
    pressingRef.current = false;
    power.value = withTiming(0, { duration: 200 });
    sfx.stopLoop('water-spray');
    sfx.play('success');
    haptics.celebrate();
    session.progress(total, total);
    sfx.play('dog-bark');
    session.say('pepper', 'Woof woof!');
    session.say('rookie', 'Every flame is out! Great aim, rookie!');
    speech.say('Every flame is out! Great aim!', { speaker: 'rookie' });
    const t = setTimeout(() => session.complete(), 1200);
    return () => clearTimeout(t);
  }, [power, session, total]);

  const praiseStage = useCallback(() => {
    const f = challenge.fractionTargets?.[state.stage];
    const line = f ? `That's ${formatFraction(f)}! Now the next part.` : 'Nice work!';
    session.correct('fraction-beat');
    sfx.play('sparkle');
    haptics.success();
    session.say('beacon', line);
    speech.say(line, { speaker: 'beacon' });
    dispatch({ type: 'nextStage' });
    dispatch({ type: 'resume', pressing: pressingRef.current });
  }, [challenge.fractionTargets, session, state.stage]);

  useEffect(() => {
    if (state.phase !== 'flameOut') return;
    const remaining = total - state.outCount;
    session.progress(state.outCount, total);
    if (ageBand !== 'C' && remaining > 0) speech.say(String(remaining), { speaker: 'beacon' });
    const t = setTimeout(() => {
      if (state.outCount >= total) {
        finish();
        return;
      }
      if (challenge.askRemainingAt !== undefined && state.outCount >= challenge.askRemainingAt && !state.asked) {
        dispatch({ type: 'ask' });
        power.value = withTiming(0, { duration: 160 });
        sfx.stopLoop('water-spray');
        return;
      }
      if (hasStages && state.stageDone >= stageTarget && stageTarget > 0) {
        praiseStage();
        return;
      }
      dispatch({ type: 'resume', pressing: pressingRef.current });
    }, FLAME_OUT_BEAT_MS);
    return () => clearTimeout(t);
    // Deliberately keyed to the flame-out beat only: re-running this on every
    // unrelated change would restart (and so never fire) the beat timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.outCount]);

  /* ---- spray control ---- */
  const startSpray = useCallback(() => {
    if (state.phase !== 'aiming') return;
    pressingRef.current = true;
    idleRef.current = 0;
    dispatch({ type: 'press' });
    power.value = withTiming(1, { duration: 140 });
    sfx.startLoop('water-spray', 0.75);
    haptics.tap();
  }, [power, state.phase]);

  const stopSpray = useCallback(() => {
    pressingRef.current = false;
    dispatch({ type: 'release' });
    power.value = withTiming(0, { duration: 220 });
    sfx.stopLoop('water-spray');
  }, [power]);

  const setAimJS = useCallback((x: number, y: number) => {
    aimRef.current = { x, y };
  }, []);

  useEffect(
    () => () => {
      sfx.stopLoop('water-spray');
      speech.stop();
    },
    [],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin((e) => {
          aimX.value = e.x;
          aimY.value = e.y;
          lastSentX.value = e.x;
          lastSentY.value = e.y;
          runOnJS(setAimJS)(e.x, e.y);
          runOnJS(startSpray)();
        })
        .onUpdate((e) => {
          aimX.value = e.x;
          aimY.value = e.y;
          if (Math.abs(e.x - lastSentX.value) > 5 || Math.abs(e.y - lastSentY.value) > 5) {
            lastSentX.value = e.x;
            lastSentY.value = e.y;
            runOnJS(setAimJS)(e.x, e.y);
          }
        })
        .onFinalize(() => {
          runOnJS(stopSpray)();
        }),
    [aimX, aimY, lastSentX, lastSentY, setAimJS, startSpray, stopSpray],
  );

  /* ---- the mid-game subtraction beat ---- */
  const askCorrect = Math.max(0, total - state.outCount);
  const askOptions = useMemo(() => optionsFor(askCorrect, 2, 0, total + 2), [askCorrect, total]);
  const askText =
    ageBand === 'A' ? 'How many flames are still on?' : `${state.outCount} out. How many remain?`;

  const onAnswer = useCallback(
    (ok: boolean, value: number) => {
      if (ok) {
        session.correct(`remaining=${value}`);
        session.learnedWord('subtraction');
        const t = setTimeout(() => {
          dispatch({ type: 'answered' });
        }, 780);
        return () => clearTimeout(t);
      }
      session.incorrect(`remaining=${value}`);
      hints.miss({
        text: `${total} flames, ${state.outCount} are out. Count the ones still burning!`,
        es: `Cuenta las llamas encendidas.`,
      });
      return undefined;
    },
    [hints, session, state.outCount, total],
  );

  /* ---- render ---- */
  const litSlots = useMemo(
    () => slots.filter((_, i) => state.status[i] === 'burning'),
    [slots, state.status],
  );

  const ringTarget = hints.level > 0 && nextBurning ? windowFor(nextBurning.slot) : null;
  /** wetness only counts while the jet is actually on the flame */
  const liveWet = state.phase === 'spraying' ? wet : null;

  const hud =
    hasStages && currentFraction ? (
      <View style={styles.fractionHud}>
        <Text variant="h2" color={palette.navy}>
          {formatFraction(currentFraction)}
        </Text>
        <FractionBar width={Math.min(220, stage.s(200))} height={24} filled={toNumber(currentFraction)} segments={currentFraction.den} />
      </View>
    ) : null;

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      es={promptEs}
      compact={compact}
      hud={hud}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      onStageLayout={onLayout}
      backdrop={<Stage variant="street" groundHeight={110} />}
      footer={<CountStrip current={state.outCount} total={total} icon="flame" invert />}
      overlay={
        <>
        <SceneCrew
          side="right"
          size={64}
          showPepper
          mood={state.phase === 'done' ? 'cheer' : state.phase === 'flameOut' ? 'happy' : 'idle'}
        />
        <AskQuestion
          visible={state.phase === 'asking'}
          question={askText}
          es={ageBand === 'A' ? undefined : '¿Cuántas quedan?'}
          options={askOptions}
          correct={askCorrect}
          ageBand={ageBand}
          countGlyph="flame"
          assist={hints.assist}
          compact={compact}
          onAnswer={onAnswer}
        />
        </>
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          <BuildingFacade scene={challenge.scene} layout={layout} width={box.w} height={box.h} litSlots={litSlots} />

          {/* flames sit in their windows */}
          {slots.map((slot, i) => {
            const win = windowFor(slot);
            if (!win) return null;
            const st = state.status[i] ?? 'burning';
            return (
              <View
                key={`${slot}-${i}`}
                testID={`flame:${i}:${st}`}
                pointerEvents="none"
                style={[
                  styles.flameSlot,
                  { left: win.cx - flameSize / 2, top: win.y + win.h - flameSize * 1.4, width: flameSize, height: flameSize * 1.4 },
                ]}
              >
                <Flame size={flameSize} phase={i} state={st} wetness={liveWet && liveWet.slot === i ? liveWet.amount : 0} />
              </View>
            );
          })}

          <View style={[styles.hydrant, { left: box.w * 0.03, top: layout.groundY - stage.s(58) }]} pointerEvents="none">
            <Hydrant size={stage.s(58)} />
          </View>

          {/* water + hose (Skia) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <HoseRig
              width={box.w}
              height={box.h}
              nozzle={nozzle}
              aimX={aimX}
              aimY={aimY}
              power={power}
              clock={clock}
              scale={Math.max(0.75, Math.min(1.5, box.w / 390))}
              droplets={reduced ? 22 : 54}
            />
          </View>

          {ringTarget ? (
            <PulseRing x={ringTarget.cx} y={ringTarget.cy} size={Math.max(64, layout.u * 4.4)} visible={state.phase !== 'asking'} />
          ) : null}

          {/* aim + hold surface */}
          <GestureDetector gesture={gesture}>
            <Animated.View style={StyleSheet.absoluteFill} accessibilityLabel="Aim the hose and hold to spray" />
          </GestureDetector>
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  flameSlot: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  hydrant: { position: 'absolute' },
  fractionHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
});
