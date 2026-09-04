import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '@/theme';
import { Text } from '@/ui/Text';
import type { CharacterPortraitProps } from './types';

const colors: Record<string, string> = {
  rookie: palette.engineRed,
  beacon: palette.waterCyan,
  bea: palette.navy,
  pepper: palette.white,
  npc: palette.orange,
};

/**
 * STUB — replaced by the real SVG rigs (characters work). Keep the props API.
 */
export function CharacterPortrait({ id, size = 72 }: CharacterPortraitProps) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors[id] ?? palette.slate }]}>
      <Text variant="h2" color={id === 'pepper' ? palette.navy : palette.white}>
        {id.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
});
