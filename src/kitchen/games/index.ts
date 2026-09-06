/**
 * KITCHEN MINI-GAMES — merged into `@/minigames/registry`.
 * `meta.yard: 'kitchen'` puts them in the Firehouse Kitchen rather than the
 * Training Yard. Icon ids match the glyphs in `@/ui/kit/VocabIcon`.
 */
import type { Registry } from '@/minigames/registry';
import { PizzaFractions } from './PizzaFractions/PizzaFractions';
import { MeasurePour } from './MeasurePour/MeasurePour';
import { CountIngredients } from './CountIngredients/CountIngredients';
import { DivideShare } from './DivideShare/DivideShare';
import { RecipeScale } from './RecipeScale/RecipeScale';
import { SoupPot } from './SoupPot/SoupPot';

export const kitchenGames: Registry = {
  'pizza-fractions': {
    component: PizzaFractions,
    meta: {
      kind: 'pizza-fractions',
      title: 'Pizza Fractions',
      titleEs: 'Pizza de Fracciones',
      blurb: 'Top it, cut it, share it — halves and quarters you can taste.',
      subjects: ['math', 'cooking'],
      yard: 'kitchen',
      seconds: 180,
      icon: 'pizza',
    },
  },
  'measure-pour': {
    component: MeasurePour,
    meta: {
      kind: 'measure-pour',
      title: 'Measure & Pour',
      titleEs: 'Mide y Vierte',
      blurb: 'Tip the jug and fill the cup to exactly the right line.',
      subjects: ['math', 'cooking', 'spanish'],
      yard: 'kitchen',
      seconds: 90,
      icon: 'milk',
    },
  },
  'count-ingredients': {
    component: CountIngredients,
    meta: {
      kind: 'count-ingredients',
      title: 'Count Ingredients',
      titleEs: 'Cuenta los Ingredientes',
      blurb: 'Captain Bea reads the list in Spanish — grab exactly what she asks for.',
      subjects: ['math', 'spanish', 'cooking'],
      yard: 'kitchen',
      seconds: 110,
      icon: 'strawberry',
    },
  },
  'divide-share': {
    component: DivideShare,
    meta: {
      kind: 'divide-share',
      title: 'Divide & Share',
      titleEs: 'Divide y Comparte',
      blurb: 'Share the food so every firefighter gets the same.',
      subjects: ['math', 'teamwork', 'cooking'],
      yard: 'kitchen',
      seconds: 100,
      icon: 'taco',
    },
  },
  'recipe-scale': {
    component: RecipeScale,
    meta: {
      kind: 'recipe-scale',
      title: 'Recipe Scale',
      titleEs: 'Ajusta la Receta',
      blurb: 'More mouths to feed! Grow the recipe to match the crew.',
      subjects: ['math', 'logic', 'cooking'],
      yard: 'kitchen',
      seconds: 120,
      icon: 'soup',
    },
  },
  'soup-pot': {
    component: SoupPot,
    meta: {
      kind: 'soup-pot',
      title: 'Soup Pot',
      titleEs: 'La Olla',
      blurb: 'First the onions, then the potatoes — put the caldo together in order.',
      subjects: ['logic', 'math', 'spanish', 'cooking'],
      yard: 'kitchen',
      seconds: 130,
      icon: 'carrot',
    },
  },
};
