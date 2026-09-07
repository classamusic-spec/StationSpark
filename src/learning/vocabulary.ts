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
 * WANTED_ICONS — these ids have now all been drawn in VocabIcon (icon pass 2), and
 * every word below points at its own icon. The list is kept as the record of the
 * sheet's second batch:
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
 *
 * SECOND WORD LIST (the garden / building site / beach / apartments / open-day
 * expansion) adds 100 more words. Nothing new was asked of the icon sheet: each
 * new word points at a glyph that already exists, borrowing the nearest drawn
 * cousin where it has no portrait of its own (ajo → onion, durazno → apple,
 * palomitas → corn, abeja → honey) — exactly the rule naranja → apple used.
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
  { id: 'gloves', en: 'gloves', es: 'guantes', icon: 'gloves', category: 'equipment' },
  { id: 'whistle', en: 'whistle', es: 'silbato', icon: 'whistle', category: 'equipment' },
  { id: 'siren', en: 'siren', es: 'sirena', icon: 'siren', category: 'equipment' },
  { id: 'uniform', en: 'uniform', es: 'uniforme', icon: 'uniform', category: 'equipment' },
  { id: 'bandage', en: 'bandage', es: 'venda', icon: 'bandage', category: 'equipment' },
  { id: 'stretcher', en: 'stretcher', es: 'camilla', icon: 'stretcher', category: 'equipment' },
  { id: 'toolbox', en: 'toolbox', es: 'caja de herramientas', icon: 'toolbox', category: 'equipment' },
  { id: 'flag', en: 'flag', es: 'bandera', icon: 'flag', category: 'equipment' },

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
  { id: 'lemon', en: 'lemon', es: 'limón', icon: 'lemon', category: 'food' },
  { id: 'onion', en: 'onion', es: 'cebolla', icon: 'onion', category: 'food' },
  { id: 'cilantro', en: 'cilantro', es: 'cilantro', icon: 'cilantro', category: 'food' },
  { id: 'corn', en: 'corn', es: 'maíz', icon: 'corn', category: 'food' },
  { id: 'rice', en: 'rice', es: 'arroz', icon: 'rice', category: 'food' },
  { id: 'beans', en: 'beans', es: 'frijoles', icon: 'beans', category: 'food' },
  { id: 'orange-fruit', en: 'orange', es: 'naranja', icon: 'apple', category: 'food' },
  { id: 'grape', en: 'grape', es: 'uva', icon: 'grape', category: 'food' },
  { id: 'watermelon', en: 'watermelon', es: 'sandía', icon: 'watermelon', category: 'food' },
  { id: 'carrot', en: 'carrot', es: 'zanahoria', icon: 'carrot', category: 'food' },
  { id: 'potato', en: 'potato', es: 'papa', icon: 'potato', category: 'food' },
  { id: 'lettuce', en: 'lettuce', es: 'lechuga', icon: 'lettuce', category: 'food' },
  { id: 'juice', en: 'juice', es: 'jugo', icon: 'juice', category: 'food' },
  { id: 'honey', en: 'honey', es: 'miel', icon: 'honey', category: 'food' },
  { id: 'salt', en: 'salt', es: 'sal', icon: 'salt', category: 'food' },
  { id: 'tortilla', en: 'tortilla', es: 'tortilla', icon: 'tortilla', category: 'food' },
  { id: 'quesadilla', en: 'quesadilla', es: 'quesadilla', icon: 'quesadilla', category: 'food' },
  { id: 'cake', en: 'cake', es: 'pastel', icon: 'cake', category: 'food' },

  /* ---- colors (11) ---- */
  { id: 'red', en: 'red', es: 'rojo', icon: 'red', category: 'colors' },
  { id: 'blue', en: 'blue', es: 'azul', icon: 'blue', category: 'colors' },
  { id: 'yellow', en: 'yellow', es: 'amarillo', icon: 'sun', category: 'colors' },
  { id: 'green', en: 'green', es: 'verde', icon: 'tree', category: 'colors' },
  { id: 'orange-color', en: 'orange', es: 'anaranjado', icon: 'cone', category: 'colors' },
  { id: 'white', en: 'white', es: 'blanco', icon: 'cloud', category: 'colors' },
  { id: 'brown', en: 'brown', es: 'café', icon: 'bread', category: 'colors' },
  { id: 'grey', en: 'grey', es: 'gris', icon: 'rain', category: 'colors' },
  { id: 'black', en: 'black', es: 'negro', icon: 'black', category: 'colors' },
  { id: 'pink', en: 'pink', es: 'rosa', icon: 'pink', category: 'colors' },
  { id: 'purple', en: 'purple', es: 'morado', icon: 'purple', category: 'colors' },

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
  { id: 'museum', en: 'museum', es: 'museo', icon: 'museum', category: 'places' },
  { id: 'train-station', en: 'train station', es: 'estación de tren', icon: 'train-station', category: 'places' },
  { id: 'hospital', en: 'hospital', es: 'hospital', icon: 'hospital', category: 'places' },
  { id: 'garden', en: 'garden', es: 'jardín', icon: 'garden', category: 'places' },
  { id: 'festival', en: 'festival', es: 'festival', icon: 'festival', category: 'places' },
  { id: 'farm', en: 'farm', es: 'granja', icon: 'farm', category: 'places' },
  { id: 'beach', en: 'beach', es: 'playa', icon: 'beach', category: 'places' },
  { id: 'street', en: 'street', es: 'calle', icon: 'street', category: 'places' },
  { id: 'pond', en: 'pond', es: 'estanque', icon: 'pond', category: 'places' },
  { id: 'restaurant', en: 'restaurant', es: 'restaurante', icon: 'restaurant', category: 'places' },
  { id: 'store', en: 'store', es: 'tienda', icon: 'store', category: 'places' },
  { id: 'zoo', en: 'zoo', es: 'zoológico', icon: 'zoo', category: 'places' },
  { id: 'flower', en: 'flower', es: 'flor', icon: 'flower', category: 'places' },
  { id: 'river', en: 'river', es: 'río', icon: 'river', category: 'places' },
  { id: 'moon', en: 'moon', es: 'luna', icon: 'moon', category: 'places' },
  { id: 'snow', en: 'snow', es: 'nieve', icon: 'snow', category: 'places' },
  { id: 'wind', en: 'wind', es: 'viento', icon: 'wind', category: 'places' },
  { id: 'storm', en: 'storm', es: 'tormenta', icon: 'storm', category: 'places' },

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
  { id: 'north', en: 'north', es: 'norte', icon: 'north', category: 'actions' },
  { id: 'south', en: 'south', es: 'sur', icon: 'south', category: 'actions' },
  { id: 'east', en: 'east', es: 'este', icon: 'east', category: 'actions' },
  { id: 'west', en: 'west', es: 'oeste', icon: 'west', category: 'actions' },
  { id: 'stop', en: 'stop', es: 'alto', icon: 'stop', category: 'actions' },
  { id: 'near', en: 'near', es: 'cerca', icon: 'open', category: 'actions' },
  { id: 'far', en: 'far', es: 'lejos', icon: 'closed', category: 'actions' },
  { id: 'wait', en: 'wait', es: 'espera', icon: 'wait', category: 'actions' },
  { id: 'listen', en: 'listen', es: 'escucha', icon: 'listen', category: 'actions' },
  { id: 'look', en: 'look', es: 'mira', icon: 'look', category: 'actions' },
  { id: 'please', en: 'please', es: 'por favor', icon: 'please', category: 'actions' },
  { id: 'sorry', en: 'sorry', es: 'perdón', icon: 'sorry', category: 'actions' },
  { id: 'careful', en: 'careful', es: 'cuidado', icon: 'careful', category: 'actions' },
  { id: 'big', en: 'big', es: 'grande', icon: 'big', category: 'actions' },
  { id: 'small', en: 'small', es: 'pequeño', icon: 'small', category: 'actions' },
  { id: 'hot', en: 'hot', es: 'caliente', icon: 'hot', category: 'actions' },
  { id: 'cold', en: 'cold', es: 'frío', icon: 'cold', category: 'actions' },
  { id: 'fast', en: 'fast', es: 'rápido', icon: 'fast', category: 'actions' },
  { id: 'happy', en: 'happy', es: 'feliz', icon: 'happy', category: 'actions' },
  { id: 'sad', en: 'sad', es: 'triste', icon: 'sad', category: 'actions' },
  { id: 'scared', en: 'scared', es: 'asustado', icon: 'scared', category: 'actions' },
  { id: 'proud', en: 'proud', es: 'orgulloso', icon: 'proud', category: 'actions' },
  { id: 'tired', en: 'tired', es: 'cansado', icon: 'tired', category: 'actions' },
  { id: 'excited', en: 'excited', es: 'emocionado', icon: 'excited', category: 'actions' },
  { id: 'calm', en: 'calm', es: 'tranquilo', icon: 'calm', category: 'actions' },
  { id: 'brave', en: 'brave', es: 'valiente', icon: 'brave', category: 'actions' },

  /* ---- people & community helpers (20) ---- */
  { id: 'firefighter', en: 'firefighter', es: 'bombero', icon: 'helmet', category: 'people' },
  { id: 'baker', en: 'baker', es: 'panadero', icon: 'bread', category: 'people' },
  { id: 'teacher', en: 'teacher', es: 'maestra', icon: 'school', category: 'people' },
  { id: 'librarian', en: 'librarian', es: 'bibliotecaria', icon: 'library', category: 'people' },
  { id: 'doctor', en: 'doctor', es: 'doctora', icon: 'first-aid', category: 'people' },
  { id: 'friend', en: 'friend', es: 'amigo', icon: 'happy', category: 'people' },
  { id: 'family', en: 'family', es: 'familia', icon: 'house', category: 'people' },
  { id: 'neighbor', en: 'neighbor', es: 'vecino', icon: 'house', category: 'people' },
  { id: 'nurse', en: 'nurse', es: 'enfermera', icon: 'nurse', category: 'people' },
  { id: 'police', en: 'police officer', es: 'policía', icon: 'police', category: 'people' },
  { id: 'mail-carrier', en: 'mail carrier', es: 'cartero', icon: 'mail-carrier', category: 'people' },
  { id: 'farmer', en: 'farmer', es: 'granjero', icon: 'farmer', category: 'people' },
  { id: 'cook', en: 'cook', es: 'cocinero', icon: 'cook', category: 'people' },
  { id: 'vet', en: 'vet', es: 'veterinaria', icon: 'vet', category: 'people' },
  { id: 'driver', en: 'driver', es: 'conductor', icon: 'driver', category: 'people' },
  { id: 'musician', en: 'musician', es: 'músico', icon: 'musician', category: 'people' },
  { id: 'gardener', en: 'gardener', es: 'jardinero', icon: 'gardener', category: 'people' },
  { id: 'shopkeeper', en: 'shopkeeper', es: 'tendero', icon: 'shopkeeper', category: 'people' },
  { id: 'train-conductor', en: 'train conductor', es: 'maquinista', icon: 'train-conductor', category: 'people' },
  { id: 'scientist', en: 'scientist', es: 'científica', icon: 'scientist', category: 'people' },

  /* ---- animals (18) ---- */
  { id: 'cat', en: 'cat', es: 'gato', icon: 'cat', category: 'animals' },
  { id: 'kitten', en: 'kitten', es: 'gatito', icon: 'cat', category: 'animals' },
  { id: 'dog', en: 'dog', es: 'perro', icon: 'dog', category: 'animals' },
  { id: 'puppy', en: 'puppy', es: 'perrito', icon: 'dog', category: 'animals' },
  { id: 'bunny', en: 'bunny', es: 'conejo', icon: 'bunny', category: 'animals' },
  { id: 'duck', en: 'duck', es: 'pato', icon: 'duck', category: 'animals' },
  { id: 'duckling', en: 'duckling', es: 'patito', icon: 'duck', category: 'animals' },
  { id: 'turtle', en: 'turtle', es: 'tortuga', icon: 'turtle', category: 'animals' },
  { id: 'bird', en: 'bird', es: 'pájaro', icon: 'bird', category: 'animals' },
  { id: 'fish', en: 'fish', es: 'pez', icon: 'fish', category: 'animals' },
  { id: 'horse', en: 'horse', es: 'caballo', icon: 'horse', category: 'animals' },
  { id: 'cow', en: 'cow', es: 'vaca', icon: 'cow', category: 'animals' },
  { id: 'sheep', en: 'sheep', es: 'oveja', icon: 'sheep', category: 'animals' },
  { id: 'pig', en: 'pig', es: 'cerdo', icon: 'pig', category: 'animals' },
  { id: 'mouse', en: 'mouse', es: 'ratón', icon: 'mouse', category: 'animals' },
  { id: 'frog', en: 'frog', es: 'rana', icon: 'frog', category: 'animals' },
  { id: 'parrot', en: 'parrot', es: 'loro', icon: 'parrot', category: 'animals' },
  { id: 'lizard', en: 'lizard', es: 'lagartija', icon: 'lizard', category: 'animals' },
  /* ================================================================ *
   * SECOND WORD LIST — the words the garden, the building site, the
   * beach, the apartment block and the station's open day needed.
   * Every icon id below is already drawn by `@/ui/kit/VocabIcon`; where a
   * word has no portrait of its own it borrows the closest drawn cousin
   * (ajo → onion, durazno → apple, palomitas → corn), which is the same
   * rule the first list used for naranja → apple.
   * ================================================================ */

  /* ---- equipment (+11) ---- */
  { id: 'lantern', en: 'lantern', es: 'farol', icon: 'flashlight', category: 'equipment' },
  { id: 'apron', en: 'apron', es: 'delantal', icon: 'uniform', category: 'equipment' },
  { id: 'hammer', en: 'hammer', es: 'martillo', icon: 'toolbox', category: 'equipment' },
  { id: 'shovel', en: 'shovel', es: 'pala', icon: 'toolbox', category: 'equipment' },
  { id: 'watering-can', en: 'watering can', es: 'regadera', icon: 'bucket', category: 'equipment' },
  { id: 'basket', en: 'basket', es: 'canasta', icon: 'bucket', category: 'equipment' },
  { id: 'box', en: 'box', es: 'caja', icon: 'toolbox', category: 'equipment' },
  { id: 'umbrella', en: 'umbrella', es: 'paraguas', icon: 'rain', category: 'equipment' },
  { id: 'towel', en: 'towel', es: 'toalla', icon: 'uniform', category: 'equipment' },
  { id: 'seed', en: 'seed', es: 'semilla', icon: 'flower', category: 'equipment' },
  { id: 'plant', en: 'plant', es: 'planta', icon: 'tree', category: 'equipment' },

  /* ---- food (+15) ---- */
  { id: 'chili', en: 'chili', es: 'chile', icon: 'pepper', category: 'food' },
  { id: 'garlic', en: 'garlic', es: 'ajo', icon: 'onion', category: 'food' },
  { id: 'melon', en: 'melon', es: 'melón', icon: 'watermelon', category: 'food' },
  { id: 'pear', en: 'pear', es: 'pera', icon: 'apple', category: 'food' },
  { id: 'peach', en: 'peach', es: 'durazno', icon: 'apple', category: 'food' },
  { id: 'mango', en: 'mango', es: 'mango', icon: 'apple', category: 'food' },
  { id: 'pineapple', en: 'pineapple', es: 'piña', icon: 'apple', category: 'food' },
  { id: 'cookie', en: 'cookie', es: 'galleta', icon: 'cake', category: 'food' },
  { id: 'popcorn', en: 'popcorn', es: 'palomitas', icon: 'corn', category: 'food' },
  { id: 'noodles', en: 'noodles', es: 'fideos', icon: 'soup', category: 'food' },
  { id: 'yogurt', en: 'yogurt', es: 'yogur', icon: 'milk', category: 'food' },
  { id: 'tea', en: 'tea', es: 'té', icon: 'juice', category: 'food' },
  { id: 'sandwich', en: 'sandwich', es: 'torta', icon: 'bread', category: 'food' },
  { id: 'salsa', en: 'salsa', es: 'salsa', icon: 'tomato', category: 'food' },
  { id: 'sweet-bread', en: 'sweet bread', es: 'pan dulce', icon: 'bread', category: 'food' },

  /* ---- colors (+1) ---- */
  { id: 'gold', en: 'gold', es: 'dorado', icon: 'sun', category: 'colors' },

  /* ---- numbers (+8): trece … veinte ---- */
  { id: 'thirteen', en: 'thirteen', es: 'trece', icon: 'ladder', category: 'numbers' },
  { id: 'fourteen', en: 'fourteen', es: 'catorce', icon: 'ladder', category: 'numbers' },
  { id: 'fifteen', en: 'fifteen', es: 'quince', icon: 'ladder', category: 'numbers' },
  { id: 'sixteen', en: 'sixteen', es: 'dieciséis', icon: 'ladder', category: 'numbers' },
  { id: 'seventeen', en: 'seventeen', es: 'diecisiete', icon: 'ladder', category: 'numbers' },
  { id: 'eighteen', en: 'eighteen', es: 'dieciocho', icon: 'ladder', category: 'numbers' },
  { id: 'nineteen', en: 'nineteen', es: 'diecinueve', icon: 'ladder', category: 'numbers' },
  { id: 'twenty', en: 'twenty', es: 'veinte', icon: 'ladder', category: 'numbers' },

  /* ---- places & weather (+14) ---- */
  { id: 'apartment', en: 'apartment', es: 'apartamento', icon: 'house', category: 'places' },
  { id: 'playground', en: 'playground', es: 'parque de juegos', icon: 'park', category: 'places' },
  { id: 'bridge', en: 'bridge', es: 'puente', icon: 'street', category: 'places' },
  { id: 'pier', en: 'pier', es: 'muelle', icon: 'beach', category: 'places' },
  { id: 'sand', en: 'sand', es: 'arena', icon: 'beach', category: 'places' },
  { id: 'wave', en: 'wave', es: 'ola', icon: 'river', category: 'places' },
  { id: 'sky', en: 'sky', es: 'cielo', icon: 'cloud', category: 'places' },
  { id: 'star', en: 'star', es: 'estrella', icon: 'moon', category: 'places' },
  { id: 'city', en: 'city', es: 'ciudad', icon: 'house', category: 'places' },
  { id: 'sidewalk', en: 'sidewalk', es: 'banqueta', icon: 'street', category: 'places' },
  { id: 'roof', en: 'roof', es: 'techo', icon: 'house', category: 'places' },
  { id: 'door', en: 'door', es: 'puerta', icon: 'open', category: 'places' },
  { id: 'window', en: 'window', es: 'ventana', icon: 'house', category: 'places' },
  { id: 'pharmacy', en: 'pharmacy', es: 'farmacia', icon: 'hospital', category: 'places' },

  /* ---- actions, order words, comparison & courtesy (+28) ---- */
  { id: 'run', en: 'run', es: 'correr', icon: 'fast', category: 'actions' },
  { id: 'jump', en: 'jump', es: 'saltar', icon: 'up', category: 'actions' },
  { id: 'climb', en: 'climb', es: 'subir', icon: 'ladder', category: 'actions' },
  { id: 'push', en: 'push', es: 'empujar', icon: 'right', category: 'actions' },
  { id: 'pull', en: 'pull', es: 'jalar', icon: 'left', category: 'actions' },
  { id: 'read', en: 'read', es: 'leer', icon: 'library', category: 'actions' },
  { id: 'write', en: 'write', es: 'escribir', icon: 'school', category: 'actions' },
  { id: 'sing', en: 'sing', es: 'cantar', icon: 'musician', category: 'actions' },
  { id: 'clean', en: 'clean', es: 'limpiar', icon: 'water', category: 'actions' },
  { id: 'count', en: 'count', es: 'contar', icon: 'three', category: 'actions' },
  { id: 'share', en: 'share', es: 'compartir', icon: 'happy', category: 'actions' },
  { id: 'plant-it', en: 'plant', es: 'sembrar', icon: 'garden', category: 'actions' },
  { id: 'morning', en: 'morning', es: 'mañana', icon: 'sun', category: 'actions' },
  { id: 'night', en: 'night', es: 'noche', icon: 'moon', category: 'actions' },
  { id: 'today', en: 'today', es: 'hoy', icon: 'sun', category: 'actions' },
  { id: 'first', en: 'first', es: 'primero', icon: 'one', category: 'actions' },
  { id: 'next', en: 'next', es: 'luego', icon: 'two', category: 'actions' },
  { id: 'last', en: 'last', es: 'último', icon: 'stop', category: 'actions' },
  { id: 'more', en: 'more', es: 'más', icon: 'big', category: 'actions' },
  { id: 'less', en: 'less', es: 'menos', icon: 'small', category: 'actions' },
  { id: 'half', en: 'half', es: 'mitad', icon: 'pizza', category: 'actions' },
  { id: 'empty', en: 'empty', es: 'vacío', icon: 'closed', category: 'actions' },
  { id: 'full', en: 'full', es: 'lleno', icon: 'water', category: 'actions' },
  { id: 'slow', en: 'slow', es: 'despacio', icon: 'turtle', category: 'actions' },
  { id: 'quiet', en: 'quiet', es: 'silencio', icon: 'listen', category: 'actions' },
  { id: 'welcome', en: 'welcome', es: 'bienvenido', icon: 'open', category: 'actions' },
  { id: 'you-are-welcome', en: "you're welcome", es: 'de nada', icon: 'happy', category: 'actions' },
  { id: 'excuse-me', en: 'excuse me', es: 'con permiso', icon: 'please', category: 'actions' },

  /* ---- people & community helpers (+13) ---- */
  { id: 'grandmother', en: 'grandmother', es: 'abuela', icon: 'calm', category: 'people' },
  { id: 'grandfather', en: 'grandfather', es: 'abuelo', icon: 'proud', category: 'people' },
  { id: 'mother', en: 'mom', es: 'mamá', icon: 'happy', category: 'people' },
  { id: 'father', en: 'dad', es: 'papá', icon: 'excited', category: 'people' },
  { id: 'sister', en: 'sister', es: 'hermana', icon: 'brave', category: 'people' },
  { id: 'brother', en: 'brother', es: 'hermano', icon: 'tired', category: 'people' },
  { id: 'baby', en: 'baby', es: 'bebé', icon: 'small', category: 'people' },
  { id: 'captain', en: 'captain', es: 'capitana', icon: 'helmet', category: 'people' },
  { id: 'builder', en: 'builder', es: 'constructor', icon: 'toolbox', category: 'people' },
  { id: 'engineer', en: 'engineer', es: 'ingeniera', icon: 'scientist', category: 'people' },
  { id: 'lifeguard', en: 'lifeguard', es: 'salvavidas', icon: 'water', category: 'people' },
  { id: 'student', en: 'student', es: 'estudiante', icon: 'school', category: 'people' },
  { id: 'coach', en: 'coach', es: 'entrenador', icon: 'whistle', category: 'people' },

  /* ---- animals (+10) ---- */
  { id: 'goat', en: 'goat', es: 'cabra', icon: 'sheep', category: 'animals' },
  { id: 'donkey', en: 'donkey', es: 'burro', icon: 'horse', category: 'animals' },
  { id: 'chicken', en: 'chicken', es: 'gallina', icon: 'bird', category: 'animals' },
  { id: 'bee', en: 'bee', es: 'abeja', icon: 'honey', category: 'animals' },
  { id: 'butterfly', en: 'butterfly', es: 'mariposa', icon: 'flower', category: 'animals' },
  { id: 'snail', en: 'snail', es: 'caracol', icon: 'turtle', category: 'animals' },
  { id: 'dolphin', en: 'dolphin', es: 'delfín', icon: 'fish', category: 'animals' },
  { id: 'seagull', en: 'seagull', es: 'gaviota', icon: 'bird', category: 'animals' },
  { id: 'owl', en: 'owl', es: 'búho', icon: 'bird', category: 'animals' },
  { id: 'crab', en: 'crab', es: 'cangrejo', icon: 'lizard', category: 'animals' },
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
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty',
];

export const numberWordsEs = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
  'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
  'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
  'dieciocho', 'diecinueve', 'veinte',
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
  // ---- second word list ----
  lantern: 'm', apron: 'm', hammer: 'm', shovel: 'f', 'watering-can': 'f',
  basket: 'f', box: 'f', umbrella: 'm', towel: 'f', seed: 'f', plant: 'f',
  chili: 'm', garlic: 'm', melon: 'm', pear: 'f', peach: 'm', mango: 'm',
  pineapple: 'f', cookie: 'f', popcorn: 'f', noodles: 'm', yogurt: 'm', tea: 'm',
  sandwich: 'f', salsa: 'f', 'sweet-bread': 'm',
  apartment: 'm', playground: 'm', bridge: 'm', pier: 'm', sand: 'f', wave: 'f',
  sky: 'm', star: 'f', city: 'f', sidewalk: 'f', roof: 'm', door: 'f',
  window: 'f', pharmacy: 'f',
  morning: 'f', night: 'f', half: 'f', quiet: 'm',
  grandmother: 'f', grandfather: 'm', mother: 'f', father: 'm', sister: 'f',
  brother: 'm', baby: 'm', captain: 'f', builder: 'm', engineer: 'f',
  lifeguard: 'm', student: 'm', coach: 'm',
  goat: 'f', donkey: 'm', chicken: 'f', bee: 'f', butterfly: 'f', snail: 'm',
  dolphin: 'm', seagull: 'f', owl: 'm', crab: 'm',
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
  // ---- second word list: accents drop, and a few words are already plural ----
  umbrella: 'paraguas',
  melon: 'melones',
  popcorn: 'palomitas',
  noodles: 'fideos',
  tea: 'té',
  'sweet-bread': 'panes dulces',
  playground: 'parques de juegos',
  dolphin: 'delfines',
  lifeguard: 'salvavidas',
  sand: 'arena',
  sky: 'cielo',
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
  // ---- second word list ----
  popcorn: 'popcorn',
  noodles: 'noodles',
  tea: 'tea',
  'sweet-bread': 'sweet breads',
  sand: 'sand',
  sky: 'sky',
  peach: 'peaches',
  sandwich: 'sandwiches',
  'watering-can': 'watering cans',
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
  /* ---- second word list ---- */
  'box', 'basket', 'towel', 'seed', 'plant', 'hammer', 'shovel', 'watering-can',
  'chili', 'garlic', 'pear', 'peach', 'mango', 'melon', 'cookie', 'sandwich',
  'goat', 'donkey', 'chicken', 'bee', 'butterfly', 'snail', 'seagull', 'owl', 'crab',
  'star', 'window', 'door',
];

export const countableWords = (): VocabWord[] => countableIds.map((id) => wordById(id));

export function randomCountable(rng: Rng, exclude: readonly string[] = []): VocabWord {
  const skip = new Set(exclude);
  const pool = countableWords().filter((w) => !skip.has(w.id));
  return rng.pick(pool.length > 0 ? pool : countableWords());
}
