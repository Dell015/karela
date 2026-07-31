// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // React Three Fiber files use JSX props that ESLint doesn't recognize
    files: ['**/AniModel.tsx', '**/character_creation.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
