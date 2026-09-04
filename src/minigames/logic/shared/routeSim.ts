/**
 * ROUTE PROGRAM SIMULATION — pure, no React.
 *
 * `src/utils/grid.ts` owns the maths (headings, BFS, solveRoute). This adds the
 * step-by-step trace the game needs to animate the truck one cell at a time and
 * to tell the child exactly which instruction bumped.
 */
import type { GridPos, Heading, RouteCommand } from '@/learning/types';
import { blockedSet, inBounds, posKey, samePos, solveRoute, stepForward, turn, type RouteSpec } from '@/utils/grid';

export interface RouteState {
  pos: GridPos;
  heading: Heading;
}

export type StepOutcome = 'moved' | 'turned' | 'arrived' | 'blocked' | 'off-map';

export interface RouteStep {
  index: number;
  command: RouteCommand;
  from: RouteState;
  to: RouteState;
  outcome: StepOutcome;
}

export interface RouteTrace {
  steps: RouteStep[];
  end: RouteState;
  reached: boolean;
  /** index of the command that bumped into something, or null */
  bumpedAt: number | null;
  /** how many commands actually ran (the rest are ignored once the truck arrives) */
  used: number;
}

export const HEADING_ANGLE: Record<Heading, number> = { N: 0, E: 90, S: 180, W: 270 };

/** Run the child's program one command at a time. Stops at the goal or a bump. */
export function traceRoute(spec: RouteSpec, program: readonly RouteCommand[]): RouteTrace {
  const walls = blockedSet(spec.blocked);
  const steps: RouteStep[] = [];
  let state: RouteState = { pos: spec.start, heading: spec.startHeading };
  let reached = samePos(spec.start, spec.goal);
  let bumpedAt: number | null = null;

  for (let i = 0; i < program.length && !reached && bumpedAt === null; i++) {
    const command = program[i];
    if (!command) break;
    const from = state;
    if (command === 'forward') {
      const ahead = stepForward(from.pos, from.heading);
      if (!inBounds(spec.grid, ahead)) {
        steps.push({ index: i, command, from, to: from, outcome: 'off-map' });
        bumpedAt = i;
        break;
      }
      if (walls.has(posKey(ahead))) {
        steps.push({ index: i, command, from, to: from, outcome: 'blocked' });
        bumpedAt = i;
        break;
      }
      const to: RouteState = { pos: ahead, heading: from.heading };
      const arrived = samePos(ahead, spec.goal);
      steps.push({ index: i, command, from, to, outcome: arrived ? 'arrived' : 'moved' });
      state = to;
      if (arrived) reached = true;
    } else {
      const to: RouteState = { pos: from.pos, heading: turn(from.heading, command) };
      steps.push({ index: i, command, from, to, outcome: 'turned' });
      state = to;
    }
  }

  return { steps, end: state, reached, bumpedAt, used: steps.length };
}

/** Shortest program from the spec's start (null when unreachable). */
export function optimalProgram(spec: RouteSpec): RouteCommand[] | null {
  return solveRoute(spec);
}

export function optimalLength(spec: RouteSpec): number | null {
  return solveRoute(spec)?.length ?? null;
}

/** The single best next command from an arbitrary state — powers Beacon's hint. */
export function bestNextCommand(spec: RouteSpec, from: RouteState): RouteCommand | null {
  const solution = solveRoute({ ...spec, start: from.pos, startHeading: from.heading });
  return solution?.[0] ?? null;
}

export const commandLabel: Record<RouteCommand, string> = {
  forward: 'Forward',
  left: 'Left',
  right: 'Right',
  'turn-around': 'Turn Around',
};

export const commandLabelEs: Record<RouteCommand, string> = {
  forward: 'Adelante',
  left: 'Izquierda',
  right: 'Derecha',
  'turn-around': 'Media vuelta',
};
