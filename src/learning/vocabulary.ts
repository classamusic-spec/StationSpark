/**
 * VOCABULARY BANK — bilingual (en / es-MX) words used by vocab-tap, listen-count,
 * count-ingredients, measure-pour, divide-share and recipe-scale.
 *
 * `icon` ids come from the shared VocabIcon sheet:
 *   water help open closed red blue one two three ladder hose truck hydrant cone
 *   flashlight helmet radio boots first-aid bucket extinguisher rope axe tomato
 *   cheese milk apple bread egg flour butter sugar strawberry banana mushroom
 *   pepper olive basil taco pizza soup cat dog bunny duck turtle bakery school
 *   library park pet-shop market house tree sun cloud rain left right up down
 *   happy sad
 * Words outside that sheet reuse the closest sensible id (yellow → sun, green →
 * tree, numbers above three → ladder, because number rungs are drawn on the
 * number ladder).
 *
 * WANTED_ICONS — ids the bank would use if the icon artist draws them. Until
 * they exist every word below reuses one of the ids listed above, so nothing
 * ever renders blank. Grouped by how much they would improve the card:
 *
 *   food      lemon onion cilantro corn rice beans grape watermelon carrot
 *             potato lettuce juice honey salt tortilla quesadilla cake
 *   places    museum train-station hospital garden festival farm beach street
 *             pond restaurant store zoo flower river moon
 *   weather   snow wind storm
 *   gear      gloves whistle siren uniform bandage stretcher toolbox flag
 *   people    nurse police mail-carrier farmer cook vet driver musician
 *             gardener shopkeeper train-conductor scientist
 *   animals   bird fish horse cow sheep pig mouse frog parrot lizard
 *   words     north south east west stop wait listen look please sorry careful
 *             big small hot cold fast
 *   feelings  scared proud tired excited calm brave
 *   colors    black pink purple
 */
import type { Rng } from '@/utils/rng';
import type { VocabWord } from './types';

export type VocabCategory = VocabWord['category'];

export const vocabulary: VocabWord[] = [
  /* ---- equipment (23) ---- */
  { id: 'water', en: 'water', es: 'agua', icon: 'water', category: 'equipment' },
  { id: 'hose', en: 'hose', es: 'manguera', icon: 'hose', category: 'equipment' },
  { id: 'ladder', en: 'ladder', es: 'escalera', icon: 'ladder', category: 'equipment' },
  { id: 'fire-truck', en: 'fire truck', es: 'camión de bomberos', icon: 'truck', category: 'equipment' },
  { id: 'hydrant', en: 'hydrant', es: 'hidrante', icon: 'hydrant', category: 'equipment' },
  { id: 'cone', en: 'cone', es: 'cono', icon: 'cone', category: 'equipment' },
  { id: 'flashlight', en: 'flashlight', es: 'linterna', icon: 'flashlight', category: 'equipment' },
  { id: 'helmet', en: 'helmet', es: 'casco', icon: 'helmet', category: 'equipment' },
  { id: 'radio', en: 'radio', es: 'radio', icon: 'radio', category: 'equipment' },
  { id: 'boots', en: 'boots', es: 'botas', icon: 'boots', category: 'equipment' },
  { id: 'first-aid', en: 'first-aid kit', es: 'botiquín', icon: 'first-aid', category: 'equipment' },
  { id: 'bucket', en: 'bucket', es: 'cubeta', icon: 'bucket', category: 'equipment' },
  { id: 'extinguisher', en: 'extinguisher', es: 'extintor', icon: 'extinguisher', category: 'equipment' },
  { id: 'rope', en: 'rope', es: 'cuerda', icon: 'rope', category: 'equipment' },
  { id: 'axe', en: 'axe', es: 'hacha', icon: 'axe', category: 'equipment' },
  { id: 'gloves', en: 'gloves', es: 'guantes', icon: 'boots', category: 'equipment' },
  { id: 'whistle', en: 'whistle', es: 'silbato', icon: 'radio', category: 'equipment' },
  { id: 'siren', en: 'siren', es: 'sirena', icon: 'truck', category: 'equipment' },
  { id: 'uniform', en: 'uniform', es: 'uniforme', icon: 'helmet', category: 'equipment' },
  { id: 'bandage', en: 'bandage', es: 'venda', icon: 'first-aid', category: 'equipment' },
  { id: 'stretcher', en: 'stretcher', es: 'camilla', icon: 'first-aid', category: 'equipment' },
  { id: 'toolbox', en: 'toolbox', es: 'caja de herramientas', icon: 'bucket', category: 'equipment' },
  { id: 'flag', en: 'flag', es: 'bandera', icon: 'cone', category: 'equipment' },

  /* ---- food (36) ---- */
  { id: 'tomato', en: 'tomato', es: 'tomate', icon: 'tomato', category: 'food' },
  { id: 'cheese', en: 'cheese', es: 'queso', icon: 'cheese', category: 'food' },
  { id: 'milk', en: 'milk', es: 'leche', icon: 'milk', category: 'food' },
  { id: 'apple', en: 'apple', es: 'manzana', icon: 'apple', category: 'food' },
  { id: 'bread', en: 'bread', es: 'pan', icon: 'bread', category: 'food' },
  { id: 'egg', en: 'egg', es: 'huevo', icon: 'egg', category: 'food' },
  { id: 'flour', en: 'flour', es: 'harina', icon: 'flour', category: 'food' },
  { id: 'butter', en: 'butter', es: 'mantequilla', icon: 'butter', category: 'food' },
  { id: 'sugar', en: 'sugar', es: 'azúcar', icon: 'sugar', category: 'food' },
  { id: 'strawberry', en: 'strawberry', es: 'fresa', icon: 'strawberry', category: 'food' },
  { id: 'banana', en: 'banana', es: 'plátano', icon: 'banana', category: 'food' },
  { id: 'mushroom', en: 'mushroom', es: 'champiñón', icon: 'mushroom', category: 'food' },
  { id: 'pepper', en: 'pepper', es: 'pimiento', icon: 'pepper', category: 'food' },
  { id: 'olive', en: 'olive', es: 'aceituna', icon: 'olive', category: 'food' },
  { id: 'basil', en: 'basil', es: 'albahaca', icon: 'basil', category: 'food' },
  { id: 'taco', en: 'taco', es: 'taco', icon: 'taco', category: 'food' },
  { id: 'pizza', en: 'pizza', es: 'pizza', icon: 'pizza', category: 'food' },
  { id: 'soup', en: 'soup', es: 'sopa', icon: 'soup', category: 'food' },
  { id: 'lemon', en: 'lemon', es: 'limón', icon: 'apple', category: 'food' },
  { id: 'onion', en: 'onion', es: 'cebolla', icon: 'tomato', category: 'food' },
  { id: 'cilantro', en: 'cilantro', es: 'cilantro', icon: 'basil', category: 'food' },
  { id: 'corn', en: 'corn', es: 'maíz', icon: 'banana', category: 'food' },
  { id: 'rice', en: 'rice', es: 'arroz', icon: 'sugar', category: 'food' },
  { id: 'beans', en: 'beans', es: 'frijoles', icon: 'olive', category: 'food' },
  { id: 'orange-fruit', en: 'orange', es: 'naranja', icon: 'apple', category: 'food' },
  { id: 'grape', en: 'grape', es: 'uva', icon: 'olive', category: 'food' },
  { id: 'watermelon', en: 'watermelon', es: 'sandía', icon: 'strawberry', category: 'food' },
  { id: 'carrot', en: 'carrot', es: 'zanahoria', icon: 'pepper', category: 'food' },
  { id: 'potato', en: 'potato', es: 'papa', icon: 'apple', category: 'food' },
  { id: 'lettuce', en: 'lettuce', es: 'lechuga', icon: 'basil', category: 'food' },
  { id: 'juice', en: 'juice', es: 'jugo', icon: 'milk', category: 'food' },
  { id: 'honey', en: 'honey', es: 'miel', icon: 'sugar', category: 'food' },
  { id: 'salt', en: 'salt', es: 'sal', icon: 'sugar', category: 'food' },
  { id: 'tortilla', en: 'tortilla', es: 'tortilla', icon: 'bread', category: 'food' },
  { id: 'quesadilla', en: 'quesadilla', es: 'quesadilla', icon: 'pizza', category: 'food' },
  { id: 'cake', en: 'cake', es: 'pastel', icon: 'bread', category: 'food' },

  /* ---- colors (11) ---- */
  { id: 'red', en: 'red', es: 'rojo', icon: 'red', category: 'colors' },
  { id: 'blue', en: 'blue', es: 'azul', icon: 'blue', category: 'colors' },
  { id: 'yellow', en: 'yellow', es: 'amarillo', icon: 'sun', category: 'colors' },
  { id: 'green', en: 'green', es: 'verde', icon: 'tree', category: 'colors' },
  { id: 'orange-color', en: 'orange', es: 'anaranjado', icon: 'cone', category: 'colors' },
  { id: 'white', en: 'white', es: 'blanco', icon: 'cloud', category: 'colors' },
  { id: 'brown', en: 'brown', es: 'café', icon: 'bread', category: 'colors' },
  { id: 'grey', en: 'grey', es: 'gris', icon: 'rain', category: 'colors' },
  { id: 'black', en: 'black', es: 'negro', icon: 'closed', category: 'colors' },
  { id: 'pink', en: 'pink', es: 'rosa', icon: 'strawberry', category: 'colors' },
  { id: 'purple', en: 'purple', es: 'morado', icon: 'olive', category: 'colors' },

  /* ---- numbers (13) ---- */
  { id: 'one', en: 'one', es: 'uno', icon: 'one', category: 'numbers' },
  { id: 'two', en: 'two', es: 'dos', icon: 'two', category: 'numbers' },
  { id: 'three', en: 'three', es: 'tres', icon: 'three', category: 'numbers' },
  { id: 'four', en: 'four', es: 'cuatro', icon: 'ladder', category: 'numbers' },
  { id: 'five', en: 'five', es: 'cinco', icon: 'ladder', category: 'numbers' },
  { id: 'six', en: 'six', es: 'seis', icon: 'ladder', category: 'numbers' },
  { id: 'seven', en: 'seven', es: 'siete', icon: 'ladder', category: 'numbers' },
  { id: 'eight', en: 'eight', es: 'ocho', icon: 'ladder', category: 'numbers' },
  { id: 'nine', en: 'nine', es: 'nueve', icon: 'ladder', category: 'numbers' },
  { id: 'ten', en: 'ten', es: 'diez', icon: 'ladder', category: 'numbers' },
  { id: 'zero', en: 'zero', es: 'cero', icon: 'ladder', category: 'numbers' },
  { id: 'eleven', en: 'eleven', es: 'once', icon: 'ladder', category: 'numbers' },
  { id: 'twelve', en: 'twelve', es: 'doce', icon: 'ladder', category: 'numbers' },

  /* ---- places & weather (32) ---- */
  { id: 'bakery', en: 'bakery', es: 'panadería', icon: 'bakery', category: 'places' },
  { id: 'school', en: 'school', es: 'escuela', icon: 'school', category: 'places' },
  { id: 'library', en: 'library', es: 'biblioteca', icon: 'library', category: 'places' },
  { id: 'park', en: 'park', es: 'parque', icon: 'park', category: 'places' },
  { id: 'pet-shop', en: 'pet shop', es: 'tienda de mascotas', icon: 'pet-shop', category: 'places' },
  { id: 'market', en: 'market', es: 'mercado', icon: 'market', category: 'places' },
  { id: 'house', en: 'house', es: 'casa', icon: 'house', category: 'places' },
  { id: 'fire-station', en: 'fire station', es: 'estación de bomberos', icon: 'truck', category: 'places' },
  { id: 'pizza-shop', en: 'pizza shop', es: 'pizzería', icon: 'pizza', category: 'places' },
  { id: 'clock-tower', en: 'clock tower', es: 'torre del reloj', icon: 'house', category: 'places' },
  { id: 'tree', en: 'tree', es: 'árbol', icon: 'tree', category: 'places' },
  { id: 'sun', en: 'sun', es: 'sol', icon: 'sun', category: 'places' },
  { id: 'cloud', en: 'cloud', es: 'nube', icon: 'cloud', category: 'places' },
  { id: 'rain', en: 'rain', es: 'lluvia', icon: 'rain', category: 'places' },
  { id: 'museum', en: 'museum', es: 'museo', icon: 'house', category: 'places' },
  { id: 'train-station', en: 'train station', es: 'estación de tren', icon: 'house', category: 'places' },
  { id: 'hospital', en: 'hospital', es: 'hospital', icon: 'first-aid', category: 'places' },
  { id: 'garden', en: 'garden', es: 'jardín', icon: 'tree', category: 'places' },
  { id: 'festival', en: 'festival', es: 'festival', icon: 'park', category: 'places' },
  { id: 'farm', en: 'farm', es: 'granja', icon: 'tree', category: 'places' },
  { id: 'beach', en: 'beach', es: 'playa', icon: 'sun', category: 'places' },
  { id: 'street', en: 'street', es: 'calle', icon: 'house', category: 'places' },
  { id: 'pond', en: 'pond', es: 'estanque', icon: 'water', category: 'places' },
  { id: 'restaurant', en: 'restaurant', es: 'restaurante', icon: 'pizza', category: 'places' },
  { id: 'store', en: 'store', es: 'tienda', icon: 'market', category: 'places' },
  { id: 'zoo', en: 'zoo', es: 'zoológico', icon: 'park', category: 'places' },
  { id: 'flower', en: 'flower', es: 'flor', icon: 'tree', category: 'places' },
  { id: 'river', en: 'river', es: 'río', icon: 'water', category: 'places' },
  { id: 'moon', en: 'moon', es: 'luna', icon: 'sun', category: 'places' },
  { id: 'snow', en: 'snow', es: 'nieve', icon: 'cloud', category: 'places' },
  { id: 'wind', en: 'wind', es: 'viento', icon: 'cloud', category: 'places' },
  { id: 'storm', en: 'storm', es: 'tormenta', icon: 'rain', category: 'places' },

  /* ---- actions, directions, feelings & everyday words (38) ---- */
  { id: 'help', en: 'help', es: 'ayuda', icon: 'help', category: 'actions' },
  { id: 'open', en: 'open', es: 'abierto', icon: 'open', category: 'actions' },
  { id: 'closed', en: 'closed', es: 'cerrado', icon: 'closed', category: 'actions' },
  { id: 'up', en: 'up', es: 'arriba', icon: 'up', category: 'actions' },
  { id: 'down', en: 'down', es: 'abajo', icon: 'down', category: 'actions' },
  { id: 'left', en: 'left', es: 'izquierda', icon: 'left', category: 'actions' },
  { id: 'right', en: 'right', es: 'derecha', icon: 'right', category: 'actions' },
  { id: 'hello', en: 'hello', es: 'hola', icon: 'happy', category: 'actions' },
  { id: 'thank-you', en: 'thank you', es: 'gracias', icon: 'happy', category: 'actions' },
  { id: 'goodbye', en: 'goodbye', es: 'adiós', icon: 'happy', category: 'actions' },
  { id: 'yes', en: 'yes', es: 'sí', icon: 'happy', category: 'actions' },
  { id: 'no', en: 'no', es: 'no', icon: 'sad', category: 'actions' },
  { id: 'north', en: 'north', es: 'norte', icon: 'up', category: 'actions' },
  { id: 'south', en: 'south', es: 'sur', icon: 'down', category: 'actions' },
  { id: 'east', en: 'east', es: 'este', icon: 'right', category: 'actions' },
  { id: 'west', en: 'west', es: 'oeste', icon: 'left', category: 'actions' },
  { id: 'stop', en: 'stop', es: 'alto', icon: 'closed', category: 'actions' },
  { id: 'near', en: 'near', es: 'cerca', icon: 'open', category: 'actions' },
  { id: 'far', en: 'far', es: 'lejos', icon: 'closed', category: 'actions' },
  { id: 'wait', en: 'wait', es: 'espera', icon: 'closed', category: 'actions' },
  { id: 'listen', en: 'listen', es: 'escucha', icon: 'radio', category: 'actions' },
  { id: 'look', en: 'look', es: 'mira', icon: 'happy', category: 'actions' },
  { id: 'please', en: 'please', es: 'por favor', icon: 'happy', category: 'actions' },
  { id: 'sorry', en: 'sorry', es: 'perdón', icon: 'sad', category: 'actions' },
  { id: 'careful', en: 'careful', es: 'cuidado', icon: 'help', category: 'actions' },
  { id: 'big', en: 'big', es: 'grande', icon: 'up', category: 'actions' },
  { id: 'small', en: 'small', es: 'pequeño', icon: 'down', category: 'actions' },
  { id: 'hot', en: 'hot', es: 'caliente', icon: 'sun', category: 'actions' },
  { id: 'cold', en: 'cold', es: 'frío', icon: 'cloud', category: 'actions' },
  { id: 'fast', en: 'fast', es: 'rápido', icon: 'right', category: 'actions' },
  { id: 'happy', en: 'happy', es: 'feliz', icon: 'happy', category: 'actions' },
  { id: 'sad', en: 'sad', es: 'triste', icon: 'sad', category: 'actions' },
  { id: 'scared', en: 'scared', es: 'asustado', icon: 'sad', category: 'actions' },
  { id: 'proud', en: 'proud', es: 'orgulloso', icon: 'happy', category: 'actions' },
  { id: 'tired', en: 'tired', es: 'cansado', icon: 'sad', category: 'actions' },
  { id: 'excited', en: 'excited', es: 'emocionado', icon: 'happy', category: 'actions' },
  { id: 'calm', en: 'calm', es: 'tranquilo', icon: 'happy', category: 'actions' },
  { id: 'brave', en: 'brave', es: 'valiente', icon: 'helmet', category: 'actions' },

  /* ---- people & community helpers (20) ---- */
  { id: 'firefighter', en: 'firefighter', es: 'bombero', icon: 'helmet', category: 'people' },
  { id: 'baker', en: 'baker', es: 'panadero', icon: 'bread', category: 'people' },
  { id: 'teacher', en: 'teacher', es: 'maestra', icon: 'school', category: 'people' },
  { id: 'librarian', en: 'librarian', es: 'bibliotecaria', icon: 'library', category: 'people' },
  { id: 'doctor', en: 'doctor', es: 'doctora', icon: 'first-aid', category: 'people' },
  { id: 'friend', en: 'friend', es: 'amigo', icon: 'happy', category: 'people' },
  { id: 'family', en: 'family', es: 'familia', icon: 'house', category: 'people' },
  { id: 'neighbor', en: 'neighbor', es: 'vecino', icon: 'house', category: 'people' },
  { id: 'nurse', en: 'nurse', es: 'enfermera', icon: 'first-aid', category: 'people' },
  { id: 'police', en: 'police officer', es: 'policía', icon: 'helmet', category: 'people' },
  { id: 'mail-carrier', en: 'mail carrier', es: 'cartero', icon: 'house', category: 'people' },
  { id: 'farmer', en: 'farmer', es: 'granjero', icon: 'tree', category: 'people' },
  { id: 'cook', en: 'cook', es: 'cocinero', icon: 'soup', category: 'people' },
  { id: 'vet', en: 'vet', es: 'veterinaria', icon: 'dog', category: 'people' },
  { id: 'driver', en: 'driver', es: 'conductor', icon: 'truck', category: 'people' },
  { id: 'musician', en: 'musician', es: 'músico', icon: 'radio', category: 'people' },
  { id: 'gardener', en: 'gardener', es: 'jardinero', icon: 'tree', category: 'people' },
  { id: 'shopkeeper', en: 'shopkeeper', es: 'tendero', icon: 'market', category: 'people' },
  { id: 'train-conductor', en: 'train conductor', es: 'maquinista', icon: 'truck', category: 'people' },
  { id: 'scientist', en: 'scientist', es: 'científica', icon: 'library', category: 'people' },

  /* ---- animals (18) ---- */
  { id: 'cat', en: 'cat', es: 'gato', icon: 'cat', category: 'animals' },
  { id: 'kitten', en: 'kitten', es: 'gatito', icon: 'cat', category: 'animals' },
  { id: 'dog', en: 'dog', es: 'perro', icon: 'dog', category: 'animals' },
  { id: 'puppy', en: 'puppy', es: 'perrito', icon: 'dog', category: 'animals' },
  { id: 'bunny', en: 'bunny', es: 'conejo', icon: 'bunny', category: 'animals' },
  { id: 'duck', en: 'duck', es: 'pato', icon: 'duck', category: 'animals' },
  { id: 'duckling', en: 'duckling', es: 'patito', icon: 'duck', category: 'animals' },
  { id: 'turtle', en: 'turtle', es: 'tortuga', icon: 'turtle', category: 'animals' },
  { id: 'bird', en: 'bird', es: 'pájaro', icon: 'duck', category: 'animals' },
  { id: 'fish', en: 'fish', es: 'pez', icon: 'turtle', category: 'animals' },
  { id: 'horse', en: 'horse', es: 'caballo', icon: 'dog', category: 'animals' },
  { id: 'cow', en: 'cow', es: 'vaca', icon: 'dog', category: 'animals' },
  { id: 'sheep', en: 'sheep', es: 'oveja', icon: 'dog', category: 'animals' },
  { id: 'pig', en: 'pig', es: 'cerdo', icon: 'dog', category: 'animals' },
  { id: 'mouse', en: 'mouse', es: 'ratón', icon: 'bunny', category: 'animals' },
  { id: 'frog', en: 'frog', es: 'rana', icon: 'turtle', category: 'animals' },
  { id: 'parrot', en: 'parrot', es: 'loro', icon: 'duck', category: 'animals' },
  { id: 'lizard', en: 'lizard', es: 'lagartija', icon: 'turtle', category: 'animals' },
];

const byId = new Map(vocabulary.map((w) => [w.id, w]));

/** Never throws: unknown ids fall back to "water" so a mini-game can always render. */
export function wordById(id: string): VocabWord {
  return byId.get(id) ?? (vocabulary[0] as VocabWord);
}

export function hasWord(id: string): boolean {
  return byId.has(id);
}

export function wordsByCategory(category: VocabCategory): VocabWord[] {
  return vocabulary.filter((w) => w.category === category);
}

/** n distinct words, optionally from one category, never repeating `exclude`. */
export function randomWords(
  rng: Rng,
  n: number,
  category?: VocabCategory,
  exclude: readonly string[] = [],
): VocabWord[] {
  const skip = new Set(exclude);
  const pool = (category ? wordsByCategory(category) : vocabulary).filter((w) => !skip.has(w.id));
  const picked = rng.shuffle(pool).slice(0, n);
  if (picked.length === n || category === undefined) return picked;
  // Category ran dry — top up from the whole bank so callers always get n words.
  const used = new Set([...skip, ...picked.map((w) => w.id)]);
  const rest = rng.shuffle(vocabulary.filter((w) => !used.has(w.id)));
  return [...picked, ...rest.slice(0, n - picked.length)];
}

/* ------------------------------------------------------------------ */
/* Counting phrases (correct, simple es-MX)                            */
/* ------------------------------------------------------------------ */

export const numberWordsEn = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
];

export const numberWordsEs = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
  'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
];

export const numberWordEn = (n: number): string => numberWordsEn[n] ?? String(n);
export const numberWordEs = (n: number): string => numberWordsEs[n] ?? String(n);

/** Grammatical gender for the countable nouns we build phrases from. */
const gender: Record<string, 'm' | 'f'> = {
  water: 'f', hose: 'f', ladder: 'f', 'fire-truck': 'm', hydrant: 'm', cone: 'm',
  flashlight: 'f', helmet: 'm', radio: 'm', boots: 'f', 'first-aid': 'm', bucket: 'f',
  extinguisher: 'm', rope: 'f', axe: 'f',
  tomato: 'm', cheese: 'm', milk: 'f', apple: 'f', bread: 'm', egg: 'm', flour: 'f',
  butter: 'f', sugar: 'f', strawberry: 'f', banana: 'm', mushroom: 'm', pepper: 'm',
  olive: 'f', basil: 'f', taco: 'm', pizza: 'f', soup: 'f',
  bakery: 'f', school: 'f', library: 'f', park: 'm', 'pet-shop': 'f', market: 'm',
  house: 'f', 'fire-station': 'f', 'pizza-shop': 'f', 'clock-tower': 'f', tree: 'm',
  sun: 'm', cloud: 'f', rain: 'f',
  firefighter: 'm', baker: 'm', teacher: 'f', librarian: 'f', doctor: 'f', friend: 'm',
  family: 'f', neighbor: 'm',
  cat: 'm', kitten: 'm', dog: 'm', puppy: 'm', bunny: 'm', duck: 'm', duckling: 'm',
  turtle: 'f',
  // ---- added with the twelve-mission town ----
  gloves: 'm', whistle: 'm', siren: 'f', uniform: 'm', bandage: 'f', stretcher: 'f',
  toolbox: 'f', flag: 'f',
  lemon: 'm', onion: 'f', cilantro: 'm', corn: 'm', rice: 'm', beans: 'm',
  'orange-fruit': 'f', grape: 'f', watermelon: 'f', carrot: 'f', potato: 'f',
  lettuce: 'f', juice: 'm', honey: 'f', salt: 'f', tortilla: 'f', quesadilla: 'f',
  cake: 'm',
  museum: 'm', 'train-station': 'f', hospital: 'm', garden: 'm', festival: 'm',
  farm: 'f', beach: 'f', street: 'f', pond: 'm', restaurant: 'm', store: 'f',
  zoo: 'm', flower: 'f', river: 'm', moon: 'f', snow: 'f', wind: 'm', storm: 'f',
  nurse: 'f', police: 'm', 'mail-carrier': 'm', farmer: 'm', cook: 'm', vet: 'f',
  driver: 'm', musician: 'm', gardener: 'm', shopkeeper: 'm', 'train-conductor': 'm',
  scientist: 'f',
  bird: 'm', fish: 'm', horse: 'm', cow: 'f', sheep: 'f', pig: 'm', mouse: 'm',
  frog: 'f', parrot: 'm', lizard: 'f',
};

/** Plurals that the regular rule would get wrong (accents, compounds). */
const pluralEsOverride: Record<string, string> = {
  'fire-truck': 'camiones de bomberos',
  'first-aid': 'botiquines',
  mushroom: 'champiñones',
  'pet-shop': 'tiendas de mascotas',
  'fire-station': 'estaciones de bomberos',
  'clock-tower': 'torres del reloj',
  banana: 'plátanos',
  boots: 'botas',
  water: 'aguas',
  sugar: 'azúcares',
  gloves: 'guantes',
  toolbox: 'cajas de herramientas',
  lemon: 'limones',
  corn: 'maíces',
  beans: 'frijoles',
  rice: 'arroz',
  salt: 'sal',
  honey: 'miel',
  cilantro: 'cilantro',
  'train-station': 'estaciones de tren',
  garden: 'jardines',
  snow: 'nieve',
  mouse: 'ratones',
};

const pluralEnOverride: Record<string, string> = {
  'first-aid': 'first-aid kits',
  boots: 'boots',
  water: 'water',
  milk: 'milk',
  flour: 'flour',
  butter: 'butter',
  sugar: 'sugar',
  cheese: 'cheese',
  bread: 'loaves of bread',
  soup: 'bowls of soup',
  'fire-truck': 'fire trucks',
  'pet-shop': 'pet shops',
  'fire-station': 'fire stations',
  'clock-tower': 'clock towers',
  tomato: 'tomatoes',
  potato: 'potatoes',
  gloves: 'gloves',
  rice: 'rice',
  beans: 'beans',
  corn: 'corn',
  salt: 'salt',
  honey: 'honey',
  cilantro: 'cilantro',
  lettuce: 'lettuce',
  snow: 'snow',
  fish: 'fish',
  sheep: 'sheep',
  mouse: 'mice',
  police: 'police officers',
  'train-station': 'train stations',
};

/** Spanish plural: vowel → +s, -z → -ces, other consonant → +es. */
export function pluralEs(word: VocabWord): string {
  const override = pluralEsOverride[word.id];
  if (override) return override;
  const s = word.es;
  const last = s.slice(-1);
  if ('aeiouáéíóú'.includes(last)) return `${s}s`;
  if (last === 'z') return `${s.slice(0, -1)}ces`;
  return `${s}es`;
}

export function pluralEn(word: VocabWord): string {
  const override = pluralEnOverride[word.id];
  if (override) return override;
  const s = word.en;
  if (/(s|x|ch|sh)$/.test(s)) return `${s}es`;
  if (/[^aeiou]y$/.test(s)) return `${s.slice(0, -1)}ies`;
  return `${s}s`;
}

export const isFeminine = (word: VocabWord): boolean => gender[word.id] === 'f';

/** "una manguera" / "tres mangueras" — the article agrees, the noun pluralises. */
export function countPhraseEs(n: number, word: VocabWord): string {
  if (n === 1) return `${isFeminine(word) ? 'una' : 'un'} ${word.es}`;
  return `${numberWordEs(n)} ${pluralEs(word)}`;
}

export function countPhraseEn(n: number, word: VocabWord): string {
  return n === 1 ? `one ${word.en}` : `${numberWordEn(n)} ${pluralEn(word)}`;
}

/** Nouns that count cleanly in both languages — used by listen-count etc. */
export const countableIds: readonly string[] = [
  'hose', 'ladder', 'cone', 'helmet', 'bucket', 'boots', 'radio', 'flashlight',
  'rope', 'hydrant', 'extinguisher', 'first-aid', 'fire-truck',
  'whistle', 'flag',
  'tomato', 'apple', 'egg', 'strawberry', 'banana', 'mushroom', 'pepper', 'olive',
  'taco', 'pizza',
  'lemon', 'onion', 'carrot', 'grape', 'tortilla', 'quesadilla', 'cake', 'flower',
  'cat', 'kitten', 'dog', 'puppy', 'bunny', 'duck', 'duckling', 'turtle',
  'bird', 'fish', 'horse', 'cow', 'sheep', 'pig', 'mouse', 'frog', 'parrot', 'lizard',
];

export const countableWords = (): VocabWord[] => countableIds.map((id) => wordById(id));

export function randomCountable(rng: Rng, exclude: readonly string[] = []): VocabWord {
  const skip = new Set(exclude);
  const pool = countableWords().filter((w) => !skip.has(w.id));
  return rng.pick(pool.length > 0 ? pool : countableWords());
}
