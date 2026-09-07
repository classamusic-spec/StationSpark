const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    /*
     * ESLint does not read `.gitignore`, so this list has to repeat it for
     * anything that lands in the working tree.
     *
     * `npm run lint` reported 8,640 errors in minified vendor code because a
     * scratch export directory — `.a2-dist/`, ignored by git under `/.*-dist/`
     * and so invisible in `git status` — was still on disk and still walked.
     * A build output nobody can see is the worst kind: the lint script is clean
     * on a fresh clone, fails the moment anyone exports, and the difference
     * shows up in nothing either of them would think to look at.
     */
    ignores: [
      'dist/**',
      '*-dist/**',
      '.*-dist/**',
      'web-build/**',
      'node_modules/**',
      '.expo/**',
      'tools/**',
      'public/**',
      'coverage/**',
    ],
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
