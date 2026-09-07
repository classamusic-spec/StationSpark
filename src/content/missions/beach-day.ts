import type { ChallengeOf, EquipmentId } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  gearSortWithBins,
  generateClockWatch,
  generateRescuePets,
  listenCountFor,
  marketMoneyFor,
  vocabTapFor,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const MARISOL = 'Marisol';

type GearSort = ChallengeOf<'gear-sort'>;

/** What the tide leaves on the sand, and where each piece belongs. */
const beachBins: GearSort['bins'] = [
  { id: 'shells', label: 'Back to the sea', labelEs: 'Al mar', color: '#4FA3F7' },
  { id: 'recycle', label: 'Recycling', labelEs: 'Reciclaje', color: '#8FD16B' },
  { id: 'lost', label: 'Lost property', labelEs: 'Objetos perdidos', color: '#FFC72C' },
];

const beachFinds: GearSort['items'] = [
  { id: 's1', bin: 'shells', equipment: 'rope' as EquipmentId, label: 'Shell', labelEs: 'Concha', icon: 'turtle' },
  { id: 's2', bin: 'shells', equipment: 'bucket' as EquipmentId, label: 'Seaweed', labelEs: 'Alga', icon: 'lettuce' },
  { id: 's3', bin: 'recycle', equipment: 'extinguisher' as EquipmentId, label: 'Juice carton', labelEs: 'Cartón de jugo', icon: 'juice' },
  { id: 's4', bin: 'recycle', equipment: 'first-aid' as EquipmentId, label: 'Paper bag', labelEs: 'Bolsa de papel', icon: 'bread' },
  { id: 's5', bin: 'lost', equipment: 'boots' as EquipmentId, label: 'Sandal', labelEs: 'Sandalia', icon: 'boots' },
  { id: 's6', bin: 'lost', equipment: 'flashlight' as EquipmentId, label: 'Sun hat', labelEs: 'Sombrero', icon: 'helmet' },
];

/**
 * BAY CLEAN-UP DAY — the beach at the end of Harbour Road.
 *
 * Marisol the lifeguard has a tide coming in at half past four and a whole
 * beach to clear before it does, plus a turtle that has wandered up the sand
 * away from the water. The clock is the point of this call: everything has a
 * "before" attached to it, which is what elapsed time really is.
 */
export const beachDay: MissionDef = {
  id: 'beach-day',
  title: 'Bay Clean-Up Day',
  titleEs: 'Día de limpieza en la bahía',
  tagline: 'Clear the sand before the tide comes back.',
  brief:
    'Marisol needs the bay cleared before the tide turns, and a turtle walked gently back to the water. Read the clock, sort the finds, and cool everyone down afterwards.',
  location: 'beach',
  scene: 'park',
  address: 'The Bay, end of Harbour Road',
  npcName: MARISOL,
  subjects: ['math', 'spanish', 'logic', 'teamwork'],
  minutes: 13,
  badge: 'time-traveler',
  xp: 46,
  sparks: 16,
  requires: ['community-cleanup'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('The bay clean-up starts today. Bring the wide hats.', 'happy'),
        radio('Marisol says the tide turns this afternoon!'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', ctx),
      intro: [radio('Read her message. Why must we finish early?')],
      outro: [bea('The tide covers the low path. Good reading.')],
    },
    {
      type: 'minigame',
      game: 'clock-watch',
      challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the tide turns back at the pier' }),
      intro: [bea('Set the clock to the time the tide turns.')],
      outro: [radio('Now we know our deadline. Sand first!')],
    },
    { type: 'travel', from: 'station', to: 'beach' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'beach',
      lines: [
        npc(MARISOL, '¡Hola! I am the lifeguard. The sea gives us so much back.', '¡Hola! Soy la salvavidas. El mar nos devuelve de todo.', 'happy'),
        radio('Salvavidas means lifeguard. Good word.', 'Salvavidas.'),
        bea('Three piles. Sea, recycling, lost property.'),
      ],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => gearSortWithBins(beachBins, beachFinds),
      intro: [bea('Read each find. Then choose its pile.')],
      outro: [npc(MARISOL, '¡Qué limpio! The bay has not looked like this in years.', '¡Qué limpio! La bahía no se veía así en años.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'rescue-pets',
      challenge: (ctx) => ({ ...generateRescuePets(inScene(ctx, 'park')), animal: 'turtle' as const }),
      intro: [npc(MARISOL, 'Two hands, low to the sand. She is old.', 'Con dos manos, bajito. Ella es muy vieja.', 'calm')],
      outro: [bea('Straight back to the water. Perfect.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapFor('beach', ctx),
      intro: [npc(MARISOL, 'Tap the picture I say. ¿Listos?', 'Toca el dibujo que digo. ¿Listos?', 'happy')],
      outro: [radio('New words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('seagull', ctx),
      intro: [npc(MARISOL, 'Cuenta conmigo. How many gulls on the rail?', 'Cuenta conmigo. ¿Cuántas gaviotas hay en el barandal?', 'happy')],
      outro: [bea('Counted in Spanish, over the sound of the waves.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'market-money',
      challenge: (ctx) => marketMoneyFor('watermelon', ctx),
      intro: [npc(MARISOL, 'Carmen brought her cart. Pay her properly!', '¡Carmen trajo su carrito. Páguenle bien!', 'excited')],
      outro: [bea('Counted right, to the last coin.')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'beach',
      lines: [radio('Sand clear, turtle home, and ten minutes to spare.')],
    },
    {
      type: 'kitchen',
      recipe: 'paletas',
      intro: [bea('Hottest day of the year. Paletas for everyone!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(MARISOL, '¡Gracias! Come back and swim with us next week.', '¡Gracias! Vuelvan a nadar con nosotros la próxima semana.', 'excited'),
        radio('Gracias means thank you.', 'Gracias.'),
        bea('We will. Bring the whole crew, Rookie.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
