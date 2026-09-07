import type { ChallengeOf } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  generateBuildBarrier,
  generateClockWatch,
  generateSprayPattern,
  listenCountFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { bea, npc, radio, rookie } from './parts';

const VIDAL = 'Maestro Vidal';

type Signals = ChallengeOf<'signals'>;

/**
 * The order the bandstand gets built, which is also the order the crew rehearses
 * on every call: ring, radio, drive, look, water, hose, ladder, check. Taking
 * the first N of the routine keeps the story sensible for every band, exactly
 * the way `generateSignals` does — this just pins which N.
 */
const stageOrder = (ctx: { ageBand: 'A' | 'B' | 'C' }): Signals['steps'] =>
  ctx.ageBand === 'A'
    ? ['bell', 'radio', 'check']
    : ctx.ageBand === 'B'
      ? ['bell', 'radio', 'water', 'check']
      : ['bell', 'radio', 'map', 'water', 'check'];

/**
 * BANDSTAND CONCERT — the call where nothing is wrong.
 *
 * Spark City's crew does not only turn out for trouble. Once a summer the
 * bandstand in the park holds a free concert, and the fire crew is there
 * because a thousand people in one field need water, a barrier and somebody
 * counting. It is deliberately the least dramatic mission in the town, and the
 * only one whose "rescue" is a concert starting on time.
 *
 * Its subject is PATTERN. A drum part is a repeating unit, a set list is a
 * sequence, and a barrier is a number made out of smaller numbers. Every beat
 * here is the same idea wearing different clothes.
 */
export const parkBandstand: MissionDef = {
  id: 'park-bandstand',
  title: 'Bandstand Concert',
  titleEs: 'Concierto en el quiosco',
  tagline: 'A thousand people, one drum pattern and a barrier to build.',
  brief:
    'The summer concert is at six and the bandstand is still a pile of railings. Set the stage in order, learn the drum pattern, build a barrier the crowd cannot push over, and get the band on before the sun goes down.',
  location: 'park',
  scene: 'park',
  address: 'The Bandstand, Willow Park',
  npcName: VIDAL,
  subjects: ['logic', 'math', 'spanish', 'teamwork'],
  minutes: 12,
  badge: 'pattern-pro',
  xp: 44,
  sparks: 13,
  requires: ['park-picnic'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Concert in the park tonight. We are the safety crew.', 'happy'),
        rookie('Do we get to hear it?', 'excited'),
        bea('Only if we build the barrier first.'),
      ],
    },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => {
        const steps = stageOrder(ctx);
        const shuffled = ctx.rng.shuffle(steps);
        const rotated: Signals['shuffled'] = [...steps.slice(1), ...steps.slice(0, 1)];
        return { kind: 'signals', steps, shuffled: shuffled.join() === steps.join() ? rotated : shuffled };
      },
      intro: [bea('Stage first, then sound, then people. In order.')],
      outro: [rookie('Set up in the right order. No cables underfoot!', 'proud')],
    },
    { type: 'travel', from: 'station', to: 'park' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'park',
      lines: [
        npc(VIDAL, '¡Bienvenidos! My drummer is stuck in traffic.', '¡Bienvenidos! Mi baterista está en el tráfico.', 'worried'),
        bea('Then Rookie learns the pattern. How hard can it be?', 'happy'),
        radio('Bienvenidos means welcome. Say it back!', 'Bienvenidos.'),
      ],
    },
    {
      type: 'minigame',
      game: 'spray-pattern',
      challenge: (ctx) => generateSprayPattern(ctx),
      intro: [npc(VIDAL, 'The drum goes round and round. Find the missing beat!', 'El tambor va y viene. ¡Encuentra el golpe que falta!', 'excited')],
      outro: [npc(VIDAL, '¡Qué oído! You have a drummer’s ear.', '¡Qué oído! Tienes oído de baterista.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'build-barrier',
      challenge: (ctx) => generateBuildBarrier(ctx),
      intro: [bea('The barrier must measure exactly right. No gaps.')],
      outro: [bea('Solid. A thousand people will lean on that.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('music-and-parade', ctx),
      intro: [npc(VIDAL, 'Tap the one I name. Music words!', 'Toca el que digo. ¡Palabras de música!', 'happy')],
      outro: [radio('Drum, guitar, song. All in your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('drum', ctx),
      intro: [npc(VIDAL, 'Cuenta conmigo. How many tambores on the stage?', 'Cuenta conmigo. ¿Cuántos tambores hay en el escenario?', 'happy')],
      outro: [bea('Counted in Spanish, over a soundcheck.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'clock-watch',
      challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the band walks on at the bandstand' }),
      intro: [bea('He gave you a time. Set the hands to it.')],
      outro: [rookie('Ten minutes to go. Everyone in place!', 'excited')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'park',
      lines: [
        radio('Barrier up, water out, band on. Listen to that crowd!'),
        bea('Nothing went wrong. That is the whole job.', 'proud'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(VIDAL, '¡Muchas gracias! Come and drum with us next year.', '¡Muchas gracias! Ven a tocar con nosotros el próximo año.', 'excited'),
        bea('Gracias means thank you. Rookie is blushing.', 'happy'),
        rookie('I am not! …I might come back though.', 'proud'),
      ],
    },
    { type: 'recap' },
  ],
};
