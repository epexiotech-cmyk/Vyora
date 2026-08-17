module.exports = {
  extends: ['./packages/config/eslint-preset.js'],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};
