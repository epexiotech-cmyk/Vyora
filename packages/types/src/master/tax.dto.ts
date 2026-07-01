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

export type TaxComponentTypeEnum = 'CGST' | 'SGST' | 'IGST' | 'CESS';

export interface TaxComponentDto {
  id: string;
  taxGroupId: string;
  componentType: TaxComponentTypeEnum;
  rate: number;
  sequence: number;
  calculationPriority: number;
  isActive: boolean;
}

export interface TaxGroupDto {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  components?: TaxComponentDto[];
}
