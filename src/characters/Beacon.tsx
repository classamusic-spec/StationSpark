import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Emotion } from '@/content/types';
import { durations, easings, idle, palette } from '@/theme';
import { useBlinkState, useIdleBob, usePulse, useReducedMotion } from '@/hooks';
import { RigPart } from './rig/RigPart';
import { ink } from './rig/palettes';

const VB = { w: 110, h: 150 } as const;
const VISOR = { x: 31, y: 30, w: 48, h: 34, r: 16 } as const;
const HOVER = 5;

const shell = { base: '#FFFFFF', shade: '#DCE2F0', deep: '#B9C3DC' };
const accent = { base: '#3D8BE8', dark: '#2A6BC0', light: '#7FB6F2' };
const visorInk = '#161F45';

export interface BeaconHandle {
  /** one full celebratory barrel roll */
  spin: () => void;
}

export interface BeaconProps {
  /** total height in px */
  size?: number;
  emotion?: Emotion;
  /** hover / blink / antenna pulse (default true) */
  animate?: boolean;
  /** visor sweeps left-to-right while Beacon reads a number or a word */
  scanning?: boolean;
  /** spin continuously (celebration) */
  spinning?: boolean;
  bobPhase?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The cyan visor face. Only the eyes and mouth change — never the visor. */
function VisorFace({ emotion, blink }: { emotion: Emotion; blink: boolean }) {
  const c = palette.waterCyan;
  const glow = palette.waterCyanLight;
  const eyeY = 44;
  const lx = 44;
  const rx = 66;
  const mouthY = 56;

  const dash = (x: number, lift = 0) => <Path d={`M ${x - 5} ${eyeY + lift} L ${x + 5} ${eyeY + lift}`} stroke={c} strokeWidth={4} strokeLinecap="round" />;
  const arc = (x: number, lift = 0) => (
    <Path d={`M ${x - 6} ${eyeY + 3 + lift} Q ${x} ${eyeY - 5 + lift} ${x + 6} ${eyeY + 3 + lift}`} stroke={c} strokeWidth={4.2} strokeLinecap="round" fill="none" />
  );
  const dot = (x: number, r = 5, lift = 0) => (
    <G>
      <Circle cx={x} cy={eyeY + lift} r={r} fill={c} />
      <Circle cx={x - r * 0.28} cy={eyeY + lift - r * 0.3} r={r * 0.32} fill={glow} />
    </G>
  );

  if (blink) {
    return (
      <G>
        {dash(lx)}
        {dash(rx)}
        <Path d={`M ${lx + 4} ${mouthY} Q 55 ${mouthY + 5} ${rx - 4} ${mouthY}`} stroke={c} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      </G>
    );
  }

  switch (emotion) {
    case 'excited':
      return (
        <G>
          {arc(lx, -1)}
          {arc(rx, -1)}
          <Path d={`M 46 ${mouthY - 1} Q 55 ${mouthY + 10} 64 ${mouthY - 1} Z`} fill={c} />
          <Path d="M 34 36 l 1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 z" fill={glow} />
          <Path d="M 76 38 l 1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1 z" fill={glow} />
        </G>
      );
    case 'think':
      return (
        <G>
          {dash(lx, -3)}
          {dot(rx, 4)}
          <Path d={`M 50 ${mouthY + 1} L 58 ${mouthY - 1}`} stroke={c} strokeWidth={3.2} strokeLinecap="round" />
          <Circle cx={68} cy={mouthY + 2} r={1.5} fill={glow} opacity={0.85} />
          <Circle cx={73} cy={mouthY + 2} r={1.5} fill={glow} opacity={0.6} />
        </G>
      );
    case 'calm':
      return (
        <G>
          {dot(lx, 4.4)}
          {dot(rx, 4.4)}
          <Path d={`M 49 ${mouthY} Q 55 ${mouthY + 4.5} 61 ${mouthY}`} stroke={c} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'worried':
      return (
        <G>
          {dot(lx, 5)}
          {dot(rx, 5)}
          <Path d={`M 49 ${mouthY + 2} Q 55 ${mouthY - 2.5} 61 ${mouthY + 2}`} stroke={c} strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <Path d={`M ${lx - 7} ${eyeY - 9} L ${lx + 5} ${eyeY - 12}`} stroke={c} strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
          <Path d={`M ${rx + 7} ${eyeY - 9} L ${rx - 5} ${eyeY - 12}`} stroke={c} strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
        </G>
      );
    case 'proud':
      return (
        <G>
          {arc(lx)}
          {arc(rx)}
          <Path d={`M 45 ${mouthY - 1} Q 55 ${mouthY + 8} 65 ${mouthY - 1}`} stroke={c} strokeWidth={3.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'surprised':
      return (
        <G>
          {dot(lx, 6.4)}
          {dot(rx, 6.4)}
          <Ellipse cx={55} cy={mouthY + 1} rx={3.6} ry={4.4} fill={c} />
        </G>
      );
    case 'happy':
    default:
      return (
        <G>
          {arc(lx)}
          {arc(rx)}
          <Path d={`M 47 ${mouthY} Q 55 ${mouthY + 7} 63 ${mouthY}`} stroke={c} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </G>
      );
  }
}

/**
 * Beacon — the small floating rescue robot who scans numbers, translates and
 * offers hints. White capsule body, cyan visor face, blinking antenna light and
 * a soft cyan glow on the ground below.
 */
export const Beacon = forwardRef<BeaconHandle, BeaconProps>(function Beacon(
  { size = 150, emotion = 'happy', animate = true, scanning = false, spinning = false, bobPhase = 0.5, style, testID },
  ref,
) {
  const unit = size / VB.h;
  const width = VB.w * unit;
  const reduced = useReducedMotion();
  const hover = useIdleBob(HOVER, idle.bobPeriodMs * 0.85, bobPhase);
  const lamp = usePulse(1400, 1);
  const blink = useBlinkState(idle.blinkMinMs, idle.blinkMaxMs, 130);
  const spin = useSharedValue(0);
  const sweep = useSharedValue(0);

  const doSpin = useCallback(() => {
    if (reduced) return;
    spin.value = withTiming(spin.value + 360, { duration: durations.cinematic, easing: easings.inOut });
  }, [reduced, spin]);

  useImperativeHandle(ref, () => ({ spin: doSpin }), [doSpin]);

  useEffect(() => {
    if (!spinning || reduced) return;
    spin.value = withRepeat(withSequence(withTiming(spin.value + 360, { duration: 900, easing: easings.inOut }), withDelay(700, withTiming(spin.value + 360, { duration: 0 }))), -1, false);
    return () => cancelAnimation(spin);
  }, [reduced, spin, spinning]);

  useEffect(() => {
    if (!scanning || reduced) {
      cancelAnimation(sweep);
      sweep.value = 0;
      return;
    }
    sweep.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(sweep);
  }, [reduced, scanning, sweep]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 640 }, { translateY: animate ? hover.value : 0 }, { rotateY: `${spin.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + (animate ? (0.5 - hover.value / (HOVER * 2)) * 0.22 : 0.1),
    transform: [{ scaleX: 1 - (animate ? hover.value / (HOVER * 4) : 0) }],
  }));
  const lampStyle = useAnimatedStyle(() => ({ opacity: animate ? 0.35 + lamp.value * 0.65 : 1, transform: [{ scale: 0.9 + lamp.value * 0.2 }] }));
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: scanning ? 0.55 : 0,
    transform: [{ translateX: (-14 + sweep.value * (VISOR.w + 14)) * unit }],
  }));

  return (
    <View testID={testID} style={[{ width, height: size }, style]}>
      {/* ground glow — drawn first so Beacon floats above it */}
      <RigPart unit={unit} win={{ x: 18, y: 124, w: 74, h: 26 }} style={glowStyle}>
        <Ellipse cx={55} cy={138} rx={34} ry={9} fill={palette.waterCyan} opacity={0.5} />
        <Ellipse cx={55} cy={138} rx={22} ry={5.5} fill={palette.waterCyanLight} opacity={0.55} />
      </RigPart>

      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <Svg width={width} height={size} viewBox={`0 0 ${VB.w} ${VB.h}`}>
          {/* antenna */}
          <Rect x={53} y={6} width={4} height={16} rx={2} fill={shell.shade} />

          {/* arms */}
          <Path d="M 31 86 L 23 106" stroke={shell.shade} strokeWidth={13} strokeLinecap="round" />
          <Path d="M 30.4 85 L 22.4 105" stroke={shell.base} strokeWidth={11.5} strokeLinecap="round" />
          <Path d="M 79 86 L 87 106" stroke={shell.shade} strokeWidth={13} strokeLinecap="round" />
          <Path d="M 79.6 85 L 87.6 105" stroke={shell.base} strokeWidth={11.5} strokeLinecap="round" />
          <Circle cx={22.4} cy={106} r={6.6} fill={accent.base} />
          <Circle cx={87.6} cy={106} r={6.6} fill={accent.base} />
          <Circle cx={20.8} cy={104} r={2.4} fill={accent.light} />
          <Circle cx={86} cy={104} r={2.4} fill={accent.light} />

          {/* body */}
          <Rect x={32} y={74} width={46} height={54} rx={23} fill={shell.deep} />
          <Rect x={31} y={72} width={46} height={54} rx={23} fill={shell.base} />
          <Path d="M 39 84 C 41 78 46 75 51 74.6 L 51 82 C 46.6 83 43 86 41.4 90 Z" fill="#FFFFFF" opacity={0.9} />
          {/* shoulder accents */}
          <Path d="M 31 88 C 31 79 36 74 43 73.4 L 43 88 Z" fill={accent.base} opacity={0.9} />
          <Path d="M 77 88 C 77 79 72 74 65 73.4 L 65 88 Z" fill={accent.base} opacity={0.9} />
          {/* chest core */}
          <Circle cx={54} cy={98} r={11} fill={accent.dark} opacity={0.25} />
          <Circle cx={54} cy={98} r={9.4} fill={palette.waterCyan} />
          <Circle cx={54} cy={98} r={5.6} fill={palette.waterCyanLight} />
          <Circle cx={51.8} cy={95.6} r={2.2} fill="#FFFFFF" />
          {/* thruster hint */}
          <Ellipse cx={54} cy={126} rx={13} ry={3.4} fill={palette.waterCyanLight} opacity={0.55} />

          {/* head */}
          <Rect x={24} y={18} width={62} height={60} rx={29} fill={shell.deep} />
          <Rect x={23} y={16} width={62} height={60} rx={29} fill={shell.base} />
          <Path d="M 33 34 C 36 26 43 21 51 20.4 L 51 28 C 45 29 39.6 33 36.6 39 Z" fill="#FFFFFF" opacity={0.95} />
          {/* ear pods */}
          <Rect x={17} y={38} width={9} height={20} rx={4.5} fill={accent.base} />
          <Rect x={82} y={38} width={9} height={20} rx={4.5} fill={accent.base} />

          {/* visor */}
          <Rect x={VISOR.x - 1.5} y={VISOR.y - 1.5} width={VISOR.w + 3} height={VISOR.h + 3} rx={VISOR.r + 1.5} fill={accent.dark} opacity={0.35} />
          <Rect x={VISOR.x} y={VISOR.y} width={VISOR.w} height={VISOR.h} rx={VISOR.r} fill={visorInk} />
          <Path d={`M ${VISOR.x + 6} ${VISOR.y + 5} Q ${VISOR.x + 16} ${VISOR.y + 1.5} ${VISOR.x + 26} ${VISOR.y + 3}`} stroke="rgba(255,255,255,0.22)" strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <VisorFace emotion={emotion} blink={animate && blink} />
        </Svg>

        {/* visor scan sweep — a soft cyan bar clipped to the visor */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: VISOR.x * unit,
            top: VISOR.y * unit,
            width: VISOR.w * unit,
            height: VISOR.h * unit,
            borderRadius: VISOR.r * unit,
            overflow: 'hidden',
          }}
        >
          <Animated.View style={[{ width: 14 * unit, height: '100%', backgroundColor: palette.waterCyanLight }, sweepStyle]} />
        </View>

        {/* antenna lamp */}
        <RigPart unit={unit} win={{ x: 44, y: 0, w: 22, h: 16 }} style={lampStyle} pivot={{ x: 55, y: 6 }}>
          <Circle cx={55} cy={6} r={7.5} fill={palette.waterCyan} opacity={0.35} />
          <Circle cx={55} cy={6} r={5} fill={palette.waterCyan} />
          <Circle cx={53.6} cy={4.6} r={1.8} fill="#FFFFFF" />
        </RigPart>
      </Animated.View>
    </View>
  );
});

/** Beacon's ink colours, exported so hint bubbles and radio cards can match him. */
export const beaconColors = { shell, accent, visor: visorInk, glow: palette.waterCyan, shadow: ink.shadow } as const;
