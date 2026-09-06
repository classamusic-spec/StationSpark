import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Emotion } from '@/content/types';
import { springs, timings } from '@/theme';
import { useReducedMotion } from '@/hooks';
import type { CharacterAct } from '../machine/characterMachine';
import type { ArtPart, RigChannel, RigLayer, RigSpec, ToneMap } from './types';

type Style = StyleProp<AnimatedStyle<ViewStyle>>;

export interface CharacterRigProps<N extends string> {
  spec: RigSpec<N>;
  /** total height in px; width follows the artwork's aspect ratio */
  size: number;
  act: CharacterAct;
  mood: Emotion;
  /** false freezes the rig in its rest pose (lists, thumbnails, screenshots) */
  animate?: boolean;
  /** re-tint skin / hair / helmet; omit for the authored colours */
  tones?: ToneMap;
  /** offsets the idle clock so a line-up never breathes in lockstep (0–1) */
  bobPhase?: number;
  /** one flat, non-animated <Svg>: for crowds, map pins and tiny thumbnails */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/* ------------------------------------------------------------------ *
 * Mood → resting face. Small numbers: the art is already expressive, so
 * the rig only leans it. viewBox units and degrees.
 * ------------------------------------------------------------------ */
interface MoodPose {
  brow: number;
  browTilt: number;
  mouth: number;
  headTilt: number;
  chin: number;
}

const MOODS: Record<Emotion, MoodPose> = {
  happy: { brow: 0, browTilt: 0, mouth: 1, headTilt: 0, chin: 0 },
  excited: { brow: -1.1, browTilt: 0, mouth: 1.18, headTilt: -1.5, chin: -0.6 },
  proud: { brow: -0.7, browTilt: 0, mouth: 1.06, headTilt: 0, chin: -0.9 },
  calm: { brow: 0.3, browTilt: 0, mouth: 0.78, headTilt: 0, chin: 0.2 },
  think: { brow: -0.5, browTilt: 7, mouth: 0.64, headTilt: -6, chin: 0.4 },
  worried: { brow: 0.9, browTilt: -9, mouth: 0.7, headTilt: 3.5, chin: 0.8 },
  surprised: { brow: -1.6, browTilt: 0, mouth: 1.3, headTilt: 0, chin: -0.4 },
};

/** Every act-driven signal the channel hooks read. */
interface Drive {
  clock: SharedValue<number>;
  blink: SharedValue<number>;
  flap: SharedValue<number>;
  talk: SharedValue<number>;
  wave: SharedValue<number>;
  cheer: SharedValue<number>;
  point: SharedValue<number>;
  think: SharedValue<number>;
  glance: SharedValue<number>;
  shift: SharedValue<number>;
  hatTug: SharedValue<number>;
}

/* ------------------------------------------------------------------ *
 * Blink — a shared value, so a blinking face never re-renders React.
 * ------------------------------------------------------------------ */
function useBlink(active: boolean): SharedValue<number> {
  const blink = useSharedValue(0);
  useEffect(() => {
    if (!active) {
      cancelAnimation(blink);
      blink.value = 0;
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          /* A double blink now and then — it is what real eyes do. */
          const twice = Math.random() < 0.22;
          blink.value = twice
            ? withSequence(
                withTiming(1, { duration: 60 }),
                withTiming(0, { duration: 80 }),
                withDelay(110, withTiming(1, { duration: 60 })),
                withTiming(0, { duration: 80 }),
              )
            : withSequence(withTiming(1, { duration: 65 }), withTiming(0, { duration: 95 }));
          schedule();
        },
        2400 + Math.random() * 3200,
      );
    };
    schedule();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      cancelAnimation(blink);
    };
  }, [active, blink]);
  return blink;
}

/** A rising ramp we take a sine of; owning it lets each character carry a phase. */
function useIdleClock(active: boolean, periodMs: number, phase: number): SharedValue<number> {
  const v = useSharedValue(phase);
  useEffect(() => {
    if (!active) {
      cancelAnimation(v);
      v.value = phase;
      return;
    }
    v.value = phase;
    v.value = withRepeat(withTiming(phase + 1, { duration: periodMs, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(v);
  }, [active, periodMs, phase, v]);
  return v;
}

/* ------------------------------------------------------------------ *
 * Channels. One hook per moving thing; each is called an even number of
 * times per render, in a fixed order.
 * ------------------------------------------------------------------ */

function useRootStyle(d: Drive, size: number): Style {
  return useAnimatedStyle(() => ({
    transform: [{ translateY: -d.cheer.value * size * 0.055 }, { scaleY: 1 + d.cheer.value * 0.018 }],
  }));
}

function useTorsoStyle(d: Drive): Style {
  return useAnimatedStyle(() => {
    const breath = Math.sin(d.clock.value * Math.PI * 2);
    return {
      transform: [
        { scaleY: 1 + breath * 0.008 + d.cheer.value * 0.012 },
        { rotate: `${d.shift.value * 1.6 + d.point.value * -1.2}deg` },
      ],
    };
  });
}

function useHeadStyle(d: Drive, m: MoodPose, unit: number): Style {
  return useAnimatedStyle(() => {
    const breath = Math.sin(d.clock.value * Math.PI * 2);
    return {
      transform: [
        { translateY: (breath * -0.55 + m.chin + d.cheer.value * -1.1) * unit },
        {
          rotate: `${breath * 1.1 + m.headTilt + d.think.value * -4 + d.shift.value * -1.8 + d.glance.value * 1.4}deg`,
        },
      ],
    };
  });
}

/** The hat lags the head by a beat — the secondary motion that sells weight. */
function useHatStyle(d: Drive, unit: number): Style {
  return useAnimatedStyle(() => {
    const breath = Math.sin((d.clock.value - 0.12) * Math.PI * 2);
    return {
      transform: [
        { translateY: (d.hatTug.value * -1.4 + d.cheer.value * -0.9) * unit },
        { rotate: `${breath * -1.4 + d.hatTug.value * -5 + d.cheer.value * 2.5}deg` },
      ],
    };
  });
}

function useEyeStyle(d: Drive, unit: number, side: -1 | 1): Style {
  return useAnimatedStyle(() => ({
    transform: [
      { translateX: d.glance.value * 0.85 * unit },
      { translateY: d.think.value * -0.35 * unit },
      { scaleY: 1 - d.blink.value * 0.92 },
      { scaleX: 1 + d.cheer.value * 0.04 * side },
    ],
  }));
}

function useMouthStyle(d: Drive, m: MoodPose): Style {
  return useAnimatedStyle(() => ({
    transform: [
      { scaleY: m.mouth * (1 + d.flap.value * 0.55 + d.cheer.value * 0.3) },
      { scaleX: m.mouth * (1 - d.flap.value * 0.12 + d.cheer.value * 0.08) },
    ],
  }));
}

function useBrowStyle(d: Drive, m: MoodPose, unit: number, side: -1 | 1): Style {
  return useAnimatedStyle(() => ({
    transform: [
      { translateY: (m.brow - d.blink.value * 0.35 - d.cheer.value * 0.9 + d.think.value * -0.4) * unit },
      { rotate: `${m.browTilt * side + d.think.value * 4 * side}deg` },
    ],
  }));
}

/**
 * Arms. The waving side lifts and swings; the other keeps a small
 * counter-swing so the pose never looks pinned.
 */
function useArmStyle(d: Drive, side: -1 | 1): Style {
  return useAnimatedStyle(() => {
    const breath = Math.sin(d.clock.value * Math.PI * 2);
    const waving = side === 1 ? d.wave.value : d.wave.value * -0.18;
    const pointing = side === 1 ? d.point.value : 0;
    const thinking = side === 1 ? d.think.value : 0;
    return {
      transform: [
        {
          rotate: `${side * (breath * 0.8 + d.cheer.value * -26 + waving * 16 - pointing * 34 - thinking * 8)}deg`,
        },
      ],
    };
  });
}

/* ------------------------------------------------------------------ *
 * Rig
 * ------------------------------------------------------------------ */

export function CharacterRig<N extends string>({
  spec,
  size,
  act,
  mood,
  animate = true,
  tones,
  bobPhase = 0,
  flat = false,
  style,
  testID,
}: CharacterRigProps<N>) {
  const reduced = useReducedMotion();
  const live = animate && !reduced && !flat;

  const unit = size / spec.viewBox.h;
  const width = spec.viewBox.w * unit;
  const byName = useMemo(() => {
    const map = new Map<string, ArtPart<N>>();
    for (const part of spec.parts) map.set(part.name, part);
    return map;
  }, [spec.parts]);

  const d: Drive = {
    clock: useIdleClock(live, 2600, bobPhase),
    blink: useBlink(live),
    flap: useSharedValue(0),
    talk: useSharedValue(0),
    wave: useSharedValue(0),
    cheer: useSharedValue(0),
    point: useSharedValue(0),
    think: useSharedValue(0),
    glance: useSharedValue(0),
    shift: useSharedValue(0),
    hatTug: useSharedValue(0),
  };
  const { flap, talk, wave, cheer, point, think, glance, shift, hatTug } = d;

  useEffect(() => {
    const to = (v: SharedValue<number>, target: number) => {
      v.value = withSpring(target, springs.gentle);
    };
    to(talk, act === 'talk' ? 1 : 0);
    to(point, act === 'point' ? 1 : 0);
    to(think, act === 'think' ? 1 : 0);
    to(shift, act === 'shift' ? 1 : 0);
    to(glance, act === 'glance' ? 1 : 0);
    to(hatTug, act === 'adjustHat' ? 1 : 0);

    if (!live) {
      wave.value = 0;
      cheer.value = 0;
      return;
    }
    if (act === 'wave') {
      /* Three unhurried waves, then back to rest — not a metronome. */
      wave.value = withRepeat(
        withSequence(withTiming(1, { duration: 260 }), withTiming(-1, { duration: 260 })),
        6,
        true,
      );
    } else {
      wave.value = withTiming(0, timings.fast);
    }
    if (act === 'cheer') {
      cheer.value = withRepeat(withSequence(withSpring(1, springs.bounce), withSpring(0, springs.pop)), -1, false);
    } else {
      cheer.value = withTiming(0, timings.base);
    }
  }, [act, cheer, glance, hatTug, live, point, shift, talk, think, wave]);

  /* The mouth flap rides its own fast loop while a line is being read out. */
  useEffect(() => {
    if (!live || act !== 'talk') {
      cancelAnimation(flap);
      flap.value = withTiming(0, timings.fast);
      return;
    }
    flap.value = withRepeat(withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(flap);
  }, [act, flap, live]);

  const m = MOODS[mood];
  const rootStyle = useRootStyle(d, size);
  const channels: Partial<Record<RigChannel, Style>> = {
    torso: useTorsoStyle(d),
    head: useHeadStyle(d, m, unit),
    hat: useHatStyle(d, unit),
    eyeL: useEyeStyle(d, unit, -1),
    eyeR: useEyeStyle(d, unit, 1),
    mouth: useMouthStyle(d, m),
    browL: useBrowStyle(d, m, unit, -1),
    browR: useBrowStyle(d, m, unit, 1),
    armL: useArmStyle(d, -1),
    armR: useArmStyle(d, 1),
  };

  if (flat) {
    const names = spec.layers.flatMap((l) => flatten(l));
    return (
      <View testID={testID} style={[{ width, height: size }, style]} pointerEvents="none">
        <Svg width={width} height={size} viewBox={`0 0 ${spec.viewBox.w} ${spec.viewBox.h}`}>
          {names.map((name) => renderPart(byName.get(name), tones, name))}
        </Svg>
      </View>
    );
  }

  return (
    <Animated.View testID={testID} style={[{ width, height: size }, rootStyle, style]} pointerEvents="none">
      {spec.layers.map((layer, i) => (
        <Layer
          key={i}
          layer={layer}
          spec={spec}
          byName={byName}
          tones={tones}
          unit={unit}
          width={width}
          height={size}
          channels={channels}
        />
      ))}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ *
 * One moving layer: a full-size <Svg> of this part's shapes, moved by a
 * view transform. View transforms (not animated SVG props) because they
 * behave identically on iOS, Android and web.
 * ------------------------------------------------------------------ */
interface LayerProps<N extends string> {
  layer: RigLayer<N>;
  spec: RigSpec<N>;
  byName: Map<string, ArtPart<N>>;
  tones: ToneMap | undefined;
  unit: number;
  width: number;
  height: number;
  channels: Partial<Record<RigChannel, Style>>;
}

function Layer<N extends string>({ layer, spec, byName, tones, unit, width, height, channels }: LayerProps<N>) {
  const body = (
    <>
      {layer.parts.length > 0 ? (
        <Svg
          width={width}
          height={height}
          viewBox={`0 0 ${spec.viewBox.w} ${spec.viewBox.h}`}
          style={StyleSheet.absoluteFill}
        >
          {layer.parts.map((name) => renderPart(byName.get(name), tones, name))}
        </Svg>
      ) : null}
      {layer.children?.map((child, i) => (
        <Layer
          key={i}
          layer={child}
          spec={spec}
          byName={byName}
          tones={tones}
          unit={unit}
          width={width}
          height={height}
          channels={channels}
        />
      ))}
    </>
  );

  if (layer.channel === 'static') {
    return <View style={[StyleSheet.absoluteFill, { width, height }]}>{body}</View>;
  }
  const pivot = spec.pivots[layer.channel];
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { width, height, transformOrigin: [pivot.x * unit, pivot.y * unit, 0] },
        channels[layer.channel],
      ]}
    >
      {body}
    </Animated.View>
  );
}

function flatten<N extends string>(layer: RigLayer<N>): N[] {
  return [...layer.parts, ...(layer.children?.flatMap(flatten) ?? [])];
}

function renderPart<N extends string>(part: ArtPart<N> | undefined, tones: ToneMap | undefined, key: string) {
  if (!part) return null;
  return (
    <React.Fragment key={key}>
      {part.shapes.map((s, i) => {
        const fill = s.tone && tones?.[s.tone] ? tones[s.tone] : s.fill;
        return s.circle ? (
          <Circle key={i} cx={s.circle.cx} cy={s.circle.cy} r={s.circle.r} fill={fill} />
        ) : (
          <Path
            key={i}
            d={s.d}
            fill={fill}
            stroke={s.stroke}
            strokeWidth={s.strokeWidth}
            strokeLinecap={s.strokeLinecap}
            strokeLinejoin="round"
          />
        );
      })}
    </React.Fragment>
  );
}
