/**
 * The calm world behind the grown-ups area: fewer clouds, no sun bloom, the
 * hills, and the station apron along the bottom with Captain Bea standing on
 * it beside the parent gate. Still Station Spark — just quieter.
 */
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { CaptainBea } from '@/characters/CaptainBea';
import { TownBackdrop } from '@/world';
import { SHADOW_FILL } from '@/world/tone';

const APRON = 64;

export function GrownUpsBackdrop({ bea = false }: { bea?: boolean }) {
  const { width } = useWindowDimensions();
  const w = Math.max(320, width);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <TownBackdrop hills={APRON + 150} cloudCount={2} sun={false} />
      <View style={styles.apron}>
        <Svg width={w} height={APRON} viewBox={`0 0 ${w} ${APRON}`}>
          <Path d={`M 0 8 Q ${w / 2} -4 ${w} 8 L ${w} ${APRON} L 0 ${APRON} Z`} fill="#C4CCDE" />
          <Path d={`M 0 8 Q ${w / 2} -4 ${w} 8 L ${w} 16 Q ${w / 2} 4 0 16 Z`} fill="#DDE3F0" />
          <Rect x={0} y={APRON - 10} width={w} height={10} fill={SHADOW_FILL} opacity={0.12} />
          <Path d={`M ${w * 0.1} ${APRON * 0.62} H ${w * 0.9}`} stroke={palette.white} strokeWidth={3} strokeLinecap="round" strokeDasharray="22 16" opacity={0.45} />
        </Svg>
      </View>
      {bea ? (
        <View style={styles.bea}>
          <CaptainBea size={176} emotion="calm" pose="stand" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  apron: { position: 'absolute', left: 0, right: 0, bottom: 0, height: APRON },
  bea: { position: 'absolute', left: 14, bottom: 14 },
});
