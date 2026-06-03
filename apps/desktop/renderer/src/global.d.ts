import type { ApiResponse, Customer, Product, InsertCustomer, InsertProduct } from '@vyora/types';

export type VyoraSystemAPI = {
  ping: () => Promise<string>;
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
    };
  }
}
