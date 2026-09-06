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

/** True when supporting chrome (a task line, a card blurb) should print Spanish too. */
export function useShowTranslation(): boolean {
  return useSpanishSupport() === 'full';
}
