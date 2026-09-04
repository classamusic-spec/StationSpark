const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'web-build/*', 'node_modules/*', '.expo/*', 'tools/*', 'public/*', 'coverage/*'],
  },
  {
    rules: {
      'import/no-unresolved': 'off',
      // Reanimated shared values are mutated via `.value =` by design; the React
      // Compiler immutability/refs rules misread them as React state.
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
];
