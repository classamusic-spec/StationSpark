/**
 * SPARKS SHOP SHELF — the station upgrades as illustrated tiles standing on
 * wooden shelf planks. Sparks only ever buy decorations, nothing here gates
 * learning, and everything stays affordable by playing.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { StationUpgradeDef } from '@/content/types';
import { palette, radii, shadows, spacing, stagger } from '@/theme';
import { Button, Chip, Text } from '@/ui';
import { UpgradeArt } from './UpgradeArt';

export interface ShopEntry {
  def: StationUpgradeDef;
  owned: boolean;
  affordable: boolean;
}

function UpgradeTile({ entry, index, onBuy }: { entry: ShopEntry; index: number; onBuy: (d: StationUpgradeDef) => void }) {
  const { def, owned, affordable } = entry;
  return (
    <Animated.View
      entering={FadeInDown.delay(index * stagger.tile).springify().damping(16)}
      style={[styles.tile, shadows.soft, owned && styles.tileOwned]}
      accessible
      accessibilityLabel={owned ? `${def.name}, built` : `${def.name}, ${def.cost} sparks`}
    >
      <View style={styles.art}>
        <UpgradeArt id={def.id} size={68} />
      </View>
      <Text variant="bodyStrong" center style={styles.name}>
        {def.name}
      </Text>
      <Text variant="tiny" color={palette.navySoft} center style={styles.blurb}>
        {def.description}
      </Text>
      <View style={styles.foot}>
        {owned ? (
          <Chip label="Built" tone="green" glyph="check" />
        ) : (
          <>
            <Chip label={String(def.cost)} tone="yellow" glyph="spark" />
            <Button
              label="Buy"
              size="sm"
              tone={affordable ? 'green' : 'white'}
              disabled={!affordable}
              onPress={() => onBuy(def)}
              accessibilityLabel={affordable ? `Buy ${def.name} for ${def.cost} sparks` : `${def.name} costs ${def.cost} sparks — keep playing to earn more`}
            />
          </>
        )}
      </View>
    </Animated.View>
  );
}

/** One wooden plank a row of tiles stands on. */
function Plank() {
  return (
    <View pointerEvents="none" style={styles.plank}>
      <View style={styles.plankFace}>
        <View style={styles.plankSheen} />
      </View>
      <View style={styles.plankEdge} />
    </View>
  );
}

export interface ShopShelfProps {
  entries: readonly ShopEntry[];
  /** tiles per shelf */
  columns?: 2 | 3 | 4;
  onBuy: (def: StationUpgradeDef) => void;
}

export function ShopShelf({ entries, columns = 2, onBuy }: ShopShelfProps) {
  const rows: ShopEntry[][] = [];
  for (let i = 0; i < entries.length; i += columns) rows.push(entries.slice(i, i + columns));
  return (
    <View style={styles.shelf}>
      {rows.map((row, r) => (
        <View key={r} style={styles.rowWrap}>
          <Plank />
          <View style={styles.row}>
            {row.map((e, c) => (
              <UpgradeTile key={e.def.id} entry={e} index={r * columns + c} onBuy={onBuy} />
            ))}
            {row.length < columns
              ? Array.from({ length: columns - row.length }, (_, i) => <View key={`gap${i}`} style={styles.gapTile} />)
              : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: { gap: spacing.sm },
  rowWrap: { paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm, paddingHorizontal: 2 },
  tile: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.tile,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  tileOwned: { backgroundColor: '#F1FAF0' },
  gapTile: { flex: 1 },
  art: { alignItems: 'center', justifyContent: 'center', height: 72 },
  name: { includeFontPadding: false },
  blurb: { flexGrow: 1, lineHeight: 16 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, flexWrap: 'wrap', marginTop: 4 },
  plank: { position: 'absolute', left: -8, right: -8, bottom: 0, height: 18 },
  plankFace: { flex: 1, backgroundColor: palette.wood, borderTopLeftRadius: 6, borderTopRightRadius: 6, overflow: 'hidden' },
  plankSheen: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  plankEdge: { height: 6, backgroundColor: palette.woodDark, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
});
