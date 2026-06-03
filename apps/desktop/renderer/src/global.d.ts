import type {
  ApiResponse,
  CustomerDto,
  CreateCustomerInput,
  ProductDto,
  CreateProductInput,
} from '@vyora/types';

export type VyoraSystemAPI = {
  ping: () => Promise<string>;
};

export type VyoraDatabaseAPI = {
  customers: {
    getAll: () => Promise<ApiResponse<CustomerDto[]>>;
    create: (data: CreateCustomerInput) => Promise<ApiResponse<CustomerDto>>;
  };
  products: {
    getAll: () => Promise<ApiResponse<ProductDto[]>>;
    create: (data: CreateProductInput) => Promise<ApiResponse<ProductDto>>;
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
