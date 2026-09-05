import type { ChallengeGenerator, VocabWord } from '../types';
import { vocabulary } from '../vocabulary';
import { byBand } from './shared';

const LETTERS: Record<'en' | 'es', string[]> = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  // no K / W / X: they barely appear in the Spanish bank, so they read as "trick" letters
  es: 'ABCDEFGHIJLMNOPQRSTUVYZ'.split(''),
};

/**
 * Only words the icon sheet really *draws*. Actions, numbers, colours and jobs
 * all borrow someone else's picture (yellow → a sun, teacher → a school), and a
 * borrowed picture makes "spell what you see" unfair.
 */
const drawnCategories: readonly VocabWord['category'][] = ['equipment', 'food', 'animals', 'places'];

/** Single plain word, no spaces, hyphens or accents — a fair thing to spell. */
const spellable = (word: VocabWord, lang: 'en' | 'es'): boolean =>
  drawnCategories.includes(word.category) && /^[a-zñ]+$/.test(word[lang]);

const letterCount = (word: VocabWord, lang: 'en' | 'es'): number => word[lang].length;

const upper = (value: string): string[] => value.toUpperCase().split('');

/** Words of the right shape for this band, longest-first ties broken by the rng later. */
function poolFor(lang: 'en' | 'es', min: number, max: number): VocabWord[] {
  return vocabulary.filter((w) => spellable(w, lang) && letterCount(w, lang) >= min && letterCount(w, lang) <= max);
}

/**
 * WORD BUILDER — spell the picture from letter tiles.
 *
 * A gets short English words with the first letter already in place, B gets
 * longer words plus one wrong letter in the tray, and C spells 5–8 letter words
 * in English *or* Spanish with two decoy letters. `tiles` always contains every
 * letter the child still needs, so the word can always be finished.
 */
export const generateWordBuilder: ChallengeGenerator<'word-builder'> = (ctx) => {
  const { rng, ageBand } = ctx;

  const lang: 'en' | 'es' = ageBand === 'C' && rng.chance(0.45) ? 'es' : 'en';
  const span = byBand<[number, number]>(ageBand, { A: [3, 4], B: [4, 6], C: [5, 8] });
  const pool = poolFor(lang, span[0], span[1]);
  const fallback = poolFor(lang, 3, 9);
  const word = rng.pick(pool.length > 0 ? pool : fallback.length > 0 ? fallback : vocabulary);

  const letters = upper(word[lang]);
  const prefilled = ageBand === 'A' && letters.length > 2 ? 1 : 0;
  const missing = letters.slice(prefilled);

  const distractorCount: number = byBand<number>(ageBand, { A: 0, B: 1, C: 2 });
  const used = new Set(letters);
  const spare = LETTERS[lang].filter((l) => !used.has(l));
  const distractors = rng.shuffle(spare).slice(0, distractorCount);

  return {
    kind: 'word-builder',
    word,
    lang,
    letters,
    tiles: rng.shuffle([...missing, ...distractors]),
    prefilled,
  };
};
