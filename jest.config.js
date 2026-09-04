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
  setupFiles: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: ['src/learning/**/*.ts', 'src/machines/**/*.ts', 'src/content/**/*.ts'],
};
