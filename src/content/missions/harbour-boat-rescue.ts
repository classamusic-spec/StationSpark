import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateHosePath,
  generateRescuePets,
  generateRescueRoute,
  generateSignals,
  listenCountFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { bea, inScene, npc, radio, rookie } from './parts';

const MARISOL = 'Marisol';

/** The lanes of the harbour, read off the wall of the boathouse. */
const harbourLanes = ['Harbour Road', 'Anchor Lane', 'The Slipway', 'Net Row', 'Pier Walk', 'Boathouse Way'];

/**
 * THE LITTLE BOAT — the call where the address is not a building.
 *
 * `beach-day` is a tide, a clean-up and a turtle on the sand. This one goes out
 * on the water: a small boat has lost its engine off the pier with one very
 * worried dog aboard, and the whole rescue is a chain of directions — get the
 * engine to the right slipway, throw a line that reaches, bring the boat in.
 *
 * It is the town's DIRECTIONS mission. Everywhere else a child reads a street
 * name to find a door; here they read one to find water, and the ordering game
 * is a real rescue sequence where doing step three first would put a rope in
 * the sea.
 */
export const harbourBoatRescue: MissionDef = {
  id: 'harbour-boat-rescue',
  title: 'The Little Boat',
  titleEs: 'El barquito',
  tagline: 'One boat, no engine, and a dog who does not like water.',
  brief:
    'A small boat has lost its engine off the pier and drifted past the harbour wall. Find the right slipway, throw a line that reaches, and bring the boat — and its very worried dog — safely in.',
  location: 'beach',
  scene: 'park',
  address: 'The Slipway, Harbour Road',
  npcName: MARISOL,
  subjects: ['logic', 'reading', 'spanish', 'teamwork'],
  minutes: 13,
  badge: 'map-master',
  xp: 46,
  sparks: 15,
  requires: ['community-cleanup'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Marisol is calling. A boat is drifting past the wall.'),
        rookie('Are they in the water?', 'worried'),
        bea('No. Everyone is aboard and sitting still. Good.', 'calm'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', ctx),
      intro: [radio('Read her message. Which slipway do we want?')],
      outro: [bea('The one past the boathouse. Not the pier.')],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('Water rescue order. Rope before anybody moves.')],
      outro: [rookie('Rope, then hands, then the boat. Got it.', 'proud')],
    },
    { type: 'travel', from: 'station', to: 'beach' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'beach',
      lines: [
        npc(MARISOL, '¡Por aquí! The current pushed them past the wall.', '¡Por aquí! La corriente los empujó más allá del muro.', 'worried'),
        bea('Then we meet them where the water goes, not where it was.'),
        radio('Corriente means current. It always wins.', 'Corriente.'),
      ],
    },
    {
      /*
       * The slipway is a road problem: the engine has to reach the water at the
       * right place, and the harbour lanes are the words that say which.
       */
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => {
        const route = generateRescueRoute(inScene(ctx, 'park'));
        return {
          ...route,
          streetNames: Array.from({ length: route.grid.rows }, (_, row) => ({
            row,
            name: harbourLanes[row % harbourLanes.length] ?? 'Harbour Road',
          })),
        };
      },
      intro: [radio('Drive to the slipway. Read the lane names!')],
      outro: [bea('Right lane, right water. Back the truck up.')],
    },
    {
      type: 'minigame',
      game: 'hose-path',
      challenge: (ctx) => generateHosePath(inScene(ctx, 'park')),
      intro: [bea('Lay the line out so it reaches. No loops.')],
      outro: [npc(MARISOL, '¡Alcanzó! It reached first time.', '¡Alcanzó! Llegó a la primera.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'rescue-pets',
      challenge: (ctx) => ({ ...generateRescuePets(inScene(ctx, 'park')), animal: 'puppy' as const }),
      intro: [npc(MARISOL, 'The dog first. Low hands, quiet voice.', 'El perro primero. Manos bajas, voz suave.', 'calm')],
      outro: [bea('Ashore, shaking, and very pleased with himself.', 'happy')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('harbour', ctx),
      intro: [npc(MARISOL, 'Tap the one I say. Harbour words!', 'Toca el que digo. ¡Palabras del puerto!', 'happy')],
      outro: [radio('Boat, net, anchor. All in your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('boat', ctx),
      intro: [npc(MARISOL, 'Cuenta conmigo. How many barcos are still out?', 'Cuenta conmigo. ¿Cuántos barcos siguen afuera?', 'happy')],
      outro: [bea('Counted in Spanish, over the wind.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'beach',
      lines: [
        radio('Boat tied up, everybody dry, dog fed.'),
        bea('The rope reached because you laid it right.', 'proud'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(MARISOL, '¡Gracias! You read my harbour better than I do.', '¡Gracias! Leen mi puerto mejor que yo.', 'proud'),
        bea('Gracias means thank you. She taught us the lanes.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
