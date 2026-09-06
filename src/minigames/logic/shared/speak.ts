import { useEffect, useRef } from 'react';
import { speech } from '@/services/speech';

/**
 * Speak Captain Bea's line once when the game (or a phase) opens, and mirror it to
 * the host through the session's `say` event so the character can react.
 */
export function useCaptainLine(
  text: string | null,
  say: (speaker: 'bea', text: string, es?: string) => void,
  opts: { es?: string; lang?: 'en' | 'es'; delayMs?: number; key?: string | number } = {},
) {
  const sayRef = useRef(say);
  sayRef.current = say;
  const { es, lang = 'en', delayMs = 350, key } = opts;
  useEffect(() => {
    if (!text) return;
    sayRef.current('bea', text, es);
    const t = setTimeout(() => speech.say(text, { speaker: 'bea', lang }), delayMs);
    return () => clearTimeout(t);
  }, [text, es, lang, delayMs, key]);
}

/** Speak an arbitrary line as Captain Bea (used by replay buttons). */
export function sayAsCaptain(text: string, lang: 'en' | 'es' = 'en') {
  speech.say(text, { speaker: 'bea', lang });
}
