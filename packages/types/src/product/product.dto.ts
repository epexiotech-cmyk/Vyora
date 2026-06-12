import { z } from 'zod';

export type ItemType = 'INVENTORY_ITEM' | 'NON_INVENTORY_ITEM' | 'SERVICE';

export interface ProductDto {
  id: string;
  name: string;
  sku?: string | null;
  itemType: ItemType;
  description?: string | null;
  hsnCode?: string | null;
  unitId?: string | null;
  taxId?: string | null;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  reorderLevel: number;
  isActive: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateProductInput {
  companyId: string;
  name: string;
  itemType: ItemType;
  description?: string | null;
  hsnCode?: string | null;
  unitId: string;
  taxId: string;
  salePrice?: number;
  purchasePrice?: number;
  stock?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  id: string;
  name?: string;
  itemType?: ItemType;
  description?: string | null;
  hsnCode?: string | null;
  unitId?: string | null;
  taxId?: string | null;
  salePrice?: number;
  purchasePrice?: number;
  stock?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface SearchProductsOptions {
  query?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductListDto {
  data: ProductDto[];
  total: number;
}

export const createProductSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  name: z.string().min(1, 'Name is required'),
  itemType: z.enum(['INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'SERVICE']),
  description: z.string().nullable().optional(),
  hsnCode: z.string().nullable().optional(),
  unitId: z.string().min(1, 'Unit ID is required'),
  taxId: z.string().min(1, 'Tax ID is required'),
  salePrice: z.number().min(0).optional(),
  purchasePrice: z.number().min(0).optional(),
  stock: z.number().optional(),
  reorderLevel: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  itemType: z.enum(['INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'SERVICE']).optional(),
  description: z.string().nullable().optional(),
  hsnCode: z.string().nullable().optional(),
  unitId: z.string().min(1, 'Unit ID is required').optional(),
  taxId: z.string().min(1, 'Tax ID is required').optional(),
  salePrice: z.number().min(0).optional(),
  purchasePrice: z.number().min(0).optional(),
  stock: z.number().optional(),
  reorderLevel: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const searchProductsSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});
