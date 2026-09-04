/**
 * Shared dialogue builders for the missions.
 *
 * Voice rules (docs/ART_DIRECTION.md):
 *  - Captain Bea: warm, twelve words maximum, always an instruction or a thank-you.
 *  - Beacon: quick, beeps, translates Spanish out loud.
 *  - Pepper: barks. That is the whole part.
 *  - NPCs: bilingual, cheerful, and they always say thank you.
 */
import type { DialogueLine, Emotion } from '../types';
import type { GeneratorContext, SceneId } from '@/learning/types';

export const bea = (text: string, emotion: Emotion = 'calm'): DialogueLine => ({ speaker: 'bea', text, emotion });

export const beacon = (text: string, es?: string, emotion: Emotion = 'excited'): DialogueLine => ({
  speaker: 'beacon',
  text,
  emotion,
  ...(es ? { es } : {}),
});

export const pepper = (text = 'Woof! Woof!', emotion: Emotion = 'happy'): DialogueLine => ({
  speaker: 'pepper',
  text,
  emotion,
});

export const rookie = (text: string, emotion: Emotion = 'happy'): DialogueLine => ({ speaker: 'rookie', text, emotion });

export const npc = (npcName: string, text: string, es?: string, emotion: Emotion = 'happy'): DialogueLine => ({
  speaker: 'npc',
  npcName,
  text,
  emotion,
  ...(es ? { es, speakLang: 'es' as const } : {}),
});

/** Dress a generator context with the mission's location. */
export const inScene = (ctx: GeneratorContext, scene: SceneId): GeneratorContext => ({ ...ctx, scene });
