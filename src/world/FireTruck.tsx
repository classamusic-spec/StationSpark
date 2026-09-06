import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Mask, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { useLoop, usePulse } from '@/hooks';
import type { TruckStyle } from '@/state/store';
import {
  TRUCK_ART_VB,
  TRUCK_DECAL,
  truckBeaconBase,
  truckBeaconDome,
  truckBody,
  truckDecalDisc,
  truckDecalFlame,
  truckDecalRing,
  truckWheels,
  type TruckShape,
} from './art/fireTruckArt';

/**
 * Design box for the side-view truck — the authored drawing's own box.
 * Callers size by width and the height follows this ratio.
 */
export const TRUCK_VB = { w: TRUCK_ART_VB.w, h: TRUCK_ART_VB.h } as const;

/** Where the paint goes. `face` is the panel, `shade` the lower body, `deep` the darkest edge. */
const bodyColors: Record<TruckStyle['color'], { face: string; shade: string; deep: string; light: string }> = {
  red: { face: '#EA2C2F', shade: '#BF1C21', deep: '#D60E2A', light: palette.engineRedLight },
  yellow: { face: palette.safetyYellow, shade: '#D89A12', deep: palette.goldDark, light: '#FFE07A' },
  blue: { face: '#3E8FE0', shade: '#25649F', deep: '#1E5288', light: '#7FC0F5' },
  green: { face: palette.leafGreen, shade: palette.leafGreenDark, light: '#8CD98F', deep: '#2F6B33' },
};

const lampColors: Record<TruckStyle['lights'], readonly [string, string, string, string, string]> = {
  classic: [palette.engineRed, '#FFFFFF', palette.engineRed, '#FFFFFF', palette.engineRed],
  rainbow: [palette.engineRed, palette.safetyYellow, palette.leafGreen, palette.waterCyan, palette.purple],
  blue: ['#2F6BD8', '#BFE9FF', '#2F6BD8', '#BFE9FF', '#2F6BD8'],
};

const LAMP_STOPS = [0, 0.25, 0.5, 0.75, 1];

/**
 * Draw one authored shape. A circle stays a `<Circle/>` and an ellipse stays an
 * `<Ellipse/>`: rewriting either as arcs moves its antialiased edge, and the
 * whole point of the pipeline is that what ships is what was drawn.
 */
function Shape({ s, fill }: { s: TruckShape; fill?: string }) {
  const paint = fill ?? s.fill;
  const stroke = s.stroke
    ? { stroke: s.stroke, strokeWidth: s.strokeWidth, strokeLinecap: s.strokeLinecap as 'round' | undefined }
    : null;
  if (s.circle) return <Circle cx={s.circle.cx} cy={s.circle.cy} r={s.circle.r} fill={paint} {...stroke} />;
  if (s.ellipse) {
    return <Ellipse cx={s.ellipse.cx} cy={s.ellipse.cy} rx={s.ellipse.rx} ry={s.ellipse.ry} fill={paint} {...stroke} />;
  }
  return <Path d={s.d} fill={paint ?? 'none'} {...stroke} />;
}

const Shapes = ({ list, tint }: { list: readonly TruckShape[]; tint?: (s: TruckShape) => string | undefined }) => (
  <>
    {list.map((s, i) => (
      <Shape key={i} s={s} fill={tint?.(s)} />
    ))}
  </>
);

/** The decals the child did not author — drawn to sit inside the authored roundel. */
function DecalGlyph({ decal }: { decal: TruckStyle['decal'] }) {
  const { cx, cy } = TRUCK_DECAL;
  if (decal === 'flame') return <Shapes list={truckDecalFlame} />;
  if (decal === 'star') {
    const r = 8;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
    });
    return <Path d={`M ${pts.join(' L ')} Z`} fill={palette.safetyYellow} stroke={palette.goldDark} strokeWidth={0.9} strokeLinejoin="round" />;
  }
  if (decal === 'paw') {
    return (
      <G fill={palette.navy}>
        <Ellipse cx={cx} cy={cy + 3} rx={5.4} ry={4.3} />
        <Circle cx={cx - 5} cy={cy - 2.9} r={2.2} />
        <Circle cx={cx - 1.7} cy={cy - 5.3} r={2.2} />
        <Circle cx={cx + 1.9} cy={cy - 5.3} r={2.2} />
        <Circle cx={cx + 5.2} cy={cy - 2.9} r={2.2} />
      </G>
    );
  }
  /* lightning */
  return (
    <Path
      d={`M ${cx + 2.1} ${cy - 8.6} L ${cx - 5.7} ${cy + 0.7} L ${cx - 0.7} ${cy + 0.7} L ${cx - 2.9} ${cy + 8.6} L ${cx + 5.7} ${cy - 1.4} L ${cx + 0.7} ${cy - 1.4} Z`}
      fill={palette.safetyYellow}
      stroke={palette.goldDark}
      strokeWidth={0.8}
      strokeLinejoin="round"
    />
  );
}

interface BodyProps {
  w: number;
  h: number;
  color: TruckStyle['color'];
  decal: TruckStyle['decal'];
  cleanSpots: readonly { x: number; y: number; r: number }[];
  grime: boolean;
}

/** Static truck body. Memoized: the wheels and beacon animate outside the SVG. */
const TruckBody = memo(function TruckBody({ w, h, color, decal, cleanSpots, grime }: BodyProps) {
  const c = bodyColors[color];
  /* Only the panels the child painted change; the gold stripe, the chrome
     ladder, the glass and the bumper keep the colours the artist chose. */
  const paint = useMemo(
    () => (s: TruckShape) => (s.paint ? c[s.paint] : undefined),
    [c],
  );

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${TRUCK_VB.w} ${TRUCK_VB.h}`} pointerEvents="none">
      <Defs>
        <Mask id="truckGrime">
          <Rect x={0} y={0} width={TRUCK_VB.w} height={TRUCK_VB.h} fill="#FFFFFF" />
          {cleanSpots.map((s, i) => (
            <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#000000" />
          ))}
        </Mask>
      </Defs>

      {/* the engine sits on the ground, not above it */}
      <Ellipse cx={TRUCK_VB.w / 2} cy={78.4} rx={70} ry={4.4} fill={palette.navy} opacity={0.13} />

      <Shapes list={truckBody} tint={paint} />
      <Shapes list={truckBeaconBase} />

      {/* the door badge: the authored ring and disc, then whichever glyph the
          child chose. `none` takes the badge off the door altogether. */}
      {decal !== 'none' ? (
        <>
          {/* authored order: the cream disc, then the ring drawn over its edge */}
          <Shapes list={truckDecalDisc} />
          <Shapes list={truckDecalRing} tint={paint} />
          <DecalGlyph decal={decal} />
        </>
      ) : null}

      {/* washable grime, erased where the sponge has been */}
      {grime ? (
        <G mask="url(#truckGrime)" opacity={0.55}>
          <Rect x={3} y={8} width={153} height={62} rx={8} fill="#8A7A5E" opacity={0.5} />
          <Circle cx={28} cy={34} r={8} fill="#6F6047" opacity={0.5} />
          <Circle cx={74} cy={52} r={7} fill="#6F6047" opacity={0.45} />
          <Circle cx={116} cy={28} r={7} fill="#6F6047" opacity={0.4} />
          <Circle cx={142} cy={52} r={6} fill="#6F6047" opacity={0.45} />
        </G>
      ) : null}
    </Svg>
  );
});

/** One authored wheel, drawn in its own box so it can be spun by a transform. */
const Wheel = memo(function Wheel({ index, size }: { index: number; size: number }) {
  const wheel = truckWheels[index];
  if (!wheel) return null;
  const { cx, cy, r } = wheel;
  return (
    <Svg width={size} height={size} viewBox={`${cx - r} ${cy - r} ${r * 2} ${r * 2}`} pointerEvents="none">
      <Shapes list={wheel.shapes} />
    </Svg>
  );
});

function SpinningWheel({ px, index, driving }: { px: (n: number) => number; index: number; driving: boolean }) {
  const t = useLoop(760);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${driving ? t.value * 360 : 0}deg` }] }));
  const wheel = truckWheels[index];
  if (!wheel) return null;
  const size = px(wheel.r * 2);
  return (
    <Animated.View
      style={[styles.abs, { left: px(wheel.cx - wheel.r), top: px(wheel.cy - wheel.r), width: size, height: size }, style]}
      pointerEvents="none"
    >
      <Wheel index={index} size={size} />
    </Animated.View>
  );
}

/**
 * The beacon dome, flashing in the child's chosen colours.
 *
 * The authored dome is drawn underneath and the flash is a tinted copy laid over
 * it, so the shape is always the artist's — only the colour pulses.
 */
function Beacon({ px, lights, on }: { px: (n: number) => number; lights: TruckStyle['lights']; on: boolean }) {
  const pulse = usePulse(620, 0.5);
  const colors = lampColors[lights];
  const style = useAnimatedStyle(() => {
    const p = pulse.value % 1;
    return {
      backgroundColor: interpolateColor(p, LAMP_STOPS, colors as unknown as string[]),
      opacity: on ? 0.5 + Math.abs(p - 0.5) * 0.8 : 0.28,
    };
  });
  return (
    <>
      <View style={[styles.abs, { left: 0, top: 0, width: px(TRUCK_VB.w), height: px(TRUCK_VB.h) }]} pointerEvents="none">
        <Svg width={px(TRUCK_VB.w)} height={px(TRUCK_VB.h)} viewBox={`0 0 ${TRUCK_VB.w} ${TRUCK_VB.h}`} pointerEvents="none">
          <Shapes list={truckBeaconDome} />
        </Svg>
      </View>
      {/* the colour wash, clipped to the dome's own box */}
      <Animated.View
        style={[styles.abs, { left: px(113), top: px(1.2), width: px(13.9), height: px(6.5), borderRadius: px(3.3) }, style]}
        pointerEvents="none"
      />
    </>
  );
}

export interface FireTruckProps {
  /** the child's truck from the store (colour / decal / lights / horn) */
  truck: TruckStyle;
  /** rendered width; height follows the design box ratio */
  width?: number;
  /** wheels spin */
  driving?: boolean;
  /** light bar flashes (default true) */
  lightsOn?: boolean;
  /** show washable grime over the paint */
  grime?: boolean;
  /** circles (in TRUCK_VB units) where the sponge has cleaned the grime away */
  cleanSpots?: readonly { x: number; y: number; r: number }[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Side-view fire engine — the authored drawing from `SVG ART/FIRE_TRUCK.svg`,
 * dressed from the child's `TruckStyle`.
 *
 * The body is a memoized SVG of the authored paths; the wheels and the beacon
 * are RN transforms layered over it, because animated SVG props are unreliable
 * on web. Only the panels the child painted are re-tinted — the gold stripe,
 * the chrome ladder, the glass and the bumper stay the colours they were drawn.
 */
export function FireTruck({ truck, width = 220, driving = false, lightsOn = true, grime = false, cleanSpots, style }: FireTruckProps) {
  const scale = width / TRUCK_VB.w;
  const height = TRUCK_VB.h * scale;
  const px = useMemo(() => (n: number) => n * scale, [scale]);
  const spots = cleanSpots ?? [];

  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      <TruckBody w={width} h={height} color={truck.color} decal={truck.decal} cleanSpots={spots} grime={grime} />
      <Beacon px={px} lights={truck.lights} on={lightsOn} />
      <SpinningWheel px={px} index={0} driving={driving} />
      <SpinningWheel px={px} index={1} driving={driving} />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
