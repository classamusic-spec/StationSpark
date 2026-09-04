/**
 * The Training Yard backdrop: grass, the practice tower with its ladder, a ring
 * of cones and the water target. Decorative only.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { idle, palette } from '@/theme';
import { useLoop } from '@/hooks/useIdle';

const SHEEN = 'rgba(255,255,255,0.3)';

function Cone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Ellipse cx={0} cy={2} rx={20} ry={6} fill="rgba(31,42,90,0.12)" />
      <Path d="M -13 0 L -2 -40 q 2 -5 4 0 L 13 0 Z" fill={palette.orange} />
      <Path d="M -8 -16 L 8 -16 L 10 -6 L -10 -6 Z" fill={palette.white} />
      <Rect x={-18} y={-3} width={36} height={7} rx={3.5} fill={palette.orangeDark} />
      <Path d="M -2 -40 q 2 -5 4 0 z" fill={SHEEN} />
    </G>
  );
}

export function TrainingBackdrop() {
  const drift = useLoop(idle.cloudDriftMs);
  const clouds = useAnimatedStyle(() => ({ transform: [{ translateX: -30 + drift.value * 60 }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.clouds, clouds]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMin slice">
          <G opacity={0.92}>
            <Circle cx={70} cy={54} r={17} fill={palette.white} />
            <Circle cx={92} cy={58} r={12} fill={palette.white} />
            <Circle cx={48} cy={59} r={11} fill={palette.white} />
            <Rect x={46} y={54} width={48} height={13} rx={6.5} fill={palette.white} />
          </G>
          <G opacity={0.85}>
            <Circle cx={318} cy={38} r={13} fill={palette.white} />
            <Circle cx={334} cy={42} r={9} fill={palette.white} />
            <Rect x={302} y={38} width={38} height={10} rx={5} fill={palette.white} />
          </G>
        </Svg>
      </Animated.View>

      <View style={styles.yard}>
        <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice">
          {/* grass */}
          <Ellipse cx={60} cy={230} rx={190} ry={70} fill="#7CC85F" />
          <Ellipse cx={340} cy={236} rx={180} ry={64} fill="#69BC55" />
          <Rect x={0} y={206} width={400} height={54} fill="#8FD16B" />

          {/* practice tower */}
          <G x={62} y={206}>
            <Ellipse cx={0} cy={4} rx={52} ry={12} fill="rgba(31,42,90,0.12)" />
            <Rect x={-30} y={-124} width={60} height={124} rx={8} fill="#F6DFB4" />
            <Rect x={-30} y={-124} width={60} height={7} fill={SHEEN} />
            <Path d="M -40 -120 L 0 -152 L 40 -120 Z" fill={palette.engineRed} />
            <Rect x={-40} y={-124} width={80} height={10} rx={5} fill={palette.engineRedDark} />
            <Rect x={-16} y={-104} width={32} height={26} rx={5} fill="#7FB6E8" />
            <Rect x={-14} y={-46} width={28} height={46} rx={5} fill="#8A5A32" />
            {/* ladder up the side */}
            <Rect x={30} y={-118} width={5} height={118} rx={2.5} fill="#C8D0E2" />
            <Rect x={46} y={-118} width={5} height={118} rx={2.5} fill="#C8D0E2" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Rect key={i} x={30} y={-108 + i * 19} width={21} height={4.5} rx={2} fill="#AAB4CC" />
            ))}
          </G>

          {/* water target */}
          <G x={326} y={202}>
            <Ellipse cx={0} cy={8} rx={40} ry={10} fill="rgba(31,42,90,0.12)" />
            <Rect x={-5} y={-42} width={10} height={50} rx={5} fill={palette.navySoft} />
            <Circle cx={0} cy={-66} r={30} fill={palette.white} />
            <Circle cx={0} cy={-66} r={22} fill={palette.engineRed} />
            <Circle cx={0} cy={-66} r={13} fill={palette.white} />
            <Circle cx={0} cy={-66} r={6} fill={palette.engineRed} />
            <Path d="M -18 -84 a 26 26 0 0 1 14 -9" stroke={SHEEN} strokeWidth={5} strokeLinecap="round" fill="none" />
          </G>

          {/* cones */}
          <Cone x={148} y={224} s={0.85} />
          <Cone x={196} y={234} s={1} />
          <Cone x={250} y={224} s={0.8} />
          <Cone x={120} y={244} s={0.7} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clouds: { position: 'absolute', left: 0, right: 0, top: 0, height: 240 },
  yard: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },
});
