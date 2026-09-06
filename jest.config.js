/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@shopify/react-native-skia|react-native-reanimated|react-native-worklets|react-native-gesture-handler|xstate|@xstate/.*|zustand)',
  ],
  /*
   * Render tests need Reanimated, and importing it under jest-expo's default
   * 'ios' platform resolves `react-native-worklets`' NATIVE module, which then
   * throws on a missing JSI binding before a single component draws. Worklets
   * ships this resolver for exactly that: it drops the `.native` extension for
   * its own files only, so Reanimated loads its Jest-safe path. Everything else
   * still resolves the way Metro would.
   */
  resolver: '<rootDir>/node_modules/react-native-worklets/jest/resolver.js',
  setupFiles: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: ['src/learning/**/*.ts', 'src/machines/**/*.ts', 'src/content/**/*.ts'],
};
