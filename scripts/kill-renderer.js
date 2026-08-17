const { execSync } = require('child_process');

try {
  if (process.platform === 'win32') {
    const output = execSync(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name = \'node.exe\'\\" | Select-Object ProcessId, CommandLine | ConvertTo-Json"',
      { encoding: 'utf8' },
    );
    if (output && output.trim()) {
      const processes = JSON.parse(output);
      const arr = Array.isArray(processes) ? processes : [processes];
      for (const p of arr) {
        if (
          p &&
          p.CommandLine &&
          (p.CommandLine.includes('apps\\desktop\\renderer') ||
            p.CommandLine.includes('apps/desktop/renderer'))
        ) {
          try {
            execSync(`taskkill /F /T /PID ${p.ProcessId}`, { stdio: 'ignore' });
          } catch {
            // Ignore individual kill failures
          }
        }
      }
    }
  } else {
    // Unix fallback
    const output = execSync('ps aux | grep node', { encoding: 'utf8' });
    const lines = output.split('\n');
    for (const line of lines) {
      if (
        (line.includes('apps/desktop/renderer') || line.includes('next-server')) &&
        !line.includes('grep')
      ) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        if (pid && !isNaN(pid)) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch {
            // Ignore individual kill failures
          }
        }
      }
    }
  }
} catch {
  // Gracefully ignore failures
}
