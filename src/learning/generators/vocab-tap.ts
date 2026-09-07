import type { ChallengeGenerator, ChallengeOf, GeneratorContext, VocabWord } from '../types';
import { randomWords, vocabulary, wordsByCategory } from '../vocabulary';

/**
 * A tile shows a picture AND the word under it. Two tiles that print the same
 * word in the prompt language are the same answer twice — "orange" the fruit
 * and "orange" the colour, "radio" and "radio". A child who taps the wrong one
 * of those was not wrong, so those pairs may never share a board.
 *
 * Two tiles that share a *picture* are legal (the words differ) but muddy, so
 * distinct icons are preferred and only fallen back on when the pool runs thin.
 */
const sameText = (a: VocabWord, b: VocabWord, lang: 'en' | 'es'): boolean =>
  a[lang].toLowerCase() === b[lang].toLowerCase();

/** Options that are all genuinely distinguishable from `word` and each other. */
function pickOptions(
  pool: readonly VocabWord[],
  word: VocabWord,
  count: number,
  promptLang: 'en' | 'es',
): VocabWord[] {
  const other: 'en' | 'es' = promptLang === 'en' ? 'es' : 'en';
  const chosen: VocabWord[] = [word];
  const icons = new Set<string>([word.icon]);

  const readable = (candidate: VocabWord): boolean =>
    chosen.every((c) => !sameText(c, candidate, promptLang) && !sameText(c, candidate, other));

  /* first pass: a different word AND a different picture */
  for (const candidate of pool) {
    if (chosen.length >= count) break;
    if (candidate.id === word.id || icons.has(candidate.icon) || !readable(candidate)) continue;
    chosen.push(candidate);
    icons.add(candidate.icon);
  }
  /* second pass: a shared picture is allowed rather than a short board */
  for (const candidate of pool) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => c.id === candidate.id) || !readable(candidate)) continue;
    chosen.push(candidate);
  }
  return chosen;
}

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
  const sameCategory = ageBand !== 'A' && wordsByCategory(word.category).length > optionCount + 3;
  const pool = sameCategory
    ? rng.shuffle(wordsByCategory(word.category).filter((w) => w.id !== word.id))
    : randomWords(rng, optionCount + 8, undefined, [word.id]);

  const options = pickOptions(
    [...pool, ...rng.shuffle(vocabulary)],
    word,
    optionCount,
    promptLang,
  );
  return { kind: 'vocab-tap', promptLang, word, options: rng.shuffle(options), support };
};

/**
 * The same board, on a word the *story* chose — a mission that has just met
 * Abuela Carmen wants the word tap that follows it to be about the market.
 * Falls back to the ordinary random pick when the id is not in the bank.
 */
export function vocabTapFor(
  wordId: string,
  ctx: GeneratorContext,
  promptLang?: 'en' | 'es',
): ChallengeOf<'vocab-tap'> {
  const word = vocabulary.find((w) => w.id === wordId);
  const base = generateVocabTap(ctx);
  if (!word) return base;
  const lang = promptLang ?? base.promptLang;
  const optionCount = base.options.length;
  const pool = ctx.rng.shuffle(vocabulary.filter((w) => w.id !== word.id));
  return {
    ...base,
    promptLang: lang,
    word,
    options: ctx.rng.shuffle(pickOptions(pool, word, optionCount, lang)),
  };
}
