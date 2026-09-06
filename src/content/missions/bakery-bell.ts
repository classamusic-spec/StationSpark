import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateEquipmentCheck,
  generateHoseHero,
  generateRescueRoute,
  generateVocabTap,
  generateWaterTank,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const ROSA = 'Rosa';

/**
 * BAKERY BELL — reading, measuring and water fractions with Rosa the baker.
 * The oven flared while the timer bell jammed; nobody is in danger, but the
 * bread is not going to save itself.
 */
export const bakeryBell: MissionDef = {
  id: 'bakery-bell',
  title: 'Bakery Bell',
  titleEs: 'La campana de la panadería',
  tagline: 'Rosa needs hands before the bread burns!',
  brief: "The bakery timer bell is stuck ringing and the oven window has a little flame. Rosa needs water, hands and one very good reader.",
  location: 'bakery',
  scene: 'bakery',
  address: '8 Bell Avenue',
  npcName: ROSA,
  subjects: ['reading', 'math', 'spanish', 'cooking'],
  minutes: 11,
  badge: 'bakery-bell',
  xp: 40,
  sparks: 14,
  requires: [],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea("Rosa's bell is ringing. She needs us.", 'excited'),
        radio('Bell Avenue, and it is the bakery. Go!'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('location', inScene(ctx, 'bakery')),
      intro: [radio('Which building is calling? Tap it quick.')],
      outro: [bea("The bakery. Let's roll.")],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => generateEquipmentCheck(ctx),
      intro: [bea('Hoses, bucket, helmet. Check the list.')],
      outro: [radio('All packed. Zero forgotten!')],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => generateRescueRoute(inScene(ctx, 'bakery')),
      intro: [radio('Bell Avenue is closed. Find another way.')],
      outro: [],
    },
    { type: 'travel', from: 'station', to: 'bakery' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'bakery',
      lines: [
        npc(ROSA, '¡Ay! The oven is hot and the bread is waiting.', '¡Ay! El horno está caliente y el pan espera.', 'worried'),
        radio('El horno means the oven!', 'El horno.'),
        bea('Water first. Then bread.'),
      ],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      challenge: (ctx) => generateWaterTank(ctx),
      intro: [bea('Fill the tank up to the line.')],
      outro: [radio('Tank ready. Water on!')],
    },
    {
      type: 'minigame',
      game: 'hose-hero',
      challenge: (ctx) => generateHoseHero(inScene(ctx, 'bakery')),
      intro: [bea('Gentle spray. One window at a time.')],
      outro: [npc(ROSA, '¡Gracias! My oven says thank you too.', '¡Gracias! Mi horno también da las gracias.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      challenge: (ctx) => generateVocabTap(ctx),
      intro: [npc(ROSA, 'Now, helpers — say the words with me.', 'Ahora, ayudantes: digan las palabras conmigo.', 'happy')],
      outro: [radio('New words saved to your locker!')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'bakery',
      lines: [radio('Flames out. Bread rescued!')],
    },
    {
      type: 'kitchen',
      recipe: 'bread',
      intro: [
        npc(ROSA, 'Stay! We bake a loaf together.', '¡Quédense! Hacemos pan juntos.', 'excited'),
        bea('The crew handles the oven. Ask a grown-up at home.'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(ROSA, 'Bread for the whole station. ¡Gracias!', 'Pan para todo el cuartel. ¡Gracias!', 'proud'),
        radio('Gracias means thank you!', 'Gracias.'),
        bea('Warm bread beats a warm oven. Roll out!', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
