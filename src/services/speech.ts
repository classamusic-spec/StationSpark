/**
 * Character voice. Uses on-device TTS (expo-speech) so English and Spanish
 * words are heard, offline, for free. Each character has a pitch/rate signature.
 */
import * as Speech from 'expo-speech';
import type { CharacterId } from '@/content/types';

let enabled = true;

const voices: Record<CharacterId, { pitch: number; rate: number }> = {
  beacon: { pitch: 1.35, rate: 1.05 },
  bea: { pitch: 1.0, rate: 0.95 },
  rookie: { pitch: 1.25, rate: 1.0 },
  pepper: { pitch: 1.5, rate: 1.1 },
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
  /** Speak a line as a character. Interrupts whatever was speaking. */
  say(text: string, opts: { speaker?: CharacterId; lang?: 'en' | 'es'; onDone?: () => void } = {}) {
    if (!enabled || !text) {
      opts.onDone?.();
      return;
    }
    const v = voices[opts.speaker ?? 'beacon'];
    try {
      Speech.stop();
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
  },
  /** Say a vocabulary word: English then Spanish (or the reverse). */
  sayWord(word: { en: string; es: string }, first: 'en' | 'es' = 'en') {
    const second = first === 'en' ? 'es' : 'en';
    speech.say(word[first], {
      speaker: 'beacon',
      lang: first,
      onDone: () => setTimeout(() => speech.say(word[second], { speaker: 'beacon', lang: second }), 250),
    });
  },
};
