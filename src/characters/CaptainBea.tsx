import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Emotion } from '@/content/types';
import { CharacterRig } from './art/CharacterRig';
import { captainRig } from './art/rigs';
import { useCharacter, type CharacterPose } from './machine/useCharacter';

export interface CaptainBeaProps {
  /** total height in px */
  size?: number;
  emotion?: Emotion;
  pose?: CharacterPose;
  animate?: boolean;
  /** true while one of her lines is being read out */
  speaking?: boolean;
  /** offsets her idle clock so a line-up never breathes in lockstep (0–1) */
  bobPhase?: number;
  /** one flat <Svg>, no motion — for tiny thumbnails and crowds */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Captain Bea — the warm station leader, drawn from `SVG ART/CAPTAIN.svg`.
 *
 * Navy dress uniform with gold cuff stripes and a chest shield, a white-crown
 * cap with a gold star badge. She gives short instructions and never hurries
 * anyone. Her jacket is authored as a single shape, so her arms do not swing
 * from the shoulder; she gestures with her hands and her cap instead.
 */
export function CaptainBea({
  size = 178,
  emotion = 'calm',
  pose = 'stand',
  animate = true,
  speaking = false,
  bobPhase = 0.35,
  flat = false,
  style,
  testID,
}: CaptainBeaProps) {
  const { act, mood } = useCharacter({ pose, emotion, speaking, animate });
  return (
    <CharacterRig
      spec={captainRig}
      size={size}
      act={act}
      mood={mood}
      animate={animate}
      bobPhase={bobPhase}
      flat={flat}
      style={style}
      testID={testID}
    />
  );
}
