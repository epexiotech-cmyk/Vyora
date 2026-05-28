import type { ApiResponse, Customer, Product, InsertCustomer, InsertProduct } from '@vyora/types';

export type VyoraSystemAPI = {
  ping: () => Promise<string>;
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
    };
  }
}
