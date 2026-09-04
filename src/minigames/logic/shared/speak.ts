import { useEffect, useRef } from 'react';
import { speech } from '@/services/speech';

/**
 * Speak Beacon's line once when the game (or a phase) opens, and mirror it to
 * the host through the session's `say` event so the character can react.
 */
export function useBeaconLine(
  text: string | null,
  say: (speaker: 'beacon', text: string, es?: string) => void,
  opts: { es?: string; lang?: 'en' | 'es'; delayMs?: number; key?: string | number } = {},
) {
  const sayRef = useRef(say);
  sayRef.current = say;
  const { es, lang = 'en', delayMs = 350, key } = opts;
  useEffect(() => {
    if (!text) return;
    sayRef.current('beacon', text, es);
    const t = setTimeout(() => speech.say(text, { speaker: 'beacon', lang }), delayMs);
    return () => clearTimeout(t);
  }, [text, es, lang, delayMs, key]);
}

/** Speak an arbitrary line as Beacon (used by replay buttons). */
export function sayAsBeacon(text: string, lang: 'en' | 'es' = 'en') {
  speech.say(text, { speaker: 'beacon', lang });
}
