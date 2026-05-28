export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Re-export natively inferred models directly from the database schema
export type { Customer, InsertCustomer, Product, InsertProduct } from '@vyora/database';
