/**
 * STATION STAGE — the welcome scene at the top of onboarding.
 *
 * Bunting swaying across the sky, the STATION SPARK board hanging from it,
 * and the crew standing on the station apron in front of the treeline:
 * Captain Bea and Beacon first, then the child's own Rookie (updating live as
 * they pick their look, with a sparkle on every change), then Beacon with
 * the one safety message. One ground plane; nobody floats.
 */
import React, { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { usePulse } from '@/hooks';
import type { Avatar } from '@/state/store';
import { SparkleBurst, Text } from '@/ui';
import { Beacon } from '@/characters/Beacon';
import { CaptainBea } from '@/characters/CaptainBea';
import { Pepper } from '@/characters/Pepper';
import { Rookie } from '@/characters/Rookie';
import { SignBoard } from '@/screens/Locker/parts/SignBoard';
import { HIGHLIGHT, SHADE, SHADOW_FILL } from '@/world/tone';

const FLAG_COLORS = [palette.engineRed, palette.safetyYellow, palette.waterCyan, palette.leafGreen, palette.pink] as const;
const APRON = 44;
const PERSON = 120 / 165;
const BEACON = 110 / 150;
const PEPPER = 132 / 126;

/** A string of pennants across the top of the stage — drawn once, swayed as a whole. */
const BuntingArt = memo(function BuntingArt({ w }: { w: number }) {
  const sag = 26;
  const y = (t: number) => 8 + 4 * sag * t * (1 - t);
  const n = Math.max(6, Math.round(w / 48));
  const flags: React.ReactElement[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = (i + 0.5) / n;
    const x = t * w;
    const top = y(t);
    const c = FLAG_COLORS[i % FLAG_COLORS.length] ?? palette.engineRed;
    flags.push(
      <React.Fragment key={i}>
        <Path d={`M ${x - 13} ${top} L ${x + 13} ${top} L ${x} ${top + 24} Z`} fill={c} />
        <Path d={`M ${x} ${top} L ${x + 13} ${top} L ${x} ${top + 24} Z`} fill={SHADE} />
        <Path d={`M ${x - 10} ${top + 2} L ${x - 4} ${top + 2} L ${x - 2} ${top + 10} Z`} fill={HIGHLIGHT} />
      </React.Fragment>,
    );
  }
  return (
    <Svg width={w} height={60} viewBox={`0 0 ${w} 60`} pointerEvents="none">
      <Path d={`M 0 8 Q ${w / 2} ${8 + 2 * sag} ${w} 8`} stroke={palette.woodDark} strokeWidth={2.6} fill="none" />
      {flags}
    </Svg>
  );
});

function Bunting({ w }: { w: number }) {
  const sway = usePulse(3400, 0.5);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -30 }, { rotate: `${(sway.value - 0.5) * 1.6}deg` }, { translateY: 30 }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.bunting, style]}>
      <BuntingArt w={w} />
    </Animated.View>
  );
}

/** The station apron the crew stands on: a slab with a lighter lip, seated on the hill. */
const Apron = memo(function Apron({ w }: { w: number }) {
  return (
    <Svg width={w} height={APRON} viewBox={`0 0 ${w} ${APRON}`} pointerEvents="none">
      <Rect x={0} y={0} width={w} height={APRON} fill="#C4CCDE" />
      <Rect x={0} y={0} width={w} height={6} fill="#DDE3F0" />
      <Rect x={0} y={APRON - 8} width={w} height={8} fill={SHADOW_FILL} opacity={0.14} />
      <Path d={`M ${w * 0.08} ${APRON * 0.55} H ${w * 0.92}`} stroke={palette.white} strokeWidth={3} strokeLinecap="round" strokeDasharray="22 16" opacity={0.5} />
    </Svg>
  );
});

export interface StationStageProps {
  /** stage height in px (the apron is the bottom 44 of it) */
  height: number;
  step: number;
  avatar: Avatar;
  /** bump to fire a sparkle over Rookie */
  sparkle: number;
}

export function StationStage({ height, step, avatar, sparkle }: StationStageProps) {
  const { width } = useWindowDimensions();
  const w = Math.max(320, width);
  const cw = Math.min(w, 520);
  const cx = w / 2;
  const room = height - APRON - 78; // headroom under the sign
  const big = Math.round(Math.max(150, Math.min(300, room)));
  const feet = APRON - 12;

  const crew = useMemo(() => {
    const bea = big;
    const beacon = Math.round(big * 0.58);
    const rookie = big;
    const pepper = Math.round(big * 0.4);
    return { bea, beacon, rookie, pepper };
  }, [big]);

  return (
    <View style={[styles.stage, { height }]} pointerEvents="none">
      <Bunting w={w} />
      <View style={styles.sign}>
        <SignBoard hang>
          <Text variant="h3">STATION SPARK</Text>
        </SignBoard>
      </View>

      <View style={styles.apron}>
        <Apron w={w} />
      </View>

      {step === 0 ? (
        <Animated.View key="s0" entering={FadeIn.duration(260)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
          <View style={[styles.actor, { left: cx - cw * 0.12 - (crew.bea * PERSON) / 2, bottom: feet }]}>
            <CaptainBea size={crew.bea} emotion="happy" pose="wave" />
          </View>
          <View style={[styles.actor, { left: cx + cw * 0.26 - (crew.beacon * BEACON) / 2, bottom: feet + crew.bea * 0.16 }]}>
            <Beacon size={crew.beacon} emotion="excited" bobPhase={1.2} />
          </View>
        </Animated.View>
      ) : null}

      {step === 1 ? (
        <Animated.View key="s1" entering={FadeIn.duration(260)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
          <View style={[styles.actor, { left: cx - cw * 0.3 - (crew.bea * 0.8 * PERSON) / 2, bottom: feet + 4 }]}>
            <CaptainBea size={Math.round(crew.bea * 0.8)} emotion="proud" pose="stand" bobPhase={1.6} />
          </View>
          <View style={[styles.actor, { left: cx + cw * 0.02 - (crew.rookie * PERSON) / 2, bottom: feet }]}>
            <Rookie size={crew.rookie} avatar={avatar} pose="wave" emotion="excited" />
            <View pointerEvents="none" style={styles.sparkle}>
              <SparkleBurst play={sparkle} radius={Math.round(crew.rookie * 0.36)} count={10} />
            </View>
          </View>
          <View style={[styles.actor, { left: cx + cw * 0.3 - (crew.pepper * PEPPER) / 2, bottom: feet }]}>
            <Pepper size={crew.pepper} emotion="happy" wag bobPhase={2.1} />
          </View>
        </Animated.View>
      ) : null}

      {step >= 2 ? (
        <Animated.View key="s2" entering={FadeIn.duration(260)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
          <View style={[styles.actor, { left: cx - cw * 0.24 - (crew.beacon * 1.15 * BEACON) / 2, bottom: feet + crew.bea * 0.14 }]}>
            <Beacon size={Math.round(crew.beacon * 1.15)} emotion="calm" bobPhase={0.4} />
          </View>
          <View style={[styles.actor, { left: cx + cw * 0.14 - (crew.bea * PERSON) / 2, bottom: feet }]}>
            <CaptainBea size={crew.bea} emotion="calm" pose="point" bobPhase={0.9} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignSelf: 'stretch', overflow: 'visible' },
  bunting: { position: 'absolute', left: 0, right: 0, top: 0, height: 60 },
  sign: { position: 'absolute', left: 0, right: 0, top: 26, alignItems: 'center' },
  apron: { position: 'absolute', left: 0, right: 0, bottom: 0, height: APRON },
  actor: { position: 'absolute' },
  sparkle: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
