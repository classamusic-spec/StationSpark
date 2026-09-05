import { foodWords } from '../food';
import {
  answerOptions,
  checkCounts,
  eachShare,
  equationText,
  isScaleLineCorrect,
  nextPlate,
  pantryList,
  scaleExplanation,
  scaleRatioText,
  scaledAmount,
  shareState,
} from '../shareMath';
import { countPhraseEn, countPhraseEs, esArticleOne, esNumber, needsPhraseEs, pluralEn, pluralEs } from '../spanish';
import { recipeCardState, recipeStars } from '../progress';
import { recipes } from '@/content/recipes';
import type { RecipeDef } from '@/content/types';
import type { AgeBand, Challenge } from '@/learning/types';
import { createRng } from '@/utils/rng';

describe('sharing', () => {
  it('works out how many each person gets', () => {
    expect(eachShare(12, 4)).toBe(3);
    expect(eachShare(8, 4)).toBe(2);
    expect(eachShare(7, 2)).toBe(3);
    expect(eachShare(5, 0)).toBe(0);
  });

  it('reports which plates are short and which have too much', () => {
    expect(shareState([2, 2, 2, 2], 2)).toEqual({ done: true, over: [], under: [], placed: 8 });
    const uneven = shareState([3, 2, 1, 2], 2);
    expect(uneven.done).toBe(false);
    expect(uneven.over).toEqual([0]);
    expect(uneven.under).toEqual([2]);
    expect(uneven.placed).toBe(8);
  });

  it('an empty table is never "done"', () => {
    expect(shareState([0, 0], 2).done).toBe(false);
    expect(shareState([], 2).done).toBe(true);
  });

  it('deals to the emptiest plate first, then reports there is nowhere left', () => {
    expect(nextPlate([0, 0, 0], 2)).toBe(0);
    expect(nextPlate([2, 1, 0], 2)).toBe(2);
    expect(nextPlate([1, 0, 1], 2)).toBe(1);
    expect(nextPlate([2, 2, 2], 2)).toBe(-1);
  });

  it('writes the equation the child sees', () => {
    expect(equationText(12, 4, null)).toBe('12 ÷ 4 = ?');
    expect(equationText(12, 4, 3)).toBe('12 ÷ 4 = 3');
  });

  it('offers answer tiles that always contain the right one', () => {
    for (const correct of [1, 2, 3, 4, 6, 10]) {
      const options = answerOptions(correct);
      expect(options).toContain(correct);
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
      expect(options.every((o) => o > 0)).toBe(true);
      expect([...options].sort((a, b) => a - b)).toEqual(options);
    }
  });

  it('gives four tiles when asked for four', () => {
    expect(answerOptions(2, 4)).toHaveLength(4);
  });
});

describe('recipe scaling', () => {
  it('scales an amount to the new crowd', () => {
    expect(scaledAmount(2, 4, 6)).toBe(3);
    expect(scaledAmount(4, 4, 8)).toBe(8);
    expect(scaledAmount(6, 4, 2)).toBe(3);
    expect(scaledAmount(3, 0, 6)).toBe(3);
  });

  it('checks a single line', () => {
    expect(isScaleLineCorrect(3, 3)).toBe(true);
    expect(isScaleLineCorrect(2, 3)).toBe(false);
  });

  it('explains one line the way Beacon would', () => {
    expect(scaleExplanation('cups', 2, 4, 6, 3)).toBe('4 people need 2 cups, so 6 need 1 more — 3 in total.');
    expect(scaleExplanation('cups', 4, 4, 2, 2)).toBe('4 people need 4 cups, so 2 need 2 fewer — 2 in total.');
    expect(scaleExplanation('cups', 2, 4, 4, 2)).toBe('4 people need 2 cups, so 4 need the same — 2.');
  });

  it('describes the ratio in kid words', () => {
    expect(scaleRatioText(4, 8)).toBe('Double it!');
    expect(scaleRatioText(4, 2)).toBe('Half of it!');
    expect(scaleRatioText(4, 4)).toBe('Same as always!');
    expect(scaleRatioText(4, 6)).toBe('2 more mouths to feed');
    expect(scaleRatioText(4, 5)).toBe('1 more mouth to feed');
    expect(scaleRatioText(6, 4)).toBe('2 fewer to feed');
  });
});

describe('counting ingredients', () => {
  const needs = [
    { id: 'strawberry', count: 3 },
    { id: 'banana', count: 2 },
  ];

  it('is done only when every count matches exactly', () => {
    expect(checkCounts(needs, { strawberry: 3, banana: 2 }).done).toBe(true);
    expect(checkCounts(needs, {}).done).toBe(false);
  });

  it('separates too many, too few and things that do not belong', () => {
    const result = checkCounts(needs, { strawberry: 5, banana: 1, apple: 2 });
    expect(result.over).toEqual(['strawberry']);
    expect(result.under).toEqual(['banana']);
    expect(result.extras).toEqual(['apple']);
    expect(result.done).toBe(false);
  });

  it('ignores an item that was added and then taken back out', () => {
    expect(checkCounts(needs, { strawberry: 3, banana: 2, apple: 0 }).done).toBe(true);
  });
});

describe('spanish helpers', () => {
  it('counts in Spanish', () => {
    expect(esNumber(0)).toBe('cero');
    expect(esNumber(3)).toBe('tres');
    expect(esNumber(12)).toBe('doce');
    expect(esNumber(20)).toBe('veinte');
    expect(esNumber(24)).toBe('veinticuatro');
    expect(esNumber(31)).toBe('treinta y uno');
  });

  it('pluralises the food words the kitchen teaches', () => {
    expect(pluralEs('fresa')).toBe('fresas');
    expect(pluralEs('plátano')).toBe('plátanos');
    expect(pluralEs('champiñón')).toBe('champiñones');
    expect(pluralEs('pan')).toBe('panes');
    expect(pluralEs('pimiento')).toBe('pimientos');
    expect(pluralEs('aceituna')).toBe('aceitunas');
  });

  it('pluralises English too', () => {
    expect(pluralEn('taco', 1)).toBe('taco');
    expect(pluralEn('taco', 3)).toBe('tacos');
    expect(pluralEn('strawberry', 2)).toBe('strawberries');
    expect(pluralEn('dish', 2)).toBe('dishes');
  });

  it('uses un / una before a single item', () => {
    expect(esArticleOne('plátano')).toBe('un');
    expect(esArticleOne('fresa')).toBe('una');
    expect(esArticleOne('pan')).toBe('un');
  });

  it('reads the shopping list the way Beacon says it', () => {
    expect(countPhraseEs(3, foodWords.strawberry)).toBe('tres fresas');
    expect(countPhraseEs(1, foodWords.banana)).toBe('un plátano');
    expect(countPhraseEs(1, foodWords.strawberry)).toBe('una fresa');
    expect(countPhraseEn(2, foodWords.banana)).toBe('2 bananas');
    expect(
      needsPhraseEs([
        { item: foodWords.strawberry, count: 3 },
        { item: foodWords.banana, count: 2 },
      ]),
    ).toBe('tres fresas, dos plátanos');
  });
});

describe('the recipe shelf', () => {
  const recipe = (id: string, badge?: string) => ({ id, badge }) as unknown as RecipeDef;

  it('shows a cooked recipe as cooked', () => {
    expect(recipeCardState(recipe('pizza'), 3, ['pizza'], [])).toBe('cooked');
  });

  it('opens the first two, then one more for each recipe cooked', () => {
    expect(recipeCardState(recipe('a'), 0, [], [])).toBe('open');
    expect(recipeCardState(recipe('b'), 1, [], [])).toBe('open');
    expect(recipeCardState(recipe('c'), 2, [], [])).toBe('resting');
    expect(recipeCardState(recipe('c'), 2, ['a'], [])).toBe('open');
  });

  it('opens a recipe whose badge is already earned', () => {
    expect(recipeCardState(recipe('e', 'pizza-rescue'), 5, [], ['pizza-rescue'])).toBe('open');
  });

  it('averages the step stars, and never lands on zero', () => {
    expect(recipeStars([3, 3, 3])).toBe(3);
    expect(recipeStars([3, 2, 1])).toBe(2);
    expect(recipeStars([1, 1, 1])).toBe(1);
    expect(recipeStars([])).toBe(3);
  });
});


describe('the Count Ingredients pantry shelf', () => {
  const shelfCounts = <T extends { id: string }>(list: T[]) =>
    list.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.id]: (acc[item.id] ?? 0) + 1 }), {});

  it('lays out every required item before it runs out of shelf', () => {
    const needs = [
      { item: { id: 'tortilla' }, count: 6 },
      { item: { id: 'cheese' }, count: 4 },
      { item: { id: 'pepper' }, count: 2 },
    ];
    const spare = [{ id: 'tortilla' }, { id: 'cheese' }, { id: 'pepper' }, { id: 'tomato' }, { id: 'olive' }];
    const have = shelfCounts(pantryList(needs, spare, 14));
    for (const need of needs) expect(have[need.item.id] ?? 0).toBeGreaterThanOrEqual(need.count);
  });

  it('spends leftover room on spares and decoys, and never overflows', () => {
    const needs = [{ item: { id: 'apple' }, count: 3 }];
    const spare = [{ id: 'apple' }, { id: 'olive' }, { id: 'basil' }];
    const list = pantryList(needs, spare, 5);
    expect(list).toHaveLength(5);
    expect(shelfCounts(list)).toEqual({ apple: 4, olive: 1 });
  });

  it('keeps every required item even when the list is bigger than the shelf', () => {
    const needs = [{ item: { id: 'egg' }, count: 20 }];
    const list = pantryList(needs, [{ id: 'olive' }], 6);
    expect(list).toHaveLength(20);
    expect(list.every((w) => w.id === 'egg')).toBe(true);
  });

  /**
   * The real regression: Gino's quesadillas asked for two peppers and the old
   * shelf put none out at all, so the recipe could not be finished.
   */
  it('can supply every count-ingredients step of every real recipe, in every band', () => {
    const bands: AgeBand[] = ['A', 'B', 'C'];
    for (const recipe of recipes) {
      for (const [i, step] of recipe.steps.entries()) {
        if (step.game !== 'count-ingredients') continue;
        for (const ageBand of bands) {
          const challenge = step.challenge({ ageBand, rng: createRng(i * 31 + 7) }) as Extract<
            Challenge,
            { kind: 'count-ingredients' }
          >;
          const spare = [...challenge.needs.map((n) => n.item), ...challenge.extras];
          const have = shelfCounts(pantryList(challenge.needs, spare, 14));
          for (const need of challenge.needs) {
            const onShelf = have[need.item.id] ?? 0;
            if (onShelf < need.count) {
              throw new Error(
                `${recipe.id} (band ${ageBand}) asks for ${need.count} ${need.item.id} but the shelf holds ${onShelf}`,
              );
            }
          }
        }
      }
    }
  });
});
