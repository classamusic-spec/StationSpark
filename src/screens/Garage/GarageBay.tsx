import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';

/** The truck bay: tool wall, tyre stack, work lamps and a wet, shiny floor. */
export const GarageBay = memo(function GarageBay() {
  const { width, height } = useWindowDimensions();
  const w = Math.max(360, width);
  const h = Math.max(560, height);
  const floorY = h * 0.66;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="bayWall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F3DFBB" />
            <Stop offset="1" stopColor="#E7CDA0" />
          </LinearGradient>
          <LinearGradient id="bayFloor" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#AEB6CC" />
            <Stop offset="0.35" stopColor="#C3CADC" />
            <Stop offset="1" stopColor="#98A0B8" />
          </LinearGradient>
          <LinearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFF1B8" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#FFF1B8" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={w} height={floorY} fill="url(#bayWall)" />
        {/* brick courses */}
        {Array.from({ length: 9 }, (_, i) => (
          <Rect key={i} x={0} y={40 + i * ((floorY - 40) / 9)} width={w} height={2} fill="#D9BC8A" opacity={0.5} />
        ))}

        {/* work lamps */}
        {[w * 0.24, w * 0.76].map((x) => (
          <G key={x}>
            <Rect x={x - 2} y={0} width={4} height={26} fill={palette.charcoal} />
            <Path d={`M ${x - 26} 48 Q ${x} 20 ${x + 26} 48 Z`} fill={palette.engineRed} />
            <Ellipse cx={x} cy={48} rx={26} ry={6} fill="#FFE07A" />
            <Path d={`M ${x - 26} 50 L ${x - 96} ${floorY} L ${x + 96} ${floorY} L ${x + 26} 50 Z`} fill="url(#lampCone)" />
          </G>
        ))}

        {/* pegboard with tools */}
        <G>
          <Rect x={w * 0.58} y={floorY * 0.32} width={w * 0.34} height={floorY * 0.42} rx={10} fill="#E0C08C" />
          <Rect x={w * 0.58} y={floorY * 0.32} width={w * 0.34} height={10} rx={5} fill="#C9A470" />
          {Array.from({ length: 18 }, (_, i) => (
            <Circle key={i} cx={w * 0.6 + (i % 6) * (w * 0.055)} cy={floorY * 0.4 + Math.floor(i / 6) * (floorY * 0.1)} r={2} fill="#C9A470" />
          ))}
          {/* wrench */}
          <Path d={`M ${w * 0.62} ${floorY * 0.45} l 26 26`} stroke={palette.slate} strokeWidth={7} strokeLinecap="round" />
          <Circle cx={w * 0.62} cy={floorY * 0.45} r={8} fill="none" stroke={palette.slate} strokeWidth={6} />
          {/* hose coil */}
          <Circle cx={w * 0.76} cy={floorY * 0.5} r={22} fill="none" stroke={palette.safetyYellow} strokeWidth={8} />
          <Circle cx={w * 0.76} cy={floorY * 0.5} r={11} fill="none" stroke={palette.gold} strokeWidth={6} />
          {/* spare helmet */}
          <Path d={`M ${w * 0.86} ${floorY * 0.62} c 0 -14 8 -22 18 -22 c 10 0 18 8 18 22 z`} fill={palette.engineRed} />
          <Ellipse cx={w * 0.86 + 18} cy={floorY * 0.62} rx={24} ry={5} fill={palette.engineRedDark} />
        </G>

        {/* tyre stack */}
        <G>
          {[0, 1, 2].map((i) => (
            <G key={i}>
              <Ellipse cx={w * 0.11} cy={floorY - 14 - i * 26} rx={44} ry={16} fill={palette.charcoalDark} />
              <Ellipse cx={w * 0.11} cy={floorY - 20 - i * 26} rx={44} ry={16} fill="#4A5270" />
              <Ellipse cx={w * 0.11} cy={floorY - 20 - i * 26} rx={20} ry={7} fill={palette.charcoalDark} />
            </G>
          ))}
        </G>

        {/* bucket + sponge shelf */}
        <G>
          <Path d={`M ${w * 0.31} ${floorY - 40} l 6 40 l 28 0 l 6 -40 z`} fill={palette.waterCyan} />
          <Ellipse cx={w * 0.31 + 23} cy={floorY - 40} rx={23} ry={7} fill={palette.waterCyanLight} />
        </G>

        {/* floor */}
        <Rect x={0} y={floorY} width={w} height={h - floorY} fill="url(#bayFloor)" />
        <Rect x={0} y={floorY} width={w} height={5} fill="#8892AC" />
        {/* wet sheen */}
        <Ellipse cx={w * 0.5} cy={floorY + (h - floorY) * 0.42} rx={w * 0.42} ry={(h - floorY) * 0.3} fill="#FFFFFF" opacity={0.16} />
        <Ellipse cx={w * 0.32} cy={floorY + (h - floorY) * 0.7} rx={w * 0.18} ry={(h - floorY) * 0.12} fill="#FFFFFF" opacity={0.1} />
        {/* yellow bay lines */}
        <Rect x={w * 0.1} y={floorY + 18} width={w * 0.8} height={5} rx={2.5} fill={palette.safetyYellow} opacity={0.55} />
      </Svg>
    </View>
  );
});
