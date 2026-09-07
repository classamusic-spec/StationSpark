import type { AgeBand, ChallengeOf, EquipmentId } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  gearSortWithBins,
  generateDivideShare,
  generateSignals,
  hydrantMatchFor,
  vocabTapOnShelf,
  wordBuilderFor,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, npc, radio, rookie } from './parts';

const LOU = 'Conductor Lou';

type GearSort = ChallengeOf<'gear-sort'>;

/** Three sidings, three destinations. */
const sidings: GearSort['bins'] = [
  { id: 'north', label: 'North train', labelEs: 'Tren del norte', color: '#4FA3F7' },
  { id: 'south', label: 'South train', labelEs: 'Tren del sur', color: '#FF8A3D' },
  { id: 'stay', label: 'Stays here', labelEs: 'Se queda aquí', color: '#8FD16B' },
];

const freight: GearSort['items'] = [
  { id: 'f1', bin: 'north', equipment: 'bucket' as EquipmentId, label: 'Milk churns', labelEs: 'Botes de leche', icon: 'milk' },
  { id: 'f2', bin: 'north', equipment: 'rope' as EquipmentId, label: 'Rolls of rope', labelEs: 'Rollos de cuerda', icon: 'rope' },
  { id: 'f3', bin: 'south', equipment: 'first-aid' as EquipmentId, label: 'Hospital boxes', labelEs: 'Cajas del hospital', icon: 'hospital' },
  { id: 'f4', bin: 'south', equipment: 'helmet' as EquipmentId, label: 'Builders’ hats', labelEs: 'Cascos de obra', icon: 'helmet' },
  { id: 'f5', bin: 'stay', equipment: 'extinguisher' as EquipmentId, label: 'Station spares', labelEs: 'Repuestos de la estación', icon: 'toolbox' },
  { id: 'f6', bin: 'stay', equipment: 'flashlight' as EquipmentId, label: 'Signal lamps', labelEs: 'Lámparas de señal', icon: 'flashlight' },
];

/** How many wagons are standing in the yard this morning. */
const wagons: Record<AgeBand, { label: string; correct: number }> = {
  A: { label: '4 + 4', correct: 8 },
  B: { label: '5 × 4', correct: 20 },
  C: { label: '48 ÷ 4', correct: 12 },
};

/**
 * THE FREIGHT YARD — the goods end of the station, not the passenger end.
 *
 * `train-timetable` is a platform, a clock and a train that must be caught.
 * Two hundred metres up the line is the freight yard, where nothing has a
 * timetable and everything has to be counted: wagons standing in rows, crates
 * that belong on one of two trains, and a coupling order that cannot be done
 * out of sequence.
 *
 * It is the town's clearest MULTIPLICATION-AND-DIVISION call. Rows of wagons
 * are an array you can walk along, and splitting them between two trains is
 * division you can push with your hands.
 */
export const freightYardCount: MissionDef = {
  id: 'freight-yard-count',
  title: 'The Freight Yard',
  titleEs: 'El patio de carga',
  tagline: 'Rows of wagons, two trains, and one very long list.',
  brief:
    'A points failure has left the whole morning’s freight parked in rows. Count the wagons, split them between the north and south trains, load the crates on the right one and couple up in the right order.',
  location: 'train-station',
  scene: 'station-yard',
  address: 'The Freight Yard, Platform Way',
  npcName: LOU,
  subjects: ['math', 'logic', 'reading', 'teamwork'],
  minutes: 13,
  badge: 'number-navigator',
  xp: 46,
  sparks: 15,
  requires: ['train-timetable'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Lou needs hands at the freight yard. Points failure.'),
        rookie('Are the trains stuck?', 'think'),
        bea('Parked, not stuck. But nothing is counted.', 'calm'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('address', ctx),
      intro: [radio('He gave a number on Platform Way. Which one?')],
      outro: [bea('That gate, at the end of the yard.')],
    },
    { type: 'travel', from: 'station', to: 'train-station' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'train-station',
      lines: [
        npc(LOU, '¡Qué mañana! Rows and rows and nobody counting.', '¡Qué mañana! Filas y filas y nadie contando.', 'worried'),
        bea('Rows are easy. Count one row, then count the rows.'),
        radio('Fila means row. Say it as you walk.', 'Fila.'),
      ],
    },
    {
      /* Wagons in rows: multiplication you can walk along. */
      type: 'minigame',
      game: 'hydrant-match',
      challenge: (ctx) => hydrantMatchFor(wagons[ctx.ageBand], ctx),
      intro: [bea('Four wagons in a row. Read the board.')],
      outro: [npc(LOU, 'Faster than my clipboard. ¡Qué bárbaro!', 'Más rápido que mi tabla. ¡Qué bárbaro!', 'excited')],
    },
    {
      /* …and division you can push with your hands. */
      type: 'minigame',
      game: 'divide-share',
      challenge: (ctx) => {
        const plan = ctx.ageBand === 'A' ? { total: 8, among: 2 } : ctx.ageBand === 'B' ? { total: 20, among: 4 } : { total: 24, among: 3 };
        return { ...generateDivideShare(ctx), item: wordById('box'), total: plan.total, among: plan.among, each: plan.total / plan.among };
      },
      intro: [bea('Split them evenly. Neither train pulls more.')],
      outro: [bea('Even loads, even wheels. That is why we count.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => gearSortWithBins(sidings, freight),
      intro: [bea('Read each crate. North, south, or stays here?')],
      outro: [rookie('Nothing went to the wrong town today.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('truck-cab', ctx),
      intro: [npc(LOU, 'Tap what I name. Yard words!', 'Toca lo que digo. ¡Palabras del patio!', 'happy')],
      outro: [radio('Yard words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'word-builder',
      bands: ['B', 'C'],
      challenge: (ctx) => (ctx.ageBand === 'B' ? wordBuilderFor('box', 'es', ctx) : wordBuilderFor('toolbox', 'en', ctx)),
      intro: [npc(LOU, 'Chalk the wagon board for me. Spell it!', 'Escribe el letrero del vagón. ¡Deletréalo!', 'happy')],
      outro: [bea('Chalked up clearly. The next shift can read it.')],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [bea('Coupling order now. One step wrong is a bump.')],
      outro: [npc(LOU, 'Coupled like a professional. ¡Bravo!', 'Enganchado como un profesional. ¡Bravo!', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'train-station',
      lines: [
        radio('North train away. South train away. Yard clear.'),
        bea('Every wagon counted twice. Nobody guessed.', 'proud'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LOU, 'Gracias, equipo. Ride in the cab next time?', 'Gracias, equipo. ¿Viajan en la cabina la próxima?', 'excited'),
        bea('Gracias means thank you. Rookie says yes.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
