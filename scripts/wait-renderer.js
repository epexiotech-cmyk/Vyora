const net = require('net');

const port = process.env.RENDERER_PORT || 3002;
const timeout = 60000; // 60 seconds
const start = Date.now();

// eslint-disable-next-line no-console
console.log(`Waiting for renderer on port ${port}...`);

function check() {
  const socket = new net.Socket();
  socket.setTimeout(1000);
  socket.on('connect', () => {
    socket.destroy();
    process.exit(0);
  });
  socket.on('timeout', () => {
    socket.destroy();
    retry();
  });
  socket.on('error', () => {
    socket.destroy();
    retry();
  });
  socket.connect(port, '127.0.0.1');
}

function retry() {
  if (Date.now() - start > timeout) {
    console.error(`Timeout waiting for renderer on port ${port}`);
    process.exit(1);
  }
  setTimeout(check, 500);
}

check();
