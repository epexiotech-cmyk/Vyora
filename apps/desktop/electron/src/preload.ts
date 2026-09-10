import type {
  CreateLedgerGroupInput,
  SearchLedgerGroupsOptions,
  UpdateLedgerGroupInput,
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
  RecordPaymentInput,
} from '@vyora/types';
import { contextBridge, ipcRenderer } from 'electron';
import type { PrintToPDFOptions, WebContentsPrintOptions } from 'electron';

// Expose a secure API to the renderer process
const vyoraApi = {
  system: {
    ping: () => ipcRenderer.invoke('system:ping'),
    test: () => ipcRenderer.invoke('system:test'),
    showAbout: () => ipcRenderer.invoke('system:show-about'),
    openPath: (path: string) => ipcRenderer.invoke('system:openPath', path),
    showItemInFolder: (path: string) => ipcRenderer.invoke('system:showItemInFolder', path),
    isPackaged: process.argv.includes('--is-packaged=true'),
  },
  export: {
    exportFile: (request: import('@vyora/types').ExportRequest) =>
      ipcRenderer.invoke('export:file', request),
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
      create: (data: import('@vyora/types').CreateTaxInput) =>
        ipcRenderer.invoke('db:taxes:create', data),
      update: (id: string, data: import('@vyora/types').UpdateTaxInput) =>
        ipcRenderer.invoke('db:taxes:update', data),
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
      update: (data: UpdatePurchaseInput, pin?: string) =>
        ipcRenderer.invoke('db:purchases:update', data, pin),
      delete: (id: string) => ipcRenderer.invoke('db:purchases:delete', id),
      submit: (id: string) => ipcRenderer.invoke('db:purchases:submit', id),
      cancel: (id: string) => ipcRenderer.invoke('db:purchases:cancel', id),
      recordPayment: (invoiceId: string, payload: RecordPaymentInput) =>
        ipcRenderer.invoke('db:purchases:recordPayment', invoiceId, payload),
    },
    employeeTypes: {
      search: (options: import('@vyora/types').SearchEmployeeTypesOptions) =>
        ipcRenderer.invoke('db:employeeTypes:search', options),
      getAll: () => ipcRenderer.invoke('db:employeeTypes:getAll'),
      getById: (id: string) => ipcRenderer.invoke('db:employeeTypes:getById', id),
      create: (data: import('@vyora/types').CreateEmployeeTypeInput) =>
        ipcRenderer.invoke('db:employeeTypes:create', data),
      update: (id: string, data: import('@vyora/types').UpdateEmployeeTypeInput) =>
        ipcRenderer.invoke('db:employeeTypes:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:employeeTypes:delete', id),
    },
    departments: {
      search: (options: import('@vyora/types').SearchDepartmentsOptions) =>
        ipcRenderer.invoke('db:departments:search', options),
      getAll: () => ipcRenderer.invoke('db:departments:getAll'),
      getById: (id: string) => ipcRenderer.invoke('db:departments:getById', id),
      create: (data: import('@vyora/types').CreateDepartmentInput) =>
        ipcRenderer.invoke('db:departments:create', data),
      update: (id: string, data: import('@vyora/types').UpdateDepartmentInput) =>
        ipcRenderer.invoke('db:departments:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:departments:delete', id),
    },
    designations: {
      search: (options: import('@vyora/types').SearchDesignationsOptions) =>
        ipcRenderer.invoke('db:designations:search', options),
      getAll: () => ipcRenderer.invoke('db:designations:getAll'),
      getById: (id: string) => ipcRenderer.invoke('db:designations:getById', id),
      create: (data: import('@vyora/types').CreateDesignationInput) =>
        ipcRenderer.invoke('db:designations:create', data),
      update: (id: string, data: import('@vyora/types').UpdateDesignationInput) =>
        ipcRenderer.invoke('db:designations:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:designations:delete', id),
    },
    workLocations: {
      search: (options: import('@vyora/types').SearchWorkLocationsOptions) =>
        ipcRenderer.invoke('db:workLocations:search', options),
      getAll: () => ipcRenderer.invoke('db:workLocations:getAll'),
      getById: (id: string) => ipcRenderer.invoke('db:workLocations:getById', id),
      create: (data: import('@vyora/types').CreateWorkLocationInput) =>
        ipcRenderer.invoke('db:workLocations:create', data),
      update: (id: string, data: import('@vyora/types').UpdateWorkLocationInput) =>
        ipcRenderer.invoke('db:workLocations:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:workLocations:delete', id),
    },
    employeeExpenseTypes: {
      search: (options: import('@vyora/types').SearchEmployeeExpenseTypesOptions) =>
        ipcRenderer.invoke('db:employeeExpenseTypes:search', options),
      getAll: () => ipcRenderer.invoke('db:employeeExpenseTypes:getAll'),
      getById: (id: string) => ipcRenderer.invoke('db:employeeExpenseTypes:getById', id),
      create: (data: import('@vyora/types').CreateEmployeeExpenseTypeInput) =>
        ipcRenderer.invoke('db:employeeExpenseTypes:create', data),
      update: (id: string, data: import('@vyora/types').UpdateEmployeeExpenseTypeInput) =>
        ipcRenderer.invoke('db:employeeExpenseTypes:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:employeeExpenseTypes:delete', id),
    },
    leaveTypes: {
      search: (options: import('@vyora/types').SearchLeaveTypesOptions) =>
        ipcRenderer.invoke('leaveTypes:search', options),
      getAll: () => ipcRenderer.invoke('leaveTypes:getAll'),
      getById: (id: string) => ipcRenderer.invoke('leaveTypes:getById', id),
      create: (data: import('@vyora/types').CreateLeaveTypeInput) =>
        ipcRenderer.invoke('leaveTypes:create', data),
      update: (id: string, data: import('@vyora/types').UpdateLeaveTypeInput) =>
        ipcRenderer.invoke('leaveTypes:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('leaveTypes:deactivate', id),
    },
    holidays: {
      search: (options: import('@vyora/types').SearchHolidaysOptions) =>
        ipcRenderer.invoke('holidays:search', options),
      getAll: () => ipcRenderer.invoke('holidays:getAll'),
      getById: (id: string) => ipcRenderer.invoke('holidays:getById', id),
      create: (data: import('@vyora/types').CreateHolidayInput) =>
        ipcRenderer.invoke('holidays:create', data),
      update: (id: string, data: import('@vyora/types').UpdateHolidayInput) =>
        ipcRenderer.invoke('holidays:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('holidays:deactivate', id),
    },
    leavePolicies: {
      search: (options: import('@vyora/types').SearchLeavePoliciesOptions) =>
        ipcRenderer.invoke('leavePolicies:search', options),
      getAll: () => ipcRenderer.invoke('leavePolicies:getAll'),
      getById: (id: string) => ipcRenderer.invoke('leavePolicies:getById', id),
      create: (data: import('@vyora/types').CreateLeavePolicyInput) =>
        ipcRenderer.invoke('leavePolicies:create', data),
      update: (id: string, data: import('@vyora/types').UpdateLeavePolicyInput) =>
        ipcRenderer.invoke('leavePolicies:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('leavePolicies:deactivate', id),
    },
    weeklyOffPolicies: {
      search: (options: import('@vyora/types').SearchWeeklyOffPoliciesOptions) =>
        ipcRenderer.invoke('weeklyOffPolicies:search', options),
      getAll: () => ipcRenderer.invoke('weeklyOffPolicies:getAll'),
      getById: (id: string) => ipcRenderer.invoke('weeklyOffPolicies:getById', id),
      create: (data: import('@vyora/types').CreateWeeklyOffPolicyInput) =>
        ipcRenderer.invoke('weeklyOffPolicies:create', data),
      update: (id: string, data: import('@vyora/types').UpdateWeeklyOffPolicyInput) =>
        ipcRenderer.invoke('weeklyOffPolicies:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('weeklyOffPolicies:deactivate', id),
    },
    employeeLeaveBalances: {
      search: (options: import('@vyora/types').SearchEmployeeLeaveBalancesOptions) =>
        ipcRenderer.invoke('employee-leave-balances:search', options),
      getById: (id: string) => ipcRenderer.invoke('employee-leave-balances:getById', id),
      create: (data: import('@vyora/types').CreateEmployeeLeaveBalanceInput) =>
        ipcRenderer.invoke('employee-leave-balances:create', data),
      update: (id: string, data: import('@vyora/types').UpdateEmployeeLeaveBalanceInput) =>
        ipcRenderer.invoke('employee-leave-balances:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('employee-leave-balances:delete', id),
    },
    leaveRequests: {
      search: (options: import('@vyora/types').SearchLeaveRequestsOptions) =>
        ipcRenderer.invoke('leave-requests:search', options),
      getById: (id: string) => ipcRenderer.invoke('leave-requests:getById', id),
      create: (data: import('@vyora/types').CreateLeaveRequestInput) =>
        ipcRenderer.invoke('leave-requests:create', data),
      update: (id: string, data: import('@vyora/types').UpdateLeaveRequestInput) =>
        ipcRenderer.invoke('leave-requests:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('leave-requests:delete', id),
      approve: (id: string, data: import('@vyora/types').ApproveLeaveRequestInput) =>
        ipcRenderer.invoke('leave-requests:approve', id, data),
      reject: (id: string, data: import('@vyora/types').RejectLeaveRequestInput) =>
        ipcRenderer.invoke('leave-requests:reject', id, data),
      cancel: (id: string, data: import('@vyora/types').CancelLeaveRequestInput) =>
        ipcRenderer.invoke('leave-requests:cancel', id, data),
    },
    expensePresets: {
      search: (options: import('@vyora/types').SearchExpensePresetsOptions) =>
        ipcRenderer.invoke('expense-presets:search', options),
      getById: (id: string) => ipcRenderer.invoke('expense-presets:getById', id),
      create: (data: import('@vyora/types').CreateExpensePresetInput) =>
        ipcRenderer.invoke('expense-presets:create', data),
      update: (data: import('@vyora/types').UpdateExpensePresetInput) =>
        ipcRenderer.invoke('expense-presets:update', data),
      delete: (id: string) => ipcRenderer.invoke('expense-presets:delete', id),
    },
    employees: {
      search: (options: import('@vyora/types').SearchEmployeesOptions) =>
        ipcRenderer.invoke('employee:search', options),
      getById: (id: string) => ipcRenderer.invoke('employee:getById', id),
      create: (data: import('@vyora/types').CreateEmployeeInput) =>
        ipcRenderer.invoke('employee:create', data),
      update: (id: string, data: import('@vyora/types').UpdateEmployeeInput) =>
        ipcRenderer.invoke('employee:update', id, data),
      deactivate: (id: string) => ipcRenderer.invoke('employee:deactivate', id),
    },
    employeeBankDetails: {
      getByEmployeeId: (employeeId: string) =>
        ipcRenderer.invoke('employeeBankDetails:getByEmployeeId', employeeId),
      getById: (id: string) => ipcRenderer.invoke('employeeBankDetails:getById', id),
      create: (employeeId: string, data: import('@vyora/types').CreateEmployeeBankDetailInput) =>
        ipcRenderer.invoke('employeeBankDetails:create', employeeId, data),
      update: (id: string, data: import('@vyora/types').UpdateEmployeeBankDetailInput) =>
        ipcRenderer.invoke('employeeBankDetails:update', id, data),
      deactivate: (id: string) => ipcRenderer.invoke('employeeBankDetails:deactivate', id),
    },
    employeeDocuments: {
      getByEmployeeId: (employeeId: string) =>
        ipcRenderer.invoke('employeeDocument:getByEmployeeId', employeeId),
      getById: (id: string) => ipcRenderer.invoke('employeeDocument:getById', id),
      create: (employeeId: string, data: import('@vyora/types').CreateEmployeeDocumentInput) =>
        ipcRenderer.invoke('employeeDocument:create', employeeId, data),
      upload: (
        employeeId: string,
        data: Omit<import('@vyora/types').CreateEmployeeDocumentInput, 'filePath'>,
        filename: string,
        buffer: ArrayBuffer | Uint8Array,
      ) => ipcRenderer.invoke('employeeDocument:upload', employeeId, data, filename, buffer),
      update: (id: string, data: import('@vyora/types').UpdateEmployeeDocumentInput) =>
        ipcRenderer.invoke('employeeDocument:update', id, data),
      deactivate: (id: string) => ipcRenderer.invoke('employeeDocument:deactivate', id),
    },
    attendance: {
      search: (options: import('@vyora/types').SearchAttendanceOptions) =>
        ipcRenderer.invoke('attendance:search', options),
      getById: (id: string) => ipcRenderer.invoke('attendance:getById', id),
      mark: (data: import('@vyora/types').MarkAttendanceInput) =>
        ipcRenderer.invoke('attendance:mark', data),
      clear: (data: import('@vyora/types').ClearAttendanceInput) =>
        ipcRenderer.invoke('attendance:clear', data),
    },
    payrollExport: {
      generate: (options: import('@vyora/types').PayrollExportOptions) =>
        ipcRenderer.invoke('payroll-export:generate', options),
    },
    salaryComponents: {
      search: (options: import('@vyora/types').SearchSalaryComponentsOptions) =>
        ipcRenderer.invoke('salary-components:search', options),
      getById: (id: string) => ipcRenderer.invoke('salary-components:getById', id),
      create: (data: import('@vyora/types').CreateSalaryComponentInput) =>
        ipcRenderer.invoke('salary-components:create', data),
      update: (id: string, data: import('@vyora/types').UpdateSalaryComponentInput) =>
        ipcRenderer.invoke('salary-components:update', id, data),
      deactivate: (id: string) => ipcRenderer.invoke('salary-components:deactivate', id),
    },
    employeeSalaryStructures: {
      getByEmployeeId: (employeeId: string) =>
        ipcRenderer.invoke('employee-salary-structures:getByEmployeeId', employeeId),
      getById: (id: string) => ipcRenderer.invoke('employee-salary-structures:getById', id),
      create: (data: import('@vyora/types').CreateSalaryStructureInput) =>
        ipcRenderer.invoke('employee-salary-structures:create', data),
    },
    payrollPeriods: {
      list: () => ipcRenderer.invoke('payroll-periods:list'),
      get: (id: string) => ipcRenderer.invoke('payroll-periods:get', id),
      create: (data: import('@vyora/types').CreatePayrollPeriodDto) =>
        ipcRenderer.invoke('payroll-periods:create', data),
      lock: (id: string) => ipcRenderer.invoke('payroll-periods:lock', id),
      unlock: (id: string) => ipcRenderer.invoke('payroll-periods:unlock', id),
    },
    sales: {
      createInvoice: (data: CreateSalesInvoiceInput) =>
        ipcRenderer.invoke('sales:invoice:create', data),
      updateDraft: (invoiceId: string, payload: UpdateSalesInvoiceInput, pin?: string) =>
        ipcRenderer.invoke('sales:invoice:updateDraft', invoiceId, payload, pin),
      submitInvoice: (invoiceId: string) => ipcRenderer.invoke('sales:invoice:submit', invoiceId),
      cancelInvoice: (invoiceId: string) => ipcRenderer.invoke('sales:invoice:cancel', invoiceId),
      getById: (invoiceId: string) => ipcRenderer.invoke('sales:invoice:getById', invoiceId),
      list: (options?: ListSalesInvoicesOptions) =>
        ipcRenderer.invoke('sales:invoice:list', options),
      recordPayment: (invoiceId: string, payload: RecordPaymentInput) =>
        ipcRenderer.invoke('sales:invoice:recordPayment', invoiceId, payload),
    },
  },
  settings: {
    app: {
      getAppearance: () => ipcRenderer.invoke('settings:app:getAppearance'),
      setAppearance: (appearance: { theme: 'light' | 'dark' | 'system' }) =>
        ipcRenderer.invoke('settings:app:setAppearance', appearance),
    },
    documentNumbering: {
      get: (documentType: string) =>
        ipcRenderer.invoke('settings:document-numbering:get', documentType),
      save: (config: import('@vyora/types').DocumentNumberingConfigDto) =>
        ipcRenderer.invoke('settings:document-numbering:save', config),
      getAll: () => ipcRenderer.invoke('settings:document-numbering:getAll'),
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
  auth: {
    createAdmin: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke('auth:create-admin', payload),
    login: (payload: Record<string, unknown>) => ipcRenderer.invoke('auth:login', payload),
    logout: () => ipcRenderer.invoke('auth:logout'),
    lock: () => ipcRenderer.invoke('auth:lock'),
    unlock: (payload: Record<string, unknown>) => ipcRenderer.invoke('auth:unlock', payload),
    isLocked: () => ipcRenderer.invoke('auth:is-locked'),
    verifySession: () => ipcRenderer.invoke('auth:verify-session'),
    getCurrentUser: () => ipcRenderer.invoke('auth:get-current-user'),
    changePassword: (payload: import('@vyora/types').ChangePasswordRequestDto) =>
      ipcRenderer.invoke('auth:change-password', payload),
    changePin: (payload: import('@vyora/types').ChangePinRequestDto) =>
      ipcRenderer.invoke('auth:change-pin', payload),
  },
  company: {
    getActive: () => ipcRenderer.invoke('company:get-active'),
    getContext: () => ipcRenderer.invoke('company:get-context'),
    setActive: (id: string) => ipcRenderer.invoke('company:set-active', id),
    getProfile: (id: string) => ipcRenderer.invoke('company:get-profile', id),
    updateProfile: (id: string, payload: UpdateCompanyProfileRequest) =>
      ipcRenderer.invoke('company:update-profile', id, payload),
    uploadLogo: (id: string, filename: string, buffer: ArrayBuffer) =>
      ipcRenderer.invoke('company:upload-logo', id, filename, buffer),
    deleteLogo: (id: string) => ipcRenderer.invoke('company:delete-logo', id),
    uploadSignature: (id: string, filename: string, buffer: ArrayBuffer) =>
      ipcRenderer.invoke('company:upload-signature', id, filename, buffer),
    deleteSignature: (id: string) => ipcRenderer.invoke('company:delete-signature', id),
    setSignatureAsDefault: (companyId: string, signatureId: string) =>
      ipcRenderer.invoke('company:set-signature-default', companyId, signatureId),
    deleteSignatureById: (companyId: string, signatureId: string) =>
      ipcRenderer.invoke('company:delete-signature-by-id', companyId, signatureId),
    updateSignatureDesignation: (companyId: string, signatureId: string, designation: string) =>
      ipcRenderer.invoke(
        'company:update-signature-designation',
        companyId,
        signatureId,
        designation,
      ),
    list: () => ipcRenderer.invoke('company:list'),
    create: (payload: import('@vyora/types').CreateCompanyInput) =>
      ipcRenderer.invoke('company:create', payload),
    delete: (id: string) => ipcRenderer.invoke('company:delete', id),
  },
  financialYear: {
    getCurrent: () => ipcRenderer.invoke('financial-year:get-current'),
    getActive: () => ipcRenderer.invoke('financial-year:get-active'),
    setActive: (id: string) => ipcRenderer.invoke('financial-year:set-active', id),
    list: () => ipcRenderer.invoke('financial-year:list'),
    create: (input: import('@vyora/types').CreateFinancialYearInput) =>
      ipcRenderer.invoke('financial-year:create', input),
  },
  splash: {
    finished: () => ipcRenderer.send('splash-finished'),
  },
  print: {
    render: (templateName: string, payload: import('@vyora/print-engine').PrintPayload<unknown>) =>
      ipcRenderer.invoke('print:render', templateName, payload),
    print: (
      templateNameOrHtml: string,
      payloadOrOptions?:
        | import('@vyora/print-engine').PrintPayload<unknown>
        | WebContentsPrintOptions,
      options?: WebContentsPrintOptions,
    ) => ipcRenderer.invoke('print:print', templateNameOrHtml, payloadOrOptions, options),
    printToPdf: (
      templateName: string,
      payload: import('@vyora/print-engine').PrintPayload<unknown>,
      options?: PrintToPDFOptions,
    ) => ipcRenderer.invoke('print:printToPdf', templateName, payload, options),
    saveTempPdfAndShare: (
      templateName: string,
      payload: import('@vyora/print-engine').PrintPayload<unknown>,
      fileName: string,
      options?: PrintToPDFOptions,
    ) => ipcRenderer.invoke('print:saveTempPdfAndShare', templateName, payload, fileName, options),
    exportPdf: (html: string, options?: PrintToPDFOptions) =>
      ipcRenderer.invoke('print:exportPdf', html, options),
    getAvailablePrinters: () => ipcRenderer.invoke('print:getAvailablePrinters'),
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
      getActive: () => ipcRenderer.invoke('directory:currency:getActive'),
      getPrimary: () => ipcRenderer.invoke('directory:currency:getPrimary'),
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
  developer: {
    isEnabled: () => ipcRenderer.invoke('developer:isEnabled'),
  },

  accounting: {
    getVoucherById: (id: string) => ipcRenderer.invoke('accounting:getVoucherById', id),
    listVouchers: (filter: import('@vyora/types').VoucherFilterDto) =>
      ipcRenderer.invoke('accounting:listVouchers', filter),
    getTrialBalance: () => ipcRenderer.invoke('accounting:getTrialBalance'),
    getLedgerStatement: (ledgerId: string, fromDate: Date, toDate: Date) =>
      ipcRenderer.invoke('accounting:getLedgerStatement', ledgerId, fromDate, toDate),
    getDashboardMetrics: () => ipcRenderer.invoke('accounting:getDashboardMetrics'),
    listSettlements: (options: import('@vyora/types').ListSettlementsOptions) =>
      ipcRenderer.invoke('accounting:listSettlements', options),
    getSettlementById: (id: string) => ipcRenderer.invoke('accounting:getSettlementById', id),
    cancelSettlement: (id: string) => ipcRenderer.invoke('accounting:cancelSettlement', id),
    createSettlement: (input: import('@vyora/types').CreateSettlementInput) =>
      ipcRenderer.invoke('accounting:createSettlement', input),
    editSettlement: (settlementId: string, input: import('@vyora/types').UpdateSettlementInput) =>
      ipcRenderer.invoke('accounting:editSettlement', settlementId, input),
    getFinancialOverviewChart: (req: import('@vyora/types').FinancialOverviewChartRequestDto) =>
      ipcRenderer.invoke('accounting:getFinancialOverviewChart', req),
    getActiveLedgers: () => ipcRenderer.invoke('accounting:getActiveLedgers'),
    getOutstandingForCustomer: (
      customerId: string,
    ): Promise<ApiResponse<import('@vyora/types').OutstandingDocumentDto[]>> =>
      ipcRenderer.invoke('accounting:getOutstandingForCustomer', customerId),
    getOutstandingForSupplier: (
      supplierId: string,
    ): Promise<ApiResponse<import('@vyora/types').OutstandingDocumentDto[]>> =>
      ipcRenderer.invoke('accounting:getOutstandingForSupplier', supplierId),
    groups: {
      search: (options: SearchLedgerGroupsOptions) =>
        ipcRenderer.invoke('db:accounting:groups:search', options),
      getAll: () => ipcRenderer.invoke('db:accounting:groups:getAll'),
      getById: (id: string) => ipcRenderer.invoke('db:accounting:groups:getById', id),
      create: (data: CreateLedgerGroupInput) =>
        ipcRenderer.invoke('db:accounting:groups:create', data),
      update: (id: string, data: UpdateLedgerGroupInput) =>
        ipcRenderer.invoke('db:accounting:groups:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:accounting:groups:delete', id),
    },
    ledgers: {
      search: (options: import('@vyora/types').SearchLedgersOptions) =>
        ipcRenderer.invoke('db:accounting:ledgers:search', options),
      getById: (id: string) => ipcRenderer.invoke('db:accounting:ledgers:getById', id),
      create: (data: import('@vyora/types').CreateLedgerInput) =>
        ipcRenderer.invoke('db:accounting:ledgers:create', data),
      update: (id: string, data: import('@vyora/types').UpdateLedgerInput) =>
        ipcRenderer.invoke('db:accounting:ledgers:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:accounting:ledgers:delete', id),
    },
  },
  journal: {
    postVoucher: (input: import('@vyora/types').CreateVoucherInput) =>
      ipcRenderer.invoke('journal:postVoucher', input),
    postTransfer: (input: {
      fromPaymentAccountId: string;
      toPaymentAccountId: string;
      amount: number;
      transferDate: Date;
      narration?: string;
    }) => ipcRenderer.invoke('journal:postTransfer', input),
    cancelTransfer: (id: string) => ipcRenderer.invoke('journal:cancelTransfer', id),
    updateTransfer: (input: {
      voucherId: string;
      fromPaymentAccountId: string;
      toPaymentAccountId: string;
      amount: number;
      transferDate: Date;
      narration?: string;
    }) => ipcRenderer.invoke('journal:updateTransfer', input),
    cancelVoucher: (id: string) => ipcRenderer.invoke('journal:cancelVoucher', id),
    reverseVoucher: (id: string) => ipcRenderer.invoke('journal:reverseVoucher', id),
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
    getAccountBalanceSummary: (asOfDate?: Date) =>
      ipcRenderer.invoke('reports:getAccountBalanceSummary', { asOfDate }),
    getTrialBalance: (asOfDate?: Date) => ipcRenderer.invoke('reports:getTrialBalance', asOfDate),
    getGeneralLedger: (args: { startDate?: Date; endDate?: Date }) =>
      ipcRenderer.invoke('reports:getGeneralLedger', args),
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
    getUpiBook: (args: {
      ledgerId: string;
      startDate?: Date;
      endDate?: Date;
      voucherType?: string;
      searchQuery?: string;
    }) => ipcRenderer.invoke('reports:getUpiBook', args),
    getPosBook: (args: {
      ledgerId: string;
      startDate?: Date;
      endDate?: Date;
      voucherType?: string;
      searchQuery?: string;
    }) => ipcRenderer.invoke('reports:getPosBook', args),
    getOutstandingSummary: (args: { reportType: 'CUSTOMER' | 'SUPPLIER'; asOfDate?: Date }) =>
      ipcRenderer.invoke('reports:getOutstandingSummary', args),
    getTransferRegister: (args: { startDate?: Date; endDate?: Date }) =>
      ipcRenderer.invoke('reports:getTransferRegister', args),
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
    getStockAgeing: (args?: { asOfDate?: Date }) =>
      ipcRenderer.invoke('reports:getStockAgeing', args),
    getProfitLoss: (asOfDate?: Date) => ipcRenderer.invoke('reports:getProfitLoss', asOfDate),
    getBalanceSheet: (asOfDate?: Date) => ipcRenderer.invoke('reports:getBalanceSheet', asOfDate),
  },
  dev: {
    getDiagnostics: () => ipcRenderer.invoke('dev:diagnostics'),
    factoryReset: {
      dryRun: () => ipcRenderer.invoke('dev:factoryReset:dryRun'),
      execute: () => ipcRenderer.invoke('dev:factoryReset:execute'),
    },
    inventory: {
      check: () => ipcRenderer.invoke('dev:inventory:check'),
      rebuild: () => ipcRenderer.invoke('dev:inventory:rebuild'),
    },
    documentNumbering: {
      reset: () => ipcRenderer.invoke('dev:documentNumbering:reset'),
    },
  },
  paymentAccounts: {
    create: (data: import('@vyora/types').CreatePaymentAccountInput) =>
      ipcRenderer.invoke('paymentAccount:create', data),
    update: (id: string, data: import('@vyora/types').UpdatePaymentAccountInput) =>
      ipcRenderer.invoke('paymentAccount:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('paymentAccount:delete', id),
    getById: (id: string) => ipcRenderer.invoke('paymentAccount:getById', id),
    search: (filter: import('@vyora/types').PaymentAccountFilterDto) =>
      ipcRenderer.invoke('paymentAccount:search', filter),
    openingBalance: {
      create: (input: import('@vyora/types').CreateOpeningBalanceInput) =>
        ipcRenderer.invoke('paymentAccount:openingBalance:create', input),
      update: (input: import('@vyora/types').CreateOpeningBalanceInput) =>
        ipcRenderer.invoke('paymentAccount:openingBalance:update', input),
      reverse: (paymentAccountId: string) =>
        ipcRenderer.invoke('paymentAccount:openingBalance:reverse', paymentAccountId),
      get: (paymentAccountId: string) =>
        ipcRenderer.invoke('paymentAccount:openingBalance:get', paymentAccountId),
    },
    saveWithOpeningBalance: (payload: {
      isEditing: boolean;
      accountId?: string;
      accountData:
        | import('@vyora/types').CreatePaymentAccountInput
        | import('@vyora/types').UpdatePaymentAccountInput;
      openingBalance?: {
        amount: number;
        type: 'Dr' | 'Cr';
        date: Date;
        notes?: string;
      };
    }) => ipcRenderer.invoke('paymentAccount:saveWithOpeningBalance', payload),
  },
  fundTransfers: {
    create: (input: import('@vyora/types').CreateFundTransferInput) =>
      ipcRenderer.invoke('fundTransfer:create', input),
    update: (id: string, input: import('@vyora/types').UpdateFundTransferInput) =>
      ipcRenderer.invoke('fundTransfer:update', { id, input }),
    reverse: (id: string) => ipcRenderer.invoke('fundTransfer:reverse', id),
    getAll: (filter: import('@vyora/types').FundTransferQueryFilter) =>
      ipcRenderer.invoke('fundTransfer:getAll', filter),
  },
  developerDatabase: {
    listTables: () => ipcRenderer.invoke('developer:database:listTables'),
    getTableSchema: (tableName: string) =>
      ipcRenderer.invoke('developer:database:getTableSchema', tableName),
    getIndexes: (tableName: string) =>
      ipcRenderer.invoke('developer:database:getIndexes', tableName),
    getForeignKeys: (tableName: string) =>
      ipcRenderer.invoke('developer:database:getForeignKeys', tableName),
    getRows: (tableName: string, page?: number, pageSize?: number, filters?: string) =>
      ipcRenderer.invoke('developer:database:getRows', tableName, page, pageSize, filters),
    executeQuery: (sql: string) => ipcRenderer.invoke('developer:database:executeQuery', sql),
    getRelations: (tableName: string, row: Record<string, unknown>) =>
      ipcRenderer.invoke('developer:database:getRelations', tableName, row),
  },
  payrollSnapshot: {
    createForPeriod: (command: import('@vyora/types').CreatePayrollSnapshotCommandDto) =>
      ipcRenderer.invoke('payrollSnapshot:createForPeriod', command),
  },
  payrollCalculation: {
    calculatePayrollResult: (id: string) => ipcRenderer.invoke('payrollResult:calculate', id),
    calculatePeriod: (id: string) => ipcRenderer.invoke('payrollPeriod:calculate', id),
  },
};

contextBridge.exposeInMainWorld('vyora', vyoraApi);

export type VyoraSystemAPI = {
  ping: () => Promise<string>;
  test: () => Promise<string>;
  showAbout: () => Promise<void>;
  openPath: (path: string) => Promise<{ success: boolean; error?: string }>;
  showItemInFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
  isPackaged: boolean;
};

export type VyoraExportAPI = {
  exportFile: (
    request: import('@vyora/types').ExportRequest,
  ) => Promise<import('@vyora/types').ExportSummary>;
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
    create: (
      data: import('@vyora/types').CreateTaxInput,
    ) => Promise<ApiResponse<import('@vyora/types').TaxDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateTaxInput,
    ) => Promise<ApiResponse<import('@vyora/types').TaxDto>>;
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
    update: (data: UpdatePurchaseInput, pin?: string) => Promise<ApiResponse<void>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
    submit: (id: string) => Promise<ApiResponse<void>>;
    cancel: (id: string) => Promise<ApiResponse<void>>;
    recordPayment: (
      invoiceId: string,
      payload: RecordPaymentInput,
    ) => Promise<ApiResponse<{ settlementId: string }>>;
  };
  employeeTypes: {
    search: (
      options: import('@vyora/types').SearchEmployeeTypesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeTypeListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').EmployeeTypeDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').EmployeeTypeDto | null>>;
    create: (
      data: import('@vyora/types').CreateEmployeeTypeInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeTypeDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateEmployeeTypeInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeTypeDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  departments: {
    search: (
      options: import('@vyora/types').SearchDepartmentsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').DepartmentListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').DepartmentDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').DepartmentDto | null>>;
    create: (
      data: import('@vyora/types').CreateDepartmentInput,
    ) => Promise<ApiResponse<import('@vyora/types').DepartmentDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateDepartmentInput,
    ) => Promise<ApiResponse<import('@vyora/types').DepartmentDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  designations: {
    search: (
      options: import('@vyora/types').SearchDesignationsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').DesignationListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').DesignationDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').DesignationDto | null>>;
    create: (
      data: import('@vyora/types').CreateDesignationInput,
    ) => Promise<ApiResponse<import('@vyora/types').DesignationDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateDesignationInput,
    ) => Promise<ApiResponse<import('@vyora/types').DesignationDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  workLocations: {
    search: (
      options: import('@vyora/types').SearchWorkLocationsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').WorkLocationListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').WorkLocationDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').WorkLocationDto | null>>;
    create: (
      data: import('@vyora/types').CreateWorkLocationInput,
    ) => Promise<ApiResponse<import('@vyora/types').WorkLocationDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateWorkLocationInput,
    ) => Promise<ApiResponse<import('@vyora/types').WorkLocationDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  employeeExpenseTypes: {
    search: (
      options: import('@vyora/types').SearchEmployeeExpenseTypesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeExpenseTypeListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').EmployeeExpenseTypeDto[]>>;
    getById: (
      id: string,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeExpenseTypeDto | null>>;
    create: (
      data: import('@vyora/types').CreateEmployeeExpenseTypeInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeExpenseTypeDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateEmployeeExpenseTypeInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeExpenseTypeDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  leaveTypes: {
    search: (
      options: import('@vyora/types').SearchLeaveTypesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').LeaveTypeListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').LeaveTypeDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').LeaveTypeDto | null>>;
    create: (
      data: import('@vyora/types').CreateLeaveTypeInput,
    ) => Promise<ApiResponse<import('@vyora/types').LeaveTypeDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateLeaveTypeInput,
    ) => Promise<ApiResponse<import('@vyora/types').LeaveTypeDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  holidays: {
    search: (
      options: import('@vyora/types').SearchHolidaysOptions,
    ) => Promise<ApiResponse<import('@vyora/types').HolidayListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').HolidayDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').HolidayDto | null>>;
    create: (
      data: import('@vyora/types').CreateHolidayInput,
    ) => Promise<ApiResponse<import('@vyora/types').HolidayDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateHolidayInput,
    ) => Promise<ApiResponse<import('@vyora/types').HolidayDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  leavePolicies: {
    search: (
      options: import('@vyora/types').SearchLeavePoliciesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').LeavePolicyListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').LeavePolicyDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').LeavePolicyDto | null>>;
    create: (
      data: import('@vyora/types').CreateLeavePolicyInput,
    ) => Promise<ApiResponse<import('@vyora/types').LeavePolicyDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateLeavePolicyInput,
    ) => Promise<ApiResponse<import('@vyora/types').LeavePolicyDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  weeklyOffPolicies: {
    search: (
      options: import('@vyora/types').SearchWeeklyOffPoliciesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').WeeklyOffPolicyListDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').WeeklyOffPolicyDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').WeeklyOffPolicyDto | null>>;
    create: (
      data: import('@vyora/types').CreateWeeklyOffPolicyInput,
    ) => Promise<ApiResponse<import('@vyora/types').WeeklyOffPolicyDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateWeeklyOffPolicyInput,
    ) => Promise<ApiResponse<import('@vyora/types').WeeklyOffPolicyDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  employeeLeaveBalances: {
    search: (
      options: import('@vyora/types').SearchEmployeeLeaveBalancesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeLeaveBalanceListDto>>;
    getById: (
      id: string,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeLeaveBalanceDto | null>>;
    create: (
      data: import('@vyora/types').CreateEmployeeLeaveBalanceInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeLeaveBalanceDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateEmployeeLeaveBalanceInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeLeaveBalanceDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  leaveRequests: {
    search: (
      options: import('@vyora/types').SearchLeaveRequestsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').LeaveRequestListDto>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').LeaveRequestDto | null>>;
    create: (
      data: import('@vyora/types').CreateLeaveRequestInput,
    ) => Promise<ApiResponse<import('@vyora/types').LeaveRequestDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateLeaveRequestInput,
    ) => Promise<ApiResponse<import('@vyora/types').LeaveRequestDto>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
    approve: (
      id: string,
      data: import('@vyora/types').ApproveLeaveRequestInput,
    ) => Promise<ApiResponse<void>>;
    reject: (
      id: string,
      data: import('@vyora/types').RejectLeaveRequestInput,
    ) => Promise<ApiResponse<void>>;
    cancel: (
      id: string,
      data: import('@vyora/types').CancelLeaveRequestInput,
    ) => Promise<ApiResponse<void>>;
  };
  attendance: {
    search: (
      options: import('@vyora/types').SearchAttendanceOptions,
    ) => Promise<ApiResponse<import('@vyora/types').AttendanceListDto>>;
    getById: (
      id: string,
    ) => Promise<ApiResponse<import('@vyora/types').AttendanceRecordDto | null>>;
    mark: (
      data: import('@vyora/types').MarkAttendanceInput,
    ) => Promise<ApiResponse<import('@vyora/types').AttendanceRecordDto>>;
    clear: (data: import('@vyora/types').ClearAttendanceInput) => Promise<ApiResponse<void>>;
    aggregate: (
      options: import('@vyora/types').AggregateAttendanceOptions,
    ) => Promise<ApiResponse<import('@vyora/types').AttendanceAggregationResult>>;
  };
  payrollExport: {
    generate: (
      options: import('@vyora/types').PayrollExportOptions,
    ) => Promise<ApiResponse<import('@vyora/types').PayrollExportResult>>;
  };
  salaryComponents: {
    search: (
      options: import('@vyora/types').SearchSalaryComponentsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').SalaryComponentListDto>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').SalaryComponentDto | null>>;
    create: (
      data: import('@vyora/types').CreateSalaryComponentInput,
    ) => Promise<ApiResponse<import('@vyora/types').SalaryComponentDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateSalaryComponentInput,
    ) => Promise<ApiResponse<import('@vyora/types').SalaryComponentDto>>;
    deactivate: (id: string) => Promise<ApiResponse<void>>;
  };
  employeeSalaryStructures: {
    getByEmployeeId: (
      employeeId: string,
    ) => Promise<ApiResponse<import('@vyora/types').SalaryStructureDto[]>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').SalaryStructureDto | null>>;
    create: (
      data: import('@vyora/types').CreateSalaryStructureInput,
    ) => Promise<ApiResponse<import('@vyora/types').SalaryStructureDto>>;
  };
  payrollPeriods: {
    list: () => Promise<import('@vyora/types').PayrollPeriod[]>;
    get: (id: string) => Promise<import('@vyora/types').PayrollPeriod>;
    create: (
      data: import('@vyora/types').CreatePayrollPeriodDto,
    ) => Promise<import('@vyora/types').PayrollPeriod>;
    lock: (id: string) => Promise<import('@vyora/types').PayrollPeriod>;
    unlock: (id: string) => Promise<import('@vyora/types').PayrollPeriod>;
  };
  expensePresets: {
    search: (
      options: import('@vyora/types').SearchExpensePresetsOptions,
    ) => Promise<ApiResponse<import('@vyora/types').ExpensePresetListDto>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').ExpensePresetDto | null>>;
    create: (data: import('@vyora/types').CreateExpensePresetInput) => Promise<ApiResponse<string>>;
    update: (data: import('@vyora/types').UpdateExpensePresetInput) => Promise<ApiResponse<void>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  sales: {
    createInvoice: (data: CreateSalesInvoiceInput) => Promise<ApiResponse<{ invoiceId: string }>>;
    updateDraft: (
      invoiceId: string,
      payload: UpdateSalesInvoiceInput,
      pin?: string,
    ) => Promise<ApiResponse<SalesInvoiceDto>>;
    submitInvoice: (invoiceId: string) => Promise<ApiResponse<{ warnings: unknown[] }>>;
    cancelInvoice: (invoiceId: string) => Promise<ApiResponse<void>>;
    getById: (invoiceId: string) => Promise<ApiResponse<SalesInvoiceDto>>;
    list: (
      options?: ListSalesInvoicesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').SalesInvoiceListDto>>;
    recordPayment: (
      invoiceId: string,
      payload: RecordPaymentInput,
    ) => Promise<ApiResponse<{ settlementId: string }>>;
  };
  employees: {
    search: (
      options: import('@vyora/types').SearchEmployeesOptions,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeListDto>>;
    getById: (id: string) => Promise<ApiResponse<import('@vyora/types').EmployeeDto | null>>;
    create: (
      data: import('@vyora/types').CreateEmployeeInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateEmployeeInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeDto>>;
    deactivate: (id: string) => Promise<ApiResponse<void>>;
  };
  employeeBankDetails: {
    getByEmployeeId: (
      employeeId: string,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeBankDetailDto[]>>;
    getById: (
      id: string,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeBankDetailDto | null>>;
    create: (
      employeeId: string,
      data: import('@vyora/types').CreateEmployeeBankDetailInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeBankDetailDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateEmployeeBankDetailInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeBankDetailDto>>;
    deactivate: (id: string) => Promise<ApiResponse<void>>;
  };
  employeeDocuments: {
    getByEmployeeId: (
      employeeId: string,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeDocumentDto[]>>;
    getById: (
      id: string,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeDocumentDto | null>>;
    upload: (
      employeeId: string,
      data: Omit<import('@vyora/types').CreateEmployeeDocumentInput, 'documentPath'>,
      filename: string,
      buffer: ArrayBuffer,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeDocumentDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateEmployeeDocumentInput,
    ) => Promise<ApiResponse<import('@vyora/types').EmployeeDocumentDto>>;
    deactivate: (id: string) => Promise<ApiResponse<void>>;
    download: (
      id: string,
    ) => Promise<ApiResponse<{ buffer: ArrayBuffer; filename: string; mimeType: string }>>;
  };
};

export type VyoraSettingsAPI = {
  app: {
    getAppearance: () => Promise<
      ApiResponse<{
        theme: 'light' | 'dark' | 'system';
      }>
    >;
    setAppearance: (appearance: {
      theme: 'light' | 'dark' | 'system';
    }) => Promise<ApiResponse<void>>;
  };
  documentNumbering: {
    get: (
      documentType: string,
    ) => Promise<ApiResponse<import('@vyora/types').DocumentNumberingConfigDto | null>>;
    save: (
      config: import('@vyora/types').DocumentNumberingConfigDto,
    ) => Promise<ApiResponse<import('@vyora/types').DocumentNumberingConfigDto>>;
    getAll: () => Promise<ApiResponse<import('@vyora/types').DocumentNumberingConfigDto[]>>;
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

export type VyoraAuthAPI = {
  createAdmin: (payload: Record<string, unknown>) => Promise<ApiResponse<void>>;
  login: (payload: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
  logout: () => Promise<ApiResponse<void>>;
  lock: () => Promise<ApiResponse<void>>;
  unlock: (payload: Record<string, unknown>) => Promise<ApiResponse<void>>;
  isLocked: () => Promise<ApiResponse<boolean>>;
  verifySession: () => Promise<ApiResponse<unknown>>;
  getCurrentUser: () => Promise<ApiResponse<import('@vyora/types').UserDto>>;
  changePassword: (
    payload: import('@vyora/types').ChangePasswordRequestDto,
  ) => Promise<ApiResponse<void>>;
  changePin: (payload: import('@vyora/types').ChangePinRequestDto) => Promise<ApiResponse<void>>;
};

export type VyoraCompanyAPI = {
  getActive: () => Promise<ApiResponse<string | null>>;
  getContext: () => Promise<ApiResponse<import('@vyora/types').CompanyContextDto | null>>;
  setActive: (id: string) => Promise<ApiResponse<void>>;
  getProfile: (id: string) => Promise<ApiResponse<CompanyProfileDto | null>>;
  updateProfile: (
    id: string,
    payload: UpdateCompanyProfileRequest,
  ) => Promise<ApiResponse<CompanyProfileDto>>;
  uploadLogo: (
    id: string,
    filename: string,
    buffer: ArrayBuffer,
  ) => Promise<ApiResponse<CompanyProfileDto>>;
  deleteLogo: (id: string) => Promise<ApiResponse<CompanyProfileDto>>;
  uploadSignature: (
    id: string,
    filename: string,
    buffer: ArrayBuffer,
  ) => Promise<ApiResponse<CompanyProfileDto>>;
  deleteSignature: (id: string) => Promise<ApiResponse<CompanyProfileDto>>;
  setSignatureAsDefault?: (companyId: string, signatureId: string) => Promise<ApiResponse<void>>;
  deleteSignatureById?: (companyId: string, signatureId: string) => Promise<ApiResponse<void>>;
  updateSignatureDesignation?: (
    companyId: string,
    signatureId: string,
    designation: string,
  ) => Promise<ApiResponse<void>>;
  list: () => Promise<ApiResponse<import('@vyora/types').CompanyDto[]>>;
  create: (payload: import('@vyora/types').CreateCompanyInput) => Promise<ApiResponse<string>>;
  delete: (id: string) => Promise<ApiResponse<void>>;
};

export type VyoraFinancialYearAPI = {
  getCurrent: () => Promise<ApiResponse<FinancialYearDto | null>>;
  getActive: () => Promise<ApiResponse<FinancialYearDto | null>>;
  setActive: (id: string) => Promise<ApiResponse<void>>;
  list: () => Promise<ApiResponse<FinancialYearDto[]>>;
  create: (
    input: import('@vyora/types').CreateFinancialYearInput,
  ) => Promise<ApiResponse<FinancialYearDto>>;
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
  saveTempPdfAndShare: (
    templateName: string,
    payload: import('@vyora/print-engine').PrintPayload<unknown>,
    fileName: string,
    options?: PrintToPDFOptions,
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  exportPdf: (html: string, options?: PrintToPDFOptions) => Promise<{ filePath: string }>;
  getAvailablePrinters: () => Promise<import('electron').PrinterInfo[]>;
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
    getActive(): Promise<ApiResponse<import('@vyora/types').CurrencyDto[]>>;
    getPrimary(): Promise<ApiResponse<import('@vyora/types').CurrencyDto | null>>;
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
  getFinancialOverviewChart: (
    req: import('@vyora/types').FinancialOverviewChartRequestDto,
  ) => Promise<
    import('@vyora/types').ApiResponse<import('@vyora/types').FinancialOverviewChartResponseDto[]>
  >;
  getOutstandingForSupplier: (
    supplierId: string,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').OutstandingDocumentDto[]>>;
  getOutstandingForCustomer: (
    customerId: string,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').OutstandingDocumentDto[]>>;
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
  listSettlements: (
    options: import('@vyora/types').ListSettlementsOptions,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').SettlementListDto>>;
  getSettlementById: (
    id: string,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').SettlementDto>>;
  cancelSettlement: (
    id: string,
  ) => Promise<import('@vyora/types').ApiResponse<{ cancelledSettlementId: string }>>;
  createSettlement: (
    input: import('@vyora/types').CreateSettlementInput,
  ) => Promise<import('@vyora/types').ApiResponse<{ settlementId: string }>>;
  editSettlement: (
    settlementId: string,
    input: import('@vyora/types').UpdateSettlementInput,
  ) => Promise<import('@vyora/types').ApiResponse<{ settlementId: string }>>;
  groups: {
    search: (
      options: SearchLedgerGroupsOptions,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerGroupListDto>>;
    getAll: () => Promise<
      import('@vyora/types').ApiResponse<import('@vyora/types').LedgerGroupDto[]>
    >;
    getById: (
      id: string,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerGroupDto | null>>;
    create: (
      data: CreateLedgerGroupInput,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerGroupDto>>;
    update: (
      id: string,
      data: UpdateLedgerGroupInput,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerGroupDto>>;
    delete: (id: string) => Promise<import('@vyora/types').ApiResponse<void>>;
  };
  ledgers: {
    search: (
      options: import('@vyora/types').SearchLedgersOptions,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerListDto>>;
    getById: (
      id: string,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerDto | null>>;
    create: (
      data: import('@vyora/types').CreateLedgerInput,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerDto>>;
    update: (
      id: string,
      data: import('@vyora/types').UpdateLedgerInput,
    ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').LedgerDto>>;
    delete: (id: string) => Promise<import('@vyora/types').ApiResponse<void>>;
  };
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
  postTransfer: (input: {
    fromPaymentAccountId: string;
    toPaymentAccountId: string;
    amount: number;
    transferDate: Date;
    narration?: string;
  }) => Promise<ApiResponse<{ voucherId: string }>>;
  cancelTransfer: (id: string) => Promise<ApiResponse<{ reversalVoucherId?: string }>>;
  updateTransfer: (input: {
    voucherId: string;
    fromPaymentAccountId: string;
    toPaymentAccountId: string;
    amount: number;
    transferDate: Date;
    narration?: string;
  }) => Promise<ApiResponse<{ voucherId: string }>>;
  cancelVoucher: (id: string) => Promise<ApiResponse<{ reversalVoucherId?: string }>>;
  reverseVoucher: (id: string) => Promise<ApiResponse<{ reversalVoucherId: string }>>;
};

export type VyoraInventoryAPI = {
  getStockSummary: (
    productId: string,
  ) => Promise<ApiResponse<import('@vyora/types').ProductStockStatusDto>>;
  getStock: (productId: string) => Promise<ApiResponse<import('@vyora/types').InventoryStockDto>>;
  getLedger: (productId: string) => Promise<ApiResponse<import('@vyora/types').StockMovementDto[]>>;
  getGlobalInventory: () => Promise<ApiResponse<import('@vyora/types').GlobalInventoryRowDto[]>>;
  getNegativeInventory: () => Promise<ApiResponse<import('@vyora/types').GlobalInventoryRowDto[]>>;
};

export type VyoraReportsAPI = {
  getAccountBalanceSummary: (
    asOfDate?: Date,
  ) => Promise<import('@vyora/types').AccountBalanceSummaryDto>;
  getTrialBalance: (asOfDate?: Date) => Promise<import('@vyora/types').TrialBalanceReport>;
  getGeneralLedger: (args: {
    startDate?: Date;
    endDate?: Date;
  }) => Promise<import('@vyora/types').GeneralLedgerReport>;
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
  getUpiBook: (args: {
    ledgerId: string;
    startDate?: Date;
    endDate?: Date;
    voucherType?: string;
    searchQuery?: string;
  }) => Promise<import('@vyora/types').UpiBookReportDto>;
  getPosBook: (args: {
    ledgerId: string;
    startDate?: Date;
    endDate?: Date;
    voucherType?: string;
    searchQuery?: string;
  }) => Promise<import('@vyora/types').PosBookReportDto>;
  getOutstandingSummary: (args: {
    reportType: 'CUSTOMER' | 'SUPPLIER';
    asOfDate?: Date;
  }) => Promise<import('@vyora/types').OutstandingSummaryDto>;
  getTransferRegister: (args: {
    startDate?: Date;
    endDate?: Date;
  }) => Promise<import('@vyora/types').TransferRegisterReportDto>;
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

export type VyoraDevAPI = {
  getDiagnostics: () => Promise<ApiResponse<unknown>>;
  factoryReset: {
    dryRun: () => Promise<ApiResponse<Record<string, number>>>;
    execute: () => Promise<ApiResponse<unknown>>;
  };
  inventory: {
    check: () => Promise<ApiResponse<unknown>>;
    rebuild: () => Promise<ApiResponse<void>>;
  };
  documentNumbering: {
    reset: () => Promise<ApiResponse<void>>;
  };
};

export type VyoraDeveloperDatabaseAPI = {
  listTables: () => Promise<{ name: string; rowCount: number }[]>;
  getTableSchema: (tableName: string) => Promise<Record<string, unknown>[]>;
  getIndexes: (tableName: string) => Promise<Record<string, unknown>[]>;
  getForeignKeys: (tableName: string) => Promise<Record<string, unknown>[]>;
  getRows: (
    tableName: string,
    page?: number,
    pageSize?: number,
    filters?: string,
  ) => Promise<{ rows: Record<string, unknown>[]; total: number }>;
  executeQuery: (sql: string) => Promise<{ rows: Record<string, unknown>[]; timeMs: number }>;
  getRelations: (
    tableName: string,
    row: Record<string, unknown>,
  ) => Promise<Record<string, unknown>[]>;
};

export type VyoraPaymentAccountAPI = {
  create: (
    data: import('@vyora/types').CreatePaymentAccountInput,
  ) => Promise<import('@vyora/types').PaymentAccountDto>;
  update: (
    id: string,
    data: import('@vyora/types').UpdatePaymentAccountInput,
  ) => Promise<import('@vyora/types').PaymentAccountDto>;
  delete: (id: string) => Promise<{ success: boolean }>;
  getById: (id: string) => Promise<import('@vyora/types').PaymentAccountDto | null>;
  search: (
    filter: import('@vyora/types').PaymentAccountFilterDto,
  ) => Promise<import('@vyora/types').PaymentAccountDto[]>;
  openingBalance: {
    create: (
      input: import('@vyora/types').CreateOpeningBalanceInput,
    ) => Promise<import('@vyora/types').ApiResponse<{ voucherId: string }>>;
    update: (
      input: import('@vyora/types').CreateOpeningBalanceInput,
    ) => Promise<import('@vyora/types').ApiResponse<{ voucherId: string }>>;
    reverse: (
      paymentAccountId: string,
    ) => Promise<import('@vyora/types').ApiResponse<{ reversalVoucherId: string }>>;
    get: (
      paymentAccountId: string,
    ) => Promise<
      import('@vyora/types').ApiResponse<import('@vyora/types').VoucherDetailDto | null>
    >;
  };
  saveWithOpeningBalance: (payload: {
    isEditing: boolean;
    accountId?: string;
    accountData:
      | import('@vyora/types').CreatePaymentAccountInput
      | import('@vyora/types').UpdatePaymentAccountInput;
    openingBalance?: {
      amount: number;
      type: 'Dr' | 'Cr';
      date: Date;
      notes?: string;
    };
  }) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').PaymentAccountDto>>;
};

export type VyoraFundTransferAPI = {
  create: (
    input: import('@vyora/types').CreateFundTransferInput,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').FundTransferDto>>;
  update: (
    id: string,
    input: import('@vyora/types').UpdateFundTransferInput,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').FundTransferDto>>;
  reverse: (
    id: string,
  ) => Promise<import('@vyora/types').ApiResponse<{ reversalVoucherId: string }>>;
  getAll: (
    filter: import('@vyora/types').FundTransferQueryFilter,
  ) => Promise<import('@vyora/types').ApiResponse<import('@vyora/types').FundTransferListDto>>;
};

export type VyoraDeveloperAPI = {
  isEnabled: () => Promise<boolean>;
};

declare global {
  interface Window {
    vyora: {
      export: VyoraExportAPI;
      system: VyoraSystemAPI;
      db: VyoraDatabaseAPI;
      settings: VyoraSettingsAPI;
      bootstrap: VyoraBootstrapAPI;
      auth: VyoraAuthAPI;
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
      dev: VyoraDevAPI;
      developer: VyoraDeveloperAPI;
      developerDatabase: VyoraDeveloperDatabaseAPI;
      paymentAccounts: VyoraPaymentAccountAPI;
      fundTransfers: VyoraFundTransferAPI;
      payrollSnapshot: VyoraPayrollSnapshotAPI;
      payrollCalculation: VyoraPayrollCalculationAPI;
    };
  }
}

export type VyoraPayrollSnapshotAPI = {
  createForPeriod: (
    command: import('@vyora/types').CreatePayrollSnapshotCommandDto,
  ) => Promise<import('@vyora/types').ApiResponse<void>>;
};

export type VyoraPayrollCalculationAPI = {
  calculatePayrollResult: (id: string) => Promise<import('@vyora/types').ApiResponse<void>>;
  calculatePeriod: (id: string) => Promise<import('@vyora/types').ApiResponse<void>>;
};
