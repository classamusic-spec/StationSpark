/**
 * SHARING, DIVISION & SCALING MATH — pure, no React, fully testable.
 * Used by Divide & Share, the pizza's share phase and Recipe Scale.
 */

export interface ShareState {
  /** every plate holds exactly `each` */
  done: boolean;
  /** plate indices holding more than `each` */
  over: number[];
  /** plate indices still holding fewer than `each` */
  under: number[];
  placed: number;
}

/** Slices/tacos per person. Always at least 0; never divides by zero. */
export function eachShare(total: number, among: number): number {
  if (among <= 0) return 0;
  return Math.floor(total / among);
}

export function shareState(plates: readonly number[], each: number): ShareState {
  const over: number[] = [];
  const under: number[] = [];
  let placed = 0;
  plates.forEach((n, i) => {
    placed += n;
    if (n > each) over.push(i);
    else if (n < each) under.push(i);
  });
  return { done: over.length === 0 && under.length === 0, over, under, placed };
}

/** The plate that should get the next item (leftmost emptiest), or -1 when full. */
export function nextPlate(plates: readonly number[], each: number): number {
  let best = -1;
  let bestCount = Infinity;
  plates.forEach((n, i) => {
    if (n < each && n < bestCount) {
      best = i;
      bestCount = n;
    }
  });
  return best;
}

/** "12 ÷ 4 = 2" — pass `each: null` for the un-answered "= ?" form. */
export function equationText(total: number, among: number, each: number | null): string {
  return `${total} ÷ ${among} = ${each === null ? '?' : each}`;
}

/**
 * Deterministic answer tiles for "total ÷ among = ?" — always includes the
 * correct answer, always ascending, always positive.
 */
export function answerOptions(correct: number, count = 3): number[] {
  const candidates = [correct, correct + 1, correct - 1, correct + 2, correct + 3, correct * 2];
  const out: number[] = [];
  for (const c of candidates) {
    if (c > 0 && !out.includes(c)) out.push(c);
    if (out.length >= count) break;
  }
  let extra = correct + 4;
  while (out.length < count) {
    if (!out.includes(extra)) out.push(extra);
    extra += 1;
  }
  return out.sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ */
/* Recipe scaling                                                       */
/* ------------------------------------------------------------------ */

/** How much of an ingredient you need when `eating` people show up instead of `serves`. */
export function scaledAmount(amount: number, serves: number, eating: number): number {
  if (serves <= 0) return amount;
  return Math.round((amount * eating) / serves);
}

export function isScaleLineCorrect(value: number, expected: number): boolean {
  return value === expected;
}

/** Captain Bea's one-line explanation of a single wrong recipe line. */
export function scaleExplanation(itemEn: string, amount: number, serves: number, eating: number, scaled: number): string {
  const more = scaled - amount;
  const tail =
    more > 0
      ? `so ${eating} need ${more} more — ${scaled} in total.`
      : more < 0
        ? `so ${eating} need ${Math.abs(more)} fewer — ${scaled} in total.`
        : `so ${eating} need the same — ${scaled}.`;
  return `${serves} people need ${amount} ${itemEn}, ${tail}`;
}

/** "Serves 4 → 6 are eating" ratio, as a friendly multiplier when it is clean. */
export function scaleRatioText(serves: number, eating: number): string {
  if (serves <= 0) return `${eating} eating`;
  if (eating === serves * 2) return 'Double it!';
  if (eating * 2 === serves) return 'Half of it!';
  if (eating === serves) return 'Same as always!';
  return eating > serves ? `${eating - serves} more mouth${eating - serves === 1 ? '' : 's'} to feed` : `${serves - eating} fewer to feed`;
}

/* ------------------------------------------------------------------ */
/* Counting ingredients                                                 */
/* ------------------------------------------------------------------ */

export interface CountCheck {
  done: boolean;
  /** item ids the child added too many of */
  over: string[];
  /** item ids still missing */
  under: string[];
  /** item ids that do not belong in this recipe at all */
  extras: string[];
}

export function checkCounts(
  needs: readonly { id: string; count: number }[],
  bowl: Readonly<Record<string, number>>,
): CountCheck {
  const over: string[] = [];
  const under: string[] = [];
  const extras: string[] = [];
  for (const need of needs) {
    const have = bowl[need.id] ?? 0;
    if (have > need.count) over.push(need.id);
    else if (have < need.count) under.push(need.id);
  }
  for (const [id, n] of Object.entries(bowl)) {
    if (n > 0 && !needs.some((need) => need.id === id)) extras.push(id);
  }
  return { done: over.length === 0 && under.length === 0 && extras.length === 0, over, under, extras };
}

/* ------------------------------------------------------------------ */
/* The soup pot — a sequence, not a set                                 */
/* ------------------------------------------------------------------ */

export interface PotState {
  /** the step the pot is waiting for, or -1 when the soup is complete */
  step: number;
  /** how many of that step's ingredient are already in */
  inStep: number;
  /** how many are still needed for that step */
  left: number;
  /** every piece in the pot so far, across all steps */
  total: number;
  done: boolean;
}

/**
 * Where the pot is up to. `added[i]` is how many of step i went in; the pot is
 * strictly in order, so the first unfinished step is the live one.
 */
export function potState(
  steps: readonly { count: number }[],
  added: readonly number[],
): PotState {
  let total = 0;
  let step = -1;
  let inStep = 0;
  let left = 0;
  steps.forEach((s, i) => {
    const have = Math.max(0, added[i] ?? 0);
    total += Math.min(have, s.count);
    if (step === -1 && have < s.count) {
      step = i;
      inStep = have;
      left = s.count - have;
    }
  });
  return { step, inStep, left, total, done: step === -1 };
}

/** How many pieces the whole pot takes — the answer to "how many went in?". */
export const potTotal = (steps: readonly { count: number }[]): number =>
  steps.reduce((sum, s) => sum + s.count, 0);

/**
 * What happens when the child drops `itemId` in the pot right now.
 *  - `add`     it is the next thing the recipe asks for
 *  - `wait`    it IS in the soup, but not yet ("the potatoes come after the onions")
 *  - `not-in`  it belongs to another dish
 */
export function potDrop(
  steps: readonly { item: { id: string }; count: number }[],
  added: readonly number[],
  itemId: string,
): { verdict: 'add' | 'wait' | 'not-in'; step: number } {
  const state = potState(steps, added);
  if (state.done) return { verdict: 'wait', step: -1 };
  const wanted = steps[state.step];
  if (wanted && wanted.item.id === itemId) return { verdict: 'add', step: state.step };
  const later = steps.findIndex((s) => s.item.id === itemId);
  return { verdict: later >= 0 ? 'wait' : 'not-in', step: later };
}

/* ------------------------------------------------------------------ */
/* The Count Ingredients shelf                                          */
/* ------------------------------------------------------------------ */

/**
 * What goes on the pantry shelf, in order.
 *
 * NEVER DEAD-END: every ingredient the shopping list asks for is laid out
 * first, so the recipe can always be cooked. Whatever room is left over goes
 * to `spare` (one extra of each ingredient, then the decoys) — the old build
 * pushed `count + 2` of everything and then truncated, which silently dropped
 * the last ingredient of a three-item list and made the recipe impossible.
 *
 * Generic over the item type so the game can pass `VocabWord`s straight in.
 */
export function pantryList<T>(
  needs: readonly { item: T; count: number }[],
  spare: readonly T[],
  capacity: number,
): T[] {
  const required: T[] = [];
  for (const need of needs) for (let i = 0; i < Math.max(0, need.count); i += 1) required.push(need.item);
  const room = Math.max(0, capacity - required.length);
  return [...required, ...spare.slice(0, room)];
}
