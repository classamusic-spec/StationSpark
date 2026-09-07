import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateBuildBarrier,
  generateEquipmentCheck,
  generateNumberLadder,
  generateRescueRoute,
  generateShapeBuilder,
  generateSignals,
  hydrantMatchFor,
  truckRunFor,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const PAZ = 'Ingeniera Paz';

/**
 * THE NEW PLAYGROUND — the building site beside the school.
 *
 * Ingeniera Paz has poured the concrete for the new play tower and cannot open
 * the gates until there is a safety ring around it. Nothing here is on fire and
 * nobody is hurt: the crew rings off the wet slab, raises the tower and reads
 * the plan, and the site opens on time.
 *
 * This is the town's shape mission — `build-barrier` for the ring and
 * `shape-builder` for the tower, one after the other.
 */
export const playgroundBuild: MissionDef = {
  id: 'playground-build',
  title: 'The New Playground',
  titleEs: 'El parque de juegos nuevo',
  tagline: 'Wet concrete, an open gate, and a whole class waiting.',
  brief:
    'The new play tower is poured but the site is wide open. Ring off the wet concrete, raise the tower from the plan, and let the class in.',
  location: 'construction',
  scene: 'station-yard',
  address: 'The Building Site, Willow Way',
  npcName: PAZ,
  subjects: ['math', 'logic', 'reading', 'teamwork'],
  minutes: 13,
  badge: 'shape-shaper',
  xp: 46,
  sparks: 16,
  requires: ['school-fair'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('The building site needs a safety ring today.', 'calm'),
        radio('Ingeniera Paz is asking for the barrier crew!'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', ctx),
      intro: [radio('Read her message. What has to happen first?')],
      outro: [bea('Ring first, gates after. That is the order.')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => generateEquipmentCheck(ctx),
      intro: [bea('Every cone we own. Count them onto the truck.')],
      outro: [radio('Cones aboard. Nothing left in the bay.')],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => generateRescueRoute(inScene(ctx, 'school')),
      intro: [radio('Diggers block the short way. Plan another!')],
      outro: [bea('Round the back and in. Nicely done.')],
    },
    {
      type: 'minigame',
      game: 'truck-run',
      bands: ['B', 'C'],
      challenge: (ctx) => truckRunFor(['add-sub', 'times-divide'], inScene(ctx, 'school')),
      intro: [radio('Route is set. Drive it — mind the gravel!')],
      outro: [bea('Every gate open and the load still tied down.', 'proud')],
    },
    { type: 'travel', from: 'station', to: 'construction' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'construction',
      lines: [
        npc(PAZ, '¡Hola! I am the engineer. Hard hats, please.', '¡Hola! Soy la ingeniera. Cascos, por favor.', 'calm'),
        radio('Ingeniera means engineer. Paz designed all this.', 'Ingeniera.'),
        bea('Helmets on. Then the ring, then the tower.'),
      ],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [npc(PAZ, 'On a site we always work in the same order.', 'En una obra siempre trabajamos en orden.', 'calm')],
      outro: [radio('Order right. That is how sites stay safe.')],
    },
    {
      type: 'minigame',
      game: 'build-barrier',
      challenge: (ctx) => generateBuildBarrier(ctx),
      intro: [bea('Fit the lengths together. The ring must close.')],
      outro: [npc(PAZ, '¡Cerrado! Nobody can step in the wet concrete now.', '¡Cerrado! Ya nadie pisa el concreto fresco.', 'happy')],
    },
    {
      type: 'minigame',
      game: 'shape-builder',
      challenge: (ctx) => generateShapeBuilder(ctx),
      intro: [npc(PAZ, 'Here is my plan. Build it exactly, please.', 'Aquí está mi plano. Constrúyanlo igualito, por favor.', 'excited')],
      outro: [bea('Every corner where the plan says. Beautiful.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      bands: ['A'],
      challenge: (ctx) => hydrantMatchFor({ label: 'six', correct: 6 }, ctx),
      intro: [bea('The plan says six. Which post says six?')],
      outro: [radio('Post six. The slide bolts on there.')],
    },
    {
      type: 'minigame',
      game: 'number-ladder',
      bands: ['B', 'C'],
      challenge: (ctx) => generateNumberLadder(ctx),
      intro: [radio('Count the rungs up the tower. Land on the flag.')],
      outro: [bea('Exactly on the rung. The flag is yours.')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'construction',
      lines: [radio('Ring closed, tower up, gates open. Let them in!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(PAZ, '¡Gracias! The class can play on Monday because of you.', '¡Gracias! La clase podrá jugar el lunes gracias a ustedes.', 'excited'),
        radio('Gracias means thank you.', 'Gracias.'),
        bea('Send us the first photo, Paz.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
