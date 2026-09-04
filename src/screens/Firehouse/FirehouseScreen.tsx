import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { durations, easings, hit, palette, radii, shadows, spacing, timings } from '@/theme';
import { Button, ChevronRightIcon, GearIcon, Logo, RoundIconButton, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { useShiftSummary } from '@/state/selectors';
import { useShift } from '@/hooks/useShift';
import { Bell, ChimneySmoke, CatWindow, DoorLight, FACADE_VB, Flag, Pigeon, StationFacade, TownBackdrop, facadeLayout } from '@/world';
import { Rookie } from '@/characters/Rookie';
import { Beacon } from '@/characters/Beacon';
import { Pepper } from '@/characters/Pepper';
import { BottomBar, SparksCounter, RoomTile, useScaledLayout, type RoomId } from '@/screens/shared';
import { ShiftChip } from './ShiftChip';
import { GreetingBubble } from './GreetingBubble';

const ROOMS: { id: RoomId; label: string; href: Href }[] = [
  { id: 'dispatch', label: 'Dispatch', href: '/dispatch' },
  { id: 'map', label: 'Map', href: '/map' },
  { id: 'training', label: 'Training', href: '/training' },
  { id: 'kitchen', label: 'Kitchen', href: '/kitchen' },
  { id: 'garage', label: 'Garage', href: '/garage' },
  { id: 'badges', label: 'Badges', href: '/badges' },
];

/** Spoken once per app open, not once per mount. */
let greetedThisSession = false;

function GrownUpsPill({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="For Grown-Ups"
      onPress={() => {
        sfx.play('tap-soft');
        haptics.tap();
        onPress();
      }}
      style={[styles.grownUps, shadows.soft]}
      hitSlop={8}
    >
      <View style={styles.avatarDot}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={8.4} r={4} fill={palette.white} />
          <Path d="M4.6 20c0-4 3.3-6.6 7.4-6.6s7.4 2.6 7.4 6.6z" fill={palette.white} />
        </Svg>
      </View>
      <Text variant="tiny" color={palette.navy} style={styles.grownUpsText}>
        {'For\nGrown-Ups'}
      </Text>
    </Pressable>
  );
}

export function FirehouseScreen() {
  const router = useRouter();
  const layout = useScaledLayout();
  const profile = useGame((s) => s.profile);
  const unlocked = useGame((s) => s.station.unlocked);
  const shiftActive = useGame((s) => s.shift.active);
  const summary = useShiftSummary();
  const shift = useShift();

  const [stage, setStage] = useState({ w: 0, h: 0 });
  const zoom = useSharedValue(0);
  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const evening = useMemo(() => {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  }, []);

  const greetings = useMemo(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const name = profile.name?.trim() || 'Rookie';
    return [`${part}, ${name}!`, '¡Hola! ¿Listos para ayudar?', 'The crew is ready when you are!'];
  }, [profile.name]);

  useEffect(() => {
    if (greetedThisSession) return;
    greetedThisSession = true;
    const line = greetings[0];
    if (line) speech.say(line, { speaker: 'bea' });
  }, [greetings]);

  // reset the zoom-into-room transition whenever we come back home
  useFocusEffect(
    useCallback(() => {
      zoom.value = withTiming(0, timings.fast);
      return () => {
        if (pending.current) clearTimeout(pending.current);
      };
    }, [zoom]),
  );

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  const onStage = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage((prev) => (Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1 ? prev : { w: width, h: height }));
  }, []);

  const station = useMemo(() => {
    if (stage.w < 40 || stage.h < 40) return null;
    const ratio = FACADE_VB.w / FACADE_VB.h;
    const width = Math.max(220, Math.min(stage.w, (stage.h - 52) * ratio));
    return facadeLayout(width);
  }, [stage.h, stage.w]);

  const enterRoom = useCallback(
    (href: Href) => {
      sfx.play('whoosh');
      zoom.value = withTiming(1, { duration: durations.base, easing: easings.out });
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(() => router.push(href), 210);
    },
    [router, zoom],
  );

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + zoom.value * 0.06 }],
    opacity: 1 - zoom.value * 0.4,
  }));

  const startShift = useCallback(() => {
    if (!shiftActive) {
      try {
        shift.startShift({ size: 3, target: 3 });
      } catch {
        /* the dispatch board falls back on its own */
      }
      sfx.play('bell');
      haptics.celebrate();
    }
    router.push('/dispatch');
  }, [router, shift, shiftActive]);

  const crew = useMemo(() => {
    const base = station?.height ?? 320;
    return {
      rookie: Math.max(112, Math.min(200, base * 0.42)),
      beacon: Math.max(78, Math.min(140, base * 0.3)),
      pepper: Math.max(66, Math.min(118, base * 0.25)),
    };
  }, [station?.height]);

  return (
    <ScreenFrame
      mood={evening ? 'evening' : 'day'}
      safeBottom={false}
      backdrop={<TownBackdrop mood={evening ? 'evening' : 'day'} hills={240} cloudCount={4} />}
      chrome={
        <TopBar
          back={false}
          left={
            <RoundIconButton accessibilityLabel="Settings" onPress={() => router.push({ pathname: '/grownups', params: { section: 'settings' } })}>
              <GearIcon />
            </RoundIconButton>
          }
          right={<GrownUpsPill onPress={() => router.push('/grownups')} />}
        />
      }
    >
      <View style={[styles.body, { maxWidth: layout.contentWidth }]}>
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.logo}>
          <Logo size={Math.min(layout.s(212), 260)} />
        </Animated.View>

        <View style={styles.chipRow}>
          <ShiftChip label={summary.label} active={summary.active} />
          <SparksCounter />
        </View>

        <View style={styles.stage} onLayout={onStage}>
          {station ? (
            <>
              <Animated.View style={[styles.stationWrap, { width: station.width, height: station.height }, zoomStyle]}>
                <StationFacade width={station.width} unlocked={unlocked} />

                {/* living details, anchored to the façade */}
                <View style={[styles.abs, { left: station.bell.x, top: station.bell.y }]} pointerEvents="none">
                  <Bell size={station.bell.size} brass={unlocked.includes('bell-brass')} />
                </View>
                <View style={[styles.abs, { left: station.flag.x, top: station.flag.y }]} pointerEvents="none">
                  <Flag width={station.flag.width} poleHeight={station.flag.poleHeight} gold={unlocked.includes('flag-gold')} />
                </View>
                <View style={[styles.abs, { left: station.chimney.x, top: station.chimney.y }]} pointerEvents="none">
                  <ChimneySmoke size={station.chimney.size} />
                </View>
                <View style={[styles.abs, { left: station.catWindow.x, top: station.catWindow.y }]} pointerEvents="none">
                  <CatWindow size={station.catWindow.size} />
                </View>
                {station.pigeons.map((p, i) => (
                  <View key={i} style={[styles.abs, { left: p.x, top: p.y }]} pointerEvents="none">
                    <Pigeon size={p.size} delay={i * 700} />
                  </View>
                ))}
                {station.doorLights.map((d, i) => (
                  <View key={i} style={[styles.abs, { left: d.x, top: d.y }]} pointerEvents="none">
                    <DoorLight w={d.w} h={d.h} phase={i * 0.5} />
                  </View>
                ))}

                {/* the six rooms */}
                {ROOMS.map((room, i) => {
                  const r = station.tiles[i];
                  if (!r) return null;
                  return (
                    <View key={room.id} style={[styles.abs, { left: r.x, top: r.y }]}>
                      <RoomTile room={room.id} label={room.label} index={i} width={r.w} height={r.h} onPress={() => enterRoom(room.href)} />
                    </View>
                  );
                })}

                {/* station sign */}
                <View style={[styles.abs, styles.sign, { left: station.sign.x, top: station.sign.y, width: station.sign.w, height: station.sign.h }]} pointerEvents="none">
                  <Text variant="h3" color={palette.navy} center numberOfLines={1} style={{ fontSize: Math.max(13, station.sign.h * 0.46) }}>
                    STATION SPARK
                  </Text>
                </View>
              </Animated.View>

              {/* crew */}
              <View style={[styles.crewLeft, { bottom: 18 }]} pointerEvents="none">
                <GreetingBubble lines={greetings} maxWidth={Math.min(210, stage.w * 0.56)} />
                <Rookie size={crew.rookie} avatar={profile.avatar} pose="wave" emotion="happy" />
              </View>
              <View style={[styles.crewRight, { bottom: 14 }]} pointerEvents="none">
                <Beacon size={crew.beacon} emotion="happy" style={styles.beacon} />
                <Pepper size={crew.pepper} emotion="happy" wag />
              </View>

              {/* the big call to action */}
              <View style={styles.ctaWrap}>
                <Button
                  label={shiftActive ? 'Continue Shift' : 'Start Shift'}
                  size="xl"
                  tone="red"
                  onPress={startShift}
                  iconRight={<ChevronRightIcon size={28} />}
                  style={[styles.cta, shadows.glowGold]}
                  accessibilityLabel={shiftActive ? 'Continue your shift' : 'Start your shift'}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>

      <BottomBar />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: spacing.sm },
  logo: { alignItems: 'center', marginTop: 44 },
  chipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, marginTop: spacing.xs },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing.xs },
  stationWrap: { position: 'absolute', bottom: 34, alignSelf: 'center' },
  abs: { position: 'absolute' },
  sign: { alignItems: 'center', justifyContent: 'center' },
  crewLeft: { position: 'absolute', left: -8, alignItems: 'flex-start', gap: 2 },
  crewRight: { position: 'absolute', right: -6, flexDirection: 'row', alignItems: 'flex-end', gap: 0 },
  beacon: { marginBottom: 10, marginRight: -8 },
  ctaWrap: { position: 'absolute', bottom: -6, left: 0, right: 0, alignItems: 'center', paddingHorizontal: spacing.lg },
  cta: { minWidth: 240, maxWidth: 420, alignSelf: 'stretch' },
  grownUps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingLeft: 6,
    paddingRight: 14,
    minHeight: hit.min,
  },
  avatarDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  grownUpsText: { lineHeight: 15 },
});
