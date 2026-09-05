import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { palette, springs } from '@/theme';
import { useBlinkState, usePulse, useReducedMotion } from '@/hooks';

const PigeonArt = memo(function PigeonArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.86} viewBox="0 0 30 26" pointerEvents="none">
      <Ellipse cx={15} cy={22} rx={8} ry={2.4} fill={palette.navy} opacity={0.15} />
      <Ellipse cx={15} cy={14} rx={9} ry={7} fill="#B7C3DE" />
      <Ellipse cx={19} cy={14} rx={6} ry={5} fill="#93A2C6" />
      <Circle cx={8} cy={9} r={5} fill="#C6D0E8" />
      <Circle cx={6.2} cy={8.2} r={1.2} fill={palette.navy} />
      <Path d="M 2.6 9.4 L 6 8.4 L 6 10.6 Z" fill={palette.safetyYellow} />
      <Path d="M 12 19 L 12 22 M 18 19 L 18 22" stroke={palette.orange} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
});

/** A rooftop pigeon that hops every few seconds. */
export function Pigeon({ size = 26, delay = 0 }: { size?: number; delay?: number }) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hop = () => {
      if (!alive) return;
      const dir = Math.random() > 0.5 ? 1 : -1;
      y.value = withSequence(withSpring(-size * 0.42, springs.pop), withSpring(0, springs.bounce));
      x.value = withSequence(withTiming(dir * size * 0.3, { duration: 240 }), withTiming(0, { duration: 900 }));
      timer = setTimeout(hop, 3200 + Math.random() * 4200);
    };
    timer = setTimeout(hop, delay + 900 + Math.random() * 2200);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [delay, reduced, size, x, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { translateX: x.value }] }));
  return (
    <Animated.View style={style} pointerEvents="none">
      <PigeonArt size={size} />
    </Animated.View>
  );
}

/** A cat dozing in the tower window — it blinks, because everything is alive. */
export function CatWindow({ size = 36 }: { size?: number }) {
  const closed = useBlinkState();
  const [peek, setPeek] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setPeek((p) => (p === 0 ? 1 : 0)), 5200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Circle cx={18} cy={18} r={17} fill="#3B4460" />
        <Circle cx={18} cy={18} r={14} fill={palette.waterCyanLight} />
        <Path d="M 6 22 Q 18 12 30 22 L 30 32 L 6 32 Z" fill="#2C3350" opacity={0.18} />
        {/* cat head */}
        <Path d={`M 9 ${28 - peek * 2} L 12 ${19 - peek * 2} L 16 ${24 - peek * 2} Z`} fill="#F2A65A" />
        <Path d={`M 27 ${28 - peek * 2} L 24 ${19 - peek * 2} L 20 ${24 - peek * 2} Z`} fill="#F2A65A" />
        <Ellipse cx={18} cy={28 - peek * 2} rx={9} ry={7.4} fill="#F7B970" />
        {closed ? (
          <>
            <Path d={`M 12 ${27 - peek * 2} q 2.4 2 4.8 0`} stroke={palette.navy} strokeWidth={1.6} fill="none" strokeLinecap="round" />
            <Path d={`M 19.2 ${27 - peek * 2} q 2.4 2 4.8 0`} stroke={palette.navy} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Circle cx={14.6} cy={27 - peek * 2} r={1.7} fill={palette.navy} />
            <Circle cx={21.4} cy={27 - peek * 2} r={1.7} fill={palette.navy} />
          </>
        )}
        <Path d={`M 18 ${29.6 - peek * 2} l -1.4 1.2 M 18 ${29.6 - peek * 2} l 1.4 1.2`} stroke="#C4763A" strokeWidth={1.2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Blinking amber lamp above a garage door. */
export function DoorLight({ w = 16, h = 7, phase = 0 }: { w?: number; h?: number; phase?: number }) {
  const pulse = usePulse(1500, 0.6);
  const style = useAnimatedStyle(() => {
    const p = (pulse.value + phase) % 1;
    return { opacity: 0.4 + p * 0.6, transform: [{ scaleX: 0.94 + p * 0.1 }] };
  });
  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: h / 2, backgroundColor: palette.safetyYellow }, styles.lamp, style]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  lamp: { shadowColor: palette.gold, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
});
