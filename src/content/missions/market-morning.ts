import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateCountIngredients,
  generateHydrantMatch,
  generateListenCount,
  generateMarketMoney,
  generateMeasurePour,
  generateVocabTap,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, radio, inScene, npc } from './parts';

const CARMEN = 'Abuela Carmen';

/**
 * FARMERS MARKET MORNING — measuring, money and Spanish food words.
 * The fountain valve stuck open before sunrise and the water is creeping
 * under Abuela Carmen's stall. Nobody is in danger; the tomatoes, however,
 * are extremely worried.
 */
export const marketMorning: MissionDef = {
  id: 'market-morning',
  title: 'Farmers Market Morning',
  titleEs: 'Mañana en el mercado',
  tagline: 'The fountain will not stop running!',
  brief:
    'The market fountain valve stuck open at sunrise and a puddle is spreading under the stalls. Abuela Carmen needs the valve closed, her crates counted and — afterwards — someone to learn her salsa.',
  location: 'market',
  scene: 'market',
  address: '2 Market Square',
  npcName: CARMEN,
  subjects: ['math', 'spanish', 'cooking', 'reading'],
  minutes: 12,
  badge: 'market-helper',
  xp: 45,
  sparks: 16,
  requires: ['bakery-bell', 'park-picnic'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Market call, crew. Sunrise shift!', 'excited'),
        radio('A fountain that forgot how to stop. Market Square.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('location', inScene(ctx, 'market')),
      intro: [radio('Which building is calling? Tap it quick.')],
      outro: [bea("The market. Boots on, let's roll.")],
    },
    { type: 'travel', from: 'station', to: 'market' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'market',
      lines: [
        npc(CARMEN, '¡Buenos días, bomberos! My tomatoes are swimming.', '¡Buenos días, bomberos! Mis tomates están nadando.', 'worried'),
        radio('Los tomates means the tomatoes!', 'Los tomates.'),
        bea('Valve first. Then the crates.'),
      ],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      challenge: (ctx) => generateHydrantMatch(ctx),
      intro: [bea('Every valve has a tag. Find the match.')],
      outro: [radio('Click! Fountain off. Puddle stopped.')],
    },
    {
      type: 'minigame',
      game: 'count-ingredients',
      challenge: (ctx) => ({
        ...generateCountIngredients(ctx),
        needs:
          ctx.ageBand === 'A'
            ? [
                { item: wordById('tomato'), count: 3 },
                { item: wordById('corn'), count: 2 },
              ]
            : ctx.ageBand === 'B'
              ? [
                  { item: wordById('tomato'), count: 5 },
                  { item: wordById('onion'), count: 3 },
                  { item: wordById('corn'), count: 4 },
                ]
              : [
                  { item: wordById('tomato'), count: 6 },
                  { item: wordById('onion'), count: 4 },
                  { item: wordById('lemon'), count: 5 },
                ],
        extras: [wordById('cake'), wordById('pizza'), wordById('taco')],
        spokenEs: true,
      }),
      intro: [npc(CARMEN, 'Rescue my crates. Count them in Spanish!', 'Rescaten mis cajas. ¡Cuéntenlas en español!', 'happy')],
      outro: [radio('Tomates, cebollas, limones. All saved!', 'Tomates, cebollas y limones.')],
    },
    {
      type: 'minigame',
      game: 'measure-pour',
      challenge: (ctx) => ({
        ...generateMeasurePour(ctx),
        ingredient: wordById('juice'),
        unit: 'cup' as const,
        ...(ctx.ageBand === 'A'
          ? { target: { num: 1, den: 2 }, ticks: 2 as const, step: { num: 1, den: 2 } }
          : { target: { num: 3, den: 4 }, ticks: 4 as const, step: { num: 1, den: 4 } }),
      }),
      intro: [npc(CARMEN, 'Now fill my jug. Stop at the line.', 'Ahora llenen mi jarra. Paren en la línea.', 'calm')],
      outro: [bea('Steady pour. Not one drop spilled.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'market-money',
      challenge: (ctx) => ({ ...generateMarketMoney(ctx), item: wordById('tomato') }),
      intro: [radio('A customer! Count out the right coins.')],
      outro: [npc(CARMEN, '¡Exacto! You count like a market person.', '¡Exacto! Cuentan como gente del mercado.', 'excited')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => {
        const base = generateVocabTap(ctx);
        const word = wordById('tomato');
        const pool = [wordById('apple'), wordById('bread'), wordById('cheese')];
        return { ...base, word, options: ctx.rng.shuffle([word, ...pool.slice(0, 2)]) };
      },
      intro: [radio('Tap the food I say. In Spanish!')],
      outro: [],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => generateListenCount(ctx),
      intro: [npc(CARMEN, 'Listen well. ¿Cuántos necesito?', 'Escuchen bien. ¿Cuántos necesito?', 'happy')],
      outro: [radio('Heard every number. ¡Excelente!', '¡Excelente!')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'market',
      lines: [radio('Valve closed. Crates dry. Market open!')],
    },
    {
      type: 'kitchen',
      recipe: 'garden-salsa',
      intro: [
        npc(CARMEN, 'Stay! I teach you my salsa. ¡Vengan!', '¡Quédense! Les enseño mi salsa. ¡Vengan!', 'excited'),
        bea('The crew uses the knife. Ask a grown-up at home.'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(CARMEN, 'Tomate, cebolla, cilantro, limón. ¡Gracias!', 'Tomate, cebolla, cilantro, limón. ¡Gracias!', 'proud'),
        radio('Four words, one salsa. Gracias means thank you!', 'Gracias.'),
        bea('Best breakfast of the whole week.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
