import {
  adjustRange,
  masteryAdjustment,
  masteryFor,
  masteryVector,
  pickBandAdjustment,
  recapSubjects,
  skillLabel,
  skillTally,
  subjectForSkill,
  subjectOrder,
} from '@/learning/adaptive';
import { challengeSkills, type SkillTag } from '@/learning/types';
import { createRng } from '@/utils/rng';

const allSkills = Object.keys(
  Object.values(challengeSkills).flat().reduce<Record<string, true>>((acc, s) => ({ ...acc, [s]: true }), {}),
) as SkillTag[];

describe('masteryFor', () => {
  it('reads 0.5 when we have never seen the skill', () => {
    expect(masteryFor(undefined, 'counting')).toBe(0.5);
    expect(masteryFor({}, 'addition')).toBe(0.5);
  });

  it('stays between 0 and 1', () => {
    for (const attempts of [1, 5, 40]) {
      for (const correct of [0, 1, attempts]) {
        const value = masteryFor({ counting: { attempts, correct } }, 'counting');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('trusts a long record more than a lucky first try', () => {
    const lucky = masteryFor({ addition: { attempts: 1, correct: 1 } }, 'addition');
    const solid = masteryFor({ addition: { attempts: 20, correct: 20 } }, 'addition');
    expect(solid).toBeGreaterThan(lucky);
    expect(lucky).toBeLessThan(1);
  });

  it('builds a whole vector for a generator context', () => {
    const vector = masteryVector({ counting: { attempts: 10, correct: 9 }, time: { attempts: 4, correct: 1 } });
    expect(vector.counting).toBeGreaterThan(0.6);
    expect(vector.time).toBeLessThan(0.5);
  });
});

describe('pickBandAdjustment', () => {
  it('nudges up, down or not at all', () => {
    expect(pickBandAdjustment(0.1)).toBe(-1);
    expect(pickBandAdjustment(0.5)).toBe(0);
    expect(pickBandAdjustment(0.95)).toBe(1);
  });

  it('averages the skills it is given', () => {
    const ctx = { ageBand: 'B' as const, rng: createRng(1), mastery: { counting: 1, subtraction: 0.95 } };
    expect(masteryAdjustment(ctx, 'counting', 'subtraction')).toBe(1);
    expect(masteryAdjustment({ ...ctx, mastery: {} }, 'counting')).toBe(0);
    expect(masteryAdjustment({ ageBand: 'B', rng: createRng(1) }, 'counting')).toBe(0);
  });
});

describe('adjustRange', () => {
  it('never inverts or drops below the floor', () => {
    for (const adj of [-1, 0, 1] as const) {
      const [lo, hi] = adjustRange([3, 9], adj, 1);
      expect(lo).toBeGreaterThanOrEqual(1);
      expect(hi).toBeGreaterThanOrEqual(lo);
    }
  });
  it('moves the window in the right direction', () => {
    expect(adjustRange([4, 10], 1)[1]).toBeGreaterThan(10);
    expect(adjustRange([4, 10], -1)[0]).toBeLessThan(4);
  });
});

describe('skills, subjects and labels', () => {
  it('maps every skill to a subject', () => {
    for (const skill of allSkills) {
      expect(subjectOrder).toContain(subjectForSkill(skill));
    }
  });

  it('labels every skill in both languages', () => {
    for (const skill of allSkills) {
      const label = skillLabel(skill);
      expect(label.en.trim().length).toBeGreaterThan(0);
      expect(label.es.trim().length).toBeGreaterThan(0);
    }
  });

  it('builds recap chips in a stable order, without repeats', () => {
    const subjects = recapSubjects([
      { skills: ['vocabulary-es', 'counting'] },
      { skills: ['counting', 'reading-words'] },
      { skills: ['patterns'] },
    ]);
    expect(subjects).toEqual(['math', 'reading', 'spanish', 'logic']);
  });

  it('returns nothing for an empty shift', () => {
    expect(recapSubjects([])).toEqual([]);
  });

  it('tallies the skills a child practised most', () => {
    const tally = skillTally([{ skills: ['counting'] }, { skills: ['counting', 'addition'] }]);
    expect(tally[0]).toEqual({ skill: 'counting', count: 2 });
  });
});
