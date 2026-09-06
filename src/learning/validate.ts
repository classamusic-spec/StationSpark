/**
 * CHALLENGE VALIDATOR — "could a child actually finish this?"
 *
 * Every generator is checked against this in the test suite, and the dev
 * gallery can run it live. Returns a list of human-readable problems; an empty
 * list means the challenge is structurally sound AND solvable.
 */
import { add, equals, toNumber } from '@/utils/fractions';
import { pathPieces, posKey, samePos, solveHosePath, solveRoute } from '@/utils/grid';
import type { Challenge, Fraction, GridPos } from './types';
import { rotatableShapes, truckRunLanes } from './types';
import { isSubMultiset, solveNumberLadder, sumOf } from './solvers';
import { GATE_LABEL_MAX, hazardRows, laneEscapeRoute } from './generators/truck-run';

const isWholeMultiple = (value: Fraction, step: Fraction): boolean => {
  const quotient = (value.num * step.den) / (value.den * step.num);
  return Number.isFinite(quotient) && Number.isInteger(quotient) && quotient > 0;
};

const uniqueCount = (values: readonly (string | number)[]): number => new Set(values).size;

const inGrid = (grid: { rows: number; cols: number }, p: GridPos): boolean =>
  p.row >= 0 && p.row < grid.rows && p.col >= 0 && p.col < grid.cols;

/** Problems with this challenge. Empty array = good to play. */
export function validateChallenge(challenge: Challenge): string[] {
  const problems: string[] = [];
  const bad = (message: string) => problems.push(`${challenge.kind}: ${message}`);

  switch (challenge.kind) {
    case 'hose-hero': {
      const capacity = challenge.grid.rows * challenge.grid.cols;
      if (challenge.totalFlames < 1) bad('needs at least one flame');
      if (challenge.totalFlames > capacity) bad('more flames than windows');
      if (challenge.flameSlots.length !== challenge.totalFlames) bad('flameSlots length must equal totalFlames');
      if (uniqueCount(challenge.flameSlots) !== challenge.flameSlots.length) bad('duplicate flame slots');
      if (challenge.flameSlots.some((s) => s < 0 || s >= capacity)) bad('flame slot outside the window grid');
      if (challenge.alreadyOut < 0 || challenge.alreadyOut >= challenge.totalFlames) bad('alreadyOut must leave at least one flame');
      const remaining = challenge.totalFlames - challenge.alreadyOut;
      if (challenge.askRemainingAt !== undefined && (challenge.askRemainingAt < 1 || challenge.askRemainingAt >= remaining)) {
        bad('askRemainingAt must fall inside the remaining flames');
      }
      if (challenge.fractionTargets) {
        let sum: Fraction = { num: 0, den: 1 };
        for (const f of challenge.fractionTargets) {
          if (!Number.isInteger((f.num * challenge.totalFlames) / f.den)) bad('fraction target does not land on whole flames');
          sum = add(sum, f);
        }
        if (toNumber(sum) > 1) bad('fraction targets add up to more than the whole building');
      }
      break;
    }

    case 'water-tank': {
      if (toNumber(challenge.target) <= 0) bad('target must be more than empty');
      if (toNumber(challenge.target) > 1) bad('target is above a full tank');
      if (toNumber(challenge.pumpStep) <= 0) bad('pumpStep must add water');
      if (!isWholeMultiple(challenge.target, challenge.pumpStep)) bad('target is not a whole number of pumps');
      if (!equals(challenge.pumpStep, { num: 1, den: challenge.ticks })) bad('pumpStep should match the gauge ticks');
      break;
    }

    case 'ladder-builder':
    case 'build-barrier': {
      if (challenge.target < 1) bad('target must be positive');
      if (challenge.pieces.some((p) => p < 1)) bad('every piece must be a positive whole number');
      if (challenge.solutions.length === 0) bad('no solution exists');
      for (const solution of challenge.solutions) {
        if (sumOf(solution) !== challenge.target) bad(`solution ${solution.join('+')} does not sum to ${challenge.target}`);
        if (!isSubMultiset(solution, challenge.pieces)) bad('solution uses pieces the child was not given');
      }
      if (challenge.solutionIndices) {
        if (challenge.solutionIndices.length !== challenge.solutions.length) bad('solutionIndices must line up with solutions');
        challenge.solutionIndices.forEach((indices, i) => {
          if (uniqueCount(indices) !== indices.length) bad('solutionIndices reuses a piece');
          const values = indices.map((idx) => challenge.pieces[idx] ?? Number.NaN);
          if (values.some((v) => Number.isNaN(v))) bad('solutionIndices points outside pieces');
          else if (sumOf(values) !== challenge.target) bad('solutionIndices does not sum to the target');
          const expected = challenge.solutions[i];
          if (expected && [...values].sort().join() !== [...expected].sort().join()) bad('solutionIndices disagrees with solutions');
        });
      }
      if (challenge.kind === 'ladder-builder' && challenge.solutions.length < challenge.requiredSolutions) {
        bad('fewer solutions than requiredSolutions');
      }
      break;
    }

    case 'number-ladder': {
      if (challenge.min >= challenge.max) bad('ladder has no height');
      if (challenge.start === challenge.target) bad('start and target are the same rung');
      if (challenge.jumps.length === 0 || challenge.jumps.some((j) => j < 1)) bad('jumps must be positive');
      if (challenge.start < challenge.min || challenge.start > challenge.max) bad('start is off the ladder');
      if (challenge.target < challenge.min || challenge.target > challenge.max) bad('target is off the ladder');
      if (!solveNumberLadder(challenge)) bad('target cannot be reached with these jumps');
      break;
    }

    case 'dispatch-decoder': {
      if (challenge.message.trim().length === 0) bad('empty radio message');
      if (!challenge.messageEs || challenge.messageEs.trim().length === 0) bad('missing Spanish message');
      if (challenge.options.length < 3) bad('needs at least three options');
      if (uniqueCount(challenge.options) !== challenge.options.length) bad('duplicate options');
      if (challenge.options.filter((o) => o === challenge.correct).length !== 1) bad('exactly one option must be correct');
      if (challenge.mode === 'location' && !challenge.scene) bad('location mode needs a scene');
      break;
    }

    case 'equipment-check': {
      if (challenge.items.length === 0) bad('nothing to pack');
      if (uniqueCount(challenge.items.map((i) => i.id)) !== challenge.items.length) bad('duplicate item rows');
      for (const item of challenge.items) {
        if (item.need < 1) bad('every row needs at least one item');
        if (item.alreadyPacked < 0 || item.alreadyPacked >= item.need) bad('alreadyPacked must leave something to do');
      }
      if (uniqueCount(challenge.decoys) !== challenge.decoys.length) bad('duplicate decoys');
      const needed = new Set(challenge.items.map((i) => i.id));
      if (challenge.decoys.some((d) => needed.has(d))) bad('a decoy is also on the list');
      break;
    }

    case 'gear-sort': {
      if (challenge.bins.length < 2) bad('needs at least two bins');
      if (uniqueCount(challenge.bins.map((b) => b.id)) !== challenge.bins.length) bad('duplicate bin ids');
      if (challenge.items.length < challenge.bins.length) bad('fewer items than bins');
      if (uniqueCount(challenge.items.map((i) => i.id)) !== challenge.items.length) bad('duplicate item ids');
      const binIds = new Set(challenge.bins.map((b) => b.id));
      for (const item of challenge.items) if (!binIds.has(item.bin)) bad(`item ${item.id} has no bin`);
      for (const bin of challenge.bins) {
        if (!challenge.items.some((i) => i.bin === bin.id)) bad(`bin ${bin.id} would sit empty`);
      }
      if (challenge.by === 'color' && challenge.items.some((i) => !i.color)) bad('colour sort needs colours on the items');
      if (challenge.by === 'size' && challenge.items.some((i) => !i.size)) bad('size sort needs sizes on the items');
      break;
    }

    case 'hose-path': {
      if (samePos(challenge.start, challenge.end)) bad('hydrant and fire are the same cell');
      if (!inGrid(challenge.grid, challenge.start) || !inGrid(challenge.grid, challenge.end)) bad('start or end is off the board');
      const walls = new Set(challenge.blocked.map(posKey));
      if (walls.has(posKey(challenge.start)) || walls.has(posKey(challenge.end))) bad('start or end sits on a blocked cell');
      const solution = solveHosePath(challenge);
      if (!solution) bad('the given pieces cannot connect the hydrant to the fire');
      else {
        const used = pathPieces(solution);
        const have = { straight: challenge.pieces.filter((p) => p === 'straight').length, corner: challenge.pieces.filter((p) => p === 'corner').length };
        if (used.straight > have.straight || used.corner > have.corner) bad('solution needs more pieces than were given');
      }
      break;
    }

    case 'rescue-route': {
      if (samePos(challenge.start, challenge.goal)) bad('the truck is already there');
      if (!inGrid(challenge.grid, challenge.start) || !inGrid(challenge.grid, challenge.goal)) bad('start or goal is off the map');
      const walls = new Set(challenge.blocked.map(posKey));
      if (walls.has(posKey(challenge.start)) || walls.has(posKey(challenge.goal))) bad('start or goal is blocked');
      if (uniqueCount(challenge.blocked.map(posKey)) !== challenge.blocked.length) bad('duplicate blocked cells');
      if (challenge.blocked.some((c) => !inGrid(challenge.grid, c))) bad('blocked cell is off the map');
      const solution = solveRoute(challenge);
      if (!solution) bad('there is no way through');
      else if (solution.length > challenge.maxCommands) bad(`needs ${solution.length} commands but only ${challenge.maxCommands} are allowed`);
      if (challenge.compareRoutes) {
        const { a, b, shorter } = challenge.compareRoutes;
        if (a === b) bad('the two routes are the same length');
        if ((shorter === 'a' && a > b) || (shorter === 'b' && b > a)) bad('compareRoutes marks the longer route as shorter');
      }
      if (challenge.streetNames) {
        for (const street of challenge.streetNames) {
          if (street.row < 0 || street.row >= challenge.grid.rows) bad('street name on a row that does not exist');
          if (street.name.trim().length === 0) bad('empty street name');
        }
      }
      break;
    }

    case 'hydrant-match': {
      if (challenge.label.trim().length === 0) bad('empty hydrant tag');
      if (challenge.options.length < 3) bad('needs at least three hydrants');
      if (uniqueCount(challenge.options) !== challenge.options.length) bad('duplicate hydrant numbers');
      if (challenge.options.filter((o) => o === challenge.correct).length !== 1) bad('exactly one hydrant must match');
      if (challenge.options.some((o) => o < 0)) bad('hydrant numbers must be positive');
      const sum = /^(\d+)\s*([+−×÷])\s*(\d+)$/.exec(challenge.label);
      if (sum) {
        const left = Number(sum[1]);
        const right = Number(sum[3]);
        const expected =
          sum[2] === '+' ? left + right : sum[2] === '−' ? left - right : sum[2] === '×' ? left * right : left / right;
        if (expected !== challenge.correct) bad(`tag "${challenge.label}" does not equal ${challenge.correct}`);
      }
      break;
    }

    case 'spray-pattern': {
      if (challenge.sequence.length < 4) bad('pattern is too short to read');
      if (challenge.sequence[challenge.sequence.length - 1] !== challenge.answer) bad('answer must be the hidden last cell');
      if (challenge.options.filter((o) => o === challenge.answer).length !== 1) bad('exactly one option must be correct');
      if (uniqueCount(challenge.options) !== challenge.options.length) bad('duplicate options');
      if (challenge.options.length < 3) bad('needs at least three options');
      const period = [2, 3, 4].find(
        (p) => challenge.sequence.length % p === 0 && challenge.sequence.every((s, i) => s === challenge.sequence[i % p]),
      );
      if (!period) bad('no single repeating rule explains the pattern');
      else if (challenge.sequence.length - 1 < period * 1.5) bad('not enough of the pattern is visible to be sure');
      break;
    }

    case 'clock-watch': {
      const startTotal = challenge.start.h * 60 + challenge.start.m;
      const targetTotal = challenge.target.h * 60 + challenge.target.m;
      const delta = targetTotal - startTotal;
      if (challenge.start.h < 1 || challenge.start.h > 12) bad('start hour is off the dial');
      if (challenge.target.h < 1 || challenge.target.h > 12) bad('target hour is off the dial');
      if (challenge.start.m < 0 || challenge.start.m > 59 || challenge.target.m < 0 || challenge.target.m > 59) bad('minutes off the dial');
      if (delta <= 0) bad('target must be later than the start');
      if (delta > 180) bad('more than three hours away');
      if (delta % challenge.step !== 0) bad('target is not a whole number of steps away');
      if (challenge.event.trim().length === 0) bad('missing event');
      break;
    }

    case 'rescue-pets': {
      if (challenge.total < 1) bad('nobody to rescue');
      if (challenge.alreadySafe < 0 || challenge.alreadySafe >= challenge.total) bad('alreadySafe must leave someone to help');
      break;
    }

    case 'signals': {
      if (challenge.steps.length < 3) bad('needs at least three steps');
      if (uniqueCount(challenge.steps) !== challenge.steps.length) bad('a step appears twice, so the order is ambiguous');
      if (challenge.shuffled.length !== challenge.steps.length) bad('shuffled must hold every step');
      if ([...challenge.shuffled].sort().join() !== [...challenge.steps].sort().join()) bad('shuffled is not the same set of steps');
      if (challenge.shuffled.join() === challenge.steps.join()) bad('shuffled is already in order');
      break;
    }

    case 'vocab-tap': {
      if (challenge.options.length < 3) bad('needs at least three pictures');
      if (uniqueCount(challenge.options.map((o) => o.id)) !== challenge.options.length) bad('duplicate options');
      if (challenge.options.filter((o) => o.id === challenge.word.id).length !== 1) bad('the word must appear exactly once');
      if (challenge.word.en.trim().length === 0 || challenge.word.es.trim().length === 0) bad('word is missing a translation');
      break;
    }

    case 'listen-count': {
      if (challenge.count < 1) bad('count must be at least one');
      if (challenge.count > challenge.maxOnScreen) bad('more to count than fits on screen');
      if (challenge.phraseEs.trim().length === 0) bad('missing Spanish phrase');
      if (challenge.phraseEn.trim().length === 0) bad('missing English phrase');
      if (challenge.item.es.trim().length === 0) bad('item is missing its Spanish word');
      break;
    }

    case 'market-money': {
      if (challenge.price < 1) bad('the price must be at least one coin');
      if (challenge.coins.length === 0) bad('the purse is empty');
      if (challenge.coins.some((c) => c < 1 || !Number.isInteger(c))) bad('every coin must be a positive whole number');
      if (challenge.denominations.length === 0) bad('no coin values on the sign');
      const values = new Set(challenge.denominations);
      if (challenge.coins.some((c) => !values.has(c))) bad('a purse coin is not one of the denominations');
      if (sumOf(challenge.coins) < challenge.price) bad('the purse holds less than the price');
      if (challenge.solutions.length === 0) bad('no way to pay this price');
      for (const solution of challenge.solutions) {
        if (sumOf(solution) !== challenge.price) bad(`${solution.join('+')} does not add up to ${challenge.price}`);
        if (!isSubMultiset(solution, challenge.coins)) bad('a way to pay uses coins the child does not have');
      }
      if (challenge.item.en.trim().length === 0 || challenge.item.es.trim().length === 0) bad('the item is missing a name');
      if (challenge.askChange) {
        const { paid, change } = challenge.askChange;
        if (paid <= challenge.price) bad('the customer paid less than the price');
        if (change !== paid - challenge.price) bad('the change is not paid − price');
        if (change < 1) bad('there would be no change to work out');
      }
      break;
    }

    case 'shape-builder': {
      const pieces = challenge.pieces;
      if (pieces.length < 3) bad('a blueprint needs at least three pieces');
      if (pieces.length > 7) bad('too many pieces for small hands');
      if (uniqueCount(pieces.map((p) => p.id)) !== pieces.length) bad('duplicate piece ids');
      for (const piece of pieces) {
        if (piece.w <= 0 || piece.h <= 0) bad(`piece ${piece.id} has no size`);
        if (piece.x < 0 || piece.y < 0 || piece.x + piece.w > 100 || piece.y + piece.h > 100) {
          bad(`piece ${piece.id} falls outside the blueprint`);
        }
        if (![0, 90, 180, 270].includes(piece.rotation)) bad(`piece ${piece.id} has an odd rotation`);
        if (!rotatableShapes.includes(piece.shape) && piece.rotation !== 0) {
          bad(`piece ${piece.id} is a ${piece.shape}, which cannot be turned`);
        }
        if (piece.color.trim().length === 0) bad(`piece ${piece.id} has no colour`);
      }
      for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
          const a = pieces[i];
          const b = pieces[j];
          if (!a || !b) continue;
          const overlaps = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
          if (overlaps) bad(`pieces ${a.id} and ${b.id} sit on top of each other`);
        }
      }
      if (challenge.needsRotation && !pieces.some((p) => rotatableShapes.includes(p.shape))) {
        bad('rotation is asked for but nothing in the blueprint can be turned');
      }
      if (challenge.askCount) {
        const actual = pieces.filter((p) => p.shape === challenge.askCount?.shape).length;
        if (actual !== challenge.askCount.count) bad('askCount does not match the pieces');
        if (challenge.askCount.count < 1) bad('askCount asks about a shape that is not there');
      }
      break;
    }

    case 'word-builder': {
      const { letters, tiles, prefilled, word, lang } = challenge;
      if (letters.length < 2) bad('the word is too short to build');
      if (letters.some((l) => l.length !== 1)) bad('every slot holds exactly one letter');
      if (letters.join('').toLowerCase() !== word[lang].toLowerCase()) bad('the letters do not spell the word');
      if (prefilled < 0 || prefilled >= letters.length) bad('prefilled must leave letters to place');
      if (tiles.some((t) => t.length !== 1)) bad('every tile holds exactly one letter');
      const bag = new Map<string, number>();
      for (const tile of tiles) bag.set(tile, (bag.get(tile) ?? 0) + 1);
      for (const letter of letters.slice(prefilled)) {
        const left = bag.get(letter) ?? 0;
        if (left === 0) bad(`there is no “${letter}” tile in the tray`);
        else bag.set(letter, left - 1);
      }
      if (word.en.trim().length === 0 || word.es.trim().length === 0) bad('the word is missing a translation');
      break;
    }

    case 'truck-run': {
      const { questions, segments, speed, laneChange, rowGap, finish } = challenge;
      if (questions.length === 0) bad('a run needs at least one question');
      if (segments.length === 0) bad('a run needs at least one stretch of road');
      if (speed <= 0) bad('the truck must move');
      if (laneChange <= 0) bad('a lane change must take some time');
      if (finish <= 0) bad('there is no victory straight after the last gate');
      /* the promise that makes the road drivable: one lane change always fits
         between two rows, even at full boost (see docs/DRIVING_GAME.md) */
      if (rowGap < speed * laneChange * 2) bad('hazard rows are closer together than a lane change');

      for (const q of questions) {
        if (q.prompt.trim().length === 0) bad('a gate set has no question');
        if (q.hint.trim().length === 0) bad('a gate set has no hint, so a child could be stuck');
        if (q.options.length !== truckRunLanes) bad('every lane needs exactly one gate label');
        if (uniqueCount(q.options) !== q.options.length) bad('two gates carry the same label');
        if (q.options.filter((o) => o === q.answer).length !== 1) bad('exactly one gate must be the answer');
        if (q.options.some((o) => o.trim().length === 0)) bad('a gate label is empty');
        if (q.options.some((o) => o.length > GATE_LABEL_MAX)) bad('a gate label is too long to read at speed');
      }

      for (const segment of segments) {
        if (segment.gateAt <= 0 || segment.gateAt >= segment.length) bad('the gates are not on the road');
        for (const o of segment.obstacles) {
          if (o.lane < 0 || o.lane >= truckRunLanes) bad('an obstacle is off the road');
          if (o.at < 0 || o.at > segment.gateAt) bad('an obstacle stands on or past the gates');
        }
        const rows = hazardRows(segment);
        for (let i = 1; i < rows.length; i += 1) {
          const gap = (rows[i]?.at ?? 0) - (rows[i - 1]?.at ?? 0);
          if (gap < rowGap - 0.5) bad('two hazard rows are closer than the row gap');
        }
        const last = rows[rows.length - 1];
        if (last && segment.gateAt - last.at < rowGap) bad('there is no clear approach to the gates');
        if (!laneEscapeRoute(segment)) bad('this stretch of road cannot be driven cleanly');
      }
      break;
    }

    case 'pizza-fractions': {
      let sum: Fraction = { num: 0, den: 1 };
      for (const topping of challenge.toppings) {
        if (topping.fraction.num <= 0 || topping.fraction.den <= 0) bad('topping fraction must be positive');
        if (!Number.isInteger((topping.fraction.num * challenge.cutInto) / topping.fraction.den)) bad('a topping does not land on whole slices');
        sum = add(sum, topping.fraction);
      }
      if (!equals(sum, { num: 1, den: 1 })) bad('toppings do not cover exactly one whole pizza');
      if (uniqueCount(challenge.toppings.map((t) => t.topping)) !== challenge.toppings.length) bad('the same topping twice');
      if (challenge.shareAmong < 1) bad('needs someone to share with');
      if (challenge.cutInto % challenge.shareAmong !== 0) bad('slices do not divide evenly between friends');
      if (challenge.each !== challenge.cutInto / challenge.shareAmong) bad('each is not slices ÷ friends');
      break;
    }

    case 'measure-pour': {
      if (toNumber(challenge.target) <= 0) bad('target must be more than nothing');
      if (!equals(challenge.step, { num: 1, den: challenge.ticks })) bad('step should match the jug ticks');
      if (!isWholeMultiple(challenge.target, challenge.step)) bad('target is not a whole number of pours');
      if (challenge.ingredient.en.trim().length === 0) bad('missing ingredient');
      break;
    }

    case 'count-ingredients': {
      if (challenge.needs.length === 0) bad('nothing to fetch');
      if (challenge.needs.some((n) => n.count < 1)) bad('every need must be at least one');
      if (uniqueCount(challenge.needs.map((n) => n.item.id)) !== challenge.needs.length) bad('the same ingredient twice');
      if (uniqueCount(challenge.extras.map((e) => e.id)) !== challenge.extras.length) bad('duplicate extras');
      const needed = new Set(challenge.needs.map((n) => n.item.id));
      if (challenge.extras.some((e) => needed.has(e.id))) bad('an extra is also on the list');
      break;
    }

    case 'divide-share': {
      if (challenge.among < 2) bad('sharing needs at least two people');
      if (challenge.each < 1) bad('everyone must get at least one');
      if (challenge.total !== challenge.among * challenge.each) bad('total is not among × each');
      break;
    }

    case 'soup-pot': {
      if (challenge.steps.length < 2) bad('a pot needs at least two things in it');
      if (challenge.steps.some((s) => s.count < 1)) bad('every step must put something in');
      if (uniqueCount(challenge.steps.map((s) => s.item.id)) !== challenge.steps.length) {
        bad('the same ingredient twice, so the order is ambiguous');
      }
      if (challenge.steps.some((s) => s.item.en.trim().length === 0 || s.item.es.trim().length === 0)) {
        bad('an ingredient is missing a translation');
      }
      if (uniqueCount(challenge.extras.map((e) => e.id)) !== challenge.extras.length) bad('duplicate extras');
      const inPot = new Set(challenge.steps.map((s) => s.item.id));
      if (challenge.extras.some((e) => inPot.has(e.id))) bad('an extra is also in the soup');
      if (challenge.askTotal !== undefined) {
        const total = challenge.steps.reduce((sum, s) => sum + s.count, 0);
        if (challenge.askTotal !== total) bad('askTotal is not how many pieces go in the pot');
      }
      break;
    }

    case 'recipe-scale': {
      if (challenge.serves < 1 || challenge.eating < 1) bad('serves and eating must be positive');
      if (challenge.lines.length === 0) bad('no ingredients to scale');
      for (const line of challenge.lines) {
        if (line.amount < 1) bad('amount must be positive');
        if (!Number.isInteger(line.scaled) || line.scaled < 1) bad('scaled amount must be a whole number');
        if (line.scaled * challenge.serves !== line.amount * challenge.eating) bad(`${line.item.en} does not scale correctly`);
      }
      break;
    }
  }

  return problems;
}

export const isPlayable = (challenge: Challenge): boolean => validateChallenge(challenge).length === 0;
