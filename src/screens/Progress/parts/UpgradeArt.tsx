/**
 * UPGRADE ART — one little illustration per station upgrade, for the Sparks
 * shop shelf. Every piece is authored in the same 64×64 box in the sticker
 * language: flat base → one shade (`rgba(31,42,90,0.14)`) → one highlight
 * (`rgba(255,255,255,0.32)`), a navy contact ellipse under anything that
 * stands on the ground, palette tokens only, no outlines, no emoji.
 */
import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { StationUpgradeId } from '@/content/types';
import { palette } from '@/theme';
import { mix } from '@/characters/rig/palettes';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

const VB = 64;
const HI_STRONG = 'rgba(255,255,255,0.55)';
const dk = (c: string, a = 0.18) => mix(c, palette.navy, a);

const Ground = ({ cx = 32, cy = 57, rx = 22 }: { cx?: number; cy?: number; rx?: number }) => (
  <Ellipse cx={cx} cy={cy} rx={rx} ry={shadowRy(rx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
);

/** A four-point sparkle — the "shiny / new" mark. */
const Sparkle = ({ x, y, s = 1, fill = palette.white }: { x: number; y: number; s?: number; fill?: string }) => (
  <Path
    d={`M ${x} ${y - 4 * s} Q ${x + 1 * s} ${y - 1 * s} ${x + 4 * s} ${y} Q ${x + 1 * s} ${y + 1 * s} ${x} ${y + 4 * s} Q ${x - 1 * s} ${y + 1 * s} ${x - 4 * s} ${y} Q ${x - 1 * s} ${y - 1 * s} ${x} ${y - 4 * s} Z`}
    fill={fill}
    opacity={0.9}
  />
);

function Art({ id }: { id: StationUpgradeId }) {
  switch (id) {
    case 'bell-brass':
      return (
        <G>
          <Ground rx={18} />
          <Path d="M 13 56 L 13 30 A 19 19 0 0 1 51 30 L 51 56 Z" fill={palette.tanDark} />
          <Path d="M 17 56 L 17 31 A 15 15 0 0 1 47 31 L 47 56 Z" fill="#B5652F" />
          <Path d="M 17 56 L 17 31 A 15 15 0 0 1 47 31 L 47 56 L 40 56 L 40 33 A 9 9 0 0 0 26 33 L 26 56 Z" fill={SHADE} />
          <Rect x={29} y={15} width={6} height={7} rx={3} fill="#B87A0B" />
          <Path d="M 32 20 C 41 20 45 28 45 38 L 46 43 L 18 43 L 19 38 C 19 28 23 20 32 20 Z" fill="#F0B429" />
          <Path d="M 38 22 C 43 25 45 32 45 38 L 46 43 L 37 43 C 40 36 40 28 38 22 Z" fill="#B87A0B" opacity={0.5} />
          <Path d="M 26 24 C 23 28 22 33 22 38" stroke={HI_STRONG} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Rect x={16} y={42} width={32} height={5.5} rx={2.75} fill="#B87A0B" />
          <Ellipse cx={32} cy={50.5} rx={4} ry={4.4} fill="#B87A0B" />
          <Sparkle x={53} y={17} s={1.2} />
          <Sparkle x={11} y={24} s={0.8} />
        </G>
      );
    case 'flag-gold':
      return (
        <G>
          <Ground cx={22} rx={12} />
          <Rect x={19.5} y={7} width={5} height={50} rx={2.5} fill={palette.charcoal} />
          <Rect x={20.5} y={9} width={1.6} height={46} rx={0.8} fill={HIGHLIGHT} />
          <Circle cx={22} cy={6.5} r={4} fill={palette.gold} />
          <Path d="M 24 11 L 57 15.5 Q 51 25.5 57 35.5 L 24 40 Z" fill={palette.safetyYellow} />
          <Path d="M 24 30 L 56 33 Q 55.6 34.4 57 35.5 L 24 40 Z" fill={palette.goldDark} opacity={0.5} />
          <Path d="M 24 12 L 57 16.5 L 57 19.5 L 24 15.5 Z" fill={HIGHLIGHT} />
          <Sparkle x={52} y={44} s={0.9} fill={palette.safetyYellow} />
        </G>
      );
    case 'library-corner':
      return (
        <G>
          <Ground rx={26} />
          {/* a low bookshelf */}
          <Rect x={8} y={12} width={48} height={32} rx={4} fill={palette.wood} />
          <Rect x={11} y={16} width={42} height={24} rx={2} fill={palette.woodDark} />
          <Rect x={8} y={12} width={48} height={4} rx={2} fill={HIGHLIGHT} />
          {/* books standing on the shelf */}
          <Rect x={13} y={19} width={7} height={21} rx={1.5} fill={palette.engineRed} />
          <Rect x={21} y={22} width={6} height={18} rx={1.5} fill={palette.waterCyan} />
          <Rect x={28} y={18} width={7} height={22} rx={1.5} fill={palette.safetyYellow} />
          <Rect x={36} y={21} width={6} height={19} rx={1.5} fill={palette.purple} />
          <Rect x={43} y={19} width={8} height={21} rx={1.5} fill={palette.leafGreen} />
          <Rect x={13} y={19} width={38} height={4} fill={SHADE} />
          {/* the cushion in front */}
          <Ellipse cx={30} cy={52} rx={18} ry={7.5} fill={dk(palette.purple)} />
          <Ellipse cx={30} cy={50} rx={18} ry={7.5} fill={palette.purple} />
          <Ellipse cx={26} cy={47.5} rx={9} ry={3} fill={HIGHLIGHT} />
        </G>
      );
    case 'garden':
      return (
        <G>
          <Ground rx={26} />
          {/* sunflower */}
          <Path d="M 44 42 V 20" stroke={palette.leafGreenDark} strokeWidth={3} strokeLinecap="round" />
          <Path d="M 44 32 C 49 30 52 32 52 36 C 48 37 45 35 44 32 Z" fill={palette.leafGreen} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <Ellipse key={a} cx={44} cy={10} rx={3} ry={5.5} fill={palette.safetyYellow} transform={`rotate(${a} 44 17)`} />
          ))}
          <Circle cx={44} cy={17} r={5} fill={palette.woodDark} />
          <Circle cx={42.6} cy={15.6} r={1.6} fill={HIGHLIGHT} />
          {/* tomato plant */}
          <Path d="M 20 42 V 24" stroke={palette.leafGreen} strokeWidth={3} strokeLinecap="round" />
          <Path d="M 20 30 C 14 28 11 30 12 35 C 17 35 20 33 20 30 Z" fill={palette.leafGreen} />
          <Path d="M 20 26 C 26 23 29 26 28 30 C 23 31 20 29 20 26 Z" fill={palette.leafGreen} />
          <Circle cx={15} cy={37} r={4} fill={palette.engineRed} />
          <Circle cx={25} cy={35} r={4} fill={palette.engineRed} />
          <Circle cx={13.8} cy={35.8} r={1.3} fill={HIGHLIGHT} />
          {/* basil */}
          <Path d="M 32 43 V 34" stroke={palette.leafGreenDark} strokeWidth={2.4} strokeLinecap="round" />
          <Ellipse cx={29} cy={34} rx={4} ry={2.6} fill={palette.grass} transform="rotate(-30 29 34)" />
          <Ellipse cx={35} cy={33} rx={4} ry={2.6} fill={palette.grass} transform="rotate(30 35 33)" />
          {/* planter */}
          <Rect x={10} y={42} width={44} height={14} rx={3} fill={palette.wood} />
          <Rect x={40} y={42} width={14} height={14} rx={3} fill={SHADE} />
          <Rect x={8} y={40} width={48} height={6} rx={2} fill={palette.woodDark} />
          <Rect x={8} y={40} width={48} height={2} rx={1} fill={HIGHLIGHT} />
        </G>
      );
    case 'pet-area':
      return (
        <G>
          <Ground rx={27} />
          {/* pet bed */}
          <Ellipse cx={26} cy={46} rx={21} ry={11.5} fill={palette.engineRedDark} />
          <Ellipse cx={26} cy={44} rx={21} ry={11.5} fill={palette.engineRed} />
          <Ellipse cx={26} cy={46} rx={15} ry={7} fill={palette.cream} />
          <Ellipse cx={26} cy={47} rx={12} ry={4.5} fill={SHADE} />
          <Path d="M 8 40 A 21 11.5 0 0 1 20 34" stroke={HIGHLIGHT} strokeWidth={3} strokeLinecap="round" fill="none" />
          {/* bowls */}
          <Path d="M 44 46 L 60 46 L 58 54 A 3 3 0 0 1 55 56 L 49 56 A 3 3 0 0 1 46 54 Z" fill={palette.waterCyanDark} />
          <Ellipse cx={52} cy={46} rx={8} ry={3} fill={palette.waterCyan} />
          <Ellipse cx={52} cy={46} rx={5} ry={1.8} fill={palette.waterCyanLight} />
          {/* ball */}
          <Circle cx={53} cy={31} r={6.5} fill={palette.goldDark} />
          <Circle cx={52.4} cy={30.4} r={6.2} fill={palette.safetyYellow} />
          <Path d="M 47 29 Q 52 26 57.5 29" stroke={palette.engineRed} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Circle cx={50} cy={28} r={1.6} fill={HI_STRONG} />
        </G>
      );
    case 'reading-nook':
      return (
        <G>
          <Ground rx={27} />
          {/* bean bag */}
          <Path d="M 12 54 C 8 40 14 26 28 26 C 42 26 47 40 44 54 Z" fill={dk(palette.leafGreen)} />
          <Path d="M 10 52 C 6 38 12 24 26 24 C 40 24 45 38 42 52 Z" fill={palette.leafGreen} />
          <Path d="M 30 26 C 40 28 44 40 42 52 L 36 52 C 38 42 36 32 30 26 Z" fill={SHADE} />
          <Path d="M 16 34 C 18 29 22 27 26 27" stroke={HIGHLIGHT} strokeWidth={3} strokeLinecap="round" fill="none" />
          {/* lamp */}
          <Ellipse cx={54} cy={55} rx={6.5} ry={2.2} fill={palette.navySoft} />
          <Rect x={52.4} y={26} width={3.2} height={30} rx={1.6} fill={palette.navySoft} />
          <Ellipse cx={54} cy={30} rx={12} ry={5} fill={palette.safetyYellow} opacity={0.28} />
          <Path d="M 43 27 L 47 14 L 61 14 L 65 27 Z" fill={palette.gold} />
          <Path d="M 43 25.6 L 47 13 L 61 13 L 65 25.6 Z" fill={palette.safetyYellow} />
          <Path d="M 47 15 L 49 14" stroke={HI_STRONG} strokeWidth={2} strokeLinecap="round" />
          {/* picture books on the floor */}
          <Rect x={20} y={49} width={16} height={4} rx={1.5} fill={palette.engineRed} />
          <Rect x={22} y={45} width={14} height={4} rx={1.5} fill={palette.waterCyan} />
        </G>
      );
    case 'community-table':
      return (
        <G>
          <Ground rx={29} cy={58} />
          {/* legs */}
          <Rect x={10} y={40} width={5} height={16} rx={2} fill={palette.woodDark} />
          <Rect x={49} y={40} width={5} height={16} rx={2} fill={palette.woodDark} />
          {/* table with a red-check cloth */}
          <Rect x={4} y={28} width={56} height={13} rx={3} fill={palette.cream} />
          {[8, 20, 32, 44].map((x) => (
            <Rect key={x} x={x} y={29} width={6} height={5} fill={palette.engineRed} opacity={0.75} />
          ))}
          {[14, 26, 38, 50].map((x) => (
            <Rect key={x} x={x} y={34} width={6} height={5} fill={palette.engineRed} opacity={0.75} />
          ))}
          <Rect x={4} y={39} width={56} height={4} rx={2} fill={palette.woodDark} />
          <Rect x={4} y={28} width={56} height={2.5} rx={1} fill={HIGHLIGHT} />
          {/* plates and cups */}
          <Ellipse cx={17} cy={27} rx={7} ry={2.8} fill={palette.white} />
          <Ellipse cx={32} cy={27} rx={7} ry={2.8} fill={palette.white} />
          <Ellipse cx={47} cy={27} rx={7} ry={2.8} fill={palette.white} />
          <Ellipse cx={17} cy={27} rx={4} ry={1.6} fill={palette.slateLight} />
          <Ellipse cx={32} cy={27} rx={4} ry={1.6} fill={palette.slateLight} />
          <Ellipse cx={47} cy={27} rx={4} ry={1.6} fill={palette.slateLight} />
          <Rect x={24} y={17} width={5} height={7} rx={1.5} fill={palette.waterCyan} />
          <Rect x={39} y={17} width={5} height={7} rx={1.5} fill={palette.safetyYellow} />
          <Rect x={24} y={17} width={5} height={2} rx={1} fill={HIGHLIGHT} />
        </G>
      );
    case 'festival-lights':
      return (
        <G>
          <Path d="M 3 12 Q 32 30 61 12" stroke={palette.charcoal} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {[
            { x: 9, y: 14.6, c: palette.pink },
            { x: 21, y: 19.4, c: palette.waterCyan },
            { x: 33, y: 20.4, c: palette.safetyYellow },
            { x: 45, y: 18.4, c: palette.purple },
            { x: 57, y: 13, c: palette.leafGreen },
          ].map((f) => (
            <G key={f.x}>
              <Rect x={f.x - 4.5} y={f.y} width={9} height={12} rx={1.5} fill={f.c} />
              <Path d={`M ${f.x - 4.5} ${f.y + 12} l 2.2 -2.4 l 2.3 2.4 l 2.2 -2.4 l 2.3 2.4 z`} fill={palette.white} opacity={0.35} />
              <Circle cx={f.x} cy={f.y + 4.5} r={1.4} fill={palette.white} opacity={0.9} />
              <Circle cx={f.x - 2.2} cy={f.y + 8.4} r={0.9} fill={palette.white} opacity={0.9} />
              <Circle cx={f.x + 2.2} cy={f.y + 8.4} r={0.9} fill={palette.white} opacity={0.9} />
            </G>
          ))}
          {[15, 27, 39, 51].map((x, i) => {
            const y = 12 + Math.sin(((x - 3) / 58) * Math.PI) * 9;
            return (
              <G key={x}>
                <Circle cx={x} cy={y + 5} r={5.5} fill="#FFE07A" opacity={0.3} />
                <Rect x={x - 1.5} y={y} width={3} height={3} rx={1} fill={palette.charcoal} />
                <Circle cx={x} cy={y + 5} r={3} fill={i % 2 ? '#FFE07A' : palette.safetyYellow} />
                <Circle cx={x - 1} cy={y + 4} r={1} fill={HI_STRONG} />
              </G>
            );
          })}
          {/* the bulbs throw a little warmth on the ground */}
          <Ellipse cx={32} cy={52} rx={22} ry={4} fill={palette.safetyYellow} opacity={0.18} />
        </G>
      );
    case 'map-room-2':
      return (
        <G>
          <Ground rx={20} cy={58} />
          <Rect x={5} y={8} width={54} height={42} rx={5} fill={palette.tanDark} />
          <Rect x={8} y={11} width={48} height={36} rx={3.5} fill={palette.cream} />
          <Path d="M 8 30 Q 20 24 30 32 Q 40 40 56 30 L 56 47 L 8 47 Z" fill="#B6E39A" />
          <Path d="M 8 20 Q 22 12 30 22 Q 38 32 56 18 L 56 25 Q 38 40 30 28 Q 22 18 8 26 Z" fill={palette.waterCyanLight} />
          <Rect x={30} y={11} width={4.5} height={36} fill="#DDE2EF" />
          <Rect x={8} y={36} width={48} height={4.5} fill="#DDE2EF" />
          {[
            [18, 18],
            [44, 24],
            [38, 41],
          ].map(([x, y]) => (
            <G key={`${x}-${y}`}>
              <Path d={`M ${x} ${y! - 8} a 4.5 4.5 0 0 1 4.5 4.5 c 0 3.4 -4.5 8 -4.5 8 s -4.5 -4.6 -4.5 -8 a 4.5 4.5 0 0 1 4.5 -4.5 z`} fill={palette.engineRed} />
              <Circle cx={x} cy={y! - 3.6} r={1.6} fill={palette.white} />
            </G>
          ))}
          <Rect x={8} y={11} width={48} height={3} rx={1.5} fill={HIGHLIGHT} />
          {/* the little rolling chair */}
          <Rect x={40} y={50} width={12} height={4} rx={2} fill={palette.navySoft} />
          <Rect x={45} y={53} width={2} height={4} fill={palette.navySoft} />
          <Rect x={42} y={56} width={8} height={2} rx={1} fill={palette.navySoft} />
        </G>
      );
    case 'roof-garden':
      return (
        <G>
          <Ground rx={28} cy={58} />
          {/* the roof ledge */}
          <Rect x={4} y={44} width={56} height={12} rx={3} fill={palette.tan} />
          <Rect x={4} y={44} width={56} height={4} rx={2} fill={palette.tanDark} />
          <Rect x={4} y={53} width={56} height={3} fill={SHADE} />
          {/* planters */}
          <Rect x={8} y={35} width={17} height={11} rx={2} fill={palette.wood} />
          <Rect x={39} y={35} width={17} height={11} rx={2} fill={palette.wood} />
          <Rect x={8} y={35} width={17} height={2.5} rx={1} fill={HIGHLIGHT} />
          <Rect x={39} y={35} width={17} height={2.5} rx={1} fill={HIGHLIGHT} />
          {/* shrubs and flowers */}
          <Circle cx={13} cy={31} r={6} fill={palette.grass} />
          <Circle cx={20} cy={29} r={7} fill={palette.leafGreen} />
          <Circle cx={22} cy={31} r={4} fill={SHADE} />
          <Circle cx={15} cy={25} r={2.4} fill={palette.pink} />
          <Circle cx={21} cy={23} r={2.4} fill={palette.safetyYellow} />
          <Circle cx={45} cy={30} r={6.5} fill={palette.leafGreen} />
          <Circle cx={52} cy={32} r={5} fill={palette.grass} />
          <Circle cx={47} cy={24} r={2.4} fill={palette.purple} />
          <Circle cx={52} cy={27} r={2} fill={palette.pink} />
          {/* a little bench between them */}
          <Rect x={27} y={37} width={10} height={3} rx={1.5} fill={palette.woodDark} />
          <Rect x={28} y={40} width={2} height={5} fill={palette.woodDark} />
          <Rect x={34} y={40} width={2} height={5} fill={palette.woodDark} />
          <Path d="M 4 44 A 40 10 0 0 1 20 42" stroke={HIGHLIGHT} strokeWidth={2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'world-map':
      return (
        <G>
          <Ground rx={22} cy={58} />
          <Rect x={5} y={9} width={54} height={42} rx={8} fill={palette.waterCyanDark} />
          <Rect x={7} y={11} width={50} height={38} rx={7} fill={palette.waterCyan} />
          <Path d="M 12 22 c 6 -7 15 -3 13 5 c -2 6 -11 9 -13 3 z" fill={palette.leafGreen} />
          <Path d="M 33 16 c 8 -4 17 2 15 10 c -2 8 -13 11 -15 4 z" fill={palette.leafGreen} />
          <Path d="M 27 36 c 5 -3 11 1 9 7 c -2 4 -10 5 -9 -1 z" fill={palette.leafGreen} />
          <Path d="M 44 36 c 4 -2 8 1 7 5 c -1 3 -7 4 -7 0 z" fill={palette.grass} />
          {[
            [19, 24],
            [42, 22],
            [32, 41],
          ].map(([x, y]) => (
            <G key={`${x}-${y}`}>
              <Circle cx={x} cy={y} r={2.8} fill={palette.engineRedDark} />
              <Circle cx={x} cy={y! - 0.6} r={2.6} fill={palette.engineRed} />
              <Circle cx={x} cy={y! - 0.8} r={1} fill={palette.white} />
            </G>
          ))}
          <Path d="M 12 14 Q 30 12 52 14" stroke={HIGHLIGHT} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Rect x={5} y={9} width={54} height={42} rx={8} fill="none" />
          <Rect x={23} y={51} width={18} height={5} rx={2} fill={palette.tanDark} />
        </G>
      );
    case 'kitchen-2':
      return (
        <G>
          <Ground rx={26} />
          {/* pot + steam */}
          <Circle cx={19} cy={10} r={2.6} fill={palette.white} opacity={0.75} />
          <Circle cx={24} cy={7} r={2} fill={palette.white} opacity={0.6} />
          <Rect x={13} y={13} width={16} height={11} rx={3} fill={palette.waterCyanDark} />
          <Rect x={11} y={12} width={20} height={3.5} rx={1.75} fill={palette.waterCyan} />
          <Rect x={15} y={16} width={4} height={6} rx={2} fill={HIGHLIGHT} />
          {/* range */}
          <Rect x={10} y={24} width={44} height={32} rx={4} fill={palette.white} />
          <Rect x={44} y={24} width={10} height={32} rx={4} fill={SHADE} />
          <Rect x={10} y={24} width={44} height={2.5} rx={1} fill={HI_STRONG} />
          <Ellipse cx={20} cy={25} rx={6} ry={2.4} fill={palette.charcoal} />
          <Ellipse cx={40} cy={25} rx={6} ry={2.4} fill={palette.charcoal} />
          <Ellipse cx={40} cy={25} rx={3} ry={1.2} fill={palette.charcoalDark} />
          <Rect x={16} y={30} width={32} height={3} rx={1.5} fill={palette.slateLight} />
          <Rect x={16} y={35} width={32} height={18} rx={3} fill={palette.engineRed} />
          <Rect x={16} y={35} width={32} height={2.5} rx={1} fill={HIGHLIGHT} />
          <Rect x={21} y={39} width={22} height={8} rx={2} fill={palette.navySoft} />
          <Rect x={23} y={40.5} width={7} height={5} rx={1.5} fill={HIGHLIGHT} />
          <Circle cx={22} cy={33.2} r={1.4} fill={palette.navySoft} />
          <Circle cx={42} cy={33.2} r={1.4} fill={palette.navySoft} />
        </G>
      );
    case 'training-tower':
      return (
        <G>
          <Ground rx={22} />
          {/* flag on top */}
          <Rect x={31} y={0} width={2} height={9} rx={1} fill={palette.charcoal} />
          <Path d="M 33 1 L 43 3 L 33 6 Z" fill={palette.safetyYellow} />
          {/* tower */}
          <Rect x={18} y={20} width={26} height={36} rx={3} fill={palette.wood} />
          <Rect x={36} y={20} width={8} height={36} rx={2} fill={SHADE} />
          <Rect x={20} y={22} width={3} height={32} rx={1.5} fill={HIGHLIGHT} />
          <Path d="M 12 21 L 31 7 L 50 21 Z" fill={palette.engineRed} />
          <Path d="M 31 7 L 50 21 L 44 21 L 31 11 Z" fill={SHADE} />
          <Rect x={10} y={19} width={42} height={5} rx={2.5} fill={palette.engineRedDark} />
          <Rect x={26} y={27} width={10} height={9} rx={2} fill="#33477A" />
          <Rect x={27.5} y={28.5} width={3} height={6} rx={1} fill={HIGHLIGHT} />
          {/* side ladder */}
          <Rect x={48} y={26} width={3} height={30} rx={1.5} fill={palette.slateLight} />
          <Rect x={56} y={26} width={3} height={30} rx={1.5} fill={palette.slateLight} />
          {[30, 38, 46].map((y) => (
            <Rect key={y} x={48} y={y} width={11} height={3} rx={1.5} fill={palette.slate} />
          ))}
          {/* soft landing mat */}
          <Rect x={8} y={51} width={20} height={5} rx={2.5} fill={palette.waterCyan} />
        </G>
      );
    case 'garden-pond':
      return (
        <G>
          <Ground rx={28} cy={58} />
          <Ellipse cx={32} cy={45} rx={27} ry={11} fill={palette.waterCyanDark} />
          <Ellipse cx={32} cy={43} rx={25} ry={10} fill={palette.waterCyan} />
          <Ellipse cx={24} cy={41} rx={10} ry={3} fill={palette.waterCyanLight} opacity={0.7} />
          {/* reeds */}
          <Path d="M 11 42 C 10 34 11 26 13 20" stroke={palette.leafGreenDark} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Path d="M 16 43 C 16 36 16 30 19 24" stroke={palette.leafGreen} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Rect x={11.5} y={17} width={3.5} height={7} rx={1.75} fill={palette.woodDark} />
          {/* stones */}
          <Ellipse cx={50} cy={54} rx={6} ry={3} fill={palette.slate} />
          <Ellipse cx={49.4} cy={53.2} rx={5.4} ry={2.6} fill={palette.slateLight} />
          <Ellipse cx={57} cy={50} rx={4} ry={2.2} fill={palette.slateLight} />
          {/* duckling */}
          <Ellipse cx={36} cy={38} rx={7} ry={5} fill={palette.goldDark} />
          <Ellipse cx={35.4} cy={37.4} rx={7} ry={5} fill={palette.safetyYellow} />
          <Circle cx={41} cy={31.5} r={4.6} fill={palette.safetyYellow} />
          <Path d="M 45 32 L 49 33 L 45 34.6 Z" fill={palette.orange} />
          <Circle cx={42.4} cy={30.6} r={1} fill={palette.navy} />
          <Path d="M 29 36 Q 32 33 36 34" stroke={HIGHLIGHT} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M 28 44 Q 33 46 38 44" stroke={palette.waterCyanLight} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.8} />
        </G>
      );
    case 'truck-bay-2':
      return (
        <G>
          <Ground rx={26} cy={58} />
          <Rect x={6} y={11} width={52} height={45} rx={4} fill={palette.tan} />
          <Rect x={50} y={11} width={8} height={45} fill={SHADE} />
          <Rect x={4} y={8} width={56} height={7} rx={3} fill={palette.engineRed} />
          <Rect x={4} y={13} width={56} height={3} fill={palette.engineRedDark} />
          <Rect x={6} y={16} width={52} height={4} fill={SHADE} opacity={0.6} />
          {/* bay door */}
          <Rect x={12} y={22} width={40} height={34} rx={3} fill={palette.engineRed} />
          <Rect x={12} y={22} width={40} height={5} rx={2} fill={palette.engineRedDark} />
          <Rect x={16} y={30} width={32} height={6} rx={2} fill="#3D6FB0" />
          <Rect x={18} y={31} width={6} height={4} rx={1} fill={HIGHLIGHT} />
          <Rect x={13} y={40} width={38} height={2.5} rx={1} fill={SHADE} />
          <Rect x={13} y={47} width={38} height={2.5} rx={1} fill={SHADE} />
          {/* the little rescue van */}
          <Rect x={33} y={41} width={24} height={13} rx={3} fill={palette.goldDark} />
          <Rect x={33} y={40} width={24} height={12} rx={3} fill={palette.safetyYellow} />
          <Rect x={48} y={42} width={7} height={5.5} rx={1.5} fill="#8FC9F2" />
          <Rect x={33} y={46} width={24} height={2.6} fill={palette.engineRed} />
          <Circle cx={39} cy={53} r={3.2} fill="#2B3466" />
          <Circle cx={51} cy={53} r={3.2} fill="#2B3466" />
          <Circle cx={39} cy={53} r={1.3} fill={palette.slateLight} />
          <Circle cx={51} cy={53} r={1.3} fill={palette.slateLight} />
          <Rect x={35} y={41.5} width={9} height={2} rx={1} fill={HIGHLIGHT} />
        </G>
      );
    case 'mural':
    default:
      return (
        <G>
          <Ground rx={24} cy={59} />
          <Rect x={4} y={7} width={56} height={45} rx={5} fill={palette.tanDark} />
          <Rect x={7} y={10} width={50} height={39} rx={4} fill="#CFE9FF" />
          <Circle cx={46} cy={20} r={5.5} fill={palette.safetyYellow} />
          <Circle cx={46} cy={20} r={8.5} fill={palette.safetyYellow} opacity={0.25} />
          <Path d="M 7 40 Q 20 27 33 37 Q 45 45 57 33 L 57 49 L 7 49 Z" fill={palette.grass} />
          <Path d="M 7 46 Q 22 38 36 44 Q 48 49 57 44 L 57 49 L 7 49 Z" fill={palette.leafGreen} />
          {/* the tiny painted station */}
          <Rect x={16} y={31} width={12} height={9} rx={1.5} fill={palette.cream} />
          <Path d="M 14 32 L 22 25 L 30 32 Z" fill={palette.engineRed} />
          <Rect x={20} y={35} width={4} height={5} rx={1} fill={palette.engineRed} />
          {/* and the child, painted in */}
          <Circle cx={40} cy={35} r={2.8} fill="#F0B98A" />
          <Path d="M 37 46 L 37 39 A 3 3 0 0 1 43 39 L 43 46 Z" fill="#26315F" />
          <Path d="M 37 42 h 6" stroke={palette.safetyYellow} strokeWidth={1.2} />
          <Path d="M 36.6 32.4 h 6.8 l -1 -2.4 h -4.8 z" fill={palette.engineRed} />
          {/* paint tin and brush at the foot of the wall */}
          <Rect x={47} y={50} width={10} height={8} rx={1.5} fill={palette.waterCyanDark} />
          <Rect x={47} y={50} width={10} height={2.5} rx={1} fill={palette.waterCyan} />
          <Rect x={52} y={44} width={2.4} height={9} rx={1.2} fill={palette.woodDark} transform="rotate(20 53 48)" />
          <Rect x={7} y={10} width={50} height={2.5} rx={1} fill={HIGHLIGHT} />
        </G>
      );
  }
}

export interface UpgradeArtProps {
  id: StationUpgradeId;
  size?: number;
}

/** A drawn sticker for a station upgrade, `size` px square. */
export const UpgradeArt = memo(function UpgradeArt({ id, size = 64 }: UpgradeArtProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} accessibilityLabel={id.replace(/-/g, ' ')} pointerEvents="none">
      <Art id={id} />
    </Svg>
  );
});
