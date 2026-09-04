import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { palette, springs } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';

const DW = 300;
const DH = 152;

/**
 * The red FIREHOUSE KITCHEN plaque from the reference art: bolted red banner,
 * cream lower band, chef hat on top. It swings in on mount like a hanging sign.
 */
export function KitchenSign({ width = 300, top = 'FIREHOUSE', bottom = 'KITCHEN' }: { width?: number; top?: string; bottom?: string }) {
  const s = width / DW;
  const swing = useSharedValue(-9);
  const drop = useSharedValue(-26);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      swing.value = 0;
      drop.value = 0;
      return;
    }
    drop.value = withSpring(0, springs.gentle);
    swing.value = withDelay(
      90,
      withSequence(withTiming(6, { duration: 260 }), withSpring(-3, springs.gentle), withSpring(0, springs.soft)),
    );
  }, [drop, reduced, swing]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }, { rotate: `${swing.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width, height: DH * s }, anim]}>
      <Svg width={width} height={DH * s} viewBox={`0 0 ${DW} ${DH}`}>
        <Defs>
          <LinearGradient id="signRed" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.engineRedLight} />
            <Stop offset="0.5" stopColor={palette.engineRed} />
            <Stop offset="1" stopColor={palette.engineRedDark} />
          </LinearGradient>
        </Defs>

        {/* chef hat */}
        <G>
          <Circle cx={128} cy={26} r={19} fill={palette.white} />
          <Circle cx={150} cy={17} r={17} fill={palette.white} />
          <Circle cx={172} cy={26} r={19} fill={palette.white} />
          <Rect x={124} y={26} width={52} height={22} rx={7} fill={palette.white} />
          <Rect x={122} y={40} width={56} height={14} rx={6} fill="#F1EAD9" />
        </G>

        {/* plaque */}
        <Path
          d="M18 52h264a14 14 0 0 1 14 14v58a14 14 0 0 1-14 14h-40l-12 12-12-12H18a14 14 0 0 1-14-14V66a14 14 0 0 1 14-14z"
          fill="url(#signRed)"
        />
        <Path d="M18 52h264a14 14 0 0 1 14 14v6H4v-6a14 14 0 0 1 14-14z" fill="rgba(255,255,255,0.28)" />

        {/* cream band */}
        <Rect x={26} y={96} width={248} height={34} rx={11} fill={palette.cream} />
        <Rect x={26} y={96} width={248} height={11} rx={5} fill={palette.white} opacity={0.7} />

        {/* bolts */}
        <Circle cx={18} cy={68} r={5} fill="#7E93C4" />
        <Circle cx={282} cy={68} r={5} fill="#7E93C4" />
        <Circle cx={18} cy={120} r={5} fill="#7E93C4" />
        <Circle cx={282} cy={120} r={5} fill="#7E93C4" />
      </Svg>

      <View style={[styles.topWord, { top: 58 * s, height: 34 * s }]} pointerEvents="none">
        <Text variant="h1" center color={palette.white} style={{ fontSize: 30 * s, lineHeight: 34 * s }} outlined>
          {top}
        </Text>
      </View>
      <View style={[styles.topWord, { top: 99 * s, height: 30 * s }]} pointerEvents="none">
        <Text variant="h1" center color={palette.navy} style={{ fontSize: 26 * s, lineHeight: 30 * s }}>
          {bottom}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topWord: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
});
