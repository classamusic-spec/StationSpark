import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { idle, palette } from '@/theme';
import { Text } from '@/ui';
import { usePulse } from '@/hooks';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '../tone';

export type HydrantTone = 'red' | 'yellow';

/** The hydrant is authored in this box (standing on y ≈ 96); width = 0.72 × height. */
export const HYDRANT_VB = { w: 72, h: 100 } as const;

const tones: Record<HydrantTone, { face: string; edge: string }> = {
  red: { face: palette.engineRed, edge: palette.engineRedDark },
  yellow: { face: palette.safetyYellow, edge: palette.gold },
};

export interface HydrantProps {
  /** height in px (the drawing is 0.72 × as wide) */
  size?: number;
  /** alternatively size by width — handy for tray rows */
  width?: number;
  tone?: HydrantTone;
  /** the hose is coupled: a wet sheen plus a small twinkling water sparkle */
  connected?: boolean;
  /** alias for `connected` (matches the older hydrant art API) */
  wet?: boolean;
  /** number painted on the cream plate on the barrel */
  label?: string | number;
}

/** Twinkling droplets + a four-point sparkle by the coupled side cap. */
function Sparkle({ w, h }: { w: number; h: number }) {
  const pulse = usePulse(idle.flagWavePeriodMs, 0.7);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [{ scale: 0.9 + pulse.value * 0.2 }],
  }));
  return (
    <Animated.View style={[styles.sparkle, { width: w, height: h }, style]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${HYDRANT_VB.w} ${HYDRANT_VB.h}`}>
        <Path d="M66 42l2.4 5.6 5.6 2.4-5.6 2.4L66 58l-2.4-5.6L58 50l5.6-2.4z" fill={palette.white} />
        <Path d="M4 40c-3 4-3 8 0 8s3-4 0-8z" fill={palette.waterCyan} />
        <Path d="M58 68c-2.6 3.4-2.6 7 0 7s2.6-3.6 0-7z" fill={palette.waterCyan} />
        <Path d="M12 68c-2.2 3-2.2 6 0 6s2.2-3 0-6z" fill={palette.waterCyanLight} />
      </Svg>
    </Animated.View>
  );
}

/**
 * The friendly street hydrant: dome cap with a bonnet nut, top collar, a
 * chunky barrel (base → navy shade on the right → white highlight on the
 * left), two side caps with a chain, a cream number-plate slot, base flange,
 * contact shadow. Red and yellow variants; `connected` adds a water sparkle.
 */
export function Hydrant({ size, width, tone = 'red', connected, wet, label }: HydrantProps) {
  const h = width !== undefined ? width / 0.72 : (size ?? 64);
  const w = h * 0.72;
  const t = tones[tone];
  const live = !!(connected || wet);
  const labelPx = Math.max(9, h * 0.13);
  return (
    <View style={{ width: w, height: h }} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${HYDRANT_VB.w} ${HYDRANT_VB.h}`}>
        <Ellipse cx={36} cy={95} rx={27} ry={shadowRy(27)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        {/* base flange */}
        <Rect x={8} y={84} width={56} height={12} rx={6} fill={t.edge} />
        <Rect x={8} y={91} width={56} height={5} rx={2.5} fill={SHADE} />
        <Rect x={11} y={85} width={30} height={3} rx={1.5} fill={HIGHLIGHT} />
        {/* lower collar */}
        <Rect x={12} y={77} width={48} height={9} rx={4.5} fill={t.edge} />
        {/* barrel */}
        <Rect x={16} y={30} width={40} height={52} rx={15} fill={t.face} />
        <Path d="M56 45v22a15 15 0 0 1-15 15h-4a15 15 0 0 0 9-15V45a15 15 0 0 0-9-15h4a15 15 0 0 1 15 15z" fill={SHADE} />
        <Rect x={20} y={35} width={8} height={40} rx={4} fill={HIGHLIGHT} />
        {/* side caps */}
        <Rect x={2} y={47} width={18} height={16} rx={8} fill={t.edge} />
        <Rect x={52} y={47} width={18} height={16} rx={8} fill={t.edge} />
        <Rect x={2} y={57} width={18} height={6} rx={3} fill={SHADE} />
        <Rect x={52} y={57} width={18} height={6} rx={3} fill={SHADE} />
        <Circle cx={8} cy={55} r={5.5} fill={t.face} />
        <Circle cx={64} cy={55} r={5.5} fill={t.face} />
        <Path d="M8 51.5l3 2.2-1.2 3.6H6.2L5 53.7z" fill={SHADE} />
        <Path d="M64 51.5l3 2.2-1.2 3.6h-3.6L61 53.7z" fill={SHADE} />
        <Circle cx={6.5} cy={53} r={1.6} fill={HIGHLIGHT} />
        <Circle cx={62.5} cy={53} r={1.6} fill={HIGHLIGHT} />
        {/* chain from the left cap to the barrel */}
        <G fill={palette.slate}>
          <Circle cx={9} cy={64} r={1.7} />
          <Circle cx={11.5} cy={68} r={1.7} />
          <Circle cx={15} cy={70.8} r={1.7} />
          <Circle cx={19} cy={71.6} r={1.7} />
        </G>
        {/* number plate slot */}
        <Rect x={22} y={57} width={28} height={15} rx={4} fill={palette.cream} />
        <Rect x={22} y={69} width={28} height={3} rx={1.5} fill={SHADE} />
        <Rect x={24} y={58.5} width={24} height={3} rx={1.5} fill={palette.white} opacity={0.6} />
        {/* top collar + dome + bonnet nut */}
        <Rect x={12} y={24} width={48} height={10} rx={5} fill={t.edge} />
        <Rect x={12} y={30} width={48} height={4} rx={2} fill={SHADE} />
        <Path d="M18 24c0-11 8-17 18-17s18 6 18 17z" fill={t.face} />
        <Path d="M36 7c10 0 18 6 18 17h-8c0-7-4-12-10-14z" fill={SHADE} />
        <Ellipse cx={28} cy={15} rx={5.5} ry={3} fill={HIGHLIGHT} />
        <Rect x={30} y={1} width={12} height={9} rx={4} fill={t.edge} />
        <Rect x={31.5} y={2} width={9} height={2.6} rx={1.3} fill={HIGHLIGHT} />
        {live ? <Rect x={16} y={30} width={40} height={52} rx={15} fill={palette.waterCyanLight} opacity={0.28} /> : null}
      </Svg>
      {label !== undefined ? (
        <View style={[styles.plate, { left: w * (22 / 72), top: h * 0.565, width: w * (28 / 72), height: h * 0.13 }]}>
          <Text variant="tiny" color={palette.navy} style={{ fontSize: labelPx, lineHeight: labelPx * 1.15 }}>
            {String(label)}
          </Text>
        </View>
      ) : null}
      {live ? <Sparkle w={w} h={h} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute', left: 0, top: 0 },
});
