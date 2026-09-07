/**
 * The save-file tests.
 *
 * These cover the layer the rest of the suite does not reach: what happens to a
 * child's stored progress when the code around it changes. An audit found the
 * store persisting with no `version`, no `migrate`, and zustand's DEFAULT
 * SHALLOW MERGE — which means a stored `progress` object replaces the whole
 * fresh one, so the first field anyone adds to `Progress` arrives `undefined`
 * for every existing player. A screen that then reads `progress.words.length`
 * renders a blank page. Nothing in 1,010 tests caught it, because nothing
 * tested an *old* save.
 */
import { mergePersisted, streakFrom } from '../store';
import type { GameState } from '../store';

/** A fresh state, as the store would create it for a brand-new player. */
const fresh = (): GameState =>
  ({
    profile: { name: 'Rookie', avatar: { skin: 'tan', hair: 'dark', helmet: 'red' }, ageBand: 'B', createdAt: 1 },
    progress: {
      xp: 0,
      rank: 'cadet',
      sparks: 0,
      missions: {},
      badges: [],
      stats: { missions: 0, skills: 0, recipes: 0, words: 0 },
      mastery: {},
      words: [],
      recipes: [],
      gamesPlayed: {},
      shiftDays: [],
      streak: 0,
    },
    station: { unlocked: [], truck: { color: 'red', decal: 'flame', lights: 'classic', horn: 'classic' } },
    settings: { sound: true, haptics: true, voice: true, spanishSupport: 'full', reduceMotion: false },
    shift: { active: false, startedAt: null, missionsDone: 0, board: [] },
    hydrated: false,
  }) as unknown as GameState;

describe('mergePersisted — an old save survives a schema change', () => {
  it('fills fields the stored save has never heard of', () => {
    /* exactly the shape the audit reproduced: a save from before `words`,
       `gamesPlayed` and `shiftDays` existed */
    const old = {
      progress: { xp: 420, rank: 'cadet', sparks: 30, missions: {}, badges: ['first-mission'], stats: { missions: 3, skills: 9, recipes: 1, words: 0 }, mastery: {} },
    };
    const merged = mergePersisted(old, fresh());

    expect(merged.progress.xp).toBe(420);
    expect(merged.progress.badges).toEqual(['first-mission']);
    // the fields that did not exist when this save was written
    expect(merged.progress.words).toEqual([]);
    expect(merged.progress.recipes).toEqual([]);
    expect(merged.progress.gamesPlayed).toEqual({});
    expect(merged.progress.shiftDays).toEqual([]);
    expect(merged.progress.streak).toBe(0);
  });

  it('never hands a screen a non-array where it will call .length or .map', () => {
    const corrupt = {
      progress: { badges: null, words: 'not-an-array', recipes: undefined, shiftDays: 7 },
      station: { unlocked: {} },
      shift: { board: null },
    };
    const merged = mergePersisted(corrupt, fresh());

    for (const list of [merged.progress.badges, merged.progress.words, merged.progress.recipes, merged.progress.shiftDays, merged.station.unlocked, merged.shift.board]) {
      expect(Array.isArray(list)).toBe(true);
    }
  });

  it('keeps nested objects rather than replacing them wholesale', () => {
    // a save that knows about truck colour but not the horn added later
    const old = { station: { unlocked: ['mural'], truck: { color: 'blue', decal: 'star' } } };
    const merged = mergePersisted(old, fresh());

    expect(merged.station.truck.color).toBe('blue');
    expect(merged.station.truck.decal).toBe('star');
    expect(merged.station.truck.horn).toBe('classic'); // the default, not undefined
    expect(merged.station.unlocked).toEqual(['mural']);
  });

  it('survives an empty, null or undefined read', () => {
    for (const stored of [undefined, null, {}]) {
      const merged = mergePersisted(stored, fresh());
      expect(merged.progress.stats.missions).toBe(0);
      expect(Array.isArray(merged.progress.words)).toBe(true);
    }
  });
});

describe('streakFrom — days in a row, ending today', () => {
  it('counts an unbroken run', () => {
    expect(streakFrom(['2026-03-01', '2026-03-02', '2026-03-03'], '2026-03-03')).toBe(3);
  });

  it('stops at a gap rather than counting every day ever played', () => {
    expect(streakFrom(['2026-02-20', '2026-03-02', '2026-03-03'], '2026-03-03')).toBe(2);
  });

  it('is zero when today is not one of the days', () => {
    // a streak you have already broken should not still be showing
    expect(streakFrom(['2026-03-01', '2026-03-02'], '2026-03-04')).toBe(0);
  });

  it('handles a single day and an empty history', () => {
    expect(streakFrom(['2026-03-03'], '2026-03-03')).toBe(1);
    expect(streakFrom([], '2026-03-03')).toBe(0);
  });

  it('crosses a month boundary', () => {
    expect(streakFrom(['2026-02-27', '2026-02-28', '2026-03-01'], '2026-03-01')).toBe(3);
  });

  it('crosses a leap day', () => {
    expect(streakFrom(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01')).toBe(3);
  });
});
