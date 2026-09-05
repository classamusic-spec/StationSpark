/**
 * STATION WALL — the backdrop of the Progress board.
 *
 * The town (clouds, distant skyline, treeline, hills) peeks above a cream
 * station wall with a red cornice; the cork boards are pinned to that wall.
 * One ground plane (the wall's plinth + floor) with a soft lip, no seams:
 * the hills run on *behind* the cornice so sky and wall meet with a value
 * step, never a hard line of nothing.
 */
import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { TownBackdrop } from '@/world';
import { HIGHLIGHT, SHADE } from '@/world/tone';

const Wall = memo(function Wall({ w, h }: { w: number; h: number }) {
  const courses = Math.max(0, Math.floor((h - 60) / 36));
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="stationWallFace" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F9E4BE" />
          <Stop offset="1" stopColor="#F1D3A2" />
        </LinearGradient>
        <LinearGradient id="stationWallSoffit" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.navy} stopOpacity={0.22} />
          <Stop offset="1" stopColor={palette.navy} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* the wall face */}
      <Rect x={0} y={18} width={w} height={h - 18} fill="url(#stationWallFace)" />
      {/* faint siding courses — texture, never lines */}
      {Array.from({ length: courses }, (_, i) => (
        <Rect key={i} x={0} y={58 + i * 36} width={w} height={3} fill={SHADE} opacity={0.32} />
      ))}
      {/* roof cornice: red band, dark lip, the soffit shadow it throws */}
      <Rect x={0} y={0} width={w} height={22} fill={palette.engineRed} />
      <Rect x={0} y={0} width={w} height={6} fill={HIGHLIGHT} />
      <Rect x={0} y={18} width={w} height={8} fill={palette.engineRedDark} />
      <Rect x={0} y={26} width={w} height={22} fill="url(#stationWallSoffit)" />

      {/* plinth + floor at the foot of the wall (one ground plane, soft lip) */}
      <Rect x={0} y={h - 92} width={w} height={92} fill={palette.tanDark} opacity={0.45} />
      <Rect x={0} y={h - 92} width={w} height={5} fill={HIGHLIGHT} />
      <Rect x={0} y={h - 34} width={w} height={34} fill="#C9D0E0" />
      <Rect x={0} y={h - 34} width={w} height={6} fill="#DEE3F0" />
    </Svg>
  );
});

export interface StationWallProps {
  /** where the cornice sits, from the top of the screen */
  top: number;
}

export function StationWall({ top }: StationWallProps) {
  const { width, height } = useWindowDimensions();
  const w = Math.max(320, width);
  const h = Math.max(240, height - top);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <TownBackdrop hills={h + 72} cloudCount={3} sun={false} />
      <View style={[styles.wall, { top, height: h }]}>
        <Wall w={w} h={h} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wall: { position: 'absolute', left: 0, right: 0, alignItems: 'center', overflow: 'hidden' },
});
