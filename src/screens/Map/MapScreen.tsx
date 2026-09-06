import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import { useRouter, type Href } from 'expo-router';
import { hit, radii, roles, spacing, springs } from '@/theme';
import { Button, ChevronRightIcon, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { LocationId, MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { missions } from '@/content/missions';
import { useGame } from '@/state/store';
import { selectTruck } from '@/state/selectors';
import { Birds, FireTruck, MAP_PLACES, TRUCK_PARK, TownMap, type MapPlace } from '@/world';
import { BottomBar, StarCounter, useScaledLayout } from '@/screens/shared';
import { LocationPanel, LocationSheet, type SheetMission } from './LocationSheet';
import { MapPin } from './MapPin';
import { MapViewButton } from './MapViewButton';
import { CONTENT_H, CONTENT_W, MAP_UNIT, layoutPins } from './mapView';
import { useMapCamera } from './useMapCamera';

type PlaceState = 'open' | 'locked' | 'soon';

/**
 * On a wide window the town keeps the room and the jobs stand beside it, so
 * the width the board cannot use goes to the rail rather than to empty sky.
 */
const railWidth = (w: number) => Math.round(Math.max(320, Math.min(460, w * 0.34)));

/** Below this the name pills shrink so three neighbours still fit in a row. */
const COMPACT_BELOW = 560;

/**
 * How much chrome floats over the foot of the map on a phone: the view toggle,
 * the gap, the big CTA and the padding round them. The town runs *under* it,
 * but the whole-town view has to clear it — a row of the plan hidden behind a
 * button is not "the whole town".
 */
const FOOT_ROOM = spacing.sm * 2 + hit.min + spacing.xs + hit.big + 6;

/** How wide the parked engine is, in plan units. */
const TRUCK_UNITS = 64;

/** A label sits in the grass below its building; frame the building itself. */
const BUILDING_OFFSET = 34;

/**
 * Spark City.
 *
 * The town is no longer squeezed until the whole plan fits the window — it is
 * drawn at a working size and the screen is a window onto it. Drag anywhere to
 * move, pinch or double-tap to come closer, and one button always brings the
 * whole town back. See `mapView.ts` for the camera arithmetic and
 * `useMapCamera.ts` for the gestures.
 */
export function MapScreen() {
  const router = useRouter();
  const layout = useScaledLayout();
  const insets = useSafeAreaInsets();
  const truck = useGame(selectTruck);
  const played = useGame((s) => s.progress.missions);

  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [openPlace, setOpenPlace] = useState<LocationId | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const truckNudge = useSharedValue(0);

  /**
   * A tablet does not get a phone map with sky either side. Once there is room
   * for a rail, the title, the selected place and the CTA move into it and the
   * board takes the whole of the remaining area.
   */
  const side = layout.wide;

  const { far, framedWhole, focus, gesture, scale, scales, showAll, showHome, tx, ty, wasDragged } = useMapCamera(
    viewport.w,
    viewport.h,
    side ? 0 : FOOT_ROOM,
  );

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  const onViewport = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport((p) => (Math.abs(p.w - width) < 1 && Math.abs(p.h - height) < 1 ? p : { w: width, h: height }));
  }, []);

  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckNudge.value }],
  }));

  /* ── content ─────────────────────────────────────────────────── */

  const byPlace = useMemo(() => {
    const map = new Map<LocationId, MissionDef[]>();
    for (const m of missions) {
      const list = map.get(m.location);
      if (list) list.push(m);
      else map.set(m.location, [m]);
    }
    return map;
  }, []);

  const stateFor = useCallback(
    (id: LocationId): PlaceState => {
      const list = byPlace.get(id) ?? [];
      if (list.length === 0) return id === 'station' ? 'open' : 'soon';
      const done = new Set(Object.keys(played));
      return list.some((m) => (m.requires ?? []).every((r) => done.has(r))) ? 'open' : 'locked';
    },
    [byPlace, played],
  );

  /*
   * Labels are laid out at the *tightest* spacing they will ever be asked to
   * survive — the scale at which pills appear at all, or, once the camera is
   * further out than that, the whole-town scale where every place is a chip.
   * Closer in, the anchors only spread further apart.
   */
  const pinLayout = useMemo(
    () =>
      layoutPins(
        MAP_UNIT * (far ? scales.min : scales.label),
        viewport.w > 0 && viewport.w < COMPACT_BELOW,
        (id) => stateFor(id) === 'open',
        !far,
      ),
    [far, scales.label, scales.min, stateFor, viewport.w],
  );

  const sheetMissions = useMemo((): SheetMission[] => {
    if (!openPlace) return [];
    const done = new Set(Object.keys(played));
    return (byPlace.get(openPlace) ?? []).map((def) => {
      const missing = (def.requires ?? []).filter((r) => !done.has(r));
      const first = missing[0];
      return {
        def,
        stars: (played[def.id]?.stars ?? 0) as Stars,
        available: missing.length === 0,
        requiresLabel: first ? (missions.find((m) => m.id === first)?.title ?? first) : undefined,
      };
    });
  }, [byPlace, openPlace, played]);

  const openInfo = useMemo(() => MAP_PLACES.find((p) => p.id === openPlace) ?? null, [openPlace]);

  const go = useCallback(
    (id: string) => {
      sfx.play('horn');
      haptics.thud();
      truckNudge.value = withSequence(withSpring(-10, springs.pop), withSpring(6, springs.pop), withSpring(0, springs.bounce));
      setOpenPlace(null);
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(() => router.push(`/mission/${id}` as Href), 320);
    },
    [router, truckNudge],
  );

  /**
   * Tapping a place both opens its jobs and brings the camera to it, which is
   * the second way in from the whole-town view: a child who has zoomed out
   * never has to pinch to get back to a building.
   */
  const openPin = useCallback(
    (place: MapPlace) => {
      /* a pin travels with the finger, so a swipe across one is not a tap */
      if (wasDragged()) return;
      setOpenPlace(place.id);
      /* on a phone the sheet takes the lower half, so the place sits high */
      focus(place.x, place.y - BUILDING_OFFSET, scales.home, side ? 0.44 : 0.26);
    },
    [focus, scales.home, side, wasDragged],
  );

  const truckWidth = TRUCK_UNITS * MAP_UNIT;

  return (
    <ScreenFrame
      safeTop={false}
      safeBottom={false}
      // the town runs under the chrome, so the bird flies in the sky strip
      // that only shows when the whole map is framed
      backdrop={<Birds count={1} top={40} arc={20} size={28} periodMs={22000} />}
      chrome={<TopBar right={<StarCounter />} />}
    >
      <View style={[styles.body, side && styles.bodyRow]}>
        <View style={styles.mapCol}>
          <View style={styles.viewport} onLayout={onViewport}>
            {viewport.w > 0 ? (
              <GestureDetector gesture={gesture}>
                <View style={styles.stage} collapsable={false} testID="map-stage">
                  <Animated.View
                    testID="town-board"
                    style={[
                      styles.board,
                      {
                        width: CONTENT_W,
                        height: CONTENT_H,
                        left: (viewport.w - CONTENT_W) / 2,
                        top: (viewport.h - CONTENT_H) / 2,
                      },
                      mapStyle,
                    ]}
                    pointerEvents="none"
                  >
                    <TownMap width={CONTENT_W} />

                    {/* the engine, parked outside the station */}
                    <Animated.View
                      style={[
                        styles.abs,
                        { left: TRUCK_PARK.x * MAP_UNIT - truckWidth / 2, top: TRUCK_PARK.y * MAP_UNIT },
                        truckStyle,
                      ]}
                    >
                      <FireTruck truck={truck} width={truckWidth} />
                    </Animated.View>
                  </Animated.View>

                  {/* pins ride above the town at a constant size, so a name is
                      always readable and a target always ≥ 56 px */}
                  <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {pinLayout.map((box, i) => (
                      <MapPin
                        key={box.place.id}
                        box={box}
                        index={i}
                        locked={stateFor(box.place.id) !== 'open'}
                        vpW={viewport.w}
                        vpH={viewport.h}
                        scale={scale}
                        tx={tx}
                        ty={ty}
                        blocked={wasDragged}
                        onPress={() => openPin(box.place)}
                      />
                    ))}
                  </View>
                </View>
              </GestureDetector>
            ) : null}
          </View>

          {/* critique #14: the map is the screen — it runs edge to edge and the
              title and the CTA float over it instead of boxing it in. On a wide
              window both move into the rail so nothing floats over the town. */}
          {!side ? (
            <Animated.View
              entering={FadeInDown.springify().damping(17)}
              style={[styles.header, { top: insets.top + 18 }]}
              pointerEvents="box-none"
            >
              <Panel tone="cream" padding="xs" radius="pill" style={styles.banner}>
                <Text variant="h3" center numberOfLines={1}>
                  Spark City
                </Text>
              </Panel>
            </Animated.View>
          ) : null}

          {!side ? (
            <View style={styles.ctaWrap} pointerEvents="box-none">
              <View style={[styles.cta, { maxWidth: layout.contentWidth }]}>
                <View style={styles.viewRow}>
                  <MapViewButton framedWhole={framedWhole} onPress={framedWhole ? showHome : showAll} />
                </View>
                <Button
                  label="Choose a Mission"
                  size="xl"
                  tone={roles.action.primary}
                  block
                  glow
                  iconRight={<ChevronRightIcon size={28} />}
                  onPress={() => router.push('/dispatch')}
                />
              </View>
            </View>
          ) : null}
        </View>

        {side ? (
          <Animated.View
            entering={FadeInDown.springify().damping(17)}
            style={[styles.rail, { width: railWidth(layout.width), paddingTop: insets.top + 76 }]}
          >
            <View style={styles.railHead}>
              <Text variant="h1" numberOfLines={1} accessibilityRole="header">
                Spark City
              </Text>
              <Text variant="small" color={roles.ink.secondary}>
                Drag the map to look around. Tap a place to see the jobs there.
              </Text>
            </View>

            <Panel tone="white" radius="panel" padding="sm" style={styles.railPanel}>
              {openInfo ? (
                <LocationPanel
                  name={openInfo.name}
                  nameEs={openInfo.nameEs}
                  color={openInfo.color}
                  missions={sheetMissions}
                  onGo={go}
                />
              ) : (
                <View style={styles.railEmpty}>
                  <Text variant="bodyStrong" center>
                    Where shall we help?
                  </Text>
                  <Text variant="small" color={roles.ink.secondary} center>
                    Every white pin on the town is a place that needs the crew. Tap one and its jobs appear here.
                  </Text>
                </View>
              )}
            </Panel>

            <View style={styles.viewRow}>
              <MapViewButton framedWhole={framedWhole} onPress={framedWhole ? showHome : showAll} />
            </View>

            <Button
              label="Choose a Mission"
              size="lg"
              tone={roles.action.primary}
              block
              glow
              iconRight={<ChevronRightIcon size={26} />}
              onPress={() => router.push('/dispatch')}
            />
          </Animated.View>
        ) : null}
      </View>

      {openInfo && !side ? (
        <LocationSheet
          name={openInfo.name}
          nameEs={openInfo.nameEs}
          color={openInfo.color}
          missions={sheetMissions}
          onGo={go}
          onClose={() => setOpenPlace(null)}
        />
      ) : null}

      <BottomBar />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, width: '100%' },
  bodyRow: { flexDirection: 'row' },
  mapCol: { flex: 1 },
  rail: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  railHead: { gap: 2, paddingHorizontal: spacing.xxs },
  railPanel: { flex: 1, gap: spacing.sm },
  railEmpty: { flex: 1, justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  /*
   * The title rides in the chrome row between the back button and the star
   * counter, not below it. Sitting lower put it over the first row of the
   * town, which is the one row a child always needs to see.
   */
  header: {
    position: 'absolute',
    left: 78,
    right: 78,
    zIndex: 6,
    alignItems: 'center',
  },
  banner: { paddingHorizontal: spacing.md },
  /* the map fills its column edge to edge and everything else floats over it */
  viewport: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  stage: { flex: 1 },
  board: { position: 'absolute', borderRadius: radii.panel, overflow: 'hidden' },
  abs: { position: 'absolute' },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cta: { width: '100%', gap: spacing.xs },
  viewRow: { alignItems: 'flex-start' },
});
