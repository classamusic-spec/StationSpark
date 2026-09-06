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
import { Bell, ChimneySmoke, CatWindow, DoorLight, FACADE_VB, Flag, Neighbours, Pigeon, StationFacade, TownBackdrop, facadeLayout } from '@/world';
import { Rookie } from '@/characters/Rookie';
import { CaptainBea } from '@/characters/CaptainBea';
import { BottomBar, SparksCounter, RoomTile, useScaledLayout, type RoomId } from '@/screens/shared';
import { ShiftChip } from './ShiftChip';
import { GreetingBubble } from './GreetingBubble';

const ROOMS: { id: RoomId; label: string; href: string }[] = [
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

/**
 * Vertical space reserved below the station for the crew + CTA.
 *
 * The façade now carries its own apron (the slab the hydrant, hose, bollards
 * and cone stand on), so the crew stands *in front of* the building on the
 * grass rather than in a gap under it — which lets the whole station sit ~15 %
 * larger in frame and closes the empty sky at the top (critique #5).
 */
const CREW_ZONE = 84;
/** how far the apron runs on behind the crew and the CTA */
const APRON_OVERLAP = 8;

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
    // leave room under the façade for the crew and the Start Shift button
    const width = Math.max(220, Math.min(stage.w, (stage.h - CREW_ZONE) * ratio));
    return facadeLayout(width);
  }, [stage.h, stage.w]);

  const enterRoom = useCallback(
    (href: string) => {
      sfx.play('whoosh');
      zoom.value = withTiming(1, { duration: durations.base, easing: easings.out });
      if (pending.current) clearTimeout(pending.current);
      // routes owned by other screens land as they are built; cast keeps typed
      // routes happy while the app is still growing.
      pending.current = setTimeout(() => router.push(href as Href), 210);
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
    const base = station ? station.apronTop : 320;
    return {
      rookie: Math.max(96, Math.min(150, base * 0.37)),
      bea: Math.max(92, Math.min(146, base * 0.36)),
    };
  }, [station]);

  /**
   * Wide enough that the longest greeting never truncates (rule #10) but
   * narrow enough to stop short of Captain Bea, who stands on the right.
   */
  const bubbleW = Math.max(132, Math.min(152, stage.w * 0.42));

  /** the neighbouring block, sitting on the same ground line as the apron */
  const block = useMemo(() => {
    if (!station || stage.w < 40) return null;
    const width = stage.w * 1.62;
    return {
      width,
      left: (stage.w - width) / 2,
      bottom: CREW_ZONE - APRON_OVERLAP + (station.height - station.apronTop) - 10,
    };
  }, [stage.w, station]);

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
          <Logo size={Math.min(layout.s(152), 200)} />
        </Animated.View>

        <View style={styles.chipRow}>
          <ShiftChip label={summary.label} active={summary.active} />
          <SparksCounter />
        </View>

        <View style={styles.stage} onLayout={onStage}>
          {station ? (
            <>
              {/* the block behind the station: neighbour rooftops + a tree mass */}
              {block ? <Neighbours width={block.width} style={{ left: block.left, bottom: block.bottom }} /> : null}

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

              {/* crew — standing on the ground in front of the apron */}
              <View style={[styles.crewLeft, { bottom: 12 }]} pointerEvents="none">
                <Rookie size={crew.rookie} avatar={profile.avatar} pose="wave" emotion="happy" />
                {/* the greeting reads out of Rookie's shoulder, so it never
                    sits over the room tiles */}
                <View style={[styles.bubble, { left: crew.rookie * 0.38, bottom: crew.rookie * 0.66, width: bubbleW }]}>
                  <GreetingBubble lines={greetings} maxWidth={bubbleW} />
                </View>
              </View>
              <View style={[styles.crewRight, { bottom: 10 }]} pointerEvents="none">
                {/* Captain Bea waits by the apron for the shift to start */}
                <CaptainBea size={crew.bea} emotion="calm" pose="stand" bobPhase={0.45} />
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
  logo: { alignItems: 'center', marginTop: 6 },
  chipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, marginTop: spacing.xxs },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  stationWrap: { position: 'absolute', bottom: CREW_ZONE - APRON_OVERLAP, alignSelf: 'center' },
  abs: { position: 'absolute' },
  sign: { alignItems: 'center', justifyContent: 'center' },
  crewLeft: { position: 'absolute', left: -8, alignItems: 'flex-start' },
  bubble: { position: 'absolute' },
  crewRight: { position: 'absolute', right: -12, flexDirection: 'row', alignItems: 'flex-end', gap: 0 },
  beacon: { marginBottom: 74, marginRight: -16 },
  beaconGlow: { position: 'absolute', left: '5%', bottom: -10, alignItems: 'center' },
  ctaWrap: { position: 'absolute', bottom: -4, left: 0, right: 0, alignItems: 'center', paddingHorizontal: spacing.lg },
  cta: { minWidth: 220, maxWidth: 300, alignSelf: 'center' },
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
