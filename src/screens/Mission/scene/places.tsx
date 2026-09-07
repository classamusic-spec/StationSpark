/**
 * The five places: school, park, clock tower, apartments and the station yard.
 *
 * `station-yard` is the one that has to read as the *same building* as the
 * Firehouse home screen, so it is drawn in `StationFacade`'s design language
 * rather than copied from it: red hipped roof over a red eaves band, a bell
 * gable with a brass bell in an arched niche, a cream wall with recessed room
 * panels, the STATION SPARK name board in its tan frame, two red roller
 * shutters carrying cream ENGINE plates, a brown base course, and the apron
 * with its yellow guide dashes and its yard dressing.
 */
import React from 'react';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fontFamily, palette } from '@/theme';
import { rp, rowOf } from './frame';
import type { SceneDef } from './types';
import {
  ArchWindow,
  Awning,
  BaseShadow,
  Bench,
  Bicycle,
  Bin,
  Bollard,
  Brickwork,
  Cat,
  Cone,
  Contact,
  GLASS,
  HIGHLIGHT,
  HippedRoof,
  Parapet,
  Pigeon,
  PitchedRoof,
  Planter,
  Puddle,
  Railing,
  SHADE,
  SHADE_DEEP,
  SHADE_SOFT,
  SHEEN,
  ShopDoor,
  SignBoard,
  SignBracket,
  Steps,
  Tree,
  Hedge,
  WindowGrid,
} from './parts';
import { Drain } from './layers';

/* ================================================================== */
/* SCHOOL                                                              */
/* ================================================================== */

const SCHOOL_H = 224;

function schoolArt(detail: boolean) {
  const wall = '#E7B78C';
  const trim = palette.cream;
  return (
    <G>
      <BaseShadow cx={150} y={227} rx={150} />
      <Path d={`M 280 76 L 292 88 L 292 224 L 280 224 Z`} fill={wall} />
      <Path d={`M 280 76 L 292 88 L 292 224 L 280 224 Z`} fill={SHADE} />

      <Rect x={20} y={74} width={260} height={150} rx={6} fill={wall} />
      <Rect x={20} y={74} width={38} height={150} fill="rgba(255,255,255,0.18)" />
      <Brickwork x={24} y={82} w={252} h={132} bw={20} bh={10} />
      {/* cream quoins down both corners, batched */}
      <Path d={rowOf(7, 20, 84, 14, 9, 18) + rowOf(7, 266, 84, 14, 9, 18)} fill={trim} opacity={0.85} />
      <Rect x={14} y={210} width={272} height={14} rx={4} fill="#C6CEDF" />
      <Rect x={14} y={210} width={272} height={4} rx={2} fill={HIGHLIGHT} />

      {/* the bell cupola on the ridge */}
      <G>
        <Rect x={136} y={12} width={28} height={20} rx={3} fill={trim} />
        <Path d={rowOf(3, 140, 15, 20, 3, 6)} fill={SHADE} />
        <Path d="M 128 13 L 150 0 L 172 13 Z" fill="#3F63AC" />
        <Rect x={132} y={30} width={36} height={6} rx={3} fill="#3F63AC" />
        <Path d="M 145 28 q 0 -8 5 -8 q 5 0 5 8 z" fill={palette.gold} />
      </G>
      <HippedRoof x={20} y={74} w={260} rise={42} inset={62} over={12} tone="#5F86D0" toneLight="#7EA0DD" toneDark="#3F63AC" />

      {/* the clock the whole street sets its watch by */}
      <G>
        <Circle cx={150} cy={100} r={23} fill={palette.cream} />
        <Circle cx={150} cy={100} r={23} fill="none" stroke={palette.tanDark} strokeWidth={4} />
        {[0, 3, 6, 9].map((t) => {
          const a = (t / 12) * Math.PI * 2 - Math.PI / 2;
          return <Circle key={t} cx={150 + Math.cos(a) * 16} cy={100 + Math.sin(a) * 16} r={2} fill={palette.navyMuted} />;
        })}
        <Path d="M 150 100 L 150 87 M 150 100 L 160 105" stroke={palette.navy} strokeWidth={3.4} strokeLinecap="round" />
        <Circle cx={150} cy={100} r={3} fill={palette.engineRed} />
      </G>

      {/* eight classroom windows, mullioned, with sills */}
      <WindowGrid rows={1} cols={2} x={34} y={88} w={44} h={34} dx={52} dy={0} glass={GLASS} frame={trim} mullions={[1, 1]} />
      <WindowGrid rows={1} cols={2} x={190} y={88} w={44} h={34} dx={52} dy={0} glass={GLASS} frame={trim} mullions={[1, 1]} lit={1} />
      <WindowGrid rows={1} cols={2} x={34} y={150} w={44} h={34} dx={52} dy={0} glass={GLASS} frame={trim} mullions={[1, 1]} />
      <WindowGrid rows={1} cols={2} x={190} y={150} w={44} h={34} dx={52} dy={0} glass={GLASS} frame={trim} mullions={[1, 1]} />
      {/* paper shapes taped inside one classroom window */}
      <Path d="M 46 112 l 6 -10 l 6 10 z" fill={palette.safetyYellow} opacity={0.9} />
      <Circle cx={68} cy={108} r={4.4} fill={palette.pink} opacity={0.9} />

      <SignBoard x={100} y={128} w={100} h={22} label="SCHOOL" ink="#2F4E96" size={13} />

      {/* double doors under a lamp, on a flight of steps */}
      <Rect x={120} y={154} width={60} height={54} rx={5} fill="#4A2E1A" />
      <Rect x={124} y={158} width={52} height={50} rx={4} fill="#6B4A2C" />
      <Rect x={124} y={158} width={12} height={50} fill={HIGHLIGHT} />
      <Rect x={148.6} y={158} width={2.8} height={50} fill="#4A2E1A" />
      <Path d={rp(129, 166, 17, 20) + rp(154, 166, 17, 20)} fill={GLASS} />
      <Path d="M 130 184 L 143 168 L 146 168 L 133 184 Z" fill={palette.white} opacity={0.22} />
      <Rect x={140} y={186} width={4} height={11} rx={2} fill={palette.gold} />
      <Rect x={156} y={186} width={4} height={11} rx={2} fill={palette.gold} />
      <G>
        <Rect x={146} y={144} width={8} height={5} rx={2} fill={palette.charcoal} />
        <Path d="M 141 149 h 18 l -3 11 h -12 z" fill={palette.charcoal} />
        <Path d="M 144.4 151 h 11.2 l -2 8 h -7.2 z" fill="#FFE9A8" />
      </G>
      <Steps x={116} y={224} w={68} n={3} rise={5.4} tone="#DCE3F2" />

      {/* the flag mast (its flag is the swaying element) */}
      <Rect x={276} y={14} width={4.6} height={210} rx={2.3} fill={palette.slateLight} />
      <Rect x={276} y={14} width={1.8} height={210} fill={HIGHLIGHT} />
      <Circle cx={278.3} cy={12} r={3.4} fill={palette.gold} />

      {detail ? (
        <G>
          <Hedge x={16} y={228} w={70} h={22} />
          <Hedge x={218} y={228} w={64} h={20} />
          {/* the bike rack, with two bikes in it */}
          <G>
            <Contact cx={70} cy={244} rx={40} />
            <Path d={rowOf(4, 46, 226, 3.4, 18, 16)} fill={palette.slate} />
            <Rect x={44} y={224} width={56} height={4} rx={2} fill={palette.slateLight} />
          </G>
          <Bicycle x={70} y={248} s={1.15} tone={palette.engineRed} basket={false} />
          <Planter x={116} y={244} s={1} />
          <Planter x={190} y={244} s={1} />
          <Bin x={258} y={260} s={1.05} />
          {/* a ball left on the yard, and a chalked hopscotch */}
          <Circle cx={214} cy={280} r={10} fill={palette.safetyYellow} />
          <Path d="M 204 280 h 20" stroke={palette.engineRed} strokeWidth={2.6} />
          <Contact cx={214} cy={291} rx={10} />
          {/* the hopscotch chalked on the yard */}
          <Path
            d={rp(126, 244, 22, 16) + rp(126, 263, 22, 17) + rp(150, 244, 22, 16) + rp(150, 263, 22, 17) + rp(138, 283, 22, 18)}
            fill={palette.white}
            opacity={0.62}
          />
          <Pigeon x={104} y={288} s={1} />
          <Puddle x={272} y={300} rx={20} />
        </G>
      ) : null}
    </G>
  );
}

/* ================================================================== */
/* PARK                                                                */
/* ================================================================== */

const PARK_H = 206;

function parkArt(detail: boolean) {
  const stone = '#E3DCC8';
  return (
    <G>
      {/* The trees flank the gate rather than hiding behind its piers, where all
          a child saw was a trunk with its canopy cut off. */}
      <Tree x={38} y={206} s={1.7} back="#2F7F46" front="#3E9A55" />
      <Tree x={266} y={208} s={1.5} back="#2F7F46" front="#4CAF50" />

      {/* the bandstand in the middle distance. Its roof is copper, not green:
          a green roof in front of a green tree line is an invisible roof. */}
      <G>
        <Contact cx={150} cy={200} rx={62} />
        <Path d="M 96 108 L 150 74 L 204 108 Z" fill="#C4776A" />
        <Path d="M 96 108 L 150 74 L 150 108 Z" fill={HIGHLIGHT} />
        <Path d={rowOf(3, 100, 90, 100, 2.6, 7)} fill={SHADE} />
        <Rect x={94} y={104} width={112} height={6} rx={3} fill="#9E5748" />
        <Circle cx={150} cy={70} r={5} fill={palette.gold} />
        <Rect x={92} y={104} width={116} height={9} rx={4} fill={palette.cream} />
        <Rect x={92} y={104} width={116} height={3} rx={1.5} fill={HIGHLIGHT} />
        <Path d={rowOf(5, 100, 113, 7, 62, 24)} fill={palette.cream} />
        <Path d={rowOf(5, 105, 113, 2, 62, 24)} fill={SHADE_SOFT} />
        <Rect x={96} y={158} width={108} height={6} rx={3} fill={palette.cream} />
        <Rect x={92} y={176} width={116} height={12} rx={4} fill="#D6D0BC" />
        <Rect x={92} y={176} width={116} height={4} rx={2} fill={HIGHLIGHT} />
        <Path d="M 118 188 h 64 l 8 12 h -80 z" fill="#CFC9B4" />
      </G>

      {/* the park gate: two stone piers and an ironwork arch */}
      {[16, 254].map((px) => (
        <G key={`pier${px}`}>
          <Contact cx={px + 15} cy={206} rx={22} />
          <Rect x={px} y={104} width={30} height={102} rx={5} fill={stone} />
          <Rect x={px} y={104} width={9} height={102} fill={HIGHLIGHT} />
          <Path d={rowOf(6, px, 116, 30, 2.4, 16)} fill={SHADE_SOFT} />
          <Rect x={px - 5} y={96} width={40} height={11} rx={5} fill="#D2C9B0" />
          <Rect x={px - 5} y={96} width={40} height={3.4} rx={1.7} fill={HIGHLIGHT} />
          <Path d={`M ${px + 9} 96 q 6 -12 12 0 z`} fill="#B9AF95" />
        </G>
      ))}
      <Path d="M 40 104 Q 150 46 260 104" stroke="#4E5776" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M 40 104 Q 150 46 260 104" stroke={HIGHLIGHT} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path
        d="M 74 88 v 14 M 100 78 v 24 M 126 72 v 30 M 150 70 v 32 M 174 72 v 30 M 200 78 v 24 M 226 88 v 14"
        stroke="#4E5776"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* railings running off both piers */}
      <Railing x={-14} y={206} w={32} h={30} tone="#4E5776" />
      <Railing x={284} y={206} w={32} h={30} tone="#4E5776" />

      {/* the pond, with a duck */}
      <G>
        <Ellipse cx={222} cy={224} rx={58} ry={19} fill="#5FA8D8" />
        <Ellipse cx={222} cy={221} rx={50} ry={14} fill="#7FD0F5" />
        <Ellipse cx={206} cy={218} rx={22} ry={5} fill={palette.white} opacity={0.35} />
        <G>
          <Ellipse cx={236} cy={216} rx={11} ry={6} fill={palette.white} />
          <Circle cx={245} cy={210} r={5} fill={palette.white} />
          <Path d="M 249 210 l 6 1.6 l -6 2 z" fill={palette.gold} />
          <Circle cx={245.6} cy={209} r={1.1} fill={palette.navy} />
          <Ellipse cx={233} cy={217} rx={6} ry={3} fill="#E6EAF4" />
        </G>
        <Path d="M 178 226 q 6 -10 12 0 z" fill="#3E8F58" />
      </G>

      {/* the flower bed by the path */}
      <G>
        <Ellipse cx={78} cy={224} rx={44} ry={12} fill="#6B4A2C" opacity={0.5} />
        <Ellipse cx={78} cy={221} rx={40} ry={9} fill="#4FA858" />
        <Circle cx={56} cy={217} r={4} fill={palette.pink} />
        <Circle cx={70} cy={214} r={4.4} fill={palette.safetyYellow} />
        <Circle cx={86} cy={215} r={4} fill={palette.purple} />
        <Circle cx={100} cy={218} r={3.6} fill={palette.engineRed} />
      </G>

      {detail ? (
        <G>
          <Bench x={70} y={252} s={1.25} />
          <Bin x={268} y={256} s={1.05} />
          <Pigeon x={128} y={244} s={1} />
          <Pigeon x={142} y={250} s={0.9} facing={-1} />
          <Cat x={210} y={264} s={1.15} facing={-1} />
          {/* clipped borders closing the two front corners, so the near grass
              is framed rather than empty */}
          <Hedge x={-30} y={276} w={130} h={32} />
          <Hedge x={206} y={282} w={136} h={28} />
          <Circle cx={22} cy={266} r={5} fill={palette.pink} />
          <Circle cx={54} cy={262} r={5} fill={palette.safetyYellow} />
          <Circle cx={262} cy={270} r={5} fill={palette.purple} />
        </G>
      ) : null}
    </G>
  );
}

/* ================================================================== */
/* CLOCK TOWER                                                         */
/* ================================================================== */

const TOWER_H = 300;

function clockTowerArt(detail: boolean) {
  const stone = '#EDE6D4';
  const stoneDeep = '#D9D0B8';
  return (
    <G>
      <BaseShadow cx={150} y={303} rx={132} />
      {/* the low walls the tower stands between */}
      <Rect x={-10} y={246} width={112} height={54} rx={5} fill={stoneDeep} />
      <Rect x={198} y={246} width={112} height={54} rx={5} fill={stoneDeep} />
      <Rect x={-10} y={240} width={112} height={9} rx={4} fill="#C6BCA2" />
      <Rect x={198} y={240} width={112} height={9} rx={4} fill="#C6BCA2" />
      <Path d={rowOf(4, -6, 254, 100, 2.4, 13)} fill={SHADE_SOFT} />
      <Path d={rowOf(4, 202, 254, 100, 2.4, 13)} fill={SHADE_SOFT} />
      <Railing x={4} y={240} w={80} h={26} />
      <Railing x={216} y={240} w={80} h={26} />

      {/* shaft */}
      <Path d="M 208 60 L 220 74 L 220 288 L 208 288 Z" fill={stone} />
      <Path d="M 208 60 L 220 74 L 220 288 L 208 288 Z" fill={SHADE} />
      <Rect x={92} y={56} width={116} height={232} rx={5} fill={stone} />
      <Rect x={92} y={56} width={20} height={232} fill="rgba(255,255,255,0.2)" />
      <Path d={rowOf(11, 92, 178, 116, 2.4, 10) + rowOf(5, 92, 120, 116, 2.4, 12)} fill={SHADE_SOFT} />

      {/* spire + weather vane */}
      <PitchedRoof x={92} y={56} w={116} rise={48} over={12} tone="#4F7FD6" toneDark="#3A5FA8" />
      <Rect x={148.6} y={-6} width={3} height={14} rx={1.5} fill={palette.charcoalDark} />
      <Path d="M 150 -6 l 12 4 l -12 4 z" fill={palette.gold} />
      <Circle cx={150} cy={6} r={3.4} fill={palette.gold} />

      {/* belfry: two louvred arches under the eaves */}
      <G>
        <Rect x={100} y={66} width={100} height={44} rx={5} fill={stoneDeep} />
        {[112, 158].map((bx) => (
          <G key={`bl${bx}`}>
            <Path d={`M ${bx} 106 L ${bx} 86 a 15 15 0 0 1 30 0 L ${bx + 30} 106 Z`} fill="#5A6480" />
            <Path d={rowOf(4, bx + 3, 88, 24, 3.4, 5)} fill="#8C94B3" />
          </G>
        ))}
        <Rect x={96} y={108} width={108} height={8} rx={4} fill="#C6BCA2" />
      </G>

      {/* the clock stage */}
      <Rect x={86} y={122} width={128} height={76} rx={6} fill={stone} />
      <Rect x={86} y={122} width={128} height={5} rx={2.5} fill={HIGHLIGHT} />
      <Rect x={82} y={116} width={136} height={10} rx={5} fill="#C6BCA2" />
      <Rect x={82} y={194} width={136} height={10} rx={5} fill="#C6BCA2" />
      <G>
        <Circle cx={150} cy={160} r={40} fill={palette.tanDark} />
        <Circle cx={150} cy={160} r={35} fill={palette.cream} />
        {Array.from({ length: 12 }, (_, t) => {
          const a = (t / 12) * Math.PI * 2 - Math.PI / 2;
          const r = t % 3 === 0 ? 3.2 : 1.8;
          return <Circle key={t} cx={150 + Math.cos(a) * 27} cy={160 + Math.sin(a) * 27} r={r} fill={t % 3 === 0 ? palette.navy : palette.navyMuted} />;
        })}
        <Path d="M 150 160 L 150 138 M 150 160 L 168 168" stroke={palette.navy} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={150} cy={160} r={4.6} fill={palette.engineRed} />
        <Ellipse cx={137} cy={144} rx={11} ry={5} fill={palette.white} opacity={0.3} />
      </G>

      {/* a lancet window down the shaft, and the arched door at the foot */}
      <ArchWindow x={136} y={210} w={28} h={44} glass="#4E7CB8" frame={stoneDeep} />
      <Rect x={76} y={258} width={148} height={42} rx={5} fill={stoneDeep} />
      <Rect x={72} y={252} width={156} height={10} rx={5} fill="#C6BCA2" />
      <Path d="M 128 300 L 128 276 a 22 22 0 0 1 44 0 L 172 300 Z" fill="#5C3A20" />
      <Path d="M 133 300 L 133 277 a 17 17 0 0 1 34 0 L 167 300 Z" fill="#7A4E2A" />
      <Path d="M 149 258 h 3 v 42 h -3 z" fill="#5C3A20" />
      <Circle cx={143} cy={288} r={2.6} fill={palette.gold} />
      <Path d="M 150 254 l 7 8 h -14 z" fill="#C6BCA2" />
      <Steps x={120} y={300} w={60} n={2} rise={5} tone="#E4E7F0" />

      {/* the cat that everyone came for, up on the clock-stage ledge */}
      <Cat x={230} y={196} s={1.05} facing={-1} />
      {/* the bracket the tower lantern swings from */}
      <SignBracket x={92} y={200} reach={-16} drop={7} />

      {detail ? (
        <G>
          {/* the ladder someone leaned against the tower, and the yard below */}
          <G>
            <Path d="M 222 306 L 240 214 M 234 306 L 252 214" stroke={palette.wood} strokeWidth={4.4} strokeLinecap="round" />
            <Path
              d={rp(224, 292, 13, 3) + rp(227, 270, 13, 3) + rp(230, 248, 13, 3) + rp(233, 226, 13, 3)}
              fill={palette.woodDark}
            />
            <Contact cx={230} cy={308} rx={16} />
          </G>
          <Bench x={74} y={312} s={1.05} />
          <Planter x={196} y={318} s={1.05} />
          <Bin x={116} y={330} s={0.95} />
          <Pigeon x={86} y={240} s={0.85} />
          <Pigeon x={172} y={340} s={0.95} facing={-1} />
          <Puddle x={144} y={352} rx={22} />
        </G>
      ) : null}
    </G>
  );
}

/* ================================================================== */
/* APARTMENTS                                                          */
/* ================================================================== */

const APTS_H = 258;

interface BlockSpec {
  x: number;
  w: number;
  top: number;
  wall: string;
  roof: string;
  pitched: boolean;
  shutter: string;
}

function apartmentsArt(detail: boolean) {
  const blocks: BlockSpec[] = [
    { x: 2, w: 100, top: 88, wall: '#F0C9A0', roof: '#4F7FD6', pitched: false, shutter: '#3F63AC' },
    { x: 102, w: 96, top: 42, wall: '#F6E3C0', roof: palette.engineRed, pitched: true, shutter: palette.engineRedDark },
    { x: 198, w: 100, top: 76, wall: '#E9D6F2', roof: '#8E76C0', pitched: false, shutter: '#6B54A0' },
  ];
  return (
    <G>
      <BaseShadow cx={150} y={261} rx={150} />
      {blocks.map((b, i) => {
        const win1 = b.top + 26;
        const balc = b.top + 62;
        const pipeX = b.x + b.w - 7;
        return (
          <G key={`bl${i}`}>
            <Rect x={b.x} y={b.top} width={b.w} height={258 - b.top} rx={5} fill={b.wall} />
            <Rect x={b.x} y={b.top} width={b.w * 0.16} height={258 - b.top} fill="rgba(255,255,255,0.2)" />
            <Brickwork x={b.x + 3} y={b.top + 14} w={b.w - 6} h={208 - b.top} bw={18} bh={9} />
            {b.pitched ? (
              <PitchedRoof x={b.x} y={b.top} w={b.w} rise={34} over={9} tone={b.roof} toneDark={palette.engineRedDark} />
            ) : (
              <Parapet x={b.x} y={b.top} w={b.w} tone={b.roof} toneDark="#2F4E96" />
            )}
            {/* two floors of mullioned windows; shutters on the top floor only */}
            <WindowGrid
              rows={2}
              cols={2}
              x={b.x + 16}
              y={win1}
              w={26}
              h={30}
              dx={b.w - 58}
              dy={56}
              glass={GLASS}
              frame={palette.cream}
              mullions={[1, 1]}
              lit={i === 1 ? 1 : undefined}
            />
            <Path
              d={rp(b.x + 7, win1 - 2, 7, 34) + rp(b.x + 44, win1 - 2, 7, 34) + rp(b.x + b.w - 51, win1 - 2, 7, 34) + rp(b.x + b.w - 14, win1 - 2, 7, 34)}
              fill={b.shutter}
              opacity={0.9}
            />
            {/* the balcony across the first floor, with its pots */}
            <G>
              <Rect x={b.x + 8} y={balc} width={b.w - 16} height={5} rx={2.5} fill={palette.slateLight} />
              <Rect x={b.x + 8} y={balc} width={b.w - 16} height={2} rx={1} fill={HIGHLIGHT} />
              <Railing x={b.x + 8} y={balc + 1} w={b.w - 16} h={15} tone={palette.slate} />
              <Circle cx={b.x + 20} cy={balc - 8} r={5} fill="#4FA858" />
              <Circle cx={b.x + b.w - 22} cy={balc - 8} r={4.4} fill="#5CB861" />
            </G>
            <Rect x={pipeX} y={b.top + 14} width={4.4} height={200 - b.top} rx={2.2} fill={SHADE} />
            <Rect x={pipeX - 2} y={b.top + 14} width={8.4} height={5} rx={2.5} fill={SHADE_DEEP} />
          </G>
        );
      })}

      {/* the shared base course, and the stoop into the middle block */}
      <Rect x={-2} y={222} width={304} height={36} rx={5} fill="#C08A5E" />
      <Rect x={-2} y={222} width={304} height={5} rx={2.5} fill="#9E6A36" />
      <SignBoard x={116} y={158} w={70} h={18} label="No. 12" ink="#7A4A24" size={11} />
      <Awning x={124} y={182} w={54} h={15} bands={5} stripe={palette.engineRed} alt={palette.cream} proj={5} />
      <ShopDoor x={128} y={200} w={46} h={34} wood="#6B4A2C" woodDark="#4A2E1A" glass={GLASS} step={false} />
      <Steps x={122} y={258} w={58} n={4} rise={6} tone="#DCE3F2" />
      <Railing x={110} y={236} w={16} h={30} />
      <Railing x={176} y={236} w={16} h={30} />

      {detail ? (
        <G>
          {/* the bin store, the bikes chained to the rail, a cat on the wall */}
          <G>
            <Contact cx={40} cy={266} rx={34} />
            <Rect x={10} y={236} width={60} height={28} rx={5} fill="#8C94B3" />
            <Rect x={10} y={236} width={60} height={5} rx={2.5} fill={HIGHLIGHT} />
            <Path d={rowOf(4, 16, 244, 48, 2.6, 6)} fill={SHADE} />
          </G>
          <Bin x={96} y={286} s={1.05} />
          <Railing x={214} y={278} w={72} h={22} tone={palette.slate} />
          <Bicycle x={244} y={280} s={1.15} tone="#3E8FBF" />
          <Planter x={188} y={272} s={1} />
          <Cat x={74} y={236} s={0.8} />
          <Puddle x={146} y={300} rx={24} />
          <Pigeon x={126} y={288} s={1} />
        </G>
      ) : null}
    </G>
  );
}


/* ================================================================== */
/* STATION YARD — the same firehouse as the home screen                */
/* ================================================================== */

const YARD_H = 248;

/** A red roller shutter with its reveal, slats, window band and ENGINE plate. */
function BayDoor({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  const r = 3.4;
  const fx = x + r;
  const fy = y + r;
  const fw = w - r * 2;
  const fh = h - r;
  return (
    <G>
      <Rect x={x - 4} y={y - 6} width={w + 8} height={h + 6} rx={6} fill="#8E3A22" />
      <Rect x={x - 4} y={y - 6} width={w + 8} height={4} rx={2} fill="#B15A2E" />
      <Rect x={x} y={y} width={w} height={h} rx={4} fill="#4A2214" />
      <Rect x={fx} y={fy} width={fw} height={fh} rx={3.4} fill={palette.engineRed} />
      <Rect x={fx} y={fy} width={fw} height={fh * 0.2} rx={3.4} fill={palette.engineRedLight} opacity={0.5} />
      <Rect x={fx} y={fy} width={fw} height={4} rx={2} fill={SHADE_DEEP} />
      <Rect x={fx} y={fy} width={3.4} height={fh} rx={1.7} fill={SHADE} />
      <Path d={rowOf(4, fx + 6, fy + fh * 0.16, (fw - 12) / 4 - 4, fh * 0.26, (fw - 12) / 4)} fill="#204A86" />
      <Path d={rowOf(4, fx + 6, fy + fh * 0.16, (fw - 12) / 4 - 4, fh * 0.13, (fw - 12) / 4)} fill="#3C6FB4" />
      <Path d={rp(fx + 2, fy + fh * 0.52, fw - 4, 2) + rp(fx + 2, fy + fh * 0.66, fw - 4, 2) + rp(fx + 2, fy + fh * 0.8, fw - 4, 2)} fill={palette.engineRedDark} opacity={0.7} />
      <Rect x={fx + fw * 0.24} y={fy + fh * 0.56} width={fw * 0.52} height={11} rx={4} fill={palette.cream} />
      <Rect x={fx + fw * 0.24} y={fy + fh * 0.56 + 8} width={fw * 0.52} height={3} rx={1.5} fill={SHADE} />
      <SvgText
        x={fx + fw * 0.5}
        y={fy + fh * 0.56 + 8.4}
        fontFamily={fontFamily.display}
        fontSize={8}
        fontWeight="700"
        fill={palette.navy}
        textAnchor="middle"
        letterSpacing={0.6}
      >
        {label}
      </SvgText>
      <Rect x={fx + fw * 0.36} y={fy + fh - 6} width={fw * 0.28} height={3} rx={1.5} fill={palette.safetyYellow} />
    </G>
  );
}

function stationYardArt(detail: boolean) {
  const wall = '#F8E2B6';
  return (
    <G>
      {/* the right-hand return, receding away */}
      <Path d="M 278 74 L 292 88 L 292 220 L 278 220 Z" fill={palette.tanDark} />
      <Path d="M 278 74 L 292 88 L 292 220 L 278 220 Z" fill={SHADE} />

      {/* main hipped roof over its red eaves band */}
      <HippedRoof x={16} y={72} w={268} rise={34} inset={40} over={10} tone={palette.engineRed} toneLight={palette.engineRedLight} toneDark={palette.engineRedDark} />
      {/* chimney, as on the home screen */}
      <Rect x={40} y={22} width={22} height={54} rx={3} fill="#C96A3A" />
      <Rect x={40} y={22} width={7} height={54} fill={HIGHLIGHT} />
      <Rect x={36} y={16} width={30} height={10} rx={4.5} fill="#A2512A" />
      <Rect x={36} y={16} width={30} height={3} rx={1.5} fill={HIGHLIGHT} />

      {/* the bell gable, standing proud of the ridge */}
      <G>
        <Rect x={116} y={40} width={68} height={38} fill={wall} />
        <Rect x={116} y={40} width={12} height={38} fill={SHEEN} />
        <PitchedRoof x={116} y={40} w={68} rise={30} over={11} tone={palette.engineRed} toneDark={palette.engineRedDark} tiles={false} />
        <Path d="M 137 74 L 137 60 A 13 13 0 0 1 163 60 L 163 74 Z" fill="#B5652F" />
        <Path d="M 140 74 L 140 61 A 10 10 0 0 1 160 61 L 160 74 Z" fill="#8E4A20" />
        {/* the bell itself */}
        <Path d="M 143 68 q 0 -12 7 -12 q 7 0 7 12 z" fill={palette.safetyYellow} />
        <Path d="M 143 68 q 0 -12 7 -12 l 0 12 z" fill={HIGHLIGHT} />
        <Rect x={141} y={68} width={18} height={3.4} rx={1.7} fill={palette.gold} />
        <Circle cx={150} cy={73} r={2.4} fill={palette.gold} />
        <Circle cx={126} cy={58} r={6} fill={palette.tanDark} />
        <Circle cx={174} cy={58} r={6} fill={palette.tanDark} />
        <Circle cx={174} cy={58} r={4} fill={palette.charcoal} opacity={0.5} />
      </G>

      {/* wall, soffit shadow and inner panel */}
      <Rect x={16} y={76} width={268} height={138} rx={5} fill={wall} />
      <Rect x={24} y={84} width={252} height={122} rx={8} fill={palette.creamDeep} />
      <Rect x={16} y={76} width={268} height={12} fill={SHADE_SOFT} />
      <Rect x={24} y={88} width={252} height={3.4} rx={1.7} fill={HIGHLIGHT} />

      {/* the STATION SPARK name board, in its tan frame */}
      <SignBoard x={54} y={86} w={192} h={28} label="STATION SPARK" ink={palette.navy} size={15} />

      {/* the crew-room windows across the first floor */}
      {[0, 1, 2].map((i) => {
        const px = 34 + i * 80;
        return (
          <G key={`rm${i}`}>
            <Rect x={px - 4} y={120} width={72} height={36} rx={11} fill="#E4C48E" />
            <Rect x={px - 4} y={120} width={72} height={4.4} rx={2.2} fill={HIGHLIGHT} />
            <Rect x={px} y={124} width={64} height={28} rx={8} fill="#204A86" />
            <Rect x={px} y={124} width={64} height={10} rx={8} fill="#3C6FB4" />
            <Path d={`M ${px + 4} 150 L ${px + 26} 128 L ${px + 36} 128 L ${px + 14} 150 Z`} fill={palette.white} opacity={0.18} />
            <Path d={rp(px + 31, 124, 2.4, 28) + rp(px, 136, 64, 2.4)} fill="#E4C48E" opacity={0.85} />
            <Rect x={px - 7} y={154} width={78} height={5} rx={2.5} fill="#F3DCAF" />
            <Rect x={px - 7} y={158} width={78} height={3} rx={1.5} fill={SHADE} />
          </G>
        );
      })}

      {/* THE BAYS. On the home screen the engine doors are the biggest thing on
          the building — that is what makes it a fire station rather than a
          house with a bell. So the base course is deep and the shutters are
          nearly twice the height of a window, with the pier and its hose reel
          between them. */}
      <Rect x={6} y={158} width={288} height={62} rx={6} fill="#C96A3A" />
      <Rect x={6} y={158} width={288} height={7} rx={3.5} fill="#A2512A" />
      <Rect x={6} y={163} width={288} height={3.4} rx={1.7} fill={HIGHLIGHT} />
      <Path d={rowOf(8, 12, 172, 30, 2.4, 35)} fill="#B15A2E" opacity={0.5} />
      <BayDoor x={22} y={166} w={110} h={54} label="ENGINE 1" />
      <BayDoor x={168} y={166} w={110} h={54} label="ENGINE 2" />
      {/* the hose reel on the pier between the bays */}
      <G>
        <Rect x={136} y={162} width={28} height={58} rx={7} fill={SHADE_DEEP} />
        <Rect x={138} y={164} width={24} height={54} rx={6} fill={palette.creamDeep} />
        <Rect x={138} y={164} width={24} height={4} rx={2} fill={HIGHLIGHT} />
        <Circle cx={150} cy={192} r={11} fill={palette.charcoal} />
        <Circle cx={150} cy={191} r={9} fill={palette.engineRed} />
        <Circle cx={150} cy={191} r={5.4} fill={palette.engineRedDark} />
        <Circle cx={150} cy={191} r={2.6} fill={palette.slateLight} />
        <Rect x={142} y={206} width={16} height={6} rx={3} fill={palette.slate} />
      </G>
      {/* lamp housings over each bay */}
      <Rect x={66} y={159} width={22} height={7} rx={3.5} fill={palette.charcoal} />
      <Rect x={212} y={159} width={22} height={7} rx={3.5} fill={palette.charcoal} />
      <Ellipse cx={77} cy={170} rx={18} ry={10} fill={palette.safetyYellow} opacity={0.16} />
      <Ellipse cx={223} cy={170} rx={18} ry={10} fill={palette.safetyYellow} opacity={0.16} />

      {/* the threshold the engines cross. The apron itself is the near ground
          plane (see GroundPlane's 'apron' kind), so there is one forecourt from
          the bay doors to the kerb rather than two greys meeting at a seam. */}
      <Path d="M -20 220 L 320 220 L 320 240 L -20 240 Z" fill="#EDF1F8" />
      <Rect x={-20} y={220} width={340} height={9} fill={SHADE_SOFT} />
      <BaseShadow cx={150} y={224} rx={146} />

      {/* the flag mast (its flag is the swaying element) */}
      <Rect x={276} y={34} width={4.4} height={188} rx={2.2} fill={palette.slateLight} />
      <Rect x={276} y={34} width={1.8} height={188} fill={HIGHLIGHT} />
      <Circle cx={278.2} cy={32} r={3.4} fill={palette.gold} />

      {detail ? (
        <G>
          {/* the yard dressing, all of it standing on the apron and spread down
              it rather than lined up along the wall like a shelf */}
          <G x={64} y={292} scale={1.1}>
            <Contact cx={0} cy={2} rx={20} />
            <Rect x={-17} y={-8} width={34} height={9} rx={4} fill={palette.engineRedDark} />
            <Rect x={-12} y={-44} width={24} height={37} rx={9} fill={palette.engineRed} />
            <Rect x={3} y={-41} width={8} height={31} rx={4} fill={SHADE} />
            <Rect x={-11} y={-41} width={5} height={31} rx={2.5} fill={HIGHLIGHT} />
            <Rect x={-20} y={-36} width={9} height={11} rx={4.5} fill={palette.engineRedDark} />
            <Rect x={11} y={-36} width={9} height={11} rx={4.5} fill={palette.engineRedDark} />
            <Rect x={-15} y={-52} width={30} height={9} rx={4.5} fill={palette.engineRedDark} />
            <Path d="M -11 -52 q 0 -11 11 -11 q 11 0 11 11 z" fill={palette.engineRed} />
            <Circle cx={0} cy={-64} r={4.4} fill={palette.gold} />
            <Ellipse cx={-5} cy={-57} rx={4.4} ry={2.4} fill={HIGHLIGHT} />
          </G>
          {/* the coiled hose and the helmet left out after the last shout */}
          <G x={238} y={296} scale={1.05}>
            <Contact cx={0} cy={3} rx={22} />
            <Ellipse cx={0} cy={-6} rx={21} ry={10} fill={palette.gold} />
            <Ellipse cx={0} cy={-9} rx={21} ry={10} fill={palette.safetyYellow} />
            <Ellipse cx={0} cy={-9} rx={13} ry={6.4} fill={palette.goldDark} />
            <Ellipse cx={0} cy={-11} rx={13} ry={6.4} fill="#FFD766" />
            <Ellipse cx={-8} cy={-15} rx={7} ry={2.6} fill={HIGHLIGHT} />
            <Rect x={14} y={-13} width={14} height={7} rx={3.5} fill={palette.slate} />
          </G>
          <G x={226} y={318} scale={0.95}>
            <Contact cx={0} cy={2} rx={19} />
            <Path d="M -16 0 q -3 -20 16 -20 q 19 0 16 20 z" fill={palette.engineRed} />
            <Path d="M -16 0 q -3 -20 16 -20 l 0 20 z" fill={HIGHLIGHT} />
            <Path d="M -20 0 h 40 l -3 5 h -34 z" fill={palette.engineRedDark} />
            <Path d="M -7 -13 l 7 -8 l 7 8 z" fill={palette.safetyYellow} />
          </G>
          <Bollard x={14} y={288} h={28} s={1.25} />
          <Bollard x={286} y={288} h={28} s={1.25} />
          <Cone x={84} y={320} h={26} s={1.15} />
          <Drain x={168} y={322} s={1.15} />
          <Planter x={26} y={252} s={0.95} />
          <Planter x={274} y={252} s={0.95} />
          <Pigeon x={140} y={312} s={1} facing={-1} />
        </G>
      ) : null}
    </G>
  );
}

/* ------------------------------------------------------------------ */

export const school: SceneDef = {
  height: SCHOOL_H,
  ground: 'paving',
  /* a freestanding civic building reads as an object, so it keeps its ends;
     a shop in a terrace may run off both edges of the frame */
  spill: 0.93,
  art: schoolArt,
  sway: { x: 278, y: 16, kind: 'flag' },
};

export const park: SceneDef = {
  height: PARK_H,
  ground: 'grass',
  mid: 'trees',
  spill: 0.96,
  art: parkArt,
  sway: { x: 150, y: 70, kind: 'banner' },
};

export const clockTower: SceneDef = {
  height: TOWER_H,
  ground: 'paving',
  /* the tower is only 116 of its 300-unit box; without the spill it would be
     capped by the width of the low walls either side, which crop happily */
  spill: 1.42,
  art: clockTowerArt,
  sway: { x: 76, y: 196, kind: 'lantern' },
};

export const apartments: SceneDef = {
  height: APTS_H,
  ground: 'paving',
  art: apartmentsArt,
  sway: { x: 52, y: 128, kind: 'laundry' },
};

export const stationYard: SceneDef = {
  height: YARD_H,
  ground: 'apron',
  /* the child has to recognise the whole firehouse, so it never loses its ends */
  spill: 0.9,
  art: stationYardArt,
  sway: { x: 278, y: 36, kind: 'flag' },
};
