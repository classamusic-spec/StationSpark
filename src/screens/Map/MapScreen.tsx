import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { Button, ChevronRightIcon, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { LocationId, MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { missions } from '@/content/missions';
import { useGame } from '@/state/store';
import { selectTruck } from '@/state/selectors';
import { FireTruck, MAP_PLACES, MAP_SIGN, MAP_VB, TRUCK_PARK, TownMap } from '@/world';
import { BottomBar, PinLabel, StarCounter, useScaledLayout } from '@/screens/shared';
import { LocationSheet, type SheetMission } from './LocationSheet';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;
const PIN_SLOT = 190;

type PlaceState = 'open' | 'locked' | 'soon';

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
      pending.current = setTimeout(() => router.push(`/mission/${id}`), 320);
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

  const truckWidth = Math.max(72, unit * 96);

  return (
    <ScreenFrame
      safeBottom={false}
      chrome={<TopBar right={<StarCounter />} />}
    >
      <View style={[styles.body, { maxWidth: layout.contentWidth }]}>
        <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.header}>
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
                  <Text variant="tiny" color={palette.white} center style={{ fontSize: Math.max(9, MAP_SIGN.h * unit * 0.3) }}>
                    {'SPARK\nCITY'}
                  </Text>
                </View>

                {/* the engine, parked outside the station */}
                <Animated.View style={[styles.abs, { left: TRUCK_PARK.x * unit - truckWidth / 2, top: TRUCK_PARK.y * unit }, truckStyle]} pointerEvents="none">
                  <FireTruck truck={truck} width={truckWidth} />
                </Animated.View>

                {/* pins */}
                {MAP_PLACES.map((place, i) => {
                  const state = stateFor(place.id);
                  return (
                    <View
                      key={place.id}
                      style={[styles.abs, styles.pinSlot, { left: place.x * unit - PIN_SLOT / 2, top: place.y * unit }]}
                    >
                      <PinLabel
                        name={place.name}
                        color={place.color}
                        locked={state !== 'open'}
                        index={i}
                        compact={unit < 0.95}
                        onPress={() => openPin(place.id, state)}
                      />
                    </View>
                  );
                })}
              </Animated.View>
            </GestureDetector>
          ) : null}
        </View>

        <View style={styles.ctaWrap}>
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
  body: { flex: 1, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginTop: 56, paddingHorizontal: spacing.md },
  banner: { paddingHorizontal: spacing.lg, minWidth: 190 },
  viewport: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  mapWrap: { borderRadius: radii.card },
  abs: { position: 'absolute' },
  pinSlot: { width: PIN_SLOT, alignItems: 'center' },
  sign: { alignItems: 'center', justifyContent: 'center' },
  ctaWrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
