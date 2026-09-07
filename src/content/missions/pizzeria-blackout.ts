import type { AgeBand, ChallengeOf } from '@/learning/types';
import type { MissionDef } from '../types';
import {
  dispatchDecoderFor,
  generateHosePath,
  generatePizzaFractions,
  generateSprayPattern,
  hydrantMatchFor,
  listenCountFor,
  vocabTapOnShelf,
} from '@/learning/generators';
import { bea, inScene, npc, radio, rookie } from './parts';

const GINO = 'Gino';

type Pizza = ChallengeOf<'pizza-fractions'>;

/** Which circuit the fuse board says the oven is on. */
const circuits: Record<AgeBand, { label: string; correct: number }> = {
  A: { label: '4 + 2', correct: 6 },
  B: { label: '6 × 4', correct: 24 },
  C: { label: '96 ÷ 8', correct: 12 },
};

/**
 * What is already out of the oven when the power goes, and how it gets split.
 *
 * Band A halves a pizza between two, B meets quarters, and C meets EIGHTHS —
 * ½ + ¼ + ⅛ + ⅛ — which is the first time the town (rather than the Kitchen)
 * asks a child to add three different denominators and land on one whole pie.
 */
const split: Record<AgeBand, { toppings: Pizza['toppings']; cutInto: number; shareAmong: number }> = {
  A: {
    toppings: [
      { topping: 'cheese', fraction: { num: 1, den: 2 } },
      { topping: 'tomato', fraction: { num: 1, den: 2 } },
    ],
    cutInto: 4,
    shareAmong: 2,
  },
  B: {
    toppings: [
      { topping: 'cheese', fraction: { num: 1, den: 2 } },
      { topping: 'mushroom', fraction: { num: 1, den: 4 } },
      { topping: 'pepper', fraction: { num: 1, den: 4 } },
    ],
    cutInto: 8,
    shareAmong: 4,
  },
  C: {
    toppings: [
      { topping: 'cheese', fraction: { num: 1, den: 2 } },
      { topping: 'tomato', fraction: { num: 1, den: 4 } },
      { topping: 'olive', fraction: { num: 1, den: 8 } },
      { topping: 'basil', fraction: { num: 1, den: 8 } },
    ],
    cutInto: 8,
    shareAmong: 4,
  },
};

/**
 * FUSE BOX AT GINO'S — the pizzeria's second call, and the first mission that
 * cuts a pizza.
 *
 * `pizza-shop-panic` is a fire. This is a *blackout*: nothing is burning, the
 * oven is simply dead in the middle of the lunch rush with a queue out of the
 * door and twelve pizzas already baked. So the crew does two things at once —
 * trace the circuit and get the cooked food shared out before it goes cold.
 *
 * That second half is why the mission exists. `pizza-fractions` was a Kitchen
 * game a child only met by choosing to cook; here fractions turn up because
 * there are eleven people in a queue and four hot pizzas.
 */
export const pizzeriaBlackout: MissionDef = {
  id: 'pizzeria-blackout',
  title: "Fuse Box at Gino's",
  titleEs: 'Los fusibles de Gino',
  tagline: 'The oven is dead, the queue is long, and four pizzas are getting cold.',
  brief:
    "Gino's oven cut out in the middle of the lunch rush. Trace the circuit, run a safe cable from the fuse board, and share out the pizzas that are already baked before anybody goes hungry.",
  location: 'pizza',
  scene: 'pizza',
  address: '24 Market Street',
  npcName: GINO,
  subjects: ['math', 'logic', 'spanish', 'cooking'],
  minutes: 13,
  badge: 'fraction-firefighter',
  xp: 46,
  sparks: 15,
  requires: ['pizza-shop-panic'],
  beats: [
    {
      type: 'dialogue',
      backdrop: 'station-yard',
      lines: [
        radio('Gino again. No smoke this time — no power either.'),
        rookie('A whole street, or just his shop?', 'think'),
        bea('Just his shop. Bring the cable reel and a torch.'),
      ],
    },
    {
      type: 'minigame',
      game: 'dispatch-decoder',
      challenge: (ctx) => dispatchDecoderFor('sentence', ctx),
      intro: [radio('Read his message. What does he need first?')],
      outro: [bea('The oven, not the lights. Good reading.')],
    },
    { type: 'travel', from: 'station', to: 'pizza' },
    {
      type: 'scene',
      scene: 'arrive',
      location: 'pizza',
      lines: [
        npc(GINO, '¡Qué lío! Eleven people waiting and no oven.', '¡Qué lío! Once personas esperando y sin horno.', 'worried'),
        bea('Nothing is burning. That is the good news.', 'calm'),
        radio('Lío means mess. A very Italian one.', 'Lío.'),
      ],
    },
    {
      type: 'minigame',
      game: 'hydrant-match',
      challenge: (ctx) => hydrantMatchFor(circuits[ctx.ageBand], ctx),
      intro: [bea('The fuse board is numbered. Which one is the oven?')],
      outro: [rookie('Found it. That switch, right there!', 'excited')],
    },
    {
      type: 'minigame',
      game: 'hose-path',
      challenge: (ctx) => generateHosePath(inScene(ctx, 'pizza')),
      intro: [bea('Run the cable round the counter. Nothing across a doorway.')],
      outro: [npc(GINO, 'Tidy work. Nobody will trip on that.', 'Buen trabajo. Nadie se va a tropezar.', 'happy')],
    },
    {
      /* Fractions arrive because there is a queue, not because it is Tuesday. */
      type: 'minigame',
      game: 'pizza-fractions',
      challenge: (ctx) => {
        const plan = split[ctx.ageBand];
        return {
          ...generatePizzaFractions(ctx),
          toppings: plan.toppings,
          cutInto: plan.cutInto,
          shareAmong: plan.shareAmong,
          each: plan.cutInto / plan.shareAmong,
        };
      },
      intro: [npc(GINO, 'These four are cooked. Share them, please!', 'Estas cuatro ya están. ¡Repártelas, por favor!', 'excited')],
      outro: [bea('Every slice accounted for. Not one wasted.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'vocab-tap',
      bands: ['A'],
      challenge: (ctx) => vocabTapOnShelf('pot-and-pan', ctx),
      intro: [npc(GINO, 'Tap what I call for. Kitchen words!', 'Toca lo que pido. ¡Palabras de cocina!', 'happy')],
      outro: [radio('New kitchen words in your locker!')],
    },
    {
      type: 'minigame',
      game: 'listen-count',
      bands: ['B', 'C'],
      challenge: (ctx) => listenCountFor('mushroom', ctx),
      intro: [npc(GINO, 'Cuenta conmigo. How many champiñones on this one?', 'Cuenta conmigo. ¿Cuántos champiñones lleva ésta?', 'happy')],
      outro: [bea('Counted in Spanish, by torchlight.', 'proud')],
    },
    {
      type: 'minigame',
      game: 'spray-pattern',
      challenge: (ctx) => generateSprayPattern(ctx),
      intro: [bea('His floor tiles repeat. Which one is missing?')],
      outro: [rookie('The pattern told me. I did not guess!', 'proud')],
    },
    {
      type: 'scene',
      scene: 'rescue-complete',
      location: 'pizza',
      lines: [
        radio('Power back on the oven circuit. Lunch rush saved.'),
        bea('One dead oven, eleven fed people. Good afternoon.', 'proud'),
      ],
    },
    {
      type: 'dialogue',
      lines: [
        npc(GINO, '¡Gracias! Next time the pizza is on the house.', '¡Gracias! La próxima pizza va por la casa.', 'excited'),
        bea('Gracias means thank you. He always says it.', 'happy'),
      ],
    },
    { type: 'recap' },
  ],
};
