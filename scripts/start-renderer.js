const { spawn } = require('child_process');
const path = require('path');

const port = process.env.RENDERER_PORT || 3002;
const env = Object.assign({}, process.env, { PORT: port });

const child = spawn('pnpm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../apps/desktop/renderer'),
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
