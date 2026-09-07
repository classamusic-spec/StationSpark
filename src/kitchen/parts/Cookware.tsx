import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';

/**
 * THE STATION'S STOCK POT — one pot, one kitchen.
 *
 * Soup Pot and Recipe Scale both cook in it, and they used to carry a copy of
 * the drawing each: two pots that drifted apart, both a single flat red with a
 * left-to-right gradient so faint that at tablet size the biggest object on the
 * screen had no light on it at all.
 *
 * This is that pot with its materials drawn, in the room's one light direction
 * (up and to the left):
 *
 *   - vitreous enamel: a broad soft specular down the lit side, a tight bright
 *     line inside it, a cool reflection on the shaded side
 *   - the bounce a lit ring throws back up into the foot, warm and low
 *   - ambient occlusion where the body turns under, and two contact shadows
 *   - a rolled steel rim with a lit top-left arc and its underside in shadow
 *   - broth that is deepest at the wall and brightest where the light lands,
 *     with the sheen a liquid surface always has
 *
 * `level` is how full it is: `brim` for a pot being filled (Soup Pot floats the
 * ingredients on that surface), `low` for one being stirred, where you can see
 * down the enamel wall to the broth.
 */
export const POT_VIEWBOX = { w: 236, h: 168 };
/** the drawing's width ÷ height — layouts size the pot from this */
export const POT_ASPECT = POT_VIEWBOX.w / POT_VIEWBOX.h;

export function StockPot({
  size,
  bubbling = false,
  level = 'brim',
}: {
  size: number;
  bubbling?: boolean;
  level?: 'brim' | 'low';
}) {
  /* the broth surface: at the brim for a pot being filled, a hand lower for one
     being stirred, so a child can see down the inside wall */
  const brothY = level === 'brim' ? 40 : 47;
  const brothRx = level === 'brim' ? 84 : 73;
  const brothRy = level === 'brim' ? 15 : 12;

  return (
    <Svg width={size} height={size / POT_ASPECT} viewBox="0 0 236 168">
      <Defs>
        {/* enamel is a cylinder: dark at both edges, lit left of centre */}
        <LinearGradient id="spBody" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#9C1F16" />
          <Stop offset="0.16" stopColor={palette.engineRedDark} />
          <Stop offset="0.38" stopColor={palette.engineRed} />
          <Stop offset="0.62" stopColor="#DB3729" />
          <Stop offset="1" stopColor="#9C1F16" />
        </LinearGradient>
        {/* and a cylinder standing on a hob is darker at the foot and warmer
            where the ring bounces back into it */}
        <LinearGradient id="spFoot" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF8A3D" stopOpacity={0} />
          <Stop offset="1" stopColor="#FFB324" stopOpacity={0.4} />
        </LinearGradient>
        <LinearGradient id="spAO" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.3} />
        </LinearGradient>
        <LinearGradient id="spSteel" x1="0" y1="0" x2="0.35" y2="1">
          <Stop offset="0" stopColor="#EDF0F7" />
          <Stop offset="0.5" stopColor="#AFB9D2" />
          <Stop offset="1" stopColor="#7E89AC" />
        </LinearGradient>
        <LinearGradient id="spBand" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#E9D6B4" />
          <Stop offset="0.3" stopColor="#FFF8EA" />
          <Stop offset="1" stopColor="#E2CCA6" />
        </LinearGradient>
        <RadialGradient id="spBroth" cx="40%" cy="30%" r="76%">
          <Stop offset="0" stopColor="#FFDC94" />
          <Stop offset="0.55" stopColor="#FFC463" />
          <Stop offset="1" stopColor="#D07E1E" />
        </RadialGradient>
      </Defs>

      {/* what the pot lays on the ring */}
      <Ellipse cx={118} cy={161} rx={96} ry={10} fill="rgba(31,42,90,0.10)" />
      <Ellipse cx={118} cy={159} rx={80} ry={7} fill="rgba(31,42,90,0.22)" />

      {/* handles: cast steel, lit on top, with a rivet and the shadow they
          throw where they meet the body */}
      <G>
        <Rect x={0} y={52} width={34} height={18} rx={9} fill="#5B6690" />
        <Rect x={0} y={52} width={34} height={9} rx={4.5} fill="#8B95B7" />
        <Rect x={4} y={54} width={22} height={4} rx={2} fill="rgba(255,255,255,0.5)" />
        <Rect x={202} y={52} width={34} height={18} rx={9} fill="#5B6690" />
        <Rect x={202} y={52} width={34} height={9} rx={4.5} fill="#8B95B7" />
        <Rect x={206} y={54} width={22} height={4} rx={2} fill="rgba(255,255,255,0.42)" />
      </G>

      {/* body */}
      <Path d="M25 40h186l-13 100a12 12 0 0 1-12 10H50a12 12 0 0 1-12-10z" fill="url(#spBody)" />
      {/* the broad, soft specular down the lit side, and the tight line in it */}
      <Path d="M43 50c-6 34-6 62-2 92l25-1c-5-30-5-58 0-92z" fill="rgba(255,255,255,0.20)" />
      <Path d="M50 55c-4 30-4 56-1 82h10c-3-26-3-52 0-82z" fill="rgba(255,255,255,0.42)" />
      {/* the cool reflection the shaded side always carries */}
      <Path d="M191 52c4 34 3 62 0 90l-19-1c4-28 4-56 1-89z" fill="rgba(31,42,90,0.13)" />
      {/* the foot: shadow under the turn, warmth bounced back off the ring */}
      <Path d="M36 116h164l-2 24a12 12 0 0 1-12 10H50a12 12 0 0 1-12-10z" fill="url(#spAO)" />
      <Path d="M40 130h156l-1 10a12 12 0 0 1-12 10H53a12 12 0 0 1-12-10z" fill="url(#spFoot)" />
      <Path d="M44 140h148l-2 8a10 10 0 0 1-10 8H56a10 10 0 0 1-10-8z" fill="#8E1B12" />
      <Path d="M46 141h50l-1 5H47z" fill="rgba(255,255,255,0.14)" />

      {/* enamel band: it wraps the pot, so it is lit and shaded with it */}
      <Path d="M31 92h174l-3 22H34z" fill="url(#spBand)" />
      <Path d="M31 92h174l-0.5 4H31.5z" fill="rgba(255,255,255,0.7)" />
      <Path d="M34 110h168l-0.4 4H34.4z" fill="rgba(31,42,90,0.09)" />
      <Circle cx={90} cy={103} r={5} fill={palette.engineRed} opacity={0.55} />
      <Circle cx={118} cy={103} r={5} fill={palette.safetyYellow} />
      <Circle cx={146} cy={103} r={5} fill={palette.engineRed} opacity={0.55} />

      {/* the rolled rim: its underside in shadow, its face in steel, a lit
          top-left arc and a shaded lower-right one */}
      <Ellipse cx={118} cy={44} rx={97} ry={21} fill="#7E89AC" />
      <Ellipse cx={118} cy={40} rx={97} ry={21} fill="url(#spSteel)" />
      <Ellipse cx={118} cy={39} rx={97} ry={20} fill={palette.white} />
      <Path
        d="M26 32A97 20 0 0 1 122 19"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M212 45A97 20 0 0 1 118 59"
        stroke="rgba(31,42,90,0.11)"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />

      {/* down the inside: enamel wall, then the broth */}
      <Ellipse cx={118} cy={41} rx={87} ry={17} fill="#8E1B12" />
      <Ellipse cx={118} cy={43} rx={87} ry={16} fill="#6E120C" />
      {level === 'low' ? <Ellipse cx={118} cy={46} rx={80} ry={14} fill="#5E0E09" /> : null}
      <Ellipse cx={118} cy={brothY} rx={brothRx} ry={brothRy} fill="url(#spBroth)" />
      {/* the wall shades the broth where it hugs it, and the surface catches the
          light like every liquid does */}
      <Ellipse
        cx={118}
        cy={brothY}
        rx={brothRx}
        ry={brothRy}
        fill="none"
        stroke="rgba(110,18,12,0.34)"
        strokeWidth={3.5}
      />
      <Ellipse cx={96} cy={brothY - brothRy * 0.42} rx={brothRx * 0.3} ry={brothRy * 0.3} fill="rgba(255,255,255,0.4)" />
      {bubbling ? (
        <G>
          <Circle cx={88} cy={brothY + 6} r={4.6} fill="rgba(255,255,255,0.62)" />
          <Circle cx={134} cy={brothY + 9} r={3.4} fill="rgba(255,255,255,0.5)" />
          <Circle cx={154} cy={brothY + 4} r={3} fill="rgba(255,255,255,0.55)" />
          {level === 'brim' ? <Circle cx={110} cy={brothY + 11} r={2.6} fill="rgba(255,255,255,0.45)" /> : null}
        </G>
      ) : null}
    </Svg>
  );
}
