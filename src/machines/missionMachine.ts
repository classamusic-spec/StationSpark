/**
 * MISSION STATE MACHINE (XState v5)
 *
 *  idle ─START→ brief ─NEXT→ beats… ─(last beat)→ complete ─NEXT→ reward ─NEXT→ done
 *
 * Each beat is one entry in MissionDef.beats. Beat types:
 *   dialogue  → 'dialogue' state, NEXT advances lines then beat
 *   minigame  → 'minigame' state, MINIGAME_DONE(result) records result, then outro dialogue
 *   travel    → 'travel' state, NEXT (fired by the travel cinematic) advances
 *   scene     → 'scene' state, NEXT advances
 *   kitchen   → 'kitchen' state, KITCHEN_DONE advances
 *   recap     → 'recap' state, NEXT advances
 *
 * The machine is UI-agnostic; screens/mission/MissionRunner renders it.
 */
import { assign, setup } from 'xstate';
import type { AgeBand } from '@/learning/types';
import type { DialogueLine, MissionBeat, MissionDef } from '@/content/types';
import type { MiniGameResult, Stars } from '@/minigames/types';

export interface MissionContext {
  mission: MissionDef;
  ageBand: AgeBand;
  beatIndex: number;
  /** for dialogue beats & minigame intro/outro */
  lineIndex: number;
  /** 'intro' | 'play' | 'outro' inside a minigame beat */
  phase: 'intro' | 'play' | 'outro';
  results: MiniGameResult[];
  startedAt: number;
  finishedAt: number | null;
}

export type MissionEvent =
  | { type: 'START' }
  | { type: 'NEXT' }
  | { type: 'MINIGAME_DONE'; result: MiniGameResult }
  | { type: 'KITCHEN_DONE'; results: MiniGameResult[] }
  | { type: 'QUIT' };

export function beatsForBand(mission: MissionDef, band: AgeBand): MissionBeat[] {
  return mission.beats.filter((b) => (b.type === 'minigame' && b.bands ? b.bands.includes(band) : true));
}

export function currentBeat(ctx: MissionContext): MissionBeat | undefined {
  return beatsForBand(ctx.mission, ctx.ageBand)[ctx.beatIndex];
}

export function currentLines(ctx: MissionContext): DialogueLine[] {
  const beat = currentBeat(ctx);
  if (!beat) return [];
  if (beat.type === 'dialogue') return beat.lines;
  if (beat.type === 'scene') return beat.lines ?? [];
  if (beat.type === 'minigame') {
    if (ctx.phase === 'intro') return beat.intro ?? [];
    if (ctx.phase === 'outro') return beat.outro ?? [];
  }
  if (beat.type === 'kitchen') return beat.intro ?? [];
  return [];
}

/** Mission stars = rounded average of mini-game stars (min 1). */
export function missionStars(results: MiniGameResult[]): Stars {
  if (results.length === 0) return 3;
  const avg = results.reduce((a, r) => a + r.stars, 0) / results.length;
  return Math.max(1, Math.round(avg)) as Stars;
}

const beatStateFor = (beat: MissionBeat | undefined) => {
  if (!beat) return 'complete';
  switch (beat.type) {
    case 'dialogue':
      return 'dialogue';
    case 'minigame':
      return beat.intro && beat.intro.length > 0 ? 'minigameIntro' : 'minigame';
    case 'travel':
      return 'travel';
    case 'scene':
      return 'scene';
    case 'kitchen':
      return 'kitchen';
    case 'recap':
      return 'recap';
  }
};

export const missionMachine = setup({
  types: {
    context: {} as MissionContext,
    events: {} as MissionEvent,
    input: {} as { mission: MissionDef; ageBand: AgeBand },
  },
  guards: {
    hasMoreLines: ({ context }) => context.lineIndex + 1 < currentLines(context).length,
    hasOutro: ({ context }) => {
      const b = currentBeat(context);
      return b?.type === 'minigame' && !!b.outro && b.outro.length > 0;
    },
    nextIsDialogue: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[context.beatIndex + 1]) === 'dialogue',
    nextIsMinigameIntro: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[context.beatIndex + 1]) === 'minigameIntro',
    nextIsMinigame: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[context.beatIndex + 1]) === 'minigame',
    nextIsTravel: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[context.beatIndex + 1]) === 'travel',
    nextIsScene: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[context.beatIndex + 1]) === 'scene',
    nextIsKitchen: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[context.beatIndex + 1]) === 'kitchen',
    nextIsRecap: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[context.beatIndex + 1]) === 'recap',
    firstIsDialogue: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[0]) === 'dialogue',
    firstIsMinigameIntro: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[0]) === 'minigameIntro',
    firstIsMinigame: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[0]) === 'minigame',
    firstIsTravel: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[0]) === 'travel',
    firstIsScene: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[0]) === 'scene',
    firstIsKitchen: ({ context }) => beatStateFor(beatsForBand(context.mission, context.ageBand)[0]) === 'kitchen',
  },
  actions: {
    nextLine: assign({ lineIndex: ({ context }) => context.lineIndex + 1 }),
    advanceBeat: assign({
      beatIndex: ({ context }) => context.beatIndex + 1,
      lineIndex: 0,
      phase: 'intro' as const,
    }),
    resetLines: assign({ lineIndex: 0 }),
    enterPlay: assign({ phase: 'play' as const, lineIndex: 0 }),
    enterOutro: assign({ phase: 'outro' as const, lineIndex: 0 }),
    recordResult: assign({
      results: ({ context, event }) => (event.type === 'MINIGAME_DONE' ? [...context.results, event.result] : context.results),
    }),
    recordKitchen: assign({
      results: ({ context, event }) => (event.type === 'KITCHEN_DONE' ? [...context.results, ...event.results] : context.results),
    }),
    markFinished: assign({ finishedAt: () => Date.now() }),
  },
}).createMachine({
  id: 'mission',
  context: ({ input }) => ({
    mission: input.mission,
    ageBand: input.ageBand,
    beatIndex: -1,
    lineIndex: 0,
    phase: 'intro',
    results: [],
    startedAt: Date.now(),
    finishedAt: null,
  }),
  initial: 'idle',
  on: { QUIT: '.quit' },
  states: {
    idle: { on: { START: 'brief' } },
    brief: {
      on: {
        NEXT: [
          { guard: 'firstIsDialogue', target: 'dialogue', actions: 'advanceBeat' },
          { guard: 'firstIsMinigameIntro', target: 'minigameIntro', actions: 'advanceBeat' },
          { guard: 'firstIsMinigame', target: 'minigame', actions: ['advanceBeat', 'enterPlay'] },
          { guard: 'firstIsTravel', target: 'travel', actions: 'advanceBeat' },
          { guard: 'firstIsScene', target: 'scene', actions: 'advanceBeat' },
          { guard: 'firstIsKitchen', target: 'kitchen', actions: 'advanceBeat' },
          { target: 'complete', actions: 'advanceBeat' },
        ],
      },
    },
    dialogue: {
      on: {
        NEXT: [{ guard: 'hasMoreLines', actions: 'nextLine' }, { target: 'routing' }],
      },
    },
    minigameIntro: {
      on: {
        NEXT: [{ guard: 'hasMoreLines', actions: 'nextLine' }, { target: 'minigame', actions: 'enterPlay' }],
      },
    },
    minigame: {
      on: {
        MINIGAME_DONE: [
          { guard: 'hasOutro', target: 'minigameOutro', actions: ['recordResult', 'enterOutro'] },
          { target: 'routing', actions: 'recordResult' },
        ],
      },
    },
    minigameOutro: {
      on: {
        NEXT: [{ guard: 'hasMoreLines', actions: 'nextLine' }, { target: 'routing' }],
      },
    },
    travel: { on: { NEXT: 'routing' } },
    scene: {
      on: {
        NEXT: [{ guard: 'hasMoreLines', actions: 'nextLine' }, { target: 'routing' }],
      },
    },
    kitchen: { on: { KITCHEN_DONE: { target: 'routing', actions: 'recordKitchen' } } },
    recap: { on: { NEXT: 'routing' } },
    /** transient router: picks the state for the next beat */
    routing: {
      always: [
        { guard: 'nextIsDialogue', target: 'dialogue', actions: 'advanceBeat' },
        { guard: 'nextIsMinigameIntro', target: 'minigameIntro', actions: 'advanceBeat' },
        { guard: 'nextIsMinigame', target: 'minigame', actions: ['advanceBeat', 'enterPlay'] },
        { guard: 'nextIsTravel', target: 'travel', actions: 'advanceBeat' },
        { guard: 'nextIsScene', target: 'scene', actions: 'advanceBeat' },
        { guard: 'nextIsKitchen', target: 'kitchen', actions: 'advanceBeat' },
        { guard: 'nextIsRecap', target: 'recap', actions: 'advanceBeat' },
        { target: 'complete', actions: ['advanceBeat', 'markFinished'] },
      ],
    },
    complete: { on: { NEXT: 'reward' } },
    reward: { on: { NEXT: 'done' } },
    done: { type: 'final' },
    quit: { type: 'final' },
  },
});

export type MissionMachine = typeof missionMachine;
