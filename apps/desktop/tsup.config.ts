import { defineConfig } from 'tsup';

import pkg from './package.json';

const external = [
  'electron',
  'better-sqlite3',
  'better-sqlite3-multiple-ciphers',
  'keytar',
  'argon2',
  'pdfmake',
];

export default defineConfig({
  entry: ['electron/src/main.ts', 'electron/src/preload.ts'],
  outDir: 'dist-electron',
  format: ['cjs'],
  target: 'node20',
  clean: true,
  external,
  noExternal: Object.keys(pkg.dependencies || {}).filter((dep) => !external.includes(dep)),
});
