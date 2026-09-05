import { createRng } from '@/utils/rng';
import {
  countPhraseEn,
  countPhraseEs,
  countableWords,
  numberWordEs,
  pluralEn,
  pluralEs,
  randomCountable,
  randomWords,
  vocabulary,
  wordById,
  wordsByCategory,
} from '@/learning/vocabulary';

/** The ids the UI's VocabIcon sheet draws (src/ui/kit/VocabIcon.tsx). */
const ICON_IDS = new Set([
  'water', 'help', 'open', 'closed', 'red', 'blue', 'one', 'two', 'three',
  'ladder', 'hose', 'truck', 'hydrant', 'cone', 'flashlight', 'helmet', 'radio', 'boots',
  'first-aid', 'bucket', 'extinguisher', 'rope', 'axe',
  'tomato', 'cheese', 'milk', 'apple', 'bread', 'egg', 'flour', 'butter', 'sugar',
  'strawberry', 'banana', 'mushroom', 'pepper', 'olive', 'basil', 'taco', 'pizza', 'soup',
  'cat', 'dog', 'bunny', 'duck', 'turtle',
  'bakery', 'school', 'library', 'park', 'pet-shop', 'market', 'house', 'tree',
  'sun', 'cloud', 'rain',
  'left', 'right', 'up', 'down', 'happy', 'sad',
]);

const CATEGORIES = ['equipment', 'food', 'colors', 'numbers', 'places', 'actions', 'people', 'animals'] as const;

describe('vocabulary bank', () => {
  it('has at least 160 words', () => {
    expect(vocabulary.length).toBeGreaterThanOrEqual(160);
  });

  it('gives every category enough words for a four-picture question', () => {
    for (const category of CATEGORIES) {
      expect(wordsByCategory(category).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('knows the weather, the compass, feelings and the neighbourhood helpers', () => {
    const spanish = new Set(vocabulary.map((w) => w.es));
    for (const word of [
      'nieve', 'viento', 'tormenta', // weather
      'norte', 'sur', 'este', 'oeste', // directions
      'feliz', 'triste', 'orgulloso', 'valiente', // feelings
      'enfermera', 'policía', 'cartero', 'granjero', 'veterinaria', // helpers
      'museo', 'estación de tren', 'festival', // the new places
      'limón', 'cebolla', 'cilantro', 'tortilla', 'quesadilla', // the new food
    ]) {
      expect(spanish).toContain(word);
    }
  });

  it('has unique ids', () => {
    expect(new Set(vocabulary.map((w) => w.id)).size).toBe(vocabulary.length);
  });

  it('is bilingual everywhere', () => {
    for (const word of vocabulary) {
      expect(word.en.trim().length).toBeGreaterThan(0);
      expect(word.es.trim().length).toBeGreaterThan(0);
    }
  });

  it('only uses icon ids the UI actually draws', () => {
    const unknown = vocabulary.filter((w) => !ICON_IDS.has(w.icon)).map((w) => `${w.id}→${w.icon}`);
    expect(unknown).toEqual([]);
  });

  it('covers every category', () => {
    for (const category of CATEGORIES) {
      expect(wordsByCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('has the numbers uno–diez', () => {
    const numbers = wordsByCategory('numbers').map((w) => w.es);
    for (const es of ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez']) {
      expect(numbers).toContain(es);
    }
  });

  it('holds the station Spanish the design asks for', () => {
    const spanish = new Set(vocabulary.map((w) => w.es));
    for (const word of ['agua', 'ayuda', 'abierto', 'cerrado', 'rojo', 'azul', 'gracias', 'hola', 'escalera', 'manguera', 'camión de bomberos', 'tomate', 'queso', 'leche', 'manzana', 'pan']) {
      expect(spanish).toContain(word);
    }
  });
});

describe('wordById', () => {
  it('finds a word', () => {
    expect(wordById('hose').es).toBe('manguera');
  });
  it('never throws on an unknown id', () => {
    expect(wordById('not-a-word').id).toBeTruthy();
  });
});

describe('randomWords', () => {
  it('returns n distinct words', () => {
    const words = randomWords(createRng(4), 6);
    expect(words).toHaveLength(6);
    expect(new Set(words.map((w) => w.id)).size).toBe(6);
  });

  it('respects the category and the exclusions', () => {
    const words = randomWords(createRng(9), 4, 'food', ['tomato', 'cheese']);
    expect(words.every((w) => w.category === 'food')).toBe(true);
    expect(words.map((w) => w.id)).not.toContain('tomato');
    expect(words.map((w) => w.id)).not.toContain('cheese');
  });

  it('is deterministic for a seed', () => {
    expect(randomWords(createRng(11), 5)).toEqual(randomWords(createRng(11), 5));
  });

  it('tops up from the whole bank when a category runs dry', () => {
    expect(randomWords(createRng(2), 12, 'colors')).toHaveLength(12);
  });
});

describe('Spanish counting phrases', () => {
  it('agrees in gender for one', () => {
    expect(countPhraseEs(1, wordById('hose'))).toBe('una manguera');
    expect(countPhraseEs(1, wordById('helmet'))).toBe('un casco');
    expect(countPhraseEs(1, wordById('ladder'))).toBe('una escalera');
  });

  it('pluralises correctly', () => {
    expect(countPhraseEs(3, wordById('hose'))).toBe('tres mangueras');
    expect(countPhraseEs(2, wordById('bread'))).toBe('dos panes');
    expect(countPhraseEs(4, wordById('fire-truck'))).toBe('cuatro camiones de bomberos');
    expect(countPhraseEs(5, wordById('mushroom'))).toBe('cinco champiñones');
    expect(pluralEs(wordById('first-aid'))).toBe('botiquines');
    expect(pluralEs(wordById('apple'))).toBe('manzanas');
  });

  it('gets the tricky new plurals right in both languages', () => {
    expect(countPhraseEs(3, wordById('lemon'))).toBe('tres limones');
    expect(countPhraseEs(2, wordById('mouse'))).toBe('dos ratones');
    expect(countPhraseEs(4, wordById('fish'))).toBe('cuatro peces');
    expect(countPhraseEs(1, wordById('onion'))).toBe('una cebolla');
    expect(countPhraseEs(1, wordById('lizard'))).toBe('una lagartija');
    expect(countPhraseEn(2, wordById('mouse'))).toBe('two mice');
    expect(countPhraseEn(3, wordById('sheep'))).toBe('three sheep');
    expect(countPhraseEn(5, wordById('tomato'))).toBe('five tomatoes');
    expect(countPhraseEn(2, wordById('fish'))).toBe('two fish');
  });

  it('counts in English too', () => {
    expect(countPhraseEn(1, wordById('hose'))).toBe('one hose');
    expect(countPhraseEn(3, wordById('strawberry'))).toBe('three strawberries');
    expect(pluralEn(wordById('boots'))).toBe('boots');
  });

  it('knows its Spanish number words', () => {
    expect(numberWordEs(7)).toBe('siete');
    expect(numberWordEs(12)).toBe('doce');
  });

  it('every countable word makes a clean phrase in both languages', () => {
    for (const word of countableWords()) {
      for (const n of [1, 2, 5, 12]) {
        expect(countPhraseEs(n, word)).toMatch(/\S/);
        expect(countPhraseEn(n, word)).toMatch(/\S/);
        expect(countPhraseEs(n, word)).not.toContain('undefined');
      }
    }
  });

  it('picks countable words at random without repeats', () => {
    const word = randomCountable(createRng(3), ['hose', 'ladder']);
    expect(['hose', 'ladder']).not.toContain(word.id);
  });
});
