/**
 * Kitchen food bank: the Spanish vocabulary the room teaches plus the colours
 * each pizza topping is drawn in. Pure data — no React.
 *
 * `icon` values are ids on the `@/ui/kit/VocabIcon` sheet — render the word with
 * `<VocabIcon id={word.icon} />` and it is drawn art, never an emoji
 * (art critique item #21: emoji are banned from the world layer).
 */
import type { ToppingId, VocabWord } from '@/learning/types';
import type { RecipeId } from '@/content/types';
import type { VocabIconId } from '@/ui/kit/VocabIcon';

const food = (id: string, en: string, es: string, icon: string): VocabWord => ({ id, en, es, icon, category: 'food' });

/**
 * tomate · queso · leche · agua · manzana · pan · huevo · harina · mantequilla ·
 * fresa · plátano · champiñón · pimiento · aceituna
 * …and the market half of the room: cebolla · zanahoria · papa · maíz · sandía ·
 * limón · uva · cilantro · arroz · sal · miel · jugo · tortilla
 */
export const foodWords = {
  tomato: food('tomato', 'tomato', 'tomate', 'tomato'),
  cheese: food('cheese', 'cheese', 'queso', 'cheese'),
  milk: food('milk', 'milk', 'leche', 'milk'),
  water: food('water', 'water', 'agua', 'water'),
  apple: food('apple', 'apple', 'manzana', 'apple'),
  bread: food('bread', 'bread', 'pan', 'bread'),
  egg: food('egg', 'egg', 'huevo', 'egg'),
  flour: food('flour', 'flour', 'harina', 'flour'),
  butter: food('butter', 'butter', 'mantequilla', 'butter'),
  sugar: food('sugar', 'sugar', 'azúcar', 'sugar'),
  strawberry: food('strawberry', 'strawberry', 'fresa', 'strawberry'),
  banana: food('banana', 'banana', 'plátano', 'banana'),
  mushroom: food('mushroom', 'mushroom', 'champiñón', 'mushroom'),
  pepper: food('pepper', 'bell pepper', 'pimiento', 'pepper'),
  olive: food('olive', 'olive', 'aceituna', 'olive'),
  basil: food('basil', 'basil', 'albahaca', 'basil'),
  taco: food('taco', 'taco', 'taco', 'taco'),
  pizza: food('pizza', 'pizza', 'pizza', 'pizza'),
  soup: food('soup', 'soup', 'sopa', 'soup'),
  /* ---- the pot, the jug and the market stall ---- */
  onion: food('onion', 'onion', 'cebolla', 'onion'),
  carrot: food('carrot', 'carrot', 'zanahoria', 'carrot'),
  potato: food('potato', 'potato', 'papa', 'potato'),
  /**
   * The kitchen counts cobs, not grains: "tres elotes", never "tres maíces".
   * The id stays `corn` because that is the drawn icon and the id every game
   * looks the picture up by; `maíz` (the grain) still lives in the word bank.
   */
  corn: food('corn', 'corn cob', 'elote', 'corn'),
  rice: food('rice', 'rice', 'arroz', 'rice'),
  lemon: food('lemon', 'lemon', 'limón', 'lemon'),
  grape: food('grape', 'grape', 'uva', 'grape'),
  watermelon: food('watermelon', 'watermelon', 'sandía', 'watermelon'),
  cilantro: food('cilantro', 'cilantro', 'cilantro', 'cilantro'),
  salt: food('salt', 'salt', 'sal', 'salt'),
  honey: food('honey', 'honey', 'miel', 'honey'),
  juice: food('juice', 'juice', 'jugo', 'juice'),
  tortilla: food('tortilla', 'tortilla', 'tortilla', 'tortilla'),
} as const satisfies Record<string, VocabWord>;

export type FoodId = keyof typeof foodWords;

export const foodList: VocabWord[] = Object.values(foodWords);

export function foodById(id: string): VocabWord {
  return foodList.find((w) => w.id === id) ?? foodWords.bread;
}

/* ------------------------------------------------------------------ */
/* Pizza toppings                                                       */
/* ------------------------------------------------------------------ */

export interface ToppingLook {
  /** English + Spanish name (Captain Bea says the Spanish one when it is picked up) */
  word: VocabWord;
  /** main fill of the little scattered shapes */
  fill: string;
  /** darker shade tone (stickers, not lines) */
  shade: string;
  /** wedge tint under the scatter, and the colour of this topping in the pie indicator */
  tint: string;
  /** shape of one scattered piece */
  shape: 'shred' | 'round' | 'ring' | 'cap' | 'arc' | 'leaf';
}

export const toppings: Record<ToppingId, ToppingLook> = {
  cheese: { word: foodWords.cheese, fill: '#FFDF7A', shade: '#F0C24A', tint: '#FFE9A8', shape: 'shred' },
  tomato: { word: foodWords.tomato, fill: '#F0483A', shade: '#C9291D', tint: '#FFC9C2', shape: 'round' },
  pepper: { word: foodWords.pepper, fill: '#5CC94F', shade: '#3E9C36', tint: '#CDEFC6', shape: 'arc' },
  mushroom: { word: foodWords.mushroom, fill: '#F3E4CE', shade: '#C9AE8E', tint: '#F0E2CC', shape: 'cap' },
  olive: { word: foodWords.olive, fill: '#2F3550', shade: '#1B2036', tint: '#C6C9D8', shape: 'ring' },
  basil: { word: foodWords.basil, fill: '#3FA85A', shade: '#2C7B41', tint: '#C6E8CF', shape: 'leaf' },
};

export const toppingLabel = (id: ToppingId): string => {
  const en = toppings[id].word.en;
  return en.charAt(0).toUpperCase() + en.slice(1);
};

/** Which sticker stands in for a finished dish on the dinner table. */
/**
 * The picture on a recipe's card in the Kitchen.
 *
 * EXHAUSTIVE, AND TYPED TO THE ICON SHEET, on purpose. This was
 * `Record<string, string>` read through a `?? 'soup'` fallback, so eleven of
 * the twenty-four dishes — every one added after the map was written — quietly
 * drew the same bowl of soup, and nothing anywhere said so. Keying it to
 * `RecipeId` means the next dish will not compile until it has been given a
 * face; typing the value to `VocabIconId` means a typo cannot reach the shelf.
 *
 * Where the sheet has no true match the choice is the dish's *signature* rather
 * than its base — bibimbap by the egg on top, arroz con leche by the milk —
 * because at 56 px a third identical bowl of rice tells a child nothing.
 */
export const recipeGlyph: Record<RecipeId, VocabIconId> = {
  pancakes: 'bread',
  pizza: 'pizza',
  'garden-pizza': 'pizza',
  tacos: 'taco',
  smoothie: 'strawberry',
  soup: 'soup',
  bread: 'bread',
  'banana-bread': 'banana',
  quesadillas: 'quesadilla',
  'fruit-salad': 'grape',
  lemonade: 'lemon',
  'garden-salsa': 'tomato',
  'veggie-caldo': 'carrot',
  'frijoles-de-olla': 'beans',
  'arroz-con-leche': 'milk',
  'agua-fresca': 'watermelon',
  paletas: 'strawberry',
  esquites: 'corn',
  'tres-leches': 'cake',
  sopes: 'tortilla',
  arepas: 'bread',
  onigiri: 'rice',
  minestrone: 'soup',
  bibimbap: 'egg',
};
