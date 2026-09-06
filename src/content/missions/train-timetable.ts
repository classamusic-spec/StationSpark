import type { MissionDef } from '../types';
import type { ChallengeOf, EquipmentId } from '@/learning/types';
import {
  dispatchDecoderFor,
  gearSortWithBins,
  generateClockWatch,
  generateHydrantMatch,
  generateNumberLadder,
  generateRescueRoute,
  generateSignals,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const LOU = 'Conductor Lou';

type GearSort = ChallengeOf<'gear-sort'>;

/** Streets around the platforms, so band B and C can read their way there. */
const platformStreets = ['Station Road', 'Platform Way', 'Signal Street', 'Willow Way', 'Market Street', 'Bell Avenue'];

const lostBins: GearSort['bins'] = [
  { id: 'snacks', label: 'Snacks', labelEs: 'Bocadillos', color: '#FF8A3D' },
  { id: 'clothes', label: 'Clothes', labelEs: 'Ropa', color: '#4FC3F7' },
  { id: 'books', label: 'Books', labelEs: 'Libros', color: '#9B7BFF' },
];

const lostItems: GearSort['items'] = [
  { id: 'l1', bin: 'snacks', equipment: 'bucket' as EquipmentId, label: 'Apple', labelEs: 'Manzana', icon: 'apple' },
  { id: 'l2', bin: 'snacks', equipment: 'extinguisher' as EquipmentId, label: 'Milk carton', labelEs: 'Cartón de leche', icon: 'milk' },
  { id: 'l3', bin: 'clothes', equipment: 'helmet' as EquipmentId, label: 'Red cap', labelEs: 'Gorra roja', icon: 'red' },
  { id: 'l4', bin: 'clothes', equipment: 'boots' as EquipmentId, label: 'Blue scarf', labelEs: 'Bufanda azul', icon: 'blue' },
  { id: 'l5', bin: 'books', equipment: 'radio' as EquipmentId, label: 'Story book', labelEs: 'Libro de cuentos', icon: 'library' },
  { id: 'l6', bin: 'books', equipment: 'flashlight' as EquipmentId, label: 'Number book', labelEs: 'Libro de números', icon: 'three' },
];

/**
 * TRAIN STATION TIMETABLE — time, maps and reading directions with Conductor Lou.
 * A branch came down across the crossing gate, so the platform clock stopped and
 * nobody knows when anything leaves. Nobody is on the tracks; the timetable is
 * simply very confused.
 */
export const trainTimetable: MissionDef = {
  id: 'train-timetable',
  title: 'Train Station Timetable',
  titleEs: 'El horario de la estación de tren',
  tagline: 'The platform clock stopped at half past.',
  brief:
    'A branch came down on the crossing gate and the platform clock stopped with it. Conductor Lou needs the address read, the shortest road driven, the clock set and the lost-property shelf sorted before the next train.',
  location: 'train-station',
  scene: 'clock-tower',
  address: '1 Platform Way',
  npcName: LOU,
  subjects: ['math', 'reading', 'logic', 'teamwork'],
  minutes: 13,
  badge: 'timetable-pro',
  xp: 50,
  sparks: 18,
  requires: ['school-fair', 'museum-mystery'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Conductor Lou called. The platform clock stopped.', 'excited'),
        radio('Address coming over the radio now. Listen closely.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('address', ctx),
      intro: [radio('Listen for the number. I will write it down.')],
      outro: [bea('Good ears. That is our platform.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('Steps in order. A station likes order.')],
      outro: [radio('Order locked in. Engine started!')],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => {
        const route = generateRescueRoute(inScene(ctx, 'clock-tower'));
        const shortLen = Math.max(2, route.maxCommands - 2);
        return {
          ...route,
          streetNames: Array.from({ length: route.grid.rows }, (_, row) => ({
            row,
            name: platformStreets[row % platformStreets.length] ?? 'Station Road',
          })),
          compareRoutes: { a: shortLen, b: shortLen + 3, shorter: 'a' as const },
        };
      },
      intro: [radio('Two roads to Platform Way. Read the street names!')],
      outro: [bea('Shortest road, smoothest drive.')],
    },
    { type: 'travel', from: 'station', to: 'train-station' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'train-station',
      lines: [
        npc(LOU, '¡Qué bueno verlos! My clock stopped and nobody knows the time.', '¡Qué bueno verlos! Mi reloj se paró y nadie sabe la hora.', 'worried'),
        radio('El reloj means the clock!', 'El reloj.'),
        bea('Branch off the gate. Then the clock.'),
      ],
    },
    {
      type: 'minigame',
      game: 'clock-watch',
      challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the next train leaves platform one' }),
      intro: [npc(LOU, 'Set the hands, please. When do we leave?', 'Pongan las manecillas, por favor. ¿A qué hora salimos?', 'calm')],
      outro: [radio('Clock ticking. The timetable is true again!')],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      bands: ['A'],
      challenge: (ctx) => generateHydrantMatch(ctx),
      intro: [radio('Every platform has a number. Find the match!')],
      outro: [bea('Platform found. Nice number spotting.')],
    },
    {
      type: 'minigame',
      game: 'number-ladder',
      bands: ['B', 'C'],
      challenge: (ctx) => generateNumberLadder(ctx),
      intro: [radio('Count the carriages. Hop along the train!')],
      outro: [bea('Landed on the last carriage exactly.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => gearSortWithBins(lostBins, lostItems),
      intro: [npc(LOU, 'The lost-property shelf tipped over. ¡Ayúdenme!', 'Se cayó el estante de objetos perdidos. ¡Ayúdenme!', 'happy')],
      outro: [],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'train-station',
      lines: [radio('Gate clear. Clock ticking. Train leaving!')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LOU, '¡Gracias, equipo! Right on time, as always.', '¡Gracias, equipo! Justo a tiempo, como siempre.', 'proud'),
        radio('Equipo means team. That is us!', 'Equipo.'),
        bea('On time beats fast. Every shift.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
