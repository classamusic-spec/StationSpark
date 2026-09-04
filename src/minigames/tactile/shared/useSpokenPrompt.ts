import { useEffect, useRef } from 'react';
import type { CharacterId } from '@/content/types';
import { speech } from '@/services/speech';

/**
 * Speaks the prompt once, and again whenever the prompt actually changes
 * (a new fraction beat, a new question). Never repeats on a re-render.
 */
export function useSpokenPrompt(
  text: string | null | undefined,
  opts: { speaker?: CharacterId; lang?: 'en' | 'es'; delayMs?: number } = {},
): void {
  const said = useRef<string | null>(null);
  const { speaker = 'beacon', lang = 'en', delayMs = 320 } = opts;

  useEffect(() => {
    if (!text || said.current === text) return;
    said.current = text;
    const t = setTimeout(() => speech.say(text, { speaker, lang }), delayMs);
    return () => clearTimeout(t);
  }, [delayMs, lang, speaker, text]);

  useEffect(() => () => speech.stop(), []);
}

/** Speak a number/word that IS the learning payload (counts, sums, fractions). */
export function sayPayload(text: string, lang: 'en' | 'es' = 'en'): void {
  speech.say(text, { speaker: 'beacon', lang });
}
