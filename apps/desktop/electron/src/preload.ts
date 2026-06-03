import type { InsertCustomer, InsertProduct, ApiResponse, Customer, Product } from '@vyora/types';
import { contextBridge, ipcRenderer } from 'electron';

// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld('vyora', {
  system: {
    ping: () => ipcRenderer.invoke('system:ping'),
  },
  db: {
    customers: {
      getAll: () => ipcRenderer.invoke('db:customers:getAll'),
      create: (data: Omit<InsertCustomer, 'id' | 'createdAt'>) =>
        ipcRenderer.invoke('db:customers:create', data),
    },
    products: {
      getAll: () => ipcRenderer.invoke('db:products:getAll'),
      create: (data: Omit<InsertProduct, 'id' | 'createdAt'>) =>
        ipcRenderer.invoke('db:products:create', data),
    },
  },
  splash: {
    finished: () => ipcRenderer.send('splash-finished'),
  },
});

export type VyoraSystemAPI = {
  ping: () => Promise<string>;
};

export type VyoraSplashAPI = {
  finished: () => void;
};

export type VyoraDatabaseAPI = {
  customers: {
    getAll: () => Promise<ApiResponse<Customer[]>>;
    create: (data: Omit<InsertCustomer, 'id' | 'createdAt'>) => Promise<ApiResponse<Customer>>;
  };
  products: {
    getAll: () => Promise<ApiResponse<Product[]>>;
    create: (data: Omit<InsertProduct, 'id' | 'createdAt'>) => Promise<ApiResponse<Product>>;
  };
};

declare global {
  interface Window {
    vyora: {
      system: VyoraSystemAPI;
      db: VyoraDatabaseAPI;
      splash: VyoraSplashAPI;
    };
  }
}
