/**
 * MINI-GAME CONTRACT
 * ------------------
 * Every mini-game is a React component that takes ONE challenge and reports
 * ONE result. It must never dead-end: a child can always finish.
 *
 *  - Use `useMiniGameSession()` to track attempts/hints/time and build the result.
 *  - Report `onEvent('correct'|'incorrect'|'hint')` for audio/haptics/character reactions.
 *  - Never use red to mean "wrong". Wrong = gentle wobble + soft sound + Beacon hint.
 *  - Layout: the game owns the full area it is given (usually the screen body
 *    under a `MissionHeader`). It should look great on phones and tablets.
 */
import type { ComponentType } from 'react';
import type { AgeBand, Challenge, ChallengeKind, ChallengeOf, SkillTag } from '@/learning/types';

export type Stars = 0 | 1 | 2 | 3;

export interface MiniGameResult {
  kind: ChallengeKind;
  /** completed successfully (always true when finished; we never fail a child) */
  success: true;
  attempts: number;
  hintsUsed: number;
  durationMs: number;
  stars: Stars;
  skills: SkillTag[];
  /** words the child heard/used in this game (for "Words Learned") */
  wordsLearned?: string[];
}

export type MiniGameEvent =
  | { type: 'correct'; detail?: string }
  | { type: 'incorrect'; detail?: string }
  | { type: 'hint' }
  | { type: 'progress'; current: number; total: number }
  | { type: 'say'; speaker: 'beacon' | 'bea' | 'rookie' | 'pepper' | 'npc'; text: string; es?: string };

export interface MiniGameProps<K extends ChallengeKind = ChallengeKind> {
  challenge: ChallengeOf<K>;
  ageBand: AgeBand;
  onComplete: (result: MiniGameResult) => void;
  onEvent?: (event: MiniGameEvent) => void;
  /** Training-yard mode: no story chrome, tighter layout, replayable */
  compact?: boolean;
  /** Present when running inside a mission (for scene dressing / NPC names) */
  missionContext?: { locationName: string; npcName?: string };
}

export type MiniGameComponent<K extends ChallengeKind = ChallengeKind> = ComponentType<MiniGameProps<K>>;

export interface MiniGameMeta {
  kind: ChallengeKind;
  title: string;
  titleEs?: string;
  /** one-line kid-facing description for the Training Yard */
  blurb: string;
  subjects: ('math' | 'reading' | 'english' | 'spanish' | 'logic' | 'teamwork' | 'cooking')[];
  /** which room hosts it in the Training Yard (kitchen games live in the Kitchen) */
  yard: 'training' | 'kitchen';
  /** rough play time in seconds */
  seconds: number;
  /** icon id for TrainingStationTile (see src/ui/icons) */
  icon: string;
}

export type ChallengeFor<K extends ChallengeKind> = Extract<Challenge, { kind: K }>;
