/**
 * AVATAR PICKERS — skin, hair and helmet as rows of glossy swatches.
 * Every tap changes the Rookie standing in the room straight away.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hit, palette, spacing } from '@/theme';
import type { Avatar } from '@/state/store';
import { Text } from '@/ui';
import { hairTones, helmetTones, skinTones } from '@/characters/rig/palettes';
import { GlossSwatch } from './GlossSwatch';

const SKINS: Avatar['skin'][] = ['peach', 'tan', 'brown', 'deep'];
const HAIRS: Avatar['hair'][] = ['dark', 'brown', 'blonde', 'red', 'black-curly'];
const HELMETS: Avatar['helmet'][] = ['red', 'yellow', 'blue', 'pink'];

const SKIN_LABEL: Record<Avatar['skin'], string> = { peach: 'peach', tan: 'tan', brown: 'brown', deep: 'deep brown' };
const HAIR_LABEL: Record<Avatar['hair'], string> = { dark: 'dark', brown: 'brown', blonde: 'blonde', red: 'red', 'black-curly': 'black curly' };

function PickerRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text variant="buttonSmall" color={palette.navy} style={styles.title}>
        {title}
      </Text>
      <View style={styles.swatches}>{children}</View>
    </View>
  );
}

export function AvatarPickers({ avatar, onChange, compact }: { avatar: Avatar; onChange: (a: Partial<Avatar>) => void; compact?: boolean }) {
  const size = compact ? 48 : hit.min;
  return (
    <View style={styles.pickers}>
      <PickerRow title="Skin">
        {SKINS.map((s) => (
          <GlossSwatch key={s} size={size} color={skinTones[s].base} label={`Skin: ${SKIN_LABEL[s]}`} active={avatar.skin === s} onPress={() => onChange({ skin: s })} />
        ))}
      </PickerRow>
      <PickerRow title="Hair">
        {HAIRS.map((h) => (
          <GlossSwatch key={h} size={size} color={hairTones[h].base} label={`Hair: ${HAIR_LABEL[h]}`} active={avatar.hair === h} onPress={() => onChange({ hair: h })} />
        ))}
      </PickerRow>
      <PickerRow title="Helmet">
        {HELMETS.map((h) => (
          <GlossSwatch key={h} size={size} color={helmetTones[h].base} label={`Helmet: ${h}`} active={avatar.helmet === h} onPress={() => onChange({ helmet: h })} />
        ))}
      </PickerRow>
    </View>
  );
}

const styles = StyleSheet.create({
  pickers: { gap: spacing.xs },
  row: { gap: 2 },
  title: { includeFontPadding: false },
  swatches: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', alignItems: 'center' },
});
