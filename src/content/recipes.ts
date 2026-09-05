/**
 * RECIPES — the station kitchen.
 *
 * Safety (docs/ART_DIRECTION.md): anything hot or sharp is done by the crew.
 * Those recipes carry `grownUp: true` and say so out loud in Captain Bea's
 * intro, including the "ask a grown-up at home" line.
 */
import type { BadgeId, DialogueLine, RecipeDef, RecipeId } from './types';
import type { Challenge, GeneratorContext } from '@/learning/types';
import {
  generateClockWatch,
  generateCountIngredients,
  generateDivideShare,
  generateMeasurePour,
  generatePizzaFractions,
  generateRecipeScale,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';

const bea = (text: string, es?: string): DialogueLine => ({
  speaker: 'bea',
  text,
  emotion: 'happy',
  ...(es ? { es } : {}),
});

const beacon = (text: string, es?: string): DialogueLine => ({
  speaker: 'beacon',
  text,
  emotion: 'excited',
  ...(es ? { es } : {}),
});

/** The crew-handles-the-hot-bit line. Every heat/knife recipe opens with it. */
const grownUpLine = (what: string): DialogueLine =>
  bea(`The crew handles the ${what}. At home, ask a grown-up!`);

const measure = (ingredient: string, num: number, den: number, unit: 'cup' | 'spoon') =>
  (ctx: GeneratorContext): Challenge => ({
    ...generateMeasurePour(ctx),
    ingredient: wordById(ingredient),
    unit,
    target: { num, den },
    ticks: den === 2 ? 2 : 4,
    step: { num: 1, den: den === 2 ? 2 : 4 },
  });

/** Band-aware amount: A pours halves, B and C pour quarters. */
const measureByBand = (ingredient: string, unit: 'cup' | 'spoon') =>
  (ctx: GeneratorContext): Challenge =>
    ctx.ageBand === 'A'
      ? measure(ingredient, 1, 2, unit)(ctx)
      : measure(ingredient, ctx.ageBand === 'B' ? 3 : 5, 4, unit)(ctx);

const countThese = (needs: { id: string; count: number }[], extras: string[], spokenEs = false) =>
  (ctx: GeneratorContext): Challenge => ({
    ...generateCountIngredients(ctx),
    needs: needs.map((n) => ({ item: wordById(n.id), count: n.count })),
    extras: extras.map(wordById),
    spokenEs,
  });

export const recipes: RecipeDef[] = [
  {
    id: 'pancakes',
    name: 'Sunday Pancakes',
    nameEs: 'Panqueques del domingo',
    blurb: 'Fluffy stacks for the whole crew — measure, count, and watch the clock.',
    subjects: ['cooking', 'math'],
    grownUp: true,
    xp: 20,
    intro: [
      bea('Pancake morning! Aprons on, everyone.'),
      grownUpLine('hot pan'),
    ],
    steps: [
      {
        game: 'measure-pour',
        challenge: measureByBand('flour', 'cup'),
        intro: [beacon('Pour the flour to the line. Steady!')],
      },
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'egg', count: 2 }, { id: 'apple', count: 3 }], ['tomato', 'olive', 'mushroom']),
        intro: [bea('Two eggs, three apple slices. Read it twice.')],
      },
      {
        game: 'clock-watch',
        challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the pancakes are ready to flip' }),
        intro: [beacon('Beep! Set the clock for flipping time.')],
      },
    ],
  },
  {
    id: 'pizza',
    name: "Gino's Pizza",
    nameEs: 'La pizza de Gino',
    blurb: 'Half cheese, a quarter mushroom, a quarter pepper — then share it out.',
    subjects: ['cooking', 'math'],
    grownUp: true,
    xp: 25,
    intro: [
      bea('Gino taught us this one. Half, quarter, quarter!'),
      grownUpLine('hot oven'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'mushroom', count: 4 }, { id: 'pepper', count: 3 }], ['olive', 'strawberry', 'banana']),
        intro: [beacon('Toppings first. Count them onto the board.')],
      },
      {
        game: 'pizza-fractions',
        challenge: (ctx) => {
          const base = generatePizzaFractions(ctx);
          if (ctx.ageBand === 'A') {
            return {
              ...base,
              toppings: [
                { topping: 'cheese' as const, fraction: { num: 1, den: 2 } },
                { topping: 'tomato' as const, fraction: { num: 1, den: 2 } },
              ],
              cutInto: 4,
              shareAmong: 2,
              each: 2,
            };
          }
          return {
            ...base,
            toppings: [
              { topping: 'cheese' as const, fraction: { num: 1, den: 2 } },
              { topping: 'mushroom' as const, fraction: { num: 1, den: 4 } },
              { topping: 'pepper' as const, fraction: { num: 1, den: 4 } },
            ],
            cutInto: 8,
            shareAmong: 4,
            each: 2,
          };
        },
        intro: [bea('Half cheese. Quarter mushroom. Quarter pepper.')],
      },
    ],
  },
  {
    id: 'tacos',
    name: 'Station Tacos',
    nameEs: 'Tacos del cuartel',
    blurb: 'Twelve tacos, four hungry firefighters. How many each?',
    subjects: ['cooking', 'math', 'spanish'],
    grownUp: true,
    xp: 25,
    intro: [
      bea('Taco night! Everyone gets the same, always.'),
      grownUpLine('hot pan and the knife'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'tomato', count: 4 }, { id: 'pepper', count: 2 }, { id: 'olive', count: 3 }], ['apple', 'banana', 'mushroom'], true),
        intro: [beacon('Beacon translating: tomate, pimiento, aceituna.', 'Tomate, pimiento, aceituna.')],
      },
      {
        game: 'divide-share',
        challenge: (ctx) => ({
          ...generateDivideShare(ctx),
          item: wordById('taco'),
          total: 12,
          among: 4,
          each: 3,
        }),
        intro: [bea('Twelve tacos. Four plates. Fair shares!')],
      },
    ],
  },
  {
    id: 'smoothie',
    name: 'Sunrise Smoothie',
    nameEs: 'Licuado del amanecer',
    blurb: 'Three strawberries, two bananas and half a cup of milk. Whizz!',
    subjects: ['cooking', 'math', 'spanish'],
    grownUp: true,
    xp: 20,
    intro: [
      bea('Cold and pink and perfect after a shift.'),
      grownUpLine('blender'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'strawberry', count: 3 }, { id: 'banana', count: 2 }], ['apple', 'tomato', 'olive'], true),
        intro: [beacon('Tres fresas, dos plátanos. Count them in!', 'Tres fresas y dos plátanos.')],
      },
      {
        game: 'measure-pour',
        challenge: measure('milk', 1, 2, 'cup'),
        intro: [bea('Half a cup of milk. Stop at the line.')],
      },
    ],
  },
  {
    id: 'soup',
    name: 'Big Pot Soup',
    nameEs: 'Sopa de olla',
    blurb: 'Made for four… but six are coming. Grow the recipe!',
    subjects: ['cooking', 'math'],
    grownUp: true,
    xp: 30,
    intro: [
      bea('Soup for four. Wait — six neighbours are coming!'),
      grownUpLine('hot pot'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'tomato', count: 5 }, { id: 'mushroom', count: 4 }], ['strawberry', 'banana', 'apple']),
        intro: [beacon('Chop-ready veggies, please. Count them out.')],
      },
      {
        game: 'measure-pour',
        challenge: measure('water', 3, 4, 'cup'),
        bands: ['A', 'B'],
        intro: [bea('Three quarters of water in the pot.')],
      },
      {
        game: 'recipe-scale',
        challenge: (ctx) => ({
          ...generateRecipeScale(ctx),
          serves: 4,
          eating: 6,
          lines: [
            { item: wordById('tomato'), amount: 4, scaled: 6 },
            { item: wordById('mushroom'), amount: 6, scaled: 9 },
            { item: wordById('pepper'), amount: 2, scaled: 3 },
          ],
        }),
        bands: ['C'],
        intro: [bea('Four becomes six. Every amount grows by half.')],
      },
    ],
  },
  {
    id: 'bread',
    name: "Rosa's Bread",
    nameEs: 'El pan de Rosa',
    blurb: 'The bakery recipe, shared with the station. Measure, count, wait.',
    subjects: ['cooking', 'math', 'spanish'],
    grownUp: true,
    xp: 25,
    intro: [
      bea('Rosa lent us her recipe. Treat it kindly!'),
      grownUpLine('hot oven'),
    ],
    steps: [
      {
        game: 'measure-pour',
        challenge: measureByBand('flour', 'cup'),
        intro: [{ speaker: 'npc', npcName: 'Rosa', text: 'Flour first, always. ¡Con calma!', es: 'Primero la harina. ¡Con calma!', emotion: 'happy' }],
      },
      {
        game: 'measure-pour',
        challenge: measure('water', 1, 2, 'cup'),
        intro: [beacon('Half a cup of water. Watch the line.')],
      },
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'egg', count: 2 }, { id: 'olive', count: 4 }], ['apple', 'strawberry', 'mushroom'], true),
        intro: [{ speaker: 'npc', npcName: 'Rosa', text: 'Two eggs, four olives. ¡Gracias!', es: 'Dos huevos, cuatro aceitunas. ¡Gracias!', emotion: 'excited' }],
      },
    ],
  },
  {
    id: 'quesadillas',
    name: 'Capitana Sofía’s Quesadillas',
    nameEs: 'Las quesadillas de la capitana Sofía',
    blurb: 'Tortilla, queso, hot pan, fair shares. The visiting crew’s favourite.',
    subjects: ['cooking', 'math', 'spanish'],
    grownUp: true,
    xp: 25,
    intro: [
      bea('Sofía’s recipe. Say the words as we cook!'),
      grownUpLine('hot pan'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'tortilla', count: 6 }, { id: 'cheese', count: 4 }, { id: 'pepper', count: 2 }], ['tomato', 'olive', 'mushroom'], true),
        intro: [beacon('Seis tortillas, cuatro quesos. Count them out!', 'Seis tortillas y cuatro quesos.')],
      },
      {
        game: 'divide-share',
        challenge: (ctx) => ({
          ...generateDivideShare(ctx),
          item: wordById('quesadilla'),
          ...(ctx.ageBand === 'A' ? { total: 8, among: 2, each: 4 } : { total: 12, among: 4, each: 3 }),
        }),
        intro: [bea('Everybody gets the same. Share them out.')],
      },
      {
        game: 'recipe-scale',
        bands: ['C'],
        challenge: (ctx) => ({
          ...generateRecipeScale(ctx),
          serves: 4,
          eating: 6,
          lines: [
            { item: wordById('tortilla'), amount: 4, scaled: 6 },
            { item: wordById('cheese'), amount: 2, scaled: 3 },
            { item: wordById('onion'), amount: 2, scaled: 3 },
          ],
        }),
        intro: [beacon('Two more friends arrived! Grow the recipe.')],
      },
    ],
  },
  {
    id: 'fruit-salad',
    name: 'Rainbow Fruit Salad',
    nameEs: 'Ensalada de frutas',
    blurb: 'Every colour in one bowl — count it, pour it, then share it out.',
    subjects: ['cooking', 'math', 'spanish'],
    grownUp: true,
    xp: 20,
    intro: [
      bea('A bowl of every colour. Sounds like our crew!'),
      grownUpLine('knife'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: (ctx) => ({
          ...generateCountIngredients(ctx),
          needs:
            ctx.ageBand === 'A'
              ? [{ item: wordById('strawberry'), count: 3 }, { item: wordById('banana'), count: 2 }]
              : [
                  { item: wordById('strawberry'), count: 4 },
                  { item: wordById('grape'), count: 6 },
                  { item: wordById('orange-fruit'), count: 2 },
                ],
          extras: [wordById('tomato'), wordById('olive'), wordById('mushroom')],
          spokenEs: true,
        }),
        intro: [beacon('Fresas, uvas, naranjas. Read the card twice!', 'Fresas, uvas y naranjas.')],
      },
      {
        game: 'measure-pour',
        challenge: measureByBand('juice', 'cup'),
        intro: [bea('Pour the juice to the line. Nice and slow.')],
      },
      {
        game: 'divide-share',
        challenge: (ctx) => ({
          ...generateDivideShare(ctx),
          item: wordById('strawberry'),
          ...(ctx.ageBand === 'A' ? { total: 8, among: 2, each: 4 } : { total: 12, among: 4, each: 3 }),
        }),
        intro: [beacon('Same number of berries in every bowl!')],
      },
    ],
  },
  {
    id: 'lemonade',
    name: 'Spark Lemonade',
    nameEs: 'Limonada Spark',
    blurb: 'One cup of water to one quarter of honey. Taste, then make more!',
    subjects: ['cooking', 'math', 'spanish'],
    grownUp: true,
    xp: 20,
    intro: [
      bea('Hot shift, cold lemonade. Measure carefully!'),
      grownUpLine('knife'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'lemon', count: 4 }, { id: 'strawberry', count: 2 }], ['apple', 'banana', 'olive'], true),
        intro: [beacon('Cuatro limones, dos fresas. Count them in!', 'Cuatro limones y dos fresas.')],
      },
      {
        game: 'measure-pour',
        challenge: measureByBand('water', 'cup'),
        intro: [bea('Water to the line. That is the big one.')],
      },
      {
        game: 'measure-pour',
        challenge: measure('honey', 1, 4, 'spoon'),
        intro: [beacon('One quarter of honey for every cup. That is the ratio!')],
      },
      {
        game: 'recipe-scale',
        bands: ['C'],
        challenge: (ctx) => ({
          ...generateRecipeScale(ctx),
          serves: 4,
          eating: 6,
          lines: [
            { item: wordById('lemon'), amount: 4, scaled: 6 },
            { item: wordById('strawberry'), amount: 2, scaled: 3 },
            { item: wordById('grape'), amount: 6, scaled: 9 },
          ],
        }),
        intro: [bea('The whole station is thirsty. Grow it by half.')],
      },
    ],
  },
  {
    id: 'garden-salsa',
    name: 'Garden Salsa',
    nameEs: 'Salsa de la huerta',
    blurb: 'Tomate, cebolla, cilantro, limón — Abuela Carmen’s market salsa.',
    subjects: ['cooking', 'math', 'spanish'],
    grownUp: true,
    xp: 25,
    intro: [
      bea('Carmen’s salsa. Four words, four ingredients.'),
      grownUpLine('knife'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: (ctx) => ({
          ...generateCountIngredients(ctx),
          needs:
            ctx.ageBand === 'A'
              ? [{ item: wordById('tomato'), count: 3 }, { item: wordById('onion'), count: 1 }]
              : ctx.ageBand === 'B'
                ? [
                    { item: wordById('tomato'), count: 4 },
                    { item: wordById('onion'), count: 2 },
                    { item: wordById('cilantro'), count: 1 },
                  ]
                : [
                    { item: wordById('tomato'), count: 5 },
                    { item: wordById('onion'), count: 2 },
                    { item: wordById('cilantro'), count: 3 },
                  ],
          extras: [wordById('apple'), wordById('banana'), wordById('strawberry')],
          spokenEs: true,
        }),
        intro: [
          {
            speaker: 'npc',
            npcName: 'Abuela Carmen',
            text: 'Tomate, cebolla, cilantro. Say them with me!',
            es: 'Tomate, cebolla, cilantro. ¡Díganlos conmigo!',
            emotion: 'happy',
          },
        ],
      },
      {
        game: 'measure-pour',
        challenge: measure('lemon', 1, 4, 'cup'),
        intro: [beacon('A quarter cup of limón. Limón means lemon!', 'Limón.')],
      },
      {
        game: 'measure-pour',
        bands: ['B', 'C'],
        challenge: measure('salt', 1, 2, 'spoon'),
        intro: [bea('Half a spoon of salt. Taste it after.')],
      },
    ],
  },
];

const recipeMap = new Map(recipes.map((r) => [r.id, r]));

export function recipeById(id: RecipeId): RecipeDef | undefined {
  return recipeMap.get(id);
}

/**
 * Badges for having cooked `count` different recipes.
 * Three recipes → Recipe Rescuer. Five → Kitchen Pro. All ten → Chef de Station.
 */
export function badgesForRecipes(count: number): BadgeId[] {
  const out: BadgeId[] = [];
  if (count >= 3) out.push('recipe-rescuer');
  if (count >= 5) out.push('kitchen-pro');
  if (count >= recipes.length) out.push('chef-de-station');
  return out;
}
