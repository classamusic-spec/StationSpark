import type { ChallengeOf } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateClockWatch,
  generateDivideShare,
  generateEquipmentCheck,
  generateSignals,
  listenCountFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, npc, radio, rookie } from './parts';

const IBARRA = 'Sra. Ibarra';

/**
 * WINTER STORM WATCH — the call that never leaves the station.
 *
 * Every other mission in Spark City is "get on the truck and go somewhere".
 * This one is the opposite shape: the storm has taken the power out across the
 * neighbourhood, so the station throws its doors open and the town comes to
 * *it*. There is no travel beat and no rescue at an address — the whole call is
 * about looking after a room full of cold neighbours.
 *
 * It is also the first mission in the town to teach DIVISION. `divide-share`
 * lived only in the Kitchen, which meant a child could play every call in Spark
 * City and never once be asked to share something out equally. Twenty-four
 * blankets and six streets is a real division problem with a real reason.
 */
export const snowDayShift: MissionDef = {
  id: 'snow-day-shift',
  title: 'Winter Storm Watch',
  titleEs: 'Guardia de tormenta',
  tagline: 'The lights are out. Open the doors and share what we have.',
  brief:
    'A storm has knocked the power out across the neighbourhood. Station Spark has heat, light and soup — so tonight the station is the shelter. Share the blankets fairly, keep everyone warm, and wait out the wind together.',
  location: 'station',
  scene: 'station-yard',
  address: 'Station Spark, 1 Ember Street',
  npcName: IBARRA,
  subjects: ['math', 'spanish', 'logic', 'teamwork'],
  minutes: 13,
  badge: 'recipe-rescuer',
  xp: 45,
  sparks: 14,
  requires: ['clock-tower-cat'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Big storm tonight. Half the street has no power.', 'worried'),
        rookie('Do we drive out, Captain?', 'think'),
        bea('No. Tonight they come to us. Open the doors.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('location', ctx),
      intro: [radio('Somebody is calling in. Which building is it?')],
      outro: [bea('Good ear. Tell them the station is warm.')],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('Storm routine, in order. You know this one.')],
      outro: [rookie('Bell, radio, lights, then the kettle!', 'excited')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items: [
          { id: 'flashlight' as const, need: ctx.ageBand === 'A' ? 3 : ctx.ageBand === 'B' ? 5 : 7, alreadyPacked: ctx.ageBand === 'A' ? 0 : 2 },
          { id: 'first-aid' as const, need: 2, alreadyPacked: 1 },
          { id: 'radio' as const, need: ctx.ageBand === 'C' ? 4 : 3, alreadyPacked: ctx.ageBand === 'A' ? 0 : 1 },
        ],
        decoys: ['axe' as const, 'cone' as const],
      }),
      intro: [bea('Torches, kits and radios onto the long table.')],
      outro: [bea('Nobody sits in the dark tonight.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'station',
      lines: [
        npc(IBARRA, 'Buenas noches. May we sit with you? It is so cold.', 'Buenas noches. ¿Podemos sentarnos? Hace mucho frío.', 'worried'),
        bea('Come in, all of you. There is room.', 'happy'),
        radio('Frío means cold. Say it back to her.', 'Frío.'),
      ],
    },
    {
      /*
       * The town's first division beat. Six streets came in and there are
       * twenty-four blankets — the answer is not "count them", it is "how many
       * each?", which is a different question and a harder one.
       */
      type: 'minigame',
      game: 'divide-share',
      challenge: (ctx) => {
        const plan = ctx.ageBand === 'A' ? { total: 8, among: 2 } : ctx.ageBand === 'B' ? { total: 12, among: 4 } : { total: 24, among: 6 };
        return { ...generateDivideShare(ctx), item: wordById('blanket'), total: plan.total, among: plan.among, each: plan.total / plan.among };
      },
      intro: [bea('Same number of blankets for every family. Count them out.')],
      outro: [npc(IBARRA, '¡Gracias! Exactly the same for everyone.', '¡Gracias! Igual para todos.', 'happy')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('storm-day', ctx),
      intro: [npc(IBARRA, 'Tap the picture I say. Listen to the wind first.', 'Toca el dibujo que digo. Escucha el viento.', 'calm')],
      outro: [radio('Storm words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('blanket', ctx),
      intro: [npc(IBARRA, 'Cuenta conmigo. How many blankets does row two need?', 'Cuenta conmigo. ¿Cuántas mantas necesita la fila dos?', 'happy')],
      outro: [bea('Counted in Spanish, over a howling wind.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'clock-watch',
      challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the power company says the lights come back' }),
      intro: [bea('They said a time. Set the clock to it.')],
      outro: [rookie('Not long now. I will tell everyone.', 'happy')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'station',
      lines: [
        radio('Lights are back on Maple Street. Cheer, everyone!'),
        bea('Nobody was cold and nobody was alone. Good shift.', 'proud'),
      ],
    },
    {
      type: 'kitchen',
      recipe: 'minestrone',
      intro: [bea('One big pot. Everything in its turn.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(IBARRA, 'Muchas gracias. We will come back when it is sunny!', 'Muchas gracias. ¡Volvemos cuando haya sol!', 'excited'),
        bea('Gracias means thank you. She said it twice.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};

/** Kept for the tests that pin the storm's own numbers. */
export type SnowDayShare = ChallengeOf<'divide-share'>;
