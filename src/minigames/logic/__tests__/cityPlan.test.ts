/**
 * The board reads a challenge as a town: roads that join up, blocks between
 * them, and one address the truck pulls up outside.
 */
import type { RescueRouteChallenge } from '@/learning/types';
import { cityPlan } from '../RescueRoute/cityPlan';

/** A 4×4 plan: streets on the even rows/cols, four blocks between them. */
const town: RescueRouteChallenge = {
  kind: 'rescue-route',
  grid: { rows: 4, cols: 4 },
  start: { row: 3, col: 0 },
  startHeading: 'N',
  goal: { row: 1, col: 2 },
  goalScene: 'bakery',
  blocked: [
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
  ],
  maxCommands: 9,
  goalSide: 'W',
  landmarks: [
    { cells: [{ row: 1, col: 1 }], scene: 'bakery', destination: true },
    { cells: [{ row: 1, col: 3 }], scene: 'library' },
    { cells: [{ row: 3, col: 1 }], scene: 'station-yard' },
    { cells: [{ row: 3, col: 3 }], scene: 'park' },
  ],
};

describe('cityPlan', () => {
  const plan = cityPlan(town);

  it('calls every cell that is not a block a road', () => {
    expect(plan.isRoad({ row: 0, col: 0 })).toBe(true);
    expect(plan.isRoad({ row: 1, col: 2 })).toBe(true);
    expect(plan.isRoad({ row: 1, col: 1 })).toBe(false);
    expect(plan.isRoad({ row: -1, col: 0 })).toBe(false);
  });

  it('joins the streets up: a crossroads has four ways out, a corner two', () => {
    expect(plan.exits({ row: 0, col: 2 }).sort()).toEqual(['E', 'S', 'W']);
    expect(plan.exits({ row: 0, col: 0 }).sort()).toEqual(['E', 'S']);
    /* between two blocks the street runs straight through */
    expect(plan.exits({ row: 1, col: 2 }).sort()).toEqual(['N', 'S']);
  });

  it('stands the call on the block beside the goal, not on the goal', () => {
    expect(plan.goalSide).toBe('W');
    expect(plan.destination?.scene).toBe('bakery');
    expect(plan.destination?.cells).toEqual([{ row: 1, col: 1 }]);
    expect(plan.isRoad(town.goal)).toBe(true);
  });

  it('measures each block as a rectangle the board can draw', () => {
    const park = plan.plots.find((p) => p.scene === 'park');
    expect(park).toMatchObject({ row: 3, col: 3, rows: 1, cols: 1 });
  });

  it('dresses a challenge that predates landmarks rather than drawing bare tarmac', () => {
    const old: RescueRouteChallenge = { ...town, landmarks: undefined, goalSide: undefined };
    const guessed = cityPlan(old);
    expect(guessed.plots).toHaveLength(4);
    expect(guessed.plots.every((p) => p.scene.length > 0)).toBe(true);
    /* a block next to the goal becomes the address, so the call is never nowhere */
    expect(guessed.destination?.cells).toEqual([{ row: 1, col: 3 }]);
    expect(guessed.destination?.scene).toBe('bakery');
    expect(guessed.goalSide).toBe('E');
  });

  it('groups a widened block into one plot', () => {
    const wide = cityPlan({
      ...town,
      blocked: [...town.blocked, { row: 1, col: 2 }],
      goal: { row: 0, col: 2 },
      goalSide: 'S',
      landmarks: [
        {
          cells: [
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 1, col: 3 },
          ],
          scene: 'bakery',
          destination: true,
        },
        { cells: [{ row: 3, col: 1 }], scene: 'station-yard' },
        { cells: [{ row: 3, col: 3 }], scene: 'park' },
      ],
    });
    expect(wide.plots).toHaveLength(3);
    expect(wide.destination).toMatchObject({ row: 1, col: 1, rows: 1, cols: 3 });
  });
});
