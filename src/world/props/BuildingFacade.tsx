import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { SceneId } from '@/learning/types';
import { palette } from '@/theme';
import { Text } from '@/ui';
import { sceneTheme, type SceneTheme } from './sceneTheme';
import type { FacadeLayout, WindowRect } from './facadeLayout';

/* ------------------------------------------------------------------ */
/* Sign glyphs — tiny stickers next to the shop name                    */
/* ------------------------------------------------------------------ */

function SignGlyph({ kind, size, color }: { kind: SceneTheme['signGlyph']; size: number; color: string }) {
  const s = size;
  switch (kind) {
    case 'bread':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Ellipse cx={20} cy={22} rx={16} ry={10} fill="#D9963F" />
          <Path d="M9 18c3-4 19-4 22 0" stroke="#B0742A" strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Path d="M13 24h14M15 28h10" stroke="#F0C078" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      );
    case 'pizza':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M20 5l14 26H6z" fill="#F6C453" />
          <Path d="M20 11l9 17H11z" fill="#E8523F" />
          <Circle cx={17} cy={24} r={2.6} fill="#FFF3D6" />
          <Circle cx={24} cy={22} r={2.2} fill="#FFF3D6" />
        </Svg>
      );
    case 'book':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M6 10h12c2 0 2 1 2 2v18c0-1 0-2-2-2H6z" fill={palette.white} />
          <Path d="M34 10H22c-2 0-2 1-2 2v18c0-1 0-2 2-2h12z" fill="#E7EFFF" />
          <Path d="M20 12v18" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M20 6c-6 0-9 5-9 11 0 6-2 9-2 9h22s-2-3-2-9c0-6-3-11-9-11z" fill={palette.safetyYellow} />
          <Circle cx={20} cy={31} r={3.4} fill={palette.gold} />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Circle cx={20} cy={20} r={15} fill={palette.white} stroke={color} strokeWidth={3} />
          <Path d="M20 11v9l6 4" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
        </Svg>
      );
    case 'paw':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Ellipse cx={20} cy={26} rx={9} ry={7.5} fill={color} />
          <Circle cx={11} cy={16} r={4} fill={color} />
          <Circle cx={18} cy={12} r={4} fill={color} />
          <Circle cx={26} cy={13} r={4} fill={color} />
          <Circle cx={31} cy={19} r={3.6} fill={color} />
        </Svg>
      );
    case 'basket':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M7 16h26l-3 17H10z" fill="#C58B4E" />
          <Path d="M13 16a7 7 0 0 1 14 0" stroke="#9E6A36" strokeWidth={3} fill="none" />
          <Path d="M12 22h16M14 27h12" stroke="#E0B07A" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      );
    case 'tree':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Circle cx={20} cy={16} r={11} fill="#4CAF50" />
          <Circle cx={13} cy={21} r={7.5} fill="#5DBB63" />
          <Circle cx={27} cy={21} r={7.5} fill="#3B8E3F" />
          <Rect x={17.5} y={24} width={5} height={11} rx={2.4} fill="#9E6A36" />
        </Svg>
      );
    case 'helmet':
    default:
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M6 28c0-10 6-16 14-16s14 6 14 16z" fill={palette.engineRed} />
          <Rect x={4} y={27} width={32} height={6} rx={3} fill={palette.engineRedDark} />
          <Path d="M20 15c2 3 1 5 0 7 3-1 5-3 4-7z" fill={palette.safetyYellow} />
        </Svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Window                                                              */
/* ------------------------------------------------------------------ */

export interface WindowArtProps {
  rect: WindowRect;
  theme: SceneTheme;
  /** a flame is burning behind this window → warm glow */
  lit?: boolean;
  u: number;
}

/** One window recess with its awning. Flames are layered on top by the game. */
export function WindowArt({ rect, theme, lit, u }: WindowArtProps) {
  const r = u * 0.55;
  const awH = rect.h * 0.3;
  const stripes = 5;
  const stripeW = rect.w / stripes;
  return (
    <G>
      {/* recess */}
      <Rect x={rect.x - u * 0.3} y={rect.y - u * 0.3} width={rect.w + u * 0.6} height={rect.h + u * 0.6} rx={r * 1.6} fill={theme.trim} />
      <Rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={r} fill={lit ? '#3A2B22' : theme.glass} />
      {lit ? (
        <Rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={r} fill={palette.flameOuter} opacity={0.26} />
      ) : (
        <Path
          d={`M${rect.x + rect.w * 0.12} ${rect.y + rect.h * 0.92} L${rect.x + rect.w * 0.62} ${rect.y + rect.h * 0.08} L${
            rect.x + rect.w * 0.86
          } ${rect.y + rect.h * 0.08} L${rect.x + rect.w * 0.36} ${rect.y + rect.h * 0.92} Z`}
          fill={palette.white}
          opacity={0.16}
        />
      )}
      {/* sill */}
      <Rect
        x={rect.x - u * 0.45}
        y={rect.y + rect.h + u * 0.2}
        width={rect.w + u * 0.9}
        height={u * 0.5}
        rx={u * 0.25}
        fill={theme.wallShade}
      />
      {/* awning */}
      {theme.awning !== 'none' ? (
        <G>
          <Path
            d={`M${rect.x - u * 0.55} ${rect.y - u * 0.1} h${rect.w + u * 1.1} a${u * 0.5} ${u * 0.5} 0 0 1 ${-u * 0.1} ${awH} h${
              -(rect.w + u * 0.9)
            } a${u * 0.5} ${u * 0.5} 0 0 1 ${-u * 0.1} ${-awH} z`}
            fill={theme.awningA}
          />
          {theme.awning === 'stripe'
            ? Array.from({ length: stripes }, (_, i) =>
                i % 2 === 1 ? (
                  <Rect
                    key={i}
                    x={rect.x - u * 0.5 + i * stripeW}
                    y={rect.y - u * 0.08}
                    width={stripeW}
                    height={awH * 0.96}
                    fill={theme.awningB}
                  />
                ) : null,
              )
            : null}
          <Rect x={rect.x - u * 0.6} y={rect.y - u * 0.25} width={rect.w + u * 1.2} height={u * 0.42} rx={u * 0.21} fill={theme.roofShade} />
        </G>
      ) : (
        /* rule #8 — a window is never a bare rectangle: no awning means a lintel */
        <G>
          <Rect x={rect.x - u * 0.55} y={rect.y - u * 0.75} width={rect.w + u * 1.1} height={u * 0.5} rx={u * 0.25} fill={theme.trim} />
          <Rect x={rect.x - u * 0.55} y={rect.y - u * 0.4} width={rect.w + u * 1.1} height={u * 0.2} rx={u * 0.1} fill="rgba(31,42,90,0.14)" />
        </G>
      )}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Facade                                                              */
/* ------------------------------------------------------------------ */

export interface BuildingFacadeProps {
  scene: SceneId;
  layout: FacadeLayout;
  width: number;
  height: number;
  /** window indices with a live flame (warm glow inside) */
  litSlots?: readonly number[];
  /** hide the shop sign (e.g. when the prompt already names the place) */
  hideSign?: boolean;
}

/**
 * The town building the child sprays: roof, sign, wall, awnings, windows,
 * door, pavement and a couple of planters. Pure art — flames, water and the
 * hose are layered on top by the mini-game.
 */
export function BuildingFacade({ scene, layout, width, height, litSlots, hideSign }: BuildingFacadeProps) {
  const t = sceneTheme(scene);
  const { box, roof, body, sign, door, windows, groundY, u } = layout;
  const lit = new Set(litSlots ?? []);
  const signFont = Math.max(13, Math.min(26, sign.h * 0.52));
  /** the A-frame chalkboard leans against the right-hand corner of the shop */
  const cb = { x: Math.min(box.x + box.w - u * 4.4, width - u * 4.8), w: u * 3.4, h: u * 5.2 };

  return (
    <View style={[styles.wrap, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="ss-wall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.wall} />
            <Stop offset="1" stopColor={t.wallShade} />
          </LinearGradient>
          <LinearGradient id="ss-ground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C9D2E4" />
            <Stop offset="1" stopColor="#AEB9D0" />
          </LinearGradient>
        </Defs>

        {/* pavement */}
        <Rect x={0} y={groundY} width={width} height={Math.max(0, height - groundY)} fill="url(#ss-ground)" />
        <Rect x={0} y={groundY} width={width} height={u * 0.35} fill="#E3E9F5" />

        {/* soft shadow under the building */}
        <Ellipse cx={box.x + box.w / 2} cy={groundY + u * 0.5} rx={box.w * 0.55} ry={u * 0.8} fill={palette.navy} opacity={0.12} />

        {/* body — 2.5D: a front plane plus a shaded return down the right side */}
        <Path
          d={`M${body.x + body.w - u * 1.6} ${body.y + u * 0.6} L${body.x + body.w + u * 1.1} ${body.y + u * 1.8} L${
            body.x + body.w + u * 1.1
          } ${groundY} L${body.x + body.w - u * 1.6} ${groundY} Z`}
          fill={t.wallShade}
        />
        <Path
          d={`M${body.x + body.w - u * 1.6} ${body.y + u * 0.6} L${body.x + body.w + u * 1.1} ${body.y + u * 1.8} L${
            body.x + body.w + u * 1.1
          } ${groundY} L${body.x + body.w - u * 1.6} ${groundY} Z`}
          fill="rgba(31,42,90,0.14)"
        />
        <Rect x={body.x} y={body.y} width={body.w} height={body.h} rx={u * 0.7} fill="url(#ss-wall)" />
        <Rect x={body.x} y={body.y} width={body.w * 0.16} height={body.h} fill={palette.white} opacity={0.14} />

        {/* roof */}
        <Path
          d={`M${box.x - u * 0.7} ${roof.y + roof.h} L${box.x + box.w / 2} ${roof.y - u * 0.1} L${box.x + box.w + u * 0.7} ${
            roof.y + roof.h
          } Z`}
          fill={t.roof}
        />
        <Path
          d={`M${box.x + box.w / 2} ${roof.y - u * 0.1} L${box.x + box.w + u * 0.7} ${roof.y + roof.h} L${box.x + box.w / 2} ${
            roof.y + roof.h
          } Z`}
          fill="rgba(31,42,90,0.14)"
        />
        {/* cornice + soffit shadow onto the wall */}
        <Rect x={box.x - u * 0.9} y={roof.y + roof.h - u * 0.5} width={box.w + u * 1.8} height={u * 0.9} rx={u * 0.45} fill={t.roofShade} />
        <Rect x={box.x - u * 1.15} y={roof.y + roof.h + u * 0.2} width={box.w + u * 2.3} height={u * 0.55} rx={u * 0.27} fill={t.trim} />
        <Rect x={body.x} y={roof.y + roof.h + u * 0.75} width={body.w} height={u * 0.5} fill="rgba(31,42,90,0.14)" />

        {/* windows */}
        {windows.map((w) => (
          <WindowArt key={w.index} rect={w} theme={t} lit={lit.has(w.index)} u={u} />
        ))}

        {/* door + entrance awning */}
        <Rect
          x={door.x - u * 0.9}
          y={door.y - u * 1.5}
          width={door.w + u * 1.8}
          height={u * 1.4}
          rx={u * 0.6}
          fill={t.awning === 'none' ? t.roofShade : t.awningA}
        />
        <Rect x={door.x} y={door.y} width={door.w} height={door.h} rx={u * 0.6} fill={t.door} />
        <Rect x={door.x + u * 0.4} y={door.y + u * 0.5} width={door.w / 2 - u * 0.7} height={door.h * 0.45} rx={u * 0.35} fill="#7FB6E8" />
        <Rect
          x={door.x + door.w / 2 + u * 0.3}
          y={door.y + u * 0.5}
          width={door.w / 2 - u * 0.7}
          height={door.h * 0.45}
          rx={u * 0.35}
          fill="#7FB6E8"
        />
        <Rect x={door.x + door.w / 2 - u * 0.55} y={door.y + door.h * 0.52} width={u * 0.3} height={u * 1.1} rx={u * 0.15} fill={palette.safetyYellow} />
        <Rect x={door.x + door.w / 2 + u * 0.25} y={door.y + door.h * 0.52} width={u * 0.3} height={u * 1.1} rx={u * 0.15} fill={palette.safetyYellow} />
        <Rect x={door.x} y={door.y + door.h - u * 0.35} width={door.w} height={u * 0.35} fill={t.doorShade} />

        {/* planters either side of the door */}
        {[door.x - u * 2.6, door.x + door.w + u * 0.8].map((px, i) => (
          <G key={i}>
            <Circle cx={px + u * 0.9} cy={door.y + door.h - u * 2.2} r={u * 1.25} fill="#5DBB63" />
            <Circle cx={px + u * 0.25} cy={door.y + door.h - u * 1.7} r={u * 0.85} fill="#4CAF50" />
            <Circle cx={px + u * 1.6} cy={door.y + door.h - u * 1.75} r={u * 0.8} fill="#3B8E3F" />
            <Path
              d={`M${px - u * 0.15} ${door.y + door.h - u * 1.4} h${u * 2.1} l${-u * 0.3} ${u * 1.4} h${-u * 1.5} z`}
              fill={palette.wood}
            />
          </G>
        ))}

        {/* A-frame chalkboard on the pavement, like the reference bakery */}
        <G>
          <Ellipse cx={cb.x + cb.w / 2} cy={groundY + u * 0.6} rx={u * 2.4} ry={u * 0.55} fill={palette.navy} opacity={0.12} />
          <Path
            d={`M${cb.x + cb.w * 0.86} ${groundY + u * 0.2} L${cb.x + cb.w * 0.6} ${groundY - cb.h * 0.86} L${cb.x + cb.w * 0.78} ${
              groundY - cb.h * 0.86
            } Z`}
            fill={t.doorShade}
          />
          <Rect x={cb.x} y={groundY - cb.h} width={cb.w} height={cb.h} rx={u * 0.5} fill={palette.woodDark} />
          <Rect x={cb.x + u * 0.35} y={groundY - cb.h + u * 0.35} width={cb.w - u * 0.7} height={cb.h - u * 0.8} rx={u * 0.35} fill="#2E3A46" />
          <Rect x={cb.x + u * 0.35} y={groundY - cb.h + u * 0.35} width={cb.w - u * 0.7} height={u * 1.1} rx={u * 0.35} fill="rgba(255,255,255,0.18)" />
          <Ellipse cx={cb.x + cb.w / 2} cy={groundY - cb.h * 0.46} rx={u * 0.95} ry={u * 0.55} fill="#E4B366" />
          <Path
            d={`M${cb.x + cb.w * 0.24} ${groundY - cb.h * 0.66} l ${u * 0.42} ${-u * 0.6}`}
            stroke={palette.white}
            strokeWidth={u * 0.16}
            strokeLinecap="round"
            opacity={0.7}
          />
          <Path
            d={`M${cb.x + cb.w * 0.76} ${groundY - cb.h * 0.66} l ${-u * 0.42} ${-u * 0.6}`}
            stroke={palette.white}
            strokeWidth={u * 0.16}
            strokeLinecap="round"
            opacity={0.7}
          />
        </G>

        {/* sign plate */}
        {!hideSign ? (
          <G>
            <Rect x={sign.x} y={sign.y} width={sign.w} height={sign.h} rx={sign.h * 0.42} fill={t.signPlate} />
            <Rect
              x={sign.x + u * 0.25}
              y={sign.y + u * 0.22}
              width={sign.w - u * 0.5}
              height={sign.h * 0.34}
              rx={sign.h * 0.17}
              fill={palette.white}
              opacity={0.55}
            />
          </G>
        ) : null}
      </Svg>

      {/* sign text — RN text so it uses the app type scale */}
      {!hideSign ? (
        <View
          style={[
            styles.sign,
            { left: sign.x, top: sign.y, width: sign.w, height: sign.h },
          ]}
        >
          <SignGlyph kind={t.signGlyph} size={sign.h * 0.62} color={t.signInk} />
          <Text
            variant="h3"
            color={t.signInk}
            numberOfLines={1}
            style={{ fontSize: signFont, lineHeight: signFont * 1.2, letterSpacing: 1.2 }}
          >
            {t.sign}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0 },
  sign: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
