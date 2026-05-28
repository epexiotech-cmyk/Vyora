module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier', 'import'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@vyora/*/src/*'],
            message:
              'Direct internal imports are not allowed. Please import from the package root instead.',
          },
        ],
      },
    ],
  },
  env: {
    node: true,
    browser: true,
    es2024: true,
  },
  ignorePatterns: ['node_modules/', 'dist/', '.next/', '.turbo/', 'build/', 'out/'],
};
