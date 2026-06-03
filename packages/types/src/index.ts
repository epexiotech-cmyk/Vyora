export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Re-export natively inferred models directly from the database schema
export type {
  Customer,
  InsertCustomer,
  Product,
  InsertProduct,
  Company,
  InsertCompany,
  AppSetting,
  InsertAppSetting,
  CompanySetting,
  InsertCompanySetting,
} from '@vyora/database';
