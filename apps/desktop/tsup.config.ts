import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['electron/src/main.ts', 'electron/src/preload.ts'],
  outDir: 'dist-electron',
  format: ['cjs'],
  target: 'node20',
  clean: true,
  external: ['electron', 'better-sqlite3'],
  noExternal: ['@vyora/database', '@vyora/types'], // Bundle workspace packages
});
