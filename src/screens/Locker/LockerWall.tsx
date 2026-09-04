import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';

/** A row of firehouse lockers behind the crew. */
export const LockerWall = memo(function LockerWall({ top = 0, height = 380 }: { top?: number; height?: number }) {
  const { width } = useWindowDimensions();
  const w = Math.max(360, width);
  const doorW = 92;
  const count = Math.ceil(w / doorW) + 1;
  const doors = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={[styles.wrap, { top, height }]} pointerEvents="none">
      <Svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        <Defs>
          <LinearGradient id="lockerDoor" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#4C6EA8" />
            <Stop offset="0.5" stopColor="#5C81BE" />
            <Stop offset="1" stopColor="#43608F" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={height} fill="#39558A" />
        {doors.map((i) => {
          const x = i * doorW + 4;
          return (
            <G key={i}>
              <Rect x={x} y={16} width={doorW - 10} height={height - 40} rx={8} fill="url(#lockerDoor)" />
              <Rect x={x + 6} y={26} width={doorW - 22} height={16} rx={4} fill="#33507F" />
              {[0, 1, 2].map((v) => (
                <Rect key={v} x={x + 14} y={32 + v * 5} width={doorW - 38} height={2.4} rx={1.2} fill="#5F84C2" />
              ))}
              <Circle cx={x + doorW - 24} cy={height * 0.5} r={5} fill={palette.slateLight} />
              <Rect x={x + doorW - 28} y={height * 0.5 + 8} width={8} height={16} rx={3} fill="#33507F" />
              <Rect x={x + 12} y={height - 62} width={doorW - 34} height={16} rx={4} fill={palette.cream} opacity={0.85} />
            </G>
          );
        })}
        {/* bench */}
        <Rect x={0} y={height - 24} width={w} height={24} fill={palette.wood} />
        <Rect x={0} y={height - 24} width={w} height={6} fill="#D89A5D" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', overflow: 'hidden' },
});
