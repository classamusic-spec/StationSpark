import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { EquipmentId } from '@/learning/types';
import { palette } from '@/theme';

const VB = 56;

/** Every piece of gear, as one closed shape — used for the dashed "empty slot" state. */
const silhouettes: Record<EquipmentId, string> = {
  hose: 'M 28 6 A 22 22 0 1 1 27.9 6 Z M 6 38 L 2 44 A 5 5 0 0 0 9 51 L 15 45 Z',
  cone: 'M 28 4 C 31 4 33 6 34 10 L 42 44 L 14 44 L 22 10 C 23 6 25 4 28 4 Z M 8 44 L 48 44 A 4 4 0 0 1 48 52 L 8 52 A 4 4 0 0 1 8 44 Z',
  'first-aid': 'M 22 10 A 4 4 0 0 1 26 6 L 30 6 A 4 4 0 0 1 34 10 L 34 14 L 46 14 A 5 5 0 0 1 51 19 L 51 45 A 5 5 0 0 1 46 50 L 10 50 A 5 5 0 0 1 5 45 L 5 19 A 5 5 0 0 1 10 14 L 22 14 Z',
  flashlight: 'M 10 20 L 24 14 L 24 42 L 10 36 A 4 4 0 0 1 10 20 Z M 24 12 L 46 6 A 4 4 0 0 1 51 10 L 51 46 A 4 4 0 0 1 46 50 L 24 44 Z',
  ladder: 'M 12 4 A 4 4 0 0 1 20 4 L 20 52 A 4 4 0 0 1 12 52 Z M 36 4 A 4 4 0 0 1 44 4 L 44 52 A 4 4 0 0 1 36 52 Z M 16 12 L 40 12 L 40 18 L 16 18 Z M 16 24 L 40 24 L 40 30 L 16 30 Z M 16 36 L 40 36 L 40 42 L 16 42 Z',
  axe: 'M 22 8 C 34 4 46 8 50 18 C 46 24 36 26 26 22 L 26 46 A 4 4 0 0 1 18 46 L 18 20 C 18 14 19 10 22 8 Z',
  bucket: 'M 8 18 L 48 18 L 43 48 A 5 5 0 0 1 38 52 L 18 52 A 5 5 0 0 1 13 48 Z M 14 18 C 14 8 42 8 42 18',
  helmet: 'M 14 32 C 14 16 20 8 28 8 C 36 8 42 16 42 32 Z M 4 36 C 4 29 14 25 28 25 C 42 25 52 29 52 36 C 52 41 46 43 41 41 C 35 38 21 38 15 41 C 10 43 4 41 4 36 Z',
  radio: 'M 36 4 A 2.5 2.5 0 0 1 41 4 L 41 14 L 36 14 Z M 12 12 A 5 5 0 0 1 17 7 L 39 7 A 5 5 0 0 1 44 12 L 44 47 A 5 5 0 0 1 39 52 L 17 52 A 5 5 0 0 1 12 47 Z',
  boots: 'M 6 10 A 4 4 0 0 1 14 10 L 14 32 L 24 34 A 5 5 0 0 1 28 39 L 28 44 A 4 4 0 0 1 24 48 L 6 48 A 4 4 0 0 1 2 44 Z M 30 10 A 4 4 0 0 1 38 10 L 38 32 L 48 34 A 5 5 0 0 1 52 39 L 52 44 A 4 4 0 0 1 48 48 L 34 48 A 4 4 0 0 1 30 44 Z',
  extinguisher: 'M 22 6 L 34 6 L 34 12 L 38 14 A 6 6 0 0 1 42 20 L 42 46 A 6 6 0 0 1 36 52 L 20 52 A 6 6 0 0 1 14 46 L 14 20 A 6 6 0 0 1 18 14 L 22 12 Z',
  rope: 'M 28 8 A 20 20 0 1 1 27.9 8 Z',
};

/** Bilingual gear names — imported by EquipmentCheck and GearSort. */
export const equipmentName: Record<EquipmentId, { en: string; es: string }> = {
  hose: { en: 'Hose', es: 'Manguera' },
  cone: { en: 'Cone', es: 'Cono' },
  'first-aid': { en: 'First Aid Kit', es: 'Botiquín' },
  flashlight: { en: 'Flashlight', es: 'Linterna' },
  ladder: { en: 'Ladder', es: 'Escalera' },
  axe: { en: 'Axe', es: 'Hacha' },
  bucket: { en: 'Bucket', es: 'Cubeta' },
  helmet: { en: 'Helmet', es: 'Casco' },
  radio: { en: 'Radio', es: 'Radio' },
  boots: { en: 'Boots', es: 'Botas' },
  extinguisher: { en: 'Extinguisher', es: 'Extintor' },
  rope: { en: 'Rope', es: 'Cuerda' },
};

/** All twelve ids, for galleries and pickers. */
export const equipmentIds = Object.keys(equipmentName) as EquipmentId[];

export const equipmentLabel = (id: EquipmentId): string => equipmentName[id].en;

function Art({ id }: { id: EquipmentId }) {
  switch (id) {
    case 'hose':
      return (
        <G>
          {/* brass nozzle */}
          <Path d="M 16 40 L 6 48" stroke="#3B4460" strokeWidth={9} strokeLinecap="round" />
          <Path d="M 16 40 L 8 46" stroke="#5B6588" strokeWidth={6} strokeLinecap="round" />
          <Circle cx={6.5} cy={47.5} r={4.4} fill={palette.gold} />
          {/* coil */}
          <Circle cx={28} cy={27} r={21} fill="#E0A800" />
          <Circle cx={28} cy={26} r={20} fill={palette.safetyYellow} />
          <Circle cx={28} cy={26} r={13.5} fill="#E5A400" />
          <Circle cx={28} cy={26} r={12.5} fill="#FFD75E" />
          <Circle cx={28} cy={26} r={6.5} fill="#B87F00" />
          <Path d="M 14 18 A 16 16 0 0 1 26 9" stroke="rgba(255,255,255,0.6)" strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Path d="M 40 40 L 47 47" stroke={palette.engineRed} strokeWidth={7} strokeLinecap="round" />
        </G>
      );
    case 'cone':
      return (
        <G>
          <Path d="M 28 4 C 31.5 4 33.5 6.5 34.5 10.5 L 43 45 L 13 45 L 21.5 10.5 C 22.5 6.5 24.5 4 28 4 Z" fill={palette.orangeDark} />
          <Path d="M 28 5.6 C 31 5.6 32.6 7.8 33.4 11 L 41 44 L 15 44 L 22.6 11 C 23.4 7.8 25 5.6 28 5.6 Z" fill="#FF8A3D" />
          <Path d="M 24.2 22 L 31.8 22 L 33.4 31 L 22.6 31 Z" fill="#FFFFFF" />
          <Path d="M 25.4 8 L 24 16" stroke="rgba(255,255,255,0.45)" strokeWidth={2.6} strokeLinecap="round" />
          <Rect x={6} y={44} width={44} height={9} rx={4.5} fill={palette.orangeDark} />
          <Rect x={6} y={44} width={44} height={6.4} rx={3.2} fill="#FF8A3D" />
        </G>
      );
    case 'first-aid':
      return (
        <G>
          <Rect x={22} y={5} width={12} height={10} rx={3.5} fill="#39425F" />
          <Rect x={24.4} y={7.4} width={7.2} height={5.4} rx={2} fill="#5B6588" />
          <Rect x={5} y={14} width={46} height={36} rx={7} fill={palette.engineRedDark} />
          <Rect x={5} y={14} width={46} height={32} rx={7} fill={palette.engineRed} />
          <Rect x={9} y={18} width={16} height={7} rx={3.5} fill="rgba(255,255,255,0.32)" />
          <Path d="M 24.6 22 h 6.8 v 6.2 h 6.2 v 6.8 h -6.2 v 6.2 h -6.8 v -6.2 h -6.2 v -6.8 h 6.2 z" fill="#FFFFFF" />
          <Rect x={5} y={30} width={46} height={3} fill="rgba(31,42,90,0.12)" />
        </G>
      );
    case 'flashlight':
      return (
        <G>
          <Path d="M 24 12 L 47 5 A 4 4 0 0 1 52 9 L 52 47 A 4 4 0 0 1 47 51 L 24 44 Z" fill="#FFE07A" opacity={0.55} />
          <Rect x={8} y={19} width={19} height={18} rx={6} fill="#2B3466" />
          <Rect x={8} y={19} width={19} height={13} rx={6} fill="#3D4870" />
          <Path d="M 25 13 L 40 8 A 4 4 0 0 1 45 12 L 45 44 A 4 4 0 0 1 40 48 L 25 43 Z" fill="#E0A800" />
          <Path d="M 25 14 L 39 9.6 A 3 3 0 0 1 43 12.6 L 43 43.4 A 3 3 0 0 1 39 46.4 L 25 42 Z" fill={palette.safetyYellow} />
          <Rect x={27} y={18} width={4} height={20} rx={2} fill="rgba(255,255,255,0.5)" />
          <Rect x={13} y={22} width={4} height={8} rx={2} fill="rgba(255,255,255,0.4)" />
        </G>
      );
    case 'ladder':
      return (
        <G>
          {[13, 25, 37].map((y) => (
            <G key={y}>
              <Rect x={13} y={y + 1.5} width={30} height={7} rx={3.5} fill="#B4BCD4" />
              <Rect x={13} y={y} width={30} height={5.6} rx={2.8} fill="#DDE3F0" />
            </G>
          ))}
          <Rect x={9} y={3} width={9} height={50} rx={4.5} fill={palette.engineRedDark} />
          <Rect x={9} y={3} width={9} height={46} rx={4.5} fill={palette.engineRed} />
          <Rect x={38} y={3} width={9} height={50} rx={4.5} fill={palette.engineRedDark} />
          <Rect x={38} y={3} width={9} height={46} rx={4.5} fill={palette.engineRed} />
          <Rect x={11} y={7} width={3} height={14} rx={1.5} fill="rgba(255,255,255,0.4)" />
        </G>
      );
    case 'axe':
      return (
        <G>
          <Rect x={19} y={16} width={9} height={36} rx={4.5} fill="#9E6A36" />
          <Rect x={19} y={16} width={9} height={33} rx={4.5} fill="#C58B4E" />
          <Rect x={21} y={20} width={2.6} height={12} rx={1.3} fill="rgba(255,255,255,0.35)" />
          <Path d="M 24 8 C 36 4 47 8 51 17 C 46 23 36 25 25 21 Z" fill="#8C94B3" />
          <Path d="M 24 9.6 C 35 6 45.5 9.4 49 17 C 44.6 21.8 35.4 23.4 25.4 20 Z" fill="#DDE3F0" />
          <Path d="M 44 11 C 47 12.6 49 14.6 50 17" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
          <Rect x={19} y={14} width={11} height={6} rx={3} fill="#5B6588" />
        </G>
      );
    case 'bucket':
      return (
        <G>
          <Path d="M 15 14 C 15 4 41 4 41 14" stroke="#8C94B3" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M 7 17 L 49 17 L 44 48 A 5 5 0 0 1 39 52 L 17 52 A 5 5 0 0 1 12 48 Z" fill={palette.engineRedDark} />
          <Path d="M 8.6 18.6 L 47.4 18.6 L 42.6 47.6 A 4 4 0 0 1 38.6 51 L 17.4 51 A 4 4 0 0 1 13.4 47.6 Z" fill={palette.engineRed} />
          <Ellipse cx={28} cy={18} rx={20.5} ry={5} fill="#B9261C" />
          <Ellipse cx={28} cy={17} rx={20.5} ry={4.6} fill="#FF6B5E" />
          <Path d="M 16 24 L 14 44" stroke="rgba(255,255,255,0.34)" strokeWidth={3.4} strokeLinecap="round" />
        </G>
      );
    case 'helmet':
      return (
        <G>
          <Path d="M 14 33 C 14 16 20 7 28 7 C 36 7 42 16 42 33 Z" fill={palette.engineRedDark} />
          <Path d="M 16 32 C 16 18 21 9.5 28 9.5 C 35 9.5 40 18 40 32 Z" fill={palette.engineRed} />
          <Path d="M 20 20 C 22 15 25 12.5 27.5 12.5" stroke="rgba(255,255,255,0.55)" strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <Path d="M 3 36 C 3 28.5 14 24.5 28 24.5 C 42 24.5 53 28.5 53 36 C 53 41 47 43.4 41.5 41 C 35 38 21 38 14.5 41 C 9 43.4 3 41 3 36 Z" fill={palette.engineRedDark} />
          <Path d="M 5 35 C 5 29 15.5 25.6 28 25.6 C 40.5 25.6 51 29 51 35 C 51 38.6 46 40.4 41 38.4 C 35 36 21 36 15 38.4 C 10 40.4 5 38.6 5 35 Z" fill={palette.engineRed} />
          <Path d="M 22 11.5 L 34 11.5 L 34 21 C 34 26.5 28 29.5 28 29.5 C 28 29.5 22 26.5 22 21 Z" fill={palette.goldDark} />
          <Path d="M 23 12.5 L 33 12.5 L 33 21 C 33 25.5 28 28 28 28 C 28 28 23 25.5 23 21 Z" fill={palette.safetyYellow} />
          <Path d="M 28 15 C 30.6 17.6 31 20.2 28 24 C 25 20.2 25.4 17.6 28 15 Z" fill={palette.engineRed} />
        </G>
      );
    case 'radio':
      return (
        <G>
          <Rect x={35} y={2} width={5} height={13} rx={2.5} fill="#39425F" />
          <Circle cx={37.5} cy={3} r={2.8} fill="#5B6588" />
          <Rect x={12} y={7} width={32} height={46} rx={7} fill="#232C52" />
          <Rect x={12} y={7} width={32} height={42} rx={7} fill="#39425F" />
          <Rect x={17} y={13} width={22} height={13} rx={3.5} fill="#E0A800" />
          <Rect x={17} y={13} width={22} height={11} rx={3.5} fill={palette.safetyYellow} />
          <Rect x={19.5} y={16} width={11} height={2.4} rx={1.2} fill="rgba(31,42,90,0.35)" />
          <Rect x={19.5} y={20} width={7} height={2.4} rx={1.2} fill="rgba(31,42,90,0.25)" />
          <Circle cx={21} cy={33} r={3.4} fill={palette.engineRed} />
          <Circle cx={31} cy={33} r={3.4} fill="#5B6588" />
          <Circle cx={21} cy={42} r={3.4} fill="#5B6588" />
          <Circle cx={31} cy={42} r={3.4} fill="#5B6588" />
          <Rect x={14.5} y={10} width={5} height={12} rx={2.5} fill="rgba(255,255,255,0.18)" />
        </G>
      );
    case 'boots':
      return (
        <G>
          {[0, 24].map((dx) => (
            <G key={dx}>
              <Path d={`M ${4 + dx} 12 A 5 5 0 0 1 ${14 + dx} 12 L ${14 + dx} 33 L ${22 + dx} 35 A 5 5 0 0 1 ${26 + dx} 40 L ${26 + dx} 44 A 4 4 0 0 1 ${22 + dx} 48 L ${8 + dx} 48 A 4 4 0 0 1 ${4 + dx} 44 Z`} fill="#E0A800" />
              <Path d={`M ${5.4 + dx} 13 A 3.6 3.6 0 0 1 ${12.6 + dx} 13 L ${12.6 + dx} 33.6 L ${21 + dx} 35.8 A 4 4 0 0 1 ${24.4 + dx} 40 L ${24.4 + dx} 43.4 A 3 3 0 0 1 ${21.4 + dx} 46.4 L ${8.4 + dx} 46.4 A 3 3 0 0 1 ${5.4 + dx} 43.4 Z`} fill={palette.safetyYellow} />
              <Rect x={4 + dx} y={41} width={22} height={7} rx={3.5} fill="#39425F" />
              <Rect x={5 + dx} y={17} width={7.5} height={4} rx={2} fill="#FFFFFF" opacity={0.55} />
            </G>
          ))}
        </G>
      );
    case 'extinguisher':
      return (
        <G>
          <Rect x={22} y={4} width={12} height={9} rx={3} fill="#39425F" />
          <Path d="M 34 8 C 44 8 48 14 48 22" stroke="#39425F" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Circle cx={48} cy={24} r={4} fill="#5B6588" />
          <Rect x={14} y={13} width={28} height={39} rx={9} fill={palette.engineRedDark} />
          <Rect x={14} y={13} width={28} height={35} rx={9} fill={palette.engineRed} />
          <Rect x={18} y={18} width={5.5} height={16} rx={2.75} fill="rgba(255,255,255,0.35)" />
          <Rect x={14} y={26} width={28} height={9} fill="#FFFFFF" opacity={0.92} />
          <Path d="M 26 28.5 C 29 31 29.4 33 26 36 C 22.6 33 23 31 26 28.5 Z" fill={palette.engineRed} />
          <Circle cx={33} cy={31.5} r={2} fill={palette.safetyYellow} />
        </G>
      );
    case 'rope':
    default:
      return (
        <G>
          <Circle cx={28} cy={28} r={21} fill="#C09153" />
          <Circle cx={28} cy={27} r={20} fill="#E0B87A" />
          <Circle cx={28} cy={27} r={13} fill="#C09153" />
          <Circle cx={28} cy={27} r={11.6} fill="#F0D0A0" />
          <Circle cx={28} cy={27} r={5} fill="#A87A42" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <Path
                key={i}
                d={`M ${28 + Math.cos(a) * 12.4} ${27 + Math.sin(a) * 12.4} L ${28 + Math.cos(a) * 19.4} ${27 + Math.sin(a) * 19.4}`}
                stroke="#C09153"
                strokeWidth={2.6}
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          })}
          <Path d="M 16 15 A 17 17 0 0 1 26 8" stroke="rgba(255,255,255,0.5)" strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
  }
}

export interface EquipmentIconProps {
  id: EquipmentId;
  size?: number;
  /** dashed-outline "empty slot" version, like the truck compartments */
  ghost?: boolean;
  /** soft navy ellipse under the object (default false) */
  shadow?: boolean;
}

/**
 * Chunky, glossy, kid-friendly gear art — a coiled yellow hose with a brass
 * nozzle, an orange cone with a white stripe, a red first-aid box, and so on.
 * `ghost` draws the dashed silhouette used for the truck's empty compartments.
 */
export function EquipmentIcon({ id, size = 64, ghost = false, shadow = false }: EquipmentIconProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} accessibilityLabel={equipmentName[id].en}>
      {shadow && !ghost ? <Ellipse cx={28} cy={51} rx={19} ry={3.6} fill="rgba(31,42,90,0.14)" /> : null}
      {ghost ? (
        <G>
          <Path d={silhouettes[id]} fill="rgba(31,42,90,0.16)" fillRule="evenodd" />
          <Path d={silhouettes[id]} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={2.2} strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" fillRule="evenodd" />
        </G>
      ) : (
        <Art id={id} />
      )}
    </Svg>
  );
}
