import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerProfileDto,
  CustomerListDto,
  CreateProductInput,
  ApiResponse,
  ProductDto,
  CreateSalesInvoiceInput,
  FinancialYearDto,
  SalesInvoiceDto,
  ListSalesInvoicesOptions,
  UpdateSalesInvoiceInput,
  PincodeDTO,
  SmartPincodeLookupResponse,
  CompanyProfileDto,
  UpdateCompanyProfileRequest,
} from '@vyora/types';
import { contextBridge, ipcRenderer } from 'electron';
import type { PrintToPDFOptions, WebContentsPrintOptions } from 'electron';

// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld('vyora', {
  system: {
    ping: () => ipcRenderer.invoke('system:ping'),
  },
  db: {
    customers: {
      search: (options: SearchCustomersOptions) =>
        ipcRenderer.invoke('db:customers:search', options),
      getById: (id: string) => ipcRenderer.invoke('db:customers:getById', id),
      create: (data: CreateCustomerInput) => ipcRenderer.invoke('db:customers:create', data),
      update: (id: string, data: UpdateCustomerInput) =>
        ipcRenderer.invoke('db:customers:update', id, data),
      deactivate: (id: string) => ipcRenderer.invoke('db:customers:deactivate', id),
    },
    taxes: {
      getAll: () => ipcRenderer.invoke('db:taxes:getAll'),
    },
    products: {
      getAll: () => ipcRenderer.invoke('db:products:getAll'),
      create: (data: CreateProductInput) => ipcRenderer.invoke('db:products:create', data),
    },
    sales: {
      createInvoice: (data: CreateSalesInvoiceInput) =>
        ipcRenderer.invoke('sales:invoice:create', data),
      updateDraft: (invoiceId: string, payload: UpdateSalesInvoiceInput) =>
        ipcRenderer.invoke('sales:invoice:updateDraft', invoiceId, payload),
      submitInvoice: (invoiceId: string) => ipcRenderer.invoke('sales:invoice:submit', invoiceId),
      cancelInvoice: (invoiceId: string) => ipcRenderer.invoke('sales:invoice:cancel', invoiceId),
      getById: (invoiceId: string) => ipcRenderer.invoke('sales:invoice:getById', invoiceId),
      list: (options?: ListSalesInvoicesOptions) =>
        ipcRenderer.invoke('sales:invoice:list', options),
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
    getProfile: (id: string) => ipcRenderer.invoke('company:get-profile', id),
    updateProfile: (id: string, payload: UpdateCompanyProfileRequest) =>
      ipcRenderer.invoke('company:update-profile', id, payload),
  },
  financialYear: {
    getCurrent: () => ipcRenderer.invoke('financial-year:get-current'),
  },
  splash: {
    finished: () => ipcRenderer.send('splash-finished'),
  },
  print: {
    exportPdf: (html: string, options?: PrintToPDFOptions) =>
      ipcRenderer.invoke('print:export-pdf', html, options),
    print: (html: string, options?: WebContentsPrintOptions) =>
      ipcRenderer.invoke('print:print', html, options),
  },
  directories: {
    pincode: {
      get: (pincode: string) => ipcRenderer.invoke('directory:pincode:get', pincode),
      smartLookup: (pincode: string) =>
        ipcRenderer.invoke('directory:pincode:smartLookup', pincode),
      search: (query: { pincode?: string; district?: string; state?: string }) =>
        ipcRenderer.invoke('directory:pincode:search', query),
    },
    country: {
      get: (code: string) => ipcRenderer.invoke('directory:country:get', code),
      search: (query: string) => ipcRenderer.invoke('directory:country:search', query),
    },
    currency: {
      get: (code: string) => ipcRenderer.invoke('directory:currency:get', code),
      search: (query: string) => ipcRenderer.invoke('directory:currency:search', query),
    },
    state: {
      get: (code: string) => ipcRenderer.invoke('directory:state:get', code),
      search: (query: string) => ipcRenderer.invoke('directory:state:search', query),
    },
    uqc: {
      getByCode: (code: string) => ipcRenderer.invoke('directory:uqc:get', code),
      search: (query: string) => ipcRenderer.invoke('directory:uqc:search', query),
    },
    hsn: {
      getByCode: (code: string) => ipcRenderer.invoke('directory:hsn:get', code),
      search: (query: string, limit?: number) =>
        ipcRenderer.invoke('directory:hsn:search', query, limit),
    },
    sac: {
      getByCode: (code: string) => ipcRenderer.invoke('directory:sac:get', code),
      search: (query: string, includeAll?: boolean) =>
        ipcRenderer.invoke('directory:sac:search', query, includeAll),
    },
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
    search: (options: SearchCustomersOptions) => Promise<ApiResponse<CustomerListDto>>;
    getById: (id: string) => Promise<ApiResponse<CustomerProfileDto | null>>;
    create: (data: CreateCustomerInput) => Promise<ApiResponse<CustomerProfileDto>>;
    update: (id: string, data: UpdateCustomerInput) => Promise<ApiResponse<CustomerProfileDto>>;
    deactivate: (id: string) => Promise<ApiResponse<void>>;
  };
  taxes: {
    getAll: () => Promise<ApiResponse<import('@vyora/types').TaxDto[]>>;
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
  getProfile: (id: string) => Promise<ApiResponse<CompanyProfileDto | null>>;
  updateProfile: (
    id: string,
    payload: UpdateCompanyProfileRequest,
  ) => Promise<ApiResponse<CompanyProfileDto>>;
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

export interface VyoraDirectoriesAPI {
  pincode: {
    get(pincode: string): Promise<PincodeDTO | null>;
    smartLookup(pincode: string): Promise<SmartPincodeLookupResponse>;
    search(query: { pincode?: string; district?: string; state?: string }): Promise<PincodeDTO[]>;
  };
  country: {
    getByCode(code: string): Promise<unknown>;
    search(query: string): Promise<unknown>;
  };
  currency: {
    getByCode(code: string): Promise<unknown>;
    search(query: string): Promise<unknown>;
  };
  state: {
    getByCode(code: string): Promise<unknown>;
    search(query: string): Promise<unknown>;
  };
  uqc: {
    getByCode(code: string): Promise<unknown>;
    search(query: string): Promise<unknown>;
  };
  hsn: {
    getByCode(code: string): Promise<unknown>;
    search(query: string, limit?: number): Promise<unknown>;
  };
  sac: {
    getByCode(code: string): Promise<unknown>;
    search(query: string, includeAll?: boolean): Promise<unknown>;
  };
}

declare global {
  interface Window {
    vyora: {
      system: VyoraSystemAPI;
      db: VyoraDatabaseAPI;
      bootstrap: VyoraBootstrapAPI;
      company: VyoraCompanyAPI;
      financialYear: VyoraFinancialYearAPI;
      splash: VyoraSplashAPI;
      print: VyoraPrintAPI;
      directories: VyoraDirectoriesAPI;
    };
  }
}
