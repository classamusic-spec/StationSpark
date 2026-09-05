import React, { useCallback, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Button, CheckIcon, Text } from '@/ui';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { ClockFace } from '../shared/art/Props';

const clockLabel = (totalMinutes: number) => {
  const norm = ((Math.round(totalMinutes) % 720) + 720) % 720;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h === 0 ? 12 : h}:${String(m).padStart(2, '0')}`;
};

interface State {
  /** minutes moved from the start time (can be negative while exploring) */
  delta: number;
  misses: number;
  solved: boolean;
}

type Action = { type: 'SET'; delta: number } | { type: 'MISS' } | { type: 'SOLVE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET':
      return { ...state, delta: action.delta };
    case 'MISS':
      return { ...state, misses: state.misses + 1 };
    case 'SOLVE':
      return { ...state, solved: true };
    default:
      return state;
  }
}

export function ClockWatch({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'clock-watch'>) {
  const session = useMiniGameSession('clock-watch', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { delta: 0, misses: 0, solved: false });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const done = useRef(false);

  const startTotal = challenge.start.h * 60 + challenge.start.m;
  const targetTotal = challenge.target.h * 60 + challenge.target.m;
  const current = startTotal + state.delta;
  const answerDelta = (((targetTotal - startTotal) % 720) + 720) % 720;
  const moved = ((state.delta % 720) + 720) % 720;
  const matches = ((current % 720) + 720) % 720 === ((targetTotal % 720) + 720) % 720;

  const size = Math.min(layout.boxWidth - spacing.lg * 2, layout.s(268));
  const centre = size / 2;

  const minuteAngle = useSharedValue((startTotal % 60) * 6);
  const hourAngle = useSharedValue((startTotal / 60) * 30);
  const wobble = useSharedValue(0);
  const lastSnapped = useSharedValue((startTotal % 60 + 60) % 60);

  useBeaconLine(`${challenge.event.replace(/\.$/, '')}. Move the long hand to show ${clockLabel(targetTotal)}.`, session.say);

  const applyDelta = useCallback(
    (nextDelta: number) => {
      dispatch({ type: 'SET', delta: nextDelta });
      const total = startTotal + nextDelta;
      minuteAngle.value = withTiming((total % 60) * 6 + Math.floor(total / 60) * 360, { duration: 140 });
      hourAngle.value = withTiming((total / 60) * 30, { duration: 160 });
      sfx.play('ticktock');
      haptics.select();
    },
    [hourAngle, minuteAngle, startTotal],
  );

  /** From a snapped minute-of-hour, move by the shortest path (handles the 12 o'clock wrap). */
  const setMinuteOfHour = useCallback(
    (minute: number) => {
      const total = startTotal + state.delta;
      const currentMinute = ((total % 60) + 60) % 60;
      let diff = minute - currentMinute;
      if (diff > 30) diff -= 60;
      if (diff < -30) diff += 60;
      if (diff === 0) return;
      applyDelta(state.delta + diff);
    },
    [applyDelta, startTotal, state.delta],
  );

  const step = challenge.step;
  const drag = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!state.solved)
        .minDistance(2)
        .onUpdate((e) => {
          const dx = e.x - centre;
          const dy = e.y - centre;
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
          if (deg < 0) deg += 360;
          const snapped = (Math.round(deg / 6 / step) * step) % 60;
          if (snapped !== lastSnapped.value) {
            lastSnapped.value = snapped;
            runOnJS(setMinuteOfHour)(snapped);
          }
        }),
    [centre, lastSnapped, setMinuteOfHour, state.solved, step],
  );

  const nudgeBy = useCallback(
    (dir: 1 | -1) => {
      const next = state.delta + dir * step;
      lastSnapped.value = (((startTotal + next) % 60) + 60) % 60;
      applyDelta(next);
    },
    [applyDelta, lastSnapped, startTotal, state.delta, step],
  );

  const check = useCallback(() => {
    if (state.solved) return;
    if (matches) {
      dispatch({ type: 'SOLVE' });
      session.correct(clockLabel(targetTotal));
      sfx.play('correct');
      haptics.celebrate();
      if (!done.current) {
        done.current = true;
        setTimeout(() => {
          sfx.play('success');
          session.complete();
        }, 900);
      }
    } else {
      dispatch({ type: 'MISS' });
      session.incorrect(clockLabel(current));
      wobble.value = withSequence(withTiming(-5, { duration: 60 }), withTiming(5, { duration: 60 }), withSpring(0, springs.pop));
      sfx.play('wrong-soft');
      haptics.nudge();
    }
  }, [current, matches, session, state.solved, targetTotal, wobble]);

  const minuteStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${minuteAngle.value}deg` }],
  }));
  const hourStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${hourAngle.value}deg` }] }));
  const dialStyle = useAnimatedStyle(() => ({ transform: [{ translateX: wobble.value }] }));
  const ghostAngle = useDerivedValue(() => (targetTotal % 60) * 6);
  const ghostStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ghostAngle.value}deg` }] }));

  const handWidth = Math.max(8, size * 0.045);
  const minuteLen = size * 0.38;
  const hourLen = size * 0.26;

  const hintText = `${challenge.event.replace(/\.$/, '')} — that is ${clockLabel(targetTotal)}. Move the long hand ${answerDelta} minutes forward.`;

  return (
    <GameFrame
      title={clockLabel(targetTotal) === clockLabel(current) ? 'That looks right!' : 'Set the Clock'}
      subtitle={ageBand === 'A' ? undefined : 'Drag the long hand around the dial.'}
      compact={compact}
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.tray}>
          <View style={styles.readout}>
            <Text variant="h3" center>
              {clockLabel(startTotal)} → {clockLabel(targetTotal)}
            </Text>
            <Text variant="small" color={palette.navySoft} center>
              you moved {moved} minutes {moved === answerDelta ? '✓' : ''}
            </Text>
          </View>
          <View style={styles.controls}>
            <Button label={`−${step}`} tone="white" size="md" onPress={() => nudgeBy(-1)} disabled={state.solved} />
            <Button
              label="Done"
              tone="green"
              size="md"
              icon={<CheckIcon size={22} />}
              onPress={check}
              disabled={state.solved}
            />
            <Button label={`+${step}`} tone="white" size="md" onPress={() => nudgeBy(1)} disabled={state.solved} />
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        <View style={styles.eventCard}>
          <Text variant="bodyStrong" center>
            {challenge.event}
          </Text>
        </View>

        <GestureDetector gesture={drag}>
          <Animated.View style={[{ width: size, height: size }, dialStyle]} collapsable={false}>
            <ClockFace size={size} />

            {Array.from({ length: 12 }, (_, i) => {
              const a = ((i + 1) * Math.PI) / 6;
              const r = size * 0.335;
              return (
                <Text
                  key={i}
                  variant="h3"
                  style={[
                    styles.numeral,
                    {
                      left: centre + Math.sin(a) * r - size * 0.06,
                      top: centre - Math.cos(a) * r - size * 0.06,
                      width: size * 0.12,
                      fontSize: size * 0.1,
                      lineHeight: size * 0.12,
                    },
                  ]}
                  center
                >
                  {i + 1}
                </Text>
              );
            })}

            {hintLadder.highlight && !state.solved ? (
              <Animated.View style={[StyleSheet.absoluteFill, ghostStyle]} pointerEvents="none">
                <View
                  style={[
                    styles.hand,
                    {
                      left: centre - handWidth / 2,
                      top: centre - minuteLen,
                      width: handWidth,
                      height: minuteLen,
                      backgroundColor: palette.safetyYellow,
                      opacity: 0.6,
                    },
                  ]}
                />
              </Animated.View>
            ) : null}

            <Animated.View style={[StyleSheet.absoluteFill, hourStyle]} pointerEvents="none">
              <View
                style={[
                  styles.hand,
                  {
                    left: centre - handWidth * 0.65,
                    top: centre - hourLen,
                    width: handWidth * 1.3,
                    height: hourLen,
                    backgroundColor: palette.navy,
                  },
                ]}
              />
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, minuteStyle]} pointerEvents="none">
              <View
                style={[
                  styles.hand,
                  {
                    left: centre - handWidth / 2,
                    top: centre - minuteLen,
                    width: handWidth,
                    height: minuteLen,
                    backgroundColor: palette.engineRed,
                  },
                ]}
              />
            </Animated.View>

            <View
              style={[
                styles.cap,
                { left: centre - handWidth, top: centre - handWidth, width: handWidth * 2, height: handWidth * 2, borderRadius: handWidth },
              ]}
              pointerEvents="none"
            />
          </Animated.View>
        </GestureDetector>

        <View style={styles.bigTime}>
          <Text variant="h1" center>
            {clockLabel(current)}
          </Text>
        </View>

        {state.solved ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              Right on time!
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  eventCard: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 420,
    ...shadows.soft,
  },
  numeral: { position: 'absolute', textAlign: 'center' },
  hand: { position: 'absolute', borderRadius: 8 },
  cap: { position: 'absolute', backgroundColor: palette.gold, borderWidth: 3, borderColor: palette.white },
  bigTime: {
    backgroundColor: palette.cream,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    minWidth: 120,
    ...shadows.soft,
  },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  tray: { gap: spacing.sm },
  readout: { alignItems: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, minHeight: hit.min },
});
