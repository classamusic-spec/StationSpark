import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { Emotion } from '@/content/types';
import { palette, springs, timings } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { Person, type PersonPose } from './rig/Person';
import type { HairTone, HelmetTone, SkinTone } from './rig/palettes';
import { helmetTones } from './rig/palettes';

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
  pose?: PersonPose;
  /** idle bob / blink / wave (default true) */
  animate?: boolean;
  avatar?: RookieAvatar;
  /** loop a happy jump (celebrations) */
  jumping?: boolean;
  bobPhase?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Rookie — the child firefighter the player *is*.
 * Red helmet with a gold flame shield, navy turnout jacket with two yellow
 * reflective stripes, red collar and a little flame badge on the chest.
 */
export function Rookie({ size = 170, emotion = 'happy', pose = 'wave', animate = true, avatar, jumping = false, bobPhase = 0, style, testID }: RookieProps) {
  const reduced = useReducedMotion();
  const jump = useSharedValue(0);

  useEffect(() => {
    if (!jumping || reduced || !animate) {
      cancelAnimation(jump);
      jump.value = withTiming(0, timings.fast);
      return;
    }
    jump.value = withRepeat(withSequence(withSpring(-1, springs.bounce), withSpring(0, springs.pop), withTiming(0, { duration: 240 })), -1, false);
    return () => cancelAnimation(jump);
  }, [animate, jump, jumping, reduced]);

  const jumpStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: jump.value * size * 0.09 }, { scaleY: 1 + jump.value * -0.03 }],
  }));

  return (
    <Animated.View testID={testID} style={[jumpStyle, style]}>
      <Person
        size={size}
        emotion={emotion}
        pose={pose}
        animate={animate}
        bobPhase={bobPhase}
        skin={avatar?.skin ?? 'peach'}
        hair={avatar?.hair ?? 'dark'}
        hairStyle={avatar?.hair === 'black-curly' ? 'curly' : 'fringe'}
        headwear="fire-helmet"
        headwearColor={helmetTones[avatar?.helmet ?? 'red'].base}
        outfit={{
          /*
           * Three separated values, darkest at the ground: jacket → trousers →
           * boots. Without the step the whole rig reads as one navy blob at
           * thumbnail size (art critique item #22).
           */
          top: '#26315F',
          collar: palette.engineRed,
          pants: '#414E8C',
          shoes: '#171E3E',
          stripes: palette.safetyYellow,
          emblem: 'flame',
        }}
      />
    </Animated.View>
  );
}
