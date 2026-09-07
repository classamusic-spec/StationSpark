import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { ToppingId } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, roles, shadows, spacing, springs } from '@/theme';
import { formatFraction } from '@/utils/fractions';
import { speech } from '@/services/speech';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { ActivityFrame } from '@/ui/kit/ActivityFrame';
import { AnswerTile } from '@/ui/kit/AnswerTile';
import { GrownUpChip } from '@/ui/kit/Chip';

import { CrewFigure } from '@/world/scenes';
import { toppingLabel, toppings } from '../../food';
import {
  buildWedges,
  canPlace,
  cutAngles,
  planStatus,
  polar,
  regionAtPoint,
  regionCount,
  slicesFromCuts,
  toppingPlan,
  wedgePath,
  type Pt,
} from '../../fractionMath';
import { answerOptions, equationText, nextPlate, shareState } from '../../shareMath';
import { FluidStage, at, type FluidBox } from '../../parts/Stage';
import {
  CounterCrumbs,
  CounterRun,
  HerbPot,
  KitchenWall,
  KitchenWindow,
  Shelf,
  SplashbackBand,
  StoreJar,
  TeaTowel,
  UtensilRail,
} from '../../parts/KitchenRoom';
import { useSwing } from '../../parts/motion';
import { BowlCell, PieIndicator, PlateArt, ToppingRegion } from '../../parts/FoodBits';
import { CheckerCloth, CookCTA, EquationStrip, PizzaCutter, RollingPin, WoodPeel } from '../../parts/SceneBits';
import {
  CutHint,
  SweepHint,
  chooseCutLine,
  nextCut,
  useIdleAssist,
  useStrokeGesture,
  useSweepGesture,
  type Stroke,
} from '../../gestures';
import { kitchenFeel, nearestTarget, useCaptainHint, useDragSource, useSpokenTask, useTimers } from '../useKitchenGame';

/**
 * THE PIZZA'S OWN COORDINATE SPACE.
 *
 * The maths — which wedge a finger is over, which cut a stroke matched — is all
 * done in this fixed space, so none of it has to change when the drawing grows.
 * `Geo.k` below is how many play-area units one pizza unit is worth, and the
 * two conversions (`toPizza`, and the `s * k` handed to the gesture surfaces)
 * are the only places the two spaces meet.
 */
const PC: Pt = { x: 150, y: 198 };
const R_CRUST = 122;
const R_SAUCE = 107;

/** Where everything sits in the play area the stage actually got. */
interface Geo {
  s: number;
  w: number;
  h: number;
  counterY: number;
  counterH: number;
  rack: { x: number; y: number; w: number; h: number };
  board: { x: number; y: number; w: number; h: number };
  /** the pizza's centre and crust radius, in play-area units */
  cx: number;
  cy: number;
  r: number;
  /** play-area units per pizza unit */
  k: number;
  plateY: number;
  plateW: number;
  pileY: number;
  askY: number;
}

/**
 * Compose the room. The peel and the pizza are the subject of the screen, so
 * they take the biggest circle the play area can hold beside the ingredient
 * rack; the wall behind gets a shelf, a window and a rail, and the counter runs
 * across the foot. Nothing is a fixed 122-unit radius in the middle of a box
 * half as big again any more.
 */
function pizzaLayout(box: FluidBox, wide: boolean): Geo {
  const { s, w, h } = box;
  const counterH = Math.max(38, Math.min(72, h * 0.1));
  const counterY = h - counterH;

  const rackW = Math.max(76, Math.min(104, w * 0.2));
  const rack = { x: w - rackW - 6, y: 6, w: rackW, h: counterY - 16 };

  const areaX = 8;
  const areaW = rack.x - areaX - 8;
  const areaTop = 6;
  const areaH = counterY - areaTop - 6;
  const r = Math.min(areaW * 0.5, areaH * 0.45);
  const cx = areaX + areaW / 2;
  const cy = areaTop + areaH * 0.44;
  const k = r / R_CRUST;

  const plateW = Math.max(70, Math.min(104, (w - 24) / 4 - 8));
  return {
    s,
    w,
    h,
    counterY,
    counterH,
    rack,
    board: { x: cx - r * 1.2, y: cy - r * 1.14, w: r * 2.4, h: r * 2.3 },
    cx,
    cy,
    r,
    k,
    plateY: wide ? h * 0.46 : h * 0.44,
    plateW,
    pileY: Math.min(h - 76, counterY - 66),
    askY: h * 0.16,
  };
}
/** how many passes of the pin flatten the dough. A few honest sweeps, no more. */
const ROLL_PASSES = 4;
/** finger travel, in screen px, that counts as one pass */
const ROLL_PASS_PX = 100;
/** how big the ball of dough starts, as a fraction of the finished base */
const DOUGH_START = 0.46;
/**
 * The shortest knife stroke that counts as a cut, in design units — under a
 * fifth of the way across a 244-unit pizza. `matchCutLine` used to want nine
 * tenths of the diameter *and* the right angle.
 */
const CUT_MIN = 44;
/** a press that travelled less than this is a tap: cut the next line for me */
const CUT_TAP_SLOP = 16;

/* Who shows up to eat. Two leads and two neighbours — four, because the
 * fraction being shared is a fraction of four. */
const CREW = [
  { id: 'rookie' },
  { id: 'bea' },
  { id: 'npc', npc: 'rosa' },
  { id: 'npc', npc: 'gino' },
] as const;

type Phase = 'roll' | 'top' | 'cut' | 'ask' | 'share';

const STEP_OF: Record<Phase, number> = { roll: 0, top: 1, cut: 2, ask: 3, share: 3 };

export function PizzaFractions({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'pizza-fractions'>) {
  const session = useMiniGameSession('pizza-fractions', onComplete, onEvent);
  const assist = useCaptainHint(session);
  const timers = useTimers();
  const reduced = useReducedMotion();

  const count = useMemo(() => regionCount(challenge.toppings), [challenge.toppings]);
  const wedges = useMemo(() => buildWedges(count), [count]);
  const plan = useMemo(() => toppingPlan(challenge.toppings, count), [challenge.toppings, count]);
  const angles = useMemo(() => cutAngles(challenge.cutInto), [challenge.cutInto]);
  const among = Math.max(1, challenge.shareAmong);
  const each = Math.max(1, challenge.each || Math.floor(challenge.cutInto / among));

  const [phase, setPhase] = useState<Phase>('roll');
  const [rollPasses, setRollPasses] = useState(0);
  const [assigned, setAssigned] = useState<(ToppingId | null)[]>(() => Array.from({ length: count }, () => null));
  const [selected, setSelected] = useState<ToppingId | null>(null);
  const [hoverRegion, setHoverRegion] = useState(-1);
  const [cuts, setCuts] = useState<boolean[]>(() => angles.map(() => false));
  const [countUpTo, setCountUpTo] = useState(0);
  const [plates, setPlates] = useState<number[]>(() => Array.from({ length: among }, () => 0));
  const [usedSlices, setUsedSlices] = useState<number[]>([]);
  const [answered, setAnswered] = useState(ageBand === 'A');
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);

  /** guards every one-way door, so no step can be walked through twice */
  const gate = useRef({ counting: false, shared: false, answered: false });
  /**
   * The board state lives in refs and is *mirrored* into React state for the
   * drawing. Two taps landing in the same frame used to be able to read the
   * same stale array and both write it — a slice on two plates at once, or a
   * topping counted twice. One writer, one truth.
   */
  const assignedRef = useRef<(ToppingId | null)[]>(assigned);
  const cutsRef = useRef<boolean[]>(cuts);
  const platesRef = useRef<number[]>(plates);
  const usedRef = useRef<number[]>([]);
  /** late-bound so `applyCut` can reset the idle clock declared after it */
  const cutAssistRef = useRef<(() => void) | null>(null);

  const status = useMemo(() => planStatus(plan, assigned), [plan, assigned]);
  const madeCuts = cuts.filter(Boolean).length;
  const sliceCount = slicesFromCuts(madeCuts, challenge.cutInto);
  const placedSlices = plates.reduce((a, b) => a + b, 0);
  const slicesLeft = Math.max(0, challenge.cutInto - placedSlices);
  const rolled = Math.min(1, rollPasses / ROLL_PASSES);

  const recipeLine = useMemo(
    () => challenge.toppings.map((t) => `${formatFraction(t.fraction)} ${toppings[t.topping].word.en}`).join(' and '),
    [challenge.toppings],
  );

  /* ---- the one instruction, in the TaskBar and in Captain Bea's voice ---- */
  const task =
    phase === 'roll'
      ? 'Roll out the dough'
      : phase === 'top'
        ? `Make ${recipeLine}`
        : phase === 'cut'
          ? `Cut into ${challenge.cutInto} equal slices`
          : phase === 'ask'
            ? `${challenge.cutInto} slices for ${among}. How many each?`
            : `Share among ${among} crew members`;

  /* Every line names the gesture *and* the tap that always works instead. */
  const detail =
    phase === 'roll'
      ? 'Swipe the rolling pin across the dough — or tap it.'
      : phase === 'top'
        ? 'Drag a bowl onto the pizza — or tap a slice.'
        : phase === 'cut'
          ? 'Swipe the cutter across the pizza — or tap it.'
          : phase === 'share'
            ? 'Drag a slice to a plate — or just tap the plate.'
            : undefined;

  const spoken =
    phase === 'roll'
      ? 'Roll out the dough! Swipe the rolling pin back and forth.'
      : phase === 'cut'
        ? `Cut into ${challenge.cutInto} equal slices`
        : task;
  const replay = useSpokenTask(spoken);

  useEffect(() => {
    session.progress(STEP_OF[phase], 4);
  }, [phase, session]);

  /* ------------------------------------------------------------------ */
  /* Phase 0 — rolling out the dough                                      */
  /* ------------------------------------------------------------------ */

  const doughScale = useSharedValue(DOUGH_START);
  const doughSquish = useSharedValue(1);
  const demo = useSharedValue(0);

  const finishRolling = useCallback(() => {
    kitchenFeel.flatten();
    doughSquish.value = withSequence(withSpring(1.08, springs.pop), withSpring(1, springs.gentle));
    assist.cheer('Flat and round — now the toppings!', '¡Qué bien!');
    timers.after(620, () => setPhase('top'));
  }, [assist, doughSquish, timers]);

  const addRollPass = useCallback(
    (amount: number) => {
      setRollPasses((n) => {
        if (n >= ROLL_PASSES) return n;
        const next = Math.min(ROLL_PASSES, n + amount);
        const grown = DOUGH_START + (1 - DOUGH_START) * (next / ROLL_PASSES);
        doughScale.value = withSpring(grown, springs.pop);
        doughSquish.value = withSequence(withSpring(1.06, springs.pop), withSpring(1, springs.gentle));
        if (next >= ROLL_PASSES) timers.after(0, finishRolling);
        return next;
      });
    },
    [doughScale, doughSquish, finishRolling, timers],
  );

  /**
   * NEVER A DEAD END. If the dough sits untouched, Captain Bea picks the pin up
   * herself: she says what to do, the pin sweeps across on screen, and one pass
   * gets done. Keep quiet and she finishes it — a child who cannot swipe still
   * cooks the pizza, just a few seconds later.
   */
  const rollAssist = useIdleAssist({
    active: phase === 'roll',
    firstMs: 3200,
    repeatMs: 950,
    onHelp: (round) => {
      if (round === 1) assist.cheer('Swipe the rolling pin across the dough!', '¡Estira la masa!');
      demo.value = withSequence(
        withTiming(-1, { duration: 220 }),
        withTiming(1, { duration: 360 }),
        withTiming(0, { duration: 220 }),
      );
      kitchenFeel.roll();
      addRollPass(1);
    },
  });

  const onRollPass = useCallback(
    (tapped: boolean) => {
      rollAssist.poke();
      kitchenFeel.roll();
      if (tapped) speech.stop();
      addRollPass(1);
    },
    [addRollPass, rollAssist],
  );

  const sweep = useSweepGesture({
    passDistance: ROLL_PASS_PX,
    axis: 'both',
    onPass: onRollPass,
    enabled: phase === 'roll',
  });

  /* ------------------------------------------------------------------ */
  /* Phase 1 — toppings                                                   */
  /* ------------------------------------------------------------------ */

  const pickUp = useCallback(
    (topping: ToppingId) => {
      setSelected(topping);
      const word = toppings[topping].word;
      kitchenFeel.pick(word);
      session.learnedWord(word.es);
    },
    [session],
  );

  const writeAssigned = useCallback((next: (ToppingId | null)[]) => {
    assignedRef.current = next;
    setAssigned(next);
  }, []);

  const placeTopping = useCallback(
    (region: number, topping: ToppingId) => {
      const current = assignedRef.current;
      if (region < 0 || region >= current.length) return;
      const held = current[region];
      if (held) {
        if (held === topping) {
          const next = [...current];
          next[region] = null;
          writeAssigned(next);
          sfx.play('pop');
          haptics.tap();
          return;
        }
        assist.nudge(`That slice already has ${toppingLabel(held).toLowerCase()} — try an empty one.`);
        return;
      }
      if (!canPlace(plan, current, topping)) {
        const want = challenge.toppings.find((t) => t.topping === topping);
        assist.nudge(
          `That's more than ${want ? formatFraction(want.fraction) : 'the recipe'} ${toppingLabel(topping).toLowerCase()}!`,
        );
        return;
      }
      const next = [...current];
      next[region] = topping;
      writeAssigned(next);
      kitchenFeel.drop('sizzle');
      session.correct(topping);
      if (planStatus(plan, next).complete) {
        kitchenFeel.good();
        assist.cheer('Looks delicious! Now we cut it.', '¡Qué rico!');
      }
    },
    [assist, challenge.toppings, plan, session, writeAssigned],
  );

  /**
   * `x`/`y` are relative to the pizza surface, in screen px.
   *
   * This used to read `e.nativeEvent.locationX` off a <Pressable>. On web that
   * is undefined for a mouse press, so every tap resolved to NaN and the
   * "tap a slice" affordance did nothing at all — dragging a bowl was the only
   * way to top the pizza. Gesture-handler reports view-relative coordinates on
   * every platform (the cutter below already relies on it).
   */
  const onPizzaTapAt = useCallback(
    (x: number, y: number, s: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !s) return;
      /* `s` here is screen px per PIZZA unit — the stage scale times the geo's
         own `k`, so the sauce can grow without the maths noticing. */
      const p = { x: PC.x - R_SAUCE + x / s, y: PC.y - R_SAUCE + y / s };
      const region = regionAtPoint(p, PC, R_SAUCE, count);
      if (region === null || !Number.isInteger(region)) return;
      if (assignedRef.current[region]) {
        const next = [...assignedRef.current];
        next[region] = null;
        writeAssigned(next);
        sfx.play('pop');
        haptics.tap();
        return;
      }
      if (!selected) {
        assist.cheer('Pick an ingredient bowl first!');
        return;
      }
      placeTopping(region, selected);
    },
    [assist, count, placeTopping, selected, writeAssigned],
  );

  const helpTopping = useCallback(() => {
    assist.askedForHelp();
    const needed = status.perTopping.find((p) => p.have < p.need);
    if (!needed) return;
    setSelected(needed.topping);
    const region = assignedRef.current.findIndex((a) => a === null);
    if (region < 0) return;
    const next = [...assignedRef.current];
    next[region] = needed.topping;
    writeAssigned(next);
    kitchenFeel.drop('sizzle');
  }, [assist, status.perTopping, writeAssigned]);

  /* ------------------------------------------------------------------ */
  /* Phase 2 — cutting                                                    */
  /* ------------------------------------------------------------------ */

  const finishCounting = useCallback(() => {
    setPhase(ageBand === 'A' ? 'share' : 'ask');
  }, [ageBand]);

  const startCounting = useCallback(() => {
    if (gate.current.counting) return;
    gate.current.counting = true;
    const total = challenge.cutInto;
    speech.say(`${Array.from({ length: total }, (_, i) => i + 1).join(', ')} slices!`, { speaker: 'bea' });
    for (let i = 1; i <= total; i += 1) {
      timers.after(i * 340, () => {
        setCountUpTo(i);
        sfx.play('pop');
        haptics.tap();
        if (i >= total) timers.after(700, finishCounting);
      });
    }
  }, [challenge.cutInto, finishCounting, timers]);

  const applyCut = useCallback(
    (index: number) => {
      const current = cutsRef.current;
      if (index < 0 || index >= current.length || current[index]) return;
      const next = [...current];
      next[index] = true;
      cutsRef.current = next;
      setCuts(next);
      kitchenFeel.chop();
      session.correct('cut');
      const made = next.filter(Boolean).length;
      if (made >= next.length) timers.after(420, startCounting);
      else speech.say(`${slicesFromCuts(made, challenge.cutInto)} slices`, { speaker: 'bea' });
    },
    [challenge.cutInto, session, startCounting, timers],
  );

  const cutAssist = useIdleAssist({
    active: phase === 'cut' && madeCuts < angles.length,
    firstMs: 5200,
    repeatMs: 2600,
    onHelp: (round) => {
      if (round === 1) assist.cheer('Swipe the cutter straight across the pizza!');
      const idx = nextCut(cutsRef.current);
      if (idx >= 0) applyCut(idx);
    },
  });
  cutAssistRef.current = cutAssist.poke;

  /* a cut made any way at all — knife, tap or "Show me" — resets the clock */
  useEffect(() => {
    if (madeCuts > 0) cutAssistRef.current?.();
  }, [madeCuts]);

  /**
   * FORGIVING BY DESIGN. `matchCutLine` wants a stroke that runs the whole
   * diameter and lines up with it; a five-year-old draws a short, confident
   * line somewhere across the middle and expects the pizza to fall apart.
   *
   * So the angle no longer matters at all — a stroke cuts whichever pending
   * line it came closest to — and the length it has to travel drops from most
   * of the pizza to under a fifth of it. Below that a stroke is a smudge, not a
   * cut, and Captain Bea asks for a longer one; a *tap* always cuts the next
   * line outright, which is the path for a child who cannot swipe at all.
   */
  const onCutStroke = useCallback(
    (stroke: Stroke, s: number) => {
      const scale = s || 1;
      const toDesign = (x: number, y: number) => ({ x: PC.x - R_CRUST + x / scale, y: PC.y - R_CRUST + y / scale });
      if (stroke.tapped) {
        cutAssist.poke();
        const idx = nextCut(cutsRef.current);
        if (idx >= 0) applyCut(idx);
        return;
      }
      if (stroke.length < CUT_MIN * scale) {
        assist.nudge('Swipe the cutter right across the pizza, all the way over.');
        return;
      }
      cutAssist.poke();
      const idx = chooseCutLine(toDesign(stroke.x0, stroke.y0), toDesign(stroke.x1, stroke.y1), angles, cutsRef.current);
      if (idx === null) return;
      applyCut(idx);
    },
    [angles, applyCut, assist, cutAssist],
  );

  const helpCut = useCallback(() => {
    assist.askedForHelp();
    const idx = nextCut(cutsRef.current);
    if (idx >= 0) applyCut(idx);
  }, [applyCut, assist]);

  /* ------------------------------------------------------------------ */
  /* Phase 3 — sharing                                                    */
  /* ------------------------------------------------------------------ */

  const platePointsFor = useCallback(
    (g: Geo): Pt[] => {
      const gap = (g.w - among * g.plateW) / (among + 1);
      return Array.from({ length: among }, (_, i) => ({ x: gap + i * (g.plateW + gap) + g.plateW / 2, y: g.plateY }));
    },
    [among],
  );

  const giveSlice = useCallback(
    (plateIndex: number, sliceIndex?: number) => {
      if (gate.current.shared) return;
      const current = platesRef.current;
      if (plateIndex < 0 || plateIndex >= current.length) return;
      if ((current[plateIndex] ?? 0) >= each) {
        assist.nudge(`That plate already has ${each}. Everybody gets the same!`);
        return;
      }
      const used = usedRef.current;
      const token =
        sliceIndex !== undefined && !used.includes(sliceIndex)
          ? sliceIndex
          : Array.from({ length: challenge.cutInto }, (_, i) => i).find((i) => !used.includes(i));
      if (token === undefined) return;
      usedRef.current = [...used, token];
      setUsedSlices(usedRef.current);
      const next = [...current];
      next[plateIndex] = (next[plateIndex] ?? 0) + 1;
      platesRef.current = next;
      setPlates(next);
      kitchenFeel.drop();
      session.correct('slice');
      /* NEVER A DEAD END: a challenge whose slices do not divide evenly used to
         leave the last plate one short with an empty board. Running out of
         slices ends the sharing just as fairly as filling every plate does. */
      const boardEmpty = usedRef.current.length >= challenge.cutInto;
      if (shareState(next, each).done || boardEmpty) {
        gate.current.shared = true;
        kitchenFeel.finish();
        assist.cheer(`${each} slices each — fair and square!`);
        timers.after(900, () => session.complete());
      }
    },
    [assist, challenge.cutInto, each, session, timers],
  );

  const helpShare = useCallback(() => {
    assist.askedForHelp();
    const idx = nextPlate(platesRef.current, each);
    if (idx >= 0) giveSlice(idx);
  }, [assist, each, giveSlice]);

  const answerDivision = useCallback(
    (value: number) => {
      if (gate.current.answered) return;
      if (value === each) {
        gate.current.answered = true;
        setAnswered(true);
        kitchenFeel.good();
        session.correct('division');
        timers.after(620, () => setPhase('share'));
      } else {
        setWrongAnswers((w) => (w.includes(value) ? w : [...w, value]));
        assist.nudge(`Not quite — put ${challenge.cutInto} slices onto ${among} plates and count one plate.`);
      }
    },
    [among, assist, challenge.cutInto, each, session, timers],
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                               */
  /* ------------------------------------------------------------------ */

  const helpAction =
    phase === 'roll'
      ? () => {
          assist.askedForHelp();
          addRollPass(ROLL_PASSES);
        }
      : phase === 'top'
        ? helpTopping
        : phase === 'cut'
          ? helpCut
          : phase === 'share'
            ? helpShare
            : undefined;

  const doughStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doughScale.value }, { scaleX: doughSquish.value }, { scaleY: 2 - doughSquish.value }],
  }));

  const controls = (
    <>
      <View style={styles.trayRow}>
        {phase === 'cut' ? <GrownUpChip /> : null}
        {phase === 'roll' && reduced ? (
          <Button label="Roll it out" tone="white" size="sm" onPress={() => onRollPass(true)} sound="tap-soft" />
        ) : null}
        {assist.offerHelp && helpAction ? (
          <Button label="Show me" tone="yellow" size="sm" onPress={helpAction} sound="tap-soft" />
        ) : null}
      </View>
      {phase === 'roll' ? (
        <View style={styles.meterWrap}>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.round(rolled * 100)}%` }]} />
          </View>
          <Text variant="bodyStrong" color={roles.ink.secondary}>
            {rollPasses === 0 ? 'Give it a good swipe!' : rolled >= 1 ? 'Rolled out!' : 'Keep rolling…'}
          </Text>
        </View>
      ) : phase === 'top' ? (
        <CookCTA
          label="Looks Delicious!"
          disabled={!status.complete}
          onPress={() => {
            sfx.play('page');
            setPhase('cut');
          }}
        />
      ) : phase === 'share' ? (
        <View style={styles.sliceCounter}>
          <Text variant="bodyStrong" color={roles.ink.secondary}>
            {slicesLeft} slice{slicesLeft === 1 ? '' : 's'} left · {each} for everyone
          </Text>
        </View>
      ) : phase === 'cut' ? (
        <View style={styles.sliceCounter}>
          <Text variant="bodyStrong" color={roles.ink.secondary}>
            {madeCuts} of {angles.length} cuts · {sliceCount} slice{sliceCount === 1 ? '' : 's'}
          </Text>
        </View>
      ) : null}
    </>
  );

  return (
    <ActivityFrame
      task={task}
      detail={detail}
      compact={compact}
      onReplay={replay}
      progress={{ done: STEP_OF[phase], total: 4 }}
      backdrop={<KitchenWall />}
      controls={controls}
      controlsTone="cream"
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
    >
      <View style={styles.body}>
        {/* The recipe stays up through the rolling too: the child can see what
            they are building towards while the base is still a lump, and the
            top of the board is not a blank wall. */}
        {phase === 'roll' || phase === 'top' ? (
          <View style={styles.pieRow}>
            {challenge.toppings.map((t, i) => (
              <React.Fragment key={t.topping}>
                {i > 0 ? (
                  <Text variant="h3" color={roles.ink.muted}>
                    +
                  </Text>
                ) : null}
                <Animated.View entering={FadeInDown.delay(i * 80).springify()} style={styles.fracChip}>
                  <Text variant="h2" color={palette.engineRed}>
                    {formatFraction(t.fraction)}
                  </Text>
                  <Text variant="tiny" color={roles.ink.secondary}>
                    {toppingLabel(t.topping)}
                  </Text>
                </Animated.View>
              </React.Fragment>
            ))}
            <PieIndicator
              size={64}
              count={count}
              slices={wedges.map((w) => {
                const owner = assigned[w.index] ?? null;
                const targetIndex = w.index;
                let acc = 0;
                let target: ToppingId | null = null;
                for (const p of plan) {
                  if (targetIndex < acc + p.need) {
                    target = p.topping;
                    break;
                  }
                  acc += p.need;
                }
                return { topping: owner ?? target, filled: owner !== null };
              })}
            />
          </View>
        ) : phase === 'share' || phase === 'ask' ? (
          <View style={styles.pieRow}>
            <EquationStrip text={equationText(challenge.cutInto, among, answered ? each : null)} tone="gold" />
          </View>
        ) : phase === 'cut' ? (
          <View style={styles.pieRow}>
            <EquationStrip text={`${sliceCount} of ${challenge.cutInto} slices`} />
          </View>
        ) : null}

        <FluidStage minH={360} maxScale={1.8} style={styles.stage}>
          {(box) => {
            const g = pizzaLayout(box, box.w > box.h * 0.92);
            const s = box.s;
            const platePoints = platePointsFor(g);
            /* play-area units → the pizza's own space, for the hit tests */
            const toPizza = (fx: number, fy: number): Pt => ({
              x: PC.x + (fx - g.cx) / g.k,
              y: PC.y + (fy - g.cy) / g.k,
            });
            const side = Math.max(0, g.board.x - 8);
            return (
            <>
              {/* --- the room ------------------------------------- */}
              <SplashbackBand s={s} x={0} y={g.counterY - 52} w={g.w} depth={52} />
              {g.board.y > 76 ? (
                <>
                  <Shelf s={s} x={8} y={g.board.y - 34} w={Math.max(76, side + 44)} />
                  <StoreJar s={s} x={12} y={g.board.y - 74} h={40} tone="jam" />
                  <KitchenWindow s={s} x={g.rack.x - 108} y={6} w={100} />
                </>
              ) : null}
              <UtensilRail s={s} x={8} y={6} w={Math.min(126, g.w * 0.3)} />
              {/* the rack column is scene, not just a control: when the bowls
                  are away it is a shelf of store jars, so the pizza never sits
                  beside a bare strip of wall */}
              {phase === 'top' ? null : (
                <>
                  <Shelf s={s} x={g.rack.x - 4} y={g.rack.y + g.rack.h * 0.34} w={g.rack.w + 8} />
                  <StoreJar s={s} x={g.rack.x} y={g.rack.y + g.rack.h * 0.34 - 46} h={46} tone="honey" />
                  <StoreJar s={s} x={g.rack.x + g.rack.w * 0.5} y={g.rack.y + g.rack.h * 0.34 - 42} h={42} tone="herbs" />
                  <Shelf s={s} x={g.rack.x - 4} y={g.rack.y + g.rack.h * 0.68} w={g.rack.w + 8} />
                  <StoreJar s={s} x={g.rack.x} y={g.rack.y + g.rack.h * 0.68 - 44} h={44} tone="berry" />
                  <StoreJar s={s} x={g.rack.x + g.rack.w * 0.5} y={g.rack.y + g.rack.h * 0.68 - 40} h={40} tone="oats" />
                </>
              )}
              <CounterRun s={s} w={g.w} y={g.counterY} h={g.counterH + 44} />
              <CounterCrumbs s={s} x={g.cx - g.r} y={g.counterY - 10} w={g.r * 2} seed={8} />
              <HerbPot s={s} x={6} y={g.counterY - 44} h={42} />
              <TeaTowel s={s} x={g.w - 46} y={Math.max(6, g.counterY - 160)} w={38} />
              <CheckerCloth width={g.r * 0.8 * s} height={g.r * 0.7 * s} style={at(s, -8, g.counterY - g.r * 0.5)} />

              {phase === 'share' ? (
                <ShareScene
                  geo={g}
                  plates={plates}
                  each={each}
                  total={challenge.cutInto}
                  used={usedSlices}
                  platePoints={platePoints}
                  highlight={assist.highlight || ageBand === 'A'}
                  onGive={giveSlice}
                  onMiss={() => assist.cheer('Drop the slice right onto a plate.')}
                />
              ) : phase === 'ask' ? (
                <View style={[at(s, 12, g.askY, g.w - 24), styles.answerWrap]}>
                  {answerOptions(each).map((value, i) => (
                    <AnswerTile
                      key={value}
                      label={String(value)}
                      index={i}
                      size="lg"
                      state={wrongAnswers.includes(value) ? 'wrong' : assist.highlight && value === each ? 'highlight' : 'idle'}
                      onPress={() => answerDivision(value)}
                    />
                  ))}
                </View>
              ) : (
                <>
                  <View style={at(s, g.cx - g.r * 0.95, g.cy - g.r * 0.99, g.r * 1.9)} pointerEvents="none">
                    <WoodPeel size={g.r * 1.9 * s} />
                  </View>

                  {phase === 'roll' ? (
                    <>
                      <Animated.View
                        style={[at(s, g.cx - g.r, g.cy - g.r, g.r * 2, g.r * 2), doughStyle]}
                        pointerEvents="none"
                      >
                        <DoughArt size={g.r * 2 * s} thick={1 - rolled} />
                      </Animated.View>
                      <RollSurface geo={g} sweep={sweep} demo={demo} showHint={rollPasses === 0} />
                    </>
                  ) : (
                    <>
                      <View style={at(s, g.cx - g.r, g.cy - g.r, g.r * 2, g.r * 2)} pointerEvents="none">
                        <PizzaArt
                          size={g.r * 2 * s}
                          count={count}
                          assigned={assigned}
                          cuts={cuts}
                          angles={angles}
                          phase={phase}
                          countUpTo={countUpTo}
                          highlightRegion={
                            phase === 'top'
                              ? hoverRegion >= 0
                                ? hoverRegion
                                : assist.highlight
                                  ? assigned.findIndex((a) => a === null)
                                  : -1
                              : -1
                          }
                          highlightCut={phase === 'cut' ? nextCut(cuts) : -1}
                        />
                      </View>

                      {phase === 'top' ? (
                        <PizzaSurface geo={g} onTapAt={onPizzaTapAt} />
                      ) : phase === 'cut' ? (
                        <CutSurface geo={g} onStroke={onCutStroke} showHint={madeCuts === 0} angles={angles} cuts={cuts} />
                      ) : null}
                    </>
                  )}
                </>
              )}

              {phase === 'top' ? (
                <ToppingRack
                  geo={g}
                  selected={selected}
                  plan={status.perTopping}
                  onPick={pickUp}
                  onHover={(topping, dx, dy, home) => {
                    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
                      setHoverRegion(-1);
                      return;
                    }
                    const region = regionAtPoint(toPizza(home.x + dx, home.y + dy), PC, R_SAUCE, count);
                    setHoverRegion(region === null ? -1 : region);
                  }}
                  onDrop={(topping, dx, dy, home) => {
                    setHoverRegion(-1);
                    const p = toPizza(home.x + dx, home.y + dy);
                    const region = regionAtPoint(p, PC, R_SAUCE, count);
                    if (region === null) {
                      assist.cheer('Drop it right on the pizza!');
                      return;
                    }
                    placeTopping(region, topping);
                  }}
                />
              ) : null}

              {/* the cutter lies on the counter beside the peel the whole time,
                  as in the reference — it is scene dressing, not a mode marker */}
              {phase === 'roll' ? null : (
                <View style={at(s, 12, g.counterY - g.r * 0.42)} pointerEvents="none">
                  <PizzaCutter size={g.r * (phase === 'cut' ? 0.78 : 0.66) * s} />
                </View>
              )}
            </>
            );
          }}
        </FluidStage>
      </View>
    </ActivityFrame>
  );
}

/* ------------------------------------------------------------------ */
/* The ball of dough, before it is a pizza                              */
/* ------------------------------------------------------------------ */

/**
 * One ball of dough, drawn at full pizza size and *scaled* by the caller as it
 * is rolled — so the flattening is a transform on the UI thread, not a re-draw.
 * `thick` (1 → 0) fades the dome and the shadow, which is what actually reads
 * as "this used to be a lump and now it is a base".
 */
function DoughArt({ size, thick }: { size: number; thick: number }) {
  const box = R_CRUST * 2;
  const vb = `${PC.x - R_CRUST} ${PC.y - R_CRUST} ${box} ${box}`;
  const dome = Math.max(0, Math.min(1, thick));
  return (
    <Svg width={size} height={size} viewBox={vb}>
      <Defs>
        <RadialGradient id="dough" cx="42%" cy="36%" r="70%">
          <Stop offset="0" stopColor="#FBEED4" />
          <Stop offset="1" stopColor="#E7CFA2" />
        </RadialGradient>
      </Defs>
      <Circle cx={PC.x} cy={PC.y + 6 + dome * 6} r={R_CRUST * (0.96 - dome * 0.06)} fill="rgba(31,42,90,0.16)" />
      <Circle cx={PC.x} cy={PC.y} r={R_CRUST} fill="#D8B87E" />
      <Circle cx={PC.x} cy={PC.y - dome * 4} r={R_CRUST - 4} fill="url(#dough)" />
      {/* the dome: strongest when the dough is still a lump */}
      <Circle cx={PC.x - 26} cy={PC.y - 30} r={R_CRUST * (0.42 + dome * 0.12)} fill="rgba(255,255,255,0.34)" opacity={0.35 + dome * 0.5} />
      {/* flour dusted over the top */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = i * 2.399963;
        const rr = R_CRUST * 0.82 * Math.sqrt((i + 0.5) / 16);
        const p = polar(PC, rr, a);
        return <Circle key={`fl${i}`} cx={p.x} cy={p.y} r={3 + (i % 3)} fill="rgba(255,255,255,0.6)" />;
      })}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* The rolling board: swipe anywhere across it                          */
/* ------------------------------------------------------------------ */

function RollSurface({
  geo,
  sweep,
  demo,
  showHint,
}: {
  geo: Geo;
  sweep: ReturnType<typeof useSweepGesture>;
  demo: SharedValue<number>;
  showHint: boolean;
}) {
  const { s, board } = geo;
  const w = board.w * s;
  const h = board.h * s;
  const pinW = geo.r * 1.4 * s;
  const pinH = pinW * 0.42;
  const restX = w / 2;
  const restY = h * 0.46;
  /* the pin rocks over the dough on its own: the gesture, demonstrated, before
     anybody has touched anything. It stops dead under reduced motion. */
  const idle = useSwing(1, 2100);

  const pinStyle = useAnimatedStyle(() => {
    const t = sweep.active.value;
    const held = 1 - t;
    const px = restX + (sweep.x.value - restX) * t + (idle.value * w * 0.16 + demo.value * w * 0.26) * held;
    const py = restY + (sweep.y.value - restY) * t;
    return {
      transform: [
        { translateX: px - pinW / 2 },
        { translateY: py - pinH / 2 },
        { rotate: `${(sweep.heading.value * 3 * t + idle.value * 2 * held).toFixed(2)}deg` },
        { scale: 1 + t * 0.06 },
      ],
    };
  });

  return (
    <GestureDetector gesture={sweep.gesture}>
      <View
        accessibilityRole="button"
        accessibilityLabel="Dough — swipe the rolling pin back and forth to roll it out, or tap it"
        style={at(s, board.x, board.y, board.w, board.h)}
      >
        {showHint ? <SweepHint width={w} height={h} /> : null}
        <Animated.View style={[styles.pin, pinStyle]} pointerEvents="none">
          <RollingPin size={pinW} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/* ------------------------------------------------------------------ */
/* The pizza itself                                                     */
/* ------------------------------------------------------------------ */

function PizzaArt({
  size,
  count,
  assigned,
  cuts,
  angles,
  phase,
  countUpTo,
  highlightRegion,
  highlightCut,
}: {
  size: number;
  count: number;
  assigned: (ToppingId | null)[];
  cuts: boolean[];
  angles: number[];
  phase: Phase;
  countUpTo: number;
  highlightRegion: number;
  highlightCut: number;
}) {
  const wedges = buildWedges(count);
  const box = R_CRUST * 2;
  const vb = `${PC.x - R_CRUST} ${PC.y - R_CRUST} ${box} ${box}`;
  return (
    <Svg width={size} height={size} viewBox={vb}>
      <Defs>
        <RadialGradient id="sauce" cx="50%" cy="45%" r="65%">
          <Stop offset="0" stopColor="#F4604F" />
          <Stop offset="1" stopColor="#D8382B" />
        </RadialGradient>
      </Defs>
      {/* critique #18: a golden PUFFY crust (scalloped, three tones), real
          sauce, and a bed of shredded cheese — it used to be a red disc with
          faint dots and a keyline. No outlines: value does the separating. */}
      <Circle cx={PC.x} cy={PC.y + 5} r={R_CRUST} fill="rgba(31,42,90,0.14)" />
      <Circle cx={PC.x} cy={PC.y} r={R_CRUST} fill="#D89845" />
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const p = polar(PC, R_CRUST - 7, a);
        return <Circle key={`puff${i}`} cx={p.x} cy={p.y} r={11} fill="#F0B865" />;
      })}
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2 - 0.06;
        const p = polar(PC, R_CRUST - 10, a);
        return a > Math.PI * 0.9 && a < Math.PI * 1.9 ? null : (
          <Circle key={`puffhi${i}`} cx={p.x} cy={p.y - 3} r={5} fill="rgba(255,255,255,0.32)" />
        );
      })}
      <Circle cx={PC.x} cy={PC.y} r={R_SAUCE + 6} fill="#E9A94F" />
      <Circle cx={PC.x} cy={PC.y} r={R_SAUCE} fill="url(#sauce)" />
      {/* shredded mozzarella */}
      {Array.from({ length: 54 }, (_, i) => {
        const a = i * 2.399963;
        const rr = R_SAUCE * 0.94 * Math.sqrt((i + 0.5) / 54);
        const p = polar(PC, rr, a);
        const deg = ((i * 47) % 180) - 90;
        return (
          <Rect
            key={`ch${i}`}
            x={p.x - 8}
            y={p.y - 2.6}
            width={16}
            height={5.2}
            rx={2.6}
            fill={i % 3 === 0 ? '#FFE9A8' : '#FFD86B'}
            transform={`rotate(${deg} ${p.x} ${p.y})`}
          />
        );
      })}
      <Circle cx={PC.x} cy={PC.y} r={R_SAUCE} fill="rgba(255,255,255,0.1)" />

      {wedges.map((w) => {
        const topping = assigned[w.index];
        if (!topping) return null;
        return <ToppingRegion key={`w${w.index}`} topping={topping} wedge={w} center={PC} radius={R_SAUCE} />;
      })}

      {highlightRegion >= 0 && wedges[highlightRegion] ? (
        <Path
          d={wedgePath(PC, R_SAUCE, wedges[highlightRegion].start, wedges[highlightRegion].end)}
          fill="rgba(255,199,44,0.22)"
          stroke={palette.safetyYellow}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      ) : null}

      {/* dashed region dividers */}
      {phase === 'top'
        ? wedges.map((w) => {
            const a = polar(PC, R_SAUCE, w.start);
            return (
              <Path
                key={`d${w.index}`}
                d={`M ${PC.x} ${PC.y} L ${a.x} ${a.y}`}
                stroke={palette.white}
                strokeWidth={4}
                strokeDasharray="9 8"
                strokeLinecap="round"
              />
            );
          })
        : null}

      {/* cut guides + real cuts */}
      {phase !== 'top'
        ? angles.map((a, i) => {
            const p1 = polar(PC, R_CRUST - 3, a);
            const p2 = polar(PC, R_CRUST - 3, a + Math.PI);
            const done = cuts[i];
            return (
              <Path
                key={`c${i}`}
                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                stroke={done ? '#8A4A22' : i === highlightCut ? palette.safetyYellow : 'rgba(255,255,255,0.9)'}
                strokeWidth={done ? 5 : i === highlightCut ? 6 : 4}
                strokeDasharray={done ? undefined : '10 9'}
                strokeLinecap="round"
                opacity={done ? 0.85 : 1}
              />
            );
          })
        : null}

      {/* counting the slices out loud */}
      {countUpTo > 0
        ? buildWedges(Math.max(1, angles.length * 2)).slice(0, countUpTo).map((w) => (
            <Path
              key={`n${w.index}`}
              d={wedgePath(PC, R_SAUCE, w.start + 0.05, w.end - 0.05)}
              fill={palette.safetyYellow}
              opacity={0.28}
            />
          ))
        : null}
      <Rect x={PC.x - 1} y={PC.y - 1} width={2} height={2} fill="transparent" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Topping surface: a tap anywhere on the sauce                         */
/* ------------------------------------------------------------------ */

/** The tappable sauce. Reports view-relative coordinates on every platform. */
function PizzaSurface({ geo, onTapAt }: { geo: Geo; onTapAt: (x: number, y: number, s: number) => void }) {
  /* screen px per PIZZA unit — one number, and the maths stays in its own space */
  const px = geo.s * geo.k;
  const rSauce = R_SAUCE * geo.k;
  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(20)
        .onEnd((e, ok) => {
          if (ok) runOnJS(onTapAt)(e.x, e.y, px);
        }),
    [onTapAt, px],
  );
  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityRole="button"
        accessibilityLabel="Pizza — tap a slice to add the ingredient you picked"
        style={at(geo.s, geo.cx - rSauce, geo.cy - rSauce, rSauce * 2, rSauce * 2)}
      />
    </GestureDetector>
  );
}

/* ------------------------------------------------------------------ */
/* Cutting surface: a knife stroke across the pizza                     */
/* ------------------------------------------------------------------ */

function CutSurface({
  geo,
  onStroke,
  showHint,
  angles,
  cuts,
}: {
  geo: Geo;
  onStroke: (stroke: Stroke, s: number) => void;
  showHint: boolean;
  angles: number[];
  cuts: boolean[];
}) {
  const s = geo.s;
  const px = geo.s * geo.k;
  const box = R_CRUST * 2;
  const report = useCallback((stroke: Stroke) => onStroke(stroke, px), [onStroke, px]);
  const stroke = useStrokeGesture({ onStroke: report, tapSlop: CUT_TAP_SLOP * (px || 1) });

  const cutterStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + stroke.active.value * 0.75,
    transform: [
      { translateX: stroke.x.value - geo.r * 0.23 * s },
      { translateY: stroke.y.value - geo.r * 0.18 * s },
      { scale: 0.8 + stroke.active.value * 0.2 },
    ],
  }));

  const next = nextCut(cuts);
  const guide = next >= 0 ? angles[next] : undefined;
  const a = guide === undefined ? undefined : polar({ x: R_CRUST, y: R_CRUST }, R_CRUST - 6, guide);
  const b = guide === undefined ? undefined : polar({ x: R_CRUST, y: R_CRUST }, R_CRUST - 6, guide + Math.PI);

  return (
    <GestureDetector gesture={stroke.gesture}>
      <View
        style={at(s, geo.cx - geo.r, geo.cy - geo.r, geo.r * 2, geo.r * 2)}
        accessibilityRole="button"
        accessibilityLabel="Drag the cutter across the pizza"
      >
        {showHint && a && b ? (
          <CutHint x1={a.x * px} y1={a.y * px} x2={b.x * px} y2={b.y * px} width={box * px} height={box * px} />
        ) : null}
        <Animated.View style={[styles.floatingCutter, cutterStyle]} pointerEvents="none">
          <PizzaCutter size={geo.r * 0.6 * s} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/* ------------------------------------------------------------------ */
/* Ingredient rack                                                      */
/* ------------------------------------------------------------------ */

function ToppingRack({
  geo,
  selected,
  plan,
  onPick,
  onDrop,
  onHover,
}: {
  geo: Geo;
  selected: ToppingId | null;
  plan: { topping: ToppingId; need: number; have: number; done: boolean }[];
  onPick: (t: ToppingId) => void;
  onDrop: (t: ToppingId, dx: number, dy: number, home: Pt) => void;
  onHover: (t: ToppingId, dx: number, dy: number, home: Pt) => void;
}) {
  const { s, rack } = geo;
  const n = Math.max(1, plan.length);
  const cellH = Math.min(rack.w * 1.1, (rack.h - 16 - (n - 1) * 8) / n);
  return (
    <View style={at(s, rack.x, rack.y, rack.w, rack.h)}>
      <View style={[styles.rack, { borderRadius: 18 * s, borderWidth: 4 * s }]} pointerEvents="none" />
      {plan.map((p, i) => {
        const y = 8 + i * (cellH + 8);
        const home: Pt = { x: rack.x + rack.w / 2, y: rack.y + y + cellH / 2 };
        return (
          <RackBowl
            key={p.topping}
            s={s}
            x={8}
            y={y}
            width={rack.w - 16}
            topping={p.topping}
            selected={selected === p.topping}
            done={p.done}
            onPick={() => onPick(p.topping)}
            onDrop={(dx, dy) => onDrop(p.topping, dx, dy, home)}
            onHover={(dx, dy) => onHover(p.topping, dx, dy, home)}
          />
        );
      })}
    </View>
  );
}

function RackBowl({
  s,
  x,
  y,
  width,
  topping,
  selected,
  done,
  onPick,
  onDrop,
  onHover,
}: {
  s: number;
  x: number;
  y: number;
  width: number;
  topping: ToppingId;
  selected: boolean;
  done: boolean;
  onPick: () => void;
  onDrop: (dx: number, dy: number) => void;
  onHover: (dx: number, dy: number) => void;
}) {
  const drag = useDragSource({ scale: s, onPickUp: onPick, onTap: onPick, onDrop, onMove: onHover });
  return (
    <GestureDetector gesture={drag.gesture}>
      <Animated.View style={[at(s, x, y, width), drag.style]} accessibilityRole="button" accessibilityLabel={toppingLabel(topping)}>
        <BowlCell
          word={toppings[topping].word}
          glyphId={topping}
          width={width * s}
          label={toppingLabel(topping)}
          selected={selected}
          dim={done}
        />
      </Animated.View>
    </GestureDetector>
  );
}

/* ------------------------------------------------------------------ */
/* Share scene                                                          */
/* ------------------------------------------------------------------ */

function ShareScene({
  geo,
  plates,
  each,
  total,
  used,
  platePoints,
  highlight,
  onGive,
  onMiss,
}: {
  geo: Geo;
  plates: number[];
  each: number;
  total: number;
  used: number[];
  platePoints: Pt[];
  highlight: boolean;
  onGive: (plate: number, slice?: number) => void;
  onMiss: () => void;
}) {
  const { s, w, plateW } = geo;
  const nextIdx = nextPlate(plates, each);
  const [hover, setHover] = useState(-1);
  const pileY = geo.pileY;
  const perRow = Math.min(total, 7);
  const tokenW = Math.max(38, Math.min(58, (w - 24) / perRow - 5));
  const startX = (w - perRow * (tokenW + 4)) / 2;
  const figure = plateW * 1.05;

  return (
    <>
      {platePoints.map((p, i) => {
        const n = plates[i] ?? 0;
        const glow = (highlight && i === nextIdx) || hover === i;
        return (
          <View
            key={`plate${i}`}
            style={at(s, p.x - plateW / 2, p.y - figure - plateW * 0.16, plateW, figure + plateW * 1.1)}
          >
            <View style={styles.plateCol}>
              {/* critique #23 — the full rig stands at the plate */}
              <CrewFigure {...(CREW[i % CREW.length] ?? CREW[0])} size={figure * s} bobPhase={i * 0.5} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Plate ${i + 1}, ${n} slices`}
                onPress={() => onGive(i)}
                style={[styles.plateHit, glow && styles.plateGlow, { borderRadius: 18 * s }]}
              >
                <PlateArt size={plateW * 0.96 * s} />
                <View style={styles.plateCount}>
                  <Text variant="h3" color={n === each ? palette.leafGreenDark : palette.navy}>
                    {n}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        );
      })}

      {Array.from({ length: total }, (_, i) => i)
        .filter((i) => !used.includes(i))
        .map((i) => {
          const row = Math.floor(i / 7);
          const col = i % 7;
          const x = startX + col * (tokenW + 4);
          const y = pileY + row * (tokenW * 0.22);
          return (
            <SliceToken
              key={`slice${i}`}
              s={s}
              x={x}
              y={y}
              width={tokenW}
              onHover={(dx, dy) => {
                if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
                  setHover(-1);
                  return;
                }
                setHover(nearestTarget({ x: x + tokenW / 2 + dx, y: y + tokenW / 2 + dy }, platePoints, plateW));
              }}
              onDrop={(dx, dy) => {
                setHover(-1);
                const p = { x: x + tokenW / 2 + dx, y: y + tokenW / 2 + dy };
                const idx = nearestTarget(p, platePoints, plateW);
                if (idx < 0) onMiss();
                else onGive(idx, i);
              }}
              onTap={() => {
                const idx = nextPlate(plates, each);
                if (idx >= 0) onGive(idx, i);
              }}
            />
          );
        })}
    </>
  );
}

function SliceToken({
  s,
  x,
  y,
  width,
  onDrop,
  onTap,
  onHover,
}: {
  s: number;
  x: number;
  y: number;
  width: number;
  onDrop: (dx: number, dy: number) => void;
  onTap: () => void;
  onHover: (dx: number, dy: number) => void;
}) {
  const drag = useDragSource({
    scale: s,
    onPickUp: () => {
      sfx.play('tap-soft');
      haptics.select();
    },
    onTap,
    onDrop,
    onMove: onHover,
  });
  // Outer node owns the entrance (layout) animation, inner node owns the drag
  // transform — Reanimated warns and can drop one of them if they share a node.
  return (
    <Animated.View entering={ZoomIn.springify().damping(14)} style={at(s, x, y, width, width)}>
      <GestureDetector gesture={drag.gesture}>
        <Animated.View style={drag.style} accessibilityRole="button" accessibilityLabel="Pizza slice">
          <Svg width={width * s} height={width * s} viewBox="0 0 46 46">
            <Path d="M23 3 L43 39 A22 22 0 0 1 3 39 Z" fill="#F0B865" />
            <Path d="M23 9 L39 37 A19 19 0 0 1 7 37 Z" fill="#E8543F" />
            <Circle cx={20} cy={28} r={3.4} fill="#FFDF7A" />
            <Circle cx={29} cy={33} r={3} fill="#FFDF7A" />
            <Circle cx={25} cy={20} r={2.6} fill="#FFDF7A" />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  stage: { flex: 1 },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  fracChip: {
    backgroundColor: roles.surface.card,
    borderRadius: radii.tile,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    ...shadows.soft,
  },
  rack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: palette.tan,
    borderColor: palette.tanDark,
  },
  answerWrap: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, flexWrap: 'nowrap' },
  plateCol: { alignItems: 'center', gap: 2 },
  plateHit: { alignItems: 'center', justifyContent: 'center', padding: 4, borderWidth: 3, borderColor: 'transparent' },
  plateGlow: { borderColor: palette.safetyYellow, backgroundColor: 'rgba(255,199,44,0.18)' },
  plateCount: { position: 'absolute', alignSelf: 'center' },
  floatingCutter: { position: 'absolute', left: 0, top: 0 },
  pin: { position: 'absolute', left: 0, top: 0 },
  trayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 4,
  },
  sliceCounter: { alignItems: 'center', paddingVertical: spacing.xs },
  meterWrap: { alignItems: 'center', gap: 6, paddingVertical: spacing.xs },
  meterTrack: {
    width: '76%',
    height: 14,
    borderRadius: 7,
    backgroundColor: roles.surface.sunken,
    overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: 7, backgroundColor: palette.leafGreen },
});
