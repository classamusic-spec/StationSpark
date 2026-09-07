import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
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

        {/* plaque — critique #20: the orphan speech-bubble tail that pointed at
            nothing is gone; this is a bolted enamel sign, not a bubble. */}
        <Path
          d="M18 52h264a14 14 0 0 1 14 14v58a14 14 0 0 1-14 14H18a14 14 0 0 1-14-14V66a14 14 0 0 1 14-14z"
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

        {/* CHEF HAT — cotton, not a cloud. Five flat white shapes read as a
            puff of steam over the sign; each puff now takes the light on its
            top-left and falls to a cream shade underneath, the pleats between
            them are drawn, the band has a lit lip, and the whole hat sits ON
            the plaque with a shadow to prove it. */}
        <Ellipse cx={150} cy={55} rx={33} ry={6} fill="rgba(31,42,90,0.2)" />
        <G>
          <Circle cx={129} cy={28} r={19} fill="#E4DBC7" />
          <Circle cx={151} cy={19} r={17} fill="#E4DBC7" />
          <Circle cx={173} cy={28} r={19} fill="#E4DBC7" />
          <Circle cx={128} cy={26} r={19} fill={palette.white} />
          <Circle cx={150} cy={17} r={17} fill={palette.white} />
          <Circle cx={172} cy={26} r={19} fill={palette.white} />
          <Rect x={124} y={26} width={52} height={22} rx={7} fill={palette.white} />
          {/* the pleats where two puffs meet, and the shade under the crown */}
          <Path d="M139 13a20 20 0 0 0 0 27" stroke="#EDE5D4" strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Path d="M161 13a20 20 0 0 1 0 27" stroke="#EDE5D4" strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Rect x={124} y={37} width={52} height={11} fill="#F1EAD9" />
          {/* one light direction: the top-left puff is the brightest thing here */}
          <Path d="M112 30a19 19 0 0 1 13 -17c-6 5 -10 11 -10 18z" fill="rgba(255,255,255,0.95)" />
          <Circle cx={143} cy={11} r={4.4} fill="rgba(255,255,255,0.95)" />
          <Path d="M186 22a19 19 0 0 1 3 12 19 19 0 0 1 -6 11c4 -7 5 -15 3 -23z" fill="rgba(31,42,90,0.07)" />
          {/* band */}
          <Rect x={122} y={40} width={56} height={14} rx={6} fill="#DED4BC" />
          <Rect x={122} y={39} width={56} height={11} rx={5.5} fill="#F8F2E4" />
          <Rect x={127} y={41} width={22} height={3} rx={1.5} fill="rgba(255,255,255,0.95)" />
        </G>
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
