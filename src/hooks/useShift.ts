/**
 * useShift — the one place the shift machine, the zustand store and today's
 * dispatch board meet.
 *
 * The actor is a module singleton on purpose: a shift spans several routes
 * (Firehouse → Dispatch → Mission → Kitchen → Dispatch), so it cannot live
 * inside any one screen's component tree.
 */
import { useCallback, useMemo } from 'react';
import { createActor, type Actor } from 'xstate';
import { useSelector } from '@xstate/react';
import type { AgeBand } from '@/learning/types';
import type { MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { missions, missionById } from '@/content/missions';
import { buildDispatchBoard } from '@/content/dispatchBoard';
import { DEFAULT_SHIFT_TARGET, remainingBoard, shiftMachine, shiftProgress, type ShiftContext, type ShiftMachine } from '@/machines/shiftMachine';
import { useGame } from '@/state/store';

/* ------------------------------------------------------------------ */
/* The singleton actor                                                  */
/* ------------------------------------------------------------------ */

let actorRef: Actor<ShiftMachine> | null = null;

/** The live shift actor (created on first use). */
export function getShiftActor(): Actor<ShiftMachine> {
  if (!actorRef) {
    actorRef = createActor(shiftMachine);
    actorRef.start();
  }
  return actorRef;
}

/** Tests / dev tools only — throw the current shift away. */
export function resetShiftActor(): void {
  actorRef?.stop();
  actorRef = null;
}

/* ------------------------------------------------------------------ */
/* Board building                                                       */
/* ------------------------------------------------------------------ */

export interface DispatchBoardInput {
  /** mission ids the child has already finished (any shift) */
  completed: string[];
  ageBand: AgeBand;
  /** how many slips to put on the board */
  size: number;
  seed: number;
}

/** Mission ids that are playable now (requirements met). */
export function availableMissions(completed: string[]): MissionDef[] {
  const done = new Set(completed);
  return missions.filter((m) => (m.requires ?? []).every((r) => done.has(r)));
}

/**
 * Today's board. Prefers the content engine's `buildDispatchBoard`; falls back
 * to "the first few missions the child can play", newest-first, so the station
 * always has work even before the content lands.
 */
export function makeBoard(input: DispatchBoardInput): string[] {
  try {
    const built = buildDispatchBoard(input);
    const known = built.filter((id) => !!missionById(id));
    if (known.length > 0) return known.slice(0, Math.max(1, input.size));
  } catch (e) {
    // The board builder must never be the reason a child cannot start a shift.
    console.warn('[shift] buildDispatchBoard failed; using the fallback board', e);
  }
  const done = new Set(input.completed);
  const playable = availableMissions(input.completed);
  const fresh = playable.filter((m) => !done.has(m.id));
  const board = [...fresh, ...playable.filter((m) => done.has(m.id))].slice(0, Math.max(1, input.size));
  return board.map((m) => m.id);
}

/* ------------------------------------------------------------------ */
/* The hook                                                             */
/* ------------------------------------------------------------------ */

export interface UseShift {
  /** e.g. 'offDuty' | 'arriving' | 'onDuty.board' | 'mealTime' | 'kitchen' | 'shiftComplete' */
  state: string;
  context: ShiftContext;
  /** mission ids on today's board */
  board: string[];
  /** the board resolved to mission definitions (missing ids are dropped) */
  boardMissions: MissionDef[];
  /** board entries not yet played this shift */
  remaining: string[];
  active: boolean;
  onDuty: boolean;
  greeting: boolean;
  mealTime: boolean;
  complete: boolean;
  missionsDone: number;
  target: number;
  starsEarned: number;
  progress: number;

  startShift: (opts?: { size?: number; target?: number; seed?: number }) => string[];
  greeted: () => void;
  pickMission: (id: string) => void;
  missionDone: (stars: Stars) => void;
  goKitchen: () => void;
  kitchenDone: () => void;
  endShift: () => void;
}

const dotted = (value: unknown, prefix = ''): string => {
  if (typeof value === 'string') return prefix ? `${prefix}.${value}` : value;
  if (value && typeof value === 'object') {
    const [key] = Object.keys(value as Record<string, unknown>);
    if (key) return dotted((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key);
  }
  return prefix;
};

export function useShift(): UseShift {
  const actor = getShiftActor();
  const snapshot = useSelector(actor, (s) => s);
  const ageBand = useGame((s) => s.profile.ageBand);
  // Select the stable record, derive the key list with useMemo — a selector that
  // returns a fresh array each call makes zustand's snapshot comparison loop.
  const missionsRecord = useGame((s) => s.progress.missions);
  const completedIds = useMemo(() => Object.keys(missionsRecord), [missionsRecord]);
  const storeStartShift = useGame((s) => s.startShift);
  const storeEndShift = useGame((s) => s.endShift);

  const context = snapshot.context;
  const state = dotted(snapshot.value);

  const startShift = useCallback<UseShift['startShift']>(
    (opts) => {
      const wanted = opts?.target ?? DEFAULT_SHIFT_TARGET;
      const board = makeBoard({
        completed: completedIds,
        ageBand,
        size: opts?.size ?? wanted,
        seed: opts?.seed ?? Math.floor(Date.now() / 86_400_000), // one board per day
      });
      // Early on, fewer missions are unlocked than a full shift asks for. Cap
      // the target to what is actually on the board so a shift can always end.
      const target = Math.max(1, Math.min(wanted, board.length));
      actor.send({ type: 'START_SHIFT', board, target });
      storeStartShift(board);
      return board;
    },
    [actor, ageBand, completedIds, storeStartShift],
  );

  const endShift = useCallback(() => {
    actor.send({ type: 'END_SHIFT' });
    storeEndShift();
  }, [actor, storeEndShift]);

  const boardMissions = useMemo(
    () => context.board.map((id) => missionById(id)).filter((m): m is MissionDef => !!m),
    [context.board],
  );

  return useMemo(
    () => ({
      state,
      context,
      board: context.board,
      boardMissions,
      remaining: remainingBoard(context),
      active: state !== 'offDuty' && state !== 'shiftComplete',
      onDuty: state.startsWith('onDuty'),
      greeting: state === 'arriving',
      mealTime: state === 'mealTime',
      complete: state === 'shiftComplete',
      missionsDone: context.missionsDone,
      target: context.target,
      starsEarned: context.starsEarned,
      progress: shiftProgress(context),
      startShift,
      greeted: () => actor.send({ type: 'GREETED' }),
      pickMission: (id: string) => actor.send({ type: 'PICK_MISSION', id }),
      missionDone: (stars: Stars) => actor.send({ type: 'MISSION_DONE', stars }),
      goKitchen: () => actor.send({ type: 'GO_KITCHEN' }),
      kitchenDone: () => actor.send({ type: 'KITCHEN_DONE' }),
      endShift,
    }),
    [actor, boardMissions, context, endShift, startShift, state],
  );
}
