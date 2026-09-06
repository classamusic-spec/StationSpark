import type { MissionDef } from '../types';
import type { EquipmentId } from '@/learning/types';
import {
  dispatchDecoderFor,
  generateCountIngredients,
  generateEquipmentCheck,
  generateHoseHero,
  generateListenCount,
  generateVocabTap,
  generateWaterTank,
  hoseHeroWithFlames,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, radio, inScene, npc } from './parts';

const SOFIA = 'Capitana Sofía';
const ROSA = 'Rosa';

/** The festival grill flare, sized for the crew that is holding the hose. */
const grill: Record<'A' | 'B' | 'C', { flames: number; grid: { rows: number; cols: number } }> = {
  A: { flames: 4, grid: { rows: 2, cols: 3 } },
  B: { flames: 6, grid: { rows: 2, cols: 4 } },
  C: { flames: 8, grid: { rows: 3, cols: 4 } },
};

/**
 * FESTIVAL RESCUE EXCHANGE — the Global Rescue Exchange comes to Spark City.
 *
 * Capitana Sofía's crew from Estación Cinco is visiting for the neighbourhood
 * festival. The whole call runs Spanish-first: the radio speaks Spanish and
 * Captain Bea translates. The exchange is about food, language and neighbours —
 * two stations doing the same job in two languages.
 */
export const festivalExchange: MissionDef = {
  id: 'festival-exchange',
  title: 'Festival Rescue Exchange',
  titleEs: 'Intercambio de rescate en el festival',
  tagline: 'A visiting crew, a festival, and one lively grill.',
  brief:
    'Capitana Sofía and her crew from Estación Cinco are here for the neighbourhood festival. The radio calls in Spanish, the grill at stall fifteen got excited, and afterwards everybody cooks quesadillas together.',
  location: 'festival',
  scene: 'market',
  address: '15 Festival Green',
  npcName: `${SOFIA} & ${ROSA}`,
  subjects: ['spanish', 'teamwork', 'cooking', 'math'],
  minutes: 14,
  badge: 'rescue-exchange',
  xp: 50,
  sparks: 20,
  requires: ['market-morning', 'community-cleanup'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        bea('Visitors! A crew from Mexico lands today.', 'excited'),
        radio('The radio is in Spanish now. I will help.', 'El radio habla español.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => ({
        ...dispatchDecoderFor('address', ctx),
        message: 'Help needed at festival stall 15. Repeat: fifteen.',
        messageEs: '¡Ayuda en el puesto 15 del festival! Repito: quince.',
        correct: '15',
        options: ctx.rng.shuffle(['15', '51', '5']),
      }),
      intro: [radio('Spanish first! Quince. Which number is that?', 'Quince.')],
      outro: [bea('Fifteen. You listened in two languages.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      challenge: (ctx) => generateWaterTank(ctx),
      intro: [bea('Tank first. Then meet our new friends.')],
      outro: [radio('Tank full! In Spanish: ¡tanque lleno!', '¡Tanque lleno!')],
    },
    { type: 'travel', from: 'station', to: 'festival' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'festival',
      lines: [
        npc(SOFIA, '¡Hola, Estación Spark! Somos la Estación Cinco.', '¡Hola, Estación Spark! Somos la Estación Cinco.', 'excited'),
        radio('She says: hello, we are Station Five!'),
        npc(ROSA, 'I brought bread for everyone. ¡Para todos!', 'Traje pan para todos. ¡Para todos!', 'happy'),
      ],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      challenge: (ctx) => generateListenCount(ctx),
      intro: [npc(SOFIA, 'Escuchen bien. ¿Cuántos necesitamos?', 'Escuchen bien. ¿Cuántos necesitamos?', 'calm')],
      outro: [radio('You counted in Spanish. ¡Muy bien!', '¡Muy bien!')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      challenge: (ctx) => {
        const base = generateVocabTap(ctx);
        const word = wordById('quesadilla');
        const pool = [wordById('taco'), wordById('tortilla'), wordById('pizza'), wordById('bread')];
        return {
          ...base,
          promptLang: 'es' as const,
          word,
          options: ctx.rng.shuffle([word, ...pool.slice(0, ctx.ageBand === 'A' ? 2 : 3)]),
        };
      },
      intro: [npc(SOFIA, 'Toca el dibujo que digo. ¿Listos?', 'Toca el dibujo que digo. ¿Listos?', 'happy')],
      outro: [radio('New Spanish words in your locker!')],
    },
    {
      type: 'minigame',
      game: 'hose-hero',
      challenge: (ctx) => {
        const plan = grill[ctx.ageBand];
        return hoseHeroWithFlames(generateHoseHero(inScene(ctx, 'market')), plan.flames, plan.grid);
      },
      intro: [bea('Gentle spray. The grill only, please.')],
      outro: [npc(SOFIA, '¡Excelente! Two crews, one hose line.', '¡Excelente! Dos equipos, una manguera.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      bands: ['A'],
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items: [
          { id: 'bucket' as EquipmentId, need: 3, alreadyPacked: 0 },
          { id: 'cone' as EquipmentId, need: 2, alreadyPacked: 0 },
        ],
        decoys: ['axe', 'extinguisher'] as EquipmentId[],
      }),
      intro: [npc(ROSA, 'Count the buckets with me, please.', 'Cuenten las cubetas conmigo, por favor.', 'happy')],
      outro: [radio('All counted. The stall is safe!')],
    },
    {
      type: 'minigame',
      game: 'count-ingredients',
      bands: ['B', 'C'],
      challenge: (ctx) => ({
        ...generateCountIngredients(ctx),
        needs:
          ctx.ageBand === 'B'
            ? [
                { item: wordById('tortilla'), count: 5 },
                { item: wordById('cheese'), count: 3 },
              ]
            : [
                { item: wordById('tortilla'), count: 6 },
                { item: wordById('cheese'), count: 4 },
                { item: wordById('onion'), count: 3 },
              ],
        extras: [wordById('apple'), wordById('banana'), wordById('strawberry')],
        spokenEs: true,
      }),
      intro: [npc(SOFIA, 'Now the stall list. ¡Todo en español!', 'Ahora la lista del puesto. ¡Todo en español!', 'happy')],
      outro: [radio('Tortillas y queso. Counted perfectly!', 'Tortillas y queso.')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'festival',
      lines: [radio('Grill calm. Festival saved. ¡Listo!', '¡Listo!')],
    },
    {
      type: 'kitchen',
      recipe: 'quesadillas',
      intro: [
        npc(SOFIA, 'Now we cook! Quesadillas para todos.', '¡Ahora cocinamos! Quesadillas para todos.', 'excited'),
        bea('The crew holds the hot pan. Ask a grown-up at home.'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(SOFIA, '¡Gracias, amigos! Come visit our station next.', '¡Gracias, amigos! Ahora vengan a nuestra estación.', 'proud'),
        radio('New pin on the world map. Where next?', 'Un pin nuevo en el mapa del mundo.'),
        bea('A world map for the dispatch room. Yes!', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
