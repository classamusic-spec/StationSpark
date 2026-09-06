/**
 * TRUCK RUN — THE SIM.
 *
 * Every rule of the driving game lives here: lane position, speed, jumps,
 * collisions, gates and the score. No React, no drawing, no sound — the
 * component turns the events below into feedback, and the two renderers (3D
 * road and 2D fallback) both draw exactly what `visibleItems()` returns, so
 * neither of them can change the game.
 *
 * The sim is driven by a FIXED 1/60 s timestep with a bounded accumulator, so
 * the same inputs give the same run on a 60 Hz phone, a 120 Hz tablet and in
 * Jest. `advance()` is the only thing the component calls per frame.
 *
 * Nothing in here can end a run early. A hazard slows the truck; a wrong gate
 * repeats a question; the road cycles until every question is answered. The
 * truck always arrives. See docs/DRIVING_GAME.md.
 */
import type { TruckRunChallenge, TruckRunProp, TruckRunQuestion } from '@/learning/types';
import { truckRunLanes } from '@/learning/types';

/** One simulation tick. */
export const TICK = 1 / 60;
/** How far down the road the child can see, in road units. */
export const VIEW_DEPTH = 56;
/** A boost pad multiplies the road speed by this for `BOOST_SECONDS`. */
export const BOOST_MULTIPLIER = 1.55;
export const BOOST_SECONDS = 1.7;
/** Clipping anything drops the truck to this share of its speed. */
export const SLOW_FACTOR = 0.45;
/** Seconds to close ~63 % of the gap back up to the target speed. */
const RECOVER_TAU = 0.55;
/** How far a ramp throws the truck — always just over one hazard row. */
const AIR_ROWS = 1.15;
/** How long the camera shakes after a bump. */
export const JOLT_SECONDS = 0.45;
/** How close, in lanes, the truck has to be to actually clip something. */
const LANE_TOLERANCE = 0.45;
/** A backgrounded tab must never teleport the truck through a gate. */
const MAX_FRAME = 0.1;

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/* ------------------------------------------------------------------ */
/* State                                                                */
/* ------------------------------------------------------------------ */

export interface RunState {
  /** how far the truck has driven, in road units */
  distance: number;
  /** road units per second, right now */
  speed: number;
  /** continuous lane position, 0 (left) … 2 (right) */
  lane: number;
  /** the lane the child has asked for */
  target: number;
  /** road units of jump left (0 = on the tarmac) */
  air: number;
  /** how long this jump was, so the arc can be drawn */
  airTotal: number;
  /** seconds of boost left */
  boost: number;
  /** seconds of camera jolt left */
  jolt: number;
  /** which question is on the gates */
  questionIndex: number;
  /** misses on the current question — drives the hint ladder and the rotation */
  attempt: number;
  /** questions answered correctly */
  answered: number;
  /** …of which, answered first time */
  firstTry: number;
  bumps: number;
  boosts: number;
  jumps: number;
  /** ids of the props already driven over */
  hits: Set<string>;
  /** set once the last gate is open: where the run ends */
  finishAt: number | null;
  done: boolean;
  elapsed: number;
  /** leftover time from the last frame, for the fixed timestep */
  carry: number;
}

export type RunEvent =
  | { type: 'bump'; prop: TruckRunProp; lane: number }
  | { type: 'boost' }
  | { type: 'ramp' }
  | { type: 'land' }
  | { type: 'gate'; correct: boolean; label: string; lane: number }
  | { type: 'finish' };

export function createRun(challenge: TruckRunChallenge): RunState {
  return {
    distance: 0,
    speed: challenge.speed,
    lane: 1,
    target: 1,
    air: 0,
    airTotal: challenge.rowGap * AIR_ROWS,
    boost: 0,
    jolt: 0,
    questionIndex: 0,
    attempt: 0,
    answered: 0,
    firstTry: 0,
    bumps: 0,
    boosts: 0,
    jumps: 0,
    hits: new Set<string>(),
    finishAt: null,
    done: false,
    elapsed: 0,
    carry: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Road geometry — segments cycle, so the road never runs out           */
/* ------------------------------------------------------------------ */

const segmentLengths = (challenge: TruckRunChallenge): number[] => challenge.segments.map((s) => s.length);

const loopLength = (challenge: TruckRunChallenge): number =>
  segmentLengths(challenge).reduce((a, b) => a + b, 0) || 1;

/** Where segment `index` starts, counting round the loop as many times as needed. */
export function segmentStart(challenge: TruckRunChallenge, index: number): number {
  const count = challenge.segments.length;
  if (count === 0) return 0;
  const lap = Math.floor(index / count);
  let start = lap * loopLength(challenge);
  for (let i = 0; i < index % count; i += 1) start += challenge.segments[i]?.length ?? 0;
  return start;
}

/** The segment the truck is standing in. */
export function segmentIndexAt(challenge: TruckRunChallenge, distance: number): number {
  const count = challenge.segments.length;
  if (count === 0) return 0;
  const total = loopLength(challenge);
  const lap = Math.floor(distance / total);
  let within = distance - lap * total;
  for (let i = 0; i < count; i += 1) {
    const length = challenge.segments[i]?.length ?? 0;
    if (within < length) return lap * count + i;
    within -= length;
  }
  return lap * count + count - 1;
}

/* ------------------------------------------------------------------ */
/* Gates                                                                */
/* ------------------------------------------------------------------ */

/**
 * The three gate labels, lane by lane. A miss rotates them, so the answer moves
 * to a different lane when the question comes back — the child has to read it
 * again rather than remember "it was the middle one".
 */
export function gateLabels(question: TruckRunQuestion, attempt: number): string[] {
  const options = question.options;
  const shift = ((attempt % truckRunLanes) + truckRunLanes) % truckRunLanes;
  return Array.from({ length: truckRunLanes }, (_, lane) => options[(lane + shift) % options.length] ?? '');
}

/** Which lane opens the gate — what the gold assist ring points at. */
export function answerLane(question: TruckRunQuestion, attempt: number): number {
  const lane = gateLabels(question, attempt).indexOf(question.answer);
  return lane < 0 ? 1 : lane;
}

export const questionAt = (challenge: TruckRunChallenge, run: RunState): TruckRunQuestion | undefined =>
  challenge.questions[Math.min(run.questionIndex, challenge.questions.length - 1)];

/* ------------------------------------------------------------------ */
/* What is on screen                                                    */
/* ------------------------------------------------------------------ */

export interface VisibleItem {
  id: string;
  kind: TruckRunProp | 'gate';
  lane: number;
  /** road units ahead of the truck */
  ahead: number;
  /** 0 = right on the truck, 1 = at the horizon */
  t: number;
  /** gates only */
  label?: string;
  /** gates only: the gate that opens */
  answer?: boolean;
  /** this prop has already been driven over */
  spent?: boolean;
}

/**
 * Everything between the truck and the horizon, nearest last so a painter's
 * algorithm draws far things first. Both renderers consume exactly this.
 */
export function visibleItems(run: RunState, challenge: TruckRunChallenge, depth = VIEW_DEPTH): VisibleItem[] {
  const out: VisibleItem[] = [];
  if (challenge.segments.length === 0) return out;

  const first = segmentIndexAt(challenge, run.distance);
  const question = questionAt(challenge, run);

  for (let k = first; k <= first + 2; k += 1) {
    const segment = challenge.segments[k % challenge.segments.length];
    if (!segment) continue;
    const start = segmentStart(challenge, k);
    if (start > run.distance + depth) break;

    for (let i = 0; i < segment.obstacles.length; i += 1) {
      const obstacle = segment.obstacles[i];
      if (!obstacle) continue;
      const ahead = start + obstacle.at - run.distance;
      /* a knocked cone stays visible for a beat as it slides past the camera */
      if (ahead < -6 || ahead > depth) continue;
      const id = `${k}:${i}`;
      out.push({
        id,
        kind: obstacle.kind,
        lane: obstacle.lane,
        ahead,
        t: clamp(ahead / depth, 0, 1),
        spent: run.hits.has(id),
      });
    }

    const gateAhead = start + segment.gateAt - run.distance;
    /* a gate is only ever drawn on the approach: once it is behind the truck the
       question has already moved on, and stale labels would flash by */
    if (gateAhead >= -1 && gateAhead <= depth && question) {
      const labels = gateLabels(question, run.attempt);
      for (let lane = 0; lane < truckRunLanes; lane += 1) {
        out.push({
          id: `${k}:gate:${lane}`,
          kind: 'gate',
          lane,
          ahead: gateAhead,
          t: clamp(gateAhead / depth, 0, 1),
          label: labels[lane] ?? '',
          answer: labels[lane] === question.answer,
        });
      }
    }
  }

  return out.sort((a, b) => b.ahead - a.ahead);
}

/* ------------------------------------------------------------------ */
/* Steering                                                             */
/* ------------------------------------------------------------------ */

/** Ask for a lane. Returns true when the truck actually starts moving across. */
export function steerTo(run: RunState, lane: number): boolean {
  const next = clamp(Math.round(lane), 0, truckRunLanes - 1);
  if (next === run.target) return false;
  run.target = next;
  return true;
}

/** Steer one lane left (−1) or right (+1). */
export const steerBy = (run: RunState, delta: number): boolean => steerTo(run, run.target + delta);

/* ------------------------------------------------------------------ */
/* The step                                                            */
/* ------------------------------------------------------------------ */

function crossProps(run: RunState, challenge: TruckRunChallenge, from: number, to: number, events: RunEvent[]): void {
  const firstSegment = segmentIndexAt(challenge, from);

  for (let k = firstSegment; k <= firstSegment + 1; k += 1) {
    const segment = challenge.segments[k % challenge.segments.length];
    if (!segment) continue;
    const start = segmentStart(challenge, k);

    /* ---- props on the tarmac ---- */
    for (let i = 0; i < segment.obstacles.length; i += 1) {
      const obstacle = segment.obstacles[i];
      if (!obstacle) continue;
      const at = start + obstacle.at;
      if (at <= from || at > to) continue;
      const id = `${k}:${i}`;
      if (run.hits.has(id)) continue;
      /* while airborne the truck sails over everything, treats included */
      if (run.air > 0) continue;
      if (Math.abs(run.lane - obstacle.lane) > LANE_TOLERANCE) continue;

      run.hits.add(id);
      if (obstacle.kind === 'ramp') {
        run.air = run.airTotal;
        run.jumps += 1;
        events.push({ type: 'ramp' });
      } else if (obstacle.kind === 'boost') {
        run.boost = BOOST_SECONDS;
        run.speed = challenge.speed * BOOST_MULTIPLIER;
        run.boosts += 1;
        events.push({ type: 'boost' });
      } else {
        run.speed = challenge.speed * SLOW_FACTOR;
        run.boost = 0;
        run.jolt = JOLT_SECONDS;
        run.bumps += 1;
        events.push({ type: 'bump', prop: obstacle.kind, lane: obstacle.lane });
      }
    }

    /* ---- the gates ---- */
    const gate = start + segment.gateAt;
    if (gate > from && gate <= to && run.finishAt === null) {
      const question = questionAt(challenge, run);
      if (!question) continue;
      const lane = clamp(Math.round(run.lane), 0, truckRunLanes - 1);
      const label = gateLabels(question, run.attempt)[lane] ?? '';
      const correct = label === question.answer;
      events.push({ type: 'gate', correct, label, lane });

      if (correct) {
        if (run.attempt === 0) run.firstTry += 1;
        run.answered += 1;
        /* the gate bursts open and throws you down the road */
        run.boost = BOOST_SECONDS;
        run.speed = challenge.speed * BOOST_MULTIPLIER;
        if (run.answered >= challenge.questions.length) run.finishAt = gate + challenge.finish;
        else {
          run.questionIndex += 1;
          run.attempt = 0;
        }
      } else {
        /* a wrong gate is a pothole, not a buzzer: the same question comes back */
        run.attempt += 1;
        run.speed = challenge.speed * SLOW_FACTOR;
        run.boost = 0;
        run.jolt = JOLT_SECONDS;
      }
    }
  }
}

/** One fixed tick. Prefer `advance()`, which owns the accumulator. */
export function stepRun(run: RunState, challenge: TruckRunChallenge, dt: number): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.done) return events;

  run.elapsed += dt;

  /* steering */
  const lateral = dt / Math.max(0.05, challenge.laneChange);
  if (run.lane < run.target) run.lane = Math.min(run.target, run.lane + lateral);
  else if (run.lane > run.target) run.lane = Math.max(run.target, run.lane - lateral);

  /* timers */
  if (run.boost > 0) run.boost = Math.max(0, run.boost - dt);
  if (run.jolt > 0) run.jolt = Math.max(0, run.jolt - dt);

  /* speed eases back to whatever the road is asking for */
  const target = challenge.speed * (run.boost > 0 ? BOOST_MULTIPLIER : 1);
  run.speed += (target - run.speed) * Math.min(1, dt / RECOVER_TAU);

  const from = run.distance;
  const to = from + run.speed * dt;
  run.distance = to;

  if (run.air > 0) {
    run.air = Math.max(0, run.air - (to - from));
    if (run.air === 0) events.push({ type: 'land' });
  }

  crossProps(run, challenge, from, to, events);

  if (run.finishAt !== null && run.distance >= run.finishAt) {
    run.done = true;
    events.push({ type: 'finish' });
  }
  return events;
}

/**
 * Feed one real frame in. Time is clamped and chopped into whole ticks, so the
 * truck moves at the same speed however fast the device draws.
 */
export function advance(run: RunState, challenge: TruckRunChallenge, seconds: number): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.done) return events;
  run.carry = Math.min(run.carry + Math.max(0, seconds), MAX_FRAME);
  while (run.carry >= TICK && !run.done) {
    run.carry -= TICK;
    events.push(...stepRun(run, challenge, TICK));
  }
  return events;
}

/* ------------------------------------------------------------------ */
/* Reading the run                                                      */
/* ------------------------------------------------------------------ */

/** 0 at take-off, 1 at the top of the arc, 0 again on landing. */
export function jumpHeight(run: RunState): number {
  if (run.air <= 0 || run.airTotal <= 0) return 0;
  return Math.sin(Math.PI * (1 - run.air / run.airTotal));
}

/** 0 … 1, how boosted the truck is right now (for speed lines and the siren). */
export const boostLevel = (run: RunState): number => clamp(run.boost / BOOST_SECONDS, 0, 1);

/** 0 … 1, how hard the camera is still shaking. */
export const joltLevel = (run: RunState): number => clamp(run.jolt / JOLT_SECONDS, 0, 1);

/** How far through the run, for the TaskBar's progress dots. */
export const runProgress = (run: RunState, challenge: TruckRunChallenge) => ({
  done: run.answered,
  total: challenge.questions.length,
});

export interface RunSummary {
  gates: number;
  firstTry: number;
  bumps: number;
  boosts: number;
  jumps: number;
  /** a tidy drive — the "Smooth Driving" ribbon on the finish banner */
  clean: boolean;
  /** every gate right first time */
  perfect: boolean;
}

export function runSummary(run: RunState, challenge: TruckRunChallenge): RunSummary {
  return {
    gates: run.answered,
    firstTry: run.firstTry,
    bumps: run.bumps,
    boosts: run.boosts,
    jumps: run.jumps,
    clean: run.bumps <= challenge.bumpBudget,
    perfect: run.firstTry >= challenge.questions.length,
  };
}

/* ------------------------------------------------------------------ */
/* The frame the renderers draw                                         */
/* ------------------------------------------------------------------ */

/**
 * An immutable snapshot of everything a renderer needs. The sim itself lives in
 * a ref and is mutated in place (allocating a whole state object 60 times a
 * second is exactly the sort of thing that drops frames on a cheap tablet);
 * this is the copy React and the 2D road see.
 */
export interface RunFrame {
  distance: number;
  speed: number;
  /** 0 … 1 against the road's base speed */
  pace: number;
  lane: number;
  target: number;
  jump: number;
  boost: number;
  jolt: number;
  airborne: boolean;
  questionIndex: number;
  attempt: number;
  answered: number;
  total: number;
  bumps: number;
  done: boolean;
  items: VisibleItem[];
  /** the lane the gold assist ring points at, or null when no help is showing */
  assistLane: number | null;
}

export function runFrame(run: RunState, challenge: TruckRunChallenge, assist = false): RunFrame {
  const question = questionAt(challenge, run);
  return {
    distance: run.distance,
    speed: run.speed,
    pace: clamp(run.speed / (challenge.speed * BOOST_MULTIPLIER), 0, 1),
    lane: run.lane,
    target: run.target,
    jump: jumpHeight(run),
    boost: boostLevel(run),
    jolt: joltLevel(run),
    airborne: run.air > 0,
    questionIndex: run.questionIndex,
    attempt: run.attempt,
    answered: run.answered,
    total: challenge.questions.length,
    bumps: run.bumps,
    done: run.done,
    items: visibleItems(run, challenge),
    assistLane: assist && question ? answerLane(question, run.attempt) : null,
  };
}
