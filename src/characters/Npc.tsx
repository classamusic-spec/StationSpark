import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Emotion } from '@/content/types';
import { palette } from '@/theme';
import { Person, type Accessories, type HairStyle, type HeadwearKind, type Outfit, type PersonPose } from './rig/Person';
import type { HairTone, SkinTone } from './rig/palettes';

export type NpcVariant = 'rosa' | 'gino' | 'ms-lee' | 'okafor' | 'twins' | 'maya';

export const npcVariants: readonly NpcVariant[] = ['rosa', 'gino', 'ms-lee', 'okafor', 'twins', 'maya'];

/** Display names, so screens don't have to keep their own table. */
export const npcNames: Record<NpcVariant, string> = {
  rosa: 'Rosa',
  gino: 'Gino',
  'ms-lee': 'Ms. Lee',
  okafor: 'Mr. Okafor',
  twins: 'The Twins',
  maya: 'Maya',
};

interface NpcLook {
  skin: SkinTone;
  hair: HairTone;
  hairStyle: HairStyle;
  headwear: HeadwearKind;
  headwearColor?: string;
  outfit: Outfit;
  accessories?: Accessories;
}

const looks: Record<Exclude<NpcVariant, 'twins'>, NpcLook> = {
  // Rosa — the baker. Cream apron, flour on one cheek, hair up out of the dough.
  rosa: {
    skin: 'tan',
    hair: 'brown',
    hairStyle: 'bun',
    headwear: 'none',
    outfit: {
      top: '#F07E8E',
      collar: '#D8636F',
      pants: '#6C7BC4',
      shoes: '#4A5490',
      apron: palette.cream,
      shortSleeves: true,
    },
    accessories: { flourCheek: true, nose: true },
  },
  // Gino — the pizzaiolo. Red bandana, big moustache, white shirt, cream apron.
  gino: {
    skin: 'tan',
    hair: 'dark',
    hairStyle: 'short',
    headwear: 'bandana',
    headwearColor: palette.engineRed,
    outfit: {
      top: '#FFFFFF',
      collar: '#E5E8F3',
      pants: '#3D4870',
      shoes: '#2A3358',
      apron: palette.creamDeep,
      shortSleeves: true,
    },
    accessories: { moustache: '#3A3348', nose: true },
  },
  // Ms. Lee — the teacher. Purple cardigan, round glasses, neat bob.
  'ms-lee': {
    skin: 'peach',
    hair: 'dark',
    hairStyle: 'short',
    headwear: 'none',
    outfit: {
      top: '#9B7BFF',
      collar: '#7E5FE0',
      pants: '#3D4870',
      shoes: '#2A3358',
      buttons: palette.cream,
    },
    accessories: { glasses: true, nose: true },
  },
  // Mr. Okafor — the park keeper. Green hi-vis vest and a matching cap.
  okafor: {
    skin: 'deep',
    hair: 'black-curly',
    hairStyle: 'curly',
    headwear: 'park-cap',
    headwearColor: palette.leafGreen,
    outfit: {
      top: '#D9C08A',
      collar: '#BFA36C',
      pants: '#5E6A3E',
      shoes: '#3E4630',
      vest: palette.leafGreen,
      shortSleeves: true,
    },
    accessories: { nose: true },
  },
  // Maya — the librarian. Long hair, glasses, teal cardigan.
  maya: {
    skin: 'brown',
    hair: 'dark',
    hairStyle: 'long',
    headwear: 'none',
    outfit: {
      top: '#2FA8A0',
      collar: '#1E8880',
      pants: '#3D4870',
      shoes: '#2A3358',
      buttons: palette.cream,
    },
    accessories: { glasses: true, nose: true },
  },
};

/** The pet-shop twins: two kids in matching shirts, one a beat behind the other. */
const twinLooks: [NpcLook, NpcLook] = [
  {
    skin: 'peach',
    hair: 'red',
    hairStyle: 'fringe',
    headwear: 'none',
    outfit: { top: '#4FC3F7', collar: '#1FA5E8', pants: '#3D4870', shoes: '#2A3358', shortSleeves: true },
    accessories: { freckles: true },
  },
  {
    skin: 'brown',
    hair: 'black-curly',
    hairStyle: 'curly',
    headwear: 'none',
    outfit: { top: '#FFC72C', collar: '#D98E00', pants: '#3D4870', shoes: '#2A3358', shortSleeves: true },
    accessories: {},
  },
];

export interface NpcProps {
  variant: NpcVariant;
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
 * Neighbours of Spark City. Same head rig as Rookie and Captain Bea — only the
 * hair, outfit and props change, which is what makes the town feel like one place.
 */
export function Npc({ variant, size = 168, emotion = 'happy', pose = 'stand', animate = true, bobPhase = 0.4, style, testID }: NpcProps) {
  if (variant === 'twins') {
    const [a, b] = twinLooks;
    return (
      <View style={[styles.twins, style]} testID={testID}>
        <Person size={size * 0.88} emotion={emotion} pose={pose === 'stand' ? 'wave' : pose} animate={animate} bobPhase={bobPhase} {...a} />
        <Person size={size * 0.82} emotion={emotion === 'happy' ? 'excited' : emotion} pose={pose} animate={animate} bobPhase={bobPhase + 1.1} style={styles.twinB} {...b} />
      </View>
    );
  }
  const look = looks[variant];
  return <Person testID={testID} style={style} size={size} emotion={emotion} pose={pose} animate={animate} bobPhase={bobPhase} {...look} />;
}

const styles = StyleSheet.create({
  twins: { flexDirection: 'row', alignItems: 'flex-end' },
  twinB: { marginLeft: -18 },
});
