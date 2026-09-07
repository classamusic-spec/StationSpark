import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateGearSort,
  generateRescuePets,
  generateSprayPattern,
  generateWaterTank,
  listenCountFor,
  vocabTapFor,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const NICO = 'Don Nico';

/**
 * GARDEN GROW DAY — the community garden on Garden Road.
 *
 * Don Nico's rain barrel ran dry in the hot week, the seed rows have to go in
 * before the sun gets high, and a very pleased bunny has found the lettuce.
 * The garden is where a pattern is a real thing you plant, and it feeds the
 * kitchen at the end: the huerta pizza is made from what the crew picks.
 */
export const gardenGrowDay: MissionDef = {
  id: 'garden-grow-day',
  title: 'Garden Grow Day',
  titleEs: 'Día de siembra en la huerta',
  tagline: 'Dry barrel, empty beds, and one very full bunny.',
  brief:
    'The community garden needs water, seed rows planted in order, and a bunny gently escorted out of the lettuce. Then the crew cooks with what they pick.',
  location: 'garden',
  scene: 'park',
  address: 'The Community Garden, Garden Road',
  npcName: NICO,
  subjects: ['math', 'spanish', 'cooking', 'teamwork'],
  minutes: 13,
  badge: 'pattern-pro',
  xp: 46,
  sparks: 15,
  requires: ['park-picnic'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Hot week. Don Nico’s barrel is empty again.', 'calm'),
        radio('Garden Road needs water and hands. Both, please!'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('location', inScene(ctx, 'park')),
      intro: [radio('Which green place is calling? Listen carefully.')],
      outro: [bea('The garden by the park. Good ears.')],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: (ctx) => generateGearSort(ctx),
      intro: [bea('Sort the shed before we start. Tidy shed, quick job.')],
      outro: [radio('Every tool where a gardener can find it.')],
    },
    { type: 'travel', from: 'station', to: 'garden' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'garden',
      lines: [
        npc(NICO, '¡Bienvenidos! My tomatoes are thirsty, my friends.', '¡Bienvenidos! Mis tomates tienen sed, amigos.', 'worried'),
        radio('Bienvenidos means welcome!', 'Bienvenidos.'),
        bea('Barrel first. Then seeds. Then the lettuce thief.'),
      ],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      challenge: (ctx) => generateWaterTank(ctx),
      intro: [bea('Pump the barrel to the marked line. Steady.')],
      outro: [npc(NICO, '¡Perfecto! That is exactly enough for today.', '¡Perfecto! Es justo lo de hoy.', 'happy')],
    },
    {
      type: 'minigame',
      game: 'spray-pattern',
      challenge: (ctx) => generateSprayPattern(ctx),
      intro: [npc(NICO, 'A row is a pattern. Read it, then plant it.', 'Un surco es un patrón. Léelo y siémbralo.', 'calm')],
      outro: [bea('You read the row like a sentence. Lovely.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapFor('garden', ctx),
      intro: [npc(NICO, 'Tap the picture I say. ¿Listos?', 'Toca el dibujo que digo. ¿Listos?', 'happy')],
      outro: [radio('New words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('carrot', ctx),
      intro: [npc(NICO, 'Cuenta conmigo. How many carrots go in the basket?', 'Cuenta conmigo. ¿Cuántas zanahorias van en la canasta?', 'happy')],
      outro: [bea('You counted in Spanish. Don Nico is delighted.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'rescue-pets',
      challenge: (ctx) => ({ ...generateRescuePets(inScene(ctx, 'park')), animal: 'bunny' as const }),
      intro: [bea('Slow hands. She is only hungry, not naughty.', 'calm')],
      outro: [npc(NICO, 'Take her home, please. And take some lettuce!', 'Llévensela, por favor. ¡Y llévense lechuga!', 'excited')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'garden',
      lines: [radio('Barrel full, rows planted, bunny safe. Beautiful.')],
    },
    {
      type: 'kitchen',
      recipe: 'garden-pizza',
      intro: [bea('We picked it, so we cook it. Aprons on!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(NICO, '¡Gracias, bomberos! Come back when the corn is high.', '¡Gracias, bomberos! Vuelvan cuando el maíz esté alto.', 'excited'),
        radio('Gracias means thank you.', 'Gracias.'),
        bea('We will, Don Nico. Save us a tomato.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
