import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { EquipmentId } from '@/learning/types';
import { palette } from '@/theme';
import { mix } from '@/characters/rig/palettes';
import { HIGHLIGHT, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';
import { EquipmentIcon } from './EquipmentIcon';

const VB = 48;

/* House tones — rules 2 and 3, from the one shared source (`@/world/tone`). */
const HI = HIGHLIGHT;
const HI_STRONG = 'rgba(255,255,255,0.55)';
const dk = (c: string, a = 0.18) => mix(c, palette.navy, a);
const lt = (c: string, a = 0.3) => mix(c, '#FFFFFF', a);

/** rule 3 — every grounded object gets a contact ellipse, ry ≈ rx × 0.22. */
const Ground = ({ cy = 44, rx = 15, cx = 24 }: { cy?: number; rx?: number; cx?: number }) => (
  <Ellipse cx={cx} cy={cy} rx={rx} ry={shadowRy(rx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
);

/** Sky objects float — they get no contact ellipse. */
const SKY_IDS = new Set(['sun', 'cloud', 'rain', 'snow', 'wind', 'storm', 'moon', 'up', 'down', 'left', 'right']);

/** Ids that are already drawn as gear — VocabIcon reuses that art. */
const equipmentIds = new Set<string>(['ladder', 'hose', 'cone', 'flashlight', 'helmet', 'radio', 'boots', 'first-aid', 'bucket', 'extinguisher', 'rope', 'axe']);

export type VocabIconId =
  | 'water' | 'help' | 'open' | 'closed' | 'red' | 'blue' | 'one' | 'two' | 'three'
  | 'ladder' | 'hose' | 'truck' | 'hydrant' | 'cone' | 'flashlight' | 'helmet' | 'radio' | 'boots'
  | 'first-aid' | 'bucket' | 'extinguisher' | 'rope' | 'axe'
  | 'tomato' | 'cheese' | 'milk' | 'apple' | 'bread' | 'egg' | 'flour' | 'butter' | 'sugar'
  | 'strawberry' | 'banana' | 'mushroom' | 'pepper' | 'olive' | 'basil' | 'taco' | 'pizza' | 'soup'
  | 'cat' | 'dog' | 'bunny' | 'duck' | 'turtle'
  | 'bakery' | 'school' | 'library' | 'park' | 'pet-shop' | 'market' | 'house' | 'tree'
  | 'sun' | 'cloud' | 'rain'
  | 'left' | 'right' | 'up' | 'down' | 'happy' | 'sad'
  /* --- drawn for the content writers' WANTED_ICONS list --- */
  | 'lemon' | 'onion' | 'cilantro' | 'corn' | 'rice' | 'beans' | 'grape' | 'watermelon'
  | 'carrot' | 'potato' | 'lettuce' | 'juice' | 'honey' | 'salt' | 'tortilla' | 'quesadilla' | 'cake'
  | 'museum' | 'train-station' | 'hospital' | 'garden' | 'festival' | 'farm' | 'beach' | 'street'
  | 'pond' | 'restaurant' | 'store' | 'zoo' | 'flower' | 'river' | 'moon'
  | 'snow' | 'wind' | 'storm'
  | 'gloves' | 'whistle' | 'siren' | 'uniform' | 'bandage' | 'stretcher' | 'toolbox' | 'flag'
  | 'nurse' | 'police' | 'mail-carrier' | 'farmer' | 'cook' | 'vet' | 'driver' | 'musician'
  | 'gardener' | 'shopkeeper' | 'train-conductor' | 'scientist'
  | 'bird' | 'fish' | 'horse' | 'cow' | 'sheep' | 'pig' | 'mouse' | 'frog' | 'parrot' | 'lizard'
  | 'north' | 'south' | 'east' | 'west' | 'stop' | 'wait' | 'listen' | 'look' | 'please' | 'sorry'
  | 'careful' | 'big' | 'small' | 'hot' | 'cold' | 'fast'
  | 'scared' | 'proud' | 'tired' | 'excited' | 'calm' | 'brave'
  | 'black' | 'pink' | 'purple';

/** Every id this sheet draws — used by the dev gallery and by content authors. */
export const vocabIconIds: readonly VocabIconId[] = [
  'water', 'help', 'open', 'closed', 'red', 'blue', 'one', 'two', 'three',
  'ladder', 'hose', 'truck', 'hydrant', 'cone', 'flashlight', 'helmet', 'radio', 'boots',
  'first-aid', 'bucket', 'extinguisher', 'rope', 'axe',
  'tomato', 'cheese', 'milk', 'apple', 'bread', 'egg', 'flour', 'butter', 'sugar',
  'strawberry', 'banana', 'mushroom', 'pepper', 'olive', 'basil', 'taco', 'pizza', 'soup',
  'lemon', 'onion', 'cilantro', 'corn', 'rice', 'beans', 'grape', 'watermelon',
  'carrot', 'potato', 'lettuce', 'juice', 'honey', 'salt', 'tortilla', 'quesadilla', 'cake',
  'cat', 'dog', 'bunny', 'duck', 'turtle',
  'bird', 'fish', 'horse', 'cow', 'sheep', 'pig', 'mouse', 'frog', 'parrot', 'lizard',
  'bakery', 'school', 'library', 'park', 'pet-shop', 'market', 'house', 'tree',
  'museum', 'train-station', 'hospital', 'garden', 'festival', 'farm', 'beach', 'street',
  'pond', 'restaurant', 'store', 'zoo', 'flower', 'river',
  'sun', 'cloud', 'rain', 'moon', 'snow', 'wind', 'storm',
  'gloves', 'whistle', 'siren', 'uniform', 'bandage', 'stretcher', 'toolbox', 'flag',
  'nurse', 'police', 'mail-carrier', 'farmer', 'cook', 'vet', 'driver', 'musician',
  'gardener', 'shopkeeper', 'train-conductor', 'scientist',
  'left', 'right', 'up', 'down',
  'north', 'south', 'east', 'west', 'stop', 'wait', 'listen', 'look', 'please', 'sorry',
  'careful', 'big', 'small', 'hot', 'cold', 'fast',
  'happy', 'sad', 'scared', 'proud', 'tired', 'excited', 'calm', 'brave',
  'black', 'pink', 'purple',
];

const NAVY = palette.navy;

/* --- small shared builders ---------------------------------------- */

const Arrow = ({ rotate }: { rotate: number }) => (
  <G transform={`rotate(${rotate} 24 24)`}>
    <Rect x={4} y={4} width={40} height={40} rx={12} fill="#2E7BD6" />
    <Rect x={4} y={4} width={40} height={36} rx={12} fill="#4FA3F7" />
    <Path d="M 24 12 L 34 24 L 28.5 24 L 28.5 36 L 19.5 36 L 19.5 24 L 14 24 Z" fill="#FFFFFF" />
  </G>
);

const Shop = ({ body, roof, sign }: { body: string; roof: string; sign: React.ReactNode }) => (
  <G>
    <Rect x={6} y={18} width={36} height={26} rx={4} fill="#E4BF83" />
    <Rect x={6} y={18} width={36} height={23} rx={4} fill={body} />
    <Path d="M 4 18 L 24 6 L 44 18 Z" fill={roof} />
    <Rect x={10} y={22} width={9} height={4} rx={2} fill="#FFFFFF" opacity={0.55} />
    <Rect x={11} y={30} width={12} height={14} rx={2.5} fill="#8FC9F2" />
    <Rect x={27} y={30} width={11} height={14} rx={2.5} fill="#6B4A2A" />
    <Circle cx={29.5} cy={38} r={1.3} fill={palette.safetyYellow} />
    {sign}
  </G>
);

type Mood = 'happy' | 'sad' | 'scared' | 'proud' | 'tired' | 'excited' | 'calm' | 'brave';

const moodTint: Record<Mood, string> = {
  happy: palette.safetyYellow,
  sad: '#A9BEE6',
  scared: '#C9E9F7',
  proud: '#FFD75E',
  tired: '#C9C6E4',
  excited: '#FFB24A',
  calm: '#B9E7C6',
  brave: '#FF9A6B',
};

/** One face, eight moods — feelings words share the head so they read as a family. */
const Face = ({ mood }: { mood: Mood }) => {
  const base = moodTint[mood];
  const eyeR = mood === 'scared' || mood === 'excited' ? 3.8 : mood === 'tired' ? 2.4 : 3;
  const arcEyes = mood === 'proud' || mood === 'calm';
  return (
    <G>
      <Ground cy={44} rx={15} />
      <Circle cx={24} cy={24} r={19} fill={dk(base, 0.2)} />
      <Circle cx={24} cy={23} r={18} fill={base} />
      <Ellipse cx={16} cy={14} rx={5.4} ry={3.4} fill={HI} transform="rotate(-32 16 14)" />
      {arcEyes ? (
        <G>
          <Path d="M 14 21.6 Q 17.5 16.6 21 21.6" stroke={NAVY} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 27 21.6 Q 30.5 16.6 34 21.6" stroke={NAVY} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      ) : (
        <G>
          <Circle cx={17.5} cy={20} r={eyeR} fill={NAVY} />
          <Circle cx={30.5} cy={20} r={eyeR} fill={NAVY} />
          <Circle cx={18.6} cy={19} r={eyeR * 0.36} fill="#FFFFFF" />
          <Circle cx={31.6} cy={19} r={eyeR * 0.36} fill="#FFFFFF" />
        </G>
      )}
      {mood === 'sad' ? (
        <G>
          <Path d="M 16 33 Q 24 26 32 33" stroke={NAVY} strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <Path d="M 31.5 24 q 2.4 4 0 5.4 q -2.4 -1.4 0 -5.4 z" fill="#4FC3F7" />
        </G>
      ) : mood === 'scared' ? (
        <G>
          <Ellipse cx={24} cy={31} rx={5} ry={6} fill="#8E3346" />
          <Path d="M 12 13 l 5 3 M 36 13 l -5 3" stroke={NAVY} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      ) : mood === 'tired' ? (
        <G>
          <Path d="M 18 31 Q 24 28 30 31" stroke={NAVY} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 36 10 q 4 0 0 4 q 4 0 0 4" stroke={NAVY} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6} />
        </G>
      ) : mood === 'excited' ? (
        <G>
          <Path d="M 15 28 Q 24 40 33 28 Z" fill="#8E3346" />
          <Ellipse cx={24} cy={34} rx={4} ry={2.4} fill="#F2748B" />
          <Path d="M 6 12 l 1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4 z" fill="#FFF1A8" />
        </G>
      ) : mood === 'brave' ? (
        <G>
          <Path d="M 15 28 Q 24 37 33 28" stroke={NAVY} strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Path d="M 24 4 C 30 9 31 13 24 19 C 17 13 18 9 24 4 Z" fill={palette.engineRed} opacity={0.9} />
        </G>
      ) : mood === 'proud' ? (
        <G>
          <Path d="M 15 28 Q 24 38 33 28" stroke={NAVY} strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Path d="M 24 2 l 1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 z" fill={palette.gold} />
        </G>
      ) : mood === 'calm' ? (
        <Path d="M 18 30 Q 24 34 30 30" stroke={NAVY} strokeWidth={3} strokeLinecap="round" fill="none" />
      ) : (
        <Path d="M 15 28 Q 24 37 33 28" stroke={NAVY} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      )}
      <Ellipse cx={12} cy={26} rx={3.4} ry={2.2} fill="#FF9EA8" opacity={0.6} />
      <Ellipse cx={36} cy={26} rx={3.4} ry={2.2} fill="#FF9EA8" opacity={0.6} />
    </G>
  );
};

/* ---- shared builders for the WANTED_ICONS sheet -------------------- */

/** A small green leaf, for anything that grew. */
const Leaf = ({ x = 27, y = 10, flip = false }: { x?: number; y?: number; flip?: boolean }) => (
  <Path
    d={`M ${x} ${y} C ${x + (flip ? -11 : 11)} ${y - 5} ${x + (flip ? -13 : 13)} ${y + 3} ${x + (flip ? -6 : 6)} ${y + 6} C ${x + (flip ? -2 : 2)} ${y + 6} ${x} ${y + 3} ${x} ${y} Z`}
    fill={palette.leafGreen}
  />
);

/** Head-and-shoulders of a neighbour — every "people" word is this bust. */
const Bust = ({
  skin = '#FFD3B0',
  top,
  hair = '#3A3348',
  hat,
  hatBrim = false,
  badge,
}: { skin?: string; top: string; hair?: string; hat?: string; hatBrim?: boolean; badge?: string }) => (
  <G>
    <Ground cy={45} rx={16} />
    <Path d="M 6 45 C 6 33 13.5 27 24 27 C 34.5 27 42 33 42 45 Z" fill={dk(top, 0.22)} />
    <Path d="M 7.6 45 C 7.6 34.4 14.6 28.6 24 28.6 C 33.4 28.6 40.4 34.4 40.4 45 Z" fill={top} />
    <Path d="M 24 28.6 L 27.5 45 L 20.5 45 Z" fill={lt(top, 0.35)} />
    {badge ? <Circle cx={33} cy={37} r={3.2} fill={badge} /> : null}
    <Path d="M 19 22 h 10 v 7 c 0 3 -10 3 -10 0 z" fill={dk(skin, 0.16)} />
    <Circle cx={24} cy={16.5} r={11} fill={hair} />
    <Circle cx={24} cy={17.5} r={9.6} fill={skin} />
    <Ellipse cx={19} cy={12.6} rx={3.6} ry={2.2} fill={HI} transform="rotate(-28 19 12.6)" />
    <Circle cx={20.6} cy={17.6} r={1.8} fill={NAVY} />
    <Circle cx={27.4} cy={17.6} r={1.8} fill={NAVY} />
    <Path d="M 21 22 q 3 2.6 6 0" stroke={NAVY} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Ellipse cx={16.6} cy={20.4} rx={2.4} ry={1.6} fill="#FF9EA8" opacity={0.6} />
    <Ellipse cx={31.4} cy={20.4} rx={2.4} ry={1.6} fill="#FF9EA8" opacity={0.6} />
    {hat ? (
      <G>
        <Path d="M 13.4 11 C 13.4 4 18 1 24 1 C 30 1 34.6 4 34.6 11 Z" fill={dk(hat, 0.22)} />
        <Path d="M 15 10.4 C 15 5 19 2.4 24 2.4 C 29 2.4 33 5 33 10.4 Z" fill={hat} />
        {hatBrim ? <Rect x={10} y={9.6} width={28} height={4.4} rx={2.2} fill={dk(hat, 0.22)} /> : null}
        <Path d="M 18.6 6.6 C 20 4.6 22 3.6 23.6 3.6" stroke={HI_STRONG} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </G>
    ) : null}
  </G>
);

/** A four-legged friend: body + head + ears, tinted per animal. */
const Critter = ({
  coat,
  ear = 'round',
  snout,
  detail,
}: { coat: string; ear?: 'round' | 'point' | 'floppy' | 'long'; snout?: string; detail?: React.ReactNode }) => {
  const s = snout ?? lt(coat, 0.4);
  return (
    <G>
      <Ground cy={44} rx={16} />
      <Ellipse cx={31} cy={31} rx={14} ry={11.5} fill={dk(coat, 0.2)} />
      <Ellipse cx={31} cy={30} rx={13} ry={10.6} fill={coat} />
      <Rect x={22} y={36} width={5.4} height={8} rx={2.7} fill={dk(coat, 0.28)} />
      <Rect x={35} y={36} width={5.4} height={8} rx={2.7} fill={dk(coat, 0.28)} />
      {ear === 'point' ? (
        <G>
          <Path d="M 8 16 L 6.5 5 L 15 11 Z" fill={dk(coat, 0.2)} />
          <Path d="M 24 15 L 26 5 L 17 10.5 Z" fill={dk(coat, 0.2)} />
        </G>
      ) : ear === 'long' ? (
        <G>
          <Ellipse cx={10} cy={7} rx={3.6} ry={8} fill={dk(coat, 0.2)} transform="rotate(-12 10 7)" />
          <Ellipse cx={20} cy={6} rx={3.6} ry={8} fill={dk(coat, 0.2)} transform="rotate(8 20 6)" />
        </G>
      ) : ear === 'floppy' ? (
        <G>
          <Ellipse cx={6.5} cy={20} rx={5} ry={8.4} fill={dk(coat, 0.26)} transform="rotate(16 6.5 20)" />
          <Ellipse cx={24} cy={12} rx={4.6} ry={7} fill={dk(coat, 0.26)} transform="rotate(22 24 12)" />
        </G>
      ) : (
        <G>
          <Circle cx={8} cy={12} r={5.4} fill={dk(coat, 0.2)} />
          <Circle cx={23} cy={9} r={5} fill={dk(coat, 0.2)} />
        </G>
      )}
      <Circle cx={16} cy={20.5} r={13} fill={dk(coat, 0.16)} />
      <Circle cx={15.4} cy={19.6} r={12.2} fill={coat} />
      <Ellipse cx={9} cy={12} rx={4} ry={2.6} fill={HI} transform="rotate(-28 9 12)" />
      <Ellipse cx={15} cy={25} rx={8} ry={5.4} fill={s} />
      <Circle cx={11} cy={17.5} r={2.4} fill={NAVY} />
      <Circle cx={20} cy={17.5} r={2.4} fill={NAVY} />
      <Circle cx={11.8} cy={16.7} r={0.9} fill="#FFFFFF" />
      <Circle cx={20.8} cy={16.7} r={0.9} fill="#FFFFFF" />
      <Ellipse cx={15} cy={22.6} rx={2.6} ry={1.9} fill={NAVY} />
      <Path d="M 15 24.4 v 1.8 M 15 26.2 q -2.4 1.8 -3.8 0 M 15 26.2 q 2.4 1.8 3.8 0" stroke={NAVY} strokeWidth={1.4} strokeLinecap="round" fill="none" />
      {detail}
    </G>
  );
};

/** A little town building — every place word is one of these, drawn individually. */
const Place = ({
  body,
  roof,
  roofShape = 'pitch',
  detail,
}: { body: string; roof: string; roofShape?: 'pitch' | 'flat' | 'dome'; detail?: React.ReactNode }) => (
  <G>
    <Ground cy={45} rx={18} />
    <Rect x={6} y={20} width={36} height={24} rx={4} fill={dk(body, 0.22)} />
    <Rect x={6} y={20} width={36} height={21} rx={4} fill={body} />
    <Rect x={6} y={20} width={7} height={24} rx={4} fill={dk(body, 0.14)} />
    {roofShape === 'pitch' ? (
      <G>
        <Path d="M 3 21 L 24 7 L 45 21 Z" fill={dk(roof, 0.24)} />
        <Path d="M 6 20 L 24 8.6 L 42 20 Z" fill={roof} />
      </G>
    ) : roofShape === 'dome' ? (
      <G>
        <Path d="M 10 20 A 14 14 0 0 1 38 20 Z" fill={dk(roof, 0.24)} />
        <Path d="M 12 20 A 12 12 0 0 1 36 20 Z" fill={roof} />
      </G>
    ) : (
      <G>
        <Rect x={3} y={14} width={42} height={7} rx={3} fill={dk(roof, 0.24)} />
        <Rect x={3} y={14} width={42} height={5} rx={2.5} fill={roof} />
      </G>
    )}
    {detail}
  </G>
);

/** A flat colour swatch — the colour words. */
const Swatch = ({ c }: { c: string }) => (
  <G>
    <Ground cy={44} rx={14} />
    <Circle cx={24} cy={25} r={17} fill={dk(c, 0.24)} />
    <Circle cx={24} cy={24} r={16} fill={c} />
    <Ellipse cx={17} cy={16} rx={5.6} ry={3.6} fill={HI} transform="rotate(-30 17 16)" />
  </G>
);

/** The compass the direction words share — only the needle turns. */
const Compass = ({ deg }: { deg: number }) => (
  <G>
    <Ground cy={44} rx={14} />
    <Circle cx={24} cy={24} r={18} fill="#B4C6DE" />
    <Circle cx={24} cy={23} r={17} fill={palette.cream} />
    <Circle cx={24} cy={23} r={13.6} fill={palette.panel} />
    <G transform={`rotate(${deg} 24 23)`}>
      <Path d="M 24 8 L 29 23 L 24 20 Z" fill={palette.engineRed} />
      <Path d="M 24 8 L 19 23 L 24 20 Z" fill={palette.engineRedDark} />
      <Path d="M 24 38 L 29 23 L 24 26 Z" fill="#DDE3F0" />
      <Path d="M 24 38 L 19 23 L 24 26 Z" fill="#B4C6DE" />
    </G>
    <Circle cx={24} cy={23} r={2.6} fill={NAVY} />
    <Ellipse cx={16} cy={13} rx={4.6} ry={2.8} fill={HI_STRONG} transform="rotate(-32 16 13)" />
  </G>
);

/** A thermometer — hot and cold are the same object with a different reading. */
const Thermo = ({ hot }: { hot: boolean }) => (
  <G>
    <Ground cy={45} rx={11} />
    <Rect x={19} y={4} width={10} height={30} rx={5} fill="#B4C6DE" />
    <Rect x={20.4} y={5.4} width={7.2} height={28} rx={3.6} fill={palette.white} />
    <Circle cx={24} cy={37} r={8} fill="#B4C6DE" />
    <Circle cx={24} cy={36.4} r={6.8} fill={hot ? palette.engineRed : palette.waterCyan} />
    <Rect x={21.6} y={hot ? 9 : 22} width={4.8} height={hot ? 26 : 13} rx={2.4} fill={hot ? palette.engineRed : palette.waterCyan} />
    <Rect x={22} y={hot ? 10.4 : 23.4} width={1.8} height={hot ? 8 : 5} rx={0.9} fill={HI_STRONG} />
    <Path d="M 31 12 h 5 M 31 19 h 5 M 31 26 h 5" stroke={palette.navyMuted} strokeWidth={2} strokeLinecap="round" />
    {hot ? (
      <Path d="M 39 8 C 44 13 44.6 17 39 22 C 33.4 17 34 13 39 8 Z" fill={palette.flameOuter} opacity={0.9} />
    ) : (
      <G opacity={0.9}>
        <Path d="M 39 6 v 14 M 33 9.5 l 12 7 M 45 9.5 l -12 7" stroke={palette.waterCyanLight} strokeWidth={2.6} strokeLinecap="round" />
      </G>
    )}
  </G>
);

const CountDots = ({ n }: { n: 1 | 2 | 3 }) => {
  const spots: [number, number][][] = [
    [[24, 24]],
    [
      [16, 24],
      [32, 24],
    ],
    [
      [24, 14],
      [15, 30],
      [33, 30],
    ],
  ];
  const list = spots[n - 1] ?? [];
  return (
    <G>
      <Rect x={4} y={4} width={40} height={40} rx={12} fill={palette.creamDeep} />
      <Rect x={4} y={4} width={40} height={36} rx={12} fill={palette.cream} />
      {list.map(([cx, cy], i) => (
        <G key={i}>
          <Circle cx={cx} cy={cy + 1} r={6.4} fill={palette.engineRedDark} />
          <Circle cx={cx} cy={cy} r={6} fill={palette.engineRed} />
          <Circle cx={cx - 2} cy={cy - 2.2} r={1.8} fill="rgba(255,255,255,0.6)" />
        </G>
      ))}
    </G>
  );
};

/* --- the sheet ----------------------------------------------------- */

function Art({ id }: { id: string }) {
  switch (id) {
    case 'water':
      return (
        <G>
          <Path d="M 24 4 C 32 15 39 22 39 30 A 15 15 0 0 1 9 30 C 9 22 16 15 24 4 Z" fill={palette.waterCyanDark} />
          <Path d="M 24 7 C 31 17 37 23 37 30 A 13 13 0 0 1 11 30 C 11 23 17 17 24 7 Z" fill={palette.waterCyan} />
          <Path d="M 17 30 A 7 7 0 0 0 22 37" stroke="rgba(255,255,255,0.75)" strokeWidth={3.2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'help':
      return (
        <G>
          <Rect x={14} y={20} width={20} height={24} rx={9} fill="#EBB48E" />
          <Rect x={14} y={20} width={20} height={21} rx={9} fill="#FFD3B0" />
          {([
            [17.5, 10],
            [22.5, 7],
            [27.5, 8],
          ] as [number, number][]).map(([x, y], i) => (
            <Rect key={i} x={x - 2.6} y={y} width={5.4} height={18} rx={2.7} fill="#FFD3B0" />
          ))}
          <Rect x={30.5} y={16} width={5.4} height={13} rx={2.7} fill="#FFD3B0" transform="rotate(22 33 22)" />
          <Path d="M 8 14 q 3 -3 3 -6 M 40 14 q -3 -3 -3 -6" stroke={palette.safetyYellow} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'open':
      return (
        <G>
          <Rect x={9} y={6} width={30} height={38} rx={4} fill="#B78654" />
          <Rect x={12} y={9} width={24} height={35} rx={3} fill="#F2E2C6" />
          <Path d="M 12 9 L 32 4 L 32 44 L 12 44 Z" fill={palette.leafGreen} />
          <Path d="M 13.4 10.4 L 30.6 6 L 30.6 42.6 L 13.4 42.6 Z" fill="#6FCB73" />
          <Circle cx={16.5} cy={26} r={2.2} fill={palette.safetyYellow} />
          <Path d="M 36 20 l 6 4 -6 4" stroke={palette.leafGreenDark} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    case 'closed':
      return (
        <G>
          <Rect x={9} y={6} width={30} height={38} rx={4} fill="#8E5F35" />
          <Rect x={11} y={8} width={26} height={36} rx={3} fill="#B78654" />
          <Rect x={14.5} y={12} width={19} height={12} rx={2.5} fill="#9A6C3E" />
          <Rect x={14.5} y={28} width={19} height={12} rx={2.5} fill="#9A6C3E" />
          <Circle cx={32.5} cy={26} r={2.6} fill={palette.safetyYellow} />
          <Rect x={13} y={20} width={22} height={9} rx={4.5} fill={palette.engineRed} transform="rotate(-8 24 24)" />
        </G>
      );
    case 'red':
    case 'blue': {
      const c = id === 'red' ? palette.engineRed : '#3D8BE8';
      const d = id === 'red' ? palette.engineRedDark : '#2A6BC0';
      return (
        <G>
          <Circle cx={24} cy={25} r={18} fill={d} />
          <Circle cx={24} cy={24} r={17} fill={c} />
          <Ellipse cx={17} cy={16} rx={6} ry={4} fill="#FFFFFF" opacity={0.4} transform="rotate(-30 17 16)" />
        </G>
      );
    }
    case 'one':
      return <CountDots n={1} />;
    case 'two':
      return <CountDots n={2} />;
    case 'three':
      return <CountDots n={3} />;
    case 'truck':
      return (
        <G>
          <Rect x={3} y={16} width={42} height={19} rx={5} fill={palette.engineRedDark} />
          <Rect x={3} y={16} width={42} height={16} rx={5} fill={palette.engineRed} />
          <Rect x={26} y={11} width={17} height={12} rx={4} fill={palette.engineRed} />
          <Rect x={29} y={14} width={11} height={7} rx={2.5} fill="#8FC9F2" />
          <Rect x={5} y={10} width={20} height={4} rx={2} fill="#DDE3F0" />
          <Rect x={6} y={7} width={5} height={4} rx={1.6} fill="#4FA3F7" />
          <Rect x={3} y={26} width={42} height={4} fill={palette.safetyYellow} />
          <Circle cx={13} cy={36} r={6.5} fill="#39425F" />
          <Circle cx={35} cy={36} r={6.5} fill="#39425F" />
          <Circle cx={13} cy={36} r={3} fill="#C6CDE0" />
          <Circle cx={35} cy={36} r={3} fill="#C6CDE0" />
        </G>
      );
    case 'hydrant':
      return (
        <G>
          <Rect x={17} y={7} width={14} height={5} rx={2.5} fill={palette.engineRedDark} />
          <Circle cx={24} cy={8} r={4} fill={palette.engineRed} />
          <Path d="M 15 13 h 18 v 24 a 5 5 0 0 1 -5 5 h -8 a 5 5 0 0 1 -5 -5 z" fill={palette.engineRedDark} />
          <Path d="M 16 14 h 15 v 23 a 4 4 0 0 1 -4 4 h -7 a 4 4 0 0 1 -4 -4 z" fill={palette.engineRed} />
          <Rect x={7} y={19} width={9} height={8} rx={3} fill={palette.engineRedDark} />
          <Rect x={32} y={19} width={9} height={8} rx={3} fill={palette.engineRedDark} />
          <Circle cx={9.5} cy={23} r={2.4} fill={palette.gold} />
          <Circle cx={38.5} cy={23} r={2.4} fill={palette.gold} />
          <Rect x={12} y={40} width={24} height={5} rx={2.5} fill="#B9261C" />
          <Rect x={18.5} y={16} width={3} height={12} rx={1.5} fill="rgba(255,255,255,0.4)" />
        </G>
      );
    case 'tomato':
      return (
        <G>
          <Circle cx={24} cy={27} r={17} fill="#C4241A" />
          <Circle cx={24} cy={26} r={16} fill="#E63B2E" />
          <Ellipse cx={17} cy={19} rx={5} ry={3.4} fill="#FFFFFF" opacity={0.4} transform="rotate(-32 17 19)" />
          <Path d="M 24 12 l 6 -3 -2 5 5 -1 -4 4 -5 1 z M 24 12 l -6 -3 2 5 -5 -1 4 4 5 1 z" fill={palette.leafGreen} />
          <Rect x={22.6} y={5} width={3} height={8} rx={1.5} fill={palette.leafGreenDark} />
        </G>
      );
    case 'cheese':
      return (
        <G>
          <Path d="M 5 32 L 41 14 A 4 4 0 0 1 45 18 L 45 32 A 4 4 0 0 1 41 36 L 9 36 A 4 4 0 0 1 5 32 Z" fill="#E0A800" />
          <Path d="M 6.5 31 L 40.5 15.6 A 3 3 0 0 1 43.5 18.4 L 43.5 31 A 3 3 0 0 1 40.5 34 L 9.5 34 A 3 3 0 0 1 6.5 31 Z" fill={palette.safetyYellow} />
          <Circle cx={17} cy={28} r={3.4} fill="#E0A800" />
          <Circle cx={28} cy={25} r={2.6} fill="#E0A800" />
          <Circle cx={37} cy={29} r={2.2} fill="#E0A800" />
        </G>
      );
    case 'milk':
      /* A cool blue-grey carton with a blue gable — reads on a white tile. */
      return (
        <G>
          <Path d="M 14 16 L 24 6 L 34 16 L 34 40 A 4 4 0 0 1 30 44 L 18 44 A 4 4 0 0 1 14 40 Z" fill="#A9BEDC" />
          <Path d="M 15.4 16.6 L 24 8 L 32.6 16.6 L 32.6 39.4 A 3 3 0 0 1 29.6 42.4 L 18.4 42.4 A 3 3 0 0 1 15.4 39.4 Z" fill="#E7F0FB" />
          <Path d="M 24 8 L 32.6 16.6 L 32.6 39.4 A 3 3 0 0 1 29.6 42.4 L 24 42.4 Z" fill="#D2E1F4" />
          <Path d="M 15.4 16.6 L 24 8 L 32.6 16.6 Z" fill="#4FA3F7" />
          <Rect x={17} y={24} width={14} height={12} rx={3} fill="#2E7BD6" />
          <Rect x={17} y={24} width={14} height={9.4} rx={3} fill="#4FA3F7" />
          <Path d="M 20 30 q 4 -5 8 0 q -4 5 -8 0 z" fill="#FFFFFF" />
          <Rect x={17.6} y={19} width={3.4} height={4} rx={1.7} fill={HI_STRONG} />
        </G>
      );
    case 'apple':
      return (
        <G>
          <Path d="M 24 14 C 30 9 42 12 42 25 C 42 36 34 44 28 44 C 26 44 25 43 24 43 C 23 43 22 44 20 44 C 14 44 6 36 6 25 C 6 12 18 9 24 14 Z" fill="#C4241A" />
          <Path d="M 24 16 C 29 12 40 14 40 25 C 40 35 33 42 28 42 C 26 42 25 41 24 41 Z" fill="#E63B2E" />
          <Path d="M 13 20 C 15 16 18 15 20 15" stroke="rgba(255,255,255,0.55)" strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Rect x={22.6} y={5} width={3} height={10} rx={1.5} fill="#7A4A28" transform="rotate(9 24 10)" />
          <Path d="M 26 9 C 32 5 37 7 36 12 C 32 15 27 13 26 9 Z" fill={palette.leafGreen} />
        </G>
      );
    case 'bread':
      return (
        <G>
          <Path d="M 5 30 C 5 18 13 12 24 12 C 35 12 43 18 43 30 C 43 36 39 40 33 40 L 15 40 C 9 40 5 36 5 30 Z" fill="#C98A3E" />
          <Path d="M 7 30 C 7 20 14 14 24 14 C 34 14 41 20 41 29.4 C 41 34.6 37.6 38 32.6 38 L 15.4 38 C 10.4 38 7 34.6 7 30 Z" fill="#E8A85A" />
          <Path d="M 14 22 l 5 -4 M 22 20 l 5 -4 M 30 21 l 5 -4" stroke="#B9762F" strokeWidth={2.8} strokeLinecap="round" />
          <Path d="M 11 27 C 12 23 15 20 18 19" stroke="rgba(255,255,255,0.4)" strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'egg':
      /* Warm ivory, not white — a white egg on a white tile disappears. */
      return (
        <G>
          <Path d="M 24 5 C 33 5 40 18 40 28 A 16 16 0 0 1 8 28 C 8 18 15 5 24 5 Z" fill="#D8C7A8" />
          <Path d="M 24 7 C 32 7 38 19 38 28 A 14 14 0 0 1 10 28 C 10 19 16 7 24 7 Z" fill="#F7EBD6" />
          <Path d="M 24 30 A 14 14 0 0 1 10.4 30.6 A 14 14 0 0 0 38 28 C 38 28.9 37.9 29.8 37.7 30.6 A 14 14 0 0 1 24 30 Z" fill="#E6D6B8" />
          <Ellipse cx={17.5} cy={20} rx={4.4} ry={6} fill={HI_STRONG} transform="rotate(-18 17.5 20)" />
        </G>
      );
    case 'flour':
      /* A tan paper sack with a cream label — the old cream-on-white read as nothing. */
      return (
        <G>
          <Path d="M 11 18 L 37 18 L 40 40 A 4 4 0 0 1 36 44 L 12 44 A 4 4 0 0 1 8 40 Z" fill="#C9A268" />
          <Path d="M 12.4 19.4 L 35.6 19.4 L 38.4 39.6 A 3 3 0 0 1 35.4 42.6 L 12.6 42.6 A 3 3 0 0 1 9.6 39.6 Z" fill="#E8CE9E" />
          <Path d="M 14 18 C 14 12 20 8 24 8 C 28 8 34 12 34 18 Z" fill="#B98F55" />
          <Rect x={14} y={25} width={20} height={12} rx={3} fill="#8E5F35" />
          <Rect x={15.4} y={26.2} width={17.2} height={9} rx={2.4} fill={palette.cream} />
          <Path d="M 19 32 q 5 -6 10 0" stroke="#B9762F" strokeWidth={2.2} strokeLinecap="round" fill="none" />
          <Circle cx={19} cy={13} r={2} fill="#FFF6E5" />
          <Circle cx={29} cy={12} r={1.6} fill="#FFF6E5" />
        </G>
      );
    case 'butter':
      return (
        <G>
          <Path d="M 6 30 L 34 16 L 44 22 L 16 36 Z" fill="#E0A800" />
          <Path d="M 6 30 L 16 36 L 16 42 L 6 36 Z" fill="#C98A00" />
          <Path d="M 16 36 L 44 22 L 44 28 L 16 42 Z" fill="#FFD75E" />
          <Path d="M 12 28 L 32 18" stroke="rgba(255,255,255,0.5)" strokeWidth={2.6} strokeLinecap="round" />
        </G>
      );
    case 'sugar':
      /* azúcar was white cubes on a white tile — effectively invisible.
         It is now a coloured paper bag with the cubes reading against it. */
      return (
        <G>
          <Path d="M 9 17 h 30 l 3 24 a 4 4 0 0 1 -4 4 h -28 a 4 4 0 0 1 -4 -4 z" fill="#C9A268" />
          <Path d="M 10.6 18.6 h 26.8 l 2.7 21.6 a 3 3 0 0 1 -3 3 h -26.2 a 3 3 0 0 1 -3 -3 z" fill="#E8CE9E" />
          <Path d="M 9 17 L 15 10 h 18 l 6 7 Z" fill="#B98F55" />
          <Rect x={8} y={26} width={32} height={10} rx={2} fill={palette.waterCyanDark} />
          <Rect x={8} y={26} width={32} height={7.4} rx={2} fill="#4FA3F7" />
          <Rect x={13} y={28.4} width={16} height={2.6} rx={1.3} fill="rgba(255,255,255,0.7)" />
          {/* two cubes spilled on top, reading against the brown paper */}
          <Rect x={17} y={4} width={11} height={11} rx={2.6} fill="#C6D2E8" />
          <Rect x={17} y={4} width={11} height={8.6} rx={2.6} fill="#FFFFFF" />
          <Rect x={28} y={8} width={9} height={9} rx={2.2} fill="#C6D2E8" />
          <Rect x={28} y={8} width={9} height={7} rx={2.2} fill="#FFFFFF" />
          <Rect x={19} y={6} width={4} height={2.4} rx={1.2} fill="#EDF3FB" />
        </G>
      );
    case 'strawberry':
      return (
        <G>
          <Path d="M 24 16 C 34 16 41 21 41 27 C 41 35 32 44 24 44 C 16 44 7 35 7 27 C 7 21 14 16 24 16 Z" fill="#C4241A" />
          <Path d="M 24 18 C 33 18 39 22 39 27 C 39 34 31 42 24 42 C 19 42 13 38 10 33 C 15 36 20 37 24 36 Z" fill="#E63B2E" />
          <Path d="M 14 23 C 16 20 19 19 22 19" stroke="rgba(255,255,255,0.4)" strokeWidth={2.8} strokeLinecap="round" fill="none" />
          {([
            [18, 25],
            [28, 24],
            [23, 31],
            [33, 30],
            [14, 32],
          ] as [number, number][]).map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={1.5} fill={palette.safetyYellow} />
          ))}
          <Path d="M 24 16 L 14 10 L 20 15 L 12 15 L 21 18 Z M 24 16 L 34 10 L 28 15 L 36 15 L 27 18 Z" fill={palette.leafGreen} />
          <Rect x={22.6} y={5} width={3} height={8} rx={1.5} fill={palette.leafGreenDark} />
        </G>
      );
    case 'banana':
      return (
        <G>
          <Path d="M 9 10 C 9 26 18 38 36 38 C 42 38 44 34 41 32 C 26 33 16 24 15 10 C 14 6 9 6 9 10 Z" fill="#E0A800" />
          <Path d="M 11 12 C 12 26 20 36 35.5 36 C 39.5 36 41 34 39.5 33.4 C 25 34 17 24 16.5 12 C 16 9 11 9 11 12 Z" fill={palette.safetyYellow} />
          <Path d="M 15 16 C 17 24 22 30 29 32" stroke="rgba(255,255,255,0.45)" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M 9 10 l -2 -4" stroke="#7A4A28" strokeWidth={3.4} strokeLinecap="round" />
          <Circle cx={41} cy={33} r={2.6} fill="#7A4A28" />
        </G>
      );
    case 'mushroom':
      return (
        <G>
          <Path d="M 18 28 h 12 v 12 a 6 6 0 0 1 -12 0 z" fill="#E6DCC4" />
          <Path d="M 19.4 28 h 9.2 v 12 a 4.6 4.6 0 0 1 -9.2 0 z" fill="#FFF6E5" />
          <Path d="M 5 28 C 5 16 13 8 24 8 C 35 8 43 16 43 28 Z" fill="#B9762F" />
          <Path d="M 7 27 C 7 17 14 10 24 10 C 34 10 41 17 41 27 Z" fill="#D28C42" />
          <Ellipse cx={16} cy={18} rx={4} ry={3} fill="#FFF6E5" opacity={0.85} />
          <Ellipse cx={30} cy={16} rx={3.2} ry={2.4} fill="#FFF6E5" opacity={0.85} />
          <Ellipse cx={35} cy={23} rx={2.6} ry={2} fill="#FFF6E5" opacity={0.7} />
        </G>
      );
    case 'pepper':
      return (
        <G>
          <Path d="M 24 14 C 34 14 40 21 40 30 C 40 38 34 44 28 44 C 26 44 25 42 24 42 C 23 42 22 44 20 44 C 14 44 8 38 8 30 C 8 21 14 14 24 14 Z" fill="#3B8E3F" />
          <Path d="M 24 16 C 32 16 38 22 38 30 C 38 37 33 42 28 42 C 26 42 25 40 24 40 Z" fill={palette.leafGreen} />
          <Path d="M 14 24 C 15 20 18 18 21 17" stroke="rgba(255,255,255,0.4)" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Rect x={22.4} y={5} width={3.2} height={11} rx={1.6} fill="#2F6E33" />
          <Path d="M 18 13 q 6 -4 12 0 q -6 4 -12 0 z" fill="#2F6E33" />
        </G>
      );
    case 'olive':
      return (
        <G>
          <Ellipse cx={18} cy={28} rx={13} ry={12} fill="#2A2F45" />
          <Ellipse cx={18} cy={27} rx={12} ry={11} fill="#3D4460" />
          <Ellipse cx={18} cy={27} rx={4.6} ry={4} fill="#F2E2C6" />
          <Ellipse cx={13} cy={21} rx={3.2} ry={2} fill="rgba(255,255,255,0.28)" transform="rotate(-28 13 21)" />
          <Ellipse cx={34} cy={20} rx={10} ry={9} fill="#2A2F45" />
          <Ellipse cx={34} cy={19} rx={9} ry={8} fill="#3D4460" />
          <Ellipse cx={34} cy={19} rx={3.4} ry={3} fill="#F2E2C6" />
        </G>
      );
    case 'basil':
      return (
        <G>
          <Path d="M 24 44 C 24 30 24 20 24 10" stroke="#3B8E3F" strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Path d="M 24 26 C 14 26 7 21 7 14 C 16 12 23 17 24 26 Z" fill="#3B8E3F" />
          <Path d="M 24 26 C 15 25.4 9.6 21.4 9 15.4 C 16 14.4 22 18.6 24 26 Z" fill={palette.leafGreen} />
          <Path d="M 24 22 C 34 22 41 17 41 10 C 32 8 25 13 24 22 Z" fill="#3B8E3F" />
          <Path d="M 24 22 C 33 21.4 38.4 17.4 39 11.4 C 32 10.4 26 14.6 24 22 Z" fill="#6FCB73" />
          <Path d="M 13 17 C 17 18 21 21 23 24" stroke="#2F6E33" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'taco':
      return (
        <G>
          <Path d="M 4 36 C 4 18 13 8 24 8 C 35 8 44 18 44 36 A 4 4 0 0 1 40 40 L 8 40 A 4 4 0 0 1 4 36 Z" fill="#E0A800" />
          <Path d="M 7 36 C 7 20 15 11 24 11 C 33 11 41 20 41 36 Z" fill={palette.safetyYellow} />
          <Path d="M 9 30 C 12 30 15 33 15 38 L 9 38 Z M 33 30 C 36 30 39 33 39 38 L 33 38 Z" fill="#FFD75E" />
          <Path d="M 12 28 C 18 24 30 24 36 28 C 34 32 14 32 12 28 Z" fill={palette.leafGreen} />
          <Circle cx={18} cy={30} r={3.4} fill={palette.engineRed} />
          <Circle cx={30} cy={30} r={3} fill={palette.engineRed} />
          <Circle cx={24} cy={27} r={2.6} fill="#FFF6E5" />
        </G>
      );
    case 'pizza':
      return (
        <G>
          <Path d="M 24 4 L 44 40 A 4 4 0 0 1 40 44 L 8 44 A 4 4 0 0 1 4 40 Z" fill="#E0A800" />
          <Path d="M 24 9 L 40 40 L 8 40 Z" fill="#FFD75E" />
          <Path d="M 24 13 L 37 38 L 11 38 Z" fill="#E63B2E" />
          <Path d="M 24 16 L 34.5 36.4 L 13.5 36.4 Z" fill="#FFC72C" />
          <Circle cx={24} cy={24} r={3.2} fill={palette.engineRed} />
          <Circle cx={18} cy={32} r={2.8} fill={palette.engineRed} />
          <Circle cx={30} cy={32} r={2.6} fill={palette.engineRed} />
          <Path d="M 21 29 q 3 -3 6 0" stroke={palette.leafGreen} strokeWidth={2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'soup':
      return (
        <G>
          <Path d="M 18 6 q 3 4 0 8 M 24 4 q 3 4 0 8 M 30 6 q 3 4 0 8" stroke="#C6CDE0" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M 5 22 h 38 c 0 12 -8 20 -19 20 S 5 34 5 22 Z" fill="#2E63B8" />
          <Path d="M 7 24 h 34 c 0 10 -7 17 -17 17 S 7 34 7 24 Z" fill="#4FA3F7" />
          <Ellipse cx={24} cy={23} rx={19} ry={4.6} fill="#7FBDF5" />
          <Ellipse cx={24} cy={23} rx={16} ry={3.4} fill="#E8A85A" />
          <Circle cx={19} cy={23} r={2} fill={palette.engineRed} />
          <Circle cx={28} cy={22.4} r={1.8} fill={palette.leafGreen} />
          <Path d="M 12 30 C 13 34 16 37 20 38" stroke="rgba(255,255,255,0.35)" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'cat':
      return (
        <G>
          <Path d="M 10 20 L 8 6 L 20 13 Z" fill="#E08A3C" />
          <Path d="M 38 20 L 40 6 L 28 13 Z" fill="#E08A3C" />
          <Path d="M 11.6 18 L 10.6 9.6 L 18 13.8 Z" fill="#FF9EA8" />
          <Path d="M 36.4 18 L 37.4 9.6 L 30 13.8 Z" fill="#FF9EA8" />
          <Circle cx={24} cy={26} r={17} fill="#E08A3C" />
          <Circle cx={24} cy={25} r={16} fill="#F0A55E" />
          <Ellipse cx={24} cy={31} rx={10} ry={7} fill="#FFF6E5" />
          <Circle cx={17.5} cy={22} r={3.4} fill={NAVY} />
          <Circle cx={30.5} cy={22} r={3.4} fill={NAVY} />
          <Circle cx={18.6} cy={20.8} r={1.2} fill="#FFFFFF" />
          <Circle cx={31.6} cy={20.8} r={1.2} fill="#FFFFFF" />
          <Path d="M 21 28.5 h 6 a 3 3 0 0 1 -3 2.6 a 3 3 0 0 1 -3 -2.6 z" fill="#FF7EB3" />
          <Path d="M 24 31 v 2 M 24 33 q -3 2.4 -5 0 M 24 33 q 3 2.4 5 0" stroke={NAVY} strokeWidth={1.6} strokeLinecap="round" fill="none" />
          <Path d="M 12 28 l -6 -1 M 12 31 l -6 2 M 36 28 l 6 -1 M 36 31 l 6 2" stroke={NAVY} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
        </G>
      );
    case 'dog':
      return (
        <G>
          <Ellipse cx={9} cy={26} rx={7} ry={12} fill="#7A4A28" />
          <Ellipse cx={39} cy={26} rx={7} ry={12} fill="#7A4A28" />
          <Circle cx={24} cy={25} r={17} fill="#9E6A36" />
          <Circle cx={24} cy={24} r={16} fill="#C58B4E" />
          <Ellipse cx={24} cy={31} rx={10} ry={8} fill="#F0D0A0" />
          <Circle cx={17.5} cy={21} r={3.4} fill={NAVY} />
          <Circle cx={30.5} cy={21} r={3.4} fill={NAVY} />
          <Circle cx={18.6} cy={19.8} r={1.2} fill="#FFFFFF" />
          <Circle cx={31.6} cy={19.8} r={1.2} fill="#FFFFFF" />
          <Path d="M 20 27 h 8 a 4 4 0 0 1 -4 3.4 a 4 4 0 0 1 -4 -3.4 z" fill={NAVY} />
          <Path d="M 24 31 v 2.4 M 24 33.4 q -3.4 2.6 -5.4 0 M 24 33.4 q 3.4 2.6 5.4 0" stroke={NAVY} strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <Path d="M 22 36 q 2 5 4 0 q -2 3 -4 0 z" fill="#FF7EB3" />
        </G>
      );
    case 'bunny':
      return (
        <G>
          <Ellipse cx={17} cy={12} rx={5} ry={11} fill="#B4C6DE" transform="rotate(-9 17 12)" />
          <Ellipse cx={31} cy={12} rx={5} ry={11} fill="#B4C6DE" transform="rotate(9 31 12)" />
          <Ellipse cx={17} cy={13} rx={2.6} ry={7.4} fill="#FFB7C9" transform="rotate(-9 17 13)" />
          <Ellipse cx={31} cy={13} rx={2.6} ry={7.4} fill="#FFB7C9" transform="rotate(9 31 13)" />
          <Circle cx={24.8} cy={31.8} r={14} fill="#B4C6DE" />
          <Circle cx={24} cy={30} r={13} fill="#F7FAFF" />
          <Circle cx={19} cy={28} r={3} fill={NAVY} />
          <Circle cx={29} cy={28} r={3} fill={NAVY} />
          <Circle cx={19.9} cy={27} r={1.1} fill="#FFFFFF" />
          <Circle cx={29.9} cy={27} r={1.1} fill="#FFFFFF" />
          <Path d="M 21.6 33.6 h 4.8 a 2.4 2.4 0 0 1 -2.4 2 a 2.4 2.4 0 0 1 -2.4 -2 z" fill="#FF7EB3" />
          <Ellipse cx={13} cy={33} rx={3} ry={2} fill="#FF9EA8" opacity={0.6} />
          <Ellipse cx={35} cy={33} rx={3} ry={2} fill="#FF9EA8" opacity={0.6} />
        </G>
      );
    case 'duck':
      return (
        <G>
          <Ellipse cx={26} cy={32} rx={17} ry={12} fill="#E0A800" />
          <Ellipse cx={26} cy={31} rx={16} ry={11} fill={palette.safetyYellow} />
          <Circle cx={16} cy={19} r={11} fill="#E0A800" />
          <Circle cx={16} cy={18} r={10} fill={palette.safetyYellow} />
          <Path d="M 6 19 q -5 2 0 5 q 4 0 6 -3 z" fill={palette.orange} />
          <Circle cx={17} cy={15.5} r={2.8} fill={NAVY} />
          <Circle cx={17.9} cy={14.6} r={1} fill="#FFFFFF" />
          <Path d="M 30 26 q 8 4 6 12 q -8 0 -10 -6 z" fill="#FFD75E" />
          <Ellipse cx={9} cy={24} rx={2.6} ry={1.8} fill="#FF9EA8" opacity={0.55} />
        </G>
      );
    case 'turtle':
      return (
        <G>
          <Ellipse cx={12} cy={30} rx={5} ry={3.4} fill="#6FCB73" />
          <Ellipse cx={36} cy={30} rx={5} ry={3.4} fill="#6FCB73" />
          <Path d="M 6 30 C 6 19 14 12 24 12 C 34 12 42 19 42 30 Z" fill="#8E6A2E" />
          <Path d="M 8 29.4 C 8 20 15 14 24 14 C 33 14 40 20 40 29.4 Z" fill="#C08A3C" />
          <Path d="M 24 16 l 6 5 -2.4 7 h -7.2 L 18 21 Z" fill="#8E6A2E" opacity={0.6} />
          <Path d="M 12 26 l 4.4 -3 M 36 26 l -4.4 -3" stroke="#8E6A2E" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          <Circle cx={24} cy={35} r={7} fill="#6FCB73" />
          <Circle cx={21.4} cy={34} r={1.8} fill={NAVY} />
          <Circle cx={26.6} cy={34} r={1.8} fill={NAVY} />
          <Path d="M 22 38 q 2 2 4 0" stroke={NAVY} strokeWidth={1.6} strokeLinecap="round" fill="none" />
          <Rect x={9} y={31} width={30} height={4} rx={2} fill="#3B8E3F" opacity={0.25} />
        </G>
      );
    case 'bakery':
      return (
        <Shop
          body={palette.tan}
          roof={palette.engineRed}
          sign={
            <G>
              <Rect x={14} y={10} width={20} height={7} rx={3.5} fill={palette.cream} />
              <Path d="M 18 15 C 18 11.4 21 9 24 9 C 27 9 30 11.4 30 15 Z" fill="#E8A85A" />
              <Path d="M 20 12.4 l 2 -1.6 M 24 11.6 l 2 -1.6" stroke="#B9762F" strokeWidth={1.4} strokeLinecap="round" />
            </G>
          }
        />
      );
    case 'school':
      return (
        <G>
          <Rect x={5} y={20} width={38} height={24} rx={4} fill="#E4BF83" />
          <Rect x={5} y={20} width={38} height={21} rx={4} fill={palette.tan} />
          <Path d="M 3 20 L 24 8 L 45 20 Z" fill={palette.engineRed} />
          <Rect x={20} y={2} width={8} height={8} rx={2} fill={palette.engineRedDark} />
          <Circle cx={24} cy={16} r={4.4} fill={palette.cream} />
          <Path d="M 24 13.4 v 2.6 h 2" stroke={NAVY} strokeWidth={1.4} strokeLinecap="round" />
          <Rect x={19} y={30} width={10} height={14} rx={2} fill="#6B4A2A" />
          <Circle cx={26.5} cy={37} r={1.2} fill={palette.safetyYellow} />
          <Rect x={9} y={26} width={7} height={7} rx={2} fill="#8FC9F2" />
          <Rect x={32} y={26} width={7} height={7} rx={2} fill="#8FC9F2" />
        </G>
      );
    case 'library':
      return (
        <G>
          <Rect x={5} y={22} width={38} height={22} rx={3} fill="#E4BF83" />
          <Rect x={5} y={22} width={38} height={19} rx={3} fill={palette.cream} />
          <Path d="M 3 22 L 24 10 L 45 22 Z" fill="#4FA3F7" />
          <Rect x={9} y={26} width={5} height={16} rx={2} fill="#E4BF83" />
          <Rect x={21.5} y={26} width={5} height={16} rx={2} fill="#E4BF83" />
          <Rect x={34} y={26} width={5} height={16} rx={2} fill="#E4BF83" />
          <Path d="M 24 13 L 33 17 L 33 20 L 24 16.6 L 15 20 L 15 17 Z" fill="#FFFFFF" />
          <Path d="M 24 16.6 L 24 20" stroke="#B4BCD4" strokeWidth={1.4} />
        </G>
      );
    case 'park':
      return (
        <G>
          <Rect x={2} y={34} width={44} height={10} rx={4} fill="#8FD16B" />
          <Circle cx={16} cy={18} r={11} fill="#3B8E3F" />
          <Circle cx={16} cy={17} r={10} fill={palette.leafGreen} />
          <Rect x={14} y={24} width={4.4} height={12} rx={2} fill="#7A4A28" />
          <Rect x={26} y={30} width={18} height={4} rx={2} fill="#C58B4E" />
          <Rect x={27} y={34} width={3} height={6} rx={1.5} fill="#8E5F35" />
          <Rect x={40} y={34} width={3} height={6} rx={1.5} fill="#8E5F35" />
          <Rect x={26} y={24} width={18} height={4} rx={2} fill="#C58B4E" />
          <Path d="M 8 12 q 4 -4 8 -2" stroke="rgba(255,255,255,0.4)" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'pet-shop':
      return (
        <Shop
          body="#FFD9E6"
          roof="#FF7EB3"
          sign={
            <G>
              <Rect x={15} y={10} width={18} height={7} rx={3.5} fill={palette.cream} />
              <Circle cx={24} cy={14.4} r={2.6} fill="#FF7EB3" />
              <Circle cx={20.4} cy={11.6} r={1.4} fill="#FF7EB3" />
              <Circle cx={24} cy={10.4} r={1.4} fill="#FF7EB3" />
              <Circle cx={27.6} cy={11.6} r={1.4} fill="#FF7EB3" />
            </G>
          }
        />
      );
    case 'market':
      return (
        <G>
          <Rect x={5} y={20} width={38} height={24} rx={4} fill="#E4BF83" />
          <Rect x={5} y={20} width={38} height={21} rx={4} fill={palette.tan} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={i} x={4 + i * 8} y={12} width={8} height={9} fill={i % 2 === 0 ? palette.engineRed : palette.white} />
          ))}
          <Path d="M 4 21 q 4 4 8 0 q 4 4 8 0 q 4 4 8 0 q 4 4 8 0 q 4 4 8 0 L 44 12 L 4 12 Z" fill="none" />
          <Rect x={2} y={10} width={44} height={4} rx={2} fill="#B9261C" />
          <Ellipse cx={17} cy={32} rx={9} ry={7} fill="#C58B4E" />
          <Ellipse cx={17} cy={30} rx={9} ry={4} fill="#E8A85A" />
          <Circle cx={13} cy={28} r={3} fill={palette.engineRed} />
          <Circle cx={19} cy={27.4} r={3} fill={palette.leafGreen} />
          <Circle cx={24} cy={29} r={2.6} fill={palette.safetyYellow} />
          <Rect x={30} y={26} width={11} height={13} rx={2.5} fill="#8FC9F2" />
        </G>
      );
    case 'house':
      return (
        <G>
          <Rect x={8} y={22} width={32} height={22} rx={3} fill="#E4BF83" />
          <Rect x={8} y={22} width={32} height={19} rx={3} fill={palette.cream} />
          <Path d="M 4 23 L 24 7 L 44 23 Z" fill="#B9261C" />
          <Path d="M 7 22 L 24 9 L 41 22 Z" fill={palette.engineRed} />
          <Rect x={19} y={30} width={10} height={14} rx={2} fill="#8E5F35" />
          <Circle cx={26.4} cy={37} r={1.2} fill={palette.safetyYellow} />
          <Rect x={11} y={26} width={6} height={6} rx={1.8} fill="#8FC9F2" />
          <Rect x={31} y={26} width={6} height={6} rx={1.8} fill="#8FC9F2" />
          <Rect x={33} y={11} width={5} height={8} rx={2} fill="#B9261C" />
        </G>
      );
    case 'tree':
      return (
        <G>
          <Rect x={21} y={28} width={6} height={16} rx={3} fill="#8E5F35" />
          <Rect x={21} y={28} width={3} height={16} rx={1.5} fill="#7A4A28" />
          <Circle cx={16} cy={22} r={10} fill="#3B8E3F" />
          <Circle cx={32} cy={22} r={10} fill="#3B8E3F" />
          <Circle cx={24} cy={15} r={12} fill="#3B8E3F" />
          <Circle cx={16} cy={21} r={9} fill={palette.leafGreen} />
          <Circle cx={32} cy={21} r={9} fill={palette.leafGreen} />
          <Circle cx={24} cy={14} r={11} fill="#6FCB73" />
          <Path d="M 17 9 q 4 -3 8 -2" stroke="rgba(255,255,255,0.4)" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'sun':
      return (
        <G>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <Rect key={deg} x={22.4} y={2} width={3.2} height={8} rx={1.6} fill={palette.gold} transform={`rotate(${deg} 24 24)`} />
          ))}
          <Circle cx={24} cy={24} r={13} fill={palette.gold} />
          <Circle cx={24} cy={23.4} r={12} fill={palette.safetyYellow} />
          <Ellipse cx={18} cy={18} rx={4} ry={2.8} fill="#FFF1A8" transform="rotate(-30 18 18)" />
        </G>
      );
    case 'cloud':
      /* A white cloud on a white tile needs a real blue-grey underside. */
      return (
        <G>
          <Path d="M 13 34 A 9 9 0 0 1 13 16 A 12 12 0 0 1 35 16 A 9 9 0 0 1 35 34 Z" fill="#9FB6D6" />
          <Path d="M 13.6 32.4 A 7.6 7.6 0 0 1 14 17.6 A 10.6 10.6 0 0 1 34 17.6 A 7.6 7.6 0 0 1 34.4 32.4 Z" fill="#EEF5FD" />
          <Path d="M 13.6 32.4 h 20.8 A 7.6 7.6 0 0 0 36 28.4 C 30 33 18 33 12.6 28.8 A 7.6 7.6 0 0 0 13.6 32.4 Z" fill="#CBDCF0" />
          <Path d="M 18 20 A 8 8 0 0 1 27 17.6" stroke={HI_STRONG} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'rain':
      return (
        <G>
          <Path d="M 13 28 A 8 8 0 0 1 13 12 A 11 11 0 0 1 34 12 A 8 8 0 0 1 34 28 Z" fill="#8FA6C8" />
          <Path d="M 13.6 26.6 A 6.8 6.8 0 0 1 14 13.4 A 9.6 9.6 0 0 1 33 13.4 A 6.8 6.8 0 0 1 33.4 26.6 Z" fill="#DBE6F5" />
          {([
            [15, 32],
            [24, 35],
            [33, 32],
          ] as [number, number][]).map(([x, y], i) => (
            <Path key={i} d={`M ${x} ${y} C ${x + 3} ${y + 4} ${x + 3} ${y + 8} ${x} ${y + 9} C ${x - 3} ${y + 8} ${x - 3} ${y + 4} ${x} ${y} Z`} fill={palette.waterCyan} />
          ))}
        </G>
      );
    case 'left':
      return <Arrow rotate={-90} />;
    case 'right':
      return <Arrow rotate={90} />;
    case 'up':
      return <Arrow rotate={0} />;
    case 'down':
      return <Arrow rotate={180} />;

    /* ================= food ================= */
    case 'lemon':
      return (
        <G>
          <Ellipse cx={24} cy={28} rx={17} ry={13} fill="#E0A800" transform="rotate(-12 24 28)" />
          <Ellipse cx={24} cy={27} rx={16} ry={12} fill={palette.safetyYellow} transform="rotate(-12 24 27)" />
          <Ellipse cx={16} cy={21} rx={5} ry={3} fill={HI} transform="rotate(-32 16 21)" />
          <Circle cx={41} cy={22} r={2.6} fill="#E0A800" />
          <Circle cx={7} cy={33} r={2.6} fill="#E0A800" />
          <Leaf x={27} y={9} />
          <Rect x={22.6} y={8} width={3} height={8} rx={1.5} fill={palette.leafGreenDark} />
        </G>
      );
    case 'onion':
      return (
        <G>
          <Path d="M 24 14 C 34 14 40 22 40 30 C 40 38 33 44 24 44 C 15 44 8 38 8 30 C 8 22 14 14 24 14 Z" fill="#C79ACB" />
          <Path d="M 24 16 C 32.6 16 38 23 38 30 C 38 37 32 42 24 42 C 16 42 10 37 10 30 C 10 23 15.4 16 24 16 Z" fill="#E8CDEC" />
          <Path d="M 24 16 v 26 M 16 18.6 C 14 24 14 36 17 41 M 32 18.6 C 34 24 34 36 31 41" stroke="#C79ACB" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M 20 14 L 22 4 M 24 13 L 26 3 M 28 14 L 31 5" stroke={palette.leafGreen} strokeWidth={2.8} strokeLinecap="round" />
          <Ellipse cx={16} cy={23} rx={3.4} ry={2.2} fill={HI_STRONG} transform="rotate(-40 16 23)" />
        </G>
      );
    case 'cilantro':
    case 'lettuce': {
      const c = id === 'lettuce' ? '#7FD07F' : palette.leafGreen;
      return (
        <G>
          {id === 'lettuce' ? (
            <G>
              <Circle cx={24} cy={28} r={16} fill={dk(c, 0.26)} />
              <Circle cx={24} cy={27} r={15} fill={c} />
              <Path d="M 24 12 C 16 16 12 22 12 30 C 12 24 18 18 24 16 Z M 24 12 C 32 16 36 22 36 30 C 36 24 30 18 24 16 Z" fill={lt(c, 0.4)} />
              <Path d="M 24 16 C 20 22 19 30 21 40 M 24 16 C 28 22 29 30 27 40" stroke={dk(c, 0.22)} strokeWidth={1.8} fill="none" />
              <Ellipse cx={16} cy={19} rx={4.4} ry={2.8} fill={HI} transform="rotate(-32 16 19)" />
            </G>
          ) : (
            <G>
              <Path d="M 24 44 C 24 32 24 24 24 14" stroke={dk(c, 0.3)} strokeWidth={3} strokeLinecap="round" fill="none" />
              {([
                [14, 20, true],
                [34, 16, false],
                [16, 30, true],
                [33, 28, false],
                [24, 8, false],
              ] as [number, number, boolean][]).map(([x, y, flip], i) => (
                <G key={i}>
                  <Path d={`M 24 ${y + 4} C ${x} ${y + 6} ${x - (flip ? 2 : -2)} ${y - 2} ${x + (flip ? 3 : -3)} ${y - 4} C ${(24 + x) / 2} ${y - 2} 24 ${y + 1} 24 ${y + 4} Z`} fill={i % 2 ? c : dk(c, 0.16)} />
                </G>
              ))}
              <Path d="M 24 20 C 20 22 17 26 16 29" stroke={lt(c, 0.4)} strokeWidth={1.6} strokeLinecap="round" fill="none" />
            </G>
          )}
        </G>
      );
    }
    case 'corn':
      return (
        <G>
          <Path d="M 24 4 C 33 4 38 14 38 25 C 38 36 32 44 24 44 C 16 44 10 36 10 25 C 10 14 15 4 24 4 Z" fill="#E0A800" />
          <Path d="M 24 6 C 31.4 6 36 15 36 25 C 36 35 31 42 24 42 C 17 42 12 35 12 25 C 12 15 16.6 6 24 6 Z" fill={palette.safetyYellow} />
          {[0, 1, 2, 3, 4, 5].map((r) =>
            [0, 1, 2, 3].map((c2) => (
              <Circle key={`${r}-${c2}`} cx={16 + c2 * 5.4 + (r % 2) * 2.6} cy={11 + r * 5.4} r={1.9} fill="#FFE07A" />
            )),
          )}
          <Path d="M 10 22 C 3 20 2 30 8 38 C 12 34 12 27 10 22 Z" fill={palette.leafGreenDark} />
          <Path d="M 38 22 C 45 20 46 30 40 38 C 36 34 36 27 38 22 Z" fill={palette.leafGreen} />
        </G>
      );
    case 'rice':
      return (
        <G>
          <Path d="M 5 24 h 38 c 0 12 -8 20 -19 20 S 5 36 5 24 Z" fill="#2E63B8" />
          <Path d="M 7 26 h 34 c 0 10 -7 17 -17 17 S 7 36 7 26 Z" fill="#4FA3F7" />
          <Ellipse cx={24} cy={25} rx={19} ry={5} fill="#7FBDF5" />
          <Path d="M 8 24 C 10 16 38 16 40 24 C 36 27 12 27 8 24 Z" fill="#E7EDF7" />
          <Path d="M 10 22 C 14 15 34 15 38 22 C 34 24 14 24 10 22 Z" fill="#FFFFFF" />
          {([
            [16, 19],
            [24, 17],
            [32, 19],
            [20, 22],
            [28, 22],
          ] as [number, number][]).map(([x, y], i) => (
            <Ellipse key={i} cx={x} cy={y} rx={2.8} ry={1.5} fill="#DCE4F2" transform={`rotate(${i * 26 - 30} ${x} ${y})`} />
          ))}
          <Path d="M 12 31 C 13 35 16 38 20 39" stroke={HI_STRONG} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'beans':
      return (
        <G>
          <Path d="M 6 22 h 36 l -3 18 a 5 5 0 0 1 -5 4 h -20 a 5 5 0 0 1 -5 -4 z" fill="#B9261C" />
          <Path d="M 7.6 23.6 h 32.8 l -2.7 16 a 4 4 0 0 1 -4 3.4 h -19.4 a 4 4 0 0 1 -4 -3.4 z" fill={palette.engineRed} />
          <Ellipse cx={24} cy={22} rx={18} ry={5} fill="#8E1B13" />
          {([
            [15, 21, -20],
            [24, 19, 12],
            [33, 21, 26],
            [19.5, 24, 40],
            [29, 24, -34],
          ] as [number, number, number][]).map(([x, y, r], i) => (
            <G key={i}>
              <Ellipse cx={x} cy={y + 0.8} rx={5} ry={3.4} fill="#5E3418" transform={`rotate(${r} ${x} ${y})`} />
              <Ellipse cx={x} cy={y} rx={4.6} ry={3} fill="#8B5A2B" transform={`rotate(${r} ${x} ${y})`} />
              <Ellipse cx={x - 1.4} cy={y - 1} rx={1.6} ry={0.9} fill={HI_STRONG} transform={`rotate(${r} ${x} ${y})`} />
            </G>
          ))}
          <Rect x={11} y={27} width={11} height={3.4} rx={1.7} fill={HI} />
        </G>
      );
    case 'grape':
      return (
        <G>
          {([
            [24, 16],
            [17, 22],
            [31, 22],
            [24, 27],
            [12, 30],
            [36, 30],
            [18.5, 33],
            [29.5, 33],
            [24, 39],
          ] as [number, number][]).map(([x, y], i) => (
            <G key={i}>
              <Circle cx={x} cy={y + 0.8} r={6} fill="#6B4EB8" />
              <Circle cx={x} cy={y} r={5.6} fill="#9B7BFF" />
              <Circle cx={x - 1.9} cy={y - 2} r={1.7} fill="#D6CCFF" />
            </G>
          ))}
          <Rect x={22.6} y={3} width={3} height={9} rx={1.5} fill="#7A4A28" />
          <Leaf x={26} y={4} />
        </G>
      );
    case 'watermelon':
      return (
        <G>
          <Path d="M 4 16 A 20 20 0 0 0 44 16 Z" fill="#2F6E33" transform="translate(0 2)" />
          <Path d="M 4 16 A 20 20 0 0 0 44 16 Z" fill={palette.leafGreen} />
          <Path d="M 8 18 A 16 16 0 0 0 40 18 Z" fill="#EAF7E4" />
          <Path d="M 10 20 A 14 14 0 0 0 38 20 Z" fill="#F86A80" />
          {([
            [17, 25],
            [24, 27],
            [31, 25],
            [21, 31],
            [27, 31],
          ] as [number, number][]).map(([x, y], i) => (
            <Ellipse key={i} cx={x} cy={y} rx={1.6} ry={2.2} fill="#2A2F45" />
          ))}
          <Path d="M 9 20 A 15 15 0 0 0 15 30" stroke={HI_STRONG} strokeWidth={2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'carrot':
      return (
        <G>
          <Path d="M 17 14 h 14 L 26 44 a 2.4 2.4 0 0 1 -4.6 0 Z" fill={palette.orangeDark} />
          <Path d="M 18.6 15 h 10.8 L 25.4 42 a 1.6 1.6 0 0 1 -3 0 Z" fill={palette.orange} />
          <Path d="M 19.6 22 h 8 M 20.6 29 h 6.4 M 21.6 35 h 4.4" stroke={palette.orangeDark} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M 21 18 L 22 27" stroke={HI_STRONG} strokeWidth={2} strokeLinecap="round" />
          <Path d="M 24 14 C 20 8 14 6 10 8 C 12 13 18 15 24 14 Z" fill={palette.leafGreenDark} />
          <Path d="M 24 14 C 27 6 33 3 38 5 C 37 11 31 14 24 14 Z" fill={palette.leafGreen} />
          <Path d="M 24 14 C 24 8 25 4 27 2" stroke={palette.leafGreenDark} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'potato':
      return (
        <G>
          <Path d="M 8 26 C 8 16 17 11 27 12 C 38 13 43 20 41 29 C 39 39 28 41 19 39 C 11 37 8 32 8 26 Z" fill="#A87A42" />
          <Path d="M 10 26 C 10 18 18 13.6 27 14.6 C 36.4 15.6 41 21 39 28.6 C 37 37 28 38.8 20 37 C 13 35.4 10 31 10 26 Z" fill="#C89A62" />
          <Ellipse cx={18} cy={19.6} rx={5} ry={3} fill={HI} transform="rotate(-24 18 19.6)" />
          <Ellipse cx={19} cy={27} rx={2} ry={1.4} fill="#8E6132" transform="rotate(-20 19 27)" />
          <Ellipse cx={29} cy={22} rx={2.2} ry={1.5} fill="#8E6132" transform="rotate(18 29 22)" />
          <Ellipse cx={31} cy={32} rx={1.8} ry={1.2} fill="#8E6132" />
        </G>
      );
    case 'juice':
      return (
        <G>
          <Path d="M 12 12 h 24 l -3 30 a 3 3 0 0 1 -3 3 h -12 a 3 3 0 0 1 -3 -3 z" fill="#B4C6DE" />
          <Path d="M 13.6 13.6 h 20.8 l -2.8 27.6 a 2 2 0 0 1 -2 1.8 h -11.2 a 2 2 0 0 1 -2 -1.8 z" fill="#EAF2FB" />
          <Path d="M 14.6 22 h 18.8 l -2 19.2 a 2 2 0 0 1 -2 1.8 h -10.8 a 2 2 0 0 1 -2 -1.8 z" fill={palette.orangeDark} />
          <Path d="M 14.6 22 h 18.8 l -0.5 5 h -17.8 z" fill={palette.orange} />
          <Rect x={28} y={4} width={4} height={22} rx={2} fill={palette.engineRed} transform="rotate(12 30 15)" />
          <Path d="M 32 12 A 8 8 0 0 1 44 18 A 8 8 0 0 1 32 12 Z" fill={palette.orange} />
          <Path d="M 33.4 13 A 6.4 6.4 0 0 1 42.6 17.6 A 6.4 6.4 0 0 1 33.4 13 Z" fill={palette.safetyYellow} />
          <Rect x={16.4} y={16} width={3.4} height={7} rx={1.7} fill={HI_STRONG} />
        </G>
      );
    case 'honey':
      return (
        <G>
          <Path d="M 12 16 h 24 v 24 a 5 5 0 0 1 -5 5 h -14 a 5 5 0 0 1 -5 -5 z" fill="#B9762F" />
          <Path d="M 13.6 17.6 h 20.8 v 22.4 a 3.6 3.6 0 0 1 -3.6 3.6 h -13.6 a 3.6 3.6 0 0 1 -3.6 -3.6 z" fill="#F0A93A" />
          <Path d="M 13.6 24 h 20.8 v 16 a 3.6 3.6 0 0 1 -3.6 3.6 h -13.6 a 3.6 3.6 0 0 1 -3.6 -3.6 z" fill="#E08C1A" />
          <Rect x={14} y={26} width={20} height={9} rx={2.4} fill={palette.cream} />
          <Path d="M 24 27.6 l 3.4 2 v 4 l -3.4 2 l -3.4 -2 v -4 z" fill={palette.gold} />
          <Rect x={10} y={11} width={28} height={6} rx={3} fill="#8E5F35" />
          <Rect x={10} y={11} width={28} height={4} rx={2} fill="#C58B4E" />
          <Rect x={16} y={20} width={3.4} height={4} rx={1.7} fill={HI_STRONG} />
        </G>
      );
    case 'salt':
      return (
        <G>
          <Path d="M 14 16 h 20 l 3 25 a 4 4 0 0 1 -4 4 h -18 a 4 4 0 0 1 -4 -4 z" fill="#2E63B8" />
          <Path d="M 15.4 17.4 h 17.2 l 2.7 23 a 2.8 2.8 0 0 1 -2.8 3.2 h -17 a 2.8 2.8 0 0 1 -2.8 -3.2 z" fill="#EAF2FB" />
          <Rect x={13} y={27} width={22} height={9} rx={2} fill="#2E63B8" />
          <Rect x={13} y={27} width={22} height={6.6} rx={2} fill="#4FA3F7" />
          <Path d="M 15 16 C 15 9 20 5 24 5 C 28 5 33 9 33 16 Z" fill="#8FA0C8" />
          <Path d="M 16.6 15 C 16.6 10 20.6 6.6 24 6.6 C 27.4 6.6 31.4 10 31.4 15 Z" fill="#C6D2E8" />
          <Circle cx={20.6} cy={10.6} r={1.3} fill="#5B6588" />
          <Circle cx={24} cy={9} r={1.3} fill="#5B6588" />
          <Circle cx={27.4} cy={10.6} r={1.3} fill="#5B6588" />
          <Rect x={17} y={20} width={3.4} height={5} rx={1.7} fill={HI_STRONG} />
        </G>
      );
    case 'tortilla':
      return (
        <G>
          {([
            [34, '#C9A268', '#E8CE9E'],
            [29, '#C9A268', '#F0DBAE'],
            [24, '#C9A268', '#F7E7C4'],
          ] as [number, string, string][]).map(([cy, sh, base], i) => (
            <G key={i}>
              <Ellipse cx={24} cy={cy + 1.6} rx={18} ry={6.4} fill={sh} />
              <Ellipse cx={24} cy={cy} rx={18} ry={6} fill={base} />
            </G>
          ))}
          <Ellipse cx={19} cy={22} rx={5.4} ry={2} fill={HI_STRONG} />
          <Circle cx={30} cy={24} r={1.6} fill="#D9BC8E" />
          <Circle cx={17} cy={26} r={1.3} fill="#D9BC8E" />
        </G>
      );
    case 'quesadilla':
      return (
        <G>
          <Path d="M 4 34 A 20 20 0 0 1 44 34 Z" fill="#C9A268" transform="translate(0 2)" />
          <Path d="M 4 34 A 20 20 0 0 1 44 34 Z" fill="#EFD9A8" />
          <Path d="M 24 14 v 20 M 12 22 L 24 34 M 36 22 L 24 34" stroke="#D9BC8E" strokeWidth={2} />
          <Path d="M 6 33 C 12 27 20 30 24 33 C 28 30 36 27 42 33 Z" fill={palette.safetyYellow} />
          <Path d="M 8 33 C 13 29 20 31.6 24 33.6 C 28 31.6 35 29 40 33 Z" fill="#FFD75E" />
          <Ellipse cx={16} cy={24} rx={4.4} ry={2.4} fill={HI_STRONG} transform="rotate(-24 16 24)" />
        </G>
      );
    case 'cake':
      return (
        <G>
          <Path d="M 7 26 h 34 v 13 a 5 5 0 0 1 -5 5 h -24 a 5 5 0 0 1 -5 -5 z" fill="#C9A268" />
          <Path d="M 8.6 27.6 h 30.8 v 11.4 a 3.6 3.6 0 0 1 -3.6 3.6 h -23.6 a 3.6 3.6 0 0 1 -3.6 -3.6 z" fill="#EFD9A8" />
          <Path d="M 8.6 33 h 30.8 v 3.4 h -30.8 z" fill="#F0748E" />
          <Path d="M 7 21 h 34 v 6 h -34 z" fill="#E05C77" />
          <Path d="M 7 21 C 11 25 15 18 19 22 C 23 26 26 18 31 22 C 35 25 38 19 41 21 v 6 h -34 z" fill="#FF7EB3" />
          <Path d="M 7 21 C 11 25 15 18 19 22 C 23 26 26 18 31 22 C 35 25 38 19 41 21 v 2 C 38 21 35 27 31 24 C 26 20 23 28 19 24 C 15 20 11 27 7 23 Z" fill="#FFC4DC" />
          <Rect x={22.6} y={9} width={3} height={12} rx={1.5} fill={palette.cream} />
          <Rect x={22.9} y={9} width={1.4} height={12} rx={0.7} fill="#E6DCC4" />
          <Path d="M 24 3 C 27 6 27.4 8 24 11 C 20.6 8 21 6 24 3 Z" fill={palette.flameOuter} />
          <Path d="M 24 6 C 25.6 7.6 25.8 8.6 24 10 C 22.2 8.6 22.4 7.6 24 6 Z" fill={palette.flameCore} />
        </G>
      );

    /* ================= animals ================= */
    case 'bird':
      return (
        <G>
          <Ground cy={44} rx={13} />
          <Path d="M 30 22 C 40 20 46 26 44 33 C 40 33 34 31 31 28 Z" fill="#2E7BD6" />
          <Ellipse cx={24} cy={26} rx={15} ry={12} fill="#2E7BD6" />
          <Ellipse cx={23.4} cy={25} rx={14} ry={11} fill="#4FA3F7" />
          <Path d="M 14 26 C 18 22 26 22 31 26 C 26 32 18 32 14 26 Z" fill="#8FC9F2" />
          <Circle cx={14} cy={15} r={9.6} fill="#2E7BD6" />
          <Circle cx={13.6} cy={14.4} r={9} fill="#4FA3F7" />
          <Path d="M 4.6 14.4 l -4.4 2.6 l 4.4 2.6 z" fill={palette.orange} />
          <Circle cx={11} cy={12.6} r={2.4} fill={NAVY} />
          <Circle cx={11.9} cy={11.7} r={0.9} fill="#FFFFFF" />
          <Path d="M 30 36 l 3 6 M 22 37 l 1 5" stroke={palette.orange} strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M 8 9 C 10 6.4 13 5.4 15.4 5.6" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'fish':
      return (
        <G>
          <Path d="M 40 24 L 47 15 v 18 Z" fill="#E0661A" />
          <Ellipse cx={22} cy={24} rx={19} ry={13} fill="#E0661A" />
          <Ellipse cx={21.4} cy={23.2} rx={18} ry={12} fill={palette.orange} />
          <Path d="M 22 11.4 C 26 14 28 18 28 23 C 28 28 26 32.6 22 35.2 C 30 34 38 30 39.4 23.2 C 38 16 30 12.4 22 11.4 Z" fill="#FFA96B" />
          <Path d="M 18 12 L 24 4 L 28 13 Z" fill="#E0661A" />
          <Circle cx={9} cy={20} r={3.2} fill="#FFFFFF" />
          <Circle cx={8.6} cy={20} r={2.1} fill={NAVY} />
          <Path d="M 8 30 q 4 3 8 0" stroke="#C9500F" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Circle cx={29} cy={18} r={2} fill="#FFD3A8" />
          <Circle cx={33} cy={27} r={1.6} fill="#FFD3A8" />
          <Path d="M 12 14 C 15 12 18 11.6 21 12" stroke={HI_STRONG} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'horse':
      return <Critter coat="#B07840" ear="point" snout="#E0B87A" detail={<Path d="M 22 5 C 27 6 30 10 30 15 C 27 12 24 10 21 9.6 Z" fill="#5E3418" />} />;
    case 'cow':
      return (
        <Critter
          coat="#F2F2F6"
          ear="floppy"
          snout="#FFC6CE"
          detail={
            <G>
              <Ellipse cx={31} cy={26} rx={5.4} ry={4} fill="#3B4460" transform="rotate(-16 31 26)" />
              <Ellipse cx={8} cy={26} rx={3.4} ry={2.6} fill="#3B4460" />
              <Ellipse cx={36} cy={35} rx={4} ry={3} fill="#3B4460" />
              <Path d="M 5 9 C 2 6 4 3 7 5 M 26 5 C 29 2 32 4 30 7" stroke="#DDD6C4" strokeWidth={3.4} strokeLinecap="round" fill="none" />
            </G>
          }
        />
      );
    case 'sheep':
      return (
        <G>
          <Ground cy={44} rx={16} />
          {([
            [16, 22],
            [26, 18],
            [35, 23],
            [34, 32],
            [22, 33],
            [12, 30],
            [26, 27],
          ] as [number, number][]).map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={9} fill="#E7ECF6" />
          ))}
          {([
            [17, 22],
            [27, 19],
            [34, 24],
            [23, 30],
          ] as [number, number][]).map(([x, y], i) => (
            <Circle key={`h${i}`} cx={x} cy={y} r={7} fill="#FFFFFF" />
          ))}
          <Rect x={16} y={36} width={4.4} height={8} rx={2.2} fill="#3B4460" />
          <Rect x={30} y={36} width={4.4} height={8} rx={2.2} fill="#3B4460" />
          <Ellipse cx={11} cy={22} rx={8} ry={7.4} fill="#3B4460" />
          <Ellipse cx={4.4} cy={20} rx={3.4} ry={4.6} fill="#2A3149" transform="rotate(-20 4.4 20)" />
          <Circle cx={8.6} cy={20} r={2} fill="#FFFFFF" />
          <Circle cx={8.4} cy={20.2} r={1.2} fill={NAVY} />
          <Path d="M 8 26 q 3 2 5 0" stroke="#2A3149" strokeWidth={1.6} strokeLinecap="round" fill="none" />
          <Circle cx={22} cy={16} r={3} fill={HI_STRONG} />
        </G>
      );
    case 'pig':
      return (
        <Critter
          coat="#FFB0C4"
          ear="point"
          snout="#FF8FAC"
          detail={
            <G>
              <Circle cx={12.6} cy={22.8} r={1.4} fill="#D9647F" />
              <Circle cx={17.4} cy={22.8} r={1.4} fill="#D9647F" />
              <Path d="M 43 26 c 4 -1 4 4 1 5 c -2 1 -3 -1 -1 -2" stroke="#FF8FAC" strokeWidth={2.6} strokeLinecap="round" fill="none" />
            </G>
          }
        />
      );
    case 'mouse':
      return (
        <Critter
          coat="#B7BFD4"
          ear="round"
          snout="#F2C6D0"
          detail={
            <G>
              <Circle cx={8} cy={12} r={3} fill="#F2C6D0" />
              <Circle cx={23} cy={9} r={2.8} fill="#F2C6D0" />
              <Path d="M 44 32 c 4 2 3 8 -2 9" stroke="#F2C6D0" strokeWidth={2.6} strokeLinecap="round" fill="none" />
            </G>
          }
        />
      );
    case 'frog':
      return (
        <G>
          <Ground cy={44} rx={16} />
          <Ellipse cx={24} cy={30} rx={17} ry={13} fill="#3B8E3F" />
          <Ellipse cx={24} cy={29} rx={16} ry={12} fill="#6FCB73" />
          <Ellipse cx={24} cy={33} rx={10} ry={6} fill="#CDEFC6" />
          <Ellipse cx={7} cy={36} rx={6} ry={4} fill="#3B8E3F" />
          <Ellipse cx={41} cy={36} rx={6} ry={4} fill="#3B8E3F" />
          <Circle cx={14} cy={14} r={8} fill="#3B8E3F" />
          <Circle cx={34} cy={14} r={8} fill="#3B8E3F" />
          <Circle cx={14} cy={13.6} r={6.4} fill="#8FD16B" />
          <Circle cx={34} cy={13.6} r={6.4} fill="#8FD16B" />
          <Circle cx={14} cy={14} r={3.4} fill={NAVY} />
          <Circle cx={34} cy={14} r={3.4} fill={NAVY} />
          <Circle cx={15.4} cy={12.6} r={1.3} fill="#FFFFFF" />
          <Circle cx={35.4} cy={12.6} r={1.3} fill="#FFFFFF" />
          <Path d="M 15 30 q 9 7 18 0" stroke="#2F6E33" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Ellipse cx={13} cy={22} rx={4.4} ry={2.6} fill={HI} transform="rotate(-26 13 22)" />
        </G>
      );
    case 'parrot':
      return (
        <G>
          <Ground cy={44} rx={12} />
          <Path d="M 30 30 C 40 32 44 40 40 45 C 34 43 30 38 28 34 Z" fill={palette.leafGreen} />
          <Ellipse cx={22} cy={28} rx={13} ry={15} fill="#C4241A" />
          <Ellipse cx={21.6} cy={27} rx={12} ry={14} fill={palette.engineRed} />
          <Path d="M 28 20 C 33 24 34 32 30 38 C 27 32 27 25 28 20 Z" fill={palette.safetyYellow} />
          <Circle cx={20} cy={13} r={9.6} fill="#C4241A" />
          <Circle cx={19.6} cy={12.4} r={9} fill={palette.engineRed} />
          <Path d="M 11 11 C 6 12 6 18 11 19 C 14 17 14 13 11 11 Z" fill={palette.gold} />
          <Path d="M 11.4 12.6 C 8 13.4 8 17 11.4 17.6 C 13 16.4 13 13.8 11.4 12.6 Z" fill={palette.safetyYellow} />
          <Circle cx={17.4} cy={11.4} r={2.6} fill="#FFFFFF" />
          <Circle cx={17} cy={11.4} r={1.7} fill={NAVY} />
          <Path d="M 22 4 C 26 2 30 4 30 8 C 27 7 24 6 22 6 Z" fill={palette.waterCyan} />
          <Path d="M 27 38 l 2 6 M 20 40 l 0 4" stroke={palette.gold} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      );
    case 'lizard':
      return (
        <G>
          <Ground cy={44} rx={17} />
          <Path d="M 44 34 C 40 40 33 40 30 36 C 27 32 22 30 16 32 C 9 34 4 30 5 24 C 6 18 12 16 17 19 C 23 22 28 22 33 19 C 39 15 45 19 44 26 Z" fill="#2F8E63" />
          <Path d="M 42 32 C 38 37 33 37 30 33.6 C 26.6 29.6 21.6 28 15.6 30 C 10 32 6.4 29 7 24.4 C 8 19.6 13 18 17.6 20.6 C 23.6 24 29 24 34 20.6 C 39 17.4 43.4 20.6 42.4 26.4 Z" fill="#4FBF87" />
          <Circle cx={9} cy={22} r={7} fill="#2F8E63" />
          <Circle cx={8.6} cy={21.4} r={6.4} fill="#4FBF87" />
          <Circle cx={6.6} cy={19.6} r={2.2} fill={NAVY} />
          <Circle cx={7.2} cy={19} r={0.8} fill="#FFFFFF" />
          <Path d="M 2.4 24 h 4" stroke="#2F8E63" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M 18 33 l -2 6 M 30 36 l 2 6 M 24 24 l 0 -5 M 36 22 l 2 -5" stroke="#2F8E63" strokeWidth={2.6} strokeLinecap="round" />
          <Circle cx={22} cy={26} r={1.6} fill="#CDEFC6" />
          <Circle cx={31} cy={26} r={1.4} fill="#CDEFC6" />
          <Circle cx={38} cy={24} r={1.3} fill="#CDEFC6" />
        </G>
      );

    /* ================= places ================= */
    case 'museum':
      return (
        <Place
          body={palette.cream}
          roof="#B4C6DE"
          roofShape="flat"
          detail={
            <G>
              <Path d="M 3 15 L 24 4 L 45 15 Z" fill="#8FA0C8" />
              <Path d="M 6 14.6 L 24 5.6 L 42 14.6 Z" fill="#C6D2E8" />
              {[10, 18, 26, 34].map((x) => (
                <Rect key={x} x={x} y={22} width={5} height={20} rx={1.5} fill="#DDE5F4" />
              ))}
              <Rect x={6} y={40} width={36} height={4} rx={2} fill="#B4C6DE" />
              <Circle cx={24} cy={11} r={2.4} fill={palette.gold} />
            </G>
          }
        />
      );
    case 'train-station':
      return (
        <Place
          body={palette.tan}
          roof={palette.engineRed}
          detail={
            <G>
              <Circle cx={24} cy={16} r={4.6} fill={palette.cream} />
              <Path d="M 24 13.4 v 2.8 h 2.2" stroke={NAVY} strokeWidth={1.5} strokeLinecap="round" />
              <Rect x={9} y={26} width={9} height={8} rx={2} fill="#8FC9F2" />
              <Rect x={30} y={26} width={9} height={8} rx={2} fill="#8FC9F2" />
              <Rect x={19} y={30} width={10} height={12} rx={2} fill="#6B4A2A" />
              <Rect x={4} y={41} width={40} height={3.4} rx={1.7} fill="#8FA0C8" />
              <Rect x={7} y={44} width={34} height={2} rx={1} fill="#5B6588" />
            </G>
          }
        />
      );
    case 'hospital':
      return (
        <Place
          body="#EAF2FB"
          roof="#4FA3F7"
          roofShape="flat"
          detail={
            <G>
              <Path d="M 20.6 24 h 6.8 v 5.6 h 5.6 v 6.8 h -5.6 v 5.6 h -6.8 v -5.6 h -5.6 v -6.8 h 5.6 z" fill={palette.engineRed} />
              <Rect x={8} y={24} width={6} height={6} rx={2} fill="#8FC9F2" />
              <Rect x={34} y={24} width={6} height={6} rx={2} fill="#8FC9F2" />
              <Rect x={16} y={9} width={16} height={5} rx={2.5} fill={palette.white} />
              <Path d="M 22.6 9 h 2.8 v 5 h -2.8 z M 21 10.6 h 6 v 2 h -6 z" fill={palette.engineRed} />
            </G>
          }
        />
      );
    case 'garden':
      return (
        <G>
          <Ground cy={45} rx={18} />
          <Path d="M 3 30 C 3 25 45 25 45 30 v 10 a 4 4 0 0 1 -4 4 h -34 a 4 4 0 0 1 -4 -4 z" fill="#8E5F35" />
          <Path d="M 4.6 30.6 C 6 27 42 27 43.4 30.6 v 9.4 a 3 3 0 0 1 -3 3 h -32.8 a 3 3 0 0 1 -3 -3 z" fill="#C58B4E" />
          <Path d="M 4 34 h 40" stroke="#8E5F35" strokeWidth={2} />
          {([
            [11, palette.engineRed],
            [24, palette.safetyYellow],
            [37, palette.pink],
          ] as [number, string][]).map(([x, c], i) => (
            <G key={i}>
              <Path d={`M ${x} 30 v -9`} stroke={palette.leafGreenDark} strokeWidth={2.6} strokeLinecap="round" />
              <Path d={`M ${x} 25 c -5 -2 -6 -6 -1 -6`} stroke={palette.leafGreen} strokeWidth={2.4} strokeLinecap="round" fill="none" />
              {[0, 72, 144, 216, 288].map((deg) => (
                <Ellipse key={deg} cx={x} cy={13.4} rx={2.6} ry={4} fill={c} transform={`rotate(${deg} ${x} 17.4)`} />
              ))}
              <Circle cx={x} cy={17.4} r={2.6} fill={palette.gold} />
            </G>
          ))}
        </G>
      );
    case 'festival':
      return (
        <G>
          <Ground cy={45} rx={18} />
          <Path d="M 2 8 C 14 18 34 18 46 8" stroke="#8E5F35" strokeWidth={1.8} fill="none" />
          {([
            [7, 11, palette.engineRed],
            [14, 14.4, palette.safetyYellow],
            [22, 16, palette.waterCyan],
            [30, 15.6, palette.leafGreen],
            [38, 12.4, palette.purple],
            [44, 9, palette.pink],
          ] as [number, number, string][]).map(([x, y, c], i) => (
            <Path key={i} d={`M ${x - 3.4} ${y} h 6.8 l -3.4 7 z`} fill={c} />
          ))}
          <Path d="M 6 30 h 36 v 12 a 3 3 0 0 1 -3 3 h -30 a 3 3 0 0 1 -3 -3 z" fill="#B98F55" />
          <Path d="M 7.6 31.4 h 32.8 v 10.6 a 2 2 0 0 1 -2 2 h -28.8 a 2 2 0 0 1 -2 -2 z" fill="#E8CE9E" />
          <Path d="M 4 24 h 40 v 7 h -40 z" fill={palette.engineRedDark} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={i} x={4 + i * 8} y={24} width={8} height={7} fill={i % 2 === 0 ? palette.engineRed : palette.white} />
          ))}
          <Path d="M 20 34 h 8 v 10 h -8 z" fill="#8E5F35" />
        </G>
      );
    case 'farm':
      return (
        <Place
          body={palette.engineRed}
          roof="#8E1B13"
          detail={
            <G>
              <Path d="M 15 20 h 18 v 24 h -18 z" fill="#FFF6E5" />
              <Path d="M 15 20 L 33 44 M 33 20 L 15 44" stroke={palette.engineRed} strokeWidth={3.4} />
              <Rect x={13} y={19} width={22} height={3.4} fill="#FFF6E5" />
              <Path d="M 24 3 l 1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 z" fill={palette.safetyYellow} />
              <Rect x={7} y={26} width={5} height={5} rx={1.5} fill="#8FC9F2" />
              <Rect x={36} y={26} width={5} height={5} rx={1.5} fill="#8FC9F2" />
            </G>
          }
        />
      );
    case 'beach':
      return (
        <G>
          <Path d="M 2 30 h 44 v 10 a 4 4 0 0 1 -4 4 h -36 a 4 4 0 0 1 -4 -4 z" fill="#D9BC8E" />
          <Path d="M 2 30 h 44 v 4 h -44 z" fill="#EFD9A8" />
          <Path d="M 2 30 C 8 26 14 34 20 30 C 26 26 32 34 38 30 C 42 27.4 44 28 46 29 v -12 a 4 4 0 0 0 -4 -4 h -36 a 4 4 0 0 0 -4 4 z" fill={palette.waterCyan} />
          <Path d="M 2 24 C 8 21 14 27 20 24 C 26 21 32 27 38 24 C 42 22 44 22.6 46 23.4 v -6.4 a 4 4 0 0 0 -4 -4 h -36 a 4 4 0 0 0 -4 4 z" fill={palette.waterCyanLight} />
          <Circle cx={38} cy={9} r={6.4} fill={palette.safetyYellow} />
          <Path d="M 8 44 v -18" stroke="#8E5F35" strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M 8 26 A 12 12 0 0 1 26 30 L 8 30 Z" fill={palette.engineRedDark} />
          <Path d="M 8 26 A 12 12 0 0 1 17 27.6 L 8 30 Z" fill={palette.engineRed} />
          <Path d="M 17 27.6 A 12 12 0 0 1 26 30 L 8 30 Z" fill={palette.white} opacity={0.85} />
        </G>
      );
    case 'street':
      return (
        <G>
          <Path d="M 2 22 h 44 v 18 a 4 4 0 0 1 -4 4 h -36 a 4 4 0 0 1 -4 -4 z" fill="#8FA0C8" />
          <Path d="M 2 24 h 44 v 15 a 4 4 0 0 1 -4 4 h -36 a 4 4 0 0 1 -4 -4 z" fill="#B4BCD4" />
          <Path d="M 4 33 h 7 M 16 33 h 7 M 28 33 h 7 M 40 33 h 4" stroke={palette.cream} strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M 2 18 h 44 v 5 h -44 z" fill={palette.grass} />
          <Rect x={36} y={4} width={3.4} height={20} rx={1.7} fill="#5B6588" />
          <Path d="M 33 5 h 10 a 3 3 0 0 1 3 3 v 1 a 3 3 0 0 1 -3 3 h -10 a 3 3 0 0 1 -3 -3 v -1 a 3 3 0 0 1 3 -3 z" fill={palette.safetyYellow} />
          <Circle cx={37.7} cy={8.6} r={2.2} fill="#FFF1A8" />
          <Circle cx={11} cy={13} r={7} fill="#3B8E3F" />
          <Circle cx={11} cy={12} r={6.2} fill={palette.leafGreen} />
          <Rect x={9.4} y={16} width={3.4} height={7} rx={1.7} fill="#8E5F35" />
        </G>
      );
    case 'pond':
      return (
        <G>
          <Ellipse cx={24} cy={30} rx={21} ry={13} fill={palette.grassDark} />
          <Ellipse cx={24} cy={29} rx={19} ry={11.4} fill={palette.waterCyanDark} />
          <Ellipse cx={24} cy={28.4} rx={18} ry={10.6} fill={palette.waterCyan} />
          <Path d="M 10 26 q 5 -2.4 10 0 q 5 2.4 10 0 M 14 33 q 5 -2.4 10 0 q 4 2 8 0" stroke={palette.waterCyanLight} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Ellipse cx={33} cy={31} rx={7} ry={3.6} fill={palette.leafGreen} />
          <Path d="M 33 27.4 l 2.6 3.6 h -5.2 z" fill={palette.waterCyan} />
          <Circle cx={33} cy={26} r={2.8} fill="#FF7EB3" />
          <Circle cx={33} cy={26} r={1.3} fill={palette.safetyYellow} />
          <Path d="M 10 26 v -14 M 13 26 v -10 M 7 26 v -9" stroke={palette.leafGreenDark} strokeWidth={2.4} strokeLinecap="round" />
          <Ellipse cx={10} cy={10.4} rx={2} ry={4} fill="#8E6A2E" />
        </G>
      );
    case 'restaurant':
      return (
        <Place
          body={palette.cream}
          roof={palette.orange}
          roofShape="flat"
          detail={
            <G>
              {[0, 1, 2, 3, 4].map((i) => (
                <Rect key={i} x={3 + i * 8.4} y={14} width={8.4} height={7} fill={i % 2 === 0 ? palette.orange : palette.white} />
              ))}
              <Rect x={3} y={13} width={42} height={2.6} rx={1.3} fill={palette.orangeDark} />
              <Rect x={9} y={26} width={12} height={11} rx={2.5} fill="#8FC9F2" />
              <Rect x={26} y={26} width={13} height={18} rx={2.5} fill="#6B4A2A" />
              <Circle cx={28.4} cy={35} r={1.4} fill={palette.safetyYellow} />
              <Ellipse cx={15} cy={41} rx={6} ry={2.4} fill="#B4C6DE" />
            </G>
          }
        />
      );
    case 'store':
      return (
        <Place
          body={palette.tan}
          roof={palette.waterCyanDark}
          roofShape="flat"
          detail={
            <G>
              {[0, 1, 2, 3, 4].map((i) => (
                <Rect key={i} x={3 + i * 8.4} y={14} width={8.4} height={7} fill={i % 2 === 0 ? palette.waterCyan : palette.white} />
              ))}
              <Rect x={3} y={13} width={42} height={2.6} rx={1.3} fill={palette.waterCyanDark} />
              <Rect x={9} y={26} width={14} height={12} rx={2.5} fill="#8FC9F2" />
              <Rect x={27} y={26} width={12} height={18} rx={2.5} fill="#6B4A2A" />
              <Rect x={12} y={29} width={8} height={2.4} rx={1.2} fill={palette.white} opacity={0.7} />
              <Path d="M 15 41 h 8 v 3 h -8 z" fill={palette.engineRed} />
            </G>
          }
        />
      );
    case 'zoo':
      return (
        <G>
          <Ground cy={45} rx={18} />
          <Path d="M 5 44 v -26 a 19 19 0 0 1 38 0 v 26 h -8 v -26 a 11 11 0 0 0 -22 0 v 26 z" fill="#6B4A2A" />
          <Path d="M 6.6 44 v -26 a 17.4 17.4 0 0 1 34.8 0 v 26 h -5 v -26 a 12.4 12.4 0 0 0 -24.8 0 v 26 z" fill="#C58B4E" />
          <Rect x={13} y={35} width={22} height={9} rx={2.5} fill={palette.leafGreenDark} />
          <Rect x={13} y={35} width={22} height={6.6} rx={2.5} fill={palette.leafGreen} />
          <G>
            <Ellipse cx={24} cy={22} rx={5.6} ry={4.6} fill={palette.cream} />
            {([
              [19, 14.6],
              [22.6, 12.6],
              [26.4, 12.6],
              [29.6, 14.6],
            ] as [number, number][]).map(([x, y], i) => (
              <Ellipse key={i} cx={x} cy={y} rx={2.2} ry={2.8} fill={palette.cream} />
            ))}
          </G>
        </G>
      );
    case 'flower':
      return (
        <G>
          <Ground cy={45} rx={11} />
          <Path d="M 24 44 v -22" stroke={palette.leafGreenDark} strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M 24 34 c -8 -2 -10 -9 -2 -10 c 4 1 3 7 2 10 z" fill={palette.leafGreen} />
          <Path d="M 24 30 c 8 -2 10 -9 2 -10 c -4 1 -3 7 -2 10 z" fill="#6FCB73" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <G key={deg}>
              <Ellipse cx={24} cy={9} rx={4.6} ry={6.4} fill="#E05C77" transform={`rotate(${deg} 24 17)`} />
              <Ellipse cx={24} cy={8.4} rx={3.8} ry={5.6} fill="#FF7EB3" transform={`rotate(${deg} 24 17)`} />
            </G>
          ))}
          <Circle cx={24} cy={17} r={5.4} fill={palette.gold} />
          <Circle cx={24} cy={16.4} r={4.6} fill={palette.safetyYellow} />
          <Circle cx={22.4} cy={15} r={1.5} fill="#FFF1A8" />
        </G>
      );
    case 'river':
      return (
        <G>
          <Path d="M 2 6 h 44 v 38 a 0 0 0 0 1 0 0 h -44 z" fill={palette.grass} opacity={0.55} />
          <Path d="M 14 4 C 26 12 12 20 22 28 C 32 36 20 40 26 46 h 16 C 36 40 46 34 36 26 C 26 18 40 12 30 4 Z" fill={palette.waterCyanDark} />
          <Path d="M 15.6 4 C 26.6 12 13.6 20 23.2 28 C 33 36 22 40 27.4 46 h 12.6 C 34.6 40 43.4 34 34 26 C 24.6 18 37.6 12 28.4 4 Z" fill={palette.waterCyan} />
          <Path d="M 21 12 C 24 15 20 18 22 21 M 30 32 C 32 35 28 38 30 41" stroke={palette.waterCyanLight} strokeWidth={2.2} strokeLinecap="round" fill="none" />
          <Circle cx={7} cy={14} r={5} fill="#3B8E3F" />
          <Circle cx={7} cy={13.4} r={4.4} fill={palette.leafGreen} />
          <Circle cx={41} cy={34} r={5} fill="#3B8E3F" />
          <Circle cx={41} cy={33.4} r={4.4} fill={palette.leafGreen} />
          <Ellipse cx={16} cy={38} rx={4} ry={2.6} fill="#8FA0C8" />
        </G>
      );

    /* ================= weather ================= */
    case 'moon':
      return (
        <G>
          <Path d="M 32 4 A 18 18 0 1 0 32 40 A 14 14 0 0 1 32 4 Z" fill="#E0C978" />
          <Path d="M 31 6 A 16.4 16.4 0 1 0 31 38 A 12.6 12.6 0 0 1 31 6 Z" fill="#FFE9A8" />
          <Circle cx={17} cy={16} r={2.8} fill="#E0C978" />
          <Circle cx={13} cy={26} r={2} fill="#E0C978" />
          <Circle cx={21} cy={30} r={1.6} fill="#E0C978" />
          <Path d="M 41 8 l 1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2 z" fill={palette.safetyYellow} />
          <Path d="M 40 33 l .9 2 2 .9 -2 .9 -.9 2 -.9 -2 -2 -.9 2 -.9 z" fill={palette.safetyYellow} opacity={0.85} />
        </G>
      );
    case 'snow':
      return (
        <G>
          <Path d="M 13 26 A 8 8 0 0 1 13 10 A 11 11 0 0 1 34 10 A 8 8 0 0 1 34 26 Z" fill="#8FA6C8" />
          <Path d="M 13.6 24.6 A 6.8 6.8 0 0 1 14 11.4 A 9.6 9.6 0 0 1 33 11.4 A 6.8 6.8 0 0 1 33.4 24.6 Z" fill="#EEF5FD" />
          {([
            [14, 36],
            [24, 40],
            [34, 36],
          ] as [number, number][]).map(([x, y], i) => (
            <G key={i}>
              <Path d={`M ${x} ${y - 5} v 10 M ${x - 4.4} ${y - 2.5} l 8.8 5 M ${x + 4.4} ${y - 2.5} l -8.8 5`} stroke={palette.waterCyanLight} strokeWidth={2.2} strokeLinecap="round" />
              <Circle cx={x} cy={y} r={1.4} fill={palette.white} />
            </G>
          ))}
        </G>
      );
    case 'wind':
      return (
        <G>
          <Path d="M 4 16 h 22 a 6 6 0 1 0 -6 -6" stroke="#8FA6C8" strokeWidth={4.4} strokeLinecap="round" fill="none" />
          <Path d="M 4 26 h 30 a 6.5 6.5 0 1 1 -6.5 6.5" stroke="#B4C6DE" strokeWidth={4.4} strokeLinecap="round" fill="none" />
          <Path d="M 6 36 h 15 a 5 5 0 1 0 -5 5" stroke="#C6D2E8" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M 38 6 C 44 8 45 14 41 17 C 38 14 37 10 38 6 Z" fill={palette.leafGreen} />
        </G>
      );
    case 'storm':
      return (
        <G>
          <Path d="M 12 26 A 8 8 0 0 1 12 10 A 11 11 0 0 1 33 10 A 8 8 0 0 1 33 26 Z" fill="#5B6588" />
          <Path d="M 12.6 24.6 A 6.8 6.8 0 0 1 13 11.4 A 9.6 9.6 0 0 1 32 11.4 A 6.8 6.8 0 0 1 32.4 24.6 Z" fill="#B4BCD4" />
          <Path d="M 26 25 L 15 38 h 7 l -3 10 L 32 33 h -8 z" fill={palette.gold} transform="translate(0 -2)" />
          <Path d="M 26 25 L 16 36.6 h 6.6 l -2.4 8 L 30.4 32.4 h -7 z" fill={palette.safetyYellow} />
          <Path d="M 8 34 l -2 6 M 40 32 l -2 6" stroke={palette.waterCyan} strokeWidth={2.6} strokeLinecap="round" />
        </G>
      );

    /* ================= gear ================= */
    case 'gloves':
      return (
        <G>
          <Ground cy={45} rx={16} />
          {([0, 21] as number[]).map((dx, i) => (
            <G key={i}>
              <Path d={`M ${5 + dx} 20 a 5 5 0 0 1 10 0 v 4 h 2 a 4 4 0 0 1 4 4 v 12 a 5 5 0 0 1 -5 5 h -8 a 5 5 0 0 1 -5 -5 z`} fill={palette.gold} />
              <Path d={`M ${6.4 + dx} 20 a 3.6 3.6 0 0 1 7.2 0 v 5 h 2.4 a 2.8 2.8 0 0 1 2.8 2.8 v 11.6 a 3.8 3.8 0 0 1 -3.8 3.8 h -7 a 3.8 3.8 0 0 1 -3.8 -3.8 z`} fill={palette.safetyYellow} />
              <Rect x={5 + dx} y={31} width={16} height={4} rx={2} fill={palette.engineRed} />
              <Rect x={7.4 + dx} y={22} width={2.6} height={6} rx={1.3} fill={HI_STRONG} />
            </G>
          ))}
        </G>
      );
    case 'whistle':
      return (
        <G>
          <Ground cy={44} rx={14} />
          <Path d="M 4 8 C 16 6 30 12 38 20" stroke="#B9261C" strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Path d="M 8 24 h 22 a 10 10 0 0 1 0 20 h -22 a 5 5 0 0 1 -5 -5 v -10 a 5 5 0 0 1 5 -5 z" fill="#8FA0C8" />
          <Path d="M 9 25.6 h 21 a 8.4 8.4 0 0 1 0 16.8 h -21 a 3.6 3.6 0 0 1 -3.6 -3.6 v -9.6 a 3.6 3.6 0 0 1 3.6 -3.6 z" fill="#DDE5F4" />
          <Circle cx={31} cy={34} r={3.4} fill="#8FA0C8" />
          <Path d="M 12 20 h 12 v 5 h -12 z" fill="#5B6588" />
          <Rect x={8} y={28} width={9} height={3.4} rx={1.7} fill={HI_STRONG} />
          <Circle cx={22} cy={18} r={3.4} fill={palette.engineRed} />
        </G>
      );
    case 'siren':
      return (
        <G>
          <Ground cy={45} rx={13} />
          <Path d="M 6 12 l -4 -6 M 42 12 l 4 -6 M 4 22 h -4 M 44 22 h 4" stroke={palette.safetyYellow} strokeWidth={3} strokeLinecap="round" />
          <Path d="M 11 32 C 11 18 15 10 24 10 C 33 10 37 18 37 32 Z" fill="#8E1B13" />
          <Path d="M 13 31 C 13 19 16.6 12 24 12 C 31.4 12 35 19 35 31 Z" fill={palette.engineRed} />
          <Path d="M 17 26 C 17 18 19.4 14.4 23 14 L 23 30 Z" fill="#FF8F84" />
          <Rect x={8} y={31} width={32} height={7} rx={3.5} fill="#3B4460" />
          <Rect x={8} y={31} width={32} height={5} rx={2.5} fill="#5B6588" />
          <Rect x={11} y={38} width={26} height={5} rx={2.5} fill="#39425F" />
        </G>
      );
    case 'uniform':
      return (
        <G>
          <Ground cy={45} rx={15} />
          <Path d="M 24 4 a 3.4 3.4 0 0 1 3.4 3.4 c 0 2 -1.6 2.4 -3.4 3.6" stroke="#8FA0C8" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M 10 44 v -20 l -5 -3 l 8 -9 l 11 -1 l 11 1 l 8 9 l -5 3 v 20 z" fill="#1A2246" />
          <Path d="M 11.6 42.6 v -19.6 l -4 -2.4 l 6.4 -7.2 l 10 -.9 l 10 .9 l 6.4 7.2 l -4 2.4 v 19.6 z" fill="#26315F" />
          <Path d="M 24 11 L 30 15 L 24 25 L 18 15 Z" fill={palette.engineRed} />
          <Path d="M 11.6 28 h 24.8 M 11.6 35 h 24.8" stroke={palette.safetyYellow} strokeWidth={3.4} />
          <Circle cx={31} cy={21} r={2.8} fill={palette.safetyYellow} />
          <Rect x={14} y={19} width={3.4} height={7} rx={1.7} fill={HI} />
        </G>
      );
    case 'bandage':
      return (
        <G>
          <Ground cy={44} rx={16} />
          <Rect x={5} y={17} width={38} height={15} rx={7.5} fill="#D9A15E" transform="rotate(-24 24 24)" />
          <Rect x={6} y={18} width={36} height={13} rx={6.5} fill="#F0C08A" transform="rotate(-24 24 24)" />
          <Rect x={17} y={17} width={14} height={15} rx={4} fill="#FBE4C6" transform="rotate(-24 24 24)" />
          {([
            [20, 21],
            [24, 24],
            [28, 27],
            [20.5, 27],
            [27.5, 21],
          ] as [number, number][]).map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={1.2} fill="#D9A15E" />
          ))}
          <Rect x={8} y={19} width={7} height={3} rx={1.5} fill={HI_STRONG} transform="rotate(-24 24 24)" />
        </G>
      );
    case 'stretcher':
      return (
        <G>
          <Ground cy={45} rx={18} />
          <Rect x={2} y={20} width={44} height={5} rx={2.5} fill="#5B6588" />
          <Rect x={2} y={20} width={44} height={3.4} rx={1.7} fill="#8FA0C8" />
          <Rect x={7} y={12} width={34} height={10} rx={4} fill="#2E63B8" />
          <Rect x={7} y={12} width={34} height={7.4} rx={3.7} fill="#4FA3F7" />
          <Rect x={12} y={14.4} width={10} height={2.6} rx={1.3} fill={HI_STRONG} />
          <Rect x={7} y={25} width={4} height={17} rx={2} fill="#5B6588" />
          <Rect x={37} y={25} width={4} height={17} rx={2} fill="#5B6588" />
          <Circle cx={9} cy={42} r={4} fill="#39425F" />
          <Circle cx={39} cy={42} r={4} fill="#39425F" />
          <Circle cx={9} cy={42} r={1.8} fill="#C6CDE0" />
          <Circle cx={39} cy={42} r={1.8} fill="#C6CDE0" />
          <Path d="M 20.6 14.4 h 6.8 v 2.4 h -6.8 z" fill={palette.white} opacity={0} />
        </G>
      );
    case 'toolbox':
      return (
        <G>
          <Ground cy={45} rx={17} />
          <Path d="M 16 12 C 16 6 32 6 32 12" stroke="#5B6588" strokeWidth={3.4} fill="none" strokeLinecap="round" />
          <Rect x={4} y={16} width={40} height={27} rx={5} fill={palette.engineRedDark} />
          <Rect x={4} y={16} width={40} height={23} rx={5} fill={palette.engineRed} />
          <Rect x={4} y={24} width={40} height={4} fill="rgba(31,42,90,0.14)" />
          <Rect x={17} y={11} width={14} height={8} rx={3} fill="#5B6588" />
          <Rect x={18.6} y={12.4} width={10.8} height={4} rx={2} fill="#8FA0C8" />
          <Rect x={19} y={26} width={10} height={5} rx={2.5} fill={palette.safetyYellow} />
          <Rect x={8} y={19} width={12} height={3.4} rx={1.7} fill={HI} />
        </G>
      );
    case 'flag':
      return (
        <G>
          <Ground cy={45} rx={9} />
          <Rect x={9} y={4} width={4} height={40} rx={2} fill="#5B6588" />
          <Rect x={9.6} y={6} width={1.6} height={16} rx={0.8} fill={HI_STRONG} />
          <Path d="M 13 6 C 22 3 30 11 40 8 v 16 C 30 27 22 19 13 22 Z" fill={palette.engineRedDark} />
          <Path d="M 13 7 C 21.4 4.4 29.4 12 38.4 9.4 v 13 C 29.4 25 21.4 17.6 13 20.4 Z" fill={palette.engineRed} />
          <Path d="M 16 9 C 21 8 25 11 28 12" stroke={HI} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Circle cx={11} cy={3} r={2.6} fill={palette.gold} />
        </G>
      );

    /* ================= people ================= */
    case 'nurse':
      return <Bust top="#EAF2FB" hat={palette.white} hair="#7A4A28" badge={palette.engineRed} />;
    case 'police':
      return <Bust top="#2E63B8" hat="#1E4A90" hatBrim hair="#3A3348" skin="#C68450" badge={palette.safetyYellow} />;
    case 'mail-carrier':
      return <Bust top="#4FA3F7" hat="#2E63B8" hatBrim hair="#7A4A28" badge={palette.white} />;
    case 'farmer':
      return <Bust top="#5DBB63" hat="#E8CE9E" hatBrim skin="#F0B98A" hair="#D2603A" />;
    case 'cook':
      return (
        <G>
          <Bust top={palette.white} skin="#F0B98A" hair="#3A3348" />
          <G>
            <Circle cx={16} cy={7} r={6.4} fill="#E7ECF6" />
            <Circle cx={32} cy={7} r={6.4} fill="#E7ECF6" />
            <Circle cx={24} cy={3.6} r={7.4} fill="#E7ECF6" />
            <Circle cx={16.4} cy={6.4} r={5.6} fill={palette.white} />
            <Circle cx={31.6} cy={6.4} r={5.6} fill={palette.white} />
            <Circle cx={24} cy={3} r={6.6} fill={palette.white} />
            <Rect x={14} y={10} width={20} height={7} rx={3} fill="#E7ECF6" />
            <Rect x={14} y={10} width={20} height={5} rx={2.5} fill={palette.white} />
          </G>
        </G>
      );
    case 'vet':
      return (
        <G>
          <Bust top={palette.white} skin="#C68450" hair="#2B2A3E" badge={palette.waterCyan} />
          <Path d="M 8 34 h 10" stroke={palette.waterCyanDark} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Circle cx={14} cy={38} r={3.4} fill="#8FA0C8" />
          <Circle cx={14} cy={38} r={2} fill="#DDE5F4" />
        </G>
      );
    case 'driver':
      return <Bust top={palette.engineRed} hat={palette.navySoft} hatBrim skin="#8A5433" hair="#1E1D2C" badge={palette.safetyYellow} />;
    case 'musician':
      return (
        <G>
          <Bust top={palette.purple} skin="#F0B98A" hair="#D2603A" />
          <G>
            <Circle cx={11} cy={38} r={3.6} fill={palette.navy} />
            <Rect x={13.4} y={26} width={2.4} height={12} rx={1.2} fill={palette.navy} />
            <Path d="M 13.4 26 C 18 25 20 28 20 30 C 18 27.6 16 27.4 13.4 28.6 Z" fill={palette.navy} />
          </G>
        </G>
      );
    case 'gardener':
      return (
        <G>
          <Bust top="#8FD16B" hat="#E8CE9E" hatBrim skin="#F0B98A" hair="#7A4A28" />
          <Path d="M 36 40 v -8" stroke={palette.leafGreenDark} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={36} cy={30} r={3.6} fill={palette.leafGreen} />
        </G>
      );
    case 'shopkeeper':
      return (
        <G>
          <Bust top={palette.orange} skin="#F0B98A" hair="#2B2A3E" />
          <Path d="M 15 36 h 18 v 8 h -18 z" fill={palette.cream} opacity={0.9} />
          <Path d="M 15 36 h 18 v 2.4 h -18 z" fill={palette.creamDeep} />
        </G>
      );
    case 'train-conductor':
      return <Bust top="#3D4870" hat="#232C52" hatBrim skin="#C68450" hair="#1E1D2C" badge={palette.gold} />;
    case 'scientist':
      return (
        <G>
          <Bust top={palette.white} skin="#8A5433" hair="#1E1D2C" badge={palette.leafGreen} />
          <G>
            <Circle cx={20.6} cy={17.6} r={4.4} fill="#FFFFFF" opacity={0.4} />
            <Circle cx={27.4} cy={17.6} r={4.4} fill="#FFFFFF" opacity={0.4} />
            <Circle cx={20.6} cy={17.6} r={4.4} stroke={NAVY} strokeWidth={1.4} fill="none" />
            <Circle cx={27.4} cy={17.6} r={4.4} stroke={NAVY} strokeWidth={1.4} fill="none" />
            <Path d="M 25 17.4 h -2" stroke={NAVY} strokeWidth={1.4} strokeLinecap="round" />
          </G>
        </G>
      );

    /* ================= direction & word cards ================= */
    case 'north':
      return <Compass deg={0} />;
    case 'south':
      return <Compass deg={180} />;
    case 'east':
      return <Compass deg={90} />;
    case 'west':
      return <Compass deg={-90} />;
    case 'stop':
      return (
        <G>
          <Ground cy={45} rx={13} />
          <Path d="M 15.5 4 h 17 L 44 15.5 v 17 L 32.5 44 h -17 L 4 32.5 v -17 Z" fill={palette.engineRedDark} />
          <Path d="M 16.4 6 h 15.2 L 42 16.4 v 15.2 L 31.6 42 h -15.2 L 6 31.6 v -15.2 Z" fill={palette.engineRed} />
          <Rect x={13} y={21} width={22} height={6} rx={3} fill={palette.white} />
          <Path d="M 12 12 C 14 9.6 17 8 20 7.4" stroke={HI_STRONG} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'wait':
      return (
        <G>
          <Ground cy={45} rx={13} />
          <Rect x={11} y={3} width={26} height={5} rx={2.5} fill="#B98F55" />
          <Rect x={11} y={40} width={26} height={5} rx={2.5} fill="#B98F55" />
          <Path d="M 14 8 h 20 c 0 8 -10 12 -10 16 c 0 4 10 8 10 16 h -20 c 0 -8 10 -12 10 -16 c 0 -4 -10 -8 -10 -16 z" fill="#DCE7F5" />
          <Path d="M 15.6 30 c 2 -3 8 -6 8.4 -6 c .4 0 6.4 3 8.4 6 c 1.4 2.4 1.6 6 1.6 8.6 h -20 c 0 -2.6 .2 -6.2 1.6 -8.6 z" fill={palette.gold} />
          <Path d="M 20 12 h 8 c -.6 3 -4 5 -4 5 s -3.4 -2 -4 -5 z" fill={palette.safetyYellow} />
          <Rect x={16} y={10} width={3.4} height={5} rx={1.7} fill={HI_STRONG} />
        </G>
      );
    case 'listen':
      return (
        <G>
          <Ground cy={45} rx={12} />
          <Path d="M 26 5 C 34 5 39 11 39 19 C 39 27 33 28 31 33 C 29.4 37 30 43 24 43 C 19 43 16 39 16 34 L 16 19 C 16 11 18 5 26 5 Z" fill="#E0B790" />
          <Path d="M 26 7 C 33 7 37 12 37 19 C 37 26 31.4 27.4 29.4 32.2 C 28 36 28.4 41 24 41 C 20 41 18 38 18 34 L 18 19 C 18 12 20 7 26 7 Z" fill="#FFD3B0" />
          <Path d="M 26 14 C 30 14 32 17 31 21 C 30 25 26 25 26 29" stroke="#D6A47A" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 9 15 a 9 9 0 0 1 0 14 M 4 10 a 16 16 0 0 1 0 24" stroke={palette.waterCyan} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'look':
      return (
        <G>
          <Ground cy={44} rx={16} />
          <Path d="M 2 24 C 8 13 16 8 24 8 C 32 8 40 13 46 24 C 40 35 32 40 24 40 C 16 40 8 35 2 24 Z" fill="#DDE5F4" />
          <Path d="M 4.6 24 C 10 15 17 11 24 11 C 31 11 38 15 43.4 24 C 38 33 31 37 24 37 C 17 37 10 33 4.6 24 Z" fill={palette.white} />
          <Circle cx={24} cy={24} r={11} fill="#2E7BD6" />
          <Circle cx={24} cy={24} r={10} fill="#4FA3F7" />
          <Circle cx={24} cy={24} r={5} fill={NAVY} />
          <Circle cx={20.6} cy={20.6} r={2.6} fill="#FFFFFF" />
          <Circle cx={27} cy={28} r={1.3} fill="#FFFFFF" opacity={0.8} />
          <Path d="M 10 17 C 14 14 18 12.6 22 12.4" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'please':
      return (
        <G>
          <Ground cy={45} rx={16} />
          <Path d="M 4 24 C 4 20 8 18 11 21 L 21 30 v 12 h -8 C 8 42 4 38 4 32 Z" fill={mix('#FFD3B0', palette.navy, 0.16)} />
          <Path d="M 5.6 24.6 C 6 21.6 8.6 20.4 10.6 22.4 L 19.4 30.6 v 10 h -6.4 C 9 40.6 5.6 37.4 5.6 32.4 Z" fill="#FFD3B0" />
          <Path d="M 44 24 C 44 20 40 18 37 21 L 27 30 v 12 h 8 C 40 42 44 38 44 32 Z" fill={mix('#FFD3B0', palette.navy, 0.16)} />
          <Path d="M 42.4 24.6 C 42 21.6 39.4 20.4 37.4 22.4 L 28.6 30.6 v 10 h 6.4 C 39 40.6 42.4 37.4 42.4 32.4 Z" fill="#FFD3B0" />
          <Path d="M 24 6 C 30 12 31 17 24 24 C 17 17 18 12 24 6 Z" fill="#FF7EB3" />
          <Path d="M 24 12 C 27 15 27.4 17 24 20.4 C 20.6 17 21 15 24 12 Z" fill="#FFC4DC" />
        </G>
      );
    case 'sorry':
      return (
        <G>
          <Ground cy={44} rx={15} />
          <Path d="M 24 42 C 9 32 4 24 4 17 C 4 10 9 6 15 6 C 19 6 22 8 24 11 C 26 8 29 6 33 6 C 39 6 44 10 44 17 C 44 24 39 32 24 42 Z" fill="#C4241A" />
          <Path d="M 24 39 C 11 30 6.6 23.4 6.6 17.4 C 6.6 11.6 10.6 8.4 15.4 8.4 C 19 8.4 21.8 10.4 24 13.4 C 26.2 10.4 29 8.4 32.6 8.4 C 37.4 8.4 41.4 11.6 41.4 17.4 C 41.4 23.4 37 30 24 39 Z" fill="#FF7EB3" />
          <Path d="M 13 15 C 15 12 18 11 20.6 11.4" stroke={HI_STRONG} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 18 24 q 6 5 12 0" stroke="#C4241A" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.55} />
        </G>
      );
    case 'careful':
      return (
        <G>
          <Ground cy={44} rx={17} />
          <Path d="M 20.4 7 a 4.2 4.2 0 0 1 7.2 0 L 45 38 a 4.2 4.2 0 0 1 -3.6 6.3 h -34.8 A 4.2 4.2 0 0 1 3 38 Z" fill={palette.gold} />
          <Path d="M 21.8 9.4 a 2.6 2.6 0 0 1 4.4 0 L 42.6 38.4 a 2.6 2.6 0 0 1 -2.2 3.9 h -32.8 a 2.6 2.6 0 0 1 -2.2 -3.9 Z" fill={palette.safetyYellow} />
          <Rect x={21.4} y={17} width={5.2} height={14} rx={2.6} fill={NAVY} />
          <Circle cx={24} cy={36} r={3} fill={NAVY} />
          <Path d="M 18 20 L 22 13" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      );
    case 'big':
      return (
        <G>
          <Ground cy={45} rx={16} />
          <Circle cx={40} cy={38} r={5} fill="#C6D2E8" />
          <Circle cx={20} cy={25} r={18} fill="#2E7BD6" />
          <Circle cx={20} cy={24} r={17} fill="#4FA3F7" />
          <Ellipse cx={12} cy={15} rx={5.6} ry={3.6} fill={HI} transform="rotate(-32 12 15)" />
        </G>
      );
    case 'small':
      return (
        <G>
          <Ground cy={45} rx={16} />
          <Circle cx={19} cy={24} r={17} fill="#C6D2E8" />
          <Circle cx={38} cy={35} r={8} fill="#2E7BD6" />
          <Circle cx={38} cy={34.4} r={7.2} fill="#4FA3F7" />
          <Ellipse cx={35} cy={31} rx={2.6} ry={1.7} fill={HI_STRONG} transform="rotate(-32 35 31)" />
        </G>
      );
    case 'hot':
      return <Thermo hot />;
    case 'cold':
      return <Thermo hot={false} />;
    case 'fast':
      return (
        <G>
          <Ground cy={44} rx={16} />
          <Path d="M 3 17 h 14 M 1 24 h 11 M 4 31 h 12" stroke={palette.waterCyanLight} strokeWidth={3.4} strokeLinecap="round" />
          {([0, 9, 18] as number[]).map((dx, i) => (
            <G key={i}>
              <Path d={`M ${19 + dx} 10 L ${29 + dx} 24 L ${19 + dx} 38 L ${23 + dx} 24 Z`} fill={i === 2 ? palette.engineRed : i === 1 ? palette.orange : palette.safetyYellow} />
            </G>
          ))}
          <Path d="M 20 13 L 26 22" stroke={HI_STRONG} strokeWidth={2} strokeLinecap="round" />
        </G>
      );

    /* ================= feelings & colours ================= */
    case 'happy':
      return <Face mood="happy" />;
    case 'sad':
      return <Face mood="sad" />;
    case 'scared':
      return <Face mood="scared" />;
    case 'proud':
      return <Face mood="proud" />;
    case 'tired':
      return <Face mood="tired" />;
    case 'excited':
      return <Face mood="excited" />;
    case 'calm':
      return <Face mood="calm" />;
    case 'brave':
      return <Face mood="brave" />;
    case 'black':
      return <Swatch c="#3B4460" />;
    case 'pink':
      return <Swatch c={palette.pink} />;
    case 'purple':
      return <Swatch c={palette.purple} />;

    default:
      return null;
  }
}

export interface VocabIconProps {
  /** any id from `vocabIconIds`; anything else renders a friendly "?" tile */
  id: string;
  size?: number;
  /** drop the contact ellipse (for icons already sitting inside a drawn scene) */
  noShadow?: boolean;
}

/**
 * Vocabulary art for the word bank — one chunky sticker per word, in the same
 * flat-fill + shade + highlight language as the rest of the station.
 * Gear words reuse `EquipmentIcon`, so a hose looks the same everywhere.
 * An unknown id NEVER crashes: it renders a friendly cream "?" tile.
 *
 * Consistency rule 3: every grounded icon gets the same navy contact ellipse,
 * drawn here so no id can forget it. Sky objects (sun, cloud, rain…) float.
 */
export function VocabIcon({ id, size = 64, noShadow = false }: VocabIconProps) {
  if (equipmentIds.has(id)) return <EquipmentIcon id={id as EquipmentId} size={size} shadow={!noShadow} />;
  const known = (vocabIconIds as readonly string[]).includes(id);
  const grounded = known && !noShadow && !SKY_IDS.has(id);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} accessibilityLabel={known ? id.replace(/-/g, ' ') : 'new word'}>
      {grounded ? <Ground cy={45} rx={16} /> : null}
      {known ? <Art id={id} /> : <UnknownTile />}
    </Svg>
  );
}

/** Never crash on a word we have not drawn yet — show a friendly question tile. */
function UnknownTile() {
  return (
    <G>
      <Rect x={4} y={4} width={40} height={40} rx={12} fill={palette.creamDeep} />
      <Rect x={4} y={4} width={40} height={36} rx={12} fill={palette.cream} />
      <Path
        d="M 17.5 18.5 C 17.5 13.5 21 11 24.5 11 C 28.5 11 31.5 13.5 31.5 17.5 C 31.5 22 26.5 23 25.5 26.5"
        stroke={palette.navyMuted}
        strokeWidth={4.4}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={25} cy={34} r={3.2} fill={palette.navyMuted} />
    </G>
  );
}
