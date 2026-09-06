import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Bell, ChimneySmoke, CatWindow, ContactShadow, DoorLight, FACADE_VB, Flag, Neighbours, Pigeon, StationFacade, Street, facadeLayout } from '@/world';
import { Rookie } from '@/characters/Rookie';
import { CaptainBea } from '@/characters/CaptainBea';
import { SparksCounter, RoomTile, type RoomId } from '@/screens/shared';
import { ShiftChip } from './ShiftChip';
import { GreetingBubble } from './GreetingBubble';
import { FirehouseBackdrop } from './FirehouseBackdrop';

/**
 * THE STATION IS THE MENU — and now it is also the picture.
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
 *
 * The composition is three planes and nothing else:
 *
 *   far    sky — a gradient, two clouds, one bloom, one bird
 *   mid    the block: two hazed neighbours, placed *outside* the station
 *   near   the station, filling the frame, its apron dropping onto a street
 *
 * There used to be a sixth and seventh layer back there — a treeline, three
 * hill ridges and a wall of canopies — all at the same weight as the building
 * they sat behind. They are gone. The station is the only thing in the frame
 * asking to be looked at, and under it the one red button.
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

/** the kerb's own thickness, drawn by `Street` — the apron sits on top of it */
const KERB = 10;
/** clear air the roof keeps under the top-bar pills */
const TOP_MIN = 28;
/** the CTA and its caption, plus the air the road keeps around them */
const CTA_BLOCK = 138;
const CTA_AIR = 42;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function FirehouseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const mood = evening ? 'evening' : 'day';

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

  /**
   * One measurement pass builds the whole scene, because every piece of it is
   * a consequence of one decision: **the station is as big as the frame allows.**
   *
   * It is sized to the height left over once the road band is reserved, capped
   * by the width of the screen — so on a phone the building runs very nearly
   * edge to edge, and on a tablet it grows until the sky above it is a band
   * rather than a field. Everything else hangs off `facadeLayout`: the apron's
   * own height sets the depth of the footpath, so the ground plane is
   * continuous from the building's foot to the kerb, and the apron's splayed
   * front edge becomes the dropped kerb the engines roll down.
   */
  const scene = useMemo(() => {
    const W = stage.w;
    const H = stage.h;
    if (W < 40 || H < 40) return null;
    const ratio = FACADE_VB.w / FACADE_VB.h;

    /* the road band: the CTA lives on it, so it is never thinner than that */
    const road = Math.round(clamp(H * 0.23, CTA_BLOCK + CTA_AIR + insets.bottom, 260 + insets.bottom));
    const sideGap = Math.round(clamp(W * 0.028, 8, 44));
    const fitH = H - road - TOP_MIN;
    const width = Math.max(240, Math.min(W - sideGap * 2, fitH * ratio, 760));
    const station = facadeLayout(width);
    const left = (W - width) / 2;

    /* the footpath is exactly as deep as the apron, so they read as one plane */
    const pave = Math.max(16, Math.round(station.apronHeight) - KERB);
    /* the apron's gathered front edge, dropping off the kerb (design 34 → 326) */
    const crossing = { x: left + station.px(34), width: station.px(292) };

    const crew = clamp(station.height * 0.25, 96, 200);
    /* feet on the apron, a little back from its front edge */
    const crewBottom = road + KERB + station.apronHeight * 0.24;
    /* they flank the building, overhanging its corners by a shoulder */
    const crewInset = left - crew * 0.16;

    return {
      W,
      H,
      road,
      pave,
      left,
      station,
      crossing,
      crew,
      crewBottom,
      crewInset,
      /** the block behind: never taller than the station's eaves */
      block: { height: Math.round(station.height * 0.52), bottom: road + pave },
    };
  }, [insets.bottom, stage.h, stage.w]);

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

  /**
   * Captain Bea does the talking (she is the voice that speaks the greeting),
   * so the bubble hangs off her inside shoulder with the tail on the right. It
   * threads a needle: high enough to clear the crew's boots, low enough to stay
   * off the room grid — a greeting must never cover a door — and stopping well
   * short of both faces, so it lands across the bay doors, which are scenery.
   */
  const bubble = useMemo(() => {
    if (!scene) return null;
    const width = clamp(scene.W * 0.46, 148, 208);
    return {
      width,
      bottom: scene.crewBottom + scene.crew * 0.46,
      right: scene.crewInset + scene.crew * 0.72,
    };
  }, [scene]);

  return (
    <ScreenFrame
      mood={mood}
      safeBottom={false}
      backdrop={<FirehouseBackdrop mood={mood} horizon={scene ? scene.road + scene.pave : 240} />}
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
      <View style={styles.stage} onLayout={onStage}>
        {scene ? (
          <>
            {/* mid plane: the rest of the block, hazed, outside the station */}
            <Neighbours
              width={scene.W}
              height={scene.block.height}
              clear={scene.station.width}
              mood={mood}
              style={{ left: 0, bottom: scene.block.bottom }}
            />

            {/* near plane: footpath, kerb and the road the ramp leads down to */}
            <Street width={scene.W} pave={scene.pave} road={scene.road} crossing={scene.crossing} mood={mood} />

            <Animated.View
              style={[
                styles.stationWrap,
                { width: scene.station.width, height: scene.station.height, left: scene.left, bottom: scene.road + KERB },
                zoomStyle,
              ]}
            >
              <StationFacade width={scene.station.width} unlocked={unlocked} />

              {/* living details, anchored to the façade */}
              <View style={[styles.abs, { left: scene.station.bell.x, top: scene.station.bell.y }]} pointerEvents="none">
                <Bell size={scene.station.bell.size} brass={unlocked.includes('bell-brass')} />
              </View>
              <View style={[styles.abs, { left: scene.station.flag.x, top: scene.station.flag.y }]} pointerEvents="none">
                <Flag width={scene.station.flag.width} poleHeight={scene.station.flag.poleHeight} gold={unlocked.includes('flag-gold')} />
              </View>
              <View style={[styles.abs, { left: scene.station.chimney.x, top: scene.station.chimney.y }]} pointerEvents="none">
                <ChimneySmoke size={scene.station.chimney.size} />
              </View>
              <View style={[styles.abs, { left: scene.station.catWindow.x, top: scene.station.catWindow.y }]} pointerEvents="none">
                <CatWindow size={scene.station.catWindow.size} />
              </View>
              {scene.station.pigeons.map((p, i) => (
                <View key={i} style={[styles.abs, { left: p.x, top: p.y }]} pointerEvents="none">
                  <Pigeon size={p.size} delay={i * 700} />
                </View>
              ))}
              {scene.station.doorLights.map((d, i) => (
                <View key={i} style={[styles.abs, { left: d.x, top: d.y }]} pointerEvents="none">
                  <DoorLight w={d.w} h={d.h} phase={i * 0.5} />
                </View>
              ))}

              {/* the six doors */}
              {ROOMS.map((room, i) => {
                const r = scene.station.tiles[i];
                if (!r) return null;
                return (
                  <View key={room.id} style={[styles.abs, { left: r.x, top: r.y }]}>
                    <RoomTile room={room.id} label={room.label} index={i} width={r.w} height={r.h} onPress={() => enterRoom(room.href)} />
                  </View>
                );
              })}

              {/* station sign */}
              <View
                style={[
                  styles.abs,
                  styles.sign,
                  { left: scene.station.sign.x, top: scene.station.sign.y, width: scene.station.sign.w, height: scene.station.sign.h },
                ]}
                pointerEvents="none"
              >
                <Text variant="h3" color={palette.navy} center numberOfLines={1} style={{ fontSize: Math.max(13, scene.station.sign.h * 0.46) }}>
                  STATION SPARK
                </Text>
              </View>
            </Animated.View>

            {/* the crew, standing on the apron at the bay mouths — each on a
                contact ellipse, because nothing in this world floats */}
            <View style={[styles.crew, { bottom: scene.crewBottom, left: scene.crewInset }]} pointerEvents="none">
              <ContactShadow width={scene.crew * 0.46} style={[styles.contact, { left: scene.crew * 0.27 }]} />
              <Rookie size={scene.crew} avatar={profile.avatar} pose="wave" emotion="happy" />
            </View>
            <View style={[styles.crew, { bottom: scene.crewBottom, right: scene.crewInset }]} pointerEvents="none">
              <ContactShadow width={scene.crew * 0.44} style={[styles.contact, { left: scene.crew * 0.28 }]} />
              {/* Captain Bea waits by the apron for the shift to start */}
              <CaptainBea size={scene.crew} emotion="calm" pose="stand" bobPhase={0.45} />
            </View>
            {bubble ? (
              <View style={[styles.bubble, { right: bubble.right, bottom: bubble.bottom, width: bubble.width }]} pointerEvents="none">
                <GreetingBubble lines={greetings} maxWidth={bubble.width} tail="right" />
              </View>
            ) : null}

            {/* THE one thing to do — alone on the road, where nothing else on
                the screen is red, glowing, or this wide, and the shift count
                reads as its caption rather than a fourth floating counter. */}
            <Animated.View
              entering={FadeInDown.delay(140).springify().damping(17)}
              style={[styles.ctaBlock, { bottom: insets.bottom + Math.max(12, (scene.road - insets.bottom - CTA_BLOCK) * 0.42) }]}
            >
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
          </>
        ) : null}
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, width: '100%', overflow: 'hidden' },
  stationWrap: { position: 'absolute' },
  abs: { position: 'absolute' },
  sign: { alignItems: 'center', justifyContent: 'center' },
  crew: { position: 'absolute', zIndex: 2 },
  /* drawn before the rig, so the ellipse is under the boots, never over them */
  contact: { position: 'absolute', bottom: 1 },
  bubble: { position: 'absolute', alignItems: 'flex-end', zIndex: 3 },
  ctaBlock: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: spacing.xs, zIndex: 4 },
  cta: { minWidth: 236, maxWidth: 320, alignSelf: 'center' },
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
