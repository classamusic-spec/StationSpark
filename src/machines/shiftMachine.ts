/**
 * SHIFT STATE MACHINE (XState v5)
 *
 * A "shift" is one sitting at Station Spark: the child clocks on, the bell
 * rings, they pick jobs off the dispatch board, the crew breaks for a meal
 * halfway through, and the shift wraps up with a celebration.
 *
 *   offDuty ─START_SHIFT→ arriving ─GREETED→ onDuty.board
 *                                              │  PICK_MISSION
 *                                              ▼
 *                                        onDuty.inMission ─MISSION_DONE→ …
 *                                              │
 *          every 2nd mission ──────────────────┤──→ mealTime ─GO_KITCHEN→ kitchen
 *          after `target` missions ────────────┴──→ shiftComplete
 *
 * `END_SHIFT` is honoured from anywhere on duty — a child can always stop.
 * Nothing here is a timer that punishes; `arriving` has a delayed transition
 * only so a missing `GREETED` from the UI can never strand the child.
 *
 * The machine is UI-agnostic and store-agnostic; `src/hooks/useShift.ts` is the
 * only thing that wires it to zustand and to navigation.
 */
import { assign, setup } from 'xstate';
import type { Stars } from '@/minigames/types';

/** How many missions make a full shift (the child may always stop sooner). */
export const DEFAULT_SHIFT_TARGET = 3;
/** Suggest the firehouse kitchen after every N completed missions. */
export const MEAL_EVERY = 2;
/** Safety net: leave the greeting on its own if the UI never says GREETED. */
export const GREETING_MS = 2600;

export interface ShiftContext {
  /** mission ids on today's dispatch board */
  board: string[];
  /** missions needed to complete the shift */
  target: number;
  missionsDone: number;
  mealsTaken: number;
  currentMissionId: string | null;
  /** every mission finished this shift, in order */
  completed: { id: string; stars: Stars }[];
  starsEarned: number;
  startedAt: number | null;
  endedAt: number | null;
}

export type ShiftEvent =
  | { type: 'START_SHIFT'; board: string[]; target?: number }
  /** the arriving greeting finished (bell + Captain Bea) */
  | { type: 'GREETED' }
  | { type: 'PICK_MISSION'; id: string }
  | { type: 'MISSION_DONE'; stars: Stars }
  | { type: 'GO_KITCHEN' }
  | { type: 'KITCHEN_DONE' }
  | { type: 'END_SHIFT' };

export const initialShiftContext: ShiftContext = {
  board: [],
  target: DEFAULT_SHIFT_TARGET,
  missionsDone: 0,
  mealsTaken: 0,
  currentMissionId: null,
  completed: [],
  starsEarned: 0,
  startedAt: null,
  endedAt: null,
};

/** Total stars a full shift could earn (3 per mission). */
export const shiftMaxStars = (ctx: ShiftContext): number => ctx.target * 3;

/** 0..1 progress through the shift. */
export const shiftProgress = (ctx: ShiftContext): number =>
  ctx.target <= 0 ? 1 : Math.min(1, ctx.missionsDone / ctx.target);

/** Missions on the board that have not been played yet this shift. */
export function remainingBoard(ctx: ShiftContext): string[] {
  const done = new Set(ctx.completed.map((c) => c.id));
  return ctx.board.filter((id) => !done.has(id));
}

export const shiftMachine = setup({
  types: {
    context: {} as ShiftContext,
    events: {} as ShiftEvent,
  },
  guards: {
    /** the shift's mission target is already met */
    reachedTarget: ({ context }) => context.missionsDone >= context.target,
    /**
     * XState evaluates guards against the context BEFORE the transition's
     * actions run, so anything deciding where a MISSION_DONE goes has to reason
     * about the count it is *about* to become.
     */
    willReachTarget: ({ context }) => context.missionsDone + 1 >= context.target,
    isMealBeat: ({ context }) => (context.missionsDone + 1) % MEAL_EVERY === 0,
  },
  actions: {
    beginShift: assign(({ context, event }) => ({
      board: event.type === 'START_SHIFT' ? event.board : context.board,
      target: event.type === 'START_SHIFT' ? (event.target ?? DEFAULT_SHIFT_TARGET) : context.target,
      missionsDone: 0,
      mealsTaken: 0,
      currentMissionId: null,
      completed: [],
      starsEarned: 0,
      startedAt: Date.now(),
      endedAt: null,
    })),
    pickMission: assign({
      currentMissionId: ({ context, event }) => (event.type === 'PICK_MISSION' ? event.id : context.currentMissionId),
    }),
    finishMission: assign(({ context, event }) => {
      if (event.type !== 'MISSION_DONE') return {};
      const id = context.currentMissionId;
      return {
        missionsDone: context.missionsDone + 1,
        starsEarned: context.starsEarned + event.stars,
        completed: id ? [...context.completed, { id, stars: event.stars }] : context.completed,
        currentMissionId: null,
      };
    }),
    takeMeal: assign({ mealsTaken: ({ context }) => context.mealsTaken + 1 }),
    endShift: assign({ endedAt: () => Date.now(), currentMissionId: null }),
  },
}).createMachine({
  id: 'shift',
  context: () => ({ ...initialShiftContext }),
  initial: 'offDuty',
  states: {
    /** Not on shift. The Firehouse screen sits here. */
    offDuty: {
      on: { START_SHIFT: { target: 'arriving', actions: 'beginShift' } },
    },

    /** Bell + Captain Bea's greeting on the Dispatch screen. */
    arriving: {
      on: {
        GREETED: 'onDuty',
        // an eager child may tap a slip during the greeting — never block them
        PICK_MISSION: { target: 'onDuty.inMission', actions: 'pickMission' },
        END_SHIFT: { target: 'shiftComplete', actions: 'endShift' },
      },
      after: { [GREETING_MS]: 'onDuty' },
    },

    /** On the clock: choosing a job, or in one. */
    onDuty: {
      initial: 'board',
      on: { END_SHIFT: { target: 'shiftComplete', actions: 'endShift' } },
      states: {
        board: {
          on: {
            PICK_MISSION: { target: 'inMission', actions: 'pickMission' },
            // the child can visit the kitchen whenever they like
            GO_KITCHEN: { target: '#shift.kitchen', actions: 'takeMeal' },
          },
        },
        inMission: {
          on: {
            MISSION_DONE: [
              { guard: 'willReachTarget', target: '#shift.shiftComplete', actions: ['finishMission', 'endShift'] },
              { guard: 'isMealBeat', target: '#shift.mealTime', actions: 'finishMission' },
              { target: 'board', actions: 'finishMission' },
            ],
          },
        },
      },
    },

    /**
     * Meal break. Captain Bea suggests the firehouse kitchen; the child may
     * cook (GO_KITCHEN) or wave it off (KITCHEN_DONE) and go back to the board.
     */
    mealTime: {
      on: {
        GO_KITCHEN: { target: 'kitchen', actions: 'takeMeal' },
        KITCHEN_DONE: 'onDuty.board',
        PICK_MISSION: { target: 'onDuty.inMission', actions: 'pickMission' },
        END_SHIFT: { target: 'shiftComplete', actions: 'endShift' },
      },
    },

    kitchen: {
      on: {
        KITCHEN_DONE: [
          { guard: 'reachedTarget', target: 'shiftComplete', actions: 'endShift' },
          { target: 'onDuty.board' },
        ],
        // a child who wanders back to the board mid-snack is never stuck
        PICK_MISSION: { target: 'onDuty.inMission', actions: 'pickMission' },
        END_SHIFT: { target: 'shiftComplete', actions: 'endShift' },
      },
    },

    /** Shift wrap-up: stars, streak, "see you next shift!". */
    shiftComplete: {
      on: { START_SHIFT: { target: 'arriving', actions: 'beginShift' } },
    },
  },
});

export type ShiftMachine = typeof shiftMachine;

/** Convenience for screens: a friendly label for whatever the crew is doing. */
export function shiftStatusLabel(value: string): string {
  switch (value) {
    case 'offDuty':
      return 'Off duty';
    case 'arriving':
      return 'Clocking on';
    case 'mealTime':
      return 'Meal break';
    case 'kitchen':
      return 'In the kitchen';
    case 'shiftComplete':
      return 'Shift complete';
    default:
      return 'On duty';
  }
}
