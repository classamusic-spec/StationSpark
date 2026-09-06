/**
 * TRUCK RUN — the driving station's road.
 *
 * The generator lays out a practice road: a handful of segments, each a run of
 * hazard rows followed by three answer gates. Everything the sim needs is baked
 * in here — speed, lane-change time, row spacing, the props on the tarmac and
 * the questions on the gates — so the component owns no difficulty numbers and
 * the whole thing is reproducible from a seed.
 *
 * Two promises are structural, not hopeful:
 *   1. every hazard row leaves at least one lane free, and that free lane is
 *      always within one lane of a free lane in the row before it, so the road
 *      can be driven cleanly from any starting lane (`laneEscapeRoute`);
 *   2. rows stand at least `speed × laneChange × 2` apart, so there is always
 *      time to make that move — even at full boost.
 *
 * See docs/DRIVING_GAME.md.
 */
import type {
  AgeBand,
  ChallengeGenerator,
  ChallengeOf,
  GeneratorContext,
  SkillTag,
  TruckRunObstacle,
  TruckRunProp,
  TruckRunQuestion,
  TruckRunSegment,
  TruckRunTopic,
} from '../types';
import { truckRunLanes } from '../types';
import type { Rng } from '@/utils/rng';
import { adjustRange, masteryAdjustment } from '../adaptive';
import { numberDistractors, optionsWith, sceneOr, times } from './shared';
import { numberWordEn, numberWordEs, vocabulary } from '../vocabulary';

/** The longest a gate label may be — a child reads these at 20 units a second. */
export const GATE_LABEL_MAX = 8;

/** Which skills a run really practised, for the recap and mastery. */
export const truckRunSkills: Record<TruckRunTopic, SkillTag[]> = {
  'number-word': ['number-recognition', 'reading-words'],
  'count-on': ['counting', 'sequencing'],
  'add-sub': ['addition', 'subtraction'],
  'sight-word': ['reading-words', 'reading-sentences'],
  'times-divide': ['multiplication', 'division'],
  elapsed: ['time'],
  spanish: ['vocabulary-es'],
};

/* ------------------------------------------------------------------ */
/* Band plans                                                           */
/* ------------------------------------------------------------------ */

interface BandPlan {
  /** road units per second before boosts */
  speed: number;
  /** seconds to cross one lane */
  laneChange: number;
  /** how long a child has between hazard rows — the real difficulty dial */
  rowSeconds: number;
  /** hazard rows per segment */
  rows: number;
  questions: number;
  /** clear road before the gates, in row gaps */
  approach: number;
  /** clear road after the gates, in row gaps */
  tail: number;
  /** at most this many lanes blocked in one row (never all three) */
  maxBlocked: number;
  /** chance a row also carries a ramp or a boost pad */
  funChance: number;
  bumpBudget: number;
  props: TruckRunProp[];
  topics: TruckRunTopic[];
}

const plans: Record<AgeBand, BandPlan> = {
  A: {
    speed: 13,
    laneChange: 0.34,
    rowSeconds: 1.2,
    rows: 4,
    questions: 4,
    approach: 2,
    tail: 1,
    maxBlocked: 1,
    funChance: 0.45,
    bumpBudget: 7,
    props: ['cone', 'puddle', 'pothole'],
    topics: ['number-word', 'count-on'],
  },
  B: {
    speed: 17,
    laneChange: 0.3,
    rowSeconds: 1,
    rows: 5,
    questions: 5,
    approach: 1.8,
    tail: 1,
    maxBlocked: 2,
    funChance: 0.35,
    bumpBudget: 6,
    props: ['cone', 'puddle', 'pothole', 'hose'],
    topics: ['add-sub', 'sight-word'],
  },
  C: {
    speed: 21,
    laneChange: 0.27,
    rowSeconds: 0.9,
    rows: 6,
    questions: 6,
    approach: 1.6,
    tail: 1,
    maxBlocked: 2,
    funChance: 0.28,
    bumpBudget: 5,
    props: ['cone', 'puddle', 'pothole', 'hose', 'car'],
    topics: ['times-divide', 'elapsed', 'spanish'],
  },
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ */
/* The road's own solver                                                */
/* ------------------------------------------------------------------ */

/** Two obstacles this close together stand in the same row. */
const ROW_TOLERANCE = 0.5;

const blockers = (o: TruckRunObstacle): boolean => o.kind !== 'ramp' && o.kind !== 'boost';

/** The hazard rows of a segment, nearest first, as the set of lanes each blocks. */
export function hazardRows(segment: TruckRunSegment): { at: number; blocked: number[] }[] {
  const rows: { at: number; blocked: number[] }[] = [];
  for (const o of [...segment.obstacles].filter(blockers).sort((a, b) => a.at - b.at)) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.at - o.at) <= ROW_TOLERANCE) last.blocked.push(o.lane);
    else rows.push({ at: o.at, blocked: [o.lane] });
  }
  return rows;
}

/**
 * A lane for every hazard row that can actually be driven — starting from any
 * lane, and never moving more than `maxShift` lanes between rows. `null` means
 * the road is not clearable, which the validator treats as a broken challenge.
 */
export function laneEscapeRoute(segment: TruckRunSegment, maxShift = 1): number[] | null {
  const rows = hazardRows(segment);
  if (rows.length === 0) return [];

  /** reachable lane → the lane it came from in the previous row */
  let reach = new Map<number, number>();
  for (let lane = 0; lane < truckRunLanes; lane += 1) reach.set(lane, lane);
  const trail: Map<number, number>[] = [];

  for (const row of rows) {
    const blocked = new Set(row.blocked);
    const next = new Map<number, number>();
    for (let lane = 0; lane < truckRunLanes; lane += 1) {
      if (blocked.has(lane)) continue;
      for (const from of reach.keys()) {
        if (Math.abs(lane - from) <= maxShift) {
          next.set(lane, from);
          break;
        }
      }
    }
    if (next.size === 0) return null;
    trail.push(next);
    reach = next;
  }

  /* walk the trail back so the answer is a real lane-by-lane route */
  const route: number[] = [];
  const first: number | undefined = [...reach.keys()][0];
  if (first === undefined) return null;
  let lane: number = first;
  for (let i = trail.length - 1; i >= 0; i -= 1) {
    route.unshift(lane);
    const from: number | undefined = trail[i]?.get(lane);
    if (from === undefined) return null;
    lane = from;
  }
  return route;
}

/* ------------------------------------------------------------------ */
/* Road layout                                                          */
/* ------------------------------------------------------------------ */

/** Every way to block `count` of three lanes and still leave a reachable lane. */
function blockChoices(count: number, reachable: readonly number[]): number[][] {
  const all = times(truckRunLanes);
  const out: number[][] = [];
  const walk = (from: number, acc: number[]) => {
    if (acc.length === count) {
      const free = all.filter((l) => !acc.includes(l));
      if (free.some((l) => reachable.some((r) => Math.abs(l - r) <= 1))) out.push([...acc]);
      return;
    }
    for (let i = from; i < all.length; i += 1) {
      const lane = all[i];
      if (lane === undefined) continue;
      acc.push(lane);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);
  return out;
}

function buildSegment(rng: Rng, plan: BandPlan, rowGap: number): TruckRunSegment {
  const obstacles: TruckRunObstacle[] = [];
  /* one clear row-gap of road after the previous gates, so the truck settles */
  const lead = rowGap;
  let reachable = times(truckRunLanes);

  for (let i = 0; i < plan.rows; i += 1) {
    const at = round1(lead + i * rowGap);
    const wanted = plan.maxBlocked > 1 && rng.chance(0.35) ? 2 : 1;
    const choices = blockChoices(wanted, reachable);
    const fallback = blockChoices(1, reachable);
    const blocked = rng.pick(choices.length > 0 ? choices : fallback);

    for (const lane of blocked) obstacles.push({ kind: rng.pick(plan.props), lane, at });

    const free = times(truckRunLanes).filter((l) => !blocked.includes(l));
    reachable = free.filter((l) => reachable.some((r) => Math.abs(l - r) <= 1));

    /* a ramp or a boost pad sits on a free lane — a reward for reading ahead.
       Ramps never land on the last row: there would be nothing to sail over. */
    if (free.length > 0 && rng.chance(plan.funChance)) {
      const treat: TruckRunProp = i < plan.rows - 1 && rng.chance(0.5) ? 'ramp' : 'boost';
      obstacles.push({ kind: treat, lane: rng.pick(free), at });
    }
  }

  const gateAt = round1(lead + plan.rows * rowGap + plan.approach * rowGap);
  return { length: round1(gateAt + plan.tail * rowGap), obstacles, gateAt };
}

/* ------------------------------------------------------------------ */
/* Questions                                                            */
/* ------------------------------------------------------------------ */

const label = (n: number): string => String(n);

/** Three short labels containing `answer` exactly once. */
function gateOptions(rng: Rng, answer: string, pool: readonly string[]): string[] {
  const clean = pool.filter((p) => p !== answer && p.length > 0 && p.length <= GATE_LABEL_MAX);
  const filler = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].filter((f) => f !== answer);
  return optionsWith(rng, answer, [...clean, ...filler], truckRunLanes, (v) => v);
}

const numberOptions = (rng: Rng, answer: number): string[] =>
  gateOptions(rng, label(answer), numberDistractors(rng, answer, 5).map(label));

/** Clock face for the elapsed-time gates: 12-hour, always two-digit minutes. */
function clockText(totalMinutes: number): string {
  const m = ((totalMinutes % 720) + 720) % 720;
  const hour = Math.floor(m / 60);
  return `${hour === 0 ? 12 : hour}:${String(m % 60).padStart(2, '0')}`;
}

interface Cloze {
  text: string;
  es: string;
  answer: string;
  decoys: string[];
}

/**
 * Sight-word gates. Every sentence is finished by exactly one of the three
 * words; the decoys look and sound close but cannot mean the sentence.
 */
const clozes: Cloze[] = [
  { text: 'The truck must ___ at the sign.', es: 'El camión debe parar en la señal.', answer: 'stop', decoys: ['step', 'spot'] },
  { text: 'Rosa needs ___ with the boxes.', es: 'Rosa necesita ayuda con las cajas.', answer: 'help', decoys: ['held', 'hedge'] },
  { text: 'We drive down the ___.', es: 'Manejamos por el camino.', answer: 'road', decoys: ['read', 'roar'] },
  { text: 'Roll out the ___ to the hydrant.', es: 'Extiende la manguera al hidrante.', answer: 'hose', decoys: ['nose', 'host'] },
  { text: 'Turn ___ at the corner.', es: 'Da vuelta a la izquierda.', answer: 'left', decoys: ['lift', 'felt'] },
  { text: 'Take it ___ over the bump.', es: 'Ve despacio sobre el bache.', answer: 'slow', decoys: ['show', 'snow'] },
  { text: 'Put on your ___ before you drive.', es: 'Ponte las botas antes de manejar.', answer: 'boots', decoys: ['boats', 'bolts'] },
  { text: 'The bell will ___ out loud.', es: 'La campana va a sonar fuerte.', answer: 'ring', decoys: ['rang', 'rung'] },
  { text: 'Park beside the big ___.', es: 'Estaciónate junto al árbol grande.', answer: 'tree', decoys: ['free', 'three'] },
  { text: 'Keep the yard ___ and tidy.', es: 'Mantén el patio limpio.', answer: 'clean', decoys: ['clear', 'climb'] },
  { text: 'Bea will ___ the map to us.', es: 'Bea nos va a mostrar el mapa.', answer: 'show', decoys: ['slow', 'snow'] },
  { text: 'Wave to the ___ on the path.', es: 'Saluda a los niños en el camino.', answer: 'kids', decoys: ['kites', 'kicks'] },
];

/** Words the Spanish gates can ask for: one plain English word, short enough to read. */
const spanishPool = vocabulary.filter(
  (w) =>
    ['equipment', 'food', 'animals', 'places'].includes(w.category) &&
    /^[a-z]+$/.test(w.en) &&
    w.en.length <= GATE_LABEL_MAX &&
    w.es.length <= 14,
);

function makeQuestion(rng: Rng, topic: TruckRunTopic, ctx: GeneratorContext): TruckRunQuestion {
  switch (topic) {
    case 'number-word': {
      const n = rng.int(1, 12);
      return {
        prompt: `Which gate says ${numberWordEn(n)}?`,
        promptEs: `¿Cuál puerta dice ${numberWordEs(n)}?`,
        options: numberOptions(rng, n),
        answer: label(n),
        hint: `${numberWordEn(n)} is written ${n}.`,
        hintEs: `${numberWordEs(n)} se escribe ${n}.`,
      };
    }

    case 'count-on': {
      const start = rng.int(2, 14);
      const answer = start + 3;
      return {
        prompt: `What comes next? ${start}, ${start + 1}, ${start + 2}`,
        promptEs: `¿Qué sigue? ${start}, ${start + 1}, ${start + 2}`,
        options: numberOptions(rng, answer),
        answer: label(answer),
        hint: `Count on: after ${start + 2} comes ${answer}.`,
        hintEs: `Después de ${start + 2} sigue ${answer}.`,
      };
    }

    case 'add-sub': {
      const adj = masteryAdjustment(ctx, 'addition', 'subtraction');
      if (rng.chance(0.55)) {
        const [lo, hi] = adjustRange([3, 9], adj, 2);
        const a = rng.int(lo, Math.max(lo, Math.min(hi, 15)));
        const b = rng.int(2, Math.max(2, 20 - a));
        return {
          prompt: `What is ${a} + ${b}?`,
          promptEs: `¿Cuánto es ${a} + ${b}?`,
          options: numberOptions(rng, a + b),
          answer: label(a + b),
          hint: `Start at ${a} and count on ${b}. It makes ${a + b}.`,
          hintEs: `${a} más ${b} son ${a + b}.`,
        };
      }
      const a = rng.int(10, 20);
      const b = rng.int(2, a - 2);
      return {
        prompt: `What is ${a} − ${b}?`,
        promptEs: `¿Cuánto es ${a} − ${b}?`,
        options: numberOptions(rng, a - b),
        answer: label(a - b),
        hint: `Take ${b} away from ${a} and ${a - b} is left.`,
        hintEs: `${a} menos ${b} son ${a - b}.`,
      };
    }

    case 'sight-word': {
      const c = rng.pick(clozes);
      return {
        prompt: c.text,
        promptEs: c.es,
        options: optionsWith(rng, c.answer, c.decoys, truckRunLanes, (v) => v),
        answer: c.answer,
        hint: `Sound it out: the word is “${c.answer}”.`,
        hintEs: `La palabra es “${c.answer}”.`,
      };
    }

    case 'times-divide': {
      const adj = masteryAdjustment(ctx, 'multiplication', 'division');
      const [lo, hi] = adjustRange([3, 8], adj, 2);
      const a = rng.int(2, 9);
      const b = rng.int(Math.min(lo, 9), Math.min(Math.max(hi, lo + 1), 9));
      if (rng.chance(0.6)) {
        return {
          prompt: `What is ${a} × ${b}?`,
          promptEs: `¿Cuánto es ${a} × ${b}?`,
          options: numberOptions(rng, a * b),
          answer: label(a * b),
          hint: `Count in ${a}s, ${b} times: ${a * b}.`,
          hintEs: `${a} por ${b} son ${a * b}.`,
        };
      }
      return {
        prompt: `What is ${a * b} ÷ ${a}?`,
        promptEs: `¿Cuánto es ${a * b} ÷ ${a}?`,
        options: numberOptions(rng, b),
        answer: label(b),
        hint: `${a} groups make ${a * b}, so each group is ${b}.`,
        hintEs: `${a * b} entre ${a} son ${b}.`,
      };
    }

    case 'elapsed': {
      const gap = rng.pick([15, 30, 45, 60, 90]);
      const start = rng.int(1, 10) * 60 + rng.pick([0, 15, 30, 45]);
      const answer = `${gap} min`;
      const pool = [15, 30, 45, 60, 90].filter((m) => m !== gap).map((m) => `${m} min`);
      return {
        prompt: `${clockText(start)} to ${clockText(start + gap)} — how long?`,
        promptEs: `De ${clockText(start)} a ${clockText(start + gap)} — ¿cuánto tiempo?`,
        options: optionsWith(rng, answer, pool, truckRunLanes, (v) => v),
        answer,
        hint: `From ${clockText(start)} it is ${gap} minutes to ${clockText(start + gap)}.`,
        hintEs: `Son ${gap} minutos.`,
      };
    }

    case 'spanish': {
      const pool = spanishPool.length >= 3 ? spanishPool : vocabulary;
      const word = rng.pick(pool);
      const others = pool.filter((w) => w.id !== word.id && w.en !== word.en).map((w) => w.en);
      return {
        prompt: `What does “${word.es}” mean?`,
        promptEs: `¿Qué significa “${word.es}”?`,
        options: optionsWith(rng, word.en, others, truckRunLanes, (v) => v),
        answer: word.en,
        hint: `“${word.es}” is the English word ${word.en}.`,
        hintEs: `“${word.es}” es ${word.en} en inglés.`,
      };
    }
  }
}

/* ------------------------------------------------------------------ */

/**
 * TRUCK RUN — steer the engine through Spark City and answer by driving
 * through a gate. One topic per run, so the recap tells the truth; one road
 * per question, cycled, so a wrong gate costs a moment and never the run.
 */
export const generateTruckRun: ChallengeGenerator<'truck-run'> = (ctx) => buildRun(ctx);

/**
 * The same road, on a topic the *story* chose.
 *
 * A mission that has just planned a route wants the drive that follows it to
 * practise what the mission is about — counting on the way to the clock tower,
 * elapsed time on the way to the platform. Topics are band-locked (a five year
 * old is never asked to divide), so this takes a preference *list* and uses the
 * first one this band actually teaches, falling back to the ordinary random
 * pick. That way one mission beat reads correctly for all three bands.
 */
export function truckRunFor(prefer: readonly TruckRunTopic[], ctx: GeneratorContext): ChallengeOf<'truck-run'> {
  const allowed = plans[ctx.ageBand].topics;
  return buildRun(ctx, prefer.find((t) => allowed.includes(t)));
}

function buildRun(ctx: GeneratorContext, wanted?: TruckRunTopic): ChallengeOf<'truck-run'> {
  const { rng, ageBand } = ctx;
  const plan = plans[ageBand];
  const rowGap = round1(plan.speed * plan.rowSeconds);
  const topic = wanted ?? rng.pick(plan.topics);

  const questions: TruckRunQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (questions.length < plan.questions && guard < plan.questions * 12) {
    guard += 1;
    const q = makeQuestion(rng, topic, ctx);
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    questions.push(q);
  }
  /* a tiny bank (the cloze list) can run dry — a repeat is better than a short run */
  while (questions.length < plan.questions) questions.push(makeQuestion(rng, topic, ctx));

  const segments = times(plan.questions).map(() => buildSegment(rng, plan, rowGap));

  return {
    kind: 'truck-run',
    topic,
    questions,
    segments,
    speed: plan.speed,
    laneChange: plan.laneChange,
    rowGap,
    finish: round1(rowGap * 2.5),
    bumpBudget: plan.bumpBudget,
    scene: sceneOr(ctx, 'station-yard'),
  };
}
