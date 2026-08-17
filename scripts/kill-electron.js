const { exec } = require('child_process');
const platform = process.platform;
const cmd = platform === 'win32' ? 'taskkill /F /IM electron.exe /T' : 'killall electron';
exec(cmd, () => {}); // Ignore failures gracefully
