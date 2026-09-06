import type { MissionDef } from '../types';
import type { EquipmentId } from '@/learning/types';
import {
  dispatchDecoderFor,
  generateEquipmentCheck,
  generateHoseHero,
  generateRescueRoute,
  generateWaterTank,
  hoseHeroWithFlames,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const GINO = 'Gino';

/** The story pack: two hoses, three cones, one first-aid kit. */
const pizzaKit: { id: EquipmentId; need: number; alreadyPacked: number }[] = [
  { id: 'hose', need: 2, alreadyPacked: 0 },
  { id: 'cone', need: 3, alreadyPacked: 0 },
  { id: 'first-aid', need: 1, alreadyPacked: 0 },
];

/**
 * PIZZA SHOP PANIC — the sample mission from the design doc.
 * 24 Market Street, a three-quarter tank, six flames and a pizza cut into eight.
 */
export const pizzaShopPanic: MissionDef = {
  id: 'pizza-shop-panic',
  title: 'Pizza Shop Panic',
  titleEs: '¡Pánico en la pizzería!',
  tagline: "Gino's oven got a little too excited.",
  brief: 'Flames in the pizza oven window at 24 Market Street. Gino needs the crew, and then he needs help sharing eight slices.',
  location: 'pizza',
  scene: 'pizza',
  address: '24 Market Street',
  npcName: GINO,
  subjects: ['math', 'spanish', 'cooking', 'teamwork'],
  minutes: 12,
  badge: 'pizza-rescue',
  xp: 45,
  sparks: 16,
  requires: ['bakery-bell'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea("Gino's oven flared up. He needs us.", 'excited'),
        radio('Address coming over the radio. Listen closely.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => ({
        ...dispatchDecoderFor('address', ctx),
        message: 'Help needed at 24 Market Street. Repeat: 24 Market Street.',
        messageEs: 'Necesitamos ayuda en la calle Market 24. Repito: 24.',
        correct: '24',
        options: ctx.rng.shuffle(['14', '24', '42']),
      }),
      intro: [radio('Careful — two digits. Which number was it?')],
      outro: [bea('Twenty-four Market Street. Great listening.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items: pizzaKit,
        decoys: ['axe', 'rope'] as EquipmentId[],
      }),
      intro: [bea('Two hoses. Three cones. One first-aid.')],
      outro: [radio('Six things, packed exactly right!')],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => {
        const route = generateRescueRoute(inScene(ctx, 'pizza'));
        const shortLen = Math.max(2, route.maxCommands - 2);
        return { ...route, compareRoutes: { a: shortLen, b: shortLen + 4, shorter: 'a' as const } };
      },
      intro: [radio('Two roads to Market Street. Take the shorter one.')],
      outro: [bea('Shortest route wins. Hold on!')],
    },
    { type: 'travel', from: 'station', to: 'pizza' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'pizza',
      lines: [
        npc(GINO, '¡Ayuda! My oven, she is too excited!', '¡Ayuda! ¡Mi horno está muy emocionado!', 'worried'),
        radio('Ayuda means help!', 'Ayuda.'),
        bea('Tank first. Then the windows.'),
      ],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      challenge: (ctx) => ({
        ...generateWaterTank(ctx),
        target: { num: 3, den: 4 },
        ticks: 4 as const,
        pumpStep: { num: 1, den: 4 },
        allowOverflow: false,
      }),
      intro: [bea('Fill the tank to three quarters.')],
      outro: [radio('Three quarters exactly. Beautiful.')],
    },
    {
      type: 'minigame',
      game: 'hose-hero',
      challenge: (ctx) => hoseHeroWithFlames(generateHoseHero(inScene(ctx, 'pizza')), 6, { rows: 2, cols: 3 }),
      intro: [bea('Six flames. Sweep left to right.')],
      outro: [],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'pizza',
      lines: [
        npc(GINO, '¡Gracias! ¡Gracias, bomberos!', '¡Gracias! ¡Gracias, bomberos!', 'excited'),
        radio('Gracias means thank you. He said it twice!', 'Gracias.'),
        bea("You're welcome, Gino. Anytime."),
      ],
    },
    {
      type: 'kitchen',
      recipe: 'pizza',
      intro: [
        npc(GINO, 'Now we make pizza! Half cheese, always.', '¡Ahora hacemos pizza! Mitad queso, siempre.', 'happy'),
        bea('The crew slides it in the oven. Ask a grown-up at home.'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(GINO, 'Eight slices, four friends. ¿Cuántas cada uno?', 'Ocho rebanadas, cuatro amigos. ¿Cuántas cada uno?', 'happy'),
        radio('Two each. You worked that out beautifully.', 'Dos.'),
        bea('Fair shares always taste better.', 'proud'),
      ],
    },
    { type: 'recap' },
  ],
};
