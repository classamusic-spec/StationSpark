import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Emotion } from '@/content/types';
import { CharacterRig } from './art/CharacterRig';
import { rookieRig } from './art/rigs';
import { rookieTones, type AvatarChoice } from './art/tones';
import { useCharacter, type CharacterPose } from './machine/useCharacter';
import type { HairTone, HelmetTone, SkinTone } from './rig/palettes';

/** Matches `Avatar` in @/state/store — kept structural so characters never import state. */
export interface RookieAvatar {
  skin?: SkinTone;
  hair?: HairTone;
  helmet?: HelmetTone;
}

export interface RookieProps {
  /** total height in px */
  size?: number;
  emotion?: Emotion;
  pose?: CharacterPose;
  /** idle bob / blink / gestures (default true) */
  animate?: boolean;
  /** true while one of their lines is being read out */
  speaking?: boolean;
  avatar?: RookieAvatar;
  /** loop a happy jump (celebrations) */
  jumping?: boolean;
  bobPhase?: number;
  /** one flat <Svg>, no motion — for tiny thumbnails and crowds */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Rookie — the child firefighter the player *is*, drawn from
 * `SVG ART/FIREFIGHTER.svg`.
 *
 * Red helmet with a gold flame shield, navy turnout coat with cream-edged
 * yellow reflective bands and a little flame badge on the chest. Both sleeves
 * are authored as their own shapes sharing the coat's shoulder vertex, so the
 * arms really swing — a wave never opens a gap at the joint.
 */
export function Rookie({
  size = 170,
  emotion = 'happy',
  pose = 'wave',
  animate = true,
  speaking = false,
  avatar,
  jumping = false,
  bobPhase = 0,
  flat = false,
  style,
  testID,
}: RookieProps) {
  const { act, mood } = useCharacter({
    pose: jumping ? 'cheer' : pose,
    emotion,
    speaking,
    holdCheer: jumping,
    animate,
  });
  return (
    <CharacterRig
      spec={rookieRig}
      size={size}
      act={act}
      mood={mood}
      animate={animate}
      tones={rookieTones(avatar as AvatarChoice | undefined)}
      bobPhase={bobPhase}
      flat={flat}
      style={style}
      testID={testID}
    />
  );
}
