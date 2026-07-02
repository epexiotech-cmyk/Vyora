import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerProfileDto,
  CustomerListDto,
  CreateProductInput,
  UpdateProductInput,
  SearchProductsOptions,
  ProductListDto,
  ApiResponse,
  ProductDto,
  CreatePurchaseInput,
  UpdatePurchaseInput,
  SearchPurchasesOptions,
  PurchaseListDto,
  PurchaseDto,
  CreateSalesInvoiceInput,
  FinancialYearDto,
  SalesInvoiceDto,
  ListSalesInvoicesOptions,
  UpdateSalesInvoiceInput,
  SupplierProfileDto,
  CreateSupplierInput,
  UpdateSupplierInput,
  SearchSuppliersOptions,
  SupplierListDto,
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
    suppliers: {
      search: (options: SearchSuppliersOptions) =>
        ipcRenderer.invoke('db:suppliers:search', options),
      getById: (id: string) => ipcRenderer.invoke('db:suppliers:getById', id),
      create: (data: CreateSupplierInput) => ipcRenderer.invoke('db:suppliers:create', data),
      update: (id: string, data: UpdateSupplierInput) =>
        ipcRenderer.invoke('db:suppliers:update', id, data),
      deactivate: (id: string) => ipcRenderer.invoke('db:suppliers:deactivate', id),
    },
    taxes: {
      getAll: () => ipcRenderer.invoke('db:taxes:getAll'),
    },
    units: {
      getAll: () => ipcRenderer.invoke('db:units:getAll'),
      search: (options: import('@vyora/types').SearchUnitsOptions) =>
        ipcRenderer.invoke('db:units:search', options),
      getById: (id: string) => ipcRenderer.invoke('db:units:getById', id),
      create: (data: import('@vyora/types').CreateUnitInput) =>
        ipcRenderer.invoke('db:units:create', data),
      update: (id: string, data: import('@vyora/types').UpdateUnitInput) =>
        ipcRenderer.invoke('db:units:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:units:delete', id),
    },
    products: {
      getAll: () => ipcRenderer.invoke('db:products:getAll'),
      search: (options: SearchProductsOptions) => ipcRenderer.invoke('db:products:search', options),
      getById: (id: string) => ipcRenderer.invoke('db:products:getById', id),
      create: (data: CreateProductInput) => ipcRenderer.invoke('db:products:create', data),
      update: (id: string, data: UpdateProductInput) =>
        ipcRenderer.invoke('db:products:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:products:delete', id),
    },
    purchases: {
      search: (options: SearchPurchasesOptions) =>
        ipcRenderer.invoke('db:purchases:search', options),
      getById: (id: string) => ipcRenderer.invoke('db:purchases:getById', id),
      create: (data: CreatePurchaseInput) => ipcRenderer.invoke('db:purchases:create', data),
      update: (data: UpdatePurchaseInput) => ipcRenderer.invoke('db:purchases:update', data),
      delete: (id: string) => ipcRenderer.invoke('db:purchases:delete', id),
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
      legalName: string;
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
  calculation: {
    calculateInvoice: (input: import('@vyora/types').CalculationEngineInput) =>
      ipcRenderer.invoke('calculation:calculateInvoice', input),
  },

  accounting: {
    getVoucherById: (id: string) => ipcRenderer.invoke('accounting:getVoucherById', id),
    listVouchers: (filter: import('@vyora/types').VoucherFilterDto) =>
      ipcRenderer.invoke('accounting:listVouchers', filter),
    getTrialBalance: () => ipcRenderer.invoke('accounting:getTrialBalance'),
    getLedgerStatement: (ledgerId: string, fromDate: Date, toDate: Date) =>
      ipcRenderer.invoke('accounting:getLedgerStatement', ledgerId, fromDate, toDate),
    getDashboardMetrics: () => ipcRenderer.invoke('accounting:getDashboardMetrics'),
    getActiveLedgers: () => ipcRenderer.invoke('accounting:getActiveLedgers'),
  },
  journal: {
    postVoucher: (input: import('@vyora/types').CreateVoucherInput) =>
      ipcRenderer.invoke('journal:postVoucher', input),
  },
  inventory: {
    getStockSummary: (productId: string) =>
      ipcRenderer.invoke('inventory:getStockSummary', productId),
    getStock: (productId: string) => ipcRenderer.invoke('inventory:stock:get', productId),
    getLedger: (productId: string) => ipcRenderer.invoke('inventory:ledger:get', productId),
    getGlobalInventory: () => ipcRenderer.invoke('inventory:global:getAll'),
    getNegativeInventory: () => ipcRenderer.invoke('inventory:global:getNegative'),
  },
  reports: {
    getDayBook: (args: {
      startDate?: Date;
      endDate?: Date;
      voucherType?: string;
      searchQuery?: string;
    }) => ipcRenderer.invoke('reports:getDayBook', args),
    getCashBook: (args: {
      ledgerId: string;
      startDate?: Date;
      endDate?: Date;
      voucherType?: string;
      searchQuery?: string;
    }) => ipcRenderer.invoke('reports:getCashBook', args),
    getBankBook: (args: {
      ledgerId: string;
      startDate?: Date;
      endDate?: Date;
      voucherType?: string;
      searchQuery?: string;
    }) => ipcRenderer.invoke('reports:getBankBook', args),
    getOutstandingSummary: (args: { reportType: 'CUSTOMER' | 'SUPPLIER'; asOfDate?: Date }) =>
      ipcRenderer.invoke('reports:getOutstandingSummary', args),
    getStockSummary: (args?: { asOfDate?: Date }) =>
      ipcRenderer.invoke('reports:getStockSummary', args),
    getStockLedger: (args: {
      productId: string;
      productName: string;
      unitShortName: string;
      fromDate?: Date;
      toDate?: Date;
    }) => ipcRenderer.invoke('reports:getStockLedger', args),
    getStockMovementRegister: (args?: { fromDate?: Date; toDate?: Date }) =>
      ipcRenderer.invoke('reports:getStockMovementRegister', args),
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
  suppliers: {
    search: (options: SearchSuppliersOptions) => Promise<ApiResponse<SupplierListDto>>;
    getById: (id: string) => Promise<ApiResponse<SupplierProfileDto | null>>;
    create: (data: CreateSupplierInput) => Promise<ApiResponse<SupplierProfileDto>>;
    update: (id: string, data: UpdateSupplierInput) => Promise<ApiResponse<SupplierProfileDto>>;
    deactivate: (id: string) => Promise<ApiResponse<void>>;
  };
  taxes: {
    getAll: () => Promise<ApiResponse<import('@vyora/types').TaxDto[]>>;
  };
  products: {
    getAll: () => Promise<ApiResponse<ProductDto[]>>;
    search: (options: SearchProductsOptions) => Promise<ApiResponse<ProductListDto>>;
    getById: (id: string) => Promise<ApiResponse<ProductDto | null>>;
    create: (data: CreateProductInput) => Promise<ApiResponse<ProductDto>>;
    update: (id: string, data: UpdateProductInput) => Promise<ApiResponse<ProductDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  purchases: {
    search: (options: SearchPurchasesOptions) => Promise<ApiResponse<PurchaseListDto>>;
    getById: (id: string) => Promise<ApiResponse<PurchaseDto | null>>;
    create: (data: CreatePurchaseInput) => Promise<ApiResponse<string>>;
    update: (data: UpdatePurchaseInput) => Promise<ApiResponse<void>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
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
    legalName: string;
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

export type VyoraAccountingAPI = {
  getVoucherById: (
    id: string,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').VoucherDetailDto>>;
  listVouchers: (
    filter: import('@vyora/types').VoucherFilterDto,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').VoucherListItemDto[]>>;
  getTrialBalance: () => Promise<
    import('@vyora/types').ApiResponse<import('@vyora/types').TrialBalanceDto>
  >;
  getLedgerStatement: (
    ledgerId: string,
    fromDate: Date,
    toDate: Date,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerStatementDto>>;
  getDashboardMetrics: () => Promise<
    import('@vyora/types').ApiResponse<import('@vyora/types').AccountingDashboardDto>
  >;
  getActiveLedgers: () => Promise<
    import('@vyora/types').ApiResponse<import('@vyora/types').LedgerLookupDto[]>
  >;
};

export type VyoraCalculationAPI = {
  calculateInvoice: (
    input: import('@vyora/types').CalculationEngineInput,
  ) => Promise<ApiResponse<import('@vyora/types').InvoiceCalculationResult>>;
};

export type VyoraJournalAPI = {
  postVoucher: (
    input: import('@vyora/types').CreateVoucherInput,
  ) => Promise<ApiResponse<{ voucherId: string; voucherNumber: string }>>;
};

export type VyoraInventoryAPI = {
  getStockSummary: (
    productId: string,
  ) => Promise<ApiResponse<import('@vyora/types').StockSummaryDto>>;
  getStock: (productId: string) => Promise<ApiResponse<import('@vyora/types').InventoryStockDto>>;
  getLedger: (productId: string) => Promise<ApiResponse<import('@vyora/types').StockMovementDto[]>>;
  getGlobalInventory: () => Promise<ApiResponse<import('@vyora/types').GlobalInventoryRowDto[]>>;
  getNegativeInventory: () => Promise<ApiResponse<import('@vyora/types').GlobalInventoryRowDto[]>>;
};

export type VyoraReportsAPI = {
  getDayBook: (args: {
    startDate?: Date;
    endDate?: Date;
    voucherType?: string;
    searchQuery?: string;
  }) => Promise<import('@vyora/types').DayBookReportDto>;
  getCashBook: (args: {
    ledgerId: string;
    startDate?: Date;
    endDate?: Date;
    voucherType?: string;
    searchQuery?: string;
  }) => Promise<import('@vyora/types').CashBookReportDto>;
  getBankBook: (args: {
    ledgerId: string;
    startDate?: Date;
    endDate?: Date;
    voucherType?: string;
    searchQuery?: string;
  }) => Promise<import('@vyora/types').BankBookReportDto>;
  getOutstandingSummary: (args: {
    reportType: 'CUSTOMER' | 'SUPPLIER';
    asOfDate?: Date;
  }) => Promise<import('@vyora/types').OutstandingSummaryDto>;
  getStockSummary: (args?: {
    asOfDate?: Date;
  }) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').StockSummaryDto>>;
  getStockLedger: (args: {
    productId: string;
    productName: string;
    unitShortName: string;
    fromDate?: Date;
    toDate?: Date;
  }) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').StockLedgerDto>>;
  getStockMovementRegister: (args?: {
    fromDate?: Date;
    toDate?: Date;
  }) => Promise<
    import('@vyora/types').ApiResponse<import('@vyora/types').StockMovementRegisterDto>
  >;
};

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
      calculation: VyoraCalculationAPI;
      accounting: VyoraAccountingAPI;
      journal: VyoraJournalAPI;
      inventory: VyoraInventoryAPI;
      reports: VyoraReportsAPI;
    };
  }
}
