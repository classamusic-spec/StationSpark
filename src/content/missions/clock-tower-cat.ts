import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateEquipmentCheck,
  generateLadderBuilder,
  generateNumberLadder,
  generateRescuePets,
  generateRescueRoute,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const MAYA = 'Maya';

/**
 * CAT IN THE CLOCK TOWER — the very first call.
 * Counting, adding and reading numbers, with Maya the librarian and one very
 * comfortable cat named Luna.
 */
export const clockTowerCat: MissionDef = {
  id: 'clock-tower-cat',
  title: 'Cat in the Clock Tower',
  titleEs: 'El gato de la torre del reloj',
  tagline: 'Luna climbed too high again!',
  brief: 'Maya the librarian says the library cat is stuck on the clock tower ledge. Pack the ladder and count your way up.',
  location: 'clock-tower',
  scene: 'clock-tower',
  address: '12 Clock Tower Square',
  npcName: MAYA,
  subjects: ['math', 'reading', 'logic', 'teamwork'],
  minutes: 9,
  badge: 'clock-tower-cat',
  xp: 40,
  sparks: 12,
  requires: [],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea("Bell's ringing! Boots on, crew.", 'excited'),
        radio('Radio call from the square. Boots on!'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('address', ctx),
      intro: [radio("Listen for the number. I'll write it down.")],
      outro: [bea("Good ears. That's our address.", 'proud')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => generateEquipmentCheck(ctx),
      intro: [bea('Pack the truck. Count each one twice.')],
      outro: [radio('Truck packed! Ladder is on top.')],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => generateRescueRoute(inScene(ctx, 'clock-tower')),
      intro: [radio('Market stalls are in the way. Plan the drive!')],
      outro: [bea('Smooth driving. No cones harmed.')],
    },
    { type: 'travel', from: 'station', to: 'clock-tower' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'clock-tower',
      lines: [
        npc(MAYA, '¡Hola! Luna climbed the clock tower again.', '¡Hola! Luna subió otra vez a la torre del reloj.', 'worried'),
        radio('Hola means hello. Luna is the library cat!', 'Hola.'),
        bea('Ladder first. Nice and steady.'),
      ],
    },
    {
      type: 'minigame',
      game: 'ladder-builder',
      challenge: (ctx) => ({ ...generateLadderBuilder(ctx), animal: 'kitten' as const }),
      intro: [bea('Add rungs until the ladder reaches Luna.')],
      outro: [npc(MAYA, '¡Perfecto! That is exactly high enough.', '¡Perfecto! Es justo la altura.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'number-ladder',
      bands: ['B', 'C'],
      challenge: (ctx) => generateNumberLadder(ctx),
      intro: [radio('Now climb. Hop rung by rung to Luna.')],
      outro: [radio('You landed exactly right.')],
    },
    {
      type: 'minigame',
      game: 'rescue-pets',
      challenge: (ctx) => ({ ...generateRescuePets(inScene(ctx, 'clock-tower')), animal: 'kitten' as const }),
      intro: [npc(MAYA, 'Slow hands, please. She is a little shy.', 'Manos suaves, por favor. Es tímida.', 'calm')],
      outro: [bea('Luna is safe. Beautiful work.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'clock-tower',
      lines: [radio('I can hear purring. Mission complete.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(MAYA, '¡Gracias, bomberos! Come read with us on Saturday.', '¡Gracias, bomberos! Vengan a leer el sábado.', 'excited'),
        radio('Gracias means thank you!', 'Gracias.'),
        bea("Any time, Maya. That's what neighbours do.", 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
