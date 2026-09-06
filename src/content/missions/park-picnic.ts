import type { MissionDef } from '../types';
import {
  generateBuildBarrier,
  generateGearSort,
  generateListenCount,
  generateSignals,
  generateSprayPattern,
  generateVocabTap,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const OKAFOR = 'Mr. Okafor';

/**
 * PARK PICNIC PROBLEM — patterns, sorting, vocabulary and a spreading puddle.
 * Band A taps words; bands B and C listen and count in Spanish.
 */
export const parkPicnic: MissionDef = {
  id: 'park-picnic',
  title: 'Park Picnic Problem',
  titleEs: 'El picnic del parque',
  tagline: 'The wind mixed up the whole picnic!',
  brief: 'The neighbourhood picnic starts soon, the flags are out of order and a stuck sprinkler is making a puddle. Mr. Okafor needs the crew.',
  location: 'park',
  scene: 'park',
  address: '3 Park Lane',
  npcName: OKAFOR,
  subjects: ['logic', 'english', 'spanish', 'teamwork'],
  minutes: 11,
  badge: 'park-picnic',
  xp: 45,
  sparks: 14,
  requires: ['clock-tower-cat'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Picnic day! Mr. Okafor needs extra hands.', 'happy'),
        radio('Sprinkler stuck, puddle growing. Park Lane.'),
      ],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('First things first. Put the steps in order.')],
      outro: [radio('Order locked in. Roll out!')],
    },
    { type: 'travel', from: 'station', to: 'park' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'park',
      lines: [
        npc(OKAFOR, '¡Buenos días! The wind mixed up everything.', '¡Buenos días! El viento revolvió todo.', 'worried'),
        radio('Buenos días means good morning!', 'Buenos días.'),
        bea('Sort it out, crew. Puddle last.'),
      ],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: (ctx) => generateGearSort(inScene(ctx, 'park')),
      intro: [npc(OKAFOR, 'Sort our things, please. Everything has a home.', 'Ordenen las cosas, por favor. Todo tiene su lugar.', 'happy')],
      outro: [bea('Tidy park, happy park.')],
    },
    {
      type: 'minigame',
      game: 'spray-pattern',
      challenge: (ctx) => generateSprayPattern(ctx),
      intro: [radio('The picnic flags follow a pattern. What comes next?')],
      outro: [],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => generateListenCount(ctx),
      intro: [npc(OKAFOR, 'Listen closely. How many do we need?', 'Escucha bien. ¿Cuántos necesitamos?', 'calm')],
      outro: [radio('Counted in Spanish. ¡Muy bien!', '¡Muy bien!')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => generateVocabTap(ctx),
      intro: [npc(OKAFOR, 'Tap the picture I say. ¿Listos?', 'Toca el dibujo que digo. ¿Listos?', 'happy')],
      outro: [radio('New words in your locker!')],
    },
    {
      type: 'minigame',
      game: 'build-barrier',
      challenge: (ctx) => generateBuildBarrier(ctx),
      intro: [bea('Sandbags now. Fill the gap exactly.')],
      outro: [npc(OKAFOR, '¡Perfecto! The blankets stay dry.', '¡Perfecto! Las mantas quedan secas.', 'excited')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'park',
      lines: [radio('Puddle stopped. Picnic saved!')],
    },
    {
      type: 'kitchen',
      recipe: 'smoothie',
      intro: [
        npc(OKAFOR, 'Strawberries from my garden. ¡Para ustedes!', 'Fresas de mi jardín. ¡Para ustedes!', 'proud'),
        bea('The crew runs the blender. Ask a grown-up at home.'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(OKAFOR, 'The picnic is saved. ¡Gracias, equipo!', 'El picnic está salvado. ¡Gracias, equipo!', 'excited'),
        radio('Equipo means team. That is us!', 'Equipo.'),
        bea('Best kind of call: everybody fed.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
