import type { AgeBand, GeneratorContext, VocabWord } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateCountIngredients,
  generateDivideShare,
  generateEquipmentCheck,
  generateWaterTank,
  vocabTapOnShelf,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, npc, radio, rookie } from './parts';

const NICO = 'Don Nico';

/**
 * The picking list. Every entry is drawn differently on the shelf (carrot,
 * tomato, potato, lettuce, corn), so a child picking by picture always has a
 * fair question — the promise `distinctIcons` makes for the generated lists.
 */
const picking: Record<AgeBand, { item: VocabWord; count: number }[]> = {
  A: [
    { item: wordById('carrot'), count: 2 },
    { item: wordById('tomato'), count: 3 },
  ],
  B: [
    { item: wordById('carrot'), count: 3 },
    { item: wordById('tomato'), count: 4 },
    { item: wordById('potato'), count: 2 },
  ],
  C: [
    { item: wordById('carrot'), count: 4 },
    { item: wordById('tomato'), count: 5 },
    { item: wordById('potato'), count: 3 },
  ],
};

const spare: VocabWord[] = [wordById('apple'), wordById('banana'), wordById('lemon'), wordById('grape')];

/**
 * HARVEST DAY AT THE HUERTA — the garden's second call, and the one about
 * fairness.
 *
 * `garden-grow-day` is planting: seeds, water, patterns, a bunny in the
 * lettuce. This is the other end of the year. Everything is ready at once, six
 * families share the plot, and the crew is there to pick, weigh and split it —
 * which turns "the garden" into a division problem with real stakes, because
 * somebody is going to notice if their bag is smaller.
 */
export const gardenHarvest: MissionDef = {
  id: 'garden-harvest',
  title: 'Harvest Day at the Huerta',
  titleEs: 'Día de cosecha en la huerta',
  tagline: 'Everything is ripe at once, and six families are waiting.',
  brief:
    'Don Nico’s community garden has come ready all in one week. Fill the water barrels, pick what the list says, and split the whole harvest so every family gets exactly the same.',
  location: 'garden',
  scene: 'park',
  address: 'The Huerta, behind Willow Lane',
  npcName: NICO,
  subjects: ['math', 'spanish', 'cooking', 'teamwork'],
  minutes: 13,
  badge: 'kitchen-pro',
  xp: 45,
  sparks: 14,
  requires: ['garden-grow-day'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Don Nico says the whole huerta ripened at once.'),
        rookie('Is that bad?', 'think'),
        bea('It is a lot of carrots. Bring every crate we own.', 'happy'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('location', ctx),
      intro: [radio('Which place is calling us this morning?')],
      outro: [bea('The garden. Behind Willow Lane.')],
    },
    {
      type: 'minigame',
      game: 'equipment-check',
      challenge: (ctx) => ({
        ...generateEquipmentCheck(ctx),
        items: [
          { id: 'bucket' as const, need: ctx.ageBand === 'A' ? 3 : ctx.ageBand === 'B' ? 5 : 6, alreadyPacked: ctx.ageBand === 'A' ? 0 : 2 },
          { id: 'boots' as const, need: 2, alreadyPacked: 1 },
          { id: 'rope' as const, need: ctx.ageBand === 'C' ? 3 : 2, alreadyPacked: 1 },
        ],
        decoys: ['axe' as const, 'extinguisher' as const],
      }),
      intro: [bea('Crates, boots and twine. Nothing sharp today.')],
      outro: [rookie('Loaded. It smells like a greengrocer in here.', 'happy')],
    },
    { type: 'travel', from: 'station', to: 'garden' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'garden',
      lines: [
        npc(NICO, '¡Mira esto! Six families and one enormous harvest.', '¡Mira esto! Seis familias y una cosecha enorme.', 'excited'),
        bea('Then nobody gets more than anybody else. Agreed?', 'calm'),
        radio('Cosecha means harvest. A very big one.', 'Cosecha.'),
      ],
    },
    {
      type: 'minigame',
      game: 'water-tank',
      challenge: (ctx) => generateWaterTank(ctx),
      intro: [bea('Fill the barrel to the mark. Not over.')],
      outro: [npc(NICO, 'Exactly right. The rows will drink all week.', 'Justo. Las hileras beben toda la semana.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('growing-things', ctx),
      intro: [npc(NICO, 'Tap what I name. Garden words!', 'Toca lo que digo. ¡Palabras del huerto!', 'happy')],
      outro: [radio('Garden words saved to your locker!')],
    },
    {
      type: 'minigame',
      game: 'count-ingredients',
      bands: ['B', 'C'],
      challenge: (ctx: GeneratorContext) => ({
        ...generateCountIngredients(ctx),
        needs: picking[ctx.ageBand],
        extras: spare,
        spokenEs: true,
      }),
      intro: [npc(NICO, 'Zanahorias, tomates, papas. Pick exactly that!', 'Zanahorias, tomates y papas. ¡Corta justo eso!', 'happy')],
      outro: [bea('Picked to the list, in Spanish. Impressive.', 'proud')],
    },
    {
      /*
       * Six families, one harvest. Sharing is the whole reason the garden
       * exists, so the mission ends on the division rather than opening with it.
       */
      type: 'minigame',
      game: 'divide-share',
      challenge: (ctx) => {
        const plan = ctx.ageBand === 'A' ? { total: 6, among: 3 } : ctx.ageBand === 'B' ? { total: 15, among: 5 } : { total: 30, among: 6 };
        return { ...generateDivideShare(ctx), item: wordById('carrot'), total: plan.total, among: plan.among, each: plan.total / plan.among };
      },
      intro: [bea('Six bags, all the same. Count them out loud.')],
      outro: [npc(NICO, '¡Igualito! Nobody will count theirs twice.', '¡Igualito! Nadie va a contar dos veces.', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'garden',
      lines: [
        radio('Barrels full, rows picked, six bags on the wall.'),
        bea('That is what a shared garden is for.', 'proud'),
      ],
    },
    {
      type: 'kitchen',
      recipe: 'sopes',
      intro: [bea('Nico grew the maize too. Sopes for everyone.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(NICO, '¡Gracias! Come back when the beans are ready.', '¡Gracias! Vuelvan cuando estén los frijoles.', 'excited'),
        bea('Gracias means thank you. We will, Nico.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
