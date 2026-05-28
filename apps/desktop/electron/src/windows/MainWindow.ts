import * as path from 'path';

import { BrowserWindow } from 'electron';

export class MainWindow {
  public window: BrowserWindow | null = null;
  public splash: BrowserWindow | null = null;
  private isDev: boolean;

  constructor(isDev: boolean) {
    this.isDev = isDev;
  }

  public async create() {
    // Create Splash Screen
    this.splash = new BrowserWindow({
      width: 500,
      height: 300,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      icon: path.join(__dirname, '../assets/icons/icon.png'),
    });

    await this.splash.loadFile(path.join(__dirname, '../assets/splash.html'));

    // Create Main Window
    this.window = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      title: 'Vyora',
      icon: path.join(__dirname, '../assets/icons/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        sandbox: true,
      },
      show: false, // Show when ready to prevent flickering
    });

    // Disable Menu Bar in Production
    if (!this.isDev) {
      this.window.setMenuBarVisibility(false);
    }

    this.window.on('ready-to-show', () => {
      this.splash?.destroy();
      this.window?.show();

      if (this.isDev) {
        // this.window?.webContents.openDevTools();
      }
    });

    if (this.isDev) {
      // In development, load from Next.js dev server
      const rendererUrl = process.env.RENDERER_URL || 'http://localhost:3000';
      await this.window.loadURL(rendererUrl);
    } else {
      // In production, load the static Next.js output
      const appPath = path.join(__dirname, '../renderer/out/index.html');
      await this.window.loadFile(appPath);
    }

    this.window.on('closed', () => {
      this.window = null;
    });
  }
}
