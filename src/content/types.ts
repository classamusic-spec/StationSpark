/**
 * CONTENT CONTRACT — missions, dialogue, badges, ranks, station upgrades.
 * Pure data + generator thunks. No React.
 */
import type { AgeBand, Challenge, ChallengeKind, GeneratorContext, SceneId, Subject } from '@/learning/types';

export type CharacterId = 'rookie' | 'beacon' | 'bea' | 'pepper' | 'npc';
export type Emotion = 'happy' | 'excited' | 'think' | 'calm' | 'worried' | 'proud' | 'surprised';

export interface DialogueLine {
  speaker: CharacterId;
  /** NPC display name when speaker === 'npc' */
  npcName?: string;
  text: string;
  /** Spanish version; when present the RadioCard shows both and Beacon can "translate" */
  es?: string;
  emotion?: Emotion;
  /** Speak aloud with expo-speech (default true for short lines) */
  speak?: boolean;
  /** which language to speak (default 'en'; 'es' speaks the es line) */
  speakLang?: 'en' | 'es';
}

export type LocationId =
  | 'station'
  | 'bakery'
  | 'school'
  | 'library'
  | 'park'
  | 'pet-shop'
  | 'market'
  | 'pizza'
  | 'apartments'
  | 'garden'
  | 'museum'
  | 'beach'
  | 'festival'
  | 'construction'
  | 'train-station'
  | 'clock-tower';

export type RecipeId = 'pancakes' | 'pizza' | 'tacos' | 'smoothie' | 'soup' | 'bread';

export type MissionBeat =
  | { type: 'dialogue'; lines: DialogueLine[]; backdrop?: SceneId }
  | {
      type: 'minigame';
      game: ChallengeKind;
      /** Generate the challenge at run time for the child's age band */
      challenge: (ctx: GeneratorContext) => Challenge;
      intro?: DialogueLine[];
      outro?: DialogueLine[];
      /** Only run this beat for these bands (default all) */
      bands?: AgeBand[];
    }
  | { type: 'travel'; from: LocationId; to: LocationId }
  | { type: 'scene'; scene: 'arrive' | 'rescue-complete' | 'return'; location: LocationId; lines?: DialogueLine[] }
  | { type: 'kitchen'; recipe: RecipeId; intro?: DialogueLine[] }
  | { type: 'recap' };

export type BadgeId =
  | 'first-shift'
  | 'number-navigator'
  | 'fraction-firefighter'
  | 'hose-hero'
  | 'word-watcher'
  | 'spanish-speaker'
  | 'recipe-rescuer'
  | 'map-master'
  | 'pattern-pro'
  | 'team-player'
  | 'community-helper'
  | 'clock-tower-cat'
  | 'bakery-bell'
  | 'pizza-rescue'
  | 'park-picnic'
  | 'school-fair'
  | 'clean-up-crew'
  | 'kitchen-pro'
  | 'ladder-legend'
  | 'time-keeper';

export interface BadgeDef {
  id: BadgeId;
  name: string;
  nameEs?: string;
  description: string;
  /** rim colour + icon id drawn by <BadgeArt/> */
  color: string;
  icon: string;
}

export type RankId =
  | 'cadet'
  | 'helper'
  | 'crew-member'
  | 'problem-solver'
  | 'rescue-leader'
  | 'station-captain'
  | 'community-hero';

export interface RankDef {
  id: RankId;
  name: string;
  minXp: number;
  /** playful line Captain Bea says when you reach it */
  cheer: string;
}

export type StationUpgradeId =
  | 'kitchen-2'
  | 'truck-bay-2'
  | 'garden'
  | 'library-corner'
  | 'training-tower'
  | 'map-room-2'
  | 'pet-area'
  | 'roof-garden'
  | 'community-table'
  | 'flag-gold'
  | 'bell-brass'
  | 'mural';

export interface StationUpgradeDef {
  id: StationUpgradeId;
  name: string;
  description: string;
  /** cost in Sparks (the friendly, non-manipulative currency earned per mission) */
  cost: number;
  /** what room it visibly changes in the firehouse cutaway */
  room: 'kitchen' | 'garage' | 'yard' | 'classroom' | 'dispatch' | 'roof' | 'facade' | 'badge-wall';
}

export interface MissionDef {
  id: string;
  title: string;
  titleEs?: string;
  /** one-line hook on the dispatch slip */
  tagline: string;
  /** what's happening, shown on the Mission Brief */
  brief: string;
  location: LocationId;
  scene: SceneId;
  address: string;
  npcName?: string;
  subjects: Subject[];
  /** minutes, rough */
  minutes: number;
  badge: BadgeId;
  xp: number;
  sparks: number;
  beats: MissionBeat[];
  /** which missions must be complete first (empty = always available) */
  requires?: string[];
}

export interface RecipeDef {
  id: RecipeId;
  name: string;
  nameEs?: string;
  blurb: string;
  subjects: Subject[];
  /** kitchen beats: a sequence of kitchen challenge generators */
  steps: { game: ChallengeKind; challenge: (ctx: GeneratorContext) => Challenge; intro?: DialogueLine[] }[];
  badge?: BadgeId;
  xp: number;
}
