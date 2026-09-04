import { createActor } from 'xstate';
import {
  DEFAULT_SHIFT_TARGET,
  MEAL_EVERY,
  remainingBoard,
  shiftMachine,
  shiftMaxStars,
  shiftProgress,
  shiftStatusLabel,
} from '../shiftMachine';

const BOARD = ['bakery-bell', 'park-picnic', 'pizza-shop-panic'];

/** Start an actor and clock on. Tests stop the actor so `after` timers unwind. */
function onDuty(board: string[] = BOARD, target?: number) {
  const actor = createActor(shiftMachine).start();
  actor.send({ type: 'START_SHIFT', board, ...(target === undefined ? {} : { target }) });
  actor.send({ type: 'GREETED' });
  return actor;
}

/** Play one mission end to end. */
function playMission(actor: ReturnType<typeof onDuty>, id: string, stars: 1 | 2 | 3 = 3) {
  actor.send({ type: 'PICK_MISSION', id });
  actor.send({ type: 'MISSION_DONE', stars });
}

describe('shiftMachine', () => {
  it('starts off duty with an empty board', () => {
    const actor = createActor(shiftMachine).start();
    expect(actor.getSnapshot().value).toBe('offDuty');
    expect(actor.getSnapshot().context.board).toEqual([]);
    expect(actor.getSnapshot().context.target).toBe(DEFAULT_SHIFT_TARGET);
    actor.stop();
  });

  it('START_SHIFT stores the board and greets before the board shows', () => {
    const actor = createActor(shiftMachine).start();
    actor.send({ type: 'START_SHIFT', board: BOARD });
    expect(actor.getSnapshot().value).toBe('arriving');
    expect(actor.getSnapshot().context.board).toEqual(BOARD);
    expect(actor.getSnapshot().context.startedAt).not.toBeNull();
    actor.send({ type: 'GREETED' });
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'board' });
    actor.stop();
  });

  it('lets an eager child pick a mission during the greeting', () => {
    const actor = createActor(shiftMachine).start();
    actor.send({ type: 'START_SHIFT', board: BOARD });
    actor.send({ type: 'PICK_MISSION', id: 'bakery-bell' });
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'inMission' });
    expect(actor.getSnapshot().context.currentMissionId).toBe('bakery-bell');
    actor.stop();
  });

  it('records stars and returns to the board after the first mission', () => {
    const actor = onDuty();
    playMission(actor, 'bakery-bell', 2);
    const ctx = actor.getSnapshot().context;
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'board' });
    expect(ctx.missionsDone).toBe(1);
    expect(ctx.starsEarned).toBe(2);
    expect(ctx.completed).toEqual([{ id: 'bakery-bell', stars: 2 }]);
    expect(ctx.currentMissionId).toBeNull();
    actor.stop();
  });

  it(`suggests the kitchen after every ${MEAL_EVERY} missions`, () => {
    const actor = onDuty();
    playMission(actor, 'bakery-bell');
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'board' });
    playMission(actor, 'park-picnic');
    expect(actor.getSnapshot().value).toBe('mealTime');
    actor.stop();
  });

  it('meal time → kitchen → back to the board, counting the meal', () => {
    const actor = onDuty();
    playMission(actor, 'bakery-bell');
    playMission(actor, 'park-picnic');
    actor.send({ type: 'GO_KITCHEN' });
    expect(actor.getSnapshot().value).toBe('kitchen');
    expect(actor.getSnapshot().context.mealsTaken).toBe(1);
    actor.send({ type: 'KITCHEN_DONE' });
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'board' });
    actor.stop();
  });

  it('meal time can be waved off without cooking', () => {
    const actor = onDuty();
    playMission(actor, 'bakery-bell');
    playMission(actor, 'park-picnic');
    actor.send({ type: 'KITCHEN_DONE' });
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'board' });
    expect(actor.getSnapshot().context.mealsTaken).toBe(0);
    actor.stop();
  });

  it(`completes the shift after ${DEFAULT_SHIFT_TARGET} missions`, () => {
    const actor = onDuty();
    playMission(actor, 'bakery-bell', 3);
    playMission(actor, 'park-picnic', 2);
    actor.send({ type: 'KITCHEN_DONE' }); // skip the meal
    playMission(actor, 'pizza-shop-panic', 3);
    const ctx = actor.getSnapshot().context;
    expect(actor.getSnapshot().value).toBe('shiftComplete');
    expect(ctx.missionsDone).toBe(3);
    expect(ctx.starsEarned).toBe(8);
    expect(ctx.endedAt).not.toBeNull();
    actor.stop();
  });

  it('honours a custom shift target', () => {
    const actor = onDuty(BOARD, 1);
    playMission(actor, 'bakery-bell');
    expect(actor.getSnapshot().value).toBe('shiftComplete');
    expect(shiftMaxStars(actor.getSnapshot().context)).toBe(3);
    actor.stop();
  });

  it('the child can end the shift at any time', () => {
    for (const stop of [
      (a: ReturnType<typeof onDuty>) => a,
      (a: ReturnType<typeof onDuty>) => {
        a.send({ type: 'PICK_MISSION', id: 'bakery-bell' });
        return a;
      },
      (a: ReturnType<typeof onDuty>) => {
        playMission(a, 'bakery-bell');
        playMission(a, 'park-picnic');
        return a;
      },
    ]) {
      const actor = stop(onDuty());
      actor.send({ type: 'END_SHIFT' });
      expect(actor.getSnapshot().value).toBe('shiftComplete');
      actor.stop();
    }
  });

  it('can go to the kitchen straight from the board', () => {
    const actor = onDuty();
    actor.send({ type: 'GO_KITCHEN' });
    expect(actor.getSnapshot().value).toBe('kitchen');
    actor.send({ type: 'KITCHEN_DONE' });
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'board' });
    actor.stop();
  });

  it('never strands the child: every on-duty state accepts PICK_MISSION', () => {
    const actor = onDuty();
    actor.send({ type: 'GO_KITCHEN' });
    expect(actor.getSnapshot().value).toBe('kitchen');
    actor.send({ type: 'PICK_MISSION', id: 'bakery-bell' });
    expect(actor.getSnapshot().value).toEqual({ onDuty: 'inMission' });
    actor.stop();
  });

  it('a finished shift can be started again', () => {
    const actor = onDuty(BOARD, 1);
    playMission(actor, 'bakery-bell');
    expect(actor.getSnapshot().value).toBe('shiftComplete');
    actor.send({ type: 'START_SHIFT', board: ['school-fair'] });
    const ctx = actor.getSnapshot().context;
    expect(actor.getSnapshot().value).toBe('arriving');
    expect(ctx.board).toEqual(['school-fair']);
    expect(ctx.missionsDone).toBe(0);
    expect(ctx.starsEarned).toBe(0);
    expect(ctx.completed).toEqual([]);
    actor.stop();
  });

  it('remainingBoard drops missions already played this shift', () => {
    const actor = onDuty();
    playMission(actor, 'park-picnic');
    expect(remainingBoard(actor.getSnapshot().context)).toEqual(['bakery-bell', 'pizza-shop-panic']);
    actor.stop();
  });

  it('shiftProgress runs 0 → 1 and never overshoots', () => {
    const actor = onDuty(BOARD, 2);
    expect(shiftProgress(actor.getSnapshot().context)).toBe(0);
    playMission(actor, 'bakery-bell');
    expect(shiftProgress(actor.getSnapshot().context)).toBe(0.5);
    playMission(actor, 'park-picnic');
    expect(shiftProgress(actor.getSnapshot().context)).toBe(1);
    actor.stop();
  });

  it('labels every state for the UI', () => {
    expect(shiftStatusLabel('offDuty')).toBe('Off duty');
    expect(shiftStatusLabel('arriving')).toBe('Clocking on');
    expect(shiftStatusLabel('mealTime')).toBe('Meal break');
    expect(shiftStatusLabel('kitchen')).toBe('In the kitchen');
    expect(shiftStatusLabel('shiftComplete')).toBe('Shift complete');
    expect(shiftStatusLabel('onDuty')).toBe('On duty');
  });
});
