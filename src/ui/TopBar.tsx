import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { spacing } from '@/theme';
import { RoundIconButton } from './RoundIconButton';
import { BackIcon } from './icons';

export interface TopBarProps {
  /** show a back button (default true unless `left` provided) */
  back?: boolean;
  onBack?: () => void;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

/** Corner controls row that sits over the sky. Absolutely positioned; safe-area aware. */
export function TopBar({ back = true, onBack, left, center, right }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <View pointerEvents="box-none" style={[styles.row, { top: insets.top + spacing.xs }]}>
      <View style={styles.side}>{left ?? (back ? <RoundIconButton accessibilityLabel="Back" onPress={goBack}><BackIcon /></RoundIconButton> : null)}</View>
      <View style={styles.center} pointerEvents="box-none">
        {center}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 50,
  },
  side: { width: 64, alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
});
