import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateClockWatch,
  generateHoseHero,
  generateHosePath,
  generateHydrantMatch,
  generateRescueRoute,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const LEE = 'Ms. Lee';

/**
 * SCHOOL FAIR RESCUE — time, maps, multiplication and a long radio message.
 * Band C matches hydrants with times tables; band A matches plain numbers.
 */
export const schoolFair: MissionDef = {
  id: 'school-fair',
  title: 'School Fair Rescue',
  titleEs: 'Rescate en la feria escolar',
  tagline: 'The fair opens at four. Ready?',
  brief: "Ms. Lee needs the water booth running and one little gym-window flame handled — all before the school fair opens at four o'clock.",
  location: 'school',
  scene: 'school',
  address: '15 School Road',
  npcName: LEE,
  subjects: ['math', 'reading', 'logic', 'teamwork'],
  minutes: 12,
  badge: 'school-fair',
  xp: 50,
  sparks: 16,
  requires: ['pizza-shop-panic'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea("School fair opens at four. We're helping.", 'happy'),
        radio('Ms. Lee sent a long message. Read it with me.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', inScene(ctx, 'school')),
      intro: [radio('Read it with me. What does she need?')],
      outro: [bea('Read it right the first time. Good.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'clock-watch',
      challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the school fair opens' }),
      intro: [bea('Set the clock. When does the fair open?')],
      outro: [radio("Time locked in. Let's not be late!")],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => {
        const route = generateRescueRoute(inScene(ctx, 'school'));
        const shortLen = Math.max(2, route.maxCommands - 2);
        return { ...route, compareRoutes: { a: shortLen + 3, b: shortLen, shorter: 'b' as const } };
      },
      intro: [radio('Two roads. Which is shorter? Then drive it.')],
      outro: [bea('Nice. That saved us minutes.')],
    },
    { type: 'travel', from: 'station', to: 'school' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'school',
      lines: [
        npc(LEE, '¡Bienvenidos! The water booth needs a hose line.', '¡Bienvenidos! El puesto de agua necesita manguera.', 'happy'),
        radio('Bienvenidos means welcome!', 'Bienvenidos.'),
        bea('Hydrant first. Then the line.'),
      ],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      challenge: (ctx) => generateHydrantMatch(ctx),
      intro: [npc(LEE, 'Which hydrant matches the tag?', '¿Cuál hidrante coincide con la etiqueta?', 'think')],
      outro: [radio('Matched! Water is on.')],
    },
    {
      type: 'minigame',
      game: 'hose-path',
      challenge: (ctx) => generateHosePath(inScene(ctx, 'school')),
      intro: [bea('Lay the line. Corner by corner.')],
      outro: [],
    },
    {
      type: 'minigame',
      game: 'hose-hero',
      challenge: (ctx) => generateHoseHero(inScene(ctx, 'school')),
      intro: [bea('Little flame in the gym window. Gentle spray.')],
      outro: [npc(LEE, '¡Gracias! Right before the doors open.', '¡Gracias! Justo antes de abrir las puertas.', 'excited')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'school',
      lines: [radio('Booth running. Flame out. Fair ready!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LEE, "Four o'clock exactly. ¡Gracias, equipo!", 'Las cuatro en punto. ¡Gracias, equipo!', 'proud'),
        radio('Gracias means thank you!', 'Gracias.'),
        bea('On time, and on the same team.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
