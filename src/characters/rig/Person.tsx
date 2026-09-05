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
/**
 * Shoulders sit *inside* the jacket silhouette so a rotating arm never shows a
 * gap at the joint — the shoulder cap is drawn on the body, the arm root under
 * it (art critique item #22: "arms stop reading as detached ovals").
 */
const ARM = {
  right: { s: { x: 78.5, y: 102 }, e: { x: 85, y: 118 }, h: { x: 88, y: 133 } },
  left: { s: { x: 41.5, y: 102 }, e: { x: 35, y: 118 }, h: { x: 32, y: 133 } },
} as const;
const ARM_WIN = {
  right: { x: 56, y: 46, w: 64, h: 110 },
  left: { x: 0, y: 46, w: 64, h: 110 },
} as const;

/**
 * The jacket. Ends at a hem (y ≈ 128) with the trousers below it — that break
 * is what stops Rookie reading as one navy blob at thumbnail size.
 */
const TORSO =
  'M 36.5 105 C 36.5 95 44 90 60 90 C 76 90 83.5 95 83.5 105 L 85 122 C 85.6 126.6 82.4 129 78.4 129 L 41.6 129 C 37.6 129 34.4 126.6 35 122 Z';

/** Where the jacket hem, the trouser block and the boots meet. */
const HEM_Y = 129;
const BOOT_TOP = 139;

/**
 * How far each hat is lifted off the brow, in rig units. Without the lift the
 * fire helmet's brim sits on the eyelashes and no hairstyle is visible at all.
 */
const HEADWEAR_LIFT: Record<HeadwearKind, number> = {
  none: 0,
  'fire-helmet': 8,
  'captain-cap': 6,
  bandana: 4,
  'park-cap': 4,
  'chef-hat': 0,
  beanie: 4,
};

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

  /**
   * One arm: shoulder cap → upper sleeve → cuff band → forearm → hand.
   * The shoulder cap is drawn at the pivot so the joint stays closed at every
   * pose angle, and the cuff makes the sleeve end read as clothing, not paint.
   */
  const arm = (side: 'left' | 'right') => {
    const a = ARM[side];
    const out = side === 'left' ? -1 : 1;
    /** where the cuff sits along elbow → wrist */
    const cuff = (t: number) => ({ x: a.e.x + (a.h.x - a.e.x) * t, y: a.e.y + (a.h.y - a.e.y) * t });
    const shortS = !!outfit.shortSleeves;
    const c0 = cuff(shortS ? -0.06 : 0.56);
    const c1 = cuff(shortS ? 0.16 : 0.8);
    const cuffColor = outfit.stripes ?? top.light;
    return (
      <G>
        {/* upper sleeve — shade first, then the flat fill lifted 1 unit */}
        <Path d={`M ${a.s.x} ${a.s.y + 1.5} L ${a.e.x + out * 1} ${a.e.y + 1.5}`} stroke={top.shade} strokeWidth={14.5} strokeLinecap="round" />
        <Path d={`M ${a.s.x} ${a.s.y} L ${a.e.x} ${a.e.y}`} stroke={outfit.top} strokeWidth={13} strokeLinecap="round" />
        {/* forearm */}
        <Path d={`M ${a.e.x} ${a.e.y + 1.4} L ${a.h.x} ${a.h.y + 1.4}`} stroke={shortS ? sk.shade : top.shade} strokeWidth={12.5} strokeLinecap="round" />
        <Path d={`M ${a.e.x} ${a.e.y} L ${a.h.x} ${a.h.y}`} stroke={sleeveEnd} strokeWidth={11.4} strokeLinecap="round" />
        {/* the reflective cuff band */}
        <Path d={`M ${c0.x} ${c0.y} L ${c1.x} ${c1.y}`} stroke={mix(cuffColor, palette.navy, 0.2)} strokeWidth={13.4} strokeLinecap="butt" />
        <Path d={`M ${c0.x} ${c0.y} L ${c1.x} ${c1.y}`} stroke={cuffColor} strokeWidth={12.2} strokeLinecap="butt" />
        {/* shoulder cap — keeps the joint closed however the arm swings */}
        <Circle cx={a.s.x} cy={a.s.y + 0.8} r={8.2} fill={top.shade} />
        <Circle cx={a.s.x} cy={a.s.y - 0.4} r={7.6} fill={outfit.top} />
        <Path d={`M ${a.s.x - out * 3.4} ${a.s.y - 5.4} A 7 7 0 0 ${out === 1 ? 1 : 0} ${a.s.x + out * 4.8} ${a.s.y - 1.6}`} stroke={top.light} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.75} />
        {/* hand */}
        <Circle cx={a.h.x} cy={a.h.y + 1.6} r={7.1} fill={sk.shade} />
        <Circle cx={a.h.x} cy={a.h.y} r={6.7} fill={sk.base} />
        <Circle cx={a.h.x - out * 2} cy={a.h.y - 2.4} r={2.2} fill={sk.light} opacity={0.6} />
        {pose === 'point' && side === 'right' ? <Circle cx={a.h.x + 5} cy={a.h.y + 3} r={2.6} fill={sk.base} /> : null}
      </G>
    );
  };

  return (
    <Animated.View testID={testID} style={[{ width, height: size }, bodyStyle, style]}>
      <Svg width={width} height={size} viewBox={`0 0 ${PERSON_VB.w} ${PERSON_VB.h}`}>
        {/* ground shadow — rule 3 */}
        <Ellipse cx={60} cy={159} rx={30} ry={6.6} fill={ink.shadow} />

        {/* --- boots: a real silhouette, shaft + toe + sole --- */}
        <Path d={`M 44 ${BOOT_TOP} h 13 v 15 a 5 5 0 0 1 -5 5 h -14 a 4 4 0 0 1 -4 -4 v -2 c 0 -3.4 4 -4.4 6.5 -6 c 2.5 -1.6 3.5 -4 3.5 -8 z`} fill={shoes.shade} transform="translate(0 1.4)" />
        <Path d={`M 44 ${BOOT_TOP} h 13 v 15 a 5 5 0 0 1 -5 5 h -14 a 4 4 0 0 1 -4 -4 v -2 c 0 -3.4 4 -4.4 6.5 -6 c 2.5 -1.6 3.5 -4 3.5 -8 z`} fill={shoes.base} />
        <Path d={`M 76 ${BOOT_TOP} h -13 v 15 a 5 5 0 0 0 5 5 h 14 a 4 4 0 0 0 4 -4 v -2 c 0 -3.4 -4 -4.4 -6.5 -6 c -2.5 -1.6 -3.5 -4 -3.5 -8 z`} fill={shoes.shade} transform="translate(0 1.4)" />
        <Path d={`M 76 ${BOOT_TOP} h -13 v 15 a 5 5 0 0 0 5 5 h 14 a 4 4 0 0 0 4 -4 v -2 c 0 -3.4 -4 -4.4 -6.5 -6 c -2.5 -1.6 -3.5 -4 -3.5 -8 z`} fill={shoes.base} />
        {/* soles */}
        <Path d="M 21 154.5 h 36 a 5 5 0 0 1 -5 5 h -27 a 4 4 0 0 1 -4 -4 z" fill={shoes.shade} opacity={0.9} />
        <Path d="M 99 154.5 h -36 a 5 5 0 0 0 5 5 h 27 a 4 4 0 0 0 4 -4 z" fill={shoes.shade} opacity={0.9} />
        {/* boot cuffs */}
        <Rect x={42.6} y={BOOT_TOP - 3} width={15.8} height={6} rx={3} fill={shoes.light} />
        <Rect x={61.6} y={BOOT_TOP - 3} width={15.8} height={6} rx={3} fill={shoes.light} />
        <Rect x={44.6} y={BOOT_TOP + 3} width={3.4} height={9} rx={1.7} fill="rgba(255,255,255,0.22)" />

        {/* --- trousers: the waist break between jacket and boots --- */}
        <Rect x={40} y={116} width={40} height={20} rx={8} fill={pants.shade} />
        <Rect x={40} y={115} width={40} height={19} rx={8} fill={pants.base} />
        <Rect x={44} y={HEM_Y - 4} width={13} height={17} rx={5} fill={pants.shade} />
        <Rect x={44} y={HEM_Y - 5} width={13} height={17} rx={5} fill={pants.base} />
        <Rect x={63} y={HEM_Y - 4} width={13} height={17} rx={5} fill={pants.shade} />
        <Rect x={63} y={HEM_Y - 5} width={13} height={17} rx={5} fill={pants.base} />
        <Rect x={58.8} y={HEM_Y - 3} width={2.4} height={14} rx={1.2} fill={pants.shade} />

        {/* --- jacket --- */}
        <Path d={TORSO} fill={top.shade} transform="translate(1.6 2.4)" />
        <Path d={TORSO} fill={outfit.top} />
        <Path d="M 44 96 C 48 92.6 54 90.6 60 90.6 L 60 98 C 54 98 49 100 45 102.4 Z" fill={top.light} opacity={0.5} />
        {/* the hem lip — a value step, never a keyline (rule 1) */}
        <Path d={`M 36.4 ${HEM_Y - 4.4} C 46 ${HEM_Y - 2.4} 74 ${HEM_Y - 2.4} 83.6 ${HEM_Y - 4.4} L 84.2 ${HEM_Y - 1.6} C 74 ${HEM_Y + 0.4} 46 ${HEM_Y + 0.4} 35.8 ${HEM_Y - 1.6} Z`} fill={top.shade} opacity={0.85} />

        {/* vest panels */}
        {outfit.vest ? (
          <G>
            <Path d="M 37.6 100 C 39 94.4 44 91 49 90.2 L 51.4 128 L 41.6 128 C 37.6 128 34.6 126 35 121.4 Z" fill={outfit.vest} />
            <Path d="M 82.4 100 C 81 94.4 76 91 71 90.2 L 68.6 128 L 78.4 128 C 82.4 128 85.4 126 85 121.4 Z" fill={outfit.vest} />
            <Path d="M 37.6 100 C 39 94.4 44 91 49 90.2 L 49.4 96.4 C 45 97.8 41.6 100.8 40 104.4 Z" fill={mix(outfit.vest, '#FFFFFF', 0.28)} opacity={0.7} />
          </G>
        ) : null}

        {/* apron */}
        {outfit.apron ? (
          <G>
            <Path d="M 50 92 L 70 92 L 71.4 103.6 C 75.6 107.4 76.6 115 76.2 122 L 75.6 133 L 44.4 133 L 43.8 122 C 43.4 115 44.4 107.4 48.6 103.6 Z" fill={outfit.apron} />
            <Path d="M 50 92 L 70 92 L 70.6 98.5 L 49.4 98.5 Z" fill={mix(outfit.apron, palette.navy, 0.1)} />
            <Path d="M 46 118 h 28" stroke={mix(outfit.apron, palette.navy, 0.12)} strokeWidth={2.4} strokeLinecap="round" />
            <Path d="M 52 92 L 47 100 M 68 92 L 73 100" stroke={mix(outfit.apron, palette.navy, 0.08)} strokeWidth={3} strokeLinecap="round" />
          </G>
        ) : null}

        {/* collar */}
        <Path d="M 45 90.5 L 60 103 L 75 90.5 L 80 94.4 L 60 111 L 40 94.4 Z" fill={collar} />

        {/*
         * Reflective bands. One across the chest, one at the jacket hem — the
         * hem band IS the waist break (art critique item #22), so the eye reads
         * jacket / trousers / boots instead of one navy mass.
         */}
        {outfit.stripes ? (
          <G>
            <Path d="M 37.6 111 Q 60 115 82.4 111" stroke={mix(outfit.stripes, palette.navy, 0.22)} strokeWidth={6.2} strokeLinecap="round" fill="none" />
            <Path d="M 37.6 110.4 Q 60 114.4 82.4 110.4" stroke={outfit.stripes} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Path d={`M 36.4 ${HEM_Y - 8.6} Q 60 ${HEM_Y - 4.6} 83.6 ${HEM_Y - 8.6}`} stroke={mix(outfit.stripes, palette.navy, 0.22)} strokeWidth={6.2} strokeLinecap="round" fill="none" />
            <Path d={`M 36.4 ${HEM_Y - 9.2} Q 60 ${HEM_Y - 5.2} 83.6 ${HEM_Y - 9.2}`} stroke={outfit.stripes} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Path d="M 39 108.6 Q 60 112.4 81 108.6" stroke="rgba(255,255,255,0.45)" strokeWidth={1.4} strokeLinecap="round" fill="none" />
          </G>
        ) : null}

        {/* buttons */}
        {outfit.buttons ? (
          <G>
            <Circle cx={60} cy={109} r={2.6} fill={outfit.buttons} />
            <Circle cx={60} cy={118} r={2.6} fill={outfit.buttons} />
            <Circle cx={60} cy={127} r={2.6} fill={outfit.buttons} />
          </G>
        ) : null}

        {/* ONE small chest badge — the chest is jacket + two bands + this, nothing else */}
        {outfit.emblem && outfit.emblem !== 'none' ? (
          <G>
            <Path d="M 71.4 98 L 80.6 98 L 80.6 105.4 C 80.6 109.6 76 111.8 76 111.8 C 76 111.8 71.4 109.6 71.4 105.4 Z" fill={palette.engineRedDark} />
            <Path d="M 72.2 98.8 L 79.8 98.8 L 79.8 105.2 C 79.8 108.8 76 110.6 76 110.6 C 76 110.6 72.2 108.8 72.2 105.2 Z" fill={palette.safetyYellow} />
            {outfit.emblem === 'flame' ? (
              <Path d="M 76 100.6 C 78.2 102.8 78.8 105 76 108 C 73.2 105 73.8 102.8 76 100.6 Z" fill={palette.engineRed} />
            ) : outfit.emblem === 'cross' ? (
              <Path d="M 74.8 101.2 h 2.4 v 2.2 h 2.2 v 2.4 h -2.2 v 2.2 h -2.4 v -2.2 h -2.2 v -2.4 h 2.2 z" fill={palette.engineRed} />
            ) : (
              <Path d="M 76 100.4 l 1.3 2.7 3 .4 -2.2 2.1 .5 3 -2.6 -1.4 -2.6 1.4 .5 -3 -2.2 -2.1 3 -.4 z" fill={palette.engineRed} />
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

        {/* headwear — lifted so the hairline is not swallowed whole */}
        <G transform={`translate(0 ${-HEADWEAR_LIFT[headwear]})`}>
          <Headwear kind={headwear} tone={hat} />
        </G>

        {/*
         * Hair that shows UNDER a hat. Without this the helmet swallows the
         * whole hairstyle and three of the four hair swatches change nothing
         * visible (art critique item #22).
         */}
        {hairStyle !== 'none' && headwear !== 'none' ? <HairPeek style={hairStyle} tone={hr} /> : null}
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

/**
 * Hair that escapes from under a hat: two temple locks in front of the ears,
 * a fringe flick under the brim, and the length at the back for long styles.
 * Drawn *after* the headwear so it always reads, whatever the hat.
 */
function HairPeek({ style, tone }: { style: HairStyle; tone: { base: string; shade: string; light: string } }) {
  const curly = style === 'curly';
  const longBack = style === 'long' || style === 'ponytail';
  return (
    <G>
      {curly ? (
        <G>
          <Circle cx={31.5} cy={62} r={7.6} fill={tone.shade} />
          <Circle cx={30.5} cy={61} r={7} fill={tone.base} />
          <Circle cx={36} cy={72} r={5.8} fill={tone.base} />
          <Circle cx={88.5} cy={62} r={7.6} fill={tone.shade} />
          <Circle cx={89.5} cy={61} r={7} fill={tone.base} />
          <Circle cx={84} cy={72} r={5.8} fill={tone.base} />
          <Circle cx={33.8} cy={58} r={3} fill={tone.light} opacity={0.55} />
        </G>
      ) : (
        <G>
          {/* temple locks, in front of the ears */}
          <Path d="M 30.5 55 C 25.5 63 26.5 72 32 77 C 36.5 73 38.5 64 37 55 Z" fill={tone.shade} />
          <Path d="M 31.5 55 C 27.5 62.5 28.5 70.5 32.6 74.6 C 36 71 37.4 63.5 36.4 55 Z" fill={tone.base} />
          <Path d="M 89.5 55 C 94.5 63 93.5 72 88 77 C 83.5 73 81.5 64 83 55 Z" fill={tone.shade} />
          <Path d="M 88.5 55 C 92.5 62.5 91.5 70.5 87.4 74.6 C 84 71 82.6 63.5 83.6 55 Z" fill={tone.base} />
          <Path d="M 32.4 58 C 31 62 30.8 66 31.6 69.4" stroke={tone.light} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.6} />
        </G>
      )}
      {/* the fringe under the brim — a centre point and two flicks, both eyes clear */}
      <Path d="M 51 45 C 53 54.6 56 59 60 59 C 64 59 67 54.6 69 45 Z" fill={tone.shade} />
      <Path d="M 52 45 C 53.8 53.6 56.4 57.6 60 57.6 C 63.6 57.6 66.2 53.6 68 45 Z" fill={tone.base} />
      <Path d="M 34.6 45 C 35.6 52.6 39.6 57 45 55.4 C 40.8 54 38 50.6 37.4 45 Z" fill={tone.shade} />
      <Path d="M 85.4 45 C 84.4 52.6 80.4 57 75 55.4 C 79.2 54 82 50.6 82.6 45 Z" fill={tone.shade} />
      <Path d="M 35.6 45 C 36.4 51.6 40 55.4 44.6 54.2 C 41 53 38.6 49.8 38.2 45 Z" fill={tone.base} />
      <Path d="M 84.4 45 C 83.6 51.6 80 55.4 75.4 54.2 C 79 53 81.4 49.8 81.8 45 Z" fill={tone.base} />
      {longBack ? (
        <G>
          <Path d="M 30 62 C 26 74 27 86 31 92 C 36 88 37 74 35.5 62 Z" fill={tone.shade} />
          <Path d="M 90 62 C 94 74 93 86 89 92 C 84 88 83 74 84.5 62 Z" fill={tone.shade} />
          <Path d="M 31 63 C 27.6 74 28.6 84.6 32 89.4 C 36 85.6 36.4 74 35 63 Z" fill={tone.base} />
          <Path d="M 89 63 C 92.4 74 91.4 84.6 88 89.4 C 84 85.6 83.6 74 85 63 Z" fill={tone.base} />
        </G>
      ) : null}
    </G>
  );
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
