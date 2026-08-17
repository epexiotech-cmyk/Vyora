const fs = require('fs');

const data = JSON.parse(
  fs.readFileSync('d:\\Epexio Project\\Vyora\\scripts\\ipc-results.json', 'utf8'),
);

const mainSet = new Map();
data.mainChannels.forEach((item) => mainSet.set(item.channel, item));

const rendererSet = new Map();
data.rendererChannels.forEach((item) => rendererSet.set(item.channel, item));

const allChannels = new Set([...mainSet.keys(), ...rendererSet.keys()]);

let markdown = `# IPC Audit Report\n\n`;
markdown += `This report compares IPC channels registered in the main process with those invoked by the renderer (including preload wrappers).\n\n`;

markdown += `## Complete Audit Table\n\n`;
markdown += `| Renderer Channel | Registered? | Registered As | File |\n`;
markdown += `|------------------|-------------|---------------|------|\n`;
for (const channel of Array.from(allChannels).sort()) {
  const main = mainSet.get(channel);
  const renderer = rendererSet.get(channel);

  if (renderer) {
    const mainStr = main ? `✅ Yes` : `❌ No`;
    const registeredAs = main ? `\`${main.channel}\`` : `-`;
    const fileStr = main ? `${main.file.split('\\').pop()}:${main.line}` : `-`;

    markdown += `| \`${channel}\` | ${mainStr} | ${registeredAs} | ${fileStr} |\n`;
  }
}

markdown += `\n## Channels registered in Main but NEVER invoked by Renderer\n\n`;
markdown += `| Channel | Registered File | Line |\n`;
markdown += `|---------|-----------------|------|\n`;
const missingInRenderer = [];
for (const channel of allChannels) {
  if (!rendererSet.has(channel)) {
    missingInRenderer.push(channel);
  }
}
missingInRenderer.forEach((ch) => {
  const item = mainSet.get(ch);
  markdown += `| \`${ch}\` | ${item.file.split('\\').pop()} | ${item.line} |\n`;
});

fs.writeFileSync(
  'C:\\Users\\Harsh Patel\\.gemini\\antigravity-ide\\brain\\07a18263-49b6-4e6d-b256-9bff6c122b50\\IPC_Audit_Report.md',
  markdown,
);
// eslint-disable-next-line no-console
console.log(
  'Report updated at C:\\Users\\Harsh Patel\\.gemini\\antigravity-ide\\brain\\07a18263-49b6-4e6d-b256-9bff6c122b50\\IPC_Audit_Report.md',
);
