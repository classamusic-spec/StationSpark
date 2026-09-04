import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let enabled = true;
const canHaptic = Platform.OS === 'ios' || Platform.OS === 'android';

const safe = (fn: () => Promise<void>) => {
  if (!enabled || !canHaptic) return;
  fn().catch(() => {});
};

/** Physical feedback vocabulary — pair each with a matching sfx. */
export const haptics = {
  setEnabled: (v: boolean) => {
    enabled = v;
  },
  isEnabled: () => enabled,
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => safe(() => Haptics.selectionAsync()),
  drop: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  thud: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** gentle — used for "try again", deliberately not the Error type */
  nudge: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  /** rhythmic burst for celebrations */
  celebrate: () => {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setTimeout(() => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)), 120);
    setTimeout(() => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 260);
  },
};
