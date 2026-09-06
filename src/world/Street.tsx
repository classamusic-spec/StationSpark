/**
 * STREET — the road the firehouse stands on.
 *
 * The apron used to stop dead on grass, so the station read as a sticker on a
 * lawn. A building needs somewhere to *go*: this is the near plane of the
 * world, drawn edge to edge so it crosses the whole frame.
 *
 * Far → near it is: footpath (paving joints, a lighter lip) → kerb (a top face
 * and a shaded riser) → asphalt (a value step darker than everything above it,
 * so the composition lands on a dark ground). The station's driveway crosses
 * the footpath on a dropped kerb — the `crossing` prop — which is what makes
 * the ramp read as leading somewhere.
 *
 * It is the darkest band on the screen on purpose: the one red CTA sits on it,
 * and nothing else competes.
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { HIGHLIGHT, SHADE, SHADE_DEEP } from './tone';

export interface StreetTone {
  paveTop: string;
  paveBottom: string;
  paveJoint: string;
  kerbTop: string;
  kerbFace: string;
  asphaltTop: string;
  asphaltBottom: string;
  ramp: string;
  rampLit: string;
  line: string;
  lineOpacity: number;
}

const TONES: Record<'day' | 'evening', StreetTone> = {
  day: {
    paveTop: '#D9DFEE',
    paveBottom: '#C7CEE2',
    paveJoint: '#B6BFD6',
    kerbTop: '#E6EAF5',
    kerbFace: '#A2ABC5',
    asphaltTop: '#79819F',
    asphaltBottom: '#5F6784',
    ramp: '#BFC6DA',
    rampLit: '#E2E6F1',
    line: palette.safetyYellow,
    lineOpacity: 0.9,
  },
  evening: {
    paveTop: '#C3C9DE',
    paveBottom: '#B0B8D0',
    paveJoint: '#9CA5C0',
    kerbTop: '#D2D7E8',
    kerbFace: '#848DA9',
    asphaltTop: '#565D7A',
    asphaltBottom: '#434962',
    ramp: '#9BA3BC',
    rampLit: '#BEC5D8',
    line: palette.gold,
    lineOpacity: 0.75,
  },
};

export interface StreetProps {
  /** full band width — this piece is always drawn edge to edge */
  width: number;
  /** the footpath band above the kerb */
  pave?: number;
  /** the asphalt band below the kerb */
  road: number;
  /**
   * Where the station's apron drops off the kerb, in px from the left of the
   * band. Omit and the street runs unbroken.
   */
  crossing?: { x: number; width: number } | null;
  mood?: 'day' | 'evening';
}

/** the kerb's own thickness: a top face and the riser under it */
const KERB_TOP = 5;
const KERB_FACE = 5;

/**
 * The street. Static art — memoized, because it sits under drifting clouds, a
 * breathing CTA glow and two idling characters.
 */
export const Street = memo(function Street({ width, pave = 26, road, crossing = null, mood = 'day' }: StreetProps) {
  const t = TONES[mood];
  const w = Math.max(1, Math.round(width));
  const h = pave + road;
  /** y of the top of the asphalt */
  const kerbY = pave;
  /** the lane markings sit high, so the CTA below them has clean ground */
  const laneY = kerbY + Math.min(18, road * 0.1);
  const laneH = Math.max(5, Math.round(road * 0.032));
  const dash = Math.max(26, w * 0.075);
  const gap = dash * 0.78;
  const lanes = Math.ceil(w / (dash + gap)) + 1;

  /** the dropped kerb: the apron's ramp fanning out onto the road */
  const ramp = crossing
    ? {
        x: crossing.x,
        w: crossing.width,
        h: Math.min(road * 0.2, 34),
        flare: Math.min(16, crossing.width * 0.045),
        /** how far the kerb takes to fall away either side of the crossing */
        taper: Math.min(20, crossing.width * 0.06),
      }
    : null;
  const kerbH = KERB_TOP + KERB_FACE;
  /** the lip the kerb keeps even where it is dropped */
  const drop = 2.6;

  return (
    <View style={[styles.wrap, { width: w, height: h }]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} pointerEvents="none">
        <Defs>
          <LinearGradient id="stPave" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.paveTop} />
            <Stop offset="1" stopColor={t.paveBottom} />
          </LinearGradient>
          <LinearGradient id="stRoad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.asphaltTop} />
            <Stop offset="1" stopColor={t.asphaltBottom} />
          </LinearGradient>
          <LinearGradient id="stKerbAO" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1F2A5A" stopOpacity={0.24} />
            <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="stRampFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.ramp} stopOpacity={0.62} />
            <Stop offset="1" stopColor={t.ramp} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* ── footpath ─────────────────────────────────────────────── */}
        <Rect x={0} y={0} width={w} height={pave} fill="url(#stPave)" />
        {/* paving joints — texture without pattern noise */}
        {Array.from({ length: Math.ceil(w / 84) + 1 }, (_, i) => (
          <Rect key={`j${i}`} x={Math.round(i * 84 + 18)} y={1} width={2} height={pave - 3} rx={1} fill={t.paveJoint} opacity={0.85} />
        ))}

        {/* ── asphalt ──────────────────────────────────────────────── */}
        <Rect x={0} y={kerbY} width={w} height={road} fill="url(#stRoad)" />
        {/* the kerb's own occlusion, so the footpath sits *above* the road */}
        <Rect x={0} y={kerbY} width={w} height={Math.min(18, road * 0.12)} fill="url(#stKerbAO)" />

        {/* ── the crossover, before the kerb so the lip lands on top ── */}
        {ramp ? (
          <G>
            <Path
              d={`M ${ramp.x} ${kerbY - drop}
                  L ${ramp.x + ramp.w} ${kerbY - drop}
                  L ${ramp.x + ramp.w + ramp.flare} ${kerbY + ramp.h}
                  L ${ramp.x - ramp.flare} ${kerbY + ramp.h} Z`}
              fill="url(#stRampFade)"
            />
            {/* the two inner tyre tracks, carrying on out of the bays */}
            {[0.308, 0.692].map((f) => (
              <Path
                key={f}
                d={`M ${ramp.x + ramp.w * f} ${kerbY - drop}
                    Q ${ramp.x + ramp.w * (f + (f < 0.5 ? -0.02 : 0.02))} ${kerbY + ramp.h * 0.4}
                      ${ramp.x + ramp.w * (f + (f < 0.5 ? -0.05 : 0.05))} ${kerbY + ramp.h * 0.8}`}
                stroke={SHADE}
                strokeWidth={Math.max(4, ramp.w * 0.016)}
                strokeLinecap="round"
                fill="none"
                opacity={0.4}
              />
            ))}
          </G>
        ) : null}

        {/*
          ── kerb ──────────────────────────────────────────────────
          A kerb that simply ran straight across would leave the apron sitting
          on a wall. Where the driveway crosses, it *drops*: full height on
          both runs, a short taper at each end, and a bare lip in between —
          which is the one drawn detail that says an engine can get out.
        */}
        {ramp ? (
          <G>
            {([
              [0, ramp.x - ramp.taper, 1],
              [ramp.x + ramp.w + ramp.taper, w, -1],
            ] as const).map(([x0, x1, dir]) => (
              <G key={x0}>
                <Rect x={x0} y={kerbY - kerbH} width={Math.max(0, x1 - x0)} height={KERB_TOP} fill={t.kerbTop} />
                <Rect x={x0} y={kerbY - KERB_FACE} width={Math.max(0, x1 - x0)} height={KERB_FACE} fill={t.kerbFace} />
                <Rect x={x0} y={kerbY - kerbH - 1.4} width={Math.max(0, x1 - x0)} height={1.4} fill={SHADE} />
                {/* the run falling away into the crossover */}
                <Path
                  d={
                    dir > 0
                      ? `M ${x1} ${kerbY - kerbH} L ${x1 + ramp.taper} ${kerbY - drop} L ${x1 + ramp.taper} ${kerbY} L ${x1} ${kerbY} Z`
                      : `M ${x0} ${kerbY - kerbH} L ${x0 - ramp.taper} ${kerbY - drop} L ${x0 - ramp.taper} ${kerbY} L ${x0} ${kerbY} Z`
                  }
                  fill={t.kerbFace}
                />
                <Path
                  d={
                    dir > 0
                      ? `M ${x1} ${kerbY - kerbH} L ${x1 + ramp.taper} ${kerbY - drop} L ${x1 + ramp.taper} ${kerbY - drop + 1.6} L ${x1} ${kerbY - kerbH + KERB_TOP} Z`
                      : `M ${x0} ${kerbY - kerbH} L ${x0 - ramp.taper} ${kerbY - drop} L ${x0 - ramp.taper} ${kerbY - drop + 1.6} L ${x0} ${kerbY - kerbH + KERB_TOP} Z`
                  }
                  fill={t.kerbTop}
                />
              </G>
            ))}
            {/* the dropped lip the wheels ride over */}
            <Rect x={ramp.x} y={kerbY - drop} width={ramp.w} height={drop} fill={t.rampLit} />
          </G>
        ) : (
          <G>
            <Rect x={0} y={kerbY - kerbH} width={w} height={KERB_TOP} fill={t.kerbTop} />
            <Rect x={0} y={kerbY - KERB_FACE} width={w} height={KERB_FACE} fill={t.kerbFace} />
            <Rect x={0} y={kerbY - kerbH - 1.4} width={w} height={1.4} fill={SHADE} />
          </G>
        )}

        {/* ── lane markings, kept clear of the CTA below them ──────── */}
        <G opacity={t.lineOpacity}>
          {Array.from({ length: lanes }, (_, i) => (
            <Rect key={`d${i}`} x={i * (dash + gap) - dash * 0.4} y={laneY} width={dash} height={laneH} rx={laneH / 2} fill={t.line} />
          ))}
        </G>

        {/* ── two pieces of street furniture, and no more ──────────── */}
        {/* the gully at the kerb */}
        <G>
          <Rect x={w * 0.06} y={kerbY + 4} width={32} height={12} rx={5.5} fill={SHADE_DEEP} />
          <Rect x={w * 0.06 + 2} y={kerbY + 5.6} width={28} height={8.4} rx={3.6} fill={t.kerbFace} />
          {[0, 1].map((i) => (
            <Rect key={i} x={w * 0.06 + 4.5} y={kerbY + 7.6 + i * 3.2} width={23} height={1.7} rx={0.85} fill={SHADE_DEEP} />
          ))}
        </G>
        {/* an inspection cover out on the asphalt */}
        <G opacity={0.5}>
          <Rect x={w * 0.86} y={kerbY + road * 0.66} width={40} height={14} rx={7} fill={SHADE} />
          <Rect x={w * 0.86 + 2} y={kerbY + road * 0.66 + 1.8} width={36} height={9.5} rx={4.8} fill={HIGHLIGHT} opacity={0.5} />
        </G>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, bottom: 0 },
});
