import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ShapePiece } from '@/learning/types';
import { rotatableShapes } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs, timings } from '@/theme';
import { useIdleBob, useReducedMotion } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Button, Chip, ResetIcon, SparkleBurst, Text, TrayRow } from '@/ui';
import { AskQuestion } from '../shared/AskQuestion';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { useDragToSlot, type DropOutcome } from '../shared/useDragToSlot';
import {
  BenchTools,
  BlueprintSheet,
  PieceArt,
  TurnBadge,
  WorkshopFloor,
  WorkshopWall,
  blueprintName,
  shapeName,
  type Turn,
} from './pieces';

const TURNS: Turn[] = [0, 90, 180, 270];
const canTurn = (piece: ShapePiece) => rotatableShapes.includes(piece.shape);
/** two pieces are interchangeable when they are the same shape at the same size */
const sig = (piece: ShapePiece) => `${piece.shape}:${piece.w}x${piece.h}`;

/* ---------------- state machine ---------------- */

interface State {
  phase: 'building' | 'alive' | 'ask' | 'done';
  /** blueprint slot id → the id of the piece sitting in it */
  placed: Record<string, string>;
  /** piece id → the way it is turned right now */
  turns: Record<string, Turn>;
  misses: number;
  /** slot Beacon is pointing at */
  focus: string | null;
}

type Action =
  | { type: 'PLACE'; slot: string; piece: string; turn: Turn }
  | { type: 'TURN'; piece: string }
  | { type: 'MISS'; focus: string | null }
  | { type: 'RESET'; turns: Record<string, Turn> }
  | { type: 'ALIVE' }
  | { type: 'ASK' }
  | { type: 'FINISH' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLACE':
      return {
        ...state,
        placed: { ...state.placed, [action.slot]: action.piece },
        turns: { ...state.turns, [action.piece]: action.turn },
        focus: null,
      };
    case 'TURN': {
      const now = state.turns[action.piece] ?? 0;
      const next = TURNS[(TURNS.indexOf(now) + 1) % TURNS.length] ?? 0;
      return { ...state, turns: { ...state.turns, [action.piece]: next } };
    }
    case 'MISS':
      return { ...state, misses: state.misses + 1, focus: action.focus };
    case 'RESET':
      return { ...state, placed: {}, turns: { ...action.turns }, focus: null };
    case 'ALIVE':
      return { ...state, phase: 'alive' };
    case 'ASK':
      return { ...state, phase: 'ask' };
    case 'FINISH':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/* ---------------- a piece you can drag, or tap to turn ---------------- */

interface PieceTokenProps {
  piece: ShapePiece;
  turn: Turn;
  box: number;
  scale: number;
  needsTurn: boolean;
  highlight: boolean;
  index: number;
  onDropPiece: (slotId: string | null) => DropOutcome;
  onTap: () => void;
}

function PieceToken({ piece, turn, box, scale, needsTurn, highlight, index, onDropPiece, onTap }: PieceTokenProps) {
  const { gesture, animatedStyle, dragging, nodeRef } = useDragToSlot({ snapRadius: 54, onDrop: onDropPiece });
  const spin = useSharedValue(0);

  const composed = useMemo(
    () =>
      Gesture.Race(
        gesture,
        Gesture.Tap()
          .maxDistance(14)
          .onEnd((_e, ok) => {
            if (ok) runOnJS(onTap)();
          }),
      ),
    [gesture, onTap],
  );

  useEffect(() => {
    spin.value = 0;
    spin.value = withSequence(withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 1 }));
  }, [spin, turn]);

  const turnStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + spin.value * 0.12 }] }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        ref={nodeRef}
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${shapeName[piece.shape].en} piece${needsTurn ? ', tap to turn it' : ''}`}
        style={[styles.token, { width: box, height: box }, highlight && shadows.glowGold, dragging && styles.dragging, animatedStyle]}
      >
        <Animated.View
          entering={ZoomIn.delay(index * 60)
            .springify()
            .damping(14)}
          style={[styles.tokenFace, { width: box, height: box }, highlight && styles.tokenHighlight]}
        >
          <Animated.View style={turnStyle}>
            <PieceArt shape={piece.shape} w={piece.w * scale} h={piece.h * scale} rotation={turn} color={piece.color} />
          </Animated.View>
          {needsTurn ? (
            <View style={styles.turnBadge}>
              <TurnBadge size={22} />
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/* ---------------- a piece resting in the blueprint ---------------- */

function PlacedPiece({ piece, w, h, turn, alive }: { piece: ShapePiece; w: number; h: number; turn: Turn; alive: boolean }) {
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!alive || reduced || piece.shape !== 'circle') return;
    spin.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.linear }), -1, false);
  }, [alive, piece.shape, reduced, spin]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  return (
    <Animated.View entering={ZoomIn.springify().damping(11)}>
      <Animated.View style={style}>
        <PieceArt shape={piece.shape} w={w} h={h} rotation={turn} color={piece.color} />
      </Animated.View>
    </Animated.View>
  );
}

/* ---------------- game ---------------- */

export function ShapeBuilder({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'shape-builder'>) {
  const session = useMiniGameSession('shape-builder', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const reduced = useReducedMotion();
  const finished = useRef(false);

  const { pieces, needsRotation } = challenge;

  /** band A pieces arrive the right way up; from B they arrive turned */
  const startTurns = useMemo(() => {
    const map: Record<string, Turn> = {};
    pieces.forEach((piece, i) => {
      const wrong = TURNS[(TURNS.indexOf(piece.rotation) + 1 + (i % 3)) % TURNS.length] ?? 0;
      map[piece.id] = needsRotation && canTurn(piece) ? wrong : piece.rotation;
    });
    return map;
  }, [needsRotation, pieces]);

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    phase: 'building' as const,
    placed: {},
    turns: { ...startTurns },
    misses: 0,
    focus: null,
  }));

  const hintLadder = useHintLadder(state.misses, session.hint);

  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);
  const usedPieces = useMemo(() => new Set(Object.values(state.placed)), [state.placed]);
  const loose = useMemo(() => pieces.filter((p) => !usedPieces.has(p.id)), [pieces, usedPieces]);
  const done = Object.keys(state.placed).length >= pieces.length;

  /** the first empty outline this piece could live in (optionally only if the turn matches) */
  const slotFor = useCallback(
    (piece: ShapePiece, turn?: Turn) =>
      pieces.find(
        (slot) =>
          !state.placed[slot.id] &&
          sig(slot) === sig(piece) &&
          (turn === undefined || !canTurn(piece) || slot.rotation === turn),
      ) ?? null,
    [pieces, state.placed],
  );

  const nextSlot = useMemo(() => {
    const piece = loose[0];
    return piece ? (slotFor(piece)?.id ?? null) : null;
  }, [loose, slotFor]);

  useEffect(() => {
    session.progress(Object.keys(state.placed).length, pieces.length);
  }, [pieces.length, session, state.placed]);

  useBeaconLine(
    state.phase === 'building'
      ? `Let's build a ${blueprintName[challenge.blueprint]?.en ?? 'shape'}! Drag each piece onto its dotted outline.`
      : null,
    session.say,
    { es: `Vamos a construir: ${blueprintName[challenge.blueprint]?.es ?? ''}`, key: state.phase },
  );

  /* ----- celebration ----- */
  const glow = useSharedValue(0);
  const bounce = useSharedValue(0);
  const sparkPlay = useRef(0);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    dispatch({ type: 'FINISH' });
    session.complete();
  }, [session]);

  const comeAlive = useCallback(() => {
    dispatch({ type: 'ALIVE' });
    sparkPlay.current += 1;
    sfx.play('sparkle');
    haptics.celebrate();
    glow.value = withSequence(withTiming(1, timings.base), withTiming(0.45, { duration: 900 }));
    bounce.value = withSequence(withSpring(1, springs.bounce), withSpring(0, springs.gentle));
    setTimeout(() => {
      if (challenge.askCount) dispatch({ type: 'ASK' });
      else finish();
    }, 1500);
  }, [bounce, challenge.askCount, finish, glow]);

  /* ----- placing ----- */

  const place = useCallback(
    (slot: ShapePiece, piece: ShapePiece, turn: Turn) => {
      dispatch({ type: 'PLACE', slot: slot.id, piece: piece.id, turn });
      session.correct(piece.shape);
      sfx.play('clank');
      haptics.success();
      if (Object.keys(state.placed).length + 1 >= pieces.length) setTimeout(comeAlive, 260);
    },
    [comeAlive, pieces.length, session, state.placed],
  );

  const onDropPiece = useCallback(
    (piece: ShapePiece, slotId: string | null): DropOutcome => {
      if (state.phase !== 'building' || !slotId) return { accept: false, silent: true };
      const slot = byId.get(slotId);
      if (!slot) return { accept: false, silent: true };
      if (state.placed[slot.id]) return { accept: false };

      const turn = state.turns[piece.id] ?? piece.rotation;
      if (sig(slot) !== sig(piece)) {
        return {
          accept: false,
          onSettled: () => {
            dispatch({ type: 'MISS', focus: slotFor(piece)?.id ?? null });
            session.incorrect('wrong-slot');
          },
        };
      }
      if (canTurn(piece) && slot.rotation !== turn) {
        // Beacon has already given the answer away — let it click into place turned right.
        if (hintLadder.highlight) return { accept: true, snapToSlotId: slot.id, onSettled: () => place(slot, piece, slot.rotation) };
        return {
          accept: false,
          onSettled: () => {
            dispatch({ type: 'MISS', focus: slot.id });
            session.incorrect('wrong-turn');
          },
        };
      }
      return { accept: true, snapToSlotId: slot.id, onSettled: () => place(slot, piece, turn) };
    },
    [byId, hintLadder.highlight, place, session, slotFor, state.phase, state.placed, state.turns],
  );

  const tapPiece = useCallback(
    (piece: ShapePiece) => {
      if (state.phase !== 'building') return;
      const turn = state.turns[piece.id] ?? piece.rotation;
      const slot = slotFor(piece, turn);
      if (slot) {
        place(slot, piece, turn);
        return;
      }
      if (canTurn(piece)) {
        dispatch({ type: 'TURN', piece: piece.id });
        sfx.play('tap');
        haptics.select();
        return;
      }
      sfx.play('wrong-soft');
      haptics.nudge();
    },
    [place, slotFor, state.phase, state.turns],
  );

  const onReset = useCallback(() => {
    if (state.phase !== 'building') return;
    dispatch({ type: 'RESET', turns: startTurns });
    sfx.play('whoosh');
    haptics.tap();
  }, [startTurns, state.phase]);

  /* ----- geometry ----- */
  const board = Math.min(layout.boxWidth - spacing.md * 2 - spacing.sm * 2, layout.s(298));
  const unit = board / 100;
  const biggest = useMemo(() => Math.max(...pieces.map((p) => Math.max(p.w, p.h))), [pieces]);
  const tokenBox = Math.max(68, layout.s(76));
  /**
   * Tray pieces are thumbnails: each is scaled toward filling its token, but
   * blended with the blueprint's biggest piece so a rail still reads as longer
   * than a rung.
   */
  const scaleFor = useCallback(
    (piece: ShapePiece) => (tokenBox * 0.84) / (0.7 * Math.max(piece.w, piece.h) + 0.3 * biggest),
    [biggest, tokenBox],
  );

  /** the sheet breathes on the bench so the workshop never looks like a still */
  const breathe = useIdleBob(0.004, 3600);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.55 }));
  const boardStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + bounce.value * 0.04 + breathe.value }] }));

  /* ----- copy ----- */
  const hintText = useMemo(() => {
    const piece = loose[0];
    if (!piece) return 'Every piece is in! Watch it come alive.';
    const slot = state.focus ? byId.get(state.focus) : slotFor(piece);
    const name = shapeName[piece.shape].en;
    if (slot && canTurn(piece) && (state.turns[piece.id] ?? 0) !== slot.rotation) {
      return `That ${name} is the right piece — tap it to turn it, then drop it on the glowing outline.`;
    }
    return `Look for the ${name}-shaped outline. It is glowing for you!`;
  }, [byId, loose, slotFor, state.focus, state.turns]);

  const countOptions = useMemo(() => {
    const answer = challenge.askCount?.count ?? 1;
    const set = new Set<number>([answer]);
    let d = 1;
    while (set.size < 3 && d < 5) {
      if (answer - d > 0) set.add(answer - d);
      if (set.size < 3) set.add(answer + d);
      d += 1;
    }
    return [...set].sort((a, b) => a - b).map(String);
  }, [challenge.askCount]);

  const askShape = challenge.askCount ? shapeName[challenge.askCount.shape] : null;
  const title = `Build the ${blueprintName[challenge.blueprint]?.en ?? 'shape'}`;

  return (
    <GameFrame
      title={title}
      subtitle={needsRotation ? 'Tap a piece to turn it, then drag it onto its outline.' : 'Drag each piece onto its dotted outline.'}
      es={`Plano: ${blueprintName[challenge.blueprint]?.es ?? ''}`}
      compact={compact}
      hint={{ text: hintText, visible: hintLadder.showBubble && state.phase === 'building', onDismiss: hintLadder.dismiss }}
      overlay={
        challenge.askCount && askShape ? (
          <AskQuestion
            visible={state.phase === 'ask'}
            prompt={`How many ${askShape.plural} did you use?`}
            promptEs={`¿Cuántos ${askShape.es} usaste?`}
            options={countOptions}
            correct={String(challenge.askCount.count)}
            ageBand={ageBand}
            hintText={`Count them on the blueprint — there are ${challenge.askCount.count}.`}
            onCorrect={() => session.correct('count')}
            onWrong={() => session.incorrect('count')}
            onHint={session.hint}
            onDone={finish}
          />
        ) : null
      }
      tray={
        <View style={styles.trayInner}>
          <TrayRow style={styles.pieceRow}>
            {loose.map((piece, i) => {
              const turn = state.turns[piece.id] ?? piece.rotation;
              const matching = slotFor(piece, turn);
              return (
                <PieceToken
                  key={piece.id}
                  piece={piece}
                  turn={turn}
                  index={i}
                  box={tokenBox}
                  scale={scaleFor(piece)}
                  needsTurn={canTurn(piece) && !matching}
                  highlight={hintLadder.highlight && piece.id === loose[0]?.id}
                  onDropPiece={(slotId) => onDropPiece(piece, slotId)}
                  onTap={() => tapPiece(piece)}
                />
              );
            })}
            {loose.length === 0 ? <Chip label="All built!" tone="green" /> : null}
          </TrayRow>
          <View style={styles.actions}>
            <Chip label={`${Object.keys(state.placed).length} / ${pieces.length} pieces`} tone="cream" />
            <Button
              label="Start over"
              tone="white"
              size="md"
              icon={<ResetIcon size={20} />}
              onPress={onReset}
              disabled={state.phase !== 'building' || Object.keys(state.placed).length === 0}
            />
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        {/* ---- the workshop around the bench ---- */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.wall}>
            <WorkshopWall width={layout.boxWidth} />
          </View>
          <View style={styles.floor}>
            <WorkshopFloor width={layout.boxWidth} />
          </View>
        </View>

        <View style={[styles.bench, { width: board + spacing.sm * 2 }]}>
          <Animated.View style={[{ width: board, height: board }, boardStyle]}>
            <BlueprintSheet size={board} />
            {pieces.map((slot) => {
              const placedId = state.placed[slot.id];
              const piece = placedId ? byId.get(placedId) : undefined;
              return (
                <SlotZone
                  key={slot.id}
                  id={slot.id}
                  enabled={state.phase === 'building' && !placedId}
                  highlight={state.focus === slot.id || (hintLadder.highlight && nextSlot === slot.id)}
                  hitPad={layout.s(7)}
                  style={{
                    position: 'absolute',
                    left: slot.x * unit,
                    top: slot.y * unit,
                    width: slot.w * unit,
                    height: slot.h * unit,
                  }}
                >
                  {piece ? (
                    <PlacedPiece
                      piece={piece}
                      w={slot.w * unit - 4}
                      h={slot.h * unit - 4}
                      turn={slot.rotation}
                      alive={state.phase !== 'building'}
                    />
                  ) : (
                    <PieceArt shape={slot.shape} w={slot.w * unit - 4} h={slot.h * unit - 4} rotation={slot.rotation} color={slot.color} ghost />
                  )}
                </SlotZone>
              );
            })}
            <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
            {state.phase !== 'building' && !reduced ? (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <SparkleBurst play={sparkPlay.current} radius={board * 0.42} count={14} />
              </View>
            ) : null}
          </Animated.View>
          <BenchTools width={board} />
        </View>

        {done ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              It’s alive! Great building.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: '7%',
    gap: spacing.xs,
  },
  wall: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '6%',
    bottom: '14%',
    overflow: 'hidden',
    backgroundColor: palette.creamDeep,
    borderTopLeftRadius: radii.panel,
    borderTopRightRadius: radii.panel,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '15%',
    overflow: 'hidden',
    backgroundColor: palette.wood,
  },
  bench: {
    alignItems: 'center',
    backgroundColor: palette.wood,
    borderRadius: radii.panel,
    borderBottomWidth: 8,
    borderBottomColor: palette.woodDark,
    padding: spacing.sm,
    gap: 4,
    ...shadows.card,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.safetyYellow,
    borderRadius: radii.card,
  },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  trayInner: { gap: spacing.sm },
  pieceRow: { rowGap: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  token: { alignItems: 'center', justifyContent: 'center', shadowColor: palette.navy, shadowOffset: { width: 0, height: 5 } },
  tokenFace: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.tile,
    borderWidth: 3,
    borderColor: palette.creamDeep,
  },
  tokenHighlight: { borderColor: palette.safetyYellow },
  turnBadge: { position: 'absolute', right: 2, top: 2 },
  dragging: { zIndex: 60, elevation: 14 },
});
