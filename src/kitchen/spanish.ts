/**
 * Little Spanish helpers for the kitchen — the room where food vocabulary lives.
 * Pure, no React, testable.
 */
import type { VocabWord } from '@/learning/types';

const units = [
  'cero',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
];

const tens: Record<number, string> = { 20: 'veinte', 30: 'treinta', 40: 'cuarenta', 50: 'cincuenta', 60: 'sesenta' };

/** 21–29 are written as one word: veintiuno, veintidós… */
const twenties: Record<number, string> = {
  21: 'veintiuno',
  22: 'veintidós',
  23: 'veintitrés',
  24: 'veinticuatro',
  25: 'veinticinco',
  26: 'veintiséis',
  27: 'veintisiete',
  28: 'veintiocho',
  29: 'veintinueve',
};

/** Spanish name of a small counting number ("tres"). Falls back to the digits. */
export function esNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  const i = Math.round(n);
  if (i <= 20) return units[i] ?? String(i);
  const twenty = twenties[i];
  if (twenty) return twenty;
  const ten = Math.floor(i / 10) * 10;
  const rest = i - ten;
  const tenWord = tens[ten];
  if (!tenWord) return String(i);
  return rest === 0 ? tenWord : `${tenWord} y ${units[rest] ?? rest}`;
}

/**
 * "un plátano" / "una fresa" — before a noun, `uno` becomes un/una.
 * Nouns ending in -a are feminine, which covers every countable food word in
 * the kitchen's bank (fresa, manzana, aceituna vs. plátano, huevo, pan…).
 */
export function esArticleOne(word: string): string {
  return word.trim().toLowerCase().endsWith('a') ? 'una' : 'un';
}

const vowels = 'aeiouáéíóú';

/** Kid-simple Spanish pluraliser: fresa → fresas, champiñón → champiñones. */
export function pluralEs(word: string): string {
  if (!word) return word;
  const lower = word.toLowerCase();
  const accented: Record<string, string> = { án: 'anes', én: 'enes', ín: 'ines', ón: 'ones', ún: 'unes' };
  const tail = lower.slice(-2);
  const swap = accented[tail];
  if (swap) return word.slice(0, -2) + swap;
  const last = lower.slice(-1);
  if (last === 'z') return `${word.slice(0, -1)}ces`;
  if (vowels.includes(last)) return `${word}s`;
  return `${word}es`;
}

/** English plural, kept just as simple. */
export function pluralEn(word: string, n: number): string {
  if (n === 1) return word;
  if (/(s|x|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/** "tres fresas" — what Captain Bea reads off the recipe card. */
export function countPhraseEs(n: number, word: VocabWord): string {
  if (n === 1) return `${esArticleOne(word.es)} ${word.es}`;
  return `${esNumber(n)} ${pluralEs(word.es)}`;
}

/** "3 strawberries" */
export function countPhraseEn(n: number, word: VocabWord): string {
  return `${n} ${pluralEn(word.en, n)}`;
}

/** The whole shopping list, spoken: "tres fresas, dos plátanos". */
export function needsPhraseEs(needs: readonly { item: VocabWord; count: number }[]): string {
  return needs.map((n) => countPhraseEs(n.count, n.item)).join(', ');
}

export function needsPhraseEn(needs: readonly { item: VocabWord; count: number }[]): string {
  return needs.map((n) => countPhraseEn(n.count, n.item)).join(', ');
}
