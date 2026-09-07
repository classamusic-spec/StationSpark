import type { ChallengeOf, EquipmentId } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  gearSortWithBins,
  generateEquipmentCheck,
  generateNumberLadder,
  generateRescueRoute,
  generateShapeBuilder,
  hydrantMatchFor,
  vocabTapFor,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const LUZ = 'Señora Ramírez';
const TOMAS = 'Tomás';

type GearSort = ChallengeOf<'gear-sort'>;

/** Which room each box belongs in — the sort a family actually does. */
const roomBins: GearSort['bins'] = [
  { id: 'kitchen', label: 'Kitchen', labelEs: 'Cocina', color: '#FFC72C' },
  { id: 'bedroom', label: 'Bedroom', labelEs: 'Recámara', color: '#4FA3F7' },
  { id: 'books', label: 'Books', labelEs: 'Libros', color: '#8FD16B' },
];

/**
 * Moving boxes. As on clean-up day, `label` / `labelEs` / `icon` are the truth
 * a child reads; `equipment` is only the fallback drawing, and every box shows
 * a different picture so no two are the same puzzle.
 */
const boxes: GearSort['items'] = [
  { id: 'b1', bin: 'kitchen', equipment: 'bucket' as EquipmentId, label: 'Pans', labelEs: 'Ollas', icon: 'soup' },
  { id: 'b2', bin: 'kitchen', equipment: 'first-aid' as EquipmentId, label: 'Plates', labelEs: 'Platos', icon: 'tortilla' },
  { id: 'b3', bin: 'bedroom', equipment: 'boots' as EquipmentId, label: 'Boots', labelEs: 'Botas', icon: 'boots' },
  { id: 'b4', bin: 'bedroom', equipment: 'rope' as EquipmentId, label: 'Blanket', labelEs: 'Cobija', icon: 'uniform' },
  { id: 'b5', bin: 'books', equipment: 'radio' as EquipmentId, label: 'Storybooks', labelEs: 'Cuentos', icon: 'library' },
  { id: 'b6', bin: 'books', equipment: 'flashlight' as EquipmentId, label: 'School books', labelEs: 'Libros de escuela', icon: 'school' },
];

/**
 * MOVING DAY ON MAPLE STREET — the call that is not an emergency.
 *
 * The Ramírez family are moving into apartment 3B and the lift is out, so every
 * box goes up four flights by hand. The crew reads the address off the radio,
 * plans the drive, sorts the boxes by room, counts the floors and puts the
 * bookshelf back together. Nobody is in danger; somebody just needs help.
 */
export const movingDay: MissionDef = {
  id: 'moving-day',
  title: 'Moving Day on Maple Street',
  titleEs: 'Día de mudanza en la calle Maple',
  tagline: 'New neighbours, a broken lift and a lot of boxes.',
  brief:
    'The Ramírez family are moving into apartment 3B and the lift is out of order. Read the address, plan the drive and help carry every box up.',
  location: 'apartments',
  scene: 'apartments',
  address: '9 Maple Street, apartment 3B',
  npcName: LUZ,
  subjects: ['math', 'reading', 'logic', 'teamwork'],
  minutes: 12,
  badge: 'map-master',
  xp: 44,
  sparks: 14,
  requires: ['clock-tower-cat'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Not a fire today. A moving van and a broken lift.', 'calm'),
        radio('New neighbours on Maple Street. Boots on!'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('address', ctx),
      intro: [radio('Listen for the house number. Write it down.')],
      outro: [bea('Nine Maple Street. Third floor, apartment B.')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => generateEquipmentCheck(ctx),
      intro: [bea('Pack the straps and the trolley. Count twice.')],
      outro: [radio('Truck loaded. Nothing left on the shelf.')],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => generateRescueRoute(inScene(ctx, 'apartments')),
      intro: [radio('The van is parked badly. Plan a way round!')],
      outro: [bea('Neat driving. Not one wing mirror touched.', 'proud')],
    },
    { type: 'travel', from: 'station', to: 'apartments' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'apartments',
      lines: [
        npc(LUZ, '¡Hola! We are the Ramírez family. The lift is broken.', '¡Hola! Somos la familia Ramírez. El elevador no sirve.', 'worried'),
        npc(TOMAS, 'I can carry the light ones. I am seven!', 'Yo cargo las ligeras. ¡Tengo siete años!', 'excited'),
        radio('Elevador means lift. Stairs it is!', 'Elevador.'),
      ],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => gearSortWithBins(roomBins, boxes),
      intro: [bea('Read every box. Kitchen, bedroom or books.')],
      outro: [npc(TOMAS, 'My storybooks went to the right room!', '¡Mis cuentos fueron al cuarto correcto!', 'happy')],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      bands: ['A'],
      challenge: (ctx) => hydrantMatchFor({ label: 'three', correct: 3 }, ctx),
      intro: [bea('Which door says three? That is their floor.')],
      outro: [radio('Third floor. Up we go!')],
    },
    {
      type: 'minigame',
      game: 'number-ladder',
      bands: ['B', 'C'],
      challenge: (ctx) => generateNumberLadder(ctx),
      intro: [radio('Count the steps as you climb. Land exactly right.')],
      outro: [bea('Four flights, and you landed on the number.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'shape-builder',
      challenge: (ctx) => generateShapeBuilder(ctx),
      intro: [npc(LUZ, 'The bookshelf came apart in the van!', '¡El librero se desarmó en la camioneta!', 'worried')],
      outro: [bea('Straight and steady. It will hold every book.')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      challenge: (ctx) => vocabTapFor('apartment', ctx),
      intro: [npc(TOMAS, 'Say it with me: apartamento!', 'Dilo conmigo: ¡apartamento!', 'happy')],
      outro: [radio('New words saved to your locker!')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'apartments',
      lines: [radio('Last box is up. The kettle is already on.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LUZ, '¡Muchas gracias! Come for dinner on Friday.', '¡Muchas gracias! Vengan a cenar el viernes.', 'excited'),
        radio('Gracias means thank you.', 'Gracias.'),
        bea('We will bring bread. Welcome to Spark City.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
