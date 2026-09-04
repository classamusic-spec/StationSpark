import React, { useEffect } from 'react';
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
import Svg, { Ellipse, Path } from 'react-native-svg';
import { palette } from '@/theme';
import { useReducedMotion } from '@/hooks';

export type FlameState = 'burning' | 'dousing' | 'steaming' | 'out';

/**
 * A friendly stylised flame: three layered teardrops with a warm smiling core.
 * Exported on its own so counting tiles and count strips can show a static one.
 */
export function FlameGlyph({ size, dim }: { size: number; dim?: boolean }) {
  // viewBox 0..100 wide, 0..140 tall — a teardrop standing on its base.
  return (
    <Svg width={size} height={size * 1.4} viewBox="0 0 100 140" fill="none">
      <Path
        d="M50 4C50 4 20 42 20 78c0 30 15 58 30 58s30-28 30-58C80 42 50 4 50 4z"
        fill={dim ? '#C6CFE2' : palette.flameOuter}
      />
      <Path
        d="M50 34C50 34 31 60 31 86c0 22 10 42 19 42s19-20 19-42C69 60 50 34 50 34z"
        fill={dim ? '#DCE3F0' : palette.flameMid}
      />
      <Path d="M50 68c0 0-10 15-10 29 0 12 5 22 10 22s10-10 10-22c0-14-10-29-10-29z" fill={dim ? '#EDF1F8' : palette.flameCore} />
      <Ellipse cx={36} cy={62} rx={7} ry={11} fill="#FFFFFF" opacity={0.28} />
    </Svg>
  );
}

const FlameShape = ({ size }: { size: number }) => <FlameGlyph size={size} />;

/** Three grey puffs drifting up — plays once when a flame goes out. */
function SteamPuffs({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);

  useEffect(() => {
    const run = (v: typeof a, delay: number) => {
      v.value = 0;
      v.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: reduced ? 900 : 1500, easing: Easing.out(Easing.quad) }), reduced ? 1 : -1, false),
      );
    };
    run(a, 0);
    run(b, 260);
    run(c, 520);
    return () => {
      cancelAnimation(a);
      cancelAnimation(b);
      cancelAnimation(c);
    };
  }, [a, b, c, reduced]);

  const s1 = useAnimatedStyle(() => ({
    opacity: (1 - a.value) * 0.75,
    transform: [{ translateX: -size * 0.16 * a.value }, { translateY: -size * 1.15 * a.value }, { scale: 0.5 + a.value * 0.9 }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: (1 - b.value) * 0.75,
    transform: [{ translateX: size * 0.2 * b.value }, { translateY: -size * 1.15 * b.value }, { scale: 0.5 + b.value * 0.9 }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: (1 - c.value) * 0.75,
    transform: [{ translateX: -size * 0.05 * c.value }, { translateY: -size * 1.15 * c.value }, { scale: 0.5 + c.value * 0.9 }],
  }));

  return (
    <View style={styles.steamWrap} pointerEvents="none">
      {[s1, s2, s3].map((st, i) => (
        <Animated.View key={i} style={[styles.puff, st]}>
          <Svg width={size * 0.62} height={size * 0.5} viewBox="0 0 62 50">
            <Ellipse cx={22} cy={30} rx={20} ry={16} fill={palette.smoke} />
            <Ellipse cx={42} cy={22} rx={16} ry={13} fill={palette.smoke} />
            <Ellipse cx={31} cy={16} rx={13} ry={11} fill="#D6DCEC" />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

export interface FlameProps {
  size?: number;
  state?: FlameState;
  /** 0..1 how wet the flame is — shrinks it while the child holds the spray on it */
  wetness?: number;
  /** de-syncs the flicker between flames in the same building */
  phase?: number;
}

/**
 * A flame in a window. `burning` flickers forever, `dousing` shrinks with the
 * wetness, `steaming` puffs grey steam, `out` renders nothing.
 */
export function Flame({ size = 46, state = 'burning', wetness = 0, phase = 0 }: FlameProps) {
  const reduced = useReducedMotion();
  const flicker = useSharedValue(0);
  const life = useSharedValue(state === 'out' ? 0 : 1);

  useEffect(() => {
    if (reduced) {
      flicker.value = 0;
      return;
    }
    const period = 520 + phase * 190;
    flicker.value = withDelay(
      phase * 130,
      withRepeat(
        withSequence(
          withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: period * 0.92, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(flicker);
  }, [flicker, phase, reduced]);

  useEffect(() => {
    if (state === 'burning') life.value = withTiming(1, { duration: 200 });
    else if (state === 'dousing') life.value = withTiming(1, { duration: 120 });
    else life.value = withTiming(0, { duration: reduced ? 120 : 320, easing: Easing.in(Easing.quad) });
  }, [life, reduced, state]);

  const style = useAnimatedStyle(() => {
    const f = flicker.value;
    const shrink = 1 - Math.min(0.72, wetness * 0.72);
    return {
      opacity: life.value,
      transform: [
        { translateY: (1 - life.value) * size * 0.35 - f * size * 0.05 },
        { scaleX: life.value * shrink * (0.93 + f * 0.12) },
        { scaleY: life.value * shrink * (1.06 - f * 0.13) },
        { rotate: `${(f - 0.5) * 6}deg` },
      ],
    };
  });

  if (state === 'out') return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {state === 'steaming' ? <SteamPuffs size={size} /> : null}
      <Animated.View style={[styles.flame, style]}>
        <FlameShape size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  flame: { transformOrigin: 'bottom' },
  steamWrap: { position: 'absolute', bottom: 0, alignItems: 'center', justifyContent: 'flex-end' },
  puff: { position: 'absolute', bottom: 0 },
});
