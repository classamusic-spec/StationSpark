/**
 * Shared dialogue builders for the missions.
 *
 * Voice rules (docs/ART_DIRECTION.md):
 *  - Captain Bea: warm, twelve words maximum, always an instruction or a thank-you.
 *    `bea()` is her in the room; `radio()` is the same voice over the station
 *    radio, where she also reads the Spanish aloud.
 *  - Rookie: the child. Eager, short, never a grown-up sentence.
 *  - NPCs: bilingual, cheerful, and they always say thank you.
 */
import type { DialogueLine, Emotion } from '../types';
import type { GeneratorContext, SceneId } from '@/learning/types';

export const bea = (text: string, emotion: Emotion = 'calm'): DialogueLine => ({ speaker: 'bea', text, emotion });

/** Captain Bea over the station radio — brisk, and she reads the Spanish out. */
export const radio = (text: string, es?: string, emotion: Emotion = 'excited'): DialogueLine => ({
  speaker: 'bea',
  text,
  emotion,
  ...(es ? { es } : {}),
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
