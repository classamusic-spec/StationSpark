import { useEffect } from 'react';
import { speech } from '@/services/speech';

/**
 * Speak the task aloud once when the game (or a phase) opens.
 *
 * It deliberately does NOT raise a `say` event any more. That mirrored the
 * task into a speech bubble that sat under the task bar repeating it word for
 * word — the single most common piece of clutter in the app. The TaskBar owns
 * the words; this owns the voice. Games still call `session.say` directly for
 * a genuine reaction, which is now the only thing a bubble ever means.
 */
export function useCaptainLine(
  text: string | null,
  /** kept so call sites need not change; the line is spoken, never mirrored */
  _say: (speaker: 'bea', text: string, es?: string) => void,
  opts: { es?: string; lang?: 'en' | 'es'; delayMs?: number; key?: string | number } = {},
) {
  const { es, lang = 'en', delayMs = 350, key } = opts;
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => speech.say(text, { speaker: 'bea', lang }), delayMs);
    return () => clearTimeout(t);
  }, [text, es, lang, delayMs, key]);
}

/** Speak an arbitrary line as Captain Bea (used by replay buttons). */
export function sayAsCaptain(text: string, lang: 'en' | 'es' = 'en') {
  speech.say(text, { speaker: 'bea', lang });
}
