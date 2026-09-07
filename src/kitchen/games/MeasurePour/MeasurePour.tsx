import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
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

import { FluidStage, at, type FluidBox } from '../../parts/Stage';
import { CookCTA } from '../../parts/SceneBits';
import {
  Canister,
  CounterCrumbs,
  CounterRun,
  HerbPot,
  KitchenWall,
  KitchenWindow,
  MixingBowls,
  Shelf,
  SplashbackBand,
  StoreJar,
  UtensilRail,
} from '../../parts/KitchenRoom';
import { useRise, useSwing } from '../../parts/motion';
import { kitchenFeel, useCaptainHint, useSpokenTask, useTimers } from '../useKitchenGame';

/** the measuring cup drawing's width ÷ height */
const CUP_ASPECT = 0.6;
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
 * in a jug with real value contrast behind it.
 */
const liquidLook: Record<string, { fill: string; foam: string; tin: string; tinDark: string }> = {
  milk: { fill: '#FBF6EC', foam: '#FFFFFF', tin: '#7FB4DC', tinDark: '#5B8FBA' },
  water: { fill: '#7ED2F7', foam: '#BDECFF', tin: '#4FC3F7', tinDark: '#1FA5E8' },
  flour: { fill: '#F0DFBE', foam: '#FBEFD8', tin: '#C9A97A', tinDark: '#A5854F' },
  sugar: { fill: '#FFF3D6', foam: '#FFFFFF', tin: '#8FB6DA', tinDark: '#6A93B8' },
  butter: { fill: '#FFDE8A', foam: '#FFEFC0', tin: '#E5C371', tinDark: '#C09E4C' },
  tomato: { fill: '#F2705F', foam: '#FF9C8E', tin: '#E4574A', tinDark: '#B9261C' },
};
const DEFAULT_LOOK = { fill: '#7ED2F7', foam: '#BDECFF', tin: '#4FC3F7', tinDark: '#1FA5E8' };

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Scene {
  s: number;
  w: number;
  h: number;
  counterY: number;
  counterH: number;
  /** the measuring cup */
  cup: Box;
  /** the glass inside the cup, where the liquid lives */
  inner: Box;
  /** the "1 cup" line sits this far up the glass, leaving headroom to overfill */
  span: number;
  jug: Box;
  readout: Box;
  /** the left edge of the strip of wall beside the cup, kept for dressing */
  railX: number;
  /** how wide that strip is */
  dressW: number;
  windowH: number;
  jarH: number;
  /** where the jar shelf's plank sits */
  shelfY: number;
}

/**
 * Compose the room. The measuring cup is the subject of the screen, so it grows
 * to whatever the play area gives it and stands on the counter; the jug is
 * beside it at pouring height, and whatever wall is left over becomes a shelf,
 * a window and a rail of tools instead of the ~250 px of bare sky this game
 * used to ship with.
 */
function layout(box: FluidBox): Scene {
  const { s, w, h } = box;
  const counterH = Math.max(46, Math.min(84, h * 0.14));
  const counterY = h - counterH;
  const top = 6;
  const availH = counterY - top;

  /* The jug hangs ABOVE the cup and pours down into it — the way a hand really
     holds it — so the cup gets the full width of the play area rather than
     sharing it side by side with a container. */
  const jugH = Math.max(88, Math.min(150, availH * 0.28));
  const jugW = jugH * 0.95;

  const cupW = Math.min(w * 0.46, (counterY - (top + jugH * 1.05)) * CUP_ASPECT);
  const cupH = cupW / CUP_ASPECT;
  const cup: Box = { x: Math.max(8, w * 0.03), y: counterY - cupH, w: cupW, h: cupH };
  /* the glass, inset below the rim so the topmost measure line is on the glass
     and not painted across the lip */
  const inner: Box = { x: cup.x + cupW * 0.09, y: cup.y + cupH * 0.13, w: cupW * 0.82, h: cupH * 0.82 };

  const jug: Box = {
    x: cup.x + cupW / 2 - jugW * 0.12,
    y: Math.max(4, cup.y - jugH * 1.02),
    w: jugW,
    h: jugH,
  };

  /* everything right of the cup (handle included) is wall to dress: a window
     over a shelf of jars over the readout, stacked top-down so nothing lands on
     anything else however short the play area is */
  const railX = cup.x + cupW * 1.34 + 8;
  const dressW = Math.max(90, w - railX - 8);
  const windowH = Math.min(dressW * 0.82, availH * 0.34);
  const jarH = Math.min(46, availH * 0.15);
  const shelfY = Math.min(top + windowH + 12 + jarH, counterY - 150);
  const readout: Box = {
    x: railX,
    y: Math.min(shelfY + 20, counterY - 100),
    w: dressW,
    h: 92,
  };

  return {
    s,
    w,
    h,
    counterY,
    counterH,
    cup,
    inner,
    span: inner.h * 0.72,
    jug,
    readout,
    railX,
    dressW,
    windowH,
    jarH,
    shelfY,
  };
}

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
  const look = liquidLook[challenge.ingredient.id] ?? DEFAULT_LOOK;
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
  const jugStyle = useAnimatedStyle(() => {
    const resting = pouredN === 0 && !pouring && !reduced ? 1 : 0;
    return { transform: [{ rotate: `${tilt.value + nudge.value * 5 * resting}deg` }] };
  });
  const streamStyle = useAnimatedStyle(() => ({
    opacity: stream.value,
    transform: [{ scaleY: 0.5 + stream.value * 0.5 }, { scaleX: 0.7 + tipped.value * 0.6 }],
  }));
  const cupWobble = useAnimatedStyle(() => ({ transform: [{ translateX: wobble.value }] }));

  /* The glass is marked past 1 cup when the recipe asks for more than a cup —
     "1 ¼ cups" used to have no line to pour up to at all, only a number in the
     readout card. */
  const tickCount = Math.max(challenge.ticks, Math.round(targetN * challenge.ticks));
  const ticks = Array.from({ length: tickCount }, (_, i) => (i + 1) / challenge.ticks);
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
      backdrop={<KitchenWall />}
      controls={controls}
      controlsTone="cream"
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
    >
      <FluidStage minH={330} maxScale={1.8} style={styles.stage}>
        {(box) => {
          const sc = layout(box);
          const { s, w, cup, inner, jug } = sc;
          const dress = sc.dressW;
          return (
            <>
              {/* --- the room ------------------------------------- */}
              <SplashbackBand s={s} x={0} y={sc.counterY - 66} w={w} depth={66} />
              {/* the strip of wall beside the cup: a window over a shelf of jars
                  over the readout, and a rail of tools above the jug */}
              <KitchenWindow
                s={s}
                x={sc.railX + (dress - Math.min(dress, sc.windowH / 0.82)) / 2}
                y={8}
                w={Math.min(dress, sc.windowH / 0.82)}
              />
              <Shelf s={s} x={sc.railX} y={sc.shelfY} w={dress} />
              <StoreJar s={s} x={sc.railX + 4} y={sc.shelfY - sc.jarH} h={sc.jarH} tone="honey" />
              <Canister s={s} x={sc.railX + dress * 0.36} y={sc.shelfY - sc.jarH} h={sc.jarH} tone="#C9DDF2" />
              <StoreJar s={s} x={sc.railX + dress * 0.68} y={sc.shelfY - sc.jarH * 0.9} h={sc.jarH * 0.9} tone="herbs" />
              {jug.x > 96 ? (
                <UtensilRail s={s} x={6} y={8} w={Math.min(150, jug.x - 16)} />
              ) : null}
              <CounterRun s={s} w={w} y={sc.counterY} h={sc.counterH + 44} />
              <CounterCrumbs s={s} x={cup.x + cup.w * 0.5} y={sc.counterY - 12} w={Math.max(70, dress + 40)} seed={5} />
              {sc.counterY - (sc.readout.y + sc.readout.h) > 58 ? (
                <>
                  <HerbPot s={s} x={sc.railX + 4} y={sc.counterY - 52} h={50} />
                  <MixingBowls s={s} x={Math.min(w - 70, sc.railX + dress * 0.42)} y={sc.counterY - 40} w={62} />
                </>
              ) : null}

              {/* --- the measuring cup ---------------------------- */}
              <Animated.View style={[at(s, cup.x, cup.y, cup.w * 1.34, cup.h), cupWobble]} pointerEvents="none">
                <MeasuringCup width={cup.w * 1.34 * s} height={cup.h * s} />
              </Animated.View>

              {/* liquid */}
              <View
                style={[at(s, inner.x, inner.y, inner.w, inner.h), styles.clip, { borderRadius: inner.w * 0.12 * s }]}
                pointerEvents="none"
              >
                <Liquid s={s} span={sc.span} level={level} width={inner.w} look={look} />
              </View>

              {/* The stream falls into the cup, not into the gap beside it: it
                  used to be pinned to the jug and hidden behind the readout card,
                  so nothing connected the tipping jug to the rising liquid. It
                  thickens with the tilt and stops the moment the hand lets go. */}
              <Animated.View
                style={[
                  at(s, inner.x + inner.w / 2 - inner.w * 0.07, cup.y - 4, inner.w * 0.14, cup.h * 0.5),
                  styles.stream,
                  streamStyle,
                ]}
                pointerEvents="none"
              >
                <View style={[styles.streamBody, { backgroundColor: look.fill, borderRadius: inner.w * 0.07 * s }]} />
                <View
                  style={[
                    styles.droplet,
                    { backgroundColor: look.foam, width: inner.w * 0.09 * s, height: inner.w * 0.09 * s, borderRadius: inner.w * 0.05 * s },
                  ]}
                />
              </Animated.View>

              {/* ticks + target flag, printed on the glass */}
              <View style={at(s, cup.x, cup.y, cup.w * 1.34, cup.h)} pointerEvents="none">
                {ticks.map((t) => {
                  const lit = pouredN >= t - 1e-6;
                  const y = inner.y - cup.y + inner.h - t * sc.span;
                  const isTarget = Math.abs(t - targetN) < 1e-6;
                  return (
                    <View key={t} style={[at(s, cup.w * 0.12, y - 10, cup.w * 1.2, 20), styles.tickRow]}>
                      <View
                        style={[
                          styles.tick,
                          { width: (isTarget ? cup.w * 0.58 : cup.w * 0.3) * s, height: (isTarget ? 5 : 3) * s },
                          { backgroundColor: isTarget ? palette.engineRed : lit ? palette.gold : 'rgba(31,42,90,0.28)' },
                        ]}
                      />
                      <Text
                        variant="tiny"
                        color={isTarget ? palette.engineRed : lit ? palette.goldDark : roles.ink.muted}
                        style={{ fontSize: Math.max(11, cup.w * 0.1) * s, lineHeight: Math.max(14, cup.w * 0.13) * s }}
                      >
                        {formatFraction({ num: Math.round(t * challenge.ticks), den: challenge.ticks })}
                      </Text>
                      {isTarget ? (
                        <Animated.View entering={FadeIn} style={styles.flag}>
                          <Svg width={cup.w * 0.2 * s} height={cup.w * 0.13 * s} viewBox="0 0 34 22">
                            <Rect x={0} y={0} width={3} height={22} rx={1.5} fill={palette.navy} />
                            <Path d="M3 1h28l-7 6 7 6H3z" fill={palette.engineRed} />
                          </Svg>
                        </Animated.View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              {/* --- the jug you tilt ----------------------------- */}
              <View style={at(s, jug.x, jug.y, jug.w, jug.h)}>
                <GestureDetector gesture={jugGesture}>
                  <Animated.View
                    style={jugStyle}
                    accessibilityRole="button"
                    accessibilityLabel={`Hold to pour ${challenge.ingredient.en}, and tilt it towards the cup`}
                  >
                    <View style={{ width: jug.w * s, height: jug.h * s }}>
                      <PourJug width={jug.w * s} look={look} />
                      <View style={styles.jugLabel} pointerEvents="none">
                        <VocabIcon id={challenge.ingredient.icon} size={jug.w * 0.42 * s} noShadow />
                      </View>
                    </View>
                  </Animated.View>
                </GestureDetector>
              </View>

              {/* --- how much is in the cup ----------------------- */}
              <View style={at(s, sc.readout.x, sc.readout.y, sc.readout.w)} pointerEvents="none">
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
          );
        }}
      </FluidStage>
    </ActivityFrame>
  );
}

/* ------------------------------------------------------------------ */
/* The liquid, and its sloshy top edge                                  */
/* ------------------------------------------------------------------ */

function Liquid({
  s,
  span,
  level,
  width,
  look,
}: {
  s: number;
  span: number;
  level: { value: number };
  width: number;
  look: { fill: string; foam: string };
}) {
  const style = useAnimatedStyle(() => ({ height: Math.max(0, level.value) * span * s }));
  return (
    <Animated.View style={[styles.liquid, { backgroundColor: look.fill }, style]}>
      <Wave s={s} width={width} color={look.foam} />
    </Animated.View>
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

/* ------------------------------------------------------------------ */
/* The measuring cup                                                    */
/* ------------------------------------------------------------------ */

/**
 * A real measuring jug: a straight-sided glass with a lipped rim, a pouring
 * spout on the left, a moulded handle standing proud on the right (it used to
 * be two white nubs clipped by the SVG box), and a foot the counter can take
 * the weight on.
 */
function MeasuringCup({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 134 200">
      <Defs>
        <LinearGradient id="mpGlass" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="rgba(255,255,255,0.75)" />
          <Stop offset="0.5" stopColor="rgba(255,255,255,0.10)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0.45)" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={192} rx={44} ry={7} fill="rgba(31,42,90,0.14)" />
      {/* handle, behind the glass so the glass reads as the front face */}
      <Path d="M96 62q34 8 34 40t-34 40" fill="none" stroke="#A9B8D2" strokeWidth={21} strokeLinecap="round" />
      <Path d="M96 60q34 8 34 40t-34 38" fill="none" stroke="#DFE7F4" strokeWidth={14} strokeLinecap="round" />
      <Path d="M99 68q24 8 24 30" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={5} strokeLinecap="round" />
      {/* body */}
      <Rect x={2} y={14} width={96} height={176} rx={22} fill="#B6C4DC" />
      <Rect x={7} y={19} width={86} height={166} rx={18} fill="#DCE4F1" />
      <Rect x={7} y={19} width={86} height={166} rx={18} fill="url(#mpGlass)" />
      <Rect x={14} y={30} width={13} height={140} rx={6.5} fill="rgba(255,255,255,0.8)" />
      <Rect x={80} y={30} width={7} height={140} rx={3.5} fill="rgba(255,255,255,0.5)" />
      {/* spout + rim */}
      <Path d="M2 22h20l-6 16z" fill={palette.white} />
      <Rect x={0} y={6} width={100} height={20} rx={10} fill={palette.white} />
      <Rect x={4} y={9} width={40} height={6} rx={3} fill="rgba(31,42,90,0.06)" />
      {/* foot */}
      <Rect x={6} y={180} width={88} height={12} rx={6} fill="#B6C4DC" />
      <Rect x={10} y={182} width={40} height={4} rx={2} fill="rgba(255,255,255,0.5)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* The jug the ingredient comes out of                                  */
/* ------------------------------------------------------------------ */

/**
 * The pouring jug. It was a white card with the ingredient icon floating on it,
 * which is why "azúcar" read as a blank tile: an enamel jug in the ingredient's
 * own colour, with a spout aimed at the cup, a handle, a cream label and a lid
 * bead, says "there is something in here to pour" without a single word.
 */
function PourJug({ width, look }: { width: number; look: { tin: string; tinDark: string; fill: string } }) {
  return (
    <Svg width={width} height={width / 0.95} viewBox="0 0 114 120">
      <Ellipse cx={56} cy={114} rx={40} ry={6} fill="rgba(31,42,90,0.14)" />
      {/* handle */}
      <Path d="M86 40q24 6 24 26t-24 24" fill="none" stroke={look.tinDark} strokeWidth={13} strokeLinecap="round" />
      <Path d="M88 46q16 6 16 20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeLinecap="round" />
      {/* body */}
      <Path d="M16 30h74l-7 68a12 12 0 0 1-12 11H35a12 12 0 0 1-12-11z" fill={look.tinDark} />
      <Path d="M20 34h66l-6 62a10 10 0 0 1-10 9H36a10 10 0 0 1-10-9z" fill={look.tin} />
      <Path d="M26 38h12l-4 66h-8z" fill="rgba(255,255,255,0.34)" />
      <Path d="M74 38h8l-6 66h-7z" fill="rgba(31,42,90,0.12)" />
      {/* label */}
      <Ellipse cx={53} cy={70} rx={26} ry={23} fill="#FFF8EA" />
      <Ellipse cx={53} cy={70} rx={26} ry={23} fill="none" stroke={look.tinDark} strokeWidth={2.5} />
      {/* spout, aimed at the cup on the left */}
      <Path d="M16 30L2 36l6 13 10-7z" fill={look.tin} />
      <Path d="M16 30L2 36l3 6 12-6z" fill="rgba(255,255,255,0.4)" />
      {/* rim */}
      <Rect x={10} y={20} width={88} height={15} rx={7.5} fill={palette.white} />
      <Rect x={16} y={23} width={34} height={5} rx={2.5} fill="rgba(31,42,90,0.07)" />
      <Circle cx={54} cy={16} r={7} fill={look.tinDark} />
      <Circle cx={52} cy={14} r={2.5} fill="rgba(255,255,255,0.6)" />
    </Svg>
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
  jugLabel: { position: 'absolute', top: '46%', alignSelf: 'center', marginLeft: '-6%', marginTop: '-14%' },
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
