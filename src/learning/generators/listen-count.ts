import type { ChallengeGenerator } from '../types';
import { masteryAdjustment } from '../adaptive';
import { countPhraseEn, countPhraseEs, randomCountable } from '../vocabulary';
import { clampInt } from './shared';

interface Phrase {
  n: number;
  es: string;
  en: string;
}

const templates: { es: (p: Phrase) => string; en: (p: Phrase) => string }[] = [
  { es: (p) => `Necesitamos ${p.es}.`, en: (p) => `We need ${p.en}.` },
  { es: (p) => `¿Me das ${p.es}, por favor?`, en: (p) => `Can I have ${p.en}, please?` },
  { es: (p) => `Hay ${p.es} en el camión.`, en: (p) => `${p.n === 1 ? 'There is' : 'There are'} ${p.en} in the truck.` },
  { es: (p) => `¡Trae ${p.es}, por favor!`, en: (p) => `Bring ${p.en}, please!` },
  { es: (p) => `El equipo tiene ${p.es}.`, en: (p) => `The crew has ${p.en}.` },
];

/**
 * LISTEN & COUNT — Beacon says a number in Spanish, the child puts out that many.
 * The Spanish agrees properly: "una manguera", "tres mangueras", "un casco".
 */
export const generateListenCount: ChallengeGenerator<'listen-count'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'listening-es', 'counting');

  const item = randomCountable(rng);
  const count =
    ageBand === 'A'
      ? clampInt(rng.int(1, 5) + adj, 1, 6)
      : ageBand === 'B'
        ? clampInt(rng.int(2, 8) + adj, 1, 9)
        : clampInt(rng.int(3, 12) + adj, 2, 12);
  const maxOnScreen = ageBand === 'A' ? Math.max(6, count + 1) : ageBand === 'B' ? Math.max(10, count + 2) : Math.max(14, count + 2);

  const phrase: Phrase = { n: count, es: countPhraseEs(count, item), en: countPhraseEn(count, item) };
  const template = rng.pick(templates);

  return {
    kind: 'listen-count',
    phraseEs: template.es(phrase),
    phraseEn: template.en(phrase),
    count,
    item,
    maxOnScreen,
    // Same scaffolding ladder as vocab-tap: the English fades as the child grows.
    support: ageBand === 'A' ? 'full' : ageBand === 'B' ? 'some' : 'min',
  };
};
