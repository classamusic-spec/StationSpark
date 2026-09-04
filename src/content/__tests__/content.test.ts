/** Badges, ranks, upgrades, recipes and the dispatch board. */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeKind, GeneratorContext } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { validateChallenge } from '@/learning/validate';
import { badgeById, badges, earnedSkillBadges, newlyEarnedBadges, type BadgeProgressLike } from '@/content/badges';
import { buildDispatchBoard, dispatchBoardMissions, daySeed } from '@/content/dispatchBoard';
import { missionById, missions, unlockedMissions } from '@/content/missions';
import { nextRank, rankForXp, rankProgress, ranks } from '@/content/ranks';
import { badgesForRecipes, recipeById, recipes } from '@/content/recipes';
import { affordableUpgrades, upgradeById, upgrades, upgradesForRoom } from '@/content/upgrades';
import type { BadgeId, StationUpgradeId } from '@/content/types';

const BANDS: AgeBand[] = ['A', 'B', 'C'];

const ALL_BADGE_IDS: BadgeId[] = [
  'first-shift', 'number-navigator', 'fraction-firefighter', 'hose-hero', 'word-watcher',
  'spanish-speaker', 'recipe-rescuer', 'map-master', 'pattern-pro', 'team-player',
  'community-helper', 'clock-tower-cat', 'bakery-bell', 'pizza-rescue', 'park-picnic',
  'school-fair', 'clean-up-crew', 'kitchen-pro', 'ladder-legend', 'time-keeper',
];

const ALL_UPGRADE_IDS: StationUpgradeId[] = [
  'kitchen-2', 'truck-bay-2', 'garden', 'library-corner', 'training-tower', 'map-room-2',
  'pet-area', 'roof-garden', 'community-table', 'flag-gold', 'bell-brass', 'mural',
];

const BADGE_ICONS = new Set([
  'flame', 'star', 'chef-hat', 'ladder', 'hose', 'book', 'speech-bubble', 'map', 'pattern',
  'hands', 'heart', 'cat', 'bread', 'pizza', 'picnic', 'school', 'broom', 'clock', 'numbers',
]);

const emptyProgress = (): BadgeProgressLike => ({
  missions: {},
  badges: [],
  words: [],
  recipes: [],
  gamesPlayed: {},
  shiftDays: [],
});

/* ------------------------------------------------------------------ */

describe('badges', () => {
  it('covers every BadgeId exactly once', () => {
    expect(badges.map((b) => b.id).sort()).toEqual([...ALL_BADGE_IDS].sort());
    expect(new Set(badges.map((b) => b.id)).size).toBe(badges.length);
  });

  it('names, describes and colours every badge', () => {
    for (const badge of badges) {
      expect(badge.name.trim().length).toBeGreaterThan(0);
      expect(badge.nameEs?.trim().length).toBeGreaterThan(0);
      expect(badge.description.trim().length).toBeGreaterThan(0);
      expect(badge.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(BADGE_ICONS.has(badge.icon)).toBe(true);
    }
  });

  it('looks a badge up by id', () => {
    expect(badgeById('pizza-rescue').name).toBe('Pizza Rescue');
  });

  it('has a badge for every mission', () => {
    for (const mission of missions) expect(badges.some((b) => b.id === mission.badge)).toBe(true);
  });

  it('gives nothing away for free', () => {
    expect(earnedSkillBadges(emptyProgress())).toEqual([]);
  });

  it('awards First Shift after the very first mission', () => {
    const progress = { ...emptyProgress(), missions: { 'clock-tower-cat': { stars: 2 } } };
    expect(earnedSkillBadges(progress)).toContain('first-shift');
    expect(earnedSkillBadges(progress)).not.toContain('community-helper');
  });

  it('awards Community Helper only after all six missions', () => {
    const progress = {
      ...emptyProgress(),
      missions: Object.fromEntries(missions.map((m) => [m.id, { stars: 3 }])),
    };
    expect(earnedSkillBadges(progress)).toContain('community-helper');
  });

  it('counts number games, fractions, ladders, hoses, routes, patterns and clocks', () => {
    const progress: BadgeProgressLike = {
      ...emptyProgress(),
      gamesPlayed: {
        'number-ladder': 3,
        'hydrant-match': 2,
        'ladder-builder': 3,
        'water-tank': 2,
        'measure-pour': 1,
        'hose-hero': 3,
        'rescue-route': 3,
        'spray-pattern': 3,
        'clock-watch': 3,
      },
    };
    const earned = earnedSkillBadges(progress);
    expect(earned).toEqual(
      expect.arrayContaining(['number-navigator', 'fraction-firefighter', 'ladder-legend', 'hose-hero', 'map-master', 'pattern-pro', 'time-keeper']),
    );
  });

  it('needs 20 words for Word Watcher and 10 Spanish words for Spanish Speaker', () => {
    const nine = { ...emptyProgress(), words: ['hose', 'ladder', 'cone', 'helmet', 'water', 'apple', 'bread', 'milk', 'cat'] };
    expect(earnedSkillBadges(nine)).not.toContain('spanish-speaker');
    const ten = { ...nine, words: [...nine.words, 'dog'] };
    expect(earnedSkillBadges(ten)).toContain('spanish-speaker');
    expect(earnedSkillBadges(ten)).not.toContain('word-watcher');
    const twenty = { ...nine, words: Array.from({ length: 20 }, (_, i) => `w${i}`) };
    expect(earnedSkillBadges(twenty)).toContain('word-watcher');
  });

  it('needs three shifts for Team Player', () => {
    expect(earnedSkillBadges({ ...emptyProgress(), shiftDays: ['a', 'b'] })).not.toContain('team-player');
    expect(earnedSkillBadges({ ...emptyProgress(), shiftDays: ['a', 'b', 'c'] })).toContain('team-player');
  });

  it('only reports badges that are actually new', () => {
    const progress: BadgeProgressLike = {
      ...emptyProgress(),
      missions: { 'clock-tower-cat': { stars: 3 } },
      badges: ['first-shift'],
    };
    expect(newlyEarnedBadges(progress)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */

describe('ranks', () => {
  it('climbs monotonically', () => {
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]?.minXp).toBeGreaterThan(ranks[i - 1]?.minXp ?? -1);
    }
  });

  it('starts at zero and never goes backwards as XP grows', () => {
    expect(rankForXp(0).id).toBe('cadet');
    let lastIndex = 0;
    for (let xp = 0; xp <= 2000; xp += 10) {
      const index = ranks.findIndex((r) => r.id === rankForXp(xp).id);
      expect(index).toBeGreaterThanOrEqual(lastIndex);
      lastIndex = index;
    }
  });

  it('reports progress toward the next rank', () => {
    const progress = rankProgress(120);
    expect(progress.current.id).toBe('helper');
    expect(progress.next?.id).toBe('crew-member');
    expect(progress.t).toBeGreaterThan(0);
    expect(progress.t).toBeLessThan(1);
    expect(nextRank(5000)).toBeNull();
    expect(rankProgress(5000).t).toBe(1);
  });

  it('is reachable by playing the six missions a few times', () => {
    const perRun = missions.reduce((sum, m) => sum + m.xp, 0);
    expect(perRun).toBeGreaterThan(ranks[2]?.minXp ?? 0);
  });
});

/* ------------------------------------------------------------------ */

describe('station upgrades', () => {
  it('covers every StationUpgradeId exactly once', () => {
    expect(upgrades.map((u) => u.id).sort()).toEqual([...ALL_UPGRADE_IDS].sort());
  });

  it('costs between 20 and 120 Sparks', () => {
    for (const upgrade of upgrades) {
      expect(upgrade.cost).toBeGreaterThanOrEqual(20);
      expect(upgrade.cost).toBeLessThanOrEqual(120);
      expect(upgrade.name.trim().length).toBeGreaterThan(0);
      expect(upgrade.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('is affordable by playing: two missions buy the first decoration', () => {
    const twoMissions = (missions[0]?.sparks ?? 0) + (missions[1]?.sparks ?? 0);
    expect(affordableUpgrades(twoMissions, []).length).toBeGreaterThan(0);
    const wholeTown = missions.reduce((sum, m) => sum + m.sparks, 0);
    expect(affordableUpgrades(wholeTown, []).length).toBeGreaterThan(3);
  });

  it('groups by room, cheapest first, and never re-sells what you own', () => {
    const kitchen = upgradesForRoom('kitchen');
    expect(kitchen.length).toBeGreaterThan(0);
    expect(kitchen.map((u) => u.cost)).toEqual([...kitchen.map((u) => u.cost)].sort((a, b) => a - b));
    expect(affordableUpgrades(999, ALL_UPGRADE_IDS)).toEqual([]);
    expect(upgradeById('mural').room).toBe('badge-wall');
  });
});

/* ------------------------------------------------------------------ */

describe('recipes', () => {
  it('ships all six recipe ids', () => {
    expect(recipes.map((r) => r.id).sort()).toEqual(['bread', 'pancakes', 'pizza', 'smoothie', 'soup', 'tacos']);
    expect(recipeById('tacos')?.name).toBe('Station Tacos');
    expect(recipeById('pizza')?.steps.length).toBeGreaterThan(0);
  });

  it('has a warm intro and a name in both languages', () => {
    for (const recipe of recipes) {
      expect(recipe.name.trim().length).toBeGreaterThan(0);
      expect(recipe.nameEs?.trim().length).toBeGreaterThan(0);
      expect(recipe.blurb.trim().length).toBeGreaterThan(0);
      expect((recipe.intro ?? []).length).toBeGreaterThan(0);
      expect(recipe.intro?.[0]?.speaker).toBe('bea');
      expect(recipe.xp).toBeGreaterThan(0);
    }
  });

  it('tells kids to ask a grown-up whenever heat or a knife is involved', () => {
    for (const recipe of recipes.filter((r) => r.grownUp)) {
      const text = (recipe.intro ?? []).map((l) => l.text).join(' ');
      expect(text.toLowerCase()).toContain('ask a grown-up');
      expect(text.toLowerCase()).toContain('crew handles');
    }
  });

  it.each(BANDS)('band %s: every step generates a playable challenge', (band) => {
    for (const recipe of recipes) {
      for (const step of recipe.steps) {
        if (step.bands && !step.bands.includes(band)) continue;
        for (const seed of [1, 17, 88]) {
          const ctx: GeneratorContext = { ageBand: band, rng: createRng(seed) };
          const challenge = step.challenge(ctx);
          expect(challenge.kind).toBe(step.game);
          expect(validateChallenge(challenge)).toEqual([]);
        }
      }
    }
  });

  it('only uses kitchen-shaped challenge kinds', () => {
    const kinds = new Set(Object.keys(challengeSkills) as ChallengeKind[]);
    for (const recipe of recipes) for (const step of recipe.steps) expect(kinds.has(step.game)).toBe(true);
  });

  it('cuts the pizza half cheese, quarter mushroom, quarter pepper for older crews', () => {
    const step = recipeById('pizza')?.steps.find((s) => s.game === 'pizza-fractions');
    const challenge = step?.challenge({ ageBand: 'C', rng: createRng(1) });
    if (challenge?.kind !== 'pizza-fractions') throw new Error('expected pizza-fractions');
    expect(challenge.cutInto).toBe(8);
    expect(challenge.shareAmong).toBe(4);
    expect(challenge.each).toBe(2);
    expect(challenge.toppings.map((t) => t.topping)).toEqual(['cheese', 'mushroom', 'pepper']);
  });

  it('shares twelve tacos between four firefighters', () => {
    const step = recipeById('tacos')?.steps.find((s) => s.game === 'divide-share');
    for (const band of BANDS) {
      const challenge = step?.challenge({ ageBand: band, rng: createRng(2) });
      if (challenge?.kind !== 'divide-share') throw new Error('expected divide-share');
      expect(challenge.total).toBe(12);
      expect(challenge.among).toBe(4);
      expect(challenge.each).toBe(3);
    }
  });

  it('makes the smoothie with three strawberries, two bananas and half a cup of milk', () => {
    const recipe = recipeById('smoothie');
    const count = recipe?.steps.find((s) => s.game === 'count-ingredients')?.challenge({ ageBand: 'A', rng: createRng(3) });
    const pour = recipe?.steps.find((s) => s.game === 'measure-pour')?.challenge({ ageBand: 'A', rng: createRng(3) });
    if (count?.kind !== 'count-ingredients' || pour?.kind !== 'measure-pour') throw new Error('unexpected kinds');
    expect(count.needs.map((n) => [n.item.id, n.count])).toEqual([['strawberry', 3], ['banana', 2]]);
    expect(pour.ingredient.id).toBe('milk');
    expect(pour.target).toEqual({ num: 1, den: 2 });
  });

  it('scales the soup from four to six for the oldest crew only', () => {
    const step = recipeById('soup')?.steps.find((s) => s.game === 'recipe-scale');
    expect(step?.bands).toEqual(['C']);
    const challenge = step?.challenge({ ageBand: 'C', rng: createRng(4) });
    if (challenge?.kind !== 'recipe-scale') throw new Error('expected recipe-scale');
    expect(challenge.serves).toBe(4);
    expect(challenge.eating).toBe(6);
  });

  it('hands out Recipe Rescuer at three and Kitchen Pro at five', () => {
    expect(badgesForRecipes(0)).toEqual([]);
    expect(badgesForRecipes(2)).toEqual([]);
    expect(badgesForRecipes(3)).toEqual(['recipe-rescuer']);
    expect(badgesForRecipes(5)).toEqual(['recipe-rescuer', 'kitchen-pro']);
    expect(badgesForRecipes(6)).toEqual(['recipe-rescuer', 'kitchen-pro']);
  });
});

/* ------------------------------------------------------------------ */

describe('dispatch board', () => {
  const board = (progressIds: string[], size = 3, seed = 1, ageBand: AgeBand = 'B') =>
    buildDispatchBoard({
      progress: { missions: Object.fromEntries(progressIds.map((id) => [id, { stars: 3 }])) },
      ageBand,
      rng: createRng(seed),
      size,
    });

  it('never puts a locked mission on the board', () => {
    for (let seed = 1; seed <= 120; seed++) {
      for (const done of [[], ['clock-tower-cat'], ['clock-tower-cat', 'bakery-bell'], ['bakery-bell', 'park-picnic']]) {
        const open = new Set(unlockedMissions(done).map((m) => m.id));
        for (const id of board(done, 3, seed)) expect(open.has(id)).toBe(true);
      }
    }
  });

  it('never repeats a mission', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const ids = board(['clock-tower-cat', 'bakery-bell', 'pizza-shop-panic'], 3, seed);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('is the right size, or as big as the unlocked set allows', () => {
    expect(board([], 3)).toHaveLength(2); // only two missions open on day one
    expect(board(missions.map((m) => m.id), 3)).toHaveLength(3);
    expect(board(missions.map((m) => m.id), 1)).toHaveLength(1);
  });

  it('prefers missions the child has not played yet', () => {
    const ids = board(['clock-tower-cat', 'bakery-bell', 'pizza-shop-panic', 'park-picnic'], 2);
    expect(ids).toContain('school-fair');
  });

  it('then prefers the lowest star count once everything has been played', () => {
    const played = Object.fromEntries(missions.map((m) => [m.id, { stars: m.id === 'school-fair' ? 1 : 3 }]));
    for (let seed = 1; seed <= 40; seed++) {
      const ids = buildDispatchBoard({ progress: { missions: played }, ageBand: 'B', rng: createRng(seed), size: 1 });
      expect(ids).toEqual(['school-fair']);
    }
  });

  it('keeps a variety of subjects on the board', () => {
    const ids = board(missions.map((m) => m.id), 3, 7);
    const subjects = new Set(ids.flatMap((id) => missionById(id)?.subjects ?? []));
    expect(subjects.size).toBeGreaterThanOrEqual(4);
  });

  it('is the same board all day and a different one tomorrow', () => {
    const today = daySeed('2026-09-04T08:00:00.000Z');
    const later = daySeed('2026-09-04T22:30:00.000Z');
    const tomorrow = daySeed('2026-09-05T08:00:00.000Z');
    expect(today).toBe(later);
    expect(today).not.toBe(tomorrow);
    const opts = { ageBand: 'B' as const, seed: today, size: 3, completed: ['clock-tower-cat', 'bakery-bell'] };
    expect(buildDispatchBoard(opts)).toEqual(buildDispatchBoard(opts));
  });

  it('accepts a plain list of completed ids as well as a progress object', () => {
    const fromIds = buildDispatchBoard({ completed: ['clock-tower-cat'], ageBand: 'A', seed: 3, size: 3 });
    expect(fromIds.length).toBeGreaterThan(0);
    expect(fromIds.every((id) => missionById(id))).toBe(true);
  });

  it('resolves the board to mission definitions', () => {
    const defs = dispatchBoardMissions({ completed: [], ageBand: 'A', seed: 2, size: 3 });
    expect(defs.every((m) => (m.requires ?? []).length === 0)).toBe(true);
  });

  it('works for every band and size', () => {
    for (const ageBand of BANDS) {
      for (const size of [1, 2, 3, 4, 6]) {
        const ids = buildDispatchBoard({ completed: missions.map((m) => m.id), ageBand, seed: size, size });
        expect(ids).toHaveLength(Math.min(size, missions.length));
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});
