export interface StockSummaryRowDto {
  productId: string;
  productName: string;
  sku: string;
  unitId: string;
  unitName: string;
  unitShortName: string;
  closingQuantity: number;
  wacPaise: number;
  totalValuePaise: number;
}

export interface StockSummaryDto {
  companyId: string;
  financialYearId: string;
  asOfDate?: Date;
  rows: StockSummaryRowDto[];
  totalValuePaise: number;
}

export interface StockLedgerRowDto {
  movementId: string;
  movementDate: Date;
  voucherType: string;
  voucherNo: string;
  referenceType: string;
  referenceId: string;
  movementType: string;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
  ratePaise?: number;
  remarks?: string;
}

export interface StockLedgerDto {
  productId: string;
  productName: string;
  unitShortName: string;
  fromDate?: Date;
  toDate?: Date;
  openingQuantity: number;
  rows: StockLedgerRowDto[];
  closingQuantity: number;
}

export interface StockMovementRegisterRowDto extends Omit<StockLedgerRowDto, 'balanceQty'> {
  productId: string;
  productName: string;
  unitShortName: string;
}

export interface StockMovementRegisterDto {
  companyId: string;
  financialYearId: string;
  fromDate?: Date;
  toDate?: Date;
  rows: StockMovementRegisterRowDto[];
}

export interface StockAgeingRowDto {
  productId: string;
  sku: string;
  productName: string;
  unitShortName: string;
  totalQuantity: number;
  age0To30Qty: number;
  age31To60Qty: number;
  age61To90Qty: number;
  age91To180Qty: number;
  age181To365Qty: number;
  ageAbove365Qty: number;
  wacPaise?: number;
  totalValuePaise?: number;
}

export interface StockAgeingDto {
  companyId: string;
  financialYearId: string;
  asOfDate?: Date;
  rows: StockAgeingRowDto[];
  totalQuantity: number;
  totalValuePaise: number;
}
