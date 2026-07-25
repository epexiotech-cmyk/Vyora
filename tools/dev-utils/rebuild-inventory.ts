/// <reference types="node" />
import { spawn } from 'child_process';
import * as path from 'path';

const electronAppPath = path.resolve(__dirname, '../../apps/desktop');

const child = spawn('pnpm', ['exec', 'electron', '.'], {
  cwd: electronAppPath,
  env: {
    ...process.env,
    DEV_UTILITY: 'rebuild-inventory',
  },
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code: number | null) => {
  process.exit(code || 0);
});
