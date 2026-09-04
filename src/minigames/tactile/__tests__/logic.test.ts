import {
  bestNextPiece,
  clampNum,
  comboKey,
  combosForTarget,
  distractors,
  equationText,
  fits,
  fractionStageTargets,
  minJumps,
  optionsFor,
  sameCombo,
  sumOf,
} from '../shared/logic';

describe('ladder / barrier sums', () => {
  it('adds a stack up', () => {
    expect(sumOf([])).toBe(0);
    expect(sumOf([3, 4])).toBe(7);
    expect(sumOf([5, 4, 3])).toBe(12);
  });

  it('writes the equation the child sees', () => {
    expect(equationText([])).toBe('0');
    expect(equationText([3, 4])).toBe('3 + 4 = 7');
    expect(equationText([5, 4, 3])).toBe('5 + 4 + 3 = 12');
    expect(equationText([3, 4], false)).toBe('3 + 4');
  });

  it('treats 3+4 and 4+3 as the same answer', () => {
    expect(comboKey([3, 4])).toBe(comboKey([4, 3]));
    expect(sameCombo([2, 5, 1], [1, 2, 5])).toBe(true);
    expect(sameCombo([3, 4], [2, 5])).toBe(false);
  });

  it('knows when a piece still fits', () => {
    expect(fits([3, 4], 3, 10)).toBe(true);
    expect(fits([3, 4], 4, 10)).toBe(false);
    expect(fits([], 10, 10)).toBe(true);
  });

  it('suggests the longest piece that still fits', () => {
    expect(bestNextPiece([2, 5, 8], [3], 10)).toBe(5);
    expect(bestNextPiece([2, 5, 8], [], 10)).toBe(8);
    expect(bestNextPiece([6, 9], [5], 10)).toBeNull();
  });

  it('finds every distinct combination that hits the target', () => {
    const combos = combosForTarget([2, 3, 4, 5], 7);
    const keys = combos.map(comboKey).sort();
    expect(keys).toEqual(['2+5', '3+4']);
    combos.forEach((c) => expect(sumOf(c)).toBe(7));
  });

  it('never returns duplicate combinations', () => {
    const combos = combosForTarget([2, 2, 3, 3], 5);
    const keys = combos.map(comboKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('answer options', () => {
  it('gives distinct, non-negative distractors', () => {
    for (let correct = 0; correct <= 12; correct += 1) {
      const d = distractors(correct, 2, 0, 12);
      expect(d).toHaveLength(2);
      expect(new Set(d).size).toBe(2);
      expect(d).not.toContain(correct);
      d.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    }
  });

  it('always includes the right answer and is stable across calls', () => {
    const a = optionsFor(4, 2, 0, 8);
    const b = optionsFor(4, 2, 0, 8);
    expect(a).toEqual(b);
    expect(a).toContain(4);
    expect(a).toHaveLength(3);
  });
});

describe('fraction beats', () => {
  it('splits a half and a quarter of 8 flames, then sweeps up the rest', () => {
    expect(fractionStageTargets([{ num: 1, den: 2 }], 8)).toEqual([4, 4]);
    expect(
      fractionStageTargets(
        [
          { num: 1, den: 2 },
          { num: 1, den: 4 },
        ],
        8,
      ),
    ).toEqual([4, 2, 2]);
  });

  it('always sums to the flames available so the game can be finished', () => {
    for (const total of [3, 4, 5, 6, 8, 9, 12]) {
      const stages = fractionStageTargets([{ num: 1, den: 2 }, { num: 1, den: 3 }], total);
      expect(sumOf(stages)).toBe(total);
      stages.forEach((s) => expect(s).toBeGreaterThan(0));
    }
  });

  it('clamps a fraction that asks for more than is left', () => {
    expect(fractionStageTargets([{ num: 3, den: 4 }, { num: 3, den: 4 }], 4)).toEqual([3, 1]);
  });
});

describe('number ladder', () => {
  it('finds the shortest number of jumps', () => {
    expect(minJumps(7, 12, [1, 2, 5], 0, 20)).toBe(1);
    expect(minJumps(7, 13, [1, 2, 5], 0, 20)).toBe(2);
    expect(minJumps(3, 3, [1, 5], 0, 20)).toBe(0);
    expect(minJumps(0, 7, [5, -1], 0, 20)).toBe(5); // 5 → 10 → 9 → 8 → 7
  });

  it('respects the ends of the ladder', () => {
    expect(minJumps(0, 9, [5], 0, 8)).toBeNull();
    expect(minJumps(0, 4, [2], 0, 10)).toBe(2);
  });

  it('returns null for an unreachable target', () => {
    expect(minJumps(0, 7, [2], 0, 20)).toBeNull();
  });
});

describe('clampNum', () => {
  it('clamps both ways', () => {
    expect(clampNum(5, 0, 3)).toBe(3);
    expect(clampNum(-1, 0, 3)).toBe(0);
    expect(clampNum(2, 0, 3)).toBe(2);
  });
});
