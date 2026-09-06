/**
 * RECIPES — the station kitchen.
 *
 * Safety (docs/ART_DIRECTION.md): anything hot or sharp is done by the crew.
 * Those recipes carry `grownUp: true` and say so out loud in Captain Bea's
 * intro, including the "ask a grown-up at home" line.
 */
import type { BadgeId, DialogueLine, RecipeDef, RecipeId } from './types';
import type { AgeBand, Challenge, GeneratorContext, VocabWord } from '@/learning/types';
import {
  generateClockWatch,
  generateCountIngredients,
  generateDivideShare,
  generateMarketMoney,
  generateMeasurePour,
  generatePizzaFractions,
  generateRecipeScale,
  generateSoupPot,
  generateWordBuilder,
} from '@/learning/generators';
import { wordById } from '@/learning/vocabulary';
import { foodWords } from '@/kitchen/food';

const bea = (text: string, es?: string): DialogueLine => ({
  speaker: 'bea',
  text,
  emotion: 'happy',
  ...(es ? { es } : {}),
});

/** Captain Bea calling through from the doorway, Spanish read out loud. */
const radio = (text: string, es?: string): DialogueLine => ({
  speaker: 'bea',
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

/** Band-picked shopping list, straight from the kitchen's own food bank. */
const countByBand = (
  lists: Record<AgeBand, { item: VocabWord; count: number }[]>,
  extras: VocabWord[],
) =>
  (ctx: GeneratorContext): Challenge => ({
    ...generateCountIngredients(ctx),
    needs: lists[ctx.ageBand],
    extras,
    spokenEs: true,
  });

/**
 * Spell the label that goes on the jar or the jug.
 *
 * `tiles` always holds every letter still to place, so the word can always be
 * finished — the same promise `generateWordBuilder` makes.
 */
const SPARE_LETTERS = 'ABCDEFGHIJLMNOPQRSTUVYZ'.split('');

const spell = (word: VocabWord, lang: 'en' | 'es', prefilled: number, distractors: number) =>
  (ctx: GeneratorContext): Challenge => {
    const letters = word[lang].toUpperCase().split('');
    const spare = SPARE_LETTERS.filter((l) => !letters.includes(l));
    return {
      ...generateWordBuilder(ctx),
      word,
      lang,
      letters,
      prefilled,
      tiles: ctx.rng.shuffle([...letters.slice(prefilled), ...ctx.rng.shuffle(spare).slice(0, distractors)]),
    };
  };

/** What goes in the pot, in the order it goes in. */
const potOf = (
  orders: Record<AgeBand, { item: VocabWord; count: number }[]>,
  extras: VocabWord[],
) =>
  (ctx: GeneratorContext): Challenge => {
    const steps = orders[ctx.ageBand];
    return {
      ...generateSoupPot(ctx),
      steps,
      extras,
      spokenEs: true,
      /* only the oldest crew adds the pot up at the end */
      ...(ctx.ageBand === 'C' ? { askTotal: steps.reduce((sum, s) => sum + s.count, 0) } : {}),
    };
  };

/**
 * The recipe book, in shelf order — which is also the ladder: `recipeCardState`
 * opens the next card along as each one is cooked. The three newest dishes are
 * interleaved rather than stacked on the end, so a child meets the pot, the
 * label and the market stall on the way through instead of after everything.
 */
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
        intro: [radio('Pour the flour to the line. Steady!')],
      },
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'egg', count: 2 }, { id: 'apple', count: 3 }], ['tomato', 'olive', 'mushroom']),
        intro: [bea('Two eggs, three apple slices. Read it twice.')],
      },
      {
        game: 'clock-watch',
        challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the pancakes are ready to flip' }),
        intro: [radio('Set the clock for flipping time.')],
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
        intro: [radio('Toppings first. Count them onto the board.')],
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
        intro: [radio('Listen: tomate, pimiento, aceituna.', 'Tomate, pimiento, aceituna.')],
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
        intro: [radio('Tres fresas, dos plátanos. Count them in!', 'Tres fresas y dos plátanos.')],
      },
      {
        game: 'measure-pour',
        challenge: measure('milk', 1, 2, 'cup'),
        intro: [bea('Half a cup of milk. Stop at the line.')],
      },
    ],
  },
  {
    id: 'veggie-caldo',
    name: 'Veggie Caldo',
    nameEs: 'Caldo de verduras',
    blurb: 'Water, then the vegetables in order, then the long slow simmer.',
    subjects: ['cooking', 'math', 'logic', 'spanish'],
    grownUp: true,
    xp: 30,
    intro: [
      bea('Rainy day! Rainy days are for caldo.'),
      bea('Caldo means broth. A whole pot of it.'),
      grownUpLine('hot pot'),
    ],
    steps: [
      {
        game: 'measure-pour',
        challenge: measureByBand('water', 'cup'),
        intro: [radio('Water goes in first. Stop at the line.')],
      },
      {
        /* The order IS the lesson: cebolla, zanahoria, papa — never the other way round. */
        game: 'soup-pot',
        challenge: potOf(
          {
            A: [
              { item: foodWords.onion, count: 1 },
              { item: foodWords.carrot, count: 2 },
              { item: foodWords.potato, count: 2 },
            ],
            B: [
              { item: foodWords.onion, count: 2 },
              { item: foodWords.carrot, count: 3 },
              { item: foodWords.potato, count: 2 },
              { item: foodWords.tomato, count: 2 },
            ],
            C: [
              { item: foodWords.onion, count: 2 },
              { item: foodWords.carrot, count: 3 },
              { item: foodWords.potato, count: 3 },
              { item: foodWords.tomato, count: 2 },
              { item: foodWords.lemon, count: 1 },
            ],
          },
          [foodWords.strawberry, foodWords.banana, foodWords.corn],
        ),
        intro: [radio('Cebolla, zanahoria, papa. Read the card twice!', 'Cebolla, zanahoria, papa.')],
      },
      {
        game: 'clock-watch',
        challenge: (ctx) => ({ ...generateClockWatch(ctx), event: 'the caldo has simmered long enough' }),
        intro: [bea('Now it simmers. Move the clock to dinner time.')],
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
        intro: [radio('Chop-ready veggies, please. Count them out.')],
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
        intro: [radio('Half a cup of water. Watch the line.')],
      },
      {
        game: 'count-ingredients',
        challenge: countThese([{ id: 'egg', count: 2 }, { id: 'olive', count: 4 }], ['apple', 'strawberry', 'mushroom'], true),
        intro: [{ speaker: 'npc', npcName: 'Rosa', text: 'Two eggs, four olives. ¡Gracias!', es: 'Dos huevos, cuatro aceitunas. ¡Gracias!', emotion: 'excited' }],
      },
    ],
  },
  {
    id: 'agua-fresca',
    name: 'Watermelon Agua Fresca',
    nameEs: 'Agua de sandía',
    blurb: 'Fruit, water and one word to spell on the label of the jug.',
    subjects: ['cooking', 'reading', 'spanish', 'math'],
    grownUp: true,
    xp: 25,
    intro: [
      bea('Agua fresca! Cold, pink, and gone by noon.'),
      grownUpLine('knife'),
    ],
    steps: [
      {
        game: 'count-ingredients',
        challenge: countByBand(
          {
            A: [
              { item: foodWords.watermelon, count: 3 },
              { item: foodWords.lemon, count: 2 },
            ],
            B: [
              { item: foodWords.watermelon, count: 4 },
              { item: foodWords.lemon, count: 2 },
              { item: foodWords.strawberry, count: 3 },
            ],
            C: [
              { item: foodWords.watermelon, count: 5 },
              { item: foodWords.lemon, count: 3 },
              { item: foodWords.strawberry, count: 4 },
            ],
          },
          [foodWords.tomato, foodWords.olive, foodWords.mushroom],
        ),
        intro: [radio('Sandía y limón. Count them onto the board!', 'Sandía y limón.')],
      },
      {
        game: 'measure-pour',
        challenge: measureByBand('water', 'cup'),
        intro: [bea('Water to the line. That fills the jug.')],
      },
      {
        /* Reading and spelling — the one thing no other recipe asks for. */
        game: 'word-builder',
        challenge: (ctx) =>
          ctx.ageBand === 'A'
            ? spell(wordById('water'), 'es', 1, 0)(ctx)
            : ctx.ageBand === 'B'
              ? spell(foodWords.lemon, 'en', 0, 1)(ctx)
              : spell(foodWords.strawberry, 'es', 0, 2)(ctx),
        intro: [bea('Now the label. Spell it, letter by letter.')],
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
        intro: [radio('Seis tortillas, cuatro quesos. Count them out!', 'Seis tortillas y cuatro quesos.')],
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
        intro: [radio('Two more friends arrived! Grow the recipe.')],
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
        intro: [radio('Fresas, uvas, naranjas. Read the card twice!', 'Fresas, uvas y naranjas.')],
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
        intro: [radio('Same number of berries in every bowl!')],
      },
    ],
  },
  {
    id: 'esquites',
    name: "Carmen's Corn Cups",
    nameEs: 'Esquites de la abuela Carmen',
    blurb: 'Buy the corn, count the limes, and share the cups out fairly.',
    subjects: ['cooking', 'math', 'spanish', 'teamwork'],
    grownUp: true,
    xp: 30,
    intro: [
      bea('Esquites! Carmen sells them by the cup.'),
      grownUpLine('hot pan'),
    ],
    steps: [
      {
        /* Money arrives in the kitchen: the shopping happens before the cooking. */
        game: 'market-money',
        challenge: (ctx) => ({ ...generateMarketMoney(ctx), item: foodWords.corn }),
        intro: [
          {
            speaker: 'npc',
            npcName: 'Abuela Carmen',
            text: 'Corn for the cups! Pay me exactly, please.',
            es: 'Elotes para los esquites. ¡Paga justo, por favor!',
            emotion: 'happy',
          },
        ],
      },
      {
        game: 'count-ingredients',
        challenge: countByBand(
          {
            A: [
              { item: foodWords.corn, count: 3 },
              { item: foodWords.lemon, count: 2 },
            ],
            B: [
              { item: foodWords.corn, count: 4 },
              { item: foodWords.lemon, count: 2 },
              { item: foodWords.onion, count: 2 },
            ],
            C: [
              { item: foodWords.corn, count: 5 },
              { item: foodWords.lemon, count: 3 },
              { item: foodWords.onion, count: 2 },
            ],
          },
          [foodWords.apple, foodWords.banana, foodWords.strawberry],
        ),
        intro: [radio('Elotes, limones, cebolla. Count them out!', 'Elotes, limones y cebolla.')],
      },
      {
        game: 'measure-pour',
        challenge: (ctx) =>
          ctx.ageBand === 'A' ? measure('butter', 1, 2, 'spoon')(ctx) : measure('butter', 1, 4, 'spoon')(ctx),
        intro: [bea('A spoon of butter. Watch the little line.')],
      },
      {
        game: 'divide-share',
        challenge: (ctx) => ({
          ...generateDivideShare(ctx),
          item: foodWords.corn,
          ...(ctx.ageBand === 'A' ? { total: 8, among: 2, each: 4 } : { total: 12, among: 4, each: 3 }),
        }),
        intro: [radio('Fill the cups. Everyone gets the same!')],
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
        intro: [radio('Cuatro limones, dos fresas. Count them in!', 'Cuatro limones y dos fresas.')],
      },
      {
        game: 'measure-pour',
        challenge: measureByBand('water', 'cup'),
        intro: [bea('Water to the line. That is the big one.')],
      },
      {
        game: 'measure-pour',
        challenge: measure('honey', 1, 4, 'spoon'),
        intro: [radio('One quarter of honey for every cup. That is the ratio!')],
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
        intro: [radio('A quarter cup of limón. Limón means lemon!', 'Limón.')],
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
 * Three recipes → Recipe Rescuer. Five → Kitchen Pro. The whole book → Chef de Station.
 */
export function badgesForRecipes(count: number): BadgeId[] {
  const out: BadgeId[] = [];
  if (count >= 3) out.push('recipe-rescuer');
  if (count >= 5) out.push('kitchen-pro');
  if (count >= recipes.length) out.push('chef-de-station');
  return out;
}
