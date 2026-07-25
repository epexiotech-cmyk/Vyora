/// <reference types="node" />
import { spawnSync } from 'child_process';
import path from 'path';

const electronAppPath = path.resolve(__dirname, '../../apps/desktop');

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'electron', '.'],
  {
    cwd: electronAppPath,
    env: {
      ...process.env,
      DEV_UTILITY: 'query-new-product',
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  process.exit(1);
}

process.exit(result.status ?? 0);
