import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { Button, Chip, Text, Tray, TrayRow } from '@/ui';
import { CheckIcon, ResetIcon } from '@/ui/icons';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { formatFraction, speakFraction, toNumber } from '@/utils/fractions';
import { FractionBar, PumpLever, TankShell, WaterSurface } from '@/world/props';
import { GameShell, clampNum, useClock, useHintLadder, useMeasuredBox, useSpokenPrompt, useStage } from '../shared';

/* ------------------------------------------------------------------ */
/* State machine: filling → confirming → (wrong → filling) | done       */
/* ------------------------------------------------------------------ */

type Phase = 'filling' | 'confirming' | 'wrong' | 'done';

interface State {
  phase: Phase;
  pumps: number;
  /** Beacon has already warned about going over on this fill */
  warned: boolean;
}

type Action =
  | { type: 'pump'; max: number }
  | { type: 'drain' }
  | { type: 'warn' }
  | { type: 'confirm' }
  | { type: 'wrong' }
  | { type: 'back' }
  | { type: 'done' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'pump':
      if (state.phase !== 'filling') return state;
      return { ...state, pumps: Math.min(action.max, state.pumps + 1) };
    case 'drain':
      return { ...state, pumps: 0, warned: false, phase: 'filling' };
    case 'warn':
      return state.warned ? state : { ...state, warned: true };
    case 'confirm':
      return { ...state, phase: 'confirming' };
    case 'wrong':
      return { ...state, phase: 'wrong' };
    case 'back':
      return { ...state, phase: 'filling' };
    case 'done':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

export function WaterTank({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'water-tank'>) {
  const session = useMiniGameSession('water-tank', onComplete, onEvent);
  const stage = useStage(compact);
  const hints = useHintLadder(session.hint);
  const { box, ready, onLayout } = useMeasuredBox();

  const step = challenge.pumpStep;
  const target = challenge.target;
  const stepValue = Math.max(0.01, toNumber(step));
  const targetValue = clampNum(toNumber(target), 0, 1);
  /** exact integer maths so 3 × ¼ is exactly ¾ */
  const targetPumps = Math.round(targetValue / stepValue);
  const fullPumps = Math.max(targetPumps, Math.round(1 / stepValue));
  const maxPumps = challenge.allowOverflow ? fullPumps + 2 : fullPumps;

  const [state, dispatch] = useReducer(reducer, { phase: 'filling', pumps: 0, warned: false });

  const level = useSharedValue(0);
  const slosh = useSharedValue(0);
  const leverPress = useSharedValue(0);
  const shake = useSharedValue(0);
  const clock = useClock(true);

  const currentValue = state.pumps * stepValue;
  const isExact = state.pumps === targetPumps;

  /* ---- prompt ---- */
  const prompt = ageBand === 'A' ? `Fill to ${formatFraction(target)}!` : `Fill the tank to ${formatFraction(target)}`;
  const subtitle = compact ? undefined : 'Pump the lever, then press Ready!';
  useSpokenPrompt(`Fill the tank to ${speakFraction(target)}`, { speaker: 'beacon' });

  /* ---- water animation ---- */
  useEffect(() => {
    level.value = withSpring(Math.min(1.06, currentValue), springs.gentle);
  }, [currentValue, level]);

  const pump = useCallback(() => {
    if (state.phase !== 'filling') return;
    if (state.pumps >= maxPumps) {
      slosh.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 700 }));
      sfx.play('splash', { volume: 0.6 });
      haptics.nudge();
      if (!state.warned) {
        dispatch({ type: 'warn' });
        hints.nudge({
          text: `The tank is full! Press Empty and try for ${formatFraction(target)}.`,
          es: '¡El tanque está lleno!',
        });
      }
      return;
    }
    dispatch({ type: 'pump', max: maxPumps });
    sfx.play('pour');
    haptics.drop();
    slosh.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 950 }));
  }, [hints, maxPumps, slosh, state.phase, state.pumps, state.warned, target]);

  /* ---- Beacon warns as soon as the child goes past the target ---- */
  useEffect(() => {
    if (challenge.allowOverflow || state.warned) return;
    if (state.pumps > targetPumps) {
      dispatch({ type: 'warn' });
      hints.nudge({
        text: `That's more than ${formatFraction(target)}! Press Empty to start again.`,
        es: `¡Eso es más de ${formatFraction(target)}!`,
      });
    }
  }, [challenge.allowOverflow, hints, state.pumps, state.warned, target, targetPumps]);

  const drain = useCallback(() => {
    dispatch({ type: 'drain' });
    sfx.play('splash');
    haptics.tap();
    slosh.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 900 }));
  }, [slosh]);

  const confirm = useCallback(() => {
    if (state.phase !== 'filling') return;
    dispatch({ type: 'confirm' });
    if (isExact) {
      session.correct(`${state.pumps}/${targetPumps}`);
      sfx.play('correct');
      haptics.success();
      const line = `${speakFraction(target)}. Tank ready!`;
      session.say('beacon', line);
      speech.say(line, { speaker: 'beacon' });
      session.progress(1, 1);
      dispatch({ type: 'done' });
      setTimeout(() => {
        sfx.play('success');
        session.complete();
      }, 900);
      return;
    }
    session.incorrect(`${state.pumps}/${targetPumps}`);
    sfx.play('wrong-soft');
    slosh.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 800 }));
    shake.value = withSequence(
      withTiming(-6, { duration: 55 }),
      withTiming(6, { duration: 55 }),
      withTiming(-5, { duration: 55 }),
      withTiming(4, { duration: 55 }),
      withTiming(0, { duration: 60 }),
    );
    const more = targetPumps - state.pumps;
    hints.miss({
      text:
        more > 0
          ? `Not quite — pump ${more} more time${more === 1 ? '' : 's'} to reach ${formatFraction(target)}.`
          : `That's too much. Press Empty, then stop at ${formatFraction(target)}.`,
      es: `Busca la bandera verde de ${formatFraction(target)}.`,
    });
    dispatch({ type: 'wrong' });
    setTimeout(() => dispatch({ type: 'back' }), 620);
  }, [hints, isExact, session, shake, slosh, state.phase, state.pumps, target, targetPumps]);

  /* ---- lever drag ---- */
  const leverGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(2)
        .onUpdate((e) => {
          leverPress.value = Math.max(0, Math.min(1, e.translationY / 56));
        })
        .onEnd((e) => {
          if (e.translationY > 34) runOnJS(pump)();
        })
        .onFinalize(() => {
          leverPress.value = withSpring(0, springs.pop);
        }),
    [leverPress, pump],
  );

  const leverStyle = useAnimatedStyle(() => ({ transform: [{ translateY: leverPress.value * 34 }] }));

  /* ---- geometry ---- */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const tankW = Math.min(w * 0.44, stage.s(190));
    const tankH = Math.min(h * 0.9, stage.s(330));
    const tankX = w * 0.56 - tankW / 2 + w * 0.06;
    const tankY = (h - tankH) / 2;
    const inset = Math.max(6, tankW * 0.05);
    const leverW = Math.min(w * 0.3, stage.s(112));
    return {
      tank: { x: Math.min(tankX, w - tankW - 8), y: tankY, w: tankW, h: tankH },
      inner: { w: tankW - inset * 2, h: tankH - inset * 2, inset },
      lever: { x: Math.max(8, w * 0.06), y: tankY + tankH * 0.28, w: leverW, h: leverW * 1.3 },
    };
  }, [box.h, box.w, stage]);

  const tickList = useMemo(
    () => Array.from({ length: challenge.ticks - 1 }, (_, i) => (i + 1) / challenge.ticks),
    [challenge.ticks],
  );

  const tankStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      es={`Llena el tanque hasta ${formatFraction(target)}`}
      compact={compact}
      onStageLayout={onLayout}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      hud={
        <View style={styles.hud}>
          <Text variant="h2">{formatFraction(target)}</Text>
          <FractionBar width={Math.min(210, stage.s(190))} height={22} filled={targetValue} segments={target.den} />
          {hints.assist && targetPumps - state.pumps > 0 ? (
            <Chip label={`Pump ${targetPumps - state.pumps} more`} tone="yellow" />
          ) : ageBand !== 'A' ? (
            <Chip label={`${state.pumps} pump${state.pumps === 1 ? '' : 's'}`} tone="cream" />
          ) : null}
        </View>
      }
      tray={
        <Tray>
          <TrayRow>
            <Button
              label="Empty"
              tone="white"
              size="md"
              icon={<ResetIcon size={22} />}
              onPress={drain}
              sound="tap-soft"
              accessibilityLabel="Empty the tank"
            />
            <Button label="Pump" tone="blue" size="lg" onPress={pump} sound="none" accessibilityLabel="Pump water" />
            <Button
              label="Ready!"
              tone="green"
              size="lg"
              icon={<CheckIcon size={24} />}
              onPress={confirm}
              disabled={state.phase === 'done'}
              accessibilityLabel="I am ready"
            />
          </TrayRow>
        </Tray>
      }
      footer={
        ageBand === 'C' ? (
          <View style={styles.mathRow}>
            <Text variant="bodyStrong" color={palette.navySoft}>
              {state.pumps} × {formatFraction(step)} = {formatFraction({ num: step.num * state.pumps, den: step.den })}
            </Text>
          </View>
        ) : null
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          {/* pump lever */}
          <GestureDetector gesture={leverGesture}>
            <Animated.View
              style={[styles.lever, { left: geo.lever.x, top: geo.lever.y, width: geo.lever.w, height: geo.lever.h }, leverStyle]}
              accessibilityLabel="Pump lever — drag down"
            >
              <PumpLever width={geo.lever.w} height={geo.lever.h} />
            </Animated.View>
          </GestureDetector>
          <View style={[styles.pipe, { left: geo.lever.x + geo.lever.w * 0.42, top: geo.lever.y + geo.lever.h * 0.86, width: Math.max(10, geo.tank.x - geo.lever.x - geo.lever.w * 0.3) }]} />

          {/* tank */}
          <Animated.View style={[styles.tank, { left: geo.tank.x, top: geo.tank.y, width: geo.tank.w, height: geo.tank.h }, tankStyle]}>
            <View style={[styles.tankInner, { margin: geo.inner.inset, borderRadius: radii.card }]}>
              <WaterSurface width={geo.inner.w} height={geo.inner.h} level={level} slosh={slosh} clock={clock} radius={radii.card} />
            </View>
            <TankShell
              width={geo.tank.w}
              height={geo.tank.h}
              radius={radii.card + 6}
              ticks={tickList}
              targetAt={targetValue}
              highlightTarget={hints.assist || state.phase === 'wrong'}
            />
            {/* tick labels */}
            {tickList.map((f, i) => (
              <View key={i} style={[styles.tickLabel, { top: geo.tank.h - f * geo.tank.h - 13, left: geo.tank.w * 0.4 }]}>
                <Text variant="tiny" color={palette.navy}>
                  {formatFraction({ num: i + 1, den: challenge.ticks })}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
  lever: { position: 'absolute', alignItems: 'center' },
  pipe: { position: 'absolute', height: 14, backgroundColor: palette.slate, borderRadius: 7 },
  tank: { position: 'absolute', ...shadows.card },
  tankInner: { position: 'absolute', left: 0, top: 0, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.35)' },
  tickLabel: {
    position: 'absolute',
    minWidth: 30,
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.tag,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mathRow: { backgroundColor: palette.white, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill },
});
