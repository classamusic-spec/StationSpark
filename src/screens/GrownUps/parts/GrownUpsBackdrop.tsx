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
import { FACADE_VB, StationFacade, TownBackdrop } from '@/world';
import { SHADOW_FILL } from '@/world/tone';

const APRON = 64;
/* below this the card already fills the frame and a building would crowd it */
const STATION_MIN_WIDTH = 820;

export function GrownUpsBackdrop({ bea = false }: { bea?: boolean }) {
  const { width, height } = useWindowDimensions();
  const w = Math.max(320, width);

  /*
   * ON A TABLET THE GATE WAS STANDING IN AN EMPTY SKY.
   *
   * The parent gate is a 330 px card, centred. On a phone it fills the frame;
   * on a 1024 px window it left roughly 350 px of flat blue on either side —
   * and this is the screen a *parent* judges the app on, at the moment they
   * decide whether it was worth paying for.
   *
   * So the station itself stands behind it on the right, cropped by the frame
   * the way a building is, on the same apron Captain Bea stands on at the left.
   * It is the home screen's own façade, not a second drawing of one, so the
   * grown-ups area is unmistakably the same place — and it costs no new art.
   */
  const stationW = width >= STATION_MIN_WIDTH
    ? Math.min(240, Math.round((height - APRON) * 0.62 * (FACADE_VB.w / FACADE_VB.h)))
    : 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <TownBackdrop hills={APRON + 150} cloudCount={2} sun={false} />
      {stationW > 0 ? (
        <View style={[styles.station, { right: -Math.round(stationW * 0.18), bottom: APRON - 6 }]}>
          <StationFacade width={stationW} />
        </View>
      ) : null}
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
  /* behind the apron's kerb line, so the building meets the ground */
  station: { position: 'absolute', opacity: 0.94 },
  bea: { position: 'absolute', left: 14, bottom: 14 },
});
