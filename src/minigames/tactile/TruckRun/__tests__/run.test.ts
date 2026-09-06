/**
 * The driving sim, on its own. No React, no renderer — just the rules:
 * the truck always arrives, a wrong gate slows instead of failing, hazards
 * slow, ramps jump, boosts boost, and the same inputs always give the same run.
 */
import type { AgeBand, GeneratorContext, TruckRunChallenge } from '@/learning/types';
import { createRng } from '@/utils/rng';
import { generateTruckRun } from '@/learning/generators';
import {
  BOOST_MULTIPLIER,
  SLOW_FACTOR,
  TICK,
  VIEW_DEPTH,
  advance,
  answerLane,
  createRun,
  gateLabels,
  jumpHeight,
  questionAt,
  runFrame,
  runSummary,
  segmentIndexAt,
  segmentStart,
  steerBy,
  steerTo,
  stepRun,
  visibleItems,
  type RunEvent,
  type RunState,
} from '../run';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const ctxFor = (ageBand: AgeBand, seed: number): GeneratorContext => ({ ageBand, rng: createRng(seed) });
const roadFor = (band: AgeBand, seed = 7): TruckRunChallenge => generateTruckRun(ctxFor(band, seed));

/** Drive with a policy that is told which lane to be in, one tick at a time. */
function drive(
  challenge: TruckRunChallenge,
  choose: (run: RunState) => number,
  opts: { maxSeconds?: number } = {},
): { run: RunState; events: RunEvent[]; seconds: number } {
  const run = createRun(challenge);
  const events: RunEvent[] = [];
  const limit = (opts.maxSeconds ?? 240) / TICK;
  let ticks = 0;
  while (!run.done && ticks < limit) {
    steerTo(run, choose(run));
    events.push(...stepRun(run, challenge, TICK));
    ticks += 1;
  }
  return { run, events, seconds: ticks * TICK };
}

/** The lane that answers the gate the truck is heading for. */
const answerLaneNow = (challenge: TruckRunChallenge, run: RunState): number => {
  const question = questionAt(challenge, run);
  return question ? answerLane(question, run.attempt) : 1;
};

describe('the road under the truck', () => {
  it('segments cycle, so the road never runs out', () => {
    const road = roadFor('B');
    expect(segmentStart(road, 0)).toBe(0);
    expect(segmentStart(road, 1)).toBeCloseTo(road.segments[0]?.length ?? 0, 5);
    for (const index of [0, 1, 4, 9, 17]) {
      const start = segmentStart(road, index);
      expect(segmentIndexAt(road, start + 1)).toBe(index);
    }
  });

  it('shows the road ahead, nearest last, and never behind the horizon', () => {
    const road = roadFor('C');
    const run = createRun(road);
    advance(run, road, 1.2);
    const items = visibleItems(run, road);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.ahead).toBeLessThanOrEqual(VIEW_DEPTH);
      expect(item.t).toBeGreaterThanOrEqual(0);
      expect(item.t).toBeLessThanOrEqual(1);
    }
    const aheads = items.map((i) => i.ahead);
    expect([...aheads].sort((a, b) => b - a)).toEqual(aheads);
  });

  it('always shows three gates, exactly one of which opens', () => {
    const road = roadFor('A');
    const run = createRun(road);
    let guard = 0;
    while (visibleItems(run, road).every((i) => i.kind !== 'gate') && guard < 2000) {
      advance(run, road, TICK);
      guard += 1;
    }
    const gates = visibleItems(run, road).filter((i) => i.kind === 'gate');
    expect(gates).toHaveLength(3);
    expect(gates.filter((g) => g.answer)).toHaveLength(1);
  });
});

describe('gates rotate so the answer moves', () => {
  it('a miss puts the answer in a different lane', () => {
    const road = roadFor('B');
    const question = road.questions[0];
    if (!question) throw new Error('expected a question');
    const lanes = [0, 1, 2].map((attempt) => answerLane(question, attempt));
    expect(new Set(lanes).size).toBe(3);
    for (const attempt of [0, 1, 2, 3, 7]) {
      const labels = gateLabels(question, attempt);
      expect(new Set(labels)).toEqual(new Set(question.options));
      expect(labels.filter((l) => l === question.answer)).toHaveLength(1);
    }
  });
});

describe('steering', () => {
  it('only ever asks for a lane that is on the road', () => {
    const road = roadFor('A');
    const run = createRun(road);
    steerBy(run, -5);
    expect(run.target).toBe(0);
    steerBy(run, +9);
    expect(run.target).toBe(2);
    expect(steerTo(run, 2)).toBe(false);
  });

  it('takes the band’s own lane-change time to cross a lane', () => {
    for (const band of BANDS) {
      const road = roadFor(band);
      const run = createRun(road);
      steerTo(run, 2);
      let seconds = 0;
      while (run.lane < 2 && seconds < 5) {
        stepRun(run, road, TICK);
        seconds += TICK;
      }
      /* the middle lane to the right-hand lane is exactly one lane change */
      expect(seconds).toBeGreaterThan(road.laneChange * 0.9);
      expect(seconds).toBeLessThan(road.laneChange * 1.3);
    }
  });
});

describe('hazards, ramps and boosts', () => {
  const roadWith = (kind: TruckRunChallenge['segments'][number]['obstacles'][number]['kind']): TruckRunChallenge => {
    const base = roadFor('B');
    const segment = base.segments[0];
    if (!segment) throw new Error('expected a segment');
    return {
      ...base,
      segments: [{ ...segment, obstacles: [{ kind, lane: 1, at: base.rowGap }] }],
    };
  };

  it('clipping a pothole slows the truck but never stops it', () => {
    const road = roadWith('pothole');
    const run = createRun(road);
    const events: RunEvent[] = [];
    while (run.distance < road.rowGap + 1) events.push(...stepRun(run, road, TICK));
    expect(events.some((e) => e.type === 'bump')).toBe(true);
    expect(run.speed).toBeLessThan(road.speed);
    expect(run.speed).toBeGreaterThan(0);
    expect(run.bumps).toBe(1);
    expect(run.done).toBe(false);

    /* and it picks itself back up */
    for (let i = 0; i < 180; i += 1) stepRun(run, road, TICK);
    expect(run.speed).toBeGreaterThan(road.speed * 0.9);
  });

  it('a boost pad speeds the truck up', () => {
    const road = roadWith('boost');
    const run = createRun(road);
    const events: RunEvent[] = [];
    while (run.distance < road.rowGap + 1) events.push(...stepRun(run, road, TICK));
    expect(events.some((e) => e.type === 'boost')).toBe(true);
    expect(run.speed).toBeGreaterThan(road.speed);
    expect(run.speed).toBeLessThanOrEqual(road.speed * BOOST_MULTIPLIER + 0.001);
  });

  it('a ramp throws the truck over the next row', () => {
    const base = roadFor('B');
    const segment = base.segments[0];
    if (!segment) throw new Error('expected a segment');
    const road: TruckRunChallenge = {
      ...base,
      segments: [
        {
          ...segment,
          obstacles: [
            { kind: 'ramp', lane: 1, at: base.rowGap },
            { kind: 'cone', lane: 1, at: base.rowGap * 2 },
          ],
        },
      ],
    };
    const run = createRun(road);
    const events: RunEvent[] = [];
    let peak = 0;
    while (run.distance < base.rowGap * 2 + 2) {
      events.push(...stepRun(run, road, TICK));
      peak = Math.max(peak, jumpHeight(run));
    }
    expect(events.some((e) => e.type === 'ramp')).toBe(true);
    expect(peak).toBeGreaterThan(0.9);
    /* sailed clean over the cone in the same lane */
    expect(run.bumps).toBe(0);
    expect(run.jumps).toBe(1);
  });

  it('a hazard in another lane is never clipped', () => {
    const road = roadWith('cone');
    const run = createRun(road);
    steerTo(run, 0);
    while (run.distance < road.rowGap + 1) stepRun(run, road, TICK);
    expect(run.bumps).toBe(0);
  });
});

describe('the gates are the answer', () => {
  it.each(BANDS)('band %s — a clean driver finishes with every gate first time', (band) => {
    for (const seed of [3, 11, 42, 99]) {
      const road = roadFor(band, seed);
      const { run, events, seconds } = drive(road, (r) => answerLaneNow(road, r));
      expect(run.done).toBe(true);
      expect(events.some((e) => e.type === 'finish')).toBe(true);
      const summary = runSummary(run, road);
      expect(summary.gates).toBe(road.questions.length);
      expect(summary.firstTry).toBe(road.questions.length);
      expect(summary.perfect).toBe(true);
      expect(seconds).toBeLessThan(120);
      expect(events.filter((e) => e.type === 'gate' && !e.correct)).toHaveLength(0);
    }
  });

  it.each(BANDS)('band %s — a wrong gate slows the truck and repeats the question', (band) => {
    const road = roadFor(band);
    /* answer wrongly until the third try on every question */
    const { run, events } = drive(road, (r) => {
      const right = answerLaneNow(road, r);
      return r.attempt >= 2 ? right : (right + 1) % 3;
    });
    expect(run.done).toBe(true);
    const wrong = events.filter((e) => e.type === 'gate' && !e.correct);
    expect(wrong.length).toBe(road.questions.length * 2);
    expect(runSummary(run, road).gates).toBe(road.questions.length);
    expect(runSummary(run, road).firstTry).toBe(0);
    expect(runSummary(run, road).perfect).toBe(false);
  });

  it('a wrong gate costs speed, not the run', () => {
    const road = roadFor('B');
    const run = createRun(road);
    const gateAt = (road.segments[0]?.gateAt ?? 0) + 0.5;
    const wrongLane = (answerLaneNow(road, run) + 1) % 3;
    steerTo(run, wrongLane);
    let events: RunEvent[] = [];
    while (run.distance < gateAt) events = events.concat(stepRun(run, road, TICK));
    const gate = events.find((e) => e.type === 'gate');
    expect(gate).toEqual(expect.objectContaining({ type: 'gate', correct: false }));
    /* dropped to the slow floor, and only just starting to pick up again */
    expect(run.speed).toBeLessThan(road.speed * (SLOW_FACTOR + 0.15));
    expect(run.done).toBe(false);
    expect(run.attempt).toBe(1);
    expect(run.answered).toBe(0);
  });

  it.each(BANDS)('band %s — a child who never steers still arrives', (band) => {
    /* the worst case: the truck sits in the middle lane the whole way */
    const road = roadFor(band);
    const { run } = drive(road, () => 1, { maxSeconds: 600 });
    expect(run.done).toBe(true);
    expect(runSummary(run, road).gates).toBe(road.questions.length);
  });
});

describe('determinism and frame independence', () => {
  it('the same drive twice is the same run', () => {
    const road = roadFor('C', 21);
    const one = drive(road, (r) => answerLaneNow(road, r));
    const two = drive(road, (r) => answerLaneNow(road, r));
    expect(two.run.distance).toBeCloseTo(one.run.distance, 9);
    expect(two.run.bumps).toBe(one.run.bumps);
    expect(two.events.length).toBe(one.events.length);
  });

  it('a slow frame and a fast frame cover the same road', () => {
    const road = roadFor('B', 5);
    const smooth = createRun(road);
    const stuttery = createRun(road);
    for (let i = 0; i < 120; i += 1) advance(smooth, road, 1 / 60);
    for (let i = 0; i < 60; i += 1) advance(stuttery, road, 1 / 30);
    expect(stuttery.distance).toBeCloseTo(smooth.distance, 6);
  });

  it('a backgrounded tab cannot teleport the truck through a gate', () => {
    const road = roadFor('B', 5);
    const run = createRun(road);
    advance(run, road, 30);
    expect(run.distance).toBeLessThan(road.speed * 0.2);
  });
});

describe('the frame the renderers draw', () => {
  it('carries the question, the pace and the assist ring', () => {
    const road = roadFor('A');
    const run = createRun(road);
    advance(run, road, 0.5);
    const plain = runFrame(run, road);
    expect(plain.assistLane).toBeNull();
    expect(plain.total).toBe(road.questions.length);
    expect(plain.pace).toBeGreaterThan(0);
    expect(plain.pace).toBeLessThanOrEqual(1);

    const helped = runFrame(run, road, true);
    const question = questionAt(road, run);
    expect(helped.assistLane).toBe(question ? answerLane(question, run.attempt) : null);
  });
});
