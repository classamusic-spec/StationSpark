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
import { hit, palette, radii, roles, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Button, CheckIcon, GlyphIcon, Text, useSideRail } from '@/ui';

import { Animal } from '@/world/props';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useCaptainLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { ClockFace } from '../shared/art/Props';
import { ClockTower, RoomWash, clamp, usePlayBox } from '../shared/art/Scene';

const clockLabel = (totalMinutes: number) => {
  const norm = ((Math.round(totalMinutes) % 720) + 720) % 720;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h === 0 ? 12 : h}:${String(m).padStart(2, '0')}`;
};

/** Generated events read "the school fair opens" — a headline starts upper case. */
const sentence = (s: string) => {
  const trimmed = s.replace(/\.$/, '').trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

interface State {
  /** minutes moved from the start time (can be negative while exploring) */
  delta: number;
  misses: number;
  solved: boolean;
  /** the answer was checked and was not there yet — cleared as soon as it moves */
  offBy: boolean;
}

type Action = { type: 'SET'; delta: number } | { type: 'MISS' } | { type: 'SOLVE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET':
      return { ...state, delta: action.delta, offBy: false };
    case 'MISS':
      return { ...state, misses: state.misses + 1, offBy: true };
    case 'SOLVE':
      return { ...state, solved: true };
    default:
      return state;
  }
}

export function ClockWatch({ challenge, onComplete, onEvent, compact }: MiniGameProps<'clock-watch'>) {
  const session = useMiniGameSession('clock-watch', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { delta: 0, misses: 0, solved: false, offBy: false });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const done = useRef(false);

  const startTotal = challenge.start.h * 60 + challenge.start.m;
  const targetTotal = challenge.target.h * 60 + challenge.target.m;
  const current = startTotal + state.delta;
  const answerDelta = (((targetTotal - startTotal) % 720) + 720) % 720;
  const moved = ((state.delta % 720) + 720) % 720;
  const matches = ((current % 720) + 720) % 720 === ((targetTotal % 720) + 720) % 720;

  const headline = sentence(challenge.event);

  /*
   * THE CLOCK IS THE ACTIVITY, AND IT IS SET INTO A TOWER.
   *
   * The play area measures itself, the dial takes the room the chrome does not
   * need (capped, so a tablet gets a bigger tower rather than one absurd dial),
   * and the tower's stone housing, corbelled ledge and louvres are drawn around
   * the dial's real centre — so the clock is part of a building instead of a
   * disc floating in sky.
   */
  const sideRail = useSideRail();
  const { box, onLayout } = usePlayBox();

  /* the bubble stands on the tower below the dial, so it never covers the face */
  const available = box.h;
  const size =
    available > 0
      ? clamp(Math.min(box.w * 0.8, available * 0.58), 176, sideRail ? 470 : 400)
      : Math.max(200, Math.min(layout.boxWidth - spacing.md * 2, layout.s(300)));
  const centre = size / 2;
  const dialCx = box.w > 0 ? box.w / 2 : size / 2;
  const dialTop = available > 0 ? available * 0.1 : 0;
  const dialCy = dialTop + size / 2;
  const ledgeY = dialCy + size * 0.58;

  const minuteAngle = useSharedValue((startTotal % 60) * 6);
  const hourAngle = useSharedValue((startTotal / 60) * 30);
  const wobble = useSharedValue(0);
  const lastSnapped = useSharedValue((startTotal % 60 + 60) % 60);

  const call = `${headline} at ${clockLabel(targetTotal)}. Move the long hand to show ${clockLabel(targetTotal)}.`;
  useCaptainLine(call, session.say);

  const replay = useCallback(() => {
    sfx.play('tap-soft');
    haptics.tap();
    speech.say(call, { speaker: 'bea' });
  }, [call]);

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

  const hintText = `${headline} — that is ${clockLabel(targetTotal)}. Move the long hand ${answerDelta} minutes forward.`;

  /* One status line, never colour alone: it always carries words, and a mark. */
  const status = state.solved
    ? { text: 'Right on time!', tone: roles.state.successFill, ink: palette.leafGreenDark, glyph: 'check' }
    : state.offBy
      ? { text: `Not there yet — keep moving the long hand`, tone: roles.state.retryFill, ink: palette.orangeDark, glyph: undefined }
      : moved === answerDelta && moved > 0
        ? { text: `Moved ${moved} minutes — press Done`, tone: roles.state.successFill, ink: palette.leafGreenDark, glyph: 'check' }
        : { text: `Moved ${moved} minutes`, tone: roles.surface.sunken, ink: roles.ink.secondary, glyph: undefined };

  return (
    <GameFrame
      title="Set the Clock"
      subtitle="Drag the hand, or tap − and +."
      compact={compact}
      onReplay={replay}
      backdrop={<RoomWash top="#7BC6FA" bottom="#CDEAFF" />}
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.tray}>
          {/*
           * ONE readout. The event, the time it starts from, the time it has to
           * reach and how far the child has turned the hand used to be four
           * separate scraps scattered around the dial; they are one card now,
           * directly above the buttons that change them.
           */}
          <View style={styles.readout}>
            <Text variant="bodyStrong" center numberOfLines={2}>
              {headline}
            </Text>
            <View style={styles.times}>
              <View style={styles.timeBox}>
                <Text variant="tiny" color={roles.ink.muted}>
                  NOW
                </Text>
                <Text variant="h2" center>
                  {clockLabel(current)}
                </Text>
              </View>
              <Text variant="h2" color={roles.ink.muted}>
                →
              </Text>
              <View style={[styles.timeBox, styles.timeTarget]}>
                <Text variant="tiny" color={palette.goldDark}>
                  NEEDS
                </Text>
                <Text variant="h2" center>
                  {clockLabel(targetTotal)}
                </Text>
              </View>
            </View>
            <View style={[styles.status, { backgroundColor: status.tone }]}>
              {status.glyph ? <GlyphIcon id={status.glyph} size={16} label="correct" /> : null}
              <Text variant="small" color={status.ink} center>
                {status.text}
              </Text>
            </View>
          </View>

          {/*
            − Done + in one row is 310 px of button, and a tablet's rail is
            288 px wide inside its padding: the two nudges were sliced in half
            down their outside edges. On the rail the nudges pair up and Done
            takes the row under them; a phone keeps the original single row,
            where Done sitting between − and + is the point.
          */}
          {sideRail ? (
            <View style={styles.controlsRail}>
              <View style={styles.nudgeRow}>
                <Button label={`−${step}`} tone="white" size="md" onPress={() => nudgeBy(-1)} disabled={state.solved} />
                <Button label={`+${step}`} tone="white" size="md" onPress={() => nudgeBy(1)} disabled={state.solved} />
              </View>
              <Button
                label="Done"
                tone="green"
                size="md"
                icon={<CheckIcon size={22} />}
                onPress={check}
                disabled={state.solved}
              />
            </View>
          ) : (
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
          )}
        </View>
      }
    >
      <View style={styles.stage} onLayout={onLayout}>
        {/* the tower the dial is set into — drawn around the dial's real centre */}
        <ClockTower box={box} cx={dialCx} cy={dialCy} r={size / 2} />

        <GestureDetector gesture={drag}>
          <Animated.View
            style={[styles.dial, { left: dialCx - size / 2, top: dialTop, width: size, height: size }, dialStyle]}
            collapsable={false}
          >
            <ClockFace size={size} />

            {/* BLOCKING DEFECT FIX: the numeral box was narrower than a
                two-digit numeral, so "10 / 11 / 12" wrapped onto a second line
                and read as doubled, overlapping digits. The box is now wide
                enough for two digits and is locked to a single line. */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = ((i + 1) * Math.PI) / 6;
              const r = size * 0.265;
              const boxW = size * 0.24;
              const boxH = size * 0.14;
              return (
                <Text
                  key={i}
                  variant="h3"
                  numberOfLines={1}
                  style={[
                    styles.numeral,
                    {
                      left: centre + Math.sin(a) * r - boxW / 2,
                      top: centre - Math.cos(a) * r - boxH / 2,
                      width: boxW,
                      height: boxH,
                      fontSize: size * 0.088,
                      lineHeight: boxH,
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

        {/* Luna sits on the drawn stone ledge under the dial */}
        <View
          style={[
            styles.luna,
            { left: dialCx + size * 0.3, top: ledgeY - Math.max(38, size * 0.22) + 2 },
          ]}
          pointerEvents="none"
        >
          <Animal id="kitten" size={Math.max(38, size * 0.22)} mood={state.solved ? 'happy' : 'help'} />
        </View>

        {state.solved ? (
          <Animated.View entering={FadeIn} style={[styles.banner, { top: ledgeY + 26 }]}>
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
  stage: { flex: 1, alignSelf: 'stretch' },
  dial: { position: 'absolute' },
  numeral: { position: 'absolute', textAlign: 'center' },
  luna: { position: 'absolute' },
  hand: { position: 'absolute', borderRadius: 8 },
  cap: { position: 'absolute', backgroundColor: palette.gold, borderWidth: 3, borderColor: palette.white },
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: roles.state.successFill,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  tray: { gap: spacing.sm },
  readout: { alignItems: 'center', gap: 6 },
  times: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  timeBox: {
    alignItems: 'center',
    minWidth: 96,
    backgroundColor: roles.surface.sunken,
    borderRadius: radii.tag,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  timeTarget: { backgroundColor: '#FFE9A8' },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    minHeight: 26,
  },
  /* wrap is the safety net: if a label ever grows (a three-digit step, a
     translated "Done"), the row folds instead of slicing a button in half */
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, minHeight: hit.min, flexWrap: 'wrap' },
  controlsRail: { alignItems: 'center', gap: spacing.sm },
  nudgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
