/**
 * TRUCK RUN — the driving station.
 *
 * The truck drives itself down the practice road; the child steers between
 * three lanes, dodges cones, potholes and puddles, hits ramps and boost pads —
 * and answers Captain Bea's question by driving through one of three gates.
 * The learning IS the steering: there is no quiz card, and the driving never
 * stops for one.
 *
 * This file owns none of the rules. `run.ts` is the game; this is the part that
 * listens to it and turns it into motion, sound, haptics, hints and stars.
 * See docs/DRIVING_GAME.md.
 */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import type { TruckRunProp } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { truckRunSkills } from '@/learning/generators/truck-run';
import { hit, palette, radii, roles, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useReducedMotion } from '@/hooks';
import { useGame } from '@/state/store';
import { selectTruck } from '@/state/selectors';
import { Tray } from '@/ui';

import { GameShell, useHintLadder, useMeasuredBox, useSpokenPrompt } from '../shared';
import { GateLabels } from './GateLabels';
import { RoadScene } from './RoadScene';
import { advance, createRun, questionAt, runFrame, runSummary, steerBy, type RunEvent, type RunFrame } from './run';

/** How far a finger travels, as a share of the road's width, to change lane. */
const DRAG_LANE = 1 / 7;
/** The arrival beat before the result is reported. */
const ARRIVAL_MS = 1500;

const PRAISE = ['That is the one!', 'Great gate!', 'Nice driving!', 'Straight through!'];

/* ------------------------------------------------------------------ */
/* Steering pads — the always-visible path, on top of drag and tap      */
/* ------------------------------------------------------------------ */

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  const d =
    dir === 'left'
      ? 'M20 6 L10 16 L20 26 L23.5 22.5 L17 16 L23.5 9.5 Z'
      : 'M12 6 L22 16 L12 26 L8.5 22.5 L15 16 L8.5 9.5 Z';
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Path d={d} fill={palette.navy} />
    </Svg>
  );
}

const SteerPad = memo(function SteerPad({ dir, onSteer }: { dir: 'left' | 'right'; onSteer: (delta: number) => void }) {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: press.value * 4 }, { scale: 1 - press.value * 0.02 }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir === 'left' ? 'Steer left' : 'Steer right'}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 140 });
      }}
      onPress={() => onSteer(dir === 'left' ? -1 : 1)}
      style={styles.padHit}
      hitSlop={8}
    >
      <View style={styles.padEdge}>
        <Animated.View style={[styles.padFace, style]}>
          <Chevron dir={dir} />
        </Animated.View>
      </View>
    </Pressable>
  );
});

/** A wordless speedometer: how fast the truck is going, and whether it is boosting. */
const SpeedBar = memo(function SpeedBar({ pace, boost }: { pace: number; boost: number }) {
  return (
    <View style={styles.speed} accessibilityLabel="Speed">
      <View style={styles.speedTrack}>
        <View
          style={[
            styles.speedFill,
            {
              width: `${Math.round(Math.max(0.06, pace) * 100)}%`,
              backgroundColor: boost > 0.05 ? palette.waterCyan : palette.leafGreen,
            },
          ]}
        />
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ */

export function TruckRun({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'truck-run'>) {
  const session = useMiniGameSession('truck-run', onComplete, onEvent);
  const hints = useHintLadder(session.hint);
  const reduced = useReducedMotion();
  const truck = useGame(selectTruck);
  const { box, ready, onLayout } = useMeasuredBox();

  const run = useRef(createRun(challenge));
  const [frame, setFrame] = useState<RunFrame>(() => runFrame(run.current, challenge));
  const [arrived, setArrived] = useState(false);

  /* the frame loop is not React: what it needs, it reads from a ref */
  const assistRef = useRef(false);
  assistRef.current = hints.assist;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const coached = useRef(false);
  const running = useRef(true);

  const shake = useSharedValue(0);
  /** 0 when the child asked for less motion: the jolt keeps its dip, loses its shake */
  const wobble = useSharedValue(reduced ? 0 : 1);
  const dragAnchor = useSharedValue(0);

  const question = challenge.questions[frame.questionIndex];
  const prompt = question?.prompt ?? 'Drive to the gates!';

  /* ---- feedback: where a rule becomes a sound --------------------- */

  const bumpSound = useCallback((prop: TruckRunProp) => {
    if (prop === 'cone') sfx.play('clank', { volume: 0.7 });
    else if (prop === 'puddle') sfx.play('splash', { volume: 0.8 });
    else sfx.play('bump');
  }, []);

  const jolt = useCallback(() => {
    /* reduced motion keeps the information (something happened) and drops the shake */
    shake.value = reducedRef.current
      ? withSequence(withTiming(0.3, { duration: 90 }), withTiming(0, { duration: 170 }))
      : withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 300 }));
  }, [shake]);

  const finish = useCallback(() => {
    running.current = false;
    sfx.stopLoop('engine');
    sfx.play('fanfare');
    haptics.celebrate();
    setArrived(true);
    const summary = runSummary(run.current, challenge);
    session.say(
      'bea',
      summary.perfect
        ? 'Every gate first time — what a drive!'
        : summary.clean
          ? 'Smooth driving, rookie. You made it!'
          : 'You made it! Every gate open.',
    );
  }, [challenge, session]);

  const handle = useCallback(
    (events: RunEvent[]) => {
      for (const event of events) {
        switch (event.type) {
          case 'bump': {
            bumpSound(event.prop);
            haptics.thud();
            jolt();
            /* a messy drive is coached, never punished — and coaching is a hint,
               which is what makes clean driving worth a star (docs/DRIVING_GAME.md) */
            if (!coached.current && run.current.bumps > challenge.bumpBudget) {
              coached.current = true;
              hints.nudge({
                text: 'Look further down the road and move early — the lanes are wide!',
                es: 'Mira más adelante y cámbiate de carril antes.',
              });
            }
            break;
          }
          case 'boost':
            sfx.play('boost');
            sfx.play('siren', { volume: 0.4 });
            haptics.select();
            break;
          case 'ramp':
            sfx.play('whoosh');
            haptics.tap();
            break;
          case 'land':
            sfx.play('drop', { volume: 0.7 });
            haptics.thud();
            break;
          case 'gate': {
            const asked = questionAt(challenge, run.current);
            if (event.correct) {
              session.correct(event.label);
              session.progress(run.current.answered, challenge.questions.length);
              sfx.play('correct');
              sfx.play('sparkle', { volume: 0.6 });
              haptics.success();
              if (run.current.finishAt === null) {
                session.say('bea', PRAISE[run.current.answered % PRAISE.length] ?? 'Yes!');
              }
            } else {
              session.incorrect(event.label);
              sfx.play('wrong-soft');
              haptics.nudge();
              jolt();
              hints.miss(asked ? { text: asked.hint, es: asked.hintEs } : undefined);
            }
            break;
          }
          case 'finish':
            finish();
            break;
        }
      }
    },
    [bumpSound, challenge, finish, hints, jolt, session],
  );
  const handleRef = useRef(handle);
  handleRef.current = handle;

  /* ---- the loop: real frames in, fixed ticks out ------------------- */

  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : (now - last) / 1000;
      last = now;
      if (!running.current) return;
      const events = advance(run.current, challenge, dt);
      if (events.length > 0) handleRef.current(events);
      setFrame(runFrame(run.current, challenge, assistRef.current));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [challenge, ready]);

  /* the engine note under the whole drive */
  useEffect(() => {
    sfx.startLoop('engine', 0.3);
    return () => {
      running.current = false;
      sfx.stopLoop('engine');
      speech.stop();
    };
  }, []);

  /* the arrival beat, then the result */
  useEffect(() => {
    if (!arrived) return;
    const t = setTimeout(() => session.complete(truckRunSkills[challenge.topic]), ARRIVAL_MS);
    return () => clearTimeout(t);
  }, [arrived, challenge.topic, session]);

  useSpokenPrompt(arrived ? null : prompt, { speaker: 'bea' });

  /* ---- steering: drag anywhere, tap either side, or the pads ------- */

  const steer = useCallback((delta: number) => {
    if (!running.current) return;
    if (steerBy(run.current, delta)) {
      sfx.play('tap-soft', { volume: 0.55 });
      haptics.select();
    }
  }, []);

  const gesture = useMemo(() => {
    const step = Math.max(36, box.w * DRAG_LANE);
    const middle = box.w / 2;
    const pan = Gesture.Pan()
      .minDistance(8)
      .onBegin((e) => {
        dragAnchor.value = e.x;
      })
      .onUpdate((e) => {
        const dx = e.x - dragAnchor.value;
        if (dx > step) {
          dragAnchor.value += step;
          runOnJS(steer)(1);
        } else if (dx < -step) {
          dragAnchor.value -= step;
          runOnJS(steer)(-1);
        }
      });
    const tap = Gesture.Tap()
      .maxDuration(400)
      .onEnd((e) => {
        runOnJS(steer)(e.x < middle ? -1 : 1);
      });
    return Gesture.Race(pan, tap);
  }, [box.w, dragAnchor, steer]);

  /* ---- presentation ------------------------------------------------ */

  useEffect(() => {
    wobble.value = reduced ? 0 : 1;
  }, [reduced, wobble]);

  const shakeStyle = useAnimatedStyle(() => {
    const s = shake.value;
    return {
      transform: [{ translateX: Math.sin(s * 34) * 7 * s * wobble.value }, { translateY: s * 9 }],
    };
  });

  const sample = useCallback(() => runFrame(run.current, challenge, assistRef.current), [challenge]);

  const tray = useMemo(
    () => (
      <Tray tone="glass">
        <View style={styles.trayRow}>
          <SteerPad dir="left" onSteer={steer} />
          <SpeedBar pace={frame.pace} boost={frame.boost} />
          <SteerPad dir="right" onSteer={steer} />
        </View>
      </Tray>
    ),
    [frame.boost, frame.pace, steer],
  );

  const detail = ageBand === 'A' ? 'Swipe or tap left and right to steer.' : 'Steer into the gate with the answer.';
  const progress = useMemo(() => ({ done: frame.answered, total: frame.total }), [frame.answered, frame.total]);

  return (
    <GameShell
      prompt={prompt}
      subtitle={detail}
      es={question?.promptEs}
      compact={compact}
      progress={progress}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      onStageLayout={onLayout}
      tray={tray}
    >
      {/* the testID below is the QA hook (like the drag/slot testIDs the
          harness already uses): it publishes the live run, so tools/qa can work
          out which gate to drive through. */}
      {ready ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, shakeStyle]}
          testID={`truck-run:q${frame.questionIndex}:a${frame.attempt}:lane${frame.target}:${frame.answered}/${frame.total}`}
        >
          <RoadScene
            sample={sample}
            frame={frame}
            truck={truck}
            width={box.w}
            height={box.h}
            reduced={reduced}
            scene={challenge.scene}
          />
          <GateLabels frame={frame} width={box.w} height={box.h} />
          <GestureDetector gesture={gesture}>
            <Animated.View
              style={StyleSheet.absoluteFill}
              accessibilityLabel="The road. Swipe or tap left and right to change lane."
            />
          </GestureDetector>
        </Animated.View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  trayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  padHit: { flex: 1 },
  padEdge: { backgroundColor: palette.slateLight, borderRadius: radii.pill, height: hit.big + 6, ...shadows.card },
  padFace: {
    height: hit.big,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speed: { width: 96, alignItems: 'center' },
  speedTrack: { width: '100%', height: 14, borderRadius: 7, backgroundColor: roles.surface.sunken, overflow: 'hidden' },
  speedFill: { height: '100%', borderRadius: 7 },
});
