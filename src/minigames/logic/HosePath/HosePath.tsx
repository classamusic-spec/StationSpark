import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { GridPos, HosePiece } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { posKey, samePos, solveHosePath } from '@/utils/grid';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Button, EquipmentIcon, ResetIcon, Text, TrayRow } from '@/ui';

import { Stage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { Draggable } from '../shared/Draggable';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { cellIndex, solutionPlacements, traceWater, type PlacedPiece, type Rotation } from '../shared/hosePath';
import { FlameGlyph, PipeGlyph } from '../shared/art/Glyphs';
import { Hydrant, TreeCluster } from '../shared/art/Props';

interface State {
  phase: 'building' | 'flowing' | 'done';
  placed: Record<string, PlacedPiece & { from: number }>;
  misses: number;
  /** idle escalations — they raise Beacon's ladder without scoring a mistake */
  nudges: number;
  flow: number;
}

type Action =
  | { type: 'PLACE'; key: string; piece: HosePiece; from: number }
  | { type: 'ROTATE'; key: string }
  | { type: 'PICK_UP'; key: string }
  | { type: 'MISS' }
  | { type: 'NUDGE' }
  | { type: 'RESET' }
  | { type: 'FLOW'; cells: number }
  | { type: 'DONE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLACE':
      return {
        ...state,
        placed: { ...state.placed, [action.key]: { piece: action.piece, rotation: 0, from: action.from } },
      };
    case 'ROTATE': {
      const current = state.placed[action.key];
      if (!current) return state;
      return {
        ...state,
        placed: { ...state.placed, [action.key]: { ...current, rotation: ((current.rotation + 1) % 4) as Rotation } },
      };
    }
    case 'PICK_UP': {
      const next = { ...state.placed };
      delete next[action.key];
      return { ...state, placed: next };
    }
    case 'MISS':
      return { ...state, misses: state.misses + 1 };
    case 'NUDGE':
      return { ...state, nudges: state.nudges + 1 };
    case 'RESET':
      return { ...state, placed: {}, flow: 0 };
    case 'FLOW':
      return { ...state, phase: 'flowing', flow: action.cells };
    case 'DONE':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

export function HosePath({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'hose-path'>) {
  const session = useMiniGameSession('hose-path', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'building', placed: {}, misses: 0, nudges: 0, flow: 0 });
  const hintLadder = useHintLadder(state.misses + state.nudges, session.hint);
  const finished = useRef(false);
  const allUsedRef = useRef(false);

  const { grid, start, end, blocked } = challenge;
  const blockedKeys = useMemo(() => new Set(blocked.map(posKey)), [blocked]);

  const board = useMemo(() => {
    const cells: (PlacedPiece | null)[] = Array.from({ length: grid.rows * grid.cols }, () => null);
    for (const [key, value] of Object.entries(state.placed)) {
      const [row, col] = key.split(',').map(Number);
      if (row === undefined || col === undefined) continue;
      cells[cellIndex(grid, { row, col })] = { piece: value.piece, rotation: value.rotation };
    }
    return cells;
  }, [grid, state.placed]);

  const path = useMemo(
    () => traceWater({ grid, start, end, blocked, board }),
    [blocked, board, end, grid, start],
  );

  const usedFrom = useMemo(() => new Set(Object.values(state.placed).map((p) => p.from)), [state.placed]);
  const trayPieces = challenge.pieces.map((piece, i) => ({ piece, index: i, used: usedFrom.has(i) }));
  const remaining = trayPieces.filter((p) => !p.used);

  useBeaconLine('Build the hose line from the hydrant to the flame. Tap a piece to turn it!', session.say);

  /* solution (for hints) */
  const solution = useMemo(() => {
    const solved = solveHosePath({ grid, start, end, blocked, pieces: challenge.pieces });
    return solved ? solutionPlacements(solved) : new Map<string, PlacedPiece>();
  }, [blocked, challenge.pieces, end, grid, start]);

  const hintCellKey = useMemo(() => {
    for (const [key, want] of solution) {
      const have = state.placed[key];
      if (!have || have.piece !== want.piece || have.rotation !== want.rotation) return key;
    }
    return null;
  }, [solution, state.placed]);

  /**
   * Water flows as soon as the line connects.
   *
   * This used to be guarded by `state.phase !== 'building'` AND to list
   * `state.phase` in its deps — so the very first FLOW tick moved the phase to
   * 'flowing', React tore the effect down, and the re-run bailed at the guard.
   * The water stopped one cell in and `session.complete()` never fired: the
   * game was impossible to finish. A ref runs it exactly once instead; the
   * board is frozen while the water travels, so `path` cannot change under us.
   */
  const flowing = useRef(false);
  useEffect(() => {
    if (!path || flowing.current) return;
    flowing.current = true;
    sfx.startLoop('water-spray');
    let i = 1;
    const id = setInterval(() => {
      dispatch({ type: 'FLOW', cells: i });
      i += 1;
      if (i > path.length) {
        clearInterval(id);
        sfx.stopLoop('water-spray');
        sfx.play('steam');
        haptics.celebrate();
        dispatch({ type: 'DONE' });
        if (!finished.current) {
          finished.current = true;
          session.correct('connected');
          setTimeout(() => {
            sfx.play('success');
            session.complete();
          }, 800);
        }
      }
    }, 190);
    return () => {
      clearInterval(id);
      sfx.stopLoop('water-spray');
    };
  }, [path, session]);

  useEffect(() => () => sfx.stopLoop('water-spray'), []);

  /* every piece used but still no line → nudge (never a dead end) */
  useEffect(() => {
    const allUsed = remaining.length === 0 && challenge.pieces.length > 0;
    if (allUsed && !path && !allUsedRef.current) {
      allUsedRef.current = true;
      dispatch({ type: 'NUDGE' });
      sfx.play('wrong-soft');
      haptics.nudge();
    }
    if (!allUsed) allUsedRef.current = false;
  }, [challenge.pieces.length, path, remaining.length]);

  /**
   * NEVER DEAD-END. Nothing in this game is "wrong" — a piece in the wrong cell
   * is just a piece in the wrong cell — so the miss counter barely moves and
   * Beacon's ladder used to sit at level 0 forever. Escalate on idle instead:
   * ~14 s with no change shows the bubble, ~28 s highlights the cell to fix.
   */
  useEffect(() => {
    if (state.phase !== 'building') return;
    const t = setTimeout(() => dispatch({ type: 'NUDGE' }), 14000);
    return () => clearTimeout(t);
  }, [state.phase, state.placed, state.nudges]);

  useEffect(() => {
    session.progress(Object.keys(state.placed).length, challenge.pieces.length);
  }, [challenge.pieces.length, session, state.placed]);

  /* geometry */
  const gap = layout.s(5);
  const boardWidth = Math.min(layout.boxWidth - spacing.md * 2, layout.s(330));
  const cell = (boardWidth - gap * (grid.cols + 1)) / grid.cols;
  const boardHeight = cell * grid.rows + gap * (grid.rows + 1);

  const onDropPiece = useCallback(
    (pieceIndex: number, piece: HosePiece, slotId: string | null) => {
      if (!slotId) return { accept: false, silent: true };
      const key = slotId.replace('cell:', '');
      if (state.placed[key]) return { accept: false };
      return {
        accept: true,
        onSettled: () => {
          dispatch({ type: 'PLACE', key, piece, from: pieceIndex });
          sfx.play('clank');
          haptics.drop();
        },
      };
    },
    [state.placed],
  );

  const rotate = useCallback(
    (key: string) => {
      if (state.phase !== 'building') return;
      dispatch({ type: 'ROTATE', key });
      sfx.play('clank');
      haptics.tap();
    },
    [state.phase],
  );

  const pieceSize = Math.max(hit.big, layout.s(70));
  const flowKeys = useMemo(
    () => new Set((path ?? []).slice(0, state.flow).map(posKey)),
    [path, state.flow],
  );

  const hintText = useMemo(() => {
    if (!hintCellKey) return 'Turn a piece so both ends line up with its neighbours.';
    const want = solution.get(hintCellKey);
    const [row, col] = hintCellKey.split(',').map(Number);
    return `Try a ${want?.piece === 'corner' ? 'corner' : 'straight'} piece in row ${(row ?? 0) + 1}, column ${(col ?? 0) + 1} — then tap it to turn it.`;
  }, [hintCellKey, solution]);

  const cells: GridPos[] = useMemo(() => {
    const out: GridPos[] = [];
    for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.cols; c++) out.push({ row: r, col: c });
    return out;
  }, [grid.cols, grid.rows]);

  return (
    <GameFrame
      title="Lay the Hose"
      subtitle={ageBand === 'A' ? undefined : 'Drag pieces in, tap to turn them.'}
      compact={compact}
      backdrop={
        <>
          <Stage variant="yard" groundHeight={150} />
          <SceneCrew side="left" size={54} showPepper mood={state.phase === 'done' ? 'cheer' : state.phase === 'flowing' ? 'happy' : 'idle'} />
        </>
      }
      hint={{ text: hintText, visible: hintLadder.showBubble && state.phase === 'building', onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.trayInner}>
          <TrayRow>
            {remaining.length === 0 ? (
              <Text variant="small" color={palette.navySoft}>
                All pieces are on the yard — tap them to turn them.
              </Text>
            ) : (
              remaining.map(({ piece, index }, i) => (
                <Animated.View key={index} entering={ZoomIn.delay(i * 50).springify().damping(14)}>
                  <Draggable
                    id={`piece-${index}`}
                    snapRadius={layout.s(44)}
                    disabled={state.phase !== 'building'}
                    onDrop={(slotId) => onDropPiece(index, piece, slotId)}
                    accessibilityLabel={`${piece} hose piece`}
                    style={[styles.pieceCard, { width: pieceSize + spacing.xs }]}
                  >
                    <PipeGlyph kind={piece} size={pieceSize} />
                  </Draggable>
                </Animated.View>
              ))
            )}
          </TrayRow>
          <View style={styles.actions}>
            <Button
              label="Reset"
              tone="white"
              size="md"
              icon={<ResetIcon size={22} />}
              disabled={state.phase !== 'building'}
              onPress={() => {
                dispatch({ type: 'RESET' });
                sfx.play('whoosh');
              }}
            />
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
          {cells.map((pos) => {
            const key = posKey(pos);
            const isStart = samePos(pos, start);
            const isEnd = samePos(pos, end);
            const isBlocked = blockedKeys.has(key);
            const placed = state.placed[key];
            const wet = flowKeys.has(key);
            const left = gap + pos.col * (cell + gap);
            const top = gap + pos.row * (cell + gap);

            if (isStart || isEnd || isBlocked) {
              return (
                <View
                  key={key}
                  style={[
                    styles.cell,
                    {
                      left,
                      top,
                      width: cell,
                      height: cell,
                      backgroundColor: isBlocked ? '#E6D3B3' : palette.cream,
                    },
                  ]}
                >
                  {isStart ? <Hydrant width={cell * 0.62} wet={state.flow > 0} /> : null}
                  {isEnd ? (
                    state.phase === 'done' ? (
                      <Animated.View entering={ZoomIn.springify()}>
                        <FlameGlyph size={cell * 0.66} out />
                      </Animated.View>
                    ) : (
                      <FlameGlyph size={cell * 0.66} />
                    )
                  ) : null}
                  {isBlocked ? <TreeCluster size={cell * 0.8} /> : null}
                </View>
              );
            }

            return (
              <SlotZone
                key={key}
                id={`cell:${key}`}
                enabled={!placed && state.phase === 'building'}
                highlight={hintLadder.highlight && hintCellKey === key}
                hitPad={layout.s(4)}
                style={[styles.cellSlot, { left, top, width: cell, height: cell }]}
              >
                <View style={[styles.cellInner, { width: cell, height: cell }]}>
                  {placed ? (
                    <Pressable
                      onPress={() => rotate(key)}
                      accessibilityRole="button"
                      accessibilityLabel="Turn this hose piece"
                      hitSlop={6}
                    >
                      <RotatingPiece piece={placed.piece} rotation={placed.rotation} size={cell} water={wet} />
                    </Pressable>
                  ) : null}
                </View>
              </SlotZone>
            );
          })}
        </View>

        {state.phase === 'done' ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              Water&apos;s through — flame out!
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.legend}>
            <EquipmentIcon id="hose" size={layout.s(26)} />
            <Text variant="tiny" color={palette.navySoft}>
              {remaining.length} piece{remaining.length === 1 ? '' : 's'} left
            </Text>
          </View>
        )}
      </View>
    </GameFrame>
  );
}

function RotatingPiece({
  piece,
  rotation,
  size,
  water,
}: {
  piece: HosePiece;
  rotation: Rotation;
  size: number;
  water?: boolean;
}) {
  const spin = useSharedValue(rotation * 90);
  const target = rotation * 90;
  useEffect(() => {
    spin.value = withSpring(target, springs.pop);
  }, [spin, target]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <PipeGlyph kind={piece} size={size} water={water} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  board: {
    backgroundColor: palette.tan,
    borderRadius: radii.card,
    ...shadows.card,
  },
  cell: {
    position: 'absolute',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellSlot: { position: 'absolute', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.55)' },
  cellInner: { alignItems: 'center', justifyContent: 'center' },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trayInner: { gap: spacing.xs },
  pieceCard: {
    alignItems: 'center',
    backgroundColor: palette.panel,
    borderRadius: radii.card,
    padding: 4,
  },
  actions: { flexDirection: 'row', justifyContent: 'center' },
});
