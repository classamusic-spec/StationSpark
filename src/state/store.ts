/**
 * Global game state (persisted). Keep it small and serialisable.
 * Screens read with selectors; game logic mutates via the actions below.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AgeBand, SkillTag } from '@/learning/types';
import type { BadgeId, RankId, StationUpgradeId } from '@/content/types';
import type { MiniGameResult, Stars } from '@/minigames/types';
import { rankForXp } from '@/content/ranks';

export interface Avatar {
  skin: 'peach' | 'tan' | 'brown' | 'deep';
  hair: 'dark' | 'brown' | 'blonde' | 'red' | 'black-curly';
  helmet: 'red' | 'yellow' | 'blue' | 'pink';
}

export interface TruckStyle {
  color: 'red' | 'yellow' | 'blue' | 'green';
  decal: 'none' | 'flame' | 'star' | 'paw' | 'lightning';
  lights: 'classic' | 'rainbow' | 'blue';
  horn: 'classic' | 'melody' | 'quack';
}

export interface Profile {
  name: string;
  avatar: Avatar;
  ageBand: AgeBand;
  createdAt: number;
  onboarded: boolean;
}

export interface Progress {
  xp: number;
  rank: RankId;
  sparks: number;
  missions: Record<string, { stars: Stars; plays: number; lastAt: number }>;
  badges: BadgeId[];
  stats: { missions: number; skills: number; recipes: number; words: number };
  mastery: Partial<Record<SkillTag, { attempts: number; correct: number }>>;
  words: string[];
  recipes: string[];
  gamesPlayed: Partial<Record<string, number>>;
  /** ISO day strings on which the child completed a shift */
  shiftDays: string[];
  streak: number;
}

export interface Station {
  unlocked: StationUpgradeId[];
  truck: TruckStyle;
}

export interface Settings {
  sfx: boolean;
  music: boolean;
  haptics: boolean;
  voice: boolean;
  /** how much English scaffolding shows next to Spanish */
  spanishSupport: 'full' | 'some' | 'min';
  reduceMotion: boolean;
}

export interface Shift {
  active: boolean;
  startedAt: number | null;
  missionsDone: number;
  /** the 2–3 mission ids on today's dispatch board */
  board: string[];
}

export interface GameState {
  profile: Profile;
  progress: Progress;
  station: Station;
  settings: Settings;
  shift: Shift;
  hydrated: boolean;

  // actions
  setProfile: (p: Partial<Profile>) => void;
  setAvatar: (a: Partial<Avatar>) => void;
  setSettings: (s: Partial<Settings>) => void;
  setTruck: (t: Partial<TruckStyle>) => void;
  startShift: (board: string[]) => void;
  endShift: () => void;
  recordMiniGame: (r: MiniGameResult) => void;
  completeMission: (id: string, stars: Stars, xp: number, sparks: number, badge?: BadgeId) => void;
  completeRecipe: (id: string, xp: number, badge?: BadgeId) => void;
  awardBadge: (id: BadgeId) => void;
  addXp: (xp: number) => void;
  buyUpgrade: (id: StationUpgradeId, cost: number) => boolean;
  resetAll: () => void;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * How many days in a row, ending today, the child has finished a shift.
 *
 * Deliberately counted from the recorded days rather than kept as a running
 * tally: a counter drifts the moment anything is missed, edited, or restored
 * from an older save, and this is a number a parent sees. Counted backwards
 * from today, so a gap ends the run and a day missed cannot be un-missed.
 *
 * Note this is REPORTING, not pressure — nothing in the app punishes a broken
 * streak or nags to keep one. It exists so the Grown-Ups screen can say
 * "four days this week", which is the honest use of it.
 */
export function streakFrom(days: readonly string[], today = todayKey()): number {
  const seen = new Set(days);
  if (!seen.has(today)) return 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  let run = 0;
  while (seen.has(cursor.toISOString().slice(0, 10))) {
    run += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return run;
}

const initialProfile: Profile = {
  name: 'Rookie',
  avatar: { skin: 'tan', hair: 'dark', helmet: 'red' },
  ageBand: 'B',
  createdAt: Date.now(),
  onboarded: false,
};

const initialProgress: Progress = {
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
};

const initialStation: Station = {
  unlocked: [],
  truck: { color: 'red', decal: 'flame', lights: 'classic', horn: 'classic' },
};

const initialSettings: Settings = {
  sfx: true,
  music: true,
  haptics: true,
  voice: true,
  spanishSupport: 'full',
  reduceMotion: false,
};

const initialShift: Shift = { active: false, startedAt: null, missionsDone: 0, board: [] };

/** Schema version of the persisted slice. See `migrate` and `merge` below. */
const PERSIST_VERSION = 1;


/**
 * Merge a persisted slice over a fresh state.
 *
 * Exported so it can be tested directly: this is the code that decides whether
 * a child's save survives an update, and testing it only through a real
 * rehydration means testing it almost never.
 */
export function mergePersisted(persisted: unknown, current: GameState): GameState {
  const p = (persisted ?? {}) as Partial<GameState>;
  const slice = <T extends object>(fresh: T, stored: unknown): T =>
    stored && typeof stored === 'object' && !Array.isArray(stored)
      ? { ...fresh, ...(stored as Partial<T>) }
      : fresh;
  return {
    ...current,
    ...current,
    profile: slice(current.profile, p.profile),
    progress: {
      ...slice(current.progress, p.progress),
      /* the collections are what screens map over, so they must be arrays
         and objects even if the stored value is null or the wrong type */
      stats: slice(current.progress.stats, (p.progress as Progress | undefined)?.stats),
      missions: slice(current.progress.missions, (p.progress as Progress | undefined)?.missions),
      mastery: slice(current.progress.mastery, (p.progress as Progress | undefined)?.mastery),
      gamesPlayed: slice(current.progress.gamesPlayed, (p.progress as Progress | undefined)?.gamesPlayed),
      badges: Array.isArray(p.progress?.badges) ? p.progress.badges : current.progress.badges,
      words: Array.isArray(p.progress?.words) ? p.progress.words : current.progress.words,
      recipes: Array.isArray(p.progress?.recipes) ? p.progress.recipes : current.progress.recipes,
      shiftDays: Array.isArray(p.progress?.shiftDays) ? p.progress.shiftDays : current.progress.shiftDays,
    },
    station: {
      ...slice(current.station, p.station),
      truck: slice(current.station.truck, (p.station as Station | undefined)?.truck),
      unlocked: Array.isArray(p.station?.unlocked) ? p.station.unlocked : current.station.unlocked,
    },
    settings: slice(current.settings, p.settings),
    shift: {
      ...slice(current.shift, p.shift),
      board: Array.isArray(p.shift?.board) ? p.shift.board : current.shift.board,
    },
  };
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      progress: initialProgress,
      station: initialStation,
      settings: initialSettings,
      shift: initialShift,
      hydrated: false,

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setAvatar: (a) => set((s) => ({ profile: { ...s.profile, avatar: { ...s.profile.avatar, ...a } } })),
      setSettings: (o) => set((s) => ({ settings: { ...s.settings, ...o } })),
      setTruck: (t) => set((s) => ({ station: { ...s.station, truck: { ...s.station.truck, ...t } } })),

      startShift: (board) => set({ shift: { active: true, startedAt: Date.now(), missionsDone: 0, board } }),
      endShift: () =>
        set((s) => {
          const day = todayKey();
          const days = s.progress.shiftDays.includes(day) ? s.progress.shiftDays : [...s.progress.shiftDays, day];
          /* `streak` was declared, initialised to 0, and then written by
             nothing anywhere in the app. It is derived here, where the day is
             banked, so the two can never disagree. */
          return { shift: { ...initialShift }, progress: { ...s.progress, shiftDays: days, streak: streakFrom(days, day) } };
        }),

      recordMiniGame: (r) =>
        set((s) => {
          /*
           * Mastery only moves on a real play. A synthesised result — a skipped
           * beat, a game that could not render — arrives with no `correct`
           * count, and the honest thing to do with an unknown is nothing.
           * Recording it as a miss would punish a child for our bug; recording
           * it as a win would inflate the number a parent reads.
           */
          const mastery = { ...s.progress.mastery };
          if (r.correct !== undefined) {
            for (const skill of r.skills) {
              const m = mastery[skill] ?? { attempts: 0, correct: 0 };
              mastery[skill] = {
                attempts: m.attempts + r.attempts,
                correct: m.correct + Math.min(Math.max(0, r.correct), r.attempts),
              };
            }
          }
          const words = Array.from(new Set([...s.progress.words, ...(r.wordsLearned ?? [])]));
          const gamesPlayed = { ...s.progress.gamesPlayed, [r.kind]: (s.progress.gamesPlayed[r.kind] ?? 0) + 1 };
          return {
            progress: {
              ...s.progress,
              mastery,
              words,
              gamesPlayed,
              stats: { ...s.progress.stats, skills: s.progress.stats.skills + 1, words: words.length },
            },
          };
        }),

      completeMission: (id, stars, xp, sparks, badge) =>
        set((s) => {
          const prev = s.progress.missions[id];
          const missions = {
            ...s.progress.missions,
            [id]: { stars: (prev ? Math.max(prev.stars, stars) : stars) as Stars, plays: (prev?.plays ?? 0) + 1, lastAt: Date.now() },
          };
          const newXp = s.progress.xp + xp;
          const badges = badge && !s.progress.badges.includes(badge) ? [...s.progress.badges, badge] : s.progress.badges;
          return {
            progress: {
              ...s.progress,
              missions,
              xp: newXp,
              rank: rankForXp(newXp).id,
              sparks: s.progress.sparks + sparks,
              badges,
              stats: { ...s.progress.stats, missions: s.progress.stats.missions + 1 },
            },
            shift: { ...s.shift, missionsDone: s.shift.missionsDone + 1 },
          };
        }),

      completeRecipe: (id, xp, badge) =>
        set((s) => {
          const newXp = s.progress.xp + xp;
          const recipes = s.progress.recipes.includes(id) ? s.progress.recipes : [...s.progress.recipes, id];
          const badges = badge && !s.progress.badges.includes(badge) ? [...s.progress.badges, badge] : s.progress.badges;
          return {
            progress: {
              ...s.progress,
              xp: newXp,
              rank: rankForXp(newXp).id,
              recipes,
              badges,
              stats: { ...s.progress.stats, recipes: s.progress.stats.recipes + 1 },
            },
          };
        }),

      awardBadge: (id) =>
        set((s) => (s.progress.badges.includes(id) ? s : { progress: { ...s.progress, badges: [...s.progress.badges, id] } })),

      addXp: (xp) =>
        set((s) => {
          const newXp = s.progress.xp + xp;
          return { progress: { ...s.progress, xp: newXp, rank: rankForXp(newXp).id } };
        }),

      buyUpgrade: (id, cost) => {
        const s = get();
        if (s.station.unlocked.includes(id) || s.progress.sparks < cost) return false;
        set({
          station: { ...s.station, unlocked: [...s.station.unlocked, id] },
          progress: { ...s.progress, sparks: s.progress.sparks - cost },
        });
        return true;
      },

      resetAll: () =>
        set({
          profile: { ...initialProfile, createdAt: Date.now() },
          progress: initialProgress,
          station: initialStation,
          settings: initialSettings,
          shift: initialShift,
        }),
    }),
    {
      name: 'station-spark-v1',
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * Bump this whenever a persisted shape changes in a way `merge` below
       * cannot absorb on its own, and add the matching step to `migrate`.
       */
      version: PERSIST_VERSION,
      partialize: (s) => ({
        profile: s.profile,
        progress: s.progress,
        station: s.station,
        settings: s.settings,
        shift: s.shift,
      }),
      /**
       * Saves written before this store was versioned arrive as version 0.
       * There is nothing to rewrite in them — `merge` fills whatever they are
       * missing — so this exists to name that fact rather than to do work, and
       * to give the next schema change somewhere obvious to hang its step.
       */
      migrate: (persisted, from) => {
        if (from < 1) return persisted as Partial<GameState>;
        return persisted as Partial<GameState>;
      },
      /**
       * THIS IS THE ONE THAT PROTECTS A CHILD'S SAVE.
       *
       * zustand's default merge is SHALLOW: a stored `progress` object replaces
       * the whole fresh one. So the first time anyone adds a field to `Progress`
       * and ships it, every existing save rehydrates with `undefined` in the new
       * slot — and a screen that reads, say, `progress.words.length` renders a
       * blank white page instead of the Badge Wall. The save is not corrupt; it
       * is simply older than the code, which is the normal case for every update
       * after the first.
       *
       * Merging each slice over its defaults means a missing field always falls
       * back to the value a brand-new player would have. Old saves keep every
       * field they do have, new fields appear at their default, and a partial or
       * truncated read degrades to "some progress lost" rather than to a crash.
       */
      merge: (persisted, current) => mergePersisted(persisted, current),
      onRehydrateStorage: () => () => {
        // runs after the async read completes; useGame is defined by then
        useGame.setState({ hydrated: true });
      },
    },
  ),
);

/* ---------- selectors ---------- */
export const selectAgeBand = (s: GameState) => s.profile.ageBand;
export const selectXp = (s: GameState) => s.progress.xp;
export const selectBadges = (s: GameState) => s.progress.badges;
export const selectSettings = (s: GameState) => s.settings;
