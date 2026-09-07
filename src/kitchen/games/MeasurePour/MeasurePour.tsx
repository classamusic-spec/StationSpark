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
  ContactPatch,
  CounterCrumbs,
  CounterRun,
  HerbPot,
  KitchenWall,
  KitchenWindow,
  MixingBowls,
  PinnedNote,
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
/**
 * How far past the tallest marked line the cup can be filled before it spills.
 *
 * This used to be a flat 1.25 CUPS, which made "pour 1 ½ spoons" impossible:
 * the jug shut itself at 1 ¼ and the Done button said "keep pouring up to the
 * 1 ½ line" for ever. Headroom belongs to the measure being asked for.
 */
const BRIM_OVER = 1.25;

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
  /** how much worktop SURFACE is drawn above the counter's front edge */
  deck: number;
  deckTop: number;
  /** the line on that worktop the cup's foot stands on */
  baseY: number;
  /** the measuring cup */
  cup: Box;
  /** the glass inside the cup, where the liquid lives */
  inner: Box;
  /** the TOPMOST line sits this far up the glass, leaving headroom to overfill */
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
  /* the counter is a SURFACE, not just a nose: `deck` is how much worktop is
     drawn receding behind its front edge, and the cup stands on that wood a
     little back from the edge instead of hovering on the splashback tiles */
  const counterH = Math.max(28, Math.min(56, h * 0.09));
  const counterY = h - counterH;
  const deck = Math.max(54, Math.min(140, h * 0.24));
  const deckTop = counterY - deck;
  const baseY = counterY - deck * 0.3;
  const top = 6;
  const availH = counterY - top;

  /* The jug hangs ABOVE the cup and pours down into it — the way a hand really
     holds it — so the cup gets the full width of the play area rather than
     sharing it side by side with a container. */
  const jugH = Math.max(86, Math.min(146, availH * 0.27));
  const jugW = jugH * 0.95;

  const cupW = Math.min(w * 0.46, Math.max(60, (baseY - (top + jugH * 1.05)) * CUP_ASPECT));
  const cupH = cupW / CUP_ASPECT;
  const cup: Box = { x: Math.max(8, w * 0.04), y: baseY - cupH, w: cupW, h: cupH };
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
  const windowH = Math.min(dressW * 0.82, availH * 0.32);
  const jarH = Math.min(46, availH * 0.15);
  const shelfY = Math.min(top + windowH + 12 + jarH, Math.max(top + 60, deckTop - 6));
  const readout: Box = {
    x: railX,
    y: Math.min(shelfY + 18, baseY - 100),
    w: dressW,
    h: 92,
  };

  return {
    s,
    w,
    h,
    counterY,
    counterH,
    deck,
    deckTop,
    baseY,
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
  /**
   * The tallest line the glass is marked to — never less than a whole cup, and
   * always at least the target, so every measure a recipe can ask for has a
   * line to pour up to ON THE GLASS rather than one drawn across the rim.
   */
  const topLine = Math.max(1, targetN);
  const brim = topLine * BRIM_OVER;
  const pouredN = toNumber(poured);
  const look = liquidLook[challenge.ingredient.id] ?? DEFAULT_LOOK;
  const unitWord = challenge.unit === 'cup' ? 'cup' : 'spoon';

  const task = `Pour ${formatFraction(target)} ${unitWord}${targetN === 1 ? '' : 's'} of ${challenge.ingredient.en}`;
  const replay = useSpokenTask(
    `Pour ${speakFraction(target)} ${unitWord}${targetN === 1 ? '' : 's'} of ${challenge.ingredient.en}.`,
  );

  useEffect(() => {
    level.value = withSpring(Math.min(brim + 0.1, pouredN), springs.gentle);
  }, [brim, level, pouredN]);

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
    if (toNumber(next) > brim) {
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
  }, [assist, brim, challenge.step, wobble]);

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
          /* the glass is marked to `topLine`, so one whole cup is this tall */
          const unitSpan = sc.span / topLine;
          return (
            <>
              {/* --- the room ------------------------------------- */}
              {/* the whole wall above the worktop is tiled: a band of bare
                  cream between the tiles and the window was the flattest thing
                  on the screen */}
              <SplashbackBand s={s} x={0} y={4} w={w} depth={Math.max(26, sc.deckTop - 4)} />
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
              {jug.x > 96 ? <UtensilRail s={s} x={6} y={8} w={Math.min(150, jug.x - 16)} /> : null}
              {jug.x > 84 && cup.y > 120 ? <PinnedNote s={s} x={10} y={16} w={Math.min(72, jug.x - 22)} /> : null}
              <CounterRun s={s} w={w} y={sc.counterY} h={sc.counterH + 44} deck={sc.deck} />
              {/* things STANDING on that worktop, staggered back to front */}
              <HerbPot s={s} x={Math.min(w - 60, sc.railX + dress * 0.06)} y={sc.baseY - 52} h={50} />
              <MixingBowls s={s} x={Math.min(w - 76, sc.railX + dress * 0.44)} y={sc.baseY - 42} w={66} />
              <CounterCrumbs s={s} x={cup.x + cup.w * 0.6} y={sc.counterY - 24} w={Math.max(80, dress)} seed={5} />
              {/* what the cup lays on the wood */}
              <ContactPatch s={s} cx={cup.x + cup.w * 0.5} y={sc.baseY - 2} rx={cup.w * 0.5} strength={0.7} />

              {/* --- the measuring cup ---------------------------- */}
              <Animated.View style={[at(s, cup.x, cup.y, cup.w * 1.34, cup.h), cupWobble]} pointerEvents="none">
                <MeasuringCup width={cup.w * 1.34 * s} height={cup.h * s} />
              </Animated.View>

              {/* liquid */}
              <View
                style={[at(s, inner.x, inner.y, inner.w, inner.h), styles.clip, { borderRadius: inner.w * 0.12 * s }]}
                pointerEvents="none"
              >
                <Liquid s={s} span={unitSpan} level={level} width={inner.w} look={look} />
              </View>

              {/* …and the front wall of the glass over the top of it */}
              <View style={at(s, cup.x, cup.y, cup.w * 1.34, cup.h)} pointerEvents="none">
                <CupGlass width={cup.w * 1.34 * s} height={cup.h * s} />
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
                  const y = inner.y - cup.y + inner.h - t * unitSpan;
                  const isTarget = Math.abs(t - targetN) < 1e-6;
                  const tickH = (isTarget ? 5 : 3) * s;
                  return (
                    <View key={t} style={[at(s, cup.w * 0.12, y - 10, cup.w * 1.2, 20), styles.tickRow]}>
                      <View
                        style={[
                          styles.tick,
                          { width: (isTarget ? cup.w * 0.58 : cup.w * 0.3) * s, height: tickH },
                          { backgroundColor: isTarget ? palette.engineRed : lit ? palette.gold : 'rgba(31,42,90,0.28)' },
                        ]}
                      >
                        {/* a measure line is moulded INTO the glass: the cut
                            takes the shade and the lip under it takes the light */}
                        <View style={[styles.tickLip, { height: tickH * 0.7, bottom: -tickH * 0.8 }]} />
                      </View>
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
      {/* a body, not a flat fill: light comes through the near wall, the far
          wall shades it, and the deepest part at the foot is darkest */}
      <View style={[styles.liquidLit, { left: width * 0.08 * s, width: width * 0.14 * s }]} pointerEvents="none" />
      <View style={[styles.liquidShade, { width: width * 0.17 * s }]} pointerEvents="none" />
      <View style={[styles.liquidFloor, { height: Math.max(12, width * 0.26) * s }]} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
          <Defs>
            <LinearGradient id="mpDepth" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0} />
              <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.22} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={10} height={10} fill="url(#mpDepth)" />
        </Svg>
      </View>
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
        {/* glass is not white: it is a cool tint that darkens at both walls,
            and this jug used to be the same value as the cream wall behind it */}
        <LinearGradient id="mpGlass" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#A3B2CE" />
          <Stop offset="0.22" stopColor="#D3DCEC" />
          <Stop offset="0.72" stopColor="#C3CFE4" />
          <Stop offset="1" stopColor="#9DACC9" />
        </LinearGradient>
        <LinearGradient id="mpSteel" x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#BCC7DE" />
        </LinearGradient>
      </Defs>
      {/* two shadows: the wide soft one and the tight dark one at the foot */}
      <Ellipse cx={52} cy={195} rx={50} ry={8} fill="rgba(31,42,90,0.07)" />
      <Ellipse cx={50} cy={193} rx={40} ry={5} fill="rgba(31,42,90,0.17)" />
      {/* handle, behind the glass so the glass reads as the front face */}
      <Path d="M96 62q34 8 34 40t-34 40" fill="none" stroke="#8C9CBC" strokeWidth={21} strokeLinecap="round" />
      <Path d="M96 60q34 8 34 40t-34 38" fill="none" stroke="#D5DEEE" strokeWidth={14} strokeLinecap="round" />
      <Path d="M99 68q24 8 24 30" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={5} strokeLinecap="round" />
      {/* body */}
      <Rect x={2} y={14} width={96} height={176} rx={22} fill="#8C9CBC" />
      <Rect x={5} y={17} width={90} height={170} rx={20} fill="url(#mpGlass)" />
      {/* the far wall of the jug, seen through the near one — the single most
          "this is glass" cue there is */}
      <Ellipse cx={50} cy={30} rx={39} ry={8} fill="rgba(31,42,90,0.10)" />
      <Ellipse cx={50} cy={176} rx={39} ry={8} fill="rgba(31,42,90,0.08)" />
      {/* foot */}
      <Rect x={6} y={176} width={88} height={14} rx={7} fill="#93A3C2" />
      <Rect x={10} y={178} width={42} height={4} rx={2} fill="rgba(255,255,255,0.6)" />
      {/* spout + rim */}
      <Path d="M2 22h20l-6 16z" fill="#E4EAF5" />
      <Rect x={0} y={5} width={100} height={22} rx={11} fill="#A9B8D2" />
      <Rect x={0} y={4} width={100} height={19} rx={9.5} fill="url(#mpSteel)" />
      <Rect x={5} y={7} width={44} height={5} rx={2.5} fill="rgba(255,255,255,0.95)" />
      <Rect x={4} y={19} width={92} height={5} rx={2.5} fill="rgba(31,42,90,0.12)" />
    </Svg>
  );
}

/**
 * The glass IN FRONT of what is in it. The liquid is a separate layer stacked
 * over the jug, so every highlight the jug drew was buried the moment a child
 * poured: the wall thickening at the silhouette, the specular running down the
 * lit side, the bounce coming back up through the foot. They live here, drawn
 * last, which is what makes the milk look like it is *inside* something.
 */
function CupGlass({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 134 200">
      <Defs>
        <LinearGradient id="mpShine" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.4} />
        </LinearGradient>
        <LinearGradient id="mpWallL" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0.2} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="mpWallR" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.22} />
        </LinearGradient>
      </Defs>
      <Rect x={7} y={24} width={13} height={162} fill="url(#mpWallL)" />
      <Rect x={80} y={24} width={13} height={162} fill="url(#mpWallR)" />
      <Rect x={14} y={32} width={13} height={140} rx={6.5} fill="url(#mpShine)" />
      <Rect x={81} y={38} width={6} height={126} rx={3} fill="rgba(255,255,255,0.55)" />
      <Path d="M11 166q39 13 78 0v11q-39 12-78 0z" fill="rgba(255,255,255,0.26)" />
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
      <Defs>
        {/* enamelware is a cylinder too: dark rim, lit left of centre */}
        <LinearGradient id="mpTin" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={look.tinDark} />
          <Stop offset="0.3" stopColor={look.tin} />
          <Stop offset="0.72" stopColor={look.tin} />
          <Stop offset="1" stopColor={look.tinDark} />
        </LinearGradient>
        <LinearGradient id="mpTinFoot" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.26} />
        </LinearGradient>
      </Defs>
      {/* handle */}
      <Path d="M86 40q24 6 24 26t-24 24" fill="none" stroke={look.tinDark} strokeWidth={13} strokeLinecap="round" />
      <Path d="M88 46q16 6 16 20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeLinecap="round" />
      {/* body */}
      <Path d="M16 30h74l-7 68a12 12 0 0 1-12 11H35a12 12 0 0 1-12-11z" fill={look.tinDark} />
      <Path d="M20 34h66l-6 62a10 10 0 0 1-10 9H36a10 10 0 0 1-10-9z" fill="url(#mpTin)" />
      {/* the broad specular, the tight line inside it, the cool shaded wall,
          and the underside a held jug always has */}
      <Path d="M25 38h14l-5 64h-9z" fill="rgba(255,255,255,0.26)" />
      <Path d="M29 40h5l-4 60h-4z" fill="rgba(255,255,255,0.55)" />
      <Path d="M74 38h8l-6 66h-7z" fill="rgba(31,42,90,0.14)" />
      <Path d="M22 82h62l-3 14a10 10 0 0 1-10 9H36a10 10 0 0 1-10-9z" fill="url(#mpTinFoot)" />
      {/* label */}
      <Ellipse cx={53} cy={70} rx={26} ry={23} fill="#FFF8EA" />
      <Ellipse cx={53} cy={68} rx={26} ry={23} fill="#FFFDF6" />
      <Ellipse cx={53} cy={68} rx={26} ry={23} fill="none" stroke={look.tinDark} strokeWidth={2.5} />
      <Path d="M34 56a26 23 0 0 1 26 -11 26 23 0 0 0 -22 15z" fill="rgba(255,255,255,0.85)" />
      {/* spout, aimed at the cup on the left */}
      <Path d="M16 30L2 36l6 13 10-7z" fill={look.tin} />
      <Path d="M16 30L2 36l3 6 12-6z" fill="rgba(255,255,255,0.4)" />
      {/* rim */}
      <Rect x={10} y={19} width={88} height={16} rx={8} fill="#CBD3E4" />
      <Rect x={10} y={18} width={88} height={13} rx={6.5} fill={palette.white} />
      <Rect x={16} y={20} width={34} height={4} rx={2} fill="rgba(255,255,255,0.95)" />
      <Circle cx={54} cy={16} r={7} fill={look.tinDark} />
      <Circle cx={52} cy={14} r={2.5} fill="rgba(255,255,255,0.6)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1 },
  clip: { overflow: 'hidden', justifyContent: 'flex-end' },
  liquid: { width: '100%', justifyContent: 'flex-start' },
  liquidLit: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.26)' },
  liquidShade: { position: 'absolute', top: 0, bottom: 0, right: 0, backgroundColor: 'rgba(31,42,90,0.10)' },
  liquidFloor: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  wave: { position: 'absolute', left: 0 },
  tickRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tick: { borderRadius: 3 },
  tickLip: { position: 'absolute', left: 0, right: 0, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' },
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
