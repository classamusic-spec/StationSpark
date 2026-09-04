/**
 * Kitchen food bank: the Spanish vocabulary the room teaches plus the colours
 * each pizza topping is drawn in. Pure data — no React.
 *
 * `id` values match the glyph ids in `@/ui/kit/VocabIcon` so the icon always
 * has real art (it is an emoji stub today, SVG later, same props).
 */
import type { ToppingId, VocabWord } from '@/learning/types';

const food = (id: string, en: string, es: string, icon: string): VocabWord => ({ id, en, es, icon, category: 'food' });

/** tomate · queso · leche · agua · manzana · pan · huevo · harina · mantequilla · fresa · plátano · champiñón · pimiento · aceituna */
export const foodWords = {
  tomato: food('tomato', 'tomato', 'tomate', '🍅'),
  cheese: food('cheese', 'cheese', 'queso', '🧀'),
  milk: food('milk', 'milk', 'leche', '🥛'),
  water: food('water', 'water', 'agua', '💧'),
  apple: food('apple', 'apple', 'manzana', '🍎'),
  bread: food('bread', 'bread', 'pan', '🍞'),
  egg: food('egg', 'egg', 'huevo', '🥚'),
  flour: food('flour', 'flour', 'harina', '🌾'),
  butter: food('butter', 'butter', 'mantequilla', '🧈'),
  sugar: food('sugar', 'sugar', 'azúcar', '🍬'),
  strawberry: food('strawberry', 'strawberry', 'fresa', '🍓'),
  banana: food('banana', 'banana', 'plátano', '🍌'),
  mushroom: food('mushroom', 'mushroom', 'champiñón', '🍄'),
  pepper: food('pepper', 'bell pepper', 'pimiento', '🫑'),
  olive: food('olive', 'olive', 'aceituna', '🫒'),
  basil: food('basil', 'basil', 'albahaca', '🌿'),
  taco: food('taco', 'taco', 'taco', '🌮'),
  pizza: food('pizza', 'pizza', 'pizza', '🍕'),
  soup: food('soup', 'soup', 'sopa', '🍲'),
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
  /** English + Spanish name (Beacon says the Spanish one when it is picked up) */
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
export const recipeGlyph: Record<string, string> = {
  pancakes: 'bread',
  pizza: 'pizza',
  tacos: 'taco',
  smoothie: 'strawberry',
  soup: 'soup',
  bread: 'bread',
};
