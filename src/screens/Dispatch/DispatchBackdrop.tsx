/**
 * The Dispatch screen's world layers: drifting clouds, a tree line, rolling
 * hills and the firehouse bell tower on the right, exactly as in the reference
 * frame. Purely decorative — `pointerEvents` never blocks the slips.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { idle, palette } from '@/theme';
import { useLoop } from '@/hooks/useIdle';

const SHEEN = 'rgba(255,255,255,0.3)';

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G x={x} y={y} scale={s} opacity={0.92}>
      <Circle cx={0} cy={0} r={16} fill={palette.white} />
      <Circle cx={19} cy={4} r={12} fill={palette.white} />
      <Circle cx={-19} cy={5} r={11} fill={palette.white} />
      <Rect x={-21} y={0} width={42} height={13} rx={6.5} fill={palette.white} />
    </G>
  );
}

function TreeTop({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Circle cx={0} cy={0} r={26} fill="#3F9E56" />
      <Circle cx={-18} cy={10} r={19} fill="#4FAE63" />
      <Circle cx={19} cy={9} r={18} fill="#4FAE63" />
      <Circle cx={-8} cy={-12} r={11} fill={SHEEN} />
    </G>
  );
}

/** The little bell house from the reference — it sways gently forever. */
export function BellTower({ swing }: { swing: SharedValue<number> }) {
  const bell = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value}deg` }] }));
  return (
    <View style={styles.tower} pointerEvents="none">
      <Svg width={132} height={124} viewBox="0 0 132 124">
        <Rect x={22} y={44} width={88} height={64} rx={8} fill="#F6DFB4" />
        <Rect x={22} y={44} width={88} height={7} fill={SHEEN} />
        <Path d="M 10 48 L 66 14 L 122 48 Z" fill={palette.engineRed} />
        <Rect x={10} y={44} width={112} height={11} rx={5.5} fill={palette.engineRedDark} />
        <Path d="M 36 104 h 60 a 6 6 0 0 1 6 6 v 8 H 30 v -8 a 6 6 0 0 1 6 -6 z" fill={palette.tanDark} />
        <Circle cx={66} cy={76} r={26} fill="#EBD4AA" />
      </Svg>
      <Animated.View style={[styles.bellPivot, bell]}>
        <Svg width={44} height={48} viewBox="0 0 44 48">
          <Path d="M 6 32 q 0 -26 16 -26 q 16 0 16 26 z" fill={palette.safetyYellow} />
          <Rect x={3} y={31} width={38} height={7} rx={3.5} fill={palette.gold} />
          <Circle cx={22} cy={43} r={4.6} fill={palette.gold} />
          <Path d="M 13 22 q 3 -11 10 -12" stroke={SHEEN} strokeWidth={4} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Sky-level world layers behind the dispatch board. */
export function DispatchBackdrop() {
  const drift = useLoop(idle.cloudDriftMs);
  const clouds = useAnimatedStyle(() => ({ transform: [{ translateX: -40 + drift.value * 80 }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, clouds]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMin slice">
          <Cloud x={60} y={92} s={1} />
          <Cloud x={330} y={64} s={0.75} />
          <Cloud x={210} y={150} s={0.55} />
        </Svg>
      </Animated.View>
      <View style={styles.hills}>
        <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
          <TreeTop x={40} y={70} s={1} />
          <TreeTop x={120} y={58} s={0.8} />
          <TreeTop x={330} y={64} s={0.95} />
          <TreeTop x={264} y={78} s={0.7} />
          <Ellipse cx={70} cy={190} rx={190} ry={78} fill="#7CC85F" />
          <Ellipse cx={330} cy={196} rx={180} ry={70} fill="#69BC55" />
          <Rect x={0} y={168} width={400} height={40} fill="#8FD16B" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hills: { position: 'absolute', left: 0, right: 0, top: 0, height: 260 },
  tower: { position: 'absolute', right: 4, top: 10, width: 132, height: 124 },
  bellPivot: { position: 'absolute', left: 44, top: 56, width: 44, height: 48, transformOrigin: 'top center' },
});
