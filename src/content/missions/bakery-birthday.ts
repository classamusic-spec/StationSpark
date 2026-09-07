import type { AgeBand, ChallengeOf, GeneratorContext } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  generateDivideShare,
  generateRecipeScale,
  hydrantMatchFor,
  marketMoneyFor,
  vocabTapOnShelf,
  wordBuilderFor,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { bea, npc, radio, rookie } from './parts';

const ROSA = 'Rosa';

type Decoder = ChallengeOf<'dispatch-decoder'>;

/** The order slip Rosa reads out over the radio — the same one for every band. */
const orderCall = (): Decoder => ({
  kind: 'dispatch-decoder',
  mode: 'address',
  message: 'Rosa needs help at 8 Baker Lane. Repeat: 8 Baker Lane.',
  messageEs: 'Rosa necesita ayuda en Baker Lane 8. Repito: 8.',
  correct: '8',
  options: ['3', '8', '18'],
});

/** How many trays, and how many buns on each — the multiplication of the day. */
const trays: Record<AgeBand, { label: string; correct: number }> = {
  A: { label: '3 + 3', correct: 6 },
  B: { label: '6 × 4', correct: 24 },
  C: { label: '8 × 12', correct: 96 },
};

/**
 * THE HUNDRED-CUPCAKE ORDER — the bakery's second call, and its first about
 * numbers rather than smoke.
 *
 * `bakery-bell` is a rescue: the bell is stuck and the bread is burning. This
 * one is a *problem*. The whole school has ordered cupcakes for one birthday,
 * Rosa has worked out the trays wrong, and the crew has an afternoon to fix an
 * arithmetic mistake before a hundred children turn up.
 *
 * Its spine is the one thing the town never asked for: growing a recipe.
 * `recipe-scale` had been a band-C-only step hidden in four kitchen cards, so
 * seven year olds never met "twice as much". Here every band scales, because
 * every band can double.
 */
export const bakeryBirthday: MissionDef = {
  id: 'bakery-birthday',
  title: 'The Hundred-Cupcake Order',
  titleEs: 'El pedido de cien pastelitos',
  tagline: 'One birthday, one whole school, and the trays do not add up.',
  brief:
    'Rosa has taken an order for the whole of Class Two and worked out her trays wrong. Count the batches, grow the recipe, mind the till and get every box out before the party starts.',
  location: 'bakery',
  scene: 'bakery',
  address: '8 Baker Lane',
  npcName: ROSA,
  subjects: ['math', 'cooking', 'reading', 'spanish'],
  minutes: 14,
  badge: 'number-navigator',
  xp: 46,
  sparks: 15,
  requires: ['bakery-bell'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Rosa is on the radio. She sounds a bit flustered.'),
        rookie('Is the bell stuck again?', 'think'),
        bea('No. Worse. She has a birthday order and no trays.', 'surprised'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: () => orderCall(),
      intro: [radio('Baker Lane. Which number, Rookie?')],
      outro: [bea('Number eight. The one with the striped awning.')],
    },
    { type: 'travel', from: 'station', to: 'bakery' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'bakery',
      lines: [
        npc(ROSA, '¡Ay, qué desastre! I promised one hundred and I have thirty.', '¡Ay, qué desastre! Prometí cien y tengo treinta.', 'worried'),
        bea('Breathe, Rosa. We will count it out together.', 'calm'),
        radio('Desastre means disaster. A friendly one.', 'Desastre.'),
      ],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      challenge: (ctx: GeneratorContext) => hydrantMatchFor(trays[ctx.ageBand], ctx),
      intro: [bea('Read the tray card. How many buns is that?')],
      outro: [npc(ROSA, 'You count faster than my oven bakes!', '¡Cuentas más rápido que mi horno!', 'excited')],
    },
    {
      /*
       * Scaling for EVERY band, not just C. A doubles two lines, B doubles
       * three, and C grows a four-serving card to six — which is where whole
       * numbers stop being obvious and a child has to think in halves.
       */
      type: 'minigame',
      game: 'recipe-scale',
      challenge: (ctx) => {
        const plan =
          ctx.ageBand === 'A'
            ? { serves: 2, eating: 4, lines: [{ item: wordById('egg'), amount: 2 }, { item: wordById('flour'), amount: 1 }] }
            : ctx.ageBand === 'B'
              ? {
                  serves: 3,
                  eating: 6,
                  lines: [
                    { item: wordById('egg'), amount: 2 },
                    { item: wordById('flour'), amount: 3 },
                    { item: wordById('sugar'), amount: 1 },
                  ],
                }
              : {
                  serves: 4,
                  eating: 6,
                  lines: [
                    { item: wordById('egg'), amount: 4 },
                    { item: wordById('flour'), amount: 6 },
                    { item: wordById('butter'), amount: 2 },
                  ],
                };
        return {
          ...generateRecipeScale(ctx),
          serves: plan.serves,
          eating: plan.eating,
          lines: plan.lines.map((l) => ({ item: l.item, amount: l.amount, scaled: (l.amount * plan.eating) / plan.serves })),
        };
      },
      intro: [bea('Her card feeds a few. We need many more.')],
      outro: [npc(ROSA, 'The whole card, twice over. ¡Perfecto!', 'La receta entera, al doble. ¡Perfecto!', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('party', ctx),
      intro: [npc(ROSA, 'Tap what I ask for. Party words today!', 'Toca lo que pido. ¡Palabras de fiesta!', 'happy')],
      outro: [radio('Cake, candle, gift. All in your locker.')],
    },
    {
      type: 'minigame',
      game: 'word-builder',
      bands: ['B', 'C'],
      challenge: (ctx) => (ctx.ageBand === 'B' ? wordBuilderFor('cake', 'en', ctx) : wordBuilderFor('cake', 'es', ctx)),
      intro: [npc(ROSA, 'Every box needs a label. Spell it for me!', 'Cada caja necesita etiqueta. ¡Escríbela!', 'happy')],
      outro: [bea('Written out neatly. Rosa will keep that one.')],
    },
    {
      type: 'minigame',
      game: 'market-money',
      challenge: (ctx) => marketMoneyFor('cake', ctx),
      intro: [npc(ROSA, 'The first customer is here. Take her coins!', 'Ya llegó la primera clienta. ¡Cobra bien!', 'excited')],
      outro: [bea('Right to the last coin. The till agrees.')],
    },
    {
      type: 'minigame',
      game: 'divide-share',
      challenge: (ctx) => {
        const plan = ctx.ageBand === 'A' ? { total: 6, among: 3 } : ctx.ageBand === 'B' ? { total: 16, among: 4 } : { total: 30, among: 6 };
        return { ...generateDivideShare(ctx), item: wordById('cake'), total: plan.total, among: plan.among, each: plan.total / plan.among };
      },
      intro: [bea('Same number in every box. Nobody counts twice.')],
      outro: [rookie('Every box the same. I checked them all!', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'bakery',
      lines: [radio('One hundred cupcakes, boxed and out of the door.')],
    },
    {
      type: 'kitchen',
      recipe: 'tres-leches',
      intro: [bea('Rosa is teaching us her birthday cake. Aprons on.')],
    },
    {
      type: 'dialogue',
      lines: [
        npc(ROSA, '¡Gracias, equipo! Come back for the leftovers.', '¡Gracias, equipo! Vuelvan por las sobras.', 'excited'),
        bea('Gracias means thank you. We will be back.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
