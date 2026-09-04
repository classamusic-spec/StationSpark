import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { Emotion } from '@/content/types';
import { idle, palette, springs, timings } from '@/theme';
import { useBlinkState, useIdleBob, useReducedMotion } from '@/hooks';
import { RigPart } from './rig/RigPart';
import { ink } from './rig/palettes';

const VB = { w: 132, h: 126 } as const;
const TAIL_PIVOT = { x: 98, y: 88 } as const;
const TAIL_WIN = { x: 88, y: 48, w: 44, h: 48 } as const;

const coat = { base: '#FFFFFF', shade: '#E3E8F4', deep: '#CBD3E6' };
const spot = '#2A3566';

export interface PepperHandle {
  /** one happy hop */
  jump: () => void;
}

export interface PepperProps {
  /** total height in px */
  size?: number;
  emotion?: Emotion;
  animate?: boolean;
  /** fast, delighted tail wag (otherwise the tail just sways) */
  wag?: boolean;
  /** loop the happy jump (celebrations) */
  jumping?: boolean;
  bobPhase?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Pepper — the station Dalmatian puppy. White with navy spots, red collar with
 * a gold tag, one floppy ear and a tongue that's usually out. The tail wags
 * whenever something goes right; Pepper is the comic relief, never the teacher.
 */
export const Pepper = forwardRef<PepperHandle, PepperProps>(function Pepper(
  { size = 130, emotion = 'happy', animate = true, wag = false, jumping = false, bobPhase = 1.4, style, testID },
  ref,
) {
  const unit = size / VB.h;
  const width = VB.w * unit;
  const reduced = useReducedMotion();
  const bob = useIdleBob(idle.bobAmplitude, idle.bobPeriodMs, bobPhase);
  const tail = useIdleBob(1, wag ? 300 : 1500, bobPhase);
  const blink = useBlinkState();
  const hop = useSharedValue(0);

  const doJump = useCallback(() => {
    if (reduced) return;
    hop.value = withSequence(withSpring(-1, springs.bounce), withSpring(0, springs.pop));
  }, [hop, reduced]);

  useImperativeHandle(ref, () => ({ jump: doJump }), [doJump]);

  useEffect(() => {
    if (!jumping || reduced || !animate) {
      cancelAnimation(hop);
      hop.value = withTiming(0, timings.fast);
      return;
    }
    hop.value = withRepeat(withSequence(withSpring(-1, springs.bounce), withSpring(0, springs.pop), withTiming(0, { duration: 320 })), -1, false);
    return () => cancelAnimation(hop);
  }, [animate, hop, jumping, reduced]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (animate ? bob.value * 0.7 : 0) + hop.value * size * 0.11 }, { scaleY: 1 + hop.value * -0.04 }],
  }));
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tail.value * (wag ? 26 : 8)}deg` }],
  }));

  const blinking = animate && blink;
  const eyeY = 46;
  const wide = emotion === 'surprised' || emotion === 'excited';
  const arcEyes = emotion === 'proud';
  const softEyes = emotion === 'calm' || emotion === 'think';
  const earsDown = emotion === 'worried';

  const eye = (cx: number) => {
    if (blinking) {
      return <Path d={`M ${cx - 5} ${eyeY} Q ${cx} ${eyeY + 3.6} ${cx + 5} ${eyeY}`} stroke={palette.navy} strokeWidth={2.8} strokeLinecap="round" fill="none" />;
    }
    if (arcEyes) {
      return <Path d={`M ${cx - 5.4} ${eyeY + 2} Q ${cx} ${eyeY - 4.4} ${cx + 5.4} ${eyeY + 2}`} stroke={palette.navy} strokeWidth={3.2} strokeLinecap="round" fill="none" />;
    }
    const r = wide ? 6.6 : softEyes ? 4.6 : 5.6;
    return (
      <G>
        {wide ? <Circle cx={cx} cy={eyeY} r={r + 1.4} fill="#FFFFFF" /> : null}
        <Ellipse cx={cx} cy={eyeY} rx={r} ry={softEyes ? r * 0.72 : r} fill={palette.navy} />
        <Circle cx={cx + r * 0.34} cy={eyeY - r * 0.36} r={r * 0.32} fill="#FFFFFF" />
      </G>
    );
  };

  const mouth = () => {
    const my = 66;
    switch (emotion) {
      case 'calm':
        return <Path d={`M 42 ${my} Q 50 ${my + 5} 58 ${my}`} stroke={palette.navy} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
      case 'worried':
        return <Path d={`M 43 ${my + 2} Q 50 ${my - 2} 57 ${my + 2}`} stroke={palette.navy} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
      case 'think':
        return <Path d={`M 44 ${my + 1} Q 50 ${my + 3} 57 ${my - 1}`} stroke={palette.navy} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
      case 'surprised':
        return (
          <G>
            <Ellipse cx={50} cy={my + 2} rx={4.4} ry={5} fill={ink.mouth} />
            <Ellipse cx={50} cy={my + 3.6} rx={2.6} ry={2.2} fill={ink.tongue} />
          </G>
        );
      case 'excited':
      case 'proud':
      case 'happy':
      default: {
        const big = emotion !== 'happy';
        return (
          <G>
            <Path d={`M 40 ${my - 2} Q 50 ${my + (big ? 12 : 9)} 60 ${my - 2} Z`} fill={ink.mouth} />
            <Path d={`M ${50 - (big ? 5.4 : 4.6)} ${my + (big ? 6 : 4)} q ${big ? 5.4 : 4.6} ${big ? 12 : 9} ${big ? 10.8 : 9.2} 0 q -${big ? 5.4 : 4.6} 4 -${big ? 10.8 : 9.2} 0 z`} fill={ink.tongue} />
          </G>
        );
      }
    }
  };

  return (
    <Animated.View testID={testID} style={[{ width, height: size }, style]}>
      {/* tail — same coordinate space, lifted out so it can wag behind the body */}
      <RigPart unit={unit} win={TAIL_WIN} pivot={TAIL_PIVOT} style={tailStyle}>
        <Path d="M 98 88 Q 114 84 118 62" stroke={coat.deep} strokeWidth={11} strokeLinecap="round" fill="none" />
        <Path d="M 97.4 87 Q 113 83 117 61" stroke={coat.base} strokeWidth={9} strokeLinecap="round" fill="none" />
        <Circle cx={112} cy={72} r={3.6} fill={spot} />
        <Circle cx={117} cy={60} r={4.2} fill={spot} />
      </RigPart>

      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <Svg width={width} height={size} viewBox={`0 0 ${VB.w} ${VB.h}`}>
          <Ellipse cx={66} cy={120} rx={38} ry={5.5} fill={ink.shadow} />

          {/* hind + front legs */}
          <Path d="M 58 92 h 13 a 6.5 6.5 0 0 1 6.5 6.5 v 14 a 6 6 0 0 1 -6 6 h -14 a 6 6 0 0 1 -6 -6 v -14 a 6.5 6.5 0 0 1 6.5 -6.5 z" fill={coat.shade} />
          <Path d="M 57 90 h 13 a 6.5 6.5 0 0 1 6.5 6.5 v 14 a 6 6 0 0 1 -6 6 h -14 a 6 6 0 0 1 -6 -6 v -14 a 6.5 6.5 0 0 1 6.5 -6.5 z" fill={coat.base} />
          <Path d="M 82 92 h 13 a 6.5 6.5 0 0 1 6.5 6.5 v 14 a 6 6 0 0 1 -6 6 h -14 a 6 6 0 0 1 -6 -6 v -14 a 6.5 6.5 0 0 1 6.5 -6.5 z" fill={coat.shade} />
          <Path d="M 81 90 h 13 a 6.5 6.5 0 0 1 6.5 6.5 v 14 a 6 6 0 0 1 -6 6 h -14 a 6 6 0 0 1 -6 -6 v -14 a 6.5 6.5 0 0 1 6.5 -6.5 z" fill={coat.base} />
          <Ellipse cx={63.5} cy={115} rx={6} ry={3.2} fill={coat.deep} />
          <Ellipse cx={87.5} cy={115} rx={6} ry={3.2} fill={coat.deep} />

          {/* body */}
          <Ellipse cx={78} cy={86} rx={27} ry={30} fill={coat.shade} />
          <Ellipse cx={76.5} cy={84.5} rx={25.6} ry={28.6} fill={coat.base} />
          <Ellipse cx={66} cy={70} rx={9} ry={6} fill="#FFFFFF" opacity={0.9} />
          {/* body spots */}
          <Ellipse cx={88} cy={78} rx={7.4} ry={6.2} fill={spot} />
          <Ellipse cx={81} cy={100} rx={5.2} ry={4.4} fill={spot} />
          <Circle cx={95} cy={94} r={3.4} fill={spot} />

          {/* collar */}
          <Path d="M 30 68 Q 52 86 74 62" stroke="#B9261C" strokeWidth={9.5} strokeLinecap="round" fill="none" />
          <Path d="M 30 66.4 Q 52 84.4 74 60.4" stroke={palette.engineRed} strokeWidth={7.5} strokeLinecap="round" fill="none" />
          <Circle cx={54} cy={84} r={6} fill={palette.goldDark} />
          <Circle cx={54} cy={82.8} r={5} fill={palette.safetyYellow} />
          <Path d="M 54 79.6 l 1 2.1 2.3 .3 -1.7 1.6 .4 2.3 -2 -1.1 -2 1.1 .4 -2.3 -1.7 -1.6 2.3 -.3 z" fill={palette.goldDark} opacity={0.65} />

          {/* head */}
          <Circle cx={51.5} cy={49.5} r={30} fill={coat.shade} />
          <Circle cx={50} cy={48} r={28.8} fill={coat.base} />
          <Ellipse cx={38} cy={32} rx={9} ry={6} fill="#FFFFFF" opacity={0.85} transform="rotate(-22 38 32)" />
          {/* eye patch spot */}
          <Ellipse cx={64} cy={40} rx={11} ry={9.6} fill={spot} transform="rotate(14 64 40)" />
          <Circle cx={31} cy={58} r={4.6} fill={spot} />

          {/* ears */}
          <Ellipse
            cx={20}
            cy={earsDown ? 66 : 56}
            rx={10}
            ry={18}
            fill={spot}
            transform={`rotate(${earsDown ? 8 : 18} 20 ${earsDown ? 66 : 56})`}
          />
          <Ellipse cx={19} cy={earsDown ? 62 : 52} rx={4.4} ry={9} fill="#3E4A80" opacity={0.55} transform={`rotate(${earsDown ? 8 : 18} 19 ${earsDown ? 62 : 52})`} />
          <Ellipse cx={78} cy={26} rx={8.6} ry={13} fill={spot} transform="rotate(24 78 26)" />

          {/* muzzle */}
          <Ellipse cx={50} cy={60} rx={18} ry={13.5} fill={coat.shade} />
          <Ellipse cx={49.4} cy={59} rx={17.2} ry={12.8} fill={coat.base} />
          {mouth()}
          <Path d="M 50 54.5 L 50 60" stroke={palette.navy} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M 44 50.5 h 12 a 4.6 4.6 0 0 1 -6 5.4 a 4.6 4.6 0 0 1 -6 -5.4 z" fill={palette.navy} />
          <Ellipse cx={46.6} cy={51.6} rx={2} ry={1.2} fill="#5A6699" />

          {/* eyes */}
          {eye(38)}
          {eye(62)}

          {/* cheeks */}
          <Ellipse cx={28} cy={62} rx={5} ry={3.4} fill="#FF9EA8" opacity={0.5} />
          <Ellipse cx={72} cy={62} rx={5} ry={3.4} fill="#FF9EA8" opacity={0.4} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});
