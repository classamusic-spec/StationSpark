import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter, type Href } from 'expo-router';
import { palette, shadows, spacing, springs } from '@/theme';
import { Button, ChevronRightIcon, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { LocationId, MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { missions } from '@/content/missions';
import { useGame } from '@/state/store';
import { selectTruck } from '@/state/selectors';
import { Birds, FireTruck, MAP_PLACES, MAP_SIGN, MAP_VB, TRUCK_PARK, TownMap } from '@/world';
import { BottomBar, PinLabel, StarCounter, useScaledLayout } from '@/screens/shared';
import { LocationSheet, type SheetMission } from './LocationSheet';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;

type PlaceState = 'open' | 'locked' | 'soon';

/**
 * Pin label placement. Labels are wider than the buildings they mark, so on a
 * phone three neighbours in one row would collide. We estimate each pill's
 * width from its name, clamp it inside the map, and drop every second pin in a
 * row a little lower so the pills stagger instead of stacking.
 */
export function layoutPins(mapW: number, unit: number): { place: (typeof MAP_PLACES)[number]; left: number; top: number; compact: boolean }[] {
  const compact = mapW < 560;
  const charW = compact ? 8.4 : 10.2;
  const chrome = compact ? 52 : 62;
  const rowGap = compact ? 38 : 44;
  // group into rows by y, then number each row's pins left → right so the
  // leftmost pin (e.g. Fire Station, above the parked truck) is never dropped.
  const byY = [...MAP_PLACES].sort((a, b) => a.y - b.y);
  const rows: (typeof MAP_PLACES)[number][][] = [];
  let lastY = -999;
  for (const p of byY) {
    if (Math.abs(p.y - lastY) > 30 || rows.length === 0) rows.push([]);
    rows[rows.length - 1]?.push(p);
    lastY = p.y;
  }
  const posInRow = new Map<string, number>();
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x).forEach((p, i) => posInRow.set(p.id, i));
  }
  return MAP_PLACES.map((place) => {
    const est = Math.min(compact ? 170 : 200, chrome + place.name.length * charW);
    const left = Math.min(Math.max(place.x * unit - est / 2, 4), Math.max(4, mapW - est - 4));
    const stagger = (posInRow.get(place.id) ?? 0) % 2 === 1 ? rowGap : 0;
    return { place, left, top: place.y * unit + stagger, compact };
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

  const mapW = viewport.w > 0 ? viewport.w : layout.contentWidth;
  const mapH = (MAP_VB.h / MAP_VB.w) * mapW;
  const unit = mapW / MAP_VB.w;
  const pinLayout = useMemo(() => layoutPins(mapW, unit), [mapW, unit]);

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
      <View style={styles.body}>
        {/* critique #14: the map is the screen — it runs edge to edge and the
            title and the CTA float over it instead of boxing it in. */}
        <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.header} pointerEvents="box-none">
          <Panel tone="cream" padding="xs" radius="pill" style={styles.banner}>
            <Text variant="h2" center>
              Spark City
            </Text>
          </Panel>
        </Animated.View>

        <View style={styles.viewport} onLayout={onViewport}>
          {viewport.w > 0 ? (
            <GestureDetector gesture={gesture}>
              <Animated.View style={[styles.mapWrap, { width: mapW, height: mapH }, mapStyle]}>
                <TownMap width={mapW} />

                {/* the wooden board */}
                <View
                  style={[
                    styles.abs,
                    styles.sign,
                    { left: MAP_SIGN.x * unit, top: MAP_SIGN.y * unit, width: MAP_SIGN.w * unit, height: MAP_SIGN.h * unit },
                  ]}
                  pointerEvents="none"
                >
                  <Text
                    variant="tiny"
                    color={palette.white}
                    center
                    style={{
                      fontSize: Math.max(9, MAP_SIGN.h * unit * 0.28),
                      lineHeight: Math.max(11, MAP_SIGN.h * unit * 0.34),
                    }}
                  >
                    {'SPARK\nCITY'}
                  </Text>
                </View>

                {/* the engine, parked outside the station */}
                <Animated.View style={[styles.abs, { left: TRUCK_PARK.x * unit - truckWidth / 2, top: TRUCK_PARK.y * unit }, truckStyle]} pointerEvents="none">
                  <FireTruck truck={truck} width={truckWidth} />
                </Animated.View>

                {/* pins — laid out so neighbouring labels never overlap or leave the map */}
                {pinLayout.map(({ place, left, top, compact }, i) => {
                  const state = stateFor(place.id);
                  return (
                    <View key={place.id} style={[styles.abs, { left, top }]}>
                      <PinLabel
                        name={place.name}
                        color={place.color}
                        locked={state !== 'open'}
                        index={i}
                        compact={compact}
                        onPress={() => openPin(place.id, state)}
                      />
                    </View>
                  );
                })}
              </Animated.View>
            </GestureDetector>
          ) : null}
        </View>

        <View style={[styles.ctaWrap, { maxWidth: layout.contentWidth }]} pointerEvents="box-none">
          <Button
            label="Choose a Mission"
            size="xl"
            tone="red"
            block
            iconRight={<ChevronRightIcon size={28} />}
            onPress={() => router.push('/dispatch')}
            style={shadows.glowGold}
          />
        </View>
      </View>

      {openInfo ? (
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
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 56,
    zIndex: 6,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  banner: { paddingHorizontal: spacing.lg, minWidth: 190 },
  viewport: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mapWrap: {},
  abs: { position: 'absolute' },
  sign: { alignItems: 'center', justifyContent: 'center' },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
