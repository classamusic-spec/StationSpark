import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { durations, idle, palette } from '@/theme';
import { useLoop, usePulse, useReducedMotion } from '@/hooks';
import { HIGHLIGHT, SHADE } from '../tone';

export type FlameState = 'burning' | 'dousing' | 'steaming' | 'out';

/** The flame is authored in this box — a teardrop standing on y ≈ 136. */
export const FLAME_VB = { w: 100, h: 140 } as const;

const TWO_PI = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* The drawing — one motif for every flame in the game                 */
/* ------------------------------------------------------------------ */

/* Reference: the Hose Hero frame. A chunky teardrop whose tip curls a
   little to the right, with two small licks off the sides; a fatter tongue
   inside it; a bright core. Three tones on the body (base → navy shade rim
   on the light-away side → white streak on the lit side), and no outline. */
const BODY = 'M52 6C50 22 34 40 24 60C14 80 12 100 22 118C30 132 44 136 52 136C60 136 74 132 80 116C90 98 86 76 74 58C64 42 54 24 52 6Z';
const LICK_LEFT = 'M30 96C22 90 8 76 12 52C16 66 26 74 36 80C32 86 30 90 30 96Z';
const LICK_RIGHT = 'M70 88C80 82 92 68 92 44C86 58 78 64 66 70C68 76 70 82 70 88Z';
const SHADE_RIM = 'M74 58C86 76 90 98 80 116C74 132 60 136 52 136C62 132 72 126 76 112C82 96 80 78 70 62Z';
const TONGUE = 'M50 44C48 58 34 72 30 90C26 108 36 126 52 126C68 126 76 108 72 90C68 72 52 58 50 44Z';
const CORE = 'M50 80C48 90 40 98 40 108C40 118 46 124 52 124C58 124 64 118 62 108C62 98 52 90 50 80Z';
const STREAK = 'M38 50C30 60 24 76 27 92C31 82 36 68 44 56Z';

export interface FlameArtProps {
  /** the pale, navy-tinted "not lit yet" flame used by counters */
  dim?: boolean;
  /** two tiny happy squint arcs on the core */
  friendly?: boolean;
}

/**
 * The flame layers as a bare `<G>` in the `FLAME_VB` box, so other props
 * (the campfire, the logo, counters) can compose the exact same flame.
 */
export function FlameArt({ dim, friendly }: FlameArtProps) {
  const outer = dim ? palette.lockedGrey : palette.flameOuter;
  const tongue = dim ? palette.slateLight : palette.flameMid;
  const core = dim ? palette.white : palette.flameCore;
  return (
    <G>
      <Path d={BODY} fill={outer} />
      <Path d={LICK_LEFT} fill={outer} />
      <Path d={LICK_RIGHT} fill={outer} />
      <Path d={SHADE_RIM} fill={SHADE} />
      <Path d={TONGUE} fill={tongue} />
      <Path d={CORE} fill={core} opacity={dim ? 0.85 : 1} />
      <Path d={STREAK} fill={HIGHLIGHT} />
      {friendly ? (
        <G>
          <Path d="M43 108q3-4.6 6 0" stroke={palette.navy} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M53 108q3-4.6 6 0" stroke={palette.navy} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      ) : null}
    </G>
  );
}

/**
 * A friendly stylised flame: three layered teardrops with a bright core.
 * Exported on its own so counting tiles and count strips can show a static one.
 * `size` is the width; the glyph is 1.4 × taller.
 */
export function FlameGlyph({ size, dim, friendly }: { size: number; dim?: boolean; friendly?: boolean }) {
  return (
    <Svg width={size} height={size * 1.4} viewBox={`0 0 ${FLAME_VB.w} ${FLAME_VB.h}`} fill="none">
      <FlameArt dim={dim} friendly={friendly} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Steam                                                               */
/* ------------------------------------------------------------------ */

const PUFFS = [
  { drift: -0.16, delay: 0 },
  { drift: 0.2, delay: 0.17 },
  { drift: -0.04, delay: 0.34 },
] as const;

/** One soft three-tone puff: smoke base, navy shade underneath, white crown. */
function Puff({ size }: { size: number }) {
  return (
    <Svg width={size * 0.66} height={size * 0.5} viewBox="0 0 66 50">
      <Ellipse cx={22} cy={31} rx={20} ry={15} fill={palette.smoke} />
      <Ellipse cx={45} cy={25} rx={17} ry={13} fill={palette.smoke} />
      <Ellipse cx={32} cy={17} rx={14} ry={12} fill={palette.smoke} />
      <Ellipse cx={26} cy={36} rx={15} ry={6} fill={SHADE} />
      <Ellipse cx={29} cy={13} rx={8} ry={4.6} fill={HIGHLIGHT} />
    </Svg>
  );
}

/** Three grey puffs drifting up — loops while a flame steams out. */
function SteamPuffs({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);

  useEffect(() => {
    const rise = reduced ? durations.slow * 2 : idle.bobPeriodMs * 0.7;
    const run = (v: typeof a, delay: number) => {
      v.value = 0;
      v.value = withDelay(
        delay * rise,
        withRepeat(withTiming(1, { duration: rise, easing: Easing.out(Easing.quad) }), reduced ? 1 : -1, false),
      );
    };
    run(a, PUFFS[0].delay);
    run(b, PUFFS[1].delay);
    run(c, PUFFS[2].delay);
    return () => {
      cancelAnimation(a);
      cancelAnimation(b);
      cancelAnimation(c);
    };
  }, [a, b, c, reduced]);

  const s1 = useAnimatedStyle(() => ({
    opacity: (1 - a.value) * 0.8,
    transform: [{ translateX: size * PUFFS[0].drift * a.value }, { translateY: -size * 1.15 * a.value }, { scale: 0.45 + a.value * 0.95 }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: (1 - b.value) * 0.8,
    transform: [{ translateX: size * PUFFS[1].drift * b.value }, { translateY: -size * 1.15 * b.value }, { scale: 0.45 + b.value * 0.95 }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: (1 - c.value) * 0.8,
    transform: [{ translateX: size * PUFFS[2].drift * c.value }, { translateY: -size * 1.15 * c.value }, { scale: 0.45 + c.value * 0.95 }],
  }));

  return (
    <View style={styles.steamWrap} pointerEvents="none">
      {[s1, s2, s3].map((st, i) => (
        <Animated.View key={i} style={[styles.puff, st]}>
          <Puff size={size} />
        </Animated.View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* The living flame                                                    */
/* ------------------------------------------------------------------ */

export interface FlameProps {
  size?: number;
  state?: FlameState;
  /** 0..1 how wet the flame is — shrinks it while the child holds the spray on it */
  wetness?: number;
  /** de-syncs the flicker between flames in the same building */
  phase?: number;
  /**
   * Two tiny happy squint arcs on the core. Off by default: a fire the child
   * is putting out must never look alive — reserve this for mascots/counters.
   */
  friendly?: boolean;
  /** alias for `state="steaming"` — grey puffs rise as the flame goes out */
  extinguishing?: boolean;
  /** the warm pool of light behind the flame (on by default) */
  glow?: boolean;
}

/**
 * A flame in a window. `burning` flickers forever (two layered squash/lean
 * loops on different periods, so no two flames breathe together), `dousing`
 * shrinks with the wetness, `steaming` puffs grey steam, `out` renders nothing.
 * Everything decorative stops under reduced motion.
 */
export function Flame({ size = 46, state = 'burning', wetness = 0, phase = 0, friendly = false, extinguishing = false, glow = true }: FlameProps) {
  const reduced = useReducedMotion();
  const resolved: FlameState = extinguishing && state !== 'out' ? 'steaming' : state;
  const H = size * 1.4;

  // Two loops on unrelated periods (derived from the flag-wave token) — their
  // beat pattern is what makes the flicker feel like fire rather than a metronome.
  const slow = useLoop(Math.round(idle.flagWavePeriodMs * (0.46 + (phase % 5) * 0.06)));
  const quick = useLoop(Math.round(idle.flagWavePeriodMs * (0.3 + (phase % 4) * 0.045)));
  const glowPulse = usePulse(idle.bobPeriodMs * 0.5, 0.6);
  const life = useSharedValue(resolved === 'out' ? 0 : 1);

  useEffect(() => {
    if (resolved === 'burning') life.value = withTiming(1, { duration: durations.base });
    else if (resolved === 'dousing') life.value = withTiming(1, { duration: durations.fast });
    else life.value = withTiming(0, { duration: reduced ? durations.fast : durations.slow, easing: Easing.in(Easing.quad) });
  }, [life, reduced, resolved]);

  const motion = reduced ? 0 : 1;
  const offA = phase * 0.37;
  const offB = phase * 0.61;
  const squash = idle.breatheScale * 3;

  const bodyStyle = useAnimatedStyle(() => {
    const a = Math.sin((slow.value + offA) * TWO_PI) * motion;
    const b = Math.sin((quick.value + offB) * TWO_PI) * motion;
    const shrink = 1 - Math.min(0.72, wetness * 0.72);
    const l = life.value;
    return {
      opacity: l,
      transform: [
        { translateY: (1 - l) * size * 0.35 },
        { scaleX: l * shrink * (1 + a * squash + b * squash * 0.4) },
        { scaleY: l * shrink * (1 - a * squash * 0.9 + b * squash * 0.5) },
      ],
    };
  });

  const leanStyle = useAnimatedStyle(() => {
    const a = Math.sin((slow.value + offA) * TWO_PI) * motion;
    const b = Math.sin((quick.value + offB) * TWO_PI) * motion;
    return { transform: [{ skewX: `${b * 4 + a * 1.5}deg` }, { rotate: `${a * 2}deg` }] };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: life.value * (0.7 + glowPulse.value * 0.3) * (1 - Math.min(1, wetness) * 0.5),
    transform: [{ scale: 0.94 + glowPulse.value * 0.1 }],
  }));

  if (resolved === 'out') return null;

  const gW = size * 2.1;
  const gH = H * 1.25;

  return (
    <View style={[styles.wrap, { width: size, height: H }]} pointerEvents="none">
      {glow ? (
        <Animated.View style={[styles.glow, { width: gW, height: gH, left: (size - gW) / 2, bottom: -H * 0.1 }, glowStyle]}>
          {/* stacked ellipses, not a gradient — a soft pool of warm light */}
          <Svg width={gW} height={gH} viewBox="0 0 210 175">
            <Ellipse cx={105} cy={104} rx={100} ry={68} fill={palette.flameMid} opacity={0.1} />
            <Ellipse cx={105} cy={108} rx={74} ry={52} fill={palette.flameMid} opacity={0.12} />
            <Ellipse cx={105} cy={112} rx={48} ry={36} fill={palette.flameCore} opacity={0.16} />
          </Svg>
        </Animated.View>
      ) : null}
      {resolved === 'steaming' ? <SteamPuffs size={size} /> : null}
      <Animated.View style={[styles.flame, bodyStyle]}>
        <Animated.View style={[styles.flame, leanStyle]}>
          <FlameGlyph size={size} friendly={friendly} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  flame: { transformOrigin: 'bottom' },
  glow: { position: 'absolute', transformOrigin: 'bottom' },
  steamWrap: { position: 'absolute', bottom: 0, alignItems: 'center', justifyContent: 'flex-end' },
  puff: { position: 'absolute', bottom: 0 },
});
