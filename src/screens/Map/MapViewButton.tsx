import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { Button } from '@/ui';

const HI = 'rgba(255,255,255,0.32)';
const SHADE = 'rgba(31,42,90,0.20)';

/** The town seen from far above: two blocks, a crossroads, a strip of grass. */
function WholeTownGlyph({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Rect x={2} y={3.4} width={20} height={18} rx={5} fill={palette.grassDark} />
      <Rect x={2} y={3.4} width={20} height={17} rx={5} fill={palette.grass} />
      <Rect x={2} y={11} width={20} height={3} fill="#9AA3B8" />
      <Rect x={10.6} y={3.4} width={3} height={18} fill="#9AA3B8" />
      <Rect x={4.6} y={6} width={4.4} height={3.6} rx={1} fill={palette.engineRed} />
      <Rect x={15.2} y={6} width={4.4} height={3.6} rx={1} fill={palette.cream} />
      <Rect x={4.6} y={15.4} width={4.4} height={3.6} rx={1} fill={palette.cream} />
      <Rect x={15.2} y={15.4} width={4.4} height={3.6} rx={1} fill={palette.safetyYellow} />
      <Rect x={2} y={3.4} width={20} height={3} rx={3} fill={HI} />
    </Svg>
  );
}

/** A magnifier with a plus — "take me closer". */
function ZoomInGlyph({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path d="M14.4 15.6 L 20.4 21.6" stroke={SHADE} strokeWidth={4.6} strokeLinecap="round" fill="none" />
      <Path d="M14 15 L 20 21" stroke={palette.navySoft} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Circle cx={10} cy={10} r={7.6} fill={palette.navySoft} />
      <Circle cx={10} cy={10} r={5.8} fill={palette.waterCyanLight} />
      <Path d="M7.2 7.6 a 5.8 5.8 0 0 1 3.6 -2" stroke={HI} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Rect x={9} y={6.6} width={2} height={6.8} rx={1} fill={palette.navy} />
      <Rect x={6.6} y={9} width={6.8} height={2} rx={1} fill={palette.navy} />
    </Svg>
  );
}

/**
 * The way back. A child who has dragged the town somewhere strange can always
 * press one button to see the whole of Spark City, and the same button takes
 * them back in again — so the map can never become a place to be lost in, and
 * zooming never depends on a pinch that small hands cannot make.
 */
export function MapViewButton({ framedWhole, onPress }: { framedWhole: boolean; onPress: () => void }) {
  return (
    <Button
      label={framedWhole ? 'Zoom In' : 'Whole Town'}
      accessibilityLabel={framedWhole ? 'Zoom in to the town' : 'See the whole town'}
      tone="white"
      size="md"
      sound="tap-soft"
      icon={framedWhole ? <ZoomInGlyph /> : <WholeTownGlyph />}
      onPress={onPress}
    />
  );
}
