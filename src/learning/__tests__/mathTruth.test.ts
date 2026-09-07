/**
 * THE ANSWER KEY IS THE PRODUCT.
 *
 * `validateChallenge` asks "is this challenge well formed and solvable?".
 * This file asks the harder question: **is the answer it ships actually
 * right?** — recomputed here from the question a child can see, by arithmetic
 * that shares no code with the generator that produced it.
 *
 * It also asks the mirror question, which is the one that bites in a
 * multiple-choice game: **is every other option actually wrong?** A distractor
 * that happens to also be correct is indistinguishable, from the child's side,
 * from a bug in the answer key.
 *
 * Everything below is property-style: hundreds of seeds per band, all three
 * bands, with the failing seed named when something breaks.
 */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeKind, ChallengeOf, GeneratorContext } from '@/learning/types';
import { challengeKinds, generateChallenge } from '@/learning/generators';
import { validateChallenge } from '@/learning/validate';
import { countPhraseEs, numberWordsEn, vocabulary } from '@/learning/vocabulary';
import { isSubMultiset } from '@/learning/solvers';

const BANDS: AgeBand[] = ['A', 'B', 'C'];

const ctxFor = (ageBand: AgeBand, seed: number): GeneratorContext => ({ ageBand, rng: createRng(seed) });

/** `count` challenges of one kind for one band, from spread-out seeds. */
function sample<K extends ChallengeKind>(kind: K, band: AgeBand, count = 400): ChallengeOf<K>[] {
  return Array.from({ length: count }, (_, i) => generateChallenge(kind, ctxFor(band, i * 1103 + 7)));
}

/** Report the first few failures with their seed, not just "expected true". */
const check = (kind: ChallengeKind, band: AgeBand, index: number, ok: boolean, why: string): string[] =>
  ok ? [] : [`${kind}/${band} seed #${index}: ${why}`];

/* ================================================================== */
/* Every kind, every band, a thousand seeds: still playable            */
/* ================================================================== */

describe('the whole bank stays playable under a wide sweep', () => {
  it.each(BANDS)('band %s — 1000 seeds × 27 kinds have no validator complaint', (band) => {
    const failures: string[] = [];
    for (const kind of challengeKinds) {
      for (let seed = 1; seed <= 1000; seed += 1) {
        const problems = validateChallenge(generateChallenge(kind, ctxFor(band, seed * 7919 + 3)));
        if (problems.length > 0) failures.push(`${kind} seed ${seed}: ${problems.join(' | ')}`);
        if (failures.length > 5) break;
      }
    }
    expect(failures).toEqual([]);
  });
});

/* ================================================================== */
/* Hydrant Match — the tag on the hydrant IS the answer                */
/* ================================================================== */

/** Work the tag out from scratch. Returns null for a tag we cannot read. */
function evaluateTag(label: string): number | null {
  const word = numberWordsEn.indexOf(label.trim().toLowerCase());
  if (word >= 0) return word;
  const sum = /^(\d+)\s*([+−×÷])\s*(\d+)$/.exec(label.trim());
  if (!sum) return null;
  const a = Number(sum[1]);
  const b = Number(sum[3]);
  switch (sum[2]) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    default: return a / b;
  }
}

describe('hydrant match — the tag and the answer key agree', () => {
  it.each(BANDS)('band %s — every tag is readable and evaluates to `correct`', (band) => {
    const failures: string[] = [];
    sample('hydrant-match', band).forEach((c, i) => {
      const value = evaluateTag(c.label);
      failures.push(...check('hydrant-match', band, i, value !== null, `unreadable tag “${c.label}”`));
      if (value !== null) {
        failures.push(...check('hydrant-match', band, i, value === c.correct, `“${c.label}” is ${value}, not ${c.correct}`));
        failures.push(...check('hydrant-match', band, i, Number.isInteger(value), `“${c.label}” is not a whole number`));
      }
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — exactly one hydrant is right and no other one also is', (band) => {
    const failures: string[] = [];
    sample('hydrant-match', band).forEach((c, i) => {
      const right = c.options.filter((o) => o === c.correct);
      failures.push(...check('hydrant-match', band, i, right.length === 1, `${right.length} options equal the answer`));
      failures.push(...check('hydrant-match', band, i, new Set(c.options).size === c.options.length, 'two hydrants share a number'));
      failures.push(...check('hydrant-match', band, i, c.options.length >= 3, 'fewer than three hydrants'));
      failures.push(...check('hydrant-match', band, i, c.options.every((o) => o > 0), 'a hydrant number is not positive'));
    });
    expect(failures).toEqual([]);
  });

  it('keeps band A inside twenty, and gives band C its tables', () => {
    for (const c of sample('hydrant-match', 'A', 200)) expect(c.correct).toBeLessThanOrEqual(20);
    const labels = sample('hydrant-match', 'C', 200).map((c) => c.label);
    expect(labels.some((l) => l.includes('×'))).toBe(true);
    expect(labels.some((l) => l.includes('÷'))).toBe(true);
    // …and band A never has to multiply
    expect(sample('hydrant-match', 'A', 200).every((c) => !c.label.includes('×'))).toBe(true);
  });
});

/* ================================================================== */
/* Market Money — the coins really do make the price                   */
/* ================================================================== */

/** Can the purse make this total at all? Independent of the generator. */
function reachable(coins: readonly number[], target: number): boolean {
  const seen = new Set<number>([0]);
  for (const coin of coins) {
    for (const sum of [...seen]) if (sum + coin <= target) seen.add(sum + coin);
  }
  return seen.has(target);
}

describe('market money — every price is payable and every change is right', () => {
  it.each(BANDS)('band %s — the price can be made from the purse', (band) => {
    const failures: string[] = [];
    sample('market-money', band).forEach((c, i) => {
      failures.push(...check('market-money', band, i, reachable(c.coins, c.price), `${c.price} cannot be made from ${c.coins.join('+')}`));
      failures.push(...check('market-money', band, i, c.solutions.length > 0, 'no way to pay is listed'));
      for (const solution of c.solutions) {
        const total = solution.reduce((a, b) => a + b, 0);
        failures.push(...check('market-money', band, i, total === c.price, `${solution.join('+')} = ${total}, not ${c.price}`));
        failures.push(...check('market-money', band, i, isSubMultiset(solution, c.coins), `${solution.join('+')} uses coins that are not in the purse`));
      }
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — the purse only holds real coin values', (band) => {
    const failures: string[] = [];
    sample('market-money', band).forEach((c, i) => {
      const values = new Set(c.denominations);
      failures.push(...check('market-money', band, i, c.coins.every((coin) => values.has(coin)), 'a purse coin is not on the sign'));
      failures.push(...check('market-money', band, i, c.denominations.every((d) => [1, 5, 10, 25].includes(d)), 'a made-up coin'));
      failures.push(...check('market-money', band, i, c.price >= 1, 'the price is free'));
    });
    expect(failures).toEqual([]);
  });

  it('band C works out the change from a note, and the change is paid − price', () => {
    const failures: string[] = [];
    sample('market-money', 'C', 400).forEach((c, i) => {
      const ask = c.askChange;
      failures.push(...check('market-money', 'C', i, ask !== undefined, 'band C was not asked for the change'));
      if (!ask) return;
      failures.push(...check('market-money', 'C', i, ask.paid > c.price, `paid ${ask.paid} for a ${c.price} item`));
      failures.push(...check('market-money', 'C', i, ask.change === ask.paid - c.price, `change ${ask.change} ≠ ${ask.paid} − ${c.price}`));
      failures.push(...check('market-money', 'C', i, [25, 50, 100].includes(ask.paid), 'paid with a note that does not exist'));
      failures.push(...check('market-money', 'C', i, ask.change > 0, 'no change to work out'));
    });
    expect(failures).toEqual([]);
  });

  it('lets the youngest pay over, and asks everyone else for the exact price', () => {
    expect(sample('market-money', 'A', 200).every((c) => c.exactChange === false)).toBe(true);
    expect(sample('market-money', 'B', 200).every((c) => c.exactChange === true)).toBe(true);
    expect(sample('market-money', 'C', 200).every((c) => c.exactChange === true)).toBe(true);
    expect(sample('market-money', 'A', 200).every((c) => c.askChange === undefined)).toBe(true);
  });
});

/* ================================================================== */
/* Fractions — pizzas, tanks and jugs                                  */
/* ================================================================== */

/** Exact rational sum, with no floating point anywhere near it. */
function addFractions(parts: readonly { num: number; den: number }[]): { num: number; den: number } {
  let num = 0;
  let den = 1;
  for (const f of parts) {
    num = num * f.den + f.num * den;
    den *= f.den;
  }
  return { num, den };
}

describe('pizza fractions — the toppings make exactly one whole pizza', () => {
  it.each(BANDS)('band %s — every pizza adds to 1, cuts whole and shares evenly', (band) => {
    const failures: string[] = [];
    sample('pizza-fractions', band).forEach((c, i) => {
      const sum = addFractions(c.toppings.map((t) => t.fraction));
      failures.push(...check('pizza-fractions', band, i, sum.num === sum.den, `toppings make ${sum.num}/${sum.den} of a pizza`));
      for (const t of c.toppings) {
        const slices = (t.fraction.num * c.cutInto) / t.fraction.den;
        failures.push(...check('pizza-fractions', band, i, Number.isInteger(slices), `${t.topping} lands on ${slices} slices`));
        failures.push(...check('pizza-fractions', band, i, slices >= 1, `${t.topping} gets no slice at all`));
      }
      failures.push(...check('pizza-fractions', band, i, c.cutInto % c.shareAmong === 0, `${c.cutInto} slices do not share between ${c.shareAmong}`));
      failures.push(...check('pizza-fractions', band, i, c.each === c.cutInto / c.shareAmong, `each = ${c.each}, but ${c.cutInto} ÷ ${c.shareAmong} = ${c.cutInto / c.shareAmong}`));
      failures.push(...check('pizza-fractions', band, i, new Set(c.toppings.map((t) => t.topping)).size === c.toppings.length, 'the same topping twice'));
    });
    expect(failures).toEqual([]);
  });

  it('gives band C fractions the younger bands never see', () => {
    const denominators = (band: AgeBand) =>
      new Set(sample('pizza-fractions', band, 300).flatMap((c) => c.toppings.map((t) => t.fraction.den)));
    expect([...denominators('A')]).toEqual([2]);
    expect(denominators('C').has(3)).toBe(true);
    expect(denominators('C').has(8)).toBe(true);
    // …and only band C is ever asked about a numerator bigger than one
    const topHeavy = (band: AgeBand) =>
      sample('pizza-fractions', band, 300).some((c) => c.toppings.some((t) => t.fraction.num > 1));
    expect(topHeavy('A')).toBe(false);
    expect(topHeavy('B')).toBe(false);
    expect(topHeavy('C')).toBe(true);
  });
});

describe('tanks and jugs — the target is always a whole number of pours', () => {
  it.each(BANDS)('band %s — water tank', (band) => {
    const failures: string[] = [];
    sample('water-tank', band).forEach((c, i) => {
      const pumps = (c.target.num * c.pumpStep.den) / (c.target.den * c.pumpStep.num);
      failures.push(...check('water-tank', band, i, Number.isInteger(pumps), `${c.target.num}/${c.target.den} is ${pumps} pumps`));
      failures.push(...check('water-tank', band, i, pumps >= 1, 'the tank is already full enough'));
      failures.push(...check('water-tank', band, i, c.pumpStep.den === c.ticks && c.pumpStep.num === 1, 'a pump is not one gauge tick'));
      failures.push(...check('water-tank', band, i, c.target.num / c.target.den <= 1, 'the target is above a full tank'));
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — measure and pour', (band) => {
    const failures: string[] = [];
    sample('measure-pour', band).forEach((c, i) => {
      const pours = (c.target.num * c.step.den) / (c.target.den * c.step.num);
      failures.push(...check('measure-pour', band, i, Number.isInteger(pours), `${c.target.num}/${c.target.den} is ${pours} pours`));
      failures.push(...check('measure-pour', band, i, pours >= 1, 'nothing to pour'));
      failures.push(...check('measure-pour', band, i, c.step.den === c.ticks && c.step.num === 1, 'a pour is not one jug mark'));
    });
    expect(failures).toEqual([]);
  });

  it('pours halves for the youngest and eighths only for the oldest', () => {
    expect(sample('water-tank', 'A', 200).every((c) => c.ticks === 2)).toBe(true);
    expect(sample('water-tank', 'B', 200).every((c) => c.ticks === 4)).toBe(true);
    expect(sample('water-tank', 'C', 200).some((c) => c.ticks === 8)).toBe(true);
  });
});

/* ================================================================== */
/* Sharing and scaling                                                 */
/* ================================================================== */

describe('sharing and scaling — nobody is left holding half a taco', () => {
  it.each(BANDS)('band %s — divide & share', (band) => {
    const failures: string[] = [];
    sample('divide-share', band).forEach((c, i) => {
      failures.push(...check('divide-share', band, i, c.total === c.among * c.each, `${c.total} ≠ ${c.among} × ${c.each}`));
      failures.push(...check('divide-share', band, i, c.among >= 2 && c.each >= 1, 'nothing to share, or nobody to share with'));
      failures.push(...check('divide-share', band, i, Number.isInteger(c.total / c.among), 'the share is not a whole number'));
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — recipe scale', (band) => {
    const failures: string[] = [];
    sample('recipe-scale', band).forEach((c, i) => {
      for (const line of c.lines) {
        failures.push(...check('recipe-scale', band, i, Number.isInteger(line.scaled), `${line.item.en} scales to ${line.scaled}`));
        failures.push(...check('recipe-scale', band, i, line.scaled * c.serves === line.amount * c.eating,
          `${line.amount} for ${c.serves} should be ${(line.amount * c.eating) / c.serves} for ${c.eating}, not ${line.scaled}`));
        failures.push(...check('recipe-scale', band, i, line.scaled > line.amount, 'the recipe got smaller'));
      }
      failures.push(...check('recipe-scale', band, i, c.eating > c.serves, 'nobody extra turned up'));
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — the soup pot adds itself up correctly', (band) => {
    const failures: string[] = [];
    sample('soup-pot', band).forEach((c, i) => {
      const total = c.steps.reduce((sum, s) => sum + s.count, 0);
      if (c.askTotal !== undefined) {
        failures.push(...check('soup-pot', band, i, c.askTotal === total, `askTotal ${c.askTotal} ≠ ${total}`));
      }
      const inPot = new Set(c.steps.map((s) => s.item.id));
      failures.push(...check('soup-pot', band, i, inPot.size === c.steps.length, 'the same thing goes in twice'));
      failures.push(...check('soup-pot', band, i, c.extras.every((e) => !inPot.has(e.id)), 'a counter extra is also in the pot'));
    });
    expect(failures).toEqual([]);
  });
});

/* ================================================================== */
/* Time                                                                */
/* ================================================================== */

describe('clock watch — the target is always later, and always reachable', () => {
  it.each(BANDS)('band %s', (band) => {
    const failures: string[] = [];
    sample('clock-watch', band).forEach((c, i) => {
      const from = c.start.h * 60 + c.start.m;
      const to = c.target.h * 60 + c.target.m;
      const delta = to - from;
      failures.push(...check('clock-watch', band, i, delta > 0, `the target is ${delta} minutes away`));
      failures.push(...check('clock-watch', band, i, delta <= 180, `${delta} minutes is more than three hours`));
      failures.push(...check('clock-watch', band, i, delta % c.step === 0, `${delta} is not a whole number of ${c.step}-minute steps`));
      failures.push(...check('clock-watch', band, i, c.start.h >= 1 && c.start.h <= 12, 'the start is off the dial'));
      failures.push(...check('clock-watch', band, i, c.target.h >= 1 && c.target.h <= 12, 'the target is off the dial'));
      failures.push(...check('clock-watch', band, i, c.event.trim().length > 0, 'no reason to set the clock'));
    });
    expect(failures).toEqual([]);
  });

  it('reads half hours at five, and five-minute steps at ten', () => {
    expect(sample('clock-watch', 'A', 200).every((c) => c.step === 30)).toBe(true);
    const spanA = sample('clock-watch', 'A', 200).map((c) => (c.target.h * 60 + c.target.m) - (c.start.h * 60 + c.start.m));
    expect(Math.max(...spanA)).toBeLessThanOrEqual(60);
    expect(sample('clock-watch', 'C', 200).every((c) => c.step === 5)).toBe(true);
  });
});

/* ================================================================== */
/* Truck Run — every gate label is checked against the prompt          */
/* ================================================================== */

const clockToMinutes = (text: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

/** Recompute the answer from the prompt alone; null when this topic is textual. */
function answerFromPrompt(prompt: string): string | null {
  const word = /^Which gate says ([a-z]+)\?$/.exec(prompt);
  if (word) {
    const n = numberWordsEn.indexOf(word[1] ?? '');
    return n >= 0 ? String(n) : null;
  }
  const countOn = /^What comes next\? (\d+), (\d+), (\d+)$/.exec(prompt);
  if (countOn) return String(Number(countOn[3]) + 1);
  const arithmetic = /^What is (\d+) ([+−×÷]) (\d+)\?$/.exec(prompt);
  if (arithmetic) {
    const a = Number(arithmetic[1]);
    const b = Number(arithmetic[3]);
    switch (arithmetic[2]) {
      case '+': return String(a + b);
      case '−': return String(a - b);
      case '×': return String(a * b);
      default: return String(a / b);
    }
  }
  const elapsed = /^(\d{1,2}:\d{2}) to (\d{1,2}:\d{2}) — how long\?$/.exec(prompt);
  if (elapsed) {
    const from = clockToMinutes(elapsed[1] ?? '');
    const to = clockToMinutes(elapsed[2] ?? '');
    if (from === null || to === null) return null;
    return `${((to - from) + 720) % 720} min`;
  }
  return null;
}

describe('truck run — the gate that opens is the one the question asked for', () => {
  it.each(BANDS)('band %s — every countable prompt agrees with its answer', (band) => {
    const failures: string[] = [];
    let checked = 0;
    sample('truck-run', band, 120).forEach((c, i) => {
      for (const q of c.questions) {
        const expected = answerFromPrompt(q.prompt);
        if (expected !== null) {
          checked += 1;
          failures.push(...check('truck-run', band, i, expected === q.answer, `“${q.prompt}” → ${expected}, not ${q.answer}`));
        }
        const right = q.options.filter((o) => o === q.answer);
        failures.push(...check('truck-run', band, i, right.length === 1, `${right.length} gates carry the answer`));
        failures.push(...check('truck-run', band, i, new Set(q.options).size === 3, 'two gates carry the same label'));
        failures.push(...check('truck-run', band, i, q.hint.trim().length > 0, 'no hint, so a child could be stuck'));
        failures.push(...check('truck-run', band, i, q.options.every((o) => o.length <= 8), 'a gate label is too long to read at speed'));
      }
    });
    expect(failures).toEqual([]);
    expect(checked).toBeGreaterThan(0);
  });

  it('checks every arithmetic and elapsed-time gate in the game, not just some', () => {
    const arithmetic = sample('truck-run', 'C', 200)
      .flatMap((c) => c.questions)
      .filter((q) => answerFromPrompt(q.prompt) !== null);
    expect(arithmetic.length).toBeGreaterThan(50);
    for (const q of arithmetic) expect(q.answer).toBe(answerFromPrompt(q.prompt));
  });
});

/* ================================================================== */
/* Patterns, words and reading — "no distractor is also correct"       */
/* ================================================================== */

describe('spray pattern — the hidden cell is what the rule really predicts', () => {
  it.each(BANDS)('band %s', (band) => {
    const failures: string[] = [];
    sample('spray-pattern', band).forEach((c, i) => {
      /* find the rule from the VISIBLE part only, exactly as a child would */
      const visible = c.sequence.slice(0, -1);
      /* the same "enough of the rule is showing" bar the validator uses */
      const period = [2, 3, 4].find((p) => visible.length >= p * 1.5 && visible.every((s, at) => s === visible[at % p]));
      failures.push(...check('spray-pattern', band, i, period !== undefined, 'no rule is visible before the gap'));
      if (period !== undefined) {
        const predicted = visible[(c.sequence.length - 1) % period];
        failures.push(...check('spray-pattern', band, i, predicted === c.answer, `the rule predicts ${predicted}, the key says ${c.answer}`));
      }
      const right = c.options.filter((o) => o === c.answer);
      failures.push(...check('spray-pattern', band, i, right.length === 1, `${right.length} options are the answer`));
      failures.push(...check('spray-pattern', band, i, new Set(c.options).size === c.options.length, 'a duplicated option'));
    });
    expect(failures).toEqual([]);
  });
});

describe('word games — one right answer, and it is tellable from the others', () => {
  it('no two words in the bank are the same word twice', () => {
    const pairs = vocabulary.map((w) => `${w.en.toLowerCase()}|${w.es.toLowerCase()}`);
    expect(new Set(pairs).size).toBe(pairs.length);
    expect(new Set(vocabulary.map((w) => w.id)).size).toBe(vocabulary.length);
  });

  it.each(BANDS)('band %s — vocab tap never shows the same word twice, in either language', (band) => {
    const failures: string[] = [];
    sample('vocab-tap', band).forEach((c, i) => {
      const answers = c.options.filter((o) => o.id === c.word.id);
      failures.push(...check('vocab-tap', band, i, answers.length === 1, `${answers.length} tiles are the word`));
      for (const lang of ['en', 'es'] as const) {
        const texts = c.options.map((o) => o[lang].toLowerCase());
        failures.push(...check('vocab-tap', band, i, new Set(texts).size === texts.length, `two tiles both read “${texts.find((t, at) => texts.indexOf(t) !== at)}” in ${lang}`));
      }
      const icons = c.options.map((o) => o.icon);
      failures.push(...check('vocab-tap', band, i, new Set(icons).size === icons.length, 'two tiles are the same picture'));
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — word builder can always be finished from the tray', (band) => {
    const failures: string[] = [];
    sample('word-builder', band).forEach((c, i) => {
      failures.push(...check('word-builder', band, i, c.letters.join('').toLowerCase() === c.word[c.lang].toLowerCase(), 'the slots do not spell the word'));
      const bag = new Map<string, number>();
      for (const tile of c.tiles) bag.set(tile, (bag.get(tile) ?? 0) + 1);
      for (const letter of c.letters.slice(c.prefilled)) {
        const left = bag.get(letter) ?? 0;
        failures.push(...check('word-builder', band, i, left > 0, `no “${letter}” tile for “${c.word[c.lang]}”`));
        bag.set(letter, left - 1);
      }
      failures.push(...check('word-builder', band, i, c.prefilled < c.letters.length, 'the word is already spelled'));
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — the radio call has exactly one right answer', (band) => {
    const failures: string[] = [];
    sample('dispatch-decoder', band).forEach((c, i) => {
      const right = c.options.filter((o) => o === c.correct);
      failures.push(...check('dispatch-decoder', band, i, right.length === 1, `${right.length} options are correct`));
      failures.push(...check('dispatch-decoder', band, i, new Set(c.options).size === c.options.length, 'a duplicated option'));
      failures.push(...check('dispatch-decoder', band, i, (c.messageEs ?? '').trim().length > 0, 'the call has no Spanish'));
      failures.push(...check('dispatch-decoder', band, i, c.options.every((o) => o.trim().length > 0), 'an empty option'));
    });
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — listen & count asks in Spanish for the number it wants', (band) => {
    const failures: string[] = [];
    sample('listen-count', band).forEach((c, i) => {
      const phrase = countPhraseEs(c.count, c.item);
      failures.push(...check('listen-count', band, i, c.phraseEs.includes(phrase), `“${c.phraseEs}” does not say “${phrase}”`));
      failures.push(...check('listen-count', band, i, c.count <= c.maxOnScreen, 'more to count than fits on screen'));
      failures.push(...check('listen-count', band, i, c.count >= 1, 'nothing to count'));
      failures.push(...check('listen-count', band, i, !c.phraseEs.includes('undefined'), 'the Spanish did not build'));
      failures.push(...check('listen-count', band, i, !c.phraseEn.includes('undefined'), 'the English did not build'));
    });
    expect(failures).toEqual([]);
  });
});
