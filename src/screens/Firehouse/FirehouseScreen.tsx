import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { durations, easings, hit, palette, radii, roles, spacing, timings } from '@/theme';
import { Button, ChevronRightIcon, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { useShiftSummary } from '@/state/selectors';
import { useShift } from '@/hooks/useShift';
import { Bell, ChimneySmoke, CatWindow, DoorLight, FACADE_VB, Flag, Neighbours, Pigeon, StationFacade, TownBackdrop, facadeLayout } from '@/world';
import { Rookie } from '@/characters/Rookie';
import { CaptainBea } from '@/characters/CaptainBea';
import { SparksCounter, RoomTile, useScaledLayout, type RoomId } from '@/screens/shared';
import { ShiftChip } from './ShiftChip';
import { GreetingBubble } from './GreetingBubble';

/**
 * THE STATION IS THE MENU.
 *
 * Six doors, one on each panel of the wall, in two readable rows:
 *
 *   row 1 — places you go to help and practise:  Map · Training · Kitchen
 *   row 2 — the things that are yours:           Garage · Locker · Badges
 *
 * Dispatch is deliberately *not* a tile. Dispatch is what "Start Shift" does,
 * and two doors into the same room is exactly what made this screen hard to
 * read. For the same reason the settings cog and the "For Grown-Ups" pill are
 * now one door, and Badges is named "Badges" wherever it appears.
 */
const ROOMS: { id: RoomId; label: string; href: string }[] = [
  { id: 'map', label: 'Map', href: '/map' },
  { id: 'training', label: 'Training', href: '/training' },
  { id: 'kitchen', label: 'Kitchen', href: '/kitchen' },
  { id: 'garage', label: 'Garage', href: '/garage' },
  { id: 'locker', label: 'Locker', href: '/locker' },
  { id: 'badges', label: 'Badges', href: '/badges' },
];

/** Spoken once per app open, not once per mount. */
let greetedThisSession = false;

/**
 * The one adult door on the home screen. It used to be two — a cog and a pill,
 * both landing on the same gated screen. The gate itself is untouched.
 */
function GrownUpsDoor({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="For Grown-Ups: settings, progress and safety"
      onPress={() => {
        sfx.play('tap-soft');
        haptics.tap();
        onPress();
      }}
      style={[styles.grownUps, roles.lift.surface]}
      hitSlop={8}
    >
      <View style={styles.avatarDot}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={8.4} r={4} fill={palette.white} />
          <Path d="M4.6 20c0-4 3.3-6.6 7.4-6.6s7.4 2.6 7.4 6.6z" fill={palette.white} />
        </Svg>
      </View>
      <Text variant="tiny" color={roles.ink.primary} numberOfLines={1}>
        Grown-Ups
      </Text>
    </Pressable>
  );
}

/**
 * Vertical space reserved below the station for the crew.
 *
 * The façade carries its own apron (the slab the hydrant, hose, bollards and
 * cone stand on), so the crew stands *in front of* the building on the grass
 * rather than in a gap under it.
 */
const CREW_ZONE = 84;
/** how far the apron runs on behind the crew */
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
    // leave room under the façade for the crew; the CTA now has its own band
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
   * The crew stands on the apron, above the button rather than behind it: at
   * ground level the "Start Shift" pill cut both characters off at the knee.
   */
  const crewLift = 78;

  /**
   * The crew flanks the *building*, not the window. On a wide screen the stage
   * is much wider than the façade, and anchoring to the stage edges left the
   * two of them stranded out on the grass with the firehouse marooned between.
   */
  const crewX = useMemo(() => {
    if (!station) return { left: -10, right: -10 };
    const gutter = (stage.w - station.width) / 2;
    return {
      left: Math.max(-10, gutter - crew.rookie * 0.52),
      right: Math.max(-10, gutter - crew.bea * 0.52),
    };
  }, [crew.bea, crew.rookie, stage.w, station]);

  /**
   * Captain Bea does the talking (she is the voice that speaks the greeting),
   * so the bubble hangs off her shoulder with the tail on the right. It has to
   * thread a needle: below the room grid, because a greeting must never cover a
   * door, and clear of both faces. So it sits at shoulder height across the bay
   * doors — which are scenery — and stops short of each of them.
   */
  const bubble = useMemo(() => {
    if (!station) return null;
    const last = station.tiles[station.tiles.length - 1];
    const gridBottom = last ? last.y + last.h : station.height * 0.7;
    /* px from the bottom of the stage to the underside of the room grid */
    const clear = CREW_ZONE - APRON_OVERLAP + (station.height - gridBottom);
    const width = Math.max(144, Math.min(184, stage.w * 0.46));
    const bottom = Math.min(crewLift + crew.bea * 0.36, Math.max(72, clear - 76));
    return { width, bottom, right: crewX.right + crew.bea * 0.66 };
  }, [crew.bea, crewX.right, stage.w, station]);

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

  /**
   * The station is a scene, not a reading column, so it is capped wider than
   * `contentWidth` — an iPad in portrait should get a bigger firehouse, not a
   * phone-sized one floating in the middle of the glass.
   */
  const stageWidth = Math.min(layout.width, Math.max(layout.contentWidth, 720));

  return (
    <ScreenFrame
      mood={evening ? 'evening' : 'day'}
      backdrop={<TownBackdrop mood={evening ? 'evening' : 'day'} hills={240} cloudCount={4} />}
      /*
       * No floating wordmark. It cost ~110 px of the play area and said the
       * app's name a second time, ten pixels above a station sign that already
       * reads STATION SPARK in the same display face. The lock-up still opens
       * the app on the splash and in onboarding; here, the building is the
       * brand and the room goes to the shift.
       */
      chrome={
        <TopBar
          back={false}
          left={<GrownUpsDoor onPress={() => router.push('/grownups')} />}
          right={<SparksCounter />}
        />
      }
    >
      <View style={[styles.body, { maxWidth: stageWidth }]}>
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

                {/* the six doors */}
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
              <View style={[styles.crewLeft, { bottom: crewLift, left: crewX.left }]} pointerEvents="none">
                <Rookie size={crew.rookie} avatar={profile.avatar} pose="wave" emotion="happy" />
              </View>
              <View style={[styles.crewRight, { bottom: crewLift - 2, right: crewX.right }]} pointerEvents="none">
                {/* Captain Bea waits by the apron for the shift to start */}
                <CaptainBea size={crew.bea} emotion="calm" pose="stand" bobPhase={0.45} />
              </View>
              {bubble ? (
                <View style={[styles.bubble, { right: bubble.right, bottom: bubble.bottom, width: bubble.width }]} pointerEvents="none">
                  <GreetingBubble lines={greetings} maxWidth={bubble.width} tail="right" />
                </View>
              ) : null}
            </>
          ) : null}
        </View>

        {/* THE one thing to do. Nothing else on this screen is red, lifted this
            far, or this wide — and the shift count reads as its caption rather
            than as a fourth counter floating in the sky. */}
        <Animated.View entering={FadeInDown.delay(140).springify().damping(17)} style={styles.ctaBlock}>
          <Button
            label={shiftActive ? 'Continue Shift' : 'Start Shift'}
            size="xl"
            tone={roles.action.primary}
            glow
            onPress={startShift}
            iconRight={<ChevronRightIcon size={28} />}
            style={styles.cta}
            accessibilityLabel={shiftActive ? `Continue your shift. ${summary.label}` : `Start your shift. ${summary.label}`}
          />
          <ShiftChip label={summary.label} active={summary.active} />
        </Animated.View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: spacing.sm },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginTop: 72 },
  stationWrap: { position: 'absolute', bottom: CREW_ZONE - APRON_OVERLAP, alignSelf: 'center' },
  abs: { position: 'absolute' },
  sign: { alignItems: 'center', justifyContent: 'center' },
  crewLeft: { position: 'absolute', alignItems: 'flex-start', zIndex: 2 },
  bubble: { position: 'absolute', alignItems: 'flex-end', zIndex: 3 },
  crewRight: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 0, zIndex: 2 },
  ctaBlock: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  cta: { minWidth: 236, maxWidth: 300, alignSelf: 'center' },
  grownUps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: roles.surface.card,
    borderRadius: radii.pill,
    paddingLeft: 6,
    paddingRight: 14,
    minHeight: hit.min,
  },
  avatarDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
});
