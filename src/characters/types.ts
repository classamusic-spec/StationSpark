import type { BadgeId, CharacterId, DialogueLine, Emotion } from '@/content/types';
import type { Stars } from '@/minigames/types';

export interface CharacterPortraitProps {
  id: CharacterId;
  /** NPC variant when id === 'npc' (e.g. 'rosa', 'gino', 'ms-lee', 'okafor', 'twins') */
  npc?: string;
  emotion?: Emotion;
  size?: number;
  /** idle bob/blink on (default true) */
  animate?: boolean;
}

export interface DialogueOverlayProps {
  line: DialogueLine;
  /** index/total for the little progress dots */
  index?: number;
  total?: number;
  onNext: () => void;
  /** show a "Skip" affordance for parents */
  onSkip?: () => void;
  /** how much Spanish scaffolding to show (from settings) */
  spanishSupport?: 'full' | 'some' | 'min';
}

export interface CelebrationOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  stars?: Stars;
  badge?: BadgeId;
  xp?: number;
  sparks?: number;
  /** subjects used, for the recap chips */
  subjects?: ('math' | 'reading' | 'english' | 'spanish' | 'logic' | 'teamwork' | 'cooking')[];
  ctaLabel?: string;
  onNext: () => void;
}
