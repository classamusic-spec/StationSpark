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

/**
 * THE UTTERANCE EPOCH — why the Captain used to talk over the next screen.
 *
 * `say()` reports a finished line through `onDone`, and it wires the same
 * callback to `onStopped`, because a line that is cut off must still release
 * whatever was waiting on it or a chain stalls forever. But callers use that
 * callback to schedule the SECOND half of a pair on a timer — the Spanish word
 * after the English one, 250 ms later — and a timer knows nothing about having
 * been cancelled.
 *
 * So: tap "Hear it again", tap Back within 250 ms. Unmount calls `stop()`,
 * `onStopped` fires, and a quarter of a second later Captain Bea reads the
 * Spanish half of the PREVIOUS screen's task over the new one. Four other call
 * sites had the same shape, the widest with a 1.6 s window.
 *
 * An epoch fixes all of them at once and any written later. `stop()` bumps it;
 * anything continuing after an await or a timer asks `isCurrent()` first and
 * quietly gives up if the world has moved on.
 */
let epoch = 0;

export const speech = {
  setEnabled(v: boolean) {
    enabled = v;
    if (!v) speech.stop();
  },
  isEnabled: () => enabled,
  /**
   * Capture this before an await or a `setTimeout`, and check `isCurrent()`
   * with it afterwards. Anything that has outlived a `stop()` must not speak.
   */
  epoch: () => epoch,
  isCurrent: (at: number) => at === epoch,
  stop: () => {
    epoch += 1;
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
    /* `stop()` below bumps the epoch; this line owns the one after it */
    const mine = epoch + 1;
    const speak = () => {
      // a newer line started while we were awaiting the stop — that one wins
      if (!speech.isCurrent(mine)) return;
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
    speech.stop();
    try {
      void Promise.resolve().then(speak, speak);
    } catch {
      speak();
    }
  },
  /**
   * Run something after a delay, but only if speech has not been stopped in the
   * meantime. This is what a chained continuation should use instead of a bare
   * `setTimeout` — see the epoch note above.
   */
  later(fn: () => void, ms: number) {
    const mine = epoch;
    setTimeout(() => {
      if (speech.isCurrent(mine)) fn();
    }, ms);
  },
  /** Say a vocabulary word: English then Spanish (or the reverse). */
  sayWord(word: { en: string; es: string }, first: 'en' | 'es' = 'en') {
    const second = first === 'en' ? 'es' : 'en';
    /* Captain Bea reads both languages — she is the station's Spanish voice. */
    speech.say(word[first], {
      speaker: 'bea',
      lang: first,
      onDone: () => speech.later(() => speech.say(word[second], { speaker: 'bea', lang: second }), 250),
    });
  },
};
