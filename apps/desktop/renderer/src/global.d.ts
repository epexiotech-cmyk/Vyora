import type {
  ApiResponse,
  CustomerProfileDto,
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerListDto,
  SupplierProfileDto,
  CreateSupplierInput,
  UpdateSupplierInput,
  SearchSuppliersOptions,
  SupplierListDto,
  ProductDto,
  CreateProductInput,
  PurchaseDto,
  PurchaseListDto,
  CreatePurchaseInput,
  UpdatePurchaseInput,
  SearchPurchasesOptions,
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
  units: {
    getAll: () => Promise<ApiResponse<import('@vyora/types').UnitDto[]>>;
    search: (
      options: import('@vyora/types').SearchUnitsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').UnitListDto>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').UnitDto | null>>;
    create: (
      data: import('@vyora/types').CreateUnitInput,
    ) => Promise<ApiResponse<import('@vyora/types').UnitDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateUnitInput,
    ) => Promise<ApiResponse<import('@vyora/types').UnitDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  products: {
    getAll: () => Promise<ApiResponse<ProductDto[]>>;
    search: (
      options: import('@vyora/types').SearchProductsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').ProductListDto>>;
    getById: (id: string) => Promise<ApiResponse<ProductDto | null>>;
    create: (data: CreateProductInput) => Promise<ApiResponse<ProductDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateProductInput,
    ) => Promise<ApiResponse<ProductDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  purchases: {
    search: (options: SearchPurchasesOptions) => Promise<ApiResponse<PurchaseListDto>>;
    getById: (id: string) => Promise<ApiResponse<PurchaseDto | null>>;
    create: (data: CreatePurchaseInput) => Promise<ApiResponse<string>>;
    update: (data: UpdatePurchaseInput) => Promise<ApiResponse<void>>;
    submit: (id: string) => Promise<ApiResponse<void>>;
    cancel: (id: string) => Promise<ApiResponse<void>>;
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
  getContext: () => Promise<ApiResponse<import('@vyora/types').CompanyContextDto | null>>;
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
  render: (
    templateName: string,
    payload: import('@vyora/print-engine').PrintPayload<unknown>,
  ) => Promise<string>;
  print: {
    (
      templateName: string,
      payload: import('@vyora/print-engine').PrintPayload<unknown>,
      options?: WebContentsPrintOptions,
    ): Promise<{ success: boolean; failureReason?: string }>;
    (
      html: string,
      options?: WebContentsPrintOptions,
    ): Promise<{ success: boolean; failureReason?: string }>;
  };
  printToPdf: (
    templateName: string,
    payload: import('@vyora/print-engine').PrintPayload<unknown>,
    options?: PrintToPDFOptions,
  ) => Promise<ArrayBuffer>;
  exportPdf: (html: string, options?: PrintToPDFOptions) => Promise<{ filePath: string }>;
  getAvailablePrinters: () => Promise<import('electron').PrinterInfo[]>;
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
    getActive: () => Promise<ApiResponse<import('@vyora/types').CurrencyDto[]>>;
    getPrimary: () => Promise<ApiResponse<import('@vyora/types').CurrencyDto | null>>;
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
  getStockSummary: (productId: string) => Promise<ApiResponse<ProductStockStatusDto>>;
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
  getStockAgeing: (args?: {
    asOfDate?: Date;
  }) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').StockAgeingDto>>;
  getProfitLoss: (asOfDate?: Date) => Promise<import('@vyora/types').ProfitLossReport>;
  getBalanceSheet: (asOfDate?: Date) => Promise<import('@vyora/types').BalanceSheetReport>;
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
      calculation: VyoraCalculationAPI;
      accounting: VyoraAccountingAPI;
      journal: VyoraJournalAPI;
      inventory: VyoraInventoryAPI;
      reports: VyoraReportsAPI;
    };
  }
}
