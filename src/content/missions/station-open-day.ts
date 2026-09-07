import type { MissionDef } from '../types';
import {
  generateEquipmentCheck,
  generateRescueRoute,
  generateSignals,
  generateWaterTank,
  listenCountFor,
  vocabTapFor,
  wordBuilderFor,
} from '@/learning/generators';
import { bea, radio, inScene, npc } from './parts';

const LEE = 'Ms. Lee';
const ROSA = 'Rosa';

/**
 * STATION OPEN DAY — the one call that goes the other way.
 *
 * Nobody needs rescuing. Ms. Lee's class is coming to see the station, so the
 * crew lays out the kit, labels it, fetches the class from the school gate,
 * walks them back again and shows them how a call-out actually works. It is the
 * town's teamwork mission, and the only one where the child does the explaining.
 */
export const stationOpenDay: MissionDef = {
  id: 'station-open-day',
  title: 'Station Open Day',
  titleEs: 'Puertas abiertas en la estación',
  tagline: 'The whole neighbourhood is coming to see us.',
  brief:
    'Ms. Lee is bringing her class to Station Spark. Lay out the kit, label every piece, walk the class safely over, and show them how the crew answers a call.',
  location: 'station',
  scene: 'station-yard',
  address: 'Station Spark, 1 Spark Street',
  npcName: LEE,
  subjects: ['reading', 'english', 'spanish', 'teamwork'],
  minutes: 12,
  badge: 'team-player',
  xp: 44,
  sparks: 15,
  requires: ['pet-shop-parade', 'library-lights'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Open day! The whole class is walking over.', 'excited'),
        radio('No siren today. Just a very tidy station.'),
      ],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => generateEquipmentCheck(ctx),
      intro: [bea('Lay the kit out so everyone can see it.')],
      outro: [radio('Every shelf full. It looks wonderful.')],
    },
    {
      type: 'minigame',
      game: 'word-builder',
      challenge: (ctx) =>
        /* every word here has a picture of its very own on the icon sheet,
           so "spell what you can see" is a fair thing to ask */
        ctx.ageBand === 'A'
          ? wordBuilderFor('hose', 'en', ctx, { prefilled: 1 })
          : ctx.ageBand === 'B'
            ? wordBuilderFor('ladder', 'en', ctx)
            : wordBuilderFor('helmet', 'es', ctx),
      intro: [bea('Label the kit. Spell each one, letter by letter.')],
      outro: [radio('Labels on. Now the class can read everything.')],
    },
    { type: 'travel', from: 'station', to: 'school' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'school',
      lines: [
        npc(LEE, '¡Buenos días! Twenty six children and one very excited class pet.', '¡Buenos días! Veintiséis niños y una mascota muy emocionada.', 'happy'),
        radio('Buenos días means good morning.', 'Buenos días.'),
        bea('Two lines, please. We walk, we never run.'),
      ],
    },
    {
      type: 'minigame',
      game: 'rescue-route',
      challenge: (ctx) => generateRescueRoute(inScene(ctx, 'station-yard')),
      intro: [radio('Plan the safest walk back. Crossings only!')],
      outro: [bea('Not one child near a road. Perfect route.', 'proud')],
    },
    { type: 'travel', from: 'school', to: 'station' },
    {
      type: 'minigame',
      game: 'signals',
      challenge: (ctx) => generateSignals(ctx),
      intro: [npc(LEE, 'Show us what happens when the bell rings!', '¡Muéstrennos qué pasa cuando suena la campana!', 'excited')],
      outro: [bea('That is a call-out, start to finish. Well explained.')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapFor('helmet', ctx),
      intro: [npc(LEE, 'Teach us a word. Tap the picture you say!', 'Enséñanos una palabra. ¡Toca el dibujo que dices!', 'happy')],
      outro: [radio('You taught the class a word today.')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('helmet', ctx),
      intro: [npc(LEE, 'Cuenta conmigo. How many helmets on the rack?', 'Cuenta conmigo. ¿Cuántos cascos hay en el estante?', 'happy')],
      outro: [bea('Counted out loud in Spanish. The class clapped.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      challenge: (ctx) => generateWaterTank(ctx),
      intro: [npc(ROSA, 'I brought bread! Now show them the pump.', '¡Traje pan! Ahora enséñenles la bomba.', 'excited')],
      outro: [bea('Right on the line. The class loved that.')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'station',
      lines: [radio('Twenty six visitors, one clean station, zero calls.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(LEE, '¡Gracias! They will talk about this all week.', '¡Gracias! Van a hablar de esto toda la semana.', 'excited'),
        radio('Gracias means thank you.', 'Gracias.'),
        bea('Our door is always open. Come again.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
