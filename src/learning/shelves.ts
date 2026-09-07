/**
 * VOCABULARY SHELVES — a coherent handful of words, not the whole bank.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `randomWords()` reaches into 320-odd words and pulls out whatever it finds.
 * That is fine for a warm-up, but it is not how a mission wants to teach: a
 * crew that has just tied up at the harbour should be asked about *harbour*
 * words, and the four pictures on the board should all belong to the same
 * afternoon. A shelf is that handful — a small, named, hand-picked set a
 * mission beat can point at.
 *
 * THE PROMISE EVERY SHELF MAKES
 * -----------------------------
 * **No two words on one shelf are drawn the same.** The icon sheet is smaller
 * than the word bank, so several words share a picture on purpose (pera and
 * durazno both borrow the apple, ajo borrows the onion). On a Word Tap tile
 * that is survivable — the word is printed underneath — but on a Count
 * Ingredients shelf or a Soup Pot counter a child picks by picture alone, and
 * two identical pictures is not a hard question, it is an unanswerable one.
 *
 * So every shelf below is icon-distinct, and `shelves.test.ts` proves it for
 * all of them. That single rule is what makes a shelf safe to hand to ANY
 * game, which is the whole point of having them.
 *
 * There is deliberately no shelf of numbers: only `one`, `two` and `three` have
 * drawn digits, and everything from `four` up borrows the number-ladder rung,
 * so a numbers shelf could never keep the promise.
 */
import type { Rng } from '@/utils/rng';
import type { VocabWord } from './types';
import { hasWord, wordById } from './vocabulary';

export type ShelfId =
  | 'station-kit'
  | 'truck-cab'
  | 'market-stall'
  | 'bakery-counter'
  | 'pot-and-pan'
  | 'fruit-basket'
  | 'town-places'
  | 'by-the-water'
  | 'harbour'
  | 'farm-animals'
  | 'pets'
  | 'weather'
  | 'storm-day'
  | 'feelings'
  | 'helpers'
  | 'directions'
  | 'colours'
  | 'music-and-parade'
  | 'party'
  | 'growing-things'
  | 'reading-corner'
  | 'sports-day';

export interface VocabShelf {
  id: ShelfId;
  /** what a grown-up would call this shelf */
  label: string;
  labelEs: string;
  /** vocabulary ids, in the order a mission would hand them out */
  words: readonly string[];
}

export const shelves: readonly VocabShelf[] = [
  {
    id: 'station-kit',
    label: 'The station kit',
    labelEs: 'El equipo de la estación',
    words: ['hose', 'ladder', 'helmet', 'boots', 'radio', 'hydrant', 'extinguisher', 'first-aid', 'gloves', 'whistle'],
  },
  {
    id: 'truck-cab',
    label: 'On the truck',
    labelEs: 'En el camión',
    words: ['fire-truck', 'siren', 'flag', 'toolbox', 'rope', 'bucket', 'flashlight', 'uniform', 'stretcher'],
  },
  {
    id: 'market-stall',
    label: "Carmen's stall",
    labelEs: 'El puesto de Carmen',
    words: ['tomato', 'onion', 'carrot', 'potato', 'lemon', 'corn', 'lettuce', 'grape', 'cilantro'],
  },
  {
    id: 'bakery-counter',
    label: 'The bakery counter',
    labelEs: 'El mostrador de la panadería',
    words: ['bread', 'cake', 'flour', 'butter', 'sugar', 'egg', 'milk', 'honey', 'cinnamon'],
  },
  {
    id: 'pot-and-pan',
    label: 'What goes in the pot',
    labelEs: 'Lo que va en la olla',
    words: ['rice', 'beans', 'soup', 'salt', 'pepper', 'mushroom', 'olive', 'spinach', 'celery'],
  },
  {
    id: 'fruit-basket',
    label: 'The fruit basket',
    labelEs: 'La canasta de fruta',
    words: ['apple', 'banana', 'strawberry', 'watermelon', 'grape', 'lemon'],
  },
  {
    id: 'town-places',
    label: 'Around Spark City',
    labelEs: 'Por Spark City',
    words: ['bakery', 'school', 'library', 'park', 'market', 'museum', 'hospital', 'train-station', 'store'],
  },
  {
    id: 'by-the-water',
    label: 'Down by the water',
    labelEs: 'Junto al agua',
    words: ['beach', 'river', 'pond', 'fish', 'turtle', 'crab', 'seagull'],
  },
  {
    id: 'harbour',
    label: 'The harbour',
    labelEs: 'El puerto',
    words: ['boat', 'harbour', 'net', 'anchor', 'sailor', 'seagull', 'crab'],
  },
  {
    id: 'farm-animals',
    label: "Don Nico's farm",
    labelEs: 'La granja de Don Nico',
    words: ['cow', 'sheep', 'pig', 'horse', 'chicken', 'mouse'],
  },
  {
    id: 'pets',
    label: 'The pet shop',
    labelEs: 'La tienda de mascotas',
    words: ['cat', 'dog', 'bunny', 'duck', 'turtle', 'parrot', 'lizard'],
  },
  {
    id: 'weather',
    label: 'Out of the window',
    labelEs: 'Por la ventana',
    words: ['sun', 'cloud', 'rain', 'snow', 'wind', 'storm', 'moon'],
  },
  {
    id: 'storm-day',
    label: 'The night the lights went out',
    labelEs: 'La noche sin luz',
    words: ['storm', 'wind', 'snow', 'rain', 'cold', 'blanket', 'candle', 'hot'],
  },
  {
    id: 'feelings',
    label: 'How the crew feels',
    labelEs: 'Cómo se siente el equipo',
    words: ['happy', 'sad', 'scared', 'proud', 'tired', 'excited', 'calm', 'brave'],
  },
  {
    id: 'helpers',
    label: 'People who help',
    labelEs: 'Gente que ayuda',
    words: ['firefighter', 'nurse', 'police', 'farmer', 'cook', 'vet', 'gardener', 'teacher', 'sailor'],
  },
  {
    id: 'directions',
    label: 'Which way?',
    labelEs: '¿Por dónde?',
    words: ['left', 'right', 'up', 'down', 'north', 'south', 'east', 'west', 'stop'],
  },
  {
    id: 'colours',
    label: 'Every colour',
    labelEs: 'Todos los colores',
    words: ['red', 'blue', 'yellow', 'green', 'black', 'pink', 'purple', 'white', 'brown', 'grey'],
  },
  {
    id: 'music-and-parade',
    label: 'The band on the bandstand',
    labelEs: 'La banda en el quiosco',
    words: ['drum', 'guitar', 'trumpet', 'song', 'flag', 'festival', 'dance'],
  },
  {
    id: 'party',
    label: 'A birthday at the bakery',
    labelEs: 'Un cumpleaños en la panadería',
    words: ['cake', 'candle', 'gift', 'festival', 'guitar', 'crowd'],
  },
  {
    id: 'growing-things',
    label: 'The community garden',
    labelEs: 'El huerto del barrio',
    words: ['garden', 'tree', 'flower', 'watering-can', 'shovel', 'bee', 'carrot', 'lettuce'],
  },
  {
    id: 'reading-corner',
    label: 'The reading corner',
    labelEs: 'El rincón de lectura',
    words: ['book', 'story', 'quiet', 'museum', 'write', 'sing'],
  },
  {
    id: 'sports-day',
    label: 'Sports day',
    labelEs: 'Día deportivo',
    words: ['race', 'win', 'field', 'whistle', 'jump', 'slow', 'big', 'small'],
  },
];

const shelfMap = new Map(shelves.map((s) => [s.id, s]));

export const shelfIds: readonly ShelfId[] = shelves.map((s) => s.id);

/** Never throws: an unknown id falls back to the station kit. */
export function shelfById(id: ShelfId): VocabShelf {
  return shelfMap.get(id) ?? (shelves[0] as VocabShelf);
}

/** The shelf's words, resolved. Ids the bank does not know are dropped. */
export function shelfWords(id: ShelfId): VocabWord[] {
  return shelfById(id).words.filter(hasWord).map(wordById);
}

/**
 * `n` words off one shelf, in a shuffled order, skipping `exclude`.
 * Returns fewer than `n` only when the shelf itself is smaller — a shelf is
 * never topped up from the wider bank, because that is exactly the coherence
 * the shelf was for.
 */
export function shelfPick(rng: Rng, id: ShelfId, n: number, exclude: readonly string[] = []): VocabWord[] {
  const skip = new Set(exclude);
  return rng.shuffle(shelfWords(id).filter((w) => !skip.has(w.id))).slice(0, n);
}

/** The shelf a word sits on, if any — used by the recap to name what was met. */
export function shelfOfWord(wordId: string): VocabShelf | undefined {
  return shelves.find((s) => s.words.includes(wordId));
}
