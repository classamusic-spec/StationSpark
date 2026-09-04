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

interface GameState {
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
          return { shift: { ...initialShift }, progress: { ...s.progress, shiftDays: days } };
        }),

      recordMiniGame: (r) =>
        set((s) => {
          const mastery = { ...s.progress.mastery };
          for (const skill of r.skills) {
            const m = mastery[skill] ?? { attempts: 0, correct: 0 };
            mastery[skill] = {
              attempts: m.attempts + r.attempts,
              correct: m.correct + Math.max(1, r.attempts - (r.attempts - 1)),
            };
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
      partialize: (s) => ({
        profile: s.profile,
        progress: s.progress,
        station: s.station,
        settings: s.settings,
        shift: s.shift,
      }),
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
