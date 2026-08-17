import * as path from 'path';

import { BrowserWindow } from 'electron';

export class SplashWindow {
  public window: BrowserWindow | null = null;

  public async create() {
    const preloadPath = path.join(__dirname, 'preload.js');
    this.window = new BrowserWindow({
      width: 900,
      height: 600,
      transparent: true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      center: true,
      skipTaskbar: true,
      show: false, // Prevent white flash initially
      icon: path.join(__dirname, '../assets/icons/Vyora Logo.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
        sandbox: true,
      },
    });

    this.window.once('ready-to-show', () => {
      this.window?.show();
    });

    await this.window.loadFile(path.join(__dirname, '../assets/splash.html'));
  }

  public fadeOutAndClose() {
    if (!this.window || this.window.isDestroyed()) return;

    let opacity = 1;
    const interval = setInterval(() => {
      if (!this.window || this.window.isDestroyed() || opacity <= 0) {
        clearInterval(interval);
        if (this.window && !this.window.isDestroyed()) {
          this.window.destroy();
        }
        this.window = null;
      } else {
        try {
          this.window.setOpacity(opacity);
          opacity -= 0.05;
        } catch {
          clearInterval(interval);
        }
      }
    }, 20); // Smooth fade out over ~400ms
  }
}
