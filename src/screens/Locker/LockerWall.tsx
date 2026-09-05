/**
 * LOCKER ROOM — the room behind the Locker screen.
 *
 * A cream station wall with its red stripe, a bank of navy lockers with vents
 * and name tags, the child's own locker standing open with their helmet on
 * the shelf, their jacket on the hook and their boots on the floor, a wooden
 * bench, and a tiled floor — one ground plane with a soft lip. Static art,
 * memoized; the crew standing in front of it does the moving.
 */
import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fontFamily, palette } from '@/theme';
import type { Avatar } from '@/state/store';
import { helmetTones } from '@/characters/rig/palettes';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

const DOOR_W = 92;
const LOCKER = { face: '#4B6BB0', side: '#33477F', vent: '#2F4478', interior: '#22335F', door: '#3F5C9C' } as const;
const FLOOR = { face: '#C9D0E0', lip: '#E1E6F1' } as const;

export interface LockerRoomLayout {
  w: number;
  cx: number;
  /** the floor line — where the floor plane starts */
  floorY: number;
  lockerTop: number;
  /** centre of the locker that stands open */
  openX: number;
  /** where Rookie stands */
  rookieX: number;
  /** centre of the bench */
  benchX: number;
  benchTop: number;
  benchWidth: number;
}

/** Where the furniture is, shared with the screen so the crew lines up with it. */
export function lockerRoomLayout(width: number, stageHeight: number): LockerRoomLayout {
  const w = Math.max(320, width);
  const cw = Math.min(w, 520);
  const cx = w / 2;
  const floorY = stageHeight - 40;
  const benchWidth = 150;
  const benchX = Math.min(w - benchWidth / 2 - 6, cx + cw * 0.36);
  return {
    w,
    cx,
    floorY,
    lockerTop: 64,
    openX: cx - cw * 0.3,
    rookieX: cx + cw * 0.06,
    benchX,
    benchTop: floorY - 34,
    benchWidth,
  };
}

function ClosedLocker({ x, top, h }: { x: number; top: number; h: number }) {
  const bw = DOOR_W - 8;
  return (
    <G>
      <Rect x={x + 4} y={top} width={bw} height={h} rx={6} fill={LOCKER.side} />
      <Rect x={x + 4} y={top} width={bw - 6} height={h} rx={6} fill={LOCKER.face} />
      <Rect x={x + 7} y={top + 6} width={3} height={h - 12} rx={1.5} fill={HIGHLIGHT} />
      {/* number plate */}
      <Rect x={x + 4 + bw / 2 - 12} y={top + 7} width={22} height={9} rx={2.5} fill={palette.cream} />
      <Rect x={x + 4 + bw / 2 - 7} y={top + 10.5} width={12} height={2} rx={1} fill={palette.navySoft} opacity={0.6} />
      {/* vents */}
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={x + 18} y={top + 24 + i * 7} width={bw - 34} height={3.5} rx={1.75} fill={LOCKER.vent} />
      ))}
      {/* name tag slot with its red tab */}
      <Rect x={x + 16} y={top + h * 0.44} width={bw - 32} height={14} rx={3} fill={palette.cream} />
      <Rect x={x + 16} y={top + h * 0.44} width={5} height={14} rx={2} fill={palette.engineRed} />
      {/* handle + keyhole */}
      <Rect x={x + bw - 15} y={top + h * 0.5 - 8} width={6.5} height={19} rx={3.25} fill={palette.slateLight} />
      <Circle cx={x + bw - 11.8} cy={top + h * 0.5 + 18} r={2.2} fill={LOCKER.vent} />
      {[0, 1, 2].map((i) => (
        <Rect key={`b${i}`} x={x + 18} y={top + h - 40 + i * 7} width={bw - 34} height={3.5} rx={1.75} fill={LOCKER.vent} />
      ))}
    </G>
  );
}

function OpenLocker({ x, top, h, helmet, name }: { x: number; top: number; h: number; helmet: Avatar['helmet']; name: string }) {
  const bw = DOOR_W - 8;
  const cx = x + 4 + bw / 2;
  const tone = helmetTones[helmet] ?? helmetTones.red;
  const shelfY = top + 52;
  const hookY = top + 78;
  const floor = top + h;
  return (
    <G>
      {/* interior */}
      <Rect x={x + 4} y={top} width={bw} height={h} rx={6} fill={LOCKER.interior} />
      <Rect x={x + 4 + bw - 10} y={top} width={10} height={h} fill={SHADE} />
      {/* the name plate inside the top edge */}
      <Rect x={x + 10} y={top + 7} width={bw - 12} height={17} rx={3} fill={palette.cream} />
      <Rect x={x + 10} y={top + 7} width={5} height={17} rx={2} fill={palette.engineRed} />
      <SvgText x={x + 20} y={top + 19.5} fontFamily={fontFamily.bodyHeavy} fontSize={10.5} fill={palette.navy}>
        {name.toUpperCase()}
      </SvgText>
      {/* shelf */}
      <Rect x={x + 8} y={shelfY} width={bw - 8} height={5} rx={2} fill={palette.slateLight} />
      <Rect x={x + 8} y={shelfY + 5} width={bw - 8} height={4} fill={SHADE} />
      {/* helmet on the shelf */}
      <G>
        <Ellipse cx={cx} cy={shelfY} rx={19} ry={shadowRy(19)} fill={SHADOW_FILL} opacity={0.2} />
        <Path d={`M ${cx - 15} ${shelfY - 4} C ${cx - 15} ${shelfY - 24} ${cx - 8} ${shelfY - 30} ${cx} ${shelfY - 30} C ${cx + 8} ${shelfY - 30} ${cx + 15} ${shelfY - 24} ${cx + 15} ${shelfY - 4} Z`} fill={tone.base} />
        <Path d={`M ${cx} ${shelfY - 30} C ${cx + 8} ${shelfY - 30} ${cx + 15} ${shelfY - 24} ${cx + 15} ${shelfY - 4} L ${cx + 6} ${shelfY - 4} C ${cx + 6} ${shelfY - 22} ${cx + 4} ${shelfY - 27} ${cx} ${shelfY - 30} Z`} fill={SHADE} />
        <Path d={`M ${cx - 9} ${shelfY - 18} C ${cx - 7} ${shelfY - 24} ${cx - 4} ${shelfY - 27} ${cx} ${shelfY - 27.5}`} stroke={HIGHLIGHT} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d={`M ${cx} ${shelfY - 22} L ${cx + 5} ${shelfY - 20} v 5 c 0 3.5 -2.4 5 -5 6 c -2.6 -1 -5 -2.5 -5 -6 v -5 z`} fill={palette.safetyYellow} />
        <Ellipse cx={cx} cy={shelfY - 4} rx={20} ry={5} fill={tone.base} />
        <Ellipse cx={cx} cy={shelfY - 2.6} rx={20} ry={4} fill={tone.shade} />
      </G>
      {/* hook + jacket */}
      <Rect x={cx - 1.5} y={hookY - 6} width={3} height={6} fill={palette.slateLight} />
      <Circle cx={cx} cy={hookY} r={3.6} fill={palette.slateLight} />
      <Rect x={cx - 21} y={hookY + 4} width={42} height={78} rx={9} fill="#1D2650" transform="translate(1.5 2)" />
      <Rect x={cx - 21} y={hookY + 4} width={42} height={78} rx={9} fill="#26315F" />
      <Rect x={cx + 9} y={hookY + 4} width={12} height={78} rx={9} fill={SHADE} />
      <Path d={`M ${cx - 12} ${hookY + 4} L ${cx} ${hookY + 18} L ${cx + 12} ${hookY + 4} Z`} fill={palette.engineRed} />
      <Rect x={cx - 21} y={hookY + 30} width={42} height={6} fill={palette.safetyYellow} />
      <Rect x={cx - 21} y={hookY + 62} width={42} height={6} fill={palette.safetyYellow} />
      <Rect x={cx - 18} y={hookY + 10} width={3} height={60} rx={1.5} fill={HIGHLIGHT} />
      {/* boots on the locker floor */}
      <Path d={`M ${cx - 20} ${floor - 30} h 13 v 17 a 4 4 0 0 1 -4 4 h -14 a 4 4 0 0 1 -4 -4 v -2 c 0 -3.4 4 -4.4 6.5 -6 c 2.5 -1.6 2.5 -4 2.5 -9 z`} fill="#1A2246" />
      <Path d={`M ${cx + 20} ${floor - 30} h -13 v 17 a 4 4 0 0 0 4 4 h 14 a 4 4 0 0 0 4 -4 v -2 c 0 -3.4 -4 -4.4 -6.5 -6 c -2.5 -1.6 -2.5 -4 -2.5 -9 z`} fill="#1A2246" />
      <Rect x={cx - 21} y={floor - 33} width={15} height={6} rx={3} fill="#3A4670" />
      <Rect x={cx + 6} y={floor - 33} width={15} height={6} rx={3} fill="#3A4670" />
      <Ellipse cx={cx} cy={floor - 8} rx={24} ry={shadowRy(24)} fill={SHADOW_FILL} opacity={0.2} />
      {/* the door, swung open towards us on its left hinge */}
      <Path d={`M ${x + 4} ${top} L ${x + 4} ${top + h} L ${x - 30} ${top + h - 14} L ${x - 30} ${top + 14} Z`} fill={LOCKER.door} />
      <Path d={`M ${x + 4} ${top} L ${x + 4} ${top + h} L ${x - 4} ${top + h - 3} L ${x - 4} ${top + 3} Z`} fill={SHADE} />
      <Path d={`M ${x - 30} ${top + 14} L ${x - 30} ${top + h - 14}`} stroke={HIGHLIGHT} strokeWidth={3} strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <Path key={i} d={`M ${x - 24} ${top + 26 + i * 7} L ${x - 6} ${top + 21 + i * 7} L ${x - 6} ${top + 24.5 + i * 7} L ${x - 24} ${top + 29.5 + i * 7} Z`} fill={LOCKER.vent} />
      ))}
      <Circle cx={x - 13} cy={top + h * 0.5} r={3.2} fill={palette.slateLight} />
    </G>
  );
}

const Room = memo(function Room({ w, h, stageH, helmet, name }: { w: number; h: number; stageH: number; helmet: Avatar['helmet']; name: string }) {
  const L = lockerRoomLayout(w, stageH);
  const lockerH = L.floorY - L.lockerTop;
  const count = Math.ceil(w / DOOR_W) + 2;
  const x0 = L.cx - (count * DOOR_W) / 2;
  const openIndex = Math.round((L.openX - x0 - DOOR_W / 2) / DOOR_W);
  const lockers = Array.from({ length: count }, (_, i) => ({ i, x: x0 + i * DOOR_W }));
  const open = lockers[openIndex];
  const grout = Math.max(1, Math.floor(w / 72));
  const bx0 = L.benchX - L.benchWidth / 2;
  /** the wet-floor cone stands in front of the bench's far leg, clear of Rookie's boots */
  const cone = bx0 + L.benchWidth - 24;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} pointerEvents="none">
      {/* wall */}
      <Rect x={0} y={0} width={w} height={h} fill="#F4E1BF" />
      <Rect x={0} y={L.lockerTop - 18} width={w} height={9} fill={palette.engineRed} />
      <Rect x={0} y={L.lockerTop - 9} width={w} height={3} fill={palette.engineRedDark} />
      <Rect x={0} y={L.lockerTop - 6} width={w} height={L.floorY - L.lockerTop + 6} fill={palette.tanDark} opacity={0.35} />
      {/* the lockers throw a soft band of shadow on the floor line */}
      <Rect x={0} y={L.floorY - 8} width={w} height={12} fill={SHADOW_FILL} opacity={0.1} />
      {lockers.map((l) => (l.i === openIndex ? null : <ClosedLocker key={l.i} x={l.x} top={L.lockerTop} h={lockerH} />))}
      {/* floor: one plane with a lighter lip, grout lines as value not keylines */}
      <Rect x={0} y={L.floorY} width={w} height={h - L.floorY} fill={FLOOR.face} />
      <Rect x={0} y={L.floorY} width={w} height={6} fill={FLOOR.lip} />
      {Array.from({ length: grout }, (_, i) => (
        <Rect key={i} x={36 + i * 72} y={L.floorY + 8} width={2} height={h - L.floorY - 8} fill={SHADE} opacity={0.45} />
      ))}
      <Rect x={0} y={L.floorY + 46} width={w} height={2} fill={SHADE} opacity={0.4} />
      {open ? <OpenLocker x={open.x} top={L.lockerTop} h={lockerH} helmet={helmet} name={name} /> : null}
      {/* the bench */}
      <G>
        <Ellipse cx={bx0 + 18} cy={L.floorY + 12} rx={16} ry={shadowRy(16)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        <Ellipse cx={bx0 + L.benchWidth - 18} cy={L.floorY + 12} rx={16} ry={shadowRy(16)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        <Rect x={bx0 + 12} y={L.benchTop + 12} width={9} height={L.floorY + 8 - L.benchTop - 12} rx={3} fill={palette.woodDark} />
        <Rect x={bx0 + L.benchWidth - 21} y={L.benchTop + 12} width={9} height={L.floorY + 8 - L.benchTop - 12} rx={3} fill={palette.woodDark} />
        <Rect x={bx0} y={L.benchTop + 8} width={L.benchWidth} height={6} rx={3} fill={palette.woodDark} />
        <Rect x={bx0} y={L.benchTop} width={L.benchWidth} height={7} rx={3.5} fill={palette.wood} />
        <Rect x={bx0} y={L.benchTop + 8} width={L.benchWidth} height={5} rx={2.5} fill={palette.wood} />
        <Rect x={bx0 + 4} y={L.benchTop + 1} width={L.benchWidth - 8} height={2} rx={1} fill={HIGHLIGHT} />
      </G>
      {/* a cone parked by the bench */}
      <G>
        <Ellipse cx={cone} cy={L.floorY + 26} rx={13} ry={shadowRy(13)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        <Path d={`M ${cone} ${L.floorY - 6} C ${cone + 2} ${L.floorY - 6} ${cone + 3} ${L.floorY - 4} ${cone + 3.5} ${L.floorY - 2} L ${cone + 8} ${L.floorY + 23} L ${cone - 8} ${L.floorY + 23} L ${cone - 3.5} ${L.floorY - 2} C ${cone - 3} ${L.floorY - 4} ${cone - 2} ${L.floorY - 6} ${cone} ${L.floorY - 6} Z`} fill={palette.orange} />
        <Path d={`M ${cone - 3} ${L.floorY + 8} L ${cone + 3} ${L.floorY + 8} L ${cone + 4} ${L.floorY + 13} L ${cone - 4} ${L.floorY + 13} Z`} fill={palette.white} />
        <Rect x={cone - 12} y={L.floorY + 22} width={24} height={5} rx={2.5} fill={palette.orangeDark} />
      </G>
    </Svg>
  );
});

export interface LockerWallProps {
  top?: number;
  /** height of the room stage (the floor runs on 80 px below it, under the gear sheet) */
  height?: number;
  helmet?: Avatar['helmet'];
  name?: string;
}

/** The locker room, drawn to the current screen width. */
export const LockerWall = memo(function LockerWall({ top = 0, height = 380, helmet = 'red', name = 'Rookie' }: LockerWallProps) {
  const { width } = useWindowDimensions();
  const w = Math.max(320, width);
  const h = height + 80;
  return (
    <View style={[styles.wrap, { top, height: h }]} pointerEvents="none">
      <Room w={w} h={h} stageH={height} helmet={helmet} name={name} />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', overflow: 'hidden' },
});
