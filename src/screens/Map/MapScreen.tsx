import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter, type Href } from 'expo-router';
import { radii, roles, spacing, springs } from '@/theme';
import { Button, ChevronRightIcon, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { LocationId, MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { missions } from '@/content/missions';
import { useGame } from '@/state/store';
import { selectTruck } from '@/state/selectors';
import { Birds, FireTruck, MAP_PLACES, MAP_VB, TRUCK_PARK, TownMap } from '@/world';
import { BottomBar, PinLabel, StarCounter, useScaledLayout } from '@/screens/shared';
import { LocationPanel, LocationSheet, type SheetMission } from './LocationSheet';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;

type PlaceState = 'open' | 'locked' | 'soon';

/** Height the "Choose a Mission" button reserves at the foot of the board. */
const CTA_ROOM = 118;
/**
 * On a wide window the town keeps the room and the jobs stand beside it. The
 * board is portrait and fits to the height, so the width it cannot use goes to
 * the rail rather than to empty sky.
 */
const railWidth = (w: number) => Math.round(Math.max(320, Math.min(460, w * 0.34)));

/**
 * Pin label placement. Labels are wider than the buildings they mark, so on a
 * phone three neighbours in one row would collide. We estimate each pill's
 * width from its name, clamp it inside the map, and drop every second pin in a
 * row a little lower so the pills stagger instead of stacking.
 */
export interface PinBox {
  place: (typeof MAP_PLACES)[number];
  left: number;
  top: number;
  compact: boolean;
  /** locked places get the small chip, not a name pill */
  variant: 'pill' | 'marker';
}

const MARKER_PX = 40;

/**
 * Places the labels in each block's grass strip.
 *
 * Two rules do the work. Only a place you can actually visit gets a name
 * pill — everything else is a small chip on its own building, which is what
 * stops eleven white pills covering the town. And a pill is nudged along its
 * row rather than allowed to sit on a neighbour or run off the board, because
 * the strip it sits in is grass on purpose: no label ever lands on tarmac.
 */
export function layoutPins(mapW: number, unit: number, isOpen: (id: LocationId) => boolean): PinBox[] {
  const compact = mapW < 560;
  const charW = compact ? 8.4 : 10.2;
  const chrome = compact ? 52 : 62;
  const width = (place: (typeof MAP_PLACES)[number]) =>
    isOpen(place.id) ? Math.min(compact ? 170 : 200, chrome + place.name.length * charW) : MARKER_PX;

  /* group by label band — every place in a band shares one strip of grass */
  const rows = new Map<number, (typeof MAP_PLACES)[number][]>();
  for (const place of MAP_PLACES) {
    const band = Math.round(place.y / 40);
    const row = rows.get(band) ?? [];
    row.push(place);
    rows.set(band, row);
  }

  const boxes = new Map<string, { left: number; top: number }>();
  for (const row of rows.values()) {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    let cursor = 4;
    for (const place of sorted) {
      const w = width(place);
      /* centred on the place, then pushed right of whatever came before it */
      const wanted = place.x * unit - w / 2;
      const left = Math.min(Math.max(wanted, cursor), Math.max(4, mapW - w - 4));
      boxes.set(place.id, { left, top: place.y * unit });
      cursor = left + w + 6;
    }
  }

  return MAP_PLACES.map((place) => {
    const box = boxes.get(place.id) ?? { left: 4, top: place.y * unit };
    return { place, left: box.left, top: box.top, compact, variant: isOpen(place.id) ? 'pill' : 'marker' };
  });
}

export function MapScreen() {
  const router = useRouter();
  const layout = useScaledLayout();
  const truck = useGame(selectTruck);
  const played = useGame((s) => s.progress.missions);

  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [openPlace, setOpenPlace] = useState<LocationId | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /*
   * The board is fitted to the room *left over* by the CTA, not to the width
   * alone. Sizing by width put the last row of the town under the button, so
   * the Market, the Homes and the town sign were only ever reachable by
   * panning (art re-score item 10: nothing under the CTA).
   */
  /**
   * A tablet does not get a phone map with sky either side. Once there is room
   * for a rail, the CTA and the selected place move into it and the board takes
   * the whole of the remaining area.
   */
  const side = layout.wide;
  const ctaRoom = side ? 0 : CTA_ROOM;

  const mapW = useMemo(() => {
    const w = viewport.w > 0 ? viewport.w : layout.contentWidth;
    const room = viewport.h > 0 ? viewport.h - ctaRoom : 0;
    return room > 0 ? Math.min(w, (room * MAP_VB.w) / MAP_VB.h) : w;
  }, [ctaRoom, layout.contentWidth, viewport.h, viewport.w]);
  const mapH = (MAP_VB.h / MAP_VB.w) * mapW;
  const unit = mapW / MAP_VB.w;
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const truckNudge = useSharedValue(0);

  // start looking at the top of the town
  useEffect(() => {
    if (viewport.h <= 0) return;
    const maxTy = Math.max(0, (mapH - viewport.h) / 2);
    ty.value = withTiming(maxTy, { duration: 1 });
    startY.value = maxTy;
  }, [mapH, startY, ty, viewport.h]);

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

  const vpW = viewport.w;
  const vpH = viewport.h;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(6)
        .onStart(() => {
          startX.value = tx.value;
          startY.value = ty.value;
        })
        .onUpdate((e) => {
          const maxX = Math.max(0, (mapW * scale.value - vpW) / 2);
          const maxY = Math.max(0, (mapH * scale.value - vpH) / 2);
          tx.value = Math.max(-maxX, Math.min(maxX, startX.value + e.translationX));
          ty.value = Math.max(-maxY, Math.min(maxY, startY.value + e.translationY));
        }),
    [mapH, mapW, scale, startX, startY, tx, ty, vpH, vpW],
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          savedScale.value = scale.value;
        })
        .onUpdate((e) => {
          scale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, savedScale.value * e.scale));
        })
        .onEnd(() => {
          const maxX = Math.max(0, (mapW * scale.value - vpW) / 2);
          const maxY = Math.max(0, (mapH * scale.value - vpH) / 2);
          tx.value = withSpring(Math.max(-maxX, Math.min(maxX, tx.value)), springs.gentle);
          ty.value = withSpring(Math.max(-maxY, Math.min(maxY, ty.value)), springs.gentle);
        }),
    [mapH, mapW, savedScale, scale, tx, ty, vpH, vpW],
  );

  const gesture = useMemo(() => Gesture.Simultaneous(pan, pinch), [pan, pinch]);

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

  const pinLayout = useMemo(() => layoutPins(mapW, unit, (id) => stateFor(id) === 'open'), [mapW, stateFor, unit]);

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

  const openPin = useCallback(
    (id: LocationId, state: PlaceState) => {
      if (state === 'open') setOpenPlace(id);
      else {
        setOpenPlace(id);
      }
    },
    [],
  );

  const truckWidth = Math.max(56, unit * 64);

  return (
    <ScreenFrame
      safeBottom={false}
      // the map board is full-bleed, so the bird flies in the sky strip above
      // it rather than behind the board
      backdrop={<Birds count={1} top={40} arc={20} size={28} periodMs={22000} />}
      chrome={<TopBar right={<StarCounter />} />}
    >
      <View style={[styles.body, side && styles.bodyRow]}>
        <View style={styles.mapCol}>
        {/* critique #14: the map is the screen — it runs edge to edge and the
            title and the CTA float over it instead of boxing it in. On a wide
            window both move into the rail so nothing floats over the town. */}
        {!side ? (
          <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.header} pointerEvents="box-none">
            <Panel tone="cream" padding="xs" radius="pill" style={styles.banner}>
              <Text variant="h3" center numberOfLines={1}>
                Spark City
              </Text>
            </Panel>
          </Animated.View>
        ) : null}

        <View style={[styles.viewport, { paddingBottom: ctaRoom }]} onLayout={onViewport}>
          {viewport.w > 0 ? (
            <GestureDetector gesture={gesture}>
              <Animated.View style={[styles.mapWrap, { width: mapW, height: mapH }, mapStyle]}>
                <TownMap width={mapW} />

                {/* the engine, parked outside the station */}
                <Animated.View style={[styles.abs, { left: TRUCK_PARK.x * unit - truckWidth / 2, top: TRUCK_PARK.y * unit }, truckStyle]} pointerEvents="none">
                  <FireTruck truck={truck} width={truckWidth} />
                </Animated.View>

                {/* pins — laid out so neighbouring labels never overlap or leave the map */}
                {pinLayout.map(({ place, left, top, compact, variant }, i) => {
                  const state = stateFor(place.id);
                  return (
                    <View key={place.id} style={[styles.abs, { left, top }]}>
                      <PinLabel
                        name={place.name}
                        color={place.color}
                        locked={state !== 'open'}
                        index={i}
                        compact={compact}
                        variant={variant}
                        onPress={() => openPin(place.id, state)}
                      />
                    </View>
                  );
                })}
              </Animated.View>
            </GestureDetector>
          ) : null}
        </View>

        {!side ? (
          <View style={styles.ctaWrap} pointerEvents="box-none">
            <View style={[styles.cta, { maxWidth: layout.contentWidth }]}>
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
          <Animated.View entering={FadeInDown.springify().damping(17)} style={[styles.rail, { width: railWidth(layout.width) }]}>
            <View style={styles.railHead}>
              <Text variant="h1" numberOfLines={1} accessibilityRole="header">
                Spark City
              </Text>
              <Text variant="small" color={roles.ink.secondary}>
                Tap a place to see the jobs there.
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
    paddingTop: 84,
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
    top: 18,
    zIndex: 6,
    alignItems: 'center',
  },
  banner: { paddingHorizontal: spacing.md },
  viewport: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mapWrap: { borderRadius: radii.panel, overflow: 'hidden' },
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
  cta: { width: '100%' },
});
