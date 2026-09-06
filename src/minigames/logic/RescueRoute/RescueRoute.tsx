import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect as SvgRect } from 'react-native-svg';
import type { GridPos, RouteCommand } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import type { RouteSpec } from '@/utils/grid';
import { samePos, stepForward } from '@/utils/grid';
import { activity, hit, palette, radii, roles, shadows, spacing, springs, timings } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text, useSideRail } from '@/ui';

import { Stage } from '@/world';

import { AskQuestion } from '../shared/AskQuestion';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useCaptainLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { HEADING_ANGLE, bestNextCommand, commandLabel, optimalLength, traceRoute } from '../shared/routeSim';
import { ForwardArrow, PlayGlyph, TurnArrow, UTurnArrow } from '../shared/art/Glyphs';
import { sceneLabel } from '../shared/labels';
import { CityBoard } from './CityBoard';
import { RouteTruck } from './RouteTruck';
import { cityPlan } from './cityPlan';
import { ROAD } from './TownArt';

/* ---------------- state ---------------- */

type Phase = 'compare' | 'coding' | 'running' | 'bumped' | 'arrived';

interface State {
  phase: Phase;
  program: RouteCommand[];
  /** index of the command currently executing */
  cursor: number;
  misses: number;
  bumpedAt: number | null;
}

type Action =
  | { type: 'COMPARE_DONE' }
  | { type: 'ADD'; command: RouteCommand }
  | { type: 'REMOVE'; index: number }
  | { type: 'CLEAR' }
  | { type: 'RUN' }
  | { type: 'CURSOR'; index: number }
  | { type: 'BUMP'; index: number | null }
  | { type: 'ARRIVE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'COMPARE_DONE':
      return { ...state, phase: 'coding' };
    /*
     * Editing always puts the child back in charge. Without this a run that
     * bumped left the game in 'bumped' for good and the Go button stopped
     * answering — a dead end, which this game is never allowed to have.
     */
    case 'ADD':
      return { ...state, phase: 'coding', program: [...state.program, action.command], bumpedAt: null };
    case 'REMOVE':
      return { ...state, phase: 'coding', program: state.program.filter((_, i) => i !== action.index), bumpedAt: null };
    case 'CLEAR':
      return { ...state, phase: 'coding', program: [], bumpedAt: null, cursor: -1 };
    case 'RUN':
      return { ...state, phase: 'running', cursor: -1, bumpedAt: null };
    case 'CURSOR':
      return { ...state, cursor: action.index };
    case 'BUMP':
      return { ...state, phase: 'bumped', bumpedAt: action.index, misses: state.misses + 1, cursor: -1 };
    case 'ARRIVE':
      return { ...state, phase: 'arrived', cursor: -1 };
    default:
      return state;
  }
}

/* ---------------- command palette ---------------- */

const COMMANDS: { id: RouteCommand; face: string; edge: string; label: string }[] = [
  { id: 'forward', face: palette.leafGreen, edge: palette.leafGreenDark, label: 'Forward' },
  { id: 'left', face: '#3E8FE0', edge: '#2C6BB0', label: 'Left' },
  { id: 'right', face: '#3E8FE0', edge: '#2C6BB0', label: 'Right' },
  { id: 'turn-around', face: palette.purple, edge: '#6F52D9', label: 'Turn\nAround' },
];

function CommandIcon({ id, size }: { id: RouteCommand; size: number }) {
  if (id === 'forward') return <ForwardArrow size={size} />;
  if (id === 'left') return <TurnArrow size={size} dir="left" />;
  if (id === 'right') return <TurnArrow size={size} dir="right" />;
  return <UTurnArrow size={size} />;
}

function ChunkyButton({
  face,
  edge,
  size,
  onPress,
  disabled,
  children,
  accessibilityLabel,
  glow,
}: {
  face: string;
  edge: string;
  size: number;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  accessibilityLabel: string;
  glow?: boolean;
}) {
  const press = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 5 }, { scale: 1 - press.value * 0.03 }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={6}
      onPressIn={() => {
        press.value = withTiming(1, timings.fast);
      }}
      onPressOut={() => {
        press.value = withSpring(0, springs.pop);
      }}
      onPress={onPress}
      style={disabled ? styles.disabled : undefined}
    >
      <View style={[styles.cmdEdge, { backgroundColor: edge, width: size, height: size + 5 }, glow && shadows.glowGold]}>
        <Animated.View style={[styles.cmdFace, { backgroundColor: face, width: size, height: size }, anim]}>
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** The little map on a compare card: tarmac, two blocks, one route. */
function RouteCard({ route, blocks }: { route: string; blocks: string }) {
  return (
    <Svg width={112} height={82} viewBox="0 0 112 82">
      <SvgRect x={0} y={0} width={112} height={82} rx={12} fill={ROAD.tarmac} />
      <SvgRect x={16} y={14} width={26} height={22} rx={7} fill={ROAD.kerbFace} />
      <SvgRect x={16} y={14} width={26} height={22} rx={7} fill={blocks} opacity={0.35} />
      <SvgRect x={66} y={44} width={30} height={24} rx={7} fill={ROAD.kerbFace} />
      <Path d={route} fill="none" stroke={palette.safetyYellow} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ---------------- game ---------------- */

export function RescueRoute({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'rescue-route'>) {
  const session = useMiniGameSession('rescue-route', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const sideRail = useSideRail();
  const reduceMotion = useReducedMotion();

  const spec: RouteSpec = useMemo(
    () => ({
      grid: challenge.grid,
      start: challenge.start,
      startHeading: challenge.startHeading,
      goal: challenge.goal,
      blocked: challenge.blocked,
    }),
    [challenge],
  );
  const plan = useMemo(() => cityPlan(challenge), [challenge]);

  const optimal = useMemo(() => optimalLength(spec) ?? challenge.maxCommands, [challenge.maxCommands, spec]);
  const showCompare = !!challenge.compareRoutes && ageBand !== 'A';

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    phase: showCompare ? ('compare' as Phase) : ('coding' as Phase),
    program: [],
    cursor: -1,
    misses: 0,
    bumpedAt: null,
  }));

  const hintLadder = useHintLadder(state.misses, session.hint);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);
  const heldAngle = useRef(HEADING_ANGLE[challenge.startHeading]);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  useEffect(
    () => () => {
      clearTimers();
      sfx.stopLoop('engine');
    },
    [clearTimers],
  );

  /* ----- geometry: the town grows into whatever room the play area has ----- */
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const onStageLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage((prev) => (Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1 ? prev : { w: width, h: height }));
  }, []);

  /* a hint must never sit on the board it is pointing at, so the town gives
     the bubble its lane back while it is up */
  const hintLane = hintLadder.showBubble && state.phase !== 'running' ? layout.s(118) : 0;
  const noticeLane = layout.s(34);

  const availW = (stage.w || layout.boxWidth) - spacing.xs * 2;
  const availH = (stage.h || layout.s(400)) - hintLane - noticeLane;
  /* the town grows into a wide window; the chrome does not */
  const cell = clamp(
    Math.floor(Math.min(availW / (challenge.grid.cols + 0.34), availH / (challenge.grid.rows + 0.34))),
    28,
    132,
  );
  const margin = Math.round(cell * 0.17);
  const truckBox = cell * 1.4;

  const col = useSharedValue(challenge.start.col);
  const row = useSharedValue(challenge.start.row);
  const angle = useSharedValue(HEADING_ANGLE[challenge.startHeading]);
  const nudge = useSharedValue(0);
  const bounce = useSharedValue(0);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: margin + col.value * cell + (cell - truckBox) / 2 },
      { translateY: margin + row.value * cell + (cell - truckBox) / 2 + bounce.value },
      { rotate: `${angle.value}deg` },
      { translateY: nudge.value },
    ],
  }));

  const goalName = sceneLabel[challenge.goalScene].en;
  const goalStreet = challenge.streetNames?.find((s) => s.row === challenge.goal.row)?.name;
  useCaptainLine(
    state.phase === 'coding' && state.program.length === 0
      ? `Drive the truck to the ${goalName}. Stay on the roads!`
      : null,
    session.say,
    { key: state.phase },
  );

  /* ----- program editing ----- */
  const addCommand = useCallback(
    (command: RouteCommand) => {
      if (state.program.length >= challenge.maxCommands) {
        sfx.play('wrong-soft');
        haptics.nudge();
        return;
      }
      sfx.play('pop');
      haptics.select();
      dispatch({ type: 'ADD', command });
    },
    [challenge.maxCommands, state.program.length],
  );

  const removeCommand = useCallback((index: number) => {
    sfx.play('tap-soft');
    haptics.tap();
    dispatch({ type: 'REMOVE', index });
  }, []);

  const resetTruck = useCallback(
    (animated: boolean) => {
      heldAngle.current = HEADING_ANGLE[challenge.startHeading];
      if (animated && !reduceMotion) {
        col.value = withTiming(challenge.start.col, { duration: 460 });
        row.value = withTiming(challenge.start.row, { duration: 460 });
        angle.value = withTiming(heldAngle.current, { duration: 460 });
      } else {
        col.value = challenge.start.col;
        row.value = challenge.start.row;
        angle.value = heldAngle.current;
      }
    },
    [angle, challenge.start.col, challenge.start.row, challenge.startHeading, col, reduceMotion, row],
  );

  const clearProgram = useCallback(() => {
    if (state.program.length === 0) return;
    sfx.play('whoosh');
    haptics.tap();
    resetTruck(true);
    dispatch({ type: 'CLEAR' });
  }, [resetTruck, state.program.length]);

  /* ----- run ----- */
  const run = useCallback(() => {
    if (state.phase === 'running' || state.phase === 'arrived' || state.program.length === 0) {
      sfx.play('wrong-soft');
      haptics.nudge();
      return;
    }
    const trace = traceRoute(spec, state.program);
    dispatch({ type: 'RUN' });
    sfx.startLoop('engine');
    haptics.tap();

    const finishArrival = () => {
      dispatch({ type: 'ARRIVE' });
      session.correct('route');
      if (!reduceMotion) bounce.value = withSequence(withSpring(-cell * 0.16, springs.pop), withSpring(0, springs.bounce));
      sfx.play('horn');
      haptics.celebrate();
      if (!finished.current) {
        finished.current = true;
        timers.current.push(
          setTimeout(() => {
            sfx.play('success');
            session.complete();
          }, 1200),
        );
      }
    };

    let i = 0;
    const stepOnce = () => {
      const step = trace.steps[i];
      if (!step) {
        sfx.stopLoop('engine');
        if (trace.reached) finishArrival();
        else {
          resetTruck(true);
          dispatch({ type: 'BUMP', index: null });
          session.incorrect('short');
          sfx.play('wrong-soft');
          haptics.nudge();
        }
        return;
      }
      dispatch({ type: 'CURSOR', index: i });
      const isForward = step.command === 'forward';

      if (isForward && (step.outcome === 'blocked' || step.outcome === 'off-map')) {
        /* a gentle nose-in against the kerb, then back: never a crash */
        nudge.value = reduceMotion
          ? withSequence(withTiming(-cell * 0.12, { duration: 120 }), withTiming(0, { duration: 120 }))
          : withSequence(withTiming(-cell * 0.2, { duration: 160 }), withSpring(0, springs.bounce));
        sfx.play('bump');
        haptics.thud();
        sfx.stopLoop('engine');
        timers.current.push(
          setTimeout(() => {
            resetTruck(true);
            dispatch({ type: 'BUMP', index: step.index });
            session.incorrect(step.command);
          }, 520),
        );
        return;
      }

      if (isForward) {
        col.value = withTiming(step.to.pos.col, { duration: 340 });
        row.value = withTiming(step.to.pos.row, { duration: 340 });
      } else {
        const delta = step.command === 'left' ? -90 : step.command === 'right' ? 90 : 180;
        heldAngle.current += delta;
        angle.value = withTiming(heldAngle.current, { duration: 300 });
        sfx.play('tap-soft');
      }

      i += 1;
      timers.current.push(setTimeout(stepOnce, isForward ? 380 : 330));
    };

    stepOnce();
  }, [angle, bounce, cell, col, nudge, reduceMotion, resetTruck, row, session, spec, state.phase, state.program]);

  useEffect(() => {
    session.progress(Math.min(state.program.length, challenge.maxCommands), challenge.maxCommands);
  }, [challenge.maxCommands, session, state.program.length]);

  /* ----- what the programme would do, drawn on the road before Go ----- */
  const trace = useMemo(() => traceRoute(spec, state.program), [spec, state.program]);
  const editing = state.phase === 'coding' || state.phase === 'bumped';
  const previewPath = useMemo(() => {
    if (!editing) return [];
    const cells: GridPos[] = [challenge.start];
    for (const step of trace.steps) if (step.outcome === 'moved' || step.outcome === 'arrived') cells.push(step.to.pos);
    return cells;
  }, [challenge.start, editing, trace]);
  /* the truck's own headlights already show the next cell when the tape is
     empty, so the road chevron only appears once a programme is being built */
  const aheadCell = useMemo(() => {
    if (!editing || state.program.length === 0 || trace.reached) return null;
    const next = stepForward(trace.end.pos, trace.end.heading);
    return plan.isRoad(next) && !samePos(next, trace.end.pos) ? next : null;
  }, [editing, plan, state.program.length, trace]);

  /* ----- hints ----- */
  const bumpStep = state.bumpedAt;
  const hintText = useMemo(() => {
    const blocker = (pos: GridPos): string => {
      const plot = plan.plots.find((p) => p.cells.some((c) => samePos(c, pos)));
      return plot ? `the ${sceneLabel[plot.scene].en.toLowerCase()}` : 'the edge of town';
    };
    if (bumpStep !== null) {
      const stopped = traceRoute(spec, state.program.slice(0, bumpStep));
      const better = bestNextCommand(spec, stopped.end);
      const wall = stepForward(stopped.end.pos, stopped.end.heading);
      return `Step ${bumpStep + 1} drives into ${blocker(wall)}. Try “${better ? commandLabel[better] : 'Left'}” there instead.`;
    }
    const first = bestNextCommand(spec, { pos: challenge.start, heading: challenge.startHeading });
    return `Follow the road round to the ${goalName} and stop in the gold bay. Start with “${first ? commandLabel[first] : 'Forward'}”.`;
  }, [bumpStep, challenge.start, challenge.startHeading, goalName, plan.plots, spec, state.program]);

  /**
   * The top of the hint ladder walks the child all the way home, one glowing
   * button at a time: clear a programme that crashes, then the next right
   * command, then Go. There is always something lit to press.
   */
  const suggestion: 'clear' | 'go' | RouteCommand | null = useMemo(() => {
    if (!hintLadder.highlight || !editing) return null;
    if (trace.bumpedAt !== null) return 'clear';
    if (trace.reached) return 'go';
    const next = bestNextCommand(spec, trace.end);
    if (!next) return 'go';
    return state.program.length >= challenge.maxCommands ? 'clear' : next;
  }, [challenge.maxCommands, editing, hintLadder.highlight, spec, state.program.length, trace]);

  /* ----- the programme tape grows with the child's plan ----- */
  const tapeCols = sideRail ? 5 : 8;
  const trayWidth = (sideRail ? activity.sidePanelWidth : Math.min(layout.boxWidth, 520)) - spacing.md * 2;
  const slotWidth = clamp((trayWidth - (tapeCols - 1) * 6) / tapeCols, 28, 46);
  const shownSlots = Math.min(challenge.maxCommands, Math.max(4, state.program.length + 1));
  const strip = Array.from({ length: shownSlots }, (_, i) => state.program[i] ?? null);

  const paletteCols = sideRail ? 3 : 5;
  const cmdSize = clamp((trayWidth - (paletteCols - 1) * spacing.xs) / paletteCols, hit.min, 74);

  const busy = state.phase === 'running' || state.phase === 'arrived';

  return (
    <GameFrame
      title={`Code the route to the ${goalName}`}
      subtitle={goalStreet ? `On ${goalStreet}. Build the steps, then press Go.` : 'Build the steps, then press Go.'}
      compact={compact}
      backdrop={
                  <Stage variant="street" groundHeight={140} />
      }
      hint={{ text: hintText, visible: hintLadder.showBubble && state.phase !== 'running', onDismiss: hintLadder.dismiss }}
      overlay={
        challenge.compareRoutes ? (
          <AskQuestion
            visible={state.phase === 'compare'}
            prompt="Which route is shorter?"
            options={['A', 'B']}
            correct={challenge.compareRoutes.shorter.toUpperCase()}
            ageBand={ageBand}
            hintText={`Route A is ${challenge.compareRoutes.a} blocks and route B is ${challenge.compareRoutes.b} blocks. The smaller number is shorter!`}
            onCorrect={() => session.correct('compare')}
            onWrong={() => session.incorrect('compare')}
            onHint={session.hint}
            onDone={() => dispatch({ type: 'COMPARE_DONE' })}
            content={
              <View style={styles.compareRow}>
                {(['a', 'b'] as const).map((key) => (
                  <View key={key} style={styles.compareCard}>
                    <RouteCard
                      route={key === 'a' ? 'M14,70 L14,48 L96,48 L96,20' : 'M14,70 L58,70 L58,36 L96,36 L96,20'}
                      blocks={key === 'a' ? palette.engineRed : palette.purple}
                    />
                    <Text variant="bodyStrong" center>
                      {key.toUpperCase()} = {challenge.compareRoutes?.[key]} blocks
                    </Text>
                  </View>
                ))}
              </View>
            }
          />
        ) : null
      }
      tray={
        <View style={styles.trayInner}>
          <View style={styles.palette}>
            {COMMANDS.map((c) => (
              <ChunkyButton
                key={c.id}
                face={c.face}
                edge={c.edge}
                size={cmdSize}
                accessibilityLabel={commandLabel[c.id]}
                disabled={busy}
                glow={suggestion === c.id}
                onPress={() => addCommand(c.id)}
              >
                <CommandIcon id={c.id} size={cmdSize * 0.5} />
                <Text variant="tiny" color={palette.white} center style={styles.cmdLabel}>
                  {c.label}
                </Text>
              </ChunkyButton>
            ))}
            <ChunkyButton
              face={palette.engineRed}
              edge={palette.engineRedDark}
              size={cmdSize}
              accessibilityLabel="Go"
              disabled={busy}
              glow={suggestion === 'go'}
              onPress={run}
            >
              <PlayGlyph size={cmdSize * 0.46} />
              <Text variant="tiny" color={palette.white} center style={styles.cmdLabel}>
                Go!
              </Text>
            </ChunkyButton>
          </View>

          <View style={styles.tapeRow}>
            <View style={styles.tape}>
              {strip.map((command, i) => {
                const active = state.cursor === i;
                const bumped = state.bumpedAt === i;
                return (
                  <View key={i} style={styles.slotCol}>
                    <Text variant="tiny" color={command ? palette.navy : palette.slate} center style={styles.slotIndex}>
                      {i + 1}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={command ? `Remove step ${i + 1}` : `Empty step ${i + 1}`}
                      hitSlop={10}
                      disabled={!command || busy}
                      onPress={() => removeCommand(i)}
                    >
                      {command ? (
                        <Animated.View
                          entering={ZoomIn.springify().damping(12)}
                          style={[
                            styles.slotFilled,
                            {
                              width: slotWidth,
                              height: slotWidth,
                              backgroundColor: COMMANDS.find((c) => c.id === command)?.face ?? palette.leafGreen,
                            },
                            active && styles.slotActive,
                            bumped && styles.slotBumped,
                          ]}
                        >
                          <CommandIcon id={command} size={slotWidth * 0.62} />
                        </Animated.View>
                      ) : (
                        <View style={[styles.slotEmpty, { width: slotWidth, height: slotWidth }]} />
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start over"
              hitSlop={12}
              disabled={busy || state.program.length === 0}
              onPress={clearProgram}
              style={[
                styles.clear,
                suggestion === 'clear' && styles.clearGlow,
                (busy || state.program.length === 0) && styles.disabled,
              ]}
            >
              <Text variant="tiny" color={roles.ink.secondary}>
                Start over
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <View style={styles.stage} onLayout={onStageLayout}>
        <View style={[styles.boardWrap, { paddingBottom: hintLane }]}>
          <View style={shadows.card}>
            <CityBoard
              challenge={challenge}
              plan={plan}
              cell={cell}
              margin={margin}
              path={previewPath}
              ahead={aheadCell}
              aheadHeading={trace.end.heading}
              arrived={state.phase === 'arrived'}
              labelAll={cell >= 64}
            />
            <Animated.View
              style={[styles.truck, { width: truckBox, height: truckBox }, truckStyle]}
              pointerEvents="none"
            >
              <RouteTruck size={truckBox} beam={state.phase !== 'arrived'} />
            </Animated.View>
          </View>

          <View style={[styles.noticeLane, { height: noticeLane }]} pointerEvents="none">
            {state.phase === 'bumped' ? (
              <Animated.View entering={FadeInDown.springify()} style={styles.notice}>
                <Text variant="tiny" center color={roles.ink.primary}>
                  {state.bumpedAt === null ? 'So close — the truck needs a few more steps.' : 'No road that way. Back to the station!'}
                </Text>
              </Animated.View>
            ) : null}
            {state.phase === 'arrived' ? (
              <Animated.View entering={FadeIn} style={[styles.notice, styles.noticeGood]}>
                <Text variant="bodyStrong" color={palette.leafGreenDark} center>
                  {state.program.length <= optimal ? 'Perfect route!' : 'You made it!'}
                </Text>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boardWrap: { alignItems: 'center', justifyContent: 'center' },
  truck: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },

  noticeLane: { justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xxs },
  notice: {
    backgroundColor: roles.surface.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.pill,
    maxWidth: 380,
    ...shadows.soft,
  },
  noticeGood: { backgroundColor: roles.state.successFill },

  trayInner: { gap: spacing.xs },
  palette: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  cmdEdge: { borderRadius: 18, alignItems: 'center', justifyContent: 'flex-start' },
  cmdFace: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cmdLabel: { fontSize: 11, lineHeight: 13 },
  disabled: { opacity: 0.45 },

  tapeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  tape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: roles.surface.sunken,
    borderRadius: radii.card,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    flexShrink: 1,
  },
  slotCol: { alignItems: 'center' },
  slotIndex: { fontSize: 10, lineHeight: 12 },
  slotEmpty: {
    borderRadius: 12,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: palette.slateLight,
  },
  slotFilled: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  slotActive: { borderColor: palette.safetyYellow, borderWidth: 3 },
  slotBumped: { opacity: 0.55 },
  clear: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, borderRadius: radii.pill },
  clearGlow: {
    backgroundColor: palette.safetyYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  compareRow: { flexDirection: 'row', gap: spacing.md },
  compareCard: { alignItems: 'center', gap: 4 },
});
