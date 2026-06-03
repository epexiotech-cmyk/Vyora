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
      create: (data: Omit<InsertCustomer, 'id' | 'createdAt' | 'companyId'>) =>
        ipcRenderer.invoke('db:customers:create', data),
    },
    products: {
      getAll: () => ipcRenderer.invoke('db:products:getAll'),
      create: (data: Omit<InsertProduct, 'id' | 'createdAt'>) =>
        ipcRenderer.invoke('db:products:create', data),
    },
  },
  bootstrap: {
    status: () => ipcRenderer.invoke('bootstrap:status'),
    createCompany: (data: {
      name: string;
      isGstRegistered: boolean;
      gstin: string | null;
      financialYearStart: Date;
      currency: string;
    }) => ipcRenderer.invoke('bootstrap:create-company', data),
  },
  company: {
    getActive: () => ipcRenderer.invoke('company:get-active'),
    setActive: (id: string) => ipcRenderer.invoke('company:set-active', id),
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
    create: (
      data: Omit<InsertCustomer, 'id' | 'createdAt' | 'companyId'>,
    ) => Promise<ApiResponse<Customer>>;
  };
  products: {
    getAll: () => Promise<ApiResponse<Product[]>>;
    create: (data: Omit<InsertProduct, 'id' | 'createdAt'>) => Promise<ApiResponse<Product>>;
  };
};

export type VyoraBootstrapAPI = {
  status: () => Promise<ApiResponse<boolean>>;
  createCompany: (data: {
    name: string;
    isGstRegistered: boolean;
    gstin: string | null;
    financialYearStart: Date;
    currency: string;
  }) => Promise<ApiResponse<string>>;
};

export type VyoraCompanyAPI = {
  getActive: () => Promise<ApiResponse<string | null>>;
  setActive: (id: string) => Promise<ApiResponse<void>>;
};

declare global {
  interface Window {
    vyora: {
      system: VyoraSystemAPI;
      db: VyoraDatabaseAPI;
      bootstrap: VyoraBootstrapAPI;
      company: VyoraCompanyAPI;
      splash: VyoraSplashAPI;
    };
  }
}
