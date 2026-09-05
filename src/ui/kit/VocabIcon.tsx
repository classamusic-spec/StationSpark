import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { EquipmentId } from '@/learning/types';
import { palette } from '@/theme';
import { mix } from '@/characters/rig/palettes';
import { EquipmentIcon } from './EquipmentIcon';

const VB = 48;

/* House tones — rule 2 (base → one shade → one highlight) and rule 3 (ground). */
const HI = 'rgba(255,255,255,0.32)';
const HI_STRONG = 'rgba(255,255,255,0.55)';
const GROUND = 'rgba(31,42,90,0.12)';
const dk = (c: string, a = 0.18) => mix(c, palette.navy, a);
const lt = (c: string, a = 0.3) => mix(c, '#FFFFFF', a);

/** rule 3 — every grounded object gets a contact ellipse, ry ≈ rx × 0.22. */
const Ground = ({ cy = 44, rx = 15, cx = 24 }: { cy?: number; rx?: number; cx?: number }) => (
  <Ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.22} fill={GROUND} />
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

/** A cream card the abstract words sit on, so a "word" never floats. */
const WordTile = ({ children, tint = palette.cream }: { children: React.ReactNode; tint?: string }) => (
  <G>
    <Ground cy={45} rx={16} />
    <Rect x={4} y={5} width={40} height={39} rx={12} fill={dk(tint, 0.14)} />
    <Rect x={4} y={5} width={40} height={35} rx={12} fill={tint} />
    {children}
  </G>
);

/** A round fruit / vegetable body with the standard three tones. */
const Blob = ({ c, cx = 24, cy = 27, rx = 15, ry = 15 }: { c: string; cx?: number; cy?: number; rx?: number; ry?: number }) => (
  <G>
    <Ellipse cx={cx} cy={cy + 1} rx={rx} ry={ry} fill={dk(c, 0.22)} />
    <Ellipse cx={cx} cy={cy} rx={rx - 0.8} ry={ry - 0.8} fill={c} />
    <Ellipse cx={cx - rx * 0.42} cy={cy - ry * 0.46} rx={rx * 0.32} ry={ry * 0.2} fill={HI} transform={`rotate(-32 ${cx - rx * 0.42} ${cy - ry * 0.46})`} />
  </G>
);

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
    case 'happy':
      return <Face mood="happy" />;
    case 'sad':
      return <Face mood="sad" />;
    default:
      return null;
  }
}

export interface VocabIconProps {
  /** any id from `vocabIconIds`; anything else renders a friendly "?" tile */
  id: string;
  size?: number;
}

/**
 * Vocabulary art for the word bank — one chunky sticker per word, in the same
 * flat-fill + shade + highlight language as the rest of the station.
 * Gear words reuse `EquipmentIcon`, so a hose looks the same everywhere.
 * An unknown id NEVER crashes: it renders a friendly cream "?" tile.
 */
export function VocabIcon({ id, size = 64 }: VocabIconProps) {
  if (equipmentIds.has(id)) return <EquipmentIcon id={id as EquipmentId} size={size} />;
  const known = (vocabIconIds as readonly string[]).includes(id);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} accessibilityLabel={known ? id : 'new word'}>
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
