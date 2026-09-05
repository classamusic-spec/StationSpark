import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { palette, radii, spacing } from '@/theme';
import { Button, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { badges } from '@/content/badges';
import type { TruckStyle } from '@/state/store';
import { Badge3D, TruckScene3D, badge3DIcons, type Badge3DIcon } from '@/three';

const COLORS: TruckStyle['color'][] = ['red', 'yellow', 'blue', 'green'];
const DECALS: TruckStyle['decal'][] = ['flame', 'star', 'paw', 'lightning', 'none'];
const LIGHTS: TruckStyle['lights'][] = ['classic', 'rainbow', 'blue'];

/** Rim colours to cycle the badge through, straight from the content pack. */
const BADGE_COLORS = badges.slice(0, 8).map((b) => b.color);

/**
 * Dev-only bench for the 3D layer: the truck through every colour, decal and
 * light preset, the badge flipping through every emblem, and a switch that
 * forces the error-boundary fallback so we can see the 2D art take over.
 */
export default function DevThree() {
  const [colorIndex, setColorIndex] = useState(0);
  const [decalIndex, setDecalIndex] = useState(0);
  const [lightIndex, setLightIndex] = useState(0);
  const [honk, setHonk] = useState(0);
  const [shine, setShine] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [fallback, setFallback] = useState(false);

  const [badgeIndex, setBadgeIndex] = useState(0);
  const [flipKey, setFlipKey] = useState(0);

  const truck: TruckStyle = {
    color: COLORS[colorIndex % COLORS.length] ?? 'red',
    decal: DECALS[decalIndex % DECALS.length] ?? 'flame',
    lights: LIGHTS[lightIndex % LIGHTS.length] ?? 'classic',
    horn: 'classic',
  };

  const icon: Badge3DIcon = badge3DIcons[badgeIndex % badge3DIcons.length] ?? 'star';
  const badgeColor = BADGE_COLORS[badgeIndex % BADGE_COLORS.length] ?? palette.engineRed;

  const nextBadge = useCallback(() => {
    setBadgeIndex((n) => n + 1);
    setFlipKey((n) => n + 1);
  }, []);

  return (
    <ScreenFrame chrome={<TopBar />}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text variant="h1" center>
          3D bench
        </Text>

        {/* ── truck ─────────────────────────────────────────── */}
        <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
          <Text variant="h3" center>
            Truck turntable
          </Text>
          <View style={styles.stage} testID="dev-three-truck">
            <TruckScene3D style={truck} height={280} spinning={spinning} honk={honk} shine={shine} forceFallback={fallback} />
          </View>
          <Text variant="small" center color={palette.navySoft}>
            {truck.color} · {truck.decal} · {truck.lights} lights {fallback ? '· 2D fallback' : ''}
          </Text>
          <View style={styles.row}>
            <Button label="Colour" tone="red" size="sm" onPress={() => setColorIndex((n) => n + 1)} />
            <Button label="Decal" tone="yellow" size="sm" onPress={() => setDecalIndex((n) => n + 1)} />
            <Button label="Lights" tone="blue" size="sm" onPress={() => setLightIndex((n) => n + 1)} />
          </View>
          <View style={styles.row}>
            <Button label="Honk!" tone="yellow" size="sm" onPress={() => setHonk((n) => n + 1)} />
            <Button label={spinning ? 'Stop wheels' : 'Spin wheels'} tone="white" size="sm" onPress={() => setSpinning((s) => !s)} />
            <Button label={shine > 0 ? 'Dry off' : 'Wash'} tone="green" size="sm" onPress={() => setShine((s) => (s > 0 ? 0 : 1))} />
          </View>
          <View style={styles.row}>
            <Button
              label={fallback ? 'Use 3D' : 'Force 2D fallback'}
              tone="navy"
              size="sm"
              onPress={() => setFallback((f) => !f)}
            />
          </View>
        </Panel>

        {/* ── badge ─────────────────────────────────────────── */}
        <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
          <Text variant="h3" center>
            Badge flip
          </Text>
          <View style={styles.badgeStage} testID="dev-three-badge">
            <Badge3D color={badgeColor} icon={icon} size={132} flipKey={flipKey} forceFallback={fallback} />
          </View>
          <Text variant="small" center color={palette.navySoft}>
            {icon}
          </Text>
          <View style={styles.row}>
            <Button label="Flip again" tone="green" size="sm" onPress={() => setFlipKey((n) => n + 1)} />
            <Button label="Next badge" tone="red" size="sm" onPress={nextBadge} />
          </View>
        </Panel>
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingTop: 72, gap: spacing.md, maxWidth: 520, alignSelf: 'center', width: '100%' },
  card: { gap: spacing.sm },
  stage: { width: '100%', borderRadius: radii.card, overflow: 'hidden', backgroundColor: 'rgba(189,231,255,0.35)' },
  badgeStage: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', flexWrap: 'wrap' },
});
