/**
 * The board-building half of useShift is pure, and it is the piece that has to
 * keep working when the content engine is mid-change — so it gets tests.
 */
import { missions } from '@/content/missions';
import { availableMissions, makeBoard } from '../useShift';

describe('availableMissions', () => {
  it('only returns missions whose requirements are met', () => {
    const first = availableMissions([]);
    expect(first.length).toBeGreaterThan(0);
    for (const m of first) expect(m.requires ?? []).toHaveLength(0);
  });

  it('opens up as the child completes missions', () => {
    const start = availableMissions([]).length;
    const allIds = missions.map((m) => m.id);
    expect(availableMissions(allIds)).toHaveLength(missions.length);
    expect(availableMissions(allIds).length).toBeGreaterThanOrEqual(start);
  });
});

describe('makeBoard', () => {
  const base = { completed: [] as string[], ageBand: 'B' as const, size: 3, seed: 42 };

  it('fills the board with playable missions, up to what is unlocked', () => {
    const board = makeBoard(base);
    expect(board.length).toBeGreaterThan(0);
    expect(board.length).toBeLessThanOrEqual(Math.min(3, availableMissions([]).length));
    for (const id of board) expect(missions.some((m) => m.id === id)).toBe(true);
  });

  it('never repeats a mission', () => {
    const board = makeBoard(base);
    expect(new Set(board).size).toBe(board.length);
  });

  it('never puts a locked mission on the board', () => {
    const board = makeBoard(base);
    for (const id of board) {
      const mission = missions.find((m) => m.id === id);
      expect(mission?.requires ?? []).toHaveLength(0);
    }
  });

  it('is stable for a given seed', () => {
    expect(makeBoard(base)).toEqual(makeBoard(base));
  });

  it('honours the requested size and always returns at least one slip', () => {
    expect(makeBoard({ ...base, size: 1 })).toHaveLength(1);
    expect(makeBoard({ ...base, size: 0 }).length).toBeGreaterThanOrEqual(1);
    expect(makeBoard({ ...base, size: 2 })).toHaveLength(2);
    // more slots than unlocked missions still gives a usable board
    expect(makeBoard({ ...base, size: 99 }).length).toBe(availableMissions([]).length);
  });

  it('still builds a board for a child who has finished everything', () => {
    const board = makeBoard({ ...base, completed: missions.map((m) => m.id) });
    expect(board.length).toBeGreaterThan(0);
    expect(new Set(board).size).toBe(board.length);
  });
});
