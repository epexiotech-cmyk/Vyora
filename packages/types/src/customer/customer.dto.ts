// Phase 5.2.2 Foundation DTO

export interface CustomerProfileDto {
  id: string;
  customerCode: string;
  name: string;
  contactPerson?: string | null;
  mobile?: string | null;
  alternateMobile?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  pan?: string | null;
  registrationType?:
    | 'Regular'
    | 'Composition'
    | 'Unregistered'
    | 'Consumer'
    | 'Overseas'
    | 'SEZ'
    | null;
  openingBalance: number;
  openingType?: 'Dr' | 'Cr' | null;
  creditLimit: number;
  creditDays: number;
  notes?: string | null;
  isActive: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateCustomerInput = Omit<
  CustomerProfileDto,
  'id' | 'customerCode' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface SearchCustomersOptions {
  query?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CustomerListDto {
  data: CustomerProfileDto[];
  total: number;
}
