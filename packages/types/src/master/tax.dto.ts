export type TaxType = 'GST' | 'CESS' | 'EXEMPT' | 'NIL';

export interface TaxDto {
  id: string;
  name: string;
  rate: number;
  taxType: TaxType;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateTaxInput {
  companyId: string;
  name: string;
  rate: number;
  taxType?: TaxType;
  isActive?: boolean;
}

export interface UpdateTaxInput {
  id: string;
  name?: string;
  rate?: number;
  taxType?: TaxType;
  isActive?: boolean;
}
