/**
 * SIGN BOARD — the one plaque treatment (consistency rule 10): a cream face on
 * a tan edge. Hang it from two ropes, stand it on two wooden posts, or use it
 * bare as a title plate. Text goes in as children so labels never truncate.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette, radii, shadows, spacing } from '@/theme';

export interface SignBoardProps {
  children: React.ReactNode;
  /** two wooden posts under the board (a yard sign) */
  posts?: boolean;
  /** two ropes above the board (a hanging sign) */
  hang?: boolean;
  /** tighter padding for a title plate in a top bar */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SignBoard({ children, posts = false, hang = false, compact = false, style }: SignBoardProps) {
  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      {hang ? (
        <View style={styles.ropes} pointerEvents="none">
          <View style={styles.rope} />
          <View style={styles.rope} />
        </View>
      ) : null}
      <View style={[styles.edge, shadows.soft]}>
        <View style={[styles.face, compact && styles.faceCompact]}>{children}</View>
      </View>
      {posts ? (
        <View style={styles.posts} pointerEvents="none">
          <View style={styles.post}>
            <View style={styles.postShade} />
          </View>
          <View style={styles.post}>
            <View style={styles.postShade} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', alignSelf: 'flex-start' },
  ropes: { flexDirection: 'row', gap: 44, marginBottom: -2 },
  rope: { width: 4, height: 16, borderRadius: 2, backgroundColor: palette.woodDark },
  edge: { backgroundColor: palette.tanDark, borderRadius: radii.tile, paddingBottom: 4 },
  face: {
    backgroundColor: palette.cream,
    borderRadius: radii.tile,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  faceCompact: { paddingHorizontal: spacing.sm, paddingVertical: 6 },
  posts: { flexDirection: 'row', gap: 56, marginTop: -2 },
  post: { width: 10, height: 26, borderRadius: 3, backgroundColor: palette.wood, overflow: 'hidden' },
  postShade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: 'rgba(31,42,90,0.14)' },
});
