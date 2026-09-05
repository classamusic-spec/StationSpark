/* TEMPORARY prop verification gallery — removed after screenshot QA. */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { AnimalId } from '@/learning/types';
import { palette, radii, spacing } from '@/theme';
import { Text } from '@/ui';
import { useClock } from '@/minigames/tactile/shared';
import {
  Animal,
  BarrierPiece,
  Campfire,
  Cone,
  Flame,
  FlameGlyph,
  FractionBar,
  HoseReel,
  Hydrant,
  LadderPiece,
  LadderRails,
  PumpLever,
  TankShell,
  WaterSurface,
} from '@/world/props';

const animals: AnimalId[] = ['kitten', 'puppy', 'bunny', 'duckling', 'turtle'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="h3" color={palette.white} outlined>
        {title}
      </Text>
      {children}
    </View>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => <View style={styles.row}>{children}</View>;

function Tank() {
  const level = useSharedValue(0.62);
  const slosh = useSharedValue(0);
  const clock = useClock(true);
  const w = 130;
  const h = 210;
  const inset = 7;
  return (
    <View style={{ width: w, height: h }}>
      <View style={[styles.tankInner, { left: inset, top: inset, borderRadius: radii.card }]}>
        <WaterSurface width={w - inset * 2} height={h - inset * 2} level={level} slosh={slosh} clock={clock} radius={radii.card} />
      </View>
      <TankShell width={w} height={h} radius={radii.card + 6} ticks={[0.25, 0.5, 0.75]} targetAt={0.75} tickLabels={['¼', '½', '¾']} />
    </View>
  );
}

export default function PropsGallery() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Section title="Flame">
        <Row>
          {[24, 46, 80, 120].map((s) => (
            <Flame key={s} size={s} phase={s % 5} />
          ))}
        </Row>
        <Row>
          <Flame size={80} friendly />
          <Flame size={80} state="steaming" />
          <Flame size={80} wetness={0.5} />
          <FlameGlyph size={46} dim />
          <FlameGlyph size={24} />
          <FlameGlyph size={120} friendly />
        </Row>
      </Section>
      <Section title="Animals — help · happy · held · safe">
        {animals.map((id) => (
          <Row key={id}>
            <Animal id={id} size={96} mood="help" phase={0} />
            <Animal id={id} size={96} mood="happy" phase={1} />
            <Animal id={id} size={96} pose="held" phase={2} />
            <Animal id={id} size={96} mood="safe" phase={3} />
          </Row>
        ))}
      </Section>
      <Section title="Hydrant · Cone · Hose reel">
        <Row>
          <Hydrant size={110} />
          <Hydrant size={110} tone="yellow" label={12} />
          <Hydrant size={110} connected label={7} />
          <Hydrant width={40} />
        </Row>
        <Row>
          <Cone size={80} />
          <Cone size={60} bands={1} />
          <Cone size={34} />
          <HoseReel size={100} />
          <HoseReel size={72} tone="yellow" />
        </Row>
      </Section>
      <Section title="Ladder">
        <Row>
          <LadderPiece units={1} unitPx={22} width={60} />
          <LadderPiece units={3} unitPx={22} width={60} />
          <LadderPiece units={6} unitPx={22} width={60} />
          <LadderPiece units={4} unitPx={22} width={60} tone="ghost" />
          <View>
            <LadderPiece units={2} unitPx={22} width={60} tone="placed" labelSize="sm" stackIndex={1} />
            <LadderPiece units={3} unitPx={22} width={60} tone="placed" labelSize="sm" stackIndex={0} />
          </View>
          <LadderRails width={64} height={200} rungs={8} unitPx={22} markAt={6} />
        </Row>
      </Section>
      <Section title="Barrier · Campfire">
        <Row>
          <BarrierPiece segments={1} segmentPx={26} height={58} />
          <BarrierPiece segments={3} segmentPx={26} height={58} />
          <BarrierPiece segments={6} segmentPx={22} height={58} />
          <BarrierPiece segments={4} segmentPx={26} height={58} tone="ghost" />
        </Row>
        <Row>
          <Campfire size={150} />
          <Campfire size={150} calm />
        </Row>
      </Section>
      <Section title="Tank · Pump · Fraction">
        <Row>
          <Tank />
          <PumpLever width={84} height={110} />
          <FractionBar width={160} height={24} filled={0.75} segments={4} />
        </Row>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.skyMid },
  content: { padding: spacing.md, paddingTop: spacing.xl, gap: spacing.lg },
  section: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: spacing.md, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radii.card, padding: spacing.sm },
  tankInner: { position: 'absolute', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.35)' },
});
