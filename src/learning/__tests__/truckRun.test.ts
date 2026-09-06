/**
 * TRUCK RUN — the driving station's road.
 *
 * `generators.test.ts` already proves the generic contract (150 seeds × 3
 * bands, determinism, band difference, mastery stability). This file pins the
 * three promises the driving game itself makes, over 200 seeds per band:
 *
 *   1. every gate set has the answer exactly once, on a label a child can read
 *      at speed;
 *   2. the road can always be driven cleanly — there is a lane route through
 *      every hazard row, from any starting lane;
 *   3. the run can always be finished: a wrong gate repeats a question, so the
 *      road cycles and the truck always arrives.
 */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeOf, GeneratorContext, TruckRunTopic } from '@/learning/types';
import { challengeSkills, truckRunLanes } from '@/learning/types';
import { generateTruckRun } from '@/learning/generators';
import { GATE_LABEL_MAX, hazardRows, laneEscapeRoute, truckRunFor, truckRunSkills } from '@/learning/generators/truck-run';
import { validateChallenge } from '@/learning/validate';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const SEEDS = 200;

const ctxFor = (ageBand: AgeBand, seed: number): GeneratorContext => ({ ageBand, rng: createRng(seed) });

const sample = (band: AgeBand, count = SEEDS): ChallengeOf<'truck-run'>[] =>
  Array.from({ length: count }, (_, i) => generateTruckRun(ctxFor(band, i * 977 + 13)));

const topicsFor: Record<AgeBand, TruckRunTopic[]> = {
  A: ['number-word', 'count-on'],
  B: ['add-sub', 'sight-word'],
  C: ['times-divide', 'elapsed', 'spanish'],
};

describe('truck run — the gates', () => {
  it.each(BANDS)('band %s — 200 seeds: one answer per gate set, on a short label', (band) => {
    const problems: string[] = [];
    sample(band).forEach((c, seed) => {
      c.questions.forEach((q, i) => {
        const where = `seed ${seed} q${i}`;
        if (q.options.length !== truckRunLanes) problems.push(`${where}: ${q.options.length} gates`);
        if (new Set(q.options).size !== q.options.length) problems.push(`${where}: duplicate labels`);
        if (q.options.filter((o) => o === q.answer).length !== 1) {
          problems.push(`${where}: answer "${q.answer}" appears ${q.options.filter((o) => o === q.answer).length}×`);
        }
        for (const label of q.options) {
          if (label.trim().length === 0) problems.push(`${where}: empty label`);
          if (label.length > GATE_LABEL_MAX) problems.push(`${where}: "${label}" is ${label.length} long`);
        }
        if (q.prompt.trim().length === 0) problems.push(`${where}: no question`);
        if (q.hint.trim().length === 0) problems.push(`${where}: no hint`);
      });
    });
    expect(problems).toEqual([]);
  });

  it.each(BANDS)('band %s — the question always fits on one line of the TaskBar', (band) => {
    for (const c of sample(band, 60)) {
      for (const q of c.questions) expect(q.prompt.length).toBeLessThanOrEqual(46);
    }
  });

  it.each(BANDS)('band %s — Captain Bea always has a Spanish line to read', (band) => {
    for (const c of sample(band, 60)) {
      for (const q of c.questions) {
        expect(q.promptEs && q.promptEs.trim().length > 0).toBe(true);
        expect(q.hintEs && q.hintEs.trim().length > 0).toBe(true);
      }
    }
  });

  it('a hint gives the answer away, because the third miss must not be a wall', () => {
    for (const band of BANDS) {
      for (const c of sample(band, 60)) {
        for (const q of c.questions) {
          if (c.topic === 'elapsed' || c.topic === 'spanish' || c.topic === 'sight-word') {
            expect(q.hint.toLowerCase()).toContain(q.answer.toLowerCase().split(' ')[0] ?? '');
          } else {
            expect(q.hint).toContain(q.answer);
          }
        }
      }
    }
  });
});

describe('truck run — the road', () => {
  it.each(BANDS)('band %s — 200 seeds are all valid', (band) => {
    const failures: string[] = [];
    sample(band).forEach((c, seed) => {
      const problems = validateChallenge(c);
      if (problems.length > 0) failures.push(`seed ${seed}: ${problems.join(' | ')}`);
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — every stretch can be driven cleanly from any lane', (band) => {
    const failures: string[] = [];
    sample(band).forEach((c, seed) => {
      c.segments.forEach((segment, i) => {
        const route = laneEscapeRoute(segment);
        if (!route) {
          failures.push(`seed ${seed} segment ${i}: no clean line`);
          return;
        }
        const rows = hazardRows(segment);
        if (route.length !== rows.length) failures.push(`seed ${seed} segment ${i}: route skips a row`);
        route.forEach((lane, r) => {
          if (rows[r]?.blocked.includes(lane)) failures.push(`seed ${seed} segment ${i}: row ${r} drives into a hazard`);
          const prev = route[r - 1];
          if (prev !== undefined && Math.abs(lane - prev) > 1) failures.push(`seed ${seed} segment ${i}: row ${r} teleports`);
        });
      });
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — a row never blocks the whole road', (band) => {
    for (const c of sample(band)) {
      for (const segment of c.segments) {
        for (const row of hazardRows(segment)) {
          expect(new Set(row.blocked).size).toBeLessThan(truckRunLanes);
        }
      }
    }
  });

  it.each(BANDS)('band %s — there is always time to change lane between rows', (band) => {
    for (const c of sample(band, 80)) {
      /* even at full boost (×1.55) one lane change fits inside a row gap */
      expect(c.rowGap).toBeGreaterThanOrEqual(c.speed * c.laneChange * 2);
      for (const segment of c.segments) {
        const rows = hazardRows(segment);
        for (let i = 1; i < rows.length; i += 1) {
          expect((rows[i]?.at ?? 0) - (rows[i - 1]?.at ?? 0)).toBeGreaterThanOrEqual(c.rowGap - 0.5);
        }
        const last = rows[rows.length - 1];
        if (last) expect(segment.gateAt - last.at).toBeGreaterThanOrEqual(c.rowGap);
      }
    }
  });

  it.each(BANDS)('band %s — ramps and boosts are rewards, never blockers', (band) => {
    for (const c of sample(band, 80)) {
      for (const segment of c.segments) {
        const treats = segment.obstacles.filter((o) => o.kind === 'ramp' || o.kind === 'boost');
        for (const treat of treats) {
          const sameRow = segment.obstacles.filter(
            (o) => o !== treat && Math.abs(o.at - treat.at) <= 0.5 && o.kind !== 'ramp' && o.kind !== 'boost',
          );
          expect(sameRow.some((o) => o.lane === treat.lane)).toBe(false);
        }
        /* a ramp always has something to sail over */
        const rows = hazardRows(segment);
        const lastRow = rows[rows.length - 1];
        for (const ramp of segment.obstacles.filter((o) => o.kind === 'ramp')) {
          expect(lastRow === undefined || ramp.at < lastRow.at + 0.5).toBe(true);
        }
      }
    }
  });

  it('every segment carries a gate, and there is a run out to the finish line', () => {
    for (const band of BANDS) {
      for (const c of sample(band, 60)) {
        expect(c.segments.length).toBe(c.questions.length);
        expect(c.finish).toBeGreaterThan(0);
        for (const segment of c.segments) {
          expect(segment.gateAt).toBeGreaterThan(0);
          expect(segment.length).toBeGreaterThan(segment.gateAt);
        }
      }
    }
  });
});

describe('truck run — band scaling', () => {
  it('older crews drive faster and get less room to read a row', () => {
    const one = (band: AgeBand) => {
      const c = sample(band, 1)[0];
      if (!c) throw new Error('expected a challenge');
      return c;
    };
    const [a, b, c] = [one('A'), one('B'), one('C')];
    expect(a.speed).toBeLessThan(b.speed);
    expect(b.speed).toBeLessThan(c.speed);
    /* seconds of road between rows is what a child actually feels */
    expect(a.rowGap / a.speed).toBeGreaterThan(b.rowGap / b.speed);
    expect(b.rowGap / b.speed).toBeGreaterThan(c.rowGap / c.speed);
    expect(a.laneChange).toBeGreaterThan(c.laneChange);
    expect(a.bumpBudget).toBeGreaterThan(c.bumpBudget);
  });

  it('the run grows with the band', () => {
    expect(sample('A', 40).every((c) => c.questions.length === 4)).toBe(true);
    expect(sample('B', 40).every((c) => c.questions.length === 5)).toBe(true);
    expect(sample('C', 40).every((c) => c.questions.length === 6)).toBe(true);
    const rows = (band: AgeBand) =>
      sample(band, 40).flatMap((c) => c.segments.map((s) => hazardRows(s).length));
    expect(Math.max(...rows('A'))).toBeLessThan(Math.min(...rows('C')));
  });

  it('band A never blocks two lanes at once, band C sometimes does', () => {
    const widest = (band: AgeBand) =>
      Math.max(...sample(band, 60).flatMap((c) => c.segments.flatMap((s) => hazardRows(s).map((r) => r.blocked.length))));
    expect(widest('A')).toBe(1);
    expect(widest('C')).toBe(2);
  });

  it('band A meets cones and puddles; only the oldest meet a parked van', () => {
    const props = (band: AgeBand) =>
      new Set(sample(band, 60).flatMap((c) => c.segments.flatMap((s) => s.obstacles.map((o) => o.kind))));
    expect(props('A').has('car')).toBe(false);
    expect(props('A').has('hose')).toBe(false);
    expect(props('C').has('car')).toBe(true);
    for (const band of BANDS) {
      expect(props(band).has('ramp')).toBe(true);
      expect(props(band).has('boost')).toBe(true);
    }
  });

  it('each band asks its own kind of question, one topic per run', () => {
    for (const band of BANDS) {
      const topics = new Set(sample(band, 60).map((c) => c.topic));
      for (const topic of topics) expect(topicsFor[band]).toContain(topic);
      expect(topics.size).toBeGreaterThan(0);
      /* the kind's own skills are band-neutral; the topic's skills are added per run */
      expect(challengeSkills['truck-run']).toEqual(expect.arrayContaining(['spatial', 'reading-words']));
    }
  });

  it('every topic maps to the skills it really practises', () => {
    for (const band of BANDS) {
      for (const c of sample(band, 30)) {
        const skills = truckRunSkills[c.topic];
        expect(Array.isArray(skills)).toBe(true);
        expect(skills.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('the truck-run validator', () => {
  const good = generateTruckRun(ctxFor('B', 42));
  const firstQuestion = good.questions[0];
  const firstSegment = good.segments[0];
  if (!firstQuestion || !firstSegment) throw new Error('expected a question and a segment');

  it('accepts a road the generator built', () => {
    expect(validateChallenge(good)).toEqual([]);
  });

  it('refuses a gate set with no right answer', () => {
    const broken = { ...good, questions: [{ ...firstQuestion, answer: 'nope' }] };
    expect(validateChallenge(broken).join(' ')).toContain('exactly one gate');
  });

  it('refuses a label too long to read at speed', () => {
    const broken = {
      ...good,
      questions: [{ ...firstQuestion, options: ['absolutely enormous', 'b', 'c'], answer: 'b' }],
    };
    expect(validateChallenge(broken).join(' ')).toContain('too long');
  });

  it('refuses a row that blocks all three lanes', () => {
    const broken = {
      ...good,
      segments: [
        {
          ...firstSegment,
          obstacles: [
            { kind: 'cone' as const, lane: 0, at: 10 },
            { kind: 'cone' as const, lane: 1, at: 10 },
            { kind: 'cone' as const, lane: 2, at: 10 },
          ],
        },
      ],
    };
    expect(validateChallenge(broken).join(' ')).toContain('cannot be driven');
  });

  it('refuses rows packed closer together than a lane change', () => {
    const broken = {
      ...good,
      segments: [
        {
          ...firstSegment,
          obstacles: [
            { kind: 'cone' as const, lane: 0, at: 10 },
            { kind: 'cone' as const, lane: 2, at: 11 },
          ],
        },
      ],
    };
    expect(validateChallenge(broken).join(' ')).toContain('closer than the row gap');
  });

  it('refuses a road where a lane change would not fit', () => {
    expect(validateChallenge({ ...good, rowGap: 1 }).join(' ')).toContain('closer together than a lane change');
  });

  it('refuses an obstacle standing in the gates', () => {
    const broken = {
      ...good,
      segments: [{ ...firstSegment, obstacles: [{ kind: 'cone' as const, lane: 1, at: firstSegment.gateAt + 5 }] }],
    };
    expect(validateChallenge(broken).join(' ')).toContain('on or past the gates');
  });
});

/* ------------------------------------------------------------------ */
/* The drive a mission asks for                                         */
/* ------------------------------------------------------------------ */

describe('truckRunFor', () => {
  it('takes the story\u2019s first choice the band actually teaches', () => {
    expect(truckRunFor(['count-on', 'add-sub', 'elapsed'], ctxFor('A', 1)).topic).toBe('count-on');
    expect(truckRunFor(['count-on', 'add-sub', 'elapsed'], ctxFor('B', 1)).topic).toBe('add-sub');
    expect(truckRunFor(['count-on', 'add-sub', 'elapsed'], ctxFor('C', 1)).topic).toBe('elapsed');
  });

  it('never hands a band a topic it does not teach, whatever the mission asks', () => {
    for (const band of BANDS) {
      for (let seed = 0; seed < 40; seed += 1) {
        const run = truckRunFor(['times-divide', 'spanish'], ctxFor(band, seed));
        expect(topicsFor[band]).toContain(run.topic);
        expect(validateChallenge(run)).toEqual([]);
      }
    }
  });

  it('still builds a playable road, scene and all', () => {
    const run = truckRunFor(['sight-word'], { ageBand: 'B', rng: createRng(9), scene: 'bakery' });
    expect(run.topic).toBe('sight-word');
    expect(run.scene).toBe('bakery');
    expect(validateChallenge(run)).toEqual([]);
  });
});
