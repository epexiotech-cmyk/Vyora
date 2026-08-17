import * as path from 'path';

import { BrowserWindow, app } from 'electron';

export class MainWindow {
  public window: BrowserWindow | null = null;
  private isDev: boolean;

  constructor(isDev: boolean) {
    this.isDev = isDev;
  }

  public async create(onReady?: () => void) {
    const preloadPath = path.join(__dirname, 'preload.js');
    this.window = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      title: 'Vyora',
      icon: path.join(__dirname, '../assets/icons/Vyora Logo.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
        sandbox: true,
        additionalArguments: [`--is-packaged=${app.isPackaged}`],
      },
      show: false, // Show when ready to prevent flickering
    });

    // Disable Menu Bar in Production
    if (!this.isDev) {
      this.window.setMenuBarVisibility(false);
    }

    this.window.on('ready-to-show', () => {
      if (onReady) {
        onReady();
      }

      if (this.isDev) {
        // this.window?.webContents.openDevTools();
      }
    });

    if (this.isDev) {
      // In development, load from Next.js dev server
      const rendererPort = process.env.RENDERER_PORT || '3002';
      const rendererUrl = process.env.RENDERER_URL || `http://localhost:${rendererPort}`;
      await this.window.loadURL(rendererUrl);
    } else {
      // In production, load via custom protocol to support Next.js static export paths
      const appUrl = 'app://-/';
      await this.window.loadURL(appUrl);
    }

    this.window.on('closed', () => {
      this.window = null;
    });
  }
}
