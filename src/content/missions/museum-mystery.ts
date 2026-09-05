import type { MissionDef } from '../types';
import type { ChallengeOf } from '@/learning/types';
import {
  dispatchDecoderFor,
  generateBuildBarrier,
  generateClockWatch,
  generateHosePath,
  generateHydrantMatch,
  generateShapeBuilder,
  generateSignals,
  generateSprayPattern,
} from '@/learning/generators';
import { bea, beacon, inScene, npc, pepper } from './parts';

const PATEL = 'Dr. Patel';

type Spray = ChallengeOf<'spray-pattern'>;

/** The mosaic on the museum floor: a repeating tile rule, longer for older crews. */
const mosaic: Record<'A' | 'B' | 'C', { sequence: Spray['sequence']; answer: Spray['answer']; options: Spray['options'] }> = {
  A: {
    sequence: ['star', 'cone', 'star', 'cone', 'star', 'cone'],
    answer: 'cone',
    options: ['cone', 'star', 'fire'],
  },
  B: {
    sequence: ['star', 'cone', 'water', 'star', 'cone', 'water', 'star', 'cone', 'water'],
    answer: 'water',
    options: ['water', 'star', 'cone', 'fire'],
  },
  C: {
    sequence: ['star', 'star', 'cone', 'cone', 'star', 'star', 'cone', 'cone', 'star', 'star', 'cone', 'cone'],
    answer: 'cone',
    options: ['cone', 'star', 'water', 'fire'],
  },
};

/**
 * MUSEUM MYSTERY — patterns, shapes and reading with Dr. Patel.
 * The new "Shapes of Spark City" room opens today, but the roof dripped on the
 * mosaic overnight and half the model city is in pieces. No alarms, no danger:
 * just a puzzle wearing a lab coat.
 */
export const museumMystery: MissionDef = {
  id: 'museum-mystery',
  title: 'Museum Mystery',
  titleEs: 'El misterio del museo',
  tagline: 'The mosaic is missing its last tile.',
  brief:
    'Dr. Patel opens the "Shapes of Spark City" room today. A roof drip has soaked the mosaic, the model city is in pieces and nobody can read the old notice. Bring shapes, patterns and one careful reader.',
  location: 'museum',
  scene: 'library',
  address: '7 Museum Row',
  npcName: PATEL,
  subjects: ['logic', 'math', 'reading', 'teamwork'],
  minutes: 13,
  badge: 'museum-detective',
  xp: 50,
  sparks: 16,
  requires: ['library-lights'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Museum call. A drip and a puzzle.', 'happy'),
        beacon('Beep! Dr. Patel sent a very old notice.'),
        pepper(),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', inScene(ctx, 'library')),
      intro: [beacon('Read it slowly. What is she asking for?')],
      outro: [bea('Good reading. Now we know the job.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'clock-watch',
      challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the new museum room opens' }),
      intro: [bea('Set the clock. When do the doors open?')],
      outro: [beacon('Time locked in. Plenty of minutes!')],
    },
    { type: 'travel', from: 'station', to: 'museum' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'museum',
      lines: [
        npc(PATEL, '¡Bienvenidos! My mosaic lost its last tile.', '¡Bienvenidos! A mi mosaico le falta la última pieza.', 'worried'),
        beacon('Bienvenidos means welcome!', 'Bienvenidos.'),
        bea('Patterns first. Then the drip.'),
      ],
    },
    {
      type: 'minigame',
      game: 'spray-pattern',
      challenge: (ctx) => ({ ...generateSprayPattern(ctx), ...mosaic[ctx.ageBand] }),
      intro: [npc(PATEL, 'Look at the tiles. What belongs at the end?', 'Miren las piezas. ¿Qué va al final?', 'think')],
      outro: [beacon('Tile placed. The mosaic is whole again!')],
    },
    {
      type: 'minigame',
      game: 'shape-builder',
      challenge: (ctx) => generateShapeBuilder(ctx),
      intro: [bea('Rebuild the model. Every shape has a home.')],
      outro: [npc(PATEL, '¡Increíble! You rebuilt it from shapes.', '¡Increíble! Lo reconstruyeron con figuras.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'build-barrier',
      challenge: (ctx) => generateBuildBarrier(ctx),
      intro: [bea('Foam blocks around the drip. Fill it exactly.')],
      outro: [beacon('Gap closed. The dinosaurs stay dry.')],
    },
    {
      type: 'minigame',
      game: 'hose-path',
      challenge: (ctx) => generateHosePath(inScene(ctx, 'library')),
      intro: [beacon('Now the line to the drain. Corner by corner.')],
      outro: [pepper('Woof woof!')],
    },
    {
      type: 'minigame',
      game: 'signals',
      bands: ['A'],
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('Opening steps. Put them in order.')],
      outro: [beacon('Order locked in. Doors in a minute!')],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      bands: ['B', 'C'],
      challenge: (ctx) => generateHydrantMatch(ctx),
      intro: [npc(PATEL, 'Each case has a number card. Match it!', 'Cada vitrina tiene un número. ¡Búsquenlo!', 'think')],
      outro: [bea('Every case back where it belongs.')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'museum',
      lines: [beacon('Mosaic finished. Drip stopped. Doors open!'), pepper('Woof!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(PATEL, '¡Gracias! Come back — you are in the exhibit now.', '¡Gracias! Vuelvan: ahora ustedes están en la exposición.', 'proud'),
        beacon('Gracias means thank you. We are art!', 'Gracias.'),
        bea('Shapes, patterns, teamwork. Museum-worthy.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
