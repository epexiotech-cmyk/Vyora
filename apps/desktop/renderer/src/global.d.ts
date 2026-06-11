import type {
  ApiResponse,
  CustomerProfileDto,
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerListDto,
  ProductDto,
  CreateProductInput,
  CreateSalesInvoiceInput,
  FinancialYearDto,
  SalesInvoiceDto,
  ListSalesInvoicesOptions,
  UpdateSalesInvoiceInput,
  PincodeDTO,
  PincodeSearchResponse,
  SmartPincodeLookupResponse,
} from '@vyora/types';
import type { PrintToPDFOptions, WebContentsPrintOptions } from 'electron';

export type VyoraSystemAPI = {
  ping: () => Promise<string>;
};

export type VyoraDatabaseAPI = {
  customers: {
    search: (options: SearchCustomersOptions) => Promise<ApiResponse<CustomerListDto>>;
    getById: (id: string) => Promise<ApiResponse<CustomerProfileDto | null>>;
    create: (data: CreateCustomerInput) => Promise<ApiResponse<CustomerProfileDto>>;
    update: (id: string, data: UpdateCustomerInput) => Promise<ApiResponse<CustomerProfileDto>>;
    deactivate: (id: string) => Promise<ApiResponse<void>>;
  };
  products: {
    getAll: () => Promise<ApiResponse<ProductDto[]>>;
    create: (data: CreateProductInput) => Promise<ApiResponse<ProductDto>>;
  };
  sales: {
    createInvoice: (data: CreateSalesInvoiceInput) => Promise<ApiResponse<{ invoiceId: string }>>;
    updateDraft: (
      invoiceId: string,
      payload: UpdateSalesInvoiceInput,
    ) => Promise<ApiResponse<SalesInvoiceDto>>;
    submitInvoice: (invoiceId: string) => Promise<ApiResponse<{ warnings: unknown[] }>>;
    cancelInvoice: (invoiceId: string) => Promise<ApiResponse<void>>;
    getById: (invoiceId: string) => Promise<ApiResponse<SalesInvoiceDto>>;
    list: (options?: ListSalesInvoicesOptions) => Promise<ApiResponse<SalesInvoiceDto[]>>;
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
  getProfile: (id: string) => Promise<ApiResponse<import('@vyora/types').CompanyProfileDto | null>>;
  updateProfile: (
    id: string,
    payload: import('@vyora/types').UpdateCompanyProfileRequest,
  ) => Promise<ApiResponse<import('@vyora/types').CompanyProfileDto>>;
};

export type VyoraFinancialYearAPI = {
  getCurrent: () => Promise<ApiResponse<FinancialYearDto | null>>;
};

export type VyoraPrintAPI = {
  exportPdf: (html: string, options?: PrintToPDFOptions) => Promise<{ filePath: string }>;
  print: (
    html: string,
    options?: WebContentsPrintOptions,
  ) => Promise<{ success: boolean; failureReason?: string }>;
};

export type VyoraSplashAPI = {
  finished: () => void;
};

export type VyoraDirectoriesAPI = {
  pincode: {
    get: (pincode: string) => Promise<ApiResponse<PincodeDTO | null>>;
    smartLookup: (pincode: string) => Promise<SmartPincodeLookupResponse>;
    search: (query: {
      pincode?: string;
      district?: string;
      state?: string;
    }) => Promise<ApiResponse<PincodeSearchResponse>>;
  };
  country: {
    get: (code: string) => Promise<ApiResponse<unknown>>;
    search: (query: string) => Promise<ApiResponse<unknown>>;
  };
  currency: {
    get: (code: string) => Promise<ApiResponse<unknown>>;
    search: (query: string) => Promise<ApiResponse<unknown>>;
  };
  state: {
    get: (code: string) => Promise<ApiResponse<unknown>>;
    search: (query: string) => Promise<ApiResponse<unknown>>;
  };
  uqc: {
    getByCode: (code: string) => Promise<ApiResponse<unknown>>;
    search: (query: string) => Promise<ApiResponse<unknown>>;
  };
  hsn: {
    getByCode: (code: string) => Promise<ApiResponse<unknown>>;
    search: (query: string, limit?: number) => Promise<ApiResponse<unknown>>;
  };
  sac: {
    getByCode: (code: string) => Promise<ApiResponse<unknown>>;
    search: (query: string, includeAll?: boolean) => Promise<ApiResponse<unknown>>;
  };
};

declare global {
  interface Window {
    vyora: {
      system: VyoraSystemAPI;
      db: VyoraDatabaseAPI;
      bootstrap: VyoraBootstrapAPI;
      company: VyoraCompanyAPI;
      financialYear: VyoraFinancialYearAPI;
      print: VyoraPrintAPI;
      splash: VyoraSplashAPI;
      directories: VyoraDirectoriesAPI;
    };
  }
}
