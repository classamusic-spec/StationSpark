import type { ChallengeGenerator, VocabWord } from '../types';
import { randomWords, vocabulary, wordsByCategory } from '../vocabulary';

/**
 * VOCAB TAP — hear a word, tap the picture.
 * A gets full support (both languages on screen) and mixed-category choices,
 * C gets minimal support and same-category choices, which is much harder.
 */
export const generateVocabTap: ChallengeGenerator<'vocab-tap'> = (ctx) => {
  const { rng, ageBand } = ctx;

  const word: VocabWord = rng.pick(vocabulary);
  const support = ageBand === 'A' ? 'full' : ageBand === 'B' ? 'some' : 'min';
  const optionCount = ageBand === 'A' ? 3 : 4;
  const promptLang: 'en' | 'es' = rng.chance(ageBand === 'A' ? 0.6 : 0.5) ? 'es' : 'en';

  // Older kids choose between words from the same category — closer, trickier.
  const sameCategory = ageBand !== 'A' && wordsByCategory(word.category).length > optionCount;
  const pool = sameCategory
    ? rng.shuffle(wordsByCategory(word.category).filter((w) => w.id !== word.id))
    : randomWords(rng, optionCount + 3, undefined, [word.id]);

  const options = rng.shuffle([word, ...pool.slice(0, optionCount - 1)]);
  return { kind: 'vocab-tap', promptLang, word, options, support };
};
