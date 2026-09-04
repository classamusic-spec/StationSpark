import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { EquipmentId } from '@/learning/types';
import { palette } from '@/theme';
import { Text } from '../Text';

const glyph: Record<EquipmentId, string> = {
  hose: '🧵',
  cone: '🔶',
  'first-aid': '🧰',
  flashlight: '🔦',
  ladder: '🪜',
  axe: '🪓',
  bucket: '🪣',
  helmet: '⛑️',
  radio: '📻',
  boots: '🥾',
  extinguisher: '🧯',
  rope: '🪢',
};

export const equipmentName: Record<EquipmentId, { en: string; es: string }> = {
  hose: { en: 'Hose', es: 'Manguera' },
  cone: { en: 'Cone', es: 'Cono' },
  'first-aid': { en: 'First Aid Kit', es: 'Botiquín' },
  flashlight: { en: 'Flashlight', es: 'Linterna' },
  ladder: { en: 'Ladder', es: 'Escalera' },
  axe: { en: 'Axe', es: 'Hacha' },
  bucket: { en: 'Bucket', es: 'Cubeta' },
  helmet: { en: 'Helmet', es: 'Casco' },
  radio: { en: 'Radio', es: 'Radio' },
  boots: { en: 'Boots', es: 'Botas' },
  extinguisher: { en: 'Extinguisher', es: 'Extintor' },
  rope: { en: 'Rope', es: 'Cuerda' },
};

/**
 * STUB (emoji) — replaced by chunky SVG equipment art with the same props.
 * `ghost` renders the dashed silhouette used for empty truck slots.
 */
export function EquipmentIcon({ id, size = 64, ghost }: { id: EquipmentId; size?: number; ghost?: boolean }) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.25 }, ghost && styles.ghost]}>
      <Text style={{ fontSize: size * 0.6, lineHeight: size * 0.8, opacity: ghost ? 0.35 : 1 }}>{glyph[id] ?? '❔'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 3, borderStyle: 'dashed', borderColor: palette.slateLight },
});
