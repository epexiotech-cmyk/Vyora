// Phase 4.4B Foundation DTO

export interface CreateStockMovementInput {
  companyId: string;
  financialYearId: string;
  productId: string;
  movementType: string;
  referenceType: string;
  referenceId: string;
  quantityIn: number;
  quantityOut: number;
  rate: number;
  movementDate: Date;
  remarks?: string | null;
}

export interface StockMovementDto {
  id: string;
  companyId: string;
  financialYearId: string;
  productId: string;
  movementType: string;
  referenceType: string;
  referenceId: string;
  quantityIn: number;
  quantityOut: number;
  rate: number;
  movementDate: Date;
  remarks?: string | null;
  createdAt: Date;
}

export type InventoryLedgerEntryDto = StockMovementDto;

export interface InventoryStockDto {
  productId: string;
  stock: number;
}

export interface InventoryStockQueryInput {
  productId: string;
}

export interface InventoryLedgerQueryInput {
  productId: string;
}

export interface InventorySummaryDto {
  totalItems: number;
  lowStockItems: number;
}

export interface ProductStockStatusDto {
  wac: number;
  totalQty: number;
  totalValue: number;
}

export interface InventoryBalanceDto {
  id: string;
  companyId: string;
  financialYearId: string;
  productId: string;
  currentQty: number;
  currentWacPaise: number;
  currentValuePaise: number;
  syncVersion: number;
  updatedAt: Date;
}

export interface GlobalInventoryRowDto {
  productId: string;
  productName: string;
  productSku?: string | null;
  unitId: string;
  unitShortName: string;
  currentQty: number;
  currentWacPaise: number;
  currentValuePaise: number;
}
