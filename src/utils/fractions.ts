import type { Fraction } from '@/learning/types';

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export const fr = (num: number, den: number): Fraction => ({ num, den });

export function simplify(f: Fraction): Fraction {
  const g = gcd(f.num, f.den) || 1;
  return { num: f.num / g, den: f.den / g };
}

export const toNumber = (f: Fraction) => f.num / f.den;

export function equals(a: Fraction, b: Fraction): boolean {
  return a.num * b.den === b.num * a.den;
}

export function add(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}

export function subtract(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}

export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const d = a.num * b.den - b.num * a.den;
  return d < 0 ? -1 : d > 0 ? 1 : 0;
}

const unicode: Record<string, string> = { '1/2': '½', '1/4': '¼', '3/4': '¾', '1/3': '⅓', '2/3': '⅔', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };

/** "½", "¾", "1", "1 ½" — kid-friendly display. */
export function formatFraction(f: Fraction): string {
  const s = simplify(f);
  if (s.den === 1) return String(s.num);
  const whole = Math.floor(s.num / s.den);
  const rem = s.num - whole * s.den;
  const key = `${rem}/${s.den}`;
  const part = unicode[key] ?? `${rem}/${s.den}`;
  return whole > 0 ? `${whole} ${part}` : part;
}

/** Spoken form for TTS. */
export function speakFraction(f: Fraction, lang: 'en' | 'es' = 'en'): string {
  const s = simplify(f);
  const names: Record<string, { en: string; es: string }> = {
    '1/2': { en: 'one half', es: 'un medio' },
    '1/4': { en: 'one quarter', es: 'un cuarto' },
    '3/4': { en: 'three quarters', es: 'tres cuartos' },
    '1/3': { en: 'one third', es: 'un tercio' },
    '2/3': { en: 'two thirds', es: 'dos tercios' },
    '1/8': { en: 'one eighth', es: 'un octavo' },
  };
  const key = `${s.num}/${s.den}`;
  if (s.den === 1) return String(s.num);
  return names[key]?.[lang] ?? `${s.num} over ${s.den}`;
}
