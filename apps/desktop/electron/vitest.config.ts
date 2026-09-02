import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    server: {
      deps: {
        inline: [/@vyora\/.*/],
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js', '.json', '.node'],
  },
});
