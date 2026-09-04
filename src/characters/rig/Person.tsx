import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Emotion } from '@/content/types';
import { idle, palette } from '@/theme';
import { useBlinkState, useIdleBob } from '@/hooks';
import { Face } from './Face';
import { RigPart } from './RigPart';
import { hairTones, ink, mix, skinTones, tones, type HairTone, type SkinTone } from './palettes';

/* ------------------------------------------------------------------ *
 * One shared coordinate space for every human in Station Spark.
 * ------------------------------------------------------------------ */
export const PERSON_VB = { w: 120, h: 165 } as const;

const HEAD = { cx: 60, cy: 60, rx: 27, ry: 26 } as const;
const FACE_CY = 64;
const ARM = {
  right: { s: { x: 80, y: 102 }, e: { x: 86, y: 118 }, h: { x: 89, y: 133 } },
  left: { s: { x: 40, y: 102 }, e: { x: 34, y: 118 }, h: { x: 31, y: 133 } },
} as const;
const ARM_WIN = {
  right: { x: 58, y: 50, w: 62, h: 106 },
  left: { x: 0, y: 50, w: 62, h: 106 },
} as const;

const TORSO =
  'M 38 104 C 38 94 46 89 60 89 C 74 89 82 94 82 104 L 85.5 133 C 86.5 140 82 143 77 143 L 43 143 C 38 143 33.5 140 34.5 133 Z';

export type PersonPose = 'stand' | 'wave' | 'cheer' | 'point';
export type HairStyle = 'fringe' | 'short' | 'bun' | 'curly' | 'long' | 'ponytail' | 'none';
export type HeadwearKind = 'none' | 'fire-helmet' | 'captain-cap' | 'bandana' | 'park-cap' | 'chef-hat' | 'beanie';

export interface Outfit {
  /** jacket / shirt colour */
  top: string;
  /** V-collar accent (defaults to a darker top) */
  collar?: string;
  pants: string;
  shoes: string;
  /** two reflective bands across the chest + one per sleeve */
  stripes?: string;
  /** full apron over the torso */
  apron?: string;
  /** open vest panels down the sides */
  vest?: string;
  /** row of buttons down the middle */
  buttons?: string;
  /** small chest emblem */
  emblem?: 'flame' | 'star' | 'cross' | 'none';
  /** short sleeves → the forearms are bare */
  shortSleeves?: boolean;
}

export interface Accessories {
  glasses?: boolean;
  /** moustache colour */
  moustache?: string;
  /** dusty flour smudge on one cheek */
  flourCheek?: boolean;
  freckles?: boolean;
  /** a soft nose shadow (adults) */
  nose?: boolean;
}

export interface PersonProps {
  /** total height in px (width follows the 120:165 rig ratio) */
  size?: number;
  emotion?: Emotion;
  pose?: PersonPose;
  /** idle bob / blink / wave (default true) */
  animate?: boolean;
  skin?: SkinTone;
  hair?: HairTone;
  hairStyle?: HairStyle;
  outfit: Outfit;
  headwear?: HeadwearKind;
  headwearColor?: string;
  accessories?: Accessories;
  /** offsets the idle bob so a crew of three doesn't move in lockstep */
  bobPhase?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const POSE_ROTATION: Record<PersonPose, { left: number; right: number }> = {
  stand: { left: 5, right: -5 },
  wave: { left: 8, right: -138 },
  cheer: { left: 160, right: -160 },
  point: { left: 7, right: -95 },
};

const POSE_SWING: Record<PersonPose, { left: number; right: number }> = {
  stand: { left: 1.5, right: -1.5 },
  wave: { left: 1, right: -13 },
  cheer: { left: -8, right: 8 },
  point: { left: 1, right: -2.5 },
};

/**
 * The shared human rig. Rookie, Captain Bea and every NPC are this body with a
 * different costume, so the whole cast stays on-model.
 */
export function Person({
  size = 160,
  emotion = 'happy',
  pose = 'stand',
  animate = true,
  skin = 'peach',
  hair = 'dark',
  hairStyle = 'fringe',
  outfit,
  headwear = 'none',
  headwearColor,
  accessories = {},
  bobPhase = 0,
  style,
  testID,
}: PersonProps) {
  const unit = size / PERSON_VB.h;
  const width = PERSON_VB.w * unit;
  const bob = useIdleBob(idle.bobAmplitude, idle.bobPeriodMs, bobPhase);
  const swing = useIdleBob(1, 820, bobPhase);
  const blink = useBlinkState();

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animate ? bob.value : 0 }, { scale: animate ? 1 + (bob.value / idle.bobAmplitude) * 0.008 : 1 }],
  }));
  const leftArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${POSE_ROTATION[pose].left + (animate ? swing.value * POSE_SWING[pose].left : 0)}deg` }],
  }));
  const rightArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${POSE_ROTATION[pose].right + (animate ? swing.value * POSE_SWING[pose].right : 0)}deg` }],
  }));

  const sk = skinTones[skin];
  const hr = hairTones[hair];
  const top = tones(outfit.top);
  const collar = outfit.collar ?? top.shade;
  const pants = tones(outfit.pants);
  const shoes = tones(outfit.shoes);
  const hatColor = headwearColor ?? palette.engineRed;
  const hat = tones(hatColor);
  const sleeveEnd = outfit.shortSleeves ? sk.base : outfit.top;

  const arm = (side: 'left' | 'right') => {
    const a = ARM[side];
    return (
      <G>
        <Path d={`M ${a.s.x} ${a.s.y} L ${a.e.x} ${a.e.y}`} stroke={top.shade} strokeWidth={14} strokeLinecap="round" />
        <Path d={`M ${a.s.x} ${a.s.y - 1} L ${a.e.x} ${a.e.y - 2}`} stroke={outfit.top} strokeWidth={12.5} strokeLinecap="round" />
        {outfit.stripes ? (
          <Path
            d={`M ${a.s.x + (side === 'left' ? -5.5 : 5.5)} ${a.e.y - 4} L ${a.e.x + (side === 'left' ? -5.5 : 5.5)} ${a.e.y - 1}`}
            stroke={outfit.stripes}
            strokeWidth={3.4}
            strokeLinecap="round"
            opacity={0.95}
          />
        ) : null}
        <Path d={`M ${a.e.x} ${a.e.y} L ${a.h.x} ${a.h.y}`} stroke={sleeveEnd} strokeWidth={11} strokeLinecap="round" />
        <Circle cx={a.h.x} cy={a.h.y + 1.4} r={6.9} fill={sk.shade} />
        <Circle cx={a.h.x} cy={a.h.y} r={6.6} fill={sk.base} />
        {pose === 'point' && side === 'right' ? <Circle cx={a.h.x + 5} cy={a.h.y + 3} r={2.6} fill={sk.base} /> : null}
      </G>
    );
  };

  return (
    <Animated.View testID={testID} style={[{ width, height: size }, bodyStyle, style]}>
      <Svg width={width} height={size} viewBox={`0 0 ${PERSON_VB.w} ${PERSON_VB.h}`}>
        {/* ground shadow */}
        <Ellipse cx={60} cy={159} rx={30} ry={5} fill={ink.shadow} />

        {/* legs + boots */}
        <Rect x={46} y={134} width={11} height={22} rx={5.5} fill={pants.base} />
        <Rect x={63} y={134} width={11} height={22} rx={5.5} fill={pants.base} />
        <Rect x={46} y={134} width={4} height={22} rx={2} fill={pants.shade} opacity={0.55} />
        <Rect x={63} y={134} width={4} height={22} rx={2} fill={pants.shade} opacity={0.55} />
        <Path d="M 42 150 h 17 a 4 4 0 0 1 4 4 v 3 a 3 3 0 0 1 -3 3 h -18 a 3 3 0 0 1 -3 -3 v -3 a 4 4 0 0 1 3 -4 z" fill={shoes.base} />
        <Path d="M 61 150 h 17 a 4 4 0 0 1 3 4 v 3 a 3 3 0 0 1 -3 3 h -18 a 3 3 0 0 1 -3 -3 v -3 a 4 4 0 0 1 4 -4 z" fill={shoes.base} />
        <Rect x={38} y={156} width={22} height={4} rx={2} fill={shoes.shade} />
        <Rect x={60} y={156} width={22} height={4} rx={2} fill={shoes.shade} />

        {/* torso */}
        <Path d={TORSO} fill={top.shade} transform="translate(2 2.5)" />
        <Path d={TORSO} fill={outfit.top} />
        <Path d="M 44 95 C 48 92 54 90 60 90 L 60 97 C 54 97 49 99 45 101 Z" fill={top.light} opacity={0.5} />

        {/* vest panels */}
        {outfit.vest ? (
          <G>
            <Path d="M 37.6 100 C 39 94 44 90.5 49 89.6 L 52 141.5 L 41.5 141.5 C 37 141.5 34.6 139 35 133.5 Z" fill={outfit.vest} />
            <Path d="M 82.4 100 C 81 94 76 90.5 71 89.6 L 68 141.5 L 78.5 141.5 C 83 141.5 85.4 139 85 133.5 Z" fill={outfit.vest} />
            <Path d="M 37.6 100 C 39 94 44 90.5 49 89.6 L 49.4 96 C 45 97.4 41.6 100.4 40 104 Z" fill={mix(outfit.vest, '#FFFFFF', 0.28)} opacity={0.7} />
          </G>
        ) : null}

        {/* apron */}
        {outfit.apron ? (
          <G>
            <Path d="M 50 92 L 70 92 L 71.5 104 C 76 108 77 116 76.5 124 L 75.5 141.5 L 44.5 141.5 L 43.5 124 C 43 116 44 108 48.5 104 Z" fill={outfit.apron} />
            <Path d="M 50 92 L 70 92 L 70.6 98.5 L 49.4 98.5 Z" fill={mix(outfit.apron, palette.navy, 0.1)} />
            <Path d="M 46 120 h 28" stroke={mix(outfit.apron, palette.navy, 0.12)} strokeWidth={2.4} strokeLinecap="round" />
            <Path d="M 52 92 L 47 100 M 68 92 L 73 100" stroke={mix(outfit.apron, palette.navy, 0.08)} strokeWidth={3} strokeLinecap="round" />
          </G>
        ) : null}

        {/* collar */}
        <Path d="M 45 90.5 L 60 104 L 75 90.5 L 80.5 94.5 L 60 113 L 39.5 94.5 Z" fill={collar} />

        {/* reflective stripes */}
        {outfit.stripes ? (
          <G>
            <Path d="M 37.2 114 Q 60 118 82.8 114" stroke={outfit.stripes} strokeWidth={5.4} strokeLinecap="round" fill="none" />
            <Path d="M 35.6 126 Q 60 130 84.4 126" stroke={outfit.stripes} strokeWidth={5.4} strokeLinecap="round" fill="none" />
            <Path d="M 37.2 112.4 Q 60 116.4 82.8 112.4" stroke="rgba(255,255,255,0.5)" strokeWidth={1.4} strokeLinecap="round" fill="none" />
          </G>
        ) : null}

        {/* buttons */}
        {outfit.buttons ? (
          <G>
            <Circle cx={60} cy={116} r={2.6} fill={outfit.buttons} />
            <Circle cx={60} cy={127} r={2.6} fill={outfit.buttons} />
            <Circle cx={60} cy={138} r={2.6} fill={outfit.buttons} />
          </G>
        ) : null}

        {/* chest emblem */}
        {outfit.emblem && outfit.emblem !== 'none' ? (
          <G>
            <Path d="M 73 106 L 81 106 L 81 114 C 81 118 77 120 77 120 C 77 120 73 118 73 114 Z" fill={palette.engineRed} />
            <Path d="M 73.6 106.6 L 80.4 106.6 L 80.4 113.8 C 80.4 117 77 118.8 77 118.8 C 77 118.8 73.6 117 73.6 113.8 Z" fill={palette.safetyYellow} opacity={0.95} />
            {outfit.emblem === 'flame' ? (
              <Path d="M 77 108.4 C 79 110.4 79.6 112.6 77 115.6 C 74.4 112.6 75 110.4 77 108.4 Z" fill={palette.engineRed} />
            ) : outfit.emblem === 'cross' ? (
              <Path d="M 75.8 109 h 2.4 v 2.2 h 2.2 v 2.4 h -2.2 v 2.2 h -2.4 v -2.2 h -2.2 v -2.4 h 2.2 z" fill={palette.engineRed} />
            ) : (
              <Path d="M 77 108.2 l 1.3 2.7 3 .4 -2.2 2.1 .5 3 -2.6 -1.4 -2.6 1.4 .5 -3 -2.2 -2.1 3 -.4 z" fill={palette.engineRed} />
            )}
          </G>
        ) : null}

        {/* neck */}
        <Path d="M 52.5 78 h 15 v 12 c 0 5 -15 5 -15 0 z" fill={sk.shade} />

        {/* hair behind the head */}
        {hairStyle !== 'none' ? <HairBack style={hairStyle} tone={hr} /> : null}

        {/* head */}
        <Ellipse cx={HEAD.cx + 1.6} cy={HEAD.cy + 1.8} rx={HEAD.rx} ry={HEAD.ry} fill={sk.shade} />
        <Ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx - 0.6} ry={HEAD.ry - 0.6} fill={sk.base} />
        <Ellipse cx={HEAD.cx - 11} cy={HEAD.cy - 13} rx={9} ry={6} fill="#FFFFFF" opacity={0.18} transform={`rotate(-24 ${HEAD.cx - 11} ${HEAD.cy - 13})`} />
        <Ellipse cx={33.5} cy={66} rx={5} ry={6} fill={sk.shade} />
        <Ellipse cx={86.5} cy={66} rx={5} ry={6} fill={sk.shade} />
        <Ellipse cx={33.8} cy={66} rx={3.6} ry={4.4} fill={sk.base} />
        <Ellipse cx={86.2} cy={66} rx={3.6} ry={4.4} fill={sk.base} />

        {/* face */}
        {accessories.nose ? <Ellipse cx={60} cy={FACE_CY + 5} rx={2.8} ry={2.2} fill={sk.shade} /> : null}
        <Face cx={60} cy={FACE_CY} emotion={emotion} blink={animate && blink} browColor={hr.shade} blushColor={sk.blush} />
        {accessories.freckles ? (
          <G opacity={0.5}>
            <Circle cx={44} cy={FACE_CY + 6} r={1.1} fill={sk.blush} />
            <Circle cx={48} cy={FACE_CY + 8.6} r={1.1} fill={sk.blush} />
            <Circle cx={72} cy={FACE_CY + 8.6} r={1.1} fill={sk.blush} />
            <Circle cx={76} cy={FACE_CY + 6} r={1.1} fill={sk.blush} />
          </G>
        ) : null}
        {accessories.flourCheek ? (
          <G opacity={0.85}>
            <Circle cx={76} cy={FACE_CY + 3} r={2.6} fill="#FFFFFF" />
            <Circle cx={80} cy={FACE_CY + 7} r={1.7} fill="#FFFFFF" />
            <Circle cx={72.5} cy={FACE_CY + 9} r={1.3} fill="#FFFFFF" />
          </G>
        ) : null}
        {accessories.moustache ? (
          <Path
            d={`M 60 ${FACE_CY + 8} C 55 ${FACE_CY + 4} 48 ${FACE_CY + 5} 46 ${FACE_CY + 11} C 51 ${FACE_CY + 12} 56 ${FACE_CY + 11} 60 ${FACE_CY + 9} C 64 ${FACE_CY + 11} 69 ${FACE_CY + 12} 74 ${FACE_CY + 11} C 72 ${FACE_CY + 5} 65 ${FACE_CY + 4} 60 ${FACE_CY + 8} Z`}
            fill={accessories.moustache}
          />
        ) : null}
        {accessories.glasses ? (
          <G>
            <Circle cx={48.5} cy={FACE_CY} r={10.5} fill="#FFFFFF" opacity={0.28} />
            <Circle cx={71.5} cy={FACE_CY} r={10.5} fill="#FFFFFF" opacity={0.28} />
            <Circle cx={48.5} cy={FACE_CY} r={10.5} stroke={palette.navy} strokeWidth={2.6} fill="none" />
            <Circle cx={71.5} cy={FACE_CY} r={10.5} stroke={palette.navy} strokeWidth={2.6} fill="none" />
            <Path d={`M 59 ${FACE_CY - 1} h 2`} stroke={palette.navy} strokeWidth={2.6} strokeLinecap="round" />
            <Path d={`M 38.4 ${FACE_CY - 2} l -5 -1.5 M 81.6 ${FACE_CY - 2} l 5 -1.5`} stroke={palette.navy} strokeWidth={2.4} strokeLinecap="round" />
          </G>
        ) : null}

        {/* hair in front */}
        {hairStyle !== 'none' ? <HairFront style={hairStyle} tone={hr} /> : null}

        {/* headwear */}
        <Headwear kind={headwear} tone={hat} />
      </Svg>

      <RigPart unit={unit} win={ARM_WIN.left} pivot={ARM.left.s} style={leftArmStyle}>
        {arm('left')}
      </RigPart>
      <RigPart unit={unit} win={ARM_WIN.right} pivot={ARM.right.s} style={rightArmStyle}>
        {arm('right')}
      </RigPart>
      <View pointerEvents="none" />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Hair                                                                 */
/* ------------------------------------------------------------------ */

function HairBack({ style, tone }: { style: HairStyle; tone: { base: string; shade: string; light: string } }) {
  switch (style) {
    case 'long':
      return (
        <G>
          <Path d="M 30 58 C 30 36 43 28 60 28 C 77 28 90 36 90 58 L 92 104 C 92 110 86 112 82 108 L 79 76 L 41 76 L 38 108 C 34 112 28 110 28 104 Z" fill={tone.shade} />
          <Path d="M 32 60 C 32 40 44 31 60 31 C 76 31 88 40 88 60 L 89 100 C 89 105 85 106 82 103 L 79 72 L 41 72 L 38 103 C 35 106 31 105 31 100 Z" fill={tone.base} />
        </G>
      );
    case 'ponytail':
      return (
        <G>
          <Ellipse cx={60} cy={56} rx={29.5} ry={28} fill={tone.base} />
          <Path d="M 88 52 C 100 50 106 60 104 72 C 102 86 94 92 88 88 C 94 78 94 62 86 58 Z" fill={tone.shade} />
          <Path d="M 89 54 C 99 53 103 61 101.5 71 C 100 82 94 87 90 85 C 94 76 94 63 87.5 59 Z" fill={tone.base} />
        </G>
      );
    case 'bun':
      return (
        <G>
          <Ellipse cx={60} cy={56} rx={29.5} ry={28} fill={tone.base} />
          <Circle cx={60} cy={28} r={11.5} fill={tone.shade} />
          <Circle cx={59} cy={27} r={10.2} fill={tone.base} />
          <Circle cx={55.5} cy={23.5} r={3.4} fill={tone.light} opacity={0.6} />
        </G>
      );
    case 'curly':
      return (
        <G>
          {[
            [36, 44, 10],
            [48, 33, 11],
            [62, 30, 11.5],
            [76, 35, 10.5],
            [86, 47, 9.5],
            [88, 60, 8],
            [32, 58, 8],
          ].map(([cx, cy, r], i) => (
            <Circle key={i} cx={cx} cy={cy} r={r} fill={tone.base} />
          ))}
        </G>
      );
    case 'short':
    case 'fringe':
    default:
      return <Ellipse cx={60} cy={56} rx={29.5} ry={28} fill={tone.base} />;
  }
}

function HairFront({ style, tone }: { style: HairStyle; tone: { base: string; shade: string; light: string } }) {
  const sheen = <Path d="M 44 42 C 49 36 56 34 62 35" stroke={tone.light} strokeWidth={3.2} strokeLinecap="round" fill="none" opacity={0.65} />;
  switch (style) {
    case 'short':
      return (
        <G>
          <Path d="M 33.2 58 C 33.2 40 45 32 60 32 C 75 32 86.8 40 86.8 58 C 84 50 78 46 60 46 C 42 46 36 50 33.2 58 Z" fill={tone.base} />
          {sheen}
        </G>
      );
    case 'curly':
      return (
        <G>
          {[
            [40, 48, 8],
            [51, 40, 8.5],
            [63, 38, 8.5],
            [74, 42, 8],
            [82, 51, 7.5],
          ].map(([cx, cy, r], i) => (
            <Circle key={i} cx={cx} cy={cy} r={r} fill={tone.base} />
          ))}
          <Circle cx={49} cy={38} r={3} fill={tone.light} opacity={0.5} />
        </G>
      );
    case 'none':
      return null;
    case 'bun':
    case 'ponytail':
    case 'long':
    case 'fringe':
    default:
      return (
        <G>
          <Path
            d="M 33.4 58 C 33.4 39 45 31 60 31 C 75 31 86.6 39 86.6 58 C 83 49 77 51 71.5 54 C 66.5 46 60 49.5 56 53 C 50 47.5 41.5 49.5 33.4 58 Z"
            fill={tone.base}
          />
          {sheen}
        </G>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Headwear                                                             */
/* ------------------------------------------------------------------ */

function Headwear({ kind, tone }: { kind: HeadwearKind; tone: { base: string; shade: string; light: string } }) {
  switch (kind) {
    case 'fire-helmet':
      return (
        <G>
          {/* dome */}
          <Path d="M 34 50 C 34 26 46 16 60 16 C 74 16 86 26 86 50 Z" fill={tone.shade} />
          <Path d="M 36 49 C 36 28 47 18.5 60 18.5 C 73 18.5 84 28 84 49 Z" fill={tone.base} />
          <Path d="M 44 30 C 47 24 53 21 58 21" stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeLinecap="round" fill="none" />
          {/* brim: swept up at the front, long at the back */}
          <Path
            d="M 16 55 C 16 45 34 40.5 60 40.5 C 86 40.5 104 45 104 55 C 104 61.5 96 64.5 88 61.5 C 78 57.5 42 57.5 32 61.5 C 24 64.5 16 61.5 16 55 Z"
            fill={tone.shade}
          />
          <Path
            d="M 18 54 C 18 45.5 35 41.6 60 41.6 C 85 41.6 102 45.5 102 54 C 102 58.6 95.5 61 88.5 58.4 C 78 54.4 42 54.4 31.5 58.4 C 24.5 61 18 58.6 18 54 Z"
            fill={tone.base}
          />
          <Path d="M 24 50.5 C 33 46 45 44.4 60 44.4" stroke="rgba(255,255,255,0.42)" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          {/* gold flame shield */}
          <Path d="M 51 22 L 69 22 L 69 34 C 69 41.5 60 45.5 60 45.5 C 60 45.5 51 41.5 51 34 Z" fill={palette.goldDark} />
          <Path d="M 52 23 L 68 23 L 68 34 C 68 40.5 60 44 60 44 C 60 44 52 40.5 52 34 Z" fill={palette.safetyYellow} />
          <Path d="M 60 26.5 C 64.5 30.5 65.5 34.5 60 40 C 54.5 34.5 55.5 30.5 60 26.5 Z" fill={palette.engineRed} />
          <Path d="M 60 31 C 62 33 62.4 35 60 37.6 C 57.6 35 58 33 60 31 Z" fill={palette.flameCore} />
        </G>
      );
    case 'captain-cap':
      return (
        <G>
          <Path d="M 34 46 C 34 28 45 20 60 20 C 75 20 86 28 86 46 Z" fill="#E7E9F4" />
          <Path d="M 36 45 C 36 30 46 22.5 60 22.5 C 74 22.5 84 30 84 45 Z" fill="#FFFFFF" />
          <Path d="M 45 32 C 48 27 53 24.5 58 24.5" stroke="rgba(255,255,255,0.9)" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Rect x={33} y={44} width={54} height={9} rx={4.5} fill={palette.navy} />
          <Path d="M 30 53 C 38 48 82 48 90 53 C 90 58 84 60.5 76 59 C 66 57 54 57 44 59 C 36 60.5 30 58 30 53 Z" fill="#16204A" />
          <Path d="M 51 33 L 69 33 L 69 40 C 69 45 60 47.5 60 47.5 C 60 47.5 51 45 51 40 Z" fill={palette.goldDark} />
          <Path d="M 52 34 L 68 34 L 68 40 C 68 44 60 46 60 46 C 60 46 52 44 52 40 Z" fill={palette.safetyYellow} />
          <Path d="M 60 36 l 1.5 3.1 3.4 .4 -2.5 2.4 .6 3.4 -3 -1.6 -3 1.6 .6 -3.4 -2.5 -2.4 3.4 -.4 z" fill={palette.goldDark} />
        </G>
      );
    case 'bandana':
      return (
        <G>
          <Path d="M 33.6 52 C 33.6 33 45 25 60 25 C 75 25 86.4 33 86.4 52 C 78 46 42 46 33.6 52 Z" fill={tone.shade} />
          <Path d="M 35 50 C 35 34.5 46 27.5 60 27.5 C 74 27.5 85 34.5 85 50 C 77 45 43 45 35 50 Z" fill={tone.base} />
          <Circle cx={44} cy={34} r={2} fill="rgba(255,255,255,0.75)" />
          <Circle cx={58} cy={30} r={2} fill="rgba(255,255,255,0.75)" />
          <Circle cx={72} cy={35} r={2} fill="rgba(255,255,255,0.75)" />
          <Path d="M 85 48 C 92 46 96 50 95 56 C 91 55 88 53 85 52 Z" fill={tone.shade} />
        </G>
      );
    case 'park-cap':
      return (
        <G>
          <Path d="M 35 46 C 35 30 46 22 60 22 C 74 22 85 30 85 46 Z" fill={tone.shade} />
          <Path d="M 37 45 C 37 32 47 24.5 60 24.5 C 73 24.5 83 32 83 45 Z" fill={tone.base} />
          <Path d="M 46 32 C 49 27.5 54 25.5 58 25.5" stroke="rgba(255,255,255,0.5)" strokeWidth={3.6} strokeLinecap="round" fill="none" />
          <Path d="M 60 44 C 76 43 94 45.5 96 51 C 96 55.5 84 55 60 53 Z" fill={tone.shade} />
          <Circle cx={60} cy={25} r={3.2} fill={tone.light} />
        </G>
      );
    case 'chef-hat':
      return (
        <G>
          <Circle cx={44} cy={26} r={12} fill="#F1F2F8" />
          <Circle cx={76} cy={26} r={12} fill="#F1F2F8" />
          <Circle cx={60} cy={19} r={14.5} fill="#F1F2F8" />
          <Circle cx={44} cy={25} r={11} fill="#FFFFFF" />
          <Circle cx={76} cy={25} r={11} fill="#FFFFFF" />
          <Circle cx={60} cy={18} r={13.5} fill="#FFFFFF" />
          <Rect x={40} y={34} width={40} height={12} rx={5} fill="#E7E9F4" />
          <Rect x={40} y={34} width={40} height={9} rx={4.5} fill="#FFFFFF" />
        </G>
      );
    case 'beanie':
      return (
        <G>
          <Path d="M 34 48 C 34 30 45 22 60 22 C 75 22 86 30 86 48 Z" fill={tone.base} />
          <Rect x={32} y={44} width={56} height={9} rx={4.5} fill={tone.shade} />
          <Circle cx={60} cy={21} r={4.5} fill={tone.light} />
        </G>
      );
    case 'none':
    default:
      return null;
  }
}
