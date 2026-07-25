/// <reference types="node" />
import { spawn } from 'child_process';
import * as path from 'path';

const electronAppPath = path.resolve(__dirname, '../../apps/desktop');

/* eslint-disable no-console */
console.log('\n======================================================');
console.log('                 DEVELOPER UTILITY                  ');
console.log('======================================================');
console.log('WARNING: You are performing a HARD RESET on transactions.');
console.log('Raw DELETE statements against individual transactional');
console.log('tables corrupt derived data (like inventory balances).');
console.log('This utility safely clears ALL transactions in the');
console.log('correct order to maintain referential integrity.');
console.log('======================================================\n');

const child = spawn('pnpm', ['exec', 'electron', '.'], {
  cwd: electronAppPath,
  env: {
    ...process.env,
    DEV_UTILITY: 'reset-transactions',
  },
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code: number | null) => {
  process.exit(code || 0);
});
