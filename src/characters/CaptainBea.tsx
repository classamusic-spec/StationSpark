import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Emotion } from '@/content/types';
import { palette } from '@/theme';
import { Person, type PersonPose } from './rig/Person';

export interface CaptainBeaProps {
  /** total height in px */
  size?: number;
  emotion?: Emotion;
  pose?: PersonPose;
  animate?: boolean;
  bobPhase?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Captain Bea — the warm station leader. Navy uniform with gold buttons, white
 * captain's cap with a gold badge, brown skin and a kind, steady smile.
 * She gives short instructions and never hurries anyone.
 */
export function CaptainBea({ size = 178, emotion = 'calm', pose = 'stand', animate = true, bobPhase = 0.9, style, testID }: CaptainBeaProps) {
  return (
    <Person
      testID={testID}
      style={style}
      size={size}
      emotion={emotion}
      pose={pose}
      animate={animate}
      bobPhase={bobPhase}
      skin="brown"
      hair="dark"
      hairStyle="bun"
      headwear="captain-cap"
      outfit={{
        top: '#25316A',
        collar: '#1A2350',
        pants: '#1E2857',
        shoes: '#151C3E',
        buttons: palette.safetyYellow,
        emblem: 'star',
      }}
      accessories={{ nose: true }}
    />
  );
}
