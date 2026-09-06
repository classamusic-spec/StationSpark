import { useGame } from '@/state/store';

export type SpanishSupport = 'full' | 'some' | 'min';

/**
 * How much Spanish to show alongside English *outside* a Spanish lesson.
 *
 * Printing every string twice is the single biggest source of clutter on these
 * screens, so chrome asks this before it doubles up. It is a display choice
 * only: the Spanish is always still spoken, and a Spanish lesson always shows
 * its own words in full regardless of this setting.
 */
export function useSpanishSupport(): SpanishSupport {
  return useGame((s) => s.settings.spanishSupport);
}

/**
 * True when a screen should print a Spanish line *underneath* its English one.
 *
 * This is now always false, and deliberately so. A translation printed under
 * every heading, task, bin label and shopping-list row doubled the amount of
 * text on screens whose readers are five, and none of that second line is what
 * teaches them Spanish — the games whose *subject* is Spanish do that, and they
 * print their words in full regardless of this. Captain Bea also still speaks
 * both languages aloud everywhere.
 *
 * Kept as a gate rather than deleted so the choice is in one place and can be
 * given back to the Grown-Ups screen as a real setting later.
 */
export function useShowTranslation(): boolean {
  return false;
}
