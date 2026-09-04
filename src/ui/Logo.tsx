import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { fontFamily, palette } from '@/theme';
import { Text } from './Text';

/**
 * STATION SPARK wordmark: flame badge on gold rays, stacked white letters with
 * a red + navy outline. `size` is the total width.
 */
export function Logo({ size = 240, tagline = true }: { size?: number; tagline?: boolean }) {
  const w = size;
  const h = size * 0.78;
  const fs1 = size * 0.19;
  const fs2 = size * 0.26;
  const cx = w / 2;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.safetyYellow} />
            <Stop offset="1" stopColor={palette.engineRed} />
          </LinearGradient>
          <LinearGradient id="rays" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE07A" />
            <Stop offset="1" stopColor={palette.gold} />
          </LinearGradient>
        </Defs>
        {/* gold rays */}
        {[-38, -22, -8, 8, 22, 38].map((deg) => (
          <Path
            key={deg}
            d={`M ${cx} ${h * 0.27} l ${Math.sin((deg * Math.PI) / 180) * w * 0.26} ${-Math.cos((deg * Math.PI) / 180) * h * 0.27} l 6 4 z`}
            fill="url(#rays)"
            opacity={0.95}
          />
        ))}
        {/* flame badge */}
        <Circle cx={cx} cy={h * 0.2} r={size * 0.1} fill={palette.engineRed} stroke={palette.navy} strokeWidth={size * 0.014} />
        <Path
          d={`M ${cx} ${h * 0.09} c ${size * 0.05} ${size * 0.05} ${size * 0.06} ${size * 0.09} ${0} ${size * 0.15} c ${-size * 0.06} ${-size * 0.06} ${-size * 0.05} ${-size * 0.1} 0 ${-size * 0.15} z`}
          fill="url(#flame)"
        />
        <Path
          d={`M ${cx} ${h * 0.15} c ${size * 0.02} ${size * 0.025} ${size * 0.025} ${size * 0.045} ${0} ${size * 0.07} c ${-size * 0.025} ${-size * 0.025} ${-size * 0.02} ${-size * 0.045} 0 ${-size * 0.07} z`}
          fill={palette.flameCore}
        />
        {/* STATION */}
        {[
          { stroke: palette.navy, sw: size * 0.07 },
          { stroke: palette.engineRed, sw: size * 0.04 },
          { stroke: 'none', sw: 0 },
        ].map((l, i) => (
          <SvgText
            key={`s${i}`}
            x={cx}
            y={h * 0.52}
            fontFamily={fontFamily.display}
            fontSize={fs1}
            fontWeight="700"
            fill={palette.white}
            stroke={l.stroke}
            strokeWidth={l.sw}
            strokeLinejoin="round"
            textAnchor="middle"
          >
            STATION
          </SvgText>
        ))}
        {[
          { stroke: palette.navy, sw: size * 0.08 },
          { stroke: palette.engineRed, sw: size * 0.045 },
          { stroke: 'none', sw: 0 },
        ].map((l, i) => (
          <SvgText
            key={`p${i}`}
            x={cx}
            y={h * 0.86}
            fontFamily={fontFamily.display}
            fontSize={fs2}
            fontWeight="700"
            fill={palette.white}
            stroke={l.stroke}
            strokeWidth={l.sw}
            strokeLinejoin="round"
            textAnchor="middle"
          >
            SPARK
          </SvgText>
        ))}
      </Svg>
      {tagline ? (
        <Text variant="small" color={palette.navy} style={{ marginTop: -2 }}>
          Learn. Help. Rescue. Grow.
        </Text>
      ) : null}
    </View>
  );
}
