"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/src/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("vyora", {
  system: {
    ping: () => import_electron.ipcRenderer.invoke("system:ping")
  },
  db: {
    customers: {
      getAll: () => import_electron.ipcRenderer.invoke("db:customers:getAll"),
      create: (data) => import_electron.ipcRenderer.invoke("db:customers:create", data)
    },
    products: {
      getAll: () => import_electron.ipcRenderer.invoke("db:products:getAll"),
      create: (data) => import_electron.ipcRenderer.invoke("db:products:create", data)
    }
  }
});
