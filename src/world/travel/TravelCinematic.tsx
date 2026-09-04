/**
 * TRAVEL CINEMATIC — the truck rolls out.
 *
 * Three parallax layers (far hills, mid trees + buildings, near road) scroll
 * past a bouncing fire truck while a mini-map card draws the route. Engine loop
 * + one siren blip. Ends on a "We're here!" sticker, then `onDone()`.
 *
 * Duration is ~3 s, or 800 ms when the child has asked for reduced motion.
 * Tapping anywhere skips straight to the arrival sticker — never trap a kid in
 * a cutscene.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { LocationId } from '@/content/types';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useGame } from '@/state/store';
import { Text } from '@/ui/Text';
import { FireTruck } from '@/world/FireTruck';

const FULL_MS = 3000;
const REDUCED_MS = 800;
const STRIP = 400; // viewBox width of one scrolling tile
/** How far each layer travels over the whole drive, in strip widths. */
const LAYER_SPEED = { far: 160, mid: 520, road: 1180 } as const;

const LOCATION_NAMES: Record<LocationId, string> = {
  station: 'Station Spark',
  bakery: 'the Bakery',
  school: 'the School',
  library: 'the Library',
  park: 'the Park',
  'pet-shop': 'the Pet Shop',
  market: 'the Market',
  pizza: 'the Pizza Shop',
  apartments: 'the Apartments',
  garden: 'the Garden',
  museum: 'the Museum',
  beach: 'the Beach',
  festival: 'the Festival',
  construction: 'the Building Site',
  'train-station': 'the Train Station',
  'clock-tower': 'the Clock Tower',
};

export const locationName = (id: LocationId): string => LOCATION_NAMES[id] ?? 'the next stop';

/* ------------------------------------------------------------------ */
/* Scrolling layers                                                     */
/* ------------------------------------------------------------------ */

/** One layer, tiled twice and translated so it wraps seamlessly. */
function ScrollLayer({
  progress,
  speed,
  height,
  bottom,
  children,
}: {
  progress: SharedValue<number>;
  speed: number;
  height: number;
  bottom: number;
  children: React.ReactNode;
}) {
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: -((progress.value * speed) % STRIP) }] }));
  return (
    <Animated.View style={[styles.layer, { height, bottom, width: STRIP * 2 }, a]} pointerEvents="none">
      <View style={{ width: STRIP, height }}>{children}</View>
      <View style={{ width: STRIP, height }}>{children}</View>
    </Animated.View>
  );
}

const FarHills = (
  <Svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
    <Ellipse cx={80} cy={130} rx={150} ry={78} fill="#8FD16B" opacity={0.8} />
    <Ellipse cx={300} cy={136} rx={170} ry={72} fill="#7CC85F" opacity={0.8} />
  </Svg>
);

const MidTown = (
  <Svg width="100%" height="100%" viewBox="0 0 400 160">
    {/* buildings */}
    <Rect x={24} y={54} width={62} height={106} rx={8} fill="#F0C9A0" />
    <Path d="M 16 58 L 55 30 L 94 58 Z" fill="#4F7FD6" />
    <Rect x={36} y={72} width={18} height={18} rx={4} fill="#8FC7EC" />
    <Rect x={60} y={72} width={18} height={18} rx={4} fill="#8FC7EC" />
    <Rect x={132} y={40} width={70} height={120} rx={8} fill="#F6DFB4" />
    <Path d="M 124 44 L 167 16 L 210 44 Z" fill={palette.engineRed} />
    <Rect x={146} y={60} width={20} height={20} rx={4} fill="#8FC7EC" />
    <Rect x={172} y={60} width={20} height={20} rx={4} fill="#FFE9A8" />
    <Rect x={146} y={96} width={46} height={24} rx={5} fill="#8A5A32" />
    <Rect x={286} y={64} width={64} height={96} rx={8} fill="#E9D6F2" />
    <Path d="M 278 68 L 318 42 L 358 68 Z" fill="#3FBFAE" />
    <Rect x={298} y={84} width={18} height={18} rx={4} fill="#8FC7EC" />
    <Rect x={322} y={84} width={18} height={18} rx={4} fill="#8FC7EC" />
    {/* trees between them */}
    {[104, 232, 262, 378].map((x) => (
      <G key={x} x={x} y={150}>
        <Rect x={-5} y={-16} width={10} height={20} rx={5} fill={palette.woodDark} />
        <Circle cx={0} cy={-32} r={20} fill="#3F9E56" />
        <Circle cx={-14} cy={-20} r={14} fill="#4FAE63" />
        <Circle cx={14} cy={-21} r={13} fill="#4FAE63" />
        <Circle cx={-6} cy={-40} r={8} fill="rgba(255,255,255,0.28)" />
      </G>
    ))}
  </Svg>
);

const RoadStrip = (
  <Svg width="100%" height="100%" viewBox="0 0 400 90">
    <Rect x={0} y={0} width={400} height={90} fill="#B7BFD4" />
    <Rect x={0} y={0} width={400} height={7} fill="#CBD2E4" />
    <Rect x={0} y={14} width={400} height={4} rx={2} fill="#DDE3F0" />
    {[10, 90, 170, 250, 330].map((x) => (
      <Rect key={x} x={x} y={44} width={44} height={8} rx={4} fill={palette.white} opacity={0.85} />
    ))}
    <Rect x={0} y={82} width={400} height={8} fill="#A6AEC6" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/* Mini-map                                                             */
/* ------------------------------------------------------------------ */

const MAP_W = 244;
const MAP_H = 84;
const ROUTE_X0 = 30;
const ROUTE_X1 = 210;

function MiniMap({ progress, from, to }: { progress: SharedValue<number>; from: LocationId; to: LocationId }) {
  const fill = useAnimatedStyle(() => ({ width: (ROUTE_X1 - ROUTE_X0) * Math.min(1, progress.value) }));
  const pin = useAnimatedStyle(() => ({
    transform: [{ translateX: (ROUTE_X1 - ROUTE_X0) * Math.min(1, progress.value) }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(240)} style={[styles.map, shadows.card]}>
      <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={MAP_W} height={MAP_H} rx={18} fill="#DCEFCB" />
        <Rect x={0} y={30} width={MAP_W} height={22} fill="#CBD2E4" />
        <Rect x={92} y={0} width={18} height={MAP_H} fill="#CBD2E4" />
        <Rect x={170} y={0} width={14} height={MAP_H} fill="#CBD2E4" />
        <Circle cx={54} cy={16} r={8} fill="#6FC470" />
        <Circle cx={140} cy={70} r={9} fill="#6FC470" />
        <Circle cx={214} cy={20} r={7} fill="#6FC470" />
        {/* dotted route */}
        <Path
          d={`M ${ROUTE_X0} 42 H ${ROUTE_X1}`}
          stroke={palette.slateLight}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray="2 12"
        />
      </Svg>
      <View style={styles.routeTrack} />
      <Animated.View style={[styles.routeFill, fill]} />
      <View style={[styles.mapPin, { left: ROUTE_X0 - 9, backgroundColor: palette.engineRed }]} />
      <View style={[styles.mapPin, { left: ROUTE_X1 - 9, backgroundColor: palette.leafGreen }]} />
      <Animated.View style={[styles.mapTruck, pin]}>
        <Text variant="tiny">🚒</Text>
      </Animated.View>
      <View style={styles.mapLabels}>
        <Text variant="tiny" color={palette.navyMuted} numberOfLines={1}>
          {locationName(from)}
        </Text>
        <Text variant="tiny" color={palette.navy} numberOfLines={1}>
          {locationName(to)}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* The cinematic                                                        */
/* ------------------------------------------------------------------ */

export interface TravelCinematicProps {
  from: LocationId;
  to: LocationId;
  onDone: () => void;
  /** override the duration (ms) — mostly for tests */
  durationMs?: number;
}

export function TravelCinematic({ from, to, onDone, durationMs }: TravelCinematicProps) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const truck = useGame((s) => s.station.truck);
  const total = durationMs ?? (reduced ? REDUCED_MS : FULL_MS);

  const [arrived, setArrived] = useState(false);
  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const progress = useSharedValue(0);
  const scroll = useSharedValue(0);
  const bounce = useSharedValue(0);
  const truckIn = useSharedValue(-0.55);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    sfx.stopLoop('engine');
    onDone();
  }, [onDone]);

  /** Skip to the arrival sticker. */
  const arriveNow = useCallback(() => {
    if (arrived || finished.current) return;
    setArrived(true);
    haptics.success();
    sfx.play('success');
    progress.value = withTiming(1, { duration: 200 });
    const t = setTimeout(finish, 900);
    timers.current.push(t);
  }, [arrived, finish, progress]);

  useEffect(() => {
    sfx.startLoop('engine', 0.55);
    const siren = setTimeout(() => sfx.play('siren', { volume: 0.85 }), 220);
    timers.current.push(siren);

    progress.value = withTiming(1, { duration: total, easing: Easing.inOut(Easing.quad) });
    truckIn.value = withSpring(0, springs.gentle);

    if (!reduced) {
      scroll.value = withTiming(1, { duration: total, easing: Easing.inOut(Easing.quad) });
      bounce.value = withRepeat(withSequence(withTiming(-4, { duration: 190 }), withTiming(2, { duration: 190 })), -1, true);
    } else {
      scroll.value = withTiming(0.35, { duration: total, easing: Easing.linear });
    }

    const arrive = setTimeout(arriveNow, total);
    timers.current.push(arrive);

    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      cancelAnimation(progress);
      cancelAnimation(scroll);
      cancelAnimation(bounce);
      sfx.stopLoop('engine');
    };
    // one-shot on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckIn.value * width }, { translateY: bounce.value }],
  }));

  const truckWidth = Math.min(240, Math.max(160, width * 0.5));

  return (
    <Pressable style={styles.root} onPress={arriveNow} accessibilityRole="button" accessibilityLabel="Skip the drive">
      <View style={styles.sky} />
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.far} height={130} bottom={116}>
        {FarHills}
      </ScrollLayer>
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.mid} height={170} bottom={96}>
        {MidTown}
      </ScrollLayer>
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.road} height={96} bottom={0}>
        {RoadStrip}
      </ScrollLayer>

      <Animated.View style={[styles.truck, truckStyle]} pointerEvents="none">
        <FireTruck truck={truck} width={truckWidth} driving={!reduced} lightsOn />
      </Animated.View>

      <View style={styles.mapWrap} pointerEvents="none">
        <MiniMap progress={progress} from={from} to={to} />
      </View>

      {arrived ? (
        <View style={styles.stickerWrap} pointerEvents="none">
          <Animated.View entering={ZoomIn.springify().damping(9)} style={[styles.sticker, shadows.card]}>
            <Text variant="display" color={palette.white} center>
              We&apos;re here!
            </Text>
            <Text variant="bodyStrong" color={palette.white} center>
              {locationName(to)}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFill, backgroundColor: palette.skyMid },
  layer: { position: 'absolute', left: 0, flexDirection: 'row' },
  truck: { position: 'absolute', left: '10%', bottom: 46 },
  mapWrap: { position: 'absolute', top: spacing.xxl + spacing.lg, left: 0, right: 0, alignItems: 'center' },
  map: {
    width: MAP_W,
    height: MAP_H,
    borderRadius: 18,
    backgroundColor: '#DCEFCB',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: palette.white,
  },
  routeTrack: {
    position: 'absolute',
    left: ROUTE_X0,
    top: 38,
    width: ROUTE_X1 - ROUTE_X0,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(31,42,90,0.10)',
  },
  routeFill: { position: 'absolute', left: ROUTE_X0, top: 38, height: 8, borderRadius: 4, backgroundColor: palette.engineRed },
  mapPin: { position: 'absolute', top: 34, width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: palette.white },
  mapTruck: {
    position: 'absolute',
    left: ROUTE_X0 - 8,
    top: 22,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabels: { position: 'absolute', left: 10, right: 10, bottom: 4, flexDirection: 'row', justifyContent: 'space-between' },
  stickerWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sticker: {
    backgroundColor: palette.engineRed,
    borderRadius: radii.panel,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 6,
    borderColor: palette.white,
    transform: [{ rotate: '-6deg' }],
  },
});
