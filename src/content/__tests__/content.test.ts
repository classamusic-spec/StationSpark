/** Badges, ranks, upgrades, recipes and the dispatch board. */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeKind, GeneratorContext } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { validateChallenge } from '@/learning/validate';
import { vocabulary } from '@/learning/vocabulary';
import {
  badgeById,
  badges,
  earnedSkillBadges,
  newlyEarnedBadges,
  TOTAL_MISSIONS,
  TOTAL_RECIPES,
  type BadgeProgressLike,
} from '@/content/badges';
import { buildDispatchBoard, dispatchBoardMissions, daySeed, rustiestSubject, subjectPractice } from '@/content/dispatchBoard';
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
  'library-lights', 'pet-parade', 'market-helper', 'museum-detective', 'timetable-pro',
  'rescue-exchange', 'time-traveler', 'shape-shaper', 'chef-de-station', 'bilingual-buddy',
];

const ALL_UPGRADE_IDS: StationUpgradeId[] = [
  'kitchen-2', 'truck-bay-2', 'garden', 'library-corner', 'training-tower', 'map-room-2',
  'pet-area', 'roof-garden', 'community-table', 'flag-gold', 'bell-brass', 'mural',
  'reading-nook', 'world-map', 'festival-lights', 'garden-pond',
];

const ALL_RECIPE_IDS = [
  'bread', 'pancakes', 'pizza', 'smoothie', 'soup', 'tacos',
  'quesadillas', 'fruit-salad', 'lemonade', 'garden-salsa',
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

  it('awards Community Helper only after every mission in town', () => {
    const progress = {
      ...emptyProgress(),
      missions: Object.fromEntries(missions.map((m) => [m.id, { stars: 3 }])),
    };
    expect(earnedSkillBadges(progress)).toContain('community-helper');
    const allButOne = {
      ...emptyProgress(),
      missions: Object.fromEntries(missions.slice(1).map((m) => [m.id, { stars: 3 }])),
    };
    expect(earnedSkillBadges(allButOne)).not.toContain('community-helper');
  });

  it('keeps its mission and recipe totals in step with the content', () => {
    expect(TOTAL_MISSIONS).toBe(missions.length);
    expect(TOTAL_RECIPES).toBe(recipes.length);
  });

  it('gives every mission its own badge', () => {
    const missionBadges = missions.map((m) => m.badge);
    expect(new Set(missionBadges).size).toBe(missions.length);
    for (const id of missionBadges) expect(badges.some((b) => b.id === id)).toBe(true);
  });

  it('awards Time Traveller at five clocks, after Time Keeper at three', () => {
    const three = { ...emptyProgress(), gamesPlayed: { 'clock-watch': 3 } };
    expect(earnedSkillBadges(three)).toContain('time-keeper');
    expect(earnedSkillBadges(three)).not.toContain('time-traveler');
    const five = { ...emptyProgress(), gamesPlayed: { 'clock-watch': 5 } };
    expect(earnedSkillBadges(five)).toEqual(expect.arrayContaining(['time-keeper', 'time-traveler']));
  });

  it('awards Shape Shaper after three shape games', () => {
    const two = { ...emptyProgress(), gamesPlayed: { 'hose-path': 1, 'build-barrier': 1 } };
    expect(earnedSkillBadges(two)).not.toContain('shape-shaper');
    const three = { ...emptyProgress(), gamesPlayed: { 'hose-path': 1, 'build-barrier': 1, 'pizza-fractions': 1 } };
    expect(earnedSkillBadges(three)).toContain('shape-shaper');
  });

  it('awards Chef de Station only for the whole recipe book', () => {
    const nine = { ...emptyProgress(), recipes: recipes.slice(1).map((r) => r.id) };
    expect(earnedSkillBadges(nine)).toContain('kitchen-pro');
    expect(earnedSkillBadges(nine)).not.toContain('chef-de-station');
    const all = { ...emptyProgress(), recipes: recipes.map((r) => r.id) };
    expect(earnedSkillBadges(all)).toContain('chef-de-station');
  });

  it('awards Bilingual Buddy at thirty Spanish words', () => {
    const words = vocabulary.slice(0, 29).map((w) => w.id);
    expect(earnedSkillBadges({ ...emptyProgress(), words })).not.toContain('bilingual-buddy');
    const thirty = vocabulary.slice(0, 30).map((w) => w.id);
    expect(earnedSkillBadges({ ...emptyProgress(), words: thirty })).toEqual(
      expect.arrayContaining(['spanish-speaker', 'bilingual-buddy']),
    );
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

  it('is reachable by playing the town a few times', () => {
    const perRun = missions.reduce((sum, m) => sum + m.xp, 0);
    // One full tour of the twelve missions gets past Problem Solver…
    expect(perRun).toBeGreaterThan(ranks[3]?.minXp ?? 0);
    // …and the top rank still needs more than one tour, plus recipes and training.
    expect(perRun).toBeLessThan(ranks[ranks.length - 1]?.minXp ?? 0);
    const withKitchen = perRun + recipes.reduce((sum, r) => sum + r.xp, 0);
    expect(withKitchen).toBeLessThan(ranks[ranks.length - 1]?.minXp ?? 0);
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

  it('adds the four rooms the new missions unlock, in rooms that exist', () => {
    const rooms = new Set(['kitchen', 'garage', 'yard', 'classroom', 'dispatch', 'roof', 'facade', 'badge-wall']);
    for (const upgrade of upgrades) expect(rooms.has(upgrade.room)).toBe(true);
    expect(upgradeById('world-map').room).toBe('dispatch');
    expect(upgradeById('festival-lights').room).toBe('facade');
    expect(upgradeById('reading-nook').room).toBe('classroom');
    expect(upgradeById('garden-pond').room).toBe('yard');
    // One tour of the town pays for the World Map the Exchange teases.
    const wholeTown = missions.reduce((sum, m) => sum + m.sparks, 0);
    expect(wholeTown).toBeGreaterThanOrEqual(upgradeById('world-map').cost);
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
  it('ships all ten recipe ids', () => {
    expect(recipes.map((r) => r.id).sort()).toEqual([...ALL_RECIPE_IDS].sort());
    expect(new Set(recipes.map((r) => r.id)).size).toBe(recipes.length);
    expect(recipeById('tacos')?.name).toBe('Station Tacos');
    expect(recipeById('pizza')?.steps.length).toBeGreaterThan(0);
    expect(recipeById('garden-salsa')?.steps.length).toBeGreaterThan(0);
  });

  it('gives every recipe at least two cooking steps', () => {
    for (const recipe of recipes) expect(recipe.steps.length).toBeGreaterThanOrEqual(2);
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
        for (const seed of [1, 17, 88, 404, 1234]) {
          const ctx: GeneratorContext = { ageBand: band, rng: createRng(seed) };
          const challenge = step.challenge(ctx);
          expect(challenge.kind).toBe(step.game);
          expect(validateChallenge(challenge)).toEqual([]);
        }
      }
    }
  });

  it.each(BANDS)('band %s: every recipe still has something to cook', (band) => {
    for (const recipe of recipes) {
      const steps = recipe.steps.filter((s) => !s.bands || s.bands.includes(band));
      expect(steps.length).toBeGreaterThanOrEqual(2);
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

  it('shares twelve quesadillas between four, and four between two for the youngest', () => {
    const step = recipeById('quesadillas')?.steps.find((s) => s.game === 'divide-share');
    const young = step?.challenge({ ageBand: 'A', rng: createRng(6) });
    const older = step?.challenge({ ageBand: 'B', rng: createRng(6) });
    if (young?.kind !== 'divide-share' || older?.kind !== 'divide-share') throw new Error('expected divide-share');
    expect([young.total, young.among, young.each]).toEqual([8, 2, 4]);
    expect([older.total, older.among, older.each]).toEqual([12, 4, 3]);
    expect(older.item.id).toBe('quesadilla');
  });

  it('makes the garden salsa from tomate, cebolla, cilantro and limón', () => {
    const step = recipeById('garden-salsa')?.steps.find((s) => s.game === 'count-ingredients');
    const pour = recipeById('garden-salsa')?.steps.find((s) => s.game === 'measure-pour');
    const counted = step?.challenge({ ageBand: 'C', rng: createRng(7) });
    const poured = pour?.challenge({ ageBand: 'C', rng: createRng(7) });
    if (counted?.kind !== 'count-ingredients' || poured?.kind !== 'measure-pour') throw new Error('unexpected kinds');
    expect(counted.needs.map((n) => n.item.id)).toEqual(['tomato', 'onion', 'cilantro']);
    expect(counted.spokenEs).toBe(true);
    expect(poured.ingredient.es).toBe('limón');
  });

  it('scales the lemonade only for the oldest crew, and keeps the ratio whole', () => {
    const scale = recipeById('lemonade')?.steps.find((s) => s.game === 'recipe-scale');
    expect(scale?.bands).toEqual(['C']);
    const honey = recipeById('lemonade')?.steps.filter((s) => s.game === 'measure-pour')[1];
    const poured = honey?.challenge({ ageBand: 'B', rng: createRng(8) });
    if (poured?.kind !== 'measure-pour') throw new Error('expected measure-pour');
    expect(poured.target).toEqual({ num: 1, den: 4 });
    expect(poured.unit).toBe('spoon');
  });

  it('pours, counts and shares the fruit salad for every band', () => {
    const recipe = recipeById('fruit-salad');
    expect(recipe?.steps.map((s) => s.game)).toEqual(['count-ingredients', 'measure-pour', 'divide-share']);
    const counted = recipe?.steps[0]?.challenge({ ageBand: 'A', rng: createRng(9) });
    if (counted?.kind !== 'count-ingredients') throw new Error('expected count-ingredients');
    expect(counted.needs).toHaveLength(2);
  });

  it('hands out Recipe Rescuer at three, Kitchen Pro at five and Chef de Station at ten', () => {
    expect(badgesForRecipes(0)).toEqual([]);
    expect(badgesForRecipes(2)).toEqual([]);
    expect(badgesForRecipes(3)).toEqual(['recipe-rescuer']);
    expect(badgesForRecipes(5)).toEqual(['recipe-rescuer', 'kitchen-pro']);
    expect(badgesForRecipes(6)).toEqual(['recipe-rescuer', 'kitchen-pro']);
    expect(badgesForRecipes(recipes.length)).toEqual(['recipe-rescuer', 'kitchen-pro', 'chef-de-station']);
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
    const done = ['clock-tower-cat', 'bakery-bell', 'pizza-shop-panic', 'park-picnic'];
    for (let seed = 1; seed <= 60; seed++) {
      const ids = board(done, 2, seed);
      expect(ids.some((id) => done.includes(id))).toBe(false);
    }
  });

  it('never sends the crew to the same building twice on one board', () => {
    // pet-shop-parade and community-cleanup share 6 Maple Street on purpose.
    for (let seed = 1; seed <= 200; seed++) {
      for (const size of [2, 3, 4]) {
        for (const ageBand of BANDS) {
          const ids = buildDispatchBoard({
            progress: { missions: Object.fromEntries(missions.map((m) => [m.id, { stars: 3 }])) },
            ageBand,
            rng: createRng(seed),
            size,
          });
          const locations = ids.map((id) => missionById(id)?.location);
          expect(new Set(locations).size).toBe(locations.length);
        }
      }
    }
  });

  it('leads with the subject the child has practised least', () => {
    const played = Object.fromEntries(missions.map((m) => [m.id, { stars: 3 }]));
    // Everything solid except Spanish, which is wobbly.
    const mastery = {
      counting: { attempts: 20, correct: 20 },
      addition: { attempts: 20, correct: 20 },
      'reading-words': { attempts: 20, correct: 20 },
      patterns: { attempts: 20, correct: 20 },
      'vocabulary-es': { attempts: 20, correct: 2 },
      'listening-es': { attempts: 20, correct: 1 },
    };
    expect(rustiestSubject(mastery)).toBe('spanish');
    for (let seed = 1; seed <= 40; seed++) {
      const ids = buildDispatchBoard({ progress: { missions: played, mastery }, ageBand: 'B', rng: createRng(seed), size: 1 });
      const first = missionById(ids[0] ?? '');
      expect(first?.subjects).toContain('spanish');
    }
  });

  it('reads practice as neutral until there is evidence', () => {
    expect(rustiestSubject(undefined)).toBeUndefined();
    expect(rustiestSubject({})).toBeUndefined();
    const practice = subjectPractice(undefined);
    expect(practice.math).toBe(0.5);
    expect(practice.spanish).toBe(0.5);
  });

  it('then prefers the lowest star count once everything has been played', () => {
    const played = Object.fromEntries(missions.map((m) => [m.id, { stars: m.id === 'school-fair' ? 1 : 3 }]));
    for (let seed = 1; seed <= 40; seed++) {
      const ids = buildDispatchBoard({ progress: { missions: played }, ageBand: 'B', rng: createRng(seed), size: 1 });
      expect(ids).toEqual(['school-fair']);
    }
  });

  it('keeps a variety of subjects on the board', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const ids = board(missions.map((m) => m.id), 3, seed);
      const subjects = new Set(ids.flatMap((id) => missionById(id)?.subjects ?? []));
      expect(subjects.size).toBeGreaterThanOrEqual(4);
    }
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

  it('resolves the board to mission definitions, in board order', () => {
    const defs = dispatchBoardMissions({ completed: [], ageBand: 'A', seed: 2, size: 3 });
    expect(defs.every((m) => (m.requires ?? []).length === 0)).toBe(true);
    const ids = buildDispatchBoard({ completed: [], ageBand: 'A', seed: 2, size: 3 });
    expect(defs.map((m) => m.id)).toEqual(ids);
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
