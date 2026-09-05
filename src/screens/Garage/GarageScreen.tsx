import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';
import { palette, radii, shadows, spacing, timings } from '@/theme';
import { Button, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useGame } from '@/state/store';
import { selectTruck } from '@/state/selectors';
import type { TruckStyle } from '@/state/store';
import { TruckScene3D } from '@/three';
import { Pepper, type PepperHandle } from '@/characters/Pepper';
import { BottomBar, Swatch, useScaledLayout } from '@/screens/shared';
import { GarageBay } from './GarageBay';
import { PickerRow } from './PickerRow';

const COLORS: { value: TruckStyle['color']; hex: string; label: string }[] = [
  { value: 'red', hex: palette.engineRed, label: 'Red' },
  { value: 'yellow', hex: palette.safetyYellow, label: 'Yellow' },
  { value: 'blue', hex: '#3E8FE0', label: 'Blue' },
  { value: 'green', hex: palette.leafGreen, label: 'Green' },
];

const DECALS: { value: TruckStyle['decal']; label: string }[] = [
  { value: 'none', label: 'Plain' },
  { value: 'flame', label: 'Flame' },
  { value: 'star', label: 'Star' },
  { value: 'paw', label: 'Paw' },
  { value: 'lightning', label: 'Bolt' },
];

const LIGHTS: { value: TruckStyle['lights']; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'blue', label: 'Blue' },
];

const HORNS: { value: TruckStyle['horn']; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'melody', label: 'Melody' },
  { value: 'quack', label: 'Quack' },
];

const hornRate: Record<TruckStyle['horn'], number> = { classic: 1, melody: 1.42, quack: 0.68 };

/** How much shine one sponge dab adds — ~28 dabs to sparkling. */
const WASH_STEP = 0.036;

function Sponge({ size = 46 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 46 32">
      <Rect x={1} y={7} width={44} height={24} rx={7} fill="#FFD24D" />
      <Rect x={1} y={2} width={44} height={12} rx={6} fill="#FFF1A8" />
      <Circle cx={12} cy={20} r={3} fill="#EBB92F" />
      <Circle cx={24} cy={24} r={2.6} fill="#EBB92F" />
      <Circle cx={34} cy={18} r={3.2} fill="#EBB92F" />
      <Ellipse cx={23} cy={5} rx={16} ry={3} fill="#FFFFFF" opacity={0.55} />
    </Svg>
  );
}

export function GarageScreen() {
  const layout = useScaledLayout();
  const truck = useGame(selectTruck);
  const setTruck = useGame((s) => s.setTruck);

  const [washing, setWashing] = useState(false);
  const [shine, setShine] = useState(0);
  const [honks, setHonks] = useState(0);
  const lastDab = useRef<{ x: number; y: number } | null>(null);
  const pepper = useRef<PepperHandle>(null);

  const spongeX = useSharedValue(0);
  const spongeY = useSharedValue(0);
  const spongeOn = useSharedValue(0);

  const stageWidth = Math.min(layout.contentWidth - spacing.md * 2, layout.s(400));
  const stageHeight = Math.round(Math.min(Math.max(layout.s(292), 230), 380));
  const sparkling = shine >= 1;

  const honk = useCallback(
    (style?: TruckStyle['horn']) => {
      sfx.play('horn', { rate: hornRate[style ?? truck.horn] });
      haptics.thud();
      setHonks((n) => n + 1);
      pepper.current?.jump();
    },
    [truck.horn],
  );

  const change = useCallback(
    (patch: Partial<TruckStyle>) => {
      setTruck(patch);
      honk(patch.horn);
    },
    [honk, setTruck],
  );

  const dab = useCallback((x: number, y: number) => {
    const last = lastDab.current;
    if (last && Math.hypot(last.x - x, last.y - y) < 14) return;
    lastDab.current = { x, y };
    setShine((prev) => {
      const next = Math.min(1, prev + WASH_STEP);
      if (prev < 1 && next >= 1) {
        sfx.play('sparkle');
        haptics.success();
      }
      return next;
    });
  }, []);

  const setSponge = useCallback(
    (on: boolean) => {
      spongeOn.value = withTiming(on ? 1 : 0, timings.fast);
    },
    [spongeOn],
  );

  const wash = useMemo(
    () =>
      Gesture.Pan()
        .enabled(washing)
        .minDistance(0)
        .onBegin((e) => {
          spongeX.value = e.x;
          spongeY.value = e.y;
          runOnJS(setSponge)(true);
          runOnJS(dab)(e.x, e.y);
        })
        .onUpdate((e) => {
          spongeX.value = e.x;
          spongeY.value = e.y;
          runOnJS(dab)(e.x, e.y);
        })
        .onFinalize(() => {
          runOnJS(setSponge)(false);
        }),
    [dab, setSponge, spongeX, spongeY, washing],
  );

  const spongeStyle = useAnimatedStyle(() => ({
    opacity: spongeOn.value,
    transform: [{ translateX: spongeX.value - 23 }, { translateY: spongeY.value - 16 }, { scale: 0.8 + spongeOn.value * 0.2 }],
  }));

  const startWash = useCallback(() => {
    lastDab.current = null;
    if (washing) {
      setWashing(false);
      return;
    }
    setWashing(true);
    setShine(0);
    sfx.play('splash');
    haptics.select();
  }, [washing]);

  return (
    <ScreenFrame safeBottom={false} backdrop={<GarageBay />} chrome={<TopBar />}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { maxWidth: layout.contentWidth }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.header}>
          <Panel tone="glass" padding="xs" radius="pill" style={styles.banner}>
            <Text variant="h2" center>
              The Garage
            </Text>
          </Panel>
          <Text variant="small" color={palette.navy} center>
            {washing ? 'Rub the sponge to make it shine.' : 'Drag the truck to turn it around.'}
          </Text>
        </Animated.View>

        {/* ── the truck, on a turntable ────────────────────────── */}
        <View style={styles.stage}>
          <View style={{ width: stageWidth, height: stageHeight }}>
            <TruckScene3D style={truck} height={stageHeight} honk={honks} shine={shine} testID="garage-truck-3d" />

            {/* Pepper stands beside the engine, watching the work */}
            <View style={[styles.abs, styles.pepper]} pointerEvents="none">
              <Pepper ref={pepper} size={Math.max(56, stageHeight * 0.28)} emotion="happy" wag />
            </View>

            {/* the sponge takes the stage while the child is washing */}
            {washing ? (
              <GestureDetector gesture={wash}>
                <Animated.View style={StyleSheet.absoluteFill}>
                  <Animated.View style={[styles.abs, styles.sponge, spongeStyle]} pointerEvents="none">
                    <Sponge />
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            ) : null}
          </View>

          {washing ? (
            <Animated.View entering={FadeIn} style={styles.washHint}>
              <Text variant="small" color={palette.navy} center>
                {sparkling ? 'Sparkling clean! Great job.' : 'Rub the sponge over the truck to make it shine!'}
              </Text>
            </Animated.View>
          ) : null}

          <View style={styles.actionRow}>
            <Button label="Honk!" tone="yellow" size="md" onPress={() => honk()} />
            <Button label={washing ? 'All done' : 'Wash the truck'} tone={washing ? 'green' : 'blue'} size="md" onPress={startWash} />
          </View>
        </View>

        {/* ── pickers ─────────────────────────────────────────── */}
        <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
          <Text variant="h3">Colour</Text>
          <View style={styles.swatches}>
            {COLORS.map((c) => (
              <Swatch key={c.value} color={c.hex} label={c.label} active={truck.color === c.value} onPress={() => change({ color: c.value })} />
            ))}
          </View>

          <Text variant="h3">Decal</Text>
          <PickerRow options={DECALS} value={truck.decal} onChange={(v) => change({ decal: v })} />

          <Text variant="h3">Lights</Text>
          <PickerRow options={LIGHTS} value={truck.lights} onChange={(v) => change({ lights: v })} tone="#3E8FE0" />

          <Text variant="h3">Horn</Text>
          <PickerRow options={HORNS} value={truck.horn} onChange={(v) => change({ horn: v })} tone={palette.gold} />
        </Panel>

        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomBar />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  header: { alignItems: 'center', marginTop: 56, gap: 4 },
  banner: { paddingHorizontal: spacing.lg, minWidth: 190 },
  stage: { alignItems: 'center', gap: spacing.sm },
  abs: { position: 'absolute' },
  pepper: { left: 2, bottom: 0 },
  sponge: { left: 0, top: 0 },
  washHint: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    ...shadows.soft,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  card: { gap: spacing.xs },
  swatches: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  footerSpace: { height: spacing.lg },
});
