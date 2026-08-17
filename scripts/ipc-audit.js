const fs = require('fs');
const path = require('path');

function walkDir(dir, filterExt, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, filterExt, callback);
    } else if (fullPath.endsWith(filterExt) || filterExt === '') {
      callback(fullPath);
    }
  }
}

const mainChannels = [];
const rendererChannels = [];

walkDir('d:\\Epexio Project\\Vyora\\apps\\desktop\\electron\\src', '.ts', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');

  // Find both ipcMain.handle(...) and createIpcHandler(...)
  const regex = /(?:ipcMain\.handle|createIpcHandler(?:<[^>]+>)?)\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const prefix = content.substring(0, match.index);
    const line = prefix.split('\n').length;
    mainChannels.push({ channel: match[1], file: filePath, line });
  }
});

walkDir('d:\\Epexio Project\\Vyora\\apps\\desktop\\renderer\\src', '.ts', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /electron\.invoke\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const prefix = content.substring(0, match.index);
    const line = prefix.split('\n').length;
    rendererChannels.push({ channel: match[1], file: filePath, line });
  }
});
walkDir('d:\\Epexio Project\\Vyora\\apps\\desktop\\renderer\\src', '.tsx', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /electron\.invoke\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const prefix = content.substring(0, match.index);
    const line = prefix.split('\n').length;
    rendererChannels.push({ channel: match[1], file: filePath, line });
  }
});

const preloadPath = 'd:\\Epexio Project\\Vyora\\apps\\desktop\\electron\\src\\preload.ts';
const preloadChannels = [];
if (fs.existsSync(preloadPath)) {
  const content = fs.readFileSync(preloadPath, 'utf8');
  const lines = content.split('\n');
  let currentKey = null;
  lines.forEach((line, index) => {
    const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+):\s*(?:async\s*)?\(/);
    if (keyMatch) {
      currentKey = keyMatch[1];
    }
    const invokeMatch = line.match(/ipcRenderer\.invoke\(\s*['"`]([^'"`]+)['"`]/);
    if (invokeMatch) {
      preloadChannels.push({
        key: currentKey || 'unknown',
        channel: invokeMatch[1],
        file: preloadPath,
        line: index + 1,
      });
      rendererChannels.push({ channel: invokeMatch[1], file: preloadPath, line: index + 1 });
    }
  });
}

fs.writeFileSync(
  'd:\\Epexio Project\\Vyora\\scripts\\ipc-results.json',
  JSON.stringify({ mainChannels, rendererChannels, preloadChannels }, null, 2),
);

// eslint-disable-next-line no-console
console.log('Done parsing again!');
