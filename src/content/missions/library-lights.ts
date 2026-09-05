import type { MissionDef } from '../types';
import type { EquipmentId } from '@/learning/types';
import {
  dispatchDecoderFor,
  generateEquipmentCheck,
  generateHosePath,
  generateHydrantMatch,
  generateNumberLadder,
  generateSignals,
  generateVocabTap,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, beacon, inScene, npc, pepper } from './parts';

const MAYA = 'Maya';

/**
 * LIBRARY LIGHTS-OUT — reading, sequencing and counting with Maya.
 * A storm knocked the library lights out ten minutes before story time.
 * Nobody is in the dark for long: the crew brings lanterns, reads the notice,
 * puts the steps in order and runs a new line to the reading lamp.
 */
export const libraryLights: MissionDef = {
  id: 'library-lights',
  title: 'Library Lights-Out',
  titleEs: 'Apagón en la biblioteca',
  tagline: 'Story time starts in ten minutes. In the dark?',
  brief:
    'Rain got in and the library lights went out. Maya has twenty children waiting for story time. Pack the lanterns, read the notice and get the reading lamp glowing again.',
  location: 'library',
  scene: 'library',
  address: '4 Library Lane',
  npcName: MAYA,
  subjects: ['reading', 'math', 'logic', 'teamwork'],
  minutes: 11,
  badge: 'library-lights',
  xp: 45,
  sparks: 14,
  requires: ['clock-tower-cat'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Maya called. The library lights went out.', 'excited'),
        beacon('Beep! Story time starts in ten minutes.'),
        pepper(),
      ],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items:
          ctx.ageBand === 'A'
            ? [
                { id: 'flashlight' as EquipmentId, need: 3, alreadyPacked: 0 },
                { id: 'cone' as EquipmentId, need: 2, alreadyPacked: 0 },
              ]
            : [
                { id: 'flashlight' as EquipmentId, need: 5, alreadyPacked: 2 },
                { id: 'cone' as EquipmentId, need: 4, alreadyPacked: 1 },
                { id: 'rope' as EquipmentId, need: 2, alreadyPacked: 0 },
              ],
        decoys: ['axe', 'hose'] as EquipmentId[],
      }),
      intro: [bea('Lanterns and cones. Count them onto the truck.')],
      outro: [beacon('Packed! Nobody reads in the dark tonight.')],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', inScene(ctx, 'library')),
      intro: [beacon('Maya wrote a note. Read it with me.')],
      outro: [bea('Read carefully, answered right. Lovely.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('Steps in order first. Then we roll.')],
      outro: [beacon('Order locked in. Doors open!')],
    },
    { type: 'travel', from: 'station', to: 'library' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'library',
      lines: [
        npc(MAYA, '¡Hola otra vez! The lights went out in the storm.', '¡Hola otra vez! Las luces se apagaron con la tormenta.', 'worried'),
        beacon('La tormenta means the storm!', 'La tormenta.'),
        bea('Lanterns up. Then the lamp line.'),
      ],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      challenge: (ctx) => {
        const base = generateVocabTap(ctx);
        const word = wordById('library');
        const pool = [wordById('school'), wordById('bakery'), wordById('market'), wordById('park')];
        return { ...base, word, options: ctx.rng.shuffle([word, ...pool.slice(0, ctx.ageBand === 'A' ? 2 : 3)]) };
      },
      intro: [npc(MAYA, 'Tap the picture I say. ¿Listos?', 'Toca el dibujo que digo. ¿Listos?', 'happy')],
      outro: [beacon('New words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      bands: ['A'],
      challenge: (ctx) => generateHydrantMatch(ctx),
      intro: [beacon('Every shelf has a number. Find the match!')],
      outro: [npc(MAYA, '¡Muy bien! That is the storybook shelf.', '¡Muy bien! Ese es el estante de cuentos.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'number-ladder',
      bands: ['B', 'C'],
      challenge: (ctx) => generateNumberLadder(ctx),
      intro: [beacon('Climb the shelf ladder. Hop to the fuse box.')],
      outro: [bea('Landed exactly right. Well counted.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'hose-path',
      challenge: (ctx) => generateHosePath(inScene(ctx, 'library')),
      intro: [bea('Run the line to the reading lamp. Corner by corner.')],
      outro: [pepper('Woof woof!')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'library',
      lines: [beacon('Lamp on! Twenty children cheering.'), pepper('Woof!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(MAYA, '¡Gracias! Sit down — the story is about firefighters.', '¡Gracias! Siéntense: el cuento es de bomberos.', 'excited'),
        beacon('Gracias means thank you. Story time!', 'Gracias.'),
        bea('Best seat in Spark City. Sit, crew.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
