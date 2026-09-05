/**
 * GENERATOR BARREL — one pure generator per challenge kind.
 *
 * Every generator is `(ctx: GeneratorContext) => ChallengeOf<K>`, uses only
 * `ctx.rng` (never Math.random) so tests are reproducible, and varies by
 * `ctx.ageBand`:
 *   A (5–6)  numbers to 20, counting, halves, short patterns, single words
 *   B (7–8)  + and − to 100, quarters, time to 5/15 min, short sentences, maps
 *   C (9–10) × and ÷, equivalent fractions, scaling, longer reading, bilingual
 */
import type { Challenge, ChallengeGenerator, ChallengeKind, ChallengeOf, GeneratorContext } from '../types';

import { generateBuildBarrier } from './build-barrier';
import { generateClockWatch } from './clock-watch';
import { generateCountIngredients } from './count-ingredients';
import { generateDispatchDecoder } from './dispatch-decoder';
import { generateDivideShare } from './divide-share';
import { generateEquipmentCheck } from './equipment-check';
import { generateGearSort } from './gear-sort';
import { generateHosePath } from './hose-path';
import { generateHoseHero } from './hose-hero';
import { generateHydrantMatch } from './hydrant-match';
import { generateLadderBuilder } from './ladder-builder';
import { generateListenCount } from './listen-count';
import { generateMarketMoney } from './market-money';
import { generateMeasurePour } from './measure-pour';
import { generateNumberLadder } from './number-ladder';
import { generatePizzaFractions } from './pizza-fractions';
import { generateRecipeScale } from './recipe-scale';
import { generateRescuePets } from './rescue-pets';
import { generateRescueRoute } from './rescue-route';
import { generateShapeBuilder } from './shape-builder';
import { generateSignals } from './signals';
import { generateSprayPattern } from './spray-pattern';
import { generateVocabTap } from './vocab-tap';
import { generateWaterTank } from './water-tank';
import { generateWordBuilder } from './word-builder';

export * from './build-barrier';
export * from './clock-watch';
export * from './count-ingredients';
export * from './dispatch-decoder';
export * from './divide-share';
export * from './equipment-check';
export * from './gear-sort';
export * from './hose-hero';
export * from './hose-path';
export * from './hydrant-match';
export * from './ladder-builder';
export * from './listen-count';
export * from './market-money';
export * from './measure-pour';
export * from './number-ladder';
export * from './pizza-fractions';
export * from './recipe-scale';
export * from './rescue-pets';
export * from './rescue-route';
export * from './shape-builder';
export * from './signals';
export * from './spray-pattern';
export * from './vocab-tap';
export * from './water-tank';
export * from './word-builder';

export const generators: { [K in ChallengeKind]: ChallengeGenerator<K> } = {
  'hose-hero': generateHoseHero,
  'water-tank': generateWaterTank,
  'ladder-builder': generateLadderBuilder,
  'number-ladder': generateNumberLadder,
  'dispatch-decoder': generateDispatchDecoder,
  'equipment-check': generateEquipmentCheck,
  'gear-sort': generateGearSort,
  'hose-path': generateHosePath,
  'rescue-route': generateRescueRoute,
  'hydrant-match': generateHydrantMatch,
  'spray-pattern': generateSprayPattern,
  'clock-watch': generateClockWatch,
  'rescue-pets': generateRescuePets,
  'build-barrier': generateBuildBarrier,
  signals: generateSignals,
  'vocab-tap': generateVocabTap,
  'listen-count': generateListenCount,
  'market-money': generateMarketMoney,
  'shape-builder': generateShapeBuilder,
  'word-builder': generateWordBuilder,
  'pizza-fractions': generatePizzaFractions,
  'measure-pour': generateMeasurePour,
  'count-ingredients': generateCountIngredients,
  'divide-share': generateDivideShare,
  'recipe-scale': generateRecipeScale,
};

export const challengeKinds = Object.keys(generators) as ChallengeKind[];

/** Make one challenge of the given kind. */
export function generateChallenge<K extends ChallengeKind>(kind: K, ctx: GeneratorContext): ChallengeOf<K> {
  const generator = generators[kind] as ChallengeGenerator<K>;
  return generator(ctx);
}

/** Untyped-kind convenience for mission beats that carry a `ChallengeKind`. */
export function generateAny(kind: ChallengeKind, ctx: GeneratorContext): Challenge {
  return generateChallenge(kind, ctx);
}
