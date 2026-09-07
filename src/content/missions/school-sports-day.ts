import type { AgeBand, ChallengeOf, EquipmentId } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateClockWatch,
  listenCountFor,
  truckRunFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { bea, inScene, npc, radio, rookie } from './parts';

const LEE = 'Ms. Lee';

type GearSort = ChallengeOf<'gear-sort'>;

/** Three kit bags by size, because a Year Two vest does not fit a Year Six. */
const bags: GearSort['bins'] = [
  { id: 'S', label: 'Small', labelEs: 'Pequeño' },
  { id: 'M', label: 'Medium', labelEs: 'Mediano' },
  { id: 'L', label: 'Large', labelEs: 'Grande' },
];

const kit: GearSort['items'] = [
  { id: 'k1', bin: 'S', equipment: 'helmet' as EquipmentId, size: 'S', label: 'Infant vest', labelEs: 'Peto pequeño' },
  { id: 'k2', bin: 'S', equipment: 'boots' as EquipmentId, size: 'S', label: 'Small plimsolls', labelEs: 'Zapatillas pequeñas' },
  { id: 'k3', bin: 'M', equipment: 'bucket' as EquipmentId, size: 'M', label: 'Bean bag set', labelEs: 'Bolsas de semillas' },
  { id: 'k4', bin: 'M', equipment: 'rope' as EquipmentId, size: 'M', label: 'Skipping ropes', labelEs: 'Cuerdas de saltar' },
  { id: 'k5', bin: 'L', equipment: 'ladder' as EquipmentId, size: 'L', label: 'Hurdle frames', labelEs: 'Vallas' },
  { id: 'k6', bin: 'L', equipment: 'cone' as EquipmentId, size: 'L', label: 'Big markers', labelEs: 'Conos grandes' },
];

/** What the crew is waiting for, per band — always a race, always on the hour list. */
const heats: Record<AgeBand, string> = {
  A: 'the first race starts on the field',
  B: 'the relay heats start on the field',
  C: 'the last relay heat starts on the field',
};

/**
 * SPORTS DAY STAND-BY — the whole afternoon runs on a timetable.
 *
 * `school-fair` is a rescue in a crowd: a stuck bouncy castle, a lost child, a
 * fair to keep running. Sports day is a different animal — nothing goes wrong
 * at all, but eleven races have to start when the sheet says they start, and
 * the crew is on the touchline with the water, the first-aid tent and the
 * stopwatch.
 *
 * So this is the town's TIME mission. `clock-watch` appeared in four calls but
 * never as the point of one; here every beat is a "before", and band C is
 * reading elapsed time off a timetable rather than setting a single alarm.
 */
export const schoolSportsDay: MissionDef = {
  id: 'school-sports-day',
  title: 'Sports Day Stand-By',
  titleEs: 'Guardia del día deportivo',
  tagline: 'Eleven races, one timetable, and nobody may be late.',
  brief:
    'It is sports day at Spark City Primary and the crew is on the touchline. Sort the kit by size, read the timetable, and get the water and the shade where they are needed before each heat starts.',
  location: 'school',
  scene: 'school',
  address: 'Spark City Primary, School Road',
  npcName: LEE,
  subjects: ['math', 'logic', 'spanish', 'teamwork'],
  minutes: 12,
  badge: 'time-keeper',
  xp: 44,
  sparks: 13,
  requires: ['school-fair'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Sports day. We are water, shade and plasters.', 'happy'),
        rookie('No fire at all?', 'think'),
        bea('Only the sun. Bring the big water tank.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', ctx),
      intro: [radio('Read her note. Which race needs us first?')],
      outro: [bea('The long one, in the heat. Of course.')],
    },
    {
      type: 'minigame',
      game: 'truck-run',
      challenge: (ctx) => truckRunFor(['count-on', 'add-sub', 'elapsed'], inScene(ctx, 'school')),
      intro: [radio('Roll out, and read every gate on School Road.')],
      outro: [rookie('Parked before the whistle. Just.', 'excited')],
    },
    { type: 'travel', from: 'station', to: 'school' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'school',
      lines: [
        npc(LEE, '¡Qué calor! Eleven races and the kit is in one pile.', '¡Qué calor! Once carreras y todo el equipo en un montón.', 'worried'),
        bea('Sizes first, then the timetable. We have time.', 'calm'),
        radio('Calor means heat. Everybody drinks today.', 'Calor.'),
      ],
    },
    {
      type: 'minigame',
      game: 'gear-sort',
      challenge: () => ({ kind: 'gear-sort' as const, by: 'size' as const, bins: bags, items: kit }),
      intro: [bea('Small, medium, large. Read each label first.')],
      outro: [npc(LEE, 'Sorted! Nobody is running in the wrong shoes.', '¡Ordenado! Nadie corre con zapatos ajenos.', 'excited')],
    },
    {
      /* The point of the whole call: a start time you have to work out. */
      type: 'minigame',
      game: 'clock-watch',
      challenge: (ctx) => ({ ...generateClockWatch(ctx), event: heats[ctx.ageBand] }),
      intro: [bea('Read the timetable. Set the clock to that heat.')],
      outro: [bea('On the line, on the minute. That is the job.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('sports-day', ctx),
      intro: [npc(LEE, 'Tap the one I call. Sports words!', 'Toca el que digo. ¡Palabras del deporte!', 'happy')],
      outro: [radio('Race, win, field. All in your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('cone', ctx),
      intro: [npc(LEE, 'Cuenta conmigo. How many conos mark the track?', 'Cuenta conmigo. ¿Cuántos conos marcan la pista?', 'happy')],
      outro: [bea('Counted in Spanish, over a starting whistle.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'school',
      lines: [
        radio('Eleven races, eleven on time. Two grazed knees.'),
        bea('Both plastered, both back racing. Good afternoon.', 'proud'),
      ],
    },
    {
      type: 'kitchen',
      recipe: 'agua-fresca',
      intro: [bea('Hottest day of term. Agua fresca for everyone.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LEE, '¡Gracias! You kept the whole afternoon on the clock.', '¡Gracias! Mantuvieron toda la tarde a tiempo.', 'proud'),
        bea('Gracias means thank you. Same time next year.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
