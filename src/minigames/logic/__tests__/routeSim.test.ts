import type { RouteCommand } from '@/learning/types';
import type { RouteSpec } from '@/utils/grid';
import { bestNextCommand, optimalLength, optimalProgram, traceRoute } from '../shared/routeSim';

/** The reference "Code the Route!" board: 4×4, truck bottom-left, bakery top-right. */
const spec: RouteSpec = {
  grid: { rows: 4, cols: 4 },
  start: { row: 3, col: 0 },
  startHeading: 'N',
  goal: { row: 0, col: 3 },
  blocked: [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 2, col: 1 },
  ],
};

const program = (...cmds: RouteCommand[]) => cmds;

describe('traceRoute', () => {
  it('drives the truck to the bakery and reports every step', () => {
    const trace = traceRoute(
      spec,
      program('forward', 'forward', 'forward', 'right', 'forward', 'forward', 'forward'),
    );
    expect(trace.reached).toBe(true);
    expect(trace.bumpedAt).toBeNull();
    expect(trace.end.pos).toEqual({ row: 0, col: 3 });
    expect(trace.end.heading).toBe('E');
    expect(trace.steps).toHaveLength(7);
    expect(trace.steps.map((s) => s.outcome)).toEqual([
      'moved',
      'moved',
      'moved',
      'turned',
      'moved',
      'moved',
      'arrived',
    ]);
  });

  it('bumps gently into roadwork and stops there', () => {
    const trace = traceRoute(spec, program('forward', 'forward', 'right', 'forward', 'forward'));
    expect(trace.reached).toBe(false);
    expect(trace.bumpedAt).toBe(3);
    expect(trace.steps[3]?.outcome).toBe('blocked');
    // the truck stays where it was — it never drives into the closed road
    expect(trace.end.pos).toEqual({ row: 1, col: 0 });
    expect(trace.used).toBe(4);
  });

  it('bumps at the edge of the map', () => {
    const trace = traceRoute(spec, program('turn-around', 'forward'));
    expect(trace.steps[1]?.outcome).toBe('off-map');
    expect(trace.bumpedAt).toBe(1);
    expect(trace.end.pos).toEqual(spec.start);
  });

  it('ignores commands after the truck arrives', () => {
    const trace = traceRoute(
      spec,
      program('forward', 'forward', 'forward', 'right', 'forward', 'forward', 'forward', 'left', 'forward'),
    );
    expect(trace.used).toBe(7);
    expect(trace.reached).toBe(true);
  });

  it('turns without moving', () => {
    const trace = traceRoute(spec, program('left', 'right', 'turn-around'));
    expect(trace.end.pos).toEqual(spec.start);
    expect(trace.end.heading).toBe('S');
    expect(trace.reached).toBe(false);
    expect(trace.bumpedAt).toBeNull();
  });
});

describe('solver helpers', () => {
  it('finds the shortest program and replays it successfully', () => {
    const best = optimalProgram(spec);
    expect(best).not.toBeNull();
    expect(optimalLength(spec)).toBe(best?.length);
    expect(best?.length).toBe(7);
    expect(traceRoute(spec, best ?? []).reached).toBe(true);
  });

  it('suggests the next best command from any state', () => {
    expect(bestNextCommand(spec, { pos: spec.start, heading: 'N' })).toBe('forward');
    // facing away from the goal at the top-left corner → turn right toward the bakery
    expect(bestNextCommand(spec, { pos: { row: 0, col: 0 }, heading: 'N' })).toBe('right');
    expect(bestNextCommand(spec, { pos: spec.goal, heading: 'N' })).toBeNull();
  });
});
