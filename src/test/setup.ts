/* Jest setup: keep native modules quiet in unit tests. */
/*
 * These three resolve rather than returning undefined: `services/haptics.ts`
 * calls `.catch()` on every one of them, and jest-expo reports `Platform.OS`
 * as 'ios', so a render test that pops or wobbles really does go down that
 * path. A bare `jest.fn()` threw "Cannot read properties of undefined".
 */
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(async () => false),
}));
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
    volume: 1,
    loop: false,
  })),
  setAudioModeAsync: jest.fn(async () => {}),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
