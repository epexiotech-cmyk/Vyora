'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.MainWindow = void 0;
const path = __importStar(require('path'));
const electron_1 = require('electron');
class MainWindow {
  window = null;
  splash = null;
  isDev;
  constructor(isDev) {
    this.isDev = isDev;
  }
  async create() {
    // Create Splash Screen
    this.splash = new electron_1.BrowserWindow({
      width: 500,
      height: 300,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      icon: path.join(__dirname, '../../assets/icons/icon.png'),
    });
    await this.splash.loadFile(path.join(__dirname, '../../assets/splash.html'));
    // Create Main Window
    this.window = new electron_1.BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      title: 'Vyora',
      icon: path.join(__dirname, '../../assets/icons/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js'),
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
      const appPath = path.join(__dirname, '../../renderer/out/index.html');
      await this.window.loadFile(appPath);
    }
    this.window.on('closed', () => {
      this.window = null;
    });
  }
}
exports.MainWindow = MainWindow;
