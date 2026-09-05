import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import type { AnimalId } from '@/learning/types';
import { idle, palette } from '@/theme';
import { useReducedMotion } from '@/hooks';

export type AnimalMood = 'help' | 'happy' | 'safe';

export const animalName: Record<
  AnimalId,
  { en: string; es: string; plural: string; pluralEs: string; sound: 'meow' | 'dog-bark' | 'pop' }
> = {
  kitten: { en: 'kitten', es: 'gatito', plural: 'kittens', pluralEs: 'gatitos', sound: 'meow' },
  puppy: { en: 'puppy', es: 'perrito', plural: 'puppies', pluralEs: 'perritos', sound: 'dog-bark' },
  bunny: { en: 'bunny', es: 'conejito', plural: 'bunnies', pluralEs: 'conejitos', sound: 'pop' },
  duckling: { en: 'duckling', es: 'patito', plural: 'ducklings', pluralEs: 'patitos', sound: 'pop' },
  turtle: { en: 'turtle', es: 'tortuga', plural: 'turtles', pluralEs: 'tortugas', sound: 'pop' },
};

/** Random blink as plain state — cheap (one flip every few seconds) and works everywhere. */
function useBlinkFlag(enabled: boolean): boolean {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let shut: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          setClosed(true);
          shut = setTimeout(() => {
            if (!alive) return;
            setClosed(false);
            schedule();
          }, 130);
        },
        idle.blinkMinMs + Math.random() * (idle.blinkMaxMs - idle.blinkMinMs),
      );
    };
    schedule();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      if (shut) clearTimeout(shut);
    };
  }, [enabled]);
  return enabled && closed;
}

function Eyes({ closed, cx1, cx2, cy, r }: { closed: boolean; cx1: number; cx2: number; cy: number; r: number }) {
  if (closed) {
    return (
      <G>
        <Path d={`M${cx1 - r} ${cy} q${r} ${r * 1.1} ${r * 2} 0`} stroke={palette.navy} strokeWidth={r * 0.62} strokeLinecap="round" fill="none" />
        <Path d={`M${cx2 - r} ${cy} q${r} ${r * 1.1} ${r * 2} 0`} stroke={palette.navy} strokeWidth={r * 0.62} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={cx1} cy={cy} r={r} fill={palette.navy} />
      <Circle cx={cx2} cy={cy} r={r} fill={palette.navy} />
      <Circle cx={cx1 + r * 0.36} cy={cy - r * 0.36} r={r * 0.34} fill={palette.white} />
      <Circle cx={cx2 + r * 0.36} cy={cy - r * 0.36} r={r * 0.34} fill={palette.white} />
    </G>
  );
}

const Cheeks = ({ cx1, cx2, cy, r }: { cx1: number; cx2: number; cy: number; r: number }) => (
  <G>
    <Ellipse cx={cx1} cy={cy} rx={r} ry={r * 0.72} fill={palette.pink} opacity={0.55} />
    <Ellipse cx={cx2} cy={cy} rx={r} ry={r * 0.72} fill={palette.pink} opacity={0.55} />
  </G>
);

const Mouth = ({ cx, cy, w, mood }: { cx: number; cy: number; w: number; mood: AnimalMood }) =>
  mood === 'help' ? (
    <Ellipse cx={cx} cy={cy + w * 0.1} rx={w * 0.34} ry={w * 0.3} fill="#B9261C" opacity={0.85} />
  ) : (
    <Path
      d={`M${cx - w * 0.5} ${cy} q${w * 0.25} ${w * 0.45} ${w * 0.5} 0 q${w * 0.25} ${w * 0.45} ${w * 0.5} 0`}
      stroke={palette.navy}
      strokeWidth={w * 0.16}
      strokeLinecap="round"
      fill="none"
    />
  );

/* ------------------------------------------------------------------ */
/* Rigs — all drawn in a 100 × 100 viewBox, standing on y ≈ 96          */
/* ------------------------------------------------------------------ */

function Kitten({ blink, mood }: { blink: boolean; mood: AnimalMood }) {
  const coat = '#F5A94E';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ellipse cx={50} cy={95} rx={26} ry={4} fill={palette.navy} opacity={0.12} />
      <Path d="M78 84c10-4 12-16 6-22-4-4-9 0-7 5 2 6-3 10-7 11z" fill={coat} />
      <Ellipse cx={50} cy={72} rx={25} ry={20} fill={coat} />
      <Ellipse cx={50} cy={78} rx={16} ry={12} fill={palette.white} />
      <Path d="M27 44l-3-17 16 9z" fill={coat} />
      <Path d="M73 44l3-17-16 9z" fill={coat} />
      <Path d="M29 42l-1.6-9 8 5z" fill={palette.pinkSoft} />
      <Path d="M71 42l1.6-9-8 5z" fill={palette.pinkSoft} />
      <Circle cx={50} cy={44} r={25} fill={coat} />
      <Ellipse cx={50} cy={52} rx={16} ry={12} fill={palette.white} />
      <Eyes closed={blink} cx1={41} cx2={59} cy={42} r={5} />
      <Cheeks cx1={33} cx2={67} cy={52} r={5.4} />
      <Path d="M50 50l-3.6 3h7.2z" fill="#E1568F" />
      <Mouth cx={50} cy={56} w={12} mood={mood} />
      <Path d="M22 50h-12M22 55h-12M78 50h12M78 55h12" stroke={palette.white} strokeWidth={2} strokeLinecap="round" opacity={0.9} />
    </Svg>
  );
}

function Puppy({ blink, mood }: { blink: boolean; mood: AnimalMood }) {
  const coat = '#F0E4D2';
  const spot = '#8C6239';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ellipse cx={50} cy={95} rx={26} ry={4} fill={palette.navy} opacity={0.12} />
      <Path d="M76 84c9-2 13-12 9-18-3-5-9-1-7 4 2 5-2 9-6 9z" fill={coat} />
      <Ellipse cx={50} cy={73} rx={25} ry={20} fill={coat} />
      <Ellipse cx={50} cy={79} rx={15} ry={11} fill={palette.white} />
      <Ellipse cx={24} cy={46} rx={9} ry={16} fill={spot} />
      <Ellipse cx={76} cy={46} rx={9} ry={16} fill={spot} />
      <Circle cx={50} cy={44} r={25} fill={coat} />
      <Ellipse cx={64} cy={31} rx={9} ry={7.5} fill={spot} opacity={0.8} />
      <Ellipse cx={50} cy={55} rx={15} ry={11} fill={palette.white} />
      <Eyes closed={blink} cx1={41} cx2={59} cy={41} r={5.2} />
      <Cheeks cx1={33} cx2={67} cy={51} r={5.2} />
      <Ellipse cx={50} cy={52} rx={5} ry={4} fill={palette.navy} />
      <Mouth cx={50} cy={59} w={12} mood={mood} />
      {mood !== 'help' ? <Path d="M50 62q4 6 8 2" stroke="#E1568F" strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
    </Svg>
  );
}

function Bunny({ blink, mood }: { blink: boolean; mood: AnimalMood }) {
  const coat = '#F3F1F8';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ellipse cx={50} cy={95} rx={24} ry={4} fill={palette.navy} opacity={0.12} />
      <Ellipse cx={38} cy={22} rx={7.5} ry={19} fill={coat} />
      <Ellipse cx={62} cy={22} rx={7.5} ry={19} fill={coat} />
      <Ellipse cx={38} cy={23} rx={4} ry={13} fill={palette.pinkSoft} />
      <Ellipse cx={62} cy={23} rx={4} ry={13} fill={palette.pinkSoft} />
      <Circle cx={78} cy={72} r={9} fill={palette.white} />
      <Ellipse cx={50} cy={74} rx={24} ry={19} fill={coat} />
      <Circle cx={50} cy={49} r={24} fill={coat} />
      <Eyes closed={blink} cx1={41} cx2={59} cy={47} r={5} />
      <Cheeks cx1={33} cx2={67} cy={56} r={5.2} />
      <Path d="M50 55l-3.4 3h6.8z" fill="#E1568F" />
      <Mouth cx={50} cy={61} w={11} mood={mood} />
      <Path d="M44 66h12" stroke={palette.white} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

function Duckling({ blink, mood }: { blink: boolean; mood: AnimalMood }) {
  const coat = palette.safetyYellow;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ellipse cx={50} cy={95} rx={22} ry={4} fill={palette.navy} opacity={0.12} />
      <Path d="M36 92l-8 4h16zM64 92l8 4H56z" fill={palette.orange} />
      <Ellipse cx={50} cy={70} rx={26} ry={22} fill={coat} />
      <Ellipse cx={26} cy={68} rx={9} ry={13} fill="#F5B71F" />
      <Circle cx={50} cy={40} r={23} fill={coat} />
      <Path d="M45 22c2-6 8-6 10 0-3-2-7-2-10 0z" fill="#F5B71F" />
      <Eyes closed={blink} cx1={42} cx2={58} cy={37} r={4.8} />
      <Cheeks cx1={34} cx2={66} cy={46} r={5} />
      <Path d="M42 49h16a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5z" fill={palette.orange} />
      {mood === 'help' ? <Ellipse cx={50} cy={53} rx={3.6} ry={3} fill="#C4560F" /> : null}
    </Svg>
  );
}

function Turtle({ blink, mood }: { blink: boolean; mood: AnimalMood }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ellipse cx={50} cy={95} rx={28} ry={4} fill={palette.navy} opacity={0.12} />
      <Ellipse cx={22} cy={82} rx={9} ry={7} fill="#8FD16B" />
      <Ellipse cx={78} cy={82} rx={9} ry={7} fill="#8FD16B" />
      <Path d="M84 66c8 2 10 8 6 12-3 3-8 0-7-4z" fill="#8FD16B" />
      <Ellipse cx={50} cy={62} rx={34} ry={26} fill="#4CAF50" />
      <Ellipse cx={50} cy={60} rx={26} ry={19} fill="#3B8E3F" />
      <Circle cx={50} cy={58} r={8} fill="#8FD16B" />
      <Circle cx={32} cy={60} r={6} fill="#8FD16B" />
      <Circle cx={68} cy={60} r={6} fill="#8FD16B" />
      <Circle cx={50} cy={44} r={6} fill="#8FD16B" />
      <Circle cx={24} cy={38} r={19} fill="#8FD16B" />
      <Eyes closed={blink} cx1={18} cx2={31} cy={35} r={4.2} />
      <Cheeks cx1={12} cx2={36} cy={43} r={4.2} />
      <Mouth cx={24} cy={46} w={9} mood={mood} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */

export interface AnimalProps {
  id: AnimalId;
  size?: number;
  mood?: AnimalMood;
  /** idle sway + blink (default true) */
  animate?: boolean;
  /** de-syncs a row of animals */
  phase?: number;
}

/** A cute rescue animal. `mood="help"` adds the little "help!" sway. */
export function Animal({ id, size = 72, mood = 'happy', animate = true, phase = 0 }: AnimalProps) {
  const reduced = useReducedMotion();
  const on = animate && !reduced;
  const blink = useBlinkFlag(on);
  const sway = useSharedValue(0);

  useEffect(() => {
    if (!on) {
      sway.value = 0;
      return;
    }
    const period = mood === 'help' ? 620 : 1400;
    sway.value = withDelay(
      phase * 170,
      withRepeat(
        withSequence(
          withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: period, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(sway);
  }, [mood, on, phase, sway]);

  const style = useAnimatedStyle(() => {
    const amp = mood === 'help' ? 5 : 2.2;
    return {
      transform: [{ translateY: -Math.abs(sway.value) * (mood === 'help' ? 2.5 : 1.6) }, { rotate: `${sway.value * amp}deg` }],
    };
  });

  const rig =
    id === 'kitten' ? (
      <Kitten blink={blink} mood={mood} />
    ) : id === 'puppy' ? (
      <Puppy blink={blink} mood={mood} />
    ) : id === 'bunny' ? (
      <Bunny blink={blink} mood={mood} />
    ) : id === 'duckling' ? (
      <Duckling blink={blink} mood={mood} />
    ) : (
      <Turtle blink={blink} mood={mood} />
    );

  return (
    <Animated.View style={[{ width: size, height: size }, styles.rig, style]} pointerEvents="none">
      {rig}
    </Animated.View>
  );
}

/** The woven rescue basket Rookie holds out. */
export function RescueBasket({ width, height, full }: { width: number; height: number; full?: boolean }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90">
      <Path d="M14 26h92l-9 56a8 8 0 0 1-8 7H31a8 8 0 0 1-8-7z" fill={palette.wood} />
      <Path d="M14 26h92l-2 12H16z" fill="#D9A05F" />
      <Path d="M26 44h68M29 58h62M32 72h56" stroke="#E0B07A" strokeWidth={5} strokeLinecap="round" />
      <Path d="M30 26a30 30 0 0 1 60 0" stroke={palette.woodDark} strokeWidth={8} fill="none" strokeLinecap="round" />
      {full ? <Ellipse cx={60} cy={40} rx={38} ry={9} fill={palette.mint} opacity={0.75} /> : null}
      <Rect x={14} y={22} width={92} height={9} rx={4.5} fill={palette.woodDark} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  rig: { alignItems: 'center', justifyContent: 'flex-end' },
});

/** A leafy tree / ledge the animals get stuck on. */
export function RescueTree({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height }} pointerEvents="none">
      {/* critique: not three circles on a stick — a dark back mass, a lit front
          mass with a lobed silhouette, branch forks and a bark highlight. */}
      <Svg width={width} height={height} viewBox="0 0 240 260">
        <Ellipse cx={120} cy={254} rx={62} ry={13} fill={palette.navy} opacity={0.12} />
        <Path d="M104 260 q -4 -80 8 -120 h 16 q 12 40 8 120 z" fill={palette.woodDark} />
        <Path d="M108 260 q -3 -78 7 -118 h 6 q -6 42 -3 118 z" fill="rgba(255,255,255,0.32)" />
        <Path d="M120 152 q -30 -6 -56 -30" stroke={palette.woodDark} strokeWidth={17} strokeLinecap="round" fill="none" />
        <Path d="M120 172 q 34 -4 62 -26" stroke={palette.woodDark} strokeWidth={15} strokeLinecap="round" fill="none" />
        {/* back canopy mass */}
        <Path
          d="M120 8 q -46 0 -58 34 q -40 6 -34 44 q -22 22 4 46 q 12 26 46 20 q 22 22 44 4 q 26 16 46 -8 q 34 -2 32 -34 q 18 -26 -8 -46 q -2 -36 -38 -40 q -14 -22 -34 -20 z"
          fill="#2F7F45"
        />
        {/* lit front mass */}
        <Path
          d="M120 24 q -38 0 -48 28 q -32 6 -26 36 q -18 18 4 38 q 10 20 38 16 q 18 18 36 2 q 22 12 38 -8 q 28 -2 26 -28 q 14 -22 -8 -38 q -2 -28 -32 -32 q -12 -18 -28 -14 z"
          fill="#4CAF50"
        />
        <Path
          d="M120 30 q -30 0 -40 22 q 12 -10 34 -12 q 22 -4 44 8 q -10 -18 -38 -18 z"
          fill="rgba(255,255,255,0.32)"
        />
        <Path d="M66 84 q 14 -14 34 -16 q -22 10 -30 26 z" fill="#8FD16B" opacity={0.85} />
        <Path d="M158 118 q 18 -6 26 -22 q -4 24 -24 30 z" fill="#2F7F45" />
      </Svg>
    </View>
  );
}
