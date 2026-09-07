import type { ChallengeGenerator, ChallengeOf, GeneratorContext } from '../types';
import { masteryAdjustment } from '../adaptive';
import { countPhraseEn, countPhraseEs, randomCountable, wordById } from '../vocabulary';
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
  { es: (p) => `Pon ${p.es} en la caja.`, en: (p) => `Put ${p.en} in the box.` },
  { es: (p) => `Faltan ${p.es}.`, en: (p) => `We are still missing ${p.en}.` },
  { es: (p) => `Cuenta ${p.es} conmigo.`, en: (p) => `Count ${p.en} with me.` },
  { es: (p) => `La abuela pidió ${p.es}.`, en: (p) => `Grandma asked for ${p.en}.` },
  { es: (p) => `Guarda ${p.es} en la canasta.`, en: (p) => `Pack ${p.en} into the basket.` },
  { es: (p) => `¿Ves ${p.es}?`, en: (p) => `Can you see ${p.en}?` },
  { es: (p) => `Hoy llevamos ${p.es}.`, en: (p) => `Today we are taking ${p.en}.` },
];

/**
 * LISTEN & COUNT — Captain Bea says a number in Spanish, the child puts out that many.
 * The Spanish agrees properly: "una manguera", "tres mangueras", "un casco".
 */
export const generateListenCount: ChallengeGenerator<'listen-count'> = (ctx) => build(ctx, randomCountable(ctx.rng));

/**
 * The same question about something the *story* chose — the carrots in Don
 * Nico's basket, the shells on the pier.
 *
 * It has to be a generator, not a spread over the result: `phraseEs`,
 * `phraseEn` and `item` are one sentence between them, so swapping the item on
 * a finished challenge would leave Captain Bea asking for hoses while the crate
 * fills with carrots.
 */
export function listenCountFor(itemId: string, ctx: GeneratorContext): ChallengeOf<'listen-count'> {
  return build(ctx, wordById(itemId));
}

function build(ctx: GeneratorContext, item: ReturnType<typeof wordById>): ChallengeOf<'listen-count'> {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'listening-es', 'counting');

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
}
