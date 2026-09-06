/**
 * Character voice. Uses on-device TTS (expo-speech) so English and Spanish
 * words are heard, offline, for free. Each character has a pitch/rate signature.
 */
import * as Speech from 'expo-speech';
import type { CharacterId } from '@/content/types';

let enabled = true;

const voices: Record<CharacterId, { pitch: number; rate: number }> = {
  bea: { pitch: 1.0, rate: 0.95 },
  rookie: { pitch: 1.25, rate: 1.0 },
  npc: { pitch: 1.05, rate: 0.95 },
};

const langCode = { en: 'en-US', es: 'es-MX' } as const;

export const speech = {
  setEnabled(v: boolean) {
    enabled = v;
    if (!v) Speech.stop();
  },
  isEnabled: () => enabled,
  stop: () => {
    try {
      Speech.stop();
    } catch {
      /* ignore */
    }
  },
  /**
   * Speak a line as a character. Interrupts whatever was speaking.
   *
   * `Speech.stop()` is awaited before speaking: on Android the two are racing
   * calls into the same engine, and starting the new utterance in the same tick
   * as the stop intermittently cancels the new one instead of the old. When
   * that swallowed line is the Spanish half of a vocabulary word — chained off
   * an `onDone` that then never fires — the pair silently stops teaching.
   */
  say(text: string, opts: { speaker?: CharacterId; lang?: 'en' | 'es'; onDone?: () => void } = {}) {
    if (!enabled || !text) {
      opts.onDone?.();
      return;
    }
    const v = voices[opts.speaker ?? 'bea'];
    const speak = () => {
      try {
        Speech.speak(text, {
          language: langCode[opts.lang ?? 'en'],
          pitch: v.pitch,
          rate: v.rate,
          onDone: opts.onDone,
          onStopped: opts.onDone,
          onError: opts.onDone,
        });
      } catch {
        opts.onDone?.();
      }
    };
    try {
      void Promise.resolve(Speech.stop()).then(speak, speak);
    } catch {
      speak();
    }
  },
  /** Say a vocabulary word: English then Spanish (or the reverse). */
  sayWord(word: { en: string; es: string }, first: 'en' | 'es' = 'en') {
    const second = first === 'en' ? 'es' : 'en';
    /* Captain Bea reads both languages — she is the station's Spanish voice. */
    speech.say(word[first], {
      speaker: 'bea',
      lang: first,
      onDone: () => setTimeout(() => speech.say(word[second], { speaker: 'bea', lang: second }), 250),
    });
  },
};
