import { assign, setup } from 'xstate';
import type { Emotion } from '@/content/types';

/**
 * What a character is *doing*. Mood (happy, worried…) is a separate axis: a
 * character can wave while worried, or think while proud.
 */
export type CharacterAct = 'rest' | 'glance' | 'shift' | 'adjustHat' | 'talk' | 'wave' | 'cheer' | 'point' | 'think';

export type CharacterEvent =
  | { type: 'SPEAK' }
  | { type: 'SILENCE' }
  | { type: 'WAVE' }
  | { type: 'CHEER'; hold?: boolean }
  | { type: 'POINT' }
  | { type: 'THINK' }
  | { type: 'REST' }
  | { type: 'MOOD'; mood: Emotion }
  | { type: 'IDLE_TICK' };

export interface CharacterContext {
  mood: Emotion;
  /** which idle flourish to play next — cycled so a character never repeats */
  flourish: number;
  /** cheer loops until told to stop */
  holdCheer: boolean;
  /** which way the eyes drift on a glance: -1 left, 1 right */
  glanceDir: -1 | 1;
}

/**
 * Idle beats. A character that only breathes reads as a sticker, so every few
 * seconds the machine steps out of `rest` into a small piece of business —
 * a glance, a weight shift, a tug on the hat — and comes straight back.
 */
const IDLE_GAP_MS = 2600;
const GLANCE_MS = 1100;
const SHIFT_MS = 1500;
const HAT_MS = 1000;
const WAVE_MS = 1750;
const CHEER_MS = 1600;

/** The order idle flourishes cycle in. Index is `context.flourish % length`. */
export const idleFlourishes = ['glance', 'shift', 'glance', 'adjustHat'] as const;

export const characterMachine = setup({
  types: {
    context: {} as CharacterContext,
    events: {} as CharacterEvent,
    input: {} as { mood?: Emotion } | undefined,
  },
  actions: {
    setMood: assign({ mood: ({ event }) => (event.type === 'MOOD' ? event.mood : 'happy') }),
    nextFlourish: assign({
      flourish: ({ context }) => context.flourish + 1,
      glanceDir: ({ context }) => (context.flourish % 2 === 0 ? 1 : -1),
    }),
    holdCheer: assign({ holdCheer: ({ event }) => (event.type === 'CHEER' ? event.hold === true : false) }),
  },
  guards: {
    isGlance: ({ context }) => idleFlourishes[context.flourish % idleFlourishes.length] === 'glance',
    isShift: ({ context }) => idleFlourishes[context.flourish % idleFlourishes.length] === 'shift',
    keepCheering: ({ context }) => context.holdCheer,
  },
}).createMachine({
  id: 'character',
  /*
   * Every state is interruptible: a line of dialogue or a celebration must be
   * able to cut into a flourish, because a child's tap is never "later".
   */
  initial: 'idle',
  context: ({ input }) => ({
    mood: input?.mood ?? 'happy',
    flourish: 0,
    holdCheer: false,
    glanceDir: 1,
  }),
  on: {
    MOOD: { actions: 'setMood' },
    SPEAK: { target: '.talk' },
    WAVE: { target: '.wave' },
    CHEER: { target: '.cheer', actions: 'holdCheer' },
    POINT: { target: '.point' },
    THINK: { target: '.think' },
    REST: { target: '.idle' },
  },
  states: {
    idle: {
      initial: 'rest',
      states: {
        rest: {
          after: { [IDLE_GAP_MS]: { target: 'flourish', actions: 'nextFlourish' } },
        },
        /* A router state: picks the next beat, so the cycle stays readable. */
        flourish: {
          always: [
            { guard: 'isGlance', target: 'glance' },
            { guard: 'isShift', target: 'shift' },
            { target: 'adjustHat' },
          ],
        },
        glance: { after: { [GLANCE_MS]: 'rest' } },
        shift: { after: { [SHIFT_MS]: 'rest' } },
        adjustHat: { after: { [HAT_MS]: 'rest' } },
      },
    },
    talk: {
      on: { SILENCE: 'idle' },
    },
    wave: {
      after: { [WAVE_MS]: 'idle' },
    },
    cheer: {
      after: { [CHEER_MS]: [{ guard: 'keepCheering', target: 'cheer', reenter: true }, { target: 'idle' }] },
    },
    point: {
      /* Pointing holds — it is usually attached to "look at this". */
    },
    think: {},
  },
});

/** Flattens the machine's nested state value into the single act the rig plays. */
export function actOf(value: unknown): CharacterAct {
  if (typeof value === 'string') return value === 'idle' ? 'rest' : (value as CharacterAct);
  if (value && typeof value === 'object') {
    const inner = (value as Record<string, unknown>).idle;
    if (typeof inner === 'string') return inner === 'flourish' ? 'rest' : (inner as CharacterAct);
  }
  return 'rest';
}
