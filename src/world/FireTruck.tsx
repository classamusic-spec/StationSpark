import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Mask, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { useLoop, usePulse } from '@/hooks';
import type { TruckStyle } from '@/state/store';

/** Design box for the side-view truck. All geometry below is in these units. */
export const TRUCK_VB = { w: 220, h: 112 } as const;

const bodyColors: Record<TruckStyle['color'], { face: string; shade: string; light: string }> = {
  red: { face: palette.engineRed, shade: palette.engineRedDark, light: palette.engineRedLight },
  yellow: { face: palette.safetyYellow, shade: palette.goldDark, light: '#FFE07A' },
  blue: { face: '#3E8FE0', shade: '#25649F', light: '#7FC0F5' },
  green: { face: palette.leafGreen, shade: palette.leafGreenDark, light: '#8CD98F' },
};

const lampColors: Record<TruckStyle['lights'], readonly [string, string, string, string, string]> = {
  classic: [palette.engineRed, '#FFFFFF', palette.engineRed, '#FFFFFF', palette.engineRed],
  rainbow: [palette.engineRed, palette.safetyYellow, palette.leafGreen, palette.waterCyan, palette.purple],
  blue: ['#2F6BD8', '#BFE9FF', '#2F6BD8', '#BFE9FF', '#2F6BD8'],
};

const LAMP_STOPS = [0, 0.25, 0.5, 0.75, 1];

function DecalArt({ decal, cx, cy }: { decal: TruckStyle['decal']; cx: number; cy: number }) {
  if (decal === 'none') return null;
  if (decal === 'flame') {
    return (
      <G>
        <Path
          d={`M ${cx} ${cy - 11} c 7 6 9 11 0 18 c -9 -7 -7 -12 0 -18 z`}
          fill={palette.engineRed}
        />
        <Path d={`M ${cx} ${cy - 2} c 3.4 3 4 5.4 0 8.6 c -4 -3.2 -3.4 -5.6 0 -8.6 z`} fill={palette.safetyYellow} />
      </G>
    );
  }
  if (decal === 'star') {
    const r = 11;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
    });
    return <Path d={`M ${pts.join(' L ')} Z`} fill={palette.safetyYellow} stroke={palette.goldDark} strokeWidth={1.2} strokeLinejoin="round" />;
  }
  if (decal === 'paw') {
    return (
      <G fill={palette.navy}>
        <Ellipse cx={cx} cy={cy + 4} rx={7.5} ry={6} />
        <Circle cx={cx - 7} cy={cy - 4} r={3.1} />
        <Circle cx={cx - 2.4} cy={cy - 7.4} r={3.1} />
        <Circle cx={cx + 2.6} cy={cy - 7.4} r={3.1} />
        <Circle cx={cx + 7.2} cy={cy - 4} r={3.1} />
      </G>
    );
  }
  return <Path d={`M ${cx + 3} ${cy - 12} L ${cx - 8} ${cy + 1} L ${cx - 1} ${cy + 1} L ${cx - 4} ${cy + 12} L ${cx + 8} ${cy - 2} L ${cx + 1} ${cy - 2} Z`} fill={palette.safetyYellow} stroke={palette.goldDark} strokeWidth={1} strokeLinejoin="round" />;
}

interface BodyProps {
  w: number;
  h: number;
  color: TruckStyle['color'];
  decal: TruckStyle['decal'];
  cleanSpots: readonly { x: number; y: number; r: number }[];
  grime: boolean;
}

/** Static truck body. Memoized: the wheels and light bar animate outside the SVG. */
const TruckBody = memo(function TruckBody({ w, h, color, decal, cleanSpots, grime }: BodyProps) {
  const c = bodyColors[color];
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

      {/* soft ground shadow */}
      <Ellipse cx={110} cy={105} rx={96} ry={7} fill={palette.navy} opacity={0.14} />

      {/* ladder along the roof */}
      <Rect x={18} y={28} width={116} height={10} rx={5} fill={palette.slate} />
      {[28, 44, 60, 76, 92, 108].map((x) => (
        <Rect key={x} x={x} y={29.5} width={4} height={7} rx={2} fill={palette.slateLight} />
      ))}

      {/* rear body */}
      <Rect x={6} y={40} width={134} height={48} rx={9} fill={c.face} />
      <Rect x={6} y={40} width={134} height={13} rx={7} fill={c.light} opacity={0.5} />
      {/* equipment lockers */}
      <Rect x={16} y={48} width={38} height={22} rx={4} fill={c.shade} opacity={0.55} />
      <Rect x={94} y={48} width={36} height={22} rx={4} fill={c.shade} opacity={0.55} />

      {/* cab */}
      <Path d="M 138 88 L 138 30 Q 138 22 147 22 L 190 22 Q 198 22 202 30 L 212 52 Q 214 56 214 62 L 214 88 Z" fill={c.face} />
      <Path d="M 176 30 L 196 30 Q 200 30 202 34 L 209 50 Q 210 53 206 53 L 176 53 Q 173 53 173 50 L 173 33 Q 173 30 176 30 Z" fill={palette.waterCyanLight} />
      <Path d="M 178 32 L 192 32 L 183 51 L 176 51 Z" fill="#FFFFFF" opacity={0.45} />
      <Rect x={144} y={30} width={24} height={23} rx={5} fill={palette.waterCyanLight} />
      <Rect x={146} y={32} width={9} height={19} rx={4} fill="#FFFFFF" opacity={0.45} />
      <Rect x={140} y={56} width={8} height={4} rx={2} fill={palette.charcoal} opacity={0.5} />

      {/* gold reflective stripe */}
      <Rect x={6} y={64} width={208} height={9} rx={3} fill={palette.safetyYellow} />
      <Rect x={6} y={64} width={208} height={3} rx={2} fill="#FFFFFF" opacity={0.4} />

      {/* lower skirt + bumper */}
      <Rect x={6} y={78} width={208} height={11} rx={4} fill={c.shade} />
      <Rect x={202} y={74} width={16} height={15} rx={5} fill={palette.slateLight} />
      <Circle cx={210} cy={62} r={5} fill={palette.safetyYellow} />

      {/* light bar base (lamps are animated views layered on top) */}
      <Rect x={148} y={11} width={56} height={12} rx={5} fill={palette.charcoal} />

      {/* decal badge */}
      {decal !== 'none' ? (
        <G>
          <Circle cx={62} cy={56} r={17} fill="#FFFFFF" opacity={0.94} />
          <Circle cx={62} cy={56} r={17} fill="none" stroke={c.shade} strokeWidth={2} />
          <DecalArt decal={decal} cx={62} cy={56} />
        </G>
      ) : null}

      {/* wheel wells */}
      <Circle cx={54} cy={88} r={19} fill={palette.charcoalDark} opacity={0.28} />
      <Circle cx={168} cy={88} r={19} fill={palette.charcoalDark} opacity={0.28} />

      {/* washable grime, erased where the sponge has been */}
      {grime ? (
        <G mask="url(#truckGrime)" opacity={0.55}>
          <Rect x={6} y={24} width={208} height={64} rx={10} fill="#8A7A5E" opacity={0.5} />
          <Circle cx={40} cy={52} r={11} fill="#6F6047" opacity={0.5} />
          <Circle cx={104} cy={72} r={9} fill="#6F6047" opacity={0.45} />
          <Circle cx={160} cy={44} r={10} fill="#6F6047" opacity={0.4} />
          <Circle cx={196} cy={70} r={8} fill="#6F6047" opacity={0.45} />
        </G>
      ) : null}
    </Svg>
  );
});

const Wheel = memo(function Wheel({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" pointerEvents="none">
      <Circle cx={20} cy={20} r={19} fill={palette.charcoalDark} />
      <Circle cx={20} cy={20} r={11} fill={palette.slateLight} />
      <Circle cx={20} cy={20} r={4} fill={palette.slate} />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <Circle key={deg} cx={20 + Math.cos(a) * 7} cy={20 + Math.sin(a) * 7} r={1.9} fill={palette.slate} />;
      })}
    </Svg>
  );
});

function SpinningWheel({ px, cx, cy, r, driving }: { px: (n: number) => number; cx: number; cy: number; r: number; driving: boolean }) {
  const t = useLoop(760);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${driving ? t.value * 360 : 0}deg` }] }));
  const size = px(r * 2);
  return (
    <Animated.View style={[styles.abs, { left: px(cx - r), top: px(cy - r), width: size, height: size }, style]} pointerEvents="none">
      <Wheel size={size} />
    </Animated.View>
  );
}

function Lamp({ left, top, w, h, phase, lights, on }: { left: number; top: number; w: number; h: number; phase: number; lights: TruckStyle['lights']; on: boolean }) {
  const pulse = usePulse(620, 0.5);
  const colors = lampColors[lights];
  const style = useAnimatedStyle(() => {
    const p = (pulse.value + phase) % 1;
    const bg = interpolateColor(p, LAMP_STOPS, colors as unknown as string[]);
    return { backgroundColor: bg, opacity: on ? 0.55 + Math.abs(p - 0.5) * 0.9 : 0.35 };
  });
  return <Animated.View style={[styles.abs, { left, top, width: w, height: h, borderRadius: h / 2 }, style]} pointerEvents="none" />;
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
 * Side-view fire engine, dressed from the child's `TruckStyle`. The body is a
 * memoized SVG; the wheels and light bar are RN transforms layered over it so
 * they stay smooth on every platform (animated SVG props are unreliable on web).
 */
export function FireTruck({ truck, width = 220, driving = false, lightsOn = true, grime = false, cleanSpots, style }: FireTruckProps) {
  const scale = width / TRUCK_VB.w;
  const height = TRUCK_VB.h * scale;
  const px = useMemo(() => (n: number) => n * scale, [scale]);
  const spots = cleanSpots ?? [];

  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      <TruckBody w={width} h={height} color={truck.color} decal={truck.decal} cleanSpots={spots} grime={grime} />
      <Lamp left={px(152)} top={px(13)} w={px(23)} h={px(8)} phase={0} lights={truck.lights} on={lightsOn} />
      <Lamp left={px(178)} top={px(13)} w={px(23)} h={px(8)} phase={0.5} lights={truck.lights} on={lightsOn} />
      <SpinningWheel px={px} cx={54} cy={88} r={17} driving={driving} />
      <SpinningWheel px={px} cx={168} cy={88} r={17} driving={driving} />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
