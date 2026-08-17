const { spawn } = require('child_process');
const env = Object.assign({}, process.env, { RENDERER_PORT: '3002' });

const child = spawn('npx', ['turbo', 'run', 'dev', '--filter=!renderer'], {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
