/**
 * The five shopfronts: bakery, pizza shop, pet shop, library and market.
 *
 * Each is authored once in its own design box — `SCENE_W` (300) wide, `height`
 * tall, with the ground line at `y = height` — and `frame.ts` decides how big
 * that box is drawn in the panel it was handed. Every one carries detail at
 * three scales so the eye has somewhere to go at any zoom:
 *
 *   1. the mass — wall, roof, side plane, base course;
 *   2. the features — windows with mullions and sills, a door with a handle and
 *      a step, a sign in a frame, an awning with a scalloped valance;
 *   3. the dressing — a crate, a bicycle, a cat, a bin, a planter, a puddle,
 *      crumbs, a chalkboard. `detail` is false on a dispatch-slip thumbnail,
 *      where that third scale would only be mud.
 */
import React from 'react';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fontFamily, palette } from '@/theme';
import { rp, rowOf } from './frame';
import type { SceneDef } from './types';
import {
  ArchWindow,
  BaseShadow,
  Awning,
  Bench,
  Bicycle,
  Bin,
  Brickwork,
  Bunting,
  Cat,
  Chalkboard,
  Contact,
  Crate,
  CrateStack,
  DoorBell,
  GLASS,
  GLASS_WARM,
  HIGHLIGHT,
  Pigeon,
  PitchedRoof,
  Planter,
  Parapet,
  Puddle,
  Railing,
  SHADE,
  SHADE_DEEP,
  SHADE_SOFT,
  ShopDoor,
  SignBoard,
  SignBracket,
  Steps,
  TileField,
  WindowGrid,
} from './parts';

/** The side return every near building shows — 2.5D, never an elevation. */
function SideReturn({ x, y, w, h, wall }: { x: number; y: number; w: number; h: number; wall: string }) {
  return (
    <G>
      <Path d={`M ${x} ${y} L ${x + w} ${y + w * 0.62} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={wall} />
      <Path d={`M ${x} ${y} L ${x + w} ${y + w * 0.62} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={SHADE} />
    </G>
  );
}

/* ================================================================== */
/* BAKERY                                                              */
/* ================================================================== */

const BAKERY_H = 238;

function bakeryArt(detail: boolean) {
  const wall = '#F6E3C0';
  return (
    <G>
      <BaseShadow cx={150} y={241} rx={148} />
      <SideReturn x={272} y={64} w={16} h={174} wall={wall} />

      {/* mass: wall, brick above, a tiled shopfront skin, a base course */}
      <Rect x={22} y={56} width={252} height={182} rx={6} fill={wall} />
      <Rect x={22} y={56} width={40} height={182} fill="rgba(255,255,255,0.18)" />
      <Brickwork x={26} y={64} w={244} h={82} bw={22} bh={11} />
      <Rect x={22} y={146} width={252} height={92} fill="#EFE0D2" />
      <TileField x={22} y={146} w={252} h={92} size={16} />
      <Rect x={22} y={144} width={252} height={6} rx={3} fill={palette.tanDark} />
      <Rect x={22} y={224} width={252} height={14} rx={4} fill="#C98F63" />
      <Rect x={22} y={224} width={252} height={4} rx={2} fill={HIGHLIGHT} />

      {/* roof + chimney */}
      <Rect x={206} y={12} width={20} height={46} rx={3} fill="#B9583C" />
      <Rect x={206} y={12} width={7} height={46} fill={HIGHLIGHT} />
      <Rect x={202} y={6} width={28} height={9} rx={4} fill="#8F3F28" />
      <PitchedRoof x={22} y={56} w={252} rise={38} over={14} tone={palette.engineRed} toneDark={palette.engineRedDark} />

      {/* upper storey: two mullioned windows with sills + a window box */}
      <WindowGrid rows={1} cols={2} x={46} y={66} w={50} h={38} dx={158} dy={0} glass={GLASS} frame={palette.cream} mullions={[1, 1]} />
      <G>
        <Rect x={40} y={111} width={62} height={9} rx={3} fill={palette.woodDark} />
        <Circle cx={52} cy={109} r={5} fill="#4FA858" />
        <Circle cx={64} cy={107} r={5.4} fill={palette.pink} />
        <Circle cx={78} cy={108} r={5} fill="#5CB861" />
        <Circle cx={90} cy={109} r={4.6} fill={palette.safetyYellow} />
      </G>

      {/* the bread roundel between them */}
      <G>
        <Circle cx={150} cy={88} r={24} fill={palette.cream} />
        <Circle cx={150} cy={88} r={24} fill="none" stroke={palette.tanDark} strokeWidth={4} />
        <Path d="M 134 91 q 16 -17 32 0 q -16 10 -32 0 z" fill="#D6A05A" />
        <Path d="M 140 86 l 5 5 M 150 83 l 5 5 M 160 86 l 5 5" stroke="#B47C3C" strokeWidth={2.4} strokeLinecap="round" />
        <Ellipse cx={142} cy={82} rx={6} ry={2.6} fill={HIGHLIGHT} />
      </G>

      <SignBoard x={58} y={118} w={184} h={26} label="BAKERY" />

      {/* shopfront: awning, display window, door */}
      <Awning x={28} y={148} w={152} h={20} bands={7} stripe={palette.engineRed} alt={palette.cream} />
      <Rect x={28} y={184} width={152} height={38} rx={6} fill="#7A4A24" />
      <Rect x={33} y={189} width={142} height={28} rx={4} fill="#BBDCF2" />
      <Path d="M 36 215 L 80 191 L 98 191 L 54 215 Z" fill={palette.white} opacity={0.28} />
      <Rect x={102} y={189} width={3} height={28} fill="#7A4A24" opacity={0.9} />
      <Rect x={35} y={210} width={138} height={3} rx={1.5} fill={palette.wood} />
      {/* bread on the shelf */}
      <Ellipse cx={52} cy={203} rx={13} ry={6.4} fill="#E3A960" />
      <Path d="M 44 201 l 4 4 M 52 199 l 4 4 M 60 201 l 4 4" stroke="#B47C3C" strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={70} y={197} width={28} height={7} rx={3.5} fill="#D69B52" />
      <Rect x={72} y={204} width={24} height={5.4} rx={2.7} fill="#E8B978" />
      <Circle cx={116} cy={205} r={4.4} fill="#E8B978" />
      <Circle cx={127} cy={205} r={4.4} fill="#E3A960" />
      <Circle cx={138} cy={205} r={4.4} fill="#E8B978" />
      {/* the price card */}
      <Rect x={148} y={195} width={22} height={14} rx={3} fill={palette.cream} />
      <Path d={rp(151, 199, 15, 2.4) + rp(151, 204, 10, 2.4)} fill={palette.navyMuted} opacity={0.55} />

      <ShopDoor x={194} y={160} w={52} h={78} wood="#8A5A32" woodDark="#6B4325" glass={GLASS_WARM} step={false} />
      <DoorBell x={220} y={154} s={0.9} />
      <G>
        <Rect x={198} y={198} width={24} height={13} rx={4} fill={palette.cream} />
        <SvgText x={210} y={208} fontFamily={fontFamily.display} fontSize={8} fill={palette.engineRed} textAnchor="middle">
          OPEN
        </SvgText>
      </G>
      {/* the arm the hanging loaf-sign turns on — without it the sign is a card
          floating beside the shop instead of something hung off its wall */}
      <SignBracket x={254} y={154} reach={24} drop={8} />

      {detail ? (
        <G>
          {/* the pavement in front of the shop: a chalked menu, the morning
              delivery, the baker's bike and the regulars */}
          <Chalkboard x={250} y={276} s={1.25} />
          <Planter x={36} y={262} s={1.2} />
          <Bicycle x={206} y={280} s={1.25} tone="#3E8FBF" />
          <Crate x={72} y={278} s={1.15} fruit={['#E3A960', '#D69B52']} />
          <Cat x={160} y={264} s={1.05} facing={-1} />
          <Pigeon x={116} y={272} s={1.1} />
          <Path d={rp(102, 268, 3.4, 3.4) + rp(110, 276, 3, 3) + rp(94, 278, 3.2, 3.2)} fill="#C98F63" />
          <Puddle x={244} y={292} rx={22} />
        </G>
      ) : null}
    </G>
  );
}

/* ================================================================== */
/* PIZZA                                                               */
/* ================================================================== */

const PIZZA_H = 228;

function pizzaArt(detail: boolean) {
  const wall = '#F5E2BE';
  return (
    <G>
      <BaseShadow cx={150} y={231} rx={146} />
      <SideReturn x={270} y={68} w={16} h={160} wall={wall} />

      <Rect x={24} y={60} width={250} height={168} rx={6} fill={wall} />
      <Rect x={24} y={60} width={38} height={168} fill="rgba(255,255,255,0.18)" />
      <Path d={rowOf(4, 28, 74, 242, 3, 34)} fill={SHADE_SOFT} />
      <Rect x={24} y={214} width={250} height={14} rx={4} fill="#C08A5E" />
      <Rect x={24} y={214} width={250} height={4} rx={2} fill={HIGHLIGHT} />

      {/* chimney with a small friendly puff */}
      <Rect x={54} y={16} width={20} height={44} rx={3} fill="#B06A4A" />
      <Rect x={54} y={16} width={7} height={44} fill={HIGHLIGHT} />
      <Rect x={50} y={10} width={28} height={9} rx={4} fill="#8E4E33" />
      <G opacity={0.75}>
        <Circle cx={68} cy={2} r={7} fill={palette.white} />
        <Circle cx={80} cy={-6} r={5} fill={palette.white} />
      </G>
      <PitchedRoof x={24} y={60} w={250} rise={44} over={14} tone="#D2764F" toneDark="#A9523A" />

      {/* arched upper windows */}
      <ArchWindow x={44} y={76} w={54} h={50} glass={GLASS} frame={palette.cream} />
      <ArchWindow x={202} y={76} w={54} h={50} glass={GLASS} frame={palette.cream} />

      {/* the pizza roundel */}
      <G>
        <Circle cx={150} cy={98} r={26} fill={palette.cream} />
        <Circle cx={150} cy={98} r={26} fill="none" stroke={palette.tanDark} strokeWidth={4} />
        <Path d="M 150 80 L 166 112 L 134 112 Z" fill="#F7C86A" />
        <Path d="M 150 86 L 162 110 L 138 110 Z" fill="#E9584A" />
        <Circle cx={145} cy={102} r={2.8} fill="#B92B22" />
        <Circle cx={154} cy={105} r={2.8} fill="#B92B22" />
        <Circle cx={150} cy={95} r={2.4} fill="#B92B22" />
      </G>

      <SignBoard x={64} y={130} w={172} h={28} label="PIZZA" ink="#A32B20" />

      <Awning x={26} y={162} w={148} h={19} bands={9} stripe="#3E8F58" alt={palette.cream} />
      <Rect x={26} y={180} width={148} height={42} rx={6} fill="#6B4325" />
      <Rect x={31} y={185} width={138} height={30} rx={4} fill="#BBDCF2" />
      <Path d="M 34 213 L 78 187 L 96 187 L 52 213 Z" fill={palette.white} opacity={0.26} />
      <Rect x={98} y={185} width={3} height={30} fill="#6B4325" opacity={0.9} />
      {/* the oven mouth glowing at the back of the shop, and a pizza on the peel */}
      <Path d="M 118 212 L 118 198 a 14 14 0 0 1 28 0 L 146 212 Z" fill="#8E4E33" />
      <Path d="M 123 212 L 123 200 a 9 9 0 0 1 18 0 L 141 212 Z" fill={palette.flameMid} />
      <Path d="M 128 210 q 4 -9 8 0 q -4 4 -8 0 z" fill={palette.flameCore} />
      <Rect x={35} y={206} width={70} height={4} rx={2} fill={palette.wood} />
      <Circle cx={56} cy={200} r={9} fill="#F0C971" />
      <Circle cx={56} cy={200} r={6} fill="#E9584A" />
      <Circle cx={54} cy={198} r={1.6} fill="#B92B22" />
      <Rect x={72} y={192} width={24} height={13} rx={3} fill={palette.cream} />
      <Path d={rp(75, 196, 16, 2.4) + rp(75, 200, 11, 2.4)} fill={palette.navyMuted} opacity={0.55} />
      <Rect x={24} y={218} width={152} height={10} rx={4} fill="#D9C3A6" />

      <ShopDoor x={192} y={156} w={54} h={72} wood="#8A5A32" woodDark="#6B4325" glass={GLASS_WARM} />

      {detail ? (
        <G>
          {/* a pavement table, laid */}
          <G>
            <Contact cx={272} cy={242} rx={30} />
            <Rect x={244} y={216} width={56} height={7} rx={3.5} fill={palette.cream} />
            <Path d="M 244 223 l 6 8 h 44 l 6 -8 z" fill="#E9584A" opacity={0.85} />
            <Rect x={269} y={222} width={6} height={20} rx={3} fill={palette.woodDark} />
            <Rect x={258} y={240} width={28} height={4} rx={2} fill={palette.woodDark} />
            <Circle cx={264} cy={212} r={5} fill="#F0C971" />
            <Rect x={282} y={208} width={8} height={10} rx={2} fill={palette.white} />
          </G>
          <CrateStack x={18} y={244} s={0.9} />
          <Planter x={214} y={242} s={0.95} />
          <Bicycle x={116} y={246} s={0.95} tone="#3E8F58" />
          <Bin x={62} y={244} s={0.85} />
          <Pigeon x={160} y={248} s={0.85} facing={-1} />
          <Puddle x={200} y={252} rx={14} />
        </G>
      ) : null}
    </G>
  );
}

/* ================================================================== */
/* PET SHOP                                                            */
/* ================================================================== */

const PET_H = 216;

function petShopArt(detail: boolean) {
  const wall = '#EAF6EC';
  return (
    <G>
      <BaseShadow cx={150} y={219} rx={146} />
      <SideReturn x={268} y={54} w={16} h={162} wall={wall} />

      <Rect x={26} y={48} width={246} height={168} rx={6} fill={wall} />
      <Rect x={26} y={48} width={38} height={168} fill="rgba(255,255,255,0.2)" />
      <Path d={rowOf(3, 30, 66, 238, 3, 26)} fill={SHADE_SOFT} />
      <Rect x={26} y={200} width={246} height={16} rx={4} fill="#BFCBD8" />
      <Rect x={26} y={200} width={246} height={4} rx={2} fill={HIGHLIGHT} />
      <Parapet x={26} y={48} w={246} tone="#3FBFAE" toneDark="#2A8A7F" />

      {/* the paw roundel */}
      <G>
        <Circle cx={150} cy={78} r={24} fill={palette.cream} />
        <Circle cx={150} cy={78} r={24} fill="none" stroke="#2A8A7F" strokeWidth={4} />
        <Ellipse cx={150} cy={85} rx={10} ry={8} fill="#3FBFAE" />
        <Circle cx={140} cy={71} r={4} fill="#3FBFAE" />
        <Circle cx={150} cy={67} r={4} fill="#3FBFAE" />
        <Circle cx={160} cy={71} r={4} fill="#3FBFAE" />
      </G>

      <SignBoard x={60} y={110} w={180} h={26} label="PET SHOP" ink="#1F7F72" />

      <Awning x={24} y={144} w={158} h={18} bands={7} stripe={palette.waterCyan} alt={palette.cream} />
      <Rect x={24} y={162} width={158} height={48} rx={6} fill="#5E7C86" />
      <Rect x={29} y={167} width={148} height={36} rx={4} fill="#CFF0FA" />
      <Path d="M 32 201 L 78 170 L 96 170 L 50 201 Z" fill={palette.white} opacity={0.3} />
      <Rect x={104} y={167} width={3} height={36} fill="#5E7C86" opacity={0.9} />
      <Rect x={30} y={192} width={146} height={3} rx={1.5} fill={palette.wood} />
      {/* the window family: a puppy, a kitten, a fish bowl */}
      <G>
        <Ellipse cx={52} cy={186} rx={12} ry={7} fill={palette.white} />
        <Circle cx={62} cy={179} r={7} fill={palette.white} />
        <Ellipse cx={49} cy={184} rx={6} ry={3} fill="#E6EAF4" />
        <Path d="M 57 174 q -5 -1 -4 6 z" fill="#C8CEE0" />
        <Circle cx={60} cy={178} r={1.4} fill={palette.navy} />
        <Circle cx={65} cy={178} r={1.4} fill={palette.navy} />
        <Path d="M 62 181.6 l 1.6 1.4 l -1.6 1.2 z" fill={palette.pink} />
      </G>
      <G>
        <Ellipse cx={92} cy={187} rx={10} ry={6} fill="#B9BFD4" />
        <Circle cx={100} cy={181} r={6} fill="#B9BFD4" />
        <Path d="M 96 176 l 2 -4 l 3 3 z M 103 176 l 3 -4 l 1 4 z" fill="#B9BFD4" />
        <Circle cx={98} cy={180} r={1.2} fill={palette.navy} />
        <Circle cx={103} cy={180} r={1.2} fill={palette.navy} />
      </G>
      <G>
        <Ellipse cx={140} cy={185} rx={15} ry={13} fill="#A6E4FF" opacity={0.85} />
        <Path d="M 127 187 a 15 13 0 0 0 26 0 z" fill="#7FD0F5" />
        <Path d="M 137 187 l 6 -3 l 0 6 z" fill={palette.orange} />
        <Circle cx={136} cy={186} r={1.2} fill={palette.navy} />
        <Ellipse cx={134} cy={177} rx={5} ry={2.6} fill={palette.white} opacity={0.6} />
        <Rect x={125} y={196} width={30} height={5} rx={2.5} fill="#5E7C86" />
      </G>
      <Rect x={22} y={206} width={162} height={10} rx={4} fill="#D6E2E6" />

      <ShopDoor x={196} y={142} w={52} h={74} wood="#4E8A80" woodDark="#356A61" glass="#CFF0FA" />
      <DoorBell x={222} y={136} s={0.9} />

      {detail ? (
        <G>
          {/* the water bowl by the door, and a paw trail across the pavement */}
          <G>
            <Contact cx={182} cy={228} rx={13} />
            <Ellipse cx={182} cy={222} rx={12} ry={5} fill="#5E7C86" />
            <Ellipse cx={182} cy={221} rx={9} ry={3.4} fill="#A6E4FF" />
          </G>
          <Path
            d={rp(60, 232, 4, 3) + rp(66, 236, 4, 3) + rp(74, 231, 4, 3) + rp(82, 236, 4, 3) + rp(90, 232, 4, 3)}
            fill="rgba(31,42,90,0.10)"
          />
          <CrateStack x={24} y={232} s={0.9} />
          <Planter x={264} y={232} s={0.95} />
          <Cat x={126} y={230} s={0.9} tone="#B9BFD4" />
          <Bin x={228} y={230} s={0.8} tone="#4E8A80" />
          <Pigeon x={98} y={236} s={0.85} />
          <Puddle x={44} y={240} rx={14} />
        </G>
      ) : null}
    </G>
  );
}

/* ================================================================== */
/* LIBRARY                                                             */
/* ================================================================== */

const LIB_H = 218;

function libraryArt(detail: boolean) {
  const stone = '#EFE8D6';
  const stoneDeep = '#DFD5BE';
  return (
    <G>
      <BaseShadow cx={150} y={221} rx={150} />
      <SideReturn x={272} y={78} w={16} h={140} wall={stone} />

      {/* body + rusticated base */}
      <Rect x={26} y={70} width={248} height={148} rx={5} fill={stone} />
      <Rect x={26} y={70} width={36} height={148} fill="rgba(255,255,255,0.2)" />
      <Rect x={20} y={196} width={260} height={22} rx={5} fill={stoneDeep} />
      <Path d={rowOf(9, 24, 200, 26, 2.4, 29)} fill={SHADE_SOFT} />

      {/* pediment + cornice */}
      <Path d="M 14 74 L 150 26 L 286 74 Z" fill="#5F86D0" />
      <Path d="M 14 74 L 150 26 L 150 74 Z" fill={HIGHLIGHT} />
      <Rect x={12} y={70} width={276} height={13} rx={5} fill="#3F63AC" />
      <Rect x={12} y={70} width={276} height={4} rx={2} fill={HIGHLIGHT} />
      <Rect x={18} y={82} width={264} height={7} rx={3} fill={stoneDeep} />
      {/* the open book carved into the pediment */}
      <G>
        <Path d="M 128 62 q 22 -14 22 -4 q 0 -10 22 4 q -22 8 -22 2 q 0 6 -22 -2 z" fill={palette.cream} />
        <Path d="M 150 58 v 8" stroke="#3F63AC" strokeWidth={2.4} />
        <Path d="M 133 60 q 12 -6 15 -3 M 152 57 q 5 -3 15 3" stroke="#B9C4DE" strokeWidth={1.6} fill="none" />
      </G>

      {/* four fluted columns with capitals, bases and arched glazing between */}
      {[0, 1, 2, 3].map((i) => {
        const cx = 46 + i * 68;
        return (
          <G key={`col${i}`}>
            <Rect x={cx - 5} y={90} width={30} height={9} rx={4} fill={stoneDeep} />
            <Rect x={cx} y={98} width={20} height={92} rx={5} fill={palette.cream} />
            <Path d={rp(cx + 4, 100, 2, 88) + rp(cx + 9, 100, 2, 88) + rp(cx + 14, 100, 2, 88)} fill={SHADE_SOFT} />
            <Rect x={cx} y={98} width={5} height={92} fill={HIGHLIGHT} />
            <Rect x={cx - 5} y={188} width={30} height={9} rx={4} fill={stoneDeep} />
          </G>
        );
      })}
      <ArchWindow x={78} y={104} w={38} h={82} glass="#4E7CB8" frame={stoneDeep} />
      <ArchWindow x={214} y={104} w={38} h={82} glass="#4E7CB8" frame={stoneDeep} />

      {/* the doors, under a fanlight */}
      <Rect x={128} y={112} width={46} height={82} rx={5} fill="#4A2E1A" />
      <Rect x={132} y={116} width={38} height={78} rx={4} fill="#6B4A2C" />
      <Rect x={132} y={116} width={9} height={78} fill={HIGHLIGHT} />
      <Rect x={150} y={116} width={2.4} height={78} fill="#4A2E1A" />
      <Path d={rp(136, 128, 12, 24) + rp(155, 128, 12, 24) + rp(136, 158, 12, 24) + rp(155, 158, 12, 24)} fill={SHADE_SOFT} />
      <Circle cx={146} cy={158} r={2.6} fill={palette.gold} />
      <Circle cx={156} cy={158} r={2.6} fill={palette.gold} />
      <Path d="M 128 114 a 23 16 0 0 1 46 0 z" fill="#9FD3F2" />
      <Path d="M 151 100 v 14 M 138 104 l 8 10 M 164 104 l -8 10" stroke={stoneDeep} strokeWidth={2} />

      <SignBoard x={92} y={92} w={116} h={22} label="LIBRARY" ink="#2F4E96" size={13} />

      {/* the lanterns either side of the door */}
      {[112, 182].map((lx) => (
        <G key={`ln${lx}`}>
          <Rect x={lx - 2} y={122} width={4} height={9} rx={2} fill={palette.charcoal} />
          <Path d={`M ${lx - 7} 131 h 14 l -2 15 h -10 z`} fill={palette.charcoal} />
          <Path d={`M ${lx - 4.6} 133 h 9.2 l -1.4 10 h -6.4 z`} fill="#FFE9A8" />
        </G>
      ))}

      <Steps x={112} y={218} w={78} n={4} rise={5.6} tone="#E4E7F0" />
      <Railing x={70} y={196} w={34} h={16} />
      <Railing x={196} y={196} w={34} h={16} />

      {detail ? (
        <G>
          {/* the book-return box */}
          <G>
            <Contact cx={252} cy={226} rx={17} />
            <Rect x={236} y={192} width={32} height={34} rx={6} fill="#3F63AC" />
            <Rect x={236} y={192} width={10} height={34} fill={HIGHLIGHT} />
            <Rect x={241} y={199} width={22} height={5} rx={2.5} fill={SHADE_DEEP} />
            <Rect x={240} y={210} width={24} height={4} rx={2} fill={palette.cream} opacity={0.7} />
          </G>
          <Bench x={54} y={228} s={0.95} />
          <Planter x={214} y={228} s={0.95} />
          <Bicycle x={106} y={232} s={0.9} tone="#8E76C0" />
          <Pigeon x={150} y={22} s={0.9} />
          <Pigeon x={196} y={236} s={0.85} facing={-1} />
          <Puddle x={276} y={240} rx={15} />
        </G>
      ) : null}
    </G>
  );
}

/* ================================================================== */
/* MARKET                                                              */
/* ================================================================== */

const MARKET_H = 210;

function marketArt(detail: boolean) {
  const hall = '#E7CDB0';
  const stalls: { x: number; stripe: string; fruit: readonly [string, string]; label: string }[] = [
    { x: 12, stripe: palette.engineRed, fruit: ['#E9584A', '#F26B5C'], label: '3' },
    { x: 108, stripe: '#3E8F58', fruit: ['#6FC470', '#88D07F'], label: '2' },
    { x: 204, stripe: '#8E76C0', fruit: [palette.safetyYellow, '#FFD65C'], label: '4' },
  ];
  return (
    <G>
      <BaseShadow cx={150} y={213} rx={150} />
      {/* the market hall behind: an arcade, not a flat wall */}
      <Rect x={8} y={44} width={284} height={166} rx={6} fill={hall} />
      <Rect x={8} y={44} width={38} height={166} fill="rgba(255,255,255,0.18)" />
      <Parapet x={8} y={44} w={284} tone="#C4776A" toneDark="#9E5748" />
      <Path d={rowOf(5, 12, 62, 276, 3, 22)} fill={SHADE_SOFT} />
      {[0, 1, 2, 3].map((i) => {
        const ax = 26 + i * 70;
        return (
          <G key={`ar${i}`}>
            <Path d={`M ${ax} 176 L ${ax} 116 a 22 22 0 0 1 44 0 L ${ax + 44} 176 Z`} fill="#C9AE93" />
            <Path d={`M ${ax + 4} 176 L ${ax + 4} 118 a 18 18 0 0 1 36 0 L ${ax + 40} 176 Z`} fill="#8A7A6E" />
            <Path d={`M ${ax + 8} 172 L ${ax + 30} 124 L ${ax + 38} 128 L ${ax + 16} 172 Z`} fill={palette.white} opacity={0.14} />
          </G>
        );
      })}
      <Rect x={8} y={176} width={284} height={12} rx={4} fill="#C9AE93" />
      <SignBoard x={96} y={78} w={108} h={24} label="MARKET" ink="#9E5748" size={15} />

      {/* three stalls with scalloped canopies */}
      {stalls.map((s, i) => (
        <G key={`st${i}`}>
          <Contact cx={s.x + 42} cy={212} rx={44} />
          <Rect x={s.x + 4} y={124} width={5} height={86} rx={2.5} fill={palette.woodDark} />
          <Rect x={s.x + 75} y={124} width={5} height={86} rx={2.5} fill={palette.woodDark} />
          <Awning x={s.x + 2} y={112} w={80} h={17} bands={5} stripe={s.stripe} alt={palette.cream} proj={5} />
          {/* the counter, its cloth and its produce */}
          <Rect x={s.x} y={158} width={84} height={9} rx={4} fill={palette.wood} />
          <Rect x={s.x} y={158} width={84} height={3} rx={1.5} fill={HIGHLIGHT} />
          <Path d={`M ${s.x} 167 h 84 l -4 32 h -76 z`} fill={i === 1 ? '#DCE8F2' : '#F3E3C6'} />
          <Path d={rowOf(5, s.x + 6, 167, 5, 32, 17)} fill={SHADE_SOFT} />
          <Rect x={s.x - 2} y={196} width={88} height={14} rx={4} fill={palette.woodDark} />
          <Crate x={s.x + 22} y={158} s={0.8} fruit={s.fruit} />
          <Crate x={s.x + 58} y={158} s={0.8} fruit={[s.fruit[1], s.fruit[0]]} />
          {/* the price card clipped to the front rail */}
          <Rect x={s.x + 30} y={172} width={24} height={16} rx={4} fill={palette.cream} />
          <SvgText x={s.x + 42} y={184} fontFamily={fontFamily.display} fontSize={11} fill="#9E5748" textAnchor="middle">
            {s.label}
          </SvgText>
        </G>
      ))}

      <Bunting x1={6} y1={108} x2={294} y2={108} sag={20} tints={[palette.cream, palette.waterCyanLight, palette.pinkSoft, palette.mint]} />

      {detail ? (
        <G>
          {/* barrels, sacks and a cat under the middle stall */}
          <G>
            <Contact cx={286} cy={216} rx={16} />
            <Rect x={272} y={186} width={28} height={30} rx={9} fill="#C58B4E" />
            <Rect x={272} y={186} width={9} height={30} fill={HIGHLIGHT} />
            <Path d={rp(272, 194, 28, 3) + rp(272, 206, 28, 3)} fill={palette.woodDark} />
          </G>
          <G>
            <Contact cx={16} cy={216} rx={16} />
            <Path d="M 2 216 q -2 -22 14 -24 q 16 2 14 24 z" fill="#E4D3AE" />
            <Path d="M 10 194 q 6 -6 12 0 q -6 4 -12 0 z" fill="#CBB68C" />
          </G>
          <Cat x={150} y={216} s={0.85} facing={-1} />
          <Pigeon x={112} y={218} s={0.85} />
          <Pigeon x={200} y={220} s={0.8} facing={-1} />
          <Chalkboard x={244} y={220} s={0.95} />
          <Puddle x={62} y={224} rx={16} />
        </G>
      ) : null}
    </G>
  );
}

/* ------------------------------------------------------------------ */

export const bakery: SceneDef = {
  height: BAKERY_H,
  ground: 'paving',
  art: bakeryArt,
  sway: { x: 278, y: 150, kind: 'sign' },
};

export const pizza: SceneDef = {
  height: PIZZA_H,
  ground: 'paving',
  art: pizzaArt,
  sway: { x: 278, y: 138, kind: 'slice' },
};

export const petShop: SceneDef = {
  height: PET_H,
  ground: 'paving',
  art: petShopArt,
  sway: { x: 278, y: 116, kind: 'cage' },
};

export const library: SceneDef = {
  height: LIB_H,
  ground: 'paving',
  spill: 0.95,
  art: libraryArt,
  sway: { x: 60, y: 90, kind: 'banner' },
};

export const market: SceneDef = {
  height: MARKET_H,
  ground: 'paving',
  art: marketArt,
  sway: { x: 150, y: 132, kind: 'scale' },
};
