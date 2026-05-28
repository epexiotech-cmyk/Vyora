'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const electron_1 = require('electron');
// Expose a secure API to the renderer process
electron_1.contextBridge.exposeInMainWorld('vyora', {
  system: {
    ping: () => electron_1.ipcRenderer.invoke('system:ping'),
  },
});
