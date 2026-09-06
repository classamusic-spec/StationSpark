import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Fraction } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, roles, shadows, spacing, springs } from '@/theme';
import { add, compare, equals, formatFraction, speakFraction, subtract, toNumber } from '@/utils/fractions';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { ActivityFrame } from '@/ui/kit/ActivityFrame';
import { VocabIcon } from '@/ui/kit/VocabIcon';

import { Stage as SceneStage } from '@/world';

import { Stage, at } from '../../parts/Stage';
import { CookCTA } from '../../parts/SceneBits';
import { useRise, useSwing } from '../../parts/motion';
import { kitchenFeel, useCaptainHint, useSpokenTask, useTimers } from '../useKitchenGame';

const D = { w: 390, h: 400 };
const CUP = { x: 52, y: 44, w: 172, h: 300 };
const INNER = { x: CUP.x + 14, y: CUP.y + 26, w: CUP.w - 28, h: CUP.h - 46 };
/** the "1 cup" line sits here, leaving headroom above so you *can* overfill */
const SPAN = INNER.h * 0.8;
const JUG = { x: 246, y: 26, w: 118, h: 150 };
/** how often the flow is topped up while the jug is tipped */
const FLOW_TICK_MS = 120;
/**
 * Measures per second, from a barely-tipped jug to a fully upended one. Slow
 * enough that a child aiming for the ¾ line can stop on it: a full tilt still
 * takes about a second to fill a whole cup, and letting go stops it dead.
 */
const FLOW_SLOW = 1.2;
const FLOW_FAST = 2.6;
/** the jug rests here the moment it is picked up, before any tilting */
const TILT_REST = -22;
const TILT_MAX = -68;
/** past this the cup is overflowing and the jug closes itself */
const BRIM = 1.25;

/**
 * `tin` is the colour of the container the ingredient is *in*.
 * BLOCKING DEFECT FIX: sugar is white cubes and the tin was white too, so the
 * "azúcar" container was effectively invisible. Every pale ingredient now sits
 * in a tin with real value contrast behind it.
 */
const liquidLook: Record<string, { fill: string; foam: string; tin: string }> = {
  milk: { fill: '#FBF6EC', foam: '#FFFFFF', tin: '#9FC9E8' },
  water: { fill: '#7ED2F7', foam: '#BDECFF', tin: '#CFEFFF' },
  flour: { fill: '#F0DFBE', foam: '#FBEFD8', tin: '#D8C7A2' },
  sugar: { fill: '#FFF3D6', foam: '#FFFFFF', tin: '#8FB6DA' },
  butter: { fill: '#FFDE8A', foam: '#FFEFC0', tin: '#E5C371' },
  tomato: { fill: '#F2705F', foam: '#FF9C8E', tin: '#FFC7BE' },
};

export function MeasurePour({ challenge, onComplete, onEvent, compact }: MiniGameProps<'measure-pour'>) {
  const session = useMiniGameSession('measure-pour', onComplete, onEvent);
  const assist = useCaptainHint(session);
  const timers = useTimers();
  const reduced = useReducedMotion();

  const zero: Fraction = useMemo(() => ({ num: 0, den: 1 }), []);
  const [poured, setPoured] = useState<Fraction>(zero);
  const [pouring, setPouring] = useState(false);
  const [done, setDone] = useState(false);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const pourRef = useRef<Fraction>(zero);
  const flow = useRef(0);
  const doneRef = useRef(false);
  const saidWord = useRef(false);
  const warnedFull = useRef(false);

  const level = useSharedValue(0);
  const tilt = useSharedValue(0);
  const stream = useSharedValue(0);
  const tipped = useSharedValue(0);
  const wobble = useSharedValue(0);

  const target = challenge.target;
  const targetN = toNumber(target);
  const pouredN = toNumber(poured);
  const look = liquidLook[challenge.ingredient.id] ?? { fill: '#7ED2F7', foam: '#BDECFF', tin: '#CFEFFF' };
  const unitWord = challenge.unit === 'cup' ? 'cup' : 'spoon';

  const task = `Pour ${formatFraction(target)} ${unitWord}${targetN === 1 ? '' : 's'} of ${challenge.ingredient.en}`;
  const replay = useSpokenTask(
    `Pour ${speakFraction(target)} ${unitWord}${targetN === 1 ? '' : 's'} of ${challenge.ingredient.en}.`,
  );

  useEffect(() => {
    level.value = withSpring(Math.min(1.35, pouredN), springs.gentle);
  }, [level, pouredN]);

  const stopPour = useCallback(() => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    flow.current = 0;
    setPouring(false);
    tilt.value = withSpring(0, springs.gentle);
    stream.value = withTiming(0, { duration: 140 });
    tipped.value = withTiming(0, { duration: 200 });
  }, [stream, tilt, tipped]);

  useEffect(() => () => stopPour(), [stopPour]);

  /** One more measure out of the jug. Returns false when the cup is at the brim. */
  const addChunk = useCallback(() => {
    const next = add(pourRef.current, challenge.step);
    if (toNumber(next) > BRIM) {
      if (!warnedFull.current) {
        warnedFull.current = true;
        wobble.value = withSequence(
          withTiming(-5, { duration: 60 }),
          withTiming(5, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        );
        assist.cheer('The cup is full! Pour some back if you went past the line.');
        sfx.play('wrong-soft');
        haptics.nudge();
      }
      return false;
    }
    pourRef.current = next;
    setPoured(next);
    kitchenFeel.pour();
    return true;
  }, [assist, challenge.step, wobble]);

  /* ------------------------------------------------------------------ */
  /* Tilt the jug to pour                                                 */
  /* ------------------------------------------------------------------ */

  const beginPour = useCallback(() => {
    if (doneRef.current) return;
    setPouring(true);
    warnedFull.current = false;
    flow.current = 0;
    tilt.value = withSpring(TILT_REST, springs.gentle);
    tipped.value = withTiming(0, { duration: 120 });
    stream.value = withTiming(0.55, { duration: 120 });
    if (!saidWord.current) {
      saidWord.current = true;
      speech.sayWord(challenge.ingredient);
      session.learnedWord(challenge.ingredient.es);
    }
    addChunk();
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = setInterval(() => {
      const rate = FLOW_SLOW + (FLOW_FAST - FLOW_SLOW) * Math.max(0, Math.min(1, tipped.value));
      flow.current += (rate * FLOW_TICK_MS) / 1000;
      while (flow.current >= 1) {
        flow.current -= 1;
        if (!addChunk()) {
          flow.current = 0;
          return;
        }
      }
    }, FLOW_TICK_MS);
  }, [addChunk, challenge.ingredient, session, stream, tilt, tipped]);

  /**
   * TILT TO POUR. `tipped` is 0 when the jug is only just leaning and 1 when it
   * is fully upended; the drag writes it straight on the UI thread so the jug
   * and the stream track the hand with no lag, and the flow timer reads it to
   * decide how fast the liquid comes out.
   *
   * But *any* press already pours at a steady rate, so nobody has to discover
   * the tilt to finish the measure. That is the rule for every gesture in this
   * kitchen: it makes the job better, it never makes the job possible.
   */
  const jugGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin(() => {
          runOnJS(beginPour)();
        })
        .onUpdate((e) => {
          // pulling the jug down and towards the cup on the left tips it further
          const lean = Math.max(0, Math.min(1, (e.translationY + -e.translationX) / 130));
          tipped.value = lean;
          if (!reduced) tilt.value = TILT_REST + (TILT_MAX - TILT_REST) * lean;
          stream.value = 0.55 + lean * 0.45;
        })
        .onFinalize(() => {
          runOnJS(stopPour)();
        }),
    [beginPour, reduced, stopPour, stream, tilt, tipped],
  );

  const pourBack = useCallback(() => {
    if (doneRef.current) return;
    warnedFull.current = false;
    const next = subtract(pourRef.current, challenge.step);
    const clamped = toNumber(next) < 0 ? zero : next;
    pourRef.current = clamped;
    setPoured(clamped);
    sfx.play('drop');
    haptics.select();
  }, [challenge.step, zero]);

  const check = useCallback(() => {
    if (doneRef.current) return;
    const cmp = compare(pourRef.current, target);
    if (equals(pourRef.current, target)) {
      doneRef.current = true;
      setDone(true);
      stopPour();
      kitchenFeel.finish();
      assist.cheer(`${formatFraction(target)} ${unitWord} exactly. Perfect!`);
      session.correct('measure');
      timers.after(900, () => session.complete());
    } else if (cmp > 0) {
      assist.nudge('A bit too much — pour some back.');
    } else {
      assist.nudge(`Almost! Keep pouring up to the ${formatFraction(target)} line.`);
    }
  }, [assist, session, stopPour, target, timers, unitWord]);

  const showMe = useCallback(() => {
    assist.askedForHelp();
    pourRef.current = target;
    setPoured(target);
    kitchenFeel.pour();
  }, [assist, target]);

  /* ---- animated pieces ---- */
  /**
   * A jug nobody has touched rocks gently towards the cup: the gesture, shown
   * rather than written. It stops the instant a hand is on it, and stays still
   * for a child who asked for less motion.
   */
  const nudge = useSwing(1, 2400);
  const liquidStyle = useAnimatedStyle(() => ({ height: Math.max(0, level.value) * SPAN }));
  const jugStyle = useAnimatedStyle(() => {
    const resting = pouredN === 0 && !pouring && !reduced ? 1 : 0;
    return { transform: [{ rotate: `${tilt.value + nudge.value * 5 * resting}deg` }] };
  });
  const streamStyle = useAnimatedStyle(() => ({
    opacity: stream.value,
    transform: [{ scaleY: 0.5 + stream.value * 0.5 }, { scaleX: 0.7 + tipped.value * 0.6 }],
  }));
  const cupWobble = useAnimatedStyle(() => ({ transform: [{ translateX: wobble.value }] }));

  const ticks = Array.from({ length: challenge.ticks }, (_, i) => (i + 1) / challenge.ticks);
  const over = compare(poured, target) > 0;

  const controls = (
    <>
      <View style={styles.trayRow}>
        {pouredN > 0 && !done ? (
          <Button label="Pour back" tone="white" size="md" onPress={pourBack} sound="tap-soft" />
        ) : null}
        {assist.offerHelp && !done ? (
          <Button label="Show me" tone="yellow" size="md" onPress={showMe} sound="tap-soft" />
        ) : null}
        {pouring ? (
          <Text variant="small" color={palette.waterCyanDark}>
            pouring…
          </Text>
        ) : null}
      </View>
      <CookCTA label={done ? 'Measured!' : 'Done'} tone={done ? 'green' : 'red'} onPress={check} disabled={done} />
    </>
  );

  return (
    <ActivityFrame
      task={task}
      detail="Hold the jug and tilt it towards the cup — let go to stop."
      es={challenge.ingredient.es}
      compact={compact}
      onReplay={replay}
      backdrop={
        <>
          {/* a kitchen game belongs on a counter, not on a sky gradient */}
          <SceneStage variant="counter" groundHeight={170} />
          
        </>
      }
      controls={controls}
      controlsTone="cream"
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
    >
      <Stage design={D} style={styles.stage}>
        {(s) => (
          <>
            {/* cup */}
            {/* critique: the handle used to be clipped by the SVG box, so only
                two nubs showed behind the right edge. The box is wider now and
                the handle is a real three-tone object standing proud of the cup. */}
            <Animated.View style={[at(s, CUP.x, CUP.y, CUP.w + 48, CUP.h), cupWobble]} pointerEvents="none">
              <Svg width={(CUP.w + 48) * s} height={CUP.h * s} viewBox={`0 0 ${CUP.w + 48} ${CUP.h}`}>
                <Defs>
                  <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="rgba(255,255,255,0.85)" />
                    <Stop offset="0.5" stopColor="rgba(255,255,255,0.45)" />
                    <Stop offset="1" stopColor="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                </Defs>
                <Path
                  d={`M ${CUP.w - 26} 78 q 46 10 46 52 q 0 42 -46 52`}
                  fill="none"
                  stroke="#DCE3F0"
                  strokeWidth={22}
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${CUP.w - 26} 78 q 46 10 46 52 q 0 42 -46 52`}
                  fill="none"
                  stroke={palette.white}
                  strokeWidth={15}
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${CUP.w - 20} 84 q 36 10 36 44`}
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <Rect x={2} y={12} width={CUP.w - 4} height={CUP.h - 18} rx={26} fill="#E4EAF5" />
                <Rect x={6} y={16} width={CUP.w - 12} height={CUP.h - 26} rx={22} fill="url(#glass)" />
                <Rect x={14} y={26} width={16} height={CUP.h - 60} rx={8} fill="rgba(255,255,255,0.6)" />
                <Rect x={2} y={6} width={CUP.w - 4} height={20} rx={10} fill={palette.white} />
              </Svg>
            </Animated.View>

            {/* liquid */}
            <View style={[at(s, INNER.x, INNER.y, INNER.w, INNER.h), styles.clip, { borderRadius: 16 * s }]} pointerEvents="none">
              <Animated.View style={[styles.liquid, { backgroundColor: look.fill }, liquidStyle]}>
                <Wave s={s} width={INNER.w} color={look.foam} />
              </Animated.View>
            </View>

            {/* The stream falls into the cup, not into the gap beside it: it
                used to be pinned to the jug and hidden behind the readout card,
                so nothing connected the tipping jug to the rising liquid. It
                thickens with the tilt and stops the moment the hand lets go. */}
            <Animated.View
              style={[at(s, INNER.x + INNER.w / 2 - 11, CUP.y + 2, 22, 140), styles.stream, streamStyle]}
              pointerEvents="none"
            >
              <View style={[styles.streamBody, { backgroundColor: look.fill, borderRadius: 11 * s }]} />
              <View
                style={[styles.droplet, { backgroundColor: look.foam, width: 14 * s, height: 14 * s, borderRadius: 7 * s }]}
              />
            </Animated.View>

            {/* ticks + target flag */}
            <View style={at(s, CUP.x, CUP.y, CUP.w + 90, CUP.h)} pointerEvents="none">
              {ticks.map((t) => {
                const lit = pouredN >= t - 1e-6;
                const y = INNER.y - CUP.y + INNER.h - t * SPAN;
                const isTarget = Math.abs(t - targetN) < 1e-6;
                return (
                  <View key={t} style={[at(s, 12, y - 9, CUP.w + 60, 18), styles.tickRow]}>
                    <View
                      style={[
                        styles.tick,
                        { width: (isTarget ? 96 : 52) * s, height: (isTarget ? 5 : 3) * s },
                        { backgroundColor: isTarget ? palette.engineRed : lit ? palette.gold : 'rgba(31,42,90,0.28)' },
                      ]}
                    />
                    <Text
                      variant="tiny"
                      color={isTarget ? palette.engineRed : lit ? palette.goldDark : roles.ink.muted}
                      style={{ fontSize: 14 * s, lineHeight: 18 * s }}
                    >
                      {formatFraction({ num: Math.round(t * challenge.ticks), den: challenge.ticks })}
                    </Text>
                    {isTarget ? (
                      <Animated.View entering={FadeIn} style={styles.flag}>
                        <Svg width={34 * s} height={22 * s} viewBox="0 0 34 22">
                          <Rect x={0} y={0} width={3} height={22} rx={1.5} fill={palette.navy} />
                          <Path d="M3 1h28l-7 6 7 6H3z" fill={palette.engineRed} />
                        </Svg>
                      </Animated.View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* the pouring container */}
            <View style={at(s, JUG.x, JUG.y, JUG.w, JUG.h + 40)}>
              <GestureDetector gesture={jugGesture}>
                <Animated.View
                  style={jugStyle}
                  accessibilityRole="button"
                  accessibilityLabel={`Hold to pour ${challenge.ingredient.en}, and tilt it towards the cup`}
                >
                  <View style={[styles.jug, { width: JUG.w * s, height: JUG.h * s, borderRadius: 20 * s, borderWidth: 4 * s }]}>
                    {/* the tin the ingredient sits in — gives white contents
                        something to read against (azúcar was white on white) */}
                    <View
                      style={[
                        styles.tin,
                        { width: 78 * s, height: 78 * s, borderRadius: 26 * s, backgroundColor: look.tin },
                      ]}
                    />
                    <VocabIcon id={challenge.ingredient.id} size={62 * s} />
                    <Text variant="tiny" color={palette.navy} style={{ fontSize: 13 * s, lineHeight: 17 * s }}>
                      {challenge.ingredient.es}
                    </Text>
                  </View>
                </Animated.View>
              </GestureDetector>
            </View>

            <View style={at(s, 240, 214, 132)} pointerEvents="none">
              <View style={[styles.readout, shadows.soft]}>
                <Text variant="tiny" color={roles.ink.muted}>
                  In the cup
                </Text>
                <Text variant="h1" color={over ? palette.orangeDark : palette.navy}>
                  {formatFraction(poured)}
                </Text>
                <Text variant="tiny" color={roles.ink.secondary}>
                  need {formatFraction(target)} {unitWord}
                </Text>
              </View>
            </View>
          </>
        )}
      </Stage>
    </ActivityFrame>
  );
}

/** Sloshy top edge that keeps travelling while the liquid settles. */
function Wave({ s, width, color }: { s: number; width: number; color: string }) {
  const t = useRise(2600);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -t.value * width * s }] }));
  return (
    <Animated.View style={[styles.wave, { top: -6 * s, height: 14 * s, width: width * 2 * s }, style]} pointerEvents="none">
      <Svg width={width * 2 * s} height={14 * s} viewBox="0 0 200 14" preserveAspectRatio="none">
        <Path d="M0 8 q 25 -8 50 0 t 50 0 t 50 0 t 50 0 V14 H0 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1 },
  clip: { overflow: 'hidden', justifyContent: 'flex-end' },
  liquid: { width: '100%', justifyContent: 'flex-start' },
  wave: { position: 'absolute', left: 0 },
  tickRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tick: { borderRadius: 3 },
  flag: { marginLeft: 2 },
  jug: {
    backgroundColor: roles.surface.card,
    borderColor: palette.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  tin: { position: 'absolute', top: '14%' },
  stream: { alignItems: 'center' },
  streamBody: { flex: 1, width: '100%' },
  droplet: { position: 'absolute', bottom: -4, alignSelf: 'center', opacity: 0.9 },
  readout: {
    backgroundColor: roles.surface.card,
    borderRadius: radii.tile,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  trayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 4,
  },
});
