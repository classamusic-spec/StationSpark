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
  withTiming,
} from 'react-native-reanimated';
import type { ToppingId } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing } from '@/theme';
import { formatFraction } from '@/utils/fractions';
import { speech } from '@/services/speech';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { PromptBanner } from '@/ui/kit/PromptBanner';
import { AnswerTile } from '@/ui/kit/AnswerTile';
import { GrownUpChip } from '@/ui/kit/Chip';
import { HintBubble } from '@/ui/kit/HintBubble';
import { Tray } from '@/ui/kit/Tray';

import { Stage as SceneStage } from '@/world';
import { CrewFigure, SceneCrew } from '@/world/scenes';
import { toppingLabel, toppings } from '../../food';
import {
  buildWedges,
  canPlace,
  cutAngles,
  matchCutLine,
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
import { Stage, at } from '../../parts/Stage';
import { BowlCell, PieIndicator, PlateArt, ToppingRegion } from '../../parts/FoodBits';
import { CheckerCloth, CookCTA, EquationStrip, PizzaCutter, WoodPeel } from '../../parts/SceneBits';
import { kitchenFeel, nearestTarget, useBeaconHint, useDragSource } from '../useKitchenGame';

/* ---- the 390 × 430 design box the scene is painted in ---- */
const D = { w: 390, h: 430 };
const PC: Pt = { x: 150, y: 198 };
const R_CRUST = 122;
const R_SAUCE = 107;
const RACK = { x: 284, y: 6, w: 100, h: 418 };
const CREW = ['rookie', 'bea', 'beacon', 'pepper'] as const;

type Phase = 'top' | 'cut' | 'ask' | 'share';

export function PizzaFractions({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'pizza-fractions'>) {
  const session = useMiniGameSession('pizza-fractions', onComplete, onEvent);
  const beacon = useBeaconHint(session);

  const count = useMemo(() => regionCount(challenge.toppings), [challenge.toppings]);
  const wedges = useMemo(() => buildWedges(count), [count]);
  const plan = useMemo(() => toppingPlan(challenge.toppings, count), [challenge.toppings, count]);
  const angles = useMemo(() => cutAngles(challenge.cutInto), [challenge.cutInto]);
  const among = Math.max(1, challenge.shareAmong);
  const each = Math.max(1, challenge.each || Math.floor(challenge.cutInto / among));

  const [phase, setPhase] = useState<Phase>('top');
  const [assigned, setAssigned] = useState<(ToppingId | null)[]>(() => Array.from({ length: count }, () => null));
  const [selected, setSelected] = useState<ToppingId | null>(null);
  const [cuts, setCuts] = useState<boolean[]>(() => angles.map(() => false));
  const [countUpTo, setCountUpTo] = useState(0);
  const [plates, setPlates] = useState<number[]>(() => Array.from({ length: among }, () => 0));
  const [usedSlices, setUsedSlices] = useState<number[]>([]);
  const [answered, setAnswered] = useState(ageBand === 'A');
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const counting = useRef<ReturnType<typeof setInterval> | null>(null);

  const status = useMemo(() => planStatus(plan, assigned), [plan, assigned]);
  const madeCuts = cuts.filter(Boolean).length;
  const sliceCount = slicesFromCuts(madeCuts, challenge.cutInto);
  const placedSlices = plates.reduce((a, b) => a + b, 0);
  const slicesLeft = Math.max(0, challenge.cutInto - placedSlices);

  const recipeLine = useMemo(
    () => challenge.toppings.map((t) => `${formatFraction(t.fraction)} ${toppings[t.topping].word.en}`).join(' and '),
    [challenge.toppings],
  );

  /* ---- spoken prompts on every phase change ---- */
  useEffect(() => {
    const line =
      phase === 'top'
        ? `Make ${recipeLine}`
        : phase === 'cut'
          ? `Cut into ${challenge.cutInto} equal slices`
          : phase === 'ask'
            ? `${challenge.cutInto} slices shared by ${among}. How many each?`
            : `Share among ${among} crew members`;
    speech.say(line, { speaker: 'bea' });
    session.progress(phase === 'top' ? 1 : phase === 'cut' ? 2 : 3, 3);
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(
    () => () => {
      if (counting.current) clearInterval(counting.current);
    },
    [],
  );

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

  const placeTopping = useCallback(
    (region: number, topping: ToppingId) => {
      const held = assigned[region];
      if (held) {
        if (held === topping) {
          const next = [...assigned];
          next[region] = null;
          setAssigned(next);
          sfx.play('pop');
          haptics.tap();
        } else {
          beacon.nudge(`That slice already has ${toppingLabel(held).toLowerCase()} — try an empty one.`);
        }
        return;
      }
      if (!canPlace(plan, assigned, topping)) {
        const want = challenge.toppings.find((t) => t.topping === topping);
        beacon.nudge(
          `That's more than ${want ? formatFraction(want.fraction) : 'the recipe'} ${toppingLabel(topping).toLowerCase()}!`,
        );
        return;
      }
      const next = [...assigned];
      next[region] = topping;
      setAssigned(next);
      kitchenFeel.drop('sizzle');
      session.correct(topping);
      if (planStatus(plan, next).complete) {
        kitchenFeel.good();
        beacon.cheer('Looks delicious! Now we cut it.', '¡Qué rico!');
      }
    },
    [assigned, beacon, challenge.toppings, plan, session],
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
      const p = { x: PC.x - R_SAUCE + x / s, y: PC.y - R_SAUCE + y / s };
      const region = regionAtPoint(p, PC, R_SAUCE, count);
      if (region === null || !Number.isInteger(region)) return;
      if (assigned[region]) {
        const next = [...assigned];
        next[region] = null;
        setAssigned(next);
        sfx.play('pop');
        haptics.tap();
        return;
      }
      if (!selected) {
        beacon.cheer('Pick an ingredient bowl first!');
        return;
      }
      placeTopping(region, selected);
    },
    [assigned, beacon, count, placeTopping, selected],
  );

  const helpTopping = useCallback(() => {
    beacon.askedForHelp();
    const needed = status.perTopping.find((p) => p.have < p.need);
    const region = assigned.findIndex((a) => a === null);
    if (!needed || region < 0) return;
    const next = [...assigned];
    next[region] = needed.topping;
    setAssigned(next);
    setSelected(needed.topping);
    kitchenFeel.drop('sizzle');
  }, [assigned, beacon, status.perTopping]);

  /* ------------------------------------------------------------------ */
  /* Phase 2 — cutting                                                    */
  /* ------------------------------------------------------------------ */

  const finishCounting = useCallback(() => {
    setPhase(ageBand === 'A' ? 'share' : 'ask');
  }, [ageBand]);

  const startCounting = useCallback(() => {
    const total = challenge.cutInto;
    speech.say(
      `${Array.from({ length: total }, (_, i) => i + 1).join(', ')} slices!`,
      { speaker: 'beacon' },
    );
    let i = 0;
    if (counting.current) clearInterval(counting.current);
    counting.current = setInterval(() => {
      i += 1;
      setCountUpTo(i);
      sfx.play('pop');
      haptics.tap();
      if (i >= total) {
        if (counting.current) clearInterval(counting.current);
        counting.current = null;
        setTimeout(finishCounting, 700);
      }
    }, 340);
  }, [challenge.cutInto, finishCounting]);

  const applyCut = useCallback(
    (index: number) => {
      const next = [...cuts];
      next[index] = true;
      setCuts(next);
      sfx.play('chop');
      haptics.thud();
      session.correct('cut');
      const made = next.filter(Boolean).length;
      const slices = slicesFromCuts(made, challenge.cutInto);
      if (made >= next.length) {
        setTimeout(startCounting, 380);
      } else {
        speech.say(`${slices} slices`, { speaker: 'beacon' });
      }
    },
    [challenge.cutInto, cuts, session, startCounting],
  );

  const onStroke = useCallback(
    (x0: number, y0: number, x1: number, y1: number) => {
      // a tap or a twitch is not a mistake — it is a child finding the cutter
      if (Math.hypot(x1 - x0, y1 - y0) < 14) return;
      const idx = matchCutLine({ x: x0, y: y0 }, { x: x1, y: y1 }, PC, R_SAUCE, angles);
      if (idx === null) {
        beacon.nudge('Roll the cutter all the way across a dotted line.');
        return;
      }
      if (cuts[idx]) {
        beacon.nudge('That one is cut already — try another dotted line.');
        return;
      }
      applyCut(idx);
    },
    [angles, applyCut, beacon, cuts],
  );

  const helpCut = useCallback(() => {
    beacon.askedForHelp();
    const idx = cuts.findIndex((c) => !c);
    if (idx >= 0) applyCut(idx);
  }, [applyCut, beacon, cuts]);

  /* ------------------------------------------------------------------ */
  /* Phase 3 — sharing                                                    */
  /* ------------------------------------------------------------------ */

  const platePoints = useMemo(() => {
    const w = 86;
    const gap = (D.w - among * w) / (among + 1);
    return Array.from({ length: among }, (_, i) => ({ x: gap + i * (w + gap) + w / 2, y: 250 }));
  }, [among]);

  const giveSlice = useCallback(
    (plateIndex: number, sliceIndex?: number) => {
      if (slicesLeft <= 0) return;
      if ((plates[plateIndex] ?? 0) >= each) {
        beacon.nudge(`That plate already has ${each}. Everybody gets the same!`);
        return;
      }
      const token = sliceIndex ?? Array.from({ length: challenge.cutInto }, (_, i) => i).find((i) => !usedSlices.includes(i));
      if (token === undefined) return;
      setUsedSlices((u) => (u.includes(token) ? u : [...u, token]));
      const next = [...plates];
      next[plateIndex] = (next[plateIndex] ?? 0) + 1;
      setPlates(next);
      kitchenFeel.drop();
      session.correct('slice');
      const done = shareState(next, each).done;
      if (done) {
        kitchenFeel.finish();
        beacon.cheer(`${each} slices each — fair and square!`);
        setTimeout(() => session.complete(), 900);
      }
    },
    [beacon, challenge.cutInto, each, plates, session, slicesLeft, usedSlices],
  );

  const helpShare = useCallback(() => {
    beacon.askedForHelp();
    const idx = nextPlate(plates, each);
    if (idx >= 0) giveSlice(idx);
  }, [beacon, each, giveSlice, plates]);

  const answerDivision = useCallback(
    (value: number) => {
      if (value === each) {
        setAnswered(true);
        kitchenFeel.good();
        session.correct('division');
        setTimeout(() => setPhase('share'), 620);
      } else {
        setWrongAnswers((w) => (w.includes(value) ? w : [...w, value]));
        beacon.nudge(`Not quite — put ${challenge.cutInto} slices onto ${among} plates and count one plate.`);
      }
    },
    [among, beacon, challenge.cutInto, each, session],
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                               */
  /* ------------------------------------------------------------------ */

  const prompt =
    phase === 'top'
      ? `Make ${recipeLine}`
      : phase === 'cut'
        ? `Cut into ${challenge.cutInto} equal slices`
        : phase === 'ask'
          ? `${challenge.cutInto} slices for ${among}. How many each?`
          : `Share among ${among} crew members`;

  const helpAction = phase === 'top' ? helpTopping : phase === 'cut' ? helpCut : phase === 'share' ? helpShare : undefined;

  return (
    <View style={styles.root}>
      {/* the whole kitchen game used to be played against a blue sky */}
      <SceneStage variant="counter" groundHeight={200} />
      <SceneCrew side="left" size={50} showPepper npc="gino" mood={phase === 'share' ? 'cheer' : phase === 'cut' ? 'think' : 'idle'} />
      <PromptBanner
        title={prompt}
        subtitle={
          phase === 'top'
            ? 'Drag a bowl onto the pizza.'
            : phase === 'cut'
              ? 'Roll the cutter along each dotted line.'
              : phase === 'share'
                ? 'Drag a slice to a plate — or just tap the plate.'
                : undefined
        }
        compact={compact}
      />

      {phase === 'top' ? (
        <View style={styles.pieRow}>
          {challenge.toppings.map((t, i) => (
            <React.Fragment key={t.topping}>
              {i > 0 ? (
                <Text variant="h3" color={palette.navyMuted}>
                  +
                </Text>
              ) : null}
              <Animated.View entering={FadeInDown.delay(i * 80).springify()} style={styles.fracChip}>
                <Text variant="h2" color={palette.engineRed}>
                  {formatFraction(t.fraction)}
                </Text>
                <Text variant="tiny" color={palette.navySoft}>
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
      ) : (
        <View style={styles.pieRow}>
          <EquationStrip text={`${sliceCount} / ${challenge.cutInto} slices`} />
        </View>
      )}

      <Stage design={D} style={styles.stage}>
        {(s) => (
          <>
            <CheckerCloth width={104 * s} height={92 * s} style={at(s, -8, 336)} />

            {phase === 'share' ? (
              <ShareScene
                s={s}
                plates={plates}
                each={each}
                total={challenge.cutInto}
                used={usedSlices}
                platePoints={platePoints}
                highlight={beacon.highlight || ageBand === 'A'}
                onGive={giveSlice}
                onMiss={() => beacon.nudge('Drop the slice right onto a plate.')}
              />
            ) : phase === 'ask' ? (
              <View style={[at(s, 20, 60, 350), styles.answerWrap]}>
                {answerOptions(each).map((value, i) => (
                  <AnswerTile
                    key={value}
                    label={String(value)}
                    index={i}
                    size="lg"
                    state={wrongAnswers.includes(value) ? 'wrong' : beacon.highlight && value === each ? 'highlight' : 'idle'}
                    onPress={() => answerDivision(value)}
                  />
                ))}
              </View>
            ) : (
              <>
                <View style={at(s, 25, 70)} pointerEvents="none">
                  <WoodPeel size={250 * s} />
                </View>

                <View style={at(s, PC.x - R_CRUST, PC.y - R_CRUST)} pointerEvents="none">
                  <PizzaArt
                    s={s}
                    count={count}
                    assigned={assigned}
                    cuts={cuts}
                    angles={angles}
                    phase={phase}
                    countUpTo={countUpTo}
                    highlightRegion={
                      phase === 'top' && beacon.highlight ? assigned.findIndex((a) => a === null) : -1
                    }
                    highlightCut={phase === 'cut' && beacon.highlight ? cuts.findIndex((c) => !c) : -1}
                  />
                </View>

                {phase === 'top' ? (
                  <PizzaSurface s={s} onTapAt={onPizzaTapAt} />
                ) : (
                  <CutSurface s={s} onStroke={onStroke} />
                )}
              </>
            )}

            {phase === 'top' ? (
              <ToppingRack
                s={s}
                selected={selected}
                plan={status.perTopping}
                onPick={pickUp}
                onDrop={(topping, dx, dy, home) => {
                  const p = { x: home.x + dx, y: home.y + dy };
                  const region = regionAtPoint(p, PC, R_SAUCE, count);
                  if (region === null) {
                    beacon.cheer('Drop it right on the pizza!');
                    return;
                  }
                  placeTopping(region, topping);
                }}
              />
            ) : null}

            {/* the cutter lies on the counter beside the peel the whole time,
                as in the reference — it is scene dressing, not a mode marker */}
            <View style={at(s, 16, 344)} pointerEvents="none">
              <PizzaCutter size={(phase === 'cut' ? 96 : 82) * s} />
            </View>
          </>
        )}
      </Stage>

      <Tray tone="cream">
        <View style={styles.trayRow}>
          {phase === 'cut' ? <GrownUpChip /> : null}
          {beacon.offerHelp && helpAction ? (
            <Button label="Show me" tone="yellow" size="sm" onPress={helpAction} sound="tap-soft" />
          ) : null}
        </View>
        {phase === 'top' ? (
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
            <Text variant="bodyStrong" color={palette.navySoft}>
              {slicesLeft} slice{slicesLeft === 1 ? '' : 's'} left · {each} for everyone
            </Text>
          </View>
        ) : phase === 'cut' ? (
          <View style={styles.sliceCounter}>
            <Text variant="bodyStrong" color={palette.navySoft}>
              {madeCuts} of {angles.length} cuts · {sliceCount} slices
            </Text>
          </View>
        ) : null}
      </Tray>

      <HintBubble text={beacon.text} es={beacon.es} visible={beacon.visible} onDismiss={beacon.dismiss} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* The pizza itself                                                     */
/* ------------------------------------------------------------------ */

function PizzaArt({
  s,
  count,
  assigned,
  cuts,
  angles,
  phase,
  countUpTo,
  highlightRegion,
  highlightCut,
}: {
  s: number;
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
  const size = R_CRUST * 2;
  const vb = `${PC.x - R_CRUST} ${PC.y - R_CRUST} ${size} ${size}`;
  return (
    <Svg width={size * s} height={size * s} viewBox={vb}>
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
          fill="none"
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
                strokeWidth={done ? 5 : 4}
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
function PizzaSurface({ s, onTapAt }: { s: number; onTapAt: (x: number, y: number, s: number) => void }) {
  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(20)
        .onEnd((e, ok) => {
          if (ok) runOnJS(onTapAt)(e.x, e.y, s);
        }),
    [onTapAt, s],
  );
  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityRole="button"
        accessibilityLabel="Pizza — tap a slice to add the ingredient you picked"
        style={at(s, PC.x - R_SAUCE, PC.y - R_SAUCE, R_SAUCE * 2, R_SAUCE * 2)}
      />
    </GestureDetector>
  );
}

/* ------------------------------------------------------------------ */
/* Cutting surface: a pan across the pizza                              */
/* ------------------------------------------------------------------ */

function CutSurface({ s, onStroke }: { s: number; onStroke: (x0: number, y0: number, x1: number, y1: number) => void }) {
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const curX = useSharedValue(0);
  const curY = useSharedValue(0);
  const active = useSharedValue(0);
  const box = R_CRUST * 2;

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          startX.value = e.x;
          startY.value = e.y;
          curX.value = e.x;
          curY.value = e.y;
          active.value = withTiming(1, { duration: 90 });
        })
        .onUpdate((e) => {
          curX.value = e.x;
          curY.value = e.y;
        })
        .onEnd((e) => {
          runOnJS(onStroke)(
            PC.x - R_CRUST + startX.value / s,
            PC.y - R_CRUST + startY.value / s,
            PC.x - R_CRUST + e.x / s,
            PC.y - R_CRUST + e.y / s,
          );
        })
        .onFinalize(() => {
          active.value = withTiming(0, { duration: 160 });
        }),
    [active, curX, curY, onStroke, s, startX, startY],
  );

  const cutterStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ translateX: curX.value - 28 * s }, { translateY: curY.value - 22 * s }, { scale: 0.8 + active.value * 0.2 }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={at(s, PC.x - R_CRUST, PC.y - R_CRUST, box, box)} accessibilityLabel="Drag the cutter across the pizza">
        <Animated.View style={[styles.floatingCutter, cutterStyle]} pointerEvents="none">
          <PizzaCutter size={72 * s} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/* ------------------------------------------------------------------ */
/* Ingredient rack                                                      */
/* ------------------------------------------------------------------ */

function ToppingRack({
  s,
  selected,
  plan,
  onPick,
  onDrop,
}: {
  s: number;
  selected: ToppingId | null;
  plan: { topping: ToppingId; need: number; have: number; done: boolean }[];
  onPick: (t: ToppingId) => void;
  onDrop: (t: ToppingId, dx: number, dy: number, home: Pt) => void;
}) {
  const n = Math.max(1, plan.length);
  const cellH = Math.min(104, (RACK.h - 16 - (n - 1) * 8) / n);
  return (
    <View style={at(s, RACK.x, RACK.y, RACK.w, RACK.h)}>
      <View style={[styles.rack, { borderRadius: 18 * s, borderWidth: 4 * s }]} pointerEvents="none" />
      {plan.map((p, i) => {
        const y = 8 + i * (cellH + 8);
        const home: Pt = { x: RACK.x + RACK.w / 2, y: RACK.y + y + cellH / 2 };
        return (
          <RackBowl
            key={p.topping}
            s={s}
            x={8}
            y={y}
            width={RACK.w - 16}
            topping={p.topping}
            selected={selected === p.topping}
            done={p.done}
            onPick={() => onPick(p.topping)}
            onDrop={(dx, dy) => onDrop(p.topping, dx, dy, home)}
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
}) {
  const drag = useDragSource({ scale: s, onPickUp: onPick, onTap: onPick, onDrop });
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
  s,
  plates,
  each,
  total,
  used,
  platePoints,
  highlight,
  onGive,
  onMiss,
}: {
  s: number;
  plates: number[];
  each: number;
  total: number;
  used: number[];
  platePoints: Pt[];
  highlight: boolean;
  onGive: (plate: number, slice?: number) => void;
  onMiss: () => void;
}) {
  const nextIdx = nextPlate(plates, each);
  const pileY = 348;
  const tokenW = 46;
  const perRow = Math.min(total, 7);
  const startX = (D.w - perRow * (tokenW + 4)) / 2;

  return (
    <>
      {platePoints.map((p, i) => {
        const n = plates[i] ?? 0;
        const glow = highlight && i === nextIdx;
        return (
          <View key={`plate${i}`} style={at(s, p.x - 46, p.y - 104, 92, 164)}>
            <View style={styles.plateCol}>
              {/* critique #23 — the full rig stands at the plate */}
              <CrewFigure id={CREW[i % CREW.length] ?? 'rookie'} size={92 * s} bobPhase={i * 0.5} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Plate ${i + 1}, ${n} slices`}
                onPress={() => onGive(i)}
                style={[styles.plateHit, glow && styles.plateGlow, { borderRadius: 18 * s }]}
              >
                <PlateArt size={88 * s} />
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
          const y = pileY + row * 10;
          return (
            <SliceToken
              key={`slice${i}`}
              s={s}
              x={x}
              y={y}
              width={tokenW}
              onDrop={(dx, dy) => {
                const p = { x: x + tokenW / 2 + dx, y: y + 22 + dy };
                const idx = nearestTarget(p, platePoints, 74);
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
}: {
  s: number;
  x: number;
  y: number;
  width: number;
  onDrop: (dx: number, dy: number) => void;
  onTap: () => void;
}) {
  const drag = useDragSource({
    scale: s,
    onPickUp: () => {
      sfx.play('tap-soft');
      haptics.select();
    },
    onTap,
    onDrop,
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
  root: { flex: 1 },
  stage: { flex: 1 },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  fracChip: {
    backgroundColor: palette.white,
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
  answerWrap: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, flexWrap: 'wrap' },
  plateCol: { alignItems: 'center', gap: 2 },
  plateHit: { alignItems: 'center', justifyContent: 'center', padding: 4, borderWidth: 3, borderColor: 'transparent' },
  plateGlow: { borderColor: palette.safetyYellow, backgroundColor: 'rgba(255,199,44,0.18)' },
  plateCount: { position: 'absolute', alignSelf: 'center' },
  floatingCutter: { position: 'absolute', left: 0, top: 0 },
  trayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xs, minHeight: 4 },
  sliceCounter: { alignItems: 'center', paddingVertical: spacing.xs },
});
