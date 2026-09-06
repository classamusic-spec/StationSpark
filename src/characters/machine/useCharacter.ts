import { useEffect, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import type { Emotion } from '@/content/types';
import { actOf, characterMachine, type CharacterAct } from './characterMachine';

/** What a screen asks a character to do. The machine decides the rest. */
export type CharacterPose = 'stand' | 'wave' | 'cheer' | 'point' | 'think' | 'talk';

export interface UseCharacterOptions {
  pose?: CharacterPose;
  emotion?: Emotion;
  /** true while a line is being read out — flaps the mouth */
  speaking?: boolean;
  /** loop the celebration instead of settling back to idle */
  holdCheer?: boolean;
  /** false parks the character in its rest pose */
  animate?: boolean;
}

export interface CharacterState {
  act: CharacterAct;
  mood: Emotion;
}

/**
 * Runs one character's behaviour machine and keeps it in step with the props
 * a screen passes down.
 *
 * Screens stay declarative — "you are waving", "you are worried" — while the
 * machine owns the timing underneath: when the idle flourishes fire, how long
 * a wave lasts, when a cheer stops. That is what keeps two characters on the
 * same screen from moving like one puppet.
 */
export function useCharacter({
  pose = 'stand',
  emotion = 'happy',
  speaking = false,
  holdCheer = false,
  animate = true,
}: UseCharacterOptions = {}): CharacterState {
  const [state, send] = useMachine(characterMachine, { input: { mood: emotion } });

  useEffect(() => {
    send({ type: 'MOOD', mood: emotion });
  }, [emotion, send]);

  useEffect(() => {
    if (!animate) {
      send({ type: 'REST' });
      return;
    }
    if (speaking) {
      send({ type: 'SPEAK' });
      return;
    }
    switch (pose) {
      case 'wave':
        send({ type: 'WAVE' });
        break;
      case 'cheer':
        send({ type: 'CHEER', hold: holdCheer });
        break;
      case 'point':
        send({ type: 'POINT' });
        break;
      case 'think':
        send({ type: 'THINK' });
        break;
      case 'talk':
        send({ type: 'SPEAK' });
        break;
      default:
        send({ type: 'SILENCE' });
        send({ type: 'REST' });
    }
  }, [animate, holdCheer, pose, send, speaking]);

  const act = actOf(state.value);
  return useMemo(() => ({ act, mood: state.context.mood }), [act, state.context.mood]);
}
