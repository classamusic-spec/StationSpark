/**
 * CONTENT ↔ APP INTEGRITY
 *
 * The other content tests prove a mission is *internally* consistent. This one
 * proves it against the parts of the app that actually have to draw it:
 *
 *   · every `game` a mission or recipe names is REGISTERED in
 *     `src/minigames/registry.ts` — being a member of the `Challenge` union is
 *     not enough, because an unregistered kind renders an empty screen;
 *   · every `scene` is a real `SceneId` and every `location` a real `LocationId`;
 *   · every word a child is asked to pick out of a shelf has a picture on the
 *     `VocabIcon` sheet, and no two things on the same shelf share one — which
 *     holds both for the shelves a generator BUILDS and for the named shelves
 *     in `src/learning/shelves.ts` that a mission can point a beat at.
 *
 * The registry is read from the group index files as SOURCE rather than
 * imported, so this stays a pure-logic test: importing the registry would drag
 * Skia, Reanimated and twenty-seven React components into a data check.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeKind, GeneratorContext, SceneId, VocabWord } from '@/learning/types';
import { beatsForBand } from '@/machines/missionMachine';
import { missions } from '@/content/missions';
import { recipes } from '@/content/recipes';
import { shelfWords, shelves } from '@/learning/shelves';
import type { LocationId } from '@/content/types';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const SEEDS = [2, 31, 404, 7777];

const src = (...parts: string[]): string => readFileSync(join(__dirname, '..', '..', ...parts), 'utf8');

/** Kinds the registry really maps to a component, read off the three group files. */
const REGISTERED: Set<string> = (() => {
  const files = [
    src('minigames', 'tactile', 'index.ts'),
    src('minigames', 'logic', 'index.ts'),
    src('kitchen', 'games', 'index.ts'),
  ];
  const kinds = new Set<string>();
  for (const file of files) {
    for (const match of file.matchAll(/^\s*kind: '([a-z0-9-]+)',$/gm)) {
      if (match[1]) kinds.add(match[1]);
    }
  }
  return kinds;
})();

/** Icon ids the UI actually draws — read from the sheet so the two never drift. */
const ICON_IDS: Set<string> = (() => {
  const sheet = src('ui', 'kit', 'VocabIcon.tsx');
  const list = /export const vocabIconIds: readonly VocabIconId\[\] = \[([\s\S]*?)\];/.exec(sheet)?.[1] ?? '';
  return new Set(Array.from(list.matchAll(/'([a-z0-9-]+)'/g), (m) => m[1] ?? ''));
})();

/** Straight from `src/learning/types.ts`. A mission may only dress itself in one of these. */
const SCENE_IDS: SceneId[] = [
  'bakery', 'pizza', 'school', 'park', 'clock-tower',
  'apartments', 'pet-shop', 'library', 'market', 'station-yard',
];

const LOCATION_IDS: LocationId[] = [
  'station', 'bakery', 'school', 'library', 'park', 'pet-shop', 'market', 'pizza',
  'apartments', 'garden', 'museum', 'beach', 'festival', 'construction', 'train-station', 'clock-tower',
];

describe('the registry really has every game the content asks for', () => {
  it('found the registry (a silent empty read would make this file prove nothing)', () => {
    expect(REGISTERED.size).toBe(27);
    expect(REGISTERED.has('soup-pot')).toBe(true);
    expect(REGISTERED.has('truck-run')).toBe(true);
    expect(ICON_IDS.size).toBeGreaterThan(140);
  });

  it('every mission beat names a registered mini-game', () => {
    const missing: string[] = [];
    for (const mission of missions) {
      for (const beat of mission.beats) {
        if (beat.type === 'minigame' && !REGISTERED.has(beat.game)) missing.push(`${mission.id} → ${beat.game}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every recipe step names a registered mini-game', () => {
    const missing: string[] = [];
    for (const recipe of recipes) {
      for (const step of recipe.steps) {
        if (!REGISTERED.has(step.game)) missing.push(`${recipe.id} → ${step.game}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every mission stands in a real scene, at a real place on the map', () => {
    for (const mission of missions) {
      expect(SCENE_IDS).toContain(mission.scene);
      expect(LOCATION_IDS).toContain(mission.location);
      for (const beat of mission.beats) {
        if (beat.type === 'travel') {
          expect(LOCATION_IDS).toContain(beat.from);
          expect(LOCATION_IDS).toContain(beat.to);
        }
        if (beat.type === 'scene') expect(LOCATION_IDS).toContain(beat.location);
        if (beat.type === 'dialogue' && beat.backdrop) expect(SCENE_IDS).toContain(beat.backdrop);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Everything a child picks out of a crowd has to be tellable apart     */
/* ------------------------------------------------------------------ */

const shelfOf = (challenge: { kind: ChallengeKind }): VocabWord[] => {
  if (challenge.kind === 'count-ingredients') {
    const c = challenge as unknown as { needs: { item: VocabWord }[]; extras: VocabWord[] };
    return [...c.needs.map((n) => n.item), ...c.extras];
  }
  if (challenge.kind === 'soup-pot') {
    const c = challenge as unknown as { steps: { item: VocabWord }[]; extras: VocabWord[] };
    return [...c.steps.map((s) => s.item), ...c.extras];
  }
  if (challenge.kind === 'vocab-tap') return (challenge as unknown as { options: VocabWord[] }).options;
  if (challenge.kind === 'recipe-scale') {
    return (challenge as unknown as { lines: { item: VocabWord }[] }).lines.map((l) => l.item);
  }
  return [];
};

const describeShelf = (where: string, words: readonly VocabWord[]): string[] => {
  const problems: string[] = [];
  const seen = new Map<string, string>();
  for (const word of words) {
    if (!ICON_IDS.has(word.icon)) problems.push(`${where}: “${word.en}” wants an icon called ${word.icon}`);
    const twin = seen.get(word.icon);
    if (twin && twin !== word.id) problems.push(`${where}: ${twin} and ${word.id} are both drawn as ${word.icon}`);
    seen.set(word.icon, word.id);
  }
  return problems;
};

describe('the named shelves a mission can point at', () => {
  /*
   * `src/learning/shelves.ts` is the one place a mission can say "ask about
   * harbour words" and get a coherent board back. It is only usable by EVERY
   * game — including the ones a child picks from by picture alone — if no two
   * words on a shelf are drawn the same, so that promise is checked here at the
   * content ↔ app boundary as well as in the shelf's own unit test.
   */
  it('draws every word, and never draws two of them the same', () => {
    const problems: string[] = [];
    for (const shelf of shelves) problems.push(...describeShelf(`shelf/${shelf.id}`, shelfWords(shelf.id)));
    expect(problems).toEqual([]);
  });

  it('has enough on every shelf to fill a four-picture board', () => {
    for (const shelf of shelves) expect(shelfWords(shelf.id).length).toBeGreaterThanOrEqual(4);
  });
});

describe('nothing on a shelf is drawn the same as anything else on it', () => {
  it('holds across every mission beat, every band, every seed', () => {
    const problems: string[] = [];
    for (const mission of missions) {
      for (const band of BANDS) {
        for (const seed of SEEDS) {
          const ctx: GeneratorContext = { ageBand: band, rng: createRng(seed), scene: mission.scene };
          for (const beat of beatsForBand(mission, band)) {
            if (beat.type !== 'minigame') continue;
            problems.push(...describeShelf(`${mission.id}/${beat.game}/${band}`, shelfOf(beat.challenge(ctx))));
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('holds across every recipe step, every band, every seed', () => {
    const problems: string[] = [];
    for (const recipe of recipes) {
      for (const band of BANDS) {
        for (const seed of SEEDS) {
          const ctx: GeneratorContext = { ageBand: band, rng: createRng(seed) };
          for (const step of recipe.steps) {
            if (step.bands && !step.bands.includes(band)) continue;
            problems.push(...describeShelf(`${recipe.id}/${step.game}/${band}`, shelfOf(step.challenge(ctx))));
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('every ingredient, topping and stall item a recipe names is drawable', () => {
    const problems: string[] = [];
    for (const recipe of recipes) {
      for (const band of BANDS) {
        const ctx: GeneratorContext = { ageBand: band, rng: createRng(11) };
        for (const step of recipe.steps) {
          if (step.bands && !step.bands.includes(band)) continue;
          const challenge = step.challenge(ctx);
          if (challenge.kind === 'measure-pour' && !ICON_IDS.has(challenge.ingredient.icon)) {
            problems.push(`${recipe.id}: ${challenge.ingredient.en} → ${challenge.ingredient.icon}`);
          }
          if (challenge.kind === 'divide-share' && !ICON_IDS.has(challenge.item.icon)) {
            problems.push(`${recipe.id}: ${challenge.item.en} → ${challenge.item.icon}`);
          }
          if (challenge.kind === 'market-money' && !ICON_IDS.has(challenge.item.icon)) {
            problems.push(`${recipe.id}: ${challenge.item.en} → ${challenge.item.icon}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
