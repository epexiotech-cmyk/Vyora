// Phase 4.4B Foundation DTO

export interface ProductDto {
  id: string;
  name: string;
  sku?: string | null;
  hsnCode?: string | null;
  unitId?: string | null;
  taxId?: string | null;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  createdAt: Date;
}

export interface CreateProductInput {
  companyId: string;
  name: string;
  sku?: string | null;
  hsnCode?: string | null;
  unitId?: string | null;
  taxId?: string | null;
  salePrice?: number;
  purchasePrice?: number;
  stock?: number;
}

export interface UpdateProductInput {
  id: string;
  name?: string;
  sku?: string | null;
  hsnCode?: string | null;
  unitId?: string | null;
  taxId?: string | null;
  salePrice?: number;
  purchasePrice?: number;
  stock?: number;
}

export interface ProductSearchResultDto {
  id: string;
  name: string;
  sku?: string | null;
  salePrice: number;
  stock: number;
}
