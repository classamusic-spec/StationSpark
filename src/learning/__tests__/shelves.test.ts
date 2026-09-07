/**
 * VOCABULARY SHELVES.
 *
 * A shelf is a small, named, hand-picked set of words a mission beat can point
 * at, and it makes exactly one promise: **no two words on one shelf are drawn
 * the same picture**. That is what lets a shelf be handed to any game — Word
 * Tap prints the word under the tile and would survive a repeat, but Count
 * Ingredients and Soup Pot are picked from by picture alone, and two identical
 * drawings there is not a hard question, it is an unanswerable one.
 *
 * These tests are the proof of that promise, plus the plumbing around it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRng } from '@/utils/rng';
import { shelfById, shelfIds, shelfOfWord, shelfPick, shelfWords, shelves, type ShelfId } from '@/learning/shelves';
import { hasWord, vocabulary, wordById } from '@/learning/vocabulary';
import { vocabTapOnShelf } from '@/learning/generators';
import type { AgeBand } from '@/learning/types';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const SEEDS = [1, 5, 42, 404, 2048, 31337];

/** The ids the UI's VocabIcon sheet draws — read from the sheet so the two never drift. */
const ICON_IDS = (() => {
  const src = readFileSync(join(__dirname, '../../ui/kit/VocabIcon.tsx'), 'utf8');
  const list = /export const vocabIconIds: readonly VocabIconId\[\] = \[([\s\S]*?)\];/.exec(src)?.[1] ?? '';
  return new Set(Array.from(list.matchAll(/'([a-z0-9-]+)'/g), (m) => m[1]));
})();

describe('the shelves themselves', () => {
  it('found the icon sheet (an empty read would make this file prove nothing)', () => {
    expect(ICON_IDS.size).toBeGreaterThan(140);
    expect(shelves.length).toBeGreaterThanOrEqual(20);
  });

  it('has unique ids, a name in both languages, and no empty shelf', () => {
    expect(new Set(shelves.map((s) => s.id)).size).toBe(shelves.length);
    for (const shelf of shelves) {
      expect(shelf.label.trim().length).toBeGreaterThan(0);
      expect(shelf.labelEs.trim().length).toBeGreaterThan(0);
      expect(shelf.words.length).toBeGreaterThanOrEqual(4);
      expect(new Set(shelf.words).size).toBe(shelf.words.length);
    }
  });

  it('only names words the bank really holds', () => {
    const unknown: string[] = [];
    for (const shelf of shelves) for (const id of shelf.words) if (!hasWord(id)) unknown.push(`${shelf.id} → ${id}`);
    expect(unknown).toEqual([]);
  });

  /** THE PROMISE. */
  it('never puts two words drawn the same picture on one shelf', () => {
    const problems: string[] = [];
    for (const shelf of shelves) {
      const seen = new Map<string, string>();
      for (const word of shelfWords(shelf.id)) {
        if (!ICON_IDS.has(word.icon)) problems.push(`${shelf.id}: ${word.id} wants an icon called ${word.icon}`);
        const twin = seen.get(word.icon);
        if (twin) problems.push(`${shelf.id}: ${twin} and ${word.id} are both drawn as ${word.icon}`);
        seen.set(word.icon, word.id);
      }
    }
    expect(problems).toEqual([]);
  });

  it('is bilingual all the way down', () => {
    for (const shelf of shelves) {
      for (const word of shelfWords(shelf.id)) {
        expect(word.en.trim().length).toBeGreaterThan(0);
        expect(word.es.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('is big enough everywhere to fill a four-picture board', () => {
    for (const shelf of shelves) expect(shelfWords(shelf.id).length).toBeGreaterThanOrEqual(4);
  });
});

describe('reaching into a shelf', () => {
  it('resolves ids and never throws on an unknown one', () => {
    expect(shelfById('harbour').label).toBe('The harbour');
    expect(shelfById('not-a-shelf' as ShelfId).id).toBe(shelves[0]?.id);
    expect(shelfIds).toHaveLength(shelves.length);
  });

  it('picks n distinct words, honours exclusions, and is deterministic', () => {
    const picked = shelfPick(createRng(7), 'market-stall', 4);
    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((w) => w.id)).size).toBe(4);
    expect(shelfPick(createRng(7), 'market-stall', 4)).toEqual(picked);
    const without = shelfPick(createRng(7), 'market-stall', 4, ['tomato', 'onion']);
    expect(without.map((w) => w.id)).not.toContain('tomato');
    expect(without.map((w) => w.id)).not.toContain('onion');
  });

  /*
   * A shelf is never topped up from the wider bank — that coherence is the
   * whole reason it exists, so asking for more than it holds gives you the
   * shelf, not a shelf plus strangers.
   */
  it('never tops a shelf up from outside itself', () => {
    const all = shelfWords('fruit-basket');
    const greedy = shelfPick(createRng(3), 'fruit-basket', all.length + 5);
    expect(greedy).toHaveLength(all.length);
    expect(new Set(greedy.map((w) => w.id))).toEqual(new Set(all.map((w) => w.id)));
  });

  it('says which shelf a word came off, for the recap', () => {
    expect(shelfOfWord('anchor')?.id).toBe('harbour');
    expect(shelfOfWord('not-a-word')).toBeUndefined();
  });
});

describe('vocabTapOnShelf', () => {
  it('keeps the whole board on one shelf, with no repeated picture', () => {
    for (const shelf of shelves) {
      for (const band of BANDS) {
        for (const seed of SEEDS) {
          const challenge = vocabTapOnShelf(shelf.id, { ageBand: band, rng: createRng(seed) });
          expect(challenge.kind).toBe('vocab-tap');
          const icons = challenge.options.map((o) => o.icon);
          expect(new Set(icons).size).toBe(icons.length);
          /* the answer is on the board exactly once */
          expect(challenge.options.filter((o) => o.id === challenge.word.id)).toHaveLength(1);
          /* and the word being asked about really is on this shelf */
          expect(shelf.words).toContain(challenge.word.id);
        }
      }
    }
  });

  it('pins the word when the story asks for one', () => {
    const challenge = vocabTapOnShelf('storm-day', { ageBand: 'B', rng: createRng(11) }, { wordId: 'blanket' });
    expect(challenge.word.id).toBe('blanket');
    expect(challenge.options.map((o) => o.id)).toContain('blanket');
  });

  it('can run the whole board in Spanish', () => {
    const challenge = vocabTapOnShelf('music-and-parade', { ageBand: 'A', rng: createRng(13) }, { promptLang: 'es' });
    expect(challenge.promptLang).toBe('es');
  });

  it('is deterministic for a seed', () => {
    const once = vocabTapOnShelf('pets', { ageBand: 'C', rng: createRng(21) });
    const twice = vocabTapOnShelf('pets', { ageBand: 'C', rng: createRng(21) });
    expect(once.options.map((o) => o.id)).toEqual(twice.options.map((o) => o.id));
  });
});

describe('what the shelves cover', () => {
  it('reaches every category the bank has except the numbers', () => {
    const onAShelf = new Set(shelves.flatMap((s) => s.words).map((id) => wordById(id).category));
    for (const category of ['equipment', 'food', 'colors', 'places', 'actions', 'people', 'animals']) {
      expect(onAShelf.has(category as ReturnType<typeof wordById>['category'])).toBe(true);
    }
    /*
     * There is deliberately no shelf of numbers: only one, two and three have
     * drawn digits and everything from four up borrows the number-ladder rung,
     * so a numbers shelf could not keep the one promise a shelf makes.
     */
    expect(onAShelf.has('numbers')).toBe(false);
  });

  it('shelves a good slice of the bank without claiming to shelve all of it', () => {
    const shelved = new Set(shelves.flatMap((s) => s.words));
    expect(shelved.size).toBeGreaterThanOrEqual(120);
    expect(shelved.size).toBeLessThan(vocabulary.length);
  });
});
