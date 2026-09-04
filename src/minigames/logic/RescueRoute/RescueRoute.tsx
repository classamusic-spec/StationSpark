import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import Svg, { Polyline, Rect as SvgRect } from 'react-native-svg';
import type { GridPos, RouteCommand } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import type { RouteSpec } from '@/utils/grid';
import { posKey, samePos } from '@/utils/grid';
import { hit, palette, radii, shadows, spacing, springs, timings } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui';
import { AskQuestion } from '../shared/AskQuestion';
import { GameFrame } from '../shared/GameFrame';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { HEADING_ANGLE, bestNextCommand, commandLabel, optimalLength, traceRoute } from '../shared/routeSim';
import { BarrierGlyph, FlameGlyph, ForwardArrow, PlayGlyph, TurnArrow, UTurnArrow } from '../shared/art/Glyphs';
import { RoadworkPile, SceneBuilding, TreeCluster, TruckTop } from '../shared/art/Props';
import { sceneLabel } from '../shared/labels';

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
    case 'ADD':
      return { ...state, program: [...state.program, action.command] };
    case 'REMOVE':
      return { ...state, program: state.program.filter((_, i) => i !== action.index) };
    case 'CLEAR':
      return { ...state, program: [], bumpedAt: null, cursor: -1 };
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

/* ---------------- game ---------------- */

export function RescueRoute({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'rescue-route'>) {
  const session = useMiniGameSession('rescue-route', onComplete, onEvent);
  const layout = useGameLayout({ compact });

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

  /* ----- geometry ----- */
  const gap = layout.s(11);
  const boardWidth = Math.min(layout.boxWidth - spacing.md * 2, layout.s(342));
  const cell = (boardWidth - gap * (challenge.grid.cols + 1)) / challenge.grid.cols;
  const boardHeight = cell * challenge.grid.rows + gap * (challenge.grid.rows + 1);
  const cellStep = cell + gap;
  const truckSize = cell * 0.78;

  const col = useSharedValue(challenge.start.col);
  const row = useSharedValue(challenge.start.row);
  const angle = useSharedValue(HEADING_ANGLE[challenge.startHeading]);
  const nudge = useSharedValue(0);
  const bounce = useSharedValue(0);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: gap + col.value * cellStep + (cell - truckSize) / 2 },
      { translateY: gap + row.value * cellStep + (cell - truckSize) / 2 + bounce.value },
      { rotate: `${angle.value}deg` },
      { translateY: nudge.value },
    ],
  }));

  const goalName = sceneLabel[challenge.goalScene].en;
  const goalStreet = challenge.streetNames?.find((s) => s.row === challenge.goal.row)?.name;
  useBeaconLine(
    state.phase === 'coding' && state.program.length === 0
      ? `Code the route! Help the fire truck reach the ${goalName}.`
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
      if (animated) {
        col.value = withTiming(challenge.start.col, { duration: 460 });
        row.value = withTiming(challenge.start.row, { duration: 460 });
        angle.value = withTiming(heldAngle.current, { duration: 460 });
      } else {
        col.value = challenge.start.col;
        row.value = challenge.start.row;
        angle.value = heldAngle.current;
      }
    },
    [angle, challenge.start.col, challenge.start.row, challenge.startHeading, col, row],
  );

  /* ----- run ----- */
  const run = useCallback(() => {
    if (state.phase !== 'coding' || state.program.length === 0) {
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
      bounce.value = withSequence(withSpring(-cell * 0.18, springs.pop), withSpring(0, springs.bounce));
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
        // gentle bonk: lean into the obstacle, then back
        nudge.value = withSequence(
          withTiming(-cellStep * 0.22, { duration: 160 }),
          withSpring(0, springs.bounce),
        );
        sfx.play('clank');
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
  }, [angle, bounce, cell, cellStep, col, nudge, resetTruck, row, session, spec, state.phase, state.program]);

  useEffect(() => {
    session.progress(Math.min(state.program.length, challenge.maxCommands), challenge.maxCommands);
  }, [challenge.maxCommands, session, state.program.length]);

  /* ----- hints ----- */
  const bumpStep = state.bumpedAt;
  const hintText = useMemo(() => {
    if (bumpStep !== null) {
      const suggestion = bestNextCommand(spec, { pos: challenge.start, heading: challenge.startHeading });
      const trace = traceRoute(spec, state.program.slice(0, bumpStep));
      const better = bestNextCommand(spec, trace.end) ?? suggestion;
      return `Step ${bumpStep + 1} bumps into the closed road. Try “${better ? commandLabel[better] : 'Forward'}” there instead.`;
    }
    const first = bestNextCommand(spec, { pos: challenge.start, heading: challenge.startHeading });
    return `Start with “${first ? commandLabel[first] : 'Forward'}”. Follow the open roads to the ${goalName}.`;
  }, [bumpStep, challenge.start, challenge.startHeading, goalName, spec, state.program]);

  const suggestedCommand = useMemo(() => {
    if (!hintLadder.highlight || state.phase !== 'coding') return null;
    const trace = traceRoute(spec, state.program);
    if (trace.bumpedAt !== null) return null;
    return bestNextCommand(spec, trace.end);
  }, [hintLadder.highlight, spec, state.phase, state.program]);

  /* ----- board cells ----- */
  const blockedKeys = useMemo(() => new Set(challenge.blocked.map(posKey)), [challenge.blocked]);
  const cells: { pos: GridPos; kind: 'grass' | 'blocked' | 'goal' | 'start'; deco: number }[] = useMemo(() => {
    const out: { pos: GridPos; kind: 'grass' | 'blocked' | 'goal' | 'start'; deco: number }[] = [];
    for (let r = 0; r < challenge.grid.rows; r++) {
      for (let c = 0; c < challenge.grid.cols; c++) {
        const pos = { row: r, col: c };
        const kind = blockedKeys.has(posKey(pos))
          ? 'blocked'
          : samePos(pos, challenge.goal)
            ? 'goal'
            : samePos(pos, challenge.start)
              ? 'start'
              : 'grass';
        out.push({ pos, kind, deco: (r * challenge.grid.cols + c * 3) % 4 });
      }
    }
    return out;
  }, [blockedKeys, challenge.goal, challenge.grid.cols, challenge.grid.rows, challenge.start]);

  const strip = Array.from({ length: challenge.maxCommands }, (_, i) => state.program[i] ?? null);
  /** long programs wrap onto a second row so every slot stays comfortably tappable */
  const perStripRow = Math.min(challenge.maxCommands, 8);
  const slotWidth = Math.min(layout.s(40), (layout.boxWidth - spacing.md * 2 - (perStripRow - 1) * 6) / perStripRow);
  const cmdSize = Math.max(hit.min, Math.min(layout.s(62), (layout.boxWidth - spacing.md * 2 - 5 * spacing.xs) / 5));

  return (
    <GameFrame
      title="Code the Route!"
      subtitle={
        goalStreet ? `Drive to the ${goalName} on ${goalStreet}!` : `Help the fire truck reach the ${goalName}!`
      }
      compact={compact}
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
                    <Svg width={110} height={80} viewBox="0 0 110 80">
                      <SvgRect x={0} y={0} width={110} height={80} rx={12} fill={palette.mint} />
                      <Polyline
                        points={key === 'a' ? '12,68 12,26 96,26 96,14' : '12,68 62,68 62,40 96,40 96,14'}
                        fill="none"
                        stroke={key === 'a' ? palette.engineRed : palette.purple}
                        strokeWidth={7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
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
                disabled={state.phase === 'running' || state.phase === 'arrived'}
                glow={suggestedCommand === c.id}
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
              disabled={state.phase === 'running' || state.phase === 'arrived'}
              onPress={run}
            >
              <PlayGlyph size={cmdSize * 0.46} />
              <Text variant="tiny" color={palette.white} center style={styles.cmdLabel}>
                Go!
              </Text>
            </ChunkyButton>
          </View>

          <View style={styles.strip}>
            {strip.map((command, i) => {
              const active = state.cursor === i;
              const bumped = state.bumpedAt === i;
              return (
                <View key={i} style={styles.slotCol}>
                  <Text variant="tiny" color={command ? palette.navy : palette.slate} center>
                    {i + 1}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={command ? `Remove step ${i + 1}` : `Empty step ${i + 1}`}
                    hitSlop={8}
                    disabled={!command || state.phase === 'running' || state.phase === 'arrived'}
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
        </View>
      }
    >
      <View style={styles.stage}>
        <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
          {/* road dashes */}
          {Array.from({ length: challenge.grid.rows + 1 }, (_, r) => (
            <View key={`h${r}`} style={[styles.dashRow, { top: r * cellStep + gap / 2 - 1.5, width: boardWidth }]}>
              {Array.from({ length: Math.max(2, Math.floor(boardWidth / 18)) }, (_, d) => (
                <View key={d} style={styles.dash} />
              ))}
            </View>
          ))}
          {Array.from({ length: challenge.grid.cols + 1 }, (_, c) => (
            <View key={`v${c}`} style={[styles.dashCol, { left: c * cellStep + gap / 2 - 1.5, height: boardHeight }]}>
              {Array.from({ length: Math.max(2, Math.floor(boardHeight / 18)) }, (_, d) => (
                <View key={d} style={styles.dashV} />
              ))}
            </View>
          ))}

          {cells.map(({ pos, kind, deco }) => (
            <View
              key={posKey(pos)}
              style={[
                styles.cell,
                {
                  left: gap + pos.col * cellStep,
                  top: gap + pos.row * cellStep,
                  width: cell,
                  height: cell,
                  backgroundColor:
                    kind === 'blocked' ? '#D8B487' : kind === 'start' ? '#FFEFBD' : palette.mint,
                },
              ]}
            >
              {kind === 'blocked' ? (
                deco % 2 === 0 ? (
                  <RoadworkPile size={cell * 0.82} />
                ) : (
                  <BarrierGlyph width={cell * 0.86} height={cell * 0.5} />
                )
              ) : kind === 'goal' ? (
                <View style={styles.goalCell}>
                  <SceneBuilding scene={challenge.goalScene} size={cell * 0.9} />
                  {state.phase !== 'arrived' ? (
                    <View style={styles.goalFlame}>
                      <FlameGlyph size={cell * 0.36} />
                    </View>
                  ) : (
                    <Animated.View entering={ZoomIn.springify()} style={styles.goalFlame}>
                      <FlameGlyph size={cell * 0.36} out />
                    </Animated.View>
                  )}
                </View>
              ) : kind === 'grass' && deco === 1 ? (
                <TreeCluster size={cell * 0.78} />
              ) : kind === 'grass' && deco === 3 ? (
                <SceneBuilding scene="apartments" size={cell * 0.74} />
              ) : null}
            </View>
          ))}

          <Animated.View
            style={[styles.truck, { width: truckSize, height: truckSize }, truckStyle]}
            pointerEvents="none"
          >
            <TruckTop size={truckSize} />
          </Animated.View>

          {/* street names painted along the road above each row */}
          {challenge.streetNames?.map((street) => (
            <Text
              key={street.row}
              variant="tiny"
              color="rgba(255,255,255,0.95)"
              numberOfLines={1}
              style={[
                styles.streetName,
                { top: street.row * cellStep + gap / 2 - Math.max(5, gap * 0.42), width: boardWidth - 12 },
              ]}
            >
              {street.name.toUpperCase()}
            </Text>
          ))}
        </View>

        {state.phase === 'bumped' ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.notice}>
            <Text variant="bodyStrong" center>
              {state.bumpedAt === null
                ? "Almost! The truck needs a few more steps."
                : "Road closed! Let's fix that step."}
            </Text>
          </Animated.View>
        ) : null}
        {state.phase === 'arrived' ? (
          <Animated.View entering={FadeIn} style={[styles.notice, styles.noticeGood]}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              {state.program.length <= optimal ? 'Perfect route! ⭐' : 'You made it!'}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  streetName: { position: 'absolute', left: 8, fontSize: 9, lineHeight: 11, letterSpacing: 0.6 },
  board: {
    backgroundColor: '#B8C0D2',
    borderRadius: radii.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  cell: { position: 'absolute', borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  goalCell: { alignItems: 'center', justifyContent: 'center' },
  goalFlame: { position: 'absolute', top: -2, right: -2 },
  truck: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  dashRow: { position: 'absolute', left: 0, flexDirection: 'row', justifyContent: 'space-evenly' },
  dashCol: { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'space-evenly' },
  dash: { width: 8, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  dashV: { width: 3, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  notice: {
    marginTop: spacing.sm,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
  noticeGood: { backgroundColor: palette.mint },
  trayInner: { gap: spacing.sm },
  palette: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  cmdEdge: { borderRadius: 18, alignItems: 'center', justifyContent: 'flex-start' },
  cmdFace: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    gap: 0,
  },
  cmdLabel: { fontSize: 11, lineHeight: 13 },
  disabled: { opacity: 0.5 },
  strip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.panel,
    borderRadius: radii.card,
    paddingVertical: spacing.xs,
  },
  slotCol: { alignItems: 'center' },
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
  compareRow: { flexDirection: 'row', gap: spacing.md },
  compareCard: { alignItems: 'center', gap: 4 },
});
